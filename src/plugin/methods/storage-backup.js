'use strict';

var storageBackup = require('../../storage/storage-backup.ts');

function attachStorageBackupMethods(WorkspacePlusPlus) {
    // --- Rotation backup ---


    WorkspacePlusPlus.prototype.prepareRotationBackupData = function (sessionData) {
        return storageBackup.prepareRotationBackupData(sessionData);
    };

    WorkspacePlusPlus.prototype.initRotationBackupTimestamp = function () {
        return storageBackup.initRotationBackupTimestampForHost(this);
    };

    WorkspacePlusPlus.prototype.rotateBackupIfNeeded = function (sessionData) {
        return storageBackup.rotateBackupIfNeededForHost(this, sessionData);
    };

    WorkspacePlusPlus.prototype.copyFileIfExists = function (srcPath, dstPath) {
        return storageBackup.copyFileIfExists(this.app.vault.adapter, srcPath, dstPath);
    };

    WorkspacePlusPlus.prototype.getRotationBackupInfo = function () {
        return storageBackup.getRotationBackupInfoForHost(this);
    };

    WorkspacePlusPlus.prototype.restoreFromRotationBackup = function (generation) {
        return storageBackup.restoreFromRotationBackup(this, generation);
    };
}

module.exports = attachStorageBackupMethods;
