import { Notice, type App } from 'obsidian';
import { L } from '../i18n.ts';
import { cloneLayout, mergeMainLayoutIntoCurrent } from '../layout-utils.ts';
import type { PluginData, SessionItem } from '../storage/default-data.ts';
import type { SettingsState } from './settings-state.ts';
import type { SessionStore } from './session-store.ts';
import type { HistoryService } from './history-service.ts';

export interface RelativeSwitchContext {
    ordered: SessionItem[];
    currentIndex: number;
    targetIndex: number;
    isEmpty: boolean;
}

export interface SessionSwitchOptions {
    silent?: boolean;
    switchNoticeMode?: string;
    switchNoticeDurationMs?: number;
    skipUnsavedWarning?: boolean;
    overlayMode?: 'preview' | 'feedback' | 'none';
    viewGroupId?: string | null;
    overlayOptions?: unknown;
}

export interface LayoutRestoreOptions {
    catchErrors?: boolean;
}

export interface SwitchRequest {
    targetId: string;
    options?: SessionSwitchOptions;
    resolve: (value: boolean) => void;
}

export interface SessionSwitcherHost {
    data: PluginData;
    app?: App;
    switchOverlayEl?: unknown;
    settingsState?: SettingsState;
    sessionStore?: SessionStore;
    historyService?: HistoryService;
    getOrderedSessions?: () => SessionItem[];
    findSessionIndex?: (sessions: SessionItem[], sessionId: string | null | undefined) => number;
    getActiveSession?: () => SessionItem | null;
    getCurrentWorkspaceLayout?: () => unknown;
    applyWorkspaceLayout?: (layout: unknown, options?: LayoutRestoreOptions) => Promise<boolean>;
    persistData?: () => Promise<boolean>;
    updateStatusBar?: () => void;
    pushLayoutToHistory?: (session: SessionItem) => void;
    saveActiveSession?: (options?: { silent?: boolean; touchModified?: boolean }) => Promise<boolean>;
    isActiveSessionDirty?: () => boolean;
    isWarnOnUnsavedSwitchEnabled?: () => boolean;
    isAutoSaveOnSwitchEnabled?: () => boolean;
    showSwitchPreviewOverlay?: (ordered: SessionItem[], index: number, viewGroupId?: string | null) => void;
    showSwitchFeedbackOverlay?: (ordered: SessionItem[], index: number, viewGroupId?: string | null, overlayOptions?: unknown) => void;
    showSessionSwitchNotice?: (sessionName: string, options?: { durationMs?: number }) => Notice | undefined;
    openUnsavedSwitchModal?: (
        message: string,
        onSaveAndSwitch: () => void,
        onSwitchWithoutSaving: () => void,
        onCancel: () => void
    ) => void;
    switchSession?: (sessionId: string, options?: SessionSwitchOptions) => Promise<boolean> | undefined;
    performSessionSwitch?: (sessionId: string, options?: SessionSwitchOptions) => Promise<boolean> | undefined;
    scheduleStartupFlush?: () => Promise<boolean> | undefined;
    flushOnStartup?: () => Promise<boolean> | undefined;
    getStartupSettleRemainingMs?: () => number | undefined;
    syncLegacyProperties?: (props: Record<string, unknown>) => void;
}

export const STARTUP_SETTLE_MS = 1200;
export const STARTUP_LAYOUT_CHANGE_SETTLE_MS = 400;
export const STARTUP_SETTLE_MAX_MS = 5000;
export const SESSION_SWITCH_NOTICE_DURATION_MS = 1200;

function formatString(fnOrStr: unknown, ...args: Array<string | number>): string {
    if (typeof fnOrStr === 'function') {
        const fn = fnOrStr as (...a: Array<string | number>) => string;
        return fn(...args);
    }
    return typeof fnOrStr === 'string' ? fnOrStr : '';
}

