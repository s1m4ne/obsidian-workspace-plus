'use strict';

require('./lock/harness/index.ts').installObsidianStub();

const test = require('node:test');
const assert = require('node:assert/strict');

const i18n = require('../src/i18n.ts');
i18n.resolveLocale('en');

const { SessionSwitcher } = require('../src/state/session-switcher.ts');

// A plugin whose layout application is deliberately slow, so a switch is still
// in flight while the next keypress arrives.
function createSwitcher(options) {
    options = options || {};

    const names = options.names || ['a', 'b', 'c', 'd'];
    const sessions = {};
    const sessionOrder = [];
    for (const name of names) {
        sessions[name] = { id: name, name: name, layout: { root: name } };
        sessionOrder.push(name);
    }

    const data = {
        sessions: sessions,
        sessionOrder: sessionOrder,
        activeSessionId: options.activeSessionId || names[0],
        groupFeatureEnabled: false,
        activeGroupId: null,
        previewNext: false,
        previewPrevious: false,
    };

    const events = { appliedLayouts: [], pendingLayoutResolvers: [], overlayIndexes: [] };

    // Hold every layout application open until the test releases it.
    const switcher = new SessionSwitcher({
        data,
        getOrderedSessions: () => data.sessionOrder.map((id) => data.sessions[id]).filter((session) => !data.groupFeatureEnabled || !data.activeGroupId || data.sessionGroups?.[session.id]?.includes(data.activeGroupId)),
        findSessionIndex: (ordered, id) => ordered.findIndex((session) => session.id === id),
        getActiveSession: () => data.activeSessionId ? data.sessions[data.activeSessionId] : null,
        getCurrentWorkspaceLayout: () => ({ root: 'current' }),
        changeWorkspaceLayout: (layout) => {
            events.appliedLayouts.push(layout);
            return new Promise((resolve) => { events.pendingLayoutResolvers.push(resolve); });
        },
        persistData: () => Promise.resolve(true),
        pushLayoutToHistory: () => {}, saveActiveSession: () => Promise.resolve(true),
        isActiveSessionDirty: () => false, isWarnOnUnsavedSwitchEnabled: () => false,
        isAutoSaveOnSwitchEnabled: () => false, updateStatusBar: () => {},
        showSwitchPreviewOverlay: (_ordered, index) => { events.overlayIndexes.push(index); },
    });
    const releaseLayouts = function () {
        const resolvers = events.pendingLayoutResolvers;
        events.pendingLayoutResolvers = [];
        for (const resolve of resolvers) resolve();
        // Let the promise chain in runSwitchRequest settle.
        return new Promise(function (resolve) { setImmediate(resolve); });
    };

    return { switcher, data, events, releaseLayouts };
}

test('rapid relative switches accumulate instead of collapsing onto one target', async () => {
    const { switcher, data, releaseLayouts } = createSwitcher();

    // Press 1: starts a switch a -> b, layout still applying.
    switcher.switchRelativeFromCommand(1);
    assert.equal(data.activeSessionId, 'b');
    assert.equal(switcher.pendingTargetId, 'b');

    // Presses 2 and 3 land while that switch is in flight. Each must step
    // forward from the last requested target, not from the applied one.
    switcher.switchRelativeFromCommand(1);
    assert.equal(switcher.pendingTargetId, 'c');
    switcher.switchRelativeFromCommand(1);
    assert.equal(switcher.pendingTargetId, 'd');

    await releaseLayouts();
    await releaseLayouts();

    assert.equal(data.activeSessionId, 'd', 'three presses should advance three sessions');
    assert.equal(switcher.pendingTargetId, null, 'the pending target is released once the queue drains');
});

test('the overlay highlight follows every press, not just the applied switch', async () => {
    const { switcher, events, releaseLayouts } = createSwitcher();

    switcher.switchRelativeFromCommand(1);
    switcher.switchRelativeFromCommand(1);
    switcher.switchRelativeFromCommand(1);

    assert.deepEqual(events.overlayIndexes, [1, 2, 3]);

    await releaseLayouts();
    await releaseLayouts();
});

