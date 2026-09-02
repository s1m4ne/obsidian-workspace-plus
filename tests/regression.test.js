'use strict';

require('./lock/harness/index.ts').installObsidianStub();

const test = require('node:test');
const assert = require('node:assert/strict');

const i18n = require('../src/i18n.ts');
i18n.resolveLocale('en');

const { SessionStore } = require('../src/state/session-store.ts');
const { GroupStore } = require('../src/state/group-store.ts');
const { SettingsState } = require('../src/state/settings-state.ts');
const { SessionSaver } = require('../src/state/session-saver.ts');
const { SessionSwitcher } = require('../src/state/session-switcher.ts');
const { DEFAULT_DATA } = require('../src/storage/default-data.ts');

// Eleven adapters were attached to a mock plugin here, over a Module._load
// patch of the obsidian specifier. Both are gone: the classes are constructed
// directly, and the harness's registerHooks redirection covers the specifier
// for require() and import alike - which the _load patch did not.
//
// showSwitchPreviewOverlay and showSwitchFeedbackOverlay stay as recording
// stubs. They are host hooks the switcher calls outward, and several tests
// assert on what reached them.
function createPlugin(initialData) {
    const data = Object.assign({}, DEFAULT_DATA, {
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

    const calls = {
        persist: 0,
        changeLayout: [],
        historyPushes: 0,
        historyPushTargets: [],
        previewOverlays: [],
        feedbackOverlays: [],
    };

    let layoutSource = function () { return {}; };
    const setLayoutSource = (fn) => { layoutSource = fn; };

    const app = {
        workspace: {
            getLayout: function () { return layoutSource(); },
            changeLayout: function (layout) {
                calls.changeLayout.push(layout);
                return Promise.resolve();
            },
        },
    };

    const base = {
        data: data,
        app: app,
        persistData: function () { calls.persist += 1; return Promise.resolve(true); },
        updateStatusBar: function () {},
        syncSessionCommands: function () {},
        hideSwitchOverlay: function () {},
    };

    const settingsState = new SettingsState(base);
    const getCurrentWorkspaceLayout = function () { return app.workspace.getLayout(); };
    // Two distinct steps, as in production. SessionSwitcher owns the restore -
    // including the sidebar merge these tests check - and then hands the built
    // layout to the workspace. Its own host therefore gets the raw workspace
    // call; everything else gets the switcher, so the merge is not skipped.
    // Pointing both at the switcher recurses until the stack runs out.
    const applyLayoutToWorkspace = function (layout) {
        return app.workspace.changeLayout(layout).then(function () { return true; });
    };
    const applyWorkspaceLayout = function (layout, options) {
        return sessionSwitcher.applyWorkspaceLayout(layout, options);
    };
    // The real comparison, not a JSON equality stub: it ignores Obsidian's
    // volatile workspace ids and focus state, which is what several of these
    // tests are about.
    const layoutsEqualStructural = function (a, b) {
        return sessionStore.layoutsEqualStructural(a, b);
    };
    const pushLayoutToHistory = function (session) {
        calls.historyPushes += 1;
        calls.historyPushTargets.push(session ? session.id : null);
    };

    let sessionStore;
    let sessionSwitcher;

    // The switcher calls these outward, and several tests replace them to see
    // what reached them. Held in one object so a test can swap one out.
    const hooks = {
        showSwitchPreviewOverlay: function () {},
        showSwitchFeedbackOverlay: function () {},
    };
    const groupStore = new GroupStore(Object.assign({}, base, {
        settingsState: settingsState,
        switchSession: function (id) { return sessionSwitcher.switchSession(id); },
        getOrderedSessionsUnfiltered: function () { return sessionStore.getOrderedSessionsUnfiltered(); },
        getOrderedSessionsForGroup: function (gid) { return sessionStore.getOrderedSessionsForGroup(gid); },
    }));

    sessionStore = new SessionStore(Object.assign({}, base, {
        settingsState: settingsState,
        groupStore: groupStore,
        getCurrentWorkspaceLayout: getCurrentWorkspaceLayout,
        moveSessionToGroupExclusive: function (sid, gid) { return groupStore.moveSessionToGroupExclusive(sid, gid); },
        resolveGroupSelection: function (gid) { return groupStore.resolveGroupSelection(gid); },
        attachSessionToActiveGroup: function (sid) { groupStore.attachSessionToActiveGroup(sid); },
        applyWorkspaceLayout: applyWorkspaceLayout,
        getWorkspaceRestoreScope: function () { return sessionSwitcher.getWorkspaceRestoreScope(); },
        openRenameModal: function () {},
        openConfirmModal: function (message, onConfirm) { onConfirm(); },
    }));

    const sessionSaver = new SessionSaver(Object.assign({}, base, {
        settingsState: settingsState,
        sessionStore: sessionStore,
        groupStore: groupStore,
        getActiveSession: function () { return sessionStore.getActiveSession(); },
        getCurrentWorkspaceLayout: getCurrentWorkspaceLayout,
        layoutsEqualStructural: layoutsEqualStructural,
        getDefaultSessionName: function () { return sessionStore.getDefaultSessionName(); },
        pushLayoutToHistory: pushLayoutToHistory,
        createSessionRecord: function (id, name, layout, options) {
            return sessionStore.createSessionRecord(id, name, layout, options);
        },
        insertSessionAndActivate: function (session) { sessionStore.insertSessionAndActivate(session); },
        getOrderedSessionsUnfiltered: function () { return sessionStore.getOrderedSessionsUnfiltered(); },
        getOrderedGroupTabIds: function () { return groupStore.getOrderedGroupTabIds(); },
        isGroupFeatureEnabled: function () { return groupStore.isGroupFeatureEnabled(); },
        applyWorkspaceLayout: applyWorkspaceLayout,
        openRenameModal: function () {},
        openConfirmModal: function (message, onConfirm) { onConfirm(); },
    }));

    sessionSwitcher = new SessionSwitcher(Object.assign({}, base, {
        settingsState: settingsState,
        sessionStore: sessionStore,
        sessionSaver: sessionSaver,
        getOrderedSessions: function (gid) { return sessionStore.getOrderedSessionsForGroup(gid ?? null); },
        findSessionIndex: function (sessions, id) { return sessionStore.findSessionIndex(sessions, id); },
        getActiveSession: function () { return sessionStore.getActiveSession(); },
        getCurrentWorkspaceLayout: getCurrentWorkspaceLayout,
        applyWorkspaceLayout: applyLayoutToWorkspace,
        pushLayoutToHistory: pushLayoutToHistory,
        saveActiveSession: function (options) { return sessionSaver.saveActiveSession(options); },
        isActiveSessionDirty: function () { return sessionSaver.isActiveSessionDirty(); },
        isWarnOnUnsavedSwitchEnabled: function () { return settingsState.warnOnUnsavedSwitch; },
        isAutoSaveOnSwitchEnabled: function () { return settingsState.autoSaveOnSwitch; },
        showSwitchPreviewOverlay: function (ordered, index, viewGroupId) {
            hooks.showSwitchPreviewOverlay(ordered, index, viewGroupId);
        },
        showSwitchFeedbackOverlay: function (ordered, index, viewGroupId, options) {
            hooks.showSwitchFeedbackOverlay(ordered, index, viewGroupId, options);
        },
    }));

    return {
        data: data,
        calls: calls,
        setLayoutSource: setLayoutSource,
        store: sessionStore,
        groupStore: groupStore,
        saver: sessionSaver,
        switcher: sessionSwitcher,
        hooks: hooks,
    };
}

test('session switch auto-saves current layout and applies target layout', async function () {
    const currentLayout = { layout: 'current' };
    const { data, calls, switcher, setLayoutSource } = createPlugin({
        activeSessionId: 'a',
        sessionOrder: ['a', 'b'],
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'old-a' }, modified: 1 },
            b: { id: 'b', name: 'B', layout: { layout: 'target-b' }, modified: 1 },
        },
        autoSaveOnSwitch: true,
    });
    setLayoutSource(function () {
        return currentLayout;
    });

    const switched = await switcher.performSessionSwitch('b', { silent: true });

    assert.equal(switched, true);
    assert.equal(data.activeSessionId, 'b');
    assert.deepEqual(data.sessions.a.layout, currentLayout);
    assert.equal(calls.historyPushes, 1);
    assert.equal(calls.persist, 1);
    assert.equal(calls.changeLayout.length, 1);
    assert.deepEqual(calls.changeLayout[0], { layout: 'target-b' });
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
    const { calls, switcher, setLayoutSource } = createPlugin({
        activeSessionId: 'a',
        sessionOrder: ['a', 'b'],
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'old-a' }, modified: 1 },
            b: { id: 'b', name: 'B', layout: targetLayout, modified: 1 },
        },
        autoSaveOnSwitch: true,
        restoreSidebars: false,
    });
    setLayoutSource(function () {
        return currentLayout;
    });

    const switched = await switcher.performSessionSwitch('b', { silent: true });

    assert.equal(switched, true);
    assert.equal(calls.changeLayout.length, 1);
    assert.deepEqual(calls.changeLayout[0].main, targetLayout.main);
    assert.deepEqual(calls.changeLayout[0].left, currentLayout.left);
    assert.deepEqual(calls.changeLayout[0].right, currentLayout.right);
    assert.equal(calls.changeLayout[0].active, 'target-main');
});

