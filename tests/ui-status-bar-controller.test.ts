import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';
import { DEFAULT_DATA } from '../src/storage/default-data.ts';

const harness = setupHarness();
// Loaded after the harness: settings-state reaches utils.ts, which imports
// 'obsidian' statically, and the stub does not exist until setupHarness() runs.
const { SettingsState } = await import('../src/state/settings-state.ts');
const {
    StatusBarController,
    getStatusBarScrollConfig,
    matchesStatusBarScrollModifier,
    getClickSlot,
    getMiddleClickSlot,
    getRightClickSlot,
    getStatusBarAction,
    executeStatusBarSlot,
    normalizeWheelDeltaY,
    handleStatusBarWheel,
    setupStatusBar,
    STATUS_BAR_SCROLL_PRESETS,
} = await import('../src/statusbar-controller.ts');

function createWheelEvt(deltaY: number, deltaX = 0): WheelEvent {
    return {
        deltaY,
        deltaX,
        deltaMode: 0,
        metaKey: false,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        preventDefault() {},
        stopPropagation() {},
    } as unknown as WheelEvent;
}

// Right-clicking the status bar builds the real session menu, so the host has
// to answer what that menu asks.
const menuPluginStubs = {
    manifest: { id: 'workspace-plus-plus', name: 'Workspace++' },
    _lastRotationBackupAt: 0,
    confirmOverwriteSessionWithCurrentLayout: () => false,
    duplicateSession: async () => false,
    renameSessionById: async () => false,
    deleteSession: async () => false,
    isAutoSaveOnSwitchEnabled: () => false,
    isVersionHistoryEnabled: () => false,
    isWarnOnUnsavedSwitchEnabled: () => false,
    moveSessionToGroupExclusive: async () => false,
    reloadCurrentSessionWithoutSaving: async () => false,
    removeSessionFromGroup: async () => false,
    saveActiveSession: async () => false,
    saveAsSession: async () => false,
    extractFilePathsFromLayout: () => [],
    countPanesInLayout: () => 0,
    restoreFromHistoryEntry: async () => false,
    setAutoSaveOnSwitch: async () => false,
    setConfirmDeleteByHotkey: async () => false,
    setConfirmQuickActions: async () => false,
    setGroupFeatureEnabled: async () => false,
    setShowFilterInput: async () => false,
    setVersionHistoryEnabled: async () => false,
    setWarnOnUnsavedSwitch: async () => false,
    // The settings the status bar reaches are owned by the store, so the double
    // hands over a real one rather than restating its setters.
    // The settings the status bar reaches are owned by the store, so the double
    // hands over a real one rather than restating its setters. These tests do
    // not assert on settings writes, so it gets its own data.
    getSettingsState: (): InstanceType<typeof SettingsState> => new SettingsState({
        data: Object.assign({}, DEFAULT_DATA),
        persistData: async (): Promise<boolean> => true,
    }),
    extractSessionData: () => ({}),
    prepareRotationBackupData: () => ({}),
    ensureDir: async () => {},
    getBackupsDirPath: () => 'backups',
    copyFileIfExists: async () => {},
    getRotationBackupPath: (generation: number) => `backups/sessions.${generation}.json`,
    writeJson: async () => {},
};

test('StatusBarController: preset configs and normalization', () => {
    assert.deepEqual(getStatusBarScrollConfig({ statusBarScrollPreset: 'notchedWheel' }), STATUS_BAR_SCROLL_PRESETS.notchedWheel);
    assert.deepEqual(getStatusBarScrollConfig({ statusBarScrollPreset: 'freeSpinWheel' }), STATUS_BAR_SCROLL_PRESETS.freeSpinWheel);
    assert.deepEqual(getStatusBarScrollConfig({ statusBarScrollPreset: 'trackpad' }), STATUS_BAR_SCROLL_PRESETS.trackpad);
    assert.deepEqual(getStatusBarScrollConfig(null), STATUS_BAR_SCROLL_PRESETS.trackpad);
    assert.deepEqual(getStatusBarScrollConfig({
        statusBarScrollPreset: 'custom',
        statusBarScrollThreshold: 45,
        statusBarScrollCooldownMs: 600,
        statusBarScrollResetMs: 300,
    }), {
        threshold: 45,
        cooldownMs: 600,
        resetMs: 300,
    });

    const evt1 = { deltaY: 2, deltaMode: 0 } as WheelEvent;
    const evt2 = { deltaY: 2, deltaMode: 1 } as WheelEvent;
    const evt3 = { deltaY: 2, deltaMode: 2 } as WheelEvent;
    assert.equal(normalizeWheelDeltaY(evt1), 2);
    assert.equal(normalizeWheelDeltaY(evt2), 32);
    assert.equal(normalizeWheelDeltaY(evt3), 480);
});

