'use strict';

var obsidian = require('obsidian');
var i18n = require('../i18n.ts');
var ConfirmModal = require('./confirm-modal');

var DAY = 86400000;

// ============================================================
// History Modal
// ============================================================
var HistoryModal = /** @class */ (function (_super) {
    function HistoryModal(app, plugin, session) {
        var _this = _super.call(this, app) || this;
        _this.plugin = plugin;
        _this.session = session;
        return _this;
    }

    HistoryModal.prototype = Object.create(_super.prototype);
    HistoryModal.prototype.constructor = HistoryModal;

    HistoryModal.prototype.onOpen = function () {
        var L = i18n.L;
        var self = this;
        var contentEl = this.contentEl;
        contentEl.empty();
        contentEl.addClass('wpp-modal', 'wpp-history-modal');
        this.titleEl.setText(L.historyTitle + ' — ' + self.session.name);

        var history = self.session.history || [];
        if (history.length === 0) {
            contentEl.createEl('p', { text: L.historyEmpty, cls: 'wpp-history-empty' });
            return;
        }

        var groups = self.groupByDate(history);
        var listEl = contentEl.createDiv({ cls: 'wpp-history-list' });

        for (var gi = 0; gi < groups.length; gi++) {
            var group = groups[gi];
            listEl.createEl('h4', { text: group.label, cls: 'wpp-history-date-label' });

            for (var ei = 0; ei < group.entries.length; ei++) {
                self.renderEntry(listEl, group.entries[ei], group.indices[ei]);
            }
        }
    };

    HistoryModal.prototype.renderEntry = function (listEl, entry, originalIndex) {
        var L = i18n.L;
        var self = this;

        var itemEl = listEl.createDiv({ cls: 'wpp-history-item' });

        // Info section
        var infoEl = itemEl.createDiv({ cls: 'wpp-history-info' });
        var time = new Date(entry.savedAt);
        var timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        infoEl.createDiv({ text: timeStr, cls: 'wpp-history-time' });

        var filePaths = self.plugin.extractFilePathsFromLayout(entry.layout);
        var paneCount = self.plugin.countPanesInLayout(entry.layout);
        var fileNames = filePaths.map(function (p) {
            var parts = p.split('/');
            return parts[parts.length - 1];
        });

        var summary = L.historyPanes(paneCount);
        if (fileNames.length > 0) {
            var displayNames = fileNames.slice(0, 5).join(', ');
            if (fileNames.length > 5) displayNames += ' ...';
            summary += ' · ' + displayNames;
        }
        infoEl.createDiv({ text: summary, cls: 'wpp-history-summary' });

        // Restore button
        var btnEl = itemEl.createEl('button', {
            text: L.historyRestore,
            cls: 'wpp-history-restore-btn',
        });
        btnEl.addEventListener('click', function () {
            var doRestore = function () {
                self.plugin.restoreFromHistoryEntry(
                    self.session.id, originalIndex
                ).then(function (ok) {
                    if (ok) {
                        new obsidian.Notice(L.historyRestored(self.session.name));
                    }
                    self.close();
                });
            };

            if (self.plugin.isVersionHistoryConfirmRestoreEnabled()) {
                new ConfirmModal(
                    self.app,
                    L.historyRestoreConfirm(self.session.name, timeStr),
                    doRestore,
                    { confirmText: L.historyRestore, confirmClass: 'mod-cta' }
                ).open();
            } else {
                doRestore();
            }
        });
    };

    HistoryModal.prototype.groupByDate = function (history) {
        var L = i18n.L;
        var now = new Date();
        var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        var yesterdayStart = todayStart - DAY;
        var weekStart = todayStart - 6 * DAY;

        var groups = {};
        var groupOrder = [];

        for (var i = 0; i < history.length; i++) {
            var entry = history[i];
            var t = entry.savedAt;
            var label;

            if (t >= todayStart) {
                label = L.historyToday;
            } else if (t >= yesterdayStart) {
                label = L.historyYesterday;
            } else if (t >= weekStart) {
                label = L.historyThisWeek;
            } else {
                var d = new Date(t);
                label = d.toLocaleDateString();
            }

            if (!groups[label]) {
                groups[label] = { label: label, entries: [], indices: [] };
                groupOrder.push(label);
            }
            groups[label].entries.push(entry);
            groups[label].indices.push(i);
        }

        return groupOrder.map(function (k) { return groups[k]; });
    };

    HistoryModal.prototype.onClose = function () {
        this.contentEl.empty();
    };

    return HistoryModal;
})(obsidian.Modal);

module.exports = HistoryModal;
