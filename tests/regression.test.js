'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');

function loadSessionMethods() {
    const obsidianStub = {
        Modal: class {},
        Notice: class {
            constructor(_message) {}
            hide() {}
            setMessage() { return this; }
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
    plugin._historyPushTargets = [];

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
    plugin.pushLayoutToHistory = function (session) {
        plugin._historyPushes += 1;
        plugin._historyPushTargets.push(session ? session.id : null);
    };
    plugin.showSwitchPreviewOverlay = function () {};
    plugin.showSwitchFeedbackOverlay = function () {};

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

test('overwriteSessionWithCurrentLayout saves current layout to selected session without switching', async function () {
    const currentLayout = { layout: 'current' };
    const plugin = createPlugin({
        activeSessionId: 'a',
        sessionOrder: ['a', 'b'],
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'active-a' }, modified: 1 },
            b: { id: 'b', name: 'B', layout: { layout: 'old-b' }, modified: 1 },
        },
        autoSaveOnSwitch: false,
    });
    plugin.getCurrentWorkspaceLayout = function () {
        return currentLayout;
    };

    const saved = await plugin.overwriteSessionWithCurrentLayout('b', { silent: true });

    assert.equal(saved, true);
    assert.equal(plugin.data.activeSessionId, 'a');
    assert.deepEqual(plugin.data.sessions.a.layout, { layout: 'active-a' });
    assert.deepEqual(plugin.data.sessions.b.layout, currentLayout);
    assert.notEqual(plugin.data.sessions.b.modified, 1);
    assert.deepEqual(plugin._historyPushTargets, ['b']);
    assert.equal(plugin._persistCalls, 1);
    assert.equal(plugin._changeLayoutCalls.length, 0);
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

test('switchRelative shows preview overlay before switching when preview is enabled', function () {
    const plugin = createPlugin({
        activeSessionId: 'a',
        sessionOrder: ['a', 'b', 'c'],
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'a' }, modified: 1 },
            b: { id: 'b', name: 'B', layout: { layout: 'b' }, modified: 1 },
            c: { id: 'c', name: 'C', layout: { layout: 'c' }, modified: 1 },
        },
        previewNext: true,
        previewPrevious: true,
    });

    const previewCalls = [];
    let switchCalled = false;

    plugin.showSwitchPreviewOverlay = function (ordered, index) {
        previewCalls.push([ordered.map(function (s) { return s.id; }), index]);
    };
    plugin.switchSession = function () {
        switchCalled = true;
        return Promise.resolve(true);
    };

    plugin.switchRelative(1);

    assert.deepEqual(previewCalls, [[['a', 'b', 'c'], 0]]);
    assert.equal(switchCalled, false);
});

test('switchRelativeImmediate bypasses preview-only first step and uses feedback overlay', async function () {
    const plugin = createPlugin({
        activeSessionId: 'a',
        sessionOrder: ['a', 'b', 'c'],
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'a' }, modified: 1 },
            b: { id: 'b', name: 'B', layout: { layout: 'b' }, modified: 1 },
            c: { id: 'c', name: 'C', layout: { layout: 'c' }, modified: 1 },
        },
        previewNext: true,
        previewPrevious: true,
    });

    const overlayCalls = [];
    const switchCalls = [];

    plugin.showSwitchFeedbackOverlay = function (ordered, index) {
        overlayCalls.push([ordered.map(function (s) { return s.id; }), index]);
    };
    plugin.switchSession = function (sessionId, options) {
        switchCalls.push([sessionId, options]);
        return Promise.resolve(true);
    };

    const switched = await plugin.switchRelativeImmediate(1);

    assert.equal(switched, true);
    assert.deepEqual(overlayCalls, [[['a', 'b', 'c'], 1]]);
    assert.equal(switchCalls.length, 1);
    assert.equal(switchCalls[0][0], 'b');
    assert.equal(switchCalls[0][1].silent, true);
    assert.equal(switchCalls[0][1].switchNoticeMode, undefined);
});

test('switchRelativeImmediate can suppress feedback overlay', async function () {
    const plugin = createPlugin({
        activeSessionId: 'a',
        sessionOrder: ['a', 'b'],
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'a' }, modified: 1 },
            b: { id: 'b', name: 'B', layout: { layout: 'b' }, modified: 1 },
        },
        previewNext: true,
        previewPrevious: true,
    });

    let overlayCalled = false;
    const switchCalls = [];

    plugin.showSwitchFeedbackOverlay = function () {
        overlayCalled = true;
    };
    plugin.switchSession = function (sessionId, options) {
        switchCalls.push([sessionId, options]);
        return Promise.resolve(true);
    };

    const switched = await plugin.switchRelativeImmediate(1, { showOverlay: false });

    assert.equal(switched, true);
    assert.equal(overlayCalled, false);
    assert.equal(switchCalls.length, 1);
    assert.equal(switchCalls[0][0], 'b');
    assert.equal(switchCalls[0][1].silent, true);
    assert.equal(switchCalls[0][1].switchNoticeMode, undefined);
});

