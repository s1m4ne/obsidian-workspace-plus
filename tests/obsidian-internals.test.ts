import test from 'node:test';
import assert from 'node:assert/strict';
import {
    getHotkeyManager,
    getSetting,
    openSettingTab,
    openHotkeysSetting,
    getCommandHotkeys,
    type AppWithInternals,
    type ObsidianSettingTabInstance,
} from '../src/platform/obsidian-internals.ts';
import type { App, Hotkey } from 'obsidian';

test('obsidian internals: getHotkeyManager and getSetting return null when absent', () => {
    const fakeApp = {} as App;
    assert.equal(getHotkeyManager(fakeApp), null);
    assert.equal(getSetting(fakeApp), null);
});

test('obsidian internals: openSettingTab opens settings and tab', () => {
    let opened = false;
    let openedTab = '';
    const tabInstance: ObsidianSettingTabInstance = { id: 'workspace-plus' };
    const fakeApp: AppWithInternals = {
        setting: {
            open() {
                opened = true;
            },
            openTabById(id: string) {
                openedTab = id;
                return tabInstance;
            },
        },
    } as unknown as AppWithInternals;

    const res = openSettingTab(fakeApp, 'workspace-plus');
    assert.equal(opened, true);
    assert.equal(openedTab, 'workspace-plus');
    assert.equal(res, tabInstance);
});

test('obsidian internals: openHotkeysSetting opens hotkeys tab and sets search query', () => {
    let opened = false;
    let openedTab = '';
    let searchVal = '';
    let changeNotified = false;

    const fakeApp: AppWithInternals = {
        setting: {
            open() {
                opened = true;
            },
            openTabById(id: string) {
                openedTab = id;
                return this.activeTab;
            },
            activeTab: {
                searchComponent: {
                    setValue(val: string) {
                        searchVal = val;
                        return this;
                    },
                    onChanged() {
                        changeNotified = true;
                    },
                },
            },
        },
    } as unknown as AppWithInternals;

    openHotkeysSetting(fakeApp, 'Workspace++: next');
    assert.equal(opened, true);
    assert.equal(openedTab, 'hotkeys');
    assert.equal(searchVal, 'Workspace++: next');
    assert.equal(changeNotified, true);
});

test('obsidian internals: getCommandHotkeys returns custom or default hotkeys', () => {
    const customHotkey: Hotkey = { modifiers: ['Mod'], key: 'Enter' };
    const defaultHotkey: Hotkey = { modifiers: ['Mod', 'Shift'], key: 'Enter' };

    const appWithCustom: AppWithInternals = {
        hotkeyManager: {
            getHotkeys(cmd: string) {
                return cmd === 'plugin:custom' ? [customHotkey] : [];
            },
            getDefaultHotkeys(cmd: string) {
                return cmd === 'plugin:default' ? [defaultHotkey] : [];
            },
        },
    } as unknown as AppWithInternals;

    assert.deepEqual(getCommandHotkeys(appWithCustom, 'plugin:custom'), [customHotkey]);
    assert.deepEqual(getCommandHotkeys(appWithCustom, 'plugin:default'), [defaultHotkey]);
    assert.equal(getCommandHotkeys(appWithCustom, 'plugin:none'), null);
});
