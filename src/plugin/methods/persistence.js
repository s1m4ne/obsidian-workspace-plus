'use strict';

var obsidian = require('obsidian');
var i18n = require('../../i18n');
var DEFAULT_DATA = require('../default-data');

var STORAGE_DIR = '.workspace-plus-plus';
var SESSIONS_FILE = STORAGE_DIR + '/sessions.json';
var SESSIONS_BACKUP_FILE = STORAGE_DIR + '/sessions.backup.json';
var LOCAL_SETTINGS_FILE = STORAGE_DIR + '/settings.local.json';
var EXPORT_DIR = STORAGE_DIR + '/exports';
var BACKUPS_DIR = STORAGE_DIR + '/backups';
var BACKUP_ROTATION_INTERVAL = 3600000; // 1 hour

var SESSION_KEYS = [
    'activeSessionId',
    'sessions',
    'sessionOrder',
    'groups',
    'groupOrder',
    'sessionGroups',
    'activeGroupId',
];

var SETTINGS_KEYS = [
    'language',
    'previewNext',
    'previewPrevious',
    'confirmDeleteByHotkey',
    'autoSaveOnSwitch',
    'warnOnUnsavedSwitch',
    'statusBarQuickSwitcher',
    'groupFeatureEnabled',
    'searchOverlayPosition',
    'searchOverlaySize',
    'versionHistoryEnabled',
    'versionHistorySnapshotInterval',
    'versionHistoryCtrlRmbRestore',
    'versionHistoryConfirmRestore',
];

function pickKeys(data, keys) {
    var out = {};
    if (!data) return out;
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (data[key] !== undefined) out[key] = data[key];
    }
    return out;
}

function hasSessionShape(data) {
    return !!(
        data
        && typeof data === 'object'
        && (data.sessions !== undefined || data.sessionOrder !== undefined || data.activeSessionId !== undefined)
    );
}

function hasNonEmptySessions(data) {
    return !!(
        data
        && data.sessions
        && typeof data.sessions === 'object'
        && Object.keys(data.sessions).length > 0
    );
}

function getPersistStamp(data) {
    if (!data || typeof data !== 'object') return 0;
    var stamp = data._wppSavedAt;
    if (typeof stamp !== 'number' || !isFinite(stamp)) return 0;
    return stamp;
}

function pad2(n) {
    return n < 10 ? '0' + n : String(n);
}

function formatExportStamp(ts) {
    var d = new Date(ts);
    return String(d.getFullYear())
        + pad2(d.getMonth() + 1)
        + pad2(d.getDate())
        + '-'
        + pad2(d.getHours())
        + pad2(d.getMinutes())
        + pad2(d.getSeconds());
}

