'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadPluginMethods } = require('./helpers');


const { persistence: attachPersistenceMethods, 'session-sync': attachSessionSyncMethods } = loadPluginMethods(['persistence', 'session-sync']);

// plugin-folder mode keeps the sessions inside data.json.
const DATA_PATH = '.obsidian/plugins/workspace-plus-plus/data.json';
const LEGACY_SESSIONS_PATH = '.obsidian/plugins/workspace-plus-plus/sessions.json';
const HISTORY_PATH = '.obsidian/plugins/workspace-plus-plus/history.json';

function historyEntry(at) {
    return { layout: { main: { id: 'leaf-' + at } }, savedAt: at };
}

function createPlugin(options) {
    options = options || {};

    function PluginMock() {}
    attachPersistenceMethods(PluginMock);
    attachSessionSyncMethods(PluginMock);

    const plugin = new PluginMock();
    plugin.manifest = { id: 'workspace-plus-plus', dir: '.obsidian/plugins/workspace-plus-plus' };
    plugin.data = Object.assign({
        activeSessionId: 'a',
        sessionOrder: ['a', 'b'],
        sessions: {
            a: { id: 'a', name: 'A', modified: 10, layout: { a: true }, history: [historyEntry(3), historyEntry(2)] },
            b: { id: 'b', name: 'B', modified: 20, layout: { b: true } },
        },
        groups: {},
        groupOrder: [],
        sessionGroups: {},
        activeGroupId: null,
    }, options.data || {});

    plugin.files = Object.assign({}, options.files);
    plugin.writes = [];
    plugin.globalSettings = {};
    plugin.useLocalSettings = false;
    plugin.setRuntimeSessionStorageLocation('plugin-folder');

    plugin.app = {
        vault: {
            adapter: {
                exists: (path) => Promise.resolve(
                    Object.prototype.hasOwnProperty.call(plugin.files, path)
                    || path === plugin.manifest.dir
                ),
                mkdir: () => Promise.resolve(),
                read: (path) => (
                    Object.prototype.hasOwnProperty.call(plugin.files, path)
                        ? Promise.resolve(plugin.files[path])
                        : Promise.reject(new Error('missing ' + path))
                ),
                write: (path, raw) => {
                    plugin.files[path] = raw;
                    plugin.writes.push(path);
                    return Promise.resolve();
                },
                remove: (path) => {
                    delete plugin.files[path];
                    return Promise.resolve();
                },
                stat: () => Promise.resolve({ mtime: 1000 }),
            },
        },
    };

    plugin.saveData = (data) => {
        plugin.savedData = data;
        plugin.files[DATA_PATH] = JSON.stringify(data);
        return Promise.resolve();
    };
    plugin.loadData = () => Promise.resolve(
        Object.prototype.hasOwnProperty.call(plugin.files, DATA_PATH)
            ? JSON.parse(plugin.files[DATA_PATH])
            : null
    );
    plugin.updateStatusBar = () => {};
    plugin.syncSessionCommands = () => {};
    plugin.syncSessionOrder = () => {};
    plugin.normalizeGroupFeatureState = () => {};
    plugin.rotateBackupIfNeeded = () => Promise.resolve();
    plugin.loadLocalSettingsData = () => Promise.resolve(null);

    return plugin;
}


test('persisting writes history to its own file and keeps sessions history-free', async function () {
    const plugin = createPlugin();

    await plugin.persistDataImmediate();

    const stored = JSON.parse(plugin.files[DATA_PATH]);
    assert.equal(stored.sessions.a.history, undefined, 'the stored sessions must not carry history');
    assert.equal(stored.sessions.a.name, 'A');

    const history = JSON.parse(plugin.files[HISTORY_PATH]);
    assert.equal(history.version, 1);
    assert.equal(history.history.a.length, 2);
    assert.equal(history.history.a[0].savedAt, 3);
    assert.equal(history.history.b, undefined, 'sessions without history are omitted');
});