test('overwriteSessionWithCurrentLayout saves current layout to selected session without switching', async function () {
    const currentLayout = { layout: 'current' };
    const { data, calls, saver, setLayoutSource } = createPlugin({
        activeSessionId: 'a',
        sessionOrder: ['a', 'b'],
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'active-a' }, modified: 1 },
            b: { id: 'b', name: 'B', layout: { layout: 'old-b' }, modified: 1 },
        },
        autoSaveOnSwitch: false,
    });
    setLayoutSource(function () {
        return currentLayout;
    });

    const saved = await saver.overwriteSessionWithCurrentLayout('b', { silent: true });

    assert.equal(saved, true);
    assert.equal(data.activeSessionId, 'a');
    assert.deepEqual(data.sessions.a.layout, { layout: 'active-a' });
    assert.deepEqual(data.sessions.b.layout, currentLayout);
    assert.notEqual(data.sessions.b.modified, 1);
    assert.deepEqual(calls.historyPushTargets, ['b']);
    assert.equal(calls.persist, 1);
    assert.equal(calls.changeLayout.length, 0);
});

test('unsaved status bar highlight is shown only in manual save mode with layout changes', function () {
    const { data, saver, setLayoutSource } = createPlugin({
        activeSessionId: 'a',
        sessionOrder: ['a'],
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'saved' }, modified: 1 },
        },
        autoSaveOnSwitch: false,
    });

    setLayoutSource(function () {
        return { layout: 'changed' };
    });

    assert.equal(saver.shouldShowUnsavedStatusBarHighlight(), true);

    data.highlightUnsavedSessionChanges = false;
    assert.equal(saver.shouldShowUnsavedStatusBarHighlight(), false);

    data.highlightUnsavedSessionChanges = true;
    data.autoSaveOnSwitch = true;
    assert.equal(saver.shouldShowUnsavedStatusBarHighlight(), false);

    data.autoSaveOnSwitch = false;
    setLayoutSource(function () {
        return { layout: 'saved' };
    });
    assert.equal(saver.shouldShowUnsavedStatusBarHighlight(), false);

    setLayoutSource(function () {
        return { layout: 'saved', scroll: 25, left: 10, top: 20 };
    });
    assert.equal(saver.shouldShowUnsavedStatusBarHighlight(), false);
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
    const { saver, setLayoutSource } = createPlugin({
        activeSessionId: 'a',
        sessionOrder: ['a'],
        sessions: {
            a: { id: 'a', name: 'A', layout: savedLayout, modified: 1 },
        },
        autoSaveOnSwitch: false,
    });

    setLayoutSource(function () {
        return currentLayout;
    });
    assert.equal(saver.shouldShowUnsavedStatusBarHighlight(), false);

    currentLayout.main.children[0].currentTab = 1;
    assert.equal(saver.shouldShowUnsavedStatusBarHighlight(), true);
});

