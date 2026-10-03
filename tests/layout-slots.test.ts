// A session keeps one layout per kind of device (#124).
//
// Obsidian keeps workspace.json and workspace-mobile.json apart for a reason:
// a phone's sidebars are drawers, and a desktop that is handed them drops them
// and builds two empty sidebars. A session used to hold a single layout, so a
// phone and a desktop sharing a vault overwrote each other's, and whichever
// read the other's layout lost its own screen. These tests run the real plugin
// with the platform switched, and watch what reaches changeLayout.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';

const harness = setupHarness();
const { createRealPlugin } = await import('./real-plugin.ts');
const { Platform } = await import('obsidian') as unknown as { Platform: { isMobile: boolean } };
const { applySessionDataFromStorage } = await import('../src/storage/session-sync.ts');
const layoutUtils = await import('../src/layout-utils.ts');

type Layout = Record<string, unknown>;

function desktopLayout(name: string): Layout {
    return {
        main: { id: `${name}-main`, type: 'split' },
        left: { id: `${name}-left`, type: 'split' },
        right: { id: `${name}-right`, type: 'split' },
    };
}

function phoneLayout(name: string): Layout {
    return {
        main: { id: `${name}-main`, type: 'split' },
        left: { id: `${name}-left`, type: 'mobile-drawer' },
        right: { id: `${name}-right`, type: 'mobile-drawer' },
    };
}

interface Session { id: string; name: string; layout: unknown; mobileLayout?: unknown }

function createPlugin(onScreen: Layout, sessions: Record<string, Session>): {
    plugin: ReturnType<typeof createRealPlugin>;
    applied: unknown[];
    sessions: Record<string, Session>;
} {
    let screen: unknown = onScreen;
    const applied: unknown[] = [];
    const plugin = createRealPlugin({
        app: {
            workspace: {
                getLayout: (): unknown => screen,
                changeLayout: async (layout: unknown): Promise<boolean> => {
                    applied.push(layout);
                    screen = layout;
                    return true;
                },
            },
        },
        data: {
            sessions,
            sessionOrder: Object.keys(sessions),
            activeSessionId: Object.keys(sessions)[0],
            restoreSidebars: true,
            autoSaveOnSwitch: true,
            warnOnUnsavedSwitch: false,
            groups: {},
            groupOrder: [],
            sessionGroups: {},
            activeGroupId: null,
            groupFeatureEnabled: false,
        },
    });
    plugin.persistData = async (): Promise<boolean> => true;
    return { plugin, applied, sessions };
}

async function switchTo(plugin: ReturnType<typeof createRealPlugin>, id: string): Promise<void> {
    const switcher = (plugin.getSessionSwitcher as () => { switchSession(id: string, o: { silent: boolean }): Promise<boolean> })();
    assert.equal(await switcher.switchSession(id, { silent: true }), true);
}

async function onPhone(run: () => Promise<void>): Promise<void> {
    Platform.isMobile = true;
    try {
        await run();
    } finally {
        Platform.isMobile = false;
    }
}

test('a phone saves its layout beside the desktop one instead of over it', async () => {
    await onPhone(async () => {
        const { plugin, sessions } = createPlugin(phoneLayout('phone-now'), {
            a: { id: 'a', name: 'A', layout: desktopLayout('a') },
            b: { id: 'b', name: 'B', layout: desktopLayout('b') },
        });

        await switchTo(plugin, 'b');

        assert.deepEqual(sessions.a?.layout, desktopLayout('a'), 'the desktop layout is left alone');
        assert.deepEqual(sessions.a?.mobileLayout, phoneLayout('phone-now'), 'the phone layout goes in its own slot');
    });
});

test('a desktop opening a session only a phone has saved keeps its own sidebars', async () => {
    // An earlier release on a phone wrote the phone's layout into `layout`.
    const { plugin, applied } = createPlugin(desktopLayout('desk'), {
        a: { id: 'a', name: 'A', layout: desktopLayout('a') },
        b: { id: 'b', name: 'B', layout: phoneLayout('b') },
    });

    await switchTo(plugin, 'b');

    assert.equal(applied.length, 1);
    const shown = applied[0] as Layout;
    assert.deepEqual(shown.main, phoneLayout('b').main, 'the notes come across');
    assert.deepEqual(shown.left, desktopLayout('desk').left, 'no drawer reaches the desktop');
    assert.deepEqual(shown.right, desktopLayout('desk').right);
});

