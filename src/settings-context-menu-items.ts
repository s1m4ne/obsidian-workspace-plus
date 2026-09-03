import { Menu, Notice, type App } from 'obsidian';
import { addCustomizeClicksItem, call, showAtMouseEvent } from './context-menu-shared.ts';
import { L, text } from './i18n.ts';
import * as obsidianInternals from './platform/obsidian-internals.ts';
import type { SettingsState } from './state/settings-state.ts';
import type { TabId } from './settings-tab.ts';
import type { GroupStore } from './state/group-store.ts';
import type { SessionSaver } from './state/session-saver.ts';
import type { HistoryService } from './state/history-service.ts';

type SettingsMenuCallbackName = 'onResetOverlay' | 'onChanged';
type SettingsMenuCallbacks = Partial<Record<SettingsMenuCallbackName, () => void>>;

export interface SettingsContextMenuPluginHost {
    /**
     * Owned by HistoryService; naming it keeps one list rather than a
     * forwarding method per call on the plugin.
     */
    getHistoryService(): HistoryService;

    /**
     * Saving and the auto-save flags are owned by SessionSaver. Naming it here
     * rather than restating its methods keeps one list, the way getGroupStore()
     * does for group state.
     */
    getSessionSaver(): SessionSaver;

    /**
     * Group state is owned by GroupStore. Naming the store rather than
     * restating its methods keeps one list: the plugin used to carry a
     * forwarding method per call, and one added to the store without a shim
     * did nothing from here while the type checker saw a host that simply
     * lacked the member.
     */
    getGroupStore(): GroupStore;

    /**
     * The settings the UI writes are owned by SettingsState. Naming the store
     * here rather than restating its twenty-four setters keeps one list: the
     * plugin used to carry a forwarding method per setter, and a setter added
     * to the store without one silently did nothing from the settings screen.
     */
    getSettingsState(): SettingsState;

    app: App;
    data: {
        confirmDeleteByHotkey?: boolean;
        confirmQuickActions?: boolean;
        showFilterInput?: boolean;
    };
    manifest: { id: string; name?: string };
    // TabId, not string: the field really is a TabId and writing a bare string
    // into it only type-checked because the plugin reached here through a cast.
    settingTab?: { activeTab: TabId | null } | undefined;
    _lastRotationBackupAt: number;
    extractSessionData(data: unknown): Record<string, unknown>;
    prepareRotationBackupData(sessionData: Record<string, unknown>): Record<string, unknown>;
    ensureDir(path: string): Promise<unknown>;
    getBackupsDirPath(): string;
    copyFileIfExists(sourcePath: string, destinationPath: string): Promise<unknown>;
    getRotationBackupPath(generation: number): string;
    writeJson(path: string, data: unknown): Promise<unknown>;
}

export type SettingsContextMenuOptions = SettingsMenuCallbacks & {
    plugin?: SettingsContextMenuPluginHost | undefined;
    app?: App | undefined;
    event?: MouseEvent | undefined;
    showResetOverlay?: boolean | undefined;
};

