'use strict';

require('./lock/harness/index.ts').installObsidianStub();

const test = require('node:test');
const assert = require('node:assert/strict');

const { HistoryService } = require('../src/state/history-service.ts');

function createService(initialData) {
    const data = Object.assign({
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
                    main: {
                        type: 'tabs',
                        currentTab: 0,
                        children: [
                            { type: 'leaf', state: { type: 'markdown', state: { file: 'Note 1.md' } } },
                            { type: 'leaf', state: { type: 'markdown', state: { file: 'Note 2.md' } } },
                        ],
                    },
                },
                history: [],
            },
        },
    }, initialData || {});
    const events = { persists: 0, statusBarUpdates: 0, timer: null };
    const getActiveSession = () => data.activeSessionId ? data.sessions[data.activeSessionId] : null;
    const service = new HistoryService({
        data,
        settingsState: {
            get versionHistoryEnabled() { return data.versionHistoryEnabled !== false; },
            get versionHistorySnapshotInterval() { return data.versionHistorySnapshotInterval || 5; },
            get versionHistoryConfirmRestore() { return data.versionHistoryConfirmRestore !== false; },
        },
        // getSessionStore(), not a `sessionStore` field: the host declared that
        // field, never read it once, and now names the store the way every
        // other host does.
        getSessionStore: () => ({
            getSession: (id) => data.sessions[id],
            getActiveSession,
            getActiveSessionId: () => data.activeSessionId ?? null,
        }),
        getActiveSession,
        getCurrentWorkspaceLayout: () => ({ type: 'leaf', main: { type: 'leaf' } }),
        applyWorkspaceLayout: () => Promise.resolve(true),
        layoutsEqualStructural: (left, right) => JSON.stringify(left) === JSON.stringify(right),
        isAutoSaveOnSwitchEnabled: () => data.autoSaveOnSwitch !== false,
        persistData: () => {
        events.persists += 1;
        return Promise.resolve(true);
        },
        updateStatusBar: () => { events.statusBarUpdates += 1; },
    });
    return { service, data, events };
}

test('history: settings accessors', function () {
    const { service } = createService();

    assert.equal(service.isVersionHistoryEnabled(), true);
    assert.equal(service.getVersionHistorySnapshotInterval(), 5);
    assert.equal(service.isVersionHistoryConfirmRestoreEnabled(), true);
});

test('history: compactHistory tiers and limits', function () {
    const { service } = createService();
    const now = Date.now();
    const HOUR = 3600000;
    const DAY = 86400000;

    const entries = [
        { layout: { id: 1 }, savedAt: now - 1000 },
        { layout: { id: 2 }, savedAt: now - 2000 },
        { layout: { id: 3 }, savedAt: now - (2 * HOUR) },
        { layout: { id: 4 }, savedAt: now - (2 * HOUR + 500) },
        { layout: { id: 5 }, savedAt: now - (2 * DAY) },
        { layout: { id: 6 }, savedAt: now - (2 * DAY + 500) },
        { layout: { id: 7 }, savedAt: now - (10 * DAY) },
        { layout: { id: 8 }, savedAt: now - (40 * DAY) }, // >30 days dropped
    ];

    const compacted = service.compactHistory(entries);
    assert.ok(compacted.length >= 4);
    assert.ok(!compacted.some(e => e.layout.id === 8));
});

test('history: pushLayoutToHistory and quickRestoreLatestHistory', async function () {
    const { service, data } = createService();
    const session = data.sessions.s1;

    service.pushLayoutToHistory(session);
    assert.equal(session.history.length, 1);

    // Duplicate structural push is skipped
    service.pushLayoutToHistory(session);
    assert.equal(session.history.length, 1);

    // Restore from history
    const restored = await service.restoreFromHistoryEntry('s1', 0);
    assert.equal(restored, true);

    // Quick restore
    const quickRestored = await service.quickRestoreLatestHistory();
    assert.equal(quickRestored, true);

    // Clear entries
    const changed = service.clearVersionHistoryEntries();
    assert.equal(changed, true);
    assert.equal(session.history, undefined);
});

test('history: timer start and stop', function () {
    const { service } = createService();

    service.startHistorySnapshotTimer();
    assert.ok(service.getSnapshotTimer());

    service.stopHistorySnapshotTimer();
    assert.equal(service.getSnapshotTimer(), null);
});
