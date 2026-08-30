'use strict';

require('./lock/harness/index.ts').installObsidianStub();

const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');

function loadSessionContextActions(hooks) {
    hooks = hooks || {};
    const notices = hooks.notices || [];
    const menuOpens = hooks.menuOpens || [];
    const actionCalls = hooks.actionCalls || [];

    const obsidianStub = {
        Notice: class {
            constructor(message) {
                notices.push(message);
            }
        },
    };
    const i18nStub = {
        L: {
            groupRemovedSession: function (sessionName, groupName) {
                return 'removed ' + sessionName + ' from ' + groupName;
            },
            groupAddedSession: function (sessionName, groupName) {
                return 'added ' + sessionName + ' to ' + groupName;
            },
            confirmDeleteActive: function (sessionName) {
                return 'delete active ' + sessionName;
            },
            confirmDelete: function (sessionName) {
                return 'delete ' + sessionName;
            },
        },
    };
    const HistoryModalStub = class {
        constructor(_app, _plugin, session) {
            this.session = session;
        }
        open() {
            actionCalls.push(['history', this.session.id]);
        }
    };
    const sessionContextMenuStub = {
        openSessionContextMenu: function (options) {
            menuOpens.push(options);
        },
    };
    const sessionListActionsStub = {
        renameSessionWithPrompt: function (options) {
            actionCalls.push(['rename', options.session.id]);
            if (options.onRenamed) options.onRenamed();
        },
        deleteSessionWithPrompt: function (options) {
            actionCalls.push([
                'delete',
                options.session.id,
                options.forceConfirm,
                options.confirmMessage,
                options.notifyDeleted,
            ]);
            if (options.onDeleted) options.onDeleted();
            return Promise.resolve(true);
        },
    };

    const originalLoad = Module._load;
    Module._load = function (request, parent, isMain) {
        if (request === 'obsidian') return obsidianStub;
        if (request === './i18n' || request === './i18n.ts') return i18nStub;
        if (request === './modals/history-modal') return HistoryModalStub;
        if (request === './session-context-menu') return sessionContextMenuStub;
        if (request === './session-list-actions') return sessionListActionsStub;
        return originalLoad(request, parent, isMain);
    };

    try {
        const modulePath = require.resolve('../src/session-context-actions');
        delete require.cache[modulePath];
        return require(modulePath);
    } finally {
        Module._load = originalLoad;
    }
}

function createPlugin(calls) {
    return {
        app: {},
        data: {
            activeSessionId: 'a',
            groups: {
                g1: { id: 'g1', name: 'Group 1' },
            },
        },
        isGroupFeatureEnabled: function () {
            return true;
        },
        getOrderedGroups: function () {
            return [{ id: 'g1', name: 'Group 1' }];
        },
        saveActiveSession: function () {
            calls.push('save');
            return Promise.resolve(true);
        },
        reloadCurrentSessionWithoutSaving: function () {
            calls.push('reload');
            return Promise.resolve(true);
        },
        saveAsSession: function () {
            calls.push('saveAs');
            return Promise.resolve(true);
        },
        confirmOverwriteSessionWithCurrentLayout: function (sessionId, options) {
            calls.push(['overwrite', sessionId]);
            if (options && options.onSaved) options.onSaved();
            return true;
        },
        duplicateSession: function (sessionId) {
            calls.push(['duplicate', sessionId]);
            return Promise.resolve(true);
        },
        removeSessionFromGroup: function (sessionId, groupId) {
            calls.push(['removeGroup', sessionId, groupId]);
            return Promise.resolve(true);
        },
        moveSessionToGroupExclusive: function (sessionId, groupId) {
            calls.push(['moveGroup', sessionId, groupId]);
            return Promise.resolve(true);
        },
    };
}

test('session context action builder wires shared defaults and refresh callbacks', async function () {
    const calls = [];
    const notices = [];
    const actionCalls = [];
    const actions = loadSessionContextActions({ notices, actionCalls });
    const plugin = createPlugin(calls);
    const session = { id: 'b', name: 'Beta' };

    const menuOptions = actions.createSessionContextMenuOptions({
        plugin: plugin,
        session: session,
        getViewGroupId: function () {
            return 'g1';
        },
        onGroupsChanged: function () {
            calls.push('groupsChanged');
        },
        onSessionsChanged: function () {
            calls.push('sessionsChanged');
        },
    });

    assert.equal(menuOptions.showMoveToGroup, true);
    assert.equal(menuOptions.showRemoveFromGroup, true);

    await menuOptions.onSave();
    menuOptions.onOverwriteWithCurrentLayout();
    await menuOptions.onDuplicate();
    await menuOptions.onRemoveFromGroup();
    await menuOptions.onMoveToGroup('g1');
    menuOptions.onRename();
    menuOptions.onVersionHistory();

    assert.deepEqual(calls, [
        'save',
        'sessionsChanged',
        ['overwrite', 'b'],
        'sessionsChanged',
        ['duplicate', 'b'],
        'sessionsChanged',
        ['removeGroup', 'b', 'g1'],
        'groupsChanged',
        'sessionsChanged',
        ['moveGroup', 'b', 'g1'],
        'groupsChanged',
        'sessionsChanged',
        'sessionsChanged',
    ]);
    assert.deepEqual(notices, [
        'removed Beta from Group 1',
        'added Beta to Group 1',
    ]);
    assert.deepEqual(actionCalls, [
        ['rename', 'b'],
        ['history', 'b'],
    ]);
});

test('session context action builder preserves delete confirmation options', async function () {
    const calls = [];
    const actionCalls = [];
    const actions = loadSessionContextActions({ actionCalls });
    const plugin = createPlugin(calls);
    const session = { id: 'a', name: 'Alpha' };

    const menuOptions = actions.createSessionContextMenuOptions({
        plugin: plugin,
        session: session,
        isActive: true,
        forceDeleteConfirm: true,
        notifyDeleted: false,
        deleteConfirmMessage: 'custom delete',
        onSessionsChanged: function () {
            calls.push('sessionsChanged');
        },
    });

    await menuOptions.onDelete();

    assert.deepEqual(actionCalls, [
        ['delete', 'a', true, 'custom delete', false],
    ]);
    assert.deepEqual(calls, ['sessionsChanged']);
});

test('openSessionContextMenu delegates generated options to the menu renderer', function () {
    const menuOpens = [];
    const actions = loadSessionContextActions({ menuOpens });
    const plugin = createPlugin([]);
    const session = { id: 'b', name: 'Beta' };

    actions.openSessionContextMenu({
        plugin: plugin,
        session: session,
        event: { type: 'contextmenu' },
        showSwitch: true,
    });

    assert.equal(menuOpens.length, 1);
    assert.equal(menuOpens[0].session, session);
    assert.equal(menuOpens[0].showSwitch, true);
});
