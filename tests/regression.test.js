'use strict';

require('./lock/harness/index.ts').installObsidianStub();

const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');

function loadPluginMethod(modulePath) {
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
        return require(modulePath);
    } finally {
        Module._load = originalLoad;
    }
}

const attachSessionMethods = loadPluginMethod('../src/plugin/methods/sessions');
const attachLayoutRestoreMethods = loadPluginMethod('../src/plugin/methods/layout-restore');
const attachSessionValidationMethods = loadPluginMethod('../src/plugin/methods/sessions-validation');
const attachGroupMethods = loadPluginMethod('../src/plugin/methods/groups');
const attachSessionCrudMethods = loadPluginMethod('../src/plugin/methods/session-crud');
const attachSessionSavingMethods = loadPluginMethod('../src/plugin/methods/session-saving');
const attachSessionStatusBarMethods = loadPluginMethod('../src/plugin/methods/session-statusbar');
const attachSessionStartupMethods = loadPluginMethod('../src/plugin/methods/session-startup');
const attachSessionSwitchingMethods = loadPluginMethod('../src/plugin/methods/session-switching');
const attachSessionCommandMethods = loadPluginMethod('../src/plugin/methods/session-commands');
const attachHistoryMethods = loadPluginMethod('../src/plugin/methods/history');

function createPlugin(initialData) {
    function PluginMock() {}
    attachSessionMethods(PluginMock);
    attachLayoutRestoreMethods(PluginMock);
    attachSessionValidationMethods(PluginMock);
    attachGroupMethods(PluginMock);
    attachSessionCrudMethods(PluginMock);
    attachSessionSavingMethods(PluginMock);
    attachHistoryMethods(PluginMock);
    attachSessionStatusBarMethods(PluginMock);
    attachSessionStartupMethods(PluginMock);
    attachSessionSwitchingMethods(PluginMock);
    attachSessionCommandMethods(PluginMock);
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
            getLayout: function () { return plugin.currentLayout(); },
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
    plugin.showSwitchPreviewOverlay = function () {};
    plugin.showSwitchFeedbackOverlay = function () {};
    plugin.currentLayout = function () { return {}; };
    plugin.getHistoryService().pushLayoutToHistory = function (session) {
        plugin._historyPushes += 1;
        plugin._historyPushTargets.push(session ? session.id : null);
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
    plugin.currentLayout = function () {
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

test('session switch can keep current sidebars while restoring target main area', async function () {
    const currentLayout = {
        main: { id: 'current-main', type: 'leaf', state: { type: 'markdown', state: { file: 'current.md' } } },
        left: { id: 'current-left', type: 'leaf', state: { type: 'file-explorer' } },
        right: { id: 'current-right', type: 'leaf', state: { type: 'outline' } },
        active: 'current-main',
    };
    const targetLayout = {
        main: { id: 'target-main', type: 'leaf', state: { type: 'markdown', state: { file: 'target.md' } } },
        left: { id: 'target-left', type: 'leaf', state: { type: 'search' } },
        right: { id: 'target-right', type: 'leaf', state: { type: 'backlink' } },
        active: 'target-main',
    };
    const plugin = createPlugin({
        activeSessionId: 'a',
        sessionOrder: ['a', 'b'],
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'old-a' }, modified: 1 },
            b: { id: 'b', name: 'B', layout: targetLayout, modified: 1 },
        },
        autoSaveOnSwitch: true,
        restoreSidebars: false,
    });
    plugin.currentLayout = function () {
        return currentLayout;
    };

    const switched = await plugin.performSessionSwitch('b', { silent: true });

    assert.equal(switched, true);
    assert.equal(plugin._changeLayoutCalls.length, 1);
    assert.deepEqual(plugin._changeLayoutCalls[0].main, targetLayout.main);
    assert.deepEqual(plugin._changeLayoutCalls[0].left, currentLayout.left);
    assert.deepEqual(plugin._changeLayoutCalls[0].right, currentLayout.right);
    assert.equal(plugin._changeLayoutCalls[0].active, 'target-main');
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
    plugin.currentLayout = function () {
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

test('unsaved status bar highlight is shown only in manual save mode with layout changes', function () {
    const plugin = createPlugin({
        activeSessionId: 'a',
        sessionOrder: ['a'],
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'saved' }, modified: 1 },
        },
        autoSaveOnSwitch: false,
    });

    plugin.currentLayout = function () {
        return { layout: 'changed' };
    };

    assert.equal(plugin.shouldShowUnsavedStatusBarHighlight(), true);

    plugin.data.highlightUnsavedSessionChanges = false;
    assert.equal(plugin.shouldShowUnsavedStatusBarHighlight(), false);

    plugin.data.highlightUnsavedSessionChanges = true;
    plugin.data.autoSaveOnSwitch = true;
    assert.equal(plugin.shouldShowUnsavedStatusBarHighlight(), false);

    plugin.data.autoSaveOnSwitch = false;
    plugin.currentLayout = function () {
        return { layout: 'saved' };
    };
    assert.equal(plugin.shouldShowUnsavedStatusBarHighlight(), false);

    plugin.currentLayout = function () {
        return { layout: 'saved', scroll: 25, left: 10, top: 20 };
    };
    assert.equal(plugin.shouldShowUnsavedStatusBarHighlight(), false);
});

