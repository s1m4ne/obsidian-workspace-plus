'use strict';

var PersistenceService = require('../../storage/persistence-service.ts').PersistenceService;

// A caller that replaces one of these plugin methods - a test seam, or another
// module wrapping it - must be the only implementation that runs. The shims
// installed below carry a marker, so anything without the marker is a genuine
// replacement and wins; otherwise the service's own method runs. Deciding this
// from the *return value* of a call instead ran both when the replacement
// returned nothing.
function routeToPlugin(plugin, method, fallback) {
    return function () {
        var current = plugin[method];
        if (current && !current._persistenceDelegate) return current.apply(plugin, arguments);
        return fallback.apply(plugin, arguments);
    };
}

// The service's own method. Used where the service owns the implementation.
function onService(method) {
    return function () {
        var service = this.getPersistenceService();
        return service[method].apply(service, arguments);
    };
}

// The file store directly. Used where the service's method is itself a call back
// into the host, so routing it to the service would recurse.
function onJsonStore(method) {
    return function () {
        var store = this.getJsonStore();
        return store[method].apply(store, arguments);
    };
}

function persistenceDelegate(method) {
    var fn = function () {
        var service = this.getPersistenceService();
        return service[method].apply(service, arguments);
    };
    fn._persistenceDelegate = true;
    return fn;
}

function attachPersistenceMethods(WorkspacePlusPlus) {
    WorkspacePlusPlus.prototype.getPersistenceService = function () {
        var self = this;
        if (!this._persistenceService) {
            this._persistenceService = new PersistenceService({
                get data() { return self.data; },
                get app() { return self.app; },
                get manifest() { return self.manifest; },
                loadData: function () { return self.loadData(); },
                saveData: function (data) { return self.saveData(data); },
                reloadExternalSessionStorageIfChanged: function (options) {
                    return typeof self.reloadExternalSessionStorageIfChanged === 'function'
                        ? self.reloadExternalSessionStorageIfChanged(options) : Promise.resolve(false);
                },
                recordSessionDataStored: function (data) {
                    return typeof self.recordSessionDataStored === 'function'
                        ? self.recordSessionDataStored(data) : Promise.resolve(true);
                },
                recordSessionStorageState: function (stamp, mtime, data) {
                    if (typeof self.recordSessionStorageState === 'function') self.recordSessionStorageState(stamp, mtime, data);
                },
                rotateBackupIfNeeded: function (data) {
                    return typeof self.rotateBackupIfNeeded === 'function'
                        ? self.rotateBackupIfNeeded(data) : Promise.resolve();
                },
                clearVersionHistoryEntries: function () {
                    return typeof self.clearVersionHistoryEntries === 'function' ? self.clearVersionHistoryEntries() : false;
                },
                resetSessionsToDefault: function () {
                    return typeof self.resetSessionsToDefault === 'function' ? self.resetSessionsToDefault() : Promise.resolve(false);
                },
                persistData: routeToPlugin(self, 'persistData', onService('persistData')),
                persistDataImmediate: routeToPlugin(self, 'persistDataImmediate', onService('persistDataImmediate')),
                clearBackupFiles: routeToPlugin(self, 'clearBackupFiles', onService('clearBackupFiles')),
                readJsonIfExists: routeToPlugin(self, 'readJsonIfExists', onJsonStore('readJsonIfExists')),
                getFileMtime: routeToPlugin(self, 'getFileMtime', onJsonStore('getFileMtime')),
            });
        }
        return this._persistenceService;
    };

    // Four fields other modules and tests still read and write directly. The
    // service owns them; these mirror them until commit 34 removes the shims.
    // Both halves are needed: a getter without a setter throws on assignment in
    // the strict bundle, which is what silently skipped flushPendingPersistence()
    // on unload once before.
    [
        ['globalSettings', 'getGlobalSettings', 'setGlobalSettings'],
        ['_lastPersistStamp', 'getLastPersistStamp', 'setLastPersistStamp'],
        ['_lastRotationBackupAt', 'getLastRotationBackupAt', 'setLastRotationBackupAt'],
        ['_persistQueue', 'getPersistQueue', 'setPersistQueue'],
    ].forEach(function (entry) {
        var field = entry[0];
        var read = entry[1];
        var write = entry[2];
        Object.defineProperty(WorkspacePlusPlus.prototype, field, {
            configurable: true,
            get: function () { return this.getPersistenceService()[read](); },
            set: function (value) { this.getPersistenceService()[write](value); },
        });
    });

    [
        'getSessionStorage', 'getBackupPath', 'getStorageDirPath', 'getPluginStorageDirPath',
        'getDefaultSessionStorageLocation', 'getSessionStorageLocation', 'setRuntimeSessionStorageLocation',
        'getSessionStorageDirPathForLocation', 'getSessionStorageDirPath', 'isSessionStorageInPluginData',
        'getSessionsPathForLocation', 'getLegacyPluginSessionsPath', 'getSessionsPath',
        'getSessionsBackupPathForLocation', 'getSessionsBackupPath', 'getHistoryPathForLocation',
        'getHistoryPath', 'writeSessionHistory', 'readSessionHistory', 'attachSessionHistory',
        'getExportDirPath', 'getBackupsDirPath', 'getRotationBackupPath', 'getRotationBackupPathForLocation',
        'getSessionBackupFilePathsForLocation', 'getBackupFilePaths', 'getDefaultSettingsData',
        'getDefaultSessionData', 'extractSettingsData', 'extractSessionData', 'normalizeSessionData',
        'getJsonStore', 'ensureDir', 'ensureSessionStorageDir', 'getFileMtime', 'readJsonIfExists',
        'writeJson', 'renameIfExists', 'removeIfExists', 'resolveSessionStorageLocation',
        'setSessionStorageLocation', 'writePluginData', 'persistGlobalSettings', 'writeSessionStore',
        'writeSessionMain', 'migrateLegacyLocalSettings', 'applyDefaultSettings', 'resetSettingsToDefault',
        'resetSessionsAndSettingsToDefault', 'clearBackupFiles', 'clearBackupsAndVersionHistory',
        'getStorageDiagnosticsInfo', 'getSessionStorageSize', 'persistDataImmediate', 'persistData',
        'flushPendingPersistence', 'readSessionCandidate', 'loadSessionDataFromStorage',
        'migrateLegacyPluginSessions', 'migrateLegacySessions', 'loadWithBackup',
    ].forEach(function (method) {
        // The table is a list of strings, so a typo produces a prototype without
        // that method rather than an error. Nothing else can see it: the file is
        // JavaScript so the type checker looks away, the delegation gate has no
        // `this.getX().y()` to resolve, and a method no test happens to call
        // leaves all eleven gates green. Four names were verified to do exactly
        // that before this check existed.
        if (typeof PersistenceService.prototype[method] !== 'function') {
            throw new Error('PersistenceService has no method named ' + method);
        }
        WorkspacePlusPlus.prototype[method] = persistenceDelegate(method);
    });
}

module.exports = attachPersistenceMethods;
