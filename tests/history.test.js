'use strict';

require('./lock/harness/index.ts').installObsidianStub();

const test = require('node:test');
const assert = require('node:assert/strict');

const attachHistoryMethods = require('../src/plugin/methods/history');
const attachLayoutRestoreMethods = require('../src/plugin/methods/layout-restore');

function createPlugin(initialData) {
    function PluginMock() {}
    attachLayoutRestoreMethods(PluginMock);
    attachHistoryMethods(PluginMock);
    const plugin = new PluginMock();
    plugin.data = Object.assign({
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
                        { type: 'leaf', state: { state: { file: 'Note 1.md' } } },
                        { type: 'leaf', state: { state: { file: 'Note 2.md' } } },
                    ],
                    main: { type: 'leaf' },
                },
                history: [],
            },
        },
    }, initialData || {});
    plugin.persists = 0;
    plugin.statusBarUpdates = 0;
    plugin.persistData = function () {
        plugin.persists += 1;
        return Promise.resolve(true);
    };
    plugin.updateStatusBar = function () {
        plugin.statusBarUpdates += 1;
    };
    plugin.isAutoSaveOnSwitchEnabled = function () {
        return plugin.data.autoSaveOnSwitch !== false;
    };
    plugin.getActiveSession = function () {
        return plugin.data.sessions[plugin.data.activeSessionId] || null;
    };
    plugin.getCurrentWorkspaceLayout = function () {
        return { type: 'leaf', main: { type: 'leaf' } };
    };
    plugin.applyWorkspaceLayout = function (_layout) {
        return Promise.resolve(true);
    };
    return plugin;
}

test('history: settings accessors and layout parsing', function () {
    const plugin = createPlugin();

    assert.equal(plugin.isVersionHistoryEnabled(), true);
    assert.equal(plugin.getVersionHistorySnapshotInterval(), 5);
    assert.equal(plugin.isVersionHistoryConfirmRestoreEnabled(), true);

    const layout = plugin.data.sessions.s1.layout;
    const paths = plugin.extractFilePathsFromLayout(layout);
    assert.deepEqual(paths, ['Note 1.md', 'Note 2.md']);

    const panes = plugin.countPanesInLayout(layout);
    assert.equal(panes, 1);
});

test('history: compactHistory tiers and limits', function () {
    const plugin = createPlugin();
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

    const compacted = plugin.compactHistory(entries);
    assert.ok(compacted.length >= 4);
    assert.ok(!compacted.some(e => e.layout.id === 8));
});

test('history: pushLayoutToHistory and quickRestoreLatestHistory', async function () {
    const plugin = createPlugin();
    const session = plugin.data.sessions.s1;

    plugin.pushLayoutToHistory(session);
    assert.equal(session.history.length, 1);

    // Duplicate structural push is skipped
    plugin.pushLayoutToHistory(session);
    assert.equal(session.history.length, 1);

    // Restore from history
    const restored = await plugin.restoreFromHistoryEntry('s1', 0);
    assert.equal(restored, true);

    // Quick restore
    const quickRestored = await plugin.quickRestoreLatestHistory();
    assert.equal(quickRestored, true);

    // Clear entries
    const changed = plugin.clearVersionHistoryEntries();
    assert.equal(changed, true);
    assert.equal(session.history, undefined);
});

test('history: timer start and stop', function () {
    const plugin = createPlugin();

    plugin.startHistorySnapshotTimer();
    assert.ok(plugin._historySnapshotTimer);

    plugin.stopHistorySnapshotTimer();
    assert.equal(plugin._historySnapshotTimer, null);
});
