'use strict';

var obsidian = require('obsidian');
var i18n = require('../../i18n');

function attachPersistenceMethods(WorkspacePlusPlus) {
    // --- Data persistence ---

    WorkspacePlusPlus.prototype.getBackupPath = function () {
        return this.manifest.dir + '/data.backup.json';
    };

    WorkspacePlusPlus.prototype.persistData = function () {
        var self = this;
        // Write backup before saving main data
        var json = JSON.stringify(this.data);
        return this.app.vault.adapter.write(this.getBackupPath(), json)
            .then(function () {
                return self.saveData(self.data);
            });
    };

    WorkspacePlusPlus.prototype.loadWithBackup = function () {
        var self = this;
        return this.loadData().then(function (saved) {
            var L = i18n.L;
            if (saved && saved.sessions && Object.keys(saved.sessions).length > 0) {
                return saved;
            }
            // Main data is empty or corrupt — try backup
            return self.app.vault.adapter.exists(self.getBackupPath())
                .then(function (exists) {
                    if (!exists) return saved;
                    return self.app.vault.adapter.read(self.getBackupPath())
                        .then(function (raw) {
                            try {
                                var backup = JSON.parse(raw);
                                if (backup && backup.sessions && Object.keys(backup.sessions).length > 0) {
                                    new obsidian.Notice(L.backupRestored);
                                    return backup;
                                }
                            } catch (e) { /* corrupt backup, ignore */ }
                            return saved;
                        });
                });
        });
    };
}

module.exports = attachPersistenceMethods;
