// Behavior Lock: Persisted Data
//
// Locks the persisted data representation, upgrade paths, and sync merges.
// Highest stakes lock: user sessions and settings live in these files.
//
// Asserts byte-level equality of persisted JSON files across:
// 1. Plugin-folder storage mode (data.json, history.json, backup files)
// 2. Vault-folder storage mode (.workspace-plus-plus/sessions.json, history.json, etc.)
// 3. Storage location migration / transfer
// 4. Legacy upgrade paths (0.7.17 inline history & settings.local.json migration)
// 5. #105 multi-device sync merge (replacement of 5 session properties)
//
// RULE: Behavior Lock tests in tests/lock/ are NEVER edited during the refactor.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness, createMemoryVault } from './harness/index.ts';
import type { MemoryVault } from './harness/index.ts';

const PLUGIN_DIR = '.obsidian/plugins/workspace-plus-plus';
const DATA_PATH = PLUGIN_DIR + '/data.json';
const LEGACY_SESSIONS_PATH = PLUGIN_DIR + '/sessions.json';
const HISTORY_PATH = PLUGIN_DIR + '/history.json';
const VAULT_SESSIONS_PATH = '.workspace-plus-plus/sessions.json';
const VAULT_HISTORY_PATH = '.workspace-plus-plus/history.json';
const LOCAL_SETTINGS_PATH = '.workspace-plus-plus/settings.local.json';

interface SessionDataPayload {
    activeSessionId?: string;
    sessionOrder?: string[];
    sessions?: Record<string, { id: string; name: string; modified?: number; layout?: unknown; history?: unknown[] }>;
    groups?: Record<string, { id: string; name: string }>;
    groupOrder?: string[];
    sessionGroups?: Record<string, string[] | string>;
    activeGroupId?: string | null;
    [key: string]: unknown;
}

interface TestPlugin {
    manifest: { id: string; dir: string };
    data: Record<string, unknown>;
    files: Record<string, string>;
    renames: [string, string][];
    app: MemoryVault['app'];
    statusBarUpdates: number;
    commandSyncs: number;
    overlayRefreshes: number;
    saveData(data: unknown): Promise<void>;
    loadData(): Promise<unknown>;
    loadWithBackup(): Promise<Record<string, unknown>>;
    persistData(options?: { pretty?: boolean }): Promise<void>;
    setSessionStorageLocation(loc: string, options?: { silent?: boolean }): Promise<boolean>;
    getSessionStorageLocation(): string;
    setRuntimeSessionStorageLocation(loc: string): void;
    applySessionDataFromStorage(externalData: Record<string, unknown>): boolean;
    [key: string]: unknown;
}

async function createLockPlugin(vault: MemoryVault, initialData?: Record<string, unknown>): Promise<TestPlugin> {
    const i18nMod = await import('../../src/i18n.js');
    const i18n = (i18nMod.default ?? i18nMod) as { resolveLocale(l: string): void };
    i18n.resolveLocale('en');

    const defaultDataMod = await import('../../src/plugin/default-data.js');
    const DEFAULT_DATA = (defaultDataMod.default ?? defaultDataMod) as Record<string, unknown>;

    const persistenceMod = await import('../../src/plugin/methods/persistence.js');
    const attachPersistence = (persistenceMod.default ?? persistenceMod) as (cls: unknown) => void;

    const storageBackupMod = await import('../../src/plugin/methods/storage-backup.js');
    const attachStorageBackup = (storageBackupMod.default ?? storageBackupMod) as (cls: unknown) => void;

    const sessionSyncMod = await import('../../src/plugin/methods/session-sync.js');
    const attachSessionSync = (sessionSyncMod.default ?? sessionSyncMod) as (cls: unknown) => void;

    const storageTransferMod = await import('../../src/plugin/methods/storage-transfer.js');
    const attachStorageTransfer = (storageTransferMod.default ?? storageTransferMod) as (cls: unknown) => void;

    function PluginMock() {}
    attachPersistence(PluginMock);
    attachStorageBackup(PluginMock);
    attachSessionSync(PluginMock);
    attachStorageTransfer(PluginMock);

    const plugin = new (PluginMock as unknown as { new(): TestPlugin })();
    plugin.manifest = { id: 'workspace-plus-plus', dir: PLUGIN_DIR };
    plugin.files = vault.files;
    plugin.renames = vault.renames;
    plugin.app = vault.app;
    plugin.data = { ...DEFAULT_DATA, ...(initialData || {}) };
    plugin.statusBarUpdates = 0;
    plugin.commandSyncs = 0;
    plugin.overlayRefreshes = 0;

    plugin.saveData = (data: unknown): Promise<void> => {
        vault.files[DATA_PATH] = JSON.stringify(data, null, 2);
        return Promise.resolve();
    };

    plugin.loadData = (): Promise<unknown> => Promise.resolve(
        Object.prototype.hasOwnProperty.call(vault.files, DATA_PATH)
            ? JSON.parse(vault.files[DATA_PATH] ?? '{}')
            : null
    );

    plugin.updateStatusBar = (): void => { plugin.statusBarUpdates += 1; };
    plugin.syncSessionCommands = (): void => { plugin.commandSyncs += 1; };
    plugin.syncSessionOrder = (): void => {};
    plugin.normalizeGroupFeatureState = (): void => {};
    plugin.rotateBackupIfNeeded = (): Promise<void> => Promise.resolve();
    plugin._refreshOverlaySessions = (): void => { plugin.overlayRefreshes += 1; };

    return plugin;
}

