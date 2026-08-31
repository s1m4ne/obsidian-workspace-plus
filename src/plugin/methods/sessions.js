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

    WorkspacePlusPlus.prototype.sessionIndexOrFirst = function (sessions, sessionId) {
        return this.getSessionStore().sessionIndexOrFirst(sessions, sessionId);
    };

    WorkspacePlusPlus.prototype.findActiveSessionIndex = function (sessions) {
        return this.getSessionStore().findActiveSessionIndex(sessions);
    };

    WorkspacePlusPlus.prototype.activeSessionIndexOrFirst = function (sessions) {
        return this.getSessionStore().activeSessionIndexOrFirst(sessions);
    };

    WorkspacePlusPlus.prototype.getOrderedSessions = function () {
        return this.getSessionStore().getOrderedSessions();
    };

    WorkspacePlusPlus.prototype.getOrderedSessionsUnfiltered = function () {
        return this.getSessionStore().getOrderedSessionsUnfiltered();
    };

    // Subscribe to changes in the session set. The overlays use this to redraw
    // themselves while they are on screen; see issue #118.
    WorkspacePlusPlus.prototype.onSessionsChanged = function (listener) {
        return this.getSessionStore().onSessionsChanged(listener);
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
