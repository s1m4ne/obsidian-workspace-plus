'use strict';

var obsidian = require('obsidian');
var i18n = require('./i18n');
var modals = require('./modals');
var sessionContextMenu = require('./session-context-menu');
var settingsContextMenu = require('./settings-context-menu');

function openSessionMenuAction(plugin, event) {
    var L = i18n.L;
    var app = plugin.app;
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
}

function openSettingsMenuAction(plugin, event) {
    var app = plugin.app;

    settingsContextMenu.openSettingsContextMenu({
        plugin: plugin,
        app: app,
        event: event,
        onChanged: function () {
            plugin.updateStatusBar();
        },
    });
}

function resolveLabel(L, labelKey) {
    var label = L[labelKey];
    return typeof label === 'function' ? label() : label;
}

var ACTIONS = [
    {
        id: 'quickSwitcher',
        labelKey: 'statusBarActionQuickSwitcher',
        run: function (plugin) {
            if (plugin.searchOverlayEl) {
                plugin.hideSearchOverlay();
            } else {
                plugin.openSearchOverlay(plugin.statusBarEl);
            }
        },
    },
    {
        id: 'sessionManager',
        labelKey: 'statusBarActionSessionManager',
        run: function (plugin) {
            new modals.SessionManagerModal(plugin.app, plugin).open();
        },
    },
    {
        id: 'saveSession',
        labelKey: 'statusBarActionSaveSession',
        run: function (plugin) {
            return plugin.saveActiveSession();
        },
    },
    {
        id: 'saveAsSession',
        labelKey: 'cmdSaveAs',
        run: function (plugin) {
            return plugin.saveAsSession();
        },
    },
    {
        id: 'reloadWithoutSaving',
        labelKey: 'statusBarActionReloadWithoutSaving',
        run: function (plugin) {
            return plugin.reloadCurrentSessionWithoutSaving();
        },
    },
    {
        id: 'renameSession',
        labelKey: 'cmdRename',
        run: function (plugin) {
            plugin.renameCurrentSession();
        },
    },
    {
        id: 'duplicateSession',
        labelKey: 'cmdDuplicate',
        run: function (plugin) {
            return plugin.duplicateCurrentSession();
        },
    },
    {
        id: 'previousSession',
        labelKey: 'cmdPrevious',
        run: function (plugin) {
            return plugin.switchRelativeImmediate(-1);
        },
    },
    {
        id: 'nextSession',
        labelKey: 'cmdNext',
        run: function (plugin) {
            return plugin.switchRelativeImmediate(1);
        },
    },
    {
        id: 'newEmptySession',
        labelKey: 'cmdNewEmpty',
        run: function (plugin) {
            return plugin.createEmptySession();
        },
    },
    {
        id: 'toggleAutoSaveOnSwitch',
        labelKey: 'cmdToggleAutoSave',
        run: function (plugin) {
            return plugin.toggleAutoSaveOnSwitch({ notify: true });
        },
    },
    {
        id: 'versionHistory',
        labelKey: 'statusBarActionVersionHistory',
        run: function (plugin) {
            var session = plugin.getActiveSession();
            if (session) {
                new modals.HistoryModal(plugin.app, plugin, session).open();
            }
        },
    },
    {
        id: 'restoreLatestHistory',
        labelKey: 'statusBarActionRestoreLatestHistory',
        run: function (plugin) {
            var L = i18n.L;
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
                new modals.ConfirmModal(plugin.app,
                    L.historyRestoreConfirm(activeSession.name, latestTime),
                    function () { plugin.quickRestoreLatestHistory(); },
                    { confirmText: L.historyRestore, confirmClass: 'mod-cta' }
                ).open();
            } else {
                plugin.quickRestoreLatestHistory();
            }
        },
    },
    {
        id: 'sessionMenu',
        labelKey: 'statusBarActionSessionMenu',
        run: function (plugin, event) {
            openSessionMenuAction(plugin, event);
        },
    },
    {
        id: 'settingsMenu',
        labelKey: 'statusBarActionSettingsMenu',
        run: function (plugin, event) {
            openSettingsMenuAction(plugin, event);
        },
    },
    {
        id: 'none',
        labelKey: 'statusBarActionNone',
        run: function () {},
    },
];

var ACTION_INDEX = {};
for (var actionIndex = 0; actionIndex < ACTIONS.length; actionIndex++) {
    ACTION_INDEX[ACTIONS[actionIndex].id] = ACTIONS[actionIndex];
}

/**
 * Execute a status bar action by its action ID.
 *
 * @param {Object} plugin  - plugin instance
 * @param {string} actionId - one of the ACTION_IDS values
 * @param {MouseEvent} event - the original mouse event
 */
function executeStatusBarAction(plugin, actionId, event) {
    if (!actionId || actionId === 'none') return;

    var action = ACTION_INDEX[actionId];
    if (!action) return;
    return action.run(plugin, event);
}

function getActionLabel(L, actionId) {
    var action = ACTION_INDEX[actionId] || ACTION_INDEX.none;
    return resolveLabel(L, action.labelKey);
}

/** All valid action IDs in display order. */
var ACTION_IDS = ACTIONS.map(function (action) {
    return action.id;
});

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
    getActionLabel: getActionLabel,
    ACTION_IDS: ACTION_IDS,
    SLOT_KEYS: SLOT_KEYS,
};
