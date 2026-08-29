'use strict';

var EXTERNAL_SESSION_RELOAD_DEBOUNCE_MS = 500;
var SESSION_FILE_MTIME_EPSILON_MS = 25;
var STARTUP_SESSION_RECHECK_DELAYS = [3000, 10000];

function getPersistStamp(data) {
    if (!data || typeof data !== 'object') return 0;
    var stamp = data._wppSavedAt;
    if (typeof stamp !== 'number' || !isFinite(stamp)) return 0;
    return stamp;
}

function cloneJson(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
}

function isSessionDataShape(data) {
    return !!(
        data
        && typeof data === 'object'
        && (data.sessions !== undefined || data.sessionOrder !== undefined || data.activeSessionId !== undefined)
    );
}

function getSessionModified(session) {
    if (!session || typeof session.modified !== 'number' || !isFinite(session.modified)) return 0;
    return session.modified;
}

function mergeOrder(primary, secondary, validMap) {
    var out = [];
    var seen = {};

    function add(id) {
        if (!id || seen[id]) return;
        if (validMap && !validMap[id]) return;
        seen[id] = true;
        out.push(id);
    }

    var i;
    primary = Array.isArray(primary) ? primary : [];
    secondary = Array.isArray(secondary) ? secondary : [];

    for (i = 0; i < primary.length; i++) add(primary[i]);
    for (i = 0; i < secondary.length; i++) add(secondary[i]);

    if (validMap) {
        var keys = Object.keys(validMap);
        for (i = 0; i < keys.length; i++) add(keys[i]);
    }

    return out;
}

function mergeObjectWithLocalDeletes(externalObj, localObj, baselineObj) {
    externalObj = externalObj || {};
    localObj = localObj || {};
    baselineObj = baselineObj || {};

    var out = {};
    var id;
    var externalKeys = Object.keys(externalObj);
    for (var i = 0; i < externalKeys.length; i++) {
        id = externalKeys[i];
        if (baselineObj[id] && !localObj[id]) continue;
        out[id] = cloneJson(externalObj[id]);
    }

    var localKeys = Object.keys(localObj);
    for (i = 0; i < localKeys.length; i++) {
        id = localKeys[i];
        out[id] = cloneJson(localObj[id]);
    }

    return out;
}