test('deleting active session applies fallback active layout', async function () {
    const { data, calls, store } = createPlugin({
        activeSessionId: 'a',
        sessionOrder: ['a', 'b'],
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'a' }, modified: 1 },
            b: { id: 'b', name: 'B', layout: { layout: 'b' }, modified: 1 },
        },
        sessionGroups: {},
    });

    const deleted = await store.deleteSession('a');

    assert.equal(deleted, true);
    assert.equal(data.activeSessionId, 'b');
    assert.equal(data.sessions.a, undefined);
    assert.equal(calls.persist, 1);
    assert.equal(calls.changeLayout.length, 1);
    assert.deepEqual(calls.changeLayout[0], { layout: 'b' });
});

test('deleting non-active session does not change current layout', async function () {
    const { data, calls, store } = createPlugin({
        activeSessionId: 'a',
        sessionOrder: ['a', 'b'],
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'a' }, modified: 1 },
            b: { id: 'b', name: 'B', layout: { layout: 'b' }, modified: 1 },
        },
        sessionGroups: {},
    });

    const deleted = await store.deleteSession('b');

    assert.equal(deleted, true);
    assert.equal(data.activeSessionId, 'a');
    assert.equal(data.sessions.b, undefined);
    assert.equal(calls.persist, 1);
    assert.equal(calls.changeLayout.length, 0);
});

