import {
    STORAGE_DIR,
    SESSION_STORAGE_VAULT,
    SESSION_STORAGE_PLUGIN,
    SESSIONS_FILE_NAME,
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

export interface SessionStorageOptions {
    store: JsonFileStore;
    manifestDir?: string | null;
    configDir?: string | null;
    initialLocation?: SessionStorageLocation | null;
}

export class SessionStorage {
    private readonly store: JsonFileStore;
    private readonly manifestDir: string | null;
    private readonly configDir: string | null;
    private location: SessionStorageLocation;

    constructor(options: SessionStorageOptions) {
        this.store = options.store;
        this.manifestDir = options.manifestDir ?? null;
        this.configDir = options.configDir ?? null;
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
        return getPluginStorageDirPath(this.manifestDir, this.configDir);
    }

    getDefaultSessionStorageLocation(): SessionStorageLocation {
        return SESSION_STORAGE_PLUGIN;
    }

    getSessionStorageDirPathForLocation(location: SessionStorageLocation): string {
        if (location === SESSION_STORAGE_VAULT) {
            return STORAGE_DIR;
        }
        return this.getPluginStorageDirPath();
    }

    getSessionStorageDirPath(): string {
        return this.getSessionStorageDirPathForLocation(this.location);
    }

    getSessionsPathForLocation(location: SessionStorageLocation): string {
        return joinPath(this.getSessionStorageDirPathForLocation(location), SESSIONS_FILE_NAME);
    }

    getSessionsPath(): string {
        return this.getSessionsPathForLocation(this.location);
    }

    getSessionsBackupPathForLocation(location: SessionStorageLocation): string {
        return joinPath(this.getSessionStorageDirPathForLocation(location), SESSIONS_BACKUP_FILE_NAME);
    }

    getSessionsBackupPath(): string {
        return this.getSessionsBackupPathForLocation(this.location);
    }

    getHistoryPathForLocation(location: SessionStorageLocation): string {
        return joinPath(this.getSessionStorageDirPathForLocation(location), HISTORY_FILE_NAME);
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

    getRotationBackupPathForLocation(location: SessionStorageLocation, generation: number): string {
        return `${joinPath(this.getSessionStorageDirPathForLocation(location), BACKUPS_DIR_NAME)}/sessions.${generation}.json`;
    }

    getSessionBackupFilePathsForLocation(location: SessionStorageLocation): string[] {
        return [
            this.getSessionsBackupPathForLocation(location),
            this.getRotationBackupPathForLocation(location, 1),
            this.getRotationBackupPathForLocation(location, 2),
            this.getRotationBackupPathForLocation(location, 3),
            this.getHistoryPathForLocation(location),
        ];
    }

    getBackupFilePaths(): string[] {
        return [
            this.getBackupPath(),
            ...this.getSessionBackupFilePathsForLocation(SESSION_STORAGE_PLUGIN),
            ...this.getSessionBackupFilePathsForLocation(SESSION_STORAGE_VAULT),
        ];
    }

    async resolveSessionStorageLocation(settingsData?: { sessionStorageLocation?: unknown } | null): Promise<SessionStorageLocation> {
        const explicit = normalizeSessionStorageLocation(settingsData?.sessionStorageLocation);
        if (explicit) {
            this.setLocation(explicit);
            return explicit;
        }

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
            await this.writeSessionHistory(split.history).catch(() => {});
            return sessionData;
        } catch {
            return sessionData;
        }
    }
}