test('a phone opening a session only a desktop has saved keeps its drawers', async () => {
    await onPhone(async () => {
        const { plugin, applied } = createPlugin(phoneLayout('phone'), {
            a: { id: 'a', name: 'A', layout: desktopLayout('a') },
            b: { id: 'b', name: 'B', layout: desktopLayout('b') },
        });

        await switchTo(plugin, 'b');

        const shown = applied[0] as Layout;
        assert.deepEqual(shown.main, desktopLayout('b').main);
        assert.deepEqual(shown.left, phoneLayout('phone').left, 'the drawers stay');
    });
});

test('each kind of device opens the layout it saved itself', async () => {
    const both = (): Record<string, Session> => ({
        a: { id: 'a', name: 'A', layout: desktopLayout('a') },
        b: { id: 'b', name: 'B', layout: desktopLayout('b'), mobileLayout: phoneLayout('b') },
    });

    const desktop = createPlugin(desktopLayout('desk'), both());
    await switchTo(desktop.plugin, 'b');
    assert.deepEqual(desktop.applied, [desktopLayout('b')]);

    await onPhone(async () => {
        const phone = createPlugin(phoneLayout('phone'), both());
        await switchTo(phone.plugin, 'b');
        assert.deepEqual(phone.applied, [phoneLayout('b')]);
    });
});

test('a phone\'s save arriving at a desktop leaves the desktop screen alone', async () => {
    const { plugin, applied } = createPlugin(desktopLayout('a'), {
        a: { id: 'a', name: 'A', layout: desktopLayout('a') },
    });

    // A phone on an earlier release still writes into `layout`. That is the
    // write that used to reach this screen and empty both sidebars.
    await applySessionDataFromStorage(plugin as never, {
        activeSessionId: 'a',
        sessions: { a: { id: 'a', name: 'A', layout: phoneLayout('a') } },
        sessionOrder: ['a'],
    }, { applyLayout: true });

    assert.deepEqual(applied, [], 'the phone changed nothing this screen shows');
});

interface StoreSurface {
    createSession(name: string): Promise<boolean>;
    duplicateSession(id: string): Promise<boolean>;
}

function store(plugin: ReturnType<typeof createRealPlugin>): StoreSurface {
    return (plugin.getSessionStore as () => StoreSurface)();
}

test('a session created on a phone starts with only a phone layout', async () => {
    await onPhone(async () => {
        const { plugin, sessions } = createPlugin(phoneLayout('phone'), {
            a: { id: 'a', name: 'A', layout: desktopLayout('a') },
        });

        await store(plugin).createSession('New');

        const created = Object.values(sessions).find((s) => s.name === 'New');
        assert.equal(created?.layout, null, 'nothing a desktop would try to show');
        assert.deepEqual(created?.mobileLayout, phoneLayout('phone'));
    });
});

test('a duplicate carries both kinds of layout', async () => {
    const { plugin, sessions } = createPlugin(desktopLayout('desk'), {
        a: { id: 'a', name: 'A', layout: desktopLayout('a'), mobileLayout: phoneLayout('a') },
    });

    await store(plugin).duplicateSession('a');

    const copy = Object.values(sessions).find((s) => s.id !== 'a');
    assert.deepEqual(copy?.layout, desktopLayout('a'));
    assert.deepEqual(copy?.mobileLayout, phoneLayout('a'));
});

test('a layout is told apart by its drawers, so old data needs no migration', () => {
    const { readSessionLayout, sessionLayoutToApply } = layoutUtils;
    const old = { layout: phoneLayout('old') };

    assert.equal(readSessionLayout(old, 'desktop'), null);
    assert.deepEqual(readSessionLayout(old, 'mobile'), phoneLayout('old'));
    assert.deepEqual(sessionLayoutToApply(old, 'desktop'), phoneLayout('old'), 'the other kind\'s is the fallback');
    assert.equal(sessionLayoutToApply({ layout: null }, 'desktop'), null);
});

test.after(() => harness.restore());
