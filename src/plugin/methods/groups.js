'use strict';

var obsidian = require('obsidian');
var i18n = require('../../i18n');
var utils = require('../../utils');

function attachGroupMethods(WorkspacePlusPlus) {
    WorkspacePlusPlus.prototype.isGroupFeatureEnabled = function () {
        return this.data.groupFeatureEnabled !== false;
    };

    WorkspacePlusPlus.prototype.normalizeGroupFeatureState = function () {
        if (this.isGroupFeatureEnabled()) return;
        this.data.activeGroupId = null;
    };

    WorkspacePlusPlus.prototype.setGroupFeatureEnabled = function (enabled) {
        var nextEnabled = enabled !== false;
        var changed = this.isGroupFeatureEnabled() !== nextEnabled;
        this.data.groupFeatureEnabled = nextEnabled;

        if (!nextEnabled && this.data.activeGroupId) {
            this.data.activeGroupId = null;
            changed = true;
        }

        if (!nextEnabled) {
            this.hideSwitchOverlay();
            this.hideSearchOverlay();
        }

        this.syncSessionCommands();
        this.updateStatusBar();

        if (!changed) return Promise.resolve(false);
        return this.persistData().then(function () { return true; });
    };

    WorkspacePlusPlus.prototype.attachSessionToActiveGroup = function (sessionId) {
        if (!this.isGroupFeatureEnabled()) return;
        var activeGroupId = this.data.activeGroupId;
        if (!activeGroupId) return;
        if (!this.data.sessionGroups) this.data.sessionGroups = {};
        if (!Array.isArray(this.data.sessionGroups[sessionId])) {
            this.data.sessionGroups[sessionId] = [];
        }
        if (this.data.sessionGroups[sessionId].indexOf(activeGroupId) === -1) {
            this.data.sessionGroups[sessionId].push(activeGroupId);
        }
    };

    WorkspacePlusPlus.prototype.getOrderedGroups = function () {
        if (!this.isGroupFeatureEnabled()) return [];
        var groups = this.data.groups || {};
        return (this.data.groupOrder || [])
            .map(function (id) { return groups[id]; })
            .filter(function (g) { return !!g; });
    };

    WorkspacePlusPlus.prototype.normalizeGroupTabOrder = function (order) {
        var groups = this.data.groups || {};
        var input = Array.isArray(order) ? order : [];
        var seen = {};
        var out = [];
        var i;

        for (i = 0; i < input.length; i++) {
            var gid = input[i];
            if (gid !== '__all__' && !groups[gid]) continue;
            if (seen[gid]) continue;
            seen[gid] = true;
            out.push(gid);
        }

        if (!seen.__all__) {
            out.unshift('__all__');
            seen.__all__ = true;
        }

        var existingIds = Object.keys(groups);
        for (i = 0; i < existingIds.length; i++) {
            if (seen[existingIds[i]]) continue;
            seen[existingIds[i]] = true;
            out.push(existingIds[i]);
        }

        return out;
    };

    WorkspacePlusPlus.prototype.getOrderedGroupTabIds = function () {
        if (!this.isGroupFeatureEnabled()) return [];
        this.data.groupOrder = this.normalizeGroupTabOrder(this.data.groupOrder);
        return this.data.groupOrder.slice();
    };

    WorkspacePlusPlus.prototype.setGroupTabOrder = function (order, options) {
        if (!this.isGroupFeatureEnabled()) return Promise.resolve(false);
        var prev = Array.isArray(this.data.groupOrder) ? this.data.groupOrder : [];
        var normalized = this.normalizeGroupTabOrder(order);
        var changed = prev.length !== normalized.length;
        if (!changed) {
            for (var i = 0; i < prev.length; i++) {
                if (prev[i] !== normalized[i]) {
                    changed = true;
                    break;
                }
            }
        }
        this.data.groupOrder = normalized;

        if (options && options.persist === false) return Promise.resolve(changed);
        if (!changed) return Promise.resolve(false);
        return this.persistData().then(function () { return true; });
    };

    WorkspacePlusPlus.prototype.getActiveGroup = function () {
        if (!this.isGroupFeatureEnabled()) return null;
        if (!this.data.activeGroupId) return null;
        return (this.data.groups || {})[this.data.activeGroupId] || null;
    };

    WorkspacePlusPlus.prototype.createGroup = function (name) {
        var L = i18n.L;
        var id = utils.generateId();
        if (!this.data.groups) this.data.groups = {};

        this.data.groups[id] = { id: id, name: name };
        var nextOrder = Array.isArray(this.data.groupOrder) ? this.data.groupOrder.slice() : [];
        nextOrder.push(id);
        this.data.groupOrder = this.normalizeGroupTabOrder(nextOrder);

        new obsidian.Notice(L.groupCreated(name));
        return this.persistData().then(function () { return id; });
    };

    WorkspacePlusPlus.prototype.deleteGroup = function (groupId) {
        var L = i18n.L;
        if (!this.data.groups || !this.data.groups[groupId]) return Promise.resolve(false);

        var name = this.data.groups[groupId].name;
        delete this.data.groups[groupId];

        var nextOrder = (this.data.groupOrder || []).filter(function (gid) {
            return gid !== groupId;
        });
        this.data.groupOrder = this.normalizeGroupTabOrder(nextOrder);

        this.removeGroupMembershipFromAllSessions(groupId, { persist: false });

        // Reset active group if deleted
        if (this.data.activeGroupId === groupId) {
            this.data.activeGroupId = null;
        }

        this.updateStatusBar();
        this.syncSessionCommands();
        new obsidian.Notice(L.groupDeleted(name));
        return this.persistData().then(function () { return true; });
    };

    WorkspacePlusPlus.prototype.renameGroup = function (groupId, newName) {
        var L = i18n.L;
        if (!this.data.groups || !this.data.groups[groupId]) return Promise.resolve(false);

        var oldName = this.data.groups[groupId].name;
        this.data.groups[groupId].name = newName;
        this.updateStatusBar();

        new obsidian.Notice(L.groupRenamed(oldName, newName));
        return this.persistData().then(function () { return true; });
    };

    WorkspacePlusPlus.prototype.setActiveGroup = function (groupId) {
        if (!this.isGroupFeatureEnabled()) return Promise.resolve(false);
        var nextGroupId = groupId || null;
        if (nextGroupId && (!this.data.groups || !this.data.groups[nextGroupId])) return Promise.resolve(false);

        var self = this;
        var commitGroup = function () {
            self.data.activeGroupId = nextGroupId;
            self.syncSessionCommands();
            self.updateStatusBar();
            return self.persistData().then(function () { return true; });
        };

        if (!nextGroupId) {
            return commitGroup();
        }

        // Resolve target sessions before mutating group to keep group/session switch atomic.
        var sessionGroups = this.data.sessionGroups || {};
        var targetSessions = this.getOrderedSessionsUnfiltered().filter(function (s) {
            var groups = sessionGroups[s.id];
            return groups && groups.indexOf(nextGroupId) !== -1;
        });
        if (targetSessions.length === 0) {
            return Promise.resolve(false);
        }

        var activeId = this.data.activeSessionId;
        var isInTarget = targetSessions.some(function (s) { return s.id === activeId; });
        if (isInTarget) {
            return commitGroup();
        }

        return this.switchSession(targetSessions[0].id).then(function (switched) {
            if (!switched) return false;
            return commitGroup();
        });
    };

    WorkspacePlusPlus.prototype.exitGroup = function () {
        return this.setActiveGroup(null);
    };

    WorkspacePlusPlus.prototype.getRelativeGroupId = function (baseGroupId, offset) {
        if (!this.isGroupFeatureEnabled()) return undefined;
        var ordered = this.getOrderedGroups();
        if (ordered.length === 0) return undefined;

        var currentId = baseGroupId || null;
        if (!currentId) {
            var edgeIdx = offset > 0 ? 0 : ordered.length - 1;
            return ordered[edgeIdx].id;
        }

        var currentIdx = -1;
        for (var i = 0; i < ordered.length; i++) {
            if (ordered[i].id === currentId) { currentIdx = i; break; }
        }
        if (currentIdx === -1) return ordered[0].id;

        var nextIdx = currentIdx + offset;
        if (nextIdx < 0 || nextIdx >= ordered.length) return null;
        return ordered[nextIdx].id;
    };

    WorkspacePlusPlus.prototype.resolveGroupSelection = function (groupId) {
        if (!this.isGroupFeatureEnabled()) {
            return Promise.resolve({
                switched: false,
                targetGroupId: null,
                resolvedGroupId: null,
                sessions: this.getOrderedSessionsUnfiltered(),
            });
        }
        var targetGroupId = groupId || null;
        var targetSessions = this.getOrderedSessionsForGroup(targetGroupId);
        var self = this;

        return this.setActiveGroup(targetGroupId).then(function (switched) {
            var resolvedGroupId;
            if (switched) {
                resolvedGroupId = self.data.activeGroupId || null;
            } else if (targetSessions.length === 0) {
                // Empty group is a view-only selection in overlays/modals.
                resolvedGroupId = targetGroupId;
            } else {
                resolvedGroupId = self.data.activeGroupId || null;
            }
            return {
                switched: switched,
                targetGroupId: targetGroupId,
                resolvedGroupId: resolvedGroupId,
                sessions: self.getOrderedSessionsForGroup(resolvedGroupId),
            };
        });
    };

    WorkspacePlusPlus.prototype.switchGroupRelative = function (offset) {
        if (!this.isGroupFeatureEnabled()) return Promise.resolve(false);
        var targetGroupId = this.getRelativeGroupId(this.data.activeGroupId, offset);
        if (typeof targetGroupId === 'undefined') return Promise.resolve(false);
        return this.setActiveGroup(targetGroupId);
    };

    WorkspacePlusPlus.prototype.removeGroupMembershipFromAllSessions = function (groupId, options) {
        if (!groupId) return Promise.resolve(false);

        var sg = this.data.sessionGroups || {};
        var keys = Object.keys(sg);
        var changed = false;
        for (var i = 0; i < keys.length; i++) {
            var arr = sg[keys[i]];
            var idx = arr.indexOf(groupId);
            if (idx !== -1) {
                arr.splice(idx, 1);
                changed = true;
                if (arr.length === 0) delete sg[keys[i]];
            }
        }

        if (!changed) return Promise.resolve(false);
        this.syncSessionCommands();
        if (options && options.persist === false) return Promise.resolve(true);
        return this.persistData().then(function () { return true; });
    };

    WorkspacePlusPlus.prototype.removeAllSessionsFromGroup = function (groupId, options) {
        if (!groupId) return Promise.resolve(false);
        var groups = this.data.groups || {};
        if (!groups[groupId]) return Promise.resolve(false);
        return this.removeGroupMembershipFromAllSessions(groupId, options);
    };

    WorkspacePlusPlus.prototype.moveSessionToGroupExclusive = function (sessionId, groupId, options) {
        if (!this.data.sessions[sessionId]) return Promise.resolve(false);
        if (!this.data.groups || !this.data.groups[groupId]) return Promise.resolve(false);

        if (!this.data.sessionGroups) this.data.sessionGroups = {};
        var prev = this.data.sessionGroups[sessionId] || [];
        var changed = prev.length !== 1 || prev[0] !== groupId;

        if (!changed) return Promise.resolve(false);
        this.data.sessionGroups[sessionId] = [groupId];
        this.syncSessionCommands();
        if (options && options.persist === false) return Promise.resolve(true);
        return this.persistData().then(function () { return true; });
    };

    WorkspacePlusPlus.prototype.clearAllGroups = function (options) {
        var groupCount = Object.keys(this.data.groups || {}).length;
        var sessionGroupCount = Object.keys(this.data.sessionGroups || {}).length;
        var hasActiveGroup = !!this.data.activeGroupId;
        var hadCustomOrder = Array.isArray(this.data.groupOrder)
            ? this.data.groupOrder.some(function (id) { return id !== '__all__'; })
            : false;
        var changed = groupCount > 0 || sessionGroupCount > 0 || hasActiveGroup || hadCustomOrder;

        this.data.sessionGroups = {};
        this.data.groups = {};
        this.data.groupOrder = this.normalizeGroupTabOrder([]);
        this.data.activeGroupId = null;

        this.syncSessionCommands();
        this.updateStatusBar();

        if (!changed) return Promise.resolve(false);
        if (options && options.persist === false) return Promise.resolve(true);
        return this.persistData().then(function () { return true; });
    };

    WorkspacePlusPlus.prototype.addSessionToGroup = function (sessionId, groupId) {
        if (!this.data.sessions[sessionId]) return Promise.resolve(false);
        if (!this.data.groups || !this.data.groups[groupId]) return Promise.resolve(false);

        if (!this.data.sessionGroups) this.data.sessionGroups = {};
        if (!this.data.sessionGroups[sessionId]) this.data.sessionGroups[sessionId] = [];

        if (this.data.sessionGroups[sessionId].indexOf(groupId) !== -1) return Promise.resolve(false);

        this.data.sessionGroups[sessionId].push(groupId);
        this.syncSessionCommands();
        return this.persistData().then(function () { return true; });
    };

    WorkspacePlusPlus.prototype.removeSessionFromGroup = function (sessionId, groupId) {
        if (!this.data.sessionGroups || !this.data.sessionGroups[sessionId]) return Promise.resolve(false);

        var arr = this.data.sessionGroups[sessionId];
        var idx = arr.indexOf(groupId);
        if (idx === -1) return Promise.resolve(false);

        arr.splice(idx, 1);
        if (arr.length === 0) delete this.data.sessionGroups[sessionId];

        this.syncSessionCommands();
        return this.persistData().then(function () { return true; });
    };

    WorkspacePlusPlus.prototype.getGroupSessionIds = function (groupId) {
        var sg = this.data.sessionGroups || {};
        var result = [];
        var keys = Object.keys(sg);
        for (var i = 0; i < keys.length; i++) {
            if (sg[keys[i]].indexOf(groupId) !== -1) result.push(keys[i]);
        }
        return result;
    };
}

module.exports = attachGroupMethods;
