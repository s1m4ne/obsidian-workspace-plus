'use strict';

var obsidian = require('obsidian');
var i18n = require('../../i18n.ts');
var DEFAULT_DATA = require('../default-data');
var sessionData = require('../session-data');

var SESSION_KEYS = sessionData.SESSION_KEYS;
var pickKeys = sessionData.pickKeys;
var pickSessionPayload = sessionData.pickSessionPayload;
var hasSessionShape = sessionData.hasSessionShape;
var hasNonEmptySessions = sessionData.hasNonEmptySessions;
var getPersistStamp = sessionData.getPersistStamp;
var splitSessionHistory = sessionData.splitSessionHistory;

var storagePaths = require('../../storage/paths.ts');
var defaultData = require('../../storage/default-data.ts');
var jsonFileStore = require('../../storage/json-file-store.ts');
var sessionStorageModule = require('../../storage/session-storage.ts');

var LEGACY_LOCAL_SETTINGS_FILE = storagePaths.LEGACY_LOCAL_SETTINGS_FILE;
var LEGACY_LOCAL_SETTINGS_BACKUP = storagePaths.LEGACY_LOCAL_SETTINGS_BACKUP;
var normalizeSessionStorageLocation = storagePaths.normalizeSessionStorageLocation;

var SETTINGS_KEYS = defaultData.SETTINGS_KEYS;

