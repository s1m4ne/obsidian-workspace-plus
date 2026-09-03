import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';
import { DEFAULT_DATA, type PluginData, type SessionItem, type SessionHistoryEntry } from '../src/storage/default-data.ts';
import type { HistoryServiceHost } from '../src/state/history-service.ts';

const harness = setupHarness();
const { HistoryService } = await import('../src/state/history-service.ts');

function createMockHost(initialData?: Partial<PluginData>): {
    host: HistoryServiceHost;
    events: {
        persists: number;
        statusBarUpdates: number;
        appliedLayouts: unknown[];
    };
} {
    const events = {
        persists: 0,
        statusBarUpdates: 0,
        appliedLayouts: [] as unknown[],
    };

    const host: HistoryServiceHost = {
        // The active id is SessionStore's answer now; this reads the same data
        // object so flipping it in a test still reaches the service.
        getSessionStore: () => ({
            getActiveSessionId: () => (host.data as Record<string, unknown>)['activeSessionId'] ?? null,
        }) as never,
        // Reads the same data object the real SettingsState reads, so a test that
        // flips a setting sees the effect instead of a frozen answer.
        settingsState: {
            get groupFeatureEnabled(): boolean {
                return (host.data as Record<string, unknown>)['groupFeatureEnabled'] !== false;
            },
            get versionHistoryConfirmRestore(): boolean {
                return (host.data as Record<string, unknown>)['versionHistoryConfirmRestore'] !== false;
            },
        } as unknown as import('../src/state/settings-state.ts').SettingsState,
        data: Object.assign({}, DEFAULT_DATA, {
            versionHistoryEnabled: true,
            versionHistorySnapshotInterval: 5,
            versionHistoryConfirmRestore: true,
            autoSaveOnSwitch: true,
            activeSessionId: 's1',
            sessions: {
                s1: {
                    id: 's1',
                    name: 'Session 1',
                    layout: {
                        type: 'split',
                        children: [
                            { type: 'leaf', state: { state: { file: 'Doc.md' } } },
                        ],
                        main: { type: 'leaf' },
                    },
                    history: [],
                },
            },
        }, initialData || {}),
        getActiveSession: (): SessionItem | null => {
            const sessions = host.data.sessions as Record<string, SessionItem> | undefined;
            return sessions && host.data.activeSessionId ? sessions[host.data.activeSessionId] || null : null;
        },
        getCurrentWorkspaceLayout: () => ({ type: 'leaf', main: { type: 'leaf' } }),
        applyWorkspaceLayout: async (layout: unknown) => {
            events.appliedLayouts.push(layout);
            return true;
        },
        layoutsEqualStructural: (_a: unknown, _b: unknown) => false,
        commitLayoutToSession: (session, layout, options) => {
            const changed = JSON.stringify(session.layout) !== JSON.stringify(layout);
            session.layout = layout;
            if (changed || options?.touchModified) session.modified = Date.now();
            return changed;
        },
        updateStatusBar: () => {
            events.statusBarUpdates += 1;
        },
        persistData: async () => {
            events.persists += 1;
            return true;
        },
        isAutoSaveOnSwitchEnabled: () => true,
    };

    return { host, events };
}

test('HistoryService: container reference reactivity (P1)', () => {
    let currentData: PluginData = Object.assign({}, DEFAULT_DATA, {
        versionHistoryEnabled: true,
        versionHistorySnapshotInterval: 10,
    });

    const { host: template } = createMockHost();
    const service = new HistoryService(() => Object.assign({}, template, { data: currentData }));

    assert.equal(service.getVersionHistorySnapshotInterval(), 10);

    // Reassignment
    currentData = Object.assign({}, DEFAULT_DATA, {
        versionHistoryEnabled: false,
        versionHistorySnapshotInterval: 2,
    });

    assert.equal(service.isVersionHistoryEnabled(), false);
    assert.equal(service.getVersionHistorySnapshotInterval(), 2);
});

test('HistoryService: compaction', () => {
    const { host } = createMockHost();
    const service = new HistoryService(host);

    const now = Date.now();
    const entries: SessionHistoryEntry[] = [
        { layout: { id: 1 }, savedAt: now - 500 },
        { layout: { id: 2 }, savedAt: now - 3600000 * 2 },
    ];
    const compacted = service.compactHistory(entries);
    assert.equal(compacted.length, 2);
});

test('HistoryService: push, restore, quick restore, and clear', async () => {
    const { host, events } = createMockHost();
    const service = new HistoryService(host);
    const session = host.data.sessions.s1!;

    service.pushLayoutToHistory(session);
    assert.equal(session.history?.length, 1);

    const restored = await service.restoreFromHistoryEntry('s1', 0);
    assert.equal(restored, true);
    assert.equal(events.statusBarUpdates, 1);
    assert.equal(events.persists, 1);

    const quickRestored = await service.quickRestoreLatestHistory();
    assert.equal(quickRestored, true);

    const changed = service.clearVersionHistoryEntries();
    assert.equal(changed, true);
    assert.equal(session.history, undefined);
});

test('HistoryService: timer start and stop', () => {
    const { host } = createMockHost();
    const service = new HistoryService(host);

    service.startHistorySnapshotTimer();
    service.stopHistorySnapshotTimer();

    harness.restore();
});