test('viewed-group session creation uses exclusive group assignment', async function () {
    const { data, store } = createPlugin({
        activeGroupId: 'g1',
        groups: {
            g1: { id: 'g1', name: 'Group 1' },
            g2: { id: 'g2', name: 'Group 2' },
        },
    });

    const result = await store.createSessionForViewedGroup('New', 'g2');

    assert.ok(result.sessionId);
    assert.deepEqual(data.sessionGroups[result.sessionId], ['g2']);
    assert.equal(result.viewGroupId, 'g2');
});

test('switchSession waits for startup settle window before switching', async function () {
    const { switcher } = createPlugin({
        activeSessionId: 'a',
        sessionOrder: ['a', 'b'],
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'a' }, modified: 1 },
            b: { id: 'b', name: 'B', layout: { layout: 'b' }, modified: 1 },
        },
    });

    let switchedAt = 0;
    const startedAt = Date.now();

    switcher.performSessionSwitch = function () {
        switchedAt = Date.now();
        return Promise.resolve(true);
    };

    switcher.startStartupSettleWindow(20);
    const switched = await switcher.switchSession('b', { silent: true });

    assert.equal(switched, true);
    assert.ok(switchedAt >= startedAt + 15);
});

test('scheduleStartupFlush waits until startup settle completes', async function () {
    const { switcher } = createPlugin({
        activeSessionId: 'a',
        sessionOrder: ['a'],
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'a' }, modified: 1 },
        },
        autoSaveOnSwitch: true,
    });

    const flushes = [];
    switcher.flushOnStartup = function () {
        flushes.push(Date.now());
        return Promise.resolve(true);
    };

    const startedAt = Date.now();
    switcher.startStartupSettleWindow(20);
    await switcher.scheduleStartupFlush();

    assert.equal(flushes.length, 1);
    assert.ok(flushes[0] >= startedAt + 15);
});

