import { Notice, type App } from 'obsidian';
import { L } from '../i18n.ts';
import { generateId } from '../utils.ts';
import { serializeLayout, layoutsEqual, layoutsEqualStructural, cloneLayout } from '../layout-utils.ts';
import type { PluginData, SessionItem } from '../storage/default-data.ts';
import type { GroupManager } from './group-manager.ts';
import type { SettingsState } from './settings-state.ts';

export interface SessionStoreHost {
    data: PluginData;
    app?: App;
    manifestId?: string;
    groupManager?: GroupManager;
    settingsState?: SettingsState;
    getCurrentWorkspaceLayout?: () => unknown;
    createSessionValidated?: (name: string, options?: SessionPersistOption) => Promise<SessionValidationResult>;
    moveSessionToGroupExclusive?: (sessionId: string, groupId: string) => Promise<boolean>;
    resolveGroupSelection?: (groupId: string | null) => Promise<{ resolvedGroupId: string | null }>;
    attachSessionToActiveGroup?: (sessionId: string) => void;
    persistData?: () => Promise<boolean>;
    updateStatusBar?: () => void;
    syncSessionCommands?: () => void;
    hideSwitchOverlay?: () => void;
    captureActiveSessionLayoutIfAutoSave?: () => void;
    applyWorkspaceLayout?: (layout: unknown) => Promise<boolean>;
    getWorkspaceRestoreScope?: () => string;
    openRenameModal?: (currentName: string, onRename: (newName: string) => void) => void;
    openConfirmModal?: (message: string, onConfirm: () => void, options?: { hint?: string; onHintClick?: () => void }) => void;
}

export interface SessionValidationResult {
    created: boolean;
    reason: 'duplicate' | 'empty' | '';
    name: string;
    sessionId: string | null;
    viewGroupId?: string | null;
}

export interface CreateSessionRecordOptions {
    modified?: number;
    isDefault?: boolean;
}

export interface SessionPersistOption {
    persist?: boolean;
    notify?: boolean;
    syncCommands?: boolean;
}

function formatString(fnOrStr: unknown, ...args: Array<string | number>): string {
    if (typeof fnOrStr === 'function') {
        const fn = fnOrStr as (...a: Array<string | number>) => string;
        return fn(...args);
    }
    return typeof fnOrStr === 'string' ? fnOrStr : '';
}

export class SessionStore {
    private readonly hostProvider: () => SessionStoreHost;

    constructor(hostOrProvider: SessionStoreHost | (() => SessionStoreHost)) {
        if (typeof hostOrProvider === 'function') {
            this.hostProvider = hostOrProvider;
        } else {
            this.hostProvider = () => hostOrProvider;
        }
    }

    private get host(): SessionStoreHost {
        return this.hostProvider();
    }

    private get data(): PluginData {
        return this.host.data;
    }

    private get sessions(): Record<string, SessionItem> {
        if (!this.data.sessions) this.data.sessions = {};
        return this.data.sessions;
    }

    private get sessionOrder(): string[] {
        if (!this.data.sessionOrder) this.data.sessionOrder = [];
        return this.data.sessionOrder;
    }

    private persistIfNeeded(options?: SessionPersistOption): Promise<boolean> {
        if (options?.persist === false) return Promise.resolve(true);
        if (typeof this.host.persistData === 'function') {
            return this.host.persistData();
        }
        return Promise.resolve(true);
    }

    // --- Query & Lookup (P10) ---

    findSession(id: string): SessionItem | null {
        return this.sessions[id] || null;
    }

    getSession(id: string): SessionItem {
        const session = this.sessions[id];
        if (!session) {
            throw new Error(`Session with id "${id}" not found.`);
        }
        return session;
    }

    getActiveSession(): SessionItem | null {
        if (!this.data.activeSessionId) return null;
        return this.sessions[this.data.activeSessionId] || null;
    }

    findSessionIndex(sessions: SessionItem[], sessionId: string | null | undefined): number {
        if (!sessions || sessions.length === 0 || !sessionId) return -1;
        for (let i = 0; i < sessions.length; i++) {
            if (sessions[i]?.id === sessionId) {
                return i;
            }
        }
        return -1;
    }

