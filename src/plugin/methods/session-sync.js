'use strict';

var sessionData = require('../session-data');
var sessionSync = require('../../storage/session-sync.ts');
var syncWatcher = require('../../storage/sync-watcher.ts');

var getPersistStamp = sessionData.getPersistStamp;
var isSessionDataShape = sessionData.hasSessionShape;

var cloneJson = sessionSync.cloneJson;

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
        var currentStamp = this._sessionStorageStamp || 0;
        var currentMtime = this._sessionStorageMtime || 0;
        return sessionSync.isSessionStorageInfoNewer(info, currentStamp, currentMtime);
    };

    WorkspacePlusPlus.prototype.hasLocalSessionChangesSinceStorage = function () {
        if (!this._sessionStorageDataJson) return false;
        return this.getComparableSessionDataJson(this.data || {}) !== this._sessionStorageDataJson;
    };

    WorkspacePlusPlus.prototype.mergeExternalSessionDataForWrite = function (externalData) {
        var self = this;
        var local = this.extractSessionData(this.data || {});
        return sessionSync.mergeExternalSessionDataForWrite(
            local,
            externalData,
            this._sessionStorageComparableData,
            function (d) { return self.normalizeSessionData(d); }
        );
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

    WorkspacePlusPlus.prototype.getSyncWatcher = function () {
        var self = this;
        if (!this._syncWatcher) {
            this._syncWatcher = new syncWatcher.SyncWatcher({
                onReload: function () {
                    return self.reloadExternalSessionStorageIfChanged({ mergeLocal: false });
                },
                registerDomEvent: typeof this.registerDomEvent === 'function'
                    ? function (target, event, handler) { self.registerDomEvent(target, event, handler); }
                    : undefined,
            });
        }
        return this._syncWatcher;
    };

    WorkspacePlusPlus.prototype.scheduleExternalSessionStorageReload = function (debounceMs) {
        this.getSyncWatcher().scheduleReload(debounceMs);
    };

    WorkspacePlusPlus.prototype.registerSessionStorageListeners = function () {
        this.getSyncWatcher().registerListeners();
    };

    WorkspacePlusPlus.prototype.onExternalSettingsChange = function () {
        if (!this.data) return;
        this.scheduleExternalSessionStorageReload();
    };

    WorkspacePlusPlus.prototype.scheduleStartupSessionStorageChecks = function () {
        this.getSyncWatcher().scheduleStartupChecks();
    };

    WorkspacePlusPlus.prototype.clearSessionStorageSyncTimers = function () {
        if (this._syncWatcher) {
            this._syncWatcher.clearTimers();
        }
    };
}

module.exports = attachSessionSyncMethods;
