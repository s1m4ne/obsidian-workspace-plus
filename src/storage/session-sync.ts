import { SyncWatcher, SESSION_FILE_MTIME_EPSILON_MS } from './sync-watcher.ts';
import type { SessionStore } from '../state/session-store.ts';
import type { SessionSwitcher } from '../state/session-switcher.ts';
import type { PluginData, SessionGroup, SessionItem } from './default-data.ts';
import type { SessionDataPayload } from './storage-backup.ts';
import type { ReadJsonResult } from './json-file-store.ts';
import { getPersistStamp, hasSessionShape } from './session-data.ts';
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

export function getComparableSessionData(
    normalizeSessionData: (data: unknown) => SessionDataPayload,
    data: unknown
): {
    sessions: Record<string, SessionItem>;
    sessionOrder: string[];
    groups: Record<string, SessionGroup>;
    groupOrder: string[];
    sessionGroups: Record<string, string[]>;
} {
    const normalized = normalizeSessionData(data || {});
    return {
        sessions: normalized.sessions || {},
        sessionOrder: normalized.sessionOrder || [],
        groups: normalized.groups || {},
        groupOrder: normalized.groupOrder || [],
        sessionGroups: normalized.sessionGroups || {},
    };
}

export function getComparableSessionDataJson(
    normalizeSessionData: (data: unknown) => SessionDataPayload,
    data: unknown
): string {
    return JSON.stringify(getComparableSessionData(normalizeSessionData, data));
}

export interface SessionStorageStateHost {
    _sessionStorageStamp?: number;
    _sessionStorageMtime?: number;
    _sessionStorageComparableData?: unknown;
    _sessionStorageDataJson?: string;
    normalizeSessionData(data: unknown): SessionDataPayload;
}

export function recordSessionStorageState(
    host: SessionStorageStateHost,
    stamp: number,
    mtime: number,
    data?: unknown
): void {
    host._sessionStorageStamp = typeof stamp === 'number' && Number.isFinite(stamp) ? stamp : 0;
    host._sessionStorageMtime = typeof mtime === 'number' && Number.isFinite(mtime) ? mtime : 0;

    if (data) {
        const comparable = getComparableSessionData((d) => host.normalizeSessionData(d), data);
        host._sessionStorageComparableData = cloneJson(comparable);
        host._sessionStorageDataJson = JSON.stringify(comparable);
    }
}

/**
 * The same comparison, reading the two numbers off the host rather than taking
 * them as arguments. The caller almost always has a host and not a pair of
 * timestamps, and getting the order of those two arguments wrong is silent.
 */
export function isSessionStorageInfoNewerForHost(
    host: SessionStorageStateHost,
    info: { valid?: boolean; stamp?: number; mtime?: number } | null | undefined
): boolean {
    return isSessionStorageInfoNewer(info, host._sessionStorageStamp || 0, host._sessionStorageMtime || 0);
}

export interface MergeExternalSessionDataHost {
    data: Record<string, unknown>;
    /** The snapshot taken at the last read, which is the merge's baseline. */
    _sessionStorageComparableData?: unknown;
    extractSessionData(data: unknown): Record<string, unknown>;
    // Declared here rather than inherited from SessionStorageStateHost, whose
    // narrower SessionDataPayload return type is not the shape the merge works
    // in. Casting the callback would have hidden that.
    normalizeSessionData(data: unknown): Record<string, unknown>;
}

/**
 * Merge what another device wrote into what this one holds, using the snapshot
 * recorded at our last read as the baseline. Without that baseline a field this
 * device never touched is indistinguishable from one it deliberately cleared.
 */
export function mergeExternalSessionDataForHost(
    host: MergeExternalSessionDataHost,
    externalData: Record<string, unknown>
): Record<string, unknown> {
    return mergeExternalSessionDataForWrite(
        host.extractSessionData(host.data || {}),
        externalData,
        host._sessionStorageComparableData as Record<string, unknown> | null | undefined,
        (d) => host.normalizeSessionData(d),
    );
}

export interface RecordSessionDataStoredHost extends SessionStorageStateHost {
    getSessionsPath(): string;
    getFileMtime(path: string): Promise<number>;
}

export async function recordSessionDataStored(
    host: RecordSessionDataStoredHost,
    sessionData: unknown
): Promise<boolean> {
    const stamp = getPersistStamp(sessionData);
    recordSessionStorageState(host, stamp, Date.now(), sessionData);

    try {
        const mtime = await host.getFileMtime(host.getSessionsPath());
        recordSessionStorageState(host, stamp, mtime || host._sessionStorageMtime || 0, sessionData);
        return true;
    } catch {
        return true;
    }
}

export interface SessionStorageInfo {
    exists: boolean;
    valid: boolean;
    data: unknown;
    stamp: number;
    mtime: number;
    path: string;
    plugin: unknown;
}

export interface GetSessionStorageInfoHost {
    getSessionsPath(): string;
    readJsonIfExists(path: string): Promise<ReadJsonResult>;
    getFileMtime(path: string): Promise<number>;
}

