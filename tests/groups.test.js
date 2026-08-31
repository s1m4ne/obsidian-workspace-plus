'use strict';

require('./lock/harness/index.ts').installObsidianStub();

const test = require('node:test');
const assert = require('node:assert/strict');
const { GroupStore } = require('../src/state/group-store.ts');

function createStore(initialData) {
    const data = Object.assign({
        activeGroupId: null,
        groupFeatureEnabled: true,
        groups: {},
        groupOrder: [],
        sessionGroups: {},
        sessions: {},
        sessionOrder: [],
    }, initialData || {});
    const events = { persistCalls: 0, commandSyncs: 0, statusBarUpdates: 0, switchOverlayHides: 0, searchOverlayHides: 0 };
    let switchSession = () => Promise.resolve(false);
    const orderedSessions = () => data.sessionOrder.map((id) => data.sessions[id]).filter(Boolean);
    const store = new GroupStore({
        data,
        settingsState: { get groupFeatureEnabled() { return data.groupFeatureEnabled !== false; } },
        persistData: function () {
        events.persistCalls += 1;
        return Promise.resolve(true);
        },
        switchSession: (id) => switchSession(id),
        getOrderedSessionsUnfiltered: orderedSessions,
        getOrderedSessionsForGroup: (groupId) => groupId ? orderedSessions().filter((session) => data.sessionGroups[session.id]?.includes(groupId)) : orderedSessions(),
        syncSessionCommands: () => { events.commandSyncs += 1; },
        updateStatusBar: () => { events.statusBarUpdates += 1; },
        hideSwitchOverlay: () => { events.switchOverlayHides += 1; },
        hideSearchOverlay: () => { events.searchOverlayHides += 1; },
    });
    return { store, data, events, setSwitchSession: (callback) => { switchSession = callback; } };
}

test('group methods normalize tab order around existing groups', function () {
    const { store } = createStore({
        groups: {
            g1: { id: 'g1', name: 'One' },
            g2: { id: 'g2', name: 'Two' },
        },
    });

    const order = store.normalizeGroupTabOrder(['g2', 'missing', '__all__', 'g2']);

    assert.deepEqual(order, ['g2', '__all__', 'g1']);
});

test('group methods disabling feature clears active group and hides open views', async function () {
    const { store, data, events } = createStore({
        activeGroupId: 'g1',
        groups: {
            g1: { id: 'g1', name: 'One' },
        },
    });

    const changed = await store.setGroupFeatureEnabled(false);

    assert.equal(changed, true);
    assert.equal(data.groupFeatureEnabled, false);
    assert.equal(data.activeGroupId, null);
    assert.equal(events.switchOverlayHides, 1);
    assert.equal(events.searchOverlayHides, 1);
    assert.equal(events.commandSyncs, 1);
    assert.equal(events.statusBarUpdates, 1);
    assert.equal(events.persistCalls, 1);
});

test('group methods attach new sessions to active group without duplicates', function () {
    const { store, data } = createStore({
        activeGroupId: 'g1',
        groups: {
            g1: { id: 'g1', name: 'One' },
        },
        sessionGroups: {
            s1: ['g1'],
        },
    });

    store.attachSessionToActiveGroup('s1');
    store.attachSessionToActiveGroup('s2');

    assert.deepEqual(data.sessionGroups.s1, ['g1']);
    assert.deepEqual(data.sessionGroups.s2, ['g1']);
});

test('group methods move a session to one group exclusively', async function () {
    const { store, data, events } = createStore({
        groups: {
            g1: { id: 'g1', name: 'One' },
            g2: { id: 'g2', name: 'Two' },
        },
        sessions: {
            s1: { id: 's1', name: 'Session' },
        },
        sessionGroups: {
            s1: ['g1'],
        },
    });

    const moved = await store.moveSessionToGroupExclusive('s1', 'g2', { persist: false });

    assert.equal(moved, true);
    assert.deepEqual(data.sessionGroups.s1, ['g2']);
    assert.equal(events.commandSyncs, 1);
    assert.equal(events.persistCalls, 0);
});

