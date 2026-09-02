'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { setupHarness } = require('./lock/harness/index.ts');

const harness = setupHarness();
const actions = require('../src/session-context-actions.ts');
const { L } = require('../src/i18n.ts');

function resetHarness() {
    harness.dom.document.querySelectorAll('.modal-container').forEach((el) => el.remove());
    harness.obsidian.notices.length = 0;
    harness.obsidian.menus.length = 0;
}

async function flushPromises() {
    await Promise.resolve();
    await Promise.resolve();
}

function createPlugin(calls, overrides = {}) {
    return Object.assign({
        app: {},
        data: {
            activeSessionId: 'a',
            confirmDeleteByHotkey: true,
            sessions: {
                a: { id: 'a', name: 'Alpha', layout: {} },
                b: { id: 'b', name: 'Beta', layout: {} },
            },
            groups: {
                g1: { id: 'g1', name: 'Group 1' },
            },
        },
        // Group calls go through plugin.getGroupStore() now. This double records
        // the group methods itself, so it is its own group store and every
        // assertion below still names the same calls.
        getGroupStore() { return this; },
        isGroupFeatureEnabled() {
            return true;
        },
        getOrderedGroups() {
            return [{ id: 'g1', name: 'Group 1' }];
        },
        // Saving goes through plugin.getSessionSaver(). This double records the
        // save methods itself, so it stands in as its own saver.
        getSessionSaver() { return this; },
        isAutoSaveOnSwitchEnabled() {
            return true;
        },
        // Version history goes through getHistoryService(); this double carries those members itself.
        getHistoryService() { return this; },
        isVersionHistoryEnabled() {
            return true;
        },
        isVersionHistoryConfirmRestoreEnabled() {
            return false;
        },
        extractFilePathsFromLayout() {
            return [];
        },
        countPanesInLayout() {
            return 0;
        },
        restoreFromHistoryEntry() {
            return Promise.resolve(true);
        },
        saveActiveSession() {
            calls.push('save');
            return Promise.resolve(true);
        },
        reloadCurrentSessionWithoutSaving() {
            calls.push('reload');
            return Promise.resolve(true);
        },
        saveAsSession() {
            calls.push('saveAs');
            return Promise.resolve(true);
        },
        confirmOverwriteSessionWithCurrentLayout(sessionId, options) {
            calls.push(['overwrite', sessionId]);
            if (options && options.onSaved) options.onSaved();
            return true;
        },
        renameSessionById(sessionId, name) {
            calls.push(['rename', sessionId, name]);
            return Promise.resolve(true);
        },
        // Session state goes through getSessionStore(); this double carries those members itself.
        getSessionStore() {
            // The double still carries the store members; these five are the
            // ones P1's contract stage moved onto the owners, answered from
            // this fixture's own data.
            const data = this.data;
            return Object.assign(Object.create(this), {
                getActiveSessionId() { return data.activeSessionId ?? null; },
                getSessionCount() { return Object.keys(data.sessions || {}).length; },
                getActiveGroupId() { return data.activeGroupId ?? null; },
                findGroup(id) { return id ? (data.groups || {})[id] || null : null; },
                getGroupMap() { return data.groups || {}; },
            });
        },
        // P1's contract stage: the code under test asks the owners for these
        // rather than reading `data` itself. Answered from this double's own
        // data so a test that changes it still steers the path.
        getActiveSessionId() { return this.data.activeSessionId ?? null; },
        getSessionCount() { return Object.keys(this.data.sessions || {}).length; },
        getActiveGroupId() { return this.data.activeGroupId ?? null; },
        findGroup(id) { return id ? (this.data.groups || {})[id] || null : null; },
        getGroupMap() { return this.data.groups || {}; },
        duplicateSession(sessionId) {
            calls.push(['duplicate', sessionId]);
            return Promise.resolve(true);
        },
        deleteSession(sessionId) {
            calls.push(['delete', sessionId]);
            return Promise.resolve(true);
        },
        removeSessionFromGroup(sessionId, groupId) {
            calls.push(['removeGroup', sessionId, groupId]);
            return Promise.resolve(true);
        },
        moveSessionToGroupExclusive(sessionId, groupId) {
            calls.push(['moveGroup', sessionId, groupId]);
            return Promise.resolve(true);
        },
    }, overrides);
}

