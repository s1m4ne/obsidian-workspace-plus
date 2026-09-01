'use strict';


function attachSessionStatusBarMethods(WorkspacePlusPlus) {
    WorkspacePlusPlus.prototype.updateStatusBar = function () {
        return this.getStatusBarController().updateStatusBar();
    };

    Object.defineProperty(WorkspacePlusPlus.prototype, 'statusBarScrollDelta', {
        get: function () {
            return this.getStatusBarController() ? this.getStatusBarController().scrollDelta : 0;
        },
        configurable: true,
    });

    Object.defineProperty(WorkspacePlusPlus.prototype, 'statusBarScrollEventAt', {
        get: function () {
            return this.getStatusBarController() ? this.getStatusBarController().scrollEventAt : 0;
        },
        configurable: true,
    });

    Object.defineProperty(WorkspacePlusPlus.prototype, 'statusBarScrollSwitchAt', {
        get: function () {
            return this.getStatusBarController() ? this.getStatusBarController().scrollSwitchAt : 0;
        },
        configurable: true,
    });
}

module.exports = attachSessionStatusBarMethods;