function attachSessionSyncMethods(WorkspacePlusPlus) {
    WorkspacePlusPlus.prototype.getComparableSessionData = function (data) {
        var normalized = this.normalizeSessionData(data || {});
        return {
            sessions: normalized.sessions || {},
            sessionOrder: normalized.sessionOrder || [],
            groups: normalized.groups || {},
            groupOrder: normalized.groupOrder || [],
            sessionGroups: normalized.sessionGroups || {},
        };
    };

    WorkspacePlusPlus.prototype.getComparableSessionDataJson = function (data) {
        return JSON.stringify(this.getComparableSessionData(data));
    };

    WorkspacePlusPlus.prototype.recordSessionStorageState = function (stamp, mtime, data) {
        this._sessionStorageStamp = typeof stamp === 'number' && isFinite(stamp) ? stamp : 0;
        this._sessionStorageMtime = typeof mtime === 'number' && isFinite(mtime) ? mtime : 0;

        if (data) {
            var comparable = this.getComparableSessionData(data);
            this._sessionStorageComparableData = cloneJson(comparable);
            this._sessionStorageDataJson = JSON.stringify(comparable);
        }
    };

    WorkspacePlusPlus.prototype.recordSessionDataStored = function (sessionData) {
        var self = this;
        var stamp = getPersistStamp(sessionData);
        this.recordSessionStorageState(stamp, Date.now(), sessionData);

        return this.getFileMtime(this.getSessionsPath()).then(function (mtime) {
            self.recordSessionStorageState(stamp, mtime || self._sessionStorageMtime || 0, sessionData);
            return true;
        }).catch(function () {
            return true;
        });
    };

    WorkspacePlusPlus.prototype.getSessionStorageInfo = function () {
        var self = this;
        var path = this.getSessionsPath();
        return Promise.all([
            this.readJsonIfExists(path),
            this.getFileMtime(path),
        ]).then(function (parts) {
            var res = parts[0];
            var mtime = parts[1] || 0;
            var valid = !!(res.exists && !res.error && isSessionDataShape(res.data));
            return {
                exists: !!res.exists,
                valid: valid,
                data: valid ? res.data : null,
                stamp: valid ? getPersistStamp(res.data) : 0,
                mtime: mtime,
                path: path,
                plugin: self,
            };
        });
    };

    WorkspacePlusPlus.prototype.isSessionStorageInfoNewer = function (info) {
        if (!info || !info.valid) return false;

        var currentStamp = this._sessionStorageStamp || 0;
        var currentMtime = this._sessionStorageMtime || 0;
        var nextStamp = info.stamp || 0;
        var nextMtime = info.mtime || 0;

        if (nextStamp && currentStamp) {
            if (nextStamp > currentStamp) return true;
            if (nextStamp < currentStamp) return false;
        } else if (nextStamp && !currentStamp) {
            return true;
        }

        return nextMtime > currentMtime + SESSION_FILE_MTIME_EPSILON_MS;
    };

    WorkspacePlusPlus.prototype.hasLocalSessionChangesSinceStorage = function () {
        if (!this._sessionStorageDataJson) return false;
        return this.getComparableSessionDataJson(this.data || {}) !== this._sessionStorageDataJson;
    };

    WorkspacePlusPlus.prototype.mergeExternalSessionDataForWrite = function (externalData) {
        var local = this.extractSessionData(this.data || {});
        var external = this.normalizeSessionData(externalData || {});
        var baseline = this._sessionStorageComparableData || {};
        var baselineSessions = baseline.sessions || {};
        var localSessions = local.sessions || {};
        var externalSessions = external.sessions || {};
        var mergedSessions = {};
        var id;

        var externalIds = Object.keys(externalSessions);
        for (var i = 0; i < externalIds.length; i++) {
            id = externalIds[i];
            if (
                baselineSessions[id]
                && !localSessions[id]
                && getSessionModified(externalSessions[id]) <= getSessionModified(baselineSessions[id])
            ) {
                continue;
            }
            mergedSessions[id] = cloneJson(externalSessions[id]);
        }

        var localIds = Object.keys(localSessions);
        for (i = 0; i < localIds.length; i++) {
            id = localIds[i];
            if (!mergedSessions[id]) {
                mergedSessions[id] = cloneJson(localSessions[id]);
                continue;
            }
            if (getSessionModified(localSessions[id]) >= getSessionModified(mergedSessions[id])) {
                mergedSessions[id] = cloneJson(localSessions[id]);
            }
        }

        var groups = mergeObjectWithLocalDeletes(
            external.groups || {},
            local.groups || {},
            baseline.groups || {}
        );
        var sessionGroups = mergeObjectWithLocalDeletes(
            external.sessionGroups || {},
            local.sessionGroups || {},
            baseline.sessionGroups || {}
        );

        return this.normalizeSessionData({
            activeSessionId: local.activeSessionId || external.activeSessionId,
            sessions: mergedSessions,
            sessionOrder: mergeOrder(external.sessionOrder, local.sessionOrder, mergedSessions),
            groups: groups,
            groupOrder: mergeOrder(external.groupOrder, local.groupOrder, groups),
            sessionGroups: sessionGroups,
            activeGroupId: local.activeGroupId || external.activeGroupId,
        });
    };

    WorkspacePlusPlus.prototype.applySessionDataFromStorage = function (sessionData, options) {
        options = options || {};
        if (!sessionData) return false;

        var localActiveSessionId = this.data && this.data.activeSessionId;
        var localActiveGroupId = this.data && this.data.activeGroupId;
        var next = options.mergeLocal
            ? this.mergeExternalSessionDataForWrite(sessionData)
            : this.normalizeSessionData(sessionData);

        this.data.sessions = next.sessions || {};
        this.data.sessionOrder = next.sessionOrder || [];
        this.data.groups = next.groups || {};
        this.data.groupOrder = next.groupOrder || [];
        this.data.sessionGroups = next.sessionGroups || {};

        if (localActiveSessionId && this.data.sessions[localActiveSessionId]) {
            this.data.activeSessionId = localActiveSessionId;
        } else if (next.activeSessionId && this.data.sessions[next.activeSessionId]) {
            this.data.activeSessionId = next.activeSessionId;
        } else {
            this.data.activeSessionId = this.data.sessionOrder[0] || Object.keys(this.data.sessions)[0] || null;
        }

        if (localActiveGroupId && this.data.groups[localActiveGroupId]) {
            this.data.activeGroupId = localActiveGroupId;
        } else if (next.activeGroupId && this.data.groups[next.activeGroupId]) {
            this.data.activeGroupId = next.activeGroupId;
        } else {
            this.data.activeGroupId = null;
        }

        this.syncSessionOrder();
        this.normalizeGroupFeatureState();
        this.updateStatusBar();
        this.syncSessionCommands();
        if (typeof this._refreshOverlaySessions === 'function') {
            this._refreshOverlaySessions();
        }
        return true;
    };

    WorkspacePlusPlus.prototype.reloadExternalSessionStorageIfChanged = function (options) {
        var self = this;
        options = options || {};
        return this.getSessionStorageInfo().then(function (info) {
            if (!options.force && !self.isSessionStorageInfoNewer(info)) {
                return false;
            }

            var mergeLocal = !!options.mergeLocal && self.hasLocalSessionChangesSinceStorage();
            var previousComparable = self._sessionStorageComparableData
                ? cloneJson(self._sessionStorageComparableData)
                : null;
            var previousComparableJson = self._sessionStorageDataJson || '';
            return self.loadSessionDataFromStorage().then(function (sessionData) {
                if (!sessionData) return false;
                var externalComparable = self._sessionStorageComparableData
                    ? cloneJson(self._sessionStorageComparableData)
                    : null;
                var externalComparableJson = self._sessionStorageDataJson || '';

                if (mergeLocal && previousComparable) {
                    self._sessionStorageComparableData = previousComparable;
                    self._sessionStorageDataJson = previousComparableJson;
                }

                var applied = self.applySessionDataFromStorage(sessionData, {
                    mergeLocal: mergeLocal,
                });

                if (mergeLocal && externalComparable) {
                    self._sessionStorageComparableData = externalComparable;
                    self._sessionStorageDataJson = externalComparableJson;
                }

                return applied;
            });
        }).catch(function () {
            return false;
        });
    };

    WorkspacePlusPlus.prototype.scheduleExternalSessionStorageReload = function () {
        var self = this;
        if (this._externalSessionReloadTimer) {
            clearTimeout(this._externalSessionReloadTimer);
        }

        this._externalSessionReloadTimer = setTimeout(function () {
            self._externalSessionReloadTimer = null;
            self.reloadExternalSessionStorageIfChanged({ mergeLocal: false });
        }, EXTERNAL_SESSION_RELOAD_DEBOUNCE_MS);
    };

    WorkspacePlusPlus.prototype.registerSessionStorageListeners = function () {
        var self = this;
        if (this._sessionStorageListenersRegistered) return;
        this._sessionStorageListenersRegistered = true;
        this._startupSessionStorageTimers = [];

        // No vault events here: vault.on('modify'/'create') only fire for files in
        // the vault index, and both storage locations live under a dot-folder that
        // the index skips. Those listeners never fired once. Sessions in data.json
        // are covered by onExternalSettingsChange() instead; vault-folder installs
        // rely on the focus and startup checks below.
        if (typeof this.registerDomEvent === 'function' && typeof window !== 'undefined') {
            this.registerDomEvent(window, 'focus', function () {
                self.scheduleExternalSessionStorageReload();
            });
        }
    };

    // Obsidian calls this when data.json changes on disk behind its back, which is
    // exactly what a sync service does when it brings another device's sessions
    // over. Our own saveData() does not trigger it, and if it ever did the staleness
    // check in reloadExternalSessionStorageIfChanged() makes the reload a no-op.
    WorkspacePlusPlus.prototype.onExternalSettingsChange = function () {
        if (!this.data) return;
        this.scheduleExternalSessionStorageReload();
    };

    WorkspacePlusPlus.prototype.scheduleStartupSessionStorageChecks = function () {
        var self = this;
        if (!this._startupSessionStorageTimers) this._startupSessionStorageTimers = [];

        for (var i = 0; i < STARTUP_SESSION_RECHECK_DELAYS.length; i++) {
            (function (delayMs) {
                var timer = setTimeout(function () {
                    var idx = self._startupSessionStorageTimers.indexOf(timer);
                    if (idx !== -1) self._startupSessionStorageTimers.splice(idx, 1);
                    self.reloadExternalSessionStorageIfChanged({ mergeLocal: false });
                }, delayMs);
                self._startupSessionStorageTimers.push(timer);
            })(STARTUP_SESSION_RECHECK_DELAYS[i]);
        }
    };

    WorkspacePlusPlus.prototype.clearSessionStorageSyncTimers = function () {
        if (this._externalSessionReloadTimer) {
            clearTimeout(this._externalSessionReloadTimer);
            this._externalSessionReloadTimer = null;
        }

        var timers = this._startupSessionStorageTimers || [];
        for (var i = 0; i < timers.length; i++) {
            clearTimeout(timers[i]);
        }
        this._startupSessionStorageTimers = [];
    };
}

module.exports = attachSessionSyncMethods;
