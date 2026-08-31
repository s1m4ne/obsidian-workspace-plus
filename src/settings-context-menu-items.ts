import { Menu, Notice, type App } from 'obsidian';
import { L } from './i18n.ts';
import * as obsidianInternals from './platform/obsidian-internals.ts';

type SettingsMenuCallbackName = 'onResetOverlay' | 'onChanged';
type SettingsMenuCallbacks = Partial<Record<SettingsMenuCallbackName, () => void>>;

export interface SettingsContextMenuPluginHost {
    app: App;
    data: {
        confirmDeleteByHotkey?: boolean;
        confirmQuickActions?: boolean;
        showFilterInput?: boolean;
    };
    manifest: { id: string; name?: string };
    settingTab?: { activeTab: string } | undefined;
    _lastRotationBackupAt: number;
    isAutoSaveOnSwitchEnabled(): boolean;
    isWarnOnUnsavedSwitchEnabled(): boolean;
    isVersionHistoryEnabled(): boolean;
    isGroupFeatureEnabled(): boolean;
    setAutoSaveOnSwitch(enabled: boolean, options: { notify: boolean }): Promise<unknown>;
    setWarnOnUnsavedSwitch(enabled: boolean): Promise<unknown>;
    setConfirmQuickActions(enabled: boolean): Promise<unknown>;
    setConfirmDeleteByHotkey(enabled: boolean): Promise<unknown>;
    setVersionHistoryEnabled(enabled: boolean): Promise<unknown>;
    setGroupFeatureEnabled(enabled: boolean): Promise<unknown>;
    setShowFilterInput(enabled: boolean): Promise<unknown>;
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

function text(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

function isCallback(value: unknown): value is () => void {
    return typeof value === 'function';
}

function call(callback: unknown): void {
    if (isCallback(callback)) callback();
}

function showAtMouseEvent(menu: Menu, event: MouseEvent | undefined): void {
    const show = (input: MouseEvent): unknown => menu.showAtMouseEvent(input);
    Reflect.apply(show, undefined, [event]);
}

/** Open a settings context menu on empty area of Session Manager / Quick Switcher. */
export function openSettingsContextMenu(initialOptions?: SettingsContextMenuOptions | null): void {
    const options = initialOptions || {};
    const plugin = options.plugin;
    const app = options.app || plugin?.app || null;
    if (!plugin || !app) return;

    const menu = new Menu();

    // --- Auto-save section ---
    const autoSaveOn = plugin.isAutoSaveOnSwitchEnabled();

    menu.addItem((mi) => {
        mi.setTitle(text(L.settingsAutoSaveOnSwitch));
        mi.setIcon('save');
        if (autoSaveOn) mi.setChecked(true);
        mi.onClick(() => {
            void plugin.setAutoSaveOnSwitch(!autoSaveOn, { notify: true }).then(() => {
                call(options.onChanged);
            });
        });
    });

    if (!autoSaveOn) {
        menu.addItem((mi) => {
            mi.setTitle(text(L.settingsWarnUnsavedSwitch));
            mi.setIcon('alert-triangle');
            if (plugin.isWarnOnUnsavedSwitchEnabled()) mi.setChecked(true);
            mi.onClick(() => {
                void plugin.setWarnOnUnsavedSwitch(!plugin.isWarnOnUnsavedSwitchEnabled()).then(() => {
                    call(options.onChanged);
                });
            });
        });

        menu.addItem((mi) => {
            mi.setTitle(text(L.settingsConfirmQuickActions));
            mi.setIcon('check-circle');
            if (plugin.data.confirmQuickActions) mi.setChecked(true);
            mi.onClick(() => {
                void plugin.setConfirmQuickActions(!plugin.data.confirmQuickActions).then(() => {
                    call(options.onChanged);
                });
            });
        });
    }

    menu.addItem((mi) => {
        mi.setTitle(text(L.settingsConfirmDelete));
        mi.setIcon('shield');
        if (plugin.data.confirmDeleteByHotkey !== false) mi.setChecked(true);
        mi.onClick(() => {
            void plugin.setConfirmDeleteByHotkey(!(plugin.data.confirmDeleteByHotkey !== false)).then(() => {
                call(options.onChanged);
            });
        });
    });

    menu.addSeparator();

    // --- Feature toggles ---
    menu.addItem((mi) => {
        mi.setTitle(text(L.settingsVersionHistoryEnabled));
        mi.setIcon('history');
        if (plugin.isVersionHistoryEnabled()) mi.setChecked(true);
        mi.onClick(() => {
            const next = !plugin.isVersionHistoryEnabled();
            void plugin.setVersionHistoryEnabled(next).then(() => {
                call(options.onChanged);
            });
        });
    });

    menu.addItem((mi) => {
        mi.setTitle(text(L.contextToggleGroups));
        mi.setIcon('folder');
        if (plugin.isGroupFeatureEnabled()) mi.setChecked(true);
        mi.onClick(() => {
            void plugin.setGroupFeatureEnabled(!plugin.isGroupFeatureEnabled()).then(() => {
                call(options.onChanged);
            });
        });
    });

    menu.addItem((mi) => {
        mi.setTitle(text(L.settingsShowFilterInput));
        mi.setIcon('search');
        if (plugin.data.showFilterInput) mi.setChecked(true);
        mi.onClick(() => {
            void plugin.setShowFilterInput(!plugin.data.showFilterInput).then(() => {
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

    menu.addItem((mi) => {
        mi.setTitle(text(L.contextCustomizeClicks));
        mi.setIcon('mouse-pointer-click');
        mi.onClick(() => {
            if (plugin.settingTab) plugin.settingTab.activeTab = 'general';
            obsidianInternals.openSettingTab(app, plugin.manifest.id);
        });
    });

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