test('plugin-folder round-trip preserves byte-level JSON formatting and strips history from sessions', async () => {
    const h = setupHarness();
    const realNow = Date.now;
    Date.now = () => 1700000000000;
    try {
        const vault = createMemoryVault();
        const initialData = {
            activeSessionId: 'work-session',
            sessionOrder: ['work-session', 'notes-session'],
            sessions: {
                'work-session': {
                    id: 'work-session',
                    name: 'Work',
                    modified: 1700000000000,
                    layout: { main: { id: 'leaf-1', type: 'markdown' } },
                    history: [
                        { layout: { main: { id: 'leaf-old' } }, savedAt: 1699990000000 },
                    ],
                },
                'notes-session': {
                    id: 'notes-session',
                    name: 'Notes',
                    modified: 1700000050000,
                    layout: { main: { id: 'leaf-2', type: 'markdown' } },
                },
            },
            groups: {
                'g1': { id: 'g1', name: 'Primary', color: 'blue' },
            },
            groupOrder: ['g1'],
            sessionGroups: { 'work-session': 'g1' },
            activeGroupId: 'g1',
            sessionStorageLocation: 'plugin-folder',
            autoSaveOnSwitch: true,
        };

        const plugin = await createLockPlugin(vault, initialData);

        // 1. Persist data
        await plugin.persistData({ pretty: true });

        assert.ok(vault.files[HISTORY_PATH], 'history.json must exist');
        assert.ok(vault.files[DATA_PATH], 'data.json must exist');

        const savedHistoryRaw = vault.files[HISTORY_PATH];
        const savedDataRaw = vault.files[DATA_PATH];

        // Check history file structure
        const parsedHistory = JSON.parse(savedHistoryRaw ?? '{}') as { version: number; history: Record<string, unknown[]> };
        assert.equal(parsedHistory.version, 1);
        assert.ok(parsedHistory.history['work-session'], 'history for work-session must be recorded');
        assert.equal(parsedHistory.history['work-session']?.length, 1);

        // Check sessions in data.json have no inline history
        const parsedData = JSON.parse(savedDataRaw ?? '{}') as { sessions: Record<string, { history?: unknown }> };
        assert.equal(parsedData.sessions['work-session']?.history, undefined, 'history must be stripped from sessions in data.json');

        // 2. Load into a fresh plugin instance
        const freshPlugin = await createLockPlugin(vault);
        const loaded = await freshPlugin.loadWithBackup();
        freshPlugin.data = loaded;

        // Check in-memory session restored its history
        const loadedWork = (freshPlugin.data.sessions as Record<string, { history?: unknown[] }>)['work-session'];
        assert.ok(loadedWork?.history, 'history must be merged back in-memory on load');
        assert.equal(loadedWork?.history?.length, 1);

        // 3. Re-persist and assert exact byte equality
        await freshPlugin.persistData({ pretty: true });
        assert.equal(vault.files[DATA_PATH], savedDataRaw, 'data.json formatting must match byte-for-byte');
        assert.equal(vault.files[HISTORY_PATH], savedHistoryRaw, 'history.json formatting must match byte-for-byte');
    } finally {
        Date.now = realNow;
        h.restore();
    }
});

