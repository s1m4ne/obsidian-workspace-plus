'use strict';

const { installObsidianStub, setupHarness } = require('./lock/harness/index.ts');
installObsidianStub();

const test = require('node:test');
const assert = require('node:assert/strict');
const i18n = require('../src/i18n.ts');
const backup = require('../src/storage/storage-backup.ts');
const { JsonFileStore } = require('../src/storage/json-file-store.ts');
const { SessionStorage } = require('../src/storage/session-storage.ts');

i18n.resolveLocale('en');

// The backup functions take a host, and the plugin used to be that host by way
// of the adapter's prototype methods. Built here from the classes that own the
// pieces instead: JsonFileStore for the file access, SessionStorage for the
// paths. Only the callbacks the functions genuinely delegate to the plugin -
// the redraw and the persist - stay as counting stubs.
function createHost(vaultFiles = {}) {
    const files = new Map(Object.entries(vaultFiles));

    const adapter = {
        async exists(path) {
            return files.has(path);
        },
        async read(path) {
            const content = files.get(path);
            if (content === undefined) throw new Error(`Not found: ${path}`);
            return content;
        },
        async write(path, content) {
            files.set(path, content);
        },
        async stat(path) {
            return files.has(path) ? { mtime: 12345 } : null;
        },
        async mkdir() {},
        async remove(path) {
            files.delete(path);
        },
        async rename(from, to) {
            const c = files.get(from);
            if (c !== undefined) {
                files.set(to, c);
                files.delete(from);
            }
        },
    };

    const store = new JsonFileStore(() => adapter);
    const sessionStorage = new SessionStorage({
        store,
        manifestDir: '.obsidian/plugins/workspace-plus-plus',
        configDir: '.obsidian',
    });

    const host = {
        app: { vault: { adapter } },
        data: {
            activeSessionId: 's1',
            sessions: { s1: { id: 's1', name: 'S1', layout: {} } },
            sessionOrder: ['s1'],
            groups: {},
            groupOrder: [],
            sessionGroups: {},
        },
        _lastRotationBackupAt: 0,
        normalizeSessionData(d) {
            return d;
        },
        calls: [],
        syncSessionOrder() { this.calls.push('syncSessionOrder'); },
        updateStatusBar() { this.calls.push('updateStatusBar'); },
        syncSessionCommands() { this.calls.push('syncSessionCommands'); },
        persistData() { this.calls.push('persistData'); return Promise.resolve(true); },
        getActiveSession() {
            return this.data.sessions[this.data.activeSessionId];
        },
        applyWorkspaceLayout(layout) {
            this.calls.push(['applyWorkspaceLayout', layout]);
            return Promise.resolve();
        },
        readJsonIfExists(path) { return store.readJsonIfExists(path); },
        getJsonStore() { return store; },
        getBackupsDirPath() { return sessionStorage.getBackupsDirPath(); },
        getRotationBackupPath(generation) { return sessionStorage.getRotationBackupPath(generation); },
        // The pool is a directory rather than three known names.
        generations: 5,
        getBackupGenerations() { return this.generations; },
        removeIfExists(path) { files.delete(path); return Promise.resolve(); },
        listDir(dir) {
            const prefix = `${dir}/`;
            const names = [...files.keys()].filter((path) => path.startsWith(prefix));
            return Promise.resolve({ files: names, folders: [] });
        },
        statSize(path) {
            const content = files.get(path);
            return Promise.resolve(content === undefined ? null : content.length);
        },
        ensureDir(path) { return store.ensureDir(path); },
        writeJson(path, data) { return store.writeJson(path, data); },
        extractSessionData(d) { return { ...d }; },
    };

    return { plugin: host, files };
}

const HOUR = 3600000;

/** Put a backup in the pool directly, the way a past run would have left it. */
function seed(plugin, files, savedAt, extra = {}) {
    const path = `${plugin.getBackupsDirPath()}/sessions.${savedAt}.json`;
    files.set(path, JSON.stringify({ _wppSavedAt: savedAt, sessions: { s1: {} }, ...extra }));
    return path;
}