test('relative switching wraps around from the last session', async () => {
    const { switcher, data, releaseLayouts } = createSwitcher({ activeSessionId: 'd' });

    switcher.switchRelativeFromCommand(1);
    assert.equal(data.activeSessionId, 'a');

    await releaseLayouts();
});

test('switching stays responsive when the active session is not in the current view', async () => {
    const { switcher, data, releaseLayouts } = createSwitcher();
    // Simulates the active session having been removed from the active group:
    // it is no longer part of the ordered list the command navigates.
    data.groupFeatureEnabled = true;
    data.activeGroupId = 'g1';
    data.groups = { g1: { id: 'g1', name: 'Current group' } };
    data.groupOrder = ['__all__', 'g1'];
    data.sessionGroups = { b: ['g1'], c: ['g1'], d: ['g1'] };

    const context = switcher.getRelativeSwitchContext(1);
    assert.notEqual(context, null, 'a missing active session must not make the command inert');
    assert.equal(context.currentIndex, -1);
    assert.equal(context.targetIndex, 0, 'next enters the list at the first session');

    assert.equal(switcher.getRelativeSwitchContext(-1).targetIndex, 2, 'previous enters at the last session');

    switcher.switchRelativeFromCommand(1);
    assert.equal(data.activeSessionId, 'b');

    await releaseLayouts();
});

test('a stale switch lock releases the remembered target', async () => {
    const { switcher, releaseLayouts } = createSwitcher();
    switcher.switchRelativeFromCommand(1);
    assert.equal(switcher.pendingTargetId, 'b');

    // No overlay or modal on screen and the lock is older than the 8s grace.
    switcher.switchLockAt = Date.now() - 10000;
    switcher.switchSession('d', {});

    assert.equal(switcher.pendingTargetId, 'd');
    await releaseLayouts();
});

test('session-switching prototype methods: notices and direct switches', async () => {
    const { switcher, data, releaseLayouts } = createSwitcher();

    const notice = switcher.showSessionSwitchNotice('Test', { durationMs: 50 });
    assert.ok(notice);
    switcher.clearSessionSwitchNotice();

    assert.equal(switcher.hasBlockingSwitchUi(), false);
    assert.equal(switcher.getRelativeSwitchBaseId(), 'a');

    const ordered = switcher.getRelativeSwitchContext(0).ordered;
    const p1 = switcher.switchSessionAtOrderedIndex(ordered, 1, { silent: true });
    await releaseLayouts();
    await p1;

    const p2 = switcher.switchToIndex(2);
    await releaseLayouts();
    await p2;
    assert.equal(data.activeSessionId, 'c');

    const p3 = switcher.switchSessionByIdFromCommand('d');
    await releaseLayouts();
    await p3;
    assert.equal(data.activeSessionId, 'd');

    const p4 = switcher.switchRelativeDirect(-1, { silent: true });
    await releaseLayouts();
    await p4;
    assert.equal(data.activeSessionId, 'c');

    const p5 = switcher.switchRelativeFromStatusBar(1);
    await releaseLayouts();
    await p5;
    assert.equal(data.activeSessionId, 'd');

    const p6 = switcher.switchRelativeFromStatusBar(-1);
    await releaseLayouts();
    await p6;
    assert.equal(data.activeSessionId, 'c');

    const p7 = switcher.switchRelativeFromCommand(1);
    await releaseLayouts();
    await p7;
    assert.equal(data.activeSessionId, 'd');

    const p8 = switcher.performSessionSwitch('a');
    await releaseLayouts();
    await p8;
    assert.equal(data.activeSessionId, 'a');

    const p9 = switcher.switchSession('b', { silent: true });
    await releaseLayouts();
    await p9;
    assert.equal(data.activeSessionId, 'b');
});
