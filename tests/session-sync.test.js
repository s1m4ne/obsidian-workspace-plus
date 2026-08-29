'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadPluginMethods } = require('./helpers');


const methods = loadPluginMethods(['persistence', 'session-sync']);
const attachPersistenceMethods = methods.persistence;
const attachSessionSyncMethods = methods['session-sync'];

function createPlugin(initialData) {
    function PluginMock() {}
    attachPersistenceMethods(PluginMock);
    attachSessionSyncMethods(PluginMock);

    const plugin = new PluginMock();
    plugin.data = Object.assign({
        activeSessionId: 'local',
        sessionOrder: ['local'],
        sessions: {
            local: { id: 'local', name: 'Local', modified: 100, layout: { local: true } },
        },
        groups: {
            g1: { id: 'g1', name: 'Local group' },
        },
        groupOrder: ['__all__', 'g1'],
        sessionGroups: {
            local: ['g1'],
        },
        activeGroupId: 'g1',
    }, initialData || {});
    plugin.statusBarUpdates = 0;
    plugin.commandSyncs = 0;
    plugin.overlayRefreshes = 0;
    plugin.app = {
        vault: {
            adapter: {
                stat: function () {
                    return Promise.resolve({ mtime: 1000 });
                },
            },
        },
    };
    plugin.updateStatusBar = function () {
        plugin.statusBarUpdates += 1;
    };
    plugin.syncSessionCommands = function () {
        plugin.commandSyncs += 1;
    };
    plugin._refreshOverlaySessions = function () {
        plugin.overlayRefreshes += 1;
    };
    plugin.syncSessionOrder = function () {
        const sessions = plugin.data.sessions || {};
        plugin.data.sessionOrder = (plugin.data.sessionOrder || []).filter((id) => !!sessions[id]);
        for (const id of Object.keys(sessions)) {
            if (!plugin.data.sessionOrder.includes(id)) plugin.data.sessionOrder.push(id);
        }
    };
    plugin.normalizeGroupFeatureState = function () {};
    return plugin;
}

test('session sync applies external data without changing the local active session', function () {
    const plugin = createPlugin();
    const external = {
        activeSessionId: 'remote',
        sessionOrder: ['remote', 'local'],
        sessions: {
            remote: { id: 'remote', name: 'Remote', modified: 200, layout: { remote: true } },
            local: { id: 'local', name: 'Local from disk', modified: 150, layout: { disk: true } },
        },
        groups: {},
        groupOrder: [],
        sessionGroups: {},
        activeGroupId: null,
    };

    const applied = plugin.applySessionDataFromStorage(external);

    assert.equal(applied, true);
    assert.equal(plugin.data.activeSessionId, 'local');
    assert.equal(plugin.data.sessions.local.name, 'Local from disk');
    assert.equal(plugin.data.sessions.remote.name, 'Remote');
    assert.deepEqual(plugin.data.sessionOrder, ['remote', 'local']);
    assert.equal(plugin.statusBarUpdates, 1);
    assert.equal(plugin.commandSyncs, 1);
    assert.equal(plugin.overlayRefreshes, 1);
});

test('session sync falls back when the local active session was deleted externally', function () {
    const plugin = createPlugin();
    const external = {
        activeSessionId: 'remote',
        sessionOrder: ['remote'],
        sessions: {
            remote: { id: 'remote', name: 'Remote', modified: 200, layout: { remote: true } },
        },
    };

    plugin.applySessionDataFromStorage(external);

    assert.equal(plugin.data.activeSessionId, 'remote');
    assert.deepEqual(plugin.data.sessionOrder, ['remote']);
});

test('session sync save merge keeps both local and external additions', function () {
    const plugin = createPlugin({
        activeSessionId: 'base',
        sessionOrder: ['base'],
        sessions: {
            base: { id: 'base', name: 'Base', modified: 100, layout: { base: true } },
        },
        groups: {},
        groupOrder: [],
        sessionGroups: {},
        activeGroupId: null,
    });
    plugin.recordSessionStorageState(1, 1000, plugin.data);

    plugin.data.sessions.localNew = {
        id: 'localNew',
        name: 'Local new',
        modified: 300,
        layout: { local: true },
    };
    plugin.data.sessionOrder.push('localNew');

    const external = {
        activeSessionId: 'base',
        sessionOrder: ['base', 'remoteNew'],
        sessions: {
            base: { id: 'base', name: 'Base from disk', modified: 150, layout: { disk: true } },
            remoteNew: { id: 'remoteNew', name: 'Remote new', modified: 250, layout: { remote: true } },
        },
    };

    const merged = plugin.mergeExternalSessionDataForWrite(external);

    assert.equal(merged.sessions.base.name, 'Base from disk');
    assert.equal(merged.sessions.remoteNew.name, 'Remote new');
    assert.equal(merged.sessions.localNew.name, 'Local new');
    assert.deepEqual(merged.sessionOrder, ['base', 'remoteNew', 'localNew']);
});

