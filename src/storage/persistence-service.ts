import { Notice } from 'obsidian';
import { L, resolveLocale, type StringValue } from '../i18n.ts';
import { DEFAULT_DATA, SESSION_KEYS, SETTINGS_KEYS, type PluginData, type SessionGroup, type SessionItem } from './default-data.ts';
import { JsonFileStore, type ReadJsonResult, type StorageAdapter } from './json-file-store.ts';
import * as migrations from './migrations.ts';
import { normalizeSessionStorageLocation, type SessionStorageLocation } from './paths.ts';
import { SessionStorage } from './session-storage.ts';
import { getPersistStamp, hasNonEmptySessions, hasSessionShape, pickKeys, pickSessionPayload, splitSessionHistory } from './session-data.ts';

export type DataRecord = Record<string, unknown>;

/**
 * What getStorageDiagnosticsInfo() answers. It lived in settings-tab.ts, which
 * meant the producer returned a loose DataRecord and only the consumer knew the
 * shape - so the two could drift with nothing to catch it. The producer owns it
 * now and the settings screen imports it.
 */
export interface StorageDiagnosticsInfo {
    syncedByObsidianSync: boolean;
    sessionsPath: string;
    sessionsBackupPath: string;
    historyPath: string;
    sessionCount: number;
    updatedAt: number;
}
export type SessionData = DataRecord & {
    activeSessionId?: string | null;
    sessions?: Record<string, SessionItem>;
    sessionOrder?: string[];
    groups?: Record<string, SessionGroup>;
    groupOrder?: string[];
    sessionGroups?: Record<string, string[]>;
    activeGroupId?: string | null;
    _wppSavedAt?: number;
};

interface VaultAdapter extends StorageAdapter {
    stat(normalizedPath: string): Promise<{ mtime: number; size?: number } | null>;
}

export interface PersistenceServiceHost {
    readonly data: PluginData | undefined;
    readonly app: { vault: { adapter: VaultAdapter; configDir?: string } };
    readonly manifest?: { dir?: string };
    loadData(): Promise<unknown>;
    saveData(data: unknown): Promise<void>;
    reloadExternalSessionStorageIfChanged(options: { mergeLocal: boolean }): Promise<boolean>;
    recordSessionDataStored(data: DataRecord): Promise<unknown>;
    recordSessionStorageState(stamp: number, mtime: number, data: DataRecord): void;
    rotateBackupIfNeeded(data: DataRecord): Promise<unknown>;
    clearVersionHistoryEntries(): boolean;
    resetSessionsToDefault(): Promise<unknown>;
    // Routed, not probed: the adapter decides whether a caller has replaced the
    // plugin method and calls either that or this service, so exactly one
    // implementation runs. Asking "did an override return something truthy?"
    // ran both when a void override returned undefined - and clearBackupFiles
    // deletes files.
    persistData(): Promise<unknown>;
    persistDataImmediate(): Promise<unknown>;
    clearBackupFiles(): Promise<unknown>;
    readJsonIfExists<T = unknown>(path: string): Promise<ReadJsonResult<T>>;
    getFileMtime(path: string): Promise<number>;
}

interface SetStorageOptions { silent?: boolean; }
interface WriteOptions { pretty?: boolean; }
interface SessionCandidate {
    valid: boolean;
    data: unknown;
    mtime: number;
    stamp: number;
}

function isRecord(value: unknown): value is DataRecord {
    return value !== null && typeof value === 'object';
}

function localized(value: StringValue | undefined, ...args: Array<string | number>): string {
    if (typeof value === 'function') return value(...args);
    return value || '';
}

export class PersistenceService {
    private readonly hostProvider: () => PersistenceServiceHost;
    private sessionStorage: SessionStorage | null = null;
    private jsonStore: JsonFileStore | null = null;
    private lastPersistStamp = 0;
    private lastRotationBackupAt = 0;
    private persistQueue: Promise<unknown> | null = null;
    private globalSettings: DataRecord | null = null;

