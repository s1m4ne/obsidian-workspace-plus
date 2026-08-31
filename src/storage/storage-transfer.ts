import { Notice } from 'obsidian';
import { L } from '../i18n.ts';
import { splitSessionHistory, hasSessionShape, hasNonEmptySessions } from './session-data.ts';
import type { PluginData } from './default-data.ts';
import type { SessionDataPayload } from './storage-backup.ts';

function formatString(fnOrStr: unknown, ...args: Array<string | number>): string {
    if (typeof fnOrStr === 'function') {
        return (fnOrStr as (...args: Array<string | number>) => string)(...args);
    }
    return typeof fnOrStr === 'string' ? fnOrStr : '';
}

export function pad2(n: number): string {
    return n < 10 ? `0${n}` : String(n);
}

export function formatExportStamp(ts: number): string {
    const d = new Date(ts);
    return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
}

export function createExportPayload(sessionData: unknown, sourcePluginId: string): {
    exportedAt: number;
    source: string;
    data: Record<string, unknown>;
} {
    return {
        exportedAt: Date.now(),
        source: sourcePluginId,
        data: splitSessionHistory(sessionData).data,
    };
}

export function findLatestExportFile(filePaths: string[]): string | null {
    if (!filePaths || filePaths.length === 0) return null;
    const jsonFiles = filePaths.filter((filePath) => /\.json$/i.test(filePath));
    if (jsonFiles.length === 0) return null;
    jsonFiles.sort();
    return jsonFiles[jsonFiles.length - 1] ?? null;
}

export function validateExportedSessionData(parsed: unknown, normalize: (data: unknown) => unknown): unknown {
    let candidate: unknown = parsed;
    if (parsed && typeof parsed === 'object') {
        const obj = parsed as Record<string, unknown>;
        if (obj.data) {
            candidate = obj.data;
        }
    }

    if (!hasSessionShape(candidate)) {
        return null;
    }
    const imported = normalize(candidate);
    if (!hasNonEmptySessions(imported)) {
        return null;
    }
    return imported;
}

export interface StorageExportHost {
    data: PluginData;
    manifest: { id: string };
    getExportDirPath(): string;
    extractSessionData(data: PluginData): unknown;
    ensureSessionStorageDir(): Promise<unknown>;
    ensureDir(path: string): Promise<unknown>;
    writeJson(path: string, payload: unknown, pretty?: boolean): Promise<unknown>;
}

export async function exportSessionsSnapshot(host: StorageExportHost): Promise<string> {
    const stamp = formatExportStamp(Date.now());
    const filePath = `${host.getExportDirPath()}/sessions-${stamp}.json`;
    const payload = createExportPayload(
        host.extractSessionData(host.data),
        host.manifest.id
    );

    await host.ensureSessionStorageDir();
    await host.ensureDir(host.getExportDirPath());
    await host.writeJson(filePath, payload, true);
    new Notice(formatString(L.exportSessionsDone, filePath), 7000);
    return filePath;
}

export interface StorageImportHost {
    app: { vault: { adapter: { exists(path: string): Promise<boolean>; list(path: string): Promise<{ files: string[] }>; read(path: string): Promise<string> } } };
    data: PluginData;
    getExportDirPath(): string;
    normalizeSessionData(data: unknown): SessionDataPayload;
    normalizeGroupTabOrder?(order: string[]): string[];
    syncSessionOrder(): void;
    updateStatusBar(): void;
    syncSessionCommands(): void;
    persistData(): Promise<unknown>;
    reloadCurrentSessionWithoutSaving(options?: { silent?: boolean }): Promise<unknown>;
}

export async function importSessionsFromLatestExport(host: StorageImportHost): Promise<boolean> {
    const exportDir = host.getExportDirPath();
    const exists = await host.app.vault.adapter.exists(exportDir);
    if (!exists) {
        new Notice(formatString(L.importSessionsNoFile));
        return false;
    }

    const listed = await host.app.vault.adapter.list(exportDir);
    if (!listed || !listed.files || listed.files.length === 0) {
        new Notice(formatString(L.importSessionsNoFile));
        return false;
    }

    const latestPath = findLatestExportFile(listed.files);
    if (!latestPath) {
        new Notice(formatString(L.importSessionsNoFile));
        return false;
    }

    try {
        const raw = await host.app.vault.adapter.read(latestPath);
        const parsed: unknown = JSON.parse(raw);
        const imported = validateExportedSessionData(
            parsed,
            (candidate: unknown) => host.normalizeSessionData(candidate)
        ) as SessionDataPayload | null;

        if (!imported) {
            new Notice(formatString(L.importSessionsFailed));
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
        // Apply the imported layout to the workspace. Without
        // this the screen keeps showing the pre-import layout
        // while the data holds the imported one, and the first
        // session switch writes the screen back over the import
        // - auto-save on switch captures the current layout
        // before leaving. The imported active session would be
        // silently lost by the very action a user takes to see
        // whether the import worked.
        await host.reloadCurrentSessionWithoutSaving({ silent: true });
        new Notice(formatString(L.importSessionsDone, latestPath), 7000);
        return true;
    } catch {
        new Notice(formatString(L.importSessionsFailed));
        return false;
    }
}
