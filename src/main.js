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
            self.isSwitchingSession = false;
            self.pendingSwitchRequest = null;
            self.switchLockAt = 0;
            self.syncSessionOrder();
            i18n.resolveLocale(self.data.language);
            var L = i18n.L;

            // Ribbon icon (left sidebar)
            self.addRibbonIcon('panels-left-bottom', L.ribbonTooltip, function () {
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

                var isMac = typeof navigator !== 'undefined'
                    && typeof navigator.platform === 'string'
                    && navigator.platform.indexOf('Mac') !== -1;
                var isSaveClick = isMac ? evt.metaKey : evt.ctrlKey;
                if (isSaveClick) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    self.saveActiveSession();
                    return;
                }
                new modals.SessionManagerModal(self.app, self).open();
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
            });
        });
    };

    WorkspacePlusPlus.prototype.onunload = function () {
        this.hideSwitchOverlay();
        this.hideSearchOverlay();
        this.pendingSwitchRequest = null;
        this.isSwitchingSession = false;
    };

    return WorkspacePlusPlus;
})(obsidian.Plugin);

attachHotkeyMethods(WorkspacePlusPlus);
attachOverlayMethods(WorkspacePlusPlus);
attachPersistenceMethods(WorkspacePlusPlus);
attachSessionMethods(WorkspacePlusPlus);

module.exports = WorkspacePlusPlus;