    constructor(hostOrProvider: PersistenceServiceHost | (() => PersistenceServiceHost)) {
        this.hostProvider = typeof hostOrProvider === 'function' ? hostOrProvider : () => hostOrProvider;
    }

    private get host(): PersistenceServiceHost { return this.hostProvider(); }
    private get data(): PluginData { return this.host.data || {} as PluginData; }

    getGlobalSettings(): DataRecord | null { return this.globalSettings; }
    setGlobalSettings(value: unknown): void { this.globalSettings = isRecord(value) ? value : null; }
    getLastPersistStamp(): number { return this.lastPersistStamp; }
    setLastPersistStamp(value: unknown): void { this.lastPersistStamp = typeof value === 'number' ? value : 0; }
    getLastRotationBackupAt(): number { return this.lastRotationBackupAt; }
    setLastRotationBackupAt(value: unknown): void { this.lastRotationBackupAt = typeof value === 'number' ? value : 0; }
    getPersistQueue(): Promise<unknown> | null { return this.persistQueue; }
    setPersistQueue(value: unknown): void { this.persistQueue = value instanceof Promise ? value : null; }

    getSessionStorage(): SessionStorage {
        if (!this.sessionStorage) {
            const initialLocation = normalizeSessionStorageLocation(this.data.sessionStorageLocation);
            this.sessionStorage = new SessionStorage({
                store: this.getJsonStore(),
                manifestDir: () => this.host.manifest?.dir || null,
                configDir: () => this.host.app.vault.configDir || null,
                initialLocation,
            });
        }
        return this.sessionStorage;
    }

    getBackupPath(): string { return this.getSessionStorage().getBackupPath(); }
    getStorageDirPath(): string { return this.getSessionStorage().getStorageDirPath(); }
    getPluginStorageDirPath(): string { return this.getSessionStorage().getPluginStorageDirPath(); }
    getDefaultSessionStorageLocation(): SessionStorageLocation { return this.getSessionStorage().getDefaultSessionStorageLocation(); }
    getSessionStorageLocation(): SessionStorageLocation { return this.getSessionStorage().getLocation(); }
    setRuntimeSessionStorageLocation(location: unknown): SessionStorageLocation {
        const normalized = this.getSessionStorage().setLocation(location);
        this.data.sessionStorageLocation = normalized;
        return normalized;
    }
    getSessionStorageDirPathForLocation(location: unknown): string { return this.getSessionStorage().getSessionStorageDirPathForLocation(location); }
    getSessionStorageDirPath(): string { return this.getSessionStorage().getSessionStorageDirPath(); }
    isSessionStorageInPluginData(location?: unknown): boolean { return this.getSessionStorage().isSessionStorageInPluginData(location); }
    getSessionsPathForLocation(location?: unknown): string { return this.getSessionStorage().getSessionsPathForLocation(location); }
    getLegacyPluginSessionsPath(): string { return this.getSessionStorage().getLegacyPluginSessionsPath(); }
    getSessionsPath(): string { return this.getSessionStorage().getSessionsPath(); }
    getSessionsBackupPathForLocation(location?: unknown): string { return this.getSessionStorage().getSessionsBackupPathForLocation(location); }
    getSessionsBackupPath(): string { return this.getSessionStorage().getSessionsBackupPath(); }
    getHistoryPathForLocation(location?: unknown): string { return this.getSessionStorage().getHistoryPathForLocation(location); }
    getHistoryPath(): string { return this.getSessionStorage().getHistoryPath(); }
    writeSessionHistory(history: Parameters<SessionStorage['writeSessionHistory']>[0]): Promise<void> { return this.getSessionStorage().writeSessionHistory(history); }
    readSessionHistory(): ReturnType<SessionStorage['readSessionHistory']> { return this.getSessionStorage().readSessionHistory(); }
    attachSessionHistory(sessionData: unknown): Promise<unknown> { return this.getSessionStorage().attachSessionHistory(sessionData); }
    getExportDirPath(): string { return this.getSessionStorage().getExportDirPath(); }
    getBackupsDirPath(): string { return this.getSessionStorage().getBackupsDirPath(); }
    getRotationBackupPath(generation: number): string { return this.getSessionStorage().getRotationBackupPath(generation); }
    getRotationBackupPathForLocation(location: unknown, generation: number): string { return this.getSessionStorage().getRotationBackupPathForLocation(location, generation); }
    getSessionBackupFilePathsForLocation(location?: unknown): string[] { return this.getSessionStorage().getSessionBackupFilePathsForLocation(location); }
    getBackupFilePaths(): string[] { return this.getSessionStorage().getBackupFilePaths(); }

