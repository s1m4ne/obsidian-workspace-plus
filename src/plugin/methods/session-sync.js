'use strict';

// Announcing a session change needs the sessions methods, and the Behavior Lock
// suites attach this module on its own. A dependency that is sometimes missing
// is what let a duplicated default survive once already, so this module puts
// what it needs in place rather than guarding the call.
var attachSessionMethods = require('./sessions');
var sessionSync = require('../../storage/session-sync.ts');

function attachSessionSyncMethods(WorkspacePlusPlus) {
    attachSessionMethods(WorkspacePlusPlus);



    WorkspacePlusPlus.prototype.recordSessionStorageState = function (stamp, mtime, data) {
        return sessionSync.recordSessionStorageState(this, stamp, mtime, data);
    };

    WorkspacePlusPlus.prototype.recordSessionDataStored = function (sessionData) {
        return sessionSync.recordSessionDataStored(this, sessionData);
    };



    WorkspacePlusPlus.prototype.hasLocalSessionChangesSinceStorage = function () {
        return sessionSync.hasLocalSessionChangesSinceStorage(this);
    };

    WorkspacePlusPlus.prototype.mergeExternalSessionDataForWrite = function (externalData) {
        return sessionSync.mergeExternalSessionDataForHost(this, externalData);
    };

    WorkspacePlusPlus.prototype.applySessionDataFromStorage = function (sessionData, options) {
        return sessionSync.applySessionDataFromStorage(this, sessionData, options);
    };

    WorkspacePlusPlus.prototype.reloadExternalSessionStorageIfChanged = function (options) {
        return sessionSync.reloadExternalSessionStorageIfChanged(this, options);
    };

    WorkspacePlusPlus.prototype.getSyncWatcher = function () {
        return sessionSync.getSyncWatcher(this);
    };

    WorkspacePlusPlus.prototype.scheduleExternalSessionStorageReload = function (debounceMs) {
        this.getSyncWatcher().scheduleReload(debounceMs);
    };

    WorkspacePlusPlus.prototype.registerSessionStorageListeners = function () {
        this.getSyncWatcher().registerListeners();
    };

    WorkspacePlusPlus.prototype.onExternalSettingsChange = function () {
        sessionSync.onExternalSettingsChange(this);
    };

    WorkspacePlusPlus.prototype.scheduleStartupSessionStorageChecks = function () {
        this.getSyncWatcher().scheduleStartupChecks();
    };

    WorkspacePlusPlus.prototype.clearSessionStorageSyncTimers = function () {
        sessionSync.clearSessionStorageSyncTimers(this);
    };
}

module.exports = attachSessionSyncMethods;
