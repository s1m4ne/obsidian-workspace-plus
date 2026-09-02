'use strict';

// Announcing a session change needs the sessions methods, and the Behavior Lock
// suites attach this module on its own. A dependency that is sometimes missing
// is what let a duplicated default survive once already, so this module puts
// what it needs in place rather than guarding the call.
var sessionSync = require('../../storage/session-sync.ts');

function attachSessionSyncMethods(WorkspacePlusPlus) {



    WorkspacePlusPlus.prototype.recordSessionStorageState = function (stamp, mtime, data) {
        return sessionSync.recordSessionStorageState(this, stamp, mtime, data);
    };

    WorkspacePlusPlus.prototype.recordSessionDataStored = function (sessionData) {
        return sessionSync.recordSessionDataStored(this, sessionData);
    };






    WorkspacePlusPlus.prototype.reloadExternalSessionStorageIfChanged = function (options) {
        return sessionSync.reloadExternalSessionStorageIfChanged(this, options);
    };


    WorkspacePlusPlus.prototype.scheduleExternalSessionStorageReload = function (debounceMs) {
        this.getSyncWatcher().scheduleReload(debounceMs);
    };




}

module.exports = attachSessionSyncMethods;
