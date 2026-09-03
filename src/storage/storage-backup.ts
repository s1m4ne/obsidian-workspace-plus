import { Notice, Platform } from 'obsidian';
import { L, formatString } from '../i18n.ts';
import { getPersistStamp, hasSessionShape, hasNonEmptySessions } from './session-data.ts';
import type { JsonFileStore, ReadJsonResult } from './json-file-store.ts';
import type { PluginData, SessionGroup, SessionItem } from './default-data.ts';

export const BACKUP_ROTATION_INTERVAL = 3600000; // 1 hour

export interface RotationBackupInfo {
    generation: number;
    savedAt: number;
    sessionCount: number;
    backupPlatform: string;
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

export async function initRotationBackupTimestamp(
    reader: ReadJsonFn | JsonFileStore,
    path: string
): Promise<number> {
    try {
        const readFn = typeof reader === 'function' ? reader : (p: string) => reader.readJsonIfExists(p);
        const res = await readFn(path);
        if (res.exists && res.data) {
            return getPersistStamp(res.data) || 0;
        }
        return 0;
    } catch {
        return 0;
    }
}

export async function rotateBackupIfNeeded(
    store: JsonFileStore,
    backupsDir: string,
    getBackupPath: (generation: number) => string,
    lastBackupAt: number,
    sessionData: unknown,
    now: number = Date.now()
): Promise<number> {
    if (now - (lastBackupAt || 0) < BACKUP_ROTATION_INTERVAL) {
        return lastBackupAt;
    }

    try {
        await store.ensureDir(backupsDir);

        // Shift generations: 2 -> 3, 1 -> 2
        const p2 = getBackupPath(2);
        const p3 = getBackupPath(3);
        const res2 = await store.readJsonIfExists(p2);
        if (res2.exists && res2.data !== null) {
            await store.writeJson(p3, res2.data);
        }

        const p1 = getBackupPath(1);
        const res1 = await store.readJsonIfExists(p1);
        if (res1.exists && res1.data !== null) {
            await store.writeJson(p2, res1.data);
        }

        // Write current data as generation 1
        await store.writeJson(p1, prepareRotationBackupData(sessionData));
        return now;
    } catch {
        return lastBackupAt;
    }
}

export async function getRotationBackupInfo(
    reader: ReadJsonFn | JsonFileStore,
    getBackupPath: (generation: number) => string
): Promise<RotationBackupInfo[]> {
    const results: RotationBackupInfo[] = [];
    const readFn = typeof reader === 'function' ? reader : (p: string) => reader.readJsonIfExists(p);

    async function readGeneration(n: number): Promise<RotationBackupInfo | null> {
        try {
            const res = await readFn(getBackupPath(n));
            if (!res.exists || !res.data) return null;
            const data = res.data as Record<string, unknown>;
            const stamp = getPersistStamp(data);
            const sessions = data.sessions;
            const count = (sessions && typeof sessions === 'object')
                ? Object.keys(sessions).length : 0;
            const platform = typeof data._wppBackupPlatform === 'string'
                ? data._wppBackupPlatform
                : '';
            return {
                generation: n,
                savedAt: stamp,
                sessionCount: count,
                backupPlatform: platform,
            };
        } catch {
            return null;
        }
    }

    const items = await Promise.all([
        readGeneration(1),
        readGeneration(2),
        readGeneration(3),
    ]);

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item) results.push(item);
    }
    return results;
}