test('switchRelativeFromCommand shows preview overlay before switching when preview is enabled', function () {
    const { switcher, hooks } = createPlugin({
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

    hooks.showSwitchPreviewOverlay = function (ordered, index) {
        previewCalls.push([ordered.map(function (s) { return s.id; }), index]);
    };
    switcher.switchSession = function () {
        switchCalled = true;
        return Promise.resolve(true);
    };

    switcher.switchRelativeFromCommand(1);

    assert.deepEqual(previewCalls, [[['a', 'b', 'c'], 0]]);
    assert.equal(switchCalled, false);
});

test('switchRelativeFromStatusBar bypasses preview-only first step and uses a replaceable notice', async function () {
    const { switcher, hooks } = createPlugin({
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

    hooks.showSwitchPreviewOverlay = function () {
        previewCalled = true;
    };
    hooks.showSwitchFeedbackOverlay = function () {
        feedbackCalled = true;
    };
    switcher.switchSession = function (sessionId, options) {
        switchCalls.push([sessionId, options]);
        return Promise.resolve(true);
    };

    const switched = await switcher.switchRelativeFromStatusBar(1);

    assert.equal(switched, true);
    assert.equal(previewCalled, false);
    assert.equal(feedbackCalled, false);
    assert.equal(switchCalls.length, 1);
    assert.equal(switchCalls[0][0], 'b');
    assert.equal(switchCalls[0][1].silent, true);
    assert.equal(switchCalls[0][1].switchNoticeMode, 'replace');
});

test('switchRelativeFromScroll switches without showing overlay', async function () {
    const { switcher, hooks } = createPlugin({
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

    hooks.showSwitchPreviewOverlay = function () {
        previewCalled = true;
    };
    hooks.showSwitchFeedbackOverlay = function () {
        feedbackCalled = true;
    };
    switcher.switchSession = function (sessionId, options) {
        switchCalls.push([sessionId, options]);
        return Promise.resolve(true);
    };

    const switched = await switcher.switchRelativeFromScroll(1);

    assert.equal(switched, true);
    assert.equal(previewCalled, false);
    assert.equal(feedbackCalled, false);
    assert.equal(switchCalls.length, 1);
    assert.equal(switchCalls[0][0], 'b');
    assert.equal(switchCalls[0][1].silent, true);
    assert.equal(switchCalls[0][1].switchNoticeMode, 'replace');
});

test('switchSessionByIdFromCommand uses overlay feedback without switch notice', async function () {
    const { switcher, hooks } = createPlugin({
        activeSessionId: 'a',
        sessionOrder: ['a', 'b'],
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'a' }, modified: 1 },
            b: { id: 'b', name: 'B', layout: { layout: 'b' }, modified: 1 },
        },
    });

    const overlayCalls = [];
    const switchCalls = [];

    hooks.showSwitchFeedbackOverlay = function (ordered, index) {
        overlayCalls.push([ordered.map(function (s) { return s.id; }), index]);
    };
    switcher.switchSession = function (sessionId, options) {
        switchCalls.push([sessionId, options]);
        return Promise.resolve(true);
    };

    const switched = await switcher.switchSessionByIdFromCommand('b');

    assert.equal(switched, true);
    assert.deepEqual(overlayCalls, [[['a', 'b'], 1]]);
    assert.equal(switchCalls.length, 1);
    assert.equal(switchCalls[0][0], 'b');
    assert.equal(switchCalls[0][1].silent, true);
    assert.equal(switchCalls[0][1].switchNoticeMode, undefined);
});

test('performSessionSwitch can emit a replaceable session switch notice', async function () {
    const { switcher, setLayoutSource } = createPlugin({
        activeSessionId: 'a',
        sessionOrder: ['a', 'b'],
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'a' }, modified: 1 },
            b: { id: 'b', name: 'B', layout: { layout: 'b' }, modified: 1 },
        },
    });

    const noticeCalls = [];
    switcher.showSessionSwitchNotice = function (sessionName, options) {
        noticeCalls.push([sessionName, options]);
    };
    setLayoutSource(function () {
        return { layout: 'current' };
    });

    const switched = await switcher.performSessionSwitch('b', {
        silent: true,
        switchNoticeMode: 'replace',
        switchNoticeDurationMs: 900,
    });

    assert.equal(switched, true);
    assert.deepEqual(noticeCalls, [['B', { durationMs: 900 }]]);
});
