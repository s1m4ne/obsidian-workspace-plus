// Behavior Lock: Settings Tab & UI
//
// Locks the Settings tab rendering, tab switching (general, sessions, groups, advanced),
// toggle and dropdown changes updating plugin state, and side effect triggers.
//
// RULE: Behavior Lock tests in tests/lock/ are NEVER edited during the refactor.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness, ToggleStub, DropdownStub } from './harness/index.ts';

interface SettingsPlugin {
    data: {
        language: string;
        autoSaveOnSwitch: boolean;
        warnOnUnsavedSwitch: boolean;
        showFilterInput: boolean;
        numberedCommandHotkeys: boolean;
        groupFeatureEnabled: boolean;
        sessions: Record<string, { id: string; name: string }>;
        sessionOrder: string[];
        groups: Record<string, { id: string; name: string }>;
        groupOrder: string[];
        [key: string]: unknown;
    };
    app: {
        setting: {
            openTabById(id: string): void;
            activeTab: unknown;
        };
        vault: {
            adapter: {
                exists(path: string): Promise<boolean>;
                stat(path: string): Promise<{ size: number }>;
            };
        };
    };
    manifest: { name: string; id: string };
    isGroupFeatureEnabled(): boolean;
    getOrderedGroups(): Array<{ id: string; name: string }>;
    getOrderedSessions(): Array<{ id: string; name: string }>;
    getSessionsPath(): string;
    getSessionStorageLocation(): string;
    setAutoSaveOnSwitch(enabled: boolean): Promise<boolean>;
    setWarnOnUnsavedSwitch(enabled: boolean): Promise<boolean>;
    setNumberedCommandHotkeys(enabled: boolean): Promise<boolean>;
    setGroupFeatureEnabled(enabled: boolean): Promise<boolean>;
    setLanguageSetting(lang: string): Promise<boolean>;
    updateStatusBar(): void;
    syncSessionCommands(): void;
    persistData(): Promise<void>;
    getCommandHotkey(cmd: string): string | null;
    [key: string]: unknown;
}

interface SettingTabInstance {
    activeTab: string;
    containerEl: HTMLElement;
    display(): void;
    [key: string]: unknown;
}

async function createSettingsPlugin(
    initialData?: Partial<SettingsPlugin['data']>,
): Promise<SettingsPlugin> {
    const i18nMod = await import('../../src/i18n.ts');
    const i18n = (i18nMod.default ?? i18nMod) as { resolveLocale(l: string): void };
    i18n.resolveLocale('en');

    const defaultDataMod = await import('../../src/plugin/default-data.js');
    const DEFAULT_DATA = (defaultDataMod.default ?? defaultDataMod) as Record<string, unknown>;

    const methodsRaw: unknown = await import('../../src/plugin/methods/index.js');
    const methodsMod = methodsRaw as { default?: (cls: unknown) => void };
    const attachPluginMethods = (methodsMod.default ?? methodsRaw) as (cls: unknown) => void;

    function PluginMock() {}
    attachPluginMethods(PluginMock);

    const plugin = new (PluginMock as unknown as { new(): SettingsPlugin })();

    plugin.data = {
        ...DEFAULT_DATA,
        language: 'auto',
        autoSaveOnSwitch: true,
        warnOnUnsavedSwitch: false,
        showFilterInput: true,
        numberedCommandHotkeys: true,
        groupFeatureEnabled: true,
        sessions: {
            s1: { id: 's1', name: 'Session 1' },
            s2: { id: 's2', name: 'Session 2' },
        },
        sessionOrder: ['s1', 's2'],
        groups: {
            g1: { id: 'g1', name: 'Group 1' },
        },
        groupOrder: ['g1'],
        ...(initialData || {}),
    };

    plugin.app = {
        setting: {
            openTabById: (): void => {},
            activeTab: null,
        },
        vault: {
            adapter: {
                exists: (): Promise<boolean> => Promise.resolve(false),
                stat: (): Promise<{ size: number }> => Promise.resolve({ size: 1024 }),
            },
        },
    };
    plugin.manifest = { name: 'Workspace++', id: 'obsidian-workspace-plus' };

    plugin.getSessionsPath = (): string => '.obsidian/plugins/obsidian-workspace-plus/workspaces.json';
    plugin.getSessionStorageLocation = (): string => 'plugin-folder';
    plugin.updateStatusBar = (): void => {};
    plugin.syncSessionCommands = (): void => {};
    plugin.persistData = (): Promise<void> => Promise.resolve();
    plugin.getCommandHotkey = (): string | null => null;

    return plugin;
}

