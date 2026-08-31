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
                    if (typeof self.getSessionStore === 'function') return self.getSessionStore().getActiveSession();
                    return (self.data && self.data.sessions && self.data.activeSessionId) ? self.data.sessions[self.data.activeSessionId] || null : null;
                },
                getCurrentWorkspaceLayout: function () {
                    if (typeof self.getSessionStore === 'function') return self.getSessionStore().getCurrentWorkspaceLayout();
                    if (self.app && self.app.workspace && typeof self.app.workspace.getLayout === 'function') {
                        return self.app.workspace.getLayout();
                    }
                    return {};
                },
                applyWorkspaceLayout: function (layout, options) {
                    if (self.app && self.app.workspace && typeof self.app.workspace.changeLayout === 'function') {
                        return self.app.workspace.changeLayout(layout);
                    }
                    return Promise.resolve(true);
                },
                pushLayoutToHistory: function (session) {
                    if (typeof self.getHistoryService === 'function') {
                        self.getHistoryService().pushLayoutToHistory(session);
                    }
                },
                saveActiveSession: function (options) {
                    if (typeof self.getSessionSaver === 'function') return self.getSessionSaver().saveActiveSession(options);
                    return Promise.resolve(true);
                },
                isActiveSessionDirty: function () {
                    if (typeof self.getSessionSaver === 'function') return self.getSessionSaver().isActiveSessionDirty();
                    return false;
                },
                isAutoSaveOnSwitchEnabled: function () {
                    if (typeof self.getSessionSaver === 'function') return self.getSessionSaver().isAutoSaveOnSwitchEnabled();
                    return self.data ? self.data.autoSaveOnSwitch !== false : true;
                },
                isWarnOnUnsavedSwitchEnabled: function () {
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
                    return undefined;
                },
                switchSession: function (sessionId, options) {
                    return undefined;
                },
                performSessionSwitch: function (sessionId, options) {
                    return undefined;
                },
                scheduleStartupFlush: function () {
                    return undefined;
                },
                flushOnStartup: function () {
                    return undefined;
                },
                getStartupSettleRemainingMs: function () {
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
