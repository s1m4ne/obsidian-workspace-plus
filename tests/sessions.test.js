'use strict';

require('./lock/harness/index.ts').installObsidianStub();

const test = require('node:test');
const assert = require('node:assert/strict');

const attachSessionMethods = require('../src/plugin/methods/sessions');

function createPlugin(initialData) {
    function PluginMock() {}
    attachSessionMethods(PluginMock);
    const plugin = new PluginMock();
    plugin.data = Object.assign({
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
    plugin.persistCalls = 0;
    plugin.commandSyncs = 0;
    plugin.persistData = function () {
        plugin.persistCalls += 1;
        return Promise.resolve(true);
    };
    plugin.syncSessionCommands = function () {
        plugin.commandSyncs += 1;
    };
    plugin.isGroupFeatureEnabled = function () {
        return plugin.data.groupFeatureEnabled !== false;
    };
    plugin.app = {
        workspace: {
            getLayout: function () {
                return { current: true };
            },
        },
    };
    return plugin;
}

test('sessions: syncSessionOrder sorts default to top and removes orphans', function () {
    const plugin = createPlugin({
        sessions: {
            s1: { id: 's1', name: 'Work' },
            s2: { id: 's2', name: 'Home' },
            sDef: { id: 'sDef', name: 'Default', isDefault: true },
        },
        sessionOrder: ['s1', 'orphan', 's2'],
    });

    plugin.syncSessionOrder();

    assert.equal(plugin.data.sessionOrder[0], 'sDef');
    assert.ok(plugin.data.sessionOrder.includes('s1'));
    assert.ok(plugin.data.sessionOrder.includes('s2'));
    assert.ok(!plugin.data.sessionOrder.includes('orphan'));
});

test('sessions: ordering and group filtering', function () {
    const plugin = createPlugin();

    const unfiltered = plugin.getOrderedSessionsUnfiltered();
    assert.equal(unfiltered.length, 2);

    const forGroup = plugin.getOrderedSessionsForGroup('g1');
    assert.equal(forGroup.length, 1);
    assert.equal(forGroup[0].id, 's1');

    const activeOrdered = plugin.getOrderedSessions();
    assert.equal(activeOrdered.length, 1);
    assert.equal(activeOrdered[0].id, 's1');

    plugin.data.groupFeatureEnabled = false;
    assert.equal(plugin.getOrderedSessions().length, 2);
});

test('sessions: mergeVisibleSessionOrder and setSessionOrderFromVisible', async function () {
    const plugin = createPlugin({
        sessionOrder: ['s1', 's2', 'sDefault'],
    });

    const merged = plugin.mergeVisibleSessionOrder(['s2', 's1']);
    assert.deepEqual(merged, ['s2', 's1', 'sDefault']);

    const changed = await plugin.setSessionOrderFromVisible(['s2', 's1']);
    assert.equal(changed, true);
    assert.deepEqual(plugin.data.sessionOrder, ['s2', 's1', 'sDefault']);
    assert.equal(plugin.commandSyncs, 1);
    assert.equal(plugin.persistCalls, 1);
});

test('sessions: index and active session queries (P9 & P10)', function () {
    const plugin = createPlugin();
    const list = plugin.getOrderedSessionsUnfiltered();

    assert.equal(plugin.findSessionIndex(list, 's1'), 0);
    assert.equal(plugin.findSessionIndex(list, 'nonexistent'), -1);

    assert.equal(plugin.findActiveSessionIndex(list), 0);
    plugin.data.activeSessionId = 'nonexistent';
    assert.equal(plugin.findActiveSessionIndex(list), -1);

    plugin.data.activeSessionId = 's1';
    assert.equal(plugin.getActiveSession().name, 'Work');
    plugin.data.activeSessionId = null;
    assert.equal(plugin.getActiveSession(), null);
});

test('sessions: layout utilities delegation', function () {
    const plugin = createPlugin();

    const layout = plugin.getCurrentWorkspaceLayout();
    assert.deepEqual(layout, { current: true });

    const serialized = plugin.serializeLayout({ a: 1 });
    assert.ok(typeof serialized === 'string');

    assert.equal(plugin.layoutsEqual({ a: 1 }, { a: 1 }), true);
    assert.equal(plugin.layoutsEqual({ a: 1 }, { a: 2 }), false);

    assert.equal(plugin.layoutsEqualStructural({ a: 1 }, { a: 1 }), true);
});
