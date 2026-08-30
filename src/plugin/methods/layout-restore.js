'use strict';

var layoutUtils = require('../../layout-utils.ts');

function attachLayoutRestoreMethods(WorkspacePlusPlus) {
    WorkspacePlusPlus.prototype.isSidebarRestoreEnabled = function () {
        return this.data.restoreSidebars !== false;
    };

    WorkspacePlusPlus.prototype.getWorkspaceRestoreScope = function () {
        return this.isSidebarRestoreEnabled() ? 'full' : 'main-only';
    };

    WorkspacePlusPlus.prototype.buildLayoutForRestore = function (layout) {
        if (!layout) return layout;
        if (this.isSidebarRestoreEnabled()) {
            return layoutUtils.cloneLayout(layout);
        }

        var currentLayout = null;
        try {
            currentLayout = this.getCurrentWorkspaceLayout();
        } catch (e) {
            currentLayout = null;
        }
        return layoutUtils.mergeMainLayoutIntoCurrent(layout, currentLayout);
    };

    WorkspacePlusPlus.prototype.applyWorkspaceLayout = function (layout, options) {
        options = options || {};
        if (!layout) return Promise.resolve();
        var nextLayout = this.buildLayoutForRestore(layout);
        var apply = Promise.resolve(this.app.workspace.changeLayout(nextLayout));
        if (options.catchErrors === false) return apply;
        return apply.catch(function () {});
    };
}

module.exports = attachLayoutRestoreMethods;
