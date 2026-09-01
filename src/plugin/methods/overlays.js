'use strict';


function attachOverlayMethods(WorkspacePlusPlus) {
    WorkspacePlusPlus.prototype.filterSessionsByQuery = function (sessions, query) {
        return this.getSearchOverlay().filterSessionsByQuery(sessions, query);
    };

    WorkspacePlusPlus.prototype.openSearchOverlay = function (anchorEl) {
        return this.getSearchOverlay().open(anchorEl);
    };

    // Session sync invokes this legacy hook until commit 27 replaces the
    // reverse dependency with a subscription.

    Object.defineProperty(WorkspacePlusPlus.prototype, 'switchOverlayEl', {
        get: function () {
            return this.getSwitchOverlay().overlayEl;
        },
        set: function (val) {
            this.getSwitchOverlay().overlayEl = val;
        },
        configurable: true,
        enumerable: true,
    });

    Object.defineProperty(WorkspacePlusPlus.prototype, 'switchOverlayViewGroupId', {
        get: function () {
            return this.getSwitchOverlay().viewGroupId;
        },
        set: function (val) {
            this.getSwitchOverlay().viewGroupId = val;
        },
        configurable: true,
        enumerable: true,
    });

    Object.defineProperty(WorkspacePlusPlus.prototype, 'switchOverlayTimer', {
        get: function () {
            return this.getSwitchOverlay().timer;
        },
        set: function (val) {
            this.getSwitchOverlay().timer = val;
        },
        configurable: true,
        enumerable: true,
    });

    Object.defineProperty(WorkspacePlusPlus.prototype, 'overlayKeyUpHandler', {
        get: function () {
            return this.getSwitchOverlay().keyUpHandler;
        },
        set: function (val) {
            this.getSwitchOverlay().keyUpHandler = val;
        },
        configurable: true,
        enumerable: true,
    });

    Object.defineProperty(WorkspacePlusPlus.prototype, 'overlayKeyDownHandler', {
        get: function () {
            return this.getSwitchOverlay().keyDownHandler;
        },
        set: function (val) {
            this.getSwitchOverlay().keyDownHandler = val;
        },
        configurable: true,
        enumerable: true,
    });

    Object.defineProperty(WorkspacePlusPlus.prototype, 'overlayBlurHandler', {
        get: function () {
            return this.getSwitchOverlay().blurHandler;
        },
        set: function (val) {
            this.getSwitchOverlay().blurHandler = val;
        },
        configurable: true,
        enumerable: true,
    });

    WorkspacePlusPlus.prototype.showSwitchPreviewOverlay = function (ordered, activeIndex, viewGroupId) {
        return this.getSwitchOverlay().showPreview(ordered, activeIndex, viewGroupId);
    };

    WorkspacePlusPlus.prototype.showSwitchFeedbackOverlay = function (ordered, activeIndex, viewGroupId, options) {
        return this.getSwitchOverlay().showFeedback(ordered, activeIndex, viewGroupId, options);
    };

    WorkspacePlusPlus.prototype.showSwitchOverlay = function (ordered, activeIndex, viewGroupId, options) {
        return this.getSwitchOverlay().show(ordered, activeIndex, viewGroupId, options);
    };

    WorkspacePlusPlus.prototype.cleanupOverlayListeners = function () {
        return this.getSwitchOverlay().cleanupListeners();
    };

    WorkspacePlusPlus.prototype.hideSwitchOverlay = function () {
        return this.getSwitchOverlay().hide();
    };

    WorkspacePlusPlus.prototype.hideSearchOverlay = function () {
        return this.getSearchOverlay().hide();
    };
}

module.exports = attachOverlayMethods;
