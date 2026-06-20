'use strict';

var layoutUtils = require('../../layout-utils');

function attachSessionMethods(WorkspacePlusPlus) {
    // --- Session order ---

    WorkspacePlusPlus.prototype.syncSessionOrder = function () {
        var sessions = this.data.sessions;
        var order = this.data.sessionOrder;
        // Remove IDs no longer in sessions
        this.data.sessionOrder = order.filter(function (id) { return !!sessions[id]; });
        // Find sessions not yet in order
        var inOrder = {};
        for (var i = 0; i < this.data.sessionOrder.length; i++) {
            inOrder[this.data.sessionOrder[i]] = true;
        }
        var missing = Object.keys(sessions).filter(function (id) { return !inOrder[id]; });
        missing.sort(function (a, b) {
            if (sessions[a].isDefault) return -1;
            if (sessions[b].isDefault) return 1;
            return sessions[a].name.localeCompare(sessions[b].name);
        });
        for (var j = 0; j < missing.length; j++) {
            if (sessions[missing[j]].isDefault) {
                this.data.sessionOrder.unshift(missing[j]);
            } else {
                this.data.sessionOrder.push(missing[j]);
            }
        }
    };

    WorkspacePlusPlus.prototype.getOrderedSessionsUnfiltered = function () {
        var sessions = this.data.sessions;
        return this.data.sessionOrder
            .map(function (id) { return sessions[id]; })
            .filter(function (s) { return !!s; });
    };

    WorkspacePlusPlus.prototype.getOrderedSessionsForGroup = function (groupId) {
        var all = this.getOrderedSessionsUnfiltered();
        if (!this.isGroupFeatureEnabled()) return all;
        var targetGroupId = groupId || null;
        if (!targetGroupId) return all;

        var sessionGroups = this.data.sessionGroups || {};
        return all.filter(function (s) {
            var groups = sessionGroups[s.id];
            return groups && groups.indexOf(targetGroupId) !== -1;
        });
    };

    WorkspacePlusPlus.prototype.getOrderedSessions = function () {
        if (!this.isGroupFeatureEnabled()) {
            return this.getOrderedSessionsUnfiltered();
        }
        return this.getOrderedSessionsForGroup(this.data.activeGroupId);
    };

    WorkspacePlusPlus.prototype.mergeVisibleSessionOrder = function (visibleOrder) {
        var fullOrder = Array.isArray(this.data.sessionOrder) ? this.data.sessionOrder : [];
        var visible = Array.isArray(visibleOrder) ? visibleOrder : [];
        var visibleSet = {};
        for (var i = 0; i < visible.length; i++) {
            visibleSet[visible[i]] = true;
        }

        var visibleIdx = 0;
        var merged = [];
        for (var fi = 0; fi < fullOrder.length; fi++) {
            if (visibleSet[fullOrder[fi]]) {
                merged.push(visible[visibleIdx++]);
            } else {
                merged.push(fullOrder[fi]);
            }
        }
        while (visibleIdx < visible.length) {
            merged.push(visible[visibleIdx++]);
        }
        return merged;
    };

    WorkspacePlusPlus.prototype.setSessionOrderFromVisible = function (visibleOrder, options) {
        var prev = Array.isArray(this.data.sessionOrder) ? this.data.sessionOrder : [];
        var merged = this.mergeVisibleSessionOrder(visibleOrder);
        var changed = prev.length !== merged.length;
        if (!changed) {
            for (var i = 0; i < prev.length; i++) {
                if (prev[i] !== merged[i]) {
                    changed = true;
                    break;
                }
            }
        }

        this.data.sessionOrder = merged;
        if (!(options && options.syncCommands === false)) {
            this.syncSessionCommands();
        }
        if (options && options.persist === false) return Promise.resolve(changed);
        if (!changed) return Promise.resolve(false);
        return this.persistData().then(function () { return true; });
    };

    WorkspacePlusPlus.prototype.getSessionIndex = function (sessions, sessionId) {
        var idx = this.findSessionIndex(sessions, sessionId);
        return idx === -1 ? 0 : idx;
    };

    WorkspacePlusPlus.prototype.findSessionIndex = function (sessions, sessionId) {
        if (!sessions || sessions.length === 0) return -1;
        for (var i = 0; i < sessions.length; i++) {
            if (sessions[i] && sessions[i].id === sessionId) {
                return i;
            }
        }
        return -1;
    };

    WorkspacePlusPlus.prototype.findActiveSessionIndex = function (sessions) {
        return this.findSessionIndex(sessions, this.data.activeSessionId);
    };

    WorkspacePlusPlus.prototype.getActiveSessionIndex = function (sessions) {
        return this.getSessionIndex(sessions, this.data.activeSessionId);
    };

    WorkspacePlusPlus.prototype.getActiveSession = function () {
        if (!this.data.activeSessionId) return null;
        return this.data.sessions[this.data.activeSessionId] || null;
    };

    WorkspacePlusPlus.prototype.getCurrentWorkspaceLayout = function () {
        return this.app.workspace.getLayout();
    };

    WorkspacePlusPlus.prototype.serializeLayout = function (layout) {
        return layoutUtils.serializeLayout(layout);
    };

    WorkspacePlusPlus.prototype.layoutsEqual = function (a, b) {
        return layoutUtils.layoutsEqual(a, b);
    };

    WorkspacePlusPlus.prototype.layoutsEqualStructural = function (a, b) {
        return layoutUtils.layoutsEqualStructural(a, b);
    };

}

module.exports = attachSessionMethods;