function attachPersistenceMethods(WorkspacePlusPlus) {
    // --- Data persistence ---

    WorkspacePlusPlus.prototype.getSessionStorage = function () {
        var self = this;
        if (!this._sessionStorage) {
            var initialLoc = normalizeSessionStorageLocation(this.data && this.data.sessionStorageLocation)
                || normalizeSessionStorageLocation(this._sessionStorageLocation);

            this._sessionStorage = new sessionStorageModule.SessionStorage({
                store: this.getJsonStore(),
                manifestDir: function () { return (self.manifest && self.manifest.dir) || null; },
                configDir: function () { return (self.app && self.app.vault && typeof self.app.vault.configDir === 'string') ? self.app.vault.configDir : null; },
                initialLocation: initialLoc,
            });
        }
        return this._sessionStorage;
    };

    WorkspacePlusPlus.prototype.getBackupPath = function () {
        return this.getSessionStorage().getBackupPath();
    };

    WorkspacePlusPlus.prototype.getStorageDirPath = function () {
        return this.getSessionStorage().getStorageDirPath();
    };

    WorkspacePlusPlus.prototype.getPluginStorageDirPath = function () {
        return this.getSessionStorage().getPluginStorageDirPath();
    };

    WorkspacePlusPlus.prototype.getDefaultSessionStorageLocation = function () {
        return this.getSessionStorage().getDefaultSessionStorageLocation();
    };

    WorkspacePlusPlus.prototype.getSessionStorageLocation = function () {
        return this.getSessionStorage().getLocation();
    };

    WorkspacePlusPlus.prototype.setRuntimeSessionStorageLocation = function (location) {
        var normalized = this.getSessionStorage().setLocation(location);
        this._sessionStorageLocation = normalized;
        if (this.data) this.data.sessionStorageLocation = normalized;
        return normalized;
    };

    WorkspacePlusPlus.prototype.getSessionStorageDirPathForLocation = function (location) {
        return this.getSessionStorage().getSessionStorageDirPathForLocation(location);
    };

    WorkspacePlusPlus.prototype.getSessionStorageDirPath = function () {
        return this.getSessionStorage().getSessionStorageDirPath();
    };

    WorkspacePlusPlus.prototype.isSessionStorageInPluginData = function (location) {
        return this.getSessionStorage().isSessionStorageInPluginData(location);
    };

    WorkspacePlusPlus.prototype.getSessionsPathForLocation = function (location) {
        return this.getSessionStorage().getSessionsPathForLocation(location);
    };

    WorkspacePlusPlus.prototype.getLegacyPluginSessionsPath = function () {
        return this.getSessionStorage().getLegacyPluginSessionsPath();
    };

    WorkspacePlusPlus.prototype.getSessionsPath = function () {
        return this.getSessionStorage().getSessionsPath();
    };

    WorkspacePlusPlus.prototype.getSessionsBackupPathForLocation = function (location) {
        return this.getSessionStorage().getSessionsBackupPathForLocation(location);
    };

    WorkspacePlusPlus.prototype.getSessionsBackupPath = function () {
        return this.getSessionStorage().getSessionsBackupPath();
    };

    WorkspacePlusPlus.prototype.getHistoryPathForLocation = function (location) {
        return this.getSessionStorage().getHistoryPathForLocation(location);
    };

    WorkspacePlusPlus.prototype.getHistoryPath = function () {
        return this.getSessionStorage().getHistoryPath();
    };

    WorkspacePlusPlus.prototype.writeSessionHistory = function (historyMap) {
        return this.getSessionStorage().writeSessionHistory(historyMap);
    };

    WorkspacePlusPlus.prototype.readSessionHistory = function () {
        return this.getSessionStorage().readSessionHistory();
    };

    WorkspacePlusPlus.prototype.attachSessionHistory = function (sessionData) {
        return this.getSessionStorage().attachSessionHistory(sessionData);
    };

    WorkspacePlusPlus.prototype.getExportDirPath = function () {
        return this.getSessionStorage().getExportDirPath();
    };

    WorkspacePlusPlus.prototype.getBackupsDirPath = function () {
        return this.getSessionStorage().getBackupsDirPath();
    };

    WorkspacePlusPlus.prototype.getRotationBackupPath = function (generation) {
        return this.getSessionStorage().getRotationBackupPath(generation);
    };

    WorkspacePlusPlus.prototype.getRotationBackupPathForLocation = function (location, generation) {
        return this.getSessionStorage().getRotationBackupPathForLocation(location, generation);
    };

    WorkspacePlusPlus.prototype.getSessionBackupFilePathsForLocation = function (location) {
        return this.getSessionStorage().getSessionBackupFilePathsForLocation(location);
    };

    WorkspacePlusPlus.prototype.getBackupFilePaths = function () {
        return this.getSessionStorage().getBackupFilePaths();
    };



    WorkspacePlusPlus.prototype.getDefaultSettingsData = function () {
        return pickKeys(DEFAULT_DATA, SETTINGS_KEYS);
    };

    WorkspacePlusPlus.prototype.getDefaultSessionData = function () {
        return pickKeys(DEFAULT_DATA, SESSION_KEYS);
    };

    WorkspacePlusPlus.prototype.extractSettingsData = function (data) {
        return pickKeys(data, SETTINGS_KEYS);
    };

    // NOTE: the returned object shares its `sessions` map with the input - both
    // pickKeys() and normalizeSessionData() copy shallowly, so this is a view of
    // this.data, not a snapshot of it. Mutating what comes back (dropping history
    // before a write, for instance) corrupts the live data the UI is reading.
    // Build a copy first; see splitSessionHistory().
    WorkspacePlusPlus.prototype.extractSessionData = function (data) {
        return this.normalizeSessionData(pickKeys(data, SESSION_KEYS));
    };

    WorkspacePlusPlus.prototype.normalizeSessionData = function (raw) {
        var sessions = (raw && raw.sessions && typeof raw.sessions === 'object') ? raw.sessions : {};
        var rawOrder = Array.isArray(raw && raw.sessionOrder) ? raw.sessionOrder : Object.keys(sessions);
        var seen = {};
        var order = [];
        var i;

        for (i = 0; i < rawOrder.length; i++) {
            var id = rawOrder[i];
            if (!sessions[id] || seen[id]) continue;
            seen[id] = true;
            order.push(id);
        }

        var allIds = Object.keys(sessions);
        for (i = 0; i < allIds.length; i++) {
            if (seen[allIds[i]]) continue;
            seen[allIds[i]] = true;
            order.push(allIds[i]);
        }

        var active = raw && typeof raw.activeSessionId === 'string'
            ? raw.activeSessionId
            : null;

        if (active && !sessions[active]) active = null;
        if (!active && order.length > 0) active = order[0];

        // --- Normalize group data ---
        var groups = (raw && raw.groups && typeof raw.groups === 'object') ? raw.groups : {};
        var rawGroupOrder = Array.isArray(raw && raw.groupOrder) ? raw.groupOrder : Object.keys(groups);
        var seenGroups = {};
        var groupOrder = [];

        for (i = 0; i < rawGroupOrder.length; i++) {
            var gid = rawGroupOrder[i];
            if (gid !== '__all__' && !groups[gid]) continue;
            if (seenGroups[gid]) continue;
            seenGroups[gid] = true;
            groupOrder.push(gid);
        }

        var allGroupIds = Object.keys(groups);
        for (i = 0; i < allGroupIds.length; i++) {
            if (seenGroups[allGroupIds[i]]) continue;
            seenGroups[allGroupIds[i]] = true;
            groupOrder.push(allGroupIds[i]);
        }

        var sessionGroups = (raw && raw.sessionGroups && typeof raw.sessionGroups === 'object')
            ? raw.sessionGroups : {};

        // Clean up references to non-existent sessions or groups
        var sessionGroupsCleaned = {};
        var sgKeys = Object.keys(sessionGroups);
        for (i = 0; i < sgKeys.length; i++) {
            var sid = sgKeys[i];
            if (!sessions[sid]) continue;
            var gids = Array.isArray(sessionGroups[sid]) ? sessionGroups[sid] : [];
            var validGids = [];
            for (var k = 0; k < gids.length; k++) {
                if (groups[gids[k]]) validGids.push(gids[k]);
            }
            if (validGids.length > 0) sessionGroupsCleaned[sid] = validGids;
        }

        var activeGroupId = (raw && typeof raw.activeGroupId === 'string' && groups[raw.activeGroupId])
            ? raw.activeGroupId : null;

        return {
            activeSessionId: active,
            sessions: sessions,
            sessionOrder: order,
            groups: groups,
            groupOrder: groupOrder,
            sessionGroups: sessionGroupsCleaned,
            activeGroupId: activeGroupId,
        };
    };

    WorkspacePlusPlus.prototype.getJsonStore = function () {
        var self = this;
        if (!this._jsonStore) {
            this._jsonStore = new jsonFileStore.JsonFileStore(function () {
                return self.app && self.app.vault && self.app.vault.adapter;
            });
        }
        return this._jsonStore;
    };

    WorkspacePlusPlus.prototype.ensureDir = function (path) {
        return this.getJsonStore().ensureDir(path);
    };

    WorkspacePlusPlus.prototype.ensureSessionStorageDir = function () {
        return this.ensureDir(this.getSessionStorageDirPath());
    };

    WorkspacePlusPlus.prototype.getFileMtime = function (path) {
        return this.getJsonStore().getFileMtime(path);
    };

    WorkspacePlusPlus.prototype.readJsonIfExists = function (path) {
        return this.getJsonStore().readJsonIfExists(path);
    };

    WorkspacePlusPlus.prototype.writeJson = function (path, data, pretty) {
        return this.getJsonStore().writeJson(path, data, pretty);
    };

    WorkspacePlusPlus.prototype.renameIfExists = function (fromPath, toPath) {
        return this.getJsonStore().renameIfExists(fromPath, toPath);
    };

    WorkspacePlusPlus.prototype.removeIfExists = function (path) {
        return this.getJsonStore().removeIfExists(path);
    };

    WorkspacePlusPlus.prototype.resolveSessionStorageLocation = function (settingsData) {
        var self = this;
        return this.getSessionStorage().resolveSessionStorageLocation(settingsData).then(function (loc) {
            self.setRuntimeSessionStorageLocation(loc);
            return loc;
        });
    };

    WorkspacePlusPlus.prototype.setSessionStorageLocation = function (location, options) {
        var self = this;
        var L = i18n.L;
        options = options || {};
        var next = normalizeSessionStorageLocation(location);
        if (!next) return Promise.resolve(false);
        if (next === this.getSessionStorageLocation()) return Promise.resolve(false);

        var previousLocation = this.getSessionStorageLocation();
        var split = splitSessionHistory(this.extractSessionData(this.data));
        var sessionData = split.data;
        var now = Date.now();
        if (typeof this._lastPersistStamp === 'number' && now <= this._lastPersistStamp) {
            now = this._lastPersistStamp + 1;
        }
        sessionData._wppSavedAt = now;

        this.setRuntimeSessionStorageLocation(next);
        this._lastPersistStamp = now;
        this._lastRotationBackupAt = 0;

        return this.ensureSessionStorageDir()
            .then(function () {
                return self.writeSessionHistory(split.history);
            })
            .then(function () {
                return self.writeSessionStore(sessionData, { pretty: true });
            })
            .then(function () {
                if (typeof self.recordSessionDataStored !== 'function') return true;
                return self.recordSessionDataStored(sessionData);
            })
            .then(function () {
                return self.persistData();
            })
            .then(function () {
                if (!options.silent) new obsidian.Notice(L.sessionStorageMoved(self.getSessionsPath()), 7000);
                return true;
            })
            .catch(function (error) {
                self.setRuntimeSessionStorageLocation(previousLocation);
                if (!options.silent) new obsidian.Notice(L.sessionStorageMoveFailed);
                throw error;
            });
    };

    WorkspacePlusPlus.prototype.writePluginData = function (data) {
        var self = this;
        var json = JSON.stringify(data);
        return this.app.vault.adapter.write(this.getBackupPath(), json).then(function () {
            return self.saveData(data);
        });
    };

    // Write the settings to data.json.
    //
    // In plugin-folder mode data.json also holds the sessions, so a settings-only
    // write must not replace the file wholesale. When the caller has the session
    // data at hand it passes it in; otherwise whatever data.json already holds is
    // carried over, which is what keeps a stray settings write from wiping every
    // session.
    WorkspacePlusPlus.prototype.persistGlobalSettings = function (sessionData) {
        var self = this;
        if (!this.globalSettings) {
            this.globalSettings = Object.assign({}, this.getDefaultSettingsData());
        }
        var settings = Object.assign({}, this.globalSettings, {
            sessionStorageLocation: this.getSessionStorageLocation(),
        });

        if (!this.isSessionStorageInPluginData()) {
            return this.writePluginData(settings);
        }

        if (sessionData) {
            return this.writePluginData(Object.assign({}, settings, sessionData));
        }

        return Promise.resolve()
            .then(function () {
                return self.loadData();
            })
            .catch(function () {
                return null;
            })
            .then(function (existing) {
                return self.writePluginData(
                    Object.assign({}, settings, pickSessionPayload(existing))
                );
            });
    };

    // Persist session data to whichever store the current mode uses, writing the
    // recovery copy first so a crash between the two writes leaves the older but
    // complete backup behind.
    WorkspacePlusPlus.prototype.writeSessionStore = function (sessionData, options) {
        var self = this;
        options = options || {};

        return this.writeJson(this.getSessionsBackupPath(), sessionData, options.pretty)
            .then(function () {
                return self.writeSessionMain(sessionData, options);
            });
    };

    // Write only the primary session store, leaving the recovery copy alone.
    WorkspacePlusPlus.prototype.writeSessionMain = function (sessionData, options) {
        options = options || {};
        if (this.isSessionStorageInPluginData()) {
            return this.persistGlobalSettings(sessionData);
        }
        return this.writeJson(this.getSessionsPath(), sessionData, options.pretty);
    };

    // Vault-local settings (.workspace-plus-plus/settings.local.json) are gone.
    // Nobody ever asked for them - issue #4, the only multi-vault request, asked
    // for per-vault *workspaces* while explicitly wanting settings to stay in
    // sync - and keeping them meant carrying a second settings layer that could
    // not reach other devices anyway, since dot-folders are excluded from
    // Obsidian Sync.
    //
    // Anyone still holding the old file gets it folded into data.json on load.
    // The local copy is what they actually saw, so it wins over the frozen
    // values in data.json; the file is renamed rather than deleted.
    WorkspacePlusPlus.prototype.migrateLegacyLocalSettings = function () {
        var self = this;

        return this.readJsonIfExists(LEGACY_LOCAL_SETTINGS_FILE)
            .then(function (res) {
                if (!res.exists) return false;
                if (res.error || !res.data || typeof res.data !== 'object') {
                    // Leave an unreadable file in place rather than discarding
                    // settings we cannot merge.
                    return false;
                }

                self.globalSettings = Object.assign(
                    {},
                    self.getDefaultSettingsData(),
                    self.globalSettings || {},
                    pickKeys(res.data, SETTINGS_KEYS)
                );

                return self.persistGlobalSettings()
                    .then(function () {
                        return self.renameIfExists(
                            LEGACY_LOCAL_SETTINGS_FILE,
                            LEGACY_LOCAL_SETTINGS_BACKUP
                        );
                    })
                    .then(function () {
                        return true;
                    });
            })
            .catch(function () {
                return false;
            });
    };

    WorkspacePlusPlus.prototype.applyDefaultSettings = function () {
        var defaults = this.getDefaultSettingsData();
        for (var i = 0; i < SETTINGS_KEYS.length; i++) {
            this.data[SETTINGS_KEYS[i]] = defaults[SETTINGS_KEYS[i]];
        }
        i18n.resolveLocale(this.data.language || 'auto');
    };

    WorkspacePlusPlus.prototype.resetSettingsToDefault = function () {
        this.applyDefaultSettings();
        return this.persistData();
    };

    WorkspacePlusPlus.prototype.resetSessionsAndSettingsToDefault = function () {
        var self = this;
        this.applyDefaultSettings();
        return this.resetSessionsToDefault().then(function () {
            return self.clearBackupFiles();
        });
    };

    WorkspacePlusPlus.prototype.clearBackupFiles = function () {
        var self = this;
        var paths = this.getBackupFilePaths();
        var tasks = paths.map(function (path) {
            return self.removeIfExists(path);
        });
        return Promise.all(tasks).then(function () {
            self._lastRotationBackupAt = 0;
            return true;
        });
    };

    WorkspacePlusPlus.prototype.clearBackupsAndVersionHistory = function () {
        var self = this;
        var changed = false;
        if (typeof this.clearVersionHistoryEntries === 'function') {
            changed = this.clearVersionHistoryEntries();
        }
        var save = changed ? this.persistData() : Promise.resolve();
        return save.then(function () {
            return self.clearBackupFiles();
        });
    };

    WorkspacePlusPlus.prototype.getStorageDiagnosticsInfo = function () {
        return {
            syncedByObsidianSync: this.isSessionStorageInPluginData(),
            sessionsPath: this.getSessionsPath(),
            sessionsBackupPath: this.getSessionsBackupPath(),
            historyPath: this.getHistoryPath(),
            sessionCount: Object.keys((this.data && this.data.sessions) || {}).length,
            updatedAt: Date.now(),
        };
    };

    // Size of the file Obsidian Sync actually carries. Obsidian's saveData() writes
    // data.json indented, so this is meaningfully larger than the data it holds -
    // and it is the number that counts against Sync's per-file limit.
    WorkspacePlusPlus.prototype.getSessionStorageSize = function () {
        return this.app.vault.adapter.stat(this.getSessionsPath())
            .then(function (stat) {
                if (!stat || typeof stat.size !== 'number') return null;
                return stat.size;
            })
            .catch(function () {
                return null;
            });
    };



    WorkspacePlusPlus.prototype.persistDataImmediate = function () {
        var self = this;
        var syncBeforeWrite = typeof this.reloadExternalSessionStorageIfChanged === 'function'
            ? this.reloadExternalSessionStorageIfChanged({ mergeLocal: true })
            : Promise.resolve(false);

        return syncBeforeWrite
            .then(function () {
                // Version history lives in its own local-only file, so the sessions
                // written here (and the backups derived from them) are history-free.
                var split = splitSessionHistory(self.extractSessionData(self.data));
                var sessionData = split.data;
                var settingsData = Object.assign({}, self.getDefaultSettingsData(), self.extractSettingsData(self.data));
                var now = Date.now();
                if (typeof self._lastPersistStamp === 'number' && now <= self._lastPersistStamp) {
                    now = self._lastPersistStamp + 1;
                }
                self._lastPersistStamp = now;
                sessionData._wppSavedAt = now;

                self.globalSettings = Object.assign({}, settingsData);

                return self.ensureSessionStorageDir()
                    .then(function () {
                        return self.writeSessionHistory(split.history);
                    })
                    .then(function () {
                        // Settings and sessions go out together; writing them
                        // separately would have each overwrite the other's file.
                        return self.writeSessionStore(sessionData);
                    })
                    .then(function () {
                        // In plugin-folder mode that write already covered data.json.
                        // Otherwise the settings still need one of their own.
                        if (self.isSessionStorageInPluginData()) return;
                        return self.persistGlobalSettings();
                    })
                    .then(function () {
                        if (typeof self.recordSessionDataStored !== 'function') return true;
                        return self.recordSessionDataStored(sessionData);
                    })
                    .then(function () {
                        return self.rotateBackupIfNeeded(sessionData);
                    });
            });
    };

    WorkspacePlusPlus.prototype.persistData = function () {
        var self = this;
        if (!this._persistQueue) {
            this._persistQueue = Promise.resolve();
        }

        var next = this._persistQueue
            .catch(function () {
                return;
            })
            .then(function () {
                return self.persistDataImmediate();
            });

        this._persistQueue = next;
        return next;
    };

    WorkspacePlusPlus.prototype.flushPendingPersistence = function () {
        if (!this._persistQueue) return Promise.resolve();
        return this._persistQueue.catch(function () {
            return;
        });
    };

    // --- Rotation backup ---






    WorkspacePlusPlus.prototype.readSessionCandidate = function (path) {
        return Promise.all([
            this.readJsonIfExists(path),
            this.getFileMtime(path),
        ]).then(function (parts) {
            var res = parts[0];
            var valid = res.exists && !res.error && hasSessionShape(res.data);
            return {
                valid: valid,
                data: res.data,
                mtime: parts[1] || 0,
                stamp: valid ? getPersistStamp(res.data) : 0,
            };
        });
    };

    WorkspacePlusPlus.prototype.loadSessionDataFromStorage = function () {
        var self = this;
        var L = i18n.L;
        var backupPath = this.getSessionsBackupPath();
        // Installs from before sessions moved into data.json still keep them in
        // the plugin folder's sessions.json.
        var legacyPath = this.isSessionStorageInPluginData()
            ? this.getLegacyPluginSessionsPath()
            : null;

        return this.readSessionCandidate(this.getSessionsPath())
            .then(function (main) {
                if (main.valid || !legacyPath) return main;
                return self.readSessionCandidate(legacyPath);
            })
            .then(function (main) {
                return self.readSessionCandidate(backupPath).then(function (backup) {
                    if (!main.valid && !backup.valid) return null;

                    var useBackup = false;
                    if (!main.valid && backup.valid) {
                        useBackup = true;
                    } else if (main.valid && backup.valid) {
                        if (backup.stamp > main.stamp) {
                            useBackup = true;
                        } else if (backup.stamp === main.stamp && backup.mtime > main.mtime) {
                            // If backup is newer (e.g. app quit between backup write and main write),
                            // prefer backup to avoid losing the latest change.
                            useBackup = true;
                        }
                    }

                    if (!useBackup) {
                        var mainData = self.normalizeSessionData(main.data);
                        if (typeof self.recordSessionStorageState === 'function') {
                            self.recordSessionStorageState(main.stamp, main.mtime, mainData);
                        }
                        return mainData;
                    }

                    var restored = self.normalizeSessionData(backup.data);
                    // Restore through the mode-aware writer: in plugin-folder mode the
                    // primary store is data.json, and a raw write would drop the settings.
                    return self.writeSessionMain(backup.data).catch(function () {
                        return;
                    }).then(function () {
                        return self.getFileMtime(self.getSessionsPath());
                    }).then(function (restoredMtime) {
                        if (typeof self.recordSessionStorageState === 'function') {
                            self.recordSessionStorageState(backup.stamp, restoredMtime || backup.mtime, restored);
                        }
                        if (!main.valid) new obsidian.Notice(L.backupRestored);
                        return restored;
                    });
                });
            });
    };

    // plugin-folder installs from before sessions moved into data.json still have
    // them in the plugin folder's sessions.json, which Obsidian Sync ignores.
    //
    // The next save would move them anyway, but flushOnStartup() only runs when
    // auto-save on switch is enabled, so a user who has that off and simply opens
    // and closes Obsidian would stay unsynced. Write them across on load instead.
    WorkspacePlusPlus.prototype.migrateLegacyPluginSessions = function (sessionData) {
        var self = this;

        if (!this.isSessionStorageInPluginData()) return Promise.resolve(false);
        if (!sessionData || !hasNonEmptySessions(sessionData)) return Promise.resolve(false);

        return this.app.vault.adapter.exists(this.getLegacyPluginSessionsPath())
            .then(function (exists) {
                if (!exists) return false;

                return Promise.resolve()
                    .then(function () {
                        return self.loadData();
                    })
                    .catch(function () {
                        return null;
                    })
                    .then(function (existing) {
                        // Already carried over: data.json is the source of truth and
                        // the old file is just a leftover.
                        if (hasSessionShape(existing)) return false;

                        var payload = splitSessionHistory(sessionData).data;
                        return self.ensureSessionStorageDir()
                            .then(function () {
                                return self.writeSessionStore(payload);
                            })
                            .then(function () {
                                if (typeof self.recordSessionDataStored !== 'function') return true;
                                return self.recordSessionDataStored(payload);
                            })
                            .then(function () {
                                return true;
                            });
                    });
            })
            .catch(function () {
                // Best effort: the old file is still intact either way.
                return false;
            });
    };

    WorkspacePlusPlus.prototype.migrateLegacySessions = function (sessionData) {
        var self = this;
        var normalized = this.normalizeSessionData(sessionData);
        return this.ensureSessionStorageDir()
            .then(function () {
                return self.writeSessionStore(normalized);
            })
            .then(function () {
                return true;
            })
            .catch(function () {
                return false;
            });
    };

    WorkspacePlusPlus.prototype.loadWithBackup = function () {
        var self = this;
        var L = i18n.L;
        var loadedMain = null;
        var rawSaved = null;
        var legacyMain = null;
        var hadLegacyInMain = false;

        return this.loadData()
            .catch(function () {
                return null;
            })
            .then(function (saved) {
                rawSaved = saved;
                loadedMain = saved || {};
                self.globalSettings = Object.assign(
                    {},
                    self.getDefaultSettingsData(),
                    self.extractSettingsData(loadedMain)
                );
                // The storage location has to be settled first: whether sessions in
                // data.json are the current format or the pre-#5 layout depends on it,
                // and migrateLegacyLocalSettings() writes data.json.
                return self.resolveSessionStorageLocation({
                    sessionStorageLocation: loadedMain.sessionStorageLocation,
                });
            })
            .then(function () {
                return self.migrateLegacyLocalSettings();
            })
            .then(function () {
                // Sessions inside data.json are exactly where plugin-folder mode keeps
                // them, so only vault-folder installs can be carrying the old layout
                // that predates the move out of data.json.
                hadLegacyInMain = hasSessionShape(loadedMain) && !self.isSessionStorageInPluginData();
                legacyMain = hadLegacyInMain ? self.normalizeSessionData(loadedMain) : null;
                return self.loadSessionDataFromStorage();
            })
            .then(function (sessionData) {
                if (sessionData && hasNonEmptySessions(sessionData)) return sessionData;

                if (legacyMain && hasNonEmptySessions(legacyMain)) {
                    return self.migrateLegacySessions(legacyMain).then(function (ok) {
                        if (ok) new obsidian.Notice(L.sessionDataMigrated);
                        else new obsidian.Notice(L.sessionDataMigrationFailed);
                        return legacyMain;
                    });
                }

                if (sessionData) return sessionData;

                return self.readJsonIfExists(self.getBackupPath()).then(function (legacyBackupRes) {
                    if (
                        legacyBackupRes.exists
                        && !legacyBackupRes.error
                        && hasSessionShape(legacyBackupRes.data)
                        && hasNonEmptySessions(legacyBackupRes.data)
                    ) {
                        var fromLegacyBackup = self.normalizeSessionData(legacyBackupRes.data);
                        return self.migrateLegacySessions(fromLegacyBackup).then(function (ok) {
                            if (ok) new obsidian.Notice(L.sessionDataMigrated);
                            else new obsidian.Notice(L.sessionDataMigrationFailed);
                            return fromLegacyBackup;
                        });
                    }
                    return self.getDefaultSessionData();
                });
            })
            .then(function (sessionData) {
                return self.attachSessionHistory(sessionData);
            })
            .then(function (sessionData) {
                return self.migrateLegacyPluginSessions(sessionData).then(function () {
                    return sessionData;
                });
            })
            .then(function (sessionData) {
                if (!hadLegacyInMain) return sessionData;
                return self.persistGlobalSettings()
                    .catch(function () {
                        return;
                    })
                    .then(function () {
                        return sessionData;
                    });
            })
            .then(function (sessionData) {
                var effectiveSettings = Object.assign({}, self.globalSettings);
                effectiveSettings.sessionStorageLocation = self.getSessionStorageLocation();
                // Migrate: existing users keep filter visible (new default is OFF).
                // rawSaved is null for new installs; for existing users it is the raw
                // data.json object. Before showFilterInput was added to SETTINGS_KEYS
                // it was never written to disk, so rawSaved.showFilterInput is
                // undefined for any user who predates that setting.
                if (rawSaved !== null && rawSaved !== undefined && rawSaved.showFilterInput === undefined) {
                    effectiveSettings.showFilterInput = true;
                }
                var merged = Object.assign({}, self.getDefaultSessionData(), sessionData || {});
                return Object.assign(merged, effectiveSettings);
            });
    };
}

module.exports = attachPersistenceMethods;
