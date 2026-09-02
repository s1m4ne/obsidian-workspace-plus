import { Notice, type App } from 'obsidian';
import { L } from '../i18n.ts';
import { mergeMainLayoutIntoCurrent } from '../layout-utils.ts';
import type { RestoreScope } from '../layout-utils.ts';
import type { PluginData, SessionItem } from '../storage/default-data.ts';
import type { SettingsState } from './settings-state.ts';
import type { SessionStore } from './session-store.ts';
import type { HistoryService } from './history-service.ts';
import type { SessionSaver } from './session-saver.ts';
import type { SwitchOverlayOptions } from '../ui/overlays/switch-overlay.ts';

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
    overlayOptions?: SwitchOverlayOptions;
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
    getSwitchOverlay?: () => { overlayEl: HTMLElement | null };
    settingsState?: SettingsState;
    sessionStore?: SessionStore;
    historyService?: HistoryService;
    sessionSaver?: SessionSaver;
    getOrderedSessions: (viewGroupId?: string | null) => SessionItem[];
    findSessionIndex: (sessions: SessionItem[], sessionId: string | null | undefined) => number;
    getActiveSession: () => SessionItem | null;
    getCurrentWorkspaceLayout: () => unknown;
    applyWorkspaceLayout: (layout: unknown, options?: LayoutRestoreOptions) => Promise<boolean>;
    persistData: () => Promise<boolean>;
    commitWorkspaceToSession: (session: SessionItem, options?: { touchModified?: boolean }) => boolean;
    saveActiveSession: (options?: { silent?: boolean; touchModified?: boolean }) => Promise<boolean>;
    isActiveSessionDirty: () => boolean;
    isWarnOnUnsavedSwitchEnabled: () => boolean;
    isAutoSaveOnSwitchEnabled: () => boolean;
    updateStatusBar?: () => void;
    showSwitchPreviewOverlay?: (ordered: SessionItem[], index: number, viewGroupId?: string | null) => void;
    showSwitchFeedbackOverlay?: (ordered: SessionItem[], index: number, viewGroupId?: string | null, overlayOptions?: SwitchOverlayOptions) => void;
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

    get isSwitching(): boolean {
        return this.isSwitchingSession;
    }

    get lockAt(): number {
        return this.switchLockAt;
    }

    get pendingTargetId(): string | null {
        return this.pendingSwitchTargetId;
    }

    get pendingRequest(): SwitchRequest | null {
        return this.pendingSwitchRequest;
    }

    get switchNotice(): Notice | null {
        return this.sessionSwitchNotice;
    }

    get settleStartedAt(): number {
        return this.startupSettleStartedAt;
    }

    get settleUntil(): number {
        return this.startupSettleUntil;
    }

    get settleTimer(): ReturnType<typeof setTimeout> | null {
        return this.startupSettleTimer;
    }

    get flushTimer(): ReturnType<typeof setTimeout> | null {
        return this.startupFlushTimer;
    }

    cleanup(): void {
        const doClearTimeout = getClearTimeout();
        if (this.startupSettleTimer) {
            doClearTimeout(this.startupSettleTimer);
            this.startupSettleTimer = null;
        }
        if (this.startupFlushTimer) {
            doClearTimeout(this.startupFlushTimer);
            this.startupFlushTimer = null;
        }
        if (this.sessionSwitchNotice) {
            this.sessionSwitchNotice.hide();
            this.sessionSwitchNotice = null;
        }
        if (this.pendingSwitchRequest) {
            this.pendingSwitchRequest.resolve(false);
            this.pendingSwitchRequest = null;
        }
        this.pendingSwitchTargetId = null;
        this.isSwitchingSession = false;
        this.switchLockAt = 0;
        this.startupSettleStartedAt = 0;
        this.startupSettleUntil = 0;
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
            return 0;
        }

        this.startupSettleUntil = nextDeadline;
        this.startupSettleTimer = doSetTimeout(() => {
            this.startupSettleStartedAt = 0;
            this.startupSettleUntil = 0;
            this.startupSettleTimer = null;
        }, Math.max(0, nextDeadline - Date.now()));
        return this.startupSettleUntil;
    }

    startStartupSettleWindow(durationMs?: number): number {
        const duration = typeof durationMs === 'number' && durationMs > 0
            ? durationMs
            : STARTUP_SETTLE_MS;
        const startedAt = Date.now();
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

    isStartupSettleActive(): boolean {
        return this.getStartupSettleRemainingMs() > 0;
    }

    isStartupSettling(): boolean {
        return this.isStartupSettleActive();
    }

    noteStartupLayoutChange(): void {
        if (!this.isStartupSettleActive()) return;

        const startedAt = this.startupSettleStartedAt || Date.now();
        const maxDeadline = startedAt + STARTUP_SETTLE_MAX_MS;
        const nextDeadline = Math.min(Date.now() + STARTUP_LAYOUT_CHANGE_SETTLE_MS, maxDeadline);

        if (nextDeadline <= (this.startupSettleUntil || 0)) return;
        this.setStartupSettleDeadline(nextDeadline);
    }

    scheduleStartupFlush(): Promise<boolean> {
        if (typeof this.host.scheduleStartupFlush === 'function') {
            const res = this.host.scheduleStartupFlush();
            if (res !== undefined) return res;
        }

        const doClearTimeout = getClearTimeout();
        const doSetTimeout = getSetTimeout();

        if (this.startupFlushTimer) {
            doClearTimeout(this.startupFlushTimer);
            this.startupFlushTimer = null;
        }

        const remaining = this.getStartupSettleRemainingMs();
        if (remaining <= 0) {
            return this.flushOnStartup();
        }

        return new Promise<boolean>((resolve) => {
            this.startupFlushTimer = doSetTimeout(() => {
                this.startupFlushTimer = null;
                const hostFlush = typeof this.host.flushOnStartup === 'function'
                    ? this.host.flushOnStartup()
                    : undefined;
                const flushPromise = hostFlush !== undefined
                    ? hostFlush
                    : this.flushOnStartup();
                Promise.resolve(flushPromise).then(resolve).catch(() => resolve(false));
            }, remaining + 20);
        });
    }

    async flushOnStartup(): Promise<boolean> {
        if (typeof this.host.flushOnStartup === 'function') {
            const res = this.host.flushOnStartup();
            if (res !== undefined) return res;
        }

        const doClearTimeout = getClearTimeout();
        if (this.startupFlushTimer) {
            doClearTimeout(this.startupFlushTimer);
            this.startupFlushTimer = null;
        }
        if (this.startupSettleTimer) {
            doClearTimeout(this.startupSettleTimer);
            this.startupSettleTimer = null;
        }
        this.startupSettleStartedAt = 0;
        this.startupSettleUntil = 0;

        if (this.isAutoSaveOnSwitchEnabled()) {
            this.captureActiveSessionLayoutIfAutoSave();
        }

        this.host.updateStatusBar?.();
        await this.persistData();
        return true;
    }

    // --- Layout Restore ---

    /**
     * The one place the `restoreSidebars` setting turns into a scope.
     *
     * It used to be read three times in three shapes - `!== false` for
     * isSidebarRestoreEnabled, `=== false` for the scope, and `=== false`
     * again inline in buildLayoutForRestore - all of them against `this.data`
     * while SettingsState already owned the setting and its default.
     */
    getWorkspaceRestoreScope(): RestoreScope {
        const restoreSidebars = this.host.settingsState
            ? this.host.settingsState.restoreSidebars
            : this.data?.restoreSidebars !== false;
        return restoreSidebars ? 'full' : 'main-only';
    }

    /**
     * Sidebars off means keeping the ones on screen and swapping `main`
     * underneath them: `changeLayout` with sidebars included empties them on
     * Windows (#92), which is what the setting exists to avoid.
     */
    buildLayoutForRestore(layout: unknown): unknown {
        if (!layout || typeof layout !== 'object') return layout;
        if (this.getWorkspaceRestoreScope() === 'main-only') {
            return mergeMainLayoutIntoCurrent(layout, this.host.getCurrentWorkspaceLayout());
        }
        return layout;
    }

    async applyWorkspaceLayout(layout: unknown, options?: LayoutRestoreOptions): Promise<boolean> {
        const opts = options || {};
        if (!layout || typeof layout !== 'object') return false;

        const targetLayout = this.buildLayoutForRestore(layout);

        try {
            await this.host.applyWorkspaceLayout(targetLayout, opts);
            return true;
        } catch (e) {
            if (opts.catchErrors) return false;
            throw e;
        }
    }

    async applySessionLayout(session: SessionItem | null | undefined, options?: LayoutRestoreOptions): Promise<boolean> {
        if (!session || !session.layout) return false;
        return this.applyWorkspaceLayout(session.layout, options);
    }

    async applySessionDataFromStorage(incomingData: PluginData | null | undefined): Promise<boolean> {
        if (!incomingData || typeof incomingData !== 'object') return false;
        const activeId = incomingData.activeSessionId;
        const activeSession = activeId && incomingData.sessions ? incomingData.sessions[activeId] : null;
        if (activeSession && activeSession.layout) {
            return this.applyWorkspaceLayout(activeSession.layout, { catchErrors: true });
        }
        return false;
    }

    // --- Notices & Overlays ---

    clearSessionSwitchNotice(): void {
        if (!this.sessionSwitchNotice) return;
        this.sessionSwitchNotice.hide();
        this.sessionSwitchNotice = null;
    }

    showSessionSwitchNotice(sessionName: string, options?: { durationMs?: number }): Notice | null {
        if (typeof this.host.showSessionSwitchNotice === 'function') {
            const res = this.host.showSessionSwitchNotice(sessionName, options);
            if (res !== undefined) return res;
        }

        const mode = this.host.settingsState
            ? this.host.settingsState.sessionSwitchNoticeMode
            : (this.data?.sessionSwitchNoticeMode || 'always');

        if (mode === 'never') return null;

        const duration = options?.durationMs ?? SESSION_SWITCH_NOTICE_DURATION_MS;
        this.clearSessionSwitchNotice();

        const message = formatString(L.loaded, sessionName);
        const notice = new Notice(message, duration);
        this.sessionSwitchNotice = notice;

        const doSetTimeout = getSetTimeout();
        if (duration > 0) {
            doSetTimeout(() => {
                if (this.sessionSwitchNotice === notice) {
                    this.sessionSwitchNotice = null;
                }
            }, duration);
        }
        return notice;
    }

    hasBlockingSwitchUi(): boolean {
        const switchOverlayEl = this.host.getSwitchOverlay?.().overlayEl;
        const isSwitchOverlayVisible = Boolean(
            switchOverlayEl && switchOverlayEl.classList.contains('is-visible')
        );
        let hasModal = false;
        if (typeof document !== 'undefined') {
            hasModal = Boolean(document.querySelector('.modal-container'));
        }
        return isSwitchOverlayVisible || hasModal;
    }

    // --- Target Resolution & Switch Execution ---

    getEffectiveActiveSessionId(): string | null {
        return this.pendingSwitchTargetId || (this.data ? this.data.activeSessionId : null);
    }

    getRelativeSwitchBaseId(): string | null {
        return this.getEffectiveActiveSessionId();
    }

    private getOrderedSessions(viewGroupId?: string | null): SessionItem[] {
        return this.host.getOrderedSessions(viewGroupId);
    }

    private findSessionIndex(sessions: SessionItem[], sessionId: string | null | undefined): number {
        return this.host.findSessionIndex(sessions, sessionId);
    }

    private getActiveSession(): SessionItem | null {
        return this.host.getActiveSession();
    }

    private isAutoSaveOnSwitchEnabled(): boolean {
        return this.host.isAutoSaveOnSwitchEnabled();
    }

    private isWarnOnUnsavedSwitchEnabled(): boolean {
        return this.host.isWarnOnUnsavedSwitchEnabled();
    }

    private isActiveSessionDirty(): boolean {
        return this.host.isActiveSessionDirty();
    }

    private captureActiveSessionLayoutIfAutoSave(): void {
        const current = this.getActiveSession();
        if (!current || !this.isAutoSaveOnSwitchEnabled()) return;
        this.host.commitWorkspaceToSession(current, { touchModified: true });
    }

    private saveActiveSession(options?: { silent?: boolean; touchModified?: boolean }): Promise<boolean> {
        return this.host.saveActiveSession(options);
    }

    private persistData(): Promise<boolean> {
        return this.host.persistData();
    }

    getRelativeSwitchContext(offset: number, options?: SessionSwitchOptions): RelativeSwitchContext {
        const opts = options || {};
        const ordered = this.getOrderedSessions(opts.viewGroupId);
        if (ordered.length === 0) {
            return {
                ordered: [],
                currentIndex: -1,
                targetIndex: -1,
                isEmpty: true,
            };
        }

        const effectiveActiveId = this.getEffectiveActiveSessionId();
        const currentIndex = this.findSessionIndex(ordered, effectiveActiveId);
        const count = ordered.length;
        let targetIndex: number;

        if (currentIndex === -1) {
            targetIndex = offset > 0 ? 0 : count - 1;
        } else {
            const normalizedOffset = ((offset % count) + count) % count;
            targetIndex = (currentIndex + normalizedOffset) % count;
        }

        return {
            ordered,
            currentIndex,
            targetIndex,
            isEmpty: false,
        };
    }


    switchSessionAtOrderedIndex(sessions: SessionItem[], index: number, options?: SessionSwitchOptions): Promise<boolean> {
        const opts = options || {};

        if (index < 0 || index >= sessions.length) return Promise.resolve(false);
        const target = sessions[index];
        if (!target) return Promise.resolve(false);

        if (opts.overlayMode === 'preview') {
            this.host.showSwitchPreviewOverlay?.(sessions, index, opts.viewGroupId);
        } else if (opts.overlayMode === 'feedback') {
            this.host.showSwitchFeedbackOverlay?.(sessions, index, opts.viewGroupId, opts.overlayOptions);
        }

        if (typeof this.host.switchSession === 'function') {
            const res = this.host.switchSession(target.id, opts);
            if (res !== undefined) return res;
        }
        return this.switchSession(target.id, opts);
    }

    switchRelativeDirect(offset: number, options?: SessionSwitchOptions): Promise<boolean> {
        const opts = options || {};
        const context = this.getRelativeSwitchContext(offset, opts);
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

        const previewEnabled = offset > 0
            ? (this.host.settingsState ? this.host.settingsState.previewNext : (this.data && this.data.previewNext))
            : (this.host.settingsState ? this.host.settingsState.previewPrevious : (this.data && this.data.previewPrevious));
        const hasOverlay = Boolean(this.host.getSwitchOverlay?.().overlayEl);
        if (previewEnabled && !hasOverlay) {
            this.host.showSwitchPreviewOverlay?.(context.ordered, context.currentIndex);
            return Promise.resolve(false);
        }

        return this.switchSessionAtOrderedIndex(context.ordered, context.targetIndex, {
            overlayMode: 'preview',
            silent: true,
        });
    }

    /**
     * Both status-bar gestures - clicking a next/previous action and scrolling
     * over the bar - switch on the spot: no overlay, and a notice that replaces
     * the previous one rather than stacking. They were two methods with
     * identical bodies, which asserted a difference in policy that has never
     * existed.
     */
    switchRelativeFromStatusBar(offset: number): Promise<boolean> {
        return this.switchRelativeDirect(offset, {
            overlayMode: 'none',
            switchNoticeMode: 'replace',
            silent: true,
        });
    }







    switchSessionByIdFromCommand(sessionId: string, options?: SessionSwitchOptions): Promise<boolean> {
        const ordered = this.getOrderedSessions();
        const index = this.findSessionIndex(ordered, sessionId);
        return this.switchSessionAtOrderedIndex(ordered, index, options || {
            overlayMode: 'feedback',
            silent: true,
        });
    }

    switchToIndex(index: number, options?: SessionSwitchOptions): Promise<boolean> {
        const opts = options || {};
        const ordered = this.getOrderedSessions(opts.viewGroupId);
        if (index < 0 || index >= ordered.length) return Promise.resolve(false);
        const session = ordered[index];
        if (!session) return Promise.resolve(false);
        return this.switchSession(session.id, opts);
    }

    // --- Switch Session execution & queue ---

    private runSwitchRequest(request: SwitchRequest): void {
        this.isSwitchingSession = true;
        this.switchLockAt = Date.now();

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
                    return;
                }
                const next = this.pendingSwitchRequest;
                this.pendingSwitchRequest = null;
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
            }
        }

        if (!this.sessions[targetId]) return Promise.resolve(false);
        if (targetId === this.data?.activeSessionId && !this.isSwitchingSession) {
            return Promise.resolve(false);
        }

        this.pendingSwitchTargetId = targetId;

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

        const performSwitch = async (skipCurrentSave: boolean): Promise<boolean> => {
            if (current && !skipCurrentSave) {
                this.host.commitWorkspaceToSession(current, { touchModified: true });
            }

            // 2. Update active synchronously
            if (this.data) {
                this.data.activeSessionId = targetId;
            }

            // 3. Apply target layout
            const applyLayout = target.layout
                ? this.applyWorkspaceLayout(target.layout)
                : Promise.resolve(true);

            await applyLayout;
            this.host.updateStatusBar?.();
            await this.host.persistData();

            if (opts.switchNoticeMode === 'replace') {
                const noticeOpts = opts.switchNoticeDurationMs !== undefined
                    ? { durationMs: opts.switchNoticeDurationMs }
                    : undefined;
                this.showSessionSwitchNotice(target.name, noticeOpts);
            } else if (!opts.silent) {
                new Notice(formatString(L.loaded, target.name));
            }
            return true;
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
                            const savePromise = this.saveActiveSession({ silent: true, touchModified: true });
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