test('session context action builder wires shared defaults and refresh callbacks', async () => {
    resetHarness();
    const calls = [];
    const plugin = createPlugin(calls);
    const session = { id: 'b', name: 'Beta', layout: {} };

    const menuOptions = actions.createSessionContextMenuOptions({
        plugin,
        session,
        getViewGroupId() {
            return 'g1';
        },
        onGroupsChanged() {
            calls.push('groupsChanged');
        },
        onSessionsChanged() {
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
    const input = harness.dom.document.querySelector('.wpp-rename-input');
    assert.ok(input);
    input.value = 'Renamed';
    const rename = harness.dom.document.querySelector('.wpp-confirm-buttons .mod-cta');
    assert.ok(rename);
    rename.click();
    await flushPromises();
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
        ['rename', 'b', 'Renamed'],
        'sessionsChanged',
    ]);
    assert.deepEqual(
        harness.obsidian.notices.map((notice) => notice.message),
        [
            L.groupRemovedSession(session.name, 'Group 1'),
            L.groupAddedSession(session.name, 'Group 1'),
        ]
    );
    assert.ok(harness.dom.document.querySelector('.wpp-history-empty'));
});

test('session context action builder preserves delete confirmation options', async () => {
    resetHarness();
    const calls = [];
    // confirm-on-hotkey is off, so forceDeleteConfirm is the only thing that can
    // put the dialog on screen. With it on, this test passes whether or not the
    // option is carried through at all.
    const plugin = createPlugin(calls, { data: Object.assign(createPlugin([]).data, { confirmDeleteByHotkey: false }) });
    const session = { id: 'a', name: 'Alpha', layout: {} };

    const menuOptions = actions.createSessionContextMenuOptions({
        plugin,
        session,
        isActive: true,
        forceDeleteConfirm: true,
        notifyDeleted: false,
        deleteConfirmMessage: 'custom delete',
        onSessionsChanged() {
            calls.push('sessionsChanged');
        },
    });

    await menuOptions.onDelete();
    assert.equal(harness.dom.document.querySelector('.modal-container p')?.textContent, 'custom delete');
    assert.deepEqual(calls, []);
    const confirm = harness.dom.document.querySelector('.wpp-confirm-buttons .mod-warning');
    assert.ok(confirm);
    confirm.click();
    await flushPromises();

    assert.deepEqual(calls, [['delete', 'a'], 'sessionsChanged']);
});

test('openSessionContextMenu delegates generated options to the menu renderer', () => {
    resetHarness();
    const plugin = createPlugin([]);
    const session = { id: 'b', name: 'Beta', layout: {} };

    actions.openSessionContextMenu({
        plugin,
        session,
        event: { type: 'contextmenu' },
        showSwitch: true,
    });

    assert.equal(harness.obsidian.menus.length, 1);
    assert.ok(harness.obsidian.menus[0].item(L.contextSwitchSession));
});

test('the switch item is offered only when the caller asks for it', () => {
    resetHarness();
    const plugin = createPlugin([]);
    const session = { id: 'b', name: 'Beta', layout: {} };

    // The session manager modal wants it; the status bar menu, which is already
    // on the active session, does not.
    actions.openSessionContextMenu({ plugin, session, event: { type: 'contextmenu' } });
    assert.equal(harness.obsidian.menus.length, 1);
    assert.equal(
        harness.obsidian.menus[0].item(L.contextSwitchSession),
        undefined,
        'no switch entry unless showSwitch was passed',
    );

    actions.openSessionContextMenu({ plugin, session, event: { type: 'contextmenu' }, showSwitch: true });
    assert.ok(harness.obsidian.menus[1].item(L.contextSwitchSession));
});

test('a group move the plugin refuses is not announced as done', async () => {
    resetHarness();
    const calls = [];
    const plugin = createPlugin(calls, {
        moveSessionToGroupExclusive(sessionId, groupId) {
            calls.push(['moveGroup', sessionId, groupId]);
            return Promise.resolve(false);
        },
    });

    const menuOptions = actions.createSessionContextMenuOptions({
        plugin,
        session: { id: 'b', name: 'Beta', layout: {} },
        onGroupsChanged() { calls.push('groupsChanged'); },
        onSessionsChanged() { calls.push('sessionsChanged'); },
    });

    const moved = await menuOptions.onMoveToGroup('g1');

    assert.equal(moved, false);
    assert.deepEqual(calls, [['moveGroup', 'b', 'g1']], 'no refresh follows a move that did not happen');
    assert.deepEqual(harness.obsidian.notices, [], 'and the user is not told it worked');
});

test.after(() => harness.restore());