function getSetTimeout(): (handler: () => void, timeout?: number) => ReturnType<typeof setTimeout> {
    if (typeof window !== 'undefined' && typeof window.setTimeout === 'function') {
        return window.setTimeout.bind(window);
    }
    return setTimeout;
}

function getClearTimeout(): (id: ReturnType<typeof setTimeout>) => void {
    if (typeof window !== 'undefined' && typeof window.clearTimeout === 'function') {
        return window.clearTimeout.bind(window);
    }
    return clearTimeout;
}

export class SessionSwitcher {
    private readonly hostProvider: () => SessionSwitcherHost;

    // --- P2: Mutable switch fields encapsulated ---
    private isSwitchingSession = false;
    private switchLockAt = 0;
    private pendingSwitchTargetId: string | null = null;
    private pendingSwitchRequest: SwitchRequest | null = null;
    private sessionSwitchNotice: Notice | null = null;

    private startupSettleStartedAt = 0;
    private startupSettleUntil = 0;
    private startupSettleTimer: ReturnType<typeof setTimeout> | null = null;
    private startupFlushTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(hostOrProvider: SessionSwitcherHost | (() => SessionSwitcherHost)) {
        if (typeof hostOrProvider === 'function') {
            this.hostProvider = hostOrProvider;
        } else {
            this.hostProvider = () => hostOrProvider;
        }
    }

