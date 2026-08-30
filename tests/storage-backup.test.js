'use strict';

const { installObsidianStub, setupHarness } = require('./lock/harness/index.ts');
installObsidianStub();

const test = require('node:test');
const assert = require('node:assert/strict');
const i18n = require('../src/i18n.ts');
const attachStorageBackupMethods = require('../src/plugin/methods/storage-backup');
const attachPersistenceMethods = require('../src/plugin/methods/persistence');

i18n.resolveLocale('en');

function createPlugin(vaultFiles = {}) {
    const files = new Map(Object.entries(vaultFiles));

    const plugin = {
        app: {
            vault: {
                adapter: {
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
                },
            },
        },
        manifest: { dir: '.obsidian/plugins/workspace-plus-plus' },
        data: {
            activeSessionId: 's1',
            sessions: { s1: { id: 's1', name: 'S1', layout: {} } },
            sessionOrder: ['s1'],
            groups: {},
            groupOrder: [],
            sessionGroups: {},
        },
        async saveData() {},
        normalizeSessionData(d) {
            return d;
        },
        syncSessionOrder() {},
        updateStatusBar() {},
        syncSessionCommands() {},
        getActiveSession() {
            return this.data.sessions[this.data.activeSessionId];
        },
        applyWorkspaceLayout() {
            return Promise.resolve();
        },
    };

    function DummyClass() {}
    attachPersistenceMethods(DummyClass);
    attachStorageBackupMethods(DummyClass);
    Object.assign(plugin, DummyClass.prototype);

    return { plugin, files };
}

test('storage backup: initRotationBackupTimestamp initializes last backup timestamp', async () => {
    const { plugin, files } = createPlugin();
    const p1 = plugin.getRotationBackupPath(1);
    files.set(p1, JSON.stringify({ _wppSavedAt: 99999 }));

    await plugin.initRotationBackupTimestamp();
    assert.equal(plugin._lastRotationBackupAt, 99999);

    const { plugin: emptyPlugin } = createPlugin();
    await emptyPlugin.initRotationBackupTimestamp();
    assert.equal(emptyPlugin._lastRotationBackupAt, 0);
});

test('storage backup: rotateBackupIfNeeded respects 1-hour interval and rotates generations', async () => {
    const { plugin, files } = createPlugin();
    const p1 = plugin.getRotationBackupPath(1);
    const p2 = plugin.getRotationBackupPath(2);
    const p3 = plugin.getRotationBackupPath(3);
    files.set(p1, JSON.stringify({ gen: 1 }));
    files.set(p2, JSON.stringify({ gen: 2 }));

    plugin._lastRotationBackupAt = Date.now(); // Just backed up
    await plugin.rotateBackupIfNeeded({ sessions: { s1: {} } });
    assert.equal(JSON.parse(files.get(p1)).gen, 1);

    // After 1 hour
    plugin._lastRotationBackupAt = Date.now() - 4000000;
    await plugin.rotateBackupIfNeeded({ sessions: { s1: { id: 's1' } } });

    // Gen 2 shifted to 3, Gen 1 shifted to 2, new data written to 1
    assert.equal(JSON.parse(files.get(p3)).gen, 2);
    assert.equal(JSON.parse(files.get(p2)).gen, 1);
    assert.ok(files.has(p1));
});

test('storage backup: copyFileIfExists copies file if present and skips if absent', async () => {
    const { plugin, files } = createPlugin({
        'src.json': 'content',
    });

    await plugin.copyFileIfExists('src.json', 'dst.json');
    assert.equal(files.get('dst.json'), 'content');

    await plugin.copyFileIfExists('missing.json', 'dst2.json');
    assert.equal(files.has('dst2.json'), false);
});

test('storage backup: getRotationBackupInfo returns metadata for all existing generations', async () => {
    const { plugin, files } = createPlugin();
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

    const info = await plugin.getRotationBackupInfo();
    assert.equal(info.length, 2);
    assert.equal(info[0].generation, 1);
    assert.equal(info[0].sessionCount, 2);
    assert.equal(info[0].savedAt, 1000);
    assert.equal(info[0].backupPlatform, 'macOS');
    assert.equal(info[1].generation, 2);
    assert.equal(info[1].sessionCount, 1);
});

test('storage backup: restoreFromRotationBackup restores valid backup and handles corrupted backup', async () => {
    const { plugin, files } = createPlugin();
    const p1 = plugin.getRotationBackupPath(1);
    files.set(p1, JSON.stringify({
        activeSessionId: 's1',
        sessions: { s1: { id: 's1', name: 'Restored', layout: { root: {} } } },
        sessionOrder: ['s1'],
    }));

    const ok = await plugin.restoreFromRotationBackup(1);
    assert.equal(ok, true);
    assert.equal(plugin.data.sessions.s1.name, 'Restored');

    const { plugin: plugin2, files: files2 } = createPlugin();
    const p2 = plugin2.getRotationBackupPath(2);
    files2.set(p2, '{ invalid json');

    const failed = await plugin2.restoreFromRotationBackup(2);
    assert.equal(failed, false);
});

test('storage backup: getBackupPlatformLabel checks platform flags', () => {
    const harness = setupHarness();
    try {
        const { plugin } = createPlugin();

        harness.dom.setPlatform('MacIntel');
        assert.equal(plugin.getBackupPlatformLabel(), 'macOS');

        harness.dom.setPlatform('Win32');
        assert.equal(plugin.getBackupPlatformLabel(), 'Windows');

        harness.dom.setPlatform('Linux x86_64');
        assert.equal(plugin.getBackupPlatformLabel(), 'Linux');
    } finally {
        harness.restore();
    }
});