// --- Compaction over time ------------------------------------------------
//
// Compaction runs on every push, so what it does to one list says almost
// nothing. What matters is the shape it converges on after thousands of
// passes, which is what these three measure.

const MINUTE = 60000;
const TEST_HOUR = 60 * MINUTE;
const TEST_DAY = 24 * TEST_HOUR;

/** Snapshot every `intervalMin` for `days`, compacting each time, as production does. */
function runHistory(intervalMin: number, days: number): {
    history: SessionHistoryEntry[];
    now: number;
} {
    const { host } = createMockHost();
    const service = new HistoryService(host);
    const realNow = Date.now;
    const start = 1_700_000_000_000;
    let history: SessionHistoryEntry[] = [];
    let at = start;

    try {
        const ticks = Math.floor((days * TEST_DAY) / (intervalMin * MINUTE));
        for (let i = 0; i <= ticks; i++) {
            at = start + i * intervalMin * MINUTE;
            Date.now = () => at;
            history.unshift({ layout: { i }, savedAt: at });
            history = service.compactHistory(history);
        }
    } finally {
        Date.now = realNow;
    }
    return { history, now: at };
}

interface AgeBands {
    recent: number;
    hourly: number;
    daily: number;
    weekly: number;
    stale: number;
}

function ageBands(history: readonly SessionHistoryEntry[], now: number): AgeBands {
    const bands = { recent: 0, hourly: 0, daily: 0, weekly: 0, stale: 0 };
    for (const entry of history) {
        const age = now - (entry.savedAt ?? 0);
        if (age <= TEST_HOUR) bands.recent += 1;
        else if (age <= TEST_DAY) bands.hourly += 1;
        else if (age <= 7 * TEST_DAY) bands.daily += 1;
        else if (age <= 30 * TEST_DAY) bands.weekly += 1;
        else bands.stale += 1;
    }
    return bands;
}

test('HistoryService: a day of snapshots leaves history older than an hour', () => {
    const { history, now } = runHistory(2, 1);
    const oldest = history[history.length - 1];
    assert.ok(oldest, 'the history is not empty');

    // The buckets were keyed on age, which is a window that slides: an entry
    // sat in `h1` for an hour while every newer entry crossed the same line
    // into `h1` and won, so nothing ever reached `h2`. This ran for
    // twenty-four hours and kept sixty-two minutes.
    const oldestAgeHours = (now - (oldest.savedAt ?? 0)) / TEST_HOUR;
    assert.ok(oldestAgeHours > 20, `oldest entry is only ${oldestAgeHours.toFixed(1)}h old`);
    assert.ok(ageBands(history, now).hourly >= 20, JSON.stringify(ageBands(history, now)));
});

test('HistoryService: a month of snapshots keeps a month, thinned by band', () => {
    for (const interval of [1, 5, 30]) {
        const { history, now } = runHistory(interval, 40);
        const bands = ageBands(history, now);
        const oldestEntry = history[history.length - 1];
        const oldestDays = (now - (oldestEntry?.savedAt ?? 0)) / TEST_DAY;

        // Not a fixed figure: the weekly bucket is `floor(savedAt / WEEK)`,
        // aligned to the epoch, so where the oldest surviving week falls
        // inside the 30-day window depends on the phase of the run.
        assert.ok(oldestDays > 24, `interval ${interval}: oldest is ${oldestDays.toFixed(1)} days`);
        assert.ok(bands.hourly >= 22, `interval ${interval}: ${bands.hourly} hourly`);
        assert.ok(bands.daily >= 6, `interval ${interval}: ${bands.daily} daily`);
        assert.ok(bands.weekly >= 3, `interval ${interval}: ${bands.weekly} weekly`);
        assert.equal(bands.stale, 0, `interval ${interval}: kept something over 30 days old`);

        // A one-minute interval produces sixty entries an hour. The surplus
        // has to fall through into its hour's bucket rather than be dropped,
        // or the tail stays empty for a second reason.
        assert.ok(history.length <= 60, `interval ${interval}: ${history.length} entries`);
    }
});

test('HistoryService: heavy editing in one hour does not evict the older bands', () => {
    const { history, now } = runHistory(1, 40);
    const bands = ageBands(history, now);
    // 15 fine-grained entries from the last hour, and the tail intact beside
    // them. Capping only the total let an hour of churn push every daily and
    // weekly entry out of a 45-entry list.
    assert.ok(bands.recent <= 20, `${bands.recent} entries inside the hour`);
    assert.ok(bands.daily + bands.weekly >= 9, JSON.stringify(bands));
});

test('HistoryService: one entry survives per clock hour, not per hour of age', () => {
    const { host } = createMockHost();
    const service = new HistoryService(host);
    const realNow = Date.now;
    // Two entries taken in the same clock hour, both older than an hour.
    const base = 1_700_000_000_000 - (1_700_000_000_000 % TEST_HOUR);
    try {
        Date.now = () => base + 3 * TEST_HOUR;
        const compacted = service.compactHistory([
            { layout: { keep: true }, savedAt: base + 50 * MINUTE },
            { layout: { drop: true }, savedAt: base + 10 * MINUTE },
            { layout: { otherHour: true }, savedAt: base - 30 * MINUTE },
        ]);
        assert.deepEqual(
            compacted.map((entry) => Object.keys(entry.layout as object)[0]),
            ['keep', 'otherHour'],
        );
    } finally {
        Date.now = realNow;
    }
});
