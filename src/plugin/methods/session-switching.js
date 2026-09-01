'use strict';


function attachSessionSwitchingMethods(WorkspacePlusPlus) {

    WorkspacePlusPlus.prototype.clearSessionSwitchNotice = function () {
        return this.getSessionSwitcher().clearSessionSwitchNotice();
    };

    WorkspacePlusPlus.prototype.showSessionSwitchNotice = function (sessionName, options) {
        return this.getSessionSwitcher().showSessionSwitchNotice(sessionName, options);
    };

    WorkspacePlusPlus.prototype.getRelativeSwitchBaseId = function () {
        return this.getSessionSwitcher().getRelativeSwitchBaseId();
    };

    WorkspacePlusPlus.prototype.getRelativeSwitchContext = function (offset) {
        return this.getSessionSwitcher().getRelativeSwitchContext(offset);
    };

    WorkspacePlusPlus.prototype.switchSessionAtOrderedIndex = function (ordered, index, options) {
        return this.getSessionSwitcher().switchSessionAtOrderedIndex(ordered, index, options);
    };

    WorkspacePlusPlus.prototype.switchToIndex = function (index) {
        return this.getSessionSwitcher().switchToIndex(index);
    };

    WorkspacePlusPlus.prototype.switchSessionByIdFromCommand = function (sessionId) {
        return this.getSessionSwitcher().switchSessionByIdFromCommand(sessionId);
    };

    WorkspacePlusPlus.prototype.switchRelativeDirect = function (offset, options) {
        return this.getSessionSwitcher().switchRelativeDirect(offset, options);
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

    WorkspacePlusPlus.prototype.switchRelative = function (offset) {
        return this.getSessionSwitcher().switchRelative(offset);
    };

    WorkspacePlusPlus.prototype.switchRelativeImmediate = function (offset, options) {
        return this.getSessionSwitcher().switchRelativeImmediate(offset, options);
    };

    WorkspacePlusPlus.prototype.hasBlockingSwitchUi = function () {
        return this.getSessionSwitcher().hasBlockingSwitchUi();
    };

    WorkspacePlusPlus.prototype.switchSession = function (targetId, options) {
        return this.getSessionSwitcher().switchSession(targetId, options);
    };

    WorkspacePlusPlus.prototype.performSessionSwitch = function (targetId, options) {
        return this.getSessionSwitcher().performSessionSwitch(targetId, options);
    };
}

module.exports = attachSessionSwitchingMethods;
