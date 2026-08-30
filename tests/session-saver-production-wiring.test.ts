// SessionSaver reaches real workspace layout and session creation without mock overrides.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';

const harness = setupHarness();

interface TestPlugin {
    data: Record<string, unknown>;
    app: { workspace: { getLayout: () => unknown; changeLayout: (layout: unknown) => Promise<boolean> } };
    _persistCalls: number;
    persistData(): Promise<boolean>;
    getSessionSaver(): {
        saveCurrentLayoutAsSessionName(name: string, options?: { silent?: boolean }): Promise<{
            saved: boolean;
            created: boolean;
            sessionId: string | null;
        }>;
    };
    [key: string]: unknown;
}

async function createPlugin(): Promise<TestPlugin> {
    const modules = await Promise.all([
        import('../src/plugin/methods/session-saving.js'),
        import('../src/plugin/methods/sessions.js'),
        import('../src/plugin/methods/session-store-getter.js'),
        import('../src/plugin/methods/history.js'),
        import('../src/plugin/methods/groups.js'),
    ]);

    function PluginMock(this: unknown) {}
    for (const mod of modules) {
        const attach = ((mod as { default?: unknown }).default ?? mod) as (target: unknown) => void;
        attach(PluginMock);
    }

    const plugin = new (PluginMock as unknown as new () => TestPlugin)();
    plugin.data = {
        sessions: {
            s1: { id: 's1', name: 'Work', layout: { root: 'old' } },
        },
        sessionOrder: ['s1'],
        activeSessionId: 's1',
        groups: {},
        groupOrder: [],
        sessionGroups: {},
        activeGroupId: null,
        groupFeatureEnabled: false,
    };
    plugin.app = {
        workspace: {
            getLayout: () => ({ root: 'live-app-layout' }),
            changeLayout: async () => true,
        },
    };
    plugin._persistCalls = 0;
    plugin.persistData = async function () {
        plugin._persistCalls += 1;
        return true;
    };
    return plugin;
}

test('SessionSaver creates and activates session from real workspace without overrides', async () => {
    const plugin = await createPlugin();

    const result = await plugin.getSessionSaver().saveCurrentLayoutAsSessionName('Brand New', { silent: true });
    assert.equal(result.saved, true);
    assert.equal(result.created, true);
    const sessionId = result.sessionId as string;
    const sessions = plugin.data.sessions as Record<string, { name: string; layout: unknown }>;
    const created = sessions[sessionId];
    assert.ok(created);
    assert.equal(created.name, 'Brand New');
    assert.deepEqual(created.layout, { root: 'live-app-layout' });
    assert.equal(plugin.data.activeSessionId, result.sessionId);
    assert.equal(plugin._persistCalls, 1);
});

test.after(() => harness.restore());
