import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';

const harness = setupHarness();

const i18nMod = await import('../src/i18n.ts');
const i18n = (i18nMod.default ?? i18nMod) as { resolveLocale(l: string): void };
i18n.resolveLocale('en');

const overlaysMod = await import('../src/plugin/methods/overlays.js');
const attachOverlays = (overlaysMod.default ?? overlaysMod) as (cls: unknown) => void;

const sessionsMod = await import('../src/plugin/methods/sessions.js');
const attachSessions = (sessionsMod.default ?? sessionsMod) as (cls: unknown) => void;

const switchingMod = await import('../src/plugin/methods/session-switching.js');
const attachSwitching = (switchingMod.default ?? switchingMod) as (cls: unknown) => void;

interface TestPlugin {
    data: {
        activeSessionId: string;
        sessionOrder: string[];
        sessions: Record<string, { id: string; name: string; layout?: unknown }>;
        groups: Record<string, { id: string; name: string }>;
        groupOrder: string[];
        sessionGroups: Record<string, string>;
        activeGroupId: string | null;
        groupFeatureEnabled: boolean;
        [key: string]: unknown;
    };
    app: {
        workspace: {
            containerEl: HTMLElement;
        };
    };
    switchOverlayEl: HTMLElement | null;
    switchOverlayTimer: number | null;
    searchOverlayEl: HTMLElement | null;
    openSearchOverlay(anchorEl?: HTMLElement): void;
    hideSearchOverlay(): void;
    showSwitchPreviewOverlay(ordered: unknown[], index: number, viewGroupId?: string): void;
    showSwitchFeedbackOverlay(ordered: unknown[], index: number, viewGroupId?: string, options?: unknown): void;
    showSwitchOverlay(ordered: unknown[], activeIndex: number, viewGroupId?: string, options?: unknown): void;
    hideSwitchOverlay(): void;
    cleanupOverlayListeners(): void;
    filterSessionsByQuery(sessions: unknown[], query: string): unknown[];
    getOrderedGroups(): unknown[];
    getOrderedGroupTabIds(): string[];
    getOrderedSessionsUnfiltered(): unknown[];
    getCommandHotkey(cmd: string, slot?: number): string;
    isGroupFeatureEnabled(): boolean;
    getActiveSessionIndex(sessions: unknown[]): number;
    resolveGroupSelection(groupId: string | null): Promise<{ sessions: unknown[]; resolvedGroupId: string | null }>;
    switchSession(sessionId: string, options?: unknown): Promise<boolean>;
    getRelativeGroupId(currentGroupId: string | null, delta: number): string | null;
    [key: string]: unknown;
}

function createTestPlugin(): TestPlugin {
    function PluginMock() {}
    attachSessions(PluginMock);
    attachSwitching(PluginMock);
    attachOverlays(PluginMock);

    const plugin = new (PluginMock as unknown as { new(): TestPlugin })();
    plugin.data = {
        activeSessionId: 's1',
        sessionOrder: ['s1', 's2', 's3'],
        sessions: {
            s1: { id: 's1', name: 'Session 1' },
            s2: { id: 's2', name: 'Session 2' },
            s3: { id: 's3', name: 'Session 3' },
        },
        groups: {
            g1: { id: 'g1', name: 'Work' },
        },
        groupOrder: ['g1'],
        sessionGroups: {
            s1: 'g1',
        },
        activeGroupId: null,
        groupFeatureEnabled: true,
    };

    plugin.app = {
        workspace: {
            containerEl: harness.dom.container(),
        },
    };

    plugin.getCommandHotkey = (cmd: string): string => {
        if (cmd === 'next-session') return 'Ctrl+Tab';
        if (cmd === 'previous-session') return 'Ctrl+Shift+Tab';
        if (cmd === 'switch-to-1') return 'Ctrl+1';
        return '';
    };
    plugin.isAutoSaveOnSwitchEnabled = (): boolean => false;
    plugin.isWarnOnUnsavedSwitchEnabled = (): boolean => false;
    plugin.isVersionHistoryEnabled = (): boolean => false;
    plugin.syncSessionCommands = (): void => {};
    plugin.updateStatusBar = (): void => {};
    plugin.setGroupTabOrder = (): void => {};
    plugin.setSessionOrderFromVisible = (): void => {};

    return plugin;
}

