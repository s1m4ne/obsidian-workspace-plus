import {
    STORAGE_DIR,
    SESSION_STORAGE_VAULT,
    SESSION_STORAGE_PLUGIN,
    SESSIONS_FILE_NAME,
    PLUGIN_DATA_FILE_NAME,
    SESSIONS_BACKUP_FILE_NAME,
    HISTORY_FILE_NAME,
    HISTORY_FORMAT_VERSION,
    EXPORT_DIR_NAME,
    BACKUPS_DIR_NAME,
    joinPath,
    normalizeSessionStorageLocation,
    getPluginStorageDirPath,
    type SessionStorageLocation,
} from './paths.ts';
import {
    readHistoryMap,
    splitSessionHistory,
    mergeSessionHistory,
    hasInlineSessionHistory,
} from './session-data.ts';
import type { SessionHistoryEntry } from './default-data.ts';
import type { JsonFileStore } from './json-file-store.ts';

export type StringResolver = string | (() => string | null | undefined) | null | undefined;

export interface SessionStorageOptions {
    store: JsonFileStore;
    manifestDir?: StringResolver;
    configDir?: StringResolver;
    initialLocation?: SessionStorageLocation | null | undefined;
}

export class SessionStorage {
    private readonly store: JsonFileStore;
    private readonly manifestDir: StringResolver;
    private readonly configDir: StringResolver;
    private location: SessionStorageLocation;

    constructor(options: SessionStorageOptions) {
        this.store = options.store;
        this.manifestDir = options.manifestDir;
        this.configDir = options.configDir;
        this.location = options.initialLocation ?? SESSION_STORAGE_PLUGIN;
    }

    getLocation(): SessionStorageLocation {
        return this.location;
    }

    setLocation(loc: unknown): SessionStorageLocation {
        const normalized = normalizeSessionStorageLocation(loc) || SESSION_STORAGE_PLUGIN;
        this.location = normalized;
        return normalized;
    }

    getBackupPath(): string {
        return joinPath(this.getPluginStorageDirPath(), 'data.backup.json');
    }

    getStorageDirPath(): string {
        return STORAGE_DIR;
    }

    getPluginStorageDirPath(): string {
        const manifestDir = typeof this.manifestDir === 'function' ? this.manifestDir() : this.manifestDir;
        const configDir = typeof this.configDir === 'function' ? this.configDir() : this.configDir;
        return getPluginStorageDirPath(manifestDir ?? null, configDir ?? null);
    }

    getDefaultSessionStorageLocation(): SessionStorageLocation {
        return SESSION_STORAGE_PLUGIN;
    }

    getSessionStorageDirPathForLocation(location?: unknown): string {
        const normalized = normalizeSessionStorageLocation(location) || this.getDefaultSessionStorageLocation();
        return normalized === SESSION_STORAGE_PLUGIN
            ? this.getPluginStorageDirPath()
            : this.getStorageDirPath();
    }

    getSessionStorageDirPath(): string {
        return this.getSessionStorageDirPathForLocation(this.location);
    }

    isSessionStorageInPluginData(location?: unknown): boolean {
        const normalized = normalizeSessionStorageLocation(location) || this.location;
        return normalized === SESSION_STORAGE_PLUGIN;
    }

    getSessionsPathForLocation(location?: unknown): string {
        const normalized = normalizeSessionStorageLocation(location) || this.location;
        if (this.isSessionStorageInPluginData(normalized)) {
            return joinPath(this.getPluginStorageDirPath(), PLUGIN_DATA_FILE_NAME);
        }
        return joinPath(this.getSessionStorageDirPathForLocation(normalized), SESSIONS_FILE_NAME);
    }

    getLegacyPluginSessionsPath(): string {
        return joinPath(this.getPluginStorageDirPath(), SESSIONS_FILE_NAME);
    }

    getSessionsPath(): string {
        return this.getSessionsPathForLocation(this.location);
    }

    getSessionsBackupPathForLocation(location?: unknown): string {
        const normalized = normalizeSessionStorageLocation(location) || this.location;
        return joinPath(this.getSessionStorageDirPathForLocation(normalized), SESSIONS_BACKUP_FILE_NAME);
    }

    getSessionsBackupPath(): string {
        return this.getSessionsBackupPathForLocation(this.location);
    }

    getHistoryPathForLocation(location?: unknown): string {
        const normalized = normalizeSessionStorageLocation(location) || this.location;
        return joinPath(this.getSessionStorageDirPathForLocation(normalized), HISTORY_FILE_NAME);
    }

