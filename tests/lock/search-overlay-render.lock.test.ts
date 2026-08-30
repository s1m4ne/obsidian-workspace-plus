// Behavior Lock: Search Overlay DOM Rendering & Structure
//
// Locks the DOM representation, session item ordering, group tabs,
// search query filtering, and empty state rendering of the search overlay.
//
// Asserts exclusively through DOM queries against document.body / container.
//
// RULE: Behavior Lock tests in tests/lock/ are NEVER edited during the refactor.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './harness/index.ts';

interface SearchOverlayPlugin {
    data: {
        activeSessionId: string;
        sessionOrder: string[];
        sessions: Record<string, { id: string; name: string; layout?: unknown; modified?: number }>;
        groups: Record<string, { id: string; name: string; color?: string }>;
        groupOrder: string[];
        sessionGroups: Record<string, string | string[]>;
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
    filterSessionsByQuery(sessions: unknown[], query: string): unknown[];
    isGroupFeatureEnabled(): boolean;
    getStartupSettleRemainingMs(): number;
    isAutoSaveOnSwitchEnabled(): boolean;
    isWarnOnUnsavedSwitchEnabled(): boolean;
    isActiveSessionDirty(): boolean;
    updateStatusBar(): void;
    persistData(): Promise<void>;
    [key: string]: unknown;
}

async function createSearchOverlayPlugin(
    harness: ReturnType<typeof setupHarness>,
    initialData?: Partial<SearchOverlayPlugin['data']>,
): Promise<SearchOverlayPlugin> {
    const i18nMod = await import('../../src/i18n.js');
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

    const plugin = new (PluginMock as unknown as { new(): SearchOverlayPlugin })();

    plugin.data = {
        ...DEFAULT_DATA,
        activeSessionId: 'work',
        sessionOrder: ['work', 'notes', 'reading'],
        sessions: {
            work: { id: 'work', name: 'Work Project', modified: 1700000000000 },
            notes: { id: 'notes', name: 'Daily Notes', modified: 1700000010000 },
            reading: { id: 'reading', name: 'Reading List', modified: 1700000020000 },
        },
        groups: {
            g1: { id: 'g1', name: 'Focus' },
            g2: { id: 'g2', name: 'Personal' },
        },
        groupOrder: ['g1', 'g2'],
        sessionGroups: { work: 'g1', notes: 'g1', reading: 'g2' },
        activeGroupId: 'g1',
        groupFeatureEnabled: false,
        showFilterInput: true,
        overlayDefaultFocus: 'search-input',
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
    plugin.persistData = (): Promise<void> => Promise.resolve();

    return plugin;
}

test('search overlay renders complete DOM structure with header, list, and footer', async () => {
    const h = setupHarness();
    try {
        const plugin = await createSearchOverlayPlugin(h);
        plugin.openSearchOverlay();

        const doc = h.dom.window.document;
        const overlay = doc.querySelector<HTMLElement>('.wpp-search-overlay');
        assert.ok(overlay, 'Search overlay element must be rendered in DOM');

        // Four resize corners and four resize edges
        const corners = overlay.querySelectorAll('.wpp-resize-corner');
        assert.equal(corners.length, 4, 'Must render 4 resize corners');

        const edges = overlay.querySelectorAll('.wpp-resize-edge');
        assert.equal(edges.length, 4, 'Must render 4 resize edges');

        // Header with count and close button
        const header = overlay.querySelector('.wpp-search-header');
        assert.ok(header, 'Must render search header');
        const count = header.querySelector('.wpp-switch-count');
        assert.ok(count, 'Must render switch count in header');
        assert.match(count.textContent ?? '', /3/, 'Count text must reflect 3 sessions');

        // Session list items
        const sessionItems = overlay.querySelectorAll('.wpp-switch-item');
        assert.equal(sessionItems.length, 3, 'Must render 3 session items');

        // Active session item indicator (badge)
        const activeBadge = overlay.querySelector('.wpp-active-badge');
        assert.ok(activeBadge, 'Active session item must have .wpp-active-badge');
        const activeItem = activeBadge.closest('.wpp-switch-item');
        assert.ok(activeItem);
        assert.match(activeItem.textContent ?? '', /Work Project/);

        // Hide search overlay removes DOM
        plugin.hideSearchOverlay();
        assert.equal(doc.querySelector('.wpp-search-overlay'), null, 'Hiding overlay must remove DOM');
    } finally {
        h.restore();
    }
});

test('search overlay search input filters session items dynamically and displays empty state on zero matches', async () => {
    const h = setupHarness();
    try {
        const plugin = await createSearchOverlayPlugin(h);
        plugin.openSearchOverlay();

        const doc = h.dom.window.document;
        const input = doc.querySelector<HTMLInputElement>('.wpp-search-input');
        assert.ok(input, 'Search filter input must be rendered');

        // Type query matching "daily"
        input.value = 'daily';
        input.dispatchEvent(new h.dom.window.Event('input', { bubbles: true }));

        let items = doc.querySelectorAll<HTMLElement>('.wpp-switch-item');
        assert.equal(items.length, 1, 'Only 1 item should match query "daily"');
        assert.match(items[0]?.textContent ?? '', /Daily Notes/);

        // Type query matching nothing
        input.value = 'nonexistent-session-xyz';
        input.dispatchEvent(new h.dom.window.Event('input', { bubbles: true }));

        items = doc.querySelectorAll<HTMLElement>('.wpp-switch-item');
        assert.equal(items.length, 0, 'Zero items should match');

        const emptyEl = doc.querySelector<HTMLElement>('.wpp-search-empty');
        assert.ok(emptyEl, 'Empty state element must be visible when no matches found');
        assert.notEqual(emptyEl.style.display, 'none');
    } finally {
        h.restore();
    }
});

test('search overlay group tabs render and filter sessions by group when group feature is enabled', async () => {
    const h = setupHarness();
    try {
        const plugin = await createSearchOverlayPlugin(h, {
            groupFeatureEnabled: true,
            activeGroupId: 'g1',
        });
        plugin.openSearchOverlay();

        const doc = h.dom.window.document;
        const groupTabsRow = doc.querySelector('.wpp-group-tabs');
        assert.ok(groupTabsRow, 'Group tabs row must be rendered when groups enabled');

        const tabs = groupTabsRow.querySelectorAll<HTMLElement>('.wpp-group-tab');
        assert.ok(tabs.length >= 3, 'Must render All Sessions tab + 2 group tabs');

        // Sessions in g1: 'work', 'notes'
        const items = doc.querySelectorAll<HTMLElement>('.wpp-switch-item');
        assert.equal(items.length, 2, 'Should display 2 sessions for active group g1');
        assert.match(items[0]?.textContent ?? '', /Work Project/);
        assert.match(items[1]?.textContent ?? '', /Daily Notes/);
    } finally {
        h.restore();
    }
});
