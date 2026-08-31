// Two paths in the load and move logic that no test reached.
//
// Both were already uncovered before persistence.js became PersistenceService -
// removing either line left every suite green - and both decide where a user's
// sessions end up, so they are the wrong pair to leave unprotected while the
// module is being rewritten.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';

const PLUGIN_DIR = '.obsidian/plugins/workspace-plus-plus';

interface TestPlugin {
    setSessionStorageLocation(location: string, options?: { silent?: boolean }): Promise<boolean>;
    getSessionStorageLocation(): string;
    loadWithBackup(): Promise<Record<string, unknown>>;
    [key: string]: unknown;
}

interface Harness {
    plugin: TestPlugin;
    saved: Array<Record<string, unknown>>;
}

async function createPlugin(options: {
    stored?: Record<string, unknown> | null;
    failWrites?: boolean;
} = {}): Promise<Harness> {
    const mod = await import('../src/plugin/methods/persistence.js');
    const attach = ((mod as { default?: unknown }).default ?? mod) as (target: unknown) => void;
    function PluginMock(this: unknown) {}
    attach(PluginMock);

    const saved: Array<Record<string, unknown>> = [];
    const plugin = new (PluginMock as unknown as new () => TestPlugin)();
    plugin.manifest = { id: 'workspace-plus-plus', dir: PLUGIN_DIR };
    plugin.data = {
        activeSessionId: 'a',
        sessions: { a: { id: 'a', name: 'A', layout: {}, modified: 1 } },
        sessionOrder: ['a'], groups: {}, groupOrder: [], sessionGroups: {}, activeGroupId: null,
    };
    plugin.app = {
        vault: {
            configDir: '.obsidian',
            adapter: {
                exists: () => Promise.resolve(false),
                read: () => Promise.resolve('{}'),
                list: () => Promise.resolve({ files: [], folders: [] }),
                write: (): Promise<void> => (options.failWrites
                    ? Promise.reject(new Error('disk full'))
                    : Promise.resolve()),
                mkdir: () => Promise.resolve(),
                remove: () => Promise.resolve(),
                stat: () => Promise.resolve(null),
            },
        },
    };
    plugin.loadData = (): Promise<unknown> => Promise.resolve(options.stored ?? null);
    plugin.saveData = (data: Record<string, unknown>): Promise<void> => {
        saved.push(data);
        return Promise.resolve();
    };
    return { plugin, saved };
}

test('a move that cannot be written leaves the location where it was', async () => {
    const harness = setupHarness();
    try {
        const { plugin } = await createPlugin({ failWrites: true });
        const before = plugin.getSessionStorageLocation();

        await assert.rejects(
            () => plugin.setSessionStorageLocation('vault-folder', { silent: true }),
            /disk full/,
            'the failure has to reach the caller, not be swallowed',
        );

        // Without the rollback the plugin would keep reading and writing the
        // vault folder, which the failed move never populated - the sessions
        // still in the plugin folder would simply stop appearing.
        assert.equal(plugin.getSessionStorageLocation(), before);
    } finally {
        harness.restore();
    }
});

test('a pre-move install has its stale sessions cleared out of data.json', async () => {
    const harness = setupHarness();
    try {
        // data.json holding sessions while the location is vault-folder is the
        // layout that predates the move out of data.json.
        const { plugin, saved } = await createPlugin({
            stored: {
                sessionStorageLocation: 'vault-folder',
                sessions: { old: { id: 'old', name: 'Old', layout: {}, modified: 1 } },
                sessionOrder: ['old'],
                activeSessionId: 'old',
            },
        });

        await plugin.loadWithBackup();

        const settingsWrites = saved.filter((data) => data.sessions === undefined);
        assert.ok(
            settingsWrites.length > 0,
            'data.json is rewritten without the sessions once they live in the vault folder',
        );
    } finally {
        harness.restore();
    }
});
