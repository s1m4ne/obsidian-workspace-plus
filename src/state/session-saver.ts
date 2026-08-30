import { Notice, type App } from 'obsidian';
import { L } from '../i18n.ts';
import { generateId } from '../utils.ts';
import type { PluginData, SessionItem } from '../storage/default-data.ts';
import type { SettingsState } from './settings-state.ts';
import type { SessionStore } from './session-store.ts';
import type { GroupManager } from './group-manager.ts';
import type { HistoryService } from './history-service.ts';

export interface SaveLayoutResult {
    saved: boolean;
    created: boolean;
    overwritten: boolean;
    changed?: boolean;
    sessionId: string | null;
    name: string;
}

export interface ConfirmOverwriteOptions {
    silent?: boolean;
    touchModified?: boolean;
    onSaved?: (session: SessionItem) => void;
}

export interface SessionSaverHost {
    data: PluginData;
    app?: App;
    settingsState?: SettingsState;
    sessionStore?: SessionStore;
    groupManager?: GroupManager;
    historyService?: HistoryService;
    getActiveSession: () => SessionItem | null;
    getCurrentWorkspaceLayout: () => unknown;
    layoutsEqualStructural: (a: unknown, b: unknown) => boolean;
    getDefaultSessionName: () => string;
    pushLayoutToHistory: (session: SessionItem) => void;
    persistData: () => Promise<boolean>;
    createSessionRecord: (id: string, name: string, layout: unknown, options?: { modified?: number }) => SessionItem;
    insertSessionAndActivate: (session: SessionItem) => void;
    getOrderedSessionsUnfiltered: () => SessionItem[];
    getOrderedGroupTabIds: () => string[];
    isGroupFeatureEnabled: () => boolean;
    applyWorkspaceLayout: (layout: unknown) => Promise<boolean>;
    saveActiveSession?: (options?: { silent?: boolean; touchModified?: boolean }) => Promise<boolean> | undefined;
    overwriteSessionWithCurrentLayout?: (sessionId: string, options?: { silent?: boolean; touchModified?: boolean }) => Promise<boolean> | undefined;
    updateStatusBar?: () => void;
    syncSessionCommands?: () => void;
    startHistorySnapshotTimer?: () => void;
    stopHistorySnapshotTimer?: () => void;
    openConfirmModal?: (
        message: string,
        onConfirm: () => void,
        options?: {
            confirmText?: string;
            confirmClass?: string;
        }
    ) => void;
    openRenameModal?: (
        placeholder: string,
        onRename: (newName: string) => void,
        options?: {
            title?: string;
            placeholder?: string;
            buttonText?: string;
            skipButtonText?: string;
            emptyNotice?: string;
            onSkip?: () => void;
        }
    ) => void;
}

export const SESSION_NAME_MAX_LENGTH = 100;

function formatString(fnOrStr: unknown, ...args: Array<string | number>): string {
    if (typeof fnOrStr === 'function') {
        const fn = fnOrStr as (...a: Array<string | number>) => string;
        return fn(...args);
    }
    return typeof fnOrStr === 'string' ? fnOrStr : '';
}

export function findSessionByName(data: PluginData | null | undefined, name: string): SessionItem | null {
    const sessions = (data && data.sessions) || {};
    const keys = Object.keys(sessions);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (key && sessions[key] && sessions[key].name === name) {
            return sessions[key];
        }
    }
    return null;
}

export function isGroupFeatureEnabled(host: SessionSaverHost): boolean {
    return host.isGroupFeatureEnabled();
}

export function chooseSessionGroupForView(host: SessionSaverHost, sessionId: string): string | null | undefined {
    if (!isGroupFeatureEnabled(host)) return undefined;

    const data = host.data || {};
    const groups = data.groups || {};
    const sessionGroups = data.sessionGroups || {};
    const groupIds = Array.isArray(sessionGroups[sessionId]) ? sessionGroups[sessionId] : [];
    const validGroupIds = groupIds.filter((groupId) => Boolean(groups[groupId]));

    if (validGroupIds.length === 0) return null;
    if (data.activeGroupId && validGroupIds.includes(data.activeGroupId)) return data.activeGroupId;

    const ordered = host.getOrderedGroupTabIds();

    for (let i = 0; i < ordered.length; i++) {
        const id = ordered[i];
        if (!id || id === '__all__') continue;
        if (validGroupIds.includes(id)) return id;
    }
    return validGroupIds[0];
}

