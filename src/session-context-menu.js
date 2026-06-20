'use strict';

var obsidian = require('obsidian');
var i18n = require('./i18n');

/**
 * Open a context menu for a session item.
 *
 * @param {Object} options
 * @param {Object} options.plugin        - plugin instance
 * @param {Object} options.app           - Obsidian app
 * @param {Object} options.session       - session object ({ id, name, ... })
 * @param {boolean} options.isActive     - whether this is the active session
 * @param {MouseEvent} options.event     - right-click event
 * @param {boolean} [options.showSaveAs]           - show "Save As" item (status bar only)
 * @param {boolean} [options.showSwitch]            - show "Switch" item (overlay / modal)
 * @param {boolean} [options.showRemoveFromGroup]   - show "Remove from group" item
 * @param {boolean} [options.showMoveToGroup]       - show "Move to group" submenu
 * @param {boolean} [options.showCustomizeClicks]   - show "Customize click actions" item (status bar only)
 * @param {Function} [options.onSave]
 * @param {Function} [options.onReload]
 * @param {Function} [options.onSaveAs]
 * @param {Function} [options.onOverwriteWithCurrentLayout]
 * @param {Function} [options.onSwitch]
 * @param {Function} [options.onRename]
 * @param {Function} [options.onDuplicate]
 * @param {Function} [options.onDelete]
 * @param {Function} [options.onRemoveFromGroup]
 * @param {Function} [options.onMoveToGroup]
 * @param {Function} [options.onVersionHistory]
 */
function openSessionContextMenu(options) {
    var L = i18n.L;
    options = options || {};
    var plugin = options.plugin;
    var app = options.app || (plugin ? plugin.app : null);
    var session = options.session;
    if (!plugin || !app || !session) return;

    var isActive = !!options.isActive;
    var manualSaveMode = !plugin.isAutoSaveOnSwitchEnabled();
    var showOverwriteWithCurrentLayout = !isActive &&
        manualSaveMode &&
        typeof options.onOverwriteWithCurrentLayout === 'function';
    var menu = new obsidian.Menu();
    var addedSaveGroup = false;

    // --- Save group (only when active and auto-save is off) ---
    if (isActive && manualSaveMode) {
        // Save
        menu.addItem(function (mi) {
            mi.setTitle(L.contextSaveSession);
            mi.setIcon('save');
            mi.onClick(function () {
                if (typeof options.onSave === 'function') options.onSave();
            });
        });

        // Reload
        menu.addItem(function (mi) {
            mi.setTitle(L.contextReloadSession);
            mi.setIcon('rotate-ccw');
            mi.onClick(function () {
                if (typeof options.onReload === 'function') options.onReload();
            });
        });

        // Save As (status bar only)
        if (options.showSaveAs) {
            menu.addItem(function (mi) {
                mi.setTitle(L.cmdSaveAs);
                mi.setIcon('save-all');
                mi.onClick(function () {
                    if (typeof options.onSaveAs === 'function') options.onSaveAs();
                });
            });
        }

        addedSaveGroup = true;
    }

    if (addedSaveGroup) {
        menu.addSeparator();
    }

    // --- Manage group ---
    // Switch (overlay / modal only, non-active sessions)
    if (options.showSwitch && !isActive) {
        menu.addItem(function (mi) {
            mi.setTitle(L.contextSwitchSession);
            mi.setIcon('arrow-right');
            mi.onClick(function () {
                if (typeof options.onSwitch === 'function') options.onSwitch();
            });
        });
    }

    // Rename
    menu.addItem(function (mi) {
        mi.setTitle(L.contextRenameSession);
        mi.setIcon('pencil');
        mi.onClick(function () {
            if (typeof options.onRename === 'function') options.onRename();
        });
    });

    // Duplicate
    menu.addItem(function (mi) {
        mi.setTitle(L.contextDuplicateSession);
        mi.setIcon('copy');
        mi.onClick(function () {
            if (typeof options.onDuplicate === 'function') options.onDuplicate();
        });
    });

    // Version history
    if (plugin.isVersionHistoryEnabled()) {
        menu.addItem(function (mi) {
            mi.setTitle(L.contextVersionHistory);
            mi.setIcon('history');
            mi.onClick(function () {
                if (typeof options.onVersionHistory === 'function') options.onVersionHistory();
            });
        });
    }

    // Remove from group
    if (options.showRemoveFromGroup) {
        menu.addItem(function (mi) {
            mi.setTitle(L.groupRemoveFromGroup);
            mi.setIcon('log-out');
            mi.onClick(function () {
                if (typeof options.onRemoveFromGroup === 'function') options.onRemoveFromGroup();
            });
        });
    }

    // Move to group (submenu)
    if (options.showMoveToGroup) {
        menu.addItem(function (mi) {
            mi.setTitle(L.groupMoveToGroup);
            mi.setIcon('folder-input');
            var submenu = mi.setSubmenu();
            var groups = plugin.getOrderedGroups();
            var sessionGroupIds = (plugin.data.sessionGroups || {})[session.id] || [];
            for (var gi = 0; gi < groups.length; gi++) {
                (function (group) {
                    submenu.addItem(function (sub) {
                        sub.setTitle(group.name);
                        if (sessionGroupIds.indexOf(group.id) !== -1) {
                            sub.setChecked(true);
                        }
                        sub.onClick(function () {
                            if (typeof options.onMoveToGroup === 'function') options.onMoveToGroup(group.id);
                        });
                    });
                })(groups[gi]);
            }
        });
    }

    if (showOverwriteWithCurrentLayout) {
        menu.addSeparator();
        menu.addItem(function (mi) {
            mi.setTitle(L.contextSaveCurrentLayoutToThisSession);
            mi.setIcon('save');
            mi.onClick(function () {
                if (typeof options.onOverwriteWithCurrentLayout === 'function') options.onOverwriteWithCurrentLayout();
            });
        });
    }

    // --- Customize click actions (status bar only) ---
    if (options.showCustomizeClicks) {
        menu.addSeparator();
        menu.addItem(function (mi) {
            mi.setTitle(L.contextCustomizeClicks);
            mi.setIcon('mouse-pointer-click');
            mi.onClick(function () {
                if (plugin.settingTab) plugin.settingTab.activeTab = 'general';
                app.setting.open();
                app.setting.openTabById(plugin.manifest.id);
            });
        });
    }

    // --- Danger group ---
    if (Object.keys(plugin.data.sessions).length > 1) {
        menu.addSeparator();
        menu.addItem(function (mi) {
            mi.setTitle(L.contextDeleteSession);
            mi.setIcon('trash-2');
            mi.onClick(function () {
                if (typeof options.onDelete === 'function') options.onDelete();
            });
        });
    }

    menu.showAtMouseEvent(options.event);
}

module.exports = {
    openSessionContextMenu: openSessionContextMenu,
};
