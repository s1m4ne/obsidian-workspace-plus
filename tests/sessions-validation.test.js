'use strict';

require('./lock/harness/index.ts').installObsidianStub();

const test = require('node:test');
const assert = require('node:assert/strict');

const attachSessionValidationMethods = require('../src/plugin/methods/sessions-validation');

function createPlugin(initialData) {
    function PluginMock() {}
    attachSessionValidationMethods(PluginMock);
    const plugin = new PluginMock();
    plugin.data = Object.assign({
        activeSessionId: 's1',
        sessions: {
            s1: { id: 's1', name: 'Work', modified: 1 },
            s2: { id: 's2', name: 'Home', modified: 1 },
        },
        sessionOrder: ['s1', 's2'],
        groups: {
            g1: { id: 'g1', name: 'Group 1' },
        },
        groupOrder: ['__all__', 'g1'],
        sessionGroups: {},
        activeGroupId: 'g1',
        groupFeatureEnabled: true,
    }, initialData || {});
    plugin.persistCalls = 0;
    plugin.statusBarUpdates = 0;
    plugin.commandSyncs = 0;
    plugin.persistData = function () {
        plugin.persistCalls += 1;
        return Promise.resolve(true);
    };
    plugin.updateStatusBar = function () {
        plugin.statusBarUpdates += 1;
    };
    plugin.syncSessionCommands = function () {
        plugin.commandSyncs += 1;
    };
    plugin.isGroupFeatureEnabled = function () {
        return plugin.data.groupFeatureEnabled !== false;
    };
    plugin.getNextSessionName = function () {
        return 'Auto Session 3';
    };
    plugin.createSession = function (name) {
        const id = 'new-' + name;
        plugin.data.sessions[id] = { id: id, name: name };
        plugin.data.activeSessionId = id;
        return Promise.resolve(true);
    };
    plugin.moveSessionToGroupExclusive = function (sessionId, groupId) {
        plugin.data.sessionGroups[sessionId] = [groupId];
        return Promise.resolve(true);
    };
    plugin.resolveGroupSelection = function (groupId) {
        return Promise.resolve({
            resolvedGroupId: groupId,
        });
    };
    plugin.createGroup = function (name) {
        const id = 'grp-' + name;
        plugin.data.groups[id] = { id: id, name: name };
        return Promise.resolve(id);
    };
    plugin.renameGroup = function (groupId, newName) {
        plugin.data.groups[groupId].name = newName;
        return Promise.resolve(true);
    };
    return plugin;
}

test('sessions-validation: name collision checks', function () {
    const plugin = createPlugin();

    assert.equal(plugin.isSessionNameTaken('Work'), true);
    assert.equal(plugin.isSessionNameTaken('Work', 's1'), false);
    assert.equal(plugin.isSessionNameTaken('Nonexistent'), false);

    assert.equal(plugin.isGroupNameTaken('Group 1'), true);
    assert.equal(plugin.isGroupNameTaken('Group 1', 'g1'), false);
    assert.equal(plugin.isGroupNameTaken('Nonexistent Group'), false);
});

test('sessions-validation: createSessionValidated and createSessionForViewedGroup', async function () {
    const plugin = createPlugin();

    // Duplicate name rejected
    const dupRes = await plugin.createSessionValidated('Work', { notify: false });
    assert.equal(dupRes.created, false);
    assert.equal(dupRes.reason, 'duplicate');

    // Whitespace-only name rejected
    const wsRes = await plugin.createSessionValidated('   ', { notify: false });
    assert.equal(wsRes.created, false);
    assert.equal(wsRes.reason, 'empty');

    // Valid creation
    const validRes = await plugin.createSessionValidated('Personal', { notify: false });
    assert.equal(validRes.created, true);
    assert.equal(validRes.name, 'Personal');

    // Create for viewed group
    const viewedRes = await plugin.createSessionForViewedGroup('GroupedSession', 'g1', { notify: false });
    assert.equal(viewedRes.created, true);
    assert.equal(viewedRes.viewGroupId, 'g1');
});

test('sessions-validation: renameSessionById validation', async function () {
    const plugin = createPlugin();

    // Missing session
    const noSession = await plugin.renameSessionById('missing', 'NewName', { notify: false });
    assert.equal(noSession, false);

    // Empty name
    const empty = await plugin.renameSessionById('s1', '  ', { notify: false });
    assert.equal(empty, false);

    // Duplicate name
    const dup = await plugin.renameSessionById('s1', 'Home', { notify: false });
    assert.equal(dup, false);

    // Valid rename
    const success = await plugin.renameSessionById('s1', 'Work Updated', { notify: false });
    assert.equal(success, true);
    assert.equal(plugin.data.sessions.s1.name, 'Work Updated');
    assert.equal(plugin.persistCalls, 1);
});

test('sessions-validation: group creation and rename validation', async function () {
    const plugin = createPlugin();

    // Group create duplicate
    const dupG = await plugin.createGroupValidated('Group 1', { notify: false });
    assert.equal(dupG, false);

    // Group create empty
    const emptyG = await plugin.createGroupValidated('   ', { notify: false });
    assert.equal(emptyG, false);

    // Group create valid
    const newG = await plugin.createGroupValidated('Group 2', { notify: false });
    assert.equal(newG, 'grp-Group 2');

    // Group rename valid
    const renamed = await plugin.renameGroupValidated('g1', 'Group 1 Renamed', { notify: false });
    assert.equal(renamed, true);
    assert.equal(plugin.data.groups.g1.name, 'Group 1 Renamed');
});
