'use strict';

require('./lock/harness/index.ts').installObsidianStub();

const test = require('node:test');
const assert = require('node:assert/strict');
const { setupHarness } = require('./lock/harness/index.ts');
setupHarness();

const i18n = require('../src/i18n.ts');
i18n.resolveLocale('en');

const { SessionSaver } = require('../src/state/session-saver.ts');
const { SessionStore } = require('../src/state/session-store.ts');
const { GroupStore } = require('../src/state/group-store.ts');
const { SettingsState } = require('../src/state/settings-state.ts');

// Five adapters used to put these methods on a mock plugin's prototype. The
// saver is built here with the real SessionStore for the record creation and
// insertion, and the real SettingsState for the auto-save flags, so the toggles
// and the group-view choice run against the code the plugin runs.
//
// saveActiveSession and overwriteSessionWithCurrentLayout are deliberately
// absent from the host: the saver prefers a host hook over its own method when
// one exists, and supplying either would test the stub instead of the saver.
function createSaver(initialData) {
    const data = Object.assign({
        activeSessionId: 'a',
        sessionOrder: ['a', 'b'],
        autoSaveOnSwitch: true,
        warnOnUnsavedSwitch: true,
        highlightUnsavedSessionChanges: true,
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'old' }, modified: 1 },
            b: { id: 'b', name: 'B', layout: { layout: 'target' }, modified: 1 },
        },
        groups: {},
        groupOrder: ['__all__'],
        sessionGroups: {},
        activeGroupId: null,
    }, initialData || {});

    const calls = {
        persist: 0,
        statusBar: 0,
        commandSync: 0,
        historyPushes: [],
        historyStarts: 0,
        historyStops: 0,
        changeLayout: [],
        renameModals: 0,
        confirmModals: 0,
    };

    // The startup test needs getLayout() to throw, so the source is a function
    // the test can replace rather than a stored value.
    let layoutSource = function () { return { layout: 'current' }; };
    const setLayoutSource = (fn) => { layoutSource = fn; };

    const shared = {
        data: data,
        persistData: function () { calls.persist += 1; return Promise.resolve(true); },
        updateStatusBar: function () { calls.statusBar += 1; },
        syncSessionCommands: function () { calls.commandSync += 1; },
        startHistorySnapshotTimer: function () { calls.historyStarts += 1; },
        stopHistorySnapshotTimer: function () { calls.historyStops += 1; },
    };

    const settingsState = new SettingsState(shared);

    const app = {
        workspace: {
            getLayout: function () { return layoutSource(); },
            changeLayout: function (layout) {
                calls.changeLayout.push(layout);
                return Promise.resolve(true);
            },
        },
    };

    const layoutsEqualStructural = function (a, b) {
        return JSON.stringify(a) === JSON.stringify(b);
    };
    const applyWorkspaceLayout = function (layout) { return app.workspace.changeLayout(layout); };

    let sessionStore;
    const groupStore = new GroupStore(Object.assign({}, shared, {
        settingsState: settingsState,
        switchSession: function () { return Promise.resolve(true); },
        getOrderedSessionsUnfiltered: function () { return sessionStore.getOrderedSessionsUnfiltered(); },
        getOrderedSessionsForGroup: function (gid) { return sessionStore.getOrderedSessionsForGroup(gid); },
    }));

    sessionStore = new SessionStore(Object.assign({}, shared, {
        app: app,
        settingsState: settingsState,
        groupStore: groupStore,
        getCurrentWorkspaceLayout: function () { return app.workspace.getLayout(); },
        moveSessionToGroupExclusive: function (sid, gid) { return groupStore.moveSessionToGroupExclusive(sid, gid); },
        resolveGroupSelection: function (gid) { return Promise.resolve({ resolvedGroupId: gid }); },
        attachSessionToActiveGroup: function () {},
        applyWorkspaceLayout: applyWorkspaceLayout,
        getWorkspaceRestoreScope: function () { return 'full'; },
    }));

    const saver = new SessionSaver(Object.assign({}, shared, {
        app: app,
        settingsState: settingsState,
        sessionStore: sessionStore,
        groupStore: groupStore,
        getActiveSession: function () { return sessionStore.getActiveSession(); },
        getCurrentWorkspaceLayout: function () { return app.workspace.getLayout(); },
        layoutsEqualStructural: layoutsEqualStructural,
        getDefaultSessionName: function () { return sessionStore.getDefaultSessionName(); },
        // Recorded rather than delegated, as the adapter fixture did: the tests
        // assert which sessions were pushed, not what the history holds.
        pushLayoutToHistory: function (session) { calls.historyPushes.push(session ? session.id : null); },
        createSessionRecord: function (id, name, layout, options) {
            return sessionStore.createSessionRecord(id, name, layout, options);
        },
        insertSessionAndActivate: function (session) { sessionStore.insertSessionAndActivate(session); },
        getOrderedSessionsUnfiltered: function () { return sessionStore.getOrderedSessionsUnfiltered(); },
        getOrderedGroupTabIds: function () { return groupStore.getOrderedGroupTabIds(); },
        isGroupFeatureEnabled: function () { return groupStore.isGroupFeatureEnabled(); },
        applyWorkspaceLayout: applyWorkspaceLayout,
        openRenameModal: function () { calls.renameModals += 1; },
        openConfirmModal: function (message, onConfirm) { calls.confirmModals += 1; onConfirm(); },
    }));

    return { saver: saver, store: sessionStore, data: data, calls: calls, setLayoutSource: setLayoutSource };
}