export class SessionSaver {
    private readonly hostProvider: () => SessionSaverHost;

    constructor(hostOrProvider: SessionSaverHost | (() => SessionSaverHost)) {
        if (typeof hostOrProvider === 'function') {
            this.hostProvider = hostOrProvider;
        } else {
            this.hostProvider = () => hostOrProvider;
        }
    }

    private get host(): SessionSaverHost {
        return this.hostProvider();
    }

    private get data(): PluginData {
        return this.host.data;
    }

    private get sessions(): Record<string, SessionItem> {
        if (!this.data || !this.data.sessions) {
            if (this.data) this.data.sessions = {};
            return {};
        }
        return this.data.sessions;
    }

    isAutoSaveOnSwitchEnabled(): boolean {
        if (this.host.settingsState) {
            return Boolean(this.host.settingsState.autoSaveOnSwitch);
        }
        return this.data?.autoSaveOnSwitch !== false;
    }

    isWarnOnUnsavedSwitchEnabled(): boolean {
        if (this.host.settingsState) {
            return Boolean(this.host.settingsState.warnOnUnsavedSwitch);
        }
        return this.data?.warnOnUnsavedSwitch !== false;
    }

    isUnsavedStatusBarHighlightEnabled(): boolean {
        if (this.host.settingsState) {
            return Boolean(this.host.settingsState.highlightUnsavedSessionChanges);
        }
        return this.data?.highlightUnsavedSessionChanges !== false;
    }

    private checkLayoutsEqual(a: unknown, b: unknown): boolean {
        return this.host.layoutsEqualStructural(a, b);
    }

    private getActiveSession(): SessionItem | null {
        return this.host.getActiveSession();
    }

    private getCurrentWorkspaceLayout(): unknown {
        return this.host.getCurrentWorkspaceLayout();
    }

    private getDefaultSessionName(): string {
        return this.host.getDefaultSessionName();
    }

    private pushLayoutToHistory(session: SessionItem): void {
        this.host.pushLayoutToHistory(session);
    }

    private persistData(): Promise<boolean> {
        return this.host.persistData();
    }

    private createSessionRecord(id: string, name: string, layout: unknown, options?: { modified?: number }): SessionItem {
        return this.host.createSessionRecord(id, name, layout, options);
    }

    private insertSessionAndActivate(session: SessionItem): void {
        this.host.insertSessionAndActivate(session);
    }

    private getOrderedSessionsUnfiltered(): SessionItem[] {
        return this.host.getOrderedSessionsUnfiltered();
    }

    isActiveSessionDirty(): boolean {
        const session = this.getActiveSession();
        if (!session) return false;
        let currentLayout: unknown;
        try {
            currentLayout = this.getCurrentWorkspaceLayout();
        } catch {
            return false;
        }
        return !this.checkLayoutsEqual(session.layout, currentLayout);
    }

    shouldShowUnsavedStatusBarHighlight(): boolean {
        return this.isUnsavedStatusBarHighlightEnabled()
            && !this.isAutoSaveOnSwitchEnabled()
            && this.isActiveSessionDirty();
    }

    async setAutoSaveOnSwitch(enabled: boolean, options?: { notify?: boolean }): Promise<boolean> {
        const opts = options || {};
        if (this.data) {
            this.data.autoSaveOnSwitch = Boolean(enabled);
        }
        const isOn = this.isAutoSaveOnSwitchEnabled();

        // Sync snapshot timer - requires both version history and auto-save
        if (isOn) {
            this.host.startHistorySnapshotTimer?.();
        } else {
            this.host.stopHistorySnapshotTimer?.();
        }
        this.host.updateStatusBar?.();

        await this.persistData();
        if (opts.notify) {
            new Notice(isOn ? formatString(L.autoSaveEnabled) : formatString(L.autoSaveDisabled));
        }
        return isOn;
    }

    toggleAutoSaveOnSwitch(options?: { notify?: boolean }): Promise<boolean> {
        const next = !this.isAutoSaveOnSwitchEnabled();
        return this.setAutoSaveOnSwitch(next, options);
    }

