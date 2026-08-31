'use strict';

var sessionSwitcher = require('../../state/session-switcher.ts');

function attachSessionSwitcherGetter(WorkspacePlusPlus) {
    if (WorkspacePlusPlus.prototype.getSessionSwitcher) return;
    WorkspacePlusPlus.prototype.getSessionSwitcher = function () {
        var self = this;
        if (!this._sessionSwitcher) {
            this._sessionSwitcher = new sessionSwitcher.SessionSwitcher({
                get data() { return self.data; },
                get app() { return self.app; },
                get switchOverlayEl() { return self.switchOverlayEl; },
                get settingsState() { return typeof self.getSettingsState === 'function' ? self.getSettingsState() : undefined; },
                get sessionStore() { return typeof self.getSessionStore === 'function' ? self.getSessionStore() : undefined; },
                get historyService() { return typeof self.getHistoryService === 'function' ? self.getHistoryService() : undefined; },
                get sessionSaver() { return typeof self.getSessionSaver === 'function' ? self.getSessionSaver() : undefined; },
                getOrderedSessions: function (viewGroupId) {
                    if (self.getOrderedSessions && self.getOrderedSessions !== WorkspacePlusPlus.prototype.getOrderedSessions) {
                        return self.getOrderedSessions(viewGroupId);
                    }
                    if (typeof self.getSessionStore === 'function') {
                        var store = self.getSessionStore();
                        if (viewGroupId === null || viewGroupId === '__all__') {
                            return store.getOrderedSessionsUnfiltered();
                        }
                        if (typeof viewGroupId === 'string') {
                            return store.getOrderedSessionsForGroup(viewGroupId);
                        }
                        return store.getOrderedSessions();
                    }
                    return [];
                },
                findSessionIndex: function (sessions, sessionId) {
                    if (self.findSessionIndex && self.findSessionIndex !== WorkspacePlusPlus.prototype.findSessionIndex) {
                        return self.findSessionIndex(sessions, sessionId);
                    }
                    if (typeof self.getSessionStore === 'function') {
                        return self.getSessionStore().findSessionIndex(sessions, sessionId);
                    }
                    if (!sessionId || !sessions) return -1;
                    for (var i = 0; i < sessions.length; i++) {
                        if (sessions[i] && sessions[i].id === sessionId) return i;
                    }
                    return -1;
                },
                getActiveSession: function () {
                    if (self.getActiveSession && self.getActiveSession !== WorkspacePlusPlus.prototype.getActiveSession) {
                        return self.getActiveSession();
                    }
                    if (typeof self.getSessionStore === 'function') return self.getSessionStore().getActiveSession();
                    return (self.data && self.data.sessions && self.data.activeSessionId) ? self.data.sessions[self.data.activeSessionId] || null : null;
                },
                getCurrentWorkspaceLayout: function () {
                    if (self.getCurrentWorkspaceLayout && self.getCurrentWorkspaceLayout !== WorkspacePlusPlus.prototype.getCurrentWorkspaceLayout) {
                        return self.getCurrentWorkspaceLayout();
                    }
                    if (typeof self.getSessionStore === 'function') return self.getSessionStore().getCurrentWorkspaceLayout();
                    if (self.app && self.app.workspace && typeof self.app.workspace.getLayout === 'function') {
                        return self.app.workspace.getLayout();
                    }
                    return {};
                },
                applyWorkspaceLayout: function (layout, options) {
                    if (self.applyWorkspaceLayout && self.applyWorkspaceLayout !== WorkspacePlusPlus.prototype.applyWorkspaceLayout) {
                        return self.applyWorkspaceLayout(layout, options);
                    }
                    if (self.app && self.app.workspace && typeof self.app.workspace.changeLayout === 'function') {
                        return self.app.workspace.changeLayout(layout);
                    }
                    return Promise.resolve(true);
                },
                pushLayoutToHistory: function (session) {
                    if (self.pushLayoutToHistory && self.pushLayoutToHistory !== WorkspacePlusPlus.prototype.pushLayoutToHistory) {
                        self.pushLayoutToHistory(session);
                    } else if (typeof self.getHistoryService === 'function') {
                        self.getHistoryService().pushLayoutToHistory(session);
                    }
                },
                saveActiveSession: function (options) {
                    if (self.saveActiveSession && self.saveActiveSession !== WorkspacePlusPlus.prototype.saveActiveSession) {
                        return self.saveActiveSession(options);
                    }
                    if (typeof self.getSessionSaver === 'function') return self.getSessionSaver().saveActiveSession(options);
                    return Promise.resolve(true);
                },
                isActiveSessionDirty: function () {
                    if (self.isActiveSessionDirty && self.isActiveSessionDirty !== WorkspacePlusPlus.prototype.isActiveSessionDirty) {
                        return self.isActiveSessionDirty();
                    }
                    if (typeof self.getSessionSaver === 'function') return self.getSessionSaver().isActiveSessionDirty();
                    return false;
                },
                isAutoSaveOnSwitchEnabled: function () {
                    if (self.isAutoSaveOnSwitchEnabled && self.isAutoSaveOnSwitchEnabled !== WorkspacePlusPlus.prototype.isAutoSaveOnSwitchEnabled) {
                        return self.isAutoSaveOnSwitchEnabled();
                    }
                    if (typeof self.getSessionSaver === 'function') return self.getSessionSaver().isAutoSaveOnSwitchEnabled();
                    return self.data ? self.data.autoSaveOnSwitch !== false : true;
                },
                isWarnOnUnsavedSwitchEnabled: function () {
                    if (self.isWarnOnUnsavedSwitchEnabled && self.isWarnOnUnsavedSwitchEnabled !== WorkspacePlusPlus.prototype.isWarnOnUnsavedSwitchEnabled) {
                        return self.isWarnOnUnsavedSwitchEnabled();
                    }
                    if (typeof self.getSessionSaver === 'function') return self.getSessionSaver().isWarnOnUnsavedSwitchEnabled();
                    return self.data ? self.data.warnOnUnsavedSwitch !== false : true;
                },
                persistData: function () {
                    return typeof self.persistData === 'function' ? self.persistData() : Promise.resolve(true);
                },
                updateStatusBar: function () {
                    if (typeof self.updateStatusBar === 'function') self.updateStatusBar();
                },
                showSwitchPreviewOverlay: function (ordered, index, viewGroupId) {
                    if (typeof self.showSwitchPreviewOverlay === 'function') self.showSwitchPreviewOverlay(ordered, index, viewGroupId);
                },
                showSwitchFeedbackOverlay: function (ordered, index, viewGroupId, overlayOptions) {
                    if (typeof self.showSwitchFeedbackOverlay === 'function') self.showSwitchFeedbackOverlay(ordered, index, viewGroupId, overlayOptions);
                },
                showSessionSwitchNotice: function (sessionName, options) {
                    if (self.showSessionSwitchNotice && self.showSessionSwitchNotice !== WorkspacePlusPlus.prototype.showSessionSwitchNotice) {
                        return self.showSessionSwitchNotice(sessionName, options);
                    }
                    return undefined;
                },
                switchSession: function (sessionId, options) {
                    if (self.switchSession && self.switchSession !== WorkspacePlusPlus.prototype.switchSession) {
                        return self.switchSession(sessionId, options);
                    }
                    return undefined;
                },
                performSessionSwitch: function (sessionId, options) {
                    if (self.performSessionSwitch && self.performSessionSwitch !== WorkspacePlusPlus.prototype.performSessionSwitch) {
                        return self.performSessionSwitch(sessionId, options);
                    }
                    return undefined;
                },
                scheduleStartupFlush: function () {
                    if (self.scheduleStartupFlush && self.scheduleStartupFlush !== WorkspacePlusPlus.prototype.scheduleStartupFlush) {
                        return self.scheduleStartupFlush();
                    }
                    return undefined;
                },
                flushOnStartup: function () {
                    if (self.flushOnStartup && self.flushOnStartup !== WorkspacePlusPlus.prototype.flushOnStartup) {
                        return self.flushOnStartup();
                    }
                    return undefined;
                },
                getStartupSettleRemainingMs: function () {
                    if (self.getStartupSettleRemainingMs && self.getStartupSettleRemainingMs !== WorkspacePlusPlus.prototype.getStartupSettleRemainingMs) {
                        return self.getStartupSettleRemainingMs();
                    }
                    return undefined;
                },
                openUnsavedSwitchModal: function (msg, onSave, onSwitch, onCancel) {
                    var UnsavedSwitchModal = require('../../modals/unsaved-switch-modal.ts').UnsavedSwitchModal;
                    new UnsavedSwitchModal(self.app, msg, onSave, onSwitch, onCancel).open();
                },
            });
        }
        return this._sessionSwitcher;
    };
}

module.exports = attachSessionSwitcherGetter;
