'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { setupHarness } = require('./lock/harness/index.ts');

function componentFor(h, name, kind) {
    const setting = h.obsidian.settings.find((entry) => entry.nameEl.textContent === name);
    assert.ok(setting, `missing setting: ${name}`);
    const component = setting.components.find((entry) => entry.constructor.name === kind);
    assert.ok(component, `missing ${kind} for ${name}`);
    return component;
}

function buttonFor(h, name) {
    return componentFor(h, name, 'ButtonStub');
}

function toggleFor(h, name) {
    return componentFor(h, name, 'ToggleStub');
}

function confirmOrCancel(h, index) {
    const buttons = h.dom.document.querySelectorAll('.modal-container button');
    assert.equal(buttons.length, 2, 'confirmation modal has cancel and confirm controls');
    buttons[index].click();
}

function createPlugin(overrides = {}) {
    const calls = [];
    const data = {
        language: 'en', statusBarActions: {}, autoSaveOnSwitch: false,
        warnOnUnsavedSwitch: false, confirmQuickActions: false,
        statusBarModScrollSwitch: true, statusBarScrollPreset: 'custom',
        statusBarScrollModifierMode: 'none', statusBarScrollThreshold: 30,
        statusBarScrollCooldownMs: 500, statusBarScrollResetMs: 250,
        statusBarScrollInvert: false, showActiveSwitchCommand: false,
        numberedSwitchCommands: false, previewNext: false, previewPrevious: false,
        showFilterInput: false, overlayDefaultFocus: 'current-session',
        confirmDeleteByHotkey: true, versionHistoryEnabled: true,
        versionHistoryConfirmRestore: false,
        ...overrides.data,
    };
    const promiseCall = (name, update) => (...args) => {
        calls.push([name, ...args]);
        if (update) update(...args);
        return Promise.resolve(true);
    };
    const plugin = {
        // Session state goes through getSessionStore(); this double carries
        // those members itself, so it stands in as its own store.
        getSessionStore() { return this; },
        data,
        manifest: { name: 'Workspace++' },
        app: { setting: { activeTab: null, openTabById() {} } },
        // Saving goes through plugin.getSessionSaver(). This double records the
        // save methods itself, so it stands in as its own saver.
        getSessionSaver() { return this; },
        isAutoSaveOnSwitchEnabled() { return data.autoSaveOnSwitch; },
        isWarnOnUnsavedSwitchEnabled() { return data.warnOnUnsavedSwitch; },
        isUnsavedStatusBarHighlightEnabled() { return false; },
        isSidebarRestoreEnabled() { return false; },
        // Version history goes through getHistoryService(); this double carries those members itself.
        getHistoryService() { return this; },
        isVersionHistoryEnabled() { return data.versionHistoryEnabled; },
        isVersionHistoryConfirmRestoreEnabled() { return data.versionHistoryConfirmRestore; },
        // Group calls go through plugin.getGroupStore() now. This double records
        // the group methods itself, so it is its own group store and every
        // assertion below still names the same calls.
        getGroupStore() { return this; },
        isGroupFeatureEnabled() { return false; },
        getVersionHistorySnapshotInterval() { return 5; },
        getRotationBackupInfo() { return Promise.resolve([{ generation: 1, savedAt: 0, sessionCount: 1 }]); },
        getOrderedGroups() { return []; },
        getGroupSessionIds() { return []; },
        getSessionsPath() { return 'sessions.json'; },
        getSessionStorageLocation() { return data.storageLocation || 'plugin-folder'; },
        getStorageDiagnosticsInfo() { return { updatedAt: 0, sessionsPath: 's', sessionsBackupPath: 'b', historyPath: 'h', sessionCount: 1, syncedByObsidianSync: false }; },
        getSessionStorageSize() { return Promise.resolve(100); },
        extractSessionData() { calls.push(['extract']); return {}; },
        prepareRotationBackupData(value) { calls.push(['prepare', value]); return value; },
        ensureDir: promiseCall('ensureDir'), getBackupsDirPath() { return 'backups'; },
        copyFileIfExists: promiseCall('copy'), getRotationBackupPath(number) { return `backup-${number}`; },
        writeJson: promiseCall('writeJson'),
        exportSessionsSnapshot: promiseCall('export'),
        importSessionsFromLatestExport: promiseCall('import'),
        restoreFromRotationBackup: promiseCall('restore'),
        // The settings screen writes through plugin.getSettingsState() now. This
        // double records the setters itself, so it is its own settings state and
        // every assertion below still names the same calls.
        getSettingsState() { return this; },
        setLanguageSetting: promiseCall('language', (value) => { data.language = value; }),
        setStatusBarAction: promiseCall('statusAction'),
        setAutoSaveOnSwitch: promiseCall('autoSave', (value) => { data.autoSaveOnSwitch = value; }),
        setWarnOnUnsavedSwitch: promiseCall('warn'), setUnsavedStatusBarHighlight: promiseCall('highlight'),
        setConfirmQuickActions: promiseCall('confirmQuick'), setRestoreSidebars: promiseCall('restoreSidebars'),
        setStatusBarModScrollSwitch: promiseCall('modScroll'), setStatusBarScrollPreset: promiseCall('preset'),
        setStatusBarScrollModifierMode: promiseCall('modifier'), setStatusBarScrollThreshold: promiseCall('threshold'),
        setStatusBarScrollCooldownMs: promiseCall('cooldown'), setStatusBarScrollResetMs: promiseCall('resetWindow'),
        setStatusBarScrollInvert: promiseCall('invert'), setShowActiveSwitchCommand: promiseCall('activeCommand'),
        setNumberedSwitchCommands: promiseCall('numbered'), setSwitchPreviewEnabled: promiseCall('preview'),
        setPreviewNext: promiseCall('previewNext'), setPreviewPrevious: promiseCall('previewPrevious'),
        setShowFilterInput: promiseCall('filter'), setOverlayDefaultFocus: promiseCall('focus'),
        setConfirmDeleteByHotkey: promiseCall('confirmDelete'), setVersionHistoryEnabled: promiseCall('history'),
        setVersionHistorySnapshotInterval: promiseCall('interval'), setVersionHistoryConfirmRestore: promiseCall('confirmRestore'),
        setSessionStorageLocation: promiseCall('storage', (value) => { data.storageLocation = value; }),
        resetSettingsToDefault: promiseCall('resetSettings'), resetSessionsToDefault: promiseCall('resetSessions'),
        clearBackupsAndVersionHistory: promiseCall('clearBackups'),
        resetSessionsAndSettingsToDefault: promiseCall('resetEverything'),
        ...overrides.plugin,
    };
    return { plugin, calls };
}

