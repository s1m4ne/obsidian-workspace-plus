// The store reaches the real workspace, not just a test double.
//
// Every existing test injects getCurrentWorkspaceLayout onto the plugin
// instance, so the adapter's override branch always won and the path that
// actually runs in Obsidian - app.workspace.getLayout() - was never executed.
// Breaking it used to leave all 290 tests green. This test takes the branch a
// real plugin takes: no instance override, so the adapter must fall through to
// the workspace.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';

const harness = setupHarness();

interface TestPlugin {
    data: Record<string, unknown>;
    app: { workspace: { getLayout: () => unknown } };
    getCurrentWorkspaceLayout(): unknown;
    getSessionStore(): { getCurrentWorkspaceLayout(): unknown };
    [key: string]: unknown;
}

async function createPlugin(layoutOnScreen: unknown): Promise<TestPlugin> {
    const modules = await Promise.all([
        import('../src/plugin/methods/sessions.js'),
        import('../src/plugin/methods/session-store-getter.js'),
    ]);

    function PluginMock(this: unknown) {}
    for (const mod of modules) {
        const attach = ((mod as { default?: unknown }).default ?? mod) as (target: unknown) => void;
        attach(PluginMock);
    }

    const plugin = new (PluginMock as unknown as new () => TestPlugin)();
    plugin.manifest = { id: 'workspace-plus-plus' };
    plugin.data = { sessions: {}, sessionOrder: [], groups: {}, groupOrder: [], sessionGroups: {}, activeGroupId: null };
    // Deliberately NOT overriding plugin.getCurrentWorkspaceLayout - a real
    // plugin only has the prototype shim, which is what the adapter tests for.
    plugin.app = { workspace: { getLayout: () => layoutOnScreen } };
    return plugin;
}

test('the store reads the layout from the real workspace when nothing overrides it', async () => {
    const plugin = await createPlugin({ pane: 'live' });

    assert.deepEqual(
        plugin.getSessionStore().getCurrentWorkspaceLayout(),
        { pane: 'live' },
        'the store must reach app.workspace.getLayout()',
    );
});

test('the prototype shim and the store agree on the layout', async () => {
    const plugin = await createPlugin({ pane: 'live' });

    // sessions.js delegates to the store; both must observe the same workspace
    // rather than one of them silently returning an empty layout.
    assert.deepEqual(plugin.getCurrentWorkspaceLayout(), { pane: 'live' });
});

test.after(() => harness.restore());
