'use strict';

var attachOverlayMethods = require('./overlays');
var attachPersistenceMethods = require('./persistence');
var attachStorageBackupMethods = require('./storage-backup');
var attachStorageTransferMethods = require('./storage-transfer');
var attachSessionSyncMethods = require('./session-sync');
var attachSessionMethods = require('./sessions');
var attachSessionValidationMethods = require('./sessions-validation');
var attachGroupMethods = require('./groups');
var attachSessionCrudMethods = require('./session-crud');
var attachSessionSavingMethods = require('./session-saving');
var attachSessionStatusBarMethods = require('./session-statusbar');
var attachSessionStartupMethods = require('./session-startup');
var attachSessionSwitchingMethods = require('./session-switching');
var attachSessionCommandMethods = require('./session-commands');
var attachHistoryMethods = require('./history');
var attachFrontmatterMethods = require('./frontmatter');
var attachSettingsStateMethods = require('./settings-state');

function attachPluginMethods(WorkspacePlusPlus) {
    attachOverlayMethods(WorkspacePlusPlus);
    attachPersistenceMethods(WorkspacePlusPlus);
    attachStorageBackupMethods(WorkspacePlusPlus);
    attachStorageTransferMethods(WorkspacePlusPlus);
    attachSessionSyncMethods(WorkspacePlusPlus);
    attachSessionMethods(WorkspacePlusPlus);
    attachSessionValidationMethods(WorkspacePlusPlus);
    attachGroupMethods(WorkspacePlusPlus);
    attachSessionCrudMethods(WorkspacePlusPlus);
    attachSessionSavingMethods(WorkspacePlusPlus);
    attachSessionStatusBarMethods(WorkspacePlusPlus);
    attachSessionStartupMethods(WorkspacePlusPlus);
    attachSessionSwitchingMethods(WorkspacePlusPlus);
    attachSessionCommandMethods(WorkspacePlusPlus);
    attachHistoryMethods(WorkspacePlusPlus);
    attachFrontmatterMethods(WorkspacePlusPlus);
    attachSettingsStateMethods(WorkspacePlusPlus);
}

module.exports = attachPluginMethods;
