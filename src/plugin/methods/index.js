'use strict';

var attachPersistenceMethods = require('./persistence');
var attachStorageBackupMethods = require('./storage-backup');
var attachStorageTransferMethods = require('./storage-transfer');
var attachSessionSyncMethods = require('./session-sync');

function attachPluginMethods(WorkspacePlusPlus) {
    attachPersistenceMethods(WorkspacePlusPlus);
    attachStorageBackupMethods(WorkspacePlusPlus);
    attachStorageTransferMethods(WorkspacePlusPlus);
    attachSessionSyncMethods(WorkspacePlusPlus);
}

module.exports = attachPluginMethods;
