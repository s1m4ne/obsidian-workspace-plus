'use strict';

var obsidian = require('obsidian');
var i18n = require('./i18n.ts');
var HistoryModal = require('./modals/history-modal.ts').HistoryModal;
var sessionContextMenu = require('./session-context-menu');
var sessionListActions = require('./session-list-actions');

function hasOwn(options, key) {
    return Object.prototype.hasOwnProperty.call(options, key);
}

function optionOrDefault(options, key, fallback) {
    return hasOwn(options, key) ? options[key] : fallback;
}

function call(fn) {
    if (typeof fn === 'function') fn();
}

function callAfter(promise, fn) {
    if (promise && typeof promise.then === 'function') {
        return promise.then(function (value) {
            call(fn);
            return value;
        });
    }
    call(fn);
    return promise;
}

function getGroupName(plugin, groupId) {
    return ((plugin.data.groups || {})[groupId] || {}).name || '';
}

function shouldShowMoveToGroup(plugin) {
    return !!(
        plugin
        && plugin.isGroupFeatureEnabled
        && plugin.isGroupFeatureEnabled()
        && plugin.getOrderedGroups
        && plugin.getOrderedGroups().length > 0
    );
}

function refreshSessions(options) {
    call(options.onSessionsChanged);
}

function refreshGroups(options) {
    call(options.onGroupsChanged);
}

function refreshGroupsAndSessions(options) {
    refreshGroups(options);
    refreshSessions(options);
}

function createSessionContextMenuOptions(options) {
    var L = i18n.L;
    options = options || {};
    var plugin = options.plugin;
    var app = options.app || (plugin ? plugin.app : null);
    var session = options.session;
    if (!plugin || !app || !session) return null;

    var isActive = hasOwn(options, 'isActive')
        ? !!options.isActive
        : session.id === plugin.data.activeSessionId;
    var getViewGroupId = typeof options.getViewGroupId === 'function'
        ? options.getViewGroupId
        : function () { return null; };

    function defaultSave() {
        return callAfter(plugin.saveActiveSession(), function () {
            refreshSessions(options);
        });
    }

    function defaultReload() {
        return plugin.reloadCurrentSessionWithoutSaving();
    }

    function defaultSaveAs() {
        return callAfter(plugin.saveAsSession(), function () {
            refreshSessions(options);
        });
    }

    function defaultOverwriteWithCurrentLayout() {
        return plugin.confirmOverwriteSessionWithCurrentLayout(session.id, {
            onSaved: function () {
                refreshSessions(options);
            },
        });
    }

    function defaultRename() {
        return sessionListActions.renameSessionWithPrompt({
            app: app,
            plugin: plugin,
            session: session,
            onRenamed: function () {
                refreshSessions(options);
            },
        });
    }

    function defaultDuplicate() {
        return callAfter(plugin.duplicateSession(session.id), function () {
            refreshSessions(options);
        });
    }

    function defaultRemoveFromGroup() {
        var groupId = getViewGroupId();
        if (!groupId) return;
        var groupName = getGroupName(plugin, groupId);
        return plugin.removeSessionFromGroup(session.id, groupId).then(function () {
            new obsidian.Notice(L.groupRemovedSession(session.name, groupName));
            refreshGroupsAndSessions(options);
        });
    }

    function defaultMoveToGroup(groupId) {
        var groupName = getGroupName(plugin, groupId);
        return plugin.moveSessionToGroupExclusive(session.id, groupId).then(function (moved) {
            if (!moved) return false;
            new obsidian.Notice(L.groupAddedSession(session.name, groupName));
            refreshGroupsAndSessions(options);
            return true;
        });
    }

    function defaultDelete() {
        var confirmMessage = hasOwn(options, 'deleteConfirmMessage')
            ? options.deleteConfirmMessage
            : (isActive ? L.confirmDeleteActive(session.name) : L.confirmDelete(session.name));
        return sessionListActions.deleteSessionWithPrompt({
            app: app,
            plugin: plugin,
            session: session,
            isActive: isActive,
            confirmMessage: confirmMessage,
            forceConfirm: !!options.forceDeleteConfirm,
            notifyDeleted: options.notifyDeleted,
            confirmOptions: options.deleteConfirmOptions,
            onDeleted: function () {
                refreshSessions(options);
            },
        });
    }

    function defaultVersionHistory() {
        return new HistoryModal(app, plugin, session).open();
    }

    return {
        plugin: plugin,
        app: app,
        session: session,
        isActive: isActive,
        event: options.event,
        showSaveAs: !!options.showSaveAs,
        showSwitch: !!options.showSwitch,
        showRemoveFromGroup: optionOrDefault(options, 'showRemoveFromGroup', !!getViewGroupId()),
        showMoveToGroup: optionOrDefault(options, 'showMoveToGroup', shouldShowMoveToGroup(plugin)),
        showCustomizeClicks: !!options.showCustomizeClicks,
        onSave: options.onSave || defaultSave,
        onReload: options.onReload || defaultReload,
        onSaveAs: options.onSaveAs || defaultSaveAs,
        onOverwriteWithCurrentLayout: options.onOverwriteWithCurrentLayout || defaultOverwriteWithCurrentLayout,
        onSwitch: options.onSwitch,
        onRename: options.onRename || defaultRename,
        onDuplicate: options.onDuplicate || defaultDuplicate,
        onDelete: options.onDelete || defaultDelete,
        onRemoveFromGroup: options.onRemoveFromGroup || defaultRemoveFromGroup,
        onMoveToGroup: options.onMoveToGroup || defaultMoveToGroup,
        onVersionHistory: options.onVersionHistory || defaultVersionHistory,
    };
}

function openSessionContextMenu(options) {
    var menuOptions = createSessionContextMenuOptions(options);
    if (!menuOptions) return;
    sessionContextMenu.openSessionContextMenu(menuOptions);
}

module.exports = {
    createSessionContextMenuOptions: createSessionContextMenuOptions,
    openSessionContextMenu: openSessionContextMenu,
};
