'use strict';

var attachSessionSwitcherGetter = require('./session-switcher-getter');

function attachLayoutRestoreMethods(WorkspacePlusPlus) {
    attachSessionSwitcherGetter(WorkspacePlusPlus);

    WorkspacePlusPlus.prototype.isSidebarRestoreEnabled = function () {
        return this.getSessionSwitcher().isSidebarRestoreEnabled();
    };

    WorkspacePlusPlus.prototype.getWorkspaceRestoreScope = function () {
        return this.getSessionSwitcher().getWorkspaceRestoreScope();
    };

    WorkspacePlusPlus.prototype.buildLayoutForRestore = function (layout) {
        return this.getSessionSwitcher().buildLayoutForRestore(layout);
    };

    WorkspacePlusPlus.prototype.applyWorkspaceLayout = function (layout, options) {
        return this.getSessionSwitcher().applyWorkspaceLayout(layout, options);
    };
}

module.exports = attachLayoutRestoreMethods;
