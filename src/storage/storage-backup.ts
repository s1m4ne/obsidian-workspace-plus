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

