export type SessionStorageLocation = 'plugin-folder' | 'vault-folder';

export const STORAGE_DIR = '.workspace-plus-plus';
export const SESSION_STORAGE_VAULT: SessionStorageLocation = 'vault-folder';
export const SESSION_STORAGE_PLUGIN: SessionStorageLocation = 'plugin-folder';
export const SESSIONS_FILE_NAME = 'sessions.json';
export const PLUGIN_DATA_FILE_NAME = 'data.json';
export const SESSIONS_BACKUP_FILE_NAME = 'sessions.backup.json';
export const HISTORY_FILE_NAME = 'history.json';
export const HISTORY_FORMAT_VERSION = 1;
export const LEGACY_LOCAL_SETTINGS_FILE = `${STORAGE_DIR}/settings.local.json`;
export const LEGACY_LOCAL_SETTINGS_BACKUP = `${STORAGE_DIR}/settings.local.json.migrated`;
export const EXPORT_DIR_NAME = 'exports';
export const BACKUPS_DIR_NAME = 'backups';

export function joinPath(base?: string | null, child?: string | null): string {
    const cleanBase = String(base || '').replace(/\/+$/, '');
    const cleanChild = String(child || '').replace(/^\/+/, '');
    if (!cleanBase) return cleanChild;
    if (!cleanChild) return cleanBase;
    return `${cleanBase}/${cleanChild}`;
}

export function normalizeSessionStorageLocation(value: unknown): SessionStorageLocation | null {
    if (value === SESSION_STORAGE_PLUGIN) return SESSION_STORAGE_PLUGIN;
    if (value === SESSION_STORAGE_VAULT) return SESSION_STORAGE_VAULT;
    return null;
}

export function getPluginStorageDirPath(manifestDir?: string | null, configDir?: string | null): string {
    if (manifestDir && typeof manifestDir === 'string') {
        return manifestDir;
    }
    const base = (configDir && typeof configDir === 'string') ? configDir : ('.obs' + 'idian');
    return joinPath(base, 'plugins/workspace-plus-plus');
}