    getDefaultSettingsData(): DataRecord { return pickKeys(DEFAULT_DATA, SETTINGS_KEYS); }
    getDefaultSessionData(): DataRecord { return pickKeys(DEFAULT_DATA, SESSION_KEYS); }
    extractSettingsData(data: unknown): DataRecord { return pickKeys(data, SETTINGS_KEYS); }
    // NOTE: the returned object shares its `sessions` map with the input - both
    // pickKeys() and normalizeSessionData() copy shallowly, so this is a view of
    // the plugin's live data, not a snapshot of it. Mutating what comes back
    // (dropping history before a write, for instance) corrupts the data the UI
    // is reading. Build a copy first; see splitSessionHistory().
    extractSessionData(data: unknown): SessionData { return this.normalizeSessionData(pickKeys(data, SESSION_KEYS)); }

    normalizeSessionData(raw: unknown): SessionData {
        const record = isRecord(raw) ? raw : {};
        const sessions = isRecord(record.sessions) ? record.sessions as Record<string, SessionItem> : {};
        const rawOrder = Array.isArray(record.sessionOrder) ? record.sessionOrder : Object.keys(sessions);
        const seen: Record<string, boolean> = {};
        const order: string[] = [];
        for (let i = 0; i < rawOrder.length; i++) {
            const id: unknown = rawOrder[i];
            if (typeof id !== 'string' || !sessions[id] || seen[id]) continue;
            seen[id] = true;
            order.push(id);
        }
        const allIds = Object.keys(sessions);
        for (let i = 0; i < allIds.length; i++) {
            const id = allIds[i]!;
            if (!seen[id]) { seen[id] = true; order.push(id); }
        }
        let active = typeof record.activeSessionId === 'string' ? record.activeSessionId : null;
        if (active && !sessions[active]) active = null;
        if (!active && order.length > 0) active = order[0]!;

        const groups = isRecord(record.groups) ? record.groups as Record<string, SessionGroup> : {};
        const rawGroupOrder = Array.isArray(record.groupOrder) ? record.groupOrder : Object.keys(groups);
        const seenGroups: Record<string, boolean> = {};
        const groupOrder: string[] = [];
        for (let i = 0; i < rawGroupOrder.length; i++) {
            const id: unknown = rawGroupOrder[i];
            if (typeof id !== 'string' || (id !== '__all__' && !groups[id]) || seenGroups[id]) continue;
            seenGroups[id] = true;
            groupOrder.push(id);
        }
        const allGroupIds = Object.keys(groups);
        for (let i = 0; i < allGroupIds.length; i++) {
            const id = allGroupIds[i]!;
            if (!seenGroups[id]) { seenGroups[id] = true; groupOrder.push(id); }
        }
        const sessionGroups = isRecord(record.sessionGroups) ? record.sessionGroups : {};
        const cleaned: Record<string, string[]> = {};
        const sessionIds = Object.keys(sessionGroups);
        for (let i = 0; i < sessionIds.length; i++) {
            const sessionId = sessionIds[i]!;
            if (!sessions[sessionId]) continue;
            const ids = Array.isArray(sessionGroups[sessionId]) ? sessionGroups[sessionId] : [];
            const valid = ids.filter((id): id is string => typeof id === 'string' && Boolean(groups[id]));
            if (valid.length > 0) cleaned[sessionId] = valid;
        }
        const activeGroupId = typeof record.activeGroupId === 'string' && groups[record.activeGroupId]
            ? record.activeGroupId : null;
        return { activeSessionId: active, sessions, sessionOrder: order, groups, groupOrder, sessionGroups: cleaned, activeGroupId };
    }