export async function readAndValidateRotationBackup(
    reader: ReadJsonFn | JsonFileStore,
    path: string,
    normalizeSessionData: (data: unknown) => unknown
): Promise<unknown> {
    try {
        const readFn = typeof reader === 'function' ? reader : (p: string) => reader.readJsonIfExists(p);
        const res = await readFn(path);
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

export interface RotationBackupTimestampHost {
    readJsonIfExists: ReadJsonFn;
    getRotationBackupPath(generation: number): string;
    _lastRotationBackupAt?: number;
}

export async function initRotationBackupTimestampForHost(host: RotationBackupTimestampHost): Promise<void> {
    const stamp = await initRotationBackupTimestamp(
        (p: string) => host.readJsonIfExists(p),
        host.getRotationBackupPath(1)
    );
    host._lastRotationBackupAt = stamp;
}

export interface RotateBackupHost extends RotationBackupTimestampHost {
    getJsonStore(): JsonFileStore;
    getBackupsDirPath(): string;
}

export async function rotateBackupIfNeededForHost(
    host: RotateBackupHost,
    sessionData: unknown
): Promise<void> {
    const lastBackupAt = host._lastRotationBackupAt || 0;
    const newStamp = await rotateBackupIfNeeded(
        host.getJsonStore(),
        host.getBackupsDirPath(),
        (gen: number) => host.getRotationBackupPath(gen),
        lastBackupAt,
        sessionData
    );
    host._lastRotationBackupAt = newStamp;
}

export async function getRotationBackupInfoForHost(host: {
    readJsonIfExists: ReadJsonFn;
    getRotationBackupPath(generation: number): string;
}): Promise<RotationBackupInfo[]> {
    return getRotationBackupInfo(
        (p: string) => host.readJsonIfExists(p),
        (gen: number) => host.getRotationBackupPath(gen)
    );
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
    getRotationBackupPath(generation: number): string;
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

export async function restoreFromRotationBackup(
    host: StorageRestoreHost,
    generation: number
): Promise<boolean> {
    try {
        const imported = (await readAndValidateRotationBackup(
            (p: string) => host.readJsonIfExists(p),
            host.getRotationBackupPath(generation),
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


export interface ManualRotationBackupHost {
    // Not RotationBackupTimestampHost: that one reads through the JSON store,
    // which this path does not touch. Only the stamp is shared.
    _lastRotationBackupAt?: number;
    getRotationBackupPath(generation: number): string;
    getBackupsDirPath(): string;
    readJsonIfExists: ReadJsonFn;
    ensureDir(path: string): Promise<unknown>;
    copyFileIfExists(sourcePath: string, destinationPath: string): Promise<unknown>;
    writeJson(path: string, data: unknown): Promise<unknown>;
}

/**
 * `unchanged` means generation 1 already holds these sessions, so nothing was
 * written and no generation moved.
 */
export type ManualRotationBackupResult = 'created' | 'unchanged';

/**
 * The fields that differ between two backups of the same sessions.
 *
 * `_wppSavedAt` is stamped at the moment of the backup, so it differs on every
 * press by construction; `_wppBackupPlatform` names the machine, and a backup
 * that arrived by sync from another one holds the same sessions under a
 * different label.
 */
const VOLATILE_BACKUP_FIELDS = ['_wppSavedAt', '_wppBackupPlatform'];

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

/** True when generation 1 already holds exactly these sessions. */
async function matchesNewestGeneration(
    host: ManualRotationBackupHost,
    backupData: Record<string, unknown>
): Promise<boolean> {
    try {
        const existing = await host.readJsonIfExists(host.getRotationBackupPath(1));
        if (!existing.exists || !existing.data) return false;
        return contentKey(existing.data, true) === contentKey(backupData, true);
    } catch {
        // A backup that cannot be read is not proof that one is unnecessary.
        return false;
    }
}

/**
 * Take a rotating backup now, on the user's say-so.
 *
 * The automatic path is `rotateBackupIfNeeded`, which is gated on the hour and
 * moves generations by reading and rewriting through the JSON store. This one
 * is asked for, so it has no clock behind it, and it copies files - which is
 * what both manual entry points did, byte for byte, in two places.
 *
 * It is gated on the *contents* instead, and that is not a nicety: there are
 * three generations, and rotating writes the live state into generation 1 while
 * pushing generation 3 off the end. Pressing the button four times in a row
 * with nothing changed in between would leave three copies of one moment and
 * destroy every older one - the opposite of what the button is for. So an
 * unchanged press does nothing at all and says so.
 *
 * Generations shift oldest-first, so nothing is overwritten before it has been
 * copied forward.
 */
export async function createRotationBackupNow(
    host: ManualRotationBackupHost,
    backupData: Record<string, unknown>
): Promise<ManualRotationBackupResult> {
    if (await matchesNewestGeneration(host, backupData)) return 'unchanged';

    await host.ensureDir(host.getBackupsDirPath());
    await host.copyFileIfExists(host.getRotationBackupPath(2), host.getRotationBackupPath(3));
    await host.copyFileIfExists(host.getRotationBackupPath(1), host.getRotationBackupPath(2));
    await host.writeJson(host.getRotationBackupPath(1), backupData);
    host._lastRotationBackupAt = Date.now();
    return 'created';
}
