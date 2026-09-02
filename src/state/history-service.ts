import { Notice } from 'obsidian';
import { L, formatString } from '../i18n.ts';
import { cloneLayout } from '../layout-utils.ts';
import type { PluginData, SessionItem, SessionHistoryEntry } from '../storage/default-data.ts';
import type { SettingsState } from './settings-state.ts';
import type { SessionStore } from './session-store.ts';

export interface HistoryServiceHost {
    data: PluginData;
    settingsState: SettingsState;

    /**
     * Was `sessionStore?: SessionStore` - declared, optional, and never read
     * once. It is required now and used: the active id is SessionStore's to
     * answer, and reading `data.activeSessionId` here was P1's contract stage.
     */
    getSessionStore(): SessionStore;
    getActiveSession: () => SessionItem | null;
    getCurrentWorkspaceLayout: () => unknown;
    applyWorkspaceLayout: (layout: unknown) => Promise<boolean>;
    layoutsEqualStructural: (a: unknown, b: unknown) => boolean;
    commitLayoutToSession: (session: SessionItem, layout: unknown, options?: { touchModified?: boolean }) => boolean;
    persistData: () => Promise<boolean>;
    isAutoSaveOnSwitchEnabled: () => boolean;
    updateStatusBar?: () => void;
}

export const HOUR = 3600000;
export const DAY = 86400000;
export const WEEK = 7 * DAY;
export const MAX_HISTORY = 45;

function getEntryTime(entry: SessionHistoryEntry): number {
    return entry.savedAt ?? entry.timestamp ?? 0;
}

export class HistoryService {
    private readonly hostProvider: () => HistoryServiceHost;
    private historySnapshotTimer: ReturnType<typeof setInterval> | null = null;

    constructor(hostOrProvider: HistoryServiceHost | (() => HistoryServiceHost)) {
        if (typeof hostOrProvider === 'function') {
            this.hostProvider = hostOrProvider;
        } else {
            this.hostProvider = () => hostOrProvider;
        }
    }

    private get host(): HistoryServiceHost {
        return this.hostProvider();
    }

    private get data(): PluginData {
        return this.host.data;
    }

    private get sessions(): Record<string, SessionItem> {
        if (!this.data.sessions) this.data.sessions = {};
        return this.data.sessions;
    }

    getSnapshotTimer(): ReturnType<typeof setInterval> | null {
        return this.historySnapshotTimer;
    }

    // --- Setting accessors ---

    /**
     * NOT routed through SettingsState, though the owner has a getter for it.
     * The two disagree when the key is absent: this returns false, and
     * `SettingsState.versionHistoryEnabled` falls back to
     * DEFAULT_DATA.versionHistoryEnabled, which is `true`. Switching would turn
     * version history on for anyone whose data.json predates the key. In
     * practice loadWithBackup merges DEFAULT_DATA so it is always present, but
     * that is not a reason to change what this answers when it is not.
     *
     * Same for the interval below: it clamps anything under 1 to 5, and the
     * owner's getter only fills in a missing value.
     *
     * Both are real duplication and both are a behaviour change to remove.
     * Recorded rather than made.
     */
    isVersionHistoryEnabled(): boolean {
        return Boolean(this.data.versionHistoryEnabled);
    }

    getVersionHistorySnapshotInterval(): number {
        const val = this.data.versionHistorySnapshotInterval;
        if (typeof val !== 'number' || val < 1) return 5;
        return val;
    }

    isVersionHistoryConfirmRestoreEnabled(): boolean {
        return this.host.settingsState.versionHistoryConfirmRestore;
    }

    // --- Compaction ---

    compactHistory(history: SessionHistoryEntry[]): SessionHistoryEntry[] {
        if (!history || history.length === 0) return [];
        const now = Date.now();

        // Sort newest first
        const sorted = history.slice().sort((a, b) => getEntryTime(b) - getEntryTime(a));

        const result: SessionHistoryEntry[] = [];
        const buckets: Record<string, boolean> = {};

        for (let i = 0; i < sorted.length; i++) {
            const entry = sorted[i];
            if (!entry) continue;
            const savedAt = getEntryTime(entry);
            const age = now - savedAt;
            let key: string | null = null;

            if (age <= HOUR) {
                // Last 1 hour: keep all
                result.push(entry);
            } else if (age <= DAY) {
                // 1-24 hours: 1 per hour (keep newest in each bucket)
                key = 'h' + Math.floor(age / HOUR);
                if (!buckets[key]) {
                    buckets[key] = true;
                    result.push(entry);
                }
            } else if (age <= WEEK) {
                // 1-7 days: 1 per day
                key = 'd' + Math.floor(age / DAY);
                if (!buckets[key]) {
                    buckets[key] = true;
                    result.push(entry);
                }
            } else if (age <= 30 * DAY) {
                // 7-30 days: 1 per week
                key = 'w' + Math.floor(age / WEEK);
                if (!buckets[key]) {
                    buckets[key] = true;
                    result.push(entry);
                }
            }
            // Older than 30 days: drop
        }

        if (result.length > MAX_HISTORY) {
            result.length = MAX_HISTORY;
        }
        return result;
    }

