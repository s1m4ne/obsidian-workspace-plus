'use strict';

var storageTransfer = require('../../storage/storage-transfer.ts');

function attachStorageTransferMethods(WorkspacePlusPlus) {
    // --- Export / import snapshots ---

    WorkspacePlusPlus.prototype.exportSessionsSnapshot = function () {
        return storageTransfer.exportSessionsSnapshot(this);
    };

    WorkspacePlusPlus.prototype.importSessionsFromLatestExport = function () {
        return storageTransfer.importSessionsFromLatestExport(this);
    };
}

module.exports = attachStorageTransferMethods;
