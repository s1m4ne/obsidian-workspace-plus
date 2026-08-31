'use strict';

var statusBarController = require('../../statusbar-controller.ts');

function attachSessionStatusBarMethods(WorkspacePlusPlus) {
    if (!WorkspacePlusPlus.prototype.getStatusBarController) {
        WorkspacePlusPlus.prototype.getStatusBarController = function () {
            if (!this._statusBarController) {
                this._statusBarController = new statusBarController.StatusBarController(this);
            }
            return this._statusBarController;
        };
    }

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
