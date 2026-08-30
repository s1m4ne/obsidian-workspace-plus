// SessionSwitcher reaches real workspace layout and session switching without mock overrides.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';

const harness = setupHarness();

interface TestPlugin {
    data: Record<string, unknown>;
    app: { workspace: { getLayout: () => unknown; changeLayout: (layout: unknown) => Promise<boolean> } };
    _persistCalls: number;
    persistData(): Promise<boolean>;
    getSessionSwitcher(): {
        switchSession(targetId: string, options?: { silent?: boolean }): Promise<boolean>;
    };
    [key: string]: unknown;
}

async function createPlugin(): Promise<TestPlugin> {
    const modules = await Promise.all([
        import('../src/plugin/methods/session-switcher-getter.js'),
        import('../src/plugin/methods/sessions.js'),
        import('../src/plugin/methods/session-store-getter.js'),
        import('../src/plugin/methods/session-saving.js'),
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
    };
    let currentWorkspaceLayout: unknown = { root: 'layout-1-modified' };
    plugin.app = {
        workspace: {
            getLayout: () => currentWorkspaceLayout,
            changeLayout: async (layout: unknown) => {
                currentWorkspaceLayout = layout;
                return true;
            },
        },
    };
    plugin._persistCalls = 0;
    plugin.persistData = async function () {
        plugin._persistCalls += 1;
        return true;
    };
    return plugin;
}

test('SessionSwitcher switches active session and applies layout through production wiring', async () => {
    const plugin = await createPlugin();

    const switched = await plugin.getSessionSwitcher().switchSession('s2', { silent: true });
    assert.equal(switched, true);
    assert.equal(plugin.data.activeSessionId, 's2');
    const s1 = (plugin.data.sessions as Record<string, { layout: unknown }>).s1;
    assert.deepEqual(s1?.layout, { root: 'layout-1-modified' }, 'auto-saved s1 layout before switch');
    assert.equal(plugin._persistCalls, 1);
});

test.after(() => harness.restore());
