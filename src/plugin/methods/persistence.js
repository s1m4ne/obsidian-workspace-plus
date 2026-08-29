'use strict';

var obsidian = require('obsidian');
var i18n = require('../../i18n');
var DEFAULT_DATA = require('../default-data');

var STORAGE_DIR = '.workspace-plus-plus';
var SESSION_STORAGE_VAULT = 'vault-folder';
var SESSION_STORAGE_PLUGIN = 'plugin-folder';
var SESSIONS_FILE_NAME = 'sessions.json';
var PLUGIN_DATA_FILE_NAME = 'data.json';
var SESSIONS_BACKUP_FILE_NAME = 'sessions.backup.json';
var HISTORY_FILE_NAME = 'history.json';
var HISTORY_FORMAT_VERSION = 1;
// Settings used to be splittable into a vault-local file. That is gone; these
// paths exist only to migrate anyone still carrying the old file.
var LEGACY_LOCAL_SETTINGS_FILE = STORAGE_DIR + '/settings.local.json';
var LEGACY_LOCAL_SETTINGS_BACKUP = STORAGE_DIR + '/settings.local.json.migrated';
var EXPORT_DIR_NAME = 'exports';
var BACKUPS_DIR_NAME = 'backups';
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
    'restoreSidebars',
    'highlightUnsavedSessionChanges',
    'statusBarQuickSwitcher',
    'statusBarModScrollSwitch',
    'groupFeatureEnabled',
    'overlayDefaultFocus',
    'searchOverlayPosition',
    'searchOverlaySize',
    'versionHistoryEnabled',
    'versionHistorySnapshotInterval',
    'versionHistoryCtrlRmbRestore',
    'versionHistoryConfirmRestore',
    'statusBarScrollPreset',
    'statusBarScrollModifierMode',
    'statusBarScrollThreshold',
    'statusBarScrollCooldownMs',
    'statusBarScrollResetMs',
    'statusBarScrollInvert',
    'statusBarActions',
    'confirmQuickActions',
    'showFilterInput',
    'showActiveSwitchCommand',
    'numberedSwitchCommands',
];

function joinPath(base, child) {
    return String(base || '').replace(/\/+$/, '') + '/' + child;
}

function normalizeSessionStorageLocation(value) {
    if (value === SESSION_STORAGE_PLUGIN) return SESSION_STORAGE_PLUGIN;
    if (value === SESSION_STORAGE_VAULT) return SESSION_STORAGE_VAULT;
    return null;
}

function readHistoryMap(raw) {
    if (!raw || typeof raw !== 'object') return {};
    // Accept the versioned wrapper, and tolerate a bare map for forward safety.
    var map = (raw.history && typeof raw.history === 'object') ? raw.history : raw;
    var out = {};
    var ids = Object.keys(map);
    for (var i = 0; i < ids.length; i++) {
        var entries = map[ids[i]];
        if (Array.isArray(entries) && entries.length > 0) out[ids[i]] = entries;
    }
    return out;
}

// Split session data into what gets persisted next to the sessions and the
// per-session version history, which is kept in a local-only file.
//
// The input is never mutated: extractSessionData() returns the live
// this.data.sessions object by reference (pickKeys and normalizeSessionData
// both copy shallowly), so deleting history in place would wipe the history
// the UI is still showing.
//
// Sessions that no longer exist are dropped from the history map, which keeps
// entries from leaking after a reset or a sessions import.
function splitSessionHistory(sessionData) {
    var sessions = (sessionData && sessionData.sessions) || {};
    var strippedSessions = {};
    var history = {};
    var ids = Object.keys(sessions);

    for (var i = 0; i < ids.length; i++) {
        var id = ids[i];
        var session = sessions[id];
        if (!session || typeof session !== 'object') continue;

        var copy = {};
        var keys = Object.keys(session);
        for (var k = 0; k < keys.length; k++) {
            if (keys[k] === 'history') continue;
            copy[keys[k]] = session[keys[k]];
        }
        strippedSessions[id] = copy;

        if (Array.isArray(session.history) && session.history.length > 0) {
            history[id] = session.history;
        }
    }

    return {
        data: Object.assign({}, sessionData, { sessions: strippedSessions }),
        history: history,
    };
}

