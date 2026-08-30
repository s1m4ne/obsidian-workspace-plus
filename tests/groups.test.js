'use strict';

require('./lock/harness/index.ts').installObsidianStub();

const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');

function loadGroupMethods() {
    const obsidianStub = {
        Notice: class {
            constructor(_message) {}
        },
    };
    const originalLoad = Module._load;
    Module._load = function (request, parent, isMain) {
        if (request === 'obsidian') return obsidianStub;
        return originalLoad(request, parent, isMain);
    };

    try {
        return require('../src/plugin/methods/groups');
    } finally {
        Module._load = originalLoad;
    }
}

const attachGroupMethods = loadGroupMethods();

function createPlugin(initialData) {
    function PluginMock() {}
    attachGroupMethods(PluginMock);
    const plugin = new PluginMock();
    plugin.data = Object.assign({
        activeGroupId: null,
        groupFeatureEnabled: true,
        groups: {},
        groupOrder: [],
        sessionGroups: {},
        sessions: {},
        sessionOrder: [],
    }, initialData || {});
    plugin.persistCalls = 0;
    plugin.commandSyncs = 0;
    plugin.statusBarUpdates = 0;
    plugin.switchOverlayHides = 0;
    plugin.searchOverlayHides = 0;
    plugin.persistData = function () {
        plugin.persistCalls += 1;
        return Promise.resolve(true);
    };
    plugin.syncSessionCommands = function () {
        plugin.commandSyncs += 1;
    };
    plugin.updateStatusBar = function () {
        plugin.statusBarUpdates += 1;
    };
    plugin.hideSwitchOverlay = function () {
        plugin.switchOverlayHides += 1;
    };
    plugin.hideSearchOverlay = function () {
        plugin.searchOverlayHides += 1;
    };
    plugin.getOrderedSessionsUnfiltered = function () {
        const sessions = plugin.data.sessions;
        return plugin.data.sessionOrder.map(function (id) {
            return sessions[id];
        }).filter(Boolean);
    };
    plugin.getOrderedSessionsForGroup = function (groupId) {
        const all = plugin.getOrderedSessionsUnfiltered();
        if (!groupId) return all;
        return all.filter(function (session) {
            const groups = plugin.data.sessionGroups[session.id];
            return groups && groups.includes(groupId);
        });
    };
    plugin.switchSession = function () {
        return Promise.resolve(false);
    };
    return plugin;
}

test('group methods normalize tab order around existing groups', function () {
    const plugin = createPlugin({
        groups: {
            g1: { id: 'g1', name: 'One' },
            g2: { id: 'g2', name: 'Two' },
        },
    });

    const order = plugin.normalizeGroupTabOrder(['g2', 'missing', '__all__', 'g2']);

    assert.deepEqual(order, ['g2', '__all__', 'g1']);
});

test('group methods disabling feature clears active group and hides open views', async function () {
    const plugin = createPlugin({
        activeGroupId: 'g1',
        groups: {
            g1: { id: 'g1', name: 'One' },
        },
    });

    const changed = await plugin.setGroupFeatureEnabled(false);

    assert.equal(changed, true);
    assert.equal(plugin.data.groupFeatureEnabled, false);
    assert.equal(plugin.data.activeGroupId, null);
    assert.equal(plugin.switchOverlayHides, 1);
    assert.equal(plugin.searchOverlayHides, 1);
    assert.equal(plugin.commandSyncs, 1);
    assert.equal(plugin.statusBarUpdates, 1);
    assert.equal(plugin.persistCalls, 1);
});

test('group methods attach new sessions to active group without duplicates', function () {
    const plugin = createPlugin({
        activeGroupId: 'g1',
        groups: {
            g1: { id: 'g1', name: 'One' },
        },
        sessionGroups: {
            s1: ['g1'],
        },
    });

    plugin.attachSessionToActiveGroup('s1');
    plugin.attachSessionToActiveGroup('s2');

    assert.deepEqual(plugin.data.sessionGroups.s1, ['g1']);
    assert.deepEqual(plugin.data.sessionGroups.s2, ['g1']);
});

