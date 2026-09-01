'use strict';


function attachSessionStartupMethods(WorkspacePlusPlus) {

    WorkspacePlusPlus.prototype.setStartupSettleDeadline = function (deadlineMs) {
        return this.getSessionSwitcher().setStartupSettleDeadline(deadlineMs);
    };

    WorkspacePlusPlus.prototype.startStartupSettleWindow = function (durationMs) {
        return this.getSessionSwitcher().startStartupSettleWindow(durationMs);
    };

    WorkspacePlusPlus.prototype.getStartupSettleRemainingMs = function () {
        return this.getSessionSwitcher().getStartupSettleRemainingMs();
    };

    WorkspacePlusPlus.prototype.isStartupSettling = function () {
        return this.getSessionSwitcher().isStartupSettling();
    };

    WorkspacePlusPlus.prototype.noteStartupLayoutChange = function () {
        return this.getSessionSwitcher().noteStartupLayoutChange();
    };

    WorkspacePlusPlus.prototype.scheduleStartupFlush = function () {
        return this.getSessionSwitcher().scheduleStartupFlush();
    };

    WorkspacePlusPlus.prototype.flushOnStartup = function () {
        return this.getSessionSwitcher().flushOnStartup();
    };
}

module.exports = attachSessionStartupMethods;
