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
var statusBarActions = require('./statusbar-actions');

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

            // Migrate: existing users keep filter visible (new default is OFF)
            if (saved && saved.showFilterInput === undefined) {
                self.data.showFilterInput = true;
            }

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
                var key = 'click';
                if (evt.altKey) key = 'altClick';
                else if (utils.isModPressed(evt)) key = 'modClick';
                else if (evt.shiftKey) key = 'shiftClick';
                var action = (self.data.statusBarActions || {})[key] || 'none';
                if (action !== 'none') {
                    evt.preventDefault();
                    evt.stopPropagation();
                }
                statusBarActions.executeStatusBarAction(self, action, evt);
            });
            self.statusBarEl.addEventListener('contextmenu', function (evt) {
                evt.preventDefault();
                var key = 'rightClick';
                if (evt.altKey) key = 'altRightClick';
                else if (utils.isModPressed(evt)) key = 'modRightClick';
                else if (evt.shiftKey) key = 'shiftRightClick';
                var action = (self.data.statusBarActions || {})[key] || 'none';
                statusBarActions.executeStatusBarAction(self, action, evt);
            });
            self.updateStatusBar();

            // Commands
            registerCommands(self);

            // Settings tab
            self.settingTab = new settings.WorkspacePlusPlusSettingTab(self.app, self);
            self.addSettingTab(self.settingTab);

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
