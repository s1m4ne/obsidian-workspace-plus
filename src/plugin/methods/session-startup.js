'use strict';

var STARTUP_SETTLE_MS = 1200;
var STARTUP_LAYOUT_CHANGE_SETTLE_MS = 400;
var STARTUP_SETTLE_MAX_MS = 5000;

function attachSessionStartupMethods(WorkspacePlusPlus) {
    WorkspacePlusPlus.prototype.setStartupSettleDeadline = function (deadlineMs) {
        var self = this;
        var nextDeadline = typeof deadlineMs === 'number' ? deadlineMs : 0;

        if (this.startupSettleTimer) {
            clearTimeout(this.startupSettleTimer);
            this.startupSettleTimer = null;
        }

        if (nextDeadline <= Date.now()) {
            this.startupSettleStartedAt = 0;
            this.startupSettleUntil = 0;
            return 0;
        }

        this.startupSettleUntil = nextDeadline;
        this.startupSettleTimer = setTimeout(function () {
            self.startupSettleStartedAt = 0;
            self.startupSettleUntil = 0;
            self.startupSettleTimer = null;
        }, nextDeadline - Date.now());
        return this.startupSettleUntil;
    };

    WorkspacePlusPlus.prototype.startStartupSettleWindow = function (durationMs) {
        var startedAt = Date.now();
        var duration = typeof durationMs === 'number' && durationMs > 0
            ? durationMs
            : STARTUP_SETTLE_MS;

        this.startupSettleStartedAt = startedAt;
        return this.setStartupSettleDeadline(startedAt + duration);
    };

    WorkspacePlusPlus.prototype.getStartupSettleRemainingMs = function () {
        var remaining = (this.startupSettleUntil || 0) - Date.now();
        return remaining > 0 ? remaining : 0;
    };

    WorkspacePlusPlus.prototype.isStartupSettling = function () {
        return this.getStartupSettleRemainingMs() > 0;
    };

    WorkspacePlusPlus.prototype.noteStartupLayoutChange = function () {
        if (!this.isStartupSettling()) return;

        var startedAt = this.startupSettleStartedAt || Date.now();
        var maxDeadline = startedAt + STARTUP_SETTLE_MAX_MS;
        var nextDeadline = Math.min(maxDeadline, Date.now() + STARTUP_LAYOUT_CHANGE_SETTLE_MS);

        if (nextDeadline <= (this.startupSettleUntil || 0)) return;
        this.setStartupSettleDeadline(nextDeadline);
        this.scheduleStartupFlush();
    };

    WorkspacePlusPlus.prototype.scheduleStartupFlush = function () {
        var self = this;

        if (this.startupFlushTimer) {
            clearTimeout(this.startupFlushTimer);
            this.startupFlushTimer = null;
        }

        if (!this.isAutoSaveOnSwitchEnabled()) return Promise.resolve(false);

        var delayMs = this.getStartupSettleRemainingMs();
        if (delayMs <= 0) {
            return Promise.resolve(this.flushOnStartup());
        }

        return new Promise(function (resolve) {
            self.startupFlushTimer = setTimeout(function () {
                self.startupFlushTimer = null;
                resolve(self.flushOnStartup());
            }, delayMs);
        });
    };

    WorkspacePlusPlus.prototype.flushOnStartup = function () {
        if (!this.isAutoSaveOnSwitchEnabled()) return;

        var session = this.getActiveSession();
        if (!session) return;

        this.pushLayoutToHistory(session);
        session.layout = this.getCurrentWorkspaceLayout();
        session.modified = Date.now();
        return this.persistData();
    };
}

module.exports = attachSessionStartupMethods;
