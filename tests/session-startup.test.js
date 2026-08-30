'use strict';

require('./lock/harness/index.ts').installObsidianStub();

const test = require('node:test');
const assert = require('node:assert/strict');

const attachSessionStartupMethods = require('../src/plugin/methods/session-startup');

function createPlugin(initialData) {
    function PluginMock() {}
    attachSessionStartupMethods(PluginMock);
    const plugin = new PluginMock();
    plugin.data = Object.assign({
        activeSessionId: 'a',
        autoSaveOnSwitch: true,
        sessions: {
            a: { id: 'a', name: 'A', layout: { layout: 'old' }, modified: 1 },
        },
    }, initialData || {});
    plugin.historyPushes = 0;
    plugin.persistCalls = 0;
    plugin.flushCalls = 0;
    plugin.isAutoSaveOnSwitchEnabled = function () {
        return plugin.data.autoSaveOnSwitch !== false;
    };
    plugin.getActiveSession = function () {
        return plugin.data.sessions[plugin.data.activeSessionId] || null;
    };
    plugin.getCurrentWorkspaceLayout = function () {
        return { layout: 'current' };
    };
    plugin.pushLayoutToHistory = function () {
        plugin.historyPushes += 1;
    };
    plugin.persistData = function () {
        plugin.persistCalls += 1;
        return Promise.resolve(true);
    };
    return plugin;
}

test('session startup flush captures the active layout when auto-save is enabled', async function () {
    const plugin = createPlugin();

    await plugin.flushOnStartup();

    assert.equal(plugin.historyPushes, 1);
    assert.deepEqual(plugin.data.sessions.a.layout, { layout: 'current' });
    assert.notEqual(plugin.data.sessions.a.modified, 1);
    assert.equal(plugin.persistCalls, 1);
});

test('session startup flush does nothing when auto-save is disabled', async function () {
    const plugin = createPlugin({ autoSaveOnSwitch: false });

    const result = await plugin.scheduleStartupFlush();

    assert.equal(result, false);
    assert.equal(plugin.historyPushes, 0);
    assert.equal(plugin.persistCalls, 0);
});

test('session startup layout changes extend the settle deadline', function () {
    const plugin = createPlugin();
    plugin.scheduleStartupFlush = function () {
        plugin.flushCalls += 1;
        return Promise.resolve(true);
    };

    plugin.startStartupSettleWindow(20);
    const before = plugin.startupSettleUntil;
    plugin.noteStartupLayoutChange();

    assert.ok(plugin.startupSettleUntil >= before);
    assert.equal(plugin.flushCalls, plugin.startupSettleUntil > before ? 1 : 0);
    clearTimeout(plugin.startupSettleTimer);
});