    async saveActiveSession(options?: { silent?: boolean; touchModified?: boolean }): Promise<boolean> {
        const opts = options || {};
        if (typeof this.host.saveActiveSession === 'function') {
            const res = this.host.saveActiveSession(options);
            if (res !== undefined) return res;
        }

        const session = this.getActiveSession();
        if (!session) {
            if (!opts.silent) new Notice(formatString(L.noSession));
            return false;
        }

        // Prompt for a session name when saving an unnamed default session
        if (
            !opts.silent
            && session.isDefault
            && session.name === this.getDefaultSessionName()
        ) {
            const doSave = async (name: string): Promise<boolean> => {
                session.name = name;
                this.pushLayoutToHistory(session);
                session.layout = this.getCurrentWorkspaceLayout();
                session.modified = Date.now();
                this.host.updateStatusBar?.();
                this.host.syncSessionCommands?.();
                await this.persistData();
                new Notice(formatString(L.savedSession, name));
                return true;
            };

            return new Promise<boolean>((resolve) => {
                if (typeof this.host.openRenameModal === 'function') {
                    this.host.openRenameModal('', (newName) => {
                        void doSave(newName).then(resolve);
                    }, {
                        title: formatString(L.nameSessionTitle),
                        placeholder: formatString(L.nameSessionPlaceholder),
                        buttonText: formatString(L.saveInline),
                        skipButtonText: formatString(L.saveWithoutNaming),
                        onSkip: () => {
                            void doSave(session.name).then(resolve);
                        },
                    });
                } else {
                    void doSave(session.name).then(resolve);
                }
            });
        }

        const currentLayout = this.getCurrentWorkspaceLayout();
        const changed = !this.checkLayoutsEqual(session.layout, currentLayout);
        this.pushLayoutToHistory(session);
        session.layout = currentLayout;
        if (changed || opts.touchModified) {
            session.modified = Date.now();
        }
        this.host.updateStatusBar?.();

        const name = session.name;
        await this.persistData();
        if (!opts.silent) {
            if (changed) {
                new Notice(formatString(L.savedSession, name));
            } else {
                new Notice(formatString(L.noChanges));
            }
        }
        return changed;
    }

    async overwriteSessionWithCurrentLayout(sessionId: string, options?: { silent?: boolean; touchModified?: boolean }): Promise<boolean> {
        const opts = options || {};
        if (typeof this.host.overwriteSessionWithCurrentLayout === 'function') {
            const res = this.host.overwriteSessionWithCurrentLayout(sessionId, options);
            if (res !== undefined) return res;
        }

        const session = this.sessions[sessionId];
        if (!session) {
            if (!opts.silent) new Notice(formatString(L.noSession));
            return false;
        }

        const currentLayout = this.getCurrentWorkspaceLayout();
        const changed = !this.checkLayoutsEqual(session.layout, currentLayout);
        this.pushLayoutToHistory(session);
        session.layout = currentLayout;
        if (changed || opts.touchModified) {
            session.modified = Date.now();
        }
        this.host.updateStatusBar?.();

        await this.persistData();
        if (!opts.silent) {
            if (changed) {
                new Notice(formatString(L.savedCurrentLayoutToSession, session.name));
            } else {
                new Notice(formatString(L.noChanges));
            }
        }
        return changed;
    }

    async saveCurrentLayoutAsSessionName(name: string, options?: { silent?: boolean }): Promise<SaveLayoutResult> {
        const opts = options || {};
        const sessionName = typeof name === 'string' ? name.trim() : '';
        if (!sessionName) {
            if (!opts.silent) new Notice(formatString(L.emptyName));
            return {
                saved: false,
                created: false,
                overwritten: false,
                sessionId: null,
                name: sessionName,
            };
        }

        const previousActiveId = this.data?.activeSessionId || null;
        if (this.isAutoSaveOnSwitchEnabled()) {
            this.captureActiveSessionLayoutIfAutoSave();
        }

        const currentLayout = this.getCurrentWorkspaceLayout();
        const existing = findSessionByName(this.data, sessionName);
        let session: SessionItem;
        let created = false;
        let overwritten = false;
        let changed = true;

        if (existing) {
            session = existing;
            changed = !this.checkLayoutsEqual(session.layout, currentLayout);
            if (!(this.isAutoSaveOnSwitchEnabled() && session.id === previousActiveId)) {
                this.pushLayoutToHistory(session);
            }
            session.layout = currentLayout;
            session.modified = Date.now();
            if (this.data) {
                this.data.activeSessionId = session.id;
            }
            const preferredGroupId = chooseSessionGroupForView(this.host, session.id);
            if (typeof preferredGroupId !== 'undefined' && this.data) {
                this.data.activeGroupId = preferredGroupId;
            }
            overwritten = true;
        } else {
            const id = generateId();
            session = this.createSessionRecord(id, sessionName, currentLayout);
            this.insertSessionAndActivate(session);
            created = true;
        }

        this.host.updateStatusBar?.();
        this.host.syncSessionCommands?.();

        await this.persistData();
        if (!opts.silent) {
            new Notice(formatString(L.savedAs, sessionName));
        }
        return {
            saved: true,
            created,
            overwritten,
            changed,
            sessionId: session.id,
            name: sessionName,
        };
    }