function load(h) {
    const { resolveLocale, L } = require('../src/i18n.ts');
    resolveLocale('en');
    const { WorkspacePlusPlusSettingTab } = require('../src/settings-tab.ts');
    return { WorkspacePlusPlusSettingTab, L };
}

test('danger reset builder confirms before running, cancels safely, and suppresses double execution', async () => {
    const h = setupHarness();
    try {
        const { addDangerResetSetting } = require('../src/settings-ui.ts');
        let runs = 0;
        let resolveRun;
        const run = () => { runs += 1; return new Promise((resolve) => { resolveRun = resolve; }); };
        addDangerResetSetting(h.dom.document.body, {}, () => {}, {
            name: 'Erase', desc: 'irreversible', buttonText: 'Erase', confirmMessage: 'Confirm',
            run, successNotice: 'done', failureNotice: 'failed',
        });
        h.obsidian.settings[0].components[0].trigger();
        assert.equal(runs, 0, 'opening a confirmation must not execute the destructive callback');
        confirmOrCancel(h, 0);
        assert.equal(runs, 0, 'cancelling must not execute the destructive callback');
        h.obsidian.settings[0].components[0].trigger();
        confirmOrCancel(h, 1);
        h.obsidian.settings[0].components[0].trigger();
        assert.equal(runs, 1, 'isRunning prevents a second confirmed operation');
        assert.equal(h.dom.document.querySelectorAll('.modal-container').length, 0,
            'isRunning prevents a second confirmation while the first operation is pending');
        resolveRun();
        await Promise.resolve(); await Promise.resolve();
        assert.deepEqual(h.obsidian.notices.map((notice) => notice.message), ['done']);
    } finally { h.restore(); }
});

test('danger reset builder reports failure only after a confirmed callback rejects', async () => {
    const h = setupHarness();
    try {
        const { addDangerResetSetting } = require('../src/settings-ui.ts');
        addDangerResetSetting(h.dom.document.body, {}, () => {}, {
            name: 'Erase', desc: 'irreversible', buttonText: 'Erase', confirmMessage: 'Confirm',
            run: () => Promise.reject(new Error('failed')), successNotice: 'done', failureNotice: 'failed',
        });
        h.obsidian.settings[0].components[0].trigger();
        confirmOrCancel(h, 1);
        await Promise.resolve(); await Promise.resolve();
        assert.deepEqual(h.obsidian.notices.map((notice) => notice.message), ['failed']);
    } finally { h.restore(); }
});