    getSessionIndex(sessions: SessionItem[], sessionId: string | null | undefined): number {
        const idx = this.findSessionIndex(sessions, sessionId);
        return idx === -1 ? 0 : idx;
    }

    findActiveSessionIndex(sessions: SessionItem[]): number {
        return this.findSessionIndex(sessions, this.data.activeSessionId);
    }

    getActiveSessionIndex(sessions: SessionItem[]): number {
        return this.getSessionIndex(sessions, this.data.activeSessionId);
    }

    // --- Ordering ---

    syncSessionOrder(): void {
        const sessions = this.sessions;
        const order = this.sessionOrder;
        this.data.sessionOrder = order.filter((id) => !!sessions[id]);

        const inOrder: Record<string, boolean> = {};
        for (let i = 0; i < this.data.sessionOrder.length; i++) {
            const id = this.data.sessionOrder[i];
            if (id) inOrder[id] = true;
        }

        const missing = Object.keys(sessions).filter((id) => !inOrder[id]);
        missing.sort((a, b) => {
            if (sessions[a]?.isDefault) return -1;
            if (sessions[b]?.isDefault) return 1;
            return (sessions[a]?.name || '').localeCompare(sessions[b]?.name || '');
        });

        for (let j = 0; j < missing.length; j++) {
            const id = missing[j];
            if (!id) continue;
            if (sessions[id]?.isDefault) {
                this.data.sessionOrder.unshift(id);
            } else {
                this.data.sessionOrder.push(id);
            }
        }
    }

    getOrderedSessionsUnfiltered(): SessionItem[] {
        const sessions = this.sessions;
        return this.sessionOrder
            .map((id) => sessions[id])
            .filter((s): s is SessionItem => !!s);
    }

    getOrderedSessionsForGroup(groupId: string | null): SessionItem[] {
        const all = this.getOrderedSessionsUnfiltered();
        const groupsEnabled = this.host.groupManager
            ? this.host.groupManager.isGroupFeatureEnabled()
            : (this.data.groupFeatureEnabled !== false);
        if (!groupsEnabled) {
            return all;
        }
        if (!groupId) return all;

        const sessionGroups = this.data.sessionGroups || {};
        return all.filter((s) => {
            const groups = sessionGroups[s.id];
            return groups && groups.includes(groupId);
        });
    }

    getOrderedSessions(): SessionItem[] {
        const groupsEnabled = this.host.groupManager
            ? this.host.groupManager.isGroupFeatureEnabled()
            : (this.data.groupFeatureEnabled !== false);
        if (!groupsEnabled) {
            return this.getOrderedSessionsUnfiltered();
        }
        return this.getOrderedSessionsForGroup(this.data.activeGroupId);
    }

    mergeVisibleSessionOrder(visibleOrder: string[]): string[] {
        const fullOrder = Array.isArray(this.data.sessionOrder) ? this.data.sessionOrder : [];
        const visible = Array.isArray(visibleOrder) ? visibleOrder : [];
        const visibleSet: Record<string, boolean> = {};
        for (let i = 0; i < visible.length; i++) {
            const id = visible[i];
            if (id) visibleSet[id] = true;
        }

        let visibleIdx = 0;
        const merged: string[] = [];
        for (let fi = 0; fi < fullOrder.length; fi++) {
            const id = fullOrder[fi];
            if (id && visibleSet[id]) {
                const nextVisible = visible[visibleIdx++];
                if (nextVisible) merged.push(nextVisible);
            } else if (id) {
                merged.push(id);
            }
        }
        while (visibleIdx < visible.length) {
            const nextVisible = visible[visibleIdx++];
            if (nextVisible) merged.push(nextVisible);
        }
        return merged;
    }

    async setSessionOrderFromVisible(visibleOrder: string[], options?: SessionPersistOption): Promise<boolean> {
        const prev = Array.isArray(this.data.sessionOrder) ? this.data.sessionOrder : [];
        const merged = this.mergeVisibleSessionOrder(visibleOrder);
        let changed = prev.length !== merged.length;
        if (!changed) {
            for (let i = 0; i < prev.length; i++) {
                if (prev[i] !== merged[i]) {
                    changed = true;
                    break;
                }
            }
        }

        this.data.sessionOrder = merged;
        if (options?.syncCommands !== false) {
            this.host.syncSessionCommands?.();
        }
        if (options?.persist === false) return changed;
        if (!changed) return false;
        await this.persistIfNeeded();
        return true;
    }

