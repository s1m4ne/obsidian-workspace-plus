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
    notifySessionsChanged(): void;
    persistData(): Promise<void>;
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
    findActiveSessionIndex(sessions: unknown[]): number;
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
    plugin.persistData = async (): Promise<void> => {};

    return plugin;
}

test('searching matches session names regardless of case', () => {
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

test('the feedback overlay dismisses itself on its timer and when the window loses focus', async () => {
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

test('the overlay lists every session in the group with its position and hotkeys', async () => {
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

test('the overlay shows no active position when the active session is outside its list', () => {
    const plugin = createTestPlugin();
    plugin.data.activeSessionId = 'orphan-session';
    const ordered = [
        { id: 's1', name: 'Session 1' },
        { id: 's2', name: 'Session 2' },
        { id: 's3', name: 'Session 3' },
    ];

    plugin.showSwitchOverlay(ordered, plugin.findActiveSessionIndex(ordered), 'g1', { mode: 'preview' });
    const overlay = plugin.switchOverlayEl;
    assert.ok(overlay);
    assert.equal(overlay.querySelector('.wpp-switch-count')?.textContent, '– / 3');
    assert.equal(overlay.querySelectorAll('.wpp-switch-item.is-active').length, 0);
    plugin.hideSwitchOverlay();
});

test('clicking a session in the overlay switches to it', async () => {
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

test('clicking a group tab shows the sessions in that group', async () => {
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

test('Tab cycles groups, and releasing the modifiers dismisses the overlay', async () => {
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

test('the overlay is sized against every session so it does not resize while cycling', () => {
    const plugin = createTestPlugin();
    const ordered = [
        { id: 's1', name: 'Session 1' },
    ];

    // Viewing one group out of three is what reaches the measuring branch:
    // getOrderedSessionsUnfiltered() answers with all three sessions.
    //
    // The element it measures in has to carry the overlay's own class. Measured
    // inside a bare div it loses the flex layout and the padding, comes back as
    // wide as the viewport, and that width is written into min-width - the
    // overlay stretched edge to edge in every group but "All". jsdom does no
    // layout, so the width itself cannot be asserted here; the class list can,
    // and it is the thing that was missing.
    const measured: string[] = [];
    const body = harness.dom.document.body as unknown as {
        createDiv(opts?: { cls?: string }): HTMLElement;
    };
    const realCreateDiv = body.createDiv.bind(body);
    body.createDiv = (opts?: { cls?: string }): HTMLElement => {
        if (opts?.cls) measured.push(opts.cls);
        return realCreateDiv(opts);
    };

    try {
        plugin.showSwitchOverlay(ordered, 0, 'g1', { mode: 'preview' });
    } finally {
        body.createDiv = realCreateDiv;
    }

    assert.ok(plugin.switchOverlayEl);
    const measureClasses = measured.find((cls) => cls.includes('wpp-measure-overlay'));
    assert.ok(measureClasses, 'the measuring element must be created');
    assert.ok(
        measureClasses.includes('wpp-switch-overlay'),
        'and must be laid out like the overlay it is measuring for',
    );
    plugin.hideSwitchOverlay();
});

test('the search overlay saves the current layout and closes', async () => {
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

test('the search overlay filters as you type and offers per-row actions', async () => {
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

test('with groups switched off no group strip appears, and the overlay anchors to the status bar', () => {
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
    assert.equal(plugin.searchOverlayEl.style.left, '525px');
    assert.equal(plugin.searchOverlayEl.style.bottom, '36px');
    plugin.hideSearchOverlay();

    // Switch overlay with empty sessions and group feature disabled
    plugin.showSwitchOverlay([], 0, undefined, { mode: 'preview' });
    assert.ok(plugin.switchOverlayEl);
    plugin.hideSwitchOverlay();

    statusBar.remove();
});

test('the plugin overlay properties read through to the controller', () => {
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


// Two guarantees about timing that nothing was holding. Both were verified by
// mutation: removing the 300 ms floor, and stretching the 5 s fallback, left
// every test in the suite passing.

test('releasing the modifiers immediately still leaves the overlay up for 300ms', async () => {
    const plugin = createTestPlugin();
    const ordered = [
        { id: 's1', name: 'Session 1' },
        { id: 's2', name: 'Session 2' },
    ];

    plugin.showSwitchOverlay(ordered, 0, undefined, { mode: 'preview' });
    assert.ok(plugin.switchOverlayEl, 'the overlay opens');

    // A fast tap: the keys come up almost immediately. Hiding on the spot makes
    // the overlay flash, so it has to stay for the rest of the 300 ms.
    harness.dom.document.dispatchEvent(
        new harness.dom.window.KeyboardEvent('keyup', { key: 'Meta', metaKey: false, shiftKey: false })
    );

    assert.ok(plugin.switchOverlayEl, 'and does not vanish the instant the keys come up');

    await new Promise((resolve) => setTimeout(resolve, 350));
    assert.equal(plugin.switchOverlayEl, null, 'but it is gone once the floor has passed');
});

test('an overlay whose keyup never arrives is dismissed by the safety timer', async () => {
    const plugin = createTestPlugin();
    const ordered = [{ id: 's1', name: 'Session 1' }];

    // The keyup can be lost - the window can take focus mid-hold, or the OS can
    // swallow it. Without the fallback the overlay stays on screen with no way
    // to dismiss it short of reloading.
    const win = harness.dom.window;
    const realSetTimeout = win.setTimeout.bind(win);
    let longestDelay = -1;
    win.setTimeout = ((fn: () => void, ms: number) => {
        if (ms > longestDelay) longestDelay = ms;
        return realSetTimeout(fn, ms);
    }) as typeof win.setTimeout;

    try {
        plugin.showSwitchOverlay(ordered, 0, undefined, { mode: 'preview' });
    } finally {
        win.setTimeout = realSetTimeout;
    }

    assert.equal(longestDelay, 5000, 'the fallback is armed, at a delay a person would wait out');
    plugin.hideSwitchOverlay();
});

// Three behaviours in the moved search overlay that nothing was holding. All
// three were verified by mutation: zeroing the status-bar fallback height,
// raising the minimum width past any saved size, and renaming the dblclick
// event all left the whole suite passing.

test('a saved size smaller than the minimum is opened at the minimum', () => {
    const plugin = createTestPlugin();
    // What a person gets after dragging the overlay down to nothing and
    // reopening it: too small to use, and no way back except the reset.
    plugin.data.searchOverlaySize = { width: 10, height: 10 };

    plugin.openSearchOverlay();

    const el = plugin.searchOverlayEl;
    assert.ok(el);
    assert.equal(el.style.width, '220px', 'width is floored');
    assert.equal(el.style.height, '140px', 'height is floored');
    plugin.hideSearchOverlay();
});

test('double-clicking the background forgets the saved position and size', () => {
    const plugin = createTestPlugin();
    plugin.data.searchOverlayPosition = { left: 10, bottom: 10 };
    plugin.data.searchOverlaySize = { width: 500, height: 400 };

    plugin.openSearchOverlay();
    const el = plugin.searchOverlayEl;
    assert.ok(el);
    el.dispatchEvent(new harness.dom.window.MouseEvent('dblclick', { bubbles: true }));

    assert.equal(plugin.data.searchOverlayPosition, null, 'the saved position is cleared');
    assert.equal(plugin.data.searchOverlaySize, null, 'and so is the saved size');
    plugin.hideSearchOverlay();
});

test('the overlay clears the status bar even when its height cannot be read', () => {
    const plugin = createTestPlugin();
    // jsdom reports every element as zero-sized, which is also what happens in
    // Obsidian when the status bar is hidden. The fallback height is what keeps
    // the overlay from sitting on top of it.
    plugin.openSearchOverlay();

    const el = plugin.searchOverlayEl;
    assert.ok(el);
    assert.equal(el.style.bottom, '36px', 'bottom = fallback bar height 28 + margin 8');
    plugin.hideSearchOverlay();
});

test('a session created while the search overlay is open appears in it (#118)', () => {
    const plugin = createTestPlugin();
    plugin.openSearchOverlay();

    const names = (): string[] =>
        Array.from(plugin.searchOverlayEl?.querySelectorAll('.wpp-switch-name') ?? [])
            .map((n) => n.textContent ?? '');
    const before = names().length;

    // What Cmd+Shift+M does from under the open overlay: the set changes, and
    // the store says so. Nothing about the command names the overlay.
    plugin.data.sessions['s9'] = { id: 's9', name: 'Nine' };
    plugin.data.sessionOrder.push('s9');
    plugin.notifySessionsChanged();

    assert.equal(names().length, before + 1, 'the overlay must redraw itself');
    assert.ok(names().includes('Nine'));
    plugin.hideSearchOverlay();
});

test('a closed search overlay stops listening', () => {
    const plugin = createTestPlugin();
    plugin.openSearchOverlay();
    plugin.hideSearchOverlay();

    plugin.data.sessions['s8'] = { id: 's8', name: 'Eight' };
    plugin.data.sessionOrder.push('s8');
    plugin.notifySessionsChanged();

    assert.equal(plugin.searchOverlayEl, null, 'a notification must not bring it back');
});

test('opening and closing the search overlay leaves no listeners behind (P7)', () => {
    // The point of moving 23 manual addEventListener calls onto
    // Component.registerDomEvent: closing has to detach every one of them.
    // Counting the document's own registrations is the only way to see it -
    // a leak here is invisible until Obsidian has been open for a day.
    const doc = harness.dom.document;
    let outstanding = 0;
    const realAdd = doc.addEventListener.bind(doc);
    const realRemove = doc.removeEventListener.bind(doc);
    type Listen = (t: string, h: EventListener, o?: unknown) => void;
    (doc as unknown as { addEventListener: Listen }).addEventListener = (t, h, o): void => {
        outstanding += 1;
        realAdd(t, h, o as boolean);
    };
    (doc as unknown as { removeEventListener: Listen }).removeEventListener = (t, h, o): void => {
        outstanding -= 1;
        realRemove(t, h, o as boolean);
    };

    try {
        const plugin = createTestPlugin();
        for (let cycle = 0; cycle < 3; cycle++) {
            plugin.openSearchOverlay();
            plugin.hideSearchOverlay();
        }
    } finally {
        const raw = doc as unknown as Record<string, unknown>;
        raw['addEventListener'] = realAdd;
        raw['removeEventListener'] = realRemove;
    }

    assert.equal(outstanding, 0, 'every listener added over three cycles was removed');
});

// The overlay's group hint used to name a key that could never fire: the guard
// asked for Mod not to be held, and the overlay only exists while Mod is held.

test('Tab cycles groups while the modifiers are held', async () => {
    const plugin = createTestPlugin();
    let askedFor: string | null | undefined = 'unset';
    plugin.getRelativeGroupId = (): string => 'g1';
    plugin.resolveGroupSelection = async (gid: string | null) => {
        askedFor = gid;
        return { sessions: [{ id: 's1', name: 'Session 1' }], resolvedGroupId: gid };
    };

    plugin.showSwitchOverlay([{ id: 's1', name: 'Session 1' }], 0, undefined, { mode: 'preview' });
    harness.dom.document.dispatchEvent(
        // Mod is held, because that is the only state this overlay is ever in.
        new harness.dom.window.KeyboardEvent('keydown', { key: 'Tab', metaKey: true, shiftKey: true })
    );
    await new Promise((resolve) => setTimeout(resolve, 10));

    assert.equal(askedFor, 'g1', 'Tab must reach the group cycling');
    plugin.hideSwitchOverlay();
});

test('G cycles groups too, for when Mod+Shift+Tab is taken', async () => {
    const plugin = createTestPlugin();
    let askedFor: string | null | undefined = 'unset';
    plugin.getRelativeGroupId = (): string => 'g1';
    plugin.resolveGroupSelection = async (gid: string | null) => {
        askedFor = gid;
        return { sessions: [{ id: 's1', name: 'Session 1' }], resolvedGroupId: gid };
    };

    plugin.showSwitchOverlay([{ id: 's1', name: 'Session 1' }], 0, undefined, { mode: 'preview' });
    harness.dom.document.dispatchEvent(
        new harness.dom.window.KeyboardEvent('keydown', { key: 'g', metaKey: true, shiftKey: true })
    );
    await new Promise((resolve) => setTimeout(resolve, 10));

    assert.equal(askedFor, 'g1', 'G must reach the same place Tab does');
    plugin.hideSwitchOverlay();
});

test('the footer names both keys, so it stops advertising a dead one', () => {
    const plugin = createTestPlugin();
    plugin.showSwitchOverlay([{ id: 's1', name: 'Session 1' }], 0, undefined, { mode: 'preview' });

    const footer = plugin.switchOverlayEl?.querySelector('.wpp-switch-footer');
    assert.ok(footer?.textContent?.includes('Tab / G'), 'the hint offers Tab and G');
    plugin.hideSwitchOverlay();
});

// Delete used to escape the filter box whenever the box was empty, and remove a
// session from under a person who was typing.

function clearModals(): void {
    // The overlay's key handler bails while any modal is on screen, and earlier
    // tests leave theirs in this document. Without clearing them these tests
    // pass because nothing ran at all.
    for (const el of harness.dom.document.querySelectorAll('.modal-container')) el.remove();
}

test('Delete in the empty filter box does not delete a session', () => {
    const plugin = createTestPlugin();
    plugin.data.showFilterInput = true;
    clearModals();
    plugin.openSearchOverlay();
    const input = plugin.searchOverlayEl?.querySelector('.wpp-search-input') as HTMLInputElement;
    assert.ok(input);
    input.focus();
    assert.equal(input.value, '', 'the box is empty, which is where this went wrong');

    // Counted rather than looked for: earlier tests leave modals in this
    // document, so only the change across the keypress means anything.
    const before = harness.dom.document.querySelectorAll('.modal-container').length;
    harness.dom.document.dispatchEvent(
        new harness.dom.window.KeyboardEvent('keydown', { key: 'Delete', bubbles: true })
    );

    assert.equal(
        harness.dom.document.querySelectorAll('.modal-container').length,
        before,
        'no delete confirmation may appear while the caret is in the filter',
    );
    plugin.hideSearchOverlay();
});

test('Delete on a session row still deletes, and names the right session', () => {
    const plugin = createTestPlugin();
    plugin.data.showFilterInput = true;
    clearModals();
    plugin.openSearchOverlay();

    // Focus on the overlay itself rather than the filter, which is where it
    // lands after an arrow key. The rows are not focusable; the selection is
    // tracked by the overlay, and Delete acts on it. This is the case Delete
    // exists for.
    (plugin.searchOverlayEl as HTMLElement).focus();
    const before = harness.dom.document.querySelectorAll('.modal-container').length;
    harness.dom.document.dispatchEvent(
        new harness.dom.window.KeyboardEvent('keydown', { key: 'Delete', bubbles: true })
    );

    const modals = harness.dom.document.querySelectorAll('.modal-container');
    assert.equal(modals.length, before + 1, 'the confirmation appears');
    // s1 is the active session in the fixture, so the wording says so.
    assert.ok(
        modals[modals.length - 1]?.textContent?.includes('Session 1'),
        'and it names the session being deleted',
    );
    plugin.hideSearchOverlay();
});

test('deleting a session that is not the active one does not call it active', () => {
    const plugin = createTestPlugin();
    plugin.data.showFilterInput = true;
    // The selection follows the active session, so point the active one
    // elsewhere: the row Delete acts on is then not active, and a message fixed
    // at the active wording would say something untrue about it.
    plugin.data.activeSessionId = 'nowhere';
    clearModals();
    plugin.openSearchOverlay();

    (plugin.searchOverlayEl as HTMLElement).focus();
    harness.dom.document.dispatchEvent(
        new harness.dom.window.KeyboardEvent('keydown', { key: 'Delete', bubbles: true })
    );

    const modals = harness.dom.document.querySelectorAll('.modal-container');
    const text = modals[modals.length - 1]?.textContent ?? '';
    assert.ok(text.includes('Session 1'), 'it names the session');
    assert.ok(!text.includes('active session'), 'and does not claim it is the active one');
    plugin.hideSearchOverlay();
});

// Resizing used to change the width and then try to repair the position. Two
// things went wrong that no clamping afterwards could fix, and both are here.

// jsdom does no layout, so getBoundingClientRect answers zero for everything
// and the geometry has nothing to work from. The overlay is given a real
// starting box, which is what a browser would have reported.
function placeOverlay(el: HTMLElement, box: { left: number; top: number; width: number; height: number }): void {
    el.getBoundingClientRect = (): DOMRect => ({
        left: box.left,
        top: box.top,
        right: box.left + box.width,
        bottom: box.top + box.height,
        width: box.width,
        height: box.height,
        x: box.left,
        y: box.top,
        toJSON: () => ({}),
    });
}

function dragHandle(
    plugin: TestPlugin,
    selector: string,
    to: { x: number; y: number },
): { left: number; bottom: number; width: number; height: number } {
    const el = plugin.searchOverlayEl as HTMLElement;
    placeOverlay(el, { left: 400, top: 300, width: 300, height: 200 });
    const handle = el.querySelector(selector) as HTMLElement;
    assert.ok(handle, `${selector} must exist`);
    const win = harness.dom.window;
    handle.dispatchEvent(new win.MouseEvent('mousedown', { bubbles: true, button: 0, clientX: 500, clientY: 400 }));
    harness.dom.document.dispatchEvent(
        new win.MouseEvent('mousemove', { bubbles: true, clientX: to.x, clientY: to.y })
    );
    const read = (prop: string): number => parseFloat(el.style.getPropertyValue(prop) || '0');
    const result = {
        left: read('left'),
        bottom: read('bottom'),
        width: read('width'),
        height: read('height'),
    };
    harness.dom.document.dispatchEvent(new win.MouseEvent('mouseup', { bubbles: true }));
    return result;
}

test('dragging the left edge past the window edge stops, instead of pushing the right edge out', () => {
    const plugin = createTestPlugin();
    clearModals();
    plugin.openSearchOverlay();

    // Far past the left of the window. The left edge has to stop at the margin,
    // and the right edge has to stay where it started: it is not being dragged.
    // The old code pinned `left` and let the width keep growing, which pushed
    // the right edge off the far side.
    const startRight = 400 + 300;
    const box = dragHandle(plugin, '.wpp-resize-left', { x: -4000, y: 400 });

    assert.ok(box.left >= 8, `left edge stays inside the window, got ${box.left}`);
    assert.equal(
        box.left + box.width,
        startRight,
        'the right edge is not being dragged and must not move',
    );
    plugin.hideSearchOverlay();
});

test('dragging a top corner past the top of the window stops, instead of leaving the box too tall', () => {
    const plugin = createTestPlugin();
    clearModals();
    plugin.openSearchOverlay();

    // Corners were the case that escaped: the top edge went off the top of the
    // window and the height stayed oversized.
    const box = dragHandle(plugin, '.wpp-resize-tl', { x: 500, y: -4000 });

    const top = harness.dom.window.innerHeight - box.bottom - box.height;
    assert.ok(top >= 8, `top edge stays inside the window, got ${top}`);
    plugin.hideSearchOverlay();
});

test('dragging the left edge inward stops at the minimum width', () => {
    const plugin = createTestPlugin();
    clearModals();
    plugin.openSearchOverlay();

    // Inward, far past where the box would collapse. The dragged edge has to
    // stop at the minimum rather than crossing the edge it is approaching.
    const box = dragHandle(plugin, '.wpp-resize-left', { x: 4000, y: 400 });

    assert.ok(box.width >= 220, `width holds at the minimum, got ${box.width}`);
    plugin.hideSearchOverlay();
});
