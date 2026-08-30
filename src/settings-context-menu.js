'use strict';

var obsidian = require('obsidian');
var i18n = require('./i18n.ts');

/**
 * Open a settings context menu on empty area of Session Manager / Quick Switcher.
 *
 * @param {Object} options
 * @param {Object} options.plugin            - plugin instance
 * @param {Object} options.app               - Obsidian app
 * @param {MouseEvent} options.event         - right-click event
 * @param {boolean} [options.showResetOverlay] - show "Reset position and size" (Quick Switcher only)
 * @param {Function} [options.onResetOverlay]  - callback for reset position/size
 * @param {Function} [options.onChanged]       - callback after any setting toggled (for UI refresh)
 */
function openSettingsContextMenu(options) {
    var L = i18n.L;
    options = options || {};
    var plugin = options.plugin;
    var app = options.app || (plugin ? plugin.app : null);
    if (!plugin || !app) return;

    var menu = new obsidian.Menu();

    // --- Auto-save section ---
    var autoSaveOn = plugin.isAutoSaveOnSwitchEnabled();

    menu.addItem(function (mi) {
        mi.setTitle(L.settingsAutoSaveOnSwitch);
        mi.setIcon('save');
        if (autoSaveOn) mi.setChecked(true);
        mi.onClick(function () {
            plugin.setAutoSaveOnSwitch(!autoSaveOn, { notify: true }).then(function () {
                if (typeof options.onChanged === 'function') options.onChanged();
            });
        });
    });

    if (!autoSaveOn) {
        menu.addItem(function (mi) {
            mi.setTitle(L.settingsWarnUnsavedSwitch);
            mi.setIcon('alert-triangle');
            if (plugin.isWarnOnUnsavedSwitchEnabled()) mi.setChecked(true);
            mi.onClick(function () {
                plugin.setWarnOnUnsavedSwitch(!plugin.isWarnOnUnsavedSwitchEnabled()).then(function () {
                    if (typeof options.onChanged === 'function') options.onChanged();
                });
            });
        });

        menu.addItem(function (mi) {
            mi.setTitle(L.settingsConfirmQuickActions);
            mi.setIcon('check-circle');
            if (plugin.data.confirmQuickActions) mi.setChecked(true);
            mi.onClick(function () {
                plugin.setConfirmQuickActions(!plugin.data.confirmQuickActions).then(function () {
                    if (typeof options.onChanged === 'function') options.onChanged();
                });
            });
        });
    }

    menu.addItem(function (mi) {
        mi.setTitle(L.settingsConfirmDelete);
        mi.setIcon('shield');
        if (plugin.data.confirmDeleteByHotkey !== false) mi.setChecked(true);
        mi.onClick(function () {
            plugin.setConfirmDeleteByHotkey(!(plugin.data.confirmDeleteByHotkey !== false)).then(function () {
                if (typeof options.onChanged === 'function') options.onChanged();
            });
        });
    });

    menu.addSeparator();

    // --- Feature toggles ---
    menu.addItem(function (mi) {
        mi.setTitle(L.settingsVersionHistoryEnabled);
        mi.setIcon('history');
        if (plugin.isVersionHistoryEnabled()) mi.setChecked(true);
        mi.onClick(function () {
            var next = !plugin.isVersionHistoryEnabled();
            plugin.setVersionHistoryEnabled(next).then(function () {
                if (typeof options.onChanged === 'function') options.onChanged();
            });
        });
    });

    menu.addItem(function (mi) {
        mi.setTitle(L.contextToggleGroups);
        mi.setIcon('folder');
        if (plugin.isGroupFeatureEnabled()) mi.setChecked(true);
        mi.onClick(function () {
            plugin.setGroupFeatureEnabled(!plugin.isGroupFeatureEnabled()).then(function () {
                if (typeof options.onChanged === 'function') options.onChanged();
            });
        });
    });

    menu.addItem(function (mi) {
        mi.setTitle(L.settingsShowFilterInput);
        mi.setIcon('search');
        if (plugin.data.showFilterInput) mi.setChecked(true);
        mi.onClick(function () {
            plugin.setShowFilterInput(!plugin.data.showFilterInput).then(function () {
                if (typeof options.onChanged === 'function') options.onChanged();
            });
        });
    });

    menu.addSeparator();

    // --- Actions ---
    menu.addItem(function (mi) {
        mi.setTitle(L.rotationBackupCreate);
        mi.setIcon('archive');
        mi.onClick(function () {
            var sessionData = plugin.extractSessionData(plugin.data);
            sessionData._wppSavedAt = Date.now();
            var backupData = plugin.prepareRotationBackupData(sessionData);
            plugin.ensureDir(plugin.getBackupsDirPath())
                .then(function () {
                    return plugin.copyFileIfExists(
                        plugin.getRotationBackupPath(2),
                        plugin.getRotationBackupPath(3)
                    );
                })
                .then(function () {
                    return plugin.copyFileIfExists(
                        plugin.getRotationBackupPath(1),
                        plugin.getRotationBackupPath(2)
                    );
                })
                .then(function () {
                    return plugin.writeJson(
                        plugin.getRotationBackupPath(1),
                        backupData
                    );
                })
                .then(function () {
                    plugin._lastRotationBackupAt = Date.now();
                    new obsidian.Notice(L.rotationBackupCreated);
                })
                .catch(function () {
                    new obsidian.Notice(L.rotationBackupFailed);
                });
        });
    });

    menu.addItem(function (mi) {
        mi.setTitle(L.settingsHotkeysBtn);
        mi.setIcon('keyboard');
        mi.onClick(function () {
            app.setting.open();
            app.setting.openTabById('hotkeys');
            var sc = app.setting.activeTab.searchComponent;
            var pluginName = (plugin.manifest && plugin.manifest.name)
                ? plugin.manifest.name
                : 'Workspace++';
            sc.setValue(pluginName);
            sc.inputEl.dispatchEvent(new Event('input'));
        });
    });

    menu.addItem(function (mi) {
        mi.setTitle(L.contextCustomizeClicks);
        mi.setIcon('mouse-pointer-click');
        mi.onClick(function () {
            if (plugin.settingTab) plugin.settingTab.activeTab = 'general';
            app.setting.open();
            app.setting.openTabById(plugin.manifest.id);
        });
    });

    menu.addItem(function (mi) {
        mi.setTitle(L.contextOpenSettings);
        mi.setIcon('settings');
        mi.onClick(function () {
            app.setting.open();
            app.setting.openTabById(plugin.manifest.id);
        });
    });

    // --- Quick Switcher only: Reset position ---
    if (options.showResetOverlay) {
        menu.addSeparator();
        menu.addItem(function (mi) {
            mi.setTitle(L.contextResetOverlayPosition);
            mi.setIcon('rotate-ccw');
            mi.onClick(function () {
                if (typeof options.onResetOverlay === 'function') options.onResetOverlay();
            });
        });
    }

    menu.showAtMouseEvent(options.event);
}

module.exports = {
    openSettingsContextMenu: openSettingsContextMenu,
};