    private get host(): SessionSwitcherHost {
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

    private syncLegacyProps(): void {
        if (typeof this.host.syncLegacyProperties === 'function') {
            this.host.syncLegacyProperties({
                isSwitchingSession: this.isSwitchingSession,
                switchLockAt: this.switchLockAt,
                pendingSwitchTargetId: this.pendingSwitchTargetId,
                pendingSwitchRequest: this.pendingSwitchRequest,
                startupSettleStartedAt: this.startupSettleStartedAt,
                startupSettleUntil: this.startupSettleUntil,
                startupSettleTimer: this.startupSettleTimer,
                startupFlushTimer: this.startupFlushTimer,
                sessionSwitchNotice: this.sessionSwitchNotice,
            });
        }
    }

    // --- Startup settle window ---

    setStartupSettleDeadline(deadlineMs?: number): number {
        const nextDeadline = typeof deadlineMs === 'number' ? deadlineMs : 0;
        const doClearTimeout = getClearTimeout();
        const doSetTimeout = getSetTimeout();

        if (this.startupSettleTimer) {
            doClearTimeout(this.startupSettleTimer);
            this.startupSettleTimer = null;
        }

        if (nextDeadline <= Date.now()) {
            this.startupSettleStartedAt = 0;
            this.startupSettleUntil = 0;
            this.syncLegacyProps();
            return 0;
        }

        this.startupSettleUntil = nextDeadline;
        this.startupSettleTimer = doSetTimeout(() => {
            this.startupSettleStartedAt = 0;
            this.startupSettleUntil = 0;
            this.startupSettleTimer = null;
            this.syncLegacyProps();
        }, nextDeadline - Date.now());
        this.syncLegacyProps();
        return this.startupSettleUntil;
    }

    startStartupSettleWindow(durationMs?: number): number {
        const startedAt = Date.now();
        const duration = typeof durationMs === 'number' && durationMs > 0
            ? durationMs
            : STARTUP_SETTLE_MS;

        this.startupSettleStartedAt = startedAt;
        return this.setStartupSettleDeadline(startedAt + duration);
    }

    getStartupSettleRemainingMs(): number {
        if (typeof this.host.getStartupSettleRemainingMs === 'function') {
            const res = this.host.getStartupSettleRemainingMs();
            if (res !== undefined) return res;
        }
        const remaining = (this.startupSettleUntil || 0) - Date.now();
        return remaining > 0 ? remaining : 0;
    }

    isStartupSettling(): boolean {
        return this.getStartupSettleRemainingMs() > 0;
    }

    noteStartupLayoutChange(): void {
        if (!this.isStartupSettling()) return;

        const startedAt = this.startupSettleStartedAt || Date.now();
        const maxDeadline = startedAt + STARTUP_SETTLE_MAX_MS;
        const nextDeadline = Math.min(maxDeadline, Date.now() + STARTUP_LAYOUT_CHANGE_SETTLE_MS);

        if (nextDeadline <= (this.startupSettleUntil || 0)) return;
        this.setStartupSettleDeadline(nextDeadline);
        const hostFlush = typeof this.host.scheduleStartupFlush === 'function'
            ? this.host.scheduleStartupFlush()
            : undefined;
        if (hostFlush === undefined) {
            void this.scheduleStartupFlush();
        }
    }

    scheduleStartupFlush(): Promise<boolean> {
        const doClearTimeout = getClearTimeout();
        const doSetTimeout = getSetTimeout();

        if (this.startupFlushTimer) {
            doClearTimeout(this.startupFlushTimer);
            this.startupFlushTimer = null;
        }

        if (!this.isAutoSaveOnSwitchEnabled()) return Promise.resolve(false);

        const delayMs = this.getStartupSettleRemainingMs();
        if (delayMs <= 0) {
            return this.flushOnStartup();
        }

        return new Promise<boolean>((resolve) => {
            this.startupFlushTimer = doSetTimeout(() => {
                this.startupFlushTimer = null;
                this.syncLegacyProps();
                resolve(this.flushOnStartup());
            }, delayMs);
            this.syncLegacyProps();
        });
    }

    flushOnStartup(): Promise<boolean> {
        if (!this.isAutoSaveOnSwitchEnabled()) return Promise.resolve(false);
        if (typeof this.host.flushOnStartup === 'function') {
            const res = this.host.flushOnStartup();
            if (res !== undefined) return Promise.resolve(res);
        }

        const session = this.getActiveSession();
        if (!session) return Promise.resolve(false);

        if (typeof this.host.pushLayoutToHistory === 'function') {
            this.host.pushLayoutToHistory(session);
        } else {
            this.host.historyService?.pushLayoutToHistory(session);
        }

        session.layout = this.getCurrentWorkspaceLayout();
        session.modified = Date.now();
        if (typeof this.host.persistData === 'function') {
            return this.host.persistData();
        }
        return Promise.resolve(true);
    }

    // --- Layout restore ---

    isSidebarRestoreEnabled(): boolean {
        if (this.host.settingsState) {
            return Boolean(this.host.settingsState.restoreSidebars);
        }
        return this.data?.restoreSidebars !== false;
    }

    getWorkspaceRestoreScope(): string {
        return this.isSidebarRestoreEnabled() ? 'full' : 'main-only';
    }

    buildLayoutForRestore(layout: unknown): unknown {
        if (!layout) return layout;
        if (this.isSidebarRestoreEnabled()) {
            return cloneLayout(layout);
        }

        let currentLayout: unknown = null;
        try {
            currentLayout = this.getCurrentWorkspaceLayout();
        } catch {
            currentLayout = null;
        }
        return mergeMainLayoutIntoCurrent(layout, currentLayout);
    }

    async applyWorkspaceLayout(layout: unknown, options?: LayoutRestoreOptions): Promise<boolean> {
        if (!layout) return false;
        const nextLayout = this.buildLayoutForRestore(layout);
        if (typeof this.host.applyWorkspaceLayout === 'function') {
            const res = this.host.applyWorkspaceLayout(nextLayout, options);
            if (res !== undefined) return res;
        }
        const ws = this.host.app?.workspace as unknown as { changeLayout?: (l: unknown) => Promise<boolean> } | undefined;
        if (ws && typeof ws.changeLayout === 'function') {
            try {
                return await ws.changeLayout(nextLayout);
            } catch (err) {
                if (options?.catchErrors === false) throw err;
                return false;
            }
        }
        return true;
    }

    // --- Notices & Switch UI ---

    clearSessionSwitchNotice(): void {
        if (!this.sessionSwitchNotice) return;
        this.sessionSwitchNotice.hide();
        this.sessionSwitchNotice = null;
        this.syncLegacyProps();
    }

    showSessionSwitchNotice(sessionName: string, options?: { durationMs?: number }): Notice | undefined {
        if (typeof this.host.showSessionSwitchNotice === 'function') {
            const res = this.host.showSessionSwitchNotice(sessionName, options);
            if (res !== undefined) return res;
        }
        const durationMs = typeof options?.durationMs === 'number'
            ? options.durationMs
            : SESSION_SWITCH_NOTICE_DURATION_MS;

        this.clearSessionSwitchNotice();
        const notice = new Notice(formatString(L.loaded, sessionName), durationMs);
        this.sessionSwitchNotice = notice;
        this.syncLegacyProps();

        if (durationMs > 0) {
            const doSetTimeout = getSetTimeout();
            doSetTimeout(() => {
                if (this.sessionSwitchNotice === notice) {
                    this.sessionSwitchNotice = null;
                    this.syncLegacyProps();
                }
            }, durationMs + 50);
        }

        return notice;
    }

    hasBlockingSwitchUi(): boolean {
        if (typeof document === 'undefined') return false;
        return !!document.querySelector('.wpp-confirm-buttons')
            || !!document.querySelector('.wpp-switch-overlay');
    }

    // --- Relative navigation ---

    getRelativeSwitchBaseId(): string | null {
        return this.pendingSwitchTargetId || (this.data ? this.data.activeSessionId : null);
    }

    private getOrderedSessions(): SessionItem[] {
        if (typeof this.host.getOrderedSessions === 'function') {
            return this.host.getOrderedSessions();
        }
        return this.host.sessionStore?.getOrderedSessions() || [];
    }

    private findSessionIndex(sessions: SessionItem[], sessionId: string | null | undefined): number {
        if (typeof this.host.findSessionIndex === 'function') {
            return this.host.findSessionIndex(sessions, sessionId);
        }
        if (this.host.sessionStore) {
            return this.host.sessionStore.findSessionIndex(sessions, sessionId);
        }
        if (!sessions || sessions.length === 0 || !sessionId) return -1;
        for (let i = 0; i < sessions.length; i++) {
            if (sessions[i]?.id === sessionId) return i;
        }
        return -1;
    }

    private getActiveSession(): SessionItem | null {
        if (typeof this.host.getActiveSession === 'function') {
            return this.host.getActiveSession();
        }
        if (this.host.sessionStore) {
            return this.host.sessionStore.getActiveSession();
        }
        const activeId = this.data?.activeSessionId;
        const sessions = this.sessions;
        return (activeId && sessions[activeId]) ? sessions[activeId] || null : null;
    }

    private getCurrentWorkspaceLayout(): unknown {
        if (typeof this.host.getCurrentWorkspaceLayout === 'function') {
            return this.host.getCurrentWorkspaceLayout();
        }
        if (this.host.sessionStore) {
            return this.host.sessionStore.getCurrentWorkspaceLayout();
        }
        return this.host.app?.workspace.getLayout() || {};
    }

    private isAutoSaveOnSwitchEnabled(): boolean {
        if (typeof this.host.isAutoSaveOnSwitchEnabled === 'function') {
            return this.host.isAutoSaveOnSwitchEnabled();
        }
        if (this.host.settingsState) {
            return Boolean(this.host.settingsState.autoSaveOnSwitch);
        }
        return this.data?.autoSaveOnSwitch !== false;
    }

    private isWarnOnUnsavedSwitchEnabled(): boolean {
        if (typeof this.host.isWarnOnUnsavedSwitchEnabled === 'function') {
            return this.host.isWarnOnUnsavedSwitchEnabled();
        }
        if (this.host.settingsState) {
            return Boolean(this.host.settingsState.warnOnUnsavedSwitch);
        }
        return this.data?.warnOnUnsavedSwitch !== false;
    }

    private isActiveSessionDirty(): boolean {
        if (typeof this.host.isActiveSessionDirty === 'function') {
            return this.host.isActiveSessionDirty();
        }
        return false;
    }

    getRelativeSwitchContext(offset: number): RelativeSwitchContext {
        const ordered = this.getOrderedSessions();
        if (ordered.length === 0) {
            return {
                ordered,
                currentIndex: -1,
                targetIndex: 0,
                isEmpty: true,
            };
        }

        const currentIndex = this.findSessionIndex(ordered, this.getRelativeSwitchBaseId());
        if (currentIndex === -1) {
            return {
                ordered,
                currentIndex: -1,
                targetIndex: offset > 0 ? 0 : ordered.length - 1,
                isEmpty: false,
            };
        }

        return {
            ordered,
            currentIndex,
            targetIndex: (currentIndex + offset + ordered.length) % ordered.length,
            isEmpty: false,
        };
    }

    switchSessionAtOrderedIndex(ordered: SessionItem[], index: number, options?: SessionSwitchOptions): Promise<boolean> {
        const opts = options || {};
        if (!ordered || index < 0 || index >= ordered.length) {
            return Promise.resolve(false);
        }

        if (opts.overlayMode === 'preview') {
            this.host.showSwitchPreviewOverlay?.(ordered, index, opts.viewGroupId);
        } else if (opts.overlayMode === 'feedback') {
            this.host.showSwitchFeedbackOverlay?.(ordered, index, opts.viewGroupId, opts.overlayOptions);
        }

        const target = ordered[index];
        if (!target) {
            return Promise.resolve(false);
        }

        if (target.id === this.getRelativeSwitchBaseId()) {
            if (opts.switchNoticeMode === 'replace') {
                const noticeOpts = opts.switchNoticeDurationMs !== undefined
                    ? { durationMs: opts.switchNoticeDurationMs }
                    : undefined;
                this.showSessionSwitchNotice(target.name, noticeOpts);
            }
            return Promise.resolve(false);
        }

        const switchOpts: SessionSwitchOptions = {
            silent: opts.silent !== false,
        };
        if (opts.switchNoticeMode !== undefined) {
            switchOpts.switchNoticeMode = opts.switchNoticeMode;
        }
        if (opts.switchNoticeDurationMs !== undefined) {
            switchOpts.switchNoticeDurationMs = opts.switchNoticeDurationMs;
        }

        if (typeof this.host.switchSession === 'function') {
            const res = this.host.switchSession(target.id, switchOpts);
            if (res !== undefined) return res;
        }

        return this.switchSession(target.id, switchOpts);
    }

    switchToIndex(index: number): Promise<boolean> {
        const ordered = this.getOrderedSessions();
        return this.switchSessionAtOrderedIndex(ordered, index, {
            overlayMode: 'feedback',
            silent: true,
        });
    }

    switchSessionByIdFromCommand(sessionId: string): Promise<boolean> {
        const ordered = this.getOrderedSessions();
        const index = this.findSessionIndex(ordered, sessionId);
        return this.switchSessionAtOrderedIndex(ordered, index, {
            overlayMode: 'feedback',
            silent: true,
        });
    }

    switchRelativeDirect(offset: number, options?: SessionSwitchOptions): Promise<boolean> {
        const opts = options || {};
        const context = this.getRelativeSwitchContext(offset);
        if (!context) return Promise.resolve(false);

        if (context.isEmpty) {
            if (opts.overlayMode === 'preview') {
                this.host.showSwitchPreviewOverlay?.(context.ordered, 0, opts.viewGroupId);
            } else if (opts.overlayMode === 'feedback') {
                this.host.showSwitchFeedbackOverlay?.(context.ordered, 0, opts.viewGroupId, opts.overlayOptions);
            }
            return Promise.resolve(false);
        }

        return this.switchSessionAtOrderedIndex(context.ordered, context.targetIndex, opts);
    }

    switchRelativeFromCommand(offset: number): Promise<boolean> {
        const context = this.getRelativeSwitchContext(offset);
        if (!context) return Promise.resolve(false);
        if (context.isEmpty) {
            this.host.showSwitchPreviewOverlay?.(context.ordered, 0);
            return Promise.resolve(false);
        }

        const previewEnabled = offset > 0 ? (this.data && this.data.previewNext) : (this.data && this.data.previewPrevious);
        const hasOverlay = Boolean(this.host.switchOverlayEl);
        if (previewEnabled && !hasOverlay) {
            this.host.showSwitchPreviewOverlay?.(context.ordered, context.currentIndex);
            return Promise.resolve(false);
        }

        return this.switchSessionAtOrderedIndex(context.ordered, context.targetIndex, {
            overlayMode: 'preview',
            silent: true,
        });
    }

    switchRelativeFromStatusBar(offset: number): Promise<boolean> {
        return this.switchRelativeDirect(offset, {
            overlayMode: 'none',
            switchNoticeMode: 'replace',
            silent: true,
        });
    }

    switchRelativeFromScroll(offset: number): Promise<boolean> {
        return this.switchRelativeDirect(offset, {
            overlayMode: 'none',
            switchNoticeMode: 'replace',
            silent: true,
        });
    }

    switchRelative(offset: number): Promise<boolean> {
        return this.switchRelativeFromCommand(offset);
    }

    switchRelativeImmediate(offset: number, options?: { showOverlay?: boolean; overlayOptions?: unknown }): Promise<boolean> {
        const opts: SessionSwitchOptions = {
            overlayMode: options?.showOverlay === false ? 'none' : 'feedback',
            silent: true,
        };
        if (options?.overlayOptions !== undefined) {
            opts.overlayOptions = options.overlayOptions;
        }
        return this.switchRelativeDirect(offset, opts);
    }

    // --- Switch Session execution & queue ---

    private runSwitchRequest(request: SwitchRequest): void {
        this.isSwitchingSession = true;
        this.switchLockAt = Date.now();
        this.syncLegacyProps();

        const hostRunner = typeof this.host.performSessionSwitch === 'function'
            ? this.host.performSessionSwitch(request.targetId, request.options || {})
            : undefined;

        const runner = hostRunner !== undefined
            ? hostRunner
            : this.performSessionSwitch(request.targetId, request.options || {});

        runner
            .then((ok) => {
                request.resolve(ok);
            })
            .catch(() => {
                request.resolve(false);
            })
            .finally(() => {
                this.isSwitchingSession = false;
                this.switchLockAt = 0;
                if (!this.pendingSwitchRequest) {
                    this.pendingSwitchTargetId = null;
                    this.syncLegacyProps();
                    return;
                }
                const next = this.pendingSwitchRequest;
                this.pendingSwitchRequest = null;
                this.syncLegacyProps();
                this.runSwitchRequest(next);
            });
    }

    switchSession(targetId: string, options?: SessionSwitchOptions): Promise<boolean> {
        const startupDelayMs = this.getStartupSettleRemainingMs();
        if (startupDelayMs > 0) {
            const doSetTimeout = getSetTimeout();
            return new Promise<boolean>((resolve) => {
                doSetTimeout(() => {
                    const hostSwitch = typeof this.host.switchSession === 'function'
                        ? this.host.switchSession(targetId, options)
                        : undefined;
                    const switchPromise = hostSwitch !== undefined
                        ? hostSwitch
                        : this.switchSession(targetId, options);
                    Promise.resolve(switchPromise).then(resolve).catch(() => resolve(false));
                }, startupDelayMs);
            });
        }

        // Recover from stale switching lock
        if (this.isSwitchingSession) {
            const lockAt = this.switchLockAt || 0;
            const elapsed = lockAt ? (Date.now() - lockAt) : Number.MAX_SAFE_INTEGER;
            const hasBlockingUi = this.hasBlockingSwitchUi();
            if (!hasBlockingUi && elapsed > 5000) {
                this.isSwitchingSession = false;
                this.switchLockAt = 0;
                this.pendingSwitchTargetId = null;
                if (this.pendingSwitchRequest) {
                    this.pendingSwitchRequest.resolve(false);
                    this.pendingSwitchRequest = null;
                }
                this.syncLegacyProps();
            }
        }

        if (!this.sessions[targetId]) return Promise.resolve(false);
        if (targetId === this.data?.activeSessionId && !this.isSwitchingSession) {
            return Promise.resolve(false);
        }

        this.pendingSwitchTargetId = targetId;
        this.syncLegacyProps();

        return new Promise<boolean>((resolve) => {
            const request: SwitchRequest = {
                targetId,
                resolve,
            };
            if (options !== undefined) {
                request.options = options;
            }

            if (this.isSwitchingSession) {
                if (this.pendingSwitchRequest) {
                    this.pendingSwitchRequest.resolve(false);
                }
                this.pendingSwitchRequest = request;
                this.syncLegacyProps();
                return;
            }

            this.runSwitchRequest(request);
        });
    }

    performSessionSwitch(targetId: string, options?: SessionSwitchOptions): Promise<boolean> {
        const opts = options || {};
        const target = this.sessions[targetId];
        if (!target) return Promise.resolve(false);
        if (target.id === this.data?.activeSessionId) return Promise.resolve(false);

        // 1. Save current session state
        const current = this.getActiveSession();
        const autoSaveOnSwitch = this.isAutoSaveOnSwitchEnabled();

        const performSwitch = (skipCurrentSave: boolean): Promise<boolean> => {
            if (current && !skipCurrentSave) {
                if (typeof this.host.pushLayoutToHistory === 'function') {
                    this.host.pushLayoutToHistory(current);
                } else {
                    this.host.historyService?.pushLayoutToHistory(current);
                }
                current.layout = this.getCurrentWorkspaceLayout();
                current.modified = Date.now();
            }

            // 2. Update active synchronously
            if (this.data) {
                this.data.activeSessionId = targetId;
            }

            // 3. Apply target layout
            const applyLayout = target.layout
                ? this.applyWorkspaceLayout(target.layout)
                : Promise.resolve(true);

            return applyLayout.then(async () => {
                this.host.updateStatusBar?.();
                if (typeof this.host.persistData === 'function') {
                    await this.host.persistData();
                }

                if (opts.switchNoticeMode === 'replace') {
                    const noticeOpts = opts.switchNoticeDurationMs !== undefined
                        ? { durationMs: opts.switchNoticeDurationMs }
                        : undefined;
                    this.showSessionSwitchNotice(target.name, noticeOpts);
                } else if (!opts.silent) {
                    new Notice(formatString(L.loaded, target.name));
                }
                return true;
            });
        };

        const shouldWarn = !autoSaveOnSwitch
            && !opts.skipUnsavedWarning
            && this.isWarnOnUnsavedSwitchEnabled()
            && this.isActiveSessionDirty();

        if (shouldWarn) {
            return new Promise<boolean>((resolve) => {
                if (typeof this.host.openUnsavedSwitchModal === 'function') {
                    this.host.openUnsavedSwitchModal(
                        formatString(L.confirmUnsavedSwitch, target.name),
                        () => {
                            const savePromise = typeof this.host.saveActiveSession === 'function'
                                ? this.host.saveActiveSession({ silent: true, touchModified: true })
                                : Promise.resolve(true);
                            savePromise
                                .then(() => performSwitch(true))
                                .then((ok) => resolve(ok))
                                .catch(() => resolve(false));
                        },
                        () => {
                            performSwitch(true)
                                .then((ok) => resolve(ok))
                                .catch(() => resolve(false));
                        },
                        () => {
                            resolve(false);
                        }
                    );
                } else {
                    resolve(false);
                }
            });
        }

        return performSwitch(!autoSaveOnSwitch);
    }
}
