'use strict';

var settingsState = require('../../state/settings-state.ts');

function attachSettingsStateMethods(WorkspacePlusPlus) {
    WorkspacePlusPlus.prototype.getSettingsState = function () {
        var self = this;
        if (!this._settingsState) {
            this._settingsState = new settingsState.SettingsState({
                get data() { return self.data; },
                persistData: function () { return self.persistData(); },
                updateStatusBar: function () { self.updateStatusBar(); },
                syncSessionCommands: function () { self.syncSessionCommands(); },
                startHistorySnapshotTimer: function () { self.startHistorySnapshotTimer(); },
                stopHistorySnapshotTimer: function () { self.stopHistorySnapshotTimer(); },
            });
        }
        return this._settingsState;
    };

    WorkspacePlusPlus.prototype.setLanguageSetting = function (value, options) {
        return this.getSettingsState().setLanguageSetting(value, options);
    };

    WorkspacePlusPlus.prototype.setStatusBarAction = function (slotKey, actionId, options) {
        return this.getSettingsState().setStatusBarAction(slotKey, actionId, options);
    };

    WorkspacePlusPlus.prototype.setWarnOnUnsavedSwitch = function (enabled, options) {
        return this.getSettingsState().setWarnOnUnsavedSwitch(enabled, options);
    };

    WorkspacePlusPlus.prototype.setUnsavedStatusBarHighlight = function (enabled, options) {
        return this.getSettingsState().setUnsavedStatusBarHighlight(enabled, options);
    };

    WorkspacePlusPlus.prototype.setConfirmQuickActions = function (enabled, options) {
        return this.getSettingsState().setConfirmQuickActions(enabled, options);
    };

    WorkspacePlusPlus.prototype.setRestoreSidebars = function (enabled, options) {
        return this.getSettingsState().setRestoreSidebars(enabled, options);
    };

    WorkspacePlusPlus.prototype.setStatusBarModScrollSwitch = function (enabled, options) {
        return this.getSettingsState().setStatusBarModScrollSwitch(enabled, options);
    };

    WorkspacePlusPlus.prototype.setStatusBarScrollPreset = function (value, options) {
        return this.getSettingsState().setStatusBarScrollPreset(value, options);
    };

    WorkspacePlusPlus.prototype.setStatusBarScrollModifierMode = function (value, options) {
        return this.getSettingsState().setStatusBarScrollModifierMode(value, options);
    };

    WorkspacePlusPlus.prototype.setStatusBarScrollThreshold = function (value, options) {
        return this.getSettingsState().setStatusBarScrollThreshold(value, options);
    };

    WorkspacePlusPlus.prototype.setStatusBarScrollCooldownMs = function (value, options) {
        return this.getSettingsState().setStatusBarScrollCooldownMs(value, options);
    };

    WorkspacePlusPlus.prototype.setStatusBarScrollResetMs = function (value, options) {
        return this.getSettingsState().setStatusBarScrollResetMs(value, options);
    };

    WorkspacePlusPlus.prototype.setStatusBarScrollInvert = function (enabled, options) {
        return this.getSettingsState().setStatusBarScrollInvert(enabled, options);
    };

    WorkspacePlusPlus.prototype.setShowActiveSwitchCommand = function (enabled, options) {
        return this.getSettingsState().setShowActiveSwitchCommand(enabled, options);
    };

    WorkspacePlusPlus.prototype.setNumberedSwitchCommands = function (enabled, options) {
        return this.getSettingsState().setNumberedSwitchCommands(enabled, options);
    };

    WorkspacePlusPlus.prototype.setSwitchPreviewEnabled = function (enabled, options) {
        return this.getSettingsState().setSwitchPreviewEnabled(enabled, options);
    };

    WorkspacePlusPlus.prototype.setPreviewNext = function (enabled, options) {
        return this.getSettingsState().setPreviewNext(enabled, options);
    };

    WorkspacePlusPlus.prototype.setPreviewPrevious = function (enabled, options) {
        return this.getSettingsState().setPreviewPrevious(enabled, options);
    };

    WorkspacePlusPlus.prototype.setShowFilterInput = function (enabled, options) {
        return this.getSettingsState().setShowFilterInput(enabled, options);
    };

    WorkspacePlusPlus.prototype.setOverlayDefaultFocus = function (value, options) {
        return this.getSettingsState().setOverlayDefaultFocus(value, options);
    };

    WorkspacePlusPlus.prototype.setConfirmDeleteByHotkey = function (enabled, options) {
        return this.getSettingsState().setConfirmDeleteByHotkey(enabled, options);
    };

    WorkspacePlusPlus.prototype.setVersionHistoryEnabled = function (enabled, options) {
        return this.getSettingsState().setVersionHistoryEnabled(enabled, options);
    };

    WorkspacePlusPlus.prototype.setVersionHistorySnapshotInterval = function (value, options) {
        return this.getSettingsState().setVersionHistorySnapshotInterval(value, options);
    };

    WorkspacePlusPlus.prototype.setVersionHistoryConfirmRestore = function (enabled, options) {
        return this.getSettingsState().setVersionHistoryConfirmRestore(enabled, options);
    };
}

module.exports = attachSettingsStateMethods;
