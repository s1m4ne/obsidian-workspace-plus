'use strict';

var attachGroupMethods = require('./groups');
var attachSettingsStateMethods = require('./settings-state');
var sessionStore = require('../../state/session-store.ts');

function attachSessionStoreGetter(WorkspacePlusPlus) {
    attachGroupMethods(WorkspacePlusPlus);
    attachSettingsStateMethods(WorkspacePlusPlus);

    if (WorkspacePlusPlus.prototype.getSessionStore) return;
    WorkspacePlusPlus.prototype.getSessionStore = function () {
        var self = this;
        if (!this._sessionStore) {
            this._sessionStore = new sessionStore.SessionStore({
                get data() { return self.data; },
                get app() { return self.app; },
                get manifestId() { return self.manifest ? self.manifest.id : undefined; },
                get groupStore() { return typeof self.getGroupStore === 'function' ? self.getGroupStore() : undefined; },
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
                    return undefined;
                },
                moveSessionToGroupExclusive: function (sid, gid) {
                    if (self.moveSessionToGroupExclusive && self.moveSessionToGroupExclusive !== WorkspacePlusPlus.prototype.moveSessionToGroupExclusive) {
                        return self.moveSessionToGroupExclusive(sid, gid);
                    }
                    if (typeof self.getGroupStore === 'function') {
                        return self.getGroupStore().moveSessionToGroupExclusive(sid, gid);
                    }
                    return Promise.resolve(false);
                },
                resolveGroupSelection: function (gid) {
                    if (self.resolveGroupSelection && self.resolveGroupSelection !== WorkspacePlusPlus.prototype.resolveGroupSelection) {
                        return self.resolveGroupSelection(gid);
                    }
                    if (typeof self.getGroupStore === 'function') {
                        return self.getGroupStore().resolveGroupSelection(gid);
                    }
                    return Promise.resolve({ resolvedGroupId: gid });
                },
                attachSessionToActiveGroup: function (sid) {
                    if (self.attachSessionToActiveGroup && self.attachSessionToActiveGroup !== WorkspacePlusPlus.prototype.attachSessionToActiveGroup) {
                        self.attachSessionToActiveGroup(sid);
                    } else if (typeof self.getGroupStore === 'function') {
                        self.getGroupStore().attachSessionToActiveGroup(sid);
                    }
                },
                persistData: function () {
                    return typeof self.persistData === 'function' ? self.persistData() : Promise.resolve(true);
                },
                updateStatusBar: function () {
                    if (typeof self.updateStatusBar === 'function') self.updateStatusBar();
                },
                syncSessionCommands: function () {
                    if (typeof self.syncSessionCommands === 'function') self.syncSessionCommands();
                },
                hideSwitchOverlay: function () {
                    if (typeof self.hideSwitchOverlay === 'function') self.hideSwitchOverlay();
                },
                captureActiveSessionLayoutIfAutoSave: function () {
                    if (typeof self.captureActiveSessionLayoutIfAutoSave === 'function') self.captureActiveSessionLayoutIfAutoSave();
                },
                applyWorkspaceLayout: function (layout) {
                    if (self.applyWorkspaceLayout && self.applyWorkspaceLayout !== WorkspacePlusPlus.prototype.applyWorkspaceLayout) {
                        return self.applyWorkspaceLayout(layout);
                    }
                    if (self.app && self.app.workspace && typeof self.app.workspace.changeLayout === 'function') {
                        return self.app.workspace.changeLayout(layout);
                    }
                    return Promise.resolve(true);
                },
                getWorkspaceRestoreScope: function () {
                    return typeof self.getWorkspaceRestoreScope === 'function' ? self.getWorkspaceRestoreScope() : 'full';
                },
            });
        }
        return this._sessionStore;
    };
}

module.exports = attachSessionStoreGetter;