test('session sync save merge preserves local session deletion when external copy is unchanged', function () {
    const plugin = createPlugin({
        activeSessionId: 'base',
        sessionOrder: ['base', 'deleted'],
        sessions: {
            base: { id: 'base', name: 'Base', modified: 100, layout: { base: true } },
            deleted: { id: 'deleted', name: 'Delete me', modified: 100, layout: { old: true } },
        },
    });
    plugin.recordSessionStorageState(1, 1000, plugin.data);

    delete plugin.data.sessions.deleted;
    plugin.data.sessionOrder = ['base'];

    const external = {
        activeSessionId: 'base',
        sessionOrder: ['base', 'deleted', 'remoteNew'],
        sessions: {
            base: { id: 'base', name: 'Base', modified: 100, layout: { base: true } },
            deleted: { id: 'deleted', name: 'Delete me', modified: 100, layout: { old: true } },
            remoteNew: { id: 'remoteNew', name: 'Remote new', modified: 250, layout: { remote: true } },
        },
    };

    const merged = plugin.mergeExternalSessionDataForWrite(external);

    assert.equal(merged.sessions.deleted, undefined);
    assert.equal(merged.sessions.remoteNew.name, 'Remote new');
    assert.deepEqual(merged.sessionOrder, ['base', 'remoteNew']);
});

test('session sync save reload merge uses the previous baseline while reading external data', async function () {
    const plugin = createPlugin({
        activeSessionId: 'base',
        sessionOrder: ['base'],
        sessions: {
            base: { id: 'base', name: 'Base', modified: 100, layout: { base: true } },
        },
        groups: {},
        groupOrder: [],
        sessionGroups: {},
        activeGroupId: null,
    });
    plugin.recordSessionStorageState(1, 1000, plugin.data);

    plugin.data.sessions.localNew = {
        id: 'localNew',
        name: 'Local new',
        modified: 300,
        layout: { local: true },
    };
    plugin.data.sessionOrder.push('localNew');

    const external = {
        _wppSavedAt: 2,
        activeSessionId: 'base',
        sessionOrder: ['base', 'remoteNew'],
        sessions: {
            base: { id: 'base', name: 'Base from disk', modified: 150, layout: { disk: true } },
            remoteNew: { id: 'remoteNew', name: 'Remote new', modified: 250, layout: { remote: true } },
        },
    };

    plugin.readJsonIfExists = function () {
        return Promise.resolve({ exists: true, data: external, error: null });
    };
    plugin.getFileMtime = function () {
        return Promise.resolve(2000);
    };

    const reloaded = await plugin.reloadExternalSessionStorageIfChanged({ mergeLocal: true });

    assert.equal(reloaded, true);
    assert.equal(plugin.data.sessions.base.name, 'Base from disk');
    assert.equal(plugin.data.sessions.remoteNew.name, 'Remote new');
    assert.equal(plugin.data.sessions.localNew.name, 'Local new');
    assert.deepEqual(plugin.data.sessionOrder, ['base', 'remoteNew', 'localNew']);
});

test('rotation backup data records the current platform label', function () {
    const plugin = createPlugin();
    const sessionData = plugin.extractSessionData(plugin.data);
    sessionData._wppSavedAt = 123;

    const backupData = plugin.prepareRotationBackupData(sessionData);

    assert.equal(plugin.getBackupPlatformLabel(), 'macOS');
    assert.equal(backupData._wppBackupPlatform, 'macOS');
    assert.equal(sessionData._wppBackupPlatform, undefined);
});

