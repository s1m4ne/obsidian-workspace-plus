'use strict';

var sessionSaver = require('../../state/session-saver.ts');

function attachSessionSavingMethods(WorkspacePlusPlus) {
    if (!WorkspacePlusPlus.prototype.getSessionSaver) {
        WorkspacePlusPlus.prototype.getSessionSaver = function () {
            var self = this;
            if (!this._sessionSaver) {
                this._sessionSaver = new sessionSaver.SessionSaver({
                    get data() { return self.data; },
                    get app() { return self.app; },
                    get settingsState() { return typeof self.getSettingsState === 'function' ? self.getSettingsState() : undefined; },
                    get sessionStore() { return typeof self.getSessionStore === 'function' ? self.getSessionStore() : undefined; },
                    get groupManager() { return typeof self.getGroupManager === 'function' ? self.getGroupManager() : undefined; },
                    get historyService() { return typeof self.getHistoryService === 'function' ? self.getHistoryService() : undefined; },
                    getActiveSession: function () {
                        if (typeof self.getActiveSession === 'function') {
                            return self.getActiveSession();
                        }
                        if (typeof self.getSessionStore === 'function') {
                            return self.getSessionStore().getActiveSession();
                        }
                        return null;
                    },
                    getCurrentWorkspaceLayout: function () {
                        if (self.getCurrentWorkspaceLayout && self.getCurrentWorkspaceLayout !== WorkspacePlusPlus.prototype.getCurrentWorkspaceLayout) {
                            return self.getCurrentWorkspaceLayout();
                        }
                        if (typeof self.getSessionStore === 'function') {
                            return self.getSessionStore().getCurrentWorkspaceLayout();
                        }
                        if (self.app && self.app.workspace && typeof self.app.workspace.getLayout === 'function') {
                            return self.app.workspace.getLayout();
                        }
                        return {};
                    },
                    layoutsEqualStructural: function (a, b) {
                        if (typeof self.layoutsEqualStructural === 'function') {
                            return self.layoutsEqualStructural(a, b);
                        }
                        if (typeof self.getSessionStore === 'function') {
                            return self.getSessionStore().layoutsEqualStructural(a, b);
                        }
                        return JSON.stringify(a) === JSON.stringify(b);
                    },
                    getDefaultSessionName: function () {
                        if (typeof self.getDefaultSessionName === 'function') {
                            return self.getDefaultSessionName();
                        }
                        if (typeof self.getSessionStore === 'function') {
                            return self.getSessionStore().getDefaultSessionName();
                        }
                        return 'Default';
                    },
                    pushLayoutToHistory: function (session) {
                        if (typeof self.pushLayoutToHistory === 'function') {
                            self.pushLayoutToHistory(session);
                        } else if (typeof self.getHistoryService === 'function') {
                            self.getHistoryService().pushLayoutToHistory(session);
                        }
                    },
                    updateStatusBar: function () {
                        if (typeof self.updateStatusBar === 'function') self.updateStatusBar();
                    },
                    syncSessionCommands: function () {
                        if (typeof self.syncSessionCommands === 'function') self.syncSessionCommands();
                    },
                    persistData: function () {
                        return typeof self.persistData === 'function'
                            ? self.persistData()
                            : Promise.resolve(true);
                    },
                    createSessionRecord: function (id, name, layout, options) {
                        if (typeof self.createSessionRecord === 'function') {
                            return self.createSessionRecord(id, name, layout, options);
                        }
                        if (typeof self.getSessionStore === 'function') {
                            return self.getSessionStore().createSessionRecord(id, name, layout, options);
                        }
                        return { id: id, name: name, layout: layout, modified: options && typeof options.modified === 'number' ? options.modified : Date.now() };
                    },
                    insertSessionAndActivate: function (session) {
                        if (typeof self.insertSessionAndActivate === 'function') {
                            self.insertSessionAndActivate(session);
                        } else if (typeof self.getSessionStore === 'function') {
                            self.getSessionStore().insertSessionAndActivate(session);
                        }
                    },
                    startHistorySnapshotTimer: function () {
                        if (typeof self.startHistorySnapshotTimer === 'function') self.startHistorySnapshotTimer();
                    },
                    stopHistorySnapshotTimer: function () {
                        if (typeof self.stopHistorySnapshotTimer === 'function') self.stopHistorySnapshotTimer();
                    },
                    applyWorkspaceLayout: function (layout) {
                        if (self.applyWorkspaceLayout && self.applyWorkspaceLayout !== WorkspacePlusPlus.prototype.applyWorkspaceLayout) {
                            return self.applyWorkspaceLayout(layout);
                        }
                        if (typeof self.getSessionSwitcher === 'function') {
                            return self.getSessionSwitcher().applyWorkspaceLayout(layout);
                        }
                        if (self.app && self.app.workspace && typeof self.app.workspace.changeLayout === 'function') {
                            return self.app.workspace.changeLayout(layout);
                        }
                        return Promise.resolve(true);
                    },
                    getOrderedSessionsUnfiltered: function () {
                        if (typeof self.getOrderedSessionsUnfiltered === 'function') {
                            return self.getOrderedSessionsUnfiltered();
                        }
                        if (typeof self.getSessionStore === 'function') {
                            return self.getSessionStore().getOrderedSessionsUnfiltered();
                        }
                        return [];
                    },
                    getOrderedGroupTabIds: function () {
                        if (typeof self.getOrderedGroupTabIds === 'function') {
                            return self.getOrderedGroupTabIds();
                        }
                        if (typeof self.getGroupManager === 'function') {
                            return self.getGroupManager().getOrderedGroupTabIds();
                        }
                        return [];
                    },
                    isGroupFeatureEnabled: function () {
                        if (typeof self.isGroupFeatureEnabled === 'function') {
                            return self.isGroupFeatureEnabled();
                        }
                        return !self.data || self.data.groupFeatureEnabled !== false;
                    },
                    openRenameModal: function (placeholder, onRename, options) {
                        var RenameModal = require('../../modals/rename-modal.ts').RenameModal;
                        new RenameModal(self.app, placeholder, onRename, options).open();
                    },
                    openConfirmModal: function (message, onConfirm, options) {
                        var ConfirmModal = require('../../modals/confirm-modal.ts').ConfirmModal;
                        new ConfirmModal(self.app, message, onConfirm, options).open();
                    },
                    saveActiveSession: function (options) {
                        if (self.saveActiveSession && self.saveActiveSession !== WorkspacePlusPlus.prototype.saveActiveSession) {
                            return self.saveActiveSession(options);
                        }
                    },
                    overwriteSessionWithCurrentLayout: function (sessionId, options) {
                        if (self.overwriteSessionWithCurrentLayout && self.overwriteSessionWithCurrentLayout !== WorkspacePlusPlus.prototype.overwriteSessionWithCurrentLayout) {
                            return self.overwriteSessionWithCurrentLayout(sessionId, options);
                        }
                    },
                });
            }
            return this._sessionSaver;
        };
    }

    WorkspacePlusPlus.prototype.isAutoSaveOnSwitchEnabled = function () {
        return this.getSessionSaver().isAutoSaveOnSwitchEnabled();
    };

    WorkspacePlusPlus.prototype.isWarnOnUnsavedSwitchEnabled = function () {
        return this.getSessionSaver().isWarnOnUnsavedSwitchEnabled();
    };

    WorkspacePlusPlus.prototype.isUnsavedStatusBarHighlightEnabled = function () {
        return this.getSessionSaver().isUnsavedStatusBarHighlightEnabled();
    };

    WorkspacePlusPlus.prototype.isActiveSessionDirty = function () {
        return this.getSessionSaver().isActiveSessionDirty();
    };

    WorkspacePlusPlus.prototype.shouldShowUnsavedStatusBarHighlight = function () {
        return this.getSessionSaver().shouldShowUnsavedStatusBarHighlight();
    };

    WorkspacePlusPlus.prototype.setAutoSaveOnSwitch = function (enabled, options) {
        return this.getSessionSaver().setAutoSaveOnSwitch(enabled, options);
    };

    WorkspacePlusPlus.prototype.toggleAutoSaveOnSwitch = function (options) {
        return this.getSessionSaver().toggleAutoSaveOnSwitch(options);
    };

    WorkspacePlusPlus.prototype.saveActiveSession = function (options) {
        return this.getSessionSaver().saveActiveSession(options);
    };

    WorkspacePlusPlus.prototype.overwriteSessionWithCurrentLayout = function (sessionId, options) {
        return this.getSessionSaver().overwriteSessionWithCurrentLayout(sessionId, options);
    };

    WorkspacePlusPlus.prototype.saveCurrentLayoutAsSessionName = function (name, options) {
        return this.getSessionSaver().saveCurrentLayoutAsSessionName(name, options);
    };

    WorkspacePlusPlus.prototype.confirmOverwriteSessionWithCurrentLayout = function (sessionId, options) {
        return this.getSessionSaver().confirmOverwriteSessionWithCurrentLayout(sessionId, options);
    };

    WorkspacePlusPlus.prototype.reloadCurrentSessionWithoutSaving = function (options) {
        return this.getSessionSaver().reloadCurrentSessionWithoutSaving(options);
    };

    WorkspacePlusPlus.prototype.captureActiveSessionLayoutIfAutoSave = function () {
        return this.getSessionSaver().captureActiveSessionLayoutIfAutoSave();
    };

    WorkspacePlusPlus.prototype.saveAsSession = function () {
        return this.getSessionSaver().saveAsSession();
    };
}

module.exports = attachSessionSavingMethods;
