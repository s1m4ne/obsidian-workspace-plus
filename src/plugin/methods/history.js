'use strict';


function attachHistoryMethods(WorkspacePlusPlus) {

    WorkspacePlusPlus.prototype.isVersionHistoryEnabled = function () {
        return this.getHistoryService().isVersionHistoryEnabled();
    };

    WorkspacePlusPlus.prototype.getVersionHistorySnapshotInterval = function () {
        return this.getHistoryService().getVersionHistorySnapshotInterval();
    };

    WorkspacePlusPlus.prototype.isVersionHistoryConfirmRestoreEnabled = function () {
        return this.getHistoryService().isVersionHistoryConfirmRestoreEnabled();
    };

    WorkspacePlusPlus.prototype.extractFilePathsFromLayout = function (layout) {
        return this.getHistoryService().extractFilePathsFromLayout(layout);
    };

    WorkspacePlusPlus.prototype.countPanesInLayout = function (layout) {
        return this.getHistoryService().countPanesInLayout(layout);
    };

    WorkspacePlusPlus.prototype.compactHistory = function (history) {
        return this.getHistoryService().compactHistory(history);
    };

    WorkspacePlusPlus.prototype.pushLayoutToHistory = function (session) {
        return this.getHistoryService().pushLayoutToHistory(session);
    };

    WorkspacePlusPlus.prototype.restoreFromHistoryEntry = function (sessionId, entryIndex) {
        return this.getHistoryService().restoreFromHistoryEntry(sessionId, entryIndex);
    };

    WorkspacePlusPlus.prototype.quickRestoreLatestHistory = function () {
        return this.getHistoryService().quickRestoreLatestHistory();
    };

    WorkspacePlusPlus.prototype.clearVersionHistoryEntries = function () {
        return this.getHistoryService().clearVersionHistoryEntries();
    };

    WorkspacePlusPlus.prototype.startHistorySnapshotTimer = function () {
        return this.getHistoryService().startHistorySnapshotTimer();
    };

    WorkspacePlusPlus.prototype.stopHistorySnapshotTimer = function () {
        return this.getHistoryService().stopHistorySnapshotTimer();
    };
}

module.exports = attachHistoryMethods;