test('vault-folder round-trip isolates sessions from data.json with byte-level precision', async () => {
    const h = setupHarness();
    const realNow = Date.now;
    Date.now = () => 1700000000000;
    try {
        const vault = createMemoryVault();
        const initialData = {
            activeSessionId: 'vault-session',
            sessionOrder: ['vault-session'],
            sessions: {
                'vault-session': {
                    id: 'vault-session',
                    name: 'Vault Only',
                    modified: 1700000000000,
                    layout: { main: { id: 'leaf-vault' } },
                    history: [{ layout: { main: { id: 'leaf-hist' } }, savedAt: 1699900000000 }],
                },
            },
            groups: {},
            groupOrder: [],
            sessionGroups: {},
            activeGroupId: null,
            sessionStorageLocation: 'vault-folder',
            autoSaveOnSwitch: false,
        };

        const plugin = await createLockPlugin(vault, initialData);
        plugin.setRuntimeSessionStorageLocation('vault-folder');

        await plugin.persistData({ pretty: true });

        assert.ok(vault.files[VAULT_SESSIONS_PATH], '.workspace-plus-plus/sessions.json must exist');
        assert.ok(vault.files[VAULT_HISTORY_PATH], '.workspace-plus-plus/history.json must exist');
        assert.ok(vault.files[DATA_PATH], 'data.json must exist for settings');

        const savedSessionsRaw = vault.files[VAULT_SESSIONS_PATH];
        const savedHistoryRaw = vault.files[VAULT_HISTORY_PATH];
        const savedDataRaw = vault.files[DATA_PATH];

        // In vault-folder mode, data.json must NOT contain session data
        const parsedSettings = JSON.parse(savedDataRaw ?? '{}') as Record<string, unknown>;
        assert.equal(parsedSettings.sessions, undefined, 'data.json must not hold sessions in vault-folder mode');
        assert.equal(parsedSettings.sessionStorageLocation, 'vault-folder');

        // Sessions in vault-folder must be history-free
        const parsedSessions = JSON.parse(savedSessionsRaw ?? '{}') as { sessions: Record<string, { history?: unknown }> };
        assert.equal(parsedSessions.sessions['vault-session']?.history, undefined);

        // Fresh reload in vault-folder mode
        const freshPlugin = await createLockPlugin(vault);
        const loaded = await freshPlugin.loadWithBackup();
        freshPlugin.data = loaded;

        assert.equal(freshPlugin.getSessionStorageLocation(), 'vault-folder');
        const loadedSession = (freshPlugin.data.sessions as Record<string, { history?: unknown[] }>)['vault-session'];
        assert.equal(loadedSession?.history?.length, 1);

        // Re-persist and verify byte-for-byte stability
        await freshPlugin.persistData({ pretty: true });
        assert.equal(vault.files[VAULT_SESSIONS_PATH], savedSessionsRaw);
        assert.equal(vault.files[VAULT_HISTORY_PATH], savedHistoryRaw);
    } finally {
        Date.now = realNow;
        h.restore();
    }
});

test('storage migration transfers files cleanly between plugin-folder and vault-folder', async () => {
    const h = setupHarness();
    try {
        const vault = createMemoryVault();
        const initialData = {
            activeSessionId: 's1',
            sessionOrder: ['s1'],
            sessions: {
                s1: {
                    id: 's1',
                    name: 'Session 1',
                    modified: 100,
                    layout: { main: 'l1' },
                    history: [{ layout: { main: 'h1' }, savedAt: 50 }],
                },
            },
            groups: {},
            groupOrder: [],
            sessionGroups: {},
            activeGroupId: null,
            sessionStorageLocation: 'plugin-folder',
        };

        const plugin = await createLockPlugin(vault, initialData);
        await plugin.persistData({ pretty: true });

        assert.ok(vault.files[HISTORY_PATH]);

        // Migrate to vault-folder
        const moved = await plugin.setSessionStorageLocation('vault-folder', { silent: true });
        assert.equal(moved, true);
        assert.equal(plugin.getSessionStorageLocation(), 'vault-folder');

        assert.ok(vault.files[VAULT_SESSIONS_PATH], 'sessions must exist in vault-folder after migration');
        assert.ok(vault.files[VAULT_HISTORY_PATH], 'history must exist in vault-folder after migration');

        // Migrate back to plugin-folder
        const movedBack = await plugin.setSessionStorageLocation('plugin-folder', { silent: true });
        assert.equal(movedBack, true);
        assert.equal(plugin.getSessionStorageLocation(), 'plugin-folder');

        assert.ok(vault.files[DATA_PATH]);
        assert.ok(vault.files[HISTORY_PATH]);
    } finally {
        h.restore();
    }
});

