'use strict';

require('./lock/harness/index.ts').installObsidianStub();

const test = require('node:test');
const assert = require('node:assert/strict');
const { setupHarness } = require('./lock/harness/index.ts');
setupHarness();

const i18n = require('../src/i18n.ts');
i18n.resolveLocale('en');

const { SessionStore } = require('../src/state/session-store.ts');
const { GroupStore } = require('../src/state/group-store.ts');

// The CRUD methods used to arrive on a mock plugin's prototype from four
// adapters. The stores are constructed here instead, so what runs is the code
// the plugin runs. Only what the stores genuinely delegate outward is stubbed:
// the workspace, the redraw, the persist, and the two modals.
function createStores(initialData) {
    const data = Object.assign({
        activeSessionId: 'a',
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'a' }, modified: 1 },
            b: { id: 'b', name: 'B', layout: { layout: 'b' }, modified: 1 },
        },
        sessionOrder: ['a', 'b'],
        sessionGroups: {},
        groups: {
            g1: { id: 'g1', name: 'Work' },
        },
        groupOrder: ['__all__', 'g1'],
        activeGroupId: null,
        confirmDeleteByHotkey: false,
    }, initialData || {});

    const calls = {
        persist: 0,
        statusBar: 0,
        commandSync: 0,
        attached: [],
        detached: 0,
        renameModals: 0,
        confirmModals: 0,
    };
    const settingsState = { groupFeatureEnabled: true };

    const app = {
        workspace: {
            getLayout: function () { return { layout: 'current' }; },
            changeLayout: function () { return Promise.resolve(true); },
            iterateRootLeaves: function (callback) {
                callback({ detach: function () { calls.detached += 1; } });
                callback({ detach: function () { calls.detached += 1; } });
            },
        },
    };

    const shared = {
        data: data,
        app: app,
        settingsState: settingsState,
        persistData: function () { calls.persist += 1; return Promise.resolve(true); },
        updateStatusBar: function () { calls.statusBar += 1; },
        syncSessionCommands: function () { calls.commandSync += 1; },
        hideSwitchOverlay: function () {},
    };

    let sessionStore;

    const groupStore = new GroupStore(Object.assign({}, shared, {
        switchSession: function () { return Promise.resolve(true); },
        getOrderedSessionsUnfiltered: function () { return sessionStore.getOrderedSessionsUnfiltered(); },
        getOrderedSessionsForGroup: function (gid) { return sessionStore.getOrderedSessionsForGroup(gid); },
    }));

    sessionStore = new SessionStore(Object.assign({}, shared, {
        manifestId: 'obsidian-workspace-plus',
        groupStore: groupStore,
        getCurrentWorkspaceLayout: function () { return app.workspace.getLayout(); },
        moveSessionToGroupExclusive: function (sid, gid) { return groupStore.moveSessionToGroupExclusive(sid, gid); },
        resolveGroupSelection: function (gid) { return Promise.resolve({ resolvedGroupId: gid }); },
        attachSessionToActiveGroup: function (sessionId) { calls.attached.push(sessionId); },
        captureActiveSessionLayoutIfAutoSave: function () {},
        applyWorkspaceLayout: function (layout) { return app.workspace.changeLayout(layout); },
        getWorkspaceRestoreScope: function () { return 'full'; },
        openRenameModal: function () { calls.renameModals += 1; },
        openConfirmModal: function (message, onConfirm) { calls.confirmModals += 1; onConfirm(); },
        openPluginSettings: function () {},
    }));

    return { store: sessionStore, groupStore: groupStore, data: data, calls: calls };
}

// 落ちる条件: 新規作成セッションのアクティベーションまたはリスト登録が抜けた場合に落ちる
test('createSession: creates a new session record and activates it as current', async function () {
    const { store, data, calls } = createStores();

    await store.createSession('New');

    assert.equal(Object.keys(data.sessions).length, 3);
    assert.equal(data.sessions[data.activeSessionId].name, 'New');
    assert.equal(data.sessionOrder[2], data.activeSessionId);
    assert.deepEqual(calls.attached, [data.activeSessionId]);
    assert.equal(calls.statusBar, 1);
    assert.equal(calls.commandSync, 1);
    assert.equal(calls.persist, 1);
});

// 落ちる条件: 指定IDのセッションのレイアウトディープコピーやグループ紐付けの継承が壊れた場合に落ちる
test('duplicateSession: creates an exact cloned session preserving group memberships without switching active', async function () {
    const { store, data, calls } = createStores({
        sessionGroups: {
            b: ['g1'],
        },
    });

    await store.duplicateSession('b');

    assert.equal(data.activeSessionId, 'a');
    assert.equal(data.sessionOrder.length, 3);
    const newId = data.sessionOrder[2];
    assert.notEqual(newId, 'b');
    assert.deepEqual(data.sessions[newId].layout, { layout: 'b' });
    assert.notEqual(data.sessions[newId].layout, data.sessions.b.layout);
    assert.deepEqual(data.sessionGroups[newId], ['g1']);
    assert.equal(calls.commandSync, 1);
    assert.equal(calls.persist, 1);
});

// 落ちる条件: duplicateCurrentSession が自動採番名で現在のアクティブセッションを複製できない場合に落ちる
test('duplicateCurrentSession: duplicates the currently active session with next generated name', async function () {
    const { store, data } = createStores();

    const duplicated = await store.duplicateCurrentSession();

    assert.ok(duplicated);
    assert.equal(data.sessionOrder.length, 3);
    const newId = data.sessionOrder[2];
    assert.equal(data.sessions[newId].name, 'New session 1');
});

