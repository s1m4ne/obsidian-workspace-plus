'use strict';

var attachSessionStoreGetter = require('./session-store-getter');

function attachSessionMethods(WorkspacePlusPlus) {
    attachSessionStoreGetter(WorkspacePlusPlus);

    WorkspacePlusPlus.prototype.syncSessionOrder = function () {
        return this.getSessionStore().syncSessionOrder();
    };

    WorkspacePlusPlus.prototype.getActiveSession = function () {
        return this.getSessionStore().getActiveSession();
    };

    WorkspacePlusPlus.prototype.findSessionIndex = function (sessions, sessionId) {
        return this.getSessionStore().findSessionIndex(sessions, sessionId);
    };

    WorkspacePlusPlus.prototype.getSessionIndex = function (sessions, sessionId) {
        return this.getSessionStore().getSessionIndex(sessions, sessionId);
    };

    WorkspacePlusPlus.prototype.findActiveSessionIndex = function (sessions) {
        return this.getSessionStore().findActiveSessionIndex(sessions);
    };

    WorkspacePlusPlus.prototype.getActiveSessionIndex = function (sessions) {
        return this.getSessionStore().getActiveSessionIndex(sessions);
    };

    WorkspacePlusPlus.prototype.getOrderedSessions = function () {
        return this.getSessionStore().getOrderedSessions();
    };

    WorkspacePlusPlus.prototype.getOrderedSessionsUnfiltered = function () {
        return this.getSessionStore().getOrderedSessionsUnfiltered();
    };

    WorkspacePlusPlus.prototype.getOrderedSessionsForGroup = function (groupId) {
        return this.getSessionStore().getOrderedSessionsForGroup(groupId);
    };

    WorkspacePlusPlus.prototype.mergeVisibleSessionOrder = function (visibleOrder) {
        return this.getSessionStore().mergeVisibleSessionOrder(visibleOrder);
    };

    WorkspacePlusPlus.prototype.setSessionOrderFromVisible = function (visibleOrder, options) {
        return this.getSessionStore().setSessionOrderFromVisible(visibleOrder, options);
    };

    WorkspacePlusPlus.prototype.getCurrentWorkspaceLayout = function () {
        return this.getSessionStore().getCurrentWorkspaceLayout();
    };

    WorkspacePlusPlus.prototype.serializeLayout = function (layout) {
        return this.getSessionStore().serializeLayout(layout);
    };

    WorkspacePlusPlus.prototype.layoutsEqual = function (a, b) {
        return this.getSessionStore().layoutsEqual(a, b);
    };

    WorkspacePlusPlus.prototype.layoutsEqualStructural = function (a, b) {
        return this.getSessionStore().layoutsEqualStructural(a, b);
    };
}

module.exports = attachSessionMethods;