test('storage backup: the hourly gate is seeded from the newest backup on disk', async () => {
    const { plugin, files } = createHost();
    seed(plugin, files, 99999);

    await backup.initRotationBackupTimestampForHost(plugin);
    assert.equal(plugin._lastRotationBackupAt, 99999);

    // Without this a reload would take a backup immediately, however recently
    // the last one was written.
    const { plugin: emptyPlugin } = createHost();
    await backup.initRotationBackupTimestampForHost(emptyPlugin);
    assert.equal(emptyPlugin._lastRotationBackupAt, 0);
});

test('storage backup: the automatic path takes at most one backup an hour', async () => {
    const { plugin, files } = createHost();
    const now = 100 * HOUR;

    plugin._lastRotationBackupAt = now - 1000;
    await backup.rotateBackupIfNeededForHost(plugin, { sessions: { s1: {} } }, now);
    assert.equal([...files.keys()].filter((p) => p.includes('/backups/')).length, 0);

    plugin._lastRotationBackupAt = now - 2 * HOUR;
    await backup.rotateBackupIfNeededForHost(plugin, { sessions: { s1: { id: 's1' } } }, now);
    const written = [...files.keys()].filter((p) => p.includes('/backups/'));
    assert.equal(written.length, 1);
    assert.ok(written[0].endsWith(`sessions.${now}.json`), written[0]);
});

test('storage backup: a save that changed nothing writes no backup at all', async () => {
    const { plugin, files } = createHost();
    const now = 100 * HOUR;
    seed(plugin, files, now - 2 * HOUR);

    plugin._lastRotationBackupAt = now - 2 * HOUR;
    // Same sessions as the seeded backup, under a different stamp.
    await backup.rotateBackupIfNeededForHost(plugin, { sessions: { s1: {} } }, now);

    // Otherwise a vault sitting idle fills the pool with copies of one moment.
    assert.equal([...files.keys()].filter((p) => p.includes('/backups/')).length, 1);
});

test('storage backup: the pool keeps a spread and deletes what no target wants', async () => {
    const { plugin, files } = createHost();
    const { pruneRotationBackups, listRotationBackups } =
        await import('../src/storage/backup-store.ts');
    const now = 1000 * HOUR;

    // Twelve hourly backups, and room for five.
    for (let i = 1; i <= 12; i++) seed(plugin, files, now - i * HOUR, { i });
    plugin.generations = 5;

    await pruneRotationBackups(plugin, now);
    const kept = await listRotationBackups(plugin);

    // The number on the settings screen is a number of backups: five means
    // five files, not five rungs of the ladder plus whatever was protected.
    assert.equal(kept.length, 5);
    // A spread, not a cluster: the oldest survives rather than being crowded
    // out by its neighbours.
    const ages = kept.map((entry) => Math.round((now - entry.savedAt) / HOUR));
    assert.ok(Math.max(...ages) >= 11, `oldest kept is ${Math.max(...ages)}h: ${ages}`);
    assert.ok(Math.min(...ages) <= 1, `newest kept is ${Math.min(...ages)}h: ${ages}`);
});

test('storage backup: the generation count is the number of files that survive', async () => {
    const { pruneRotationBackups, listRotationBackups } =
        await import('../src/storage/backup-store.ts');
    const now = 1000 * HOUR;

    for (const generations of [3, 5, 8, 12]) {
        const { plugin, files } = createHost();
        for (let i = 1; i <= 30; i++) seed(plugin, files, now - i * HOUR, { i });
        plugin.generations = generations;
        await pruneRotationBackups(plugin, now);
        const kept = await listRotationBackups(plugin);
        // Thirty files, and exactly as many survive as the setting says.
        assert.equal(kept.length, generations, `${generations} generations kept ${kept.length}`);
    }
});

