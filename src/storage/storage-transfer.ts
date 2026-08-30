import { splitSessionHistory, hasSessionShape, hasNonEmptySessions } from './session-data.ts';

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
