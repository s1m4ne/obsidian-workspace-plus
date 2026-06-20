'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');

const i18n = require('../src/i18n');

i18n.resolveLocale('en');

function loadSessionSavingMethods() {
    const obsidianStub = {
        Modal: class {},
        Notice: class {
            constructor(_message) {}
        },
        setIcon: function () {},
        setTooltip: function () {},
    };
    const originalLoad = Module._load;
    Module._load = function (request, parent, isMain) {
        if (request === 'obsidian') return obsidianStub;
        return originalLoad(request, parent, isMain);
    };

    try {
        return require('../src/plugin/methods/session-saving');
    } finally {
        Module._load = originalLoad;
    }
}

const attachSessionSavingMethods = loadSessionSavingMethods();

function createPlugin(initialData) {
    function PluginMock() {}
    attachSessionSavingMethods(PluginMock);
    const plugin = new PluginMock();
    plugin.data = Object.assign({
        activeSessionId: 'a',
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
});

test('session saving reloads current session layout without persisting', async function () {
    const plugin = createPlugin({
        activeSessionId: 'b',
    });

    const reloaded = await plugin.reloadCurrentSessionWithoutSaving({ silent: true });

    assert.equal(reloaded, true);
    assert.deepEqual(plugin.changeLayoutCalls, [{ layout: 'target' }]);
    assert.equal(plugin.persistCalls, 0);
});
