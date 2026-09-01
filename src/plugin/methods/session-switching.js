'use strict';


function attachSessionSwitchingMethods(WorkspacePlusPlus) {

    WorkspacePlusPlus.prototype.clearSessionSwitchNotice = function () {
        return this.getSessionSwitcher().clearSessionSwitchNotice();
    };

    WorkspacePlusPlus.prototype.showSessionSwitchNotice = function (sessionName, options) {
        return this.getSessionSwitcher().showSessionSwitchNotice(sessionName, options);
    };




    WorkspacePlusPlus.prototype.switchToIndex = function (index) {
        return this.getSessionSwitcher().switchToIndex(index);
    };

    WorkspacePlusPlus.prototype.switchSessionByIdFromCommand = function (sessionId) {
        return this.getSessionSwitcher().switchSessionByIdFromCommand(sessionId);
    };


    WorkspacePlusPlus.prototype.switchRelativeFromCommand = function (offset) {
        return this.getSessionSwitcher().switchRelativeFromCommand(offset);
    };

    WorkspacePlusPlus.prototype.switchRelativeFromStatusBar = function (offset) {
        return this.getSessionSwitcher().switchRelativeFromStatusBar(offset);
    };

    WorkspacePlusPlus.prototype.switchRelativeFromScroll = function (offset) {
        return this.getSessionSwitcher().switchRelativeFromScroll(offset);
    };




    WorkspacePlusPlus.prototype.switchSession = function (targetId, options) {
        return this.getSessionSwitcher().switchSession(targetId, options);
    };

    WorkspacePlusPlus.prototype.performSessionSwitch = function (targetId, options) {
        return this.getSessionSwitcher().performSessionSwitch(targetId, options);
    };
}

module.exports = attachSessionSwitchingMethods;
