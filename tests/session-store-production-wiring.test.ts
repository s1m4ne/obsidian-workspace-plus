// The store reaches the real workspace, not just a test double.
//
// Every other test injects getCurrentWorkspaceLayout onto the plugin, so the
// override branch always won and the path that actually runs in Obsidian -
// app.workspace.getLayout() - was never executed. Breaking it used to leave all
// 290 tests green. This test takes the branch a real plugin takes: nothing is
// overridden, so the wiring must fall through to the workspace.
//
// It builds the real plugin class rather than attaching adapters to a mock. The
// wiring under test is the plugin's, so a mock carrying a copy of it could pass
// while the plugin's own wiring was broken - which is the failure this file
// exists to catch.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';

const harness = setupHarness();

const WorkspacePlusPlus = (await import('../src/main.ts')).default as unknown as new (
    app: unknown,
    manifest: { id: string; dir: string },
) => {
    data: Record<string, unknown>;
    getCurrentWorkspaceLayout(): unknown;
    getSessionStore(): { getCurrentWorkspaceLayout(): unknown };
};

function createPlugin(layoutOnScreen: unknown) {
    const app = {
        vault: { configDir: '.obsidian', adapter: {} },
        workspace: { getLayout: () => layoutOnScreen },
        metadataCache: { on: () => ({}), getFileCache: () => null },
        keymap: {}, scope: {},
    };
    const plugin = new WorkspacePlusPlus(app, {
        id: 'workspace-plus-plus',
        dir: '.obsidian/plugins/workspace-plus-plus',
    });
    // onload() is not run: it would load data from disk and start timers. Only
    // the fields the layout path reads are set.
    plugin.data = { sessions: {}, sessionOrder: [], groups: {}, groupOrder: [], sessionGroups: {}, activeGroupId: null };
    return plugin;
}

test('the store reads the layout from the real workspace when nothing overrides it', () => {
    const plugin = createPlugin({ pane: 'live' });

    assert.deepEqual(
        plugin.getSessionStore().getCurrentWorkspaceLayout(),
        { pane: 'live' },
        'the store must reach app.workspace.getLayout()',
    );
});

test('the plugin and the store agree on the layout', () => {
    const plugin = createPlugin({ pane: 'live' });

    // Both must observe the same workspace rather than one of them silently
    // returning an empty layout.
    assert.deepEqual(plugin.getCurrentWorkspaceLayout(), { pane: 'live' });
});

test.after(() => harness.restore());
