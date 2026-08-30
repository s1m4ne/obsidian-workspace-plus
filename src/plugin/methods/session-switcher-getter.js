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
                getOrderedSessions: function () {
                    if (typeof self.getOrderedSessions === 'function') {
                        return self.getOrderedSessions();
                    }
                    if (typeof self.getSessionStore === 'function') {
                        return self.getSessionStore().getOrderedSessions();
                    }
                    return [];
                },
                findSessionIndex: function (sessions, sessionId) {
                    if (typeof self.findSessionIndex === 'function') {
                        return self.findSessionIndex(sessions, sessionId);
                    }
                    if (typeof self.getSessionStore === 'function') {
                        return self.getSessionStore().findSessionIndex(sessions, sessionId);
                    }
                    return -1;
                },
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
                applyWorkspaceLayout: function (layout, options) {
                    if (self.applyWorkspaceLayout && self.applyWorkspaceLayout !== WorkspacePlusPlus.prototype.applyWorkspaceLayout) {
                        return self.applyWorkspaceLayout(layout, options);
                    }
                    if (self.app && self.app.workspace && typeof self.app.workspace.changeLayout === 'function') {
                        return self.app.workspace.changeLayout(layout);
                    }
                    return Promise.resolve(true);
                },
                persistData: function () {
                    return typeof self.persistData === 'function'
                        ? self.persistData()
                        : Promise.resolve(true);
                },
                updateStatusBar: function () {
                    if (typeof self.updateStatusBar === 'function') self.updateStatusBar();
                },
                pushLayoutToHistory: function (session) {
                    if (typeof self.pushLayoutToHistory === 'function') {
                        self.pushLayoutToHistory(session);
                    } else if (typeof self.getHistoryService === 'function') {
                        self.getHistoryService().pushLayoutToHistory(session);
                    }
                },
                saveActiveSession: function (options) {
                    return typeof self.saveActiveSession === 'function'
                        ? self.saveActiveSession(options)
                        : Promise.resolve(true);
                },
                isActiveSessionDirty: function () {
                    return typeof self.isActiveSessionDirty === 'function'
                        ? self.isActiveSessionDirty()
                        : false;
                },
                isWarnOnUnsavedSwitchEnabled: function () {
                    return typeof self.isWarnOnUnsavedSwitchEnabled === 'function'
                        ? self.isWarnOnUnsavedSwitchEnabled()
                        : (self.data ? self.data.warnOnUnsavedSwitch !== false : true);
                },
                isAutoSaveOnSwitchEnabled: function () {
                    return typeof self.isAutoSaveOnSwitchEnabled === 'function'
                        ? self.isAutoSaveOnSwitchEnabled()
                        : (self.data ? self.data.autoSaveOnSwitch !== false : true);
                },
                showSwitchPreviewOverlay: function (ordered, index, viewGroupId) {
                    if (typeof self.showSwitchPreviewOverlay === 'function') {
                        self.showSwitchPreviewOverlay(ordered, index, viewGroupId);
                    }
                },
                showSwitchFeedbackOverlay: function (ordered, index, viewGroupId, overlayOptions) {
                    if (typeof self.showSwitchFeedbackOverlay === 'function') {
                        self.showSwitchFeedbackOverlay(ordered, index, viewGroupId, overlayOptions);
                    }
                },
                showSessionSwitchNotice: function (sessionName, options) {
                    if (typeof self.showSessionSwitchNotice === 'function' && self.showSessionSwitchNotice !== WorkspacePlusPlus.prototype.showSessionSwitchNotice) {
                        return self.showSessionSwitchNotice(sessionName, options);
                    }
                },
                openUnsavedSwitchModal: function (msg, onSave, onSwitch, onCancel) {
                    var UnsavedSwitchModal = require('../../modals/unsaved-switch-modal');
                    new UnsavedSwitchModal(self.app, msg, onSave, onSwitch, onCancel).open();
                },
                switchSession: function (targetId, options) {
                    if (self.switchSession && self.switchSession !== WorkspacePlusPlus.prototype.switchSession) {
                        return self.switchSession(targetId, options);
                    }
                },
                performSessionSwitch: function (targetId, options) {
                    if (self.performSessionSwitch && self.performSessionSwitch !== WorkspacePlusPlus.prototype.performSessionSwitch) {
                        return self.performSessionSwitch(targetId, options);
                    }
                },
                scheduleStartupFlush: function () {
                    if (self.scheduleStartupFlush && self.scheduleStartupFlush !== WorkspacePlusPlus.prototype.scheduleStartupFlush) {
                        return self.scheduleStartupFlush();
                    }
                },
                flushOnStartup: function () {
                    if (self.flushOnStartup && self.flushOnStartup !== WorkspacePlusPlus.prototype.flushOnStartup) {
                        return self.flushOnStartup();
                    }
                },
                getStartupSettleRemainingMs: function () {
                    if (self.getStartupSettleRemainingMs && self.getStartupSettleRemainingMs !== WorkspacePlusPlus.prototype.getStartupSettleRemainingMs) {
                        return self.getStartupSettleRemainingMs();
                    }
                },
                syncLegacyProperties: function (props) {
                    Object.assign(self, props);
                },
            });
        }
        return this._sessionSwitcher;
    };
}

module.exports = attachSessionSwitcherGetter;
