'use strict';

var attachGroupMethods = require('./groups');
var attachSettingsStateMethods = require('./settings-state');
var sessionStore = require('../../state/session-store.ts');
var i18n = require('../../i18n.ts');
var obsidianInternals = require('../../platform/obsidian-internals.ts');
var ConfirmModal = require('../../modals/confirm-modal.ts').ConfirmModal;
var RenameModal = require('../../modals/rename-modal.ts').RenameModal;

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
                    if (self.app && self.app.workspace && typeof self.app.workspace.getLayout === 'function') {
                        return self.app.workspace.getLayout();
                    }
                    return {};
                },
                createSessionValidated: function (name, options) {
                    return undefined;
                },
                moveSessionToGroupExclusive: function (sid, gid) {
                    if (typeof self.getGroupStore === 'function') {
                        return self.getGroupStore().moveSessionToGroupExclusive(sid, gid);
                    }
                    return Promise.resolve(false);
                },
                resolveGroupSelection: function (gid) {
                    if (typeof self.getGroupStore === 'function') {
                        return self.getGroupStore().resolveGroupSelection(gid);
                    }
                    return Promise.resolve({ resolvedGroupId: gid });
                },
                attachSessionToActiveGroup: function (sid) {
                    if (typeof self.getGroupStore === 'function') {
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
                    if (self.app && self.app.workspace && typeof self.app.workspace.changeLayout === 'function') {
                        return self.app.workspace.changeLayout(layout);
                    }
                    return Promise.resolve(true);
                },
                getWorkspaceRestoreScope: function () {
                    return typeof self.getWorkspaceRestoreScope === 'function' ? self.getWorkspaceRestoreScope() : 'full';
                },
                openRenameModal: function (currentName, onRename) {
                    var emptyNotice = i18n.L.emptyName;
                    new RenameModal(self.app, currentName, onRename, {
                        emptyNotice: typeof emptyNotice === 'string' ? emptyNotice : '',
                    }).open();
                },
                openConfirmModal: function (message, onConfirm, options) {
                    new ConfirmModal(self.app, message, onConfirm, options).open();
                },
                openPluginSettings: function () {
                    obsidianInternals.openSettingTab(self.app, self.manifest.id);
                },
            });
        }
        return this._sessionStore;
    };
}

module.exports = attachSessionStoreGetter;
