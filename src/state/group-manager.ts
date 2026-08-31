import { Notice } from 'obsidian';
import { L } from '../i18n.ts';
import { generateId } from '../utils.ts';
import type { PluginData, SessionGroup, SessionItem } from '../storage/default-data.ts';
import type { SettingsState } from './settings-state.ts';

export interface GroupManagerHost {
    data: PluginData;
    settingsState?: SettingsState;
    persistData: () => Promise<boolean>;
    switchSession: (sessionId: string) => Promise<boolean>;
    getOrderedSessionsUnfiltered: () => SessionItem[];
    getOrderedSessionsForGroup: (groupId: string | null) => SessionItem[];
    updateStatusBar?: () => void;
    syncSessionCommands?: () => void;
    hideSwitchOverlay?: () => void;
    hideSearchOverlay?: () => void;
}

export interface GroupSelectionResult {
    switched: boolean;
    targetGroupId: string | null;
    resolvedGroupId: string | null;
    sessions: SessionItem[];
}

export interface GroupPersistOption {
    persist?: boolean;
}

function formatString(fnOrStr: unknown, ...args: Array<string | number>): string {
    if (typeof fnOrStr === 'function') {
        const fn = fnOrStr as (...a: Array<string | number>) => string;
        return fn(...args);
    }
    return typeof fnOrStr === 'string' ? fnOrStr : '';
}

export function normalizeGroupTabOrder(order: unknown, groups: Record<string, SessionGroup>): string[] {
    const input = Array.isArray(order) ? order : [];
    const seen: Record<string, boolean> = {};
    const out: string[] = [];

    for (let i = 0; i < input.length; i++) {
        const gid = String(input[i]);
        if (gid !== '__all__' && !groups[gid]) continue;
        if (seen[gid]) continue;
        seen[gid] = true;
        out.push(gid);
    }

    if (!seen.__all__) {
        out.unshift('__all__');
        seen.__all__ = true;
    }

    const existingIds = Object.keys(groups);
    for (let i = 0; i < existingIds.length; i++) {
        const id = existingIds[i];
        if (id && !seen[id]) {
            seen[id] = true;
            out.push(id);
        }
    }

    return out;
}

export class GroupManager {
    private readonly hostProvider: () => GroupManagerHost;

    constructor(hostOrProvider: GroupManagerHost | (() => GroupManagerHost)) {
        if (typeof hostOrProvider === 'function') {
            this.hostProvider = hostOrProvider;
        } else {
            this.hostProvider = () => hostOrProvider;
        }
    }

    private get host(): GroupManagerHost {
        return this.hostProvider();
    }

    private get data(): PluginData {
        return this.host.data;
    }

    private get groups(): Record<string, SessionGroup> {
        if (!this.data.groups) this.data.groups = {};
        return this.data.groups;
    }

    private get sessionGroups(): Record<string, string[]> {
        if (!this.data.sessionGroups) this.data.sessionGroups = {};
        return this.data.sessionGroups;
    }

    private persistIfNeeded(options?: GroupPersistOption): Promise<boolean> {
        if (options?.persist === false) return Promise.resolve(true);
        return this.host.persistData();
    }

    isGroupFeatureEnabled(): boolean {
        if (this.host.settingsState) {
            return this.host.settingsState.groupFeatureEnabled;
        }
        return this.data.groupFeatureEnabled !== false;
    }

    normalizeGroupFeatureState(): void {
        if (this.isGroupFeatureEnabled()) return;
        this.data.activeGroupId = null;
    }

    async setGroupFeatureEnabled(enabled: boolean): Promise<boolean> {
        const nextEnabled = enabled !== false;
        let changed = this.isGroupFeatureEnabled() !== nextEnabled;
        this.data.groupFeatureEnabled = nextEnabled;

        if (!nextEnabled && this.data.activeGroupId) {
            this.data.activeGroupId = null;
            changed = true;
        }

        if (!nextEnabled) {
            this.host.hideSwitchOverlay?.();
            this.host.hideSearchOverlay?.();
        }

        this.host.syncSessionCommands?.();
        this.host.updateStatusBar?.();

        if (!changed) return false;
        await this.persistIfNeeded();
        return true;
    }

    attachSessionToActiveGroup(sessionId: string): void {
        if (!this.isGroupFeatureEnabled()) return;
        const activeGroupId = this.data.activeGroupId;
        if (!activeGroupId) return;

        if (!Array.isArray(this.sessionGroups[sessionId])) {
            this.sessionGroups[sessionId] = [];
        }
        const currentGroup = this.sessionGroups[sessionId];
        if (currentGroup && !currentGroup.includes(activeGroupId)) {
            currentGroup.push(activeGroupId);
        }
    }

    getOrderedGroups(): SessionGroup[] {
        if (!this.isGroupFeatureEnabled()) return [];
        const groups = this.groups;
        return (this.data.groupOrder || [])
            .map((id) => groups[id])
            .filter((g): g is SessionGroup => !!g);
    }

