// GroupStore reaches real group/session resolution without mock overrides.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';

const harness = setupHarness();

interface TestPlugin {
    data: Record<string, unknown>;
    _persistCalls: number;
    _switchedSessionId: string | null;
    persistData(): Promise<boolean>;
    switchSession(sessionId: string): Promise<boolean>;
    getGroupStore(): {
        resolveGroupSelection(groupId: string | null): Promise<{
            switched: boolean;
            resolvedGroupId: string | null;
            sessions: Array<{ id: string; name: string }>;
        }>;
    };
    [key: string]: unknown;
}

async function createPlugin(): Promise<TestPlugin> {
    const modules = await Promise.all([
        import('../src/plugin/methods/groups.js'),
        import('../src/plugin/methods/sessions.js'),
        import('../src/plugin/methods/session-commands.js'),
        import('../src/plugin/methods/session-statusbar.js'),
        import('../src/plugin/methods/session-store-getter.js'),
        import('../src/plugin/methods/session-switching.js'),
    ]);

    function PluginMock(this: unknown) {}
    for (const mod of modules) {
        const attach = ((mod as { default?: unknown }).default ?? mod) as (target: unknown) => void;
        attach(PluginMock);
    }

    const plugin = new (PluginMock as unknown as new () => TestPlugin)();
    plugin.data = {
        groupFeatureEnabled: true,
        groups: {
            g1: { id: 'g1', name: 'Work' },
            g2: { id: 'g2', name: 'Personal' },
        },
        groupOrder: ['__all__', 'g1', 'g2'],
        sessionGroups: {
            s1: ['g1'],
            s2: ['g2'],
        },
        sessions: {
            s1: { id: 's1', name: 'Task 1', layout: {} },
            s2: { id: 's2', name: 'Notes', layout: {} },
        },
        sessionOrder: ['s1', 's2'],
        activeSessionId: 's1',
        activeGroupId: 'g1',
    };
    plugin._persistCalls = 0;
    plugin._switchedSessionId = null;
    plugin.removeCommand = function () {};
    plugin.addCommand = function () {};
    plugin.persistData = async function () {
        plugin._persistCalls += 1;
        return true;
    };
    plugin.getSessionSwitcher = function () {
        return {
            switchSession: async (sid: string) => {
                plugin._switchedSessionId = sid;
                (plugin.data as { activeSessionId: string }).activeSessionId = sid;
                return true;
            },
        };
    };
    return plugin;
}

test('GroupStore resolves group selection and filters sessions through production wiring', async () => {
    const plugin = await createPlugin();

    const result = await plugin.getGroupStore().resolveGroupSelection('g2');
    assert.equal(result.switched, true);
    assert.equal(result.resolvedGroupId, 'g2');
    assert.deepEqual(result.sessions.map((s) => s.id), ['s2']);
    assert.equal(plugin._switchedSessionId, 's2', 'must switch to session in target group');
});

test.after(() => harness.restore());