// Attach history entries back onto the in-memory sessions. history.json is the
// canonical source; history still inlined in sessions.json is the pre-split
// format and is only used when the split file has nothing for that session.
function mergeSessionHistory(sessionData, historyMap) {
    var sessions = (sessionData && sessionData.sessions) || {};
    var ids = Object.keys(sessions);

    for (var i = 0; i < ids.length; i++) {
        var session = sessions[ids[i]];
        if (!session || typeof session !== 'object') continue;

        var entries = historyMap && historyMap[ids[i]];
        if (Array.isArray(entries) && entries.length > 0) {
            session.history = entries;
        } else if (!Array.isArray(session.history) || session.history.length === 0) {
            delete session.history;
        }
    }

    return sessionData;
}

function hasInlineSessionHistory(sessionData) {
    var sessions = (sessionData && sessionData.sessions) || {};
    var ids = Object.keys(sessions);
    for (var i = 0; i < ids.length; i++) {
        var session = sessions[ids[i]];
        if (session && Array.isArray(session.history) && session.history.length > 0) return true;
    }
    return false;
}

// The session-shaped part of a stored object, including the save stamp that the
// external-change detection compares.
function pickSessionPayload(data) {
    var out = {};
    if (!data || typeof data !== 'object') return out;
    for (var i = 0; i < SESSION_KEYS.length; i++) {
        var key = SESSION_KEYS[i];
        if (data[key] !== undefined) out[key] = data[key];
    }
    if (typeof data._wppSavedAt === 'number') out._wppSavedAt = data._wppSavedAt;
    return out;
}

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

