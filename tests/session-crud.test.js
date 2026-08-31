'use strict';

require('./lock/harness/index.ts').installObsidianStub();

const test = require('node:test');
const assert = require('node:assert/strict');
const { setupHarness } = require('./lock/harness/index.ts');
setupHarness();

const i18n = require('../src/i18n.ts');
i18n.resolveLocale('en');

const attachSessionCrudMethods = require('../src/plugin/methods/session-crud');
const attachLayoutRestoreMethods = require('../src/plugin/methods/layout-restore');
const attachSessionValidationMethods = require('../src/plugin/methods/sessions-validation');
const attachSessionMethods = require('../src/plugin/methods/sessions');

function createPlugin(initialData) {
    function PluginMock() {}
    attachSessionMethods(PluginMock);
    attachLayoutRestoreMethods(PluginMock);
    attachSessionCrudMethods(PluginMock);
    attachSessionValidationMethods(PluginMock);
    const plugin = new PluginMock();
    plugin.data = Object.assign({
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
    plugin.manifest = { id: 'obsidian-workspace-plus' };
    plugin.persistCalls = 0;
    plugin.statusBarUpdates = 0;
    plugin.commandSyncs = 0;
    plugin.attachedSessions = [];
    plugin.detachedLeaves = 0;
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
    plugin.captureActiveSessionLayoutIfAutoSave = function () {};
    plugin.hideSwitchOverlay = function () {};
    plugin.app = {
        workspace: {
            getLayout: function () {
                return { layout: 'current' };
            },
            changeLayout: function () {
                return Promise.resolve(true);
            },
            iterateRootLeaves: function (callback) {
                callback({ detach: function () { plugin.detachedLeaves += 1; } });
                callback({ detach: function () { plugin.detachedLeaves += 1; } });
            },
        },
    };
    plugin.getGroupStore().attachSessionToActiveGroup = function (sessionId) {
        plugin.attachedSessions.push(sessionId);
    };
    return plugin;
}

// 落ちる条件: 新規作成セッションのアクティベーションまたはリスト登録が抜けた場合に落ちる
test('createSession: creates a new session record and activates it as current', async function () {
    const plugin = createPlugin();

    await plugin.createSession('New');

    assert.equal(Object.keys(plugin.data.sessions).length, 3);
    assert.equal(plugin.data.sessions[plugin.data.activeSessionId].name, 'New');
    assert.equal(plugin.data.sessionOrder[2], plugin.data.activeSessionId);
    assert.deepEqual(plugin.attachedSessions, [plugin.data.activeSessionId]);
    assert.equal(plugin.statusBarUpdates, 1);
    assert.equal(plugin.commandSyncs, 1);
    assert.equal(plugin.persistCalls, 1);
});

// 落ちる条件: 指定IDのセッションのレイアウトディープコピーやグループ紐付けの継承が壊れた場合に落ちる
test('duplicateSession: creates an exact cloned session preserving group memberships without switching active', async function () {
    const plugin = createPlugin({
        sessionGroups: {
            b: ['g1'],
        },
    });

    await plugin.duplicateSession('b');

    assert.equal(plugin.data.activeSessionId, 'a');
    assert.equal(plugin.data.sessionOrder.length, 3);
    const newId = plugin.data.sessionOrder[2];
    assert.notEqual(newId, 'b');
    assert.deepEqual(plugin.data.sessions[newId].layout, { layout: 'b' });
    assert.notEqual(plugin.data.sessions[newId].layout, plugin.data.sessions.b.layout);
    assert.deepEqual(plugin.data.sessionGroups[newId], ['g1']);
    assert.equal(plugin.commandSyncs, 1);
    assert.equal(plugin.persistCalls, 1);
});

// 落ちる条件: duplicateCurrentSession が自動採番名で現在のアクティブセッションを複製できない場合に落ちる
test('duplicateCurrentSession: duplicates the currently active session with next generated name', async function () {
    const plugin = createPlugin();

    const duplicated = await plugin.duplicateCurrentSession();

    assert.ok(duplicated);
    assert.equal(plugin.data.sessionOrder.length, 3);
    const newId = plugin.data.sessionOrder[2];
    assert.equal(plugin.data.sessions[newId].name, 'New session 1');
});

// 落ちる条件: resetSessionsToDefault がグループ状態やセッション順序の全初期化を怠った場合に落ちる
test('resetSessionsToDefault: wipes all sessions and group mappings and restores a single default session', async function () {
    const plugin = createPlugin({
        sessionGroups: {
            a: ['g1'],
        },
        groups: {
            g1: { id: 'g1', name: 'Group' },
        },
        groupOrder: ['__all__', 'g1'],
        activeGroupId: 'g1',
    });

    await plugin.resetSessionsToDefault();

    assert.equal(Object.keys(plugin.data.sessions).length, 1);
    assert.equal(plugin.data.sessionOrder.length, 1);
    assert.equal(plugin.data.activeSessionId, plugin.data.sessionOrder[0]);
    assert.equal(plugin.data.sessions[plugin.data.activeSessionId].isDefault, true);
    assert.deepEqual(plugin.data.groups, {});
    assert.deepEqual(plugin.data.groupOrder, []);
    assert.deepEqual(plugin.data.sessionGroups, {});
    assert.equal(plugin.data.activeGroupId, null);
    assert.equal(plugin.statusBarUpdates, 1);
    assert.equal(plugin.commandSyncs, 1);
    assert.equal(plugin.persistCalls, 1);
});

// 落ちる条件: createEmptySession で root leaves のデタッチ処理が呼ばれなかった場合に落ちる
test('createEmptySession: detaches root leaves and creates a clean empty session', async function () {
    const plugin = createPlugin();

    await plugin.createEmptySession();

    assert.equal(plugin.detachedLeaves, 2);
    assert.equal(plugin.data.sessions[plugin.data.activeSessionId].name, 'New session 1');
    assert.deepEqual(plugin.data.sessions[plugin.data.activeSessionId].layout, { layout: 'current' });
    assert.equal(plugin.persistCalls, 1);
});

// 落ちる条件: 最後の1つのセッションを削除しようとした時の保護ガードが外れた場合に落ちる
test('deleteCurrentSession: prevents deleting the last remaining session in the vault', function () {
    const plugin = createPlugin({
        sessions: {
            a: { id: 'a', name: 'Only Session', layout: {} },
        },
        sessionOrder: ['a'],
        activeSessionId: 'a',
    });

    plugin.deleteCurrentSession();

    assert.equal(Object.keys(plugin.data.sessions).length, 1);
    assert.equal(plugin.data.sessions.a.name, 'Only Session');
});

// 落ちる条件: deleteCurrentSession が複数セッション存在時に正常に削除とアクティブ切り替えを行えない場合に落ちる
test('deleteCurrentSession: deletes active session when multiple sessions exist', async function () {
    const plugin = createPlugin();

    await plugin.deleteCurrentSession();

    assert.equal(plugin.data.sessions.a, undefined);
    assert.equal(plugin.data.activeSessionId, 'b');
    assert.deepEqual(plugin.data.sessionOrder, ['b']);

    // Missing active session case
    plugin.data.activeSessionId = 'missing';
    plugin.deleteCurrentSession();
});

// 落ちる条件: renameCurrentSession がアクティブセッションの名称変更モーダルを開けない場合に落ちる
test('renameCurrentSession: opens rename modal for active session', function () {
    const plugin = createPlugin();

    plugin.renameCurrentSession();

    // With missing active session
    plugin.data.activeSessionId = 'missing';
    plugin.renameCurrentSession();
});

// 落ちる条件: デフォルト名フォーマット関数 (getDefaultSessionName / getAutoSessionName) の文字列生成が壊れた場合に落ちる
test('session naming helpers: generate expected default and auto session names', function () {
    const plugin = createPlugin();

    assert.equal(plugin.getDefaultSessionName(), 'default');
    assert.equal(plugin.getAutoSessionName(3), 'New session 3');
});

// 落ちる条件: createSessionRecord が引数の modified や layout を欠落させた場合に落ちる
test('createSessionRecord: constructs a normalized session record object with timestamps', function () {
    const plugin = createPlugin();

    const record = plugin.createSessionRecord('rec-1', 'Rec Name', { type: 'root' }, { modified: 12345 });

    assert.deepEqual(record, {
        id: 'rec-1',
        name: 'Rec Name',
        layout: { type: 'root' },
        modified: 12345,
    });
});

// 落ちる条件: deleteSession, deleteAllInactiveSessions, ensureDefaultSession, getNextSessionName の基本操作が壊れた場合に落ちる
test('session crud: deleteSession, deleteAllInactiveSessions, ensureDefaultSession, and getNextSessionName', async function () {
    const plugin = createPlugin({
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'a' } },
            b: { id: 'b', name: 'B', layout: { layout: 'b' } },
            c: { id: 'c', name: 'New session 1', layout: { layout: 'c' } },
        },
        sessionOrder: ['a', 'b', 'c'],
        activeSessionId: 'a',
    });

    // getNextSessionName skips existing names
    const nextName = plugin.getNextSessionName();
    assert.equal(nextName, 'New session 2');

    // deleteSession
    const deleted = await plugin.deleteSession('b');
    assert.equal(deleted, true);
    assert.equal(plugin.data.sessions.b, undefined);
    assert.deepEqual(plugin.data.sessionOrder, ['a', 'c']);

    // deleteAllInactiveSessions
    const count = await plugin.deleteAllInactiveSessions();
    assert.equal(count, 1);
    assert.equal(plugin.data.sessions.c, undefined);
    assert.equal(Object.keys(plugin.data.sessions).length, 1);

    // ensureDefaultSession
    plugin.ensureDefaultSession();
    assert.equal(Object.keys(plugin.data.sessions).length, 2);
});