test('StatusBarController: matches scroll modifier modes', () => {
    const regular = { metaKey: false, ctrlKey: false, altKey: false } as MouseEvent;
    const macMod = { metaKey: true, ctrlKey: false, altKey: false } as MouseEvent;
    const winMod = { metaKey: false, ctrlKey: true, altKey: false } as MouseEvent;
    const alt = { metaKey: false, ctrlKey: false, altKey: true } as MouseEvent;

    assert.equal(matchesStatusBarScrollModifier(regular, true, 'none'), true);
    assert.equal(matchesStatusBarScrollModifier(macMod, true, 'none'), false);
    assert.equal(matchesStatusBarScrollModifier(macMod, true, 'modOnly'), true);
    assert.equal(matchesStatusBarScrollModifier(winMod, false, 'modOnly'), true);
    assert.equal(matchesStatusBarScrollModifier(alt, true, 'altOnly'), true);
    assert.equal(matchesStatusBarScrollModifier(macMod, true, 'modOrAlt'), true);
    assert.equal(matchesStatusBarScrollModifier(alt, true, 'modOrAlt'), true);
    assert.equal(matchesStatusBarScrollModifier(regular, true, 'other'), false);
});

test('StatusBarController: resolves slots and actions', () => {
    const regular = { metaKey: false, ctrlKey: false, altKey: false, shiftKey: false } as MouseEvent;
    const alt = { metaKey: false, ctrlKey: false, altKey: true, shiftKey: false } as MouseEvent;
    const shift = { metaKey: false, ctrlKey: false, altKey: false, shiftKey: true } as MouseEvent;

    assert.equal(getClickSlot(regular), 'click');
    assert.equal(getClickSlot(alt), 'altClick');
    assert.equal(getClickSlot(shift), 'shiftClick');
    const mod = { metaKey: true, ctrlKey: false, altKey: false, shiftKey: false } as MouseEvent;
    assert.equal(getClickSlot(mod), 'modClick');
    assert.equal(getMiddleClickSlot(regular), 'middleClick');
    assert.equal(getMiddleClickSlot(alt), 'altMiddleClick');
    assert.equal(getMiddleClickSlot(mod), 'modMiddleClick');
    assert.equal(getMiddleClickSlot(shift), 'shiftMiddleClick');
    assert.equal(getRightClickSlot(regular), 'rightClick');
    assert.equal(getRightClickSlot(alt), 'altRightClick');
    assert.equal(getRightClickSlot(mod), 'modRightClick');
    assert.equal(getRightClickSlot(shift), 'shiftRightClick');

    const data = {
        ...DEFAULT_DATA,
        statusBarActions: {
            ...DEFAULT_DATA.statusBarActions,
            click: 'quickSwitcher',
        },
    };
    assert.equal(getStatusBarAction({ data }, 'click'), 'quickSwitcher');
    assert.equal(getStatusBarAction({ data }, 'nonExistent'), 'none');
    assert.equal(getStatusBarAction({}, 'click'), 'none');
});