test('overlays: filterSessionsByQuery filters matching session names case-insensitively', () => {
    const plugin = createTestPlugin();
    const sessions = [
        { id: '1', name: 'Main Note' },
        { id: '2', name: 'Work Project' },
        { id: '3', name: 'Personal' },
    ];
    const filtered = plugin.filterSessionsByQuery(sessions, 'work') as typeof sessions;
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]?.name, 'Work Project');

    const all = plugin.filterSessionsByQuery(sessions, '   ') as typeof sessions;
    assert.equal(all.length, 3);
});

test('overlays: showSwitchFeedbackOverlay renders, auto-dismisses on timeout and blur', async () => {
    const plugin = createTestPlugin();
    const ordered = [
        { id: 's1', name: 'Session 1' },
        { id: 's2', name: 'Session 2' },
    ];

    plugin.showSwitchFeedbackOverlay(ordered, 0, undefined, { durationMs: 50 });
    assert.ok(plugin.switchOverlayEl);
    assert.equal(document.querySelector('.wpp-switch-overlay') !== null, true);

    // Test window blur
    window.dispatchEvent(new window.Event('blur'));
    assert.equal(plugin.switchOverlayEl, null);
    assert.equal(document.querySelector('.wpp-switch-overlay'), null);
});

test('overlays: showSwitchOverlay renders items, groups, count, and footer hotkeys', async () => {
    const plugin = createTestPlugin();
    const ordered = [
        { id: 's1', name: 'Session 1' },
        { id: 's2', name: 'Session 2' },
    ];

    plugin.showSwitchOverlay(ordered, 1, 'g1', { mode: 'preview' });
    const overlay = plugin.switchOverlayEl;
    assert.ok(overlay);

    const count = overlay.querySelector('.wpp-switch-count');
    assert.equal(count?.textContent, '2 / 2');

    const groupTabs = overlay.querySelectorAll('.wpp-group-tab');
    assert.equal(groupTabs.length, 2); // All + Work
    assert.equal(groupTabs[1]?.classList.contains('is-active'), true); // g1 active

    const items = overlay.querySelectorAll('.wpp-switch-item');
    assert.equal(items.length, 2);
    assert.equal(items[1]?.classList.contains('is-active'), true);

    // Click on active session hides overlay
    items[0]?.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assert.equal(plugin.switchOverlayEl, null);
});

test('overlays: showSwitchOverlay click inactive session switches session', async () => {
    const plugin = createTestPlugin();
    let switchedTo: string | null = null;
    plugin.switchSession = async (id: string) => {
        switchedTo = id;
        return true;
    };

    const ordered = [
        { id: 's1', name: 'Session 1' },
        { id: 's2', name: 'Session 2' },
    ];

    plugin.showSwitchOverlay(ordered, 0, undefined, { mode: 'preview' });
    const items = plugin.switchOverlayEl?.querySelectorAll('.wpp-switch-item');
    items?.[1]?.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

    // Wait for switchSession promise to resolve
    await new Promise((r) => setTimeout(r, 10));
    assert.equal(switchedTo, 's2');
    assert.equal(plugin.switchOverlayEl, null);
});

test('overlays: showSwitchOverlay group tab click resolves and reopens for group', async () => {
    const plugin = createTestPlugin();
    let resolvedGroup: string | null = null;
    plugin.resolveGroupSelection = async (gid: string | null) => {
        resolvedGroup = gid;
        return {
            sessions: [{ id: 's1', name: 'Session 1' }],
            resolvedGroupId: gid,
        };
    };

    const ordered = [
        { id: 's1', name: 'Session 1' },
        { id: 's2', name: 'Session 2' },
    ];

    plugin.showSwitchOverlay(ordered, 0, undefined, { mode: 'preview' });
    const groupTabs = plugin.switchOverlayEl?.querySelectorAll('.wpp-group-tab');

    // Click Work tab (g1)
    groupTabs?.[1]?.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 10));
    assert.equal(resolvedGroup, 'g1');

    // Click All tab (__all__)
    groupTabs?.[0]?.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 10));
    assert.equal(resolvedGroup, null);

    plugin.hideSwitchOverlay();
});

test('overlays: keyboard events (Tab group cycling and keyup dismissal)', async () => {
    const plugin = createTestPlugin();
    plugin.getRelativeGroupId = () => 'g1';
    let resolvedGroup: string | null = null;
    plugin.resolveGroupSelection = async (gid: string | null) => {
        resolvedGroup = gid;
        return {
            sessions: [{ id: 's1', name: 'Session 1' }],
            resolvedGroupId: gid,
        };
    };

    const ordered = [
        { id: 's1', name: 'Session 1' },
        { id: 's2', name: 'Session 2' },
    ];

    plugin.showSwitchPreviewOverlay(ordered, 0, undefined);

    // Keydown non-Tab resets safety timer
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowDown' }));

    // Keydown Shift+Tab
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }));
    await new Promise((r) => setTimeout(r, 10));
    assert.equal(resolvedGroup, 'g1');

    // Keyup when modifier released dismisses
    document.dispatchEvent(new window.KeyboardEvent('keyup', { ctrlKey: false, metaKey: false, shiftKey: false }));
    // Wait for minDelay
    await new Promise((r) => setTimeout(r, 350));
    assert.equal(plugin.switchOverlayEl, null);
});

