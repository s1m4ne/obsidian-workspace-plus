'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');

function loadSessionMethods() {
    const obsidianStub = {
        Modal: class {},
        Notice: class {
            constructor(_message) {}
        },
        Plugin: class {},
        PluginSettingTab: class {},
        Setting: class {},
        setIcon: function () {},
        setTooltip: function () {},
        Menu: class {
            addItem() { return this; }
            addSeparator() { return this; }
            showAtMouseEvent() {}
        },
    };

    const originalLoad = Module._load;
    Module._load = function (request, parent, isMain) {
        if (request === 'obsidian') return obsidianStub;
        return originalLoad(request, parent, isMain);
    };

    try {
        return require('../src/plugin/methods/sessions');
    } finally {
        Module._load = originalLoad;
    }
}

const attachSessionMethods = loadSessionMethods();

function createPlugin(initialData) {
    function PluginMock() {}
    attachSessionMethods(PluginMock);
    const plugin = new PluginMock();

    plugin.data = Object.assign({
        activeSessionId: null,
        sessions: {},
        sessionOrder: [],
        sessionGroups: {},
        groups: {},
        groupOrder: [],
        activeGroupId: null,
        autoSaveOnSwitch: true,
        warnOnUnsavedSwitch: true,
    }, initialData || {});

    plugin._persistCalls = 0;
    plugin._changeLayoutCalls = [];
    plugin._historyPushes = 0;

    plugin.app = {
        workspace: {
            changeLayout: function (layout) {
                plugin._changeLayoutCalls.push(layout);
                return Promise.resolve();
            },
        },
    };

    plugin.persistData = function () {
        plugin._persistCalls += 1;
        return Promise.resolve();
    };

    plugin.updateStatusBar = function () {};
    plugin.syncSessionCommands = function () {};
    plugin.pushLayoutToHistory = function () {
        plugin._historyPushes += 1;
    };

    return plugin;
}

test('session switch auto-saves current layout and applies target layout', async function () {
    const currentLayout = { layout: 'current' };
    const plugin = createPlugin({
        activeSessionId: 'a',
        sessionOrder: ['a', 'b'],
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'old-a' }, modified: 1 },
            b: { id: 'b', name: 'B', layout: { layout: 'target-b' }, modified: 1 },
        },
        autoSaveOnSwitch: true,
    });
    plugin.getCurrentWorkspaceLayout = function () {
        return currentLayout;
    };

    const switched = await plugin.performSessionSwitch('b', { silent: true });

    assert.equal(switched, true);
    assert.equal(plugin.data.activeSessionId, 'b');
    assert.deepEqual(plugin.data.sessions.a.layout, currentLayout);
    assert.equal(plugin._historyPushes, 1);
    assert.equal(plugin._persistCalls, 1);
    assert.equal(plugin._changeLayoutCalls.length, 1);
    assert.deepEqual(plugin._changeLayoutCalls[0], { layout: 'target-b' });
});

test('deleting active session applies fallback active layout', async function () {
    const plugin = createPlugin({
        activeSessionId: 'a',
        sessionOrder: ['a', 'b'],
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'a' }, modified: 1 },
            b: { id: 'b', name: 'B', layout: { layout: 'b' }, modified: 1 },
        },
        sessionGroups: {},
    });

    const deleted = await plugin.deleteSession('a');

    assert.equal(deleted, true);
    assert.equal(plugin.data.activeSessionId, 'b');
    assert.equal(plugin.data.sessions.a, undefined);
    assert.equal(plugin._persistCalls, 1);
    assert.equal(plugin._changeLayoutCalls.length, 1);
    assert.deepEqual(plugin._changeLayoutCalls[0], { layout: 'b' });
});

test('deleting non-active session does not change current layout', async function () {
    const plugin = createPlugin({
        activeSessionId: 'a',
        sessionOrder: ['a', 'b'],
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'a' }, modified: 1 },
            b: { id: 'b', name: 'B', layout: { layout: 'b' }, modified: 1 },
        },
        sessionGroups: {},
    });

    const deleted = await plugin.deleteSession('b');

    assert.equal(deleted, true);
    assert.equal(plugin.data.activeSessionId, 'a');
    assert.equal(plugin.data.sessions.b, undefined);
    assert.equal(plugin._persistCalls, 1);
    assert.equal(plugin._changeLayoutCalls.length, 0);
});

test('viewed-group session creation uses exclusive group assignment', async function () {
    const plugin = createPlugin({
        activeGroupId: 'g1',
        groups: {
            g1: { id: 'g1', name: 'Group 1' },
            g2: { id: 'g2', name: 'Group 2' },
        },
    });

    let movedArgs = null;
    let addCalled = false;

    plugin.createSessionValidated = function () {
        return Promise.resolve({
            created: true,
            reason: '',
            name: 'New',
            sessionId: 'new-session',
        });
    };
    plugin.moveSessionToGroupExclusive = function (sessionId, groupId) {
        movedArgs = [sessionId, groupId];
        return Promise.resolve(true);
    };
    plugin.addSessionToGroup = function () {
        addCalled = true;
        return Promise.resolve(true);
    };
    plugin.resolveGroupSelection = function () {
        return Promise.resolve({ resolvedGroupId: 'g2' });
    };

    const result = await plugin.createSessionForViewedGroup('New', 'g2');

    assert.deepEqual(movedArgs, ['new-session', 'g2']);
    assert.equal(addCalled, false);
    assert.equal(result.viewGroupId, 'g2');
});

test('switchSession waits for startup settle window before switching', async function () {
    const plugin = createPlugin({
        activeSessionId: 'a',
        sessionOrder: ['a', 'b'],
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'a' }, modified: 1 },
            b: { id: 'b', name: 'B', layout: { layout: 'b' }, modified: 1 },
        },
    });

    let switchedAt = 0;
    const startedAt = Date.now();

    plugin.performSessionSwitch = function () {
        switchedAt = Date.now();
        return Promise.resolve(true);
    };

    plugin.startStartupSettleWindow(20);
    const switched = await plugin.switchSession('b', { silent: true });

    assert.equal(switched, true);
    assert.ok(switchedAt >= startedAt + 15);
});

test('scheduleStartupFlush waits until startup settle completes', async function () {
    const plugin = createPlugin({
        activeSessionId: 'a',
        sessionOrder: ['a'],
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'a' }, modified: 1 },
        },
        autoSaveOnSwitch: true,
    });

    const calls = [];
    plugin.flushOnStartup = function () {
        calls.push(Date.now());
        return Promise.resolve(true);
    };

    const startedAt = Date.now();
    plugin.startStartupSettleWindow(20);
    await plugin.scheduleStartupFlush();

    assert.equal(calls.length, 1);
    assert.ok(calls[0] >= startedAt + 15);
});
