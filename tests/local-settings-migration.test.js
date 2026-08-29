'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadPluginMethods } = require('./helpers');


const { persistence: attachPersistenceMethods } = loadPluginMethods(['persistence']);

const LEGACY_PATH = '.workspace-plus-plus/settings.local.json';
const MIGRATED_PATH = '.workspace-plus-plus/settings.local.json.migrated';
const DATA_PATH = '.obsidian/plugins/workspace-plus-plus/data.json';

function createPlugin(options) {
    options = options || {};

    function PluginMock() {}
    attachPersistenceMethods(PluginMock);

    const plugin = new PluginMock();
    plugin.manifest = { id: 'workspace-plus-plus', dir: '.obsidian/plugins/workspace-plus-plus' };
    plugin.files = Object.assign({}, options.files);
    plugin.renames = [];
    plugin.savedData = null;

    plugin.data = {
        sessions: {},
        sessionOrder: [],
        groups: {},
        groupOrder: [],
        sessionGroups: {},
        activeSessionId: null,
        activeGroupId: null,
    };

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
                    return Promise.resolve();
                },
                remove: (path) => {
                    delete plugin.files[path];
                    return Promise.resolve();
                },
                rename: (from, to) => {
                    plugin.renames.push([from, to]);
                    plugin.files[to] = plugin.files[from];
                    delete plugin.files[from];
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

    return plugin;
}

test('legacy vault-local settings are folded into data.json and the file is renamed', async function () {
    const plugin = createPlugin({
        files: {
            [DATA_PATH]: JSON.stringify({ language: 'en', autoSaveOnSwitch: true }),
            [LEGACY_PATH]: JSON.stringify({ language: 'ja', autoSaveOnSwitch: false }),
        },
    });

    const loaded = await plugin.loadWithBackup();

    assert.equal(loaded.language, 'ja', 'the vault-local value is what the user actually saw');
    assert.equal(loaded.autoSaveOnSwitch, false);

    assert.deepEqual(plugin.renames, [[LEGACY_PATH, MIGRATED_PATH]], 'the old file is renamed, not deleted');
    assert.equal(plugin.files[LEGACY_PATH], undefined);
    assert.ok(plugin.files[MIGRATED_PATH], 'the migrated copy is kept as a safety net');

    const written = JSON.parse(plugin.files[DATA_PATH]);
    assert.equal(written.language, 'ja', 'data.json now carries the merged settings');
    assert.equal(written.autoSaveOnSwitch, false);
});

test('settings absent from the legacy file keep their data.json value', async function () {
    const plugin = createPlugin({
        files: {
            [DATA_PATH]: JSON.stringify({ language: 'en', numberedSwitchCommands: false }),
            [LEGACY_PATH]: JSON.stringify({ language: 'ja' }),
        },
    });

    const loaded = await plugin.loadWithBackup();

    assert.equal(loaded.language, 'ja');
    assert.equal(loaded.numberedSwitchCommands, false, 'untouched keys must not be reset to the default');
});

test('loading is a no-op when no legacy file exists', async function () {
    const plugin = createPlugin({
        files: { [DATA_PATH]: JSON.stringify({ language: 'ja' }) },
    });

    const loaded = await plugin.loadWithBackup();

    assert.equal(loaded.language, 'ja');
    assert.deepEqual(plugin.renames, []);
});

test('an unreadable legacy file is left alone instead of dropping settings', async function () {
    const plugin = createPlugin({
        files: {
            [DATA_PATH]: JSON.stringify({ language: 'ja' }),
            [LEGACY_PATH]: '{ this is not json',
        },
    });

    const loaded = await plugin.loadWithBackup();

    assert.equal(loaded.language, 'ja', 'existing settings survive');
    assert.deepEqual(plugin.renames, [], 'the file stays put so it can be recovered by hand');
    assert.ok(plugin.files[LEGACY_PATH], 'and is not destroyed');
});

test('the vault-local settings API is gone', function () {
    const plugin = createPlugin();

    for (const name of [
        'isUsingLocalSettings',
        'setUseLocalSettings',
        'copyGlobalSettingsToLocal',
        'resetLocalSettings',
        'getLocalSettingsPath',
        'loadLocalSettingsData',
    ]) {
        assert.equal(typeof plugin[name], 'undefined', name + ' should no longer exist');
    }
});

test('storage diagnostics no longer advertise a local settings file', function () {
    const plugin = createPlugin();

    const info = plugin.getStorageDiagnosticsInfo();

    assert.equal(info.localSettingsPath, undefined);
    assert.equal(info.globalSettingsPath, DATA_PATH, 'settings live in exactly one place now');
});
