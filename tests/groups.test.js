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