test('group methods move a session to one group exclusively', async function () {
    const plugin = createPlugin({
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

    const moved = await plugin.moveSessionToGroupExclusive('s1', 'g2', { persist: false });

    assert.equal(moved, true);
    assert.deepEqual(plugin.data.sessionGroups.s1, ['g2']);
    assert.equal(plugin.commandSyncs, 1);
    assert.equal(plugin.persistCalls, 0);
});

test('group methods: lifecycle, CRUD, switching, and membership management', async function () {
    const plugin = createPlugin({
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
    plugin.normalizeGroupFeatureState();
    assert.equal(plugin.data.activeGroupId, 'g1');
    plugin.data.groupFeatureEnabled = false;
    plugin.normalizeGroupFeatureState();
    assert.equal(plugin.data.activeGroupId, null);
    plugin.data.groupFeatureEnabled = true;
    plugin.data.activeGroupId = 'g1';

    // getOrderedGroups and getOrderedGroupTabIds
    const ordered = plugin.getOrderedGroups();
    assert.equal(ordered.length, 2);
    assert.equal(ordered[0].id, 'g1');
    const tabIds = plugin.getOrderedGroupTabIds();
    assert.deepEqual(tabIds, ['__all__', 'g1', 'g2']);

    // setGroupTabOrder
    await plugin.setGroupTabOrder(['__all__', 'g2', 'g1']);
    assert.deepEqual(plugin.data.groupOrder, ['__all__', 'g2', 'g1']);

    // getActiveGroup
    const activeGroup = plugin.getActiveGroup();
    assert.equal(activeGroup.id, 'g1');

    // createGroup
    const newGid = await plugin.createGroup('Three');
    assert.ok(plugin.data.groups[newGid]);
    assert.equal(plugin.data.groups[newGid].name, 'Three');

    // renameGroup
    await plugin.renameGroup(newGid, 'Three Renamed');
    assert.equal(plugin.data.groups[newGid].name, 'Three Renamed');

    // deleteGroup
    await plugin.deleteGroup(newGid);
    assert.equal(plugin.data.groups[newGid], undefined);

    // addSessionToGroup and removeSessionFromGroup
    await plugin.addSessionToGroup('s2', 'g1');
    assert.ok(plugin.data.sessionGroups.s2.includes('g1'));
    await plugin.removeSessionFromGroup('s2', 'g1');
    assert.ok(!plugin.data.sessionGroups.s2.includes('g1'));

    // getGroupSessionIds
    const g1Sessions = plugin.getGroupSessionIds('g1');
    assert.deepEqual(g1Sessions, ['s1']);

    // setActiveGroup and exitGroup
    let switchCalledWith = null;
    plugin.switchSession = function (id) {
        switchCalledWith = id;
        plugin.data.activeSessionId = id;
        return Promise.resolve(true);
    };
    await plugin.setActiveGroup('g2');
    assert.equal(plugin.data.activeGroupId, 'g2');
    assert.equal(switchCalledWith, 's2');

    await plugin.exitGroup();
    assert.equal(plugin.data.activeGroupId, null);

    // getRelativeGroupId and switchGroupRelative
    const nextGid = plugin.getRelativeGroupId('g2', 1);
    assert.equal(nextGid, 'g1'); // since order is [__all__, g2, g1]
    await plugin.switchGroupRelative(1);
    assert.equal(plugin.data.activeGroupId, 'g2');

    // resolveGroupSelection
    const selection = await plugin.resolveGroupSelection('g1');
    assert.equal(selection.switched, true);
    assert.equal(selection.resolvedGroupId, 'g1');

    // removeAllSessionsFromGroup
    await plugin.removeAllSessionsFromGroup('g1');
    assert.equal(plugin.getGroupSessionIds('g1').length, 0);

    // clearAllGroups
    await plugin.clearAllGroups();
    assert.deepEqual(plugin.data.groups, {});
    assert.deepEqual(plugin.data.sessionGroups, {});
    assert.equal(plugin.data.activeGroupId, null);
});
