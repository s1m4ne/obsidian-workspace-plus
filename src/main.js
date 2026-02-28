'use strict';

var obsidian = require('obsidian');
var i18n = require('./i18n');
var modals = require('./modals');
var settings = require('./settings');
var DEFAULT_DATA = require('./plugin/default-data');
var registerCommands = require('./plugin/register-commands');
var attachHotkeyMethods = require('./plugin/methods/hotkeys');
var attachOverlayMethods = require('./plugin/methods/overlays');
var attachPersistenceMethods = require('./plugin/methods/persistence');
var attachSessionMethods = require('./plugin/methods/sessions');
var attachHistoryMethods = require('./plugin/methods/history');
var utils = require('./utils');
var sessionContextMenu = require('./session-context-menu');

i18n.resolveLocale();

// ============================================================
// Main Plugin
// ============================================================
var WorkspacePlusPlus = /** @class */ (function (_super) {
    function WorkspacePlusPlus() {
        return _super !== null && _super.apply(this, arguments) || this;
    }

    WorkspacePlusPlus.prototype = Object.create(_super.prototype);
    WorkspacePlusPlus.prototype.constructor = WorkspacePlusPlus;

    WorkspacePlusPlus.prototype.onload = function () {
        var self = this;

        return this.loadWithBackup().then(function (saved) {
            self.data = Object.assign({}, DEFAULT_DATA, saved || {});
            if (!self.data.sessions) self.data.sessions = {};
            if (!self.data.sessionOrder) self.data.sessionOrder = [];
            self.normalizeGroupFeatureState();
            self.isSwitchingSession = false;
            self.pendingSwitchRequest = null;
            self.switchLockAt = 0;
            self.syncSessionOrder();
            i18n.resolveLocale(self.data.language);
            var L = i18n.L;

            // Ribbon icon (left sidebar)
            self.addRibbonIcon('panels-top-left', L.ribbonTooltip, function () {
                new modals.SessionManagerModal(self.app, self).open();
            });

            // Status bar
            self.statusBarEl = self.addStatusBarItem();
            self.statusBarEl.addClass('wpp-status-bar');
            self.statusBarEl.addEventListener('click', function (evt) {
                if (evt.altKey) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    self.reloadCurrentSessionWithoutSaving();
                    return;
                }

                var isSaveClick = utils.isModPressed(evt);
                if (isSaveClick) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    self.saveActiveSession();
                    return;
                }
                if (self.data.statusBarQuickSwitcher) {
                    if (self.searchOverlayEl) {
                        self.hideSearchOverlay();
                    } else {
                        self.openSearchOverlay(self.statusBarEl);
                    }
                } else {
                    new modals.SessionManagerModal(self.app, self).open();
                }
            });
            self.statusBarEl.addEventListener('contextmenu', function (evt) {
                evt.preventDefault();

                // Mod+RMB: quick restore from history (Cmd on Mac, Ctrl on Windows/Linux)
                if (utils.isModPressed(evt)
                    && self.isVersionHistoryEnabled()
                    && self.isVersionHistoryCtrlRmbEnabled()
                ) {
                    var activeSession = self.getActiveSession();
                    if (!activeSession || !activeSession.history || activeSession.history.length === 0) {
                        new obsidian.Notice(L.historyNoEntries);
                        return;
                    }
                    if (self.isVersionHistoryConfirmRestoreEnabled()) {
                        var latestTime = new Date(activeSession.history[0].savedAt)
                            .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        new modals.ConfirmModal(self.app,
                            L.historyRestoreConfirm(activeSession.name, latestTime),
                            function () { self.quickRestoreLatestHistory(); },
                            { confirmText: L.historyRestore, confirmClass: 'mod-cta' }
                        ).open();
                    } else {
                        self.quickRestoreLatestHistory();
                    }
                    return;
                }

                var session = self.getActiveSession();
                if (!session) return;
                sessionContextMenu.openSessionContextMenu({
                    plugin: self,
                    app: self.app,
                    session: session,
                    isActive: true,
                    event: evt,
                    showSaveAs: true,
                    showSwitch: false,
                    showRemoveFromGroup: false,
                    onSave: function () {
                        self.saveActiveSession();
                    },
                    onReload: function () {
                        self.reloadCurrentSessionWithoutSaving();
                    },
                    onSaveAs: function () {
                        self.saveAsSession();
                    },
                    onRename: function () {
                        new modals.RenameModal(self.app, session.name, function (newName) {
                            self.renameSessionById(session.id, newName);
                        }, {
                            emptyNotice: L.emptyName,
                        }).open();
                    },
                    onDuplicate: function () {
                        self.duplicateSession(session.id);
                    },
                    onDelete: function () {
                        new modals.ConfirmModal(self.app, L.confirmDeleteActive(session.name), function () {
                            self.deleteSession(session.id);
                        }).open();
                    },
                    onVersionHistory: function () {
                        new modals.HistoryModal(self.app, self, session).open();
                    },
                });
            });
            self.updateStatusBar();

            // Commands
            registerCommands(self);

            // Settings tab
            self.addSettingTab(new settings.WorkspacePlusPlusSettingTab(self.app, self));

            // Startup: ensure default session exists, then flush
            self.app.workspace.onLayoutReady(function () {
                self.ensureDefaultSession();
                self.syncSessionCommands();
                self.flushOnStartup();
                self.startHistorySnapshotTimer();
                self.initRotationBackupTimestamp();
            });
        });
    };

    WorkspacePlusPlus.prototype.onunload = function () {
        this.stopHistorySnapshotTimer();
        this.hideSwitchOverlay();
        this.hideSearchOverlay();
        this.pendingSwitchRequest = null;
        this.isSwitchingSession = false;
        return this.flushPendingPersistence();
    };

    return WorkspacePlusPlus;
})(obsidian.Plugin);

attachHotkeyMethods(WorkspacePlusPlus);
attachOverlayMethods(WorkspacePlusPlus);
attachPersistenceMethods(WorkspacePlusPlus);
attachSessionMethods(WorkspacePlusPlus);
attachHistoryMethods(WorkspacePlusPlus);

module.exports = WorkspacePlusPlus;
