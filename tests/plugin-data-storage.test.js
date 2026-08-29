'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');

function loadMethods() {
    const obsidianStub = {
        Notice: class {
            constructor(message) {
                obsidianStub.notices.push(message);
            }
        },
        Platform: { isDesktop: true, isDesktopApp: true, isMacOS: true },
    };
    obsidianStub.notices = [];
    const originalLoad = Module._load;
    Module._load = function (request, parent, isMain) {
        if (request === 'obsidian') return obsidianStub;
        return originalLoad(request, parent, isMain);
    };
    try {
        const i18n = require('../src/i18n');
        i18n.resolveLocale('en');
        return {
            attachPersistenceMethods: require('../src/plugin/methods/persistence'),
            attachSessionSyncMethods: require('../src/plugin/methods/session-sync'),
            notices: obsidianStub.notices,
        };
    } finally {
        Module._load = originalLoad;
    }
}

const { attachPersistenceMethods, attachSessionSyncMethods } = loadMethods();

const PLUGIN_DIR = '.obsidian/plugins/workspace-plus-plus';
const DATA_PATH = PLUGIN_DIR + '/data.json';
const LEGACY_SESSIONS_PATH = PLUGIN_DIR + '/sessions.json';
const VAULT_SESSIONS_PATH = '.workspace-plus-plus/sessions.json';