    normalizeGroupTabOrder(order?: unknown): string[] {
        return normalizeGroupTabOrder(order ?? this.data.groupOrder, this.groups);
    }

    getOrderedGroupTabIds(): string[] {
        if (!this.isGroupFeatureEnabled()) return [];
        this.data.groupOrder = this.normalizeGroupTabOrder(this.data.groupOrder);
        return this.data.groupOrder.slice();
    }

    async setGroupTabOrder(order: string[], options?: GroupPersistOption): Promise<boolean> {
        if (!this.isGroupFeatureEnabled()) return false;
        const prev = Array.isArray(this.data.groupOrder) ? this.data.groupOrder : [];
        const normalized = this.normalizeGroupTabOrder(order);
        let changed = prev.length !== normalized.length;
        if (!changed) {
            for (let i = 0; i < prev.length; i++) {
                if (prev[i] !== normalized[i]) {
                    changed = true;
                    break;
                }
            }
        }
        this.data.groupOrder = normalized;

        if (options?.persist === false) return changed;
        if (!changed) return false;
        await this.persistIfNeeded();
        return true;
    }

    getActiveGroup(): SessionGroup | null {
        if (!this.isGroupFeatureEnabled()) return null;
        if (!this.data.activeGroupId) return null;
        return this.groups[this.data.activeGroupId] || null;
    }

    async createGroup(name: string): Promise<string> {
        const id = generateId();
        this.groups[id] = { id, name };
        const nextOrder = Array.isArray(this.data.groupOrder) ? this.data.groupOrder.slice() : [];
        nextOrder.push(id);
        this.data.groupOrder = this.normalizeGroupTabOrder(nextOrder);

        new Notice(formatString(L.groupCreated, name));
        await this.persistIfNeeded();
        return id;
    }

    async deleteGroup(groupId: string): Promise<boolean> {
        const group = this.groups[groupId];
        if (!group) return false;

        const name = group.name;
        delete this.groups[groupId];

        const nextOrder = (this.data.groupOrder || []).filter((gid) => gid !== groupId);
        this.data.groupOrder = this.normalizeGroupTabOrder(nextOrder);

        await this.removeGroupMembershipFromAllSessions(groupId, { persist: false });

        if (this.data.activeGroupId === groupId) {
            this.data.activeGroupId = null;
        }

        this.host.updateStatusBar?.();
        this.host.syncSessionCommands?.();
        new Notice(formatString(L.groupDeleted, name));
        await this.persistIfNeeded();
        return true;
    }

    async renameGroup(groupId: string, newName: string): Promise<boolean> {
        const group = this.groups[groupId];
        if (!group) return false;

        const oldName = group.name;
        group.name = newName;
        this.host.updateStatusBar?.();

        new Notice(formatString(L.groupRenamed, oldName, newName));
        await this.persistIfNeeded();
        return true;
    }

    async setActiveGroup(groupId: string | null): Promise<boolean> {
        if (!this.isGroupFeatureEnabled()) return false;
        const nextGroupId = groupId || null;
        if (nextGroupId && !this.groups[nextGroupId]) return false;

        const commitGroup = async (): Promise<boolean> => {
            this.data.activeGroupId = nextGroupId;
            this.host.syncSessionCommands?.();
            this.host.updateStatusBar?.();
            await this.persistIfNeeded();
            return true;
        };

        if (!nextGroupId) {
            return commitGroup();
        }

        const sessionGroups = this.sessionGroups;
        const allSessions = this.host.getOrderedSessionsUnfiltered();
        const targetSessions = allSessions.filter((s) => {
            const groups = sessionGroups[s.id];
            return groups && groups.includes(nextGroupId);
        });
        const firstInGroup = targetSessions[0];
        if (!firstInGroup) {
            return false;
        }

        const activeId = this.data.activeSessionId;
        const isInTarget = targetSessions.some((s) => s.id === activeId);
        if (isInTarget) {
            return commitGroup();
        }

        const switched = await this.host.switchSession(firstInGroup.id);
        if (!switched) return false;
        return commitGroup();
    }

    exitGroup(): Promise<boolean> {
        return this.setActiveGroup(null);
    }

    getRelativeGroupId(baseGroupId: string | null, offset: number): string | null | undefined {
        if (!this.isGroupFeatureEnabled()) return undefined;
        const ordered = this.getOrderedGroups();
        if (ordered.length === 0) return undefined;

        const currentId = baseGroupId || null;
        if (!currentId) {
            const edgeIdx = offset > 0 ? 0 : ordered.length - 1;
            return ordered[edgeIdx]?.id;
        }

        let currentIdx = -1;
        for (let i = 0; i < ordered.length; i++) {
            if (ordered[i]?.id === currentId) {
                currentIdx = i;
                break;
            }
        }
        if (currentIdx === -1) return ordered[0]?.id;

        const nextIdx = currentIdx + offset;
        if (nextIdx < 0 || nextIdx >= ordered.length) return null;
        return ordered[nextIdx]?.id;
    }

