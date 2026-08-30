'use strict';

var obsidian = require('obsidian');
var i18n = require('./i18n.ts');
var modals = require('./modals');
var settings = require('./settings');
var DEFAULT_DATA = require('./plugin/default-data');
var registerCommands = require('./plugin/register-commands');
var attachPluginMethods = require('./plugin/methods');
var statusBarController = require('./statusbar-controller');

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

            self.sessionStorage = self.getSessionStorage();
            self.syncWatcher = self.getSyncWatcher();
            self.settingsState = self.getSettingsState();
            self.groupManager = self.getGroupManager();
            self.sessionStore = self.getSessionStore();
            self.historyService = self.getHistoryService();
            self.sessionSwitcher = self.getSessionSwitcher();

            // Migrate legacy settings into statusBarActions
            if (!self.data.statusBarActions) {
                self.data.statusBarActions = Object.assign({}, DEFAULT_DATA.statusBarActions);
                if (self.data.statusBarQuickSwitcher === false) {
                    self.data.statusBarActions.click = 'sessionManager';
                }
                if (self.data.versionHistoryCtrlRmbRestore === false) {
                    self.data.statusBarActions.modRightClick = 'none';
                }
            }
            self.data.statusBarActions = Object.assign({}, DEFAULT_DATA.statusBarActions, self.data.statusBarActions || {});

            self.normalizeGroupFeatureState();
            self.isSwitchingSession = false;
            self.pendingSwitchRequest = null;
            self.pendingSwitchTargetId = null;
            self.switchLockAt = 0;
            self.startupSettleStartedAt = 0;
            self.startupSettleUntil = 0;
            self.startupSettleTimer = null;
            self.startupFlushTimer = null;
            self.statusBarScrollDelta = 0;
            self.statusBarScrollEventAt = 0;
            self.statusBarScrollSwitchAt = 0;
            self.sessionSwitchNotice = null;
            self.syncSessionOrder();
            self.registerSessionStorageListeners();
            i18n.resolveLocale(self.data.language);
            var L = i18n.L;

            // Ribbon icon (left sidebar)
            self.addRibbonIcon('panels-top-left', L.ribbonTooltip, function () {
                new modals.SessionManagerModal(self.app, self).open();
            });

            statusBarController.setupStatusBar(self);

            // Commands
            registerCommands(self);

            // Settings tab
            self.settingTab = new settings.WorkspacePlusPlusSettingTab(self.app, self);
            self.addSettingTab(self.settingTab);

            self.registerEvent(self.app.workspace.on('layout-change', function () {
                self.noteStartupLayoutChange();
                self.updateStatusBar();
            }));
            self.registerEvent(self.app.workspace.on('active-leaf-change', function () {
                if (self.isSwitchingSession) return;
                setTimeout(function () {
                    self.updateStatusBar();
                }, 0);
            }));

            // Startup: ensure default session exists, then flush
            self.app.workspace.onLayoutReady(function () {
                self.startStartupSettleWindow();
                self.ensureDefaultSession();
                self.syncSessionCommands();
                self.scheduleStartupFlush();
                self.startHistorySnapshotTimer();
                self.initRotationBackupTimestamp();
                self.registerFrontmatterListeners();
                self.scheduleStartupSessionStorageChecks();
            });
        });
    };

    WorkspacePlusPlus.prototype.onunload = function () {
        this.stopHistorySnapshotTimer();
        this.hideSwitchOverlay();
        this.hideSearchOverlay();
        this.clearSessionSwitchNotice();
        this.pendingSwitchRequest = null;
        this.pendingSwitchTargetId = null;
        this.isSwitchingSession = false;
        this.statusBarScrollDelta = 0;
        this.statusBarScrollEventAt = 0;
        this.statusBarScrollSwitchAt = 0;
        this.startupSettleStartedAt = 0;
        if (this.startupSettleTimer) {
            clearTimeout(this.startupSettleTimer);
            this.startupSettleTimer = null;
        }
        if (this.startupFlushTimer) {
            clearTimeout(this.startupFlushTimer);
            this.startupFlushTimer = null;
        }
        this.clearSessionStorageSyncTimers();
        this.startupSettleUntil = 0;
        return this.flushPendingPersistence();
    };

    return WorkspacePlusPlus;
})(obsidian.Plugin);

attachPluginMethods(WorkspacePlusPlus);

module.exports = WorkspacePlusPlus;
