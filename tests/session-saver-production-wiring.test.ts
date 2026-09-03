// SessionSaver reaches real workspace layout and session creation without mock overrides.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';

const harness = setupHarness();
const { createRealPlugin } = await import('./real-plugin.ts');

interface SessionSaverSurface {
    saveCurrentLayoutAsSessionName(name: string, options?: { silent?: boolean }): Promise<{
        saved: boolean;
        created: boolean;
        sessionId: string | null;
    }>;
}

function createPlugin(): {
    plugin: ReturnType<typeof createRealPlugin>;
    persistCalls: () => number;
} {
    const plugin = createRealPlugin({
        app: {
            workspace: {
                getLayout: () => ({ root: 'live-app-layout' }),
                changeLayout: async (): Promise<boolean> => true,
            },
        },
        data: {
            sessions: { s1: { id: 's1', name: 'Work', layout: { root: 'old' } } },
            sessionOrder: ['s1'],
            activeSessionId: 's1',
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

function sessionSaver(plugin: ReturnType<typeof createRealPlugin>): SessionSaverSurface {
    return (plugin.getSessionSaver as () => SessionSaverSurface)();
}

test('SessionSaver creates and activates session from real workspace without overrides', async () => {
    const { plugin, persistCalls } = createPlugin();

    const result = await sessionSaver(plugin).saveCurrentLayoutAsSessionName('Brand New', { silent: true });
    assert.equal(result.saved, true);
    assert.equal(result.created, true);
    const sessionId = result.sessionId as string;
    const sessions = plugin.data.sessions as Record<string, { name: string; layout: unknown }>;
    const created = sessions[sessionId];
    assert.ok(created);
    assert.equal(created.name, 'Brand New');
    assert.deepEqual(created.layout, { root: 'live-app-layout' });
    assert.equal(plugin.data.activeSessionId, result.sessionId);
    assert.equal(persistCalls(), 1);
});

test.after(() => harness.restore());
