'use strict';

require('./lock/harness/index.ts').installObsidianStub();

const test = require('node:test');
const assert = require('node:assert/strict');

const { SettingsState } = require('../src/state/settings-state.ts');

function createState(initialData) {
    const data = Object.assign({
        statusBarActions: null,
        numberedSwitchCommands: true,
        versionHistoryEnabled: true,
    }, initialData || {});
    const events = { persistCalls: 0, statusBarUpdates: 0, commandSyncs: 0, historyStarts: 0, historyStops: 0 };
    const state = new SettingsState({
        data,
        persistData: function () {
        events.persistCalls += 1;
        return Promise.resolve(true);
        },
        updateStatusBar: function () { events.statusBarUpdates += 1; },
        syncSessionCommands: function () { events.commandSyncs += 1; },
        startHistorySnapshotTimer: function () { events.historyStarts += 1; },
        stopHistorySnapshotTimer: function () { events.historyStops += 1; },
    });
    return { state, data, events };
}

test('settings state initializes status bar actions before setting a slot', async function () {
    const { state, data, events } = createState({ statusBarActions: null });

    await state.setStatusBarAction('click', 'sessionManager');

    assert.equal(data.statusBarActions.click, 'sessionManager');
    assert.equal(data.statusBarActions.rightClick, 'sessionMenu');
    assert.equal(events.persistCalls, 1);
});

test('settings state can skip persistence for batch callers', async function () {
    const { state, data, events } = createState();

    await state.setWarnOnUnsavedSwitch(false, { persist: false });

    assert.equal(data.warnOnUnsavedSwitch, false);
    assert.equal(events.persistCalls, 0);
});

test('settings state keeps status bar highlight side effects together', async function () {
    const { state, data, events } = createState();

    await state.setUnsavedStatusBarHighlight(false);

    assert.equal(data.highlightUnsavedSessionChanges, false);
    assert.equal(events.statusBarUpdates, 1);
    assert.equal(events.persistCalls, 1);
});

test('settings state syncs commands when numbered command setting changes', async function () {
    const { state, data, events } = createState();

    await state.setNumberedSwitchCommands(false);

    assert.equal(data.numberedSwitchCommands, false);
    assert.equal(events.commandSyncs, 1);
    assert.equal(events.persistCalls, 1);
});

test('settings state stores sidebar restore preference', async function () {
    const { state, data, events } = createState({ restoreSidebars: true });

    await state.setRestoreSidebars(false);

    assert.equal(data.restoreSidebars, false);
    assert.equal(events.persistCalls, 1);
});

test('settings state starts and stops version history timer with the setting', async function () {
    const { state, data, events } = createState();

    await state.setVersionHistoryEnabled(false);
    await state.setVersionHistoryEnabled(true);
    await state.setVersionHistorySnapshotInterval('10');

    assert.equal(data.versionHistoryEnabled, true);
    assert.equal(data.versionHistorySnapshotInterval, 10);
    assert.equal(events.historyStops, 1);
    assert.equal(events.historyStarts, 2);
    assert.equal(events.persistCalls, 3);
});

test('settings state covers all remaining setters and fallback logic', async function () {
    const { state, data } = createState();

    await state.setLanguageSetting('ja');
    assert.equal(data.language, 'ja');
    await state.setLanguageSetting('');
    assert.equal(data.language, 'auto');

    await state.setConfirmQuickActions(true);
    assert.equal(data.confirmQuickActions, true);

    await state.setStatusBarModScrollSwitch(true);
    assert.equal(data.statusBarModScrollSwitch, true);

    await state.setStatusBarScrollPreset('mouse');
    assert.equal(data.statusBarScrollPreset, 'mouse');
    await state.setStatusBarScrollPreset('');
    assert.equal(data.statusBarScrollPreset, 'trackpad');

    await state.setStatusBarScrollModifierMode('ctrl');
    assert.equal(data.statusBarScrollModifierMode, 'ctrl');
    await state.setStatusBarScrollModifierMode('');
    assert.equal(data.statusBarScrollModifierMode, 'none');

    await state.setStatusBarScrollThreshold('50');
    assert.equal(data.statusBarScrollThreshold, 50);
    await state.setStatusBarScrollThreshold('invalid');
    assert.equal(data.statusBarScrollThreshold, 30);

    await state.setStatusBarScrollCooldownMs('600');
    assert.equal(data.statusBarScrollCooldownMs, 600);
    await state.setStatusBarScrollCooldownMs('invalid');
    assert.equal(data.statusBarScrollCooldownMs, 500);

    await state.setStatusBarScrollResetMs('300');
    assert.equal(data.statusBarScrollResetMs, 300);
    await state.setStatusBarScrollResetMs('invalid');
    assert.equal(data.statusBarScrollResetMs, 250);

    await state.setStatusBarScrollInvert(true);
    assert.equal(data.statusBarScrollInvert, true);

    await state.setShowActiveSwitchCommand(true);
    assert.equal(data.showActiveSwitchCommand, true);

    await state.setSwitchPreviewEnabled(true);
    assert.equal(data.previewNext, true);
    assert.equal(data.previewPrevious, true);

    await state.setPreviewNext(false);
    assert.equal(data.previewNext, false);

    await state.setPreviewPrevious(false);
    assert.equal(data.previewPrevious, false);

    await state.setShowFilterInput(true);
    assert.equal(data.showFilterInput, true);

    await state.setConfirmDeleteByHotkey(true);
    assert.equal(data.confirmDeleteByHotkey, true);

    await state.setVersionHistoryConfirmRestore(true);
    assert.equal(data.versionHistoryConfirmRestore, true);
});