test('StatusBarController: wheel accumulation and threshold switching', async () => {
    const switchedDirections: number[] = [];
    const host: import('../src/statusbar-controller.ts').StatusBarControllerHost = {
        ...menuPluginStubs,
        openSessionManagerModal() {},
        openHistoryModal() {},
        data: {
            ...DEFAULT_DATA,
            statusBarModScrollSwitch: true,
            statusBarScrollPreset: 'custom',
            statusBarScrollThreshold: 20,
            statusBarScrollCooldownMs: 400,
            statusBarScrollResetMs: 200,
            statusBarScrollModifierMode: 'none',
            statusBarScrollInvert: false,
        },
        app: {} as import('obsidian').App,
        addStatusBarItem() {
            return harness.dom.document.createElement('div');
        },
        getActiveSession() {
            return { id: 's1', name: 'Work', layout: {} };
        },
        getActiveGroup() {
            return null;
        },
        shouldShowUnsavedStatusBarHighlight() {
            return false;
        },
        // Group calls go through getGroupStore(). This double carries the group
        // members itself, so it stands in as its own group store.
        getGroupStore(): never { return this as never; },
        isGroupFeatureEnabled() {
            return false;
        },
        getOrderedGroups() {
            return [];
        },
        isVersionHistoryEnabled() {
            return false;
        },
        isVersionHistoryConfirmRestoreEnabled() {
            return false;
        },
        updateStatusBar() {},
        hideSearchOverlay() {},
        openSearchOverlay() {},
        saveActiveSession: async () => true,
        saveAsSession: async () => true,
        saveCurrentNoteNameAsSession: async () => true,
        reloadCurrentSessionWithoutSaving: async () => true,
        renameCurrentSession() {},
        duplicateCurrentSession: async () => true,
        switchRelativeFromStatusBar: async () => true,
        createEmptySession: async () => true,
        toggleAutoSaveOnSwitch: async () => true,
        quickRestoreLatestHistory() {},
        switchRelativeFromScroll: async (dir) => {
            switchedDirections.push(dir);
            return true;
        },
    };

    const controller = new StatusBarController(host);
    assert.equal(controller.scrollDelta, 0);
    assert.equal(controller.scrollEventAt, 0);
    assert.equal(controller.scrollSwitchAt, 0);

    const preventCalls: string[] = [];
    const createEvt = (deltaY: number, deltaX = 0) => ({
        deltaY,
        deltaX,
        deltaMode: 0,
        metaKey: false,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        preventDefault: () => { preventCalls.push('prevent'); },
        stopPropagation: () => { preventCalls.push('stop'); },
    } as unknown as WheelEvent);

    // Delta too small
    assert.equal(controller.handleWheel(createEvt(10), 1000), false);
    assert.equal(controller.scrollDelta, 10);
    assert.equal(controller.scrollEventAt, 1000);

    // Delta reaches threshold (10 + 15 = 25 >= 20)
    assert.equal(controller.handleWheel(createEvt(15), 1050), true);
    assert.equal(controller.scrollDelta, 0);
    assert.equal(controller.scrollSwitchAt, 1050);
    assert.deepEqual(switchedDirections, [1]);

    // In cooldown (< 400ms)
    assert.equal(controller.handleWheel(createEvt(30), 1200), false);

    // Reset after idle (> 200ms)
    assert.equal(controller.handleWheel(createEvt(10), 1500), false);
    assert.equal(controller.scrollDelta, 10);
    assert.equal(controller.handleWheel(createEvt(5), 1800), false); // resetMs elapsed (300ms > 200ms) -> resets to 0 + 5 = 5
    assert.equal(controller.scrollDelta, 5);

    // Inverted scroll
    host.data.statusBarScrollInvert = true;
    assert.equal(controller.handleWheel(createEvt(20), 2300), true);
    assert.deepEqual(switchedDirections, [1, -1]);

    // isSwitching session returns false
    host.getSessionSwitcher = () => ({ isSwitching: true });
    assert.equal(controller.handleWheel(createEvt(20), 3000), false);
    host.getSessionSwitcher = () => ({ isSwitching: false });

    // Disabled mod scroll
    host.data.statusBarModScrollSwitch = false;
    assert.equal(controller.handleWheel(createEvt(20), 3500), false);
    host.data.statusBarModScrollSwitch = true;

    // DeltaX > DeltaY ignored
    assert.equal(controller.handleWheel(createEvt(5, 10), 4000), false);

    // Top-level handleStatusBarWheel
    assert.equal(handleStatusBarWheel(host, createEvt(20), 5000), true);
    host.getStatusBarController = () => controller;
    assert.equal(handleStatusBarWheel(host, createEvt(20), 6000), true);
});

