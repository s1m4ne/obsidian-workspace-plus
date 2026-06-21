'use strict';

var obsidian = require('obsidian');
var i18n = require('../../i18n');
var layoutUtils = require('../../layout-utils');

var HOUR = 3600000;
var DAY = 86400000;
var WEEK = 7 * DAY;
var MAX_HISTORY = 45;

function attachHistoryMethods(WorkspacePlusPlus) {

    // --- Setting accessors ---

    WorkspacePlusPlus.prototype.isVersionHistoryEnabled = function () {
        return !!this.data.versionHistoryEnabled;
    };

    WorkspacePlusPlus.prototype.getVersionHistorySnapshotInterval = function () {
        var val = this.data.versionHistorySnapshotInterval;
        if (typeof val !== 'number' || val < 1) return 5;
        return val;
    };

    WorkspacePlusPlus.prototype.isVersionHistoryCtrlRmbEnabled = function () {
        return this.data.versionHistoryCtrlRmbRestore !== false;
    };

    WorkspacePlusPlus.prototype.isVersionHistoryConfirmRestoreEnabled = function () {
        return this.data.versionHistoryConfirmRestore !== false;
    };

    // --- Extract file paths from a layout object ---

    WorkspacePlusPlus.prototype.extractFilePathsFromLayout = function (layout) {
        var paths = [];
        function walk(node) {
            if (!node || typeof node !== 'object') return;
            if (node.type === 'leaf' && node.state && node.state.state && node.state.state.file) {
                paths.push(node.state.state.file);
            }
            if (Array.isArray(node.children)) {
                for (var i = 0; i < node.children.length; i++) {
                    walk(node.children[i]);
                }
            }
            if (node.main) walk(node.main);
            if (node.left) walk(node.left);
            if (node.right) walk(node.right);
        }
        walk(layout);
        return paths;
    };

    // --- Count panes (leaves) in a layout ---

    WorkspacePlusPlus.prototype.countPanesInLayout = function (layout) {
        var count = 0;
        function walk(node) {
            if (!node || typeof node !== 'object') return;
            if (node.type === 'leaf') { count++; return; }
            if (Array.isArray(node.children)) {
                for (var i = 0; i < node.children.length; i++) {
                    walk(node.children[i]);
                }
            }
            if (node.main) walk(node.main);
        }
        if (layout && layout.main) walk(layout.main);
        return count;
    };

    // --- Tiered compaction (Time Machine style) ---

    WorkspacePlusPlus.prototype.compactHistory = function (history) {
        if (!history || history.length === 0) return [];
        var now = Date.now();

        // Sort newest first
        history.sort(function (a, b) { return b.savedAt - a.savedAt; });

        var result = [];
        var buckets = {};

        for (var i = 0; i < history.length; i++) {
            var entry = history[i];
            var age = now - entry.savedAt;
            var key;

            if (age <= HOUR) {
                // Last 1 hour: keep all
                result.push(entry);
            } else if (age <= DAY) {
                // 1-24 hours: 1 per hour (keep newest in each bucket)
                key = 'h' + Math.floor(age / HOUR);
                if (!buckets[key]) {
                    buckets[key] = true;
                    result.push(entry);
                }
            } else if (age <= WEEK) {
                // 1-7 days: 1 per day
                key = 'd' + Math.floor(age / DAY);
                if (!buckets[key]) {
                    buckets[key] = true;
                    result.push(entry);
                }
            } else if (age <= 30 * DAY) {
                // 7-30 days: 1 per week
                key = 'w' + Math.floor(age / WEEK);
                if (!buckets[key]) {
                    buckets[key] = true;
                    result.push(entry);
                }
            }
            // Older than 30 days: drop
        }

        if (result.length > MAX_HISTORY) result.length = MAX_HISTORY;
        return result;
    };

    // --- Push layout to history (called before any layout overwrite) ---

    WorkspacePlusPlus.prototype.pushLayoutToHistory = function (session) {
        if (!this.isVersionHistoryEnabled()) return;
        if (!session || !session.layout) return;

        if (!session.history) session.history = [];

        // Skip if structurally identical to most recent entry
        var lastEntry = session.history.length > 0 ? session.history[0] : null;
        if (lastEntry && this.layoutsEqualStructural(session.layout, lastEntry.layout)) {
            return;
        }

        session.history.unshift({
            layout: layoutUtils.cloneLayout(session.layout),
            savedAt: Date.now(),
        });

        session.history = this.compactHistory(session.history);
    };

    // --- Restore from a history entry ---

    WorkspacePlusPlus.prototype.restoreFromHistoryEntry = function (sessionId, entryIndex) {
        var session = this.data.sessions[sessionId];
        if (!session || !session.history || !session.history[entryIndex]) {
            return Promise.resolve(false);
        }

        var entry = session.history[entryIndex];

        // Push the CURRENT layout to history first (so it can be recovered)
        this.pushLayoutToHistory(session);

        // Apply the historical layout
        session.layout = layoutUtils.cloneLayout(entry.layout);
        session.modified = Date.now();

        var self = this;
        var isActive = session.id === this.data.activeSessionId;

        // Only change the visible workspace if this is the active session
        var applyLayout = isActive && session.layout
            ? this.app.workspace.changeLayout(session.layout).catch(function () {})
            : Promise.resolve();

        return applyLayout.then(function () {
            self.updateStatusBar();
            return self.persistData();
        }).then(function () {
            return true;
        });
    };

    // --- Quick restore (most recent history entry) ---

    WorkspacePlusPlus.prototype.quickRestoreLatestHistory = function () {
        var L = i18n.L;
        var session = this.getActiveSession();
        if (!session || !session.history || session.history.length === 0) {
            new obsidian.Notice(L.historyNoEntries);
            return Promise.resolve(false);
        }

        var self = this;
        return this.restoreFromHistoryEntry(session.id, 0).then(function (ok) {
            if (ok) {
                new obsidian.Notice(L.historyQuickRestored(session.name));
            }
            return ok;
        });
    };

    WorkspacePlusPlus.prototype.clearVersionHistoryEntries = function () {
        var sessions = (this.data && this.data.sessions) || {};
        var ids = Object.keys(sessions);
        var changed = false;

        for (var i = 0; i < ids.length; i++) {
            var session = sessions[ids[i]];
            if (!session || !Object.prototype.hasOwnProperty.call(session, 'history')) continue;
            delete session.history;
            changed = true;
        }

        return changed;
    };

    // --- Periodic snapshot timer ---

    WorkspacePlusPlus.prototype.startHistorySnapshotTimer = function () {
        this.stopHistorySnapshotTimer();
        if (!this.isVersionHistoryEnabled()) return;
        if (!this.isAutoSaveOnSwitchEnabled()) return;

        var self = this;
        var intervalMs = this.getVersionHistorySnapshotInterval() * 60000;

        this._historySnapshotTimer = setInterval(function () {
            if (!self.isVersionHistoryEnabled() || !self.isAutoSaveOnSwitchEnabled()) {
                self.stopHistorySnapshotTimer();
                return;
            }
            var session = self.getActiveSession();
            if (!session) return;

            var currentLayout = self.getCurrentWorkspaceLayout();
            if (self.layoutsEqualStructural(session.layout, currentLayout)) return;

            // Layout has changed — push old to history, update session
            self.pushLayoutToHistory(session);
            session.layout = currentLayout;
            session.modified = Date.now();
            self.persistData();
        }, intervalMs);
    };

    WorkspacePlusPlus.prototype.stopHistorySnapshotTimer = function () {
        if (this._historySnapshotTimer) {
            clearInterval(this._historySnapshotTimer);
            this._historySnapshotTimer = null;
        }
    };
}

module.exports = attachHistoryMethods;