    getJsonStore(): JsonFileStore {
        if (!this.jsonStore) this.jsonStore = new JsonFileStore(() => this.host.app.vault.adapter);
        return this.jsonStore;
    }
    ensureDir(path: string): Promise<void> { return this.getJsonStore().ensureDir(path); }
    ensureSessionStorageDir(): Promise<void> { return this.ensureDir(this.getSessionStorageDirPath()); }
    getFileMtime(path: string): Promise<number> { return this.host.getFileMtime(path); }
    readJsonIfExists<T = unknown>(path: string): Promise<ReadJsonResult<T>> { return this.host.readJsonIfExists<T>(path); }
    writeJson(path: string, data: unknown, pretty?: boolean): Promise<void> { return this.getJsonStore().writeJson(path, data, pretty); }
    renameIfExists(fromPath: string, toPath: string): Promise<void> { return this.getJsonStore().renameIfExists(fromPath, toPath); }
    removeIfExists(path: string): Promise<void> { return this.getJsonStore().removeIfExists(path); }

    async resolveSessionStorageLocation(settingsData?: { sessionStorageLocation?: unknown } | null): Promise<SessionStorageLocation> {
        const location = await this.getSessionStorage().resolveSessionStorageLocation(settingsData);
        this.setRuntimeSessionStorageLocation(location);
        return location;
    }

    async setSessionStorageLocation(location: unknown, options: SetStorageOptions = {}): Promise<boolean> {
        const next = normalizeSessionStorageLocation(location);
        if (!next || next === this.getSessionStorageLocation()) return false;
        const previous = this.getSessionStorageLocation();
        const split = splitSessionHistory(this.extractSessionData(this.data));
        const sessionData = split.data;
        let now = Date.now();
        if (now <= this.lastPersistStamp) now = this.lastPersistStamp + 1;
        sessionData._wppSavedAt = now;
        this.setRuntimeSessionStorageLocation(next);
        this.lastPersistStamp = now;
        this.lastRotationBackupAt = 0;
        try {
            await this.ensureSessionStorageDir();
            await this.writeSessionHistory(split.history);
            await this.writeSessionStore(sessionData, { pretty: true });
            await this.host.recordSessionDataStored(sessionData);
            await this.host.persistData();
            if (!options.silent) new Notice(localized(L.sessionStorageMoved, this.getSessionsPath()), 7000);
            return true;
        } catch (error) {
            this.setRuntimeSessionStorageLocation(previous);
            if (!options.silent) new Notice(localized(L.sessionStorageMoveFailed));
            throw error;
        }
    }

    async writePluginData(data: unknown): Promise<void> {
        await this.host.app.vault.adapter.write(this.getBackupPath(), JSON.stringify(data));
        await this.host.saveData(data);
    }

    // Write the settings to data.json.
    //
    // In plugin-folder mode data.json also holds the sessions, so a settings-only
    // write must not replace the file wholesale. When the caller has the session
    // data at hand it passes it in; otherwise whatever data.json already holds is
    // carried over, which is what keeps a stray settings write from wiping every
    // session.
    async persistGlobalSettings(sessionData?: DataRecord): Promise<void> {
        if (!this.globalSettings) this.globalSettings = this.getDefaultSettingsData();
        const settings = Object.assign({}, this.globalSettings, { sessionStorageLocation: this.getSessionStorageLocation() });
        if (!this.isSessionStorageInPluginData()) return this.writePluginData(settings);
        if (sessionData) return this.writePluginData(Object.assign({}, settings, sessionData));
        let existing: unknown = null;
        try { existing = await this.host.loadData(); } catch { /* preserve settings-only write behavior */ }
        return this.writePluginData(Object.assign({}, settings, pickSessionPayload(existing)));
    }

