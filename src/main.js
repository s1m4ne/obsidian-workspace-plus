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

var STATUS_BAR_SCROLL_PRESETS = {
    trackpad: {
        threshold: 30,
        cooldownMs: 500,
        resetMs: 250,
    },
    notchedWheel: {
        threshold: 16,
        cooldownMs: 350,
        resetMs: 220,
    },
    freeSpinWheel: {
        threshold: 48,
        cooldownMs: 650,
        resetMs: 320,
    },
};

function getStatusBarScrollConfig(data) {
    var presetId = (data && data.statusBarScrollPreset) || 'trackpad';
    if (presetId === 'custom') {
        return {
            threshold: Number((data && data.statusBarScrollThreshold) || 30) || 30,
            cooldownMs: Number((data && data.statusBarScrollCooldownMs) || 500) || 500,
            resetMs: Number((data && data.statusBarScrollResetMs) || 250) || 250,
        };
    }
    return STATUS_BAR_SCROLL_PRESETS[presetId] || STATUS_BAR_SCROLL_PRESETS.trackpad;
}

function matchesStatusBarScrollModifier(evt, isMac, mode) {
    mode = mode || 'none';
    var modPressed = isMac ? !!evt.metaKey : !!evt.ctrlKey;
    var altPressed = !!evt.altKey;

    if (mode === 'none') return !modPressed && !altPressed;
    if (mode === 'modOnly') return modPressed;
    if (mode === 'altOnly') return altPressed;
    if (mode === 'modOrAlt') return modPressed || altPressed;
    return modPressed || altPressed;
}

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
            self.data.statusBarActions = Object.assign({}, DEFAULT_DATA.statusBarActions, self.data.statusBarActions || {});

            // Migrate: existing users keep filter visible (new default is OFF)
            if (saved && saved.showFilterInput === undefined) {
                self.data.showFilterInput = true;
            }

            self.normalizeGroupFeatureState();
            self.isSwitchingSession = false;
            self.pendingSwitchRequest = null;
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
            self.statusBarEl.addEventListener('auxclick', function (evt) {
                if (evt.button !== 1) return;
                var key = 'middleClick';
                if (evt.altKey) key = 'altMiddleClick';
                else if (utils.isModPressed(evt)) key = 'modMiddleClick';
                else if (evt.shiftKey) key = 'shiftMiddleClick';
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
            self.statusBarEl.addEventListener('wheel', function (evt) {
                if (!self.data.statusBarModScrollSwitch) return;
                var isMac = utils.isMacPlatform();
                var cfg = getStatusBarScrollConfig(self.data);
                if (!matchesStatusBarScrollModifier(evt, isMac, self.data.statusBarScrollModifierMode)) return;
                if (Math.abs(evt.deltaY || 0) <= Math.abs(evt.deltaX || 0)) return;

                evt.preventDefault();
                evt.stopPropagation();

                var now = Date.now();
                if (self.isSwitchingSession) return;
                if (now - self.statusBarScrollSwitchAt < cfg.cooldownMs) return;

                if (now - self.statusBarScrollEventAt > cfg.resetMs) {
                    self.statusBarScrollDelta = 0;
                }
                self.statusBarScrollEventAt = now;

                var deltaY = evt.deltaY || 0;
                if (evt.deltaMode === 1) deltaY *= 16;
                else if (evt.deltaMode === 2) deltaY *= 240;
                self.statusBarScrollDelta += deltaY;

                if (Math.abs(self.statusBarScrollDelta) < cfg.threshold) return;

                var direction = self.statusBarScrollDelta < 0 ? -1 : 1;
                if (self.data.statusBarScrollInvert) direction *= -1;
                self.statusBarScrollDelta = 0;
                self.statusBarScrollSwitchAt = now;
                self.switchRelativeFromScroll(direction).catch(function () {});
            }, { passive: false });
            self.updateStatusBar();

            // Commands
            registerCommands(self);

            // Settings tab
            self.settingTab = new settings.WorkspacePlusPlusSettingTab(self.app, self);
            self.addSettingTab(self.settingTab);

            self.registerEvent(self.app.workspace.on('layout-change', function () {
                self.noteStartupLayoutChange();
            }));

            // Startup: ensure default session exists, then flush
            self.app.workspace.onLayoutReady(function () {
                self.startStartupSettleWindow();
                self.ensureDefaultSession();
                self.syncSessionCommands();
                self.scheduleStartupFlush();
                self.startHistorySnapshotTimer();
                self.initRotationBackupTimestamp();
            });
        });
    };

    WorkspacePlusPlus.prototype.onunload = function () {
        this.stopHistorySnapshotTimer();
        this.hideSwitchOverlay();
        this.hideSearchOverlay();
        this.clearSessionSwitchNotice();
        this.pendingSwitchRequest = null;
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
        this.startupSettleUntil = 0;
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