function createPlugin(options) {
    options = options || {};

    function PluginMock() {}
    attachPersistenceMethods(PluginMock);
    attachSessionSyncMethods(PluginMock);

    const plugin = new PluginMock();
    plugin.manifest = { id: 'workspace-plus-plus', dir: PLUGIN_DIR };
    plugin.files = Object.assign({}, options.files);

    plugin.data = Object.assign({
        language: 'ja',
        autoSaveOnSwitch: true,
        activeSessionId: 'a',
        sessionOrder: ['a'],
        sessions: { a: { id: 'a', name: 'A', modified: 10, layout: { a: true } } },
        groups: {},
        groupOrder: [],
        sessionGroups: {},
        activeGroupId: null,
    }, options.data || {});

    plugin.setRuntimeSessionStorageLocation(options.location || 'plugin-folder');
    plugin.globalSettings = null;

    plugin.app = {
        vault: {
            adapter: {
                exists: (path) => Promise.resolve(
                    Object.prototype.hasOwnProperty.call(plugin.files, path) || path === PLUGIN_DIR
                ),
                mkdir: () => Promise.resolve(),
                read: (path) => (
                    Object.prototype.hasOwnProperty.call(plugin.files, path)
                        ? Promise.resolve(plugin.files[path])
                        : Promise.reject(new Error('missing ' + path))
                ),
                write: (path, raw) => {
                    plugin.files[path] = raw;
                    return Promise.resolve();
                },
                remove: (path) => {
                    delete plugin.files[path];
                    return Promise.resolve();
                },
                rename: () => Promise.resolve(),
                stat: (path) => Promise.resolve(
                    Object.prototype.hasOwnProperty.call(plugin.files, path) ? { mtime: 1000 } : null
                ),
            },
        },
    };

    plugin.saveData = (data) => {
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

    return plugin;
}

function readData(plugin) {
    return JSON.parse(plugin.files[DATA_PATH]);
}

test('plugin-folder mode stores sessions and settings together in data.json', async function () {
    const plugin = createPlugin();

    await plugin.persistDataImmediate();

    const stored = readData(plugin);
    assert.equal(stored.sessions.a.name, 'A', 'sessions must reach data.json');
    assert.equal(stored.language, 'ja', 'settings must reach data.json');
    assert.equal(stored.sessionStorageLocation, 'plugin-folder');
    assert.equal(plugin.getSessionsPath(), DATA_PATH);
});

test('saving sessions does not wipe the settings sharing data.json', async function () {
    const plugin = createPlugin();

    await plugin.persistDataImmediate();
    plugin.data.sessions.b = { id: 'b', name: 'B', modified: 20, layout: {} };
    plugin.data.sessionOrder.push('b');
    await plugin.persistDataImmediate();

    const stored = readData(plugin);
    assert.equal(stored.language, 'ja', 'a session write must not drop the settings');
    assert.equal(stored.sessions.b.name, 'B');
});

test('a settings-only write keeps the sessions already in data.json', async function () {
    const plugin = createPlugin();
    await plugin.persistDataImmediate();

    // persistGlobalSettings() is reached during load (legacy settings migration)
    // with no session data at hand. Replacing the file there would silently
    // delete every session.
    plugin.globalSettings = { language: 'en' };
    await plugin.persistGlobalSettings();

    const stored = readData(plugin);
    assert.equal(stored.language, 'en', 'the settings write still lands');
    assert.ok(stored.sessions && stored.sessions.a, 'and the sessions survive it');
    assert.equal(stored.sessions.a.name, 'A');
});

test('vault-folder mode keeps sessions and settings in separate files', async function () {
    const plugin = createPlugin({ location: 'vault-folder' });

    await plugin.persistDataImmediate();

    assert.equal(plugin.getSessionsPath(), VAULT_SESSIONS_PATH);
    const sessions = JSON.parse(plugin.files[VAULT_SESSIONS_PATH]);
    assert.equal(sessions.sessions.a.name, 'A');
    assert.equal(sessions.language, undefined, 'settings do not belong in the sessions file');

    const stored = readData(plugin);
    assert.equal(stored.language, 'ja');
    assert.equal(stored.sessions, undefined, 'sessions do not belong in data.json here');
});

test('sessions in data.json are not mistaken for the pre-#5 layout', async function () {
    const plugin = createPlugin({
        files: {
            [DATA_PATH]: JSON.stringify({
                language: 'ja',
                sessionStorageLocation: 'plugin-folder',
                activeSessionId: 'a',
                sessionOrder: ['a'],
                sessions: { a: { id: 'a', name: 'A', modified: 10, layout: {} } },
                groups: {},
                groupOrder: [],
                sessionGroups: {},
            }),
        },
    });

    const loaded = await plugin.loadWithBackup();

    assert.equal(loaded.sessions.a.name, 'A');
    assert.equal(
        plugin.files[LEGACY_SESSIONS_PATH],
        undefined,
        'loading must not push the sessions back out into sessions.json'
    );
});

test('an install predating the move reads its sessions from the old file', async function () {
    const plugin = createPlugin({
        files: {
            [DATA_PATH]: JSON.stringify({ language: 'ja', sessionStorageLocation: 'plugin-folder' }),
            [LEGACY_SESSIONS_PATH]: JSON.stringify({
                activeSessionId: 'old',
                sessionOrder: ['old'],
                sessions: { old: { id: 'old', name: 'Old', modified: 5, layout: {} } },
                groups: {},
                groupOrder: [],
                sessionGroups: {},
            }),
        },
    });

    const loaded = await plugin.loadWithBackup();

    assert.equal(loaded.sessions.old.name, 'Old', 'sessions must survive the upgrade');
    assert.equal(loaded.language, 'ja', 'and so must the settings');
});

test('restoring from the session backup preserves the settings in data.json', async function () {
    const plugin = createPlugin({
        files: {
            [DATA_PATH]: JSON.stringify({ language: 'ja', sessionStorageLocation: 'plugin-folder' }),
            [PLUGIN_DIR + '/sessions.backup.json']: JSON.stringify({
                activeSessionId: 'saved',
                sessionOrder: ['saved'],
                sessions: { saved: { id: 'saved', name: 'Saved', modified: 7, layout: {} } },
                groups: {},
                groupOrder: [],
                sessionGroups: {},
                _wppSavedAt: 99,
            }),
        },
    });

    const loaded = await plugin.loadWithBackup();

    assert.equal(loaded.sessions.saved.name, 'Saved');
    const stored = readData(plugin);
    assert.equal(stored.language, 'ja', 'the restore write must not blank the settings');
    assert.equal(stored.sessions.saved.name, 'Saved');
});
