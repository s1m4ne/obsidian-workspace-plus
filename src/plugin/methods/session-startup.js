'use strict';


function attachSessionStartupMethods(WorkspacePlusPlus) {



    WorkspacePlusPlus.prototype.getStartupSettleRemainingMs = function () {
        return this.getSessionSwitcher().getStartupSettleRemainingMs();
    };



    WorkspacePlusPlus.prototype.scheduleStartupFlush = function () {
        return this.getSessionSwitcher().scheduleStartupFlush();
    };

    WorkspacePlusPlus.prototype.flushOnStartup = function () {
        return this.getSessionSwitcher().flushOnStartup();
    };
}

module.exports = attachSessionStartupMethods;