test('all settings tabs render and their selected controls dispatch to their dedicated setters', async () => {
    const h = setupHarness();
    try {
        const { WorkspacePlusPlusSettingTab, L } = load(h);
        const { plugin, calls } = createPlugin();
        const tab = new WorkspacePlusPlusSettingTab(plugin.app, plugin);
        for (const name of ['general', 'sessions', 'groups', 'advanced']) {
            tab.activeTab = name;
            tab.display();
        }
        assert.equal(tab.containerEl.querySelectorAll('.wpp-settings-tab').length, 4);
        tab.activeTab = 'sessions'; tab.display();
        await toggleFor(h, L.settingsAutoSaveOnSwitch).trigger(true);
        await componentFor(h, L.settingsStatusBarScrollPreset, 'DropdownStub').trigger('trackpad');
        tab.activeTab = 'advanced'; tab.display();
        await toggleFor(h, L.settingsVaultOnlySessions).trigger(true);
        assert.deepEqual(calls.filter((entry) => ['autoSave', 'preset', 'storage'].includes(entry[0])), [
            ['autoSave', true], ['preset', 'trackpad'], ['storage', 'vault-folder'],
        ]);
    } finally { h.restore(); }
});

test('storage-location toggle dispatches both directions and each reset button retains its distinct target', async () => {
    const h = setupHarness();
    try {
        const { WorkspacePlusPlusSettingTab, L } = load(h);
        const { plugin, calls } = createPlugin();
        const tab = new WorkspacePlusPlusSettingTab(plugin.app, plugin);
        tab.activeTab = 'advanced'; tab.display();
        await toggleFor(h, L.settingsVaultOnlySessions).trigger(true);
        await toggleFor(h, L.settingsVaultOnlySessions).trigger(false);
        for (const label of [
            L.settingsResetSettings, L.settingsResetSessions,
            L.settingsResetBackupsAndHistory, L.settingsResetSessionsAndSettings,
        ]) {
            buttonFor(h, label).trigger();
            confirmOrCancel(h, 1);
            await Promise.resolve(); await Promise.resolve();
        }
        assert.deepEqual(calls.filter((entry) => entry[0] === 'storage'), [
            ['storage', 'vault-folder'], ['storage', 'plugin-folder'],
        ]);
        assert.deepEqual(calls.filter((entry) => (entry.length === 1 && entry[0].startsWith('reset')) || entry[0] === 'clearBackups').map((entry) => entry[0]), [
            'resetSettings', 'resetSessions', 'clearBackups', 'resetEverything',
        ]);
    } finally { h.restore(); }
});

test('advanced export, import confirmation, rotation backup and restore use their success paths', async () => {
    const h = setupHarness();
    try {
        const { WorkspacePlusPlusSettingTab, L } = load(h);
        const { plugin, calls } = createPlugin();
        const tab = new WorkspacePlusPlusSettingTab(plugin.app, plugin);
        tab.activeTab = 'advanced'; tab.display();
        buttonFor(h, L.settingsExportSessions).trigger();
        buttonFor(h, L.settingsImportSessions).trigger(); confirmOrCancel(h, 1);
        tab.activeTab = 'sessions'; tab.display();
        await Promise.resolve();
        const allButtons = h.obsidian.settings.flatMap((setting) => setting.components)
            .filter((component) => component.constructor.name === 'ButtonStub');
        allButtons.at(-1).trigger(); confirmOrCancel(h, 1);
        buttonFor(h, L.rotationBackupCreate).trigger();
        await new Promise((resolve) => setTimeout(resolve, 10));
        for (const name of ['export', 'import', 'extract', 'prepare', 'ensureDir', 'writeJson', 'restore']) {
            assert.ok(calls.some((entry) => entry[0] === name), `missing ${name}`);
        }
    } finally { h.restore(); }
});

test('the General tab controls reach their own setters', async () => {
    const h = setupHarness();
    try {
        const { WorkspacePlusPlusSettingTab, L } = load(h);
        const { plugin, calls } = createPlugin();
        const tab = new WorkspacePlusPlusSettingTab(plugin.app, plugin);
        tab.activeTab = 'general'; tab.display();

        await componentFor(h, L.settingsLanguage, 'DropdownStub').trigger('ja');
        // Deliberately not the first slot: with `click` the assertion would still
        // pass if the slot key were hardcoded, and twelve slots share one builder.
        await componentFor(h, L.statusBarSlotModRightClick(), 'DropdownStub').trigger('sessionManager');

        assert.deepEqual(calls.filter((entry) => ['language', 'statusAction'].includes(entry[0])), [
            ['language', 'ja'],
            ['statusAction', 'modRightClick', 'sessionManager'],
        ], 'each control writes through its own setter, with its own arguments');
    } finally { h.restore(); }
});

