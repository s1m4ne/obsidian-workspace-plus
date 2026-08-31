'use strict';

require('./lock/harness/index.ts').installObsidianStub();

const test = require('node:test');
const assert = require('node:assert/strict');

const i18n = require('../src/i18n.ts');
const attachSessionCommandMethods = require('../src/plugin/methods/session-commands');
const attachSessionMethods = require('../src/plugin/methods/sessions');

i18n.resolveLocale('en');

function createSession(id, name) {
    return { id: id, name: name };
}

function createPlugin(initialData) {
    function PluginMock() {}
    attachSessionMethods(PluginMock);
    attachSessionCommandMethods(PluginMock);
    const plugin = new PluginMock();
    plugin.data = Object.assign({
        activeSessionId: 's1',
        numberedSwitchCommands: true,
        showActiveSwitchCommand: false,
        sessionOrder: ['s1', 's2'],
        sessions: {
            s1: createSession('s1', 'One'),
            s2: createSession('s2', 'Two'),
        },
    }, initialData || {});
    plugin.addedCommands = [];
    plugin.removedCommandIds = [];
    plugin.switchToIndexCalls = [];
    plugin.switchByIdCalls = [];
    plugin.addCommand = function (command) {
        plugin.addedCommands.push(command);
    };
    plugin.removeCommand = function (id) {
        plugin.removedCommandIds.push(id);
    };
    plugin.switchToIndex = function (index) {
        plugin.switchToIndexCalls.push(index);
        return Promise.resolve(true);
    };
    plugin.switchSessionByIdFromCommand = function (sessionId) {
        plugin.switchByIdCalls.push(sessionId);
        return Promise.resolve(true);
    };
    return plugin;
}

test('session command sync refreshes numbered commands with current session names', function () {
    const plugin = createPlugin({
        _dynamicSessionCommandIds: ['switch-to-named-old'],
    });
    plugin._dynamicSessionCommandIds = ['switch-to-named-old'];

    plugin.syncSessionCommands();

    assert.deepEqual(plugin.removedCommandIds.slice(0, 10), [
        'switch-to-named-old',
        'switch-to-1',
        'switch-to-2',
        'switch-to-3',
        'switch-to-4',
        'switch-to-5',
        'switch-to-6',
        'switch-to-7',
        'switch-to-8',
        'switch-to-9',
    ]);
    assert.equal(plugin.addedCommands.length, 9);
    assert.equal(plugin.addedCommands[0].id, 'switch-to-1');
    assert.match(plugin.addedCommands[0].name, /One/);
    assert.equal(plugin.addedCommands[0].checkCallback(true), false);
    assert.equal(plugin.addedCommands[1].checkCallback(false), true);
    assert.deepEqual(plugin.switchToIndexCalls, [1]);
});

test('session command sync registers named commands when numbering is disabled', function () {
    const plugin = createPlugin({
        numberedSwitchCommands: false,
        sessionOrder: ['s1', 's2', 's3'],
        sessions: {
            s1: createSession('s1', 'One'),
            s2: createSession('s2', 'Two'),
            s3: createSession('s3', 'Three'),
        },
    });

    plugin.syncSessionCommands();

    assert.deepEqual(plugin.removedCommandIds, [
        'switch-to-1',
        'switch-to-2',
        'switch-to-3',
        'switch-to-4',
        'switch-to-5',
        'switch-to-6',
        'switch-to-7',
        'switch-to-8',
        'switch-to-9',
    ]);
    assert.deepEqual(plugin._dynamicSessionCommandIds, [
        'switch-to-named-s1',
        'switch-to-named-s2',
        'switch-to-named-s3',
    ]);
    assert.deepEqual(plugin.addedCommands.map(function (command) {
        return command.id;
    }), plugin._dynamicSessionCommandIds);
    assert.equal(plugin.addedCommands[0].checkCallback(true), false);
    assert.equal(plugin.addedCommands[1].checkCallback(false), true);
    assert.deepEqual(plugin.switchByIdCalls, ['s2']);
});