    getHistoryPath(): string {
        return this.getHistoryPathForLocation(this.location);
    }

    getExportDirPath(): string {
        return joinPath(this.getSessionStorageDirPath(), EXPORT_DIR_NAME);
    }

    getBackupsDirPath(): string {
        return joinPath(this.getSessionStorageDirPath(), BACKUPS_DIR_NAME);
    }

    getRotationBackupPath(generation: number): string {
        return `${this.getBackupsDirPath()}/sessions.${generation}.json`;
    }

    getRotationBackupPathForLocation(location: unknown, generation: number): string {
        const normalized = normalizeSessionStorageLocation(location) || this.location;
        return `${joinPath(this.getSessionStorageDirPathForLocation(normalized), BACKUPS_DIR_NAME)}/sessions.${generation}.json`;
    }

    getSessionBackupFilePathsForLocation(location?: unknown): string[] {
        const normalized = normalizeSessionStorageLocation(location) || this.location;
        return [
            this.getSessionsBackupPathForLocation(normalized),
            this.getRotationBackupPathForLocation(normalized, 1),
            this.getRotationBackupPathForLocation(normalized, 2),
            this.getRotationBackupPathForLocation(normalized, 3),
            this.getHistoryPathForLocation(normalized),
        ];
    }

    getBackupFilePaths(): string[] {
        return [
            this.getBackupPath(),
            ...this.getSessionBackupFilePathsForLocation(SESSION_STORAGE_VAULT),
            ...this.getSessionBackupFilePathsForLocation(SESSION_STORAGE_PLUGIN),
        ];
    }

    async resolveSessionStorageLocation(settingsData?: { sessionStorageLocation?: unknown } | null): Promise<SessionStorageLocation> {
        const explicit = normalizeSessionStorageLocation(settingsData?.sessionStorageLocation);
        if (explicit) {
            this.setLocation(explicit);
            return explicit;
        }

        try {
            const [hasVaultSessions, hasVaultBackup, hasPluginSessions, hasPluginBackup] = await Promise.all([
                this.store.readJsonIfExists(this.getSessionsPathForLocation(SESSION_STORAGE_VAULT)),
                this.store.readJsonIfExists(this.getSessionsBackupPathForLocation(SESSION_STORAGE_VAULT)),
                this.store.readJsonIfExists(this.getSessionsPathForLocation(SESSION_STORAGE_PLUGIN)),
                this.store.readJsonIfExists(this.getSessionsBackupPathForLocation(SESSION_STORAGE_PLUGIN)),
            ]);

            let location: SessionStorageLocation;
            if (hasVaultSessions.exists || hasVaultBackup.exists) {
                location = SESSION_STORAGE_VAULT;
            } else if (hasPluginSessions.exists || hasPluginBackup.exists) {
                location = SESSION_STORAGE_PLUGIN;
            } else {
                location = this.getDefaultSessionStorageLocation();
            }

            this.setLocation(location);
            return location;
        } catch {
            const fallback = this.getDefaultSessionStorageLocation();
            this.setLocation(fallback);
            return fallback;
        }
    }

    async writeSessionHistory(historyMap: Record<string, SessionHistoryEntry[]>): Promise<void> {
        const payload = {
            version: HISTORY_FORMAT_VERSION,
            history: historyMap || {},
        };
        await this.store.writeJson(this.getHistoryPath(), payload);
    }

    async readSessionHistory(): Promise<Record<string, SessionHistoryEntry[]>> {
        const res = await this.store.readJsonIfExists(this.getHistoryPath());
        if (!res.exists || res.error) return {};
        return readHistoryMap(res.data);
    }

    async attachSessionHistory(sessionData: unknown): Promise<unknown> {
        if (!sessionData) return sessionData;
        const hadInline = hasInlineSessionHistory(sessionData);

        try {
            const historyMap = await this.readSessionHistory();
            mergeSessionHistory(sessionData, historyMap);

            if (!hadInline || Object.keys(historyMap).length > 0) return sessionData;

            const split = splitSessionHistory(sessionData);
            if (Object.keys(split.history).length === 0) return sessionData;

            await this.store.ensureDir(this.getSessionStorageDirPath());
            // History is recoverable data; failing to write it must not fail the
            // session write it accompanies.
            await this.writeSessionHistory(split.history).catch(() => {});
            return sessionData;
        } catch {
            return sessionData;
        }
    }
}