test('storage backup: a backup asked for by hand is not thinned away', async () => {
    const { plugin, files } = createHost();
    const { pruneRotationBackups, listRotationBackups } =
        await import('../src/storage/backup-store.ts');
    const now = 1000 * HOUR;

    // Hourly automatic backups, one of them newer than the manual one - so
    // being the newest is not what saves it.
    for (let i = 1; i <= 12; i++) seed(plugin, files, now - i * HOUR, { i });
    seed(plugin, files, now - HOUR / 2, { newest: true });
    // Taken by hand at an age no target on a three-rung ladder sits near.
    const manualAt = now - Math.round(1.6 * HOUR);
    seed(plugin, files, manualAt, { _wppBackupManual: true });
    plugin.generations = 3;

    await pruneRotationBackups(plugin, now);
    const kept = await listRotationBackups(plugin);

    assert.ok(kept.some((entry) => entry.savedAt === manualAt && entry.manual),
        `the manual backup went: ${kept.map((e) => Math.round((now - e.savedAt) / HOUR * 10) / 10)}`);
    // And it did not survive by being the newest.
    assert.notEqual(kept[0].savedAt, manualAt);
});

test('storage backup: the byte budget gives up the oldest, never the newest', async () => {
    const { enforceBackupBudget } = await import('../src/storage/backup-pool.ts');
    const now = 1000 * HOUR;
    const entries = [];
    for (let i = 0; i < 6; i++) {
        entries.push({ path: `p${i}`, savedAt: now - i * HOUR, manual: i === 3, size: 1000 });
    }

    const { keep, drop } = enforceBackupBudget(entries, 3500);
    assert.ok(keep.reduce((sum, e) => sum + e.size, 0) <= 3500, `kept ${keep.length}`);
    // A budget that deletes the backup taken a moment ago has failed at the
    // one thing a backup is for; nor does it take the one asked for by hand.
    assert.equal(keep[0].path, 'p0');
    assert.ok(keep.some((e) => e.path === 'p3'), 'the manual entry was given up');
    // Oldest first - p5, then p4 - and then past the protected p3 to p2,
    // because getting under the budget matters more than the order it took.
    assert.deepEqual(drop.map((e) => e.path).sort(), ['p2', 'p4', 'p5']);
});

test('storage backup: a backup too large to be worth writing is refused, not written', async () => {
    const { plugin, files } = createHost();
    const { writeRotationBackup } = await import('../src/storage/backup-store.ts');
    const { BACKUP_FILE_LIMIT_BYTES } = await import('../src/storage/backup-pool.ts');

    const huge = { _wppSavedAt: 5000, sessions: { s1: { pad: 'x'.repeat(BACKUP_FILE_LIMIT_BYTES) } } };
    const result = await writeRotationBackup(plugin, huge, { manual: true });

    assert.equal(result, 'too-large');
    // Refused before the write rather than written and then deleted.
    assert.equal([...files.keys()].filter((p) => p.includes('/backups/')).length, 0);
});

test('storage backup: the three fixed-slot files move into the pool once', async () => {
    const { plugin, files } = createHost();
    const { listRotationBackups } = await import('../src/storage/backup-store.ts');

    files.set(plugin.getRotationBackupPath(1), JSON.stringify({ _wppSavedAt: 3000, sessions: {} }));
    files.set(plugin.getRotationBackupPath(2), JSON.stringify({ _wppSavedAt: 2000, sessions: {} }));
    // No stamp: there is no place for it on a ladder of ages, so it stays put
    // rather than being given an invented one.
    files.set(plugin.getRotationBackupPath(3), JSON.stringify({ sessions: {} }));

    const listed = await listRotationBackups(plugin);
    assert.deepEqual(listed.map((entry) => entry.savedAt), [3000, 2000]);
    assert.equal(files.has(plugin.getRotationBackupPath(1)), false);
    assert.equal(files.has(plugin.getRotationBackupPath(2)), false);
    assert.equal(files.has(plugin.getRotationBackupPath(3)), true);
});

test('storage backup: copyFileIfExists copies file if present and skips if absent', async () => {
    const { plugin, files } = createHost({
        'src.json': 'content',
    });

    await backup.copyFileIfExists(plugin.app.vault.adapter, 'src.json', 'dst.json');
    assert.equal(files.get('dst.json'), 'content');

    await backup.copyFileIfExists(plugin.app.vault.adapter, 'missing.json', 'dst2.json');
    assert.equal(files.has('dst2.json'), false);
});

