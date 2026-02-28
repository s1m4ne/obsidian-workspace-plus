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
 * @param {Function} [options.onSave]
 * @param {Function} [options.onReload]
 * @param {Function} [options.onSaveAs]
 * @param {Function} [options.onSwitch]
 * @param {Function} [options.onRename]
 * @param {Function} [options.onDuplicate]
 * @param {Function} [options.onDelete]
 * @param {Function} [options.onRemoveFromGroup]
 */
function openSessionContextMenu(options) {
    var L = i18n.L;
    options = options || {};
    var plugin = options.plugin;
    var app = options.app || (plugin ? plugin.app : null);
    var session = options.session;
    if (!plugin || !app || !session) return;

    var isActive = !!options.isActive;
    var menu = new obsidian.Menu();

    // --- Save group (only when active and auto-save is off) ---
    if (isActive && !plugin.isAutoSaveOnSwitchEnabled()) {
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