test('StatusBarController: setup and update DOM rendering', () => {
    const doc = harness.dom.document;
    const el = doc.createElement('div');
    (el as unknown as { addClass: (c: string) => void }).addClass = (cls: string) => el.classList.add(cls);
    (el as unknown as { removeClass: (c: string) => void }).removeClass = (cls: string) => el.classList.remove(cls);
    (el as unknown as { empty: () => void }).empty = () => { el.innerHTML = ''; };
    (el as unknown as { createSpan: (opts?: { text?: string; cls?: string }) => HTMLElement }).createSpan = (opts) => {
        const span = doc.createElement('span');
        if (opts?.cls) span.className = opts.cls;
        if (opts?.text) span.textContent = opts.text;
        el.appendChild(span);
        return span;
    };

    let unsaved = false;
    let activeSession: import('../src/storage/default-data.ts').SessionItem | null = { id: 's1', name: 'Work', layout: {} };
    let activeGroup: { id: string; name: string } | null = { id: 'g1', name: 'Main' };

    const host: import('../src/statusbar-controller.ts').StatusBarControllerHost = {
        ...menuPluginStubs,
        openSessionManagerModal() {},
        openHistoryModal() {},
        // Group calls go through the store; this literal supplies just the two
        // members the controller reaches.
        getGroupStore(): never {
            return {
                isGroupFeatureEnabled: () => true,
                getActiveGroup: () => activeGroup,
                getOrderedGroups: () => (activeGroup ? [activeGroup] : []),
                setActiveGroup: async () => true,
                exitGroup: async () => true,
            } as never;
        },
        data: DEFAULT_DATA,
        app: {} as import('obsidian').App,
        addStatusBarItem: () => el,
        getActiveSession: () => activeSession,
        getActiveGroup: () => activeGroup,
        shouldShowUnsavedStatusBarHighlight: () => unsaved,
        isGroupFeatureEnabled: () => true,
        getOrderedGroups: () => [],
        isVersionHistoryEnabled: () => false,
        isVersionHistoryConfirmRestoreEnabled: () => false,
        updateStatusBar() {},
        hideSearchOverlay() {},
        openSearchOverlay() {},
        saveActiveSession: async () => true,
        saveAsSession: async () => true,
        saveCurrentNoteNameAsSession: async () => true,
        reloadCurrentSessionWithoutSaving: async () => true,
        renameCurrentSession() {},
        duplicateCurrentSession: async () => true,
        switchRelativeFromStatusBar: async () => true,
        createEmptySession: async () => true,
        toggleAutoSaveOnSwitch: async () => true,
        quickRestoreLatestHistory() {},
        switchRelativeFromScroll: async () => true,
    };

    const controller = new StatusBarController(() => host);
    const createdEl = controller.setupStatusBar();
    assert.equal(createdEl, el);
    assert.ok(el.classList.contains('wpp-status-bar'));

    // Top-level setupStatusBar
    delete host.getStatusBarController;
    const topEl = setupStatusBar(host);
    assert.equal(topEl, el);

    // registerDomEvent wiring and DOM event triggers
    const listeners: Record<string, (e: unknown) => void> = {};
    host.registerDomEvent = (_target, type, handler) => {
        listeners[type] = handler as (e: unknown) => void;
    };
    controller.setupStatusBar();
    listeners.click?.({ preventDefault() {}, stopPropagation() {} });
    listeners.auxclick?.({ button: 1, preventDefault() {}, stopPropagation() {} });
    listeners.auxclick?.({ button: 0, preventDefault() {}, stopPropagation() {} });
    listeners.contextmenu?.({ preventDefault() {}, stopPropagation() {} });
    listeners.wheel?.(createWheelEvt(10));

    // executeStatusBarSlot tests
    const dummyEvt = {
        preventDefault() {},
        stopPropagation() {},
    } as unknown as MouseEvent;
    executeStatusBarSlot(host, 'nonExistentSlot', dummyEvt);
    executeStatusBarSlot(host, 'click', dummyEvt, { preventDefault: false });

    // Update with unsaved highlight
    unsaved = true;
    controller.updateStatusBar();
    assert.ok(el.classList.contains('wpp-status-bar-unsaved'));

    // Update without session and group
    unsaved = false;
    activeSession = null;
    activeGroup = null;
    controller.updateStatusBar();
    assert.equal(el.classList.contains('wpp-status-bar-unsaved'), false);
});

test.after(() => harness.restore());