export async function getSessionStorageInfo(
    host: GetSessionStorageInfoHost
): Promise<SessionStorageInfo> {
    const path = host.getSessionsPath();
    const [res, mtimeRaw] = await Promise.all([
        host.readJsonIfExists(path),
        host.getFileMtime(path),
    ]);
    const mtime = mtimeRaw || 0;
    const valid = !!(res.exists && !res.error && hasSessionShape(res.data));
    return {
        exists: !!res.exists,
        valid: valid,
        data: valid ? res.data : null,
        stamp: valid ? getPersistStamp(res.data) : 0,
        mtime: mtime,
        path: path,
        plugin: host,
    };
}

export function hasLocalSessionChangesSinceStorage(
    host: SessionStorageStateHost & { data: PluginData }
): boolean {
    if (!host._sessionStorageDataJson) return false;
    return getComparableSessionDataJson((d) => host.normalizeSessionData(d), host.data || {}) !== host._sessionStorageDataJson;
}

export interface ApplySessionDataHost {
    data: PluginData;
    normalizeSessionData(data: unknown): SessionDataPayload;
    extractSessionData(data: unknown): Record<string, unknown>;
    syncSessionOrder(): void;
    normalizeGroupFeatureState(): void;
    updateStatusBar(): void;
    syncSessionCommands(): void;
    notifySessionsChanged(): void;
    _sessionStorageComparableData?: unknown;

    /**
     * The owners, named rather than restated (#117). The store answers what is
     * on screen and whether two layouts differ - it is the one that resolves
     * the restore scope - and the switcher owns putting a layout up and knows
     * whether a switch is already in flight.
     */
    getSessionStore(): SessionStore;
    getSessionSwitcher(): SessionSwitcher;
}

/**
 * Put the incoming active session's layout on screen (#117).
 *
 * Sessions arriving from another device reached `data.sessions` and stopped
 * there. The workspace went on showing the old layout, the status bar named a
 * session whose layout was not up, and the next switch captured the stale
 * screen back over what had just arrived - auto-save on switch writes the
 * current layout before leaving. So a session synced from another device was
 * lost by the next thing the user did.
 *
 * The import path has always done this (`storage-backup.ts:271`), and its test
 * file records the identical defect. The difference is that import is an
 * explicit "restore this snapshot"; a sync is automatic and can land at any
 * moment, so it cannot simply take the screen:
 *
 * - **Only when the screen was the saved layout.** If the workspace has moved
 *   since the active session was last saved, that is unsaved work and it is
 *   the user's. This is the rule an editor uses for a file changed on disk:
 *   reload it if unmodified, leave it alone if not.
 * - **Not while a switch is in flight.** Two `changeLayout` calls racing would
 *   leave the workspace in neither state.
 * - **Not when it would change nothing**, so a sync that touched other
 *   sessions does not rebuild the workspace for no reason.
 */
async function applyIncomingActiveLayout(
    host: ApplySessionDataHost,
    workspaceHeldTheSavedLayout: boolean,
    layoutOnScreen: unknown
): Promise<void> {
    if (!workspaceHeldTheSavedLayout) return;
    if (host.getSessionSwitcher().isSwitching) return;

    const activeId = host.data.activeSessionId;
    const active = activeId ? host.data.sessions?.[activeId] : undefined;
    if (!active || !active.layout) return;

    const store = host.getSessionStore();
    if (layoutOnScreen && store.layoutsEqualStructural(active.layout, layoutOnScreen)) return;

    await host.getSessionSwitcher().applyWorkspaceLayout(active.layout, { catchErrors: true });
}