test('overlays: measurement mode when allSessions.length > ordered.length', () => {
    const plugin = createTestPlugin();
    const ordered = [
        { id: 's1', name: 'Session 1' },
    ];
    // allSessions will return 3 sessions from plugin.getOrderedSessionsUnfiltered()
    plugin.showSwitchOverlay(ordered, 0, 'g1', { mode: 'preview' });
    assert.ok(plugin.switchOverlayEl);
    plugin.hideSwitchOverlay();
});

test('overlays: openSearchOverlay handles save button and close button', async () => {
    const plugin = createTestPlugin();
    plugin.persistData = async () => {};
    let createdWithName: string | null = null;
    plugin.createSessionForViewedGroup = async (name: string, _gid: string | null) => {
        createdWithName = name;
        return {
            created: true,
            name,
            viewGroupId: null,
        };
    };

    plugin.openSearchOverlay();
    assert.ok(plugin.searchOverlayEl);

    // Save button click
    const saveInput = plugin.searchOverlayEl.querySelector<HTMLInputElement>('.wpp-save-input');
    const saveBtn = plugin.searchOverlayEl.querySelector<HTMLButtonElement>('.wpp-save-btn');
    if (saveInput && saveBtn) {
        saveInput.value = 'New Test Session';
        saveBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        await new Promise((r) => setTimeout(r, 10));
        assert.equal(createdWithName, 'New Test Session');
    }
    plugin.hideSearchOverlay();
});

test('overlays: openSearchOverlay handles search input, item actions, contextmenu, mouseenter', async () => {
    const plugin = createTestPlugin();
    plugin.persistData = async () => {};
    plugin.saveActiveSession = async () => {};
    plugin.reloadCurrentSessionWithoutSaving = () => {};
    plugin.data.confirmQuickActions = true;

    plugin.openSearchOverlay();
    assert.ok(plugin.searchOverlayEl);

    // Search input filter
    const searchInput = plugin.searchOverlayEl.querySelector<HTMLInputElement>('.wpp-search-input');
    if (searchInput) {
        searchInput.value = 'Session 1';
        searchInput.dispatchEvent(new window.Event('input'));
    }

    // Header drag
    const header = plugin.searchOverlayEl.querySelector('.wpp-search-header');
    if (header) {
        header.dispatchEvent(new window.MouseEvent('mousedown', { button: 0, clientX: 10, clientY: 10 }));
        document.dispatchEvent(new window.MouseEvent('mousemove', { clientX: 50, clientY: 50 }));
        document.dispatchEvent(new window.MouseEvent('mouseup', { clientX: 50, clientY: 50 }));
    }

    // Active item action icons
    const activeItem = plugin.searchOverlayEl.querySelector('.wpp-switch-item');
    if (activeItem) {
        activeItem.dispatchEvent(new window.MouseEvent('mouseenter'));
        activeItem.dispatchEvent(new window.MouseEvent('contextmenu'));

        const actionBtns = activeItem.querySelectorAll('.wpp-qs-action-btn');
        actionBtns.forEach((btn: Element) => {
            btn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        });
    }

    // Resize handle drag
    const resizeHandle = plugin.searchOverlayEl.querySelector('.wpp-resize-corner');
    if (resizeHandle) {
        resizeHandle.dispatchEvent(new window.MouseEvent('mousedown', { button: 0, clientX: 10, clientY: 10 }));
        document.dispatchEvent(new window.MouseEvent('mousemove', { clientX: 20, clientY: 20 }));
        document.dispatchEvent(new window.MouseEvent('mouseup', { clientX: 20, clientY: 20 }));
    }

    const edgeHandle = plugin.searchOverlayEl.querySelector('.wpp-resize-edge');
    if (edgeHandle) {
        edgeHandle.dispatchEvent(new window.MouseEvent('mousedown', { button: 0, clientX: 10, clientY: 10 }));
        document.dispatchEvent(new window.MouseEvent('mousemove', { clientX: 20, clientY: 30 }));
        document.dispatchEvent(new window.MouseEvent('mouseup', { clientX: 20, clientY: 30 }));
    }

    // Empty area reposition drag
    plugin.searchOverlayEl.dispatchEvent(new window.MouseEvent('mousedown', { button: 0, clientX: 10, clientY: 10 }));
    document.dispatchEvent(new window.MouseEvent('mousemove', { clientX: 30, clientY: 30 }));
    document.dispatchEvent(new window.MouseEvent('mouseup', { clientX: 30, clientY: 30 }));

    // Click add group button
    const addBtn = plugin.searchOverlayEl.querySelector('.wpp-group-add-btn');
    addBtn?.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

    // Group tab horizontal drag to reorder
    const groupTabEl = plugin.searchOverlayEl.querySelector('.wpp-group-tab');
    if (groupTabEl) {
        groupTabEl.dispatchEvent(new window.MouseEvent('mousedown', { button: 0, clientX: 10, clientY: 10 }));
        document.dispatchEvent(new window.MouseEvent('mousemove', { clientX: 150, clientY: 10 }));
        document.dispatchEvent(new window.MouseEvent('mouseup', { clientX: 150, clientY: 10 }));
    }

    // Click group tab
    const groupTabs = plugin.searchOverlayEl.querySelectorAll('.wpp-group-tab');
    groupTabs?.[0]?.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

    // Double click to reset size
    plugin.searchOverlayEl.dispatchEvent(new window.MouseEvent('dblclick'));

    // Right-click empty area contextmenu
    plugin.searchOverlayEl.dispatchEvent(new window.MouseEvent('contextmenu'));

    // Keyboard navigation in search overlay
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowDown' }));
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowUp' }));

    // Click outside dismisses
    plugin.hideSearchOverlay();
    assert.equal(plugin.searchOverlayEl, null);

    // Test session-create focusTarget and Enter key on save input
    plugin.data.searchOverlayFocusTarget = 'session-create';
    plugin.openSearchOverlay();
    const saveInputEl = (plugin.searchOverlayEl as HTMLElement | null)?.querySelector<HTMLInputElement>('.wpp-save-input');
    if (saveInputEl) {
        saveInputEl.value = 'Enter Saved Session';
        saveInputEl.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter' }));
    }
    // Dismiss search overlay
    plugin.hideSearchOverlay();
    assert.equal(plugin.searchOverlayEl, null);
});

