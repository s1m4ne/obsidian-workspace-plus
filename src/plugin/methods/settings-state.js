'use strict';

var i18n = require('../../i18n.ts');
var DEFAULT_DATA = require('../default-data');

function persistIfNeeded(plugin, options) {
    options = options || {};
    if (options.persist === false) return Promise.resolve(true);
    return plugin.persistData();
}

function numberOrFallback(value, fallback) {
    var parsed = Number(value);
    return parsed || fallback;
}

function attachSettingsStateMethods(WorkspacePlusPlus) {
    WorkspacePlusPlus.prototype.setLanguageSetting = function (value, options) {
        this.data.language = value || 'auto';
        i18n.resolveLocale(this.data.language);
        return persistIfNeeded(this, options);
    };

    WorkspacePlusPlus.prototype.setStatusBarAction = function (slotKey, actionId, options) {
        if (!this.data.statusBarActions) {
            this.data.statusBarActions = Object.assign({}, DEFAULT_DATA.statusBarActions);
        }
        this.data.statusBarActions[slotKey] = actionId;
        return persistIfNeeded(this, options);
    };

    WorkspacePlusPlus.prototype.setWarnOnUnsavedSwitch = function (enabled, options) {
        this.data.warnOnUnsavedSwitch = !!enabled;
        return persistIfNeeded(this, options);
    };

    WorkspacePlusPlus.prototype.setUnsavedStatusBarHighlight = function (enabled, options) {
        this.data.highlightUnsavedSessionChanges = !!enabled;
        this.updateStatusBar();
        return persistIfNeeded(this, options);
    };

    WorkspacePlusPlus.prototype.setConfirmQuickActions = function (enabled, options) {
        this.data.confirmQuickActions = !!enabled;
        return persistIfNeeded(this, options);
    };

    WorkspacePlusPlus.prototype.setRestoreSidebars = function (enabled, options) {
        this.data.restoreSidebars = !!enabled;
        return persistIfNeeded(this, options);
    };

    WorkspacePlusPlus.prototype.setStatusBarModScrollSwitch = function (enabled, options) {
        this.data.statusBarModScrollSwitch = !!enabled;
        return persistIfNeeded(this, options);
    };

    WorkspacePlusPlus.prototype.setStatusBarScrollPreset = function (value, options) {
        this.data.statusBarScrollPreset = value || 'trackpad';
        return persistIfNeeded(this, options);
    };

    WorkspacePlusPlus.prototype.setStatusBarScrollModifierMode = function (value, options) {
        this.data.statusBarScrollModifierMode = value || 'none';
        return persistIfNeeded(this, options);
    };

    WorkspacePlusPlus.prototype.setStatusBarScrollThreshold = function (value, options) {
        this.data.statusBarScrollThreshold = numberOrFallback(value, 30);
        return persistIfNeeded(this, options);
    };

    WorkspacePlusPlus.prototype.setStatusBarScrollCooldownMs = function (value, options) {
        this.data.statusBarScrollCooldownMs = numberOrFallback(value, 500);
        return persistIfNeeded(this, options);
    };

    WorkspacePlusPlus.prototype.setStatusBarScrollResetMs = function (value, options) {
        this.data.statusBarScrollResetMs = numberOrFallback(value, 250);
        return persistIfNeeded(this, options);
    };

    WorkspacePlusPlus.prototype.setStatusBarScrollInvert = function (enabled, options) {
        this.data.statusBarScrollInvert = !!enabled;
        return persistIfNeeded(this, options);
    };

    WorkspacePlusPlus.prototype.setShowActiveSwitchCommand = function (enabled, options) {
        this.data.showActiveSwitchCommand = !!enabled;
        return persistIfNeeded(this, options);
    };

    WorkspacePlusPlus.prototype.setNumberedSwitchCommands = function (enabled, options) {
        this.data.numberedSwitchCommands = !!enabled;
        this.syncSessionCommands();
        return persistIfNeeded(this, options);
    };

    WorkspacePlusPlus.prototype.setSwitchPreviewEnabled = function (enabled, options) {
        this.data.previewNext = !!enabled;
        this.data.previewPrevious = !!enabled;
        return persistIfNeeded(this, options);
    };

    WorkspacePlusPlus.prototype.setPreviewNext = function (enabled, options) {
        this.data.previewNext = !!enabled;
        return persistIfNeeded(this, options);
    };

    WorkspacePlusPlus.prototype.setPreviewPrevious = function (enabled, options) {
        this.data.previewPrevious = !!enabled;
        return persistIfNeeded(this, options);
    };

    WorkspacePlusPlus.prototype.setShowFilterInput = function (enabled, options) {
        this.data.showFilterInput = !!enabled;
        return persistIfNeeded(this, options);
    };

    WorkspacePlusPlus.prototype.setOverlayDefaultFocus = function (value, options) {
        this.data.overlayDefaultFocus = value || 'current-session';
        return persistIfNeeded(this, options);
    };

    WorkspacePlusPlus.prototype.setConfirmDeleteByHotkey = function (enabled, options) {
        this.data.confirmDeleteByHotkey = !!enabled;
        return persistIfNeeded(this, options);
    };

    WorkspacePlusPlus.prototype.setVersionHistoryEnabled = function (enabled, options) {
        this.data.versionHistoryEnabled = !!enabled;
        if (this.data.versionHistoryEnabled) {
            this.startHistorySnapshotTimer();
        } else {
            this.stopHistorySnapshotTimer();
        }
        return persistIfNeeded(this, options);
    };

    WorkspacePlusPlus.prototype.setVersionHistorySnapshotInterval = function (value, options) {
        this.data.versionHistorySnapshotInterval = parseInt(value, 10);
        this.startHistorySnapshotTimer();
        return persistIfNeeded(this, options);
    };

    WorkspacePlusPlus.prototype.setVersionHistoryConfirmRestore = function (enabled, options) {
        this.data.versionHistoryConfirmRestore = !!enabled;
        return persistIfNeeded(this, options);
    };
}

module.exports = attachSettingsStateMethods;
