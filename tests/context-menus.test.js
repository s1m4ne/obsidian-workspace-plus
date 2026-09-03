'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { setupHarness } = require('./lock/harness/index.ts');

const harness = setupHarness();
const { L, resolveLocale } = require('../src/i18n.ts');
const { openSessionContextMenu } = require('../src/session-context-menu-items.ts');
const { openSettingsContextMenu } = require('../src/settings-context-menu-items.ts');
const { SettingsState } = require('../src/state/settings-state.ts');

resolveLocale('en');

function resetHarness() {
    harness.obsidian.menus.length = 0;
    harness.obsidian.notices.length = 0;
    harness.obsidian.log.clear();
}

function menu() {
    const created = harness.obsidian.menus[0];
    assert.ok(created, 'a Menu must be created');
    return created;
}

function wasChecked(created, title) {
    const index = created.items.findIndex((item) => item.title === title);
    assert.notEqual(index, -1, `missing menu item: ${title}`);
    return harness.obsidian.log.entries().some((entry) => (
        entry.target === `Menu.item[${index}]`
        && entry.method === 'setChecked'
        && entry.args[0] === true
    ));
}

function createPlugin(overrides = {}) {
    const { data: dataOverrides = {}, ...pluginOverrides } = overrides;
    const calls = [];
    const data = {
        sessions: {
            active: { id: 'active', name: 'Active', layout: {} },
            other: { id: 'other', name: 'Other', layout: {} },
        },
        sessionGroups: { active: ['g1'] },
        groups: { g1: { id: 'g1', name: 'Focus' } },
        autoSaveOnSwitch: false,
        warnOnUnsavedSwitch: false,
        confirmQuickActions: false,
        confirmDeleteByHotkey: true,
        versionHistoryEnabled: false,
        groupFeatureEnabled: false,
        showFilterInput: false,
    };
    const plugin = {
        app: {
            setting: {
                activeTab: undefined,
                open() { calls.push('openSettings'); },
                openTabById(tabId) { calls.push(['openTab', tabId]); },
            },
        },
        data,
        manifest: { id: 'workspace-plus-plus', name: 'Workspace++' },
        // Saving goes through plugin.getSessionSaver(). This double records the
        // save methods itself, so it stands in as its own saver.
        getSessionSaver() { return this; },
        isAutoSaveOnSwitchEnabled() { return this.data.autoSaveOnSwitch; },
        isWarnOnUnsavedSwitchEnabled() { return this.data.warnOnUnsavedSwitch; },
        // Version history goes through getHistoryService(); this double carries those members itself.
        getHistoryService() { return this; },
        isVersionHistoryEnabled() { return this.data.versionHistoryEnabled; },
        // Group calls go through plugin.getGroupStore() now. This double records
        // the group methods itself, so it is its own group store and every
        // assertion below still names the same calls.
        getGroupStore() { return this; },
        isGroupFeatureEnabled() { return this.data.groupFeatureEnabled; },
        getOrderedGroups() { return [this.data.groups.g1]; },
        setAutoSaveOnSwitch(enabled) {
            calls.push(['autoSave', enabled]);
            this.data.autoSaveOnSwitch = enabled;
            return Promise.resolve();
        },
        // The menu both writes and reads through plugin.getSettingsState() now.
        // Writes stay on this double so the assertions below still name the
        // same calls; reads fall through to a real SettingsState over this same
        // `data`, so the checkmarks reflect the owner's effective values.
        getSettingsState() { return settingsFacade; },
        setWarnOnUnsavedSwitch(enabled) {
            calls.push(['warnUnsaved', enabled]);
            this.data.warnOnUnsavedSwitch = enabled;
            return Promise.resolve();
        },
        setConfirmQuickActions(enabled) {
            calls.push(['confirmQuick', enabled]);
            this.data.confirmQuickActions = enabled;
            return Promise.resolve();
        },
        setConfirmDeleteByHotkey(enabled) {
            calls.push(['confirmDelete', enabled]);
            this.data.confirmDeleteByHotkey = enabled;
            return Promise.resolve();
        },
        setVersionHistoryEnabled(enabled) {
            calls.push(['versionHistory', enabled]);
            this.data.versionHistoryEnabled = enabled;
            return Promise.resolve();
        },
        setGroupFeatureEnabled(enabled) {
            calls.push(['groups', enabled]);
            this.data.groupFeatureEnabled = enabled;
            return Promise.resolve();
        },
        setShowFilterInput(enabled) {
            calls.push(['filter', enabled]);
            this.data.showFilterInput = enabled;
            return Promise.resolve();
        },
        extractSessionData() {
            calls.push('extractSessionData');
            return { sessions: this.data.sessions };
        },
        prepareRotationBackupData(sessionData) {
            calls.push(['prepareRotationBackupData', sessionData]);
            return { backup: true };
        },
        ensureDir(path) { calls.push(['ensureDir', path]); return Promise.resolve(); },
        getBackupsDirPath() { return 'backups'; },
        copyFileIfExists(from, to) { calls.push(['copy', from, to]); return Promise.resolve(); },
        getRotationBackupPath(number) { return `backup-${number}`; },
        writeJson(path, contents) { calls.push(['writeJson', path, contents]); return Promise.resolve(); },
        _lastRotationBackupAt: 0,
    };

    Object.assign(data, dataOverrides);
    Object.assign(plugin, pluginOverrides);

    const realSettingsState = new SettingsState({ data, persistData: async () => true });
    const settingsFacade = new Proxy({}, {
        get(_target, prop) {
            // `set*` is the write surface the assertions count; everything else
            // is a read and comes from the owner.
            if (typeof prop === 'string' && prop.startsWith('set') && typeof plugin[prop] === 'function') {
                return plugin[prop].bind(plugin);
            }
            const value = realSettingsState[prop];
            return typeof value === 'function' ? value.bind(realSettingsState) : value;
        },
    });

    return { plugin, calls };
}