    async resolveGroupSelection(groupId: string | null): Promise<GroupSelectionResult> {
        if (!this.isGroupFeatureEnabled()) {
            return {
                switched: false,
                targetGroupId: null,
                resolvedGroupId: null,
                sessions: this.host.getOrderedSessionsUnfiltered(),
            };
        }

        const targetGroupId = groupId || null;
        const targetSessions = this.host.getOrderedSessionsForGroup(targetGroupId);

        const switched = await this.setActiveGroup(targetGroupId);
        let resolvedGroupId: string | null;
        if (switched) {
            resolvedGroupId = this.data.activeGroupId || null;
        } else if (targetSessions.length === 0) {
            resolvedGroupId = targetGroupId;
        } else {
            resolvedGroupId = this.data.activeGroupId || null;
        }

        return {
            switched,
            targetGroupId,
            resolvedGroupId,
            sessions: this.host.getOrderedSessionsForGroup(resolvedGroupId),
        };
    }

    switchGroupRelative(offset: number): Promise<boolean> {
        if (!this.isGroupFeatureEnabled()) return Promise.resolve(false);
        const targetGroupId = this.getRelativeGroupId(this.data.activeGroupId, offset);
        if (typeof targetGroupId === 'undefined') return Promise.resolve(false);
        return this.setActiveGroup(targetGroupId);
    }

    async removeGroupMembershipFromAllSessions(groupId: string, options?: GroupPersistOption): Promise<boolean> {
        if (!groupId) return false;

        const sg = this.sessionGroups;
        const keys = Object.keys(sg);
        let changed = false;
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (!key) continue;
            const arr = sg[key];
            if (!arr) continue;
            const idx = arr.indexOf(groupId);
            if (idx !== -1) {
                arr.splice(idx, 1);
                changed = true;
                if (arr.length === 0) delete sg[key];
            }
        }

        if (!changed) return false;
        this.host.syncSessionCommands?.();
        if (options?.persist === false) return true;
        await this.persistIfNeeded();
        return true;
    }

    removeAllSessionsFromGroup(groupId: string, options?: GroupPersistOption): Promise<boolean> {
        if (!groupId) return Promise.resolve(false);
        if (!this.groups[groupId]) return Promise.resolve(false);
        return this.removeGroupMembershipFromAllSessions(groupId, options);
    }

    async moveSessionToGroupExclusive(sessionId: string, groupId: string, options?: GroupPersistOption): Promise<boolean> {
        if (!this.data.sessions?.[sessionId]) return false;
        if (!this.groups[groupId]) return false;

        const prev = this.sessionGroups[sessionId] || [];
        const changed = prev.length !== 1 || prev[0] !== groupId;

        if (!changed) return false;
        this.sessionGroups[sessionId] = [groupId];
        this.host.syncSessionCommands?.();
        if (options?.persist === false) return true;
        await this.persistIfNeeded();
        return true;
    }

    async clearAllGroups(options?: GroupPersistOption): Promise<boolean> {
        const groupCount = Object.keys(this.data.groups || {}).length;
        const sessionGroupCount = Object.keys(this.data.sessionGroups || {}).length;
        const hasActiveGroup = !!this.data.activeGroupId;
        const hadCustomOrder = Array.isArray(this.data.groupOrder)
            ? this.data.groupOrder.some((id) => id !== '__all__')
            : false;
        const changed = groupCount > 0 || sessionGroupCount > 0 || hasActiveGroup || hadCustomOrder;

        this.data.sessionGroups = {};
        this.data.groups = {};
        this.data.groupOrder = normalizeGroupTabOrder([], {});
        this.data.activeGroupId = null;

        this.host.syncSessionCommands?.();
        this.host.updateStatusBar?.();

        if (!changed) return false;
        if (options?.persist === false) return true;
        await this.persistIfNeeded();
        return true;
    }

    async addSessionToGroup(sessionId: string, groupId: string): Promise<boolean> {
        if (!this.data.sessions?.[sessionId]) return false;
        if (!this.groups[groupId]) return false;

        if (!this.sessionGroups[sessionId]) this.sessionGroups[sessionId] = [];
        const groupList = this.sessionGroups[sessionId];
        if (groupList && groupList.includes(groupId)) return false;

        groupList?.push(groupId);
        this.host.syncSessionCommands?.();
        await this.persistIfNeeded();
        return true;
    }

    async removeSessionFromGroup(sessionId: string, groupId: string): Promise<boolean> {
        const arr = this.sessionGroups[sessionId];
        if (!arr) return false;

        const idx = arr.indexOf(groupId);
        if (idx === -1) return false;

        arr.splice(idx, 1);
        if (arr.length === 0) delete this.sessionGroups[sessionId];

        this.host.syncSessionCommands?.();
        await this.persistIfNeeded();
        return true;
    }

    getGroupSessionIds(groupId: string): string[] {
        const sg = this.sessionGroups;
        const result: string[] = [];
        const keys = Object.keys(sg);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (!key) continue;
            const arr = sg[key];
            if (arr && arr.includes(groupId)) {
                result.push(key);
            }
        }
        return result;
    }
}
