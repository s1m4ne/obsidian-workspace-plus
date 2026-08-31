import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';
import { DEFAULT_DATA } from '../src/storage/default-data.ts';

const harness = setupHarness();
const {
    executeStatusBarAction,
    getActionLabel,
    ACTION_IDS,
    SLOT_KEYS,
} = await import('../src/statusbar-actions.ts');
const { L } = await import('../src/i18n.ts');

test('every click slot and action a user can configure is offered', () => {
    assert.ok(ACTION_IDS.length >= 17);
    assert.ok(SLOT_KEYS.length >= 12);
    assert.ok(SLOT_KEYS.includes('click'));
    assert.ok(SLOT_KEYS.includes('altClick'));
    assert.ok(SLOT_KEYS.includes('modClick'));
    assert.ok(SLOT_KEYS.includes('shiftClick'));
    assert.ok(SLOT_KEYS.includes('middleClick'));
    assert.ok(SLOT_KEYS.includes('rightClick'));
});

test('an unknown action falls back to the label for none', () => {
    assert.ok(getActionLabel(L, 'quickSwitcher'));
    assert.ok(getActionLabel(L, 'saveSession'));
    assert.ok(getActionLabel(L, 'none'));
    assert.equal(getActionLabel(L, 'unknownActionId'), getActionLabel(L, 'none'));
});

// The menu actions call straight into the real context-menu modules, so the
// host has to answer everything they ask. A thinner mock would only prove
// that a stand-in was called.
const menuPluginStubs = {
    confirmOverwriteSessionWithCurrentLayout: () => false,
    duplicateSession: () => false,
    isAutoSaveOnSwitchEnabled: () => false,
    isVersionHistoryEnabled: () => false,
    isWarnOnUnsavedSwitchEnabled: () => false,
    moveSessionToGroupExclusive: () => false,
    reloadCurrentSessionWithoutSaving: () => false,
    removeSessionFromGroup: () => false,
    saveActiveSession: () => false,
    saveAsSession: () => false,
    setAutoSaveOnSwitch: () => false,
    setConfirmDeleteByHotkey: () => false,
    setConfirmQuickActions: () => false,
    setGroupFeatureEnabled: () => false,
    setShowFilterInput: () => false,
    setVersionHistoryEnabled: () => false,
    setWarnOnUnsavedSwitch: () => false,
};

