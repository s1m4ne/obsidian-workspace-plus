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

test('settings state covers all remaining setters and fallback logic', async function () {
    const plugin = createPlugin();

    await plugin.setLanguageSetting('ja');
    assert.equal(plugin.data.language, 'ja');
    await plugin.setLanguageSetting('');
    assert.equal(plugin.data.language, 'auto');

    await plugin.setConfirmQuickActions(true);
    assert.equal(plugin.data.confirmQuickActions, true);

    await plugin.setStatusBarModScrollSwitch(true);
    assert.equal(plugin.data.statusBarModScrollSwitch, true);

    await plugin.setStatusBarScrollPreset('mouse');
    assert.equal(plugin.data.statusBarScrollPreset, 'mouse');
    await plugin.setStatusBarScrollPreset('');
    assert.equal(plugin.data.statusBarScrollPreset, 'trackpad');

    await plugin.setStatusBarScrollModifierMode('ctrl');
    assert.equal(plugin.data.statusBarScrollModifierMode, 'ctrl');
    await plugin.setStatusBarScrollModifierMode('');
    assert.equal(plugin.data.statusBarScrollModifierMode, 'none');

    await plugin.setStatusBarScrollThreshold('50');
    assert.equal(plugin.data.statusBarScrollThreshold, 50);
    await plugin.setStatusBarScrollThreshold('invalid');
    assert.equal(plugin.data.statusBarScrollThreshold, 30);

    await plugin.setStatusBarScrollCooldownMs('600');
    assert.equal(plugin.data.statusBarScrollCooldownMs, 600);
    await plugin.setStatusBarScrollCooldownMs('invalid');
    assert.equal(plugin.data.statusBarScrollCooldownMs, 500);

    await plugin.setStatusBarScrollResetMs('300');
    assert.equal(plugin.data.statusBarScrollResetMs, 300);
    await plugin.setStatusBarScrollResetMs('invalid');
    assert.equal(plugin.data.statusBarScrollResetMs, 250);

    await plugin.setStatusBarScrollInvert(true);
    assert.equal(plugin.data.statusBarScrollInvert, true);

    await plugin.setShowActiveSwitchCommand(true);
    assert.equal(plugin.data.showActiveSwitchCommand, true);

    await plugin.setSwitchPreviewEnabled(true);
    assert.equal(plugin.data.previewNext, true);
    assert.equal(plugin.data.previewPrevious, true);

    await plugin.setPreviewNext(false);
    assert.equal(plugin.data.previewNext, false);

    await plugin.setPreviewPrevious(false);
    assert.equal(plugin.data.previewPrevious, false);

    await plugin.setShowFilterInput(true);
    assert.equal(plugin.data.showFilterInput, true);

    await plugin.setOverlayDefaultFocus('search');
    assert.equal(plugin.data.overlayDefaultFocus, 'search');
    await plugin.setOverlayDefaultFocus('');
    assert.equal(plugin.data.overlayDefaultFocus, 'current-session');

    await plugin.setConfirmDeleteByHotkey(true);
    assert.equal(plugin.data.confirmDeleteByHotkey, true);

    await plugin.setVersionHistoryConfirmRestore(true);
    assert.equal(plugin.data.versionHistoryConfirmRestore, true);
});