async function loadSettingTabClass(): Promise<new (app: unknown, plugin: unknown) => SettingTabInstance> {
    const raw = await import('../../src/settings.js');
    const mod = raw as unknown as { WorkspacePlusPlusSettingTab?: new (app: unknown, plugin: unknown) => SettingTabInstance };
    return (mod.WorkspacePlusPlusSettingTab ?? raw) as unknown as new (app: unknown, plugin: unknown) => SettingTabInstance;
}

test('SettingTab renders 4 tabs and allows tab switching', async () => {
    const h = setupHarness();
    try {
        const plugin = await createSettingsPlugin();
        const SettingTabClass = await loadSettingTabClass();
        const tab = new SettingTabClass(plugin.app, plugin);
        tab.display();

        const tabBar = tab.containerEl.querySelector('.wpp-settings-tab-bar');
        assert.ok(tabBar, 'Tab bar must be rendered');

        const tabButtons = tabBar.querySelectorAll<HTMLButtonElement>('.wpp-settings-tab');
        assert.equal(tabButtons.length, 4, 'Must render General, Sessions, Groups, Advanced tabs');

        // Initial tab is general
        assert.equal(tab.activeTab, 'general');
        assert.ok(tabButtons[0]?.classList.contains('is-active'));

        // Click Sessions tab (index 1)
        tabButtons[1]?.click();
        assert.equal(tab.activeTab, 'sessions');

        // Click Groups tab (index 2)
        tabButtons[2]?.click();
        assert.equal(tab.activeTab, 'groups');

        // Click Advanced tab (index 3)
        tabButtons[3]?.click();
        assert.equal(tab.activeTab, 'advanced');
    } finally {
        h.restore();
    }
});

test('General settings tab displays language dropdown and status bar actions', async () => {
    const h = setupHarness();
    try {
        const plugin = await createSettingsPlugin({
            language: 'en',
        });
        const SettingTabClass = await loadSettingTabClass();
        const tab = new SettingTabClass(plugin.app, plugin);
        tab.display();

        // Check language dropdown setting
        const dropdowns = h.obsidian.settings
            .flatMap((s) => s.components)
            .filter((c): c is DropdownStub => c instanceof DropdownStub);
        assert.ok(dropdowns.length >= 1);
        assert.equal(dropdowns[0]?.value, 'en');
    } finally {
        h.restore();
    }
});

test('Sessions settings tab renders toggles and toggling updates plugin data', async () => {
    const h = setupHarness();
    try {
        const plugin = await createSettingsPlugin({
            autoSaveOnSwitch: true,
        });
        const SettingTabClass = await loadSettingTabClass();
        const tab = new SettingTabClass(plugin.app, plugin);
        tab.activeTab = 'sessions';
        tab.display();

        const toggles = h.obsidian.settings
            .flatMap((s) => s.components)
            .filter((c): c is ToggleStub => c instanceof ToggleStub);
        assert.ok(toggles.length >= 1, 'Sessions tab must render toggles');

        // Auto-save toggle is first
        assert.equal(toggles[0]?.value, true);

        await toggles[0]?.trigger(false);
        assert.equal(plugin.data.autoSaveOnSwitch, false, 'plugin.data.autoSaveOnSwitch must update to false');
    } finally {
        h.restore();
    }
});
