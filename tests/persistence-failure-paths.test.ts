// Two paths in the load and move logic that no test reached.
//
// Both were already uncovered before persistence.js became PersistenceService -
// removing either line left every suite green - and both decide where a user's
// sessions end up, so they are the wrong pair to leave unprotected while the
// module is being rewritten.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';
import type { PersistenceService, PersistenceServiceHost } from '../src/storage/persistence-service.ts';
import { DEFAULT_DATA } from '../src/storage/default-data.ts';

const PLUGIN_DIR = '.obsidian/plugins/workspace-plus-plus';

interface Harness {
    service: PersistenceService;
    saved: Array<Record<string, unknown>>;
}

async function createPlugin(options: {
    stored?: Record<string, unknown> | null;
    failWrites?: boolean;
} = {}): Promise<Harness> {
    const saved: Array<Record<string, unknown>> = [];
    const data = Object.assign({}, DEFAULT_DATA, {
        activeSessionId: 'a',
        sessions: { a: { id: 'a', name: 'A', layout: {}, modified: 1 } },
        sessionOrder: ['a'], groups: {}, groupOrder: [], sessionGroups: {}, activeGroupId: null,
    });
    const adapter = {
        exists: () => Promise.resolve(false),
        read: () => Promise.resolve('{}'),
        list: () => Promise.resolve({ files: [], folders: [] }),
        write: (): Promise<void> => (options.failWrites ? Promise.reject(new Error('disk full')) : Promise.resolve()),
        mkdir: () => Promise.resolve(), remove: () => Promise.resolve(), rename: () => Promise.resolve(), stat: () => Promise.resolve(null),
    };
    const host: PersistenceServiceHost = {
        data,
        manifest: { dir: PLUGIN_DIR },
        app: {
        vault: {
            configDir: '.obsidian',
            adapter,
        },
        },
        loadData: (): Promise<unknown> => Promise.resolve(options.stored ?? null),
        saveData: (savedData: unknown): Promise<void> => {
            if (savedData && typeof savedData === 'object') saved.push(savedData as Record<string, unknown>);
        return Promise.resolve();
        },
        reloadExternalSessionStorageIfChanged: async () => false,
        recordSessionDataStored: async () => undefined,
        recordSessionStorageState: () => {},
        rotateBackupIfNeeded: async () => undefined,
        clearVersionHistoryEntries: () => true,
        resetSessionsToDefault: async () => true,
        persistData: async () => true,
        persistDataImmediate: async () => true,
        clearBackupFiles: async () => undefined,
        readJsonIfExists: async () => ({ exists: false, data: null, error: null }),
        getFileMtime: async () => 0,
    };
    const { PersistenceService } = await import('../src/storage/persistence-service.ts');
    return { service: new PersistenceService(host), saved };
}

test('a move that cannot be written leaves the location where it was', async () => {
    const harness = setupHarness();
    try {
        const { service } = await createPlugin({ failWrites: true });
        const before = service.getSessionStorageLocation();

        await assert.rejects(
            () => service.setSessionStorageLocation('vault-folder', { silent: true }),
            /disk full/,
            'the failure has to reach the caller, not be swallowed',
        );

        // Without the rollback the plugin would keep reading and writing the
        // vault folder, which the failed move never populated - the sessions
        // still in the plugin folder would simply stop appearing.
        assert.equal(service.getSessionStorageLocation(), before);
    } finally {
        harness.restore();
    }
});

test('a pre-move install has its stale sessions cleared out of data.json', async () => {
    const harness = setupHarness();
    try {
        // data.json holding sessions while the location is vault-folder is the
        // layout that predates the move out of data.json.
        const { service, saved } = await createPlugin({
            stored: {
                sessionStorageLocation: 'vault-folder',
                sessions: { old: { id: 'old', name: 'Old', layout: {}, modified: 1 } },
                sessionOrder: ['old'],
                activeSessionId: 'old',
            },
        });

        await service.loadWithBackup();

        const settingsWrites = saved.filter((data) => data.sessions === undefined);
        assert.ok(
            settingsWrites.length > 0,
            'data.json is rewritten without the sessions once they live in the vault folder',
        );
    } finally {
        harness.restore();
    }
});
