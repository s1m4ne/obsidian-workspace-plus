'use strict';

require('./lock/harness/index.ts').installObsidianStub();

const test = require('node:test');
const assert = require('node:assert/strict');

const i18n = require('../src/i18n.ts');
i18n.resolveLocale('en');

const attachSessionSwitchingMethods = require('../src/plugin/methods/session-switching');
const attachSessionMethods = require('../src/plugin/methods/sessions');

// A plugin whose layout application is deliberately slow, so a switch is still
// in flight while the next keypress arrives.
function createPlugin(options) {
    options = options || {};

    function PluginMock() {}
    attachSessionMethods(PluginMock);
    attachSessionSwitchingMethods(PluginMock);

    const plugin = new PluginMock();
    const names = options.names || ['a', 'b', 'c', 'd'];
    const sessions = {};
    const sessionOrder = [];
    for (const name of names) {
        sessions[name] = { id: name, name: name, layout: { root: name } };
        sessionOrder.push(name);
    }

    plugin.data = {
        sessions: sessions,
        sessionOrder: sessionOrder,
        activeSessionId: options.activeSessionId || names[0],
        groupFeatureEnabled: false,
        activeGroupId: null,
        previewNext: false,
        previewPrevious: false,
    };

    plugin.isSwitchingSession = false;
    plugin.pendingSwitchRequest = null;
    plugin.pendingSwitchTargetId = null;
    plugin.switchLockAt = 0;

    plugin.appliedLayouts = [];
    plugin.pendingLayoutResolvers = [];

    plugin.isGroupFeatureEnabled = function () { return false; };
    plugin.getStartupSettleRemainingMs = function () { return 0; };
    plugin.isAutoSaveOnSwitchEnabled = function () { return false; };
    plugin.isWarnOnUnsavedSwitchEnabled = function () { return false; };
    plugin.isActiveSessionDirty = function () { return false; };
    plugin.pushLayoutToHistory = function () {};
    plugin.getCurrentWorkspaceLayout = function () { return { root: 'current' }; };
    plugin.updateStatusBar = function () {};
    plugin.persistData = function () { return Promise.resolve(); };
    plugin.showSwitchPreviewOverlay = function (ordered, index) {
        plugin.overlayIndexes.push(index);
    };
    plugin.overlayIndexes = [];

    // Hold every layout application open until the test releases it.
    plugin.applyWorkspaceLayout = function (layout) {
        plugin.appliedLayouts.push(layout);
        return new Promise(function (resolve) {
            plugin.pendingLayoutResolvers.push(resolve);
        });
    };

    plugin.releaseLayouts = function () {
        const resolvers = plugin.pendingLayoutResolvers;
        plugin.pendingLayoutResolvers = [];
        for (const resolve of resolvers) resolve();
        // Let the promise chain in runSwitchRequest settle.
        return new Promise(function (resolve) { setImmediate(resolve); });
    };

    return plugin;
}

test('rapid relative switches accumulate instead of collapsing onto one target', async () => {
    const plugin = createPlugin();

    // Press 1: starts a switch a -> b, layout still applying.
    plugin.switchRelativeFromCommand(1);
    assert.equal(plugin.data.activeSessionId, 'b');
    assert.equal(plugin.getSessionSwitcher().pendingTargetId, 'b');

    // Presses 2 and 3 land while that switch is in flight. Each must step
    // forward from the last requested target, not from the applied one.
    plugin.switchRelativeFromCommand(1);
    assert.equal(plugin.getSessionSwitcher().pendingTargetId, 'c');
    plugin.switchRelativeFromCommand(1);
    assert.equal(plugin.getSessionSwitcher().pendingTargetId, 'd');

    await plugin.releaseLayouts();
    await plugin.releaseLayouts();

    assert.equal(plugin.data.activeSessionId, 'd', 'three presses should advance three sessions');
    assert.equal(plugin.getSessionSwitcher().pendingTargetId, null, 'the pending target is released once the queue drains');
});

