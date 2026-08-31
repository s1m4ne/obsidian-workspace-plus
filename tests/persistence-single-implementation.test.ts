// A caller that replaces a persistence method must be the only implementation
// that runs.
//
// The first version of the adapter decided this from the return value: it called
// whatever the plugin had, and if that returned nothing falsy-truthy testing sent
// it on to the service's own method as well. A void override - the ordinary shape
// for `clearBackupFiles = () => { calls++; }` - therefore ran twice, and the
// second run deleted eleven backup files that the caller had taken over
// responsibility for.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';

interface Recorded {
    removed: string[];
    written: string[];
}

interface TestPlugin {
    resetSessionsAndSettingsToDefault(): Promise<unknown>;
    clearBackupsAndVersionHistory(): Promise<unknown>;
    setSessionStorageLocation(location: string): Promise<boolean>;
    [key: string]: unknown;
}

async function createPlugin(recorded: Recorded): Promise<TestPlugin> {
    const mod = await import('../src/plugin/methods/persistence.js');
    const attach = ((mod as { default?: unknown }).default ?? mod) as (target: unknown) => void;
    function PluginMock(this: unknown) {}
    attach(PluginMock);

    const plugin = new (PluginMock as unknown as new () => TestPlugin)();
    plugin.manifest = { id: 'workspace-plus-plus', dir: '.obsidian/plugins/workspace-plus-plus' };
    plugin.data = {
        activeSessionId: null, sessions: {}, sessionOrder: [],
        groups: {}, groupOrder: [], sessionGroups: {}, activeGroupId: null,
    };
    plugin.app = {
        vault: {
            configDir: '.obsidian',
            adapter: {
                // Every backup file is present, so a stray clearBackupFiles() shows
                // up as real deletions rather than as no-ops.
                exists: () => Promise.resolve(true),
                read: () => Promise.resolve('{}'),
                list: () => Promise.resolve({ files: [], folders: [] }),
                write: (path: string) => { recorded.written.push(path); return Promise.resolve(); },
                mkdir: () => Promise.resolve(),
                remove: (path: string) => { recorded.removed.push(path); return Promise.resolve(); },
                stat: () => Promise.resolve(null),
            },
        },
    };
    plugin.loadData = (): Promise<unknown> => Promise.resolve(null);
    plugin.saveData = (): Promise<void> => { recorded.written.push('data.json'); return Promise.resolve(); };
    plugin.resetSessionsToDefault = (): Promise<boolean> => Promise.resolve(true);
    plugin.clearVersionHistoryEntries = (): boolean => true;
    return plugin;
}

test('a caller that takes over clearBackupFiles is the only one that deletes', async () => {
    const harness = setupHarness();
    try {
        const recorded: Recorded = { removed: [], written: [] };
        const plugin = await createPlugin(recorded);

        let calls = 0;
        // Returns nothing, which is what a void override looks like.
        plugin.clearBackupFiles = (): void => { calls += 1; };

        await plugin.resetSessionsAndSettingsToDefault();

        assert.equal(calls, 1, 'the replacement runs');
        assert.deepEqual(recorded.removed, [], 'and the service does not delete behind it');
    } finally {
        harness.restore();
    }
});

test('a caller that takes over persistData is the only one that writes', async () => {
    const harness = setupHarness();
    try {
        const recorded: Recorded = { removed: [], written: [] };
        const plugin = await createPlugin(recorded);

        let calls = 0;
        plugin.persistData = (): void => { calls += 1; };

        await plugin.clearBackupsAndVersionHistory();

        assert.equal(calls, 1, 'the replacement runs');
        assert.deepEqual(recorded.written, [], 'and no second write reaches disk');
    } finally {
        harness.restore();
    }
});

test('moving the storage location persists through the caller, not around it', async () => {
    const harness = setupHarness();
    try {
        const recorded: Recorded = { removed: [], written: [] };
        const plugin = await createPlugin(recorded);

        let calls = 0;
        plugin.persistData = (): void => { calls += 1; };

        const moved = await plugin.setSessionStorageLocation('vault-folder');

        assert.equal(moved, true);
        assert.equal(calls, 1, 'exactly one persist, and it is the caller\'s');
    } finally {
        harness.restore();
    }
});
