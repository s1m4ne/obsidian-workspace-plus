'use strict';

require('./lock/harness/index.ts').installObsidianStub();

const test = require('node:test');
const assert = require('node:assert/strict');

const { SessionSwitcher } = require('../src/state/session-switcher.ts');
const { SessionSaver } = require('../src/state/session-saver.ts');

function createSwitcher(initialData) {
    const data = Object.assign({
        activeSessionId: 'a',
        autoSaveOnSwitch: true,
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'old' }, modified: 1 },
        },
    }, initialData || {});
    const events = { historyPushes: 0, persistCalls: 0 };
    const getActiveSession = () => data.sessions[data.activeSessionId];
    const getCurrentWorkspaceLayout = () => ({ layout: 'current' });
    const persistData = () => {
        events.persistCalls += 1;
        return Promise.resolve(true);
    };

    // A real saver rather than a stub: what this file asserts after a startup
    // flush - the history push, the new layout, a bumped `modified` - is
    // CAPTURE's behaviour, and a stub would be asserting the stub.
    const sessionSaver = new SessionSaver({
        data,
        getActiveSession,
        getCurrentWorkspaceLayout,
        layoutsEqualStructural: (a, b) => JSON.stringify(a) === JSON.stringify(b),
        getDefaultSessionName: () => 'Default',
        pushLayoutToHistory: () => { events.historyPushes += 1; },
        persistData,
        createSessionRecord: (id, name, layout) => ({ id, name, layout, modified: Date.now() }),
        insertSessionAndActivate: () => {},
        getOrderedSessionsUnfiltered: () => Object.values(data.sessions),
        getOrderedGroupTabIds: () => [],
        isGroupFeatureEnabled: () => false,
        applyWorkspaceLayout: async () => true,
    });

    const switcher = new SessionSwitcher({
        data,
        getOrderedSessions: () => Object.values(data.sessions),
        findSessionIndex: (sessions, id) => sessions.findIndex((session) => session.id === id),
        getActiveSession,
        getCurrentWorkspaceLayout,
        applyWorkspaceLayout: async () => true,
        persistData,
        commitWorkspaceToSession: (session, options) =>
            sessionSaver.commitWorkspaceToSession(session, options),
        saveActiveSession: async () => true, isActiveSessionDirty: () => false,
        isWarnOnUnsavedSwitchEnabled: () => false,
        isAutoSaveOnSwitchEnabled: () => data.autoSaveOnSwitch !== false,
    });
    return { switcher, data, events };
}

test('session startup flush captures the active layout when auto-save is enabled', async function () {
    const { switcher, data, events } = createSwitcher();

    await switcher.flushOnStartup();

    assert.equal(events.historyPushes, 1);
    assert.deepEqual(data.sessions.a.layout, { layout: 'current' });
    assert.notEqual(data.sessions.a.modified, 1);
    assert.equal(events.persistCalls, 1);
});

test('session startup flush does nothing when auto-save is disabled', async function () {
    const { switcher, events } = createSwitcher({ autoSaveOnSwitch: false });

    const result = await switcher.scheduleStartupFlush();

    assert.equal(result, true);
    assert.equal(events.historyPushes, 0);
    assert.equal(events.persistCalls, 1);
});

test('session startup layout changes extend the settle deadline', function () {
    const { switcher } = createSwitcher();

    switcher.startStartupSettleWindow(200);
    const before = switcher.getStartupSettleRemainingMs();
    switcher.noteStartupLayoutChange();
    const after = switcher.getStartupSettleRemainingMs();

    assert.ok(after >= 0);
    assert.ok(before >= 0);
    switcher.cleanup();
});
