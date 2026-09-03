'use strict';

require('./lock/harness/index.ts').installObsidianStub();

const test = require('node:test');
const assert = require('node:assert/strict');

const { SessionStore } = require('../src/state/session-store.ts');

function createStore(initialData) {
    const data = Object.assign({
        activeSessionId: 's1',
        sessions: {
            s1: { id: 's1', name: 'Work', layout: { a: 1 } },
            s2: { id: 's2', name: 'Home', layout: { b: 2 } },
            sDefault: { id: 'sDefault', name: 'Default', layout: {}, isDefault: true },
        },
        sessionOrder: ['s1', 's2'],
        sessionGroups: {
            s1: ['g1'],
        },
        activeGroupId: 'g1',
        groupFeatureEnabled: true,
    }, initialData || {});
    const events = { persistCalls: 0, commandSyncs: 0 };
    const store = new SessionStore({
        data,
        groupStore: { isGroupFeatureEnabled: () => data.groupFeatureEnabled !== false },
        persistData: function () {
        events.persistCalls += 1;
        return Promise.resolve(true);
        },
        syncSessionCommands: function () { events.commandSyncs += 1; },
        getCurrentWorkspaceLayout: function () { return { current: true }; },
        moveSessionToGroupExclusive: async () => true,
        resolveGroupSelection: async (groupId) => ({ resolvedGroupId: groupId }),
        attachSessionToActiveGroup: function () {},
        applyWorkspaceLayout: async () => true,
        getWorkspaceRestoreScope: () => 'full',
    });
    return { store, data, events };
}

test('sessions: syncSessionOrder sorts default to top and removes orphans', function () {
    const { store, data } = createStore({
        sessions: {
            s1: { id: 's1', name: 'Work' },
            s2: { id: 's2', name: 'Home' },
            sDef: { id: 'sDef', name: 'Default', isDefault: true },
        },
        sessionOrder: ['s1', 'orphan', 's2'],
    });

    store.syncSessionOrder();

    assert.equal(data.sessionOrder[0], 'sDef');
    assert.ok(data.sessionOrder.includes('s1'));
    assert.ok(data.sessionOrder.includes('s2'));
    assert.ok(!data.sessionOrder.includes('orphan'));
});

test('sessions: ordering and group filtering', function () {
    const { store, data } = createStore();

    const unfiltered = store.getOrderedSessionsUnfiltered();
    assert.equal(unfiltered.length, 2);

    const forGroup = store.getOrderedSessionsForGroup('g1');
    assert.equal(forGroup.length, 1);
    assert.equal(forGroup[0].id, 's1');

    const activeOrdered = store.getOrderedSessions();
    assert.equal(activeOrdered.length, 1);
    assert.equal(activeOrdered[0].id, 's1');

    data.groupFeatureEnabled = false;
    assert.equal(store.getOrderedSessions().length, 2);
});

test('sessions: mergeVisibleSessionOrder and setSessionOrderFromVisible', async function () {
    const { store, data, events } = createStore({
        sessionOrder: ['s1', 's2', 'sDefault'],
    });

    const merged = store.mergeVisibleSessionOrder(['s2', 's1']);
    assert.deepEqual(merged, ['s2', 's1', 'sDefault']);

    const changed = await store.setSessionOrderFromVisible(['s2', 's1']);
    assert.equal(changed, true);
    assert.deepEqual(data.sessionOrder, ['s2', 's1', 'sDefault']);
    assert.equal(events.commandSyncs, 1);
    assert.equal(events.persistCalls, 1);
});

test('sessions: index and active session queries (P9 & P10)', function () {
    const { store, data } = createStore();
    const list = store.getOrderedSessionsUnfiltered();

    assert.equal(store.findSessionIndex(list, 's1'), 0);
    assert.equal(store.findSessionIndex(list, 'nonexistent'), -1);

    assert.equal(store.findActiveSessionIndex(list), 0);
    data.activeSessionId = 'nonexistent';
    assert.equal(store.findActiveSessionIndex(list), -1);

    data.activeSessionId = 's1';
    assert.equal(store.getActiveSession().name, 'Work');
    data.activeSessionId = null;
    assert.equal(store.getActiveSession(), null);
});

test('sessions: layout utilities delegation', function () {
    const { store } = createStore();

    const layout = store.getCurrentWorkspaceLayout();
    assert.deepEqual(layout, { current: true });

    assert.equal(store.layoutsEqualStructural({ a: 1 }, { a: 1 }), true);
});