function openSessionMenu(plugin, options = {}) {
    openSessionContextMenu({
        plugin,
        app: plugin.app,
        session: plugin.data.sessions.active,
        event: { type: 'contextmenu' },
        ...options,
    });
    return menu();
}

function openSettingsMenu(plugin, options = {}) {
    openSettingsContextMenu({ plugin, app: plugin.app, event: { type: 'contextmenu' }, ...options });
    return menu();
}

test('session menu shows manual save actions only for the active session with auto-save off', () => {
    resetHarness();
    const { plugin } = createPlugin({ data: { autoSaveOnSwitch: false } });
    const manual = openSessionMenu(plugin, { isActive: true, showSaveAs: true });
    assert.ok(manual.item(L.contextSaveSession));
    assert.ok(manual.item(L.contextReloadSession));
    assert.ok(manual.item(L.cmdSaveAs));

    plugin.data.autoSaveOnSwitch = true;
    // Reopen after changing the setting: no other fixture setting controls this group.
    resetHarness();
    const autoSave = openSessionMenu(plugin, { isActive: true, showSaveAs: true });
    assert.equal(autoSave.item(L.contextSaveSession), undefined);
    assert.equal(autoSave.item(L.contextReloadSession), undefined);
    assert.equal(autoSave.item(L.cmdSaveAs), undefined);
});

test('session menu gates switch, history, and group actions in both directions', () => {
    resetHarness();
    const { plugin } = createPlugin({ data: { versionHistoryEnabled: false } });
    const excluded = openSessionMenu(plugin, { isActive: true, showSwitch: true });
    assert.equal(excluded.item(L.contextSwitchSession), undefined);
    assert.equal(excluded.item(L.contextVersionHistory), undefined);
    assert.equal(excluded.item(L.groupRemoveFromGroup), undefined);
    assert.equal(excluded.item(L.groupMoveToGroup), undefined);

    resetHarness();
    plugin.data.versionHistoryEnabled = true;
    const included = openSessionMenu(plugin, {
        isActive: false,
        showSwitch: true,
        showRemoveFromGroup: true,
        showMoveToGroup: true,
    });
    assert.ok(included.item(L.contextSwitchSession));
    assert.ok(included.item(L.contextVersionHistory));
    assert.ok(included.item(L.groupRemoveFromGroup));
    assert.ok(included.item(L.groupMoveToGroup));
    assert.ok(included.item(L.groupMoveToGroup)?.submenu?.item('Focus'));
});