    // --- Validation ---

    isSessionNameTaken(name: string, excludeSessionId?: string): boolean {
        const sessions = this.sessions;
        const keys = Object.keys(sessions);
        for (let i = 0; i < keys.length; i++) {
            const id = keys[i];
            if (!id || (excludeSessionId && id === excludeSessionId)) continue;
            if (sessions[id]?.name === name) return true;
        }
        return false;
    }

    isGroupNameTaken(name: string, excludeGroupId?: string): boolean {
        const groups = this.data.groups || {};
        const keys = Object.keys(groups);
        for (let i = 0; i < keys.length; i++) {
            const id = keys[i];
            if (!id || (excludeGroupId && id === excludeGroupId)) continue;
            if (groups[id]?.name === name) return true;
        }
        return false;
    }

    getDefaultSessionName(): string {
        return typeof L.defaultSessionName === 'string' ? L.defaultSessionName : 'Default';
    }

    getAutoSessionName(n: number): string {
        return formatString(L.sessionAutoName, n);
    }

    getNextSessionName(): string {
        const sessions = this.sessions;
        const existing: Record<string, boolean> = {};
        const keys = Object.keys(sessions);
        for (let i = 0; i < keys.length; i++) {
            const id = keys[i];
            const session = id ? sessions[id] : undefined;
            if (session) {
                existing[session.name] = true;
            }
        }
        let n = 1;
        while (existing[this.getAutoSessionName(n)]) {
            n++;
        }
        return this.getAutoSessionName(n);
    }

    // --- CRUD ---

    createSessionRecord(id: string, name: string, layout: unknown, options?: CreateSessionRecordOptions): SessionItem {
        const record: SessionItem = {
            id,
            name,
            modified: typeof options?.modified === 'number' ? options.modified : Date.now(),
            layout,
        };
        if (options?.isDefault) {
            record.isDefault = true;
        }
        return record;
    }

    insertSessionAndActivate(session: SessionItem): void {
        this.sessions[session.id] = session;
        this.sessionOrder.push(session.id);
        this.data.activeSessionId = session.id;
        if (typeof this.host.attachSessionToActiveGroup === 'function') {
            this.host.attachSessionToActiveGroup(session.id);
        } else {
            this.host.groupManager?.attachSessionToActiveGroup(session.id);
        }
    }

    async createSession(name: string): Promise<boolean> {
        const id = generateId();
        const layout = this.getCurrentWorkspaceLayout();

        this.insertSessionAndActivate(this.createSessionRecord(id, name, layout));

        this.host.updateStatusBar?.();
        this.host.syncSessionCommands?.();
        await this.persistIfNeeded();
        return true;
    }

    async createSessionValidated(name: string, options?: SessionPersistOption): Promise<SessionValidationResult> {
        const rawName = typeof name === 'string' ? name : '';
        let finalName = rawName.trim();
        if (!finalName) {
            if (rawName.length > 0) {
                if (options?.notify !== false) {
                    new Notice(formatString(L.emptyName));
                }
                return {
                    created: false,
                    reason: 'empty',
                    name: '',
                    sessionId: null,
                };
            }
            finalName = this.getNextSessionName();
        }

        if (this.isSessionNameTaken(finalName)) {
            if (options?.notify !== false) {
                new Notice(formatString(L.duplicateName));
            }
            return {
                created: false,
                reason: 'duplicate',
                name: finalName,
                sessionId: null,
            };
        }

        await this.createSession(finalName);
        return {
            created: true,
            reason: '',
            name: finalName,
            sessionId: this.data.activeSessionId,
        };
    }

