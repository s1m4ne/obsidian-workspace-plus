'use strict';

// GroupStore requires SettingsState rather than treating it as optional, so this
// adapter attaches the settings methods itself. Tests build plugins from module
// subsets, and a dependency that is sometimes undefined is what let a duplicated
// default survive in the branch that covered for it.
var attachSettingsStateMethods = require('./settings-state');
var groupStore = require('../../state/group-store.ts');

function attachGroupMethods(WorkspacePlusPlus) {
    attachSettingsStateMethods(WorkspacePlusPlus);

    WorkspacePlusPlus.prototype.getGroupStore = function () {
        var self = this;
        if (!this._groupStore) {
            this._groupStore = new groupStore.GroupStore({
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
        return this._groupStore;
    };

    WorkspacePlusPlus.prototype.isGroupFeatureEnabled = function () {
        return this.getGroupStore().isGroupFeatureEnabled();
    };

    WorkspacePlusPlus.prototype.normalizeGroupFeatureState = function () {
        return this.getGroupStore().normalizeGroupFeatureState();
    };

    WorkspacePlusPlus.prototype.setGroupFeatureEnabled = function (enabled) {
        return this.getGroupStore().setGroupFeatureEnabled(enabled);
    };

    WorkspacePlusPlus.prototype.attachSessionToActiveGroup = function (sessionId) {
        return this.getGroupStore().attachSessionToActiveGroup(sessionId);
    };

    WorkspacePlusPlus.prototype.getOrderedGroups = function () {
        return this.getGroupStore().getOrderedGroups();
    };

    WorkspacePlusPlus.prototype.normalizeGroupTabOrder = function (order) {
        return this.getGroupStore().normalizeGroupTabOrder(order);
    };

    WorkspacePlusPlus.prototype.getOrderedGroupTabIds = function () {
        return this.getGroupStore().getOrderedGroupTabIds();
    };

    WorkspacePlusPlus.prototype.setGroupTabOrder = function (order, options) {
        return this.getGroupStore().setGroupTabOrder(order, options);
    };

    WorkspacePlusPlus.prototype.getActiveGroup = function () {
        return this.getGroupStore().getActiveGroup();
    };

    WorkspacePlusPlus.prototype.createGroup = function (name) {
        return this.getGroupStore().createGroup(name);
    };

    WorkspacePlusPlus.prototype.deleteGroup = function (groupId) {
        return this.getGroupStore().deleteGroup(groupId);
    };

    WorkspacePlusPlus.prototype.renameGroup = function (groupId, newName) {
        return this.getGroupStore().renameGroup(groupId, newName);
    };

    WorkspacePlusPlus.prototype.setActiveGroup = function (groupId) {
        return this.getGroupStore().setActiveGroup(groupId);
    };

    WorkspacePlusPlus.prototype.exitGroup = function () {
        return this.getGroupStore().exitGroup();
    };

    WorkspacePlusPlus.prototype.getRelativeGroupId = function (baseGroupId, offset) {
        return this.getGroupStore().getRelativeGroupId(baseGroupId, offset);
    };

    WorkspacePlusPlus.prototype.resolveGroupSelection = function (groupId) {
        return this.getGroupStore().resolveGroupSelection(groupId);
    };

    WorkspacePlusPlus.prototype.switchGroupRelative = function (offset) {
        return this.getGroupStore().switchGroupRelative(offset);
    };

    WorkspacePlusPlus.prototype.removeGroupMembershipFromAllSessions = function (groupId, options) {
        return this.getGroupStore().removeGroupMembershipFromAllSessions(groupId, options);
    };

    WorkspacePlusPlus.prototype.removeAllSessionsFromGroup = function (groupId, options) {
        return this.getGroupStore().removeAllSessionsFromGroup(groupId, options);
    };

    WorkspacePlusPlus.prototype.moveSessionToGroupExclusive = function (sessionId, groupId, options) {
        return this.getGroupStore().moveSessionToGroupExclusive(sessionId, groupId, options);
    };

    WorkspacePlusPlus.prototype.clearAllGroups = function (options) {
        return this.getGroupStore().clearAllGroups(options);
    };

    WorkspacePlusPlus.prototype.addSessionToGroup = function (sessionId, groupId) {
        return this.getGroupStore().addSessionToGroup(sessionId, groupId);
    };

    WorkspacePlusPlus.prototype.removeSessionFromGroup = function (sessionId, groupId) {
        return this.getGroupStore().removeSessionFromGroup(sessionId, groupId);
    };

    WorkspacePlusPlus.prototype.getGroupSessionIds = function (groupId) {
        return this.getGroupStore().getGroupSessionIds(groupId);
    };
}

module.exports = attachGroupMethods;
