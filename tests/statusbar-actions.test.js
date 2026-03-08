'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');

function loadStatusBarActions() {
    const obsidianStub = {
        Notice: class {
            constructor(_message) {}
        },
    };
    const i18nStub = {
        L: {
            statusBarActionNone: 'Do nothing',
            cmdSaveAs: 'Save current session as...',
            cmdRename: 'Rename current session',
            cmdDuplicate: 'Duplicate current session',
            cmdPrevious: 'Previous session',
            cmdNext: 'Next session',
            cmdNewEmpty: 'Create blank session',
            cmdToggleAutoSave: 'Toggle auto-save on switch',
        },
    };
    const modalsStub = {
        SessionManagerModal: class {
            open() {}
        },
        HistoryModal: class {
            open() {}
        },
        ConfirmModal: class {
            open() {}
        },
        RenameModal: class {
            open() {}
        },
    };
    const sessionContextMenuStub = {
        openSessionContextMenu: function () {},
    };
    const settingsContextMenuStub = {
        openSettingsContextMenu: function () {},
    };

    const originalLoad = Module._load;
    Module._load = function (request, parent, isMain) {
        if (request === 'obsidian') return obsidianStub;
        if (request === './i18n') return i18nStub;
        if (request === './modals') return modalsStub;
        if (request === './session-context-menu') return sessionContextMenuStub;
        if (request === './settings-context-menu') return settingsContextMenuStub;
        return originalLoad(request, parent, isMain);
    };

    try {
        const modulePath = require.resolve('../src/statusbar-actions');
        delete require.cache[modulePath];
        return require(modulePath);
    } finally {
        Module._load = originalLoad;
    }
}

test('status bar actions expose first-pass direct action ids', function () {
    const statusBarActions = loadStatusBarActions();

    const expected = [
        'saveAsSession',
        'renameSession',
        'duplicateSession',
        'previousSession',
        'nextSession',
        'newEmptySession',
        'toggleAutoSaveOnSwitch',
    ];

    for (let i = 0; i < expected.length; i++) {
        assert.ok(statusBarActions.ACTION_IDS.includes(expected[i]));
    }
});

test('status bar actions delegate new direct actions to plugin methods', async function () {
    const statusBarActions = loadStatusBarActions();
    const calls = [];
    const plugin = {
        saveAsSession: function () {
            calls.push('saveAsSession');
            return Promise.resolve(true);
        },
        renameCurrentSession: function () {
            calls.push('renameCurrentSession');
        },
        duplicateCurrentSession: function () {
            calls.push('duplicateCurrentSession');
            return Promise.resolve(true);
        },
        switchRelativeFromStatusBar: function (offset) {
            calls.push(['switchRelativeFromStatusBar', offset]);
            return Promise.resolve(true);
        },
        createEmptySession: function () {
            calls.push('createEmptySession');
            return Promise.resolve(true);
        },
        toggleAutoSaveOnSwitch: function (options) {
            calls.push(['toggleAutoSaveOnSwitch', options]);
            return Promise.resolve(true);
        },
    };

    await statusBarActions.executeStatusBarAction(plugin, 'saveAsSession');
    await statusBarActions.executeStatusBarAction(plugin, 'renameSession');
    await statusBarActions.executeStatusBarAction(plugin, 'duplicateSession');
    await statusBarActions.executeStatusBarAction(plugin, 'previousSession');
    await statusBarActions.executeStatusBarAction(plugin, 'nextSession');
    await statusBarActions.executeStatusBarAction(plugin, 'newEmptySession');
    await statusBarActions.executeStatusBarAction(plugin, 'toggleAutoSaveOnSwitch');

    assert.deepEqual(calls, [
        'saveAsSession',
        'renameCurrentSession',
        'duplicateCurrentSession',
        ['switchRelativeFromStatusBar', -1],
        ['switchRelativeFromStatusBar', 1],
        'createEmptySession',
        ['toggleAutoSaveOnSwitch', { notify: true }],
    ]);
});

test('status bar action labels reuse existing localized command labels', function () {
    const statusBarActions = loadStatusBarActions();
    const L = {
        statusBarActionNone: 'Do nothing',
        cmdSaveAs: 'Save current session as...',
        cmdRename: 'Rename current session',
        cmdDuplicate: 'Duplicate current session',
        cmdPrevious: 'Previous session',
        cmdNext: 'Next session',
        cmdNewEmpty: 'Create blank session',
        cmdToggleAutoSave: 'Toggle auto-save on switch',
    };

    assert.equal(statusBarActions.getActionLabel(L, 'saveAsSession'), 'Save current session as...');
    assert.equal(statusBarActions.getActionLabel(L, 'renameSession'), 'Rename current session');
    assert.equal(statusBarActions.getActionLabel(L, 'duplicateSession'), 'Duplicate current session');
    assert.equal(statusBarActions.getActionLabel(L, 'previousSession'), 'Previous session');
    assert.equal(statusBarActions.getActionLabel(L, 'nextSession'), 'Next session');
    assert.equal(statusBarActions.getActionLabel(L, 'newEmptySession'), 'Create blank session');
    assert.equal(statusBarActions.getActionLabel(L, 'toggleAutoSaveOnSwitch'), 'Toggle auto-save on switch');
});
