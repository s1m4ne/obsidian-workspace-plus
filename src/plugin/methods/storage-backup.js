'use strict';

var obsidian = require('obsidian');
var i18n = require('../../i18n');
var sessionData = require('../session-data');

var getPersistStamp = sessionData.getPersistStamp;
var hasSessionShape = sessionData.hasSessionShape;
var hasNonEmptySessions = sessionData.hasNonEmptySessions;

var BACKUP_ROTATION_INTERVAL = 3600000; // 1 hour

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

function attachStorageBackupMethods(WorkspacePlusPlus) {
    // --- Rotation backup ---

    WorkspacePlusPlus.prototype.getBackupPlatformLabel = function () {
        return getBackupPlatformLabel();
    };

    WorkspacePlusPlus.prototype.prepareRotationBackupData = function (sessionData) {
        var backupData = Object.assign({}, sessionData);
        var platform = this.getBackupPlatformLabel();
        if (platform) backupData._wppBackupPlatform = platform;
        return backupData;
    };

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
}

module.exports = attachStorageBackupMethods;
