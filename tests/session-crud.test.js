'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');

const i18n = require('../src/i18n');

i18n.resolveLocale('en');

function loadSessionCrudMethods() {
    const obsidianStub = {
        Modal: class {},
        Notice: class {
            constructor(_message) {}
        },
        setIcon: function () {},
        setTooltip: function () {},
    };
    const originalLoad = Module._load;
    Module._load = function (request, parent, isMain) {
        if (request === 'obsidian') return obsidianStub;
        return originalLoad(request, parent, isMain);
    };

    try {
        return require('../src/plugin/methods/session-crud');
    } finally {
        Module._load = originalLoad;
    }
}

const attachSessionCrudMethods = loadSessionCrudMethods();
const attachLayoutRestoreMethods = require('../src/plugin/methods/layout-restore');

function createPlugin(initialData) {
    function PluginMock() {}
    attachLayoutRestoreMethods(PluginMock);
    attachSessionCrudMethods(PluginMock);
    const plugin = new PluginMock();
    plugin.data = Object.assign({
        activeSessionId: 'a',
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'a' }, modified: 1 },
            b: { id: 'b', name: 'B', layout: { layout: 'b' }, modified: 1 },
        },
        sessionOrder: ['a', 'b'],
        sessionGroups: {},
        groups: {},
        groupOrder: [],
        activeGroupId: null,
    }, initialData || {});
    plugin.persistCalls = 0;
    plugin.statusBarUpdates = 0;
    plugin.commandSyncs = 0;
    plugin.attachedSessions = [];
    plugin.detachedLeaves = 0;
    plugin.getCurrentWorkspaceLayout = function () {
        return { layout: 'current' };
    };
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
    plugin.attachSessionToActiveGroup = function (sessionId) {
        plugin.attachedSessions.push(sessionId);
    };
    plugin.captureActiveSessionLayoutIfAutoSave = function () {};
    plugin.hideSwitchOverlay = function () {};
    plugin.app = {
        workspace: {
            changeLayout: function () {
                return Promise.resolve(true);
            },
            iterateRootLeaves: function (callback) {
                callback({ detach: function () { plugin.detachedLeaves += 1; } });
                callback({ detach: function () { plugin.detachedLeaves += 1; } });
            },
        },
    };
    return plugin;
}

test('session crud creates and activates a new session', async function () {
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

test('session crud duplicates an arbitrary session without switching', async function () {
    const plugin = createPlugin({
        sessionGroups: {
            b: ['g1', 'g2'],
        },
    });

    await plugin.duplicateSession('b');

    assert.equal(plugin.data.activeSessionId, 'a');
    assert.equal(plugin.data.sessionOrder.length, 3);
    const newId = plugin.data.sessionOrder[2];
    assert.notEqual(newId, 'b');
    assert.deepEqual(plugin.data.sessions[newId].layout, { layout: 'b' });
    assert.notEqual(plugin.data.sessions[newId].layout, plugin.data.sessions.b.layout);
    assert.deepEqual(plugin.data.sessionGroups[newId], ['g1', 'g2']);
    assert.equal(plugin.commandSyncs, 1);
    assert.equal(plugin.persistCalls, 1);
});

test('session crud resets sessions and group state to default', async function () {
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

test('session crud creates an empty session by detaching root leaves', async function () {
    const plugin = createPlugin();

    await plugin.createEmptySession();

    assert.equal(plugin.detachedLeaves, 2);
    assert.equal(plugin.data.sessions[plugin.data.activeSessionId].name, 'New session 1');
    assert.deepEqual(plugin.data.sessions[plugin.data.activeSessionId].layout, { layout: 'current' });
    assert.equal(plugin.persistCalls, 1);
});