test('rotation backup info includes saved platform labels', async function () {
    const plugin = createPlugin();
    plugin.getRotationBackupPath = function (generation) {
        return 'sessions.' + generation + '.json';
    };
    plugin.readJsonIfExists = function (path) {
        if (path === 'sessions.1.json') {
            return Promise.resolve({
                exists: true,
                data: {
                    _wppSavedAt: 123,
                    _wppBackupPlatform: 'Windows',
                    sessions: {
                        a: { id: 'a', name: 'A' },
                        b: { id: 'b', name: 'B' },
                    },
                },
                error: null,
            });
        }
        return Promise.resolve({ exists: false, data: null, error: null });
    };

    const backups = await plugin.getRotationBackupInfo();

    assert.deepEqual(backups, [{
        generation: 1,
        savedAt: 123,
        sessionCount: 2,
        backupPlatform: 'Windows',
    }]);
});

test('session storage defaults new installs to the Obsidian plugin folder', async function () {
    const plugin = createPlugin();
    plugin.app.vault.adapter.exists = function () {
        return Promise.resolve(false);
    };

    const location = await plugin.resolveSessionStorageLocation({});

    assert.equal(location, 'plugin-folder');
    assert.equal(plugin.getSessionStorageLocation(), 'plugin-folder');
    // Sessions ride along in data.json, the only plugin file Obsidian Sync carries.
    assert.equal(plugin.getSessionsPath(), '.obsidian/plugins/workspace-plus-plus/data.json');
});

test('session storage keeps existing vault-local files when no setting is explicit', async function () {
    const plugin = createPlugin();
    plugin.app.vault.adapter.exists = function (path) {
        return Promise.resolve(path === '.workspace-plus-plus/sessions.json');
    };

    const location = await plugin.resolveSessionStorageLocation({});

    assert.equal(location, 'vault-folder');
    assert.equal(plugin.getSessionStorageLocation(), 'vault-folder');
    assert.equal(plugin.getSessionsPath(), '.workspace-plus-plus/sessions.json');
});

test('session storage explicit setting wins over detected legacy files', async function () {
    const plugin = createPlugin();
    plugin.app.vault.adapter.exists = function (path) {
        return Promise.resolve(path === '.workspace-plus-plus/sessions.json');
    };

    const location = await plugin.resolveSessionStorageLocation({
        sessionStorageLocation: 'plugin-folder',
    });

    assert.equal(location, 'plugin-folder');
    assert.equal(plugin.getSessionsPath(), '.obsidian/plugins/workspace-plus-plus/data.json');
});

test('session storage move writes sessions to the target without deleting the old file', async function () {
    const plugin = createPlugin({
        sessionStorageLocation: 'vault-folder',
    });
    const writes = [];
    const removed = [];
    plugin.setRuntimeSessionStorageLocation('vault-folder');
    plugin.persistData = function () {
        plugin.persistCalls = (plugin.persistCalls || 0) + 1;
        return Promise.resolve(true);
    };
    plugin.app.vault.adapter.exists = function (path) {
        return Promise.resolve(path === '.obsidian/plugins/workspace-plus-plus');
    };
    plugin.app.vault.adapter.mkdir = function () {
        return Promise.resolve();
    };
    plugin.app.vault.adapter.write = function (path, raw) {
        writes.push({ path: path, data: JSON.parse(raw) });
        return Promise.resolve();
    };
    plugin.app.vault.adapter.remove = function (path) {
        removed.push(path);
        return Promise.resolve();
    };
    plugin.app.vault.adapter.stat = function () {
        return Promise.resolve({ mtime: 2000 });
    };
    plugin.saveData = function (data) {
        plugin.savedData = data;
        return Promise.resolve();
    };
    plugin.loadData = function () {
        return Promise.resolve(plugin.savedData);
    };

    const moved = await plugin.setSessionStorageLocation('plugin-folder', { silent: true });

    assert.equal(moved, true);
    assert.equal(plugin.getSessionStorageLocation(), 'plugin-folder');
    assert.equal(plugin.persistCalls, 1);
    // data.json goes out through saveData(), so only the adapter-level writes show
    // up here; the merged settings+sessions payload is asserted via savedData.
    assert.deepEqual(writes.map((w) => w.path), [
        '.obsidian/plugins/workspace-plus-plus/history.json',
        '.obsidian/plugins/workspace-plus-plus/sessions.backup.json',
        '.obsidian/plugins/workspace-plus-plus/data.backup.json',
    ]);
    assert.equal(plugin.savedData.sessions.local.name, 'Local');
    assert.deepEqual(removed, []);
});
