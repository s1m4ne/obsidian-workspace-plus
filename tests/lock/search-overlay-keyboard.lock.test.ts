// Behavior Lock: Search Overlay Keyboard Navigation & Shortcuts
//
// Locks arrow key navigation, Enter to switch, Escape to close,
// Tab to cycle groups, and '/' shortcut to focus search input.
//
// Asserts exclusively on activeElement / focus and .is-selected class in DOM.
//
// RULE: Behavior Lock tests in tests/lock/ are NEVER edited during the refactor.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './harness/index.ts';

interface SearchOverlayKeyboardPlugin {
    data: {
        activeSessionId: string;
        sessionOrder: string[];
        sessions: Record<string, { id: string; name: string; layout?: unknown; modified?: number }>;
        groups: Record<string, { id: string; name: string; color?: string }>;
        groupOrder: string[];
        sessionGroups: Record<string, string[]>;
        activeGroupId: string | null;
        groupFeatureEnabled: boolean;
        showFilterInput: boolean;
        overlayDefaultFocus: string;
        searchOverlayPosition: { x: number; y: number } | null;
        searchOverlaySize: { width: number; height: number } | null;
        [key: string]: unknown;
    };
    app: {
        workspace: {
            containerEl: HTMLElement;
        };
    };
    searchOverlayEl: HTMLElement | null;
    openSearchOverlay(anchorEl?: HTMLElement): void;
    hideSearchOverlay(): void;
    isGroupFeatureEnabled(): boolean;
    getStartupSettleRemainingMs(): number;
    isAutoSaveOnSwitchEnabled(): boolean;
    isWarnOnUnsavedSwitchEnabled(): boolean;
    isActiveSessionDirty(): boolean;
    updateStatusBar(): void;
    persistData(): Promise<void>;
    applyWorkspaceLayout(layout: unknown): Promise<void>;
    pushLayoutToHistory(): void;
    getCurrentWorkspaceLayout(): unknown;
    [key: string]: unknown;
}

async function createKeyboardPlugin(
    harness: ReturnType<typeof setupHarness>,
    initialData?: Partial<SearchOverlayKeyboardPlugin['data']>,
): Promise<SearchOverlayKeyboardPlugin> {
    const i18nMod = await import('../../src/i18n.ts');
    const i18n = (i18nMod.default ?? i18nMod) as { resolveLocale(l: string): void };
    i18n.resolveLocale('en');

    const defaultDataMod = await import('../../src/plugin/default-data.js');
    const DEFAULT_DATA = (defaultDataMod.default ?? defaultDataMod) as Record<string, unknown>;

    const sessionsMod = await import('../../src/plugin/methods/sessions.js');
    const attachSessions = (sessionsMod.default ?? sessionsMod) as (cls: unknown) => void;

    const groupsMod = await import('../../src/plugin/methods/groups.js');
    const attachGroups = (groupsMod.default ?? groupsMod) as (cls: unknown) => void;

    const switchingMod = await import('../../src/plugin/methods/session-switching.js');
    const attachSwitching = (switchingMod.default ?? switchingMod) as (cls: unknown) => void;

    const overlaysMod = await import('../../src/plugin/methods/overlays.js');
    const attachOverlays = (overlaysMod.default ?? overlaysMod) as (cls: unknown) => void;

    function PluginMock() {}
    attachSessions(PluginMock);
    attachGroups(PluginMock);
    attachSwitching(PluginMock);
    attachOverlays(PluginMock);

    const plugin = new (PluginMock as unknown as { new(): SearchOverlayKeyboardPlugin })();

    plugin.data = {
        ...DEFAULT_DATA,
        activeSessionId: 's1',
        sessionOrder: ['s1', 's2', 's3'],
        sessions: {
            s1: { id: 's1', name: 'Session 1', layout: { a: 1 } },
            s2: { id: 's2', name: 'Session 2', layout: { b: 1 } },
            s3: { id: 's3', name: 'Session 3', layout: { c: 1 } },
        },
        groups: {
            g1: { id: 'g1', name: 'Group 1' },
            g2: { id: 'g2', name: 'Group 2' },
        },
        groupOrder: ['g1', 'g2'],
        sessionGroups: { s1: ['g1'], s2: ['g1'], s3: ['g2'] },
        activeGroupId: 'g1',
        groupFeatureEnabled: false,
        showFilterInput: true,
        overlayDefaultFocus: 'current-session',
        searchOverlayPosition: null,
        searchOverlaySize: null,
        ...(initialData || {}),
    };

    plugin.app = {
        workspace: {
            containerEl: harness.dom.container(),
        },
    };

    plugin.searchOverlayEl = null;
    plugin.isGroupFeatureEnabled = (): boolean => Boolean(plugin.data.groupFeatureEnabled);
    plugin.getStartupSettleRemainingMs = (): number => 0;
    plugin.isAutoSaveOnSwitchEnabled = (): boolean => false;
    plugin.isWarnOnUnsavedSwitchEnabled = (): boolean => false;
    plugin.isActiveSessionDirty = (): boolean => false;
    plugin.updateStatusBar = (): void => {};
    plugin.syncSessionCommands = (): void => {};
    plugin.syncSessionOrder = (): void => {};
    plugin.persistData = (): Promise<void> => Promise.resolve();
    plugin.applyWorkspaceLayout = (): Promise<void> => Promise.resolve();
    plugin.pushLayoutToHistory = (): void => {};
    plugin.getCurrentWorkspaceLayout = (): unknown => ({ root: 'curr' });

    return plugin;
}