test('session menu dispatches the displayed callbacks, including a selected group', () => {
    resetHarness();
    const { plugin } = createPlugin({ data: { versionHistoryEnabled: true } });
    const calls = [];
    const created = openSessionMenu(plugin, {
        isActive: false,
        showSwitch: true,
        showMoveToGroup: true,
        onSwitch() { calls.push('switch'); },
        onVersionHistory() { calls.push('history'); },
        onMoveToGroup(groupId) { calls.push(['move', groupId]); },
    });
    created.item(L.contextSwitchSession).trigger();
    created.item(L.contextVersionHistory).trigger();
    created.item(L.groupMoveToGroup).submenu.item('Focus').trigger();
    assert.deepEqual(calls, ['switch', 'history', ['move', 'g1']]);
});

test('every session menu entry runs its own action when chosen', () => {
    resetHarness();
    // Auto-save off and the row active, which is what puts the save group on the
    // menu at all.
    const { plugin } = createPlugin({ data: { autoSaveOnSwitch: false } });
    const calls = [];
    const created = openSessionMenu(plugin, {
        isActive: true,
        showSaveAs: true,
        showRemoveFromGroup: true,
        onSave() { calls.push('save'); },
        onReload() { calls.push('reload'); },
        onSaveAs() { calls.push('saveAs'); },
        onRename() { calls.push('rename'); },
        onDuplicate() { calls.push('duplicate'); },
        onRemoveFromGroup() { calls.push('removeFromGroup'); },
        onDelete() { calls.push('delete'); },
    });

    // Each entry is chosen once, in menu order. The previous test only proved
    // that entries appear; nothing had ever pressed these seven.
    created.item(L.contextSaveSession).trigger();
    created.item(L.contextReloadSession).trigger();
    created.item(L.cmdSaveAs).trigger();
    created.item(L.contextRenameSession).trigger();
    created.item(L.contextDuplicateSession).trigger();
    created.item(L.groupRemoveFromGroup).trigger();
    created.item(L.contextDeleteSession).trigger();

    assert.deepEqual(calls, [
        'save', 'reload', 'saveAs', 'rename', 'duplicate', 'removeFromGroup', 'delete',
    ], 'each entry reaches its own callback, and no other');
});

test('overwriting an inactive session with the current layout is offered only when it can be done', () => {
    resetHarness();
    const { plugin } = createPlugin({ data: { autoSaveOnSwitch: false } });
    const calls = [];

    // The entry exists for a session that is not the active one, while
    // switching does not save by itself, and only if the caller can handle it.
    const created = openSessionMenu(plugin, {
        isActive: false,
        onOverwriteWithCurrentLayout() { calls.push('overwrite'); },
    });
    created.item(L.contextSaveCurrentLayoutToThisSession).trigger();
    assert.deepEqual(calls, ['overwrite']);

    // Without a handler there is nothing to offer.
    resetHarness();
    const withoutHandler = openSessionMenu(plugin, { isActive: false });
    assert.equal(withoutHandler.item(L.contextSaveCurrentLayoutToThisSession), undefined);

    // And not on the active session, which has its own Save entry instead.
    resetHarness();
    const onActive = openSessionMenu(plugin, {
        isActive: true,
        onOverwriteWithCurrentLayout() { calls.push('overwrite'); },
    });
    assert.equal(onActive.item(L.contextSaveCurrentLayoutToThisSession), undefined);
});

test('customize clicks opens the plugin settings', () => {
    resetHarness();
    const { plugin } = createPlugin();
    const opened = [];
    plugin.app = { setting: { open() {}, openTabById(id) { opened.push(id); } } };
    const created = openSessionMenu(plugin, { showCustomizeClicks: true });

    created.item(L.contextCustomizeClicks).trigger();

    // The status-bar menu's only route into the settings. It used to preselect
    // the General tab; the tabs are gone, and the click actions are behind the
    // status-bar page now.
    assert.deepEqual(opened, [plugin.manifest.id]);
});

