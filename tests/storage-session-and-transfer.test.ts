import test from 'node:test';
import assert from 'node:assert/strict';
import { installObsidianStub } from './lock/harness/index.ts';

installObsidianStub();

import { JsonFileStore, type StorageAdapter } from '../src/storage/json-file-store.ts';
import { SessionStorage } from '../src/storage/session-storage.ts';
import type { PluginData } from '../src/storage/default-data.ts';
import type { SessionDataPayload } from '../src/storage/storage-backup.ts';
import type { StorageExportHost, StorageImportHost } from '../src/storage/storage-transfer.ts';

class MemoryStorageAdapter implements StorageAdapter {
    public files: Map<string, string> = new Map();
    public dirs: Set<string> = new Set();

    async exists(path: string): Promise<boolean> {
        return this.files.has(path) || this.dirs.has(path);
    }
    async read(path: string): Promise<string> {
        const c = this.files.get(path);
        if (c === undefined) throw new Error(`Not found: ${path}`);
        return c;
    }
    async write(path: string, data: string): Promise<void> {
        this.files.set(path, data);
    }
    async remove(path: string): Promise<void> {
        this.files.delete(path);
    }
    async rename(from: string, to: string): Promise<void> {
        const c = this.files.get(from);
        if (c !== undefined) {
            this.files.set(to, c);
            this.files.delete(from);
        }
    }
    async mkdir(path: string): Promise<void> {
        this.dirs.add(path);
    }
    async stat(): Promise<{ mtime: number } | null> {
        return { mtime: Date.now() };
    }
}

test('SessionStorage: path resolution and location switching with custom configDir', async () => {
    const adapter = new MemoryStorageAdapter();
    const store = new JsonFileStore(adapter);
    const storage = new SessionStorage({
        store,
        manifestDir: null,
        configDir: '.custom-config',
    });

    assert.equal(storage.getPluginStorageDirPath(), '.custom-config/plugins/workspace-plus-plus');
    assert.equal(storage.getStorageDirPath(), '.workspace-plus-plus');
    assert.equal(storage.getLocation(), 'plugin-folder');

    storage.setLocation('vault-folder');
    assert.equal(storage.getLocation(), 'vault-folder');
    assert.equal(storage.getSessionStorageDirPath(), '.workspace-plus-plus');
    assert.equal(storage.getSessionsPath(), '.workspace-plus-plus/sessions.json');

    storage.setLocation('plugin-folder');
    assert.equal(storage.getSessionsPath(), '.custom-config/plugins/workspace-plus-plus/data.json');
});

test('SessionStorage: history write, read and attach round-trip', async () => {
    const adapter = new MemoryStorageAdapter();
    const store = new JsonFileStore(adapter);
    const storage = new SessionStorage({ store, manifestDir: 'test-plugin' });

    await storage.writeSessionHistory({
        s1: [{ timestamp: 1234, layout: {} }],
    });

    const read = await storage.readSessionHistory();
    assert.deepEqual(read, {
        s1: [{ timestamp: 1234, layout: {} }],
    });

    const sessionData = {
        sessions: {
            s1: { id: 's1', name: 'S1', layout: {} },
        },
    };
    const attached = await storage.attachSessionHistory(sessionData) as { sessions: Record<string, { history?: unknown[] }> };
    assert.deepEqual(attached.sessions.s1?.history, [{ timestamp: 1234, layout: {} }]);
});

test('storage backup functions: prepare data and rotate backups', async () => {
    const {
        getBackupPlatformLabel,
        prepareRotationBackupData,
        initRotationBackupTimestamp,
        rotateBackupIfNeeded,
        getRotationBackupInfo,
    } = await import('../src/storage/storage-backup.ts');

    const adapter = new MemoryStorageAdapter();
    const store = new JsonFileStore(adapter);

    const platformLabel = getBackupPlatformLabel();
    assert.equal(typeof platformLabel, 'string');

    const data = prepareRotationBackupData({ sessions: { s1: {} } });
    assert.ok('sessions' in data);

    const getBackupPath = (gen: number) => `backups/sessions.${gen}.json`;

    adapter.files.set(getBackupPath(1), JSON.stringify({ _wppSavedAt: 5000 }));
    const stamp = await initRotationBackupTimestamp(store, getBackupPath(1));
    assert.equal(stamp, 5000);

    const now = 10000000;
    const newStamp = await rotateBackupIfNeeded(store, 'backups', getBackupPath, stamp, { sessions: { s1: {} } }, now);
    assert.equal(newStamp, now);

    const info = await getRotationBackupInfo(store, getBackupPath);
    assert.ok(info.length >= 1);
});

