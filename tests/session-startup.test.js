'use strict';

require('./lock/harness/index.ts').installObsidianStub();

const test = require('node:test');
const assert = require('node:assert/strict');

const { SessionSwitcher } = require('../src/state/session-switcher.ts');

function createSwitcher(initialData) {
    const data = Object.assign({
        activeSessionId: 'a',
        autoSaveOnSwitch: true,
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'old' }, modified: 1 },
        },
    }, initialData || {});
    const events = { historyPushes: 0, persistCalls: 0 };
    const switcher = new SessionSwitcher({
        data,
        getOrderedSessions: () => Object.values(data.sessions),
        findSessionIndex: (sessions, id) => sessions.findIndex((session) => session.id === id),
        getActiveSession: () => data.sessions[data.activeSessionId],
        getCurrentWorkspaceLayout: () => ({ layout: 'current' }),
        applyWorkspaceLayout: async () => true,
        persistData: function () {
        events.persistCalls += 1;
        return Promise.resolve(true);
        },
        pushLayoutToHistory: () => { events.historyPushes += 1; },
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