test('structural layout comparison ignores Obsidian volatile workspace ids and focus state', function () {
    const savedLayout = {
        main: {
            id: 'saved-main',
            type: 'split',
            direction: 'vertical',
            children: [{
                id: 'saved-tabs',
                type: 'tabs',
                currentTab: 0,
                children: [
                    {
                        id: 'saved-leaf-a',
                        type: 'leaf',
                        state: {
                            type: 'markdown',
                            state: { file: 'a.md', mode: 'source', source: false },
                            eState: { cursor: { from: 3 }, scroll: 12 },
                        },
                    },
                    {
                        id: 'saved-leaf-b',
                        type: 'leaf',
                        state: {
                            type: 'markdown',
                            state: { file: 'b.md', mode: 'source', source: false },
                            eState: { cursor: { from: 8 }, scroll: 40 },
                        },
                    },
                ],
            }],
        },
        active: 'saved-leaf-a',
        lastOpenFiles: ['a.md', 'b.md'],
    };
    const currentLayout = {
        main: {
            id: 'current-main',
            type: 'split',
            direction: 'vertical',
            children: [{
                id: 'current-tabs',
                type: 'tabs',
                currentTab: 0,
                children: [
                    {
                        id: 'current-leaf-a',
                        type: 'leaf',
                        state: {
                            type: 'markdown',
                            state: { file: 'a.md', mode: 'source', source: false },
                            eState: { cursor: { from: 30 }, scroll: 120 },
                        },
                    },
                    {
                        id: 'current-leaf-b',
                        type: 'leaf',
                        state: {
                            type: 'markdown',
                            state: { file: 'b.md', mode: 'source', source: false },
                            eState: { cursor: { from: 80 }, scroll: 400 },
                        },
                    },
                ],
            }],
        },
        active: 'current-leaf-a',
        lastOpenFiles: ['b.md', 'a.md'],
    };
    const plugin = createPlugin({
        activeSessionId: 'a',
        sessionOrder: ['a'],
        sessions: {
            a: { id: 'a', name: 'A', layout: savedLayout, modified: 1 },
        },
        autoSaveOnSwitch: false,
    });

    plugin.currentLayout = function () {
        return currentLayout;
    };
    assert.equal(plugin.shouldShowUnsavedStatusBarHighlight(), false);

    currentLayout.main.children[0].currentTab = 1;
    assert.equal(plugin.shouldShowUnsavedStatusBarHighlight(), true);
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

    const result = await plugin.createSessionForViewedGroup('New', 'g2');

    assert.ok(result.sessionId);
    assert.deepEqual(plugin.data.sessionGroups[result.sessionId], ['g2']);
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

    plugin.getSessionSwitcher().performSessionSwitch = function () {
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
    plugin.getSessionSwitcher().flushOnStartup = function () {
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
    plugin.getSessionSwitcher().switchSession = function () {
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
    plugin.getSessionSwitcher().switchSession = function (sessionId, options) {
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
    plugin.getSessionSwitcher().switchSession = function (sessionId, options) {
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
    plugin.getSessionSwitcher().switchSession = function (sessionId, options) {
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
    plugin.getSessionSwitcher().switchSession = function (sessionId, options) {
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
    plugin.getSessionSwitcher().switchSession = function (sessionId, options) {
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
    plugin.getSessionSwitcher().showSessionSwitchNotice = function (sessionName, options) {
        noticeCalls.push([sessionName, options]);
    };
    plugin.currentLayout = function () {
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
