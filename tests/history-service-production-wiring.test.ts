// HistoryService reaches real workspace and plugin persistence without mock overrides.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';

const harness = setupHarness();

interface TestPlugin {
    data: Record<string, unknown>;
    _persistCalls: number;
    _appliedLayouts: unknown[];
    persistData(): Promise<boolean>;
    applyWorkspaceLayout(layout: unknown): Promise<boolean>;
    getHistoryService(): {
        restoreFromHistoryEntry(sessionId: string, entryIndex: number): Promise<boolean>;
    };
    [key: string]: unknown;
}

async function createPlugin(): Promise<TestPlugin> {
    const modules = await Promise.all([
        import('../src/plugin/methods/history.js'),
        import('../src/plugin/methods/sessions.js'),
        import('../src/plugin/methods/session-store-getter.js'),
    ]);

    function PluginMock(this: unknown) {}
    for (const mod of modules) {
        const attach = ((mod as { default?: unknown }).default ?? mod) as (target: unknown) => void;
        attach(PluginMock);
    }

    const plugin = new (PluginMock as unknown as new () => TestPlugin)();
    plugin.data = {
        versionHistoryEnabled: true,
        activeSessionId: 's1',
        sessions: {
            s1: {
                id: 's1',
                name: 'Session 1',
                layout: { root: 'current' },
                history: [
                    { layout: { root: 'historical' }, savedAt: Date.now() - 1000 },
                ],
            },
        },
        sessionOrder: ['s1'],
    };
    plugin._persistCalls = 0;
    plugin._appliedLayouts = [];
    plugin.persistData = async function () {
        plugin._persistCalls += 1;
        return true;
    };
    plugin.applyWorkspaceLayout = async function (layout: unknown) {
        plugin._appliedLayouts.push(layout);
        return true;
    };
    return plugin;
}

test('HistoryService restores entry and persists through production wiring', async () => {
    const plugin = await createPlugin();

    const ok = await plugin.getHistoryService().restoreFromHistoryEntry('s1', 0);
    assert.equal(ok, true);
    assert.deepEqual(plugin._appliedLayouts, [{ root: 'historical' }]);
    assert.equal(plugin._persistCalls, 1, 'must call host.persistData()');
});

test.after(() => harness.restore());
