'use strict';

require('./lock/harness/index.ts').installObsidianStub();

const test = require('node:test');
const assert = require('node:assert/strict');

const attachSettingsStateMethods = require('../src/plugin/methods/settings-state');

function createPlugin(initialData) {
    function PluginMock() {}
    attachSettingsStateMethods(PluginMock);
    const plugin = new PluginMock();
    plugin.data = Object.assign({
        statusBarActions: null,
        numberedSwitchCommands: true,
        versionHistoryEnabled: true,
    }, initialData || {});
    plugin.persistCalls = 0;
    plugin.statusBarUpdates = 0;
    plugin.commandSyncs = 0;
    plugin.historyStarts = 0;
    plugin.historyStops = 0;
    plugin.persistData = function () {
        plugin.persistCalls += 1;
        return Promise.resolve(true);
    };
    plugin.updateStatusBar = function () {
        plugin.statusBarUpdates += 1;
    };
    plugin.syncSessionCommands = function () {
        plugin.commandSyncs += 1;
    };
    plugin.startHistorySnapshotTimer = function () {
        plugin.historyStarts += 1;
    };
    plugin.stopHistorySnapshotTimer = function () {
        plugin.historyStops += 1;
    };
    return plugin;
}

test('settings state initializes status bar actions before setting a slot', async function () {
    const plugin = createPlugin({ statusBarActions: null });

    await plugin.setStatusBarAction('click', 'sessionManager');

    assert.equal(plugin.data.statusBarActions.click, 'sessionManager');
    assert.equal(plugin.data.statusBarActions.rightClick, 'sessionMenu');
    assert.equal(plugin.persistCalls, 1);
});

test('settings state can skip persistence for batch callers', async function () {
    const plugin = createPlugin();

    await plugin.setWarnOnUnsavedSwitch(false, { persist: false });

    assert.equal(plugin.data.warnOnUnsavedSwitch, false);
    assert.equal(plugin.persistCalls, 0);
});

test('settings state keeps status bar highlight side effects together', async function () {
    const plugin = createPlugin();

    await plugin.setUnsavedStatusBarHighlight(false);

    assert.equal(plugin.data.highlightUnsavedSessionChanges, false);
    assert.equal(plugin.statusBarUpdates, 1);
    assert.equal(plugin.persistCalls, 1);
});

test('settings state syncs commands when numbered command setting changes', async function () {
    const plugin = createPlugin();

    await plugin.setNumberedSwitchCommands(false);

    assert.equal(plugin.data.numberedSwitchCommands, false);
    assert.equal(plugin.commandSyncs, 1);
    assert.equal(plugin.persistCalls, 1);
});

test('settings state stores sidebar restore preference', async function () {
    const plugin = createPlugin({ restoreSidebars: true });

    await plugin.setRestoreSidebars(false);

    assert.equal(plugin.data.restoreSidebars, false);
    assert.equal(plugin.persistCalls, 1);
});

test('settings state starts and stops version history timer with the setting', async function () {
    const plugin = createPlugin();

    await plugin.setVersionHistoryEnabled(false);
    await plugin.setVersionHistoryEnabled(true);
    await plugin.setVersionHistorySnapshotInterval('10');

    assert.equal(plugin.data.versionHistoryEnabled, true);
    assert.equal(plugin.data.versionHistorySnapshotInterval, 10);
    assert.equal(plugin.historyStops, 1);
    assert.equal(plugin.historyStarts, 2);
    assert.equal(plugin.persistCalls, 3);
});
