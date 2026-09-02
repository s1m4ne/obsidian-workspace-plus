'use strict';

var attachOverlayMethods = require('./overlays');
var attachPersistenceMethods = require('./persistence');
var attachStorageBackupMethods = require('./storage-backup');
var attachStorageTransferMethods = require('./storage-transfer');
var attachSessionSyncMethods = require('./session-sync');
var attachSessionValidationMethods = require('./sessions-validation');
var attachSessionStatusBarMethods = require('./session-statusbar');
var attachSessionStartupMethods = require('./session-startup');
var attachSessionSwitchingMethods = require('./session-switching');
var attachSessionCommandMethods = require('./session-commands');
var attachHistoryMethods = require('./history');
var attachFrontmatterMethods = require('./frontmatter');

function attachPluginMethods(WorkspacePlusPlus) {
    attachOverlayMethods(WorkspacePlusPlus);
    attachPersistenceMethods(WorkspacePlusPlus);
    attachStorageBackupMethods(WorkspacePlusPlus);
    attachStorageTransferMethods(WorkspacePlusPlus);
    attachSessionSyncMethods(WorkspacePlusPlus);
    attachSessionValidationMethods(WorkspacePlusPlus);
    attachSessionStatusBarMethods(WorkspacePlusPlus);
    attachSessionStartupMethods(WorkspacePlusPlus);
    attachSessionSwitchingMethods(WorkspacePlusPlus);
    attachSessionCommandMethods(WorkspacePlusPlus);
    attachHistoryMethods(WorkspacePlusPlus);
    attachFrontmatterMethods(WorkspacePlusPlus);
}

module.exports = attachPluginMethods;
