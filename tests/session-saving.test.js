'use strict';

require('./lock/harness/index.ts').installObsidianStub();

const test = require('node:test');
const assert = require('node:assert/strict');
const { setupHarness } = require('./lock/harness/index.ts');

const harness = setupHarness();

const i18n = require('../src/i18n.ts');
i18n.resolveLocale('en');

const attachSessionSavingMethods = require('../src/plugin/methods/session-saving');
const attachLayoutRestoreMethods = require('../src/plugin/methods/layout-restore');

function createPlugin(initialData) {
    function PluginMock() {}
    attachLayoutRestoreMethods(PluginMock);
    attachSessionSavingMethods(PluginMock);
    const plugin = new PluginMock();
    plugin.data = Object.assign({
        activeSessionId: 'a',
        sessionOrder: ['a', 'b'],
        autoSaveOnSwitch: true,
        warnOnUnsavedSwitch: true,
        highlightUnsavedSessionChanges: true,
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'old' }, modified: 1 },
            b: { id: 'b', name: 'B', layout: { layout: 'target' }, modified: 1 },
        },
    }, initialData || {});
    plugin.persistCalls = 0;
    plugin.statusBarUpdates = 0;
    plugin.commandSyncs = 0;
    plugin.historyPushes = [];
    plugin.historyStarts = 0;
    plugin.historyStops = 0;
    plugin.changeLayoutCalls = [];
    plugin.getActiveSession = function () {
        return plugin.data.sessions[plugin.data.activeSessionId] || null;
    };
    plugin.getCurrentWorkspaceLayout = function () {
        return { layout: 'current' };
    };
    plugin.layoutsEqualStructural = function (a, b) {
        return JSON.stringify(a) === JSON.stringify(b);
    };
    plugin.getDefaultSessionName = function () {
        return 'Default';
    };
    plugin.pushLayoutToHistory = function (session) {
        plugin.historyPushes.push(session ? session.id : null);
    };
    plugin.updateStatusBar = function () {
        plugin.statusBarUpdates += 1;
    };
    plugin.syncSessionCommands = function () {
        plugin.commandSyncs += 1;
    };
    plugin.persistData = function () {
        plugin.persistCalls += 1;
        return Promise.resolve(true);
    };
    plugin.createSessionRecord = function (id, name, layout, options) {
        options = options || {};
        return {
            id,
            name,
            layout,
            modified: typeof options.modified === 'number' ? options.modified : Date.now(),
        };
    };
    plugin.insertSessionAndActivate = function (session) {
        plugin.data.sessions[session.id] = session;
        plugin.data.sessionOrder.push(session.id);
        plugin.data.activeSessionId = session.id;
    };
    plugin.startHistorySnapshotTimer = function () {
        plugin.historyStarts += 1;
    };
    plugin.stopHistorySnapshotTimer = function () {
        plugin.historyStops += 1;
    };
    plugin.app = {
        workspace: {
            changeLayout: function (layout) {
                plugin.changeLayoutCalls.push(layout);
                return Promise.resolve(true);
            },
        },
    };
    return plugin;
}

test('session saving toggles auto-save side effects together', async function () {
    const plugin = createPlugin();

    const off = await plugin.setAutoSaveOnSwitch(false);
    const on = await plugin.setAutoSaveOnSwitch(true);

    assert.equal(off, false);
    assert.equal(on, true);
    assert.equal(plugin.historyStops, 1);
    assert.equal(plugin.historyStarts, 1);
    assert.equal(plugin.statusBarUpdates, 2);
    assert.equal(plugin.persistCalls, 2);

    const toggledOff = await plugin.toggleAutoSaveOnSwitch();
    assert.equal(toggledOff, false);
    assert.equal(plugin.isAutoSaveOnSwitchEnabled(), false);
});

test('session saving captures active layout only when auto-save is enabled', function () {
    const plugin = createPlugin();

    plugin.captureActiveSessionLayoutIfAutoSave();
    plugin.data.autoSaveOnSwitch = false;
    plugin.captureActiveSessionLayoutIfAutoSave();

    assert.deepEqual(plugin.historyPushes, ['a']);
    assert.deepEqual(plugin.data.sessions.a.layout, { layout: 'current' });
    assert.notEqual(plugin.data.sessions.a.modified, 1);
});

test('session dirty check tolerates layout being unavailable during startup', function () {
    const plugin = createPlugin();
    plugin.getCurrentWorkspaceLayout = function () {
        throw new Error('layout not ready');
    };

    assert.equal(plugin.isActiveSessionDirty(), false);
    assert.equal(plugin.shouldShowUnsavedStatusBarHighlight(), false);
});

test('session saving saves active session and reports whether layout changed', async function () {
    const plugin = createPlugin();

    const changed = await plugin.saveActiveSession({ silent: true });
    const unchanged = await plugin.saveActiveSession({ silent: true });

    assert.equal(changed, true);
    assert.equal(unchanged, false);
    assert.deepEqual(plugin.historyPushes, ['a', 'a']);
    assert.equal(plugin.statusBarUpdates, 2);
    assert.equal(plugin.persistCalls, 2);

    // Save with no active session
    plugin.data.activeSessionId = 'nonexistent';
    const noSessionSaved = await plugin.saveActiveSession({ silent: true });
    assert.equal(noSessionSaved, false);
});

