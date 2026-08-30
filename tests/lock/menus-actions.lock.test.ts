// Behavior Lock: Menus and Actions
//
// Locks session context menu, settings context menu, and status bar actions.
//
// RULE: Behavior Lock tests in tests/lock/ are NEVER edited during the refactor.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './harness/index.ts';

interface MenusPlugin {
    data: {
        autoSaveOnSwitch: boolean;
        warnOnUnsavedSwitch: boolean;
        confirmQuickActions: boolean;
        confirmDeleteByHotkey: boolean;
        versionHistoryEnabled: boolean;
        groupFeatureEnabled: boolean;
        sessions: Record<string, { id: string; name: string }>;
        groups: Record<string, { id: string; name: string }>;
        groupOrder: string[];
        sessionGroups: Record<string, string[]>;
        [key: string]: unknown;
    };
    app: {
        setting: {
            openTabById(id: string): void;
        };
        vault: {
            adapter: {
                exists(path: string): Promise<boolean>;
            };
        };
    };
    isAutoSaveOnSwitchEnabled(): boolean;
    isWarnOnUnsavedSwitchEnabled(): boolean;
    isVersionHistoryEnabled(): boolean;
    isGroupFeatureEnabled(): boolean;
    getOrderedGroups(): Array<{ id: string; name: string }>;
    setAutoSaveOnSwitch(enabled: boolean): Promise<boolean>;
    setWarnOnUnsavedSwitch(enabled: boolean): Promise<boolean>;
    setConfirmQuickActions(enabled: boolean): Promise<boolean>;
    setConfirmDeleteByHotkey(enabled: boolean): Promise<boolean>;
    setVersionHistoryEnabled(enabled: boolean): Promise<boolean>;
    setGroupFeatureEnabled(enabled: boolean): Promise<boolean>;
    [key: string]: unknown;
}

async function createMenusPlugin(
    initialData?: Partial<MenusPlugin['data']>,
): Promise<MenusPlugin> {
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

    const plugin = new (PluginMock as unknown as { new(): MenusPlugin })();

    plugin.data = {
        ...DEFAULT_DATA,
        autoSaveOnSwitch: false,
        warnOnUnsavedSwitch: false,
        confirmQuickActions: false,
        confirmDeleteByHotkey: true,
        versionHistoryEnabled: false,
        groupFeatureEnabled: true,
        sessions: {
            s1: { id: 's1', name: 'Work Project' },
            s2: { id: 's2', name: 'Personal Notes' },
        },
        groups: {
            g1: { id: 'g1', name: 'Focus' },
        },
        groupOrder: ['g1'],
        sessionGroups: { s1: ['g1'] },
        ...(initialData || {}),
    };

    plugin.app = {
        vault: {
            adapter: {
                exists: (): Promise<boolean> => Promise.resolve(false),
            },
        },
        setting: {
            openTabById: (): void => {},
        },
    };
    plugin.updateStatusBar = (): void => {};
    plugin.persistData = (): Promise<void> => Promise.resolve();

    return plugin;
}

test('Session context menu renders Save and Reload for active session when auto-save is off', async () => {
    const h = setupHarness();
    try {
        const plugin = await createMenusPlugin({ autoSaveOnSwitch: false });
        const menuModRaw: unknown = await import('../../src/session-context-menu.js');
        const sessionMenu = menuModRaw as { openSessionContextMenu(opts: unknown): void };

        let saveCalled = false;
        let reloadCalled = false;

        sessionMenu.openSessionContextMenu({
            plugin,
            app: plugin.app,
            session: plugin.data.sessions.s1,
            isActive: true,
            onSave: () => { saveCalled = true; },
            onReload: () => { reloadCalled = true; },
        });

        const menu = h.obsidian.menus[0];
        assert.ok(menu, 'Menu must be created');

        const itemTitles = menu.items.map((it) => it.title);
        assert.ok(itemTitles.some((t) => /Save/i.test(t)), 'Must include Save item');
        assert.ok(itemTitles.some((t) => /Reload/i.test(t)), 'Must include Reload item');

        // Click Save
        const saveItem = menu.items.find((it) => /Save/i.test(it.title));
        assert.ok(saveItem);
        saveItem.trigger();
        assert.equal(saveCalled, true, 'onSave callback must be invoked');

        // Click Reload
        const reloadItem = menu.items.find((it) => /Reload/i.test(it.title));
        assert.ok(reloadItem);
        reloadItem.trigger();
        assert.equal(reloadCalled, true, 'onReload callback must be invoked');
    } finally {
        h.restore();
    }
});

test('Session context menu renders Switch, Rename, Duplicate, Delete for non-active session', async () => {
    const h = setupHarness();
    try {
        const plugin = await createMenusPlugin({ autoSaveOnSwitch: true });
        const menuModRaw: unknown = await import('../../src/session-context-menu.js');
        const sessionMenu = menuModRaw as { openSessionContextMenu(opts: unknown): void };

        let switched = false;
        let renamed = false;
        let duplicated = false;
        let deleted = false;

        sessionMenu.openSessionContextMenu({
            plugin,
            app: plugin.app,
            session: plugin.data.sessions.s2,
            isActive: false,
            showSwitch: true,
            onSwitch: () => { switched = true; },
            onRename: () => { renamed = true; },
            onDuplicate: () => { duplicated = true; },
            onDelete: () => { deleted = true; },
        });

        const menu = h.obsidian.menus[0];
        assert.ok(menu);

        const switchItem = menu.items.find((it) => /Switch/i.test(it.title));
        assert.ok(switchItem);
        switchItem.trigger();
        assert.equal(switched, true);

        const renameItem = menu.items.find((it) => /Rename/i.test(it.title));
        assert.ok(renameItem);
        renameItem.trigger();
        assert.equal(renamed, true);

        const duplicateItem = menu.items.find((it) => /Duplicate/i.test(it.title));
        assert.ok(duplicateItem);
        duplicateItem.trigger();
        assert.equal(duplicated, true);

        const deleteItem = menu.items.find((it) => /Delete/i.test(it.title));
        assert.ok(deleteItem);
        deleteItem.trigger();
        assert.equal(deleted, true);
    } finally {
        h.restore();
    }
});

test('Settings context menu toggles features and notifies onChanged callback', async () => {
    const h = setupHarness();
    try {
        const plugin = await createMenusPlugin({
            autoSaveOnSwitch: false,
            versionHistoryEnabled: false,
        });
        const settingsMenuModRaw: unknown = await import('../../src/settings-context-menu.js');
        const settingsMenu = settingsMenuModRaw as { openSettingsContextMenu(opts: unknown): void };

        let changedCount = 0;

        settingsMenu.openSettingsContextMenu({
            plugin,
            app: plugin.app,
            onChanged: () => { changedCount += 1; },
        });

        const menu = h.obsidian.menus[0];
        assert.ok(menu);

        // Find and trigger Auto-save toggle
        const autoSaveItem = menu.items.find((it) => /Auto-save/i.test(it.title));
        assert.ok(autoSaveItem);

        await autoSaveItem.trigger();
        await new Promise<void>((resolve) => { setTimeout(resolve, 20); });

        assert.equal(plugin.data.autoSaveOnSwitch, true, 'Auto-save should toggle to true');
        assert.equal(changedCount, 1, 'onChanged callback should be called');
    } finally {
        h.restore();
    }
});