/** Open a settings context menu on empty area of Session Manager / Quick Switcher. */
export function openSettingsContextMenu(initialOptions?: SettingsContextMenuOptions | null): void {
    const options = initialOptions || {};
    const plugin = options.plugin;
    const app = options.app || plugin?.app || null;
    if (!plugin || !app) return;

    const menu = new Menu();

    // --- Auto-save section ---
    const autoSaveOn = plugin.getSessionSaver().isAutoSaveOnSwitchEnabled();

    menu.addItem((mi) => {
        mi.setTitle(text(L.settingsAutoSaveOnSwitch));
        mi.setIcon('save');
        if (autoSaveOn) mi.setChecked(true);
        mi.onClick(() => {
            void plugin.getSessionSaver().setAutoSaveOnSwitch(!autoSaveOn, { notify: true }).then(() => {
                call(options.onChanged);
            });
        });
    });

    if (!autoSaveOn) {
        menu.addItem((mi) => {
            mi.setTitle(text(L.settingsWarnUnsavedSwitch));
            mi.setIcon('alert-triangle');
            if (plugin.getSessionSaver().isWarnOnUnsavedSwitchEnabled()) mi.setChecked(true);
            mi.onClick(() => {
                void plugin.getSettingsState().setWarnOnUnsavedSwitch(!plugin.getSessionSaver().isWarnOnUnsavedSwitchEnabled()).then(() => {
                    call(options.onChanged);
                });
            });
        });

        menu.addItem((mi) => {
            mi.setTitle(text(L.settingsConfirmQuickActions));
            mi.setIcon('check-circle');
            if (plugin.getSettingsState().confirmQuickActions) mi.setChecked(true);
            mi.onClick(() => {
                void plugin.getSettingsState().setConfirmQuickActions(!plugin.getSettingsState().confirmQuickActions).then(() => {
                    call(options.onChanged);
                });
            });
        });
    }

    menu.addItem((mi) => {
        mi.setTitle(text(L.settingsConfirmDelete));
        mi.setIcon('shield');
        if (plugin.getSettingsState().confirmDeleteByHotkey) mi.setChecked(true);
        mi.onClick(() => {
            void plugin.getSettingsState().setConfirmDeleteByHotkey(!plugin.getSettingsState().confirmDeleteByHotkey).then(() => {
                call(options.onChanged);
            });
        });
    });

    menu.addSeparator();

    // --- Feature toggles ---
    menu.addItem((mi) => {
        mi.setTitle(text(L.settingsVersionHistoryEnabled));
        mi.setIcon('history');
        if (plugin.getHistoryService().isVersionHistoryEnabled()) mi.setChecked(true);
        mi.onClick(() => {
            const next = !plugin.getHistoryService().isVersionHistoryEnabled();
            void plugin.getSettingsState().setVersionHistoryEnabled(next).then(() => {
                call(options.onChanged);
            });
        });
    });

    menu.addItem((mi) => {
        mi.setTitle(text(L.contextToggleGroups));
        mi.setIcon('folder');
        if (plugin.getGroupStore().isGroupFeatureEnabled()) mi.setChecked(true);
        mi.onClick(() => {
            void plugin.getGroupStore().setGroupFeatureEnabled(!plugin.getGroupStore().isGroupFeatureEnabled()).then(() => {
                call(options.onChanged);
            });
        });
    });

    menu.addItem((mi) => {
        mi.setTitle(text(L.settingsShowFilterInput));
        mi.setIcon('search');
        if (plugin.getSettingsState().showFilterInput) mi.setChecked(true);
        mi.onClick(() => {
            void plugin.getSettingsState().setShowFilterInput(!plugin.getSettingsState().showFilterInput).then(() => {
                call(options.onChanged);
            });
        });
    });

    menu.addSeparator();

    // --- Actions ---
    menu.addItem((mi) => {
        mi.setTitle(text(L.rotationBackupCreate));
        mi.setIcon('archive');
        mi.onClick(() => {
            const sessionData = plugin.extractSessionData(plugin.data);
            sessionData._wppSavedAt = Date.now();
            const backupData = plugin.prepareRotationBackupData(sessionData);
            void plugin.ensureDir(plugin.getBackupsDirPath())
                .then(() => plugin.copyFileIfExists(
                    plugin.getRotationBackupPath(2),
                    plugin.getRotationBackupPath(3)
                ))
                .then(() => plugin.copyFileIfExists(
                    plugin.getRotationBackupPath(1),
                    plugin.getRotationBackupPath(2)
                ))
                .then(() => plugin.writeJson(plugin.getRotationBackupPath(1), backupData))
                .then(() => {
                    plugin._lastRotationBackupAt = Date.now();
                    new Notice(text(L.rotationBackupCreated));
                })
                .catch(() => {
                    new Notice(text(L.rotationBackupFailed));
                });
        });
    });

    menu.addItem((mi) => {
        mi.setTitle(text(L.settingsHotkeysBtn));
        mi.setIcon('keyboard');
        mi.onClick(() => {
            const pluginName = plugin.manifest && plugin.manifest.name
                ? plugin.manifest.name
                : 'Workspace++';
            obsidianInternals.openHotkeysSetting(app, pluginName);
        });
    });

    addCustomizeClicksItem(menu, app, plugin);

    menu.addItem((mi) => {
        mi.setTitle(text(L.contextOpenSettings));
        mi.setIcon('settings');
        mi.onClick(() => {
            obsidianInternals.openSettingTab(app, plugin.manifest.id);
        });
    });

    // --- Quick Switcher only: Reset position ---
    if (options.showResetOverlay) {
        menu.addSeparator();
        menu.addItem((mi) => {
            mi.setTitle(text(L.contextResetOverlayPosition));
            mi.setIcon('rotate-ccw');
            mi.onClick(() => {
                call(options.onResetOverlay);
            });
        });
    }

    showAtMouseEvent(menu, options.event);
}