test('settings menu checks every toggle according to the current setting', () => {
    resetHarness();
    const { plugin: enabled } = createPlugin({ data: {
        autoSaveOnSwitch: true,
        confirmDeleteByHotkey: true,
        versionHistoryEnabled: true,
        groupFeatureEnabled: true,
        showFilterInput: true,
    } });
    const enabledMenu = openSettingsMenu(enabled);
    for (const title of [
        L.settingsAutoSaveOnSwitch,
        L.settingsConfirmDelete,
        L.settingsVersionHistoryEnabled,
        L.contextToggleGroups,
        L.settingsShowFilterInput,
    ]) assert.equal(wasChecked(enabledMenu, title), true, `${title} is checked when enabled`);
    assert.equal(enabledMenu.item(L.settingsWarnUnsavedSwitch), undefined);
    assert.equal(enabledMenu.item(L.settingsConfirmQuickActions), undefined);

    resetHarness();
    const { plugin: disabled } = createPlugin({ data: {
        autoSaveOnSwitch: false,
        warnOnUnsavedSwitch: false,
        confirmQuickActions: false,
        confirmDeleteByHotkey: false,
        versionHistoryEnabled: false,
        groupFeatureEnabled: false,
        showFilterInput: false,
    } });
    const disabledMenu = openSettingsMenu(disabled);
    for (const title of [
        L.settingsAutoSaveOnSwitch,
        L.settingsWarnUnsavedSwitch,
        L.settingsConfirmQuickActions,
        L.settingsConfirmDelete,
        L.settingsVersionHistoryEnabled,
        L.contextToggleGroups,
        L.settingsShowFilterInput,
    ]) assert.equal(wasChecked(disabledMenu, title), false, `${title} is not checked when disabled`);
});

test('settings menu hides manual-save toggles and reset action unless their conditions allow them', () => {
    resetHarness();
    const { plugin } = createPlugin({ data: { autoSaveOnSwitch: true } });
    const automatic = openSettingsMenu(plugin);
    assert.equal(automatic.item(L.settingsWarnUnsavedSwitch), undefined);
    assert.equal(automatic.item(L.settingsConfirmQuickActions), undefined);
    assert.equal(automatic.item(L.contextResetOverlayPosition), undefined);

    resetHarness();
    plugin.data.autoSaveOnSwitch = false;
    const manual = openSettingsMenu(plugin, { showResetOverlay: true });
    assert.ok(manual.item(L.settingsWarnUnsavedSwitch));
    assert.ok(manual.item(L.settingsConfirmQuickActions));
    assert.ok(manual.item(L.contextResetOverlayPosition));
});

test('settings menu invokes each toggle, refresh callback, reset callback, and backup sequence', async () => {
    resetHarness();
    const { plugin, calls } = createPlugin({ data: {
        autoSaveOnSwitch: false,
        warnOnUnsavedSwitch: false,
        confirmQuickActions: false,
        confirmDeleteByHotkey: false,
        versionHistoryEnabled: false,
        groupFeatureEnabled: false,
        showFilterInput: false,
    } });
    let changed = 0;
    let reset = 0;
    const created = openSettingsMenu(plugin, {
        showResetOverlay: true,
        onChanged() { changed += 1; },
        onResetOverlay() { reset += 1; },
    });

    for (const title of [
        L.settingsAutoSaveOnSwitch,
        L.settingsWarnUnsavedSwitch,
        L.settingsConfirmQuickActions,
        L.settingsConfirmDelete,
        L.settingsVersionHistoryEnabled,
        L.contextToggleGroups,
        L.settingsShowFilterInput,
    ]) await created.item(title).trigger();
    created.item(L.contextResetOverlayPosition).trigger();
    created.item(L.rotationBackupCreate).trigger();
    await new Promise((resolve) => setImmediate(resolve));

    assert.deepEqual(calls.slice(0, 7), [
        ['autoSave', true],
        ['warnUnsaved', true],
        ['confirmQuick', true],
        ['confirmDelete', true],
        ['versionHistory', true],
        ['groups', true],
        ['filter', true],
    ]);
    assert.equal(changed, 7);
    assert.equal(reset, 1);
    assert.ok(calls.some((call) => Array.isArray(call) && call[0] === 'writeJson'));
});

test.after(() => harness.restore());