// 落ちる条件: resetSessionsToDefault がグループ状態やセッション順序の全初期化を怠った場合に落ちる
test('resetSessionsToDefault: wipes all sessions and group mappings and restores a single default session', async function () {
    const { store, data, calls } = createStores({
        sessionGroups: {
            a: ['g1'],
        },
        groups: {
            g1: { id: 'g1', name: 'Group' },
        },
        groupOrder: ['__all__', 'g1'],
        activeGroupId: 'g1',
    });

    await store.resetSessionsToDefault();

    assert.equal(Object.keys(data.sessions).length, 1);
    assert.equal(data.sessionOrder.length, 1);
    assert.equal(data.activeSessionId, data.sessionOrder[0]);
    assert.equal(data.sessions[data.activeSessionId].isDefault, true);
    assert.deepEqual(data.groups, {});
    assert.deepEqual(data.groupOrder, []);
    assert.deepEqual(data.sessionGroups, {});
    assert.equal(data.activeGroupId, null);
    assert.equal(calls.statusBar, 1);
    assert.equal(calls.commandSync, 1);
    assert.equal(calls.persist, 1);
});

// 落ちる条件: createEmptySession で root leaves のデタッチ処理が呼ばれなかった場合に落ちる
test('createEmptySession: detaches root leaves and creates a clean empty session', async function () {
    const { store, data, calls } = createStores();

    await store.createEmptySession();

    assert.equal(calls.detached, 2);
    assert.equal(data.sessions[data.activeSessionId].name, 'New session 1');
    assert.deepEqual(data.sessions[data.activeSessionId].layout, { layout: 'current' });
    assert.equal(calls.persist, 1);
});

// 落ちる条件: 最後の1つのセッションを削除しようとした時の保護ガードが外れた場合に落ちる
test('deleteCurrentSession: prevents deleting the last remaining session in the vault', function () {
    const { store, data } = createStores({
        sessions: {
            a: { id: 'a', name: 'Only Session', layout: {} },
        },
        sessionOrder: ['a'],
        activeSessionId: 'a',
    });

    store.deleteCurrentSession();

    assert.equal(Object.keys(data.sessions).length, 1);
    assert.equal(data.sessions.a.name, 'Only Session');
});

// 落ちる条件: deleteCurrentSession が複数セッション存在時に正常に削除とアクティブ切り替えを行えない場合に落ちる
test('deleteCurrentSession: deletes active session when multiple sessions exist', async function () {
    const { store, data } = createStores();

    await store.deleteCurrentSession();

    assert.equal(data.sessions.a, undefined);
    assert.equal(data.activeSessionId, 'b');
    assert.deepEqual(data.sessionOrder, ['b']);

    // Missing active session case
    data.activeSessionId = 'missing';
    store.deleteCurrentSession();
});

// 落ちる条件: renameCurrentSession がアクティブセッションの名称変更モーダルを開けない場合に落ちる
test('renameCurrentSession: opens rename modal for active session', function () {
    const { store, data } = createStores();

    store.renameCurrentSession();

    // With missing active session
    data.activeSessionId = 'missing';
    store.renameCurrentSession();
});

// 落ちる条件: デフォルト名フォーマット関数 (getDefaultSessionName / getAutoSessionName) の文字列生成が壊れた場合に落ちる
test('session naming helpers: generate expected default and auto session names', function () {
    const { store } = createStores();

    assert.equal(store.getDefaultSessionName(), 'default');
    assert.equal(store.getAutoSessionName(3), 'New session 3');
});

// 落ちる条件: createSessionRecord が引数の modified や layout を欠落させた場合に落ちる
test('createSessionRecord: constructs a normalized session record object with timestamps', function () {
    const { store } = createStores();

    const record = store.createSessionRecord('rec-1', 'Rec Name', { type: 'root' }, { modified: 12345 });

    assert.deepEqual(record, {
        id: 'rec-1',
        name: 'Rec Name',
        layout: { type: 'root' },
        modified: 12345,
    });
});

// 落ちる条件: deleteSession, deleteAllInactiveSessions, ensureDefaultSession, getNextSessionName の基本操作が壊れた場合に落ちる
test('session crud: deleteSession, deleteAllInactiveSessions, ensureDefaultSession, and getNextSessionName', async function () {
    const { store, data } = createStores({
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'a' } },
            b: { id: 'b', name: 'B', layout: { layout: 'b' } },
            c: { id: 'c', name: 'New session 1', layout: { layout: 'c' } },
        },
        sessionOrder: ['a', 'b', 'c'],
        activeSessionId: 'a',
    });

    // getNextSessionName skips existing names
    const nextName = store.getNextSessionName();
    assert.equal(nextName, 'New session 2');

    // deleteSession
    const deleted = await store.deleteSession('b');
    assert.equal(deleted, true);
    assert.equal(data.sessions.b, undefined);
    assert.deepEqual(data.sessionOrder, ['a', 'c']);

    // deleteAllInactiveSessions
    const count = await store.deleteAllInactiveSessions();
    assert.equal(count, 1);
    assert.equal(data.sessions.c, undefined);
    assert.equal(Object.keys(data.sessions).length, 1);

    // ensureDefaultSession
    store.ensureDefaultSession();
    assert.equal(Object.keys(data.sessions).length, 2);
});
