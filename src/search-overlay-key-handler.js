'use strict';

var obsidian = require('obsidian');
var i18n = require('./i18n.ts');
var ConfirmModal = require('./modals/confirm-modal.ts').ConfirmModal;
var navigationUtils = require('./navigation-utils.ts');
var utils = require('./utils.ts');

function hasBlockingModal() {
    return !!document.querySelector('.modal-container');
}

function syncSearchOverlaySelectedIndex(plugin, filtered, currentIndex, options) {
    options = options || {};
    if (!filtered || filtered.length === 0) {
        return -1;
    }

    var activeIdx = plugin.findActiveSessionIndex(filtered);
    if (activeIdx !== -1) {
        return activeIdx;
    }

    if (options.preserveWhenMissing) {
        if (currentIndex >= filtered.length) {
            return filtered.length - 1;
        }
        return currentIndex < 0 ? 0 : currentIndex;
    }

    return 0;
}

function handleSearchOverlayHorizontalKey(e, activeEl, options) {
    if (activeEl === options.saveInput && e.key === 'ArrowRight') {
        if (navigationUtils.isTextInputCursorAtEnd(options.saveInput)) {
            e.preventDefault();
            e.stopImmediatePropagation();
            options.saveBtn.focus();
        }
        return true;
    }
    if (activeEl === options.saveBtn && e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopImmediatePropagation();
        options.focusSaveInput();
        return true;
    }
    return false;
}

function handleSearchOverlayVerticalKey(e, activeEl, options) {
    if (activeEl === options.searchInput) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (e.key === 'ArrowDown') {
            options.focusFirstResult();
        } else {
            options.focusSaveInput();
        }
        return true;
    }
    if (activeEl === options.saveInput || activeEl === options.saveBtn) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (e.key === 'ArrowDown') {
            if (options.hasSearchInput()) {
                options.focusSearchInput();
            } else {
                options.focusFirstResult();
            }
        } else {
            options.focusLastResult();
        }
        return true;
    }

    var filtered = options.getFiltered();
    e.preventDefault();
    if (filtered.length === 0) return true;
    options.setKeyboardNav(true);
    var dir = e.key === 'ArrowUp' ? -1 : 1;
    var selectedIndex = options.getSelectedIndex();
    var nextIndex = selectedIndex + dir;
    if (nextIndex < 0) {
        if (options.hasSearchInput()) {
            options.focusSearchInput();
        } else {
            options.focusSaveInput();
        }
        return true;
    }
    if (nextIndex >= filtered.length) {
        options.focusSaveInput();
        return true;
    }
    options.setSelectedIndex(nextIndex);
    options.updateSelection();
    return true;
}

function handleSearchOverlayEnterKey(e, activeEl, options) {
    if (activeEl === options.saveInput || activeEl === options.saveBtn) return false;
    e.preventDefault();
    e.stopImmediatePropagation();
    options.switchSelected({ shiftKey: e.shiftKey });
    return true;
}

function handleSearchOverlayDeleteKey(e, activeEl, options) {
    var searchInput = options.searchInput;
    if (activeEl === searchInput && searchInput.value.length > 0) return false;
    if (activeEl === options.saveInput || activeEl === options.saveBtn) return false;
    e.preventDefault();

    var filteredForDelete = options.getFiltered();
    var selectedForDelete = options.getSelectedIndex();
    if (selectedForDelete < 0 || selectedForDelete >= filteredForDelete.length) return true;
    var sess = filteredForDelete[selectedForDelete];
    if (Object.keys(options.plugin.data.sessions).length <= 1) {
        new obsidian.Notice(i18n.L.cannotDeleteLast);
        return true;
    }

    var doDelete = function () {
        options.plugin.deleteSession(sess.id).then(function (deleted) {
            if (!deleted) return;
            new obsidian.Notice(i18n.L.deleted(sess.name));
            options.refreshOrderedSessions();
        });
    };

    if (options.plugin.data.confirmDeleteByHotkey !== false) {
        new ConfirmModal(options.plugin.app, i18n.L.confirmDeleteActive(sess.name), doDelete).open();
    } else {
        doDelete();
    }
    return true;
}

function handleSearchOverlaySlashKey(e, activeEl, options) {
    if (activeEl === options.searchInput || activeEl === options.saveInput || activeEl === options.saveBtn) return false;
    e.preventDefault();
    navigationUtils.focusTextInputSelect(options.searchInput);
    return true;
}

function createSearchOverlayKeyHandler(options) {
    return function (e) {
        var plugin = options.plugin;
        if (!plugin.searchOverlayEl) return;
        if (hasBlockingModal()) return;
        var activeEl = document.activeElement;

        // Let global command hotkeys (e.g. Mod+Shift+Enter/Tab) flow through.
        if (utils.isModPressed(e)) {
            return;
        }

        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopImmediatePropagation();
            plugin.hideSearchOverlay();
            return;
        }

        if (e.key === 'Tab') {
            if (activeEl === options.saveInput || activeEl === options.saveBtn) return;
            if (!plugin.isGroupFeatureEnabled() || plugin.getOrderedGroups().length === 0) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            var nextGroupId = plugin.getRelativeGroupId(options.getOverlayGroupId(), e.shiftKey ? -1 : 1);
            if (typeof nextGroupId === 'undefined') return;
            options.applyOverlayGroupSelection(nextGroupId);
            return;
        }

        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            if (handleSearchOverlayHorizontalKey(e, activeEl, options)) return;
        }

        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            if (handleSearchOverlayVerticalKey(e, activeEl, options)) return;
        }

        if (e.key === 'Enter' && !e.isComposing) {
            if (handleSearchOverlayEnterKey(e, activeEl, options)) return;
        }

        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (handleSearchOverlayDeleteKey(e, activeEl, options)) return;
        }

        if (e.key === '/' && activeEl !== options.searchInput && activeEl !== options.saveInput && activeEl !== options.saveBtn) {
            if (handleSearchOverlaySlashKey(e, activeEl, options)) return;
        }
    };
}

module.exports = {
    hasBlockingModal: hasBlockingModal,
    syncSearchOverlaySelectedIndex: syncSearchOverlaySelectedIndex,
    createSearchOverlayKeyHandler: createSearchOverlayKeyHandler,
};