test('persisting does not strip history from the live in-memory session', async function () {
    const plugin = createPlugin();

    await plugin.persistDataImmediate();

    // extractSessionData() hands back this.data.sessions by reference, so a naive
    // in-place strip would wipe the history the history modal is still reading.
    assert.ok(Array.isArray(plugin.data.sessions.a.history), 'in-memory history must survive a save');
    assert.equal(plugin.data.sessions.a.history.length, 2);
});

test('the immediate backup is history-free as well', async function () {
    const plugin = createPlugin();

    await plugin.persistDataImmediate();

    const backup = JSON.parse(plugin.files['.obsidian/plugins/workspace-plus-plus/sessions.backup.json']);
    assert.equal(backup.sessions.a.history, undefined);
});

test('history for deleted sessions is pruned instead of leaking', async function () {
    const plugin = createPlugin({
        files: {
            [HISTORY_PATH]: JSON.stringify({
                version: 1,
                history: { a: [historyEntry(1)], gone: [historyEntry(9)] },
            }),
        },
    });

    await plugin.persistDataImmediate();

    const history = JSON.parse(plugin.files[HISTORY_PATH]);
    assert.deepEqual(Object.keys(history.history), ['a'], 'orphaned history must be dropped');
});

test('loading merges history.json back onto the sessions', async function () {
    const plugin = createPlugin({
        files: {
            [LEGACY_SESSIONS_PATH]: JSON.stringify({
                activeSessionId: 'a',
                sessionOrder: ['a'],
                sessions: { a: { id: 'a', name: 'A', modified: 10, layout: { a: true } } },
            }),
            [HISTORY_PATH]: JSON.stringify({
                version: 1,
                history: { a: [historyEntry(7)] },
            }),
        },
    });

    const loaded = await plugin.loadWithBackup();

    assert.equal(loaded.sessions.a.history.length, 1);
    assert.equal(loaded.sessions.a.history[0].savedAt, 7);
});

test('legacy inline history is kept and migrated to history.json on load', async function () {
    const plugin = createPlugin({
        files: {
            [LEGACY_SESSIONS_PATH]: JSON.stringify({
                activeSessionId: 'a',
                sessionOrder: ['a'],
                sessions: {
                    a: { id: 'a', name: 'A', modified: 10, layout: { a: true }, history: [historyEntry(5)] },
                },
            }),
        },
    });

    const loaded = await plugin.loadWithBackup();

    assert.equal(loaded.sessions.a.history.length, 1, 'inline history must not be dropped');
    assert.equal(loaded.sessions.a.history[0].savedAt, 5);

    const history = JSON.parse(plugin.files[HISTORY_PATH]);
    assert.equal(history.history.a.length, 1, 'inline history is written out on load');
});

test('history.json wins over stale inline history', async function () {
    const plugin = createPlugin({
        files: {
            [LEGACY_SESSIONS_PATH]: JSON.stringify({
                activeSessionId: 'a',
                sessionOrder: ['a'],
                sessions: {
                    a: { id: 'a', name: 'A', modified: 10, layout: { a: true }, history: [historyEntry(1)] },
                },
            }),
            [HISTORY_PATH]: JSON.stringify({
                version: 1,
                history: { a: [historyEntry(8)] },
            }),
        },
    });

    const loaded = await plugin.loadWithBackup();

    assert.equal(loaded.sessions.a.history[0].savedAt, 8);
});

test('exported snapshots leave version history behind', async function () {
    const plugin = createPlugin();
    plugin.ensureDir = () => Promise.resolve();

    await plugin.exportSessionsSnapshot();

    const exportPath = plugin.writes.find((p) => p.includes('/exports/'));
    assert.ok(exportPath, 'an export file should be written');
    const payload = JSON.parse(plugin.files[exportPath]);
    assert.equal(payload.data.sessions.a.history, undefined);
});

test('reset cleanup targets the history file', function () {
    const plugin = createPlugin();

    assert.ok(
        plugin.getBackupFilePaths().includes(HISTORY_PATH),
        'clearing backups must also clear recovery-only history'
    );
});