test('a toggle that changes which rows exist redraws the tab', async () => {
    const h = setupHarness();
    try {
        const { WorkspacePlusPlusSettingTab, L } = load(h);
        const { plugin } = createPlugin();
        const tab = new WorkspacePlusPlusSettingTab(plugin.app, plugin);
        tab.activeTab = 'sessions'; tab.display();

        const names = () => h.obsidian.settings.map((setting) => setting.nameEl.textContent);
        assert.ok(names().includes(L.settingsWarnUnsavedSwitch), 'the dependent rows are there with auto-save off');

        // The toggle has to be found before the record is cleared, or there is
        // nothing left to click.
        const autoSaveToggle = toggleFor(h, L.settingsAutoSaveOnSwitch);
        h.obsidian.settings.length = 0;
        await autoSaveToggle.trigger(true);
        await Promise.resolve();

        // Three rows only make sense while switching does not save, so turning
        // auto-save on has to take them off the screen - which needs a redraw,
        // not just a stored value.
        //
        // The evidence has to be a row only a redraw draws. Counting rows does
        // not work: the rotation-backup list fills in asynchronously and lands
        // here whether or not anything was redrawn.
        assert.ok(
            names().includes(L.settingsAutoSaveOnSwitch),
            'the tab was drawn again, not merely left as it was',
        );
        assert.ok(
            !names().includes(L.settingsWarnUnsavedSwitch),
            'and the rows that no longer apply are gone from it',
        );
    } finally { h.restore(); }
});

test('a manual backup shifts the generations oldest-first so none is overwritten early', async () => {
    const h = setupHarness();
    try {
        const { WorkspacePlusPlusSettingTab, L } = load(h);
        const { plugin, calls } = createPlugin();
        const tab = new WorkspacePlusPlusSettingTab(plugin.app, plugin);
        tab.activeTab = 'sessions'; tab.display();
        await Promise.resolve();

        buttonFor(h, L.rotationBackupCreate).trigger();
        await new Promise((resolve) => setTimeout(resolve, 10));

        // 2 is copied to 3 before 1 is copied to 2. Reverse the two and
        // generation 2 is overwritten before it has been carried forward, so the
        // oldest backup a user has is the one that disappears.
        const copies = calls.filter((entry) => entry[0] === 'copy').map((entry) => entry.slice(1));
        assert.deepEqual(copies, [
            ['backup-2', 'backup-3'],
            ['backup-1', 'backup-2'],
        ]);

        // And only then is the newest written into slot 1.
        const writeIndex = calls.findIndex((entry) => entry[0] === 'writeJson');
        const lastCopyIndex = calls.map((entry) => entry[0]).lastIndexOf('copy');
        assert.ok(writeIndex > lastCopyIndex, 'slot 1 is written after it has been copied away');
        assert.deepEqual(calls[writeIndex].slice(1, 2), ['backup-1']);
    } finally { h.restore(); }
});

test('settings controls exercise both session layouts and the enabled group layout', async () => {
    const h = setupHarness();
    try {
        const { WorkspacePlusPlusSettingTab } = load(h);
        const { plugin } = createPlugin({ plugin: {
            isGroupFeatureEnabled() { return true; },
            getOrderedGroups() { return [{ id: 'g1', name: 'Focus' }]; },
            createGroupValidated() { return Promise.resolve(false); },
            renameGroupValidated() { return Promise.resolve(false); },
            deleteGroup() { return Promise.resolve(); },
        } });
        const tab = new WorkspacePlusPlusSettingTab(plugin.app, plugin);
        for (const autoSaveOnSwitch of [false, true]) {
            plugin.data.autoSaveOnSwitch = autoSaveOnSwitch;
            tab.activeTab = 'sessions';
            tab.display();
            const controls = h.obsidian.settings.flatMap((setting) => setting.components)
                .filter((component) => component.constructor.name === 'ToggleStub' || component.constructor.name === 'DropdownStub');
            for (const control of controls) {
                if (control.constructor.name === 'ToggleStub') await control.trigger(!control.value);
                else await control.trigger(control.options.keys().next().value);
            }
        }
        tab.activeTab = 'groups';
        tab.display();
        assert.ok(h.obsidian.settings.some((setting) => setting.nameEl.textContent === 'Focus'));
    } finally { h.restore(); }
});
