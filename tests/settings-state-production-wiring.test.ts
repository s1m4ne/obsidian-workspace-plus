import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';

const harness = setupHarness();

interface TestPlugin {
    data: Record<string, unknown>;
    _persistCalls: number;
    persistData(): Promise<boolean>;
    getSettingsState(): {
        setWarnOnUnsavedSwitch(enabled: boolean): Promise<boolean>;
        warnOnUnsavedSwitch: boolean;
    };
    setWarnOnUnsavedSwitch(enabled: boolean): Promise<boolean>;
    [key: string]: unknown;
}

async function createPlugin(): Promise<TestPlugin> {
    const modules = await Promise.all([
        import('../src/plugin/methods/settings-state.js'),
    ]);

    function PluginMock(this: unknown) {}
    for (const mod of modules) {
        const attach = ((mod as { default?: unknown }).default ?? mod) as (target: unknown) => void;
        attach(PluginMock);
    }

    const plugin = new (PluginMock as unknown as new () => TestPlugin)();
    plugin.data = { warnOnUnsavedSwitch: true };
    plugin._persistCalls = 0;
    plugin.persistData = async function () {
        plugin._persistCalls += 1;
        return true;
    };
    return plugin;
}

test('SettingsState calls real plugin.persistData on setting mutation', async () => {
    const plugin = await createPlugin();

    assert.equal(plugin.getSettingsState().warnOnUnsavedSwitch, true);
    await plugin.getSettingsState().setWarnOnUnsavedSwitch(false);

    assert.equal(plugin.data.warnOnUnsavedSwitch, false);
    assert.equal(plugin._persistCalls, 1, 'SettingsState must call host.persistData()');
});

test('prototype shim delegates to SettingsState and persists', async () => {
    const plugin = await createPlugin();

    await plugin.setWarnOnUnsavedSwitch(false);
    assert.equal(plugin.data.warnOnUnsavedSwitch, false);
    assert.equal(plugin._persistCalls, 1);
});

test.after(() => harness.restore());