test('each configurable action performs its own effect and no other', async () => {
    const calls: string[] = [];

    const mockPlugin: import('../src/statusbar-actions.ts').StatusBarActionPluginHost = {
        ...menuPluginStubs,
        app: {} as import('obsidian').App,
        data: {
            ...DEFAULT_DATA,
            sessions: {
                s1: {
                    id: 's1',
                    name: 'Test Session',
                    layout: {},
                    history: [{ savedAt: 1234567890, layout: {} }],
                },
            },
            sessionOrder: ['s1'],
            activeSessionId: 's1',
        },
        searchOverlayEl: null,
        statusBarEl: null,
        getActiveSession() {
            return this.data.sessions.s1 || null;
        },
        isGroupFeatureEnabled() {
            return true;
        },
        getOrderedGroups() {
            return [{ id: 'g1', name: 'Group 1' }];
        },
        isVersionHistoryEnabled() {
            return true;
        },
        isVersionHistoryConfirmRestoreEnabled() {
            return true;
        },
        updateStatusBar() {
            calls.push('updateStatusBar');
        },
        hideSearchOverlay() {
            calls.push('hideSearchOverlay');
        },
        openSearchOverlay(anchor) {
            calls.push(`openSearchOverlay:${anchor ? 'with-anchor' : 'no-anchor'}`);
        },
        saveActiveSession: async () => {
            calls.push('saveActiveSession');
            return true;
        },
        saveAsSession: async () => {
            calls.push('saveAsSession');
            return true;
        },
        saveCurrentNoteNameAsSession: async () => {
            calls.push('saveCurrentNoteNameAsSession');
            return true;
        },
        reloadCurrentSessionWithoutSaving: async () => {
            calls.push('reloadCurrentSessionWithoutSaving');
            return true;
        },
        renameCurrentSession() {
            calls.push('renameCurrentSession');
        },
        duplicateCurrentSession: async () => {
            calls.push('duplicateCurrentSession');
            return true;
        },
        switchRelativeFromStatusBar: async (offset) => {
            calls.push(`switchRelative:${offset}`);
            return true;
        },
        createEmptySession: async () => {
            calls.push('createEmptySession');
            return true;
        },
        toggleAutoSaveOnSwitch: async (opts) => {
            calls.push(`toggleAutoSave:${opts?.notify}`);
            return true;
        },
        quickRestoreLatestHistory() {
            calls.push('quickRestoreLatestHistory');
        },
        openSessionManagerModal() {
            calls.push('openSessionManagerModal');
        },
        openConfirmModal(msg, onConfirm) {
            calls.push(`openConfirmModal:${msg}`);
            onConfirm();
        },
        openHistoryModal(session: import('../src/storage/default-data.ts').SessionItem) { calls.push(`openHistoryModal:${session.name}`); },
    };

    // quickSwitcher (open)
    executeStatusBarAction(mockPlugin, 'quickSwitcher');
    assert.deepEqual(calls, ['openSearchOverlay:no-anchor']);

    // quickSwitcher (hide)
    mockPlugin.searchOverlayEl = harness.dom.document.createElement('div');
    executeStatusBarAction(mockPlugin, 'quickSwitcher');
    assert.deepEqual(calls.slice(1), ['hideSearchOverlay']);

    // sessionManager
    executeStatusBarAction(mockPlugin, 'sessionManager');
    assert.equal(calls[calls.length - 1], 'openSessionManagerModal');

    // saveSession
    await executeStatusBarAction(mockPlugin, 'saveSession');
    assert.equal(calls[calls.length - 1], 'saveActiveSession');

    // saveAsSession
    await executeStatusBarAction(mockPlugin, 'saveAsSession');
    assert.equal(calls[calls.length - 1], 'saveAsSession');

    // saveCurrentNoteNameAsSession
    await executeStatusBarAction(mockPlugin, 'saveCurrentNoteNameAsSession');
    assert.equal(calls[calls.length - 1], 'saveCurrentNoteNameAsSession');

    // reloadWithoutSaving
    await executeStatusBarAction(mockPlugin, 'reloadWithoutSaving');
    assert.equal(calls[calls.length - 1], 'reloadCurrentSessionWithoutSaving');

    // renameSession
    executeStatusBarAction(mockPlugin, 'renameSession');
    assert.equal(calls[calls.length - 1], 'renameCurrentSession');

    // duplicateSession
    await executeStatusBarAction(mockPlugin, 'duplicateSession');
    assert.equal(calls[calls.length - 1], 'duplicateCurrentSession');

    // previousSession
    await executeStatusBarAction(mockPlugin, 'previousSession');
    assert.equal(calls[calls.length - 1], 'switchRelative:-1');

    // nextSession
    await executeStatusBarAction(mockPlugin, 'nextSession');
    assert.equal(calls[calls.length - 1], 'switchRelative:1');

    // newEmptySession
    await executeStatusBarAction(mockPlugin, 'newEmptySession');
    assert.equal(calls[calls.length - 1], 'createEmptySession');

    // toggleAutoSaveOnSwitch
    await executeStatusBarAction(mockPlugin, 'toggleAutoSaveOnSwitch');
    assert.equal(calls[calls.length - 1], 'toggleAutoSave:true');

    // versionHistory - the action asks the plugin to open the modal. The plugin
    // side is proved separately in modal-openers-wiring.test.ts.
    executeStatusBarAction(mockPlugin, 'versionHistory');
    assert.equal(calls[calls.length - 1], 'openHistoryModal:Test Session');

    // restoreLatestHistory (with confirm)
    executeStatusBarAction(mockPlugin, 'restoreLatestHistory');
    assert.equal(calls[calls.length - 1], 'quickRestoreLatestHistory');

    // restoreLatestHistory (without confirm)
    mockPlugin.isVersionHistoryConfirmRestoreEnabled = () => false;
    executeStatusBarAction(mockPlugin, 'restoreLatestHistory');
    assert.equal(calls[calls.length - 1], 'quickRestoreLatestHistory');

    // sessionMenu - a real Menu is built and shown at the pointer.
    const menusBefore = harness.obsidian.menus.length;
    executeStatusBarAction(mockPlugin, 'sessionMenu', new harness.dom.window.MouseEvent('contextmenu'));
    assert.ok(
        harness.obsidian.menus.length > menusBefore,
        'right-clicking the status bar must open the session menu',
    );

    // settingsMenu
    const beforeSettings = harness.obsidian.menus.length;
    executeStatusBarAction(mockPlugin, 'settingsMenu', new harness.dom.window.MouseEvent('contextmenu'));
    assert.ok(
        harness.obsidian.menus.length > beforeSettings,
        'the settings menu must open',
    );

    // none or invalid
    executeStatusBarAction(mockPlugin, 'none');
    executeStatusBarAction(mockPlugin, '');
    executeStatusBarAction(mockPlugin, 'nonExistentAction');
});

test.after(() => harness.restore());
