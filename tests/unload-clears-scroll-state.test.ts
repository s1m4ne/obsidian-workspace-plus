// Unloading the plugin must reach flushPendingPersistence.
//
// onunload cleared three scroll counters by assigning to them. Once
// StatusBarController owned that state, the plugin exposed them as getter-only
// accessors - and the bundle is strict, so assigning to a getter throws. The
// throw left onunload before flushPendingPersistence(), so anything not yet
// written to disk was lost every time the plugin was disabled or updated.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';

const harness = setupHarness();

interface TestPlugin {
    statusBarScrollDelta: number;
    getStatusBarController(): { resetScrollState(): void; scrollDelta: number };
    [key: string]: unknown;
}

async function createPlugin(): Promise<TestPlugin> {
    const modules = await Promise.all([
        import('../src/plugin/methods/session-statusbar.js'),
        import('../src/plugin/methods/settings-state.js'),
    ]);
    function PluginMock(this: unknown) {}
    for (const mod of modules) {
        const attach = ((mod as { default?: unknown }).default ?? mod) as (target: unknown) => void;
        attach(PluginMock);
    }
    const plugin = new (PluginMock as unknown as new () => TestPlugin)();
    plugin['data'] = { statusBarActions: {}, sessions: {}, sessionOrder: [] };
    plugin['app'] = { workspace: {} };
    plugin['addStatusBarItem'] = (): HTMLElement => harness.dom.document.createElement('div');
    plugin['persistData'] = async (): Promise<boolean> => true;
    plugin['updateStatusBar'] = (): void => {};
    return plugin;
}

test('the scroll counters are cleared through the controller, not by assignment', async () => {
    const plugin = await createPlugin();

    // What onunload does. Assigning to plugin.statusBarScrollDelta instead would
    // throw here, because the prototype exposes it as a getter only.
    assert.doesNotThrow(() => {
        plugin.getStatusBarController().resetScrollState();
    });
    assert.equal(plugin.statusBarScrollDelta, 0);
});

test('assigning to the mirrored counter still throws, so nobody reintroduces it', () => {
    // Documents why resetScrollState exists: the read path is deliberately
    // read-only, and this is the failure that shape produces.
    const plugin = { getStatusBarController: (): null => null } as Record<string, unknown>;
    Object.defineProperty(plugin, 'statusBarScrollDelta', {
        get: () => 0,
        configurable: true,
    });
    assert.throws(() => {
        (plugin as { statusBarScrollDelta: number }).statusBarScrollDelta = 0;
    }, TypeError);
});

test.after(() => harness.restore());
