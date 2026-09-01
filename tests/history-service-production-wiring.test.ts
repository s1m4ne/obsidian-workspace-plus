// HistoryService reaches real workspace and plugin persistence without mock overrides.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';

const harness = setupHarness();
const { createRealPlugin } = await import('./real-plugin.ts');

interface HistoryServiceSurface {
    restoreFromHistoryEntry(sessionId: string, entryIndex: number): Promise<boolean>;
}

function createPlugin(): {
    plugin: ReturnType<typeof createRealPlugin>;
    persistCalls: () => number;
    appliedLayouts: unknown[];
} {
    const appliedLayouts: unknown[] = [];
    const plugin = createRealPlugin({
        app: {
            workspace: {
                changeLayout: async (layout: unknown): Promise<boolean> => {
                    appliedLayouts.push(layout);
                    return true;
                },
            },
        },
        data: {
            versionHistoryEnabled: true,
            activeSessionId: 's1',
            sessions: {
                s1: {
                    id: 's1',
                    name: 'Session 1',
                    layout: { root: 'current' },
                    history: [{ layout: { root: 'historical' }, savedAt: Date.now() - 1000 }],
                },
            },
            sessionOrder: ['s1'],
        },
    });

    let calls = 0;
    plugin.persistData = async (): Promise<boolean> => { calls += 1; return true; };
    return { plugin, persistCalls: () => calls, appliedLayouts };
}

function historyService(plugin: ReturnType<typeof createRealPlugin>): HistoryServiceSurface {
    return (plugin.getHistoryService as () => HistoryServiceSurface)();
}

test('HistoryService restores entry and persists through production wiring', async () => {
    const { plugin, persistCalls, appliedLayouts } = createPlugin();

    const ok = await historyService(plugin).restoreFromHistoryEntry('s1', 0);
    assert.equal(ok, true);
    assert.deepEqual(appliedLayouts, [{ root: 'historical' }]);
    assert.equal(persistCalls(), 1, 'must call host.persistData()');
});

test.after(() => harness.restore());