test('overlays: group feature disabled branches and anchor positioning', () => {
    const plugin = createTestPlugin();
    plugin.data.groupFeatureEnabled = false;

    // Anchor with status bar parent
    const statusBar = document.createElement('div');
    statusBar.className = 'status-bar';
    statusBar.getBoundingClientRect = () => ({
        left: 0,
        right: 1000,
        top: 700,
        bottom: 728,
        width: 1000,
        height: 28,
        x: 0,
        y: 700,
        toJSON: () => {},
    });
    const anchor = document.createElement('div');
    anchor.getBoundingClientRect = () => ({
        left: 500,
        right: 550,
        top: 700,
        bottom: 728,
        width: 50,
        height: 28,
        x: 500,
        y: 700,
        toJSON: () => {},
    });
    statusBar.appendChild(anchor);
    document.body.appendChild(statusBar);

    plugin.openSearchOverlay(anchor);
    assert.ok(plugin.searchOverlayEl);
    plugin.hideSearchOverlay();

    // Switch overlay with empty sessions and group feature disabled
    plugin.showSwitchOverlay([], 0, undefined, { mode: 'preview' });
    assert.ok(plugin.switchOverlayEl);
    plugin.hideSwitchOverlay();

    statusBar.remove();
});

test('overlays: property shims and cleanupOverlayListeners wrapper', () => {
    const plugin = createTestPlugin();
    plugin.switchOverlayEl = null;
    assert.equal(plugin.switchOverlayEl, null);

    plugin.switchOverlayViewGroupId = 'g1';
    assert.equal(plugin.switchOverlayViewGroupId, 'g1');

    plugin.switchOverlayTimer = 123;
    assert.equal(plugin.switchOverlayTimer, 123);

    const fn = (): void => {};
    plugin.overlayKeyUpHandler = fn;
    assert.equal(plugin.overlayKeyUpHandler, fn);

    plugin.overlayKeyDownHandler = fn;
    assert.equal(plugin.overlayKeyDownHandler, fn);

    plugin.overlayBlurHandler = fn;
    assert.equal(plugin.overlayBlurHandler, fn);

    plugin.cleanupOverlayListeners();
});

test.after(() => harness.restore());

