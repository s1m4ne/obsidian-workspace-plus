// SettingsState reaches the plugin's real persistence, not a double.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';

const harness = setupHarness();
const { createRealPlugin } = await import('./real-plugin.ts');

interface SettingsStateSurface {
    setWarnOnUnsavedSwitch(enabled: boolean): Promise<boolean>;
    warnOnUnsavedSwitch: boolean;
}

function createPlugin(): {
    plugin: ReturnType<typeof createRealPlugin>;
    persistCalls: () => number;
} {
    const plugin = createRealPlugin({ data: { warnOnUnsavedSwitch: true } });
    let calls = 0;
    // The one outward hook this test counts. Overriding it on the instance is
    // the path a caller replacing plugin.persistData takes in production too.
    plugin.persistData = async (): Promise<boolean> => { calls += 1; return true; };
    return { plugin, persistCalls: () => calls };
}

function settingsState(plugin: ReturnType<typeof createRealPlugin>): SettingsStateSurface {
    return (plugin.getSettingsState as () => SettingsStateSurface)();
}

test('SettingsState calls the plugin persistData on a setting mutation', async () => {
    const { plugin, persistCalls } = createPlugin();

    assert.equal(settingsState(plugin).warnOnUnsavedSwitch, true);
    await settingsState(plugin).setWarnOnUnsavedSwitch(false);

    assert.equal(plugin.data.warnOnUnsavedSwitch, false);
    assert.equal(persistCalls(), 1, 'SettingsState must call host.persistData()');
});

test('the plugin method delegates to SettingsState and persists', async () => {
    const { plugin, persistCalls } = createPlugin();

    await (plugin.setWarnOnUnsavedSwitch as (v: boolean) => Promise<boolean>)(false);

    assert.equal(plugin.data.warnOnUnsavedSwitch, false);
    assert.equal(persistCalls(), 1);
});

test.after(() => harness.restore());
