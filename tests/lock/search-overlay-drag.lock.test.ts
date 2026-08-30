// Behavior Lock: Search Overlay Drag & Position Persistence
//
// Locks the drag-to-reposition and resize interaction sequences,
// ensuring persisted searchOverlayPosition and searchOverlaySize in data.json.
//
// Asserts exclusively on persisted position in data and .wpp-dragging class.
//
// RULE: Behavior Lock tests in tests/lock/ are NEVER edited during the refactor.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './harness/index.ts';

interface SearchOverlayDragPlugin {
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
        searchOverlayPosition: { left: number; bottom: number } | null;
        searchOverlaySize: { width: number; height: number } | null;
        [key: string]: unknown;
    };
    app: {
        workspace: {
            containerEl: HTMLElement;
        };
    };
    persistCalls: number;
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
    [key: string]: unknown;
}

async function createDragPlugin(
    harness: ReturnType<typeof setupHarness>,
    initialData?: Partial<SearchOverlayDragPlugin['data']>,
): Promise<SearchOverlayDragPlugin> {
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

    const plugin = new (PluginMock as unknown as { new(): SearchOverlayDragPlugin })();

    plugin.data = {
        ...DEFAULT_DATA,
        activeSessionId: 's1',
        sessionOrder: ['s1', 's2'],
        sessions: {
            s1: { id: 's1', name: 'Session 1' },
            s2: { id: 's2', name: 'Session 2' },
        },
        groups: {},
        groupOrder: [],
        sessionGroups: {},
        activeGroupId: null,
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

    plugin.persistCalls = 0;
    plugin.searchOverlayEl = null;
    plugin.isGroupFeatureEnabled = (): boolean => Boolean(plugin.data.groupFeatureEnabled);
    plugin.getStartupSettleRemainingMs = (): number => 0;
    plugin.isAutoSaveOnSwitchEnabled = (): boolean => false;
    plugin.isWarnOnUnsavedSwitchEnabled = (): boolean => false;
    plugin.isActiveSessionDirty = (): boolean => false;
    plugin.updateStatusBar = (): void => {};
    plugin.persistData = (): Promise<void> => {
        plugin.persistCalls += 1;
        return Promise.resolve();
    };

    return plugin;
}

test('dragging search overlay via empty area toggles .wpp-dragging and persists new position', async () => {
    const h = setupHarness();
    try {
        const plugin = await createDragPlugin(h);
        plugin.openSearchOverlay();

        const doc = h.dom.window.document;
        const overlay = doc.querySelector<HTMLElement>('.wpp-search-overlay');
        assert.ok(overlay);

        // Mock getBoundingClientRect for jsdom layout
        overlay.getBoundingClientRect = () => ({
            left: 100,
            top: 200,
            right: 400,
            bottom: 500,
            width: 300,
            height: 300,
            x: 100,
            y: 200,
            toJSON: () => {},
        });

        // 1. Mousedown on overlay background
        const header = overlay.querySelector('.wpp-search-header');
        assert.ok(header);

        header.dispatchEvent(new h.dom.window.MouseEvent('mousedown', {
            button: 0,
            clientX: 150,
            clientY: 220,
            bubbles: true,
        }));

        assert.ok(overlay.classList.contains('wpp-dragging'), 'Mousedown should add .wpp-dragging');

        // 2. Mousemove to drag
        doc.dispatchEvent(new h.dom.window.MouseEvent('mousemove', {
            clientX: 250,
            clientY: 320,
            bubbles: true,
        }));

        // 3. Mouseup to drop and persist
        doc.dispatchEvent(new h.dom.window.MouseEvent('mouseup', {
            clientX: 250,
            clientY: 320,
            bubbles: true,
        }));

        assert.equal(overlay.classList.contains('wpp-dragging'), false, 'Mouseup should remove .wpp-dragging');
        assert.ok(plugin.data.searchOverlayPosition, 'searchOverlayPosition must be persisted');
        assert.equal(typeof plugin.data.searchOverlayPosition?.left, 'number');
        assert.equal(typeof plugin.data.searchOverlayPosition?.bottom, 'number');
        assert.equal(plugin.persistCalls >= 1, true, 'persistData() must be called');
    } finally {
        h.restore();
    }
});

test('corner resize mousedown and mouseup persists searchOverlaySize and searchOverlayPosition', async () => {
    const h = setupHarness();
    try {
        const plugin = await createDragPlugin(h);
        plugin.openSearchOverlay();

        const doc = h.dom.window.document;
        const overlay = doc.querySelector<HTMLElement>('.wpp-search-overlay');
        assert.ok(overlay);

        overlay.getBoundingClientRect = () => ({
            left: 50,
            top: 50,
            right: 450,
            bottom: 550,
            width: 400,
            height: 500,
            x: 50,
            y: 50,
            toJSON: () => {},
        });

        const brCorner = overlay.querySelector<HTMLElement>('.wpp-resize-br');
        assert.ok(brCorner);

        brCorner.dispatchEvent(new h.dom.window.MouseEvent('mousedown', {
            button: 0,
            clientX: 300,
            clientY: 300,
            bubbles: true,
        }));

        doc.dispatchEvent(new h.dom.window.MouseEvent('mousemove', {
            clientX: 400,
            clientY: 500,
            bubbles: true,
        }));

        doc.dispatchEvent(new h.dom.window.MouseEvent('mouseup', {
            clientX: 400,
            clientY: 500,
            bubbles: true,
        }));

        assert.ok(plugin.data.searchOverlaySize, 'searchOverlaySize must be recorded');
        assert.equal(plugin.data.searchOverlaySize?.width, 400);
        assert.equal(plugin.data.searchOverlaySize?.height, 500);
        assert.ok(plugin.data.searchOverlayPosition, 'searchOverlayPosition must be updated on resize');
    } finally {
        h.restore();
    }
});

test('interactive child elements in overlay do not trigger dragging on mousedown', async () => {
    const h = setupHarness();
    try {
        const plugin = await createDragPlugin(h);
        plugin.openSearchOverlay();

        const doc = h.dom.window.document;
        const overlay = doc.querySelector<HTMLElement>('.wpp-search-overlay');
        assert.ok(overlay);

        const input = overlay.querySelector<HTMLInputElement>('.wpp-search-input');
        assert.ok(input);

        input.dispatchEvent(new h.dom.window.MouseEvent('mousedown', {
            button: 0,
            clientX: 120,
            clientY: 120,
            bubbles: true,
        }));

        assert.equal(overlay.classList.contains('wpp-dragging'), false, 'Input mousedown must not start dragging');

        const sessionItem = overlay.querySelector<HTMLElement>('.wpp-switch-item');
        assert.ok(sessionItem);

        sessionItem.dispatchEvent(new h.dom.window.MouseEvent('mousedown', {
            button: 0,
            clientX: 120,
            clientY: 120,
            bubbles: true,
        }));

        assert.equal(overlay.classList.contains('wpp-dragging'), false, 'Session item mousedown must not start dragging');
    } finally {
        h.restore();
    }
});