    async createSessionForViewedGroup(name: string, viewedGroupId: string | null, options?: SessionPersistOption): Promise<SessionValidationResult> {
        const groupsEnabled = this.host.groupManager
            ? this.host.groupManager.isGroupFeatureEnabled()
            : (this.data.groupFeatureEnabled !== false);
        const targetGroupId = groupsEnabled ? (viewedGroupId || null) : null;
        const beforeActiveGroupId = groupsEnabled ? (this.data.activeGroupId || null) : null;

        const createFn = (typeof this.host.createSessionValidated === 'function')
            ? this.host.createSessionValidated
            : (n: string, o?: SessionPersistOption) => this.createSessionValidated(n, o);

        const result = await createFn(name, options);
        if (!result || !result.created) return result;

        if (!groupsEnabled) {
            result.viewGroupId = null;
            return result;
        }

        const createdSessionId = result.sessionId;
        if (targetGroupId && targetGroupId !== beforeActiveGroupId && createdSessionId) {
            if (typeof this.host.moveSessionToGroupExclusive === 'function') {
                await this.host.moveSessionToGroupExclusive(createdSessionId, targetGroupId);
            } else if (this.host.groupManager) {
                await this.host.groupManager.moveSessionToGroupExclusive(createdSessionId, targetGroupId);
            }
            if (typeof this.host.resolveGroupSelection === 'function') {
                const selection = await this.host.resolveGroupSelection(targetGroupId);
                result.viewGroupId = selection.resolvedGroupId || null;
            } else if (this.host.groupManager) {
                const selection = await this.host.groupManager.resolveGroupSelection(targetGroupId);
                result.viewGroupId = selection.resolvedGroupId || null;
            }
            return result;
        }

        result.viewGroupId = this.data.activeGroupId || null;
        return result;
    }

    async renameSessionById(sessionId: string, newName: string, options?: SessionPersistOption): Promise<boolean> {
        const session = this.sessions[sessionId];
        if (!session) return false;

        const normalized = typeof newName === 'string' ? newName.trim() : '';
        if (!normalized) {
            if (options?.notify !== false) {
                new Notice(formatString(L.emptyName));
            }
            return false;
        }
        if (normalized === session.name) return false;

        if (this.isSessionNameTaken(normalized, sessionId)) {
            if (options?.notify !== false) {
                new Notice(formatString(L.duplicateName));
            }
            return false;
        }

        const oldName = session.name;
        session.name = normalized;
        session.modified = Date.now();
        this.host.updateStatusBar?.();
        this.host.syncSessionCommands?.();

        await this.persistIfNeeded();
        if (options?.notify !== false) {
            new Notice(formatString(L.renamed, oldName, normalized));
        }
        return true;
    }

    async deleteSession(sessionId: string): Promise<boolean> {
        const session = this.sessions[sessionId];
        if (!session || Object.keys(this.sessions).length <= 1) return false;

        const wasActive = this.data.activeSessionId === sessionId;
        let nextActiveId: string | null = null;

        delete this.sessions[sessionId];
        const orderIdx = this.sessionOrder.indexOf(sessionId);
        if (orderIdx !== -1) this.sessionOrder.splice(orderIdx, 1);

        if (this.data.sessionGroups && this.data.sessionGroups[sessionId]) {
            delete this.data.sessionGroups[sessionId];
        }

        if (wasActive) {
            const fallbackIdx = Math.min(orderIdx, this.sessionOrder.length - 1);
            const remaining = this.sessionOrder[fallbackIdx] || Object.keys(this.sessions)[0];
            nextActiveId = remaining || null;
            this.data.activeSessionId = nextActiveId;
        }

        if (wasActive && nextActiveId) {
            const nextSession = this.sessions[nextActiveId];
            if (nextSession && nextSession.layout && typeof this.host.applyWorkspaceLayout === 'function') {
                await this.host.applyWorkspaceLayout(nextSession.layout);
            }
        }

        this.host.updateStatusBar?.();
        this.host.syncSessionCommands?.();
        await this.persistIfNeeded();
        return true;
    }

