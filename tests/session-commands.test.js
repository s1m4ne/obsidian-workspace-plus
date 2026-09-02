'use strict';

require('./lock/harness/index.ts').installObsidianStub();

const test = require('node:test');
const assert = require('node:assert/strict');

const i18n = require('../src/i18n.ts');
const { CommandRegistry } = require('../src/core/command-registry.ts');
const { SettingsState } = require('../src/state/settings-state.ts');

i18n.resolveLocale('en');

function createSession(id, name) {
    return { id: id, name: name };
}

function createRegistry(initialData) {
    const data = Object.assign({
        activeSessionId: 's1',
        numberedSwitchCommands: true,
        showActiveSwitchCommand: false,
        sessionOrder: ['s1', 's2'],
        sessions: {
            s1: createSession('s1', 'One'),
            s2: createSession('s2', 'Two'),
        },
    }, initialData || {});
    const events = { addedCommands: [], removedCommandIds: [], switchToIndexCalls: [], switchByIdCalls: [] };
    // A real SettingsState over this fixture's data. numberedSwitchCommands and
    // showActiveSwitchCommand are read through the owner now, and both are set
    // above to steer which commands the registry builds.
    const settingsState = new SettingsState({ data, persistData: async () => true });
    const host = {
        data,
        getSettingsState() { return settingsState; },
        app: { workspace: {} }, manifest: { id: 'workspace-plus-plus' },
        addCommand: (command) => { events.addedCommands.push(command); return command; },
        removeCommand: (id) => { events.removedCommandIds.push(id); },
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
        getOrderedSessions: () => data.sessionOrder.map((id) => data.sessions[id]).filter(Boolean),
        getOrderedSessionsUnfiltered: () => data.sessionOrder.map((id) => data.sessions[id]).filter(Boolean),
        // Switching goes through getSessionSwitcher(); this double carries those members itself.
        getSessionSwitcher() { return this; },
        switchToIndex: function (index) {
        events.switchToIndexCalls.push(index);
        return Promise.resolve(true);
        },
        switchSessionByIdFromCommand: function (sessionId) {
        events.switchByIdCalls.push(sessionId);
        return Promise.resolve(true);
        },
        _dynamicSessionCommandIds: data._dynamicSessionCommandIds,
    };
    const registry = new CommandRegistry(host);
    return { registry, data, events, host };
}

test('session command sync refreshes numbered commands with current session names', function () {
    const { registry, events, host } = createRegistry({
        _dynamicSessionCommandIds: ['switch-to-named-old'],
    });
    host._dynamicSessionCommandIds = ['switch-to-named-old'];

    registry.syncSessionCommands();

    assert.deepEqual(events.removedCommandIds.slice(0, 10), [
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
    assert.equal(events.addedCommands.length, 9);
    assert.equal(events.addedCommands[0].id, 'switch-to-1');
    assert.match(events.addedCommands[0].name, /One/);
    assert.equal(events.addedCommands[0].checkCallback(true), false);
    assert.equal(events.addedCommands[1].checkCallback(false), true);
    assert.deepEqual(events.switchToIndexCalls, [1]);
});

test('session command sync registers named commands when numbering is disabled', function () {
    const { registry, events } = createRegistry({
        numberedSwitchCommands: false,
        sessionOrder: ['s1', 's2', 's3'],
        sessions: {
            s1: createSession('s1', 'One'),
            s2: createSession('s2', 'Two'),
            s3: createSession('s3', 'Three'),
        },
    });

    registry.syncSessionCommands();

    assert.deepEqual(events.removedCommandIds, [
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
    assert.deepEqual(registry.dynamicSessionCommandIds, [
        'switch-to-named-s1',
        'switch-to-named-s2',
        'switch-to-named-s3',
    ]);
    assert.deepEqual(events.addedCommands.map(function (command) {
        return command.id;
    }), registry.dynamicSessionCommandIds);
    assert.equal(events.addedCommands[0].checkCallback(true), false);
    assert.equal(events.addedCommands[1].checkCallback(false), true);
    assert.deepEqual(events.switchByIdCalls, ['s2']);
});