function getBackupPlatformLabel() {
    var platform = obsidian.Platform || {};
    if (platform.isAndroidApp) return 'Android';
    if (platform.isIosApp) return 'iOS';
    if (platform.isMacOS) return 'macOS';
    if (platform.isWin) return 'Windows';
    if (platform.isLinux) return 'Linux';
    if (platform.isMobileApp || platform.isMobile) return 'Mobile';
    if (platform.isDesktopApp || platform.isDesktop) return 'Desktop';
    return '';
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
        return joinPath(this.getPluginStorageDirPath(), 'data.backup.json');
    };

    WorkspacePlusPlus.prototype.getStorageDirPath = function () {
        return STORAGE_DIR;
    };

    WorkspacePlusPlus.prototype.getPluginStorageDirPath = function () {
        return (this.manifest && this.manifest.dir) || '.obsidian/plugins/workspace-plus-plus';
    };

    WorkspacePlusPlus.prototype.getDefaultSessionStorageLocation = function () {
        return SESSION_STORAGE_PLUGIN;
    };

    WorkspacePlusPlus.prototype.normalizeSessionStorageLocation = function (location) {
        return normalizeSessionStorageLocation(location);
    };

    WorkspacePlusPlus.prototype.getSessionStorageLocation = function () {
        return normalizeSessionStorageLocation(this.data && this.data.sessionStorageLocation)
            || normalizeSessionStorageLocation(this._sessionStorageLocation)
            || this.getDefaultSessionStorageLocation();
    };

    WorkspacePlusPlus.prototype.setRuntimeSessionStorageLocation = function (location) {
        var normalized = normalizeSessionStorageLocation(location) || this.getDefaultSessionStorageLocation();
        this._sessionStorageLocation = normalized;
        if (this.data) this.data.sessionStorageLocation = normalized;
        return normalized;
    };

    WorkspacePlusPlus.prototype.getSessionStorageDirPathForLocation = function (location) {
        var normalized = normalizeSessionStorageLocation(location) || this.getDefaultSessionStorageLocation();
        return normalized === SESSION_STORAGE_PLUGIN
            ? this.getPluginStorageDirPath()
            : this.getStorageDirPath();
    };

    WorkspacePlusPlus.prototype.getSessionStorageDirPath = function () {
        return this.getSessionStorageDirPathForLocation(this.getSessionStorageLocation());
    };

    WorkspacePlusPlus.prototype.isSessionStorageInPluginData = function (location) {
        var normalized = normalizeSessionStorageLocation(location) || this.getSessionStorageLocation();
        return normalized === SESSION_STORAGE_PLUGIN;
    };

    // In plugin-folder mode the sessions live inside data.json, because that is
    // the only file in a plugin folder that Obsidian Sync will carry between
    // devices (it allows manifest.json, main.js, styles.css and data.json, and
    // nothing else). Everything that only needs a path - stat, mtime tracking,
    // diagnostics - keeps working; the writers are what have to be careful, since
    // settings and sessions now share one file.
    WorkspacePlusPlus.prototype.getSessionsPathForLocation = function (location) {
        if (this.isSessionStorageInPluginData(location)) {
            return joinPath(this.getPluginStorageDirPath(), PLUGIN_DATA_FILE_NAME);
        }
        return joinPath(this.getSessionStorageDirPathForLocation(location), SESSIONS_FILE_NAME);
    };

    // Where plugin-folder sessions used to live, before they moved into
    // data.json. Still read so nobody loses sessions on upgrade.
    WorkspacePlusPlus.prototype.getLegacyPluginSessionsPath = function () {
        return joinPath(this.getPluginStorageDirPath(), SESSIONS_FILE_NAME);
    };

    WorkspacePlusPlus.prototype.getSessionsPath = function () {
        return this.getSessionsPathForLocation(this.getSessionStorageLocation());
    };

    WorkspacePlusPlus.prototype.getSessionsBackupPathForLocation = function (location) {
        return joinPath(this.getSessionStorageDirPathForLocation(location), SESSIONS_BACKUP_FILE_NAME);
    };

    WorkspacePlusPlus.prototype.getSessionsBackupPath = function () {
        return this.getSessionsBackupPathForLocation(this.getSessionStorageLocation());
    };

    WorkspacePlusPlus.prototype.getHistoryPathForLocation = function (location) {
        return joinPath(this.getSessionStorageDirPathForLocation(location), HISTORY_FILE_NAME);
    };

    WorkspacePlusPlus.prototype.getHistoryPath = function () {
        return this.getHistoryPathForLocation(this.getSessionStorageLocation());
    };

    WorkspacePlusPlus.prototype.writeSessionHistory = function (historyMap) {
        var payload = {
            version: HISTORY_FORMAT_VERSION,
            history: historyMap || {},
        };
        return this.writeJson(this.getHistoryPath(), payload);
    };

    WorkspacePlusPlus.prototype.readSessionHistory = function () {
        return this.readJsonIfExists(this.getHistoryPath()).then(function (res) {
            if (!res.exists || res.error) return {};
            return readHistoryMap(res.data);
        });
    };

    // Re-attach version history to freshly loaded session data.
    //
    // Sessions saved before the split still carry their history inline. Those
    // entries are kept as-is and written out to history.json right away, so the
    // migration completes on load instead of waiting for the next save.
    WorkspacePlusPlus.prototype.attachSessionHistory = function (sessionData) {
        var self = this;
        if (!sessionData) return Promise.resolve(sessionData);

        var hadInline = hasInlineSessionHistory(sessionData);

        return this.readSessionHistory().then(function (historyMap) {
            mergeSessionHistory(sessionData, historyMap);

            if (!hadInline || Object.keys(historyMap).length > 0) return sessionData;

            var split = splitSessionHistory(sessionData);
            if (Object.keys(split.history).length === 0) return sessionData;

            return self.ensureSessionStorageDir()
                .then(function () {
                    return self.writeSessionHistory(split.history);
                })
                .catch(function () {
                    // Migration is best-effort: the inline copy is still intact.
                    return;
                })
                .then(function () {
                    return sessionData;
                });
        }).catch(function () {
            return sessionData;
        });
    };

    WorkspacePlusPlus.prototype.getExportDirPath = function () {
        return joinPath(this.getSessionStorageDirPath(), EXPORT_DIR_NAME);
    };

    WorkspacePlusPlus.prototype.getBackupsDirPath = function () {
        return joinPath(this.getSessionStorageDirPath(), BACKUPS_DIR_NAME);
    };

    WorkspacePlusPlus.prototype.getRotationBackupPath = function (generation) {
        return this.getBackupsDirPath() + '/sessions.' + generation + '.json';
    };

    WorkspacePlusPlus.prototype.getRotationBackupPathForLocation = function (location, generation) {
        return joinPath(this.getSessionStorageDirPathForLocation(location), BACKUPS_DIR_NAME) + '/sessions.' + generation + '.json';
    };

    WorkspacePlusPlus.prototype.getSessionBackupFilePathsForLocation = function (location) {
        return [
            this.getSessionsBackupPathForLocation(location),
            this.getRotationBackupPathForLocation(location, 1),
            this.getRotationBackupPathForLocation(location, 2),
            this.getRotationBackupPathForLocation(location, 3),
            // history.json is not a backup, but it is recovery-only data that the
            // reset flows are expected to clear alongside the backups.
            this.getHistoryPathForLocation(location),
        ];
    };

    WorkspacePlusPlus.prototype.getBackupFilePaths = function () {
        return [
            this.getBackupPath(),
        ]
            .concat(this.getSessionBackupFilePathsForLocation(SESSION_STORAGE_VAULT))
            .concat(this.getSessionBackupFilePathsForLocation(SESSION_STORAGE_PLUGIN));
    };

    WorkspacePlusPlus.prototype.getBackupPlatformLabel = function () {
        return getBackupPlatformLabel();
    };

    WorkspacePlusPlus.prototype.prepareRotationBackupData = function (sessionData) {
        var backupData = Object.assign({}, sessionData);
        var platform = this.getBackupPlatformLabel();
        if (platform) backupData._wppBackupPlatform = platform;
        return backupData;
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

    WorkspacePlusPlus.prototype.ensureSessionStorageDir = function () {
        return this.ensureDir(this.getSessionStorageDirPath());
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

    WorkspacePlusPlus.prototype.renameIfExists = function (fromPath, toPath) {
        var self = this;
        return this.app.vault.adapter.exists(fromPath).then(function (exists) {
            if (!exists) return;
            return self.app.vault.adapter.rename(fromPath, toPath).catch(function () {
                return;
            });
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

    WorkspacePlusPlus.prototype.resolveSessionStorageLocation = function (settingsData) {
        var explicit = normalizeSessionStorageLocation(settingsData && settingsData.sessionStorageLocation);
        if (explicit) {
            this.setRuntimeSessionStorageLocation(explicit);
            return Promise.resolve(explicit);
        }

        var self = this;
        return Promise.all([
            this.app.vault.adapter.exists(this.getSessionsPathForLocation(SESSION_STORAGE_VAULT)),
            this.app.vault.adapter.exists(this.getSessionsBackupPathForLocation(SESSION_STORAGE_VAULT)),
            this.app.vault.adapter.exists(this.getSessionsPathForLocation(SESSION_STORAGE_PLUGIN)),
            this.app.vault.adapter.exists(this.getSessionsBackupPathForLocation(SESSION_STORAGE_PLUGIN)),
        ]).then(function (exists) {
            var location;
            if (exists[0] || exists[1]) {
                location = SESSION_STORAGE_VAULT;
            } else if (exists[2] || exists[3]) {
                location = SESSION_STORAGE_PLUGIN;
            } else {
                location = self.getDefaultSessionStorageLocation();
            }
            self.setRuntimeSessionStorageLocation(location);
            return location;
        }).catch(function () {
            var fallback = self.getDefaultSessionStorageLocation();
            self.setRuntimeSessionStorageLocation(fallback);
            return fallback;
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
        var self = this;
        this.applyDefaultSettingsToCurrentScope();
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
            sessionStorageLocation: this.getSessionStorageLocation(),
            syncedByObsidianSync: this.isSessionStorageInPluginData(),
            sessionsPath: this.getSessionsPath(),
            sessionsBackupPath: this.getSessionsBackupPath(),
            historyPath: this.getHistoryPath(),
            globalSettingsPath: joinPath(this.getPluginStorageDirPath(), PLUGIN_DATA_FILE_NAME),
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

    WorkspacePlusPlus.prototype.exportSessionsSnapshot = function () {
        var self = this;
        var L = i18n.L;
        var stamp = formatExportStamp(Date.now());
        var filePath = this.getExportDirPath() + '/sessions-' + stamp + '.json';
        var payload = {
            exportedAt: Date.now(),
            source: this.manifest.id,
            // History is device-specific layout data; exports are meant to move
            // sessions to another vault or device, so it is left behind.
            data: splitSessionHistory(this.extractSessionData(this.data)).data,
        };

        return this.ensureSessionStorageDir()
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
                return self.writeJson(
                    self.getRotationBackupPath(1),
                    self.prepareRotationBackupData(sessionData)
                );
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
                    var platform = typeof res.data._wppBackupPlatform === 'string'
                        ? res.data._wppBackupPlatform
                        : '';
                    return {
                        generation: n,
                        savedAt: stamp,
                        sessionCount: count,
                        backupPlatform: platform,
                    };
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
                        return self.applyWorkspaceLayout(active.layout, { catchErrors: false }).then(function () {
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
