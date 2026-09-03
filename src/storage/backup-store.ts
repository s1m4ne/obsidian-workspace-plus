import {
    BACKUP_FILE_LIMIT_BYTES,
    backupFileName,
    backupSavedAtFromPath,
    enforceBackupBudget,
    LEGACY_BACKUP_GENERATIONS,
    selectBackupsToKeep,
    type BackupPoolEntry,
} from './backup-pool.ts';
import { getPersistStamp } from './session-data.ts';
import type { ReadJsonFn, RotationBackupInfo } from './storage-backup.ts';

/**
 * The disk side of the backup pool: read the directory, write a backup, delete
 * what the ladder no longer wants.
 *
 * `backup-pool.ts` decides; this carries it out.
 */

export interface BackupStoreHost {
    getBackupsDirPath(): string;
    /** The pre-pool file names, for the one-time move. */
    getRotationBackupPath(generation: number): string;
    getBackupGenerations(): number;
    readJsonIfExists: ReadJsonFn;
    writeJson(path: string, data: unknown): Promise<unknown>;
    ensureDir(path: string): Promise<unknown>;
    removeIfExists(path: string): Promise<unknown>;
    listDir(path: string): Promise<{ files: string[] } | null>;
    statSize(path: string): Promise<number | null>;
    _lastRotationBackupAt?: number;
}

/**
 * The fields that differ between two backups of the same sessions.
 *
 * `_wppSavedAt` is stamped at the moment of the backup, so it differs on every
 * press by construction; `_wppBackupPlatform` names the machine, and a backup
 * that arrived by sync from another one holds the same sessions under a
 * different label; `_wppBackupManual` records how it was asked for, which is
 * not part of what it holds.
 */
const VOLATILE_BACKUP_FIELDS = ['_wppSavedAt', '_wppBackupPlatform', '_wppBackupManual'];

/** Marks a backup the user asked for, which the ladder never deletes. */
export const MANUAL_BACKUP_FIELD = '_wppBackupManual';

/**
 * A backup's contents as a string, with key order removed.
 *
 * `JSON.stringify` preserves insertion order, and the two sides here are built
 * differently - one is parsed from a file, the other assembled from live state -
 * so a plain stringify would report two identical backups as different.
 */
function contentKey(value: unknown, top: boolean): string {
    if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
    if (Array.isArray(value)) return `[${value.map((item) => contentKey(item, false)).join(',')}]`;

    const entries = Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !(top && VOLATILE_BACKUP_FIELDS.includes(key)))
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${contentKey(item, false)}`).join(',')}}`;
}

interface StoredBackup extends BackupPoolEntry {
    readonly sessionCount: number;
    readonly backupPlatform: string;
}

function describe(path: string, data: Record<string, unknown>, savedAt: number): StoredBackup {
    const sessions = data.sessions;
    return {
        path,
        savedAt: getPersistStamp(data) || savedAt,
        manual: data[MANUAL_BACKUP_FIELD] === true,
        sessionCount: (sessions && typeof sessions === 'object') ? Object.keys(sessions).length : 0,
        backupPlatform: typeof data._wppBackupPlatform === 'string' ? data._wppBackupPlatform : '',
    };
}

/**
 * Move the three fixed-slot files into the pool, once.
 *
 * They are named `sessions.1.json` to `sessions.3.json` and carry their own
 * `_wppSavedAt`, which is the name the pool would have given them. An
 * installation that never opens the settings screen still gets this on its
 * first rotation, so nobody's existing backups are stranded.
 */
export async function migrateLegacyBackups(host: BackupStoreHost): Promise<number> {
    let moved = 0;
    for (const generation of LEGACY_BACKUP_GENERATIONS) {
        const legacyPath = host.getRotationBackupPath(generation);
        // Guarded per file: a read that fails must not stop the backup that
        // asked for the migration on its way past.
        let read;
        try {
            read = await host.readJsonIfExists(legacyPath);
        } catch {
            continue;
        }
        if (!read.exists || !read.data || typeof read.data !== 'object') continue;

        const data = read.data as Record<string, unknown>;
        // No usable stamp means no place on the ladder. Rather than invent one
        // and have it thinned against real ages, the file is left where it is.
        const savedAt = getPersistStamp(data);
        if (!savedAt) continue;

        await host.ensureDir(host.getBackupsDirPath());
        await host.writeJson(`${host.getBackupsDirPath()}/${backupFileName(savedAt)}`, data);
        await host.removeIfExists(legacyPath);
        moved += 1;
    }
    return moved;
}

