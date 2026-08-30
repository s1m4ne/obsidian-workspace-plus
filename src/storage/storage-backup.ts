import { Platform } from 'obsidian';
import { getPersistStamp, hasSessionShape, hasNonEmptySessions } from './session-data.ts';
import type { JsonFileStore, ReadJsonResult } from './json-file-store.ts';

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
