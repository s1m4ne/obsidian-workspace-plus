'use strict';

var obsidian = require('obsidian');
var i18n = require('../../i18n.ts');
var sessionData = require('../session-data');

var hasSessionShape = sessionData.hasSessionShape;
var hasNonEmptySessions = sessionData.hasNonEmptySessions;
var splitSessionHistory = sessionData.splitSessionHistory;

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

function attachStorageTransferMethods(WorkspacePlusPlus) {
    // --- Export / import snapshots ---

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
}

module.exports = attachStorageTransferMethods;
