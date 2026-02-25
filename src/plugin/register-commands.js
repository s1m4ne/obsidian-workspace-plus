'use strict';

var obsidian = require('obsidian');
var i18n = require('../i18n');
var modals = require('../modals');

function registerCommands(plugin) {
    var L = i18n.L;

    function addCommand(command) {
        plugin.addCommand(command);
    }

    function addSimpleCommand(id, name, callback, hotkeys) {
        var command = {
            id: id,
            name: name,
            callback: callback,
        };
        if (hotkeys) command.hotkeys = hotkeys;
        addCommand(command);
    }

    function runWithFailureNotice(operation, failureNotice) {
        operation().catch(function () {
            new obsidian.Notice(failureNotice);
        });
    }

    addSimpleCommand('manage-sessions', L.cmdManage, function () {
        new modals.SessionManagerModal(plugin.app, plugin).open();
    });

    addSimpleCommand('create-session', L.cmdCreate, function () {
        var modal = new modals.SessionManagerModal(plugin.app, plugin);
        modal.open();
        setTimeout(function () {
            if (modal.nameInput) modal.nameInput.focus();
        }, 100);
    });

    addSimpleCommand('rename-session', L.cmdRename, function () {
        plugin.renameCurrentSession();
    }, [{ modifiers: ['Mod', 'Shift'], key: 'R' }]);

    addSimpleCommand('delete-session', L.cmdDelete, function () {
        plugin.deleteCurrentSession();
    }, [{ modifiers: ['Mod', 'Shift'], key: 'Backspace' }]);

    addSimpleCommand('new-empty-session', L.cmdNewEmpty, function () {
        plugin.createEmptySession();
    });

    addSimpleCommand('duplicate-session', L.cmdDuplicate, function () {
        plugin.duplicateCurrentSession();
    }, [{ modifiers: ['Mod', 'Shift'], key: 'M' }]);

    // Numbered session switching (Mod+Shift+1 through 9)
    for (var n = 1; n <= 9; n++) {
        (function (num) {
            addCommand({
                id: 'switch-to-' + num,
                name: L.cmdSwitchTo(num),
                callback: function () { plugin.switchToIndex(num - 1); },
            });
        })(n);
    }

    // Track dynamic command IDs for named session switching
    plugin._dynamicSessionCommandIds = [];

    // Previous / Next session
    addSimpleCommand('previous-session', L.cmdPrevious, function () {
        plugin.switchRelative(-1);
    }, [{ modifiers: ['Mod', 'Shift'], key: ',' }]);

    addSimpleCommand('next-session', L.cmdNext, function () {
        plugin.switchRelative(1);
    }, [
        { modifiers: ['Mod', 'Shift'], key: 'Enter' },
        { modifiers: ['Mod', 'Shift'], key: '.' },
    ]);

    addSimpleCommand('save-current-session', L.cmdSaveCurrent, function () {
        plugin.saveActiveSession();
    }, [{ modifiers: ['Mod', 'Shift'], key: 'S' }]);

    addSimpleCommand('reload-current-session-without-saving', L.cmdReloadCurrentWithoutSaving, function () {
        plugin.reloadCurrentSessionWithoutSaving();
    });

    addSimpleCommand('toggle-auto-save-on-switch', L.cmdToggleAutoSave, function () {
        plugin.toggleAutoSaveOnSwitch({ notify: true });
    });

    addCommand({
        id: 'enable-auto-save-on-switch',
        name: L.cmdEnableAutoSave,
        checkCallback: function (checking) {
            var canRun = !plugin.isAutoSaveOnSwitchEnabled();
            if (!canRun) return false;
            if (!checking) plugin.setAutoSaveOnSwitch(true, { notify: true });
            return true;
        },
    });

    addCommand({
        id: 'disable-auto-save-on-switch',
        name: L.cmdDisableAutoSave,
        checkCallback: function (checking) {
            var canRun = plugin.isAutoSaveOnSwitchEnabled();
            if (!canRun) return false;
            if (!checking) plugin.setAutoSaveOnSwitch(false, { notify: true });
            return true;
        },
    });

    addSimpleCommand('search-session-overlay', L.cmdSearchOverlay, function () {
        plugin.openSearchOverlay();
    });

    addSimpleCommand('export-sessions-snapshot', L.cmdExportSessions, function () {
        runWithFailureNotice(function () {
            return plugin.exportSessionsSnapshot();
        }, L.exportSessionsFailed);
    });

    addSimpleCommand('import-latest-sessions-snapshot', L.cmdImportSessions, function () {
        new modals.ConfirmModal(plugin.app, L.confirmImportSessions, function () {
            return plugin.importSessionsFromLatestExport().catch(function () {
                new obsidian.Notice(L.importSessionsFailed);
            });
        }, {
            confirmText: L.settingsImportSessionsBtn || L.cmdImportSessions,
            confirmClass: 'mod-cta',
        }).open();
    });

    // --- Group commands ---

    function getCurrentGroupViewId() {
        if (plugin.switchOverlayEl) return plugin.switchOverlayViewGroupId || null;
        if (plugin.searchOverlayEl) return plugin.searchOverlayViewGroupId || null;
        return plugin.data.activeGroupId || null;
    }

    function showSwitchOverlayForGroup(groupId) {
        var ordered = plugin.getOrderedSessionsForGroup(groupId || null);
        var activeIndex = plugin.getActiveSessionIndex(ordered);
        plugin.showSwitchOverlay(ordered, activeIndex, groupId || null);
    }

    function switchGroupAndShowOverlay(step) {
        if (!plugin.isGroupFeatureEnabled()) return;
        var targetGroupId = plugin.getRelativeGroupId(getCurrentGroupViewId(), step);
        if (typeof targetGroupId === 'undefined') {
            showSwitchOverlayForGroup(plugin.data.activeGroupId || null);
            return;
        }

        plugin.resolveGroupSelection(targetGroupId).then(function (result) {
            showSwitchOverlayForGroup(result.resolvedGroupId);
        });
    }

    addCommand({
        id: 'switch-group',
        name: L.cmdSwitchGroup,
        callback: function () {
            switchGroupAndShowOverlay(1);
        },
    });

    addCommand({
        id: 'exit-group',
        name: L.cmdExitGroup,
        checkCallback: function (checking) {
            if (!plugin.isGroupFeatureEnabled()) return false;
            if (!plugin.data.activeGroupId) return false;
            if (!checking) plugin.exitGroup();
            return true;
        },
    });

    addCommand({
        id: 'next-group',
        name: L.cmdNextGroup,
        hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'Tab' }],
        callback: function () {
            switchGroupAndShowOverlay(1);
        },
    });

    addSimpleCommand('previous-group', L.cmdPreviousGroup, function () {
        plugin.switchGroupRelative(-1);
    });

}

module.exports = registerCommands;
