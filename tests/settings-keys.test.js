'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadPluginMethods } = require('./helpers');


const { persistence: attachPersistenceMethods, DEFAULT_DATA } = loadPluginMethods(['persistence']);

// Keys that are intentionally persisted outside SETTINGS_KEYS / SESSION_KEYS.
// sessionStorageLocation is written explicitly by persistGlobalSettings() because
// its value comes from getSessionStorageLocation(), not from this.data.
const PERSISTED_ELSEWHERE = ['sessionStorageLocation'];

function createPlugin(initialData) {
    function PluginMock() {}
    attachPersistenceMethods(PluginMock);

    const plugin = new PluginMock();
    plugin.data = Object.assign({}, DEFAULT_DATA, initialData || {});
    return plugin;
}

test('restoreSidebars survives the settings extract used when persisting', function () {
    const plugin = createPlugin({ restoreSidebars: false });

    const settings = plugin.extractSettingsData(plugin.data);

    assert.equal(
        settings.restoreSidebars,
        false,
        'restoreSidebars must be extracted so persistGlobalSettings() writes it to data.json'
    );
});

test('restoreSidebars round-trips through extract and default merge', function () {
    const plugin = createPlugin({ restoreSidebars: false });

    // Persist path: only extractSettingsData() output reaches data.json.
    const saved = plugin.extractSettingsData(plugin.data);

    // Load path: main.js merges DEFAULT_DATA with whatever was saved.
    const reloaded = Object.assign({}, DEFAULT_DATA, saved);

    assert.equal(
        reloaded.restoreSidebars,
        false,
        'restoreSidebars must stay off after a restart'
    );
});

test('every default data key is covered by the settings or session key list', function () {
    const plugin = createPlugin();

    const persisted = Object.assign(
        {},
        plugin.extractSettingsData(plugin.data),
        plugin.extractSessionData(plugin.data)
    );

    const uncovered = Object.keys(DEFAULT_DATA).filter(function (key) {
        return !(key in persisted) && PERSISTED_ELSEWHERE.indexOf(key) === -1;
    });

    assert.deepEqual(
        uncovered,
        [],
        'keys in DEFAULT_DATA must be added to SETTINGS_KEYS or SESSION_KEYS, '
            + 'otherwise they are silently dropped on save and reset to the default on load'
    );
});