test('storage backup: getRotationBackupInfo returns metadata for all existing generations', async () => {
    const { plugin, files } = createHost();
    const p1 = plugin.getRotationBackupPath(1);
    const p2 = plugin.getRotationBackupPath(2);
    files.set(p1, JSON.stringify({
        sessions: { s1: {}, s2: {} },
        _wppSavedAt: 1000,
        _wppBackupPlatform: 'macOS',
    }));
    files.set(p2, JSON.stringify({
        sessions: { s1: {} },
        _wppSavedAt: 500,
    }));

    const info = await backup.getRotationBackupInfoForHost(plugin);
    assert.equal(info.length, 2);
    assert.equal(info[0].generation, 1);
    assert.equal(info[0].sessionCount, 2);
    assert.equal(info[0].savedAt, 1000);
    assert.equal(info[0].backupPlatform, 'macOS');
    assert.equal(info[1].generation, 2);
    assert.equal(info[1].sessionCount, 1);
});

test('storage backup: restoreFromRotationBackup restores valid backup and handles corrupted backup', async () => {
    const harness = setupHarness();
    try {
        const { plugin, files } = createHost();
        const p1 = seed(plugin, files, 5000);
        files.set(p1, JSON.stringify({
            activeSessionId: 's1',
            sessions: { s1: { id: 's1', name: 'Restored', layout: { root: {} } } },
            sessionOrder: ['s1'],
        }));

        const countBefore = harness.obsidian.notices.length;
        // A path, not a position: the pool renumbers on every prune, so a
        // number could already point at a different backup by the time the
        // confirmation is answered.
        const ok = await backup.restoreFromRotationBackup(plugin, p1);
        assert.equal(ok, true);
        assert.equal(plugin.data.sessions.s1.name, 'Restored');
        assert.equal(harness.obsidian.notices.length, countBefore + 1);

        const { plugin: plugin2, files: files2 } = createHost();
        const p2 = seed(plugin2, files2, 4000);
        files2.set(p2, '{ invalid json');

        const failed = await backup.restoreFromRotationBackup(plugin2, p2);
        assert.equal(failed, false);

        const { plugin: plugin3, files: files3 } = createHost();
        const p3 = seed(plugin3, files3, 3500);
        files3.set(p3, JSON.stringify({ notASessionData: 123 }));

        const failedShape = await backup.restoreFromRotationBackup(plugin3, p3);
        assert.equal(failedShape, false);
        assert.equal(plugin3.data.sessions.s1.name, 'S1');
    } finally {
        harness.restore();
    }
});

test('storage backup: a restored backup reaches the screen, not just the data', async () => {
    const harness = setupHarness();
    try {
        const { plugin, files } = createHost();
        const path = seed(plugin, files, 6000);
        files.set(path, JSON.stringify({
            activeSessionId: 's1',
            sessions: { s1: { id: 's1', name: 'Restored', layout: { root: 'restored' } } },
            sessionOrder: ['s1'],
        }));

        const ok = await backup.restoreFromRotationBackup(plugin, path);
        assert.equal(ok, true);

        // Data alone is not a restore. The workspace still shows what it showed
        // before, and the first session switch would write that back over the
        // restored layout - the same shape as the import bug recorded in
        // tests/storage-import-applies-layout.test.ts.
        assert.deepEqual(
            plugin.calls.filter((entry) => Array.isArray(entry) && entry[0] === 'applyWorkspaceLayout'),
            [['applyWorkspaceLayout', { root: 'restored' }]],
            'the restored layout is applied exactly once',
        );

        // And the order the sessions came back in has to be rebuilt, or the
        // switch commands point at the wrong rows.
        assert.ok(plugin.calls.includes('syncSessionOrder'), 'the order is rebuilt');
        assert.ok(plugin.calls.includes('syncSessionCommands'), 'the commands follow it');
    } finally {
        harness.restore();
    }
});

test('storage backup: getBackupPlatformLabel checks platform flags', () => {
    const harness = setupHarness();
    try {
        harness.dom.setPlatform('MacIntel');
        assert.equal(backup.getBackupPlatformLabel(), 'macOS');

        harness.dom.setPlatform('Win32');
        assert.equal(backup.getBackupPlatformLabel(), 'Windows');

        harness.dom.setPlatform('Linux x86_64');
        assert.equal(backup.getBackupPlatformLabel(), 'Linux');
    } finally {
        harness.restore();
    }
});