export async function applySessionDataFromStorage(
    host: ApplySessionDataHost,
    sessionData: unknown,
    options?: { mergeLocal?: boolean; applyLayout?: boolean }
): Promise<boolean> {
    const opts = options || {};
    if (!sessionData) return false;

    const localActiveSessionId = host.data && host.data.activeSessionId;
    const localActiveGroupId = host.data && host.data.activeGroupId;

    // Read before the store is replaced: whether the screen is expendable is a
    // question about the layout the active session held *going in*.
    let layoutOnScreen: unknown = null;
    let workspaceHeldTheSavedLayout = false;
    if (opts.applyLayout) {
        const localActive = localActiveSessionId ? host.data.sessions?.[localActiveSessionId] : undefined;
        try {
            layoutOnScreen = host.getSessionStore().getCurrentWorkspaceLayout();
        } catch {
            layoutOnScreen = null;
        }
        workspaceHeldTheSavedLayout = Boolean(
            localActive
            && localActive.layout
            && layoutOnScreen
            && host.getSessionStore().layoutsEqualStructural(localActive.layout, layoutOnScreen)
        );
    }
    const next = opts.mergeLocal
        ? (mergeExternalSessionDataForWrite(
            host.extractSessionData(host.data || {}),
            sessionData as Record<string, unknown>,
            host._sessionStorageComparableData as Record<string, unknown> | null | undefined,
            (d) => host.normalizeSessionData(d) as Record<string, unknown>
        ) as SessionDataPayload)
        : host.normalizeSessionData(sessionData);

    host.data.sessions = next.sessions || {};
    host.data.sessionOrder = next.sessionOrder || [];
    host.data.groups = next.groups || {};
    host.data.groupOrder = next.groupOrder || [];
    host.data.sessionGroups = next.sessionGroups || {};

    if (localActiveSessionId && host.data.sessions[localActiveSessionId]) {
        host.data.activeSessionId = localActiveSessionId;
    } else if (next.activeSessionId && host.data.sessions[next.activeSessionId]) {
        host.data.activeSessionId = next.activeSessionId;
    } else {
        host.data.activeSessionId = host.data.sessionOrder[0] || Object.keys(host.data.sessions)[0] || null;
    }

    if (localActiveGroupId && host.data.groups[localActiveGroupId]) {
        host.data.activeGroupId = localActiveGroupId;
    } else if (next.activeGroupId && host.data.groups[next.activeGroupId]) {
        host.data.activeGroupId = next.activeGroupId;
    } else {
        host.data.activeGroupId = null;
    }

    host.syncSessionOrder();
    host.normalizeGroupFeatureState();
    host.updateStatusBar();
    host.syncSessionCommands();
    host.notifySessionsChanged();

    if (opts.applyLayout) {
        await applyIncomingActiveLayout(host, workspaceHeldTheSavedLayout, layoutOnScreen);
    }
    return true;
}

export interface ReloadExternalSessionHost extends ApplySessionDataHost, SessionStorageStateHost, GetSessionStorageInfoHost {
    loadSessionDataFromStorage(): Promise<unknown>;
}

export async function reloadExternalSessionStorageIfChanged(
    host: ReloadExternalSessionHost,
    options?: { force?: boolean; mergeLocal?: boolean; applyLayout?: boolean }
): Promise<boolean> {
    const opts = options || {};
    try {
        const info = await getSessionStorageInfo(host);
        const currentStamp = host._sessionStorageStamp || 0;
        const currentMtime = host._sessionStorageMtime || 0;
        if (!opts.force && !isSessionStorageInfoNewer(info, currentStamp, currentMtime)) {
            return false;
        }

        const mergeLocal = !!opts.mergeLocal && hasLocalSessionChangesSinceStorage(host);
        const previousComparable = host._sessionStorageComparableData
            ? cloneJson(host._sessionStorageComparableData)
            : null;
        const previousComparableJson = host._sessionStorageDataJson || '';

        const sessionData = await host.loadSessionDataFromStorage();
        if (!sessionData) return false;

        const externalComparable = host._sessionStorageComparableData
            ? cloneJson(host._sessionStorageComparableData)
            : null;
        const externalComparableJson = host._sessionStorageDataJson || '';

        if (mergeLocal && previousComparable) {
            host._sessionStorageComparableData = previousComparable;
            host._sessionStorageDataJson = previousComparableJson;
        }

        const applied = await applySessionDataFromStorage(host, sessionData, {
            mergeLocal,
            // Only the watcher's reload may take the screen. The other caller
            // is persistDataImmediate() reading before it writes, and a save
            // that changed the workspace out from under the person saving
            // would be worse than the bug.
            applyLayout: !!opts.applyLayout,
        });

        if (mergeLocal && externalComparable) {
            host._sessionStorageComparableData = externalComparable;
            host._sessionStorageDataJson = externalComparableJson;
        }

        return applied;
    } catch {
        return false;
    }
}

export interface SyncWatcherHost {
    _syncWatcher?: SyncWatcher;
    reloadExternalSessionStorageIfChanged(options?: { mergeLocal?: boolean; force?: boolean; applyLayout?: boolean }): Promise<boolean>;
    registerDomEvent?(target: unknown, event: string, handler: (e: unknown) => void): void;
    data?: PluginData;
}

export function getSyncWatcher(host: SyncWatcherHost): SyncWatcher {
    if (!host._syncWatcher) {
        host._syncWatcher = new SyncWatcher({
            onReload: () => host.reloadExternalSessionStorageIfChanged({ mergeLocal: false, applyLayout: true }),
            registerDomEvent: typeof host.registerDomEvent === 'function'
                ? (target, event, handler) => host.registerDomEvent!(target, event, handler)
                : undefined,
        });
    }
    return host._syncWatcher;
}

export function onExternalSettingsChange(host: SyncWatcherHost & { scheduleExternalSessionStorageReload?(debounceMs?: number): void }): void {
    if (!host.data) return;
    if (typeof host.scheduleExternalSessionStorageReload === 'function') {
        host.scheduleExternalSessionStorageReload();
    } else {
        getSyncWatcher(host).scheduleReload();
    }
}

export function clearSessionStorageSyncTimers(host: { _syncWatcher?: SyncWatcher }): void {
    if (host._syncWatcher) {
        host._syncWatcher.clearTimers();
    }
}