/** Every backup in the pool, newest first, with sizes when they can be read. */
export async function listRotationBackups(host: BackupStoreHost): Promise<RotationBackupInfo[]> {
    await migrateLegacyBackups(host);

    const dir = host.getBackupsDirPath();
    let listed: { files: string[] } | null = null;
    try {
        listed = await host.listDir(dir);
    } catch {
        return [];
    }
    if (!listed?.files) return [];

    const paths = listed.files.filter((path) => backupSavedAtFromPath(path) !== null);
    const read = await Promise.all(paths.map(async (path) => {
        try {
            const result = await host.readJsonIfExists(path);
            if (!result.exists || !result.data || typeof result.data !== 'object') return null;
            const stored = describe(path, result.data as Record<string, unknown>, backupSavedAtFromPath(path) ?? 0);
            const size = await host.statSize(path);
            return size === null ? stored : { ...stored, size };
        } catch {
            return null;
        }
    }));

    return read
        .filter((entry): entry is StoredBackup => entry !== null)
        .sort((a, b) => b.savedAt - a.savedAt)
        .map((entry, index) => ({
            generation: index + 1,
            path: entry.path,
            savedAt: entry.savedAt,
            sessionCount: entry.sessionCount,
            backupPlatform: entry.backupPlatform,
            manual: entry.manual,
            ...(entry.size === undefined ? {} : { size: entry.size }),
        }));
}

/**
 * Delete whatever the ladder and the budget no longer want.
 *
 * Returns how many files went, so a caller can tell the difference between a
 * quiet success and nothing having happened.
 */
export async function pruneRotationBackups(
    host: BackupStoreHost,
    now: number = Date.now()
): Promise<number> {
    const backups = await listRotationBackups(host);
    if (backups.length === 0) return 0;

    const byLadder = selectBackupsToKeep(backups, host.getBackupGenerations(), now);
    const byBudget = enforceBackupBudget(byLadder.keep);
    const doomed = [...byLadder.drop, ...byBudget.drop];

    for (const entry of doomed) {
        await host.removeIfExists(entry.path);
    }
    return doomed.length;
}

export type WriteBackupResult = 'created' | 'unchanged' | 'too-large';

/**
 * Add a backup to the pool, then prune it.
 *
 * `unchanged` means the newest backup already holds these sessions. That is
 * not a nicety: a press that writes an identical file still costs the pool a
 * slot, and pressing four times in a row would leave four copies of one moment
 * where the ladder wanted four different ones.
 */
export async function writeRotationBackup(
    host: BackupStoreHost,
    backupData: Record<string, unknown>,
    options: { manual: boolean; now?: number }
): Promise<WriteBackupResult> {
    const now = options.now ?? Date.now();
    const existing = await listRotationBackups(host);
    const newest = existing[0];

    if (newest) {
        try {
            const read = await host.readJsonIfExists(newest.path);
            if (read.exists && read.data
                && contentKey(read.data, true) === contentKey(backupData, true)) {
                return 'unchanged';
            }
        } catch {
            // A backup that cannot be read is not proof that one is unnecessary.
        }
    }

    const payload = options.manual
        ? { ...backupData, [MANUAL_BACKUP_FIELD]: true }
        : backupData;

    // Measured before the write rather than after, so an oversized backup is
    // refused instead of written and then deleted.
    if (JSON.stringify(payload).length > BACKUP_FILE_LIMIT_BYTES) return 'too-large';

    const savedAt = getPersistStamp(payload) || now;
    await host.ensureDir(host.getBackupsDirPath());
    await host.writeJson(`${host.getBackupsDirPath()}/${backupFileName(savedAt)}`, payload);
    host._lastRotationBackupAt = now;

    await pruneRotationBackups(host, now);
    return 'created';
}

/**
 * Every file in the pool, for the reset that clears backups.
 *
 * `dir` so a caller can clear a directory that is not the current one - a
 * reset has to remove what an earlier storage location left behind, which is
 * why the fixed-path list named both.
 */
export async function removeAllRotationBackups(
    host: BackupStoreHost,
    dir: string = host.getBackupsDirPath()
): Promise<void> {
    let listed: { files: string[] } | null = null;
    try {
        listed = await host.listDir(dir);
    } catch {
        listed = null;
    }
    for (const path of listed?.files ?? []) {
        if (backupSavedAtFromPath(path) === null) continue;
        await host.removeIfExists(path);
    }
    for (const generation of LEGACY_BACKUP_GENERATIONS) {
        await host.removeIfExists(`${dir}/sessions.${generation}.json`);
    }
}

/** The newest backup's moment, for the hourly gate on the automatic path. */
export async function newestBackupStamp(host: BackupStoreHost): Promise<number> {
    const backups = await listRotationBackups(host);
    return backups[0]?.savedAt ?? 0;
}
