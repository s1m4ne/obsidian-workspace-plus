'use strict';

var attachPersistenceMethods = require('./persistence');
var attachStorageBackupMethods = require('./storage-backup');
var attachStorageTransferMethods = require('./storage-transfer');
var attachSessionSyncMethods = require('./session-sync');
var attachSessionStatusBarMethods = require('./session-statusbar');
var attachSessionStartupMethods = require('./session-startup');
var attachSessionCommandMethods = require('./session-commands');
var attachFrontmatterMethods = require('./frontmatter');

function attachPluginMethods(WorkspacePlusPlus) {
    attachPersistenceMethods(WorkspacePlusPlus);
    attachStorageBackupMethods(WorkspacePlusPlus);
    attachStorageTransferMethods(WorkspacePlusPlus);
    attachSessionSyncMethods(WorkspacePlusPlus);
    attachSessionStatusBarMethods(WorkspacePlusPlus);
    attachSessionStartupMethods(WorkspacePlusPlus);
    attachSessionCommandMethods(WorkspacePlusPlus);
    attachFrontmatterMethods(WorkspacePlusPlus);
}

module.exports = attachPluginMethods;
