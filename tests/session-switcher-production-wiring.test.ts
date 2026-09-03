// SessionSwitcher reaches real workspace layout and session switching without mock overrides.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';

const harness = setupHarness();
const { createRealPlugin } = await import('./real-plugin.ts');

interface SessionSwitcherSurface {
    switchSession(sessionId: string, options?: { silent?: boolean }): Promise<boolean>;
}

function createPlugin(): {
    plugin: ReturnType<typeof createRealPlugin>;
    persistCalls: () => number;
} {
    let currentWorkspaceLayout: unknown = { root: 'layout-1-modified' };
    const plugin = createRealPlugin({
        app: {
            workspace: {
                getLayout: (): unknown => currentWorkspaceLayout,
                changeLayout: async (layout: unknown): Promise<boolean> => {
                    currentWorkspaceLayout = layout;
                    return true;
                },
            },
        },
        data: {
            sessions: {
                s1: { id: 's1', name: 'Session 1', layout: { root: 'layout-1' } },
                s2: { id: 's2', name: 'Session 2', layout: { root: 'layout-2' } },
            },
            sessionOrder: ['s1', 's2'],
            activeSessionId: 's1',
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

    let calls = 0;
    plugin.persistData = async (): Promise<boolean> => { calls += 1; return true; };
    return { plugin, persistCalls: () => calls };
}

function sessionSwitcher(plugin: ReturnType<typeof createRealPlugin>): SessionSwitcherSurface {
    return (plugin.getSessionSwitcher as () => SessionSwitcherSurface)();
}

test('SessionSwitcher switches active session and applies layout through production wiring', async () => {
    const { plugin, persistCalls } = createPlugin();

    const switched = await sessionSwitcher(plugin).switchSession('s2', { silent: true });
    assert.equal(switched, true);
    assert.equal(plugin.data.activeSessionId, 's2');
    const s1 = (plugin.data.sessions as Record<string, { layout: unknown }>).s1;
    assert.deepEqual(s1?.layout, { root: 'layout-1-modified' }, 'auto-saved s1 layout before switch');
    assert.equal(persistCalls(), 1);
});

test.after(() => harness.restore());