test('session saving toggles auto-save side effects together', async function () {
    const { saver, calls } = createSaver();

    const off = await saver.setAutoSaveOnSwitch(false);
    const on = await saver.setAutoSaveOnSwitch(true);

    assert.equal(off, false);
    assert.equal(on, true);
    assert.equal(calls.historyStops, 1);
    assert.equal(calls.historyStarts, 1);
    assert.equal(calls.statusBar, 2);
    assert.equal(calls.persist, 2);

    const toggledOff = await saver.toggleAutoSaveOnSwitch();
    assert.equal(toggledOff, false);
    assert.equal(saver.isAutoSaveOnSwitchEnabled(), false);
});

test('session saving captures active layout only when auto-save is enabled', function () {
    const { saver, data, calls } = createSaver();

    saver.captureActiveSessionLayoutIfAutoSave();
    data.autoSaveOnSwitch = false;
    saver.captureActiveSessionLayoutIfAutoSave();

    assert.deepEqual(calls.historyPushes, ['a']);
    assert.deepEqual(data.sessions.a.layout, { layout: 'current' });
    assert.notEqual(data.sessions.a.modified, 1);
});

test('session dirty check tolerates layout being unavailable during startup', function () {
    const { saver, setLayoutSource } = createSaver();
    setLayoutSource(function () {
        throw new Error('layout not ready');
    });

    assert.equal(saver.isActiveSessionDirty(), false);
    assert.equal(saver.shouldShowUnsavedStatusBarHighlight(), false);
});

test('session saving saves active session and reports whether layout changed', async function () {
    const { saver, data, calls } = createSaver();

    const changed = await saver.saveActiveSession({ silent: true });
    const unchanged = await saver.saveActiveSession({ silent: true });

    assert.equal(changed, true);
    assert.equal(unchanged, false);
    assert.deepEqual(calls.historyPushes, ['a', 'a']);
    assert.equal(calls.statusBar, 2);
    assert.equal(calls.persist, 2);

    // Save with no active session
    data.activeSessionId = 'nonexistent';
    const noSessionSaved = await saver.saveActiveSession({ silent: true });
    assert.equal(noSessionSaved, false);
});