test('switchRelativeFromStatusBar bypasses preview-only first step and uses a replaceable notice', async function () {
    const plugin = createPlugin({
        activeSessionId: 'a',
        sessionOrder: ['a', 'b', 'c'],
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'a' }, modified: 1 },
            b: { id: 'b', name: 'B', layout: { layout: 'b' }, modified: 1 },
            c: { id: 'c', name: 'C', layout: { layout: 'c' }, modified: 1 },
        },
        previewNext: true,
        previewPrevious: true,
    });

    let previewCalled = false;
    let feedbackCalled = false;
    const switchCalls = [];

    plugin.showSwitchPreviewOverlay = function () {
        previewCalled = true;
    };
    plugin.showSwitchFeedbackOverlay = function () {
        feedbackCalled = true;
    };
    plugin.switchSession = function (sessionId, options) {
        switchCalls.push([sessionId, options]);
        return Promise.resolve(true);
    };

    const switched = await plugin.switchRelativeFromStatusBar(1);

    assert.equal(switched, true);
    assert.equal(previewCalled, false);
    assert.equal(feedbackCalled, false);
    assert.equal(switchCalls.length, 1);
    assert.equal(switchCalls[0][0], 'b');
    assert.equal(switchCalls[0][1].silent, true);
    assert.equal(switchCalls[0][1].switchNoticeMode, 'replace');
});

test('switchRelativeFromScroll switches without showing overlay', async function () {
    const plugin = createPlugin({
        activeSessionId: 'a',
        sessionOrder: ['a', 'b'],
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'a' }, modified: 1 },
            b: { id: 'b', name: 'B', layout: { layout: 'b' }, modified: 1 },
        },
        previewNext: true,
        previewPrevious: true,
    });

    let previewCalled = false;
    let feedbackCalled = false;
    const switchCalls = [];

    plugin.showSwitchPreviewOverlay = function () {
        previewCalled = true;
    };
    plugin.showSwitchFeedbackOverlay = function () {
        feedbackCalled = true;
    };
    plugin.switchSession = function (sessionId, options) {
        switchCalls.push([sessionId, options]);
        return Promise.resolve(true);
    };

    const switched = await plugin.switchRelativeFromScroll(1);

    assert.equal(switched, true);
    assert.equal(previewCalled, false);
    assert.equal(feedbackCalled, false);
    assert.equal(switchCalls.length, 1);
    assert.equal(switchCalls[0][0], 'b');
    assert.equal(switchCalls[0][1].silent, true);
    assert.equal(switchCalls[0][1].switchNoticeMode, 'replace');
});

test('switchSessionByIdFromCommand uses overlay feedback without switch notice', async function () {
    const plugin = createPlugin({
        activeSessionId: 'a',
        sessionOrder: ['a', 'b'],
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'a' }, modified: 1 },
            b: { id: 'b', name: 'B', layout: { layout: 'b' }, modified: 1 },
        },
    });

    const overlayCalls = [];
    const switchCalls = [];

    plugin.showSwitchFeedbackOverlay = function (ordered, index) {
        overlayCalls.push([ordered.map(function (s) { return s.id; }), index]);
    };
    plugin.switchSession = function (sessionId, options) {
        switchCalls.push([sessionId, options]);
        return Promise.resolve(true);
    };

    const switched = await plugin.switchSessionByIdFromCommand('b');

    assert.equal(switched, true);
    assert.deepEqual(overlayCalls, [[['a', 'b'], 1]]);
    assert.equal(switchCalls.length, 1);
    assert.equal(switchCalls[0][0], 'b');
    assert.equal(switchCalls[0][1].silent, true);
    assert.equal(switchCalls[0][1].switchNoticeMode, undefined);
});

test('performSessionSwitch can emit a replaceable session switch notice', async function () {
    const plugin = createPlugin({
        activeSessionId: 'a',
        sessionOrder: ['a', 'b'],
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'a' }, modified: 1 },
            b: { id: 'b', name: 'B', layout: { layout: 'b' }, modified: 1 },
        },
    });

    const noticeCalls = [];
    plugin.showSessionSwitchNotice = function (sessionName, options) {
        noticeCalls.push([sessionName, options]);
    };
    plugin.getCurrentWorkspaceLayout = function () {
        return { layout: 'current' };
    };

    const switched = await plugin.performSessionSwitch('b', {
        silent: true,
        switchNoticeMode: 'replace',
        switchNoticeDurationMs: 900,
    });

    assert.equal(switched, true);
    assert.deepEqual(noticeCalls, [['B', { durationMs: 900 }]]);
});