    confirmOverwriteSessionWithCurrentLayout(sessionId: string, options?: ConfirmOverwriteOptions): boolean {
        const opts = options || {};
        const session = this.sessions[sessionId];
        if (!session) {
            if (!opts.silent) new Notice(formatString(L.noSession));
            return false;
        }

        if (typeof this.host.openConfirmModal === 'function') {
            this.host.openConfirmModal(
                formatString(L.confirmOverwriteSessionWithCurrentLayout, session.name),
                () => {
                    void this.overwriteSessionWithCurrentLayout(sessionId, opts).then((saved) => {
                        if (saved && typeof opts.onSaved === 'function') {
                            opts.onSaved(session);
                        }
                    });
                },
                {
                    confirmText: formatString(L.saveInline),
                    confirmClass: 'mod-cta',
                }
            );
        }
        return true;
    }

    async reloadCurrentSessionWithoutSaving(options?: { silent?: boolean }): Promise<boolean> {
        const opts = options || {};
        const session = this.getActiveSession();
        if (!session) {
            if (!opts.silent) new Notice(formatString(L.noSession));
            return false;
        }

        let applyLayout: Promise<unknown> = Promise.resolve(true);
        if (session.layout) {
            applyLayout = this.host.applyWorkspaceLayout(session.layout);
        }

        const name = session.name;
        try {
            await applyLayout;
            if (!opts.silent) {
                new Notice(formatString(L.reloadedSession, name));
            }
            return true;
        } catch {
            return false;
        }
    }

    captureActiveSessionLayoutIfAutoSave(): void {
        const current = this.getActiveSession();
        if (!current || !this.isAutoSaveOnSwitchEnabled()) return;
        this.pushLayoutToHistory(current);
        current.layout = this.getCurrentWorkspaceLayout();
        current.modified = Date.now();
    }

    saveAsSession(): Promise<boolean> {
        const session = this.getActiveSession();
        if (!session) {
            new Notice(formatString(L.noSession));
            return Promise.resolve(false);
        }

        return new Promise<boolean>((resolve) => {
            if (typeof this.host.openRenameModal === 'function') {
                this.host.openRenameModal('', (newName) => {
                    this.captureActiveSessionLayoutIfAutoSave();
                    const layout = this.getCurrentWorkspaceLayout();

                    // Check if session with same name already exists
                    let existing: SessionItem | null = null;
                    const allSessions = this.getOrderedSessionsUnfiltered();
                    for (let i = 0; i < allSessions.length; i++) {
                        const s = allSessions[i];
                        if (s && s.name === newName) {
                            existing = s;
                            break;
                        }
                    }

                    if (existing) {
                        existing.layout = layout;
                        existing.modified = Date.now();
                        if (this.data) {
                            this.data.activeSessionId = existing.id;
                        }
                    } else {
                        const id = generateId();
                        this.insertSessionAndActivate(
                            this.createSessionRecord(id, newName, layout)
                        );
                    }

                    this.host.updateStatusBar?.();
                    this.host.syncSessionCommands?.();
                    new Notice(formatString(L.savedAs, newName));
                    void this.persistData().then(() => {
                        resolve(true);
                    });
                }, {
                    title: formatString(L.nameSessionTitle),
                    placeholder: formatString(L.nameSessionPlaceholder),
                    buttonText: formatString(L.saveInline),
                    emptyNotice: formatString(L.emptyName),
                });
            } else {
                resolve(false);
            }
        });
    }
}
