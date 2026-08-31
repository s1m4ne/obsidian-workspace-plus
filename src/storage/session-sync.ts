import { SESSION_FILE_MTIME_EPSILON_MS } from './sync-watcher.ts';
import type { SessionItem } from './default-data.ts';
import { cloneJson } from '../clone-json.ts';

// Re-exported so the .js callers that still require this module keep working.
export { cloneJson };

export function getSessionModified(session: unknown): number {
    if (!session || typeof session !== 'object') return 0;
    const mod = (session as { modified?: unknown }).modified;
    if (typeof mod !== 'number' || !Number.isFinite(mod)) return 0;
    return mod;
}

export function mergeOrder(
    primary: readonly unknown[] | null | undefined,
    secondary: readonly unknown[] | null | undefined,
    validMap?: Record<string, unknown> | null
): string[] {
    const out: string[] = [];
    const seen: Record<string, boolean> = {};

    function add(item: unknown): void {
        if (typeof item !== 'string' || !item || seen[item]) return;
        if (validMap && !validMap[item]) return;
        seen[item] = true;
        out.push(item);
    }

    const p = Array.isArray(primary) ? primary : [];
    const s = Array.isArray(secondary) ? secondary : [];

    for (let i = 0; i < p.length; i++) add(p[i]);
    for (let i = 0; i < s.length; i++) add(s[i]);

    if (validMap) {
        const keys = Object.keys(validMap);
        for (let i = 0; i < keys.length; i++) add(keys[i]);
    }

    return out;
}

export function mergeObjectWithLocalDeletes(
    externalObj?: Record<string, unknown> | null,
    localObj?: Record<string, unknown> | null,
    baselineObj?: Record<string, unknown> | null
): Record<string, unknown> {
    const ext = externalObj || {};
    const loc = localObj || {};
    const base = baselineObj || {};

    const out: Record<string, unknown> = {};
    const externalKeys = Object.keys(ext);
    for (let i = 0; i < externalKeys.length; i++) {
        const id = externalKeys[i]!;
        if (base[id] && !loc[id]) continue;
        out[id] = cloneJson(ext[id]);
    }

    const localKeys = Object.keys(loc);
    for (let i = 0; i < localKeys.length; i++) {
        const id = localKeys[i]!;
        out[id] = cloneJson(loc[id]);
    }

    return out;
}

export function isSessionStorageInfoNewer(
    info: { valid?: boolean; stamp?: number; mtime?: number } | null | undefined,
    currentStamp: number,
    currentMtime: number
): boolean {
    if (!info || !info.valid) return false;

    const nextStamp = info.stamp || 0;
    const nextMtime = info.mtime || 0;

    if (nextStamp && currentStamp) {
        if (nextStamp > currentStamp) return true;
        if (nextStamp < currentStamp) return false;
    } else if (nextStamp && !currentStamp) {
        return true;
    }

    return nextMtime > currentMtime + SESSION_FILE_MTIME_EPSILON_MS;
}

export function mergeExternalSessionDataForWrite(
    localData: Record<string, unknown>,
    externalData: Record<string, unknown>,
    baselineData: Record<string, unknown> | null | undefined,
    normalize: (data: unknown) => Record<string, unknown>
): Record<string, unknown> {
    const local = localData;
    const external = normalize(externalData || {});
    const baseline = baselineData || {};
    const baselineSessions = (baseline.sessions && typeof baseline.sessions === 'object')
        ? (baseline.sessions as Record<string, SessionItem>) : {};
    const localSessions = (local.sessions && typeof local.sessions === 'object')
        ? (local.sessions as Record<string, SessionItem>) : {};
    const externalSessions = (external.sessions && typeof external.sessions === 'object')
        ? (external.sessions as Record<string, SessionItem>) : {};
    const mergedSessions: Record<string, SessionItem> = {};

    const externalIds = Object.keys(externalSessions);
    for (let i = 0; i < externalIds.length; i++) {
        const id = externalIds[i]!;
        if (
            baselineSessions[id]
            && !localSessions[id]
            && getSessionModified(externalSessions[id]) <= getSessionModified(baselineSessions[id])
        ) {
            continue;
        }
        mergedSessions[id] = cloneJson(externalSessions[id])!;
    }

    const localIds = Object.keys(localSessions);
    for (let i = 0; i < localIds.length; i++) {
        const id = localIds[i]!;
        if (!mergedSessions[id]) {
            mergedSessions[id] = cloneJson(localSessions[id])!;
            continue;
        }
        if (getSessionModified(localSessions[id]) >= getSessionModified(mergedSessions[id])) {
            mergedSessions[id] = cloneJson(localSessions[id])!;
        }
    }

    const groups = mergeObjectWithLocalDeletes(
        external.groups as Record<string, unknown>,
        local.groups as Record<string, unknown>,
        baseline.groups as Record<string, unknown>
    );
    const sessionGroups = mergeObjectWithLocalDeletes(
        external.sessionGroups as Record<string, unknown>,
        local.sessionGroups as Record<string, unknown>,
        baseline.sessionGroups as Record<string, unknown>
    );

    return normalize({
        activeSessionId: (local.activeSessionId as string | undefined) || (external.activeSessionId as string | undefined),
        sessions: mergedSessions,
        sessionOrder: mergeOrder(external.sessionOrder as string[], local.sessionOrder as string[], mergedSessions),
        groups: groups,
        groupOrder: mergeOrder(external.groupOrder as string[], local.groupOrder as string[], groups),
        sessionGroups: sessionGroups,
        activeGroupId: (local.activeGroupId as string | undefined) || (external.activeGroupId as string | undefined),
    });
}