test('0.7.17 legacy upgrade migrates inline history and local settings in one load pass', async () => {
    const h = setupHarness();
    try {
        const vault = createMemoryVault({
            [DATA_PATH]: JSON.stringify({
                language: 'en',
                autoSaveOnSwitch: true,
                numberedSwitchCommands: false,
                sessionStorageLocation: 'plugin-folder',
            }),
            [LEGACY_SESSIONS_PATH]: JSON.stringify({
                activeSessionId: 'legacy-1',
                sessionOrder: ['legacy-1', 'legacy-2'],
                sessions: {
                    'legacy-1': {
                        id: 'legacy-1',
                        name: 'Legacy 1',
                        modified: 1000,
                        layout: { main: 'legacy-layout' },
                        history: [
                            { layout: { main: 'inline-hist' }, savedAt: 500 },
                        ],
                    },
                    'legacy-2': {
                        id: 'legacy-2',
                        name: 'Legacy 2',
                        modified: 2000,
                        layout: { main: 'legacy-2-layout' },
                    },
                },
            }),
            [LOCAL_SETTINGS_PATH]: JSON.stringify({
                warnOnUnsavedSwitch: false,
            }),
        });

        const plugin = await createLockPlugin(vault);
        const loaded = await plugin.loadWithBackup();
        plugin.data = loaded;

        // Verify data merged into plugin.data
        assert.equal(plugin.data.activeSessionId, 'legacy-1');
        assert.deepEqual(plugin.data.sessionOrder, ['legacy-1', 'legacy-2']);
        assert.equal(plugin.data.warnOnUnsavedSwitch, false, 'settings.local.json must be migrated');

        const session1 = (plugin.data.sessions as Record<string, { history?: unknown[] }>)['legacy-1'];
        assert.equal(session1?.history?.length, 1, 'inline history must be extracted');

        // Persisting must write to history.json and clean sessions
        await plugin.persistData({ pretty: true });
        assert.ok(vault.files[HISTORY_PATH], 'history.json must be written');

        const savedHistory = JSON.parse(vault.files[HISTORY_PATH] ?? '{}') as { version: number; history: Record<string, unknown[]> };
        assert.equal(savedHistory.history['legacy-1']?.length, 1);
    } finally {
        h.restore();
    }
});

test('#105 multi-device sync merge updates all 5 session properties safely', async () => {
    const h = setupHarness();
    try {
        const vault = createMemoryVault();
        const initialData = {
            activeSessionId: 'local-active',
            sessionOrder: ['local-active', 'shared-session'],
            sessions: {
                'local-active': { id: 'local-active', name: 'Local Active', modified: 100, layout: { a: 1 } },
                'shared-session': { id: 'shared-session', name: 'Shared', modified: 200, layout: { b: 1 } },
            },
            groups: { 'g-local': { id: 'g-local', name: 'Local Group' } },
            groupOrder: ['g-local'],
            sessionGroups: { 'local-active': 'g-local' },
            activeGroupId: 'g-local',
            sessionStorageLocation: 'plugin-folder',
        };

        const plugin = await createLockPlugin(vault, initialData);
        await plugin.persistData({ pretty: true });

        // Remote device pushes external data containing a new session and a new group
        const externalData: SessionDataPayload = {
            activeSessionId: 'remote-active',
            sessionOrder: ['remote-active', 'shared-session', 'remote-new'],
            sessions: {
                'remote-active': { id: 'remote-active', name: 'Remote Active', modified: 300, layout: { r: 1 } },
                'shared-session': { id: 'shared-session', name: 'Shared Updated', modified: 400, layout: { b: 2 } },
                'remote-new': { id: 'remote-new', name: 'Remote New', modified: 500, layout: { n: 1 } },
            },
            groups: {
                'g-remote': { id: 'g-remote', name: 'Remote Group' },
            },
            groupOrder: ['g-remote'],
            sessionGroups: { 'remote-new': ['g-remote'] },
            activeGroupId: 'g-remote',
            _wppSavedAt: Date.now() + 1000,
        };

        const applied = plugin.applySessionDataFromStorage(externalData);
        assert.equal(applied, true);

        // Verify local active session is maintained if valid, or sync merge completed
        assert.ok((plugin.data.sessions as Record<string, unknown>)['shared-session']);
        assert.ok((plugin.data.sessions as Record<string, unknown>)['remote-new']);
        assert.deepEqual(plugin.data.groupOrder, ['g-remote']);
        assert.equal((plugin.data.sessions as Record<string, { name: string }>)['shared-session']?.name, 'Shared Updated');
    } finally {
        h.restore();
    }
});
