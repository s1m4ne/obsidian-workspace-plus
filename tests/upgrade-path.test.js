'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadPluginMethods } = require('./helpers');

const methods = loadPluginMethods(['persistence', 'session-sync', 'storage-backup']);

const PLUGIN_DIR = '.obsidian/plugins/workspace-plus-plus';
const DATA_PATH = PLUGIN_DIR + '/data.json';
const LEGACY_SESSIONS_PATH = PLUGIN_DIR + '/sessions.json';
const HISTORY_PATH = PLUGIN_DIR + '/history.json';
const LOCAL_SETTINGS_PATH = '.workspace-plus-plus/settings.local.json';

function createPlugin(files) {
    function PluginMock() {}
    methods.persistence(PluginMock);
    methods['storage-backup'](PluginMock);
    methods['session-sync'](PluginMock);

    const plugin = new PluginMock();
    plugin.manifest = { id: 'workspace-plus-plus', dir: PLUGIN_DIR };
    plugin.files = Object.assign({}, files);
    plugin.renames = [];
    plugin.data = {};

    plugin.app = {
        vault: {
            adapter: {
                exists: (p) => Promise.resolve(
                    Object.prototype.hasOwnProperty.call(plugin.files, p)
                    || p === PLUGIN_DIR || p === '.workspace-plus-plus'
                ),
                mkdir: () => Promise.resolve(),
                read: (p) => (
                    Object.prototype.hasOwnProperty.call(plugin.files, p)
                        ? Promise.resolve(plugin.files[p])
                        : Promise.reject(new Error('missing ' + p))
                ),
                write: (p, raw) => {
                    plugin.files[p] = raw;
                    return Promise.resolve();
                },
                remove: (p) => {
                    delete plugin.files[p];
                    return Promise.resolve();
                },
                rename: (from, to) => {
                    plugin.renames.push([from, to]);
                    plugin.files[to] = plugin.files[from];
                    delete plugin.files[from];
                    return Promise.resolve();
                },
                stat: (p) => Promise.resolve(
                    Object.prototype.hasOwnProperty.call(plugin.files, p)
                        ? { mtime: 1000, size: plugin.files[p].length }
                        : null
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

    return plugin;
}

// A 0.7.17 install that used every feature the storage rework touched:
// sessions in the plugin folder's sessions.json, version history inlined on each
// session, and vault-local settings in their own file. All three migrations run
// during a single load, and they have to not trip over each other.
test('a 0.7.17 install upgrades cleanly in one load', async function () {
    const plugin = createPlugin({
        [DATA_PATH]: JSON.stringify({
            language: 'en',
            autoSaveOnSwitch: true,
            numberedSwitchCommands: false,
            sessionStorageLocation: 'plugin-folder',
        }),
        [LEGACY_SESSIONS_PATH]: JSON.stringify({
            activeSessionId: 's1',
            sessionOrder: ['s1', 's2'],
            sessions: {
                s1: {
                    id: 's1',
                    name: 'Work',
                    modified: 100,
                    layout: { main: 'work' },
                    history: [{ layout: { main: 'old-work' }, savedAt: 90 }],
                },
                s2: { id: 's2', name: 'Reading', modified: 200, layout: { main: 'reading' } },
            },
            groups: { g1: { id: 'g1', name: 'Group' } },
            groupOrder: ['g1'],
            sessionGroups: { s1: ['g1'] },
            _wppSavedAt: 500,
        }),
        [LOCAL_SETTINGS_PATH]: JSON.stringify({ language: 'ja' }),
    });

    const loaded = await plugin.loadWithBackup();

    // Sessions survive, with history reattached in memory.
    assert.deepEqual(Object.keys(loaded.sessions).sort(), ['s1', 's2']);
    assert.equal(loaded.sessions.s1.name, 'Work');
    assert.equal(loaded.sessions.s1.history.length, 1);
    assert.deepEqual(loaded.groups.g1, { id: 'g1', name: 'Group' });
    assert.deepEqual(loaded.sessionGroups.s1, ['g1']);

    // Vault-local settings won, and untouched settings kept their value.
    assert.equal(loaded.language, 'ja');
    assert.equal(loaded.numberedSwitchCommands, false);

    // data.json now carries both settings and sessions.
    const stored = JSON.parse(plugin.files[DATA_PATH]);
    assert.equal(stored.language, 'ja');
    assert.equal(stored.sessions.s1.name, 'Work');
    assert.equal(stored.sessions.s1.history, undefined, 'history must not ride along in data.json');

    // History landed in its own local file.
    const history = JSON.parse(plugin.files[HISTORY_PATH]);
    assert.equal(history.version, 1);
    assert.equal(history.history.s1.length, 1);
    assert.equal(history.history.s2, undefined);

    // Nothing was destroyed on the way.
    assert.ok(plugin.files[LEGACY_SESSIONS_PATH], 'the old sessions file is kept');
    assert.deepEqual(
        plugin.renames,
        [[LOCAL_SETTINGS_PATH, LOCAL_SETTINGS_PATH + '.migrated']],
        'local settings are renamed, not deleted'
    );
});

test('the upgraded install is stable on the next load', async function () {
    const plugin = createPlugin({
        [DATA_PATH]: JSON.stringify({
            language: 'en',
            sessionStorageLocation: 'plugin-folder',
        }),
        [LEGACY_SESSIONS_PATH]: JSON.stringify({
            activeSessionId: 's1',
            sessionOrder: ['s1'],
            sessions: {
                s1: {
                    id: 's1',
                    name: 'Work',
                    modified: 100,
                    layout: {},
                    history: [{ layout: {}, savedAt: 90 }],
                },
            },
            groups: {},
            groupOrder: [],
            sessionGroups: {},
        }),
    });

    await plugin.loadWithBackup();
    const afterFirst = plugin.files[DATA_PATH];
    plugin.renames = [];

    // Second launch: nothing left to migrate, and the leftover sessions.json must
    // not overwrite what data.json now holds.
    const second = await plugin.loadWithBackup();

    assert.equal(second.sessions.s1.name, 'Work');
    assert.equal(second.sessions.s1.history.length, 1);
    assert.equal(plugin.files[DATA_PATH], afterFirst, 'a settled install rewrites nothing');
    assert.deepEqual(plugin.renames, []);
});

test('a vault-folder install is not dragged into data.json', async function () {
    const plugin = createPlugin({
        [DATA_PATH]: JSON.stringify({
            language: 'en',
            sessionStorageLocation: 'vault-folder',
        }),
        '.workspace-plus-plus/sessions.json': JSON.stringify({
            activeSessionId: 'v1',
            sessionOrder: ['v1'],
            sessions: { v1: { id: 'v1', name: 'Vault', modified: 10, layout: {} } },
            groups: {},
            groupOrder: [],
            sessionGroups: {},
        }),
    });

    const loaded = await plugin.loadWithBackup();

    assert.equal(loaded.sessions.v1.name, 'Vault');
    const stored = JSON.parse(plugin.files[DATA_PATH]);
    assert.equal(stored.sessions, undefined, 'multi-vault installs keep sessions out of .obsidian');
});
