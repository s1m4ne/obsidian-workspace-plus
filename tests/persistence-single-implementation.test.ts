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
import type { PersistenceService, PersistenceServiceHost } from '../src/storage/persistence-service.ts';
import { DEFAULT_DATA } from '../src/storage/default-data.ts';

interface Recorded {
    removed: string[];
    written: string[];
}

async function createService(recorded: Recorded, hooks: {
    persistData?: () => Promise<unknown>;
    clearBackupFiles?: () => Promise<unknown>;
} = {}): Promise<PersistenceService> {
    const data = Object.assign({}, DEFAULT_DATA, {
        activeSessionId: null, sessions: {}, sessionOrder: [],
        groups: {}, groupOrder: [], sessionGroups: {}, activeGroupId: null,
    });
    const adapter = {
        exists: () => Promise.resolve(true), read: () => Promise.resolve('{}'),
        list: () => Promise.resolve({ files: [], folders: [] }),
        write: (path: string) => { recorded.written.push(path); return Promise.resolve(); },
        mkdir: () => Promise.resolve(), remove: (path: string) => { recorded.removed.push(path); return Promise.resolve(); }, rename: () => Promise.resolve(), stat: () => Promise.resolve(null),
    };
    const host: PersistenceServiceHost = {
        data,
        manifest: { dir: '.obsidian/plugins/workspace-plus-plus' },
        app: {
        vault: {
            configDir: '.obsidian',
            adapter,
        },
        },
        loadData: async () => null,
        saveData: async () => { recorded.written.push('data.json'); },
        reloadExternalSessionStorageIfChanged: async () => false,
        recordSessionDataStored: async () => undefined,
        recordSessionStorageState: () => {},
        rotateBackupIfNeeded: async () => undefined,
        clearVersionHistoryEntries: () => true,
        resetSessionsToDefault: async () => true,
        persistData: hooks.persistData || (async () => undefined),
        persistDataImmediate: async () => undefined,
        clearBackupFiles: hooks.clearBackupFiles || (async () => undefined),
        readJsonIfExists: async () => ({ exists: false, data: null, error: null }),
        getFileMtime: async () => 0,
    };
    const { PersistenceService } = await import('../src/storage/persistence-service.ts');
    return new PersistenceService(host);
}

test('a caller that takes over clearBackupFiles is the only one that deletes', async () => {
    const harness = setupHarness();
    try {
        const recorded: Recorded = { removed: [], written: [] };
        let calls = 0;
        const service = await createService(recorded, { clearBackupFiles: async () => { calls += 1; } });

        await service.resetSessionsAndSettingsToDefault();

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
        let calls = 0;
        const service = await createService(recorded, { persistData: async () => { calls += 1; } });

        await service.clearBackupsAndVersionHistory();

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
        let calls = 0;
        const service = await createService(recorded, { persistData: async () => { calls += 1; } });

        const moved = await service.setSessionStorageLocation('vault-folder');

        assert.equal(moved, true);
        assert.equal(calls, 1, 'exactly one persist, and it is the caller\'s');
    } finally {
        harness.restore();
    }
});
