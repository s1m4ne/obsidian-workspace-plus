'use strict';

var obsidian = require('obsidian');
var i18n = require('../../i18n.ts');
var storageBackup = require('../../storage/storage-backup.ts');

function attachStorageBackupMethods(WorkspacePlusPlus) {
    // --- Rotation backup ---

    WorkspacePlusPlus.prototype.getBackupPlatformLabel = function () {
        return storageBackup.getBackupPlatformLabel();
    };

    WorkspacePlusPlus.prototype.prepareRotationBackupData = function (sessionData) {
        return storageBackup.prepareRotationBackupData(sessionData);
    };

    WorkspacePlusPlus.prototype.initRotationBackupTimestamp = function () {
        var self = this;
        return storageBackup.initRotationBackupTimestamp(
            function (p) { return self.readJsonIfExists(p); },
            this.getRotationBackupPath(1)
        ).then(function (stamp) {
            self._lastRotationBackupAt = stamp;
        });
    };

    WorkspacePlusPlus.prototype.rotateBackupIfNeeded = function (sessionData) {
        var self = this;
        return storageBackup.rotateBackupIfNeeded(
            this.getJsonStore(),
            this.getBackupsDirPath(),
            function (gen) { return self.getRotationBackupPath(gen); },
            this._lastRotationBackupAt || 0,
            sessionData
        ).then(function (newStamp) {
            self._lastRotationBackupAt = newStamp;
        });
    };

    WorkspacePlusPlus.prototype.copyFileIfExists = function (srcPath, dstPath) {
        var self = this;
        return this.app.vault.adapter.exists(srcPath).then(function (exists) {
            if (!exists) return;
            return self.app.vault.adapter.read(srcPath).then(function (raw) {
                return self.app.vault.adapter.write(dstPath, raw);
            });
        });
    };

    WorkspacePlusPlus.prototype.getRotationBackupInfo = function () {
        var self = this;
        return storageBackup.getRotationBackupInfo(
            function (p) { return self.readJsonIfExists(p); },
            function (gen) { return self.getRotationBackupPath(gen); }
        );
    };

    WorkspacePlusPlus.prototype.restoreFromRotationBackup = function (generation) {
        var self = this;
        var L = i18n.L;
        return storageBackup.readAndValidateRotationBackup(
            function (p) { return self.readJsonIfExists(p); },
            this.getRotationBackupPath(generation),
            function (d) { return self.normalizeSessionData(d); }
        ).then(function (imported) {
            if (!imported) {
                new obsidian.Notice(L.rotationBackupRestoreFailed);
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
                var active = self.getActiveSession();
                if (active && active.layout) {
                    return self.applyWorkspaceLayout(active.layout, { catchErrors: false }).then(function () {
                        new obsidian.Notice(L.rotationBackupRestored);
                        return true;
                    });
                }
                new obsidian.Notice(L.rotationBackupRestored);
                return true;
            });
        }).catch(function () {
            new obsidian.Notice(L.rotationBackupRestoreFailed);
            return false;
        });
    };
}

module.exports = attachStorageBackupMethods;
