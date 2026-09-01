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
    };

    return { plugin: host, files };
}

test('storage backup: initRotationBackupTimestamp initializes last backup timestamp', async () => {
    const { plugin, files } = createHost();
    const p1 = plugin.getRotationBackupPath(1);
    files.set(p1, JSON.stringify({ _wppSavedAt: 99999 }));

    await backup.initRotationBackupTimestampForHost(plugin);
    assert.equal(plugin._lastRotationBackupAt, 99999);

    const { plugin: emptyPlugin } = createHost();
    await backup.initRotationBackupTimestampForHost(emptyPlugin);
    assert.equal(emptyPlugin._lastRotationBackupAt, 0);
});

test('storage backup: rotateBackupIfNeeded respects 1-hour interval and rotates generations', async () => {
    const { plugin, files } = createHost();
    const p1 = plugin.getRotationBackupPath(1);
    const p2 = plugin.getRotationBackupPath(2);
    const p3 = plugin.getRotationBackupPath(3);
    files.set(p1, JSON.stringify({ gen: 1 }));
    files.set(p2, JSON.stringify({ gen: 2 }));

    plugin._lastRotationBackupAt = Date.now(); // Just backed up
    await backup.rotateBackupIfNeededForHost(plugin, { sessions: { s1: {} } });
    assert.equal(JSON.parse(files.get(p1)).gen, 1);

    // After 1 hour
    plugin._lastRotationBackupAt = Date.now() - 4000000;
    await backup.rotateBackupIfNeededForHost(plugin, { sessions: { s1: { id: 's1' } } });

    // Gen 2 shifted to 3, Gen 1 shifted to 2, new data written to 1
    assert.equal(JSON.parse(files.get(p3)).gen, 2);
    assert.equal(JSON.parse(files.get(p2)).gen, 1);
    assert.ok(files.has(p1));
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
        const p1 = plugin.getRotationBackupPath(1);
        files.set(p1, JSON.stringify({
            activeSessionId: 's1',
            sessions: { s1: { id: 's1', name: 'Restored', layout: { root: {} } } },
            sessionOrder: ['s1'],
        }));

        const countBefore = harness.obsidian.notices.length;
        const ok = await backup.restoreFromRotationBackup(plugin, 1);
        assert.equal(ok, true);
        assert.equal(plugin.data.sessions.s1.name, 'Restored');
        assert.equal(harness.obsidian.notices.length, countBefore + 1);

        const { plugin: plugin2, files: files2 } = createHost();
        const p2 = plugin2.getRotationBackupPath(2);
        files2.set(p2, '{ invalid json');

        const failed = await backup.restoreFromRotationBackup(plugin2, 2);
        assert.equal(failed, false);

        const { plugin: plugin3, files: files3 } = createHost();
        const p3 = plugin3.getRotationBackupPath(3);
        files3.set(p3, JSON.stringify({ notASessionData: 123 }));

        const failedShape = await backup.restoreFromRotationBackup(plugin3, 3);
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
        files.set(plugin.getRotationBackupPath(1), JSON.stringify({
            activeSessionId: 's1',
            sessions: { s1: { id: 's1', name: 'Restored', layout: { root: 'restored' } } },
            sessionOrder: ['s1'],
        }));

        const ok = await backup.restoreFromRotationBackup(plugin, 1);
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