test('storage transfer functions: formatting, payload creation and latest file search', async () => {
    const {
        pad2,
        formatExportStamp,
        createExportPayload,
        findLatestExportFile,
        validateExportedSessionData,
    } = await import('../src/storage/storage-transfer.ts');

    assert.equal(pad2(5), '05');
    assert.equal(pad2(12), '12');

    const stamp = formatExportStamp(new Date(2026, 7, 30, 12, 34, 56).getTime());
    assert.equal(stamp, '20260830-123456');

    const payload = createExportPayload({ sessions: { a: { id: 'a', history: [1] } } }, 'my-plugin');
    assert.equal(payload.source, 'my-plugin');
    assert.ok(payload.exportedAt > 0);

    const latest = findLatestExportFile(['sessions-20260801.json', 'sessions-20260810.json', 'readme.txt']);
    assert.equal(latest, 'sessions-20260810.json');
    assert.equal(findLatestExportFile([]), null);

    const valid = validateExportedSessionData({ activeSessionId: 'a', sessions: { a: {} } }, (d) => d);
    assert.ok(valid !== null);

    const invalid = validateExportedSessionData({ activeSessionId: 'a', sessions: {} }, (d) => d);
    assert.equal(invalid, null);
});

test('storage transfer: exportSessionsSnapshot and importSessionsFromLatestExport host functions', async () => {
    const { exportSessionsSnapshot, importSessionsFromLatestExport } = await import('../src/storage/storage-transfer.ts');

    const writtenFiles: Record<string, string> = {};
    const testData = {
        activeSessionId: 's1',
        sessions: { s1: { id: 's1', name: 'S1', layout: {} } },
        sessionOrder: ['s1'],
        groups: {},
        groupOrder: [],
        sessionGroups: {},
        activeGroupId: null,
    } as unknown as PluginData;

    const exportHost: StorageExportHost = {
        data: testData,
        manifest: { id: 'test-plugin' },
        getExportDirPath: () => 'exports',
        extractSessionData: (d: PluginData) => d,
        ensureSessionStorageDir: async () => {},
        ensureDir: async () => {},
        writeJson: async (path: string, payload: unknown) => {
            writtenFiles[path] = JSON.stringify(payload);
        },
    };

    const filePath = await exportSessionsSnapshot(exportHost);
    assert.ok(filePath.startsWith('exports/sessions-'));
    assert.ok(writtenFiles[filePath]);

    // Test import with no dir
    let listCalled = false;
    const noDirHost: StorageImportHost = {
        app: {
            vault: {
                adapter: {
                    exists: async () => false,
                    list: async () => {
                        listCalled = true;
                        return { files: [] };
                    },
                    read: async () => '',
                },
            },
        },
        data: testData,
        getExportDirPath: () => 'exports',
        normalizeSessionData: (d: unknown) => d as SessionDataPayload,
        syncSessionOrder: () => {},
        updateStatusBar: () => {},
        syncSessionCommands: () => {},
        persistData: async () => {},
        reloadCurrentSessionWithoutSaving: async () => {},
    };
    const noDirResult = await importSessionsFromLatestExport(noDirHost);
    assert.equal(noDirResult, false);
    assert.equal(listCalled, false);

    // Test import with empty files
    const emptyFilesHost = {
        ...noDirHost,
        app: {
            vault: {
                adapter: {
                    exists: async () => true,
                    list: async () => ({ files: [] }),
                    read: async () => '',
                },
            },
        },
    };
    const emptyResult = await importSessionsFromLatestExport(emptyFilesHost);
    assert.equal(emptyResult, false);
});