test('session saving overwrites a specified session with current layout', async function () {
    const plugin = createPlugin();

    const overwritten = await plugin.overwriteSessionWithCurrentLayout('b', { silent: true });
    assert.equal(overwritten, true);
    assert.deepEqual(plugin.data.sessions.b.layout, { layout: 'current' });

    const nonExistent = await plugin.overwriteSessionWithCurrentLayout('missing', { silent: true });
    assert.equal(nonExistent, false);
});

test('session saving saves current layout as a new named session', async function () {
    const plugin = createPlugin({
        activeSessionId: 'a',
        sessionOrder: ['a'],
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'old' }, modified: 1 },
        },
    });

    const result = await plugin.saveCurrentLayoutAsSessionName('Project Note', { silent: true });
    const created = plugin.data.sessions[result.sessionId];

    assert.equal(result.saved, true);
    assert.equal(result.created, true);
    assert.equal(result.overwritten, false);
    assert.equal(created.name, 'Project Note');
    assert.deepEqual(created.layout, { layout: 'current' });
    assert.equal(plugin.data.activeSessionId, result.sessionId);
    assert.equal(plugin.persistCalls, 1);

    const emptyResult = await plugin.saveCurrentLayoutAsSessionName('   ', { silent: true });
    assert.equal(emptyResult.saved, false);
});

test('session saving overwrites an existing named session from current layout', async function () {
    const plugin = createPlugin({
        activeSessionId: 'a',
        sessionOrder: ['a', 'b'],
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'old-a' }, modified: 1 },
            b: { id: 'b', name: 'Project Note', layout: { layout: 'old-b' }, modified: 1 },
        },
        autoSaveOnSwitch: true,
    });

    const result = await plugin.saveCurrentLayoutAsSessionName('Project Note', { silent: true });

    assert.equal(result.saved, true);
    assert.equal(result.created, false);
    assert.equal(result.overwritten, true);
    assert.equal(result.sessionId, 'b');
    assert.equal(plugin.data.activeSessionId, 'b');
    assert.deepEqual(plugin.data.sessions.a.layout, { layout: 'current' });
    assert.deepEqual(plugin.data.sessions.b.layout, { layout: 'current' });
    assert.deepEqual(plugin.historyPushes, ['a', 'b']);
    assert.equal(plugin.persistCalls, 1);
});

test('session saving preserves existing session group membership and switches view to that group', async function () {
    const plugin = createPlugin({
        activeSessionId: 'a',
        activeGroupId: 'g1',
        groupOrder: ['__all__', 'g1', 'g2'],
        groups: {
            g1: { id: 'g1', name: 'One' },
            g2: { id: 'g2', name: 'Two' },
        },
        sessionGroups: {
            b: ['g2'],
        },
        sessionOrder: ['a', 'b'],
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'old-a' }, modified: 1 },
            b: { id: 'b', name: 'Project Note', layout: { layout: 'old-b' }, modified: 1 },
        },
    });

    const result = await plugin.saveCurrentLayoutAsSessionName('Project Note', { silent: true });

    assert.equal(result.sessionId, 'b');
    assert.equal(plugin.data.activeGroupId, 'g2');
    assert.deepEqual(plugin.data.sessionGroups.b, ['g2']);
});

test('session saving switches to all sessions view when overwriting an ungrouped session', async function () {
    const plugin = createPlugin({
        activeSessionId: 'a',
        activeGroupId: 'g1',
        groupOrder: ['__all__', 'g1'],
        groups: {
            g1: { id: 'g1', name: 'One' },
        },
        sessionGroups: {
            a: ['g1'],
        },
        sessionOrder: ['a', 'b'],
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'old-a' }, modified: 1 },
            b: { id: 'b', name: 'Project Note', layout: { layout: 'old-b' }, modified: 1 },
        },
    });

    const result = await plugin.saveCurrentLayoutAsSessionName('Project Note', { silent: true });

    assert.equal(result.sessionId, 'b');
    assert.equal(plugin.data.activeGroupId, null);
    assert.equal(plugin.data.sessionGroups.b, undefined);
});

test('session saving reloads current session layout without persisting', async function () {
    const plugin = createPlugin({
        activeSessionId: 'b',
    });

    const reloaded = await plugin.reloadCurrentSessionWithoutSaving({ silent: true });

    assert.equal(reloaded, true);
    assert.deepEqual(plugin.changeLayoutCalls, [{ layout: 'target' }]);
    assert.equal(plugin.persistCalls, 0);

    plugin.data.activeSessionId = 'missing';
    const noSessionReload = await plugin.reloadCurrentSessionWithoutSaving({ silent: true });
    assert.equal(noSessionReload, false);
});

test('session saving confirms overwrite modal flow', function () {
    const plugin = createPlugin();

    const missing = plugin.confirmOverwriteSessionWithCurrentLayout('missing', { silent: true });
    assert.equal(missing, false);

    const opened = plugin.confirmOverwriteSessionWithCurrentLayout('b', { silent: true });
    assert.equal(opened, true);
});