test('group methods: lifecycle, CRUD, switching, and membership management', async function () {
    const { store, data, setSwitchSession } = createStore({
        activeGroupId: 'g1',
        groupFeatureEnabled: true,
        groups: {
            g1: { id: 'g1', name: 'One' },
            g2: { id: 'g2', name: 'Two' },
        },
        groupOrder: ['__all__', 'g1', 'g2'],
        sessionGroups: {
            s1: ['g1'],
            s2: ['g2'],
        },
        sessions: {
            s1: { id: 's1', name: 'Session 1' },
            s2: { id: 's2', name: 'Session 2' },
        },
        sessionOrder: ['s1', 's2'],
        activeSessionId: 's1',
    });

    // normalizeGroupFeatureState
    store.normalizeGroupFeatureState();
    assert.equal(data.activeGroupId, 'g1');
    data.groupFeatureEnabled = false;
    store.normalizeGroupFeatureState();
    assert.equal(data.activeGroupId, null);
    data.groupFeatureEnabled = true;
    data.activeGroupId = 'g1';

    // getOrderedGroups and getOrderedGroupTabIds
    const ordered = store.getOrderedGroups();
    assert.equal(ordered.length, 2);
    assert.equal(ordered[0].id, 'g1');
    const tabIds = store.getOrderedGroupTabIds();
    assert.deepEqual(tabIds, ['__all__', 'g1', 'g2']);

    // setGroupTabOrder
    await store.setGroupTabOrder(['__all__', 'g2', 'g1']);
    assert.deepEqual(data.groupOrder, ['__all__', 'g2', 'g1']);

    // getActiveGroup
    const activeGroup = store.getActiveGroup();
    assert.equal(activeGroup.id, 'g1');

    // createGroup
    const newGid = await store.createGroup('Three');
    assert.ok(data.groups[newGid]);
    assert.equal(data.groups[newGid].name, 'Three');

    // renameGroup
    await store.renameGroup(newGid, 'Three Renamed');
    assert.equal(data.groups[newGid].name, 'Three Renamed');

    // deleteGroup
    await store.deleteGroup(newGid);
    assert.equal(data.groups[newGid], undefined);

    // addSessionToGroup and removeSessionFromGroup
    await store.addSessionToGroup('s2', 'g1');
    assert.ok(data.sessionGroups.s2.includes('g1'));
    await store.removeSessionFromGroup('s2', 'g1');
    assert.ok(!data.sessionGroups.s2.includes('g1'));

    // getGroupSessionIds
    const g1Sessions = store.getGroupSessionIds('g1');
    assert.deepEqual(g1Sessions, ['s1']);

    // setActiveGroup and exitGroup
    let switchCalledWith = null;
    setSwitchSession(function (id) {
        switchCalledWith = id;
        data.activeSessionId = id;
        return Promise.resolve(true);
    });
    await store.setActiveGroup('g2');
    assert.equal(data.activeGroupId, 'g2');
    assert.equal(switchCalledWith, 's2');

    await store.exitGroup();
    assert.equal(data.activeGroupId, null);

    // getRelativeGroupId and switchGroupRelative
    const nextGid = store.getRelativeGroupId('g2', 1);
    assert.equal(nextGid, 'g1'); // since order is [__all__, g2, g1]
    await store.switchGroupRelative(1);
    assert.equal(data.activeGroupId, 'g2');

    // resolveGroupSelection
    const selection = await store.resolveGroupSelection('g1');
    assert.equal(selection.switched, true);
    assert.equal(selection.resolvedGroupId, 'g1');

    // removeAllSessionsFromGroup
    await store.removeAllSessionsFromGroup('g1');
    assert.equal(store.getGroupSessionIds('g1').length, 0);

    // clearAllGroups
    await store.clearAllGroups();
    assert.deepEqual(data.groups, {});
    assert.deepEqual(data.sessionGroups, {});
    assert.equal(data.activeGroupId, null);
});