    // --- History operations ---

    private checkLayoutsEqualStructural(a: unknown, b: unknown): boolean {
        return this.host.layoutsEqualStructural(a, b);
    }

    pushLayoutToHistory(session: SessionItem): void {
        if (!this.isVersionHistoryEnabled()) return;
        if (!session || !session.layout) return;

        if (!session.history) session.history = [];

        // Skip if structurally identical to most recent entry
        const lastEntry = session.history.length > 0 ? session.history[0] : null;
        if (lastEntry && this.checkLayoutsEqualStructural(session.layout, lastEntry.layout)) {
            return;
        }

        session.history.unshift({
            layout: cloneLayout(session.layout),
            savedAt: Date.now(),
        });

        session.history = this.compactHistory(session.history);
    }

    async restoreFromHistoryEntry(sessionId: string, entryIndex: number): Promise<boolean> {
        const session = this.sessions[sessionId];
        const history = session?.history;
        if (!session || !history || !history[entryIndex]) {
            return false;
        }

        const entry = history[entryIndex];
        if (!entry) return false;

        // Push CURRENT layout to history first
        this.pushLayoutToHistory(session);

        // Apply historical layout
        session.layout = cloneLayout(entry.layout);
        session.modified = Date.now();

        const isActive = session.id === this.host.getSessionStore().getActiveSessionId();
        if (isActive && session.layout) {
            await this.host.applyWorkspaceLayout(session.layout);
        }

        this.host.updateStatusBar?.();
        await this.host.persistData();
        return true;
    }

    async quickRestoreLatestHistory(): Promise<boolean> {
        const session = this.host.getActiveSession();

        const history = session?.history;
        if (!session || !history || history.length === 0) {
            new Notice(formatString(L.historyNoEntries));
            return false;
        }

        const latest = history[0];
        if (!latest || !latest.layout) {
            new Notice(formatString(L.historyNoEntries));
            return false;
        }

        const confirmRestore = this.host.settingsState.versionHistoryConfirmRestore;

        if (confirmRestore) {
            const currentLayout = this.host.getCurrentWorkspaceLayout();
            const same = currentLayout && this.checkLayoutsEqualStructural(latest.layout, currentLayout);
            if (same) {
                new Notice(formatString(L.historyQuickRestored, session.name));
                return false;
            }
        }

        return this.restoreFromHistoryEntry(session.id, 0);
    }

    clearVersionHistoryEntries(): boolean {
        const sessions = this.sessions;
        const ids = Object.keys(sessions);
        let changed = false;

        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            const session = id ? sessions[id] : undefined;
            if (!session || !Object.prototype.hasOwnProperty.call(session, 'history')) continue;
            delete session.history;
            changed = true;
        }

        return changed;
    }

    // --- Timer ---

    startHistorySnapshotTimer(): void {
        this.stopHistorySnapshotTimer();
        if (!this.isVersionHistoryEnabled()) return;
        const autoSaveEnabled = this.host.isAutoSaveOnSwitchEnabled();
        if (!autoSaveEnabled) return;

        const intervalMs = this.getVersionHistorySnapshotInterval() * 60000;

        const setTimer = typeof window !== 'undefined' && typeof window.setInterval === 'function'
            ? window.setInterval.bind(window)
            : setInterval;

        this.historySnapshotTimer = setTimer(() => {
            const currentAutoSave = this.host.isAutoSaveOnSwitchEnabled();
            if (!this.isVersionHistoryEnabled() || !currentAutoSave) {
                this.stopHistorySnapshotTimer();
                return;
            }

            const session = this.host.getActiveSession();
            if (!session) return;

            // Whether an unchanged workspace is worth a snapshot is this
            // timer's own decision, and the answer is no - so the check stays
            // here and CAPTURE is only reached once it has passed.
            const currentLayout = this.host.getCurrentWorkspaceLayout();
            if (!currentLayout || this.checkLayoutsEqualStructural(session.layout, currentLayout)) return;

            this.host.commitLayoutToSession(session, currentLayout, { touchModified: true });
            void this.host.persistData();
        }, intervalMs);
    }

    stopHistorySnapshotTimer(): void {
        if (this.historySnapshotTimer) {
            const clearTimer = typeof window !== 'undefined' && typeof window.clearInterval === 'function'
                ? window.clearInterval.bind(window)
                : clearInterval;
            clearTimer(this.historySnapshotTimer);
            this.historySnapshotTimer = null;
        }
    }
}