test('the overlay highlight follows every press, not just the applied switch', async () => {
    const plugin = createPlugin();

    plugin.switchRelativeFromCommand(1);
    plugin.switchRelativeFromCommand(1);
    plugin.switchRelativeFromCommand(1);

    assert.deepEqual(plugin.overlayIndexes, [1, 2, 3]);

    await plugin.releaseLayouts();
    await plugin.releaseLayouts();
});

test('relative switching wraps around from the last session', async () => {
    const plugin = createPlugin({ activeSessionId: 'd' });

    plugin.switchRelativeFromCommand(1);
    assert.equal(plugin.data.activeSessionId, 'a');

    await plugin.releaseLayouts();
});

test('switching stays responsive when the active session is not in the current view', async () => {
    const plugin = createPlugin();
    // Simulates the active session having been removed from the active group:
    // it is no longer part of the ordered list the command navigates.
    plugin.getOrderedSessions = function () {
        return ['b', 'c', 'd'].map(function (id) { return plugin.data.sessions[id]; });
    };

    const context = plugin.getRelativeSwitchContext(1);
    assert.notEqual(context, null, 'a missing active session must not make the command inert');
    assert.equal(context.currentIndex, -1);
    assert.equal(context.targetIndex, 0, 'next enters the list at the first session');

    assert.equal(plugin.getRelativeSwitchContext(-1).targetIndex, 2, 'previous enters at the last session');

    plugin.switchRelativeFromCommand(1);
    assert.equal(plugin.data.activeSessionId, 'b');

    await plugin.releaseLayouts();
});

test('a stale switch lock releases the remembered target', async () => {
    const plugin = createPlugin();
    plugin.switchRelativeFromCommand(1);
    assert.equal(plugin.getSessionSwitcher().pendingTargetId, 'b');

    // No overlay or modal on screen and the lock is older than the 8s grace.
    plugin.getSessionSwitcher().switchLockAt = Date.now() - 10000;
    plugin.switchSession('d', {});

    assert.equal(plugin.getSessionSwitcher().pendingTargetId, 'd');
    await plugin.releaseLayouts();
});

test('session-switching prototype methods: notices and direct switches', async () => {
    const plugin = createPlugin();

    const notice = plugin.showSessionSwitchNotice('Test', { durationMs: 50 });
    assert.ok(notice);
    plugin.clearSessionSwitchNotice();

    assert.equal(plugin.hasBlockingSwitchUi(), false);
    assert.equal(plugin.getRelativeSwitchBaseId(), 'a');

    const ordered = plugin.getOrderedSessions();
    const p1 = plugin.switchSessionAtOrderedIndex(ordered, 1, { silent: true });
    await plugin.releaseLayouts();
    await p1;

    const p2 = plugin.switchToIndex(2);
    await plugin.releaseLayouts();
    await p2;
    assert.equal(plugin.data.activeSessionId, 'c');

    const p3 = plugin.switchSessionByIdFromCommand('d');
    await plugin.releaseLayouts();
    await p3;
    assert.equal(plugin.data.activeSessionId, 'd');

    const p4 = plugin.switchRelativeDirect(-1, { silent: true });
    await plugin.releaseLayouts();
    await p4;
    assert.equal(plugin.data.activeSessionId, 'c');

    const p5 = plugin.switchRelativeFromStatusBar(1);
    await plugin.releaseLayouts();
    await p5;
    assert.equal(plugin.data.activeSessionId, 'd');

    const p6 = plugin.switchRelativeFromScroll(-1);
    await plugin.releaseLayouts();
    await p6;
    assert.equal(plugin.data.activeSessionId, 'c');

    const p7 = plugin.switchRelative(1);
    await plugin.releaseLayouts();
    await p7;
    assert.equal(plugin.data.activeSessionId, 'd');

    const p8 = plugin.switchRelativeImmediate(-1, { showOverlay: false });
    await plugin.releaseLayouts();
    await p8;
    assert.equal(plugin.data.activeSessionId, 'c');

    const p9 = plugin.performSessionSwitch('a');
    await plugin.releaseLayouts();
    await p9;
    assert.equal(plugin.data.activeSessionId, 'a');

    const p10 = plugin.switchSession('b', { silent: true });
    await plugin.releaseLayouts();
    await p10;
    assert.equal(plugin.data.activeSessionId, 'b');
});
