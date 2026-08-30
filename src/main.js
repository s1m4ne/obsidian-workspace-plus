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
            self.sessionSaver = self.getSessionSaver();

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
                if (typeof self.getSessionSwitcher === 'function' && self.getSessionSwitcher().isSwitching) return;
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
        if (typeof this.getSessionSwitcher === 'function') {
            this.getSessionSwitcher().cleanup();
        }
        this.statusBarScrollDelta = 0;
        this.statusBarScrollEventAt = 0;
        this.statusBarScrollSwitchAt = 0;
        this.clearSessionStorageSyncTimers();
        return this.flushPendingPersistence();
    };

    return WorkspacePlusPlus;
})(obsidian.Plugin);

attachPluginMethods(WorkspacePlusPlus);

module.exports = WorkspacePlusPlus;