test('ArrowDown and ArrowUp navigate session list selection and set .wpp-keyboard-nav', async () => {
    const h = setupHarness();
    try {
        const plugin = await createKeyboardPlugin(h);
        plugin.openSearchOverlay();

        const doc = h.dom.window.document;
        const overlay = doc.querySelector<HTMLElement>('.wpp-search-overlay');
        assert.ok(overlay);

        // Press ArrowDown to initiate keyboard navigation
        doc.dispatchEvent(new h.dom.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

        const items = overlay.querySelectorAll('.wpp-switch-item');
        assert.ok(overlay.classList.contains('wpp-keyboard-nav'), 'Overlay should have .wpp-keyboard-nav');
        assert.ok(items[1]?.classList.contains('wpp-kb-selected'), 'Index 1 (Session 2) must be selected after ArrowDown');

        // Press ArrowUp to move back up
        doc.dispatchEvent(new h.dom.window.KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
        assert.ok(items[0]?.classList.contains('wpp-kb-selected'), 'Index 0 (Session 1) must be selected after ArrowUp');
    } finally {
        h.restore();
    }
});

test('Enter key switches to selected session and hides overlay', async () => {
    const h = setupHarness();
    try {
        const plugin = await createKeyboardPlugin(h);
        plugin.openSearchOverlay();

        const doc = h.dom.window.document;
        // ArrowDown to Session 2
        doc.dispatchEvent(new h.dom.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

        // Press Enter
        doc.dispatchEvent(new h.dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

        // Wait for async switch to complete
        await new Promise<void>((resolve) => { setTimeout(resolve, 10); });

        assert.equal(plugin.data.activeSessionId, 's2', 'Active session must switch to s2 on Enter');
        assert.equal(doc.querySelector('.wpp-search-overlay'), null, 'Search overlay must close on Enter');
    } finally {
        h.restore();
    }
});

test('Escape key closes and hides the search overlay', async () => {
    const h = setupHarness();
    try {
        const plugin = await createKeyboardPlugin(h);
        plugin.openSearchOverlay();

        const doc = h.dom.window.document;
        assert.ok(doc.querySelector('.wpp-search-overlay'));

        // Press Escape
        doc.dispatchEvent(new h.dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

        assert.equal(doc.querySelector('.wpp-search-overlay'), null, 'Search overlay must close on Escape');
    } finally {
        h.restore();
    }
});

test('Tab key cycles active group tabs when groups are enabled', async () => {
    const h = setupHarness();
    try {
        const plugin = await createKeyboardPlugin(h, {
            groupFeatureEnabled: true,
            activeGroupId: 'g1',
        });
        plugin.openSearchOverlay();

        const doc = h.dom.window.document;
        // Initially in g1 view, shows s1, s2
        let items = doc.querySelectorAll('.wpp-switch-item');
        assert.equal(items.length, 2);

        // Press Tab to switch to g2
        doc.dispatchEvent(new h.dom.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

        await new Promise<void>((resolve) => { setTimeout(resolve, 10); });

        items = doc.querySelectorAll('.wpp-switch-item');
        assert.equal(items.length, 1, 'Group 2 should display 1 session (s3)');
        assert.match(items[0]?.textContent ?? '', /Session 3/);
    } finally {
        h.restore();
    }
});

test('Slash key shortcut focuses search input', async () => {
    const h = setupHarness();
    try {
        const plugin = await createKeyboardPlugin(h);
        plugin.openSearchOverlay();

        const doc = h.dom.window.document;
        const input = doc.querySelector<HTMLInputElement>('.wpp-search-input');
        assert.ok(input);

        // Blur input first
        input.blur();
        assert.notEqual(doc.activeElement, input);

        // Press '/'
        doc.dispatchEvent(new h.dom.window.KeyboardEvent('keydown', { key: '/', bubbles: true }));

        assert.equal(doc.activeElement, input, 'Search input must gain focus on / keypress');
    } finally {
        h.restore();
    }
});