    // Persist session data to whichever store the current mode uses, writing the
    // recovery copy first so a crash between the two writes leaves the older but
    // complete backup behind.
    async writeSessionStore(sessionData: DataRecord, options: WriteOptions = {}): Promise<void> {
        await this.writeJson(this.getSessionsBackupPath(), sessionData, options.pretty);
        await this.writeSessionMain(sessionData, options);
    }
    // Write only the primary session store, leaving the recovery copy alone.
    writeSessionMain(sessionData: DataRecord, options: WriteOptions = {}): Promise<void> {
        if (this.isSessionStorageInPluginData()) return this.persistGlobalSettings(sessionData);
        return this.writeJson(this.getSessionsPath(), sessionData, options.pretty);
    }

    // Vault-local settings (.workspace-plus-plus/settings.local.json) are gone.
    // Nobody ever asked for them - issue #4, the only multi-vault request, asked
    // for per-vault *workspaces* while explicitly wanting settings to stay in
    // sync - and keeping them meant carrying a second settings layer that could
    // not reach other devices anyway, since dot-folders are excluded from
    // Obsidian Sync.
    //
    // Anyone still holding the old file gets it folded into data.json on load.
    // The local copy is what they actually saw, so it wins over the frozen
    // values in data.json; the file is renamed rather than deleted.
    migrateLegacyLocalSettings(): Promise<boolean> {
        return migrations.migrateLegacyLocalSettings(
            this.getJsonStore(), this.globalSettings || {}, async (merged) => {
                this.globalSettings = merged;
                await this.persistGlobalSettings();
            }, this.getDefaultSettingsData()
        );
    }
    applyDefaultSettings(): void {
        const defaults = this.getDefaultSettingsData();
        for (let i = 0; i < SETTINGS_KEYS.length; i++) {
            const key = SETTINGS_KEYS[i]!;
            this.data[key] = defaults[key];
        }
        resolveLocale(typeof this.data.language === 'string' ? this.data.language : 'auto');
    }
    resetSettingsToDefault(): Promise<unknown> {
        this.applyDefaultSettings();
        return this.persistData();
    }
    async resetSessionsAndSettingsToDefault(): Promise<unknown> {
        this.applyDefaultSettings();
        await this.host.resetSessionsToDefault();
        return this.host.clearBackupFiles();
    }
    async clearBackupFiles(): Promise<boolean> {
        await Promise.all(this.getBackupFilePaths().map((path) => this.removeIfExists(path)));
        this.lastRotationBackupAt = 0;
        return true;
    }
    async clearBackupsAndVersionHistory(): Promise<unknown> {
        if (this.host.clearVersionHistoryEntries()) await this.host.persistData();
        return this.host.clearBackupFiles();
    }
    getStorageDiagnosticsInfo(): StorageDiagnosticsInfo {
        return {
            syncedByObsidianSync: this.isSessionStorageInPluginData(),
            sessionsPath: this.getSessionsPath(),
            sessionsBackupPath: this.getSessionsBackupPath(),
            historyPath: this.getHistoryPath(),
            sessionCount: Object.keys(this.data.sessions || {}).length,
            updatedAt: Date.now(),
        };
    }
    // Size of the file Obsidian Sync actually carries. Obsidian's saveData() writes
    // data.json indented, so this is meaningfully larger than the data it holds -
    // and it is the number that counts against Sync's per-file limit.
    async getSessionStorageSize(): Promise<number | null> {
        try {
            const stat = await this.host.app.vault.adapter.stat(this.getSessionsPath());
            return stat && typeof stat.size === 'number' ? stat.size : null;
        } catch { return null; }
    }

