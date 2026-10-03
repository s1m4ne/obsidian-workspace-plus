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

/**
 * Version history never travels with sessions - sessions.json is written
 * without it - so a session replaced by one read from disk has to be given its
 * history back. Otherwise the next save writes history.json without it.
 */
export function carryOverSessionHistory(
    from: Readonly<Record<string, SessionItem>>,
    to: Record<string, SessionItem>
): void {
    const ids = Object.keys(to);
    for (let i = 0; i < ids.length; i++) {
        const id = ids[i]!;
        const target = to[id];
        const history = from[id]?.history;
        if (!target || target.history || !Array.isArray(history) || history.length === 0) continue;
        target.history = history;
    }
}

/**
 * How long a deletion is remembered. Long enough for a device that was off to
 * come back and sync; a copy of the session older than that would return.
 */
export const DELETION_RECORD_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function readDeletedSessions(raw: unknown): Record<string, number> {
    const out: Record<string, number> = {};
    if (!raw || typeof raw !== 'object') return out;
    const record = raw as Record<string, unknown>;
    const ids = Object.keys(record);
    for (let i = 0; i < ids.length; i++) {
        const id = ids[i]!;
        const at = record[id];
        if (typeof at === 'number' && Number.isFinite(at)) out[id] = at;
    }
    return out;
}

/** Remember that `ids` were deleted now, and forget deletions past their time. */
export function recordSessionDeletions(
    deleted: Record<string, number> | undefined,
    ids: readonly string[],
    now: number
): Record<string, number> {
    const out: Record<string, number> = {};
    const known = deleted || {};
    const kept = Object.keys(known);
    for (let i = 0; i < kept.length; i++) {
        const id = kept[i]!;
        const at = known[id]!;
        if (now - at < DELETION_RECORD_TTL_MS) out[id] = at;
    }
    for (let i = 0; i < ids.length; i++) out[ids[i]!] = now;
    return out;
}

/**
 * A restore or an import replaces every session at once.
 *
 * The sessions it leaves out are deletions like any other, and are recorded so
 * the other devices drop them too. The ones it brings back that had been
 * deleted are now newer than that deletion; without saying so, the next sync
 * with a device that saw the deletion would remove them again.
 */
export function recordReplacementDeletions(
    previous: Readonly<Record<string, SessionItem>>,
    next: Record<string, SessionItem>,
    deleted: Record<string, number> | undefined,
    now: number
): Record<string, number> {
    const removed = Object.keys(previous).filter((id) => !next[id]);
    const out = recordSessionDeletions(deleted, removed, now);
    for (const [id, session] of Object.entries(next)) {
        if (out[id] === undefined) continue;
        delete out[id];
        session.modified = now;
    }
    return out;
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
    carryOverSessionHistory,
    readDeletedSessions,
    recordSessionDeletions,
    recordReplacementDeletions,
    hasInlineSessionHistory,
    pickSessionPayload,
    pickKeys,
    hasSessionShape,
    hasNonEmptySessions,
    getPersistStamp,
};

export default defaultExport;