    async deleteAllInactiveSessions(): Promise<number> {
        const activeId = this.data.activeSessionId;
        const ids = Object.keys(this.sessions).filter((id) => id !== activeId);

        let deletedCount = 0;
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            if (id && await this.deleteSession(id)) {
                deletedCount++;
            }
        }
        return deletedCount;
    }

    async resetSessionsToDefault(): Promise<boolean> {
        const id = generateId();
        this.host.hideSwitchOverlay?.();
        this.data.sessions = {};
        this.data.sessionOrder = [];
        this.data.activeSessionId = null;
        this.data.groups = {};
        this.data.groupOrder = [];
        this.data.sessionGroups = {};
        this.data.activeGroupId = null;

        this.sessions[id] = this.createSessionRecord(
            id,
            this.getDefaultSessionName(),
            this.getCurrentWorkspaceLayout(),
            { isDefault: true }
        );
        this.sessionOrder.push(id);
        this.data.activeSessionId = id;

        this.host.updateStatusBar?.();
        this.host.syncSessionCommands?.();
        await this.persistIfNeeded();
        return true;
    }

    async createEmptySession(): Promise<boolean> {
        const name = this.getNextSessionName();
        this.host.captureActiveSessionLayoutIfAutoSave?.();

        const id = generateId();
        const session = this.createSessionRecord(id, name, null);
        this.insertSessionAndActivate(session);

        if (this.host.app?.workspace) {
            const leaves: Array<{ detach: () => void }> = [];
            const ws = this.host.app.workspace as unknown as { iterateRootLeaves?: (cb: (leaf: { detach: () => void }) => void) => void };
            if (typeof ws.iterateRootLeaves === 'function') {
                ws.iterateRootLeaves((leaf: { detach: () => void }) => {
                    leaves.push(leaf);
                });
                for (let i = 0; i < leaves.length; i++) {
                    leaves[i]?.detach();
                }
            }
        }

        session.layout = this.getCurrentWorkspaceLayout();

        this.host.updateStatusBar?.();
        this.host.syncSessionCommands?.();
        new Notice(formatString(L.created, name));
        await this.persistIfNeeded();
        return true;
    }

    async duplicateCurrentSession(): Promise<boolean> {
        const name = this.getNextSessionName();
        this.host.captureActiveSessionLayoutIfAutoSave?.();

        const id = generateId();
        this.insertSessionAndActivate(this.createSessionRecord(id, name, this.getCurrentWorkspaceLayout()));

        this.host.updateStatusBar?.();
        this.host.syncSessionCommands?.();
        new Notice(formatString(L.duplicated, name));
        await this.persistIfNeeded();
        return true;
    }

    async duplicateSession(sessionId: string): Promise<boolean> {
        const source = this.sessions[sessionId];
        if (!source) return false;

        const name = this.getNextSessionName();
        const newId = generateId();
        this.sessions[newId] = this.createSessionRecord(
            newId,
            name,
            cloneLayout(source.layout)
        );
        this.sessionOrder.push(newId);

        const groups = this.data.sessionGroups?.[sessionId];
        if (groups && groups.length > 0) {
            if (!this.data.sessionGroups) this.data.sessionGroups = {};
            this.data.sessionGroups[newId] = groups.slice();
        }

        this.host.syncSessionCommands?.();
        new Notice(formatString(L.duplicated, name));
        await this.persistIfNeeded();
        return true;
    }

    ensureDefaultSession(): void {
        const hasDefault = Object.values(this.sessions).some((s) => s.isDefault);
        if (hasDefault) return;

        const id = generateId();
        this.sessions[id] = this.createSessionRecord(
            id,
            this.getDefaultSessionName(),
            this.getCurrentWorkspaceLayout(),
            { isDefault: true }
        );
        this.sessionOrder.unshift(id);
        this.data.activeSessionId = id;
        this.host.updateStatusBar?.();
        this.host.syncSessionCommands?.();
        void this.persistIfNeeded();
    }

    // --- Layout & Workspace helpers ---

    getCurrentWorkspaceLayout(): unknown {
        if (typeof this.host.getCurrentWorkspaceLayout === 'function') {
            return this.host.getCurrentWorkspaceLayout();
        }
        const ws = this.host.app?.workspace as unknown as { getLayout?: () => unknown } | undefined;
        if (ws && typeof ws.getLayout === 'function') {
            return ws.getLayout();
        }
        return {};
    }

    serializeLayout(layout: unknown): string {
        return serializeLayout(layout);
    }

    layoutsEqual(a: unknown, b: unknown): boolean {
        return layoutsEqual(a, b);
    }

    layoutsEqualStructural(a: unknown, b: unknown): boolean {
        const restoreScope = typeof this.host.getWorkspaceRestoreScope === 'function'
            ? this.host.getWorkspaceRestoreScope()
            : 'full';
        return layoutsEqualStructural(a, b, { restoreScope });
    }
}
