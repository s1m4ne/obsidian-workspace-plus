'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { installObsidianStub, setupHarness } = require('./lock/harness/index.ts');

installObsidianStub();

const i18n = require('../src/i18n.ts');
i18n.resolveLocale('en');

const { PersistenceService } = require('../src/storage/persistence-service.ts');
const sessionSync = require('../src/storage/session-sync.ts');
const storageBackup = require('../src/storage/storage-backup.ts');

function createPlugin(initialData) {
    const data = Object.assign({
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

    const counters = { statusBarUpdates: 0, commandSyncs: 0, overlayRefreshes: 0 };

    const app = {
        vault: {
            adapter: {
                stat: function () {
                    return Promise.resolve({ mtime: 1000 });
                },
            },
        },
    };

    let persistenceService;
    const host = {
        data: data,
        app: app,
        updateStatusBar: function () {
            counters.statusBarUpdates += 1;
        },
        syncSessionCommands: function () {
            counters.commandSyncs += 1;
        },
        notifySessionsChanged: function () {
            counters.overlayRefreshes += 1;
        },
        syncSessionOrder: function () {
            const sessions = host.data.sessions || {};
            host.data.sessionOrder = (host.data.sessionOrder || []).filter((id) => !!sessions[id]);
            for (const id of Object.keys(sessions)) {
                if (!host.data.sessionOrder.includes(id)) host.data.sessionOrder.push(id);
            }
        },
        normalizeGroupFeatureState: function () {},
        normalizeSessionData: (d) => persistenceService.normalizeSessionData(d),
        extractSessionData: (d) => persistenceService.extractSessionData(d),
        getSessionsPath: () => persistenceService.getSessionsPath(),
        readJsonIfExists: (path) => persistenceService.getJsonStore().readJsonIfExists(path),
        getFileMtime: (path) => persistenceService.getJsonStore().getFileMtime(path),
        getRotationBackupPath: (generation) => persistenceService.getRotationBackupPath(generation),
        loadSessionDataFromStorage: () => persistenceService.loadSessionDataFromStorage(),
        recordSessionStorageState: function (stamp, mtime, sessionData) {
            return sessionSync.recordSessionStorageState(host, stamp, mtime, sessionData);
        },
        recordSessionDataStored: function (sessionData) {
            return sessionSync.recordSessionDataStored(host, sessionData);
        },
        reloadExternalSessionStorageIfChanged: function (opts) {
            return sessionSync.reloadExternalSessionStorageIfChanged(host, opts);
        },
        // The real implementation, not a stub: onExternalSettingsChange() checks
        // `typeof host.scheduleExternalSessionStorageReload === 'function'` and,
        // since session-sync always attaches this in production, takes this
        // branch rather than falling back to the watcher directly.
        scheduleExternalSessionStorageReload: function (debounceMs) {
            sessionSync.getSyncWatcher(host).scheduleReload(debounceMs);
        },
        rotateBackupIfNeeded: () => Promise.resolve(),
        clearVersionHistoryEntries: () => false,
        resetSessionsToDefault: () => Promise.resolve(false),
        persistData: () => persistenceService.persistData(),
        persistDataImmediate: () => persistenceService.persistDataImmediate(),
        clearBackupFiles: () => persistenceService.clearBackupFiles(),
    };
    persistenceService = new PersistenceService(host);

    return {
        persistenceService: persistenceService,
        host: host,
        data: data,
        counters: counters,
        applySessionDataFromStorage: (sessionData, options) => sessionSync.applySessionDataFromStorage(host, sessionData, options),
        mergeExternalSessionDataForWrite: (externalData) => sessionSync.mergeExternalSessionDataForHost(host, externalData),
        hasLocalSessionChangesSinceStorage: () => sessionSync.hasLocalSessionChangesSinceStorage(host),
        getSyncWatcher: () => sessionSync.getSyncWatcher(host),
        registerSessionStorageListeners: () => sessionSync.getSyncWatcher(host).registerListeners(),
        scheduleStartupSessionStorageChecks: () => sessionSync.getSyncWatcher(host).scheduleStartupChecks(),
        clearSessionStorageSyncTimers: () => sessionSync.clearSessionStorageSyncTimers(host),
        onExternalSettingsChange: () => sessionSync.onExternalSettingsChange(host),
        getRotationBackupInfo: () => storageBackup.getRotationBackupInfoForHost(host),
    };
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
    assert.equal(plugin.counters.statusBarUpdates, 1);
    assert.equal(plugin.counters.commandSyncs, 1);
    assert.equal(plugin.counters.overlayRefreshes, 1);

    assert.equal(plugin.applySessionDataFromStorage(null), false);
    assert.equal(plugin.applySessionDataFromStorage(undefined), false);
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
    plugin.host.recordSessionStorageState(1, 1000, plugin.data);

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
    plugin.host.recordSessionStorageState(1, 1000, plugin.data);

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
    plugin.host.recordSessionStorageState(1, 1000, plugin.data);

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

    plugin.host.readJsonIfExists = function () {
        return Promise.resolve({ exists: true, data: external, error: null });
    };
    plugin.host.getFileMtime = function () {
        return Promise.resolve(2000);
    };

    const reloaded = await plugin.host.reloadExternalSessionStorageIfChanged({ mergeLocal: true });

    assert.equal(reloaded, true);
    assert.equal(plugin.data.sessions.base.name, 'Base from disk');
    assert.equal(plugin.data.sessions.remoteNew.name, 'Remote new');
    assert.equal(plugin.data.sessions.localNew.name, 'Local new');
    assert.deepEqual(plugin.data.sessionOrder, ['base', 'remoteNew', 'localNew']);
});

test('rotation backup data records the current platform label', function () {
    const plugin = createPlugin();
    const sessionData = plugin.persistenceService.extractSessionData(plugin.data);
    sessionData._wppSavedAt = 123;

    const backupData = storageBackup.prepareRotationBackupData(sessionData);

    assert.equal(storageBackup.getBackupPlatformLabel(), 'macOS');
    assert.equal(backupData._wppBackupPlatform, 'macOS');
    assert.equal(sessionData._wppBackupPlatform, undefined);
});

test('rotation backup info includes saved platform labels', async function () {
    const plugin = createPlugin();
    plugin.host.getRotationBackupPath = function (generation) {
        return 'sessions.' + generation + '.json';
    };
    plugin.host.readJsonIfExists = function (path) {
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
    plugin.host.app.vault.adapter.exists = function () {
        return Promise.resolve(false);
    };

    const location = await plugin.persistenceService.resolveSessionStorageLocation({});

    assert.equal(location, 'plugin-folder');
    assert.equal(plugin.persistenceService.getSessionStorageLocation(), 'plugin-folder');
    // Sessions ride along in data.json, the only plugin file Obsidian Sync carries.
    assert.equal(plugin.persistenceService.getSessionsPath(), '.obsidian/plugins/workspace-plus-plus/data.json');
});

test('session storage keeps existing vault-local files when no setting is explicit', async function () {
    const plugin = createPlugin();
    plugin.host.app.vault.adapter.exists = function (path) {
        return Promise.resolve(path === '.workspace-plus-plus/sessions.json');
    };

    const location = await plugin.persistenceService.resolveSessionStorageLocation({});

    assert.equal(location, 'vault-folder');
    assert.equal(plugin.persistenceService.getSessionStorageLocation(), 'vault-folder');
    assert.equal(plugin.persistenceService.getSessionsPath(), '.workspace-plus-plus/sessions.json');
});

test('session storage explicit setting wins over detected legacy files', async function () {
    const plugin = createPlugin();
    plugin.host.app.vault.adapter.exists = function (path) {
        return Promise.resolve(path === '.workspace-plus-plus/sessions.json');
    };

    const location = await plugin.persistenceService.resolveSessionStorageLocation({
        sessionStorageLocation: 'plugin-folder',
    });

    assert.equal(location, 'plugin-folder');
    assert.equal(plugin.persistenceService.getSessionsPath(), '.obsidian/plugins/workspace-plus-plus/data.json');
});

test('session storage move writes sessions to the target without deleting the old file', async function () {
    const plugin = createPlugin({
        sessionStorageLocation: 'vault-folder',
    });
    const writes = [];
    const removed = [];
    plugin.persistenceService.setRuntimeSessionStorageLocation('vault-folder');
    plugin.host.persistData = function () {
        plugin.persistCalls = (plugin.persistCalls || 0) + 1;
        return Promise.resolve(true);
    };
    plugin.host.app.vault.adapter.exists = function (path) {
        return Promise.resolve(path === '.obsidian/plugins/workspace-plus-plus');
    };
    plugin.host.app.vault.adapter.mkdir = function () {
        return Promise.resolve();
    };
    plugin.host.app.vault.adapter.write = function (path, raw) {
        writes.push({ path: path, data: JSON.parse(raw) });
        return Promise.resolve();
    };
    plugin.host.app.vault.adapter.remove = function (path) {
        removed.push(path);
        return Promise.resolve();
    };
    plugin.host.app.vault.adapter.stat = function () {
        return Promise.resolve({ mtime: 2000 });
    };
    plugin.host.saveData = function (savedValue) {
        plugin.savedData = savedValue;
        return Promise.resolve();
    };
    plugin.host.loadData = function () {
        return Promise.resolve(plugin.savedData);
    };

    const moved = await plugin.persistenceService.setSessionStorageLocation('plugin-folder', { silent: true });

    assert.equal(moved, true);
    assert.equal(plugin.persistenceService.getSessionStorageLocation(), 'plugin-folder');
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

test('session sync: listeners and timer management', async function () {
    const harness = setupHarness();
    try {
        const plugin = createPlugin();
        let domEvents = [];
        plugin.host.registerDomEvent = function (target, event, handler) {
            domEvents.push({ target, event, handler });
        };

        plugin.registerSessionStorageListeners();
        assert.equal(domEvents.length, 1);
        assert.equal(domEvents[0].event, 'focus');

        // Duplicate call is no-op
        plugin.registerSessionStorageListeners();
        assert.equal(domEvents.length, 1);

        // Startup timers
        plugin.scheduleStartupSessionStorageChecks();
        assert.equal(plugin.getSyncWatcher().hasActiveTimers(), true);

        // onExternalSettingsChange schedules reload
        let reloadScheduled = false;
        plugin.host.reloadExternalSessionStorageIfChanged = function () {
            reloadScheduled = true;
            return Promise.resolve(true);
        };
        plugin.onExternalSettingsChange();
        assert.equal(plugin.getSyncWatcher().hasActiveTimers(), true);
        assert.equal(reloadScheduled, false); // Debounced

        // Clear timers
        plugin.clearSessionStorageSyncTimers();
        assert.equal(plugin.getSyncWatcher().hasActiveTimers(), false);
    } finally {
        harness.restore();
    }
});

test('session sync: overlay refresh and local changes tracking', async function () {
    const plugin = createPlugin();
    let refreshed = false;
    plugin.host.notifySessionsChanged = function () {
        refreshed = true;
    };

    plugin.applySessionDataFromStorage({
        activeSessionId: 'local',
        sessions: { local: { id: 'local', name: 'L' } },
    });
    assert.equal(refreshed, true);

    assert.equal(plugin.hasLocalSessionChangesSinceStorage(), false);
    plugin.host.recordSessionStorageState(100, 200, plugin.data);
    assert.equal(plugin.hasLocalSessionChangesSinceStorage(), false);

    plugin.data.sessions.local.name = 'Changed';
    assert.equal(plugin.hasLocalSessionChangesSinceStorage(), true);

    await plugin.host.recordSessionDataStored({ _wppSavedAt: 500, sessions: {} });
    assert.equal(plugin.host._sessionStorageStamp, 500);
});

test('session sync: reload debounce and focus callbacks', async function () {
    const harness = setupHarness();
    try {
        const plugin = createPlugin();
        let reloads = 0;
        plugin.host.reloadExternalSessionStorageIfChanged = function () {
            reloads++;
            return Promise.resolve(true);
        };

        let domEvents = [];
        plugin.host.registerDomEvent = function (target, event, handler) {
            domEvents.push({ target, event, handler });
        };

        plugin.registerSessionStorageListeners();
        assert.equal(domEvents.length, 1);
        // Trigger focus event handler
        domEvents[0].handler();
        assert.equal(plugin.getSyncWatcher().hasActiveTimers(), true);
        assert.equal(reloads, 0); // Debounced

        // Call schedule reload directly
        plugin.host.scheduleExternalSessionStorageReload();

        // Trigger timer callback immediately
        plugin.clearSessionStorageSyncTimers();
        assert.equal(plugin.getSyncWatcher().hasActiveTimers(), false);

        // Test getFileMtime failure in recordSessionDataStored
        plugin.host.getFileMtime = function () {
            return Promise.reject(new Error('fail'));
        };
        await plugin.host.recordSessionDataStored({ _wppSavedAt: 123 });

        // Test reload failure catch with real reload implementation. The
        // missing adapter.exists/read on plugin2's mock is what makes
        // getSessionStorageInfo() come back invalid here, sending
        // reloadExternalSessionStorageIfChanged() down its early-return path.
        const plugin2 = createPlugin();
        const res = await plugin2.host.reloadExternalSessionStorageIfChanged();
        assert.equal(res, false);
    } finally {
        harness.restore();
    }
});
