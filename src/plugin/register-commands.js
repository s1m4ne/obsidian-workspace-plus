'use strict';

var i18n = require('../i18n');
var modals = require('../modals');

function registerCommands(plugin) {
    var L = i18n.L;

    plugin.addCommand({
        id: 'manage-sessions',
        name: L.cmdManage,
        callback: function () {
            new modals.SessionManagerModal(plugin.app, plugin).open();
        },
    });

    plugin.addCommand({
        id: 'create-session',
        name: L.cmdCreate,
        callback: function () {
            var modal = new modals.SessionManagerModal(plugin.app, plugin);
            modal.open();
            setTimeout(function () {
                if (modal.nameInput) modal.nameInput.focus();
            }, 100);
        },
    });

    plugin.addCommand({
        id: 'rename-session',
        name: L.cmdRename,
        hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'R' }],
        callback: function () { plugin.renameCurrentSession(); },
    });

    plugin.addCommand({
        id: 'delete-session',
        name: L.cmdDelete,
        hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'Backspace' }],
        callback: function () { plugin.deleteCurrentSession(); },
    });

    plugin.addCommand({
        id: 'new-empty-session',
        name: L.cmdNewEmpty,
        callback: function () { plugin.createEmptySession(); },
    });

    plugin.addCommand({
        id: 'duplicate-session',
        name: L.cmdDuplicate,
        hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'M' }],
        callback: function () { plugin.duplicateCurrentSession(); },
    });

    // Numbered session switching (Mod+Shift+1 through 9)
    for (var n = 1; n <= 9; n++) {
        (function (num) {
            plugin.addCommand({
                id: 'switch-to-' + num,
                name: L.cmdSwitchTo(num),
                callback: function () { plugin.switchToIndex(num - 1); },
            });
        })(n);
    }

    // Previous / Next session
    plugin.addCommand({
        id: 'previous-session',
        name: L.cmdPrevious,
        hotkeys: [{ modifiers: ['Mod', 'Shift'], key: ',' }],
        callback: function () { plugin.switchRelative(-1); },
    });

    plugin.addCommand({
        id: 'next-session',
        name: L.cmdNext,
        hotkeys: [
            { modifiers: ['Mod', 'Shift'], key: 'Enter' },
            { modifiers: ['Mod', 'Shift'], key: '.' },
        ],
        callback: function () { plugin.switchRelative(1); },
    });

    plugin.addCommand({
        id: 'save-current-session',
        name: L.cmdSaveCurrent,
        hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'S' }],
        callback: function () { plugin.saveActiveSession(); },
    });

    plugin.addCommand({
        id: 'toggle-auto-save-on-switch',
        name: L.cmdToggleAutoSave,
        callback: function () { plugin.toggleAutoSaveOnSwitch({ notify: true }); },
    });

    plugin.addCommand({
        id: 'enable-auto-save-on-switch',
        name: L.cmdEnableAutoSave,
        checkCallback: function (checking) {
            var canRun = !plugin.isAutoSaveOnSwitchEnabled();
            if (!canRun) return false;
            if (!checking) plugin.setAutoSaveOnSwitch(true, { notify: true });
            return true;
        },
    });

    plugin.addCommand({
        id: 'disable-auto-save-on-switch',
        name: L.cmdDisableAutoSave,
        checkCallback: function (checking) {
            var canRun = plugin.isAutoSaveOnSwitchEnabled();
            if (!canRun) return false;
            if (!checking) plugin.setAutoSaveOnSwitch(false, { notify: true });
            return true;
        },
    });

    plugin.addCommand({
        id: 'search-session-overlay',
        name: L.cmdSearchOverlay,
        callback: function () { plugin.openSearchOverlay(); },
    });
}

module.exports = registerCommands;