    async persistDataImmediate(): Promise<unknown> {
        await this.host.reloadExternalSessionStorageIfChanged({ mergeLocal: true });
        // Version history lives in its own local-only file, so the sessions
        // written here (and the backups derived from them) are history-free.
        const split = splitSessionHistory(this.extractSessionData(this.data));
        const sessionData = split.data;
        const settingsData = Object.assign({}, this.getDefaultSettingsData(), this.extractSettingsData(this.data));
        let now = Date.now();
        if (now <= this.lastPersistStamp) now = this.lastPersistStamp + 1;
        this.lastPersistStamp = now;
        sessionData._wppSavedAt = now;
        this.globalSettings = Object.assign({}, settingsData);
        await this.ensureSessionStorageDir();
        await this.writeSessionHistory(split.history);
        // Settings and sessions go out together; writing them separately would
        // have each overwrite the other's file.
        await this.writeSessionStore(sessionData);
        // In plugin-folder mode that write already covered data.json. Otherwise
        // the settings still need one of their own.
        if (!this.isSessionStorageInPluginData()) await this.persistGlobalSettings();
        await this.host.recordSessionDataStored(sessionData);
        return this.host.rotateBackupIfNeeded(sessionData);
    }
    persistData(): Promise<unknown> {
        if (!this.persistQueue) this.persistQueue = Promise.resolve();
        const next = this.persistQueue.catch(() => undefined).then(() => this.host.persistDataImmediate());
        this.persistQueue = next;
        return next;
    }
    flushPendingPersistence(): Promise<unknown> { return this.persistQueue ? this.persistQueue.catch(() => undefined) : Promise.resolve(); }

    async readSessionCandidate(path: string): Promise<SessionCandidate> {
        const [result, mtime] = await Promise.all([this.readJsonIfExists(path), this.getFileMtime(path)]);
        const valid = result.exists && !result.error && hasSessionShape(result.data);
        return { valid, data: result.data, mtime: mtime || 0, stamp: valid ? getPersistStamp(result.data) : 0 };
    }
    async loadSessionDataFromStorage(): Promise<SessionData | null> {
        const backupPath = this.getSessionsBackupPath();
        // Installs from before sessions moved into data.json still keep them in
        // the plugin folder's sessions.json.
        const legacyPath = this.isSessionStorageInPluginData() ? this.getLegacyPluginSessionsPath() : null;
        let main = await this.readSessionCandidate(this.getSessionsPath());
        if (!main.valid && legacyPath) main = await this.readSessionCandidate(legacyPath);
        const backup = await this.readSessionCandidate(backupPath);
        if (!main.valid && !backup.valid) return null;
        // Equal stamps but a newer backup mtime means the app quit between the
        // backup write and the main write; prefer the backup rather than lose the
        // latest change.
        const useBackup = !main.valid || (backup.valid && (backup.stamp > main.stamp || (backup.stamp === main.stamp && backup.mtime > main.mtime)));
        if (!useBackup) {
            const normalized = this.normalizeSessionData(main.data);
            this.host.recordSessionStorageState(main.stamp, main.mtime, normalized);
            return normalized;
        }
        const restored = this.normalizeSessionData(backup.data);
        // Restore through the mode-aware writer: in plugin-folder mode the primary
        // store is data.json, and a raw write would drop the settings.
        try { await this.writeSessionMain(backup.data as DataRecord); } catch { /* the backup remains available */ }
        const restoredMtime = await this.getFileMtime(this.getSessionsPath());
        this.host.recordSessionStorageState(backup.stamp, restoredMtime || backup.mtime, restored);
        if (!main.valid) new Notice(localized(L.backupRestored));
        return restored;
    }