test('session saving overwrites a specified session with current layout', async function () {
    const { saver, data } = createSaver();

    const overwritten = await saver.overwriteSessionWithCurrentLayout('b', { silent: true });
    assert.equal(overwritten, true);
    assert.deepEqual(data.sessions.b.layout, { layout: 'current' });

    const nonExistent = await saver.overwriteSessionWithCurrentLayout('missing', { silent: true });
    assert.equal(nonExistent, false);
});

test('session saving saves current layout as a new named session', async function () {
    const { saver, data, calls } = createSaver({
        activeSessionId: 'a',
        sessionOrder: ['a'],
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'old' }, modified: 1 },
        },
    });

    const result = await saver.saveCurrentLayoutAsSessionName('Project Note', { silent: true });
    const created = data.sessions[result.sessionId];

    assert.equal(result.saved, true);
    assert.equal(result.created, true);
    assert.equal(result.overwritten, false);
    assert.equal(created.name, 'Project Note');
    assert.deepEqual(created.layout, { layout: 'current' });
    assert.equal(data.activeSessionId, result.sessionId);
    assert.equal(calls.persist, 1);

    const emptyResult = await saver.saveCurrentLayoutAsSessionName('   ', { silent: true });
    assert.equal(emptyResult.saved, false);
});

test('session saving overwrites an existing named session from current layout', async function () {
    const { saver, data, calls } = createSaver({
        activeSessionId: 'a',
        sessionOrder: ['a', 'b'],
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'old-a' }, modified: 1 },
            b: { id: 'b', name: 'Project Note', layout: { layout: 'old-b' }, modified: 1 },
        },
        autoSaveOnSwitch: true,
    });

    const result = await saver.saveCurrentLayoutAsSessionName('Project Note', { silent: true });

    assert.equal(result.saved, true);
    assert.equal(result.created, false);
    assert.equal(result.overwritten, true);
    assert.equal(result.sessionId, 'b');
    assert.equal(data.activeSessionId, 'b');
    assert.deepEqual(data.sessions.a.layout, { layout: 'current' });
    assert.deepEqual(data.sessions.b.layout, { layout: 'current' });
    assert.deepEqual(calls.historyPushes, ['a', 'b']);
    assert.equal(calls.persist, 1);
});

test('session saving preserves existing session group membership and switches view to that group', async function () {
    const { saver, data } = createSaver({
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

    const result = await saver.saveCurrentLayoutAsSessionName('Project Note', { silent: true });

    assert.equal(result.sessionId, 'b');
    assert.equal(data.activeGroupId, 'g2');
    assert.deepEqual(data.sessionGroups.b, ['g2']);
});

test('session saving switches to all sessions view when overwriting an ungrouped session', async function () {
    const { saver, data } = createSaver({
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

    const result = await saver.saveCurrentLayoutAsSessionName('Project Note', { silent: true });

    assert.equal(result.sessionId, 'b');
    assert.equal(data.activeGroupId, null);
    assert.equal(data.sessionGroups.b, undefined);
});

test('session saving reloads current session layout without persisting', async function () {
    const { saver, data, calls } = createSaver({
        activeSessionId: 'b',
    });

    const reloaded = await saver.reloadCurrentSessionWithoutSaving({ silent: true });

    assert.equal(reloaded, true);
    assert.deepEqual(calls.changeLayout, [{ layout: 'target' }]);
    assert.equal(calls.persist, 0);

    data.activeSessionId = 'missing';
    const noSessionReload = await saver.reloadCurrentSessionWithoutSaving({ silent: true });
    assert.equal(noSessionReload, false);
});

test('session saving confirms overwrite modal flow', function () {
    const { saver } = createSaver();

    const missing = saver.confirmOverwriteSessionWithCurrentLayout('missing', { silent: true });
    assert.equal(missing, false);

    const opened = saver.confirmOverwriteSessionWithCurrentLayout('b', { silent: true });
    assert.equal(opened, true);
});
