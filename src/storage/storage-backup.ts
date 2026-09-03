import { Notice, Platform } from 'obsidian';
import { L, formatString } from '../i18n.ts';
import { hasSessionShape, hasNonEmptySessions } from './session-data.ts';
import type { ReadJsonResult } from './json-file-store.ts';
import {
    listRotationBackups,
    newestBackupStamp,
    writeRotationBackup,
    type BackupStoreHost,
} from './backup-store.ts';
import type { PluginData, SessionGroup, SessionItem } from './default-data.ts';

export const BACKUP_ROTATION_INTERVAL = 3600000; // 1 hour

export interface RotationBackupInfo {
    /** Display position, newest first. Not an identity - the pool renumbers. */
    generation: number;
    /** The identity: a backup is its file. */
    path: string;
    savedAt: number;
    sessionCount: number;
    backupPlatform: string;
    /** Asked for by the user rather than taken on a timer. */
    manual: boolean;
    size?: number | undefined;
}

export type ReadJsonFn = <T = unknown>(path: string) => Promise<ReadJsonResult<T>>;

export function getBackupPlatformLabel(): string {
    const platform = Platform || {};
    if (platform.isAndroidApp) return 'Android';
    if (platform.isIosApp) return 'iOS';
    if (platform.isMacOS) return 'macOS';
    if (platform.isWin) return 'Windows';
    if (platform.isLinux) return 'Linux';
    if (platform.isMobileApp || platform.isMobile) return 'Mobile';
    if (platform.isDesktopApp || platform.isDesktop) return 'Desktop';
    return '';
}

export function prepareRotationBackupData(sessionData: unknown): Record<string, unknown> {
    const backupData = Object.assign({}, (sessionData && typeof sessionData === 'object') ? sessionData as Record<string, unknown> : {});
    const platform = getBackupPlatformLabel();
    if (platform) backupData._wppBackupPlatform = platform;
    return backupData;
}

export async function readAndValidateRotationBackup(
    reader: ReadJsonFn,
    path: string,
    normalizeSessionData: (data: unknown) => unknown
): Promise<unknown> {
    try {
        const res = await reader(path);
        if (!res.exists || res.error || !res.data) {
            return null;
        }
        if (!hasSessionShape(res.data)) {
            return null;
        }
        const imported = normalizeSessionData(res.data);
        if (!hasNonEmptySessions(imported)) {
            return null;
        }
        return imported;
    } catch {
        return null;
    }
}

export async function copyFileIfExists(
    adapter: { exists(path: string): Promise<boolean>; read(path: string): Promise<string>; write(path: string, data: string): Promise<void> },
    srcPath: string,
    dstPath: string
): Promise<void> {
    const exists = await adapter.exists(srcPath);
    if (!exists) return;
    const raw = await adapter.read(srcPath);
    await adapter.write(dstPath, raw);
}

export interface SessionDataPayload {
    activeSessionId?: string | null;
    sessions?: Record<string, SessionItem>;
    sessionOrder?: string[];
    groups?: Record<string, SessionGroup>;
    groupOrder?: string[];
    sessionGroups?: Record<string, string[]>;
    activeGroupId?: string | null;
    _wppSavedAt?: number;
}

export interface StorageRestoreHost {
    data: PluginData;
    readJsonIfExists: ReadJsonFn;
    normalizeSessionData(data: unknown): SessionDataPayload;
    normalizeGroupTabOrder?(order: string[]): string[];
    syncSessionOrder(): void;
    updateStatusBar(): void;
    syncSessionCommands(): void;
    persistData(): Promise<unknown>;
    // `| null`, which is what SessionStore.getActiveSession actually answers.
    // The consumer below tests it for truthiness so either worked at run time,
    // and the disagreement only stayed invisible because the plugin reached
    // this host through a cast.
    getActiveSession(): SessionItem | null;
    applyWorkspaceLayout(layout: unknown, options?: { catchErrors?: boolean }): Promise<unknown>;
}

/**
 * Put a backup back.
 *
 * Named by its path rather than by a generation number: the pool renumbers on
 * every prune, so a number is a position in a list that may already have moved
 * by the time the confirmation is answered.
 */
export async function restoreFromRotationBackup(
    host: StorageRestoreHost,
    path: string
): Promise<boolean> {
    try {
        const imported = (await readAndValidateRotationBackup(
            (p: string) => host.readJsonIfExists(p),
            path,
            (d: unknown) => host.normalizeSessionData(d)
        )) as SessionDataPayload | null;

        if (!imported) {
            new Notice(formatString(L.rotationBackupRestoreFailed));
            return false;
        }

        host.data.activeSessionId = imported.activeSessionId ?? null;
        host.data.sessions = imported.sessions || {};
        host.data.sessionOrder = imported.sessionOrder || [];
        host.data.groups = imported.groups || {};
        host.data.groupOrder = typeof host.normalizeGroupTabOrder === 'function'
            ? host.normalizeGroupTabOrder(imported.groupOrder || [])
            : (imported.groupOrder || []);
        host.data.sessionGroups = imported.sessionGroups || {};
        host.data.activeGroupId = imported.activeGroupId || null;
        host.syncSessionOrder();
        host.updateStatusBar();
        host.syncSessionCommands();

        await host.persistData();
        const active = host.getActiveSession();
        if (active && active.layout) {
            await host.applyWorkspaceLayout(active.layout, { catchErrors: false });
        }
        new Notice(formatString(L.rotationBackupRestored));
        return true;
    } catch {
        new Notice(formatString(L.rotationBackupRestoreFailed));
        return false;
    }
}


export interface RotationBackupTimestampHost extends BackupStoreHost {
    readJsonIfExists: ReadJsonFn;
}

/**
 * Seed the hourly gate from what is already on disk.
 *
 * Without this a reload would take a backup immediately, however recently the
 * last one was written.
 */
export async function initRotationBackupTimestampForHost(host: RotationBackupTimestampHost): Promise<void> {
    host._lastRotationBackupAt = await newestBackupStamp(host);
}

/**
 * What the automatic path needs, which is what the pool needs.
 *
 * Its own name rather than the timestamp host's, because `asHost<>()` in
 * main.ts names it and the host-conformance check resolves required members
 * through `extends` - an alias is a name that check cannot read.
 */
export interface RotateBackupHost extends RotationBackupTimestampHost {
    getBackupsDirPath(): string;
}

/**
 * The automatic path: at most one backup an hour, taken after a save.
 *
 * The gate is a clock; what to keep afterwards is the ladder's business, so
 * this adds a file and lets `writeRotationBackup` prune. An unchanged save
 * writes nothing at all, which is why a vault sitting idle does not fill the
 * pool with copies of one moment.
 */
export async function rotateBackupIfNeededForHost(
    host: RotateBackupHost,
    sessionData: unknown,
    now: number = Date.now()
): Promise<void> {
    const lastBackupAt = host._lastRotationBackupAt || 0;
    if (now - lastBackupAt < BACKUP_ROTATION_INTERVAL) return;

    try {
        await writeRotationBackup(host, prepareRotationBackupData(sessionData), { manual: false, now });
    } catch {
        // A failed backup must not fail the save it followed.
    }
}

export function getRotationBackupInfoForHost(host: BackupStoreHost): Promise<RotationBackupInfo[]> {
    return listRotationBackups(host);
}
