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
/**
 * How many snapshots of the last hour to keep.
 *
 * The thinned tail below is bounded by construction - one entry per hour for
 * 23 hours, per day for 6, per week for 4 - so roughly 33 entries. Capping the
 * total alone let an hour of heavy editing fill the list and push every daily
 * and weekly entry out, which is the opposite of what thinning is for. The
 * recent band is capped instead, and the tail is never spent on it.
 */
export const MAX_RECENT_HISTORY = 15;

/** The last line of defence, above the ~48 the bands can produce. */
export const MAX_HISTORY = 60;

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

    /**
     * Thin a session's history: everything from the last hour, then one entry
     * per hour for a day, per day for a week, per week for a month.
     *
     * **The buckets are keyed on when an entry was taken, not on how old it
     * is.** That is the whole of this function's history. Keyed on age, a
     * bucket is a window that slides: an entry landed in `h1` when it passed
     * sixty minutes and stayed there for an hour, and every newer entry that
     * crossed the same line landed in `h1` too and won, being newer. So
     * nothing ever graduated to `h2`, and nothing ever reached a day or a week.
     * Measured: two-minute snapshots for twenty-four hours left thirty-two
     * entries whose oldest was sixty-two minutes old. The feature offered a
     * month of history and held the last hour.
     *
     * An absolute key does not move. An entry is the representative of the
     * hour it was taken in, and when that hour drops out of the day it becomes
     * a candidate for its day, and then for its week. Iterating newest-first
     * keeps the newest of each bucket, which is stable because the bucket no
     * longer changes underneath it.
     */
    compactHistory(history: SessionHistoryEntry[]): SessionHistoryEntry[] {
        if (!history || history.length === 0) return [];
        const now = Date.now();

        // Sort newest first
        const sorted = history.slice().sort((a, b) => getEntryTime(b) - getEntryTime(a));

        const result: SessionHistoryEntry[] = [];
        const buckets = new Set<string>();
        let recent = 0;

        for (const entry of sorted) {
            const savedAt = getEntryTime(entry);
            const age = now - savedAt;

            // The newest few are kept exactly as they are, however close
            // together they were taken. Everything past the cap falls through
            // to the buckets rather than being dropped: at a one-minute
            // interval the surplus is sixty entries an hour, and discarding it
            // discarded the entry that would have become that hour's
            // representative - which left the tail empty again, for a second
            // reason, after the keys were fixed.
            if (recent < MAX_RECENT_HISTORY && age <= HOUR) {
                recent += 1;
                result.push(entry);
                continue;
            }

            let key: string;
            if (age <= DAY) key = `h${Math.floor(savedAt / HOUR)}`;
            else if (age <= WEEK) key = `d${Math.floor(savedAt / DAY)}`;
            else if (age <= 30 * DAY) key = `w${Math.floor(savedAt / WEEK)}`;
            // Older than 30 days: drop
            else continue;

            if (buckets.has(key)) continue;
            buckets.add(key);
            result.push(entry);
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
