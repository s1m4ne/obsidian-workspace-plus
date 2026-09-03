import { SESSION_KEYS } from './default-data.ts';
import { joinPath } from './paths.ts';
import type { SessionHistoryEntry, SessionItem } from './default-data.ts';

export { SESSION_KEYS, joinPath };

export function readHistoryMap(raw: unknown): Record<string, SessionHistoryEntry[]> {
    if (!raw || typeof raw !== 'object') return {};
    const obj = raw as Record<string, unknown>;
    const map = (obj.history && typeof obj.history === 'object')
        ? (obj.history as Record<string, unknown>)
        : obj;
    const out: Record<string, SessionHistoryEntry[]> = {};
    const ids = Object.keys(map);
    for (let i = 0; i < ids.length; i++) {
        const id = ids[i]!;
        const entries = map[id];
        if (Array.isArray(entries) && entries.length > 0) {
            out[id] = entries as SessionHistoryEntry[];
        }
    }
    return out;
}

export function splitSessionHistory(sessionData: unknown): {
    data: Record<string, unknown>;
    history: Record<string, SessionHistoryEntry[]>;
} {
    const rawData = (sessionData && typeof sessionData === 'object') ? (sessionData as Record<string, unknown>) : {};
    const sessions = (rawData.sessions && typeof rawData.sessions === 'object')
        ? (rawData.sessions as Record<string, unknown>)
        : {};
    const strippedSessions: Record<string, unknown> = {};
    const history: Record<string, SessionHistoryEntry[]> = {};
    const ids = Object.keys(sessions);

    for (let i = 0; i < ids.length; i++) {
        const id = ids[i]!;
        const session = sessions[id];
        if (!session || typeof session !== 'object') continue;

        const sessionObj = session as Record<string, unknown>;
        const copy: Record<string, unknown> = {};
        const keys = Object.keys(sessionObj);
        for (let k = 0; k < keys.length; k++) {
            const key = keys[k]!;
            if (key === 'history') continue;
            copy[key] = sessionObj[key];
        }
        strippedSessions[id] = copy;

        if (Array.isArray(sessionObj.history) && sessionObj.history.length > 0) {
            history[id] = sessionObj.history as SessionHistoryEntry[];
        }
    }

    return {
        data: Object.assign({}, rawData, { sessions: strippedSessions }),
        history: history,
    };
}

export function mergeSessionHistory(
    sessionData: unknown,
    historyMap?: Record<string, SessionHistoryEntry[]> | null
): unknown {
    if (!sessionData || typeof sessionData !== 'object') return sessionData;
    const rawData = sessionData as Record<string, unknown>;
    const sessions = (rawData.sessions && typeof rawData.sessions === 'object')
        ? (rawData.sessions as Record<string, unknown>)
        : {};
    const ids = Object.keys(sessions);

    for (let i = 0; i < ids.length; i++) {
        const id = ids[i]!;
        const session = sessions[id];
        if (!session || typeof session !== 'object') continue;

        const sessionObj = session as SessionItem;
        const entries = historyMap && historyMap[id];
        if (Array.isArray(entries) && entries.length > 0) {
            sessionObj.history = entries;
        } else if (!Array.isArray(sessionObj.history) || sessionObj.history.length === 0) {
            delete sessionObj.history;
        }
    }

    return sessionData;
}

export function hasInlineSessionHistory(sessionData: unknown): boolean {
    if (!sessionData || typeof sessionData !== 'object') return false;
    const rawData = sessionData as Record<string, unknown>;
    const sessions = (rawData.sessions && typeof rawData.sessions === 'object')
        ? (rawData.sessions as Record<string, unknown>)
        : {};
    const ids = Object.keys(sessions);
    for (let i = 0; i < ids.length; i++) {
        const id = ids[i]!;
        const session = sessions[id] as SessionItem | undefined;
        if (session && Array.isArray(session.history) && session.history.length > 0) return true;
    }
    return false;
}

export function pickSessionPayload(data: unknown): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    if (!data || typeof data !== 'object') return out;
    const record = data as Record<string, unknown>;
    for (let i = 0; i < SESSION_KEYS.length; i++) {
        const key = SESSION_KEYS[i]!;
        if (record[key] !== undefined) out[key] = record[key];
    }
    if (typeof record._wppSavedAt === 'number') out._wppSavedAt = record._wppSavedAt;
    return out;
}

export function pickKeys(data: unknown, keys: readonly string[]): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    if (!data || typeof data !== 'object') return out;
    const record = data as Record<string, unknown>;
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]!;
        if (record[key] !== undefined) out[key] = record[key];
    }
    return out;
}

export function hasSessionShape(data: unknown): boolean {
    if (!data || typeof data !== 'object') return false;
    const record = data as Record<string, unknown>;
    return record.sessions !== undefined || record.sessionOrder !== undefined || record.activeSessionId !== undefined;
}

export function hasNonEmptySessions(data: unknown): boolean {
    if (!data || typeof data !== 'object') return false;
    const record = data as Record<string, unknown>;
    return !!(
        record.sessions
        && typeof record.sessions === 'object'
        && Object.keys(record.sessions).length > 0
    );
}

export function getPersistStamp(data: unknown): number {
    if (!data || typeof data !== 'object') return 0;
    const stamp = (data as Record<string, unknown>)._wppSavedAt;
    if (typeof stamp !== 'number' || !Number.isFinite(stamp)) return 0;
    return stamp;
}

const defaultExport = {
    SESSION_KEYS,
    joinPath,
    readHistoryMap,
    splitSessionHistory,
    mergeSessionHistory,
    hasInlineSessionHistory,
    pickSessionPayload,
    pickKeys,
    hasSessionShape,
    hasNonEmptySessions,
    getPersistStamp,
};

export default defaultExport;
