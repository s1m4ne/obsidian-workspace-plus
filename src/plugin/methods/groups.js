'use strict';

var groupManager = require('../../state/group-manager.ts');

function attachGroupMethods(WorkspacePlusPlus) {
    WorkspacePlusPlus.prototype.getGroupManager = function () {
        var self = this;
        if (!this._groupManager) {
            this._groupManager = new groupManager.GroupManager({
                get data() { return self.data; },
                get settingsState() { return typeof self.getSettingsState === 'function' ? self.getSettingsState() : undefined; },
                persistData: function () { return self.persistData(); },
                updateStatusBar: function () { self.updateStatusBar(); },
                syncSessionCommands: function () { self.syncSessionCommands(); },
                hideSwitchOverlay: function () { self.hideSwitchOverlay(); },
                hideSearchOverlay: function () { self.hideSearchOverlay(); },
                switchSession: function (sid) { return self.switchSession(sid); },
                getOrderedSessionsUnfiltered: function () { return self.getOrderedSessionsUnfiltered(); },
                getOrderedSessionsForGroup: function (gid) { return self.getOrderedSessionsForGroup(gid); },
            });
        }
        return this._groupManager;
    };

    WorkspacePlusPlus.prototype.isGroupFeatureEnabled = function () {
        return this.getGroupManager().isGroupFeatureEnabled();
    };

    WorkspacePlusPlus.prototype.normalizeGroupFeatureState = function () {
        return this.getGroupManager().normalizeGroupFeatureState();
    };

    WorkspacePlusPlus.prototype.setGroupFeatureEnabled = function (enabled) {
        return this.getGroupManager().setGroupFeatureEnabled(enabled);
    };

    WorkspacePlusPlus.prototype.attachSessionToActiveGroup = function (sessionId) {
        return this.getGroupManager().attachSessionToActiveGroup(sessionId);
    };

    WorkspacePlusPlus.prototype.getOrderedGroups = function () {
        return this.getGroupManager().getOrderedGroups();
    };

    WorkspacePlusPlus.prototype.normalizeGroupTabOrder = function (order) {
        return this.getGroupManager().normalizeGroupTabOrder(order);
    };

    WorkspacePlusPlus.prototype.getOrderedGroupTabIds = function () {
        return this.getGroupManager().getOrderedGroupTabIds();
    };

    WorkspacePlusPlus.prototype.setGroupTabOrder = function (order, options) {
        return this.getGroupManager().setGroupTabOrder(order, options);
    };

    WorkspacePlusPlus.prototype.getActiveGroup = function () {
        return this.getGroupManager().getActiveGroup();
    };

    WorkspacePlusPlus.prototype.createGroup = function (name) {
        return this.getGroupManager().createGroup(name);
    };

    WorkspacePlusPlus.prototype.deleteGroup = function (groupId) {
        return this.getGroupManager().deleteGroup(groupId);
    };

    WorkspacePlusPlus.prototype.renameGroup = function (groupId, newName) {
        return this.getGroupManager().renameGroup(groupId, newName);
    };

    WorkspacePlusPlus.prototype.setActiveGroup = function (groupId) {
        return this.getGroupManager().setActiveGroup(groupId);
    };

    WorkspacePlusPlus.prototype.exitGroup = function () {
        return this.getGroupManager().exitGroup();
    };

    WorkspacePlusPlus.prototype.getRelativeGroupId = function (baseGroupId, offset) {
        return this.getGroupManager().getRelativeGroupId(baseGroupId, offset);
    };

    WorkspacePlusPlus.prototype.resolveGroupSelection = function (groupId) {
        return this.getGroupManager().resolveGroupSelection(groupId);
    };

    WorkspacePlusPlus.prototype.switchGroupRelative = function (offset) {
        return this.getGroupManager().switchGroupRelative(offset);
    };

    WorkspacePlusPlus.prototype.removeGroupMembershipFromAllSessions = function (groupId, options) {
        return this.getGroupManager().removeGroupMembershipFromAllSessions(groupId, options);
    };

    WorkspacePlusPlus.prototype.removeAllSessionsFromGroup = function (groupId, options) {
        return this.getGroupManager().removeAllSessionsFromGroup(groupId, options);
    };

    WorkspacePlusPlus.prototype.moveSessionToGroupExclusive = function (sessionId, groupId, options) {
        return this.getGroupManager().moveSessionToGroupExclusive(sessionId, groupId, options);
    };

    WorkspacePlusPlus.prototype.clearAllGroups = function (options) {
        return this.getGroupManager().clearAllGroups(options);
    };

    WorkspacePlusPlus.prototype.addSessionToGroup = function (sessionId, groupId) {
        return this.getGroupManager().addSessionToGroup(sessionId, groupId);
    };

    WorkspacePlusPlus.prototype.removeSessionFromGroup = function (sessionId, groupId) {
        return this.getGroupManager().removeSessionFromGroup(sessionId, groupId);
    };

    WorkspacePlusPlus.prototype.getGroupSessionIds = function (groupId) {
        return this.getGroupManager().getGroupSessionIds(groupId);
    };
}

module.exports = attachGroupMethods;
