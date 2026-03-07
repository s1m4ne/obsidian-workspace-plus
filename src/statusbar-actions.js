'use strict';

var obsidian = require('obsidian');
var i18n = require('./i18n');
var modals = require('./modals');
var sessionContextMenu = require('./session-context-menu');
var settingsContextMenu = require('./settings-context-menu');

/**
 * Execute a status bar action by its action ID.
 *
 * @param {Object} plugin  - plugin instance
 * @param {string} actionId - one of the ACTION_IDS values
 * @param {MouseEvent} event - the original mouse event
 */
function executeStatusBarAction(plugin, actionId, event) {
    if (!actionId || actionId === 'none') return;

    var L = i18n.L;
    var app = plugin.app;

    switch (actionId) {
        case 'quickSwitcher':
            if (plugin.searchOverlayEl) {
                plugin.hideSearchOverlay();
            } else {
                plugin.openSearchOverlay(plugin.statusBarEl);
            }
            break;

        case 'sessionManager':
            new modals.SessionManagerModal(app, plugin).open();
            break;

        case 'saveSession':
            plugin.saveActiveSession();
            break;

        case 'reloadWithoutSaving':
            plugin.reloadCurrentSessionWithoutSaving();
            break;

        case 'versionHistory': {
            var session = plugin.getActiveSession();
            if (session) {
                new modals.HistoryModal(app, plugin, session).open();
            }
            break;
        }

        case 'restoreLatestHistory': {
            if (!plugin.isVersionHistoryEnabled()) {
                new obsidian.Notice(L.historyNoEntries);
                return;
            }
            var activeSession = plugin.getActiveSession();
            if (!activeSession || !activeSession.history || activeSession.history.length === 0) {
                new obsidian.Notice(L.historyNoEntries);
                return;
            }
            if (plugin.isVersionHistoryConfirmRestoreEnabled()) {
                var latestTime = new Date(activeSession.history[0].savedAt)
                    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                new modals.ConfirmModal(app,
                    L.historyRestoreConfirm(activeSession.name, latestTime),
                    function () { plugin.quickRestoreLatestHistory(); },
                    { confirmText: L.historyRestore, confirmClass: 'mod-cta' }
                ).open();
            } else {
                plugin.quickRestoreLatestHistory();
            }
            break;
        }

        case 'sessionMenu': {
            var sess = plugin.getActiveSession();
            if (!sess) return;
            sessionContextMenu.openSessionContextMenu({
                plugin: plugin,
                app: app,
                session: sess,
                isActive: true,
                event: event,
                showSaveAs: true,
                showSwitch: false,
                showRemoveFromGroup: false,
                showMoveToGroup: plugin.isGroupFeatureEnabled() && plugin.getOrderedGroups().length > 0,
                showCustomizeClicks: true,
                onMoveToGroup: function (groupId) {
                    var gName = (plugin.data.groups[groupId] || {}).name || '';
                    plugin.moveSessionToGroupExclusive(sess.id, groupId).then(function (moved) {
                        if (moved) {
                            new obsidian.Notice(L.groupAddedSession(sess.name, gName));
                            plugin.updateStatusBar();
                        }
                    });
                },
                onSave: function () {
                    plugin.saveActiveSession();
                },
                onReload: function () {
                    plugin.reloadCurrentSessionWithoutSaving();
                },
                onSaveAs: function () {
                    plugin.saveAsSession();
                },
                onRename: function () {
                    new modals.RenameModal(app, sess.name, function (newName) {
                        plugin.renameSessionById(sess.id, newName);
                    }, {
                        emptyNotice: L.emptyName,
                    }).open();
                },
                onDuplicate: function () {
                    plugin.duplicateSession(sess.id);
                },
                onDelete: function () {
                    new modals.ConfirmModal(app, L.confirmDeleteActive(sess.name), function () {
                        plugin.deleteSession(sess.id);
                    }).open();
                },
                onVersionHistory: function () {
                    new modals.HistoryModal(app, plugin, sess).open();
                },
            });
            break;
        }

        case 'settingsMenu':
            settingsContextMenu.openSettingsContextMenu({
                plugin: plugin,
                app: app,
                event: event,
                onChanged: function () {
                    plugin.updateStatusBar();
                },
            });
            break;
    }
}

/** All valid action IDs in display order. */
var ACTION_IDS = [
    'quickSwitcher',
    'sessionManager',
    'saveSession',
    'reloadWithoutSaving',
    'versionHistory',
    'restoreLatestHistory',
    'sessionMenu',
    'settingsMenu',
    'none',
];

/** Slot keys in display order. */
var SLOT_KEYS = [
    'click',
    'altClick',
    'modClick',
    'shiftClick',
    'middleClick',
    'altMiddleClick',
    'modMiddleClick',
    'shiftMiddleClick',
    'rightClick',
    'altRightClick',
    'modRightClick',
    'shiftRightClick',
];

module.exports = {
    executeStatusBarAction: executeStatusBarAction,
    ACTION_IDS: ACTION_IDS,
    SLOT_KEYS: SLOT_KEYS,
};
