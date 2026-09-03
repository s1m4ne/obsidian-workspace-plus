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