function attachPersistenceMethods(WorkspacePlusPlus) {
    // --- Data persistence ---

    WorkspacePlusPlus.prototype.getBackupPath = function () {
        return this.manifest.dir + '/data.backup.json';
    };

    WorkspacePlusPlus.prototype.getStorageDirPath = function () {
        return STORAGE_DIR;
    };

    WorkspacePlusPlus.prototype.getSessionsPath = function () {
        return SESSIONS_FILE;
    };

    WorkspacePlusPlus.prototype.getSessionsBackupPath = function () {
        return SESSIONS_BACKUP_FILE;
    };

    WorkspacePlusPlus.prototype.getLocalSettingsPath = function () {
        return LOCAL_SETTINGS_FILE;
    };

    WorkspacePlusPlus.prototype.getExportDirPath = function () {
        return EXPORT_DIR;
    };

    WorkspacePlusPlus.prototype.getBackupsDirPath = function () {
        return BACKUPS_DIR;
    };

    WorkspacePlusPlus.prototype.getRotationBackupPath = function (generation) {
        return BACKUPS_DIR + '/sessions.' + generation + '.json';
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

    WorkspacePlusPlus.prototype.ensureDir = function (path) {
        var self = this;
        return this.app.vault.adapter.exists(path).then(function (exists) {
            if (exists) return;
            return self.app.vault.adapter.mkdir(path).catch(function () {
                return self.app.vault.adapter.exists(path).then(function (existsAfter) {
                    if (!existsAfter) throw new Error('Failed to create directory: ' + path);
                });
            });
        });
    };

    WorkspacePlusPlus.prototype.ensureStorageDir = function () {
        return this.ensureDir(this.getStorageDirPath());
    };

    WorkspacePlusPlus.prototype.getFileMtime = function (path) {
        return this.app.vault.adapter.stat(path)
            .then(function (stat) {
                if (!stat || typeof stat.mtime !== 'number') return 0;
                return stat.mtime;
            })
            .catch(function () {
                return 0;
            });
    };

    WorkspacePlusPlus.prototype.readJsonIfExists = function (path) {
        var self = this;
        return this.app.vault.adapter.exists(path).then(function (exists) {
            if (!exists) {
                return { exists: false, data: null, error: null };
            }
            return self.app.vault.adapter.read(path)
                .then(function (raw) {
                    try {
                        return { exists: true, data: JSON.parse(raw), error: null };
                    } catch (e) {
                        return { exists: true, data: null, error: e };
                    }
                })
                .catch(function (e) {
                    return { exists: true, data: null, error: e };
                });
        });
    };

    WorkspacePlusPlus.prototype.writeJson = function (path, data, pretty) {
        var json = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
        return this.app.vault.adapter.write(path, json);
    };

    WorkspacePlusPlus.prototype.writeJsonWithBackup = function (path, backupPath, data, pretty) {
        var self = this;
        return this.writeJson(backupPath, data, pretty).then(function () {
            return self.writeJson(path, data, pretty);
        });
    };

    WorkspacePlusPlus.prototype.removeIfExists = function (path) {
        var self = this;
        return this.app.vault.adapter.exists(path).then(function (exists) {
            if (!exists) return;
            return self.app.vault.adapter.remove(path).catch(function () {
                return;
            });
        });
    };

    WorkspacePlusPlus.prototype.persistGlobalSettings = function () {
        var self = this;
        if (!this.globalSettings) {
            this.globalSettings = Object.assign({}, this.getDefaultSettingsData());
        }
        var json = JSON.stringify(this.globalSettings);
        return this.app.vault.adapter.write(this.getBackupPath(), json).then(function () {
            return self.saveData(self.globalSettings);
        });
    };

    WorkspacePlusPlus.prototype.isUsingLocalSettings = function () {
        return !!this.useLocalSettings;
    };

    WorkspacePlusPlus.prototype.setUseLocalSettings = function (enabled, options) {
        var self = this;
        var L = i18n.L;
        options = options || {};
        var next = !!enabled;
        if (next === this.isUsingLocalSettings()) return Promise.resolve(next);

        if (next) {
            var current = Object.assign({}, this.getDefaultSettingsData(), this.extractSettingsData(this.data));
            this.globalSettings = Object.assign({}, current);
            this.useLocalSettings = true;
            return this.ensureStorageDir()
                .then(function () {
                    return self.writeJson(self.getLocalSettingsPath(), current, true);
                })
                .then(function () {
                    return self.persistData();
                })
                .then(function () {
                    if (options.notify) new obsidian.Notice(L.localSettingsEnabled);
                    return true;
                });
        }

        this.useLocalSettings = false;
        var global = Object.assign({}, this.getDefaultSettingsData(), this.globalSettings || {});
        for (var i = 0; i < SETTINGS_KEYS.length; i++) {
            this.data[SETTINGS_KEYS[i]] = global[SETTINGS_KEYS[i]];
        }
        return this.removeIfExists(this.getLocalSettingsPath())
            .then(function () {
                return self.persistData();
            })
            .then(function () {
                if (options.notify) new obsidian.Notice(L.localSettingsDisabled);
                return false;
            });
    };

    WorkspacePlusPlus.prototype.copyGlobalSettingsToLocal = function (options) {
        var self = this;
        var L = i18n.L;
        options = options || {};
        var global = Object.assign({}, this.getDefaultSettingsData(), this.globalSettings || {});
        this.useLocalSettings = true;
        for (var i = 0; i < SETTINGS_KEYS.length; i++) {
            this.data[SETTINGS_KEYS[i]] = global[SETTINGS_KEYS[i]];
        }
        return this.ensureStorageDir()
            .then(function () {
                return self.writeJson(self.getLocalSettingsPath(), global, true);
            })
            .then(function () {
                return self.persistData();
            })
            .then(function () {
                if (options.notify) new obsidian.Notice(L.localSettingsCopied);
                return true;
            });
    };

    WorkspacePlusPlus.prototype.resetLocalSettings = function (options) {
        var self = this;
        options = options || {};
        if (!this.isUsingLocalSettings()) return Promise.resolve(false);
        return this.copyGlobalSettingsToLocal(options).then(function () {
            return self.isUsingLocalSettings();
        });
    };

    WorkspacePlusPlus.prototype.applyDefaultSettingsToCurrentScope = function () {
        var defaults = this.getDefaultSettingsData();
        for (var i = 0; i < SETTINGS_KEYS.length; i++) {
            this.data[SETTINGS_KEYS[i]] = defaults[SETTINGS_KEYS[i]];
        }
        i18n.resolveLocale(this.data.language || 'auto');
    };

    WorkspacePlusPlus.prototype.resetSettingsToDefault = function () {
        this.applyDefaultSettingsToCurrentScope();
        return this.persistData();
    };

    WorkspacePlusPlus.prototype.resetSessionsAndSettingsToDefault = function () {
        this.applyDefaultSettingsToCurrentScope();
        return this.resetSessionsToDefault();
    };

    WorkspacePlusPlus.prototype.getStorageDiagnosticsInfo = function () {
        return {
            sessionsPath: this.getSessionsPath(),
            sessionsBackupPath: this.getSessionsBackupPath(),
            localSettingsPath: this.getLocalSettingsPath(),
            globalSettingsPath: this.manifest.dir + '/data.json',
            sessionCount: Object.keys((this.data && this.data.sessions) || {}).length,
            updatedAt: Date.now(),
        };
    };

    WorkspacePlusPlus.prototype.exportSessionsSnapshot = function () {
        var self = this;
        var L = i18n.L;
        var stamp = formatExportStamp(Date.now());
        var filePath = this.getExportDirPath() + '/sessions-' + stamp + '.json';
        var payload = {
            exportedAt: Date.now(),
            source: this.manifest.id,
            data: this.extractSessionData(this.data),
        };

        return this.ensureStorageDir()
            .then(function () {
                return self.ensureDir(self.getExportDirPath());
            })
            .then(function () {
                return self.writeJson(filePath, payload, true);
            })
            .then(function () {
                new obsidian.Notice(L.exportSessionsDone(filePath), 7000);
                return filePath;
            });
    };

    WorkspacePlusPlus.prototype.importSessionsFromLatestExport = function () {
        var self = this;
        var L = i18n.L;

        return this.app.vault.adapter.exists(this.getExportDirPath())
            .then(function (exists) {
                if (!exists) return null;
                return self.app.vault.adapter.list(self.getExportDirPath());
            })
            .then(function (listed) {
                if (!listed || !listed.files || listed.files.length === 0) return null;
                var files = listed.files.filter(function (path) {
                    return /\.json$/i.test(path);
                });
                if (files.length === 0) return null;
                files.sort();
                return files[files.length - 1];
            })
            .then(function (latestPath) {
                if (!latestPath) {
                    new obsidian.Notice(L.importSessionsNoFile);
                    return false;
                }
                return self.app.vault.adapter.read(latestPath).then(function (raw) {
                    var parsed = JSON.parse(raw);
                    var candidate = parsed && parsed.data ? parsed.data : parsed;
                    if (!hasSessionShape(candidate)) {
                        new obsidian.Notice(L.importSessionsFailed);
                        return false;
                    }
                    var imported = self.normalizeSessionData(candidate);
                    if (!hasNonEmptySessions(imported)) {
                        new obsidian.Notice(L.importSessionsFailed);
                        return false;
                    }

                    self.data.activeSessionId = imported.activeSessionId;
                    self.data.sessions = imported.sessions;
                    self.data.sessionOrder = imported.sessionOrder;
                    self.data.groups = imported.groups || {};
                    self.data.groupOrder = typeof self.normalizeGroupTabOrder === 'function'
                        ? self.normalizeGroupTabOrder(imported.groupOrder || [])
                        : (imported.groupOrder || []);
                    self.data.sessionGroups = imported.sessionGroups || {};
                    self.data.activeGroupId = imported.activeGroupId || null;
                    self.syncSessionOrder();
                    self.updateStatusBar();
                    self.syncSessionCommands();
                    return self.persistData().then(function () {
                        new obsidian.Notice(L.importSessionsDone(latestPath), 7000);
                        return true;
                    });
                }).catch(function () {
                    new obsidian.Notice(L.importSessionsFailed);
                    return false;
                });
            });
    };

    WorkspacePlusPlus.prototype.persistDataImmediate = function () {
        var self = this;
        var sessionData = this.extractSessionData(this.data);
        var settingsData = Object.assign({}, this.getDefaultSettingsData(), this.extractSettingsData(this.data));
        var now = Date.now();
        if (typeof this._lastPersistStamp === 'number' && now <= this._lastPersistStamp) {
            now = this._lastPersistStamp + 1;
        }
        this._lastPersistStamp = now;
        sessionData._wppSavedAt = now;

        if (this.isUsingLocalSettings()) {
            if (!this.globalSettings) {
                this.globalSettings = Object.assign({}, settingsData);
            }
        } else {
            this.globalSettings = Object.assign({}, settingsData);
        }

        return this.ensureStorageDir()
            .then(function () {
                return self.writeJsonWithBackup(
                    self.getSessionsPath(),
                    self.getSessionsBackupPath(),
                    sessionData
                );
            })
            .then(function () {
                return self.rotateBackupIfNeeded(sessionData);
            })
            .then(function () {
                if (!self.isUsingLocalSettings()) return;
                return self.writeJson(self.getLocalSettingsPath(), settingsData, true);
            })
            .then(function () {
                return self.persistGlobalSettings();
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

    WorkspacePlusPlus.prototype.initRotationBackupTimestamp = function () {
        var self = this;
        return this.readJsonIfExists(this.getRotationBackupPath(1))
            .then(function (res) {
                if (res.exists && res.data) {
                    self._lastRotationBackupAt = getPersistStamp(res.data) || 0;
                } else {
                    self._lastRotationBackupAt = 0;
                }
            })
            .catch(function () {
                self._lastRotationBackupAt = 0;
            });
    };

    WorkspacePlusPlus.prototype.rotateBackupIfNeeded = function (sessionData) {
        var now = Date.now();
        var last = this._lastRotationBackupAt || 0;
        if (now - last < BACKUP_ROTATION_INTERVAL) return Promise.resolve();

        var self = this;
        this._lastRotationBackupAt = now;

        return this.ensureDir(this.getBackupsDirPath())
            .then(function () {
                // Shift generations: 2→3, 1→2
                return self.copyFileIfExists(
                    self.getRotationBackupPath(2),
                    self.getRotationBackupPath(3)
                );
            })
            .then(function () {
                return self.copyFileIfExists(
                    self.getRotationBackupPath(1),
                    self.getRotationBackupPath(2)
                );
            })
            .then(function () {
                // Write current data as generation 1
                return self.writeJson(self.getRotationBackupPath(1), sessionData);
            })
            .catch(function () {
                // Backup failure should not block normal persistence
                return;
            });
    };

    WorkspacePlusPlus.prototype.copyFileIfExists = function (srcPath, dstPath) {
        var self = this;
        return this.app.vault.adapter.exists(srcPath).then(function (exists) {
            if (!exists) return;
            return self.app.vault.adapter.read(srcPath).then(function (raw) {
                return self.app.vault.adapter.write(dstPath, raw);
            });
        });
    };

    WorkspacePlusPlus.prototype.getRotationBackupInfo = function () {
        var self = this;
        var results = [];

        function readGeneration(n) {
            return self.readJsonIfExists(self.getRotationBackupPath(n))
                .then(function (res) {
                    if (!res.exists || !res.data) return null;
                    var stamp = getPersistStamp(res.data);
                    var sessions = res.data.sessions;
                    var count = (sessions && typeof sessions === 'object')
                        ? Object.keys(sessions).length : 0;
                    return { generation: n, savedAt: stamp, sessionCount: count };
                })
                .catch(function () {
                    return null;
                });
        }

        return Promise.all([
            readGeneration(1),
            readGeneration(2),
            readGeneration(3),
        ]).then(function (items) {
            for (var i = 0; i < items.length; i++) {
                if (items[i]) results.push(items[i]);
            }
            return results;
        });
    };

    WorkspacePlusPlus.prototype.restoreFromRotationBackup = function (generation) {
        var self = this;
        var L = i18n.L;
        return this.readJsonIfExists(this.getRotationBackupPath(generation))
            .then(function (res) {
                if (!res.exists || res.error || !res.data) {
                    new obsidian.Notice(L.rotationBackupRestoreFailed);
                    return false;
                }
                if (!hasSessionShape(res.data)) {
                    new obsidian.Notice(L.rotationBackupRestoreFailed);
                    return false;
                }
                var imported = self.normalizeSessionData(res.data);
                if (!hasNonEmptySessions(imported)) {
                    new obsidian.Notice(L.rotationBackupRestoreFailed);
                    return false;
                }

                self.data.activeSessionId = imported.activeSessionId;
                self.data.sessions = imported.sessions;
                self.data.sessionOrder = imported.sessionOrder;
                self.data.groups = imported.groups || {};
                self.data.groupOrder = typeof self.normalizeGroupTabOrder === 'function'
                    ? self.normalizeGroupTabOrder(imported.groupOrder || [])
                    : (imported.groupOrder || []);
                self.data.sessionGroups = imported.sessionGroups || {};
                self.data.activeGroupId = imported.activeGroupId || null;
                self.syncSessionOrder();
                self.updateStatusBar();
                self.syncSessionCommands();

                return self.persistData().then(function () {
                    var active = self.getActiveSession();
                    if (active && active.layout) {
                        return self.app.workspace.changeLayout(active.layout).then(function () {
                            new obsidian.Notice(L.rotationBackupRestored);
                            return true;
                        });
                    }
                    new obsidian.Notice(L.rotationBackupRestored);
                    return true;
                });
            })
            .catch(function () {
                new obsidian.Notice(L.rotationBackupRestoreFailed);
                return false;
            });
    };

    WorkspacePlusPlus.prototype.loadLocalSettingsData = function () {
        var L = i18n.L;
        return this.readJsonIfExists(this.getLocalSettingsPath()).then(function (res) {
            if (!res.exists) return null;
            if (res.error || !res.data || typeof res.data !== 'object') {
                new obsidian.Notice(L.localSettingsLoadFailed);
                return null;
            }
            return pickKeys(res.data, SETTINGS_KEYS);
        });
    };

    WorkspacePlusPlus.prototype.loadSessionDataFromStorage = function () {
        var self = this;
        var L = i18n.L;
        var mainPath = this.getSessionsPath();
        var backupPath = this.getSessionsBackupPath();

        return Promise.all([
            this.readJsonIfExists(mainPath),
            this.readJsonIfExists(backupPath),
            this.getFileMtime(mainPath),
            this.getFileMtime(backupPath),
        ]).then(function (parts) {
            var mainRes = parts[0];
            var backupRes = parts[1];
            var mainMtime = parts[2] || 0;
            var backupMtime = parts[3] || 0;

            var mainValid = mainRes.exists && !mainRes.error && hasSessionShape(mainRes.data);
            var backupValid = backupRes.exists && !backupRes.error && hasSessionShape(backupRes.data);
            var mainStamp = mainValid ? getPersistStamp(mainRes.data) : 0;
            var backupStamp = backupValid ? getPersistStamp(backupRes.data) : 0;

            if (!mainValid && !backupValid) return null;

            var useBackup = false;
            if (!mainValid && backupValid) {
                useBackup = true;
            } else if (mainValid && backupValid) {
                if (backupStamp > mainStamp) {
                    useBackup = true;
                } else if (backupStamp === mainStamp && backupMtime > mainMtime) {
                    // If backup is newer (e.g. app quit between backup write and main write),
                    // prefer backup to avoid losing the latest change.
                    useBackup = true;
                }
            }

            if (!useBackup) {
                return self.normalizeSessionData(mainRes.data);
            }

            var restoredRaw = backupRes.data;
            var restored = self.normalizeSessionData(restoredRaw);
            return self.writeJson(mainPath, restoredRaw).catch(function () {
                return;
            }).then(function () {
                if (!mainValid) new obsidian.Notice(L.backupRestored);
                return restored;
            });
        });
    };

    WorkspacePlusPlus.prototype.migrateLegacySessions = function (sessionData) {
        var self = this;
        var normalized = this.normalizeSessionData(sessionData);
        return this.ensureStorageDir()
            .then(function () {
                return self.writeJsonWithBackup(
                    self.getSessionsPath(),
                    self.getSessionsBackupPath(),
                    normalized
                );
            })
            .then(function () {
                return self.persistGlobalSettings();
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
        var legacyMain = null;
        var hadLegacyInMain = false;

        return this.loadData()
            .catch(function () {
                return null;
            })
            .then(function (saved) {
                loadedMain = saved || {};
                self.globalSettings = Object.assign(
                    {},
                    self.getDefaultSettingsData(),
                    self.extractSettingsData(loadedMain)
                );
                hadLegacyInMain = hasSessionShape(loadedMain);
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
                return self.loadLocalSettingsData().then(function (localSettings) {
                    self.useLocalSettings = !!localSettings;
                    var effectiveSettings = self.isUsingLocalSettings()
                        ? Object.assign({}, self.globalSettings, localSettings)
                        : Object.assign({}, self.globalSettings);
                    var merged = Object.assign({}, self.getDefaultSessionData(), sessionData || {});
                    return Object.assign(merged, effectiveSettings);
                });
            });
    };
}

module.exports = attachPersistenceMethods;
