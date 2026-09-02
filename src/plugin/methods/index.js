'use strict';

var attachPersistenceMethods = require('./persistence');
var attachSessionSyncMethods = require('./session-sync');

function attachPluginMethods(WorkspacePlusPlus) {
    attachPersistenceMethods(WorkspacePlusPlus);
    attachSessionSyncMethods(WorkspacePlusPlus);
}

module.exports = attachPluginMethods;
