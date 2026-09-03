import type { App, Hotkey } from 'obsidian';

export interface ObsidianHotkeyManager {
    getHotkeys?(commandId: string): Hotkey[] | null | undefined;
    getDefaultHotkeys?(commandId: string): Hotkey[] | null | undefined;
}

export interface ObsidianSearchComponent {
    setValue(value: string): this;
    onChanged?(): void;
    inputEl?: HTMLInputElement;
}

export interface ObsidianSettingTabInstance {
    id?: string;
    searchComponent?: ObsidianSearchComponent;
}

export interface ObsidianSetting {
    open(): void;
    openTabById(id: string): ObsidianSettingTabInstance | undefined;
    activeTab?: ObsidianSettingTabInstance;
}

export interface AppWithInternals extends App {
    hotkeyManager?: ObsidianHotkeyManager;
    setting?: ObsidianSetting;
}

export function getHotkeyManager(app: App): ObsidianHotkeyManager | null {
    const internals = app as AppWithInternals;
    return internals.hotkeyManager ?? null;
}

export function getSetting(app: App): ObsidianSetting | null {
    const internals = app as AppWithInternals;
    return internals.setting ?? null;
}

export function openSettingTab(app: App, tabId: string): ObsidianSettingTabInstance | undefined {
    const setting = getSetting(app);
    if (!setting) return undefined;
    try {
        setting.open();
        return setting.openTabById(tabId);
    } catch {
        return undefined;
    }
}

export function openHotkeysSetting(app: App, searchQuery?: string): void {
    const setting = getSetting(app);
    if (!setting) return;
    try {
        setting.open();
        setting.openTabById('hotkeys');
        if (searchQuery && setting.activeTab?.searchComponent) {
            const sc = setting.activeTab.searchComponent;
            sc.setValue(searchQuery);
            if (typeof sc.onChanged === 'function') {
                sc.onChanged();
            }
            if (sc.inputEl) {
                sc.inputEl.dispatchEvent(new Event('input'));
            }
        }
    } catch {
        // Safe fall-through if internal structure changes
    }
}

export function getCommandHotkeys(app: App, fullCommandId: string): Hotkey[] | null {
    try {
        const mgr = getHotkeyManager(app);
        if (!mgr) return null;
        const custom = typeof mgr.getHotkeys === 'function' ? mgr.getHotkeys(fullCommandId) : null;
        if (custom && custom.length > 0) {
            return custom;
        }
        const defaults = typeof mgr.getDefaultHotkeys === 'function' ? mgr.getDefaultHotkeys(fullCommandId) : null;
        if (defaults && defaults.length > 0) {
            return defaults;
        }
        return null;
    } catch {
        return null;
    }
}
