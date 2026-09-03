// GroupStore reaches real group/session resolution without mock overrides.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';

const harness = setupHarness();
const { createRealPlugin } = await import('./real-plugin.ts');

interface GroupStoreSurface {
    resolveGroupSelection(groupId: string | null): Promise<{
        switched: boolean;
        resolvedGroupId: string | null;
        sessions: Array<{ id: string; name: string }>;
    }>;
}

function createPlugin(): {
    plugin: ReturnType<typeof createRealPlugin>;
    switchedSessionId: () => string | null;
} {
    const plugin = createRealPlugin({
        data: {
            groupFeatureEnabled: true,
            groups: {
                g1: { id: 'g1', name: 'Work' },
                g2: { id: 'g2', name: 'Personal' },
            },
            groupOrder: ['__all__', 'g1', 'g2'],
            sessionGroups: { s1: ['g1'], s2: ['g2'] },
            sessions: {
                s1: { id: 's1', name: 'Task 1', layout: {} },
                s2: { id: 's2', name: 'Notes', layout: {} },
            },
            sessionOrder: ['s1', 's2'],
            activeSessionId: 's1',
            activeGroupId: 'g1',
        },
    });

    let switched: string | null = null;
    plugin.persistData = async (): Promise<boolean> => true;
    // The switch itself is stubbed: this test is about which group and which
    // sessions the store resolves, and the switch is what it hands outward.
    plugin.getSessionSwitcher = (): { switchSession: (id: string) => Promise<boolean> } => ({
        switchSession: async (sid: string): Promise<boolean> => {
            switched = sid;
            (plugin.data as { activeSessionId: string }).activeSessionId = sid;
            return true;
        },
    });
    return { plugin, switchedSessionId: () => switched };
}

function groupStore(plugin: ReturnType<typeof createRealPlugin>): GroupStoreSurface {
    return (plugin.getGroupStore as () => GroupStoreSurface)();
}

test('GroupStore resolves group selection and filters sessions through production wiring', async () => {
    const { plugin, switchedSessionId } = createPlugin();

    const result = await groupStore(plugin).resolveGroupSelection('g2');
    assert.equal(result.switched, true);
    assert.equal(result.resolvedGroupId, 'g2');
    assert.deepEqual(result.sessions.map((s) => s.id), ['s2']);
    assert.equal(switchedSessionId(), 's2', 'must switch to session in target group');
});

test.after(() => harness.restore());