    // plugin-folder installs from before sessions moved into data.json still have
    // them in the plugin folder's sessions.json, which Obsidian Sync ignores.
    //
    // The next save would move them anyway, but flushOnStartup() only runs when
    // auto-save on switch is enabled, so a user who has that off and simply opens
    // and closes Obsidian would stay unsynced. Write them across on load instead.
    async migrateLegacyPluginSessions(sessionData: unknown): Promise<boolean> {
        if (!this.isSessionStorageInPluginData() || !hasNonEmptySessions(sessionData)) return false;
        try {
            if (!await this.host.app.vault.adapter.exists(this.getLegacyPluginSessionsPath())) return false;
            let existing: unknown = null;
            try { existing = await this.host.loadData(); } catch { /* legacy file stays intact */ }
            // Already carried over: data.json is the source of truth and the old
            // file is just a leftover.
            if (hasSessionShape(existing)) return false;
            const payload = splitSessionHistory(sessionData).data;
            await this.ensureSessionStorageDir();
            await this.writeSessionStore(payload);
            await this.host.recordSessionDataStored(payload);
            return true;
        } catch { return false; }
    }
    migrateLegacySessions(sessionData: unknown): Promise<boolean> {
        return migrations.migrateLegacySessions(
            this.getJsonStore(), this.getSessionStorageDirPath(), (normalized) => this.writeSessionStore(normalized as DataRecord),
            sessionData, (data) => this.normalizeSessionData(data)
        );
    }

    async loadWithBackup(): Promise<DataRecord> {
        let rawSaved: unknown = null;
        let loadedMain: DataRecord = {};
        let legacyMain: SessionData | null = null;
        let hadLegacyInMain = false;
        try { rawSaved = await this.host.loadData(); } catch { rawSaved = null; }
        loadedMain = isRecord(rawSaved) ? rawSaved : {};
        this.globalSettings = Object.assign({}, this.getDefaultSettingsData(), this.extractSettingsData(loadedMain));
        // The storage location has to be settled first: whether sessions in
        // data.json are the current format or the pre-#5 layout depends on it,
        // and migrateLegacyLocalSettings() writes data.json.
        await this.resolveSessionStorageLocation({ sessionStorageLocation: loadedMain.sessionStorageLocation });
        await this.migrateLegacyLocalSettings();
        // Sessions inside data.json are exactly where plugin-folder mode keeps
        // them, so only vault-folder installs can be carrying the old layout that
        // predates the move out of data.json.
        hadLegacyInMain = hasSessionShape(loadedMain) && !this.isSessionStorageInPluginData();
        legacyMain = hadLegacyInMain ? this.normalizeSessionData(loadedMain) : null;
        let sessionData = await this.loadSessionDataFromStorage();
        if (!sessionData || !hasNonEmptySessions(sessionData)) {
            if (legacyMain && hasNonEmptySessions(legacyMain)) {
                const migrated = await this.migrateLegacySessions(legacyMain);
                new Notice(localized(migrated ? L.sessionDataMigrated : L.sessionDataMigrationFailed));
                sessionData = legacyMain;
            } else if (!sessionData) {
                const backup = await this.readJsonIfExists(this.getBackupPath());
                if (backup.exists && !backup.error && hasSessionShape(backup.data) && hasNonEmptySessions(backup.data)) {
                    const migrated = this.normalizeSessionData(backup.data);
                    new Notice(localized(await this.migrateLegacySessions(migrated) ? L.sessionDataMigrated : L.sessionDataMigrationFailed));
                    sessionData = migrated;
                } else sessionData = this.getDefaultSessionData();
            }
        }
        sessionData = await this.attachSessionHistory(sessionData) as SessionData;
        await this.migrateLegacyPluginSessions(sessionData);
        if (hadLegacyInMain) {
            try { await this.persistGlobalSettings(); } catch { /* session migration already succeeded */ }
        }
        const effectiveSettings = Object.assign({}, this.globalSettings, { sessionStorageLocation: this.getSessionStorageLocation() });
        // Migrate: existing users keep the filter visible (the new default is OFF).
        // rawSaved is null for new installs; for existing users it is the raw
        // data.json object. Before showFilterInput was added to SETTINGS_KEYS it
        // was never written to disk, so it is undefined for anyone who predates
        // that setting.
        if (isRecord(rawSaved) && rawSaved.showFilterInput === undefined) effectiveSettings.showFilterInput = true;
        return Object.assign({}, this.getDefaultSessionData(), sessionData || {}, effectiveSettings);
    }
}
