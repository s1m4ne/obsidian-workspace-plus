'use strict';


function attachSessionSavingMethods(WorkspacePlusPlus) {
    WorkspacePlusPlus.prototype.isAutoSaveOnSwitchEnabled = function () {
        return this.getSessionSaver().isAutoSaveOnSwitchEnabled();
    };

    WorkspacePlusPlus.prototype.isWarnOnUnsavedSwitchEnabled = function () {
        return this.getSessionSaver().isWarnOnUnsavedSwitchEnabled();
    };

    WorkspacePlusPlus.prototype.isUnsavedStatusBarHighlightEnabled = function () {
        return this.getSessionSaver().isUnsavedStatusBarHighlightEnabled();
    };

    WorkspacePlusPlus.prototype.isActiveSessionDirty = function () {
        return this.getSessionSaver().isActiveSessionDirty();
    };

    WorkspacePlusPlus.prototype.shouldShowUnsavedStatusBarHighlight = function () {
        return this.getSessionSaver().shouldShowUnsavedStatusBarHighlight();
    };

    WorkspacePlusPlus.prototype.setAutoSaveOnSwitch = function (enabled, options) {
        return this.getSessionSaver().setAutoSaveOnSwitch(enabled, options);
    };

    WorkspacePlusPlus.prototype.toggleAutoSaveOnSwitch = function (options) {
        return this.getSessionSaver().toggleAutoSaveOnSwitch(options);
    };

    WorkspacePlusPlus.prototype.saveActiveSession = function (options) {
        return this.getSessionSaver().saveActiveSession(options);
    };

    WorkspacePlusPlus.prototype.overwriteSessionWithCurrentLayout = function (sessionId, options) {
        return this.getSessionSaver().overwriteSessionWithCurrentLayout(sessionId, options);
    };

    WorkspacePlusPlus.prototype.saveCurrentLayoutAsSessionName = function (name, options) {
        return this.getSessionSaver().saveCurrentLayoutAsSessionName(name, options);
    };

    WorkspacePlusPlus.prototype.confirmOverwriteSessionWithCurrentLayout = function (sessionId, options) {
        return this.getSessionSaver().confirmOverwriteSessionWithCurrentLayout(sessionId, options);
    };

    WorkspacePlusPlus.prototype.reloadCurrentSessionWithoutSaving = function (options) {
        return this.getSessionSaver().reloadCurrentSessionWithoutSaving(options);
    };

    WorkspacePlusPlus.prototype.captureActiveSessionLayoutIfAutoSave = function () {
        return this.getSessionSaver().captureActiveSessionLayoutIfAutoSave();
    };

    WorkspacePlusPlus.prototype.saveAsSession = function () {
        return this.getSessionSaver().saveAsSession();
    };
}

module.exports = attachSessionSavingMethods;
