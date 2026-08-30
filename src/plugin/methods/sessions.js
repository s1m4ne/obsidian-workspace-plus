'use strict';

var sessionStore = require('../../state/session-store.ts');

function attachSessionStoreGetter(WorkspacePlusPlus) {
    if (WorkspacePlusPlus.prototype.getSessionStore) return;
    WorkspacePlusPlus.prototype.getSessionStore = function () {
        var self = this;
        if (!this._sessionStore) {
            this._sessionStore = new sessionStore.SessionStore({
                get data() { return self.data; },
                get app() { return self.app; },
                get manifestId() { return self.manifest ? self.manifest.id : undefined; },
                get groupManager() { return typeof self.getGroupManager === 'function' ? self.getGroupManager() : undefined; },
                get settingsState() { return typeof self.getSettingsState === 'function' ? self.getSettingsState() : undefined; },
                getCurrentWorkspaceLayout: function () {
                    if (self.getCurrentWorkspaceLayout && self.getCurrentWorkspaceLayout !== WorkspacePlusPlus.prototype.getCurrentWorkspaceLayout) {
                        return self.getCurrentWorkspaceLayout();
                    }
                    if (self.app && self.app.workspace && typeof self.app.workspace.getLayout === 'function') {
                        return self.app.workspace.getLayout();
                    }
                    return {};
                },
                createSessionValidated: function (name, options) {
                    if (self.createSessionValidated && self.createSessionValidated !== WorkspacePlusPlus.prototype.createSessionValidated) {
                        return self.createSessionValidated(name, options);
                    }
                    return self.getSessionStore().createSessionValidated(name, options);
                },
                moveSessionToGroupExclusive: function (sid, gid) {
                    return typeof self.moveSessionToGroupExclusive === 'function'
                        ? self.moveSessionToGroupExclusive(sid, gid)
                        : Promise.resolve(false);
                },
                resolveGroupSelection: function (gid) {
                    return typeof self.resolveGroupSelection === 'function'
                        ? self.resolveGroupSelection(gid)
                        : Promise.resolve({ resolvedGroupId: gid });
                },
                attachSessionToActiveGroup: function (sid) {
                    if (typeof self.attachSessionToActiveGroup === 'function') {
                        self.attachSessionToActiveGroup(sid);
                    }
                },
                persistData: function () { return self.persistData(); },
                updateStatusBar: function () { self.updateStatusBar(); },
                syncSessionCommands: function () { self.syncSessionCommands(); },
                hideSwitchOverlay: function () { self.hideSwitchOverlay(); },
                captureActiveSessionLayoutIfAutoSave: function () { self.captureActiveSessionLayoutIfAutoSave(); },
                applyWorkspaceLayout: function (layout) { return self.applyWorkspaceLayout(layout); },
                getWorkspaceRestoreScope: function () { return typeof self.getWorkspaceRestoreScope === 'function' ? self.getWorkspaceRestoreScope() : 'full'; },
            });
        }
        return this._sessionStore;
    };
}

function attachSessionMethods(WorkspacePlusPlus) {
    attachSessionStoreGetter(WorkspacePlusPlus);

    WorkspacePlusPlus.prototype.syncSessionOrder = function () {
        return this.getSessionStore().syncSessionOrder();
    };

    WorkspacePlusPlus.prototype.getOrderedSessionsUnfiltered = function () {
        return this.getSessionStore().getOrderedSessionsUnfiltered();
    };

    WorkspacePlusPlus.prototype.getOrderedSessionsForGroup = function (groupId) {
        return this.getSessionStore().getOrderedSessionsForGroup(groupId);
    };

    WorkspacePlusPlus.prototype.getOrderedSessions = function () {
        return this.getSessionStore().getOrderedSessions();
    };

    WorkspacePlusPlus.prototype.mergeVisibleSessionOrder = function (visibleOrder) {
        return this.getSessionStore().mergeVisibleSessionOrder(visibleOrder);
    };

    WorkspacePlusPlus.prototype.setSessionOrderFromVisible = function (visibleOrder, options) {
        return this.getSessionStore().setSessionOrderFromVisible(visibleOrder, options);
    };

    WorkspacePlusPlus.prototype.getSessionIndex = function (sessions, sessionId) {
        return this.getSessionStore().getSessionIndex(sessions, sessionId);
    };

    WorkspacePlusPlus.prototype.findSessionIndex = function (sessions, sessionId) {
        return this.getSessionStore().findSessionIndex(sessions, sessionId);
    };

    WorkspacePlusPlus.prototype.findActiveSessionIndex = function (sessions) {
        return this.getSessionStore().findActiveSessionIndex(sessions);
    };

    WorkspacePlusPlus.prototype.getActiveSessionIndex = function (sessions) {
        return this.getSessionStore().getActiveSessionIndex(sessions);
    };

    WorkspacePlusPlus.prototype.getActiveSession = function () {
        return this.getSessionStore().getActiveSession();
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
