'use strict';

var historyService = require('../../state/history-service.ts');
var layoutUtils = require('../../layout-utils.ts');

function attachHistoryStoreGetter(WorkspacePlusPlus) {
    if (WorkspacePlusPlus.prototype.getHistoryService) return;
    WorkspacePlusPlus.prototype.getHistoryService = function () {
        var self = this;
        if (!this._historyService) {
            this._historyService = new historyService.HistoryService({
                get data() { return self.data; },
                get settingsState() { return typeof self.getSettingsState === 'function' ? self.getSettingsState() : undefined; },
                get sessionStore() { return typeof self.getSessionStore === 'function' ? self.getSessionStore() : undefined; },
                getActiveSession: function () {
                    return typeof self.getActiveSession === 'function' ? self.getActiveSession() : null;
                },
                getCurrentWorkspaceLayout: function () {
                    return typeof self.getCurrentWorkspaceLayout === 'function' ? self.getCurrentWorkspaceLayout() : {};
                },
                applyWorkspaceLayout: function (layout) {
                    return typeof self.applyWorkspaceLayout === 'function'
                        ? self.applyWorkspaceLayout(layout)
                        : Promise.resolve(true);
                },
                layoutsEqualStructural: function (a, b) {
                    if (typeof self.layoutsEqualStructural === 'function') {
                        return self.layoutsEqualStructural(a, b);
                    }
                    var restoreScope = typeof self.getWorkspaceRestoreScope === 'function'
                        ? self.getWorkspaceRestoreScope()
                        : 'full';
                    return layoutUtils.layoutsEqualStructural(a, b, { restoreScope: restoreScope });
                },
                updateStatusBar: function () {
                    if (typeof self.updateStatusBar === 'function') self.updateStatusBar();
                },
                persistData: function () {
                    return typeof self.persistData === 'function'
                        ? self.persistData()
                        : Promise.resolve(true);
                },
                isAutoSaveOnSwitchEnabled: function () {
                    return typeof self.isAutoSaveOnSwitchEnabled === 'function'
                        ? self.isAutoSaveOnSwitchEnabled()
                        : (self.data.autoSaveOnSwitch !== false);
                },
            });
        }
        return this._historyService;
    };
}

function attachHistoryMethods(WorkspacePlusPlus) {
    attachHistoryStoreGetter(WorkspacePlusPlus);

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
        this.getHistoryService().startHistorySnapshotTimer();
        this._historySnapshotTimer = this.getHistoryService().getSnapshotTimer();
    };

    WorkspacePlusPlus.prototype.stopHistorySnapshotTimer = function () {
        this.getHistoryService().stopHistorySnapshotTimer();
        this._historySnapshotTimer = null;
    };
}

module.exports = attachHistoryMethods;
