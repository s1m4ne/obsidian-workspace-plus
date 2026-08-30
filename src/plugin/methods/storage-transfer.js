'use strict';

var obsidian = require('obsidian');
var i18n = require('../../i18n.ts');
var storageTransfer = require('../../storage/storage-transfer.ts');

function attachStorageTransferMethods(WorkspacePlusPlus) {
    // --- Export / import snapshots ---

    WorkspacePlusPlus.prototype.exportSessionsSnapshot = function () {
        var self = this;
        var L = i18n.L;
        var stamp = storageTransfer.formatExportStamp(Date.now());
        var filePath = this.getExportDirPath() + '/sessions-' + stamp + '.json';
        var payload = storageTransfer.createExportPayload(
            this.extractSessionData(this.data),
            this.manifest.id
        );

        return this.ensureSessionStorageDir()
            .then(function () {
                return self.ensureDir(self.getExportDirPath());
            })
            .then(function () {
                return self.writeJson(filePath, payload, true);
            })
            .then(function () {
                new obsidian.Notice(L.exportSessionsDone(filePath), 7000);
                return filePath;
            });
    };

    WorkspacePlusPlus.prototype.importSessionsFromLatestExport = function () {
        var self = this;
        var L = i18n.L;

        return this.app.vault.adapter.exists(this.getExportDirPath())
            .then(function (exists) {
                if (!exists) return null;
                return self.app.vault.adapter.list(self.getExportDirPath());
            })
            .then(function (listed) {
                if (!listed || !listed.files || listed.files.length === 0) return null;
                return storageTransfer.findLatestExportFile(listed.files);
            })
            .then(function (latestPath) {
                if (!latestPath) {
                    new obsidian.Notice(L.importSessionsNoFile);
                    return false;
                }
                return self.app.vault.adapter.read(latestPath).then(function (raw) {
                    var parsed = JSON.parse(raw);
                    var imported = storageTransfer.validateExportedSessionData(
                        parsed,
                        function (candidate) { return self.normalizeSessionData(candidate); }
                    );
                    if (!imported) {
                        new obsidian.Notice(L.importSessionsFailed);
                        return false;
                    }

                    self.data.activeSessionId = imported.activeSessionId;
                    self.data.sessions = imported.sessions;
                    self.data.sessionOrder = imported.sessionOrder;
                    self.data.groups = imported.groups || {};
                    self.data.groupOrder = typeof self.normalizeGroupTabOrder === 'function'
                        ? self.normalizeGroupTabOrder(imported.groupOrder || [])
                        : (imported.groupOrder || []);
                    self.data.sessionGroups = imported.sessionGroups || {};
                    self.data.activeGroupId = imported.activeGroupId || null;
                    self.syncSessionOrder();
                    self.updateStatusBar();
                    self.syncSessionCommands();
                    return self.persistData().then(function () {
                        // Apply the imported layout to the workspace. Without
                        // this the screen keeps showing the pre-import layout
                        // while the data holds the imported one, and the first
                        // session switch writes the screen back over the import
                        // - auto-save on switch captures the current layout
                        // before leaving. The imported active session would be
                        // silently lost by the very action a user takes to see
                        // whether the import worked.
                        return self.reloadCurrentSessionWithoutSaving({ silent: true });
                    }).then(function () {
                        new obsidian.Notice(L.importSessionsDone(latestPath), 7000);
                        return true;
                    });
                }).catch(function () {
                    new obsidian.Notice(L.importSessionsFailed);
                    return false;
                });
            });
    };
}

module.exports = attachStorageTransferMethods;
