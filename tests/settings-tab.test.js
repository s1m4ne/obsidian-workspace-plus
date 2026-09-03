'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { setupHarness } = require('./lock/harness/index.ts');

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
        showFilterInput: false,
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
        // Version history goes through getHistoryService(); this double carries those members itself.
        getHistoryService() { return this; },
        isVersionHistoryEnabled() { return data.versionHistoryEnabled; },
        isVersionHistoryConfirmRestoreEnabled() { return data.versionHistoryConfirmRestore; },
        // Group calls go through plugin.getGroupStore() now. This double records
        // the group methods itself, so it is its own group store and every
        // assertion below still names the same calls.
        getGroupStore() { return this; },
        isGroupFeatureEnabled() { return false; },
        setGroupFeatureEnabled: promiseCall('groupFeature'),
        setGroupTabOrder: promiseCall('groupOrder'),
        createGroupValidated: promiseCall('createGroup'),
        renameGroupValidated: promiseCall('renameGroup'),
        deleteGroup: promiseCall('deleteGroup'),
        getVersionHistorySnapshotInterval() { return 5; },
        // The backup pool as a directory, so the settings screen exercises the
        // real listing rather than a canned answer.
        backupFiles: new Map(overrides.backupFiles ?? [[
            'backups/sessions.1700000000000.json',
            { _wppSavedAt: 1700000000000, sessions: { s1: {} } },
        ]]),
        getBackupsDirPath() { return 'backups'; },
        getRotationBackupPath(generation) { return `backups/sessions.${generation}.json`; },
        getBackupGenerations() { return this.getSettingsState().rotationBackupGenerations; },
        removeIfExists(path) { calls.push(['remove', path]); this.backupFiles.delete(path); return Promise.resolve(); },
        listDir(dir) {
            const prefix = `${dir}/`;
            return Promise.resolve({
                files: [...this.backupFiles.keys()].filter((path) => path.startsWith(prefix)),
                folders: [],
            });
        },
        statSize(path) {
            const stored = this.backupFiles.get(path);
            return Promise.resolve(stored === undefined ? null : JSON.stringify(stored).length);
        },
        ensureDir: promiseCall('ensureDir'),
        writeJson(path, data) {
            calls.push(['writeJson', path]);
            this.backupFiles.set(path, data);
            return Promise.resolve(true);
        },
        getRotationBackupInfo() {
            const { listRotationBackups } = require('../src/storage/backup-store.ts');
            return listRotationBackups(plugin);
        },
        pruneRotationBackups() {
            const { pruneRotationBackups } = require('../src/storage/backup-store.ts');
            return pruneRotationBackups(plugin);
        },
        // What generation 1 already holds. `null` data means "no backup
        // there", which is what makes a manual backup rotate.
        readJsonIfExists(path) {
            calls.push(['readJson', path]);
            const stored = this.backupFiles.get(path);
            return Promise.resolve(stored === undefined
                ? { exists: false, data: null, error: null }
                : { exists: true, data: stored, error: null });
        },
        getOrderedGroups() { return []; },
        getGroupSessionIds() { return []; },
        getSessionsPath() { return 'sessions.json'; },
        getSessionStorageLocation() { return data.storageLocation || 'plugin-folder'; },
        getStorageDiagnosticsInfo() { return { updatedAt: 0, sessionsPath: 's', sessionsBackupPath: 'b', historyPath: 'h', sessionCount: 1, syncedByObsidianSync: false }; },
        getSessionStorageSize() { return Promise.resolve(100); },
        extractSessionData() { calls.push(['extract']); return {}; },
        prepareRotationBackupData(value) { calls.push(['prepare', value]); return value; },
        copyFileIfExists: promiseCall('copy'),
        exportSessionsSnapshot: promiseCall('export'),
        importSessionsFromLatestExport: promiseCall('import'),
        restoreFromRotationBackup: promiseCall('restore'),
        // The settings screen both writes and reads through
        // plugin.getSettingsState() now. Writes stay on this double so the
        // assertions below still name the same calls; reads fall through to a
        // real SettingsState over this same `data`, so the screen is seeded
        // with the owner's effective values - defaults included - rather than
        // with whatever a hand-written stub happened to return.
        getSettingsState() { return settingsFacade; },
        setLanguageSetting: promiseCall('language', (value) => { data.language = value; }),
        setStatusBarAction: promiseCall('statusAction'),
        setAutoSaveOnSwitch: promiseCall('autoSave', (value) => { data.autoSaveOnSwitch = value; }),
        setWarnOnUnsavedSwitch: promiseCall('warn'), setUnsavedStatusBarHighlight: promiseCall('highlight'),
        setConfirmQuickActions: promiseCall('confirmQuick'), setRestoreSidebars: promiseCall('restoreSidebars'),
        setStatusBarModScrollSwitch: promiseCall('modScroll'), setStatusBarScrollPreset: promiseCall('preset'),
        setStatusBarScrollModifierMode: promiseCall('modifier'), setStatusBarScrollThreshold: promiseCall('threshold'),
        setStatusBarScrollCooldownMs: promiseCall('cooldown'), setStatusBarScrollResetMs: promiseCall('resetWindow'),
        setStatusBarScrollInvert: promiseCall('invert'), setShowActiveSwitchCommand: promiseCall('activeCommand'),
        setNumberedSwitchCommands: promiseCall('numbered'), setSwitchPreviewEnabled: promiseCall('preview', (value) => {
            data.previewNext = value;
            data.previewPrevious = value;
        }),
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

    const { SettingsState } = require('../src/state/settings-state.ts');
    const realSettingsState = new SettingsState({ data, persistData: async () => true });
    const settingsFacade = new Proxy({}, {
        get(_target, prop) {
            // `set*` is the write surface and is what the assertions count;
            // everything else is a read and must come from the owner.
            if (typeof prop === 'string' && prop.startsWith('set') && typeof plugin[prop] === 'function') {
                return plugin[prop].bind(plugin);
            }
            if (typeof prop === 'string' && (prop.startsWith('reset') || prop.startsWith('clear'))) {
                return plugin[prop].bind(plugin);
            }
            const value = realSettingsState[prop];
            return typeof value === 'function' ? value.bind(realSettingsState) : value;
        },
    });

    return { plugin, calls };
}

function load(h) {
    const { resolveLocale, L } = require('../src/i18n.ts');
    resolveLocale('en');
    const { WorkspacePlusPlusSettingTab } = require('../src/settings-tab.ts');
    return { WorkspacePlusPlusSettingTab, L };
}

// --- walking the definition tree ----------------------------------------

/** A `visible` / `disabled` / `displayValue` field, resolved. */
function resolve(value) {
    return typeof value === 'function' ? value() : value;
}

function isGroup(item) {
    return item && (item.type === 'group' || item.type === 'list');
}

function isPage(item) {
    return item && item.type === 'page';
}

/** Every page in the tree, at any depth. */
function pages(items) {
    const found = [];
    for (const item of items) {
        if (isPage(item)) {
            found.push(item);
            found.push(...pages(item.items || []));
        } else if (isGroup(item)) {
            found.push(...pages(item.items || []));
        }
    }
    return found;
}

function pageNamed(items, name) {
    const page = pages(items).find((entry) => entry.name === name);
    assert.ok(page, `missing page: ${name}`);
    return page;
}

/** Every plain row (not a group, not a page) in the tree. */
function rows(items) {
    const found = [];
    for (const item of items) {
        if (isPage(item)) found.push(...rows(item.items || []));
        else if (isGroup(item)) found.push(...rows(item.items || []));
        else found.push(item);
    }
    return found;
}

function rowNamed(items, name) {
    const row = rows(items).find((entry) => entry.name === name);
    assert.ok(row, `missing row: ${name}`);
    return row;
}

function groupsIn(items) {
    const found = [];
    for (const item of items) {
        if (isPage(item)) found.push(...groupsIn(item.items || []));
        else if (isGroup(item)) {
            found.push(item);
            found.push(...groupsIn(item.items || []));
        }
    }
    return found;
}

/** The list a page owns, so its add/delete/reorder callbacks can be driven. */
function listIn(items) {
    const list = groupsIn(items).find((group) => group.type === 'list');
    assert.ok(list, 'missing list');
    return list;
}

/**
 * Let the two readings the screen starts - the backups and the storage size -
 * land before the harness is torn down. Their `then` calls `update()`, which
 * rebuilds the definitions; with the DOM globals already restored that throws
 * where no test can see it.
 */
function settle() {
    return new Promise((done) => setTimeout(done, 0));
}

/**
 * Draw one `render` row and hand back its recorded components.
 *
 * Obsidian calls `render` with a real `Setting`; the four resets, the backup
 * buttons and the group rename button all reach their button that way, so a
 * test that wants to press one has to render the row rather than read it.
 */
function renderRow(h, row) {
    const { Setting } = require('obsidian');
    const setting = new Setting(h.dom.container());
    row.render(setting);
    return setting;
}

function buttonOf(setting, text) {
    const button = setting.components.find((entry) => entry.constructor.name === 'ButtonStub');
    assert.ok(button, `no button on the row${text ? ` for ${text}` : ''}`);
    return button;
}

function makeTab(h, overrides) {
    const { WorkspacePlusPlusSettingTab, L } = load(h);
    const { plugin, calls } = createPlugin(overrides);
    const tab = new WorkspacePlusPlusSettingTab(h.dom.window, plugin);
    tab.containerEl = h.dom.container();
    return { tab, plugin, calls, L };
}

// --- the shape of the screen --------------------------------------------

test('the whole screen is data, and the six pages are part of it', async () => {
    const h = setupHarness();
    try {
        const { tab, L } = makeTab(h);
        const items = tab.getSettingDefinitions();

        // Nothing is left for display() to draw on its own: every top-level
        // entry is a group, which is what carries rows and pages.
        assert.ok(items.length > 0);
        for (const item of items) {
            assert.equal(item.type, 'group', `top-level entry is not a group: ${JSON.stringify(item).slice(0, 80)}`);
        }

        const names = pages(items).map((page) => page.name);
        for (const expected of [
            L.settingsSectionStatusBar,
            L.settingsSubsectionScrollSwitch,
            L.historyTitle,
            L.rotationBackupSectionTitle,
            L.settingsSectionGroups,
            L.settingsSectionStorage,
        ]) {
            assert.ok(names.includes(expected), `missing page: ${expected}`);
        }
    } finally { await settle(); h.restore(); }
});

test('there is no tab bar: no row draws its own DOM at the top of the screen', async () => {
    const h = setupHarness();
    try {
        const { tab } = makeTab(h);
        const items = tab.getSettingDefinitions();
        // `render` is still used - four reset buttons and a rename button need
        // it - but not for navigation, and never on an unnamed row, which is
        // what the tab bar was.
        const unnamedRenderRows = rows(items).filter((row) => row.render && !row.name);
        assert.deepEqual(unnamedRenderRows, []);
    } finally { await settle(); h.restore(); }
});

test('no door carries a summary; every one carries a description', async () => {
    const h = setupHarness();
    try {
        const { tab, plugin } = makeTab(h);
        tab.plugin = plugin;
        tab.getSettingDefinitions();
        await settle();
        const items = tab.getSettingDefinitions();

        // A figure on a door reads as something to act on, and none of them
        // were: how many of twelve slots are spoken for, which interval is set,
        // how many groups exist, when the last backup was taken.
        for (const page of pages(items)) {
            assert.equal(page.displayValue, undefined, `${page.name} still shows a summary`);
            assert.ok(page.desc, `${page.name} has no description`);
        }
        assert.equal(pages(items).length, 6, 'the six doors, and nothing nested behind them');
    } finally { await settle(); h.restore(); }
});

test('the status-bar page explains itself, in the locale', async () => {
    const h = setupHarness();
    try {
        const { tab, L } = makeTab(h);
        const page = pageNamed(tab.getSettingDefinitions(), L.settingsSectionStatusBar);
        assert.equal(page.desc, L.settingsSectionStatusBarDesc);
        assert.ok(page.desc.length > 0);
    } finally { await settle(); h.restore(); }
});

test('the twelve status-bar slots are all there, each bound to its own key', async () => {
    const h = setupHarness();
    try {
        const { tab, L } = makeTab(h);
        const page = pageNamed(tab.getSettingDefinitions(), L.settingsSectionStatusBar);
        const keys = rows([page]).map((row) => row.control.key);
        assert.equal(keys.length, 12);
        assert.equal(new Set(keys).size, 12);
        assert.ok(keys.every((key) => key.startsWith('statusBarActions.')));
    } finally { await settle(); h.restore(); }
});

test('the twelve slots are named, including the nine whose label depends on the platform', async () => {
    const h = setupHarness();
    try {
        const { tab, L } = makeTab(h);
        const page = pageNamed(tab.getSettingDefinitions(), L.settingsSectionStatusBar);

        for (const row of rows([page])) {
            assert.notEqual(row.name, '', `${row.control.key} has no label`);
        }

        // Nine of the twelve are builders: the modifier is a glyph on macOS and
        // a word elsewhere, so the label cannot be a stored string. `text()`
        // renders a builder as '', which left these rows nameless.
        const names = rows([page]).map((row) => row.name);
        assert.ok(
            names.some((name) => /\+/.test(name)),
            `no modifier label was built: ${JSON.stringify(names)}`,
        );
    } finally { await settle(); h.restore(); }
});

test('the modifier dropdown offers four named options, not three blanks', async () => {
    const h = setupHarness();
    try {
        const { tab, plugin, L } = makeTab(h);
        plugin.data.statusBarModScrollSwitch = true;
        const row = rowNamed(
            [pageNamed(tab.getSettingDefinitions(), L.settingsSubsectionScrollSwitch)],
            L.settingsStatusBarScrollModifier,
        );

        const labels = Object.values(row.control.options);
        assert.equal(labels.length, 4);
        for (const label of labels) assert.notEqual(label, '');
    } finally { await settle(); h.restore(); }
});

test('the switch-command group sits below the deletion group', async () => {
    const h = setupHarness();
    try {
        const { tab, L } = makeTab(h);
        const headings = tab.getSettingDefinitions()
            .filter((item) => item.type === 'group')
            .map((item) => item.heading);

        const deletion = headings.indexOf(L.settingsSectionDeletion);
        const commands = headings.indexOf(L.settingsSubsectionSwitchCommands);
        assert.ok(deletion >= 0 && commands >= 0, JSON.stringify(headings));
        assert.ok(commands > deletion, `commands at ${commands}, deletion at ${deletion}`);
    } finally { await settle(); h.restore(); }
});

// --- visible and disabled -----------------------------------------------

test('the unsaved-switch warnings are hidden while switching saves by itself', async () => {
    const h = setupHarness();
    try {
        const { tab, plugin, L } = makeTab(h);
        const warning = () => rowNamed(tab.getSettingDefinitions(), L.settingsWarnUnsavedSwitch);

        plugin.data.autoSaveOnSwitch = false;
        assert.equal(resolve(warning().visible), true);
        plugin.data.autoSaveOnSwitch = true;
        assert.equal(resolve(warning().visible), false);
    } finally { await settle(); h.restore(); }
});

test('the two preview directions are absent while the preview is off', async () => {
    const h = setupHarness();
    try {
        const { tab, plugin, L } = makeTab(h);
        const direction = (name) => rowNamed(tab.getSettingDefinitions(), name);
        const both = () => [
            resolve(direction(L.settingsPreviewNext).visible),
            resolve(direction(L.settingsPreviewPrevious).visible),
        ];

        plugin.data.previewNext = false;
        plugin.data.previewPrevious = false;
        assert.deepEqual(both(), [false, false]);

        plugin.data.previewNext = true;
        plugin.data.previewPrevious = true;
        assert.deepEqual(both(), [true, true]);

        // One direction on is still the feature being on, so the rows stay.
        // The master reads `next || previous` for exactly this: with `&&` the
        // row you would need to get back to one-direction-only is the row that
        // disappears.
        plugin.data.previewPrevious = false;
        assert.deepEqual(both(), [true, true]);
        assert.equal(tab.getControlValue('switchPreviewEnabled'), true);

        plugin.data.previewNext = false;
        assert.equal(tab.getControlValue('switchPreviewEnabled'), false);
    } finally { await settle(); h.restore(); }
});

test('turning the preview master on sets both directions, every time', async () => {
    const h = setupHarness();
    try {
        const { tab, plugin, calls } = makeTab(h);

        // Left in a one-direction state, which is what makes the press
        // interesting: it has to land on both-on regardless.
        plugin.data.previewNext = true;
        plugin.data.previewPrevious = false;
        await tab.setControlValue('switchPreviewEnabled', true);

        assert.deepEqual(calls.filter((entry) => entry[0] === 'preview'), [['preview', true]]);
        assert.equal(plugin.data.previewNext, true);
        assert.equal(plugin.data.previewPrevious, true);
    } finally { await settle(); h.restore(); }
});

test('both directions preview by default', async () => {
    const h = setupHarness();
    try {
        const { DEFAULT_DATA } = require('../src/storage/default-data.ts');
        assert.equal(DEFAULT_DATA.previewNext, true);
        assert.equal(DEFAULT_DATA.previewPrevious, true);
        // And the master reads on from them, so a fresh install shows the two
        // direction rows rather than hiding them.
        const { tab } = makeTab(h, { data: { previewNext: undefined, previewPrevious: undefined } });
        assert.equal(tab.getControlValue('switchPreviewEnabled'), true);
    } finally { await settle(); h.restore(); }
});

test('a write inside the preview group rebuilds the rows, because it moves the others', async () => {
    const h = setupHarness();
    try {
        const { tab } = makeTab(h);
        let reads = 0;
        tab.update = () => { reads += 1; };

        // refreshDomState re-runs `visible` and `disabled` and nothing else, so
        // without a rebuild the master would keep showing off after the two
        // directions came on, and vice versa.
        for (const key of ['switchPreviewEnabled', 'previewNext', 'previewPrevious']) {
            reads = 0;
            await tab.setControlValue(key, true);
            assert.equal(reads, 1, `${key} did not rebuild the rows`);
        }
    } finally { await settle(); h.restore(); }
});

test('the scroll tuning is one group, and it goes as a whole when the feature is off', async () => {
    const h = setupHarness();
    try {
        const { tab, plugin, L } = makeTab(h);
        const page = () => pageNamed(tab.getSettingDefinitions(), L.settingsSubsectionScrollSwitch);
        const tuning = () => groupsIn([page()]).find((group) => group.heading === L.settingsSectionAdvanced);

        plugin.data.statusBarModScrollSwitch = true;
        assert.ok(tuning(), 'the tuning group is missing');
        assert.equal(resolve(tuning().visible), true);
        plugin.data.statusBarModScrollSwitch = false;
        assert.equal(resolve(tuning().visible), false);

        // The master and the direction are what the page is about, and they
        // sit in the group above, with no heading of their own.
        const first = page().items[0];
        assert.equal(first.heading, undefined);
        assert.deepEqual(
            first.items.map((row) => row.control.key),
            ['statusBarModScrollSwitch', 'statusBarScrollInvert'],
        );

        // The master itself is never hidden, or there would be no way back.
        assert.equal(resolve(first.items[0].visible), undefined);
        assert.equal(resolve(first.items[1].visible), false);
    } finally { await settle(); h.restore(); }
});

test('the three custom numbers are there only while the custom preset is', async () => {
    const h = setupHarness();
    try {
        const { tab, plugin, L } = makeTab(h);
        plugin.data.statusBarModScrollSwitch = true;
        const tuning = () => rows([pageNamed(tab.getSettingDefinitions(), L.settingsSubsectionScrollSwitch)]);
        const numbers = () => [
            L.settingsStatusBarScrollThreshold,
            L.settingsStatusBarScrollCooldown,
            L.settingsStatusBarScrollResetWindow,
        ].map((name) => resolve(tuning().find((row) => row.name === name).visible));

        plugin.data.statusBarScrollPreset = 'custom';
        assert.deepEqual(numbers(), [true, true, true]);

        // They were greyed rather than absent, on the grounds that the values
        // a preset chose were worth reading. Three inert dropdowns are worse
        // than three absent ones.
        plugin.data.statusBarScrollPreset = 'trackpad';
        assert.deepEqual(numbers(), [false, false, false]);

        // The preset and the modifier stay: those are what the page is for.
        assert.equal(resolve(tuning().find((row) => row.name === L.settingsStatusBarScrollPreset).visible), undefined);
    } finally { await settle(); h.restore(); }
});

test('the snapshot interval is hidden when switching does not save by itself', async () => {
    const h = setupHarness();
    try {
        const { tab, plugin, L } = makeTab(h);
        const interval = () => rowNamed(
            [pageNamed(tab.getSettingDefinitions(), L.historyTitle)],
            L.settingsVersionHistoryInterval,
        );

        plugin.data.autoSaveOnSwitch = true;
        assert.equal(resolve(interval().visible), true);
        plugin.data.autoSaveOnSwitch = false;
        assert.equal(resolve(interval().visible), false);
    } finally { await settle(); h.restore(); }
});

// --- control bindings ---------------------------------------------------

test('each control key reads and writes through the owner that holds it', async () => {
    const h = setupHarness();
    try {
        const { tab, calls } = makeTab(h);
        const table = [
            ['language', 'ja', 'language'],
            ['autoSaveOnSwitch', true, 'autoSave'],
            ['warnUnsavedSwitch', true, 'warn'],
            ['highlightUnsavedSessionChanges', true, 'highlight'],
            ['restoreSidebars', true, 'restoreSidebars'],
            ['showActiveSwitchCommand', true, 'activeCommand'],
            ['numberedSwitchCommands', true, 'numbered'],
            ['switchPreviewEnabled', true, 'preview'],
            ['previewNext', true, 'previewNext'],
            ['previewPrevious', true, 'previewPrevious'],
            ['showFilterInput', true, 'filter'],
            ['confirmQuickActions', true, 'confirmQuick'],
            ['confirmDeleteByHotkey', false, 'confirmDelete'],
            ['statusBarModScrollSwitch', true, 'modScroll'],
            ['statusBarScrollPreset', 'trackpad', 'preset'],
            ['statusBarScrollModifier', 'modOnly', 'modifier'],
            ['statusBarScrollThreshold', '40', 'threshold'],
            ['statusBarScrollCooldown', '750', 'cooldown'],
            ['statusBarScrollResetWindow', '400', 'resetWindow'],
            ['statusBarScrollInvert', true, 'invert'],
            ['versionHistoryEnabled', true, 'history'],
            ['versionHistoryInterval', '15', 'interval'],
            ['versionHistoryConfirmRestore', true, 'confirmRestore'],
            ['groupFeatureEnabled', true, 'groupFeature'],
            ['vaultOnlySessions', true, 'storage'],
            ['statusBarActions.click', 'next-session', 'statusAction'],
        ];

        for (const [key, value, expectedCall] of table) {
            calls.length = 0;
            await tab.setControlValue(key, value);
            assert.ok(
                calls.some((entry) => entry[0] === expectedCall),
                `${key} did not reach ${expectedCall}: ${JSON.stringify(calls)}`,
            );
        }

        // Every key a definition names has a binding behind it.
        const declared = rows(tab.getSettingDefinitions())
            .filter((row) => row.control)
            .map((row) => row.control.key);
        for (const key of declared) {
            assert.notEqual(tab.getControlValue(key), undefined, `no binding reads ${key}`);
        }
    } finally { await settle(); h.restore(); }
});

test('an unbound control key writes nothing', async () => {
    const h = setupHarness();
    try {
        const { tab, calls } = makeTab(h);
        await tab.setControlValue('not-a-setting', true);
        assert.deepEqual(calls, []);
        assert.equal(tab.getControlValue('not-a-setting'), undefined);
    } finally { await settle(); h.restore(); }
});

test('a key that changes which rows exist re-reads the definitions; one that does not, does not', async () => {
    const h = setupHarness();
    try {
        const { tab } = makeTab(h);
        let reads = 0;
        tab.update = () => { reads += 1; };

        await tab.setControlValue('statusBarScrollInvert', true);
        assert.equal(reads, 0, 'a plain control must not rebuild the screen');

        await tab.setControlValue('language', 'ja');
        assert.equal(reads, 1, 'a language change relabels everything');

        await tab.setControlValue('groupFeatureEnabled', true);
        assert.equal(reads, 2, 'turning groups on reveals the group list');
    } finally { await settle(); h.restore(); }
});

// --- the backup page ----------------------------------------------------

const BACKUP_DIR = 'backups';
const POOL_HOUR = 3600000;

function poolFiles(tab) {
    return [...tab.plugin.backupFiles.keys()].filter((path) => path.startsWith(`${BACKUP_DIR}/`));
}

/** The generation rows: the ones named for a moment rather than an action. */
function backupRowsOf(tab, L) {
    void L;
    return rows([pageNamed(tab.getSettingDefinitions(), L.rotationBackupSectionTitle)])
        .filter((row) => /^\d+\./.test(row.name));
}

function pressCreate(h, tab, L) {
    const create = rowNamed(
        [pageNamed(tab.getSettingDefinitions(), L.rotationBackupSectionTitle)],
        L.rotationBackupCreate,
    );
    const button = buttonOf(renderRow(h, create), L.rotationBackupCreate);
    button.trigger();
    return button;
}

test('a manual backup adds a file to the pool, named for the moment it was taken', async () => {
    const h = setupHarness();
    try {
        const { tab, plugin, L } = makeTab(h);
        tab.plugin = plugin;
        const before = poolFiles(tab);

        pressCreate(h, tab, L);
        await settle();

        const after = poolFiles(tab);
        assert.equal(after.length, before.length + 1);
        const added = after.find((path) => !before.includes(path));
        assert.ok(/^backups\/sessions\.\d+\.json$/.test(added), added);
        // Marked, so the ladder never thins it away.
        assert.equal(plugin.backupFiles.get(added)._wppBackupManual, true);
        assert.deepEqual(h.obsidian.notices.map((notice) => notice.message), [L.rotationBackupCreated]);
    } finally { await settle(); h.restore(); }
});

test('a press that would back up nothing new writes no file, and says so', async () => {
    const h = setupHarness();
    try {
        // The newest backup already holds what extractSessionData returns.
        const { tab, plugin, L } = makeTab(h, {
            backupFiles: [['backups/sessions.1700000000000.json', {
                _wppSavedAt: 1700000000000,
                _wppBackupPlatform: 'Windows',
            }]],
        });
        tab.plugin = plugin;

        pressCreate(h, tab, L);
        await settle();

        assert.deepEqual(poolFiles(tab), ['backups/sessions.1700000000000.json']);
        assert.deepEqual(h.obsidian.notices.map((notice) => notice.message), [L.noChanges]);
    } finally { await settle(); h.restore(); }
});

test('key order in the stored backup does not read as a change', async () => {
    const h = setupHarness();
    try {
        const { tab, plugin, L } = makeTab(h, {
            backupFiles: [['backups/sessions.1700000000000.json', {
                sessions: { b: 2, a: 1 },
                _wppSavedAt: 1700000000000,
            }]],
            plugin: { extractSessionData() { return { sessions: { a: 1, b: 2 } }; } },
        });
        tab.plugin = plugin;

        pressCreate(h, tab, L);
        await settle();

        // One side is parsed from a file and the other assembled from live
        // state, so their key order differs by construction.
        assert.equal(poolFiles(tab).length, 1);
        assert.deepEqual(h.obsidian.notices.map((notice) => notice.message), [L.noChanges]);
    } finally { await settle(); h.restore(); }
});

test('a press that has something new to record writes it and says so', async () => {
    const h = setupHarness();
    try {
        const { tab, plugin, L } = makeTab(h, {
            backupFiles: [['backups/sessions.1700000000000.json', {
                sessions: { a: 1 },
                _wppSavedAt: 1700000000000,
            }]],
            plugin: { extractSessionData() { return { sessions: { a: 1, b: 2 } }; } },
        });
        tab.plugin = plugin;

        pressCreate(h, tab, L);
        await settle();

        assert.equal(poolFiles(tab).length, 2);
        assert.deepEqual(h.obsidian.notices.map((notice) => notice.message), [L.rotationBackupCreated]);
    } finally { await settle(); h.restore(); }
});

test('a backup that cannot be read is not taken as a reason to skip one', async () => {
    const h = setupHarness();
    try {
        const { tab, plugin, L } = makeTab(h, {
            plugin: { readJsonIfExists() { return Promise.reject(new Error('unreadable')); } },
        });
        tab.plugin = plugin;

        pressCreate(h, tab, L);
        await settle();

        assert.deepEqual(h.obsidian.notices.map((notice) => notice.message), [L.rotationBackupCreated]);
    } finally { await settle(); h.restore(); }
});

test('a second click on create cannot write a second file', async () => {
    const h = setupHarness();
    try {
        const { tab, plugin, L } = makeTab(h);
        tab.plugin = plugin;
        const before = poolFiles(tab).length;

        const button = pressCreate(h, tab, L);
        button.trigger();
        await settle();

        // Disabled for the round trip; and even if it were not, the second
        // press would find the pool already holding these sessions.
        assert.equal(poolFiles(tab).length, before + 1);
    } finally { await settle(); h.restore(); }
});

test('the pool thins itself, keeping a spread rather than the newest few', async () => {
    const h = setupHarness();
    try {
        // Relative to the real clock: the ladder measures ages, and a
        // three-year-old fixture would put every file past every target.
        const now = Date.now();
        const seeded = [];
        for (let i = 1; i <= 12; i++) {
            const savedAt = now - i * POOL_HOUR;
            seeded.push([`backups/sessions.${savedAt}.json`, { _wppSavedAt: savedAt, i }]);
        }
        const { tab, plugin, L } = makeTab(h, { backupFiles: seeded });
        tab.plugin = plugin;

        pressCreate(h, tab, L);
        await settle();

        const kept = poolFiles(tab)
            .map((path) => Number(/sessions\.(\d+)\.json/.exec(path)[1]))
            .sort((a, b) => b - a);
        // Five means five files. A pool of five held six while the newest was
        // claimed outside the ladder and the ladder then filled five more.
        assert.equal(kept.length, 5, `${kept.length} kept of 13`);
        // The oldest survives: five generations means five points in time, not
        // the five most recent files.
        assert.ok(Math.min(...kept) <= now - 11 * POOL_HOUR, `oldest kept ${Math.min(...kept)}`);
    } finally { await settle(); h.restore(); }
});

test('restoring a backup asks first, and restores the file that was named', async () => {
    const h = setupHarness();
    try {
        const { tab, plugin, calls, L } = makeTab(h);
        tab.plugin = plugin;
        tab.getSettingDefinitions();
        await settle();

        const backupRow = backupRowsOf(tab, L)[0];
        assert.ok(backupRow, 'the one backup the pool holds');
        const restore = () => buttonOf(renderRow(h, backupRow), L.rotationBackupRestore);

        restore().trigger();
        confirmOrCancel(h, 0);
        assert.deepEqual(calls.filter((entry) => entry[0] === 'restore'), []);

        restore().trigger();
        confirmOrCancel(h, 1);
        // The path, not a position: the pool renumbers on every prune.
        assert.deepEqual(
            calls.filter((entry) => entry[0] === 'restore'),
            [['restore', 'backups/sessions.1700000000000.json']],
        );
    } finally { await settle(); h.restore(); }
});

test('the list below the button shows the backup the button just took', async () => {
    const h = setupHarness();
    try {
        // The directory as it is before the press, and as it is after.
        let generations = [{ generation: 1, savedAt: 1000, sessionCount: 1 }];
        const { tab, L } = makeTab(h, {
            plugin: {
                getRotationBackupInfo() { return Promise.resolve(generations); },
                writeJson() {
                    generations = [
                        { generation: 1, savedAt: 9000, sessionCount: 2 },
                        { generation: 2, savedAt: 1000, sessionCount: 1 },
                    ];
                    return Promise.resolve(true);
                },
                extractSessionData() { return { sessions: { a: 1, b: 2 } }; },
            },
            generationOne: { sessions: { a: 1 } },
        });

        tab.getSettingDefinitions();
        await settle();
        const before = backupRowsOf(tab, L);
        assert.equal(before.length, 1);

        const create = rowNamed(
            [pageNamed(tab.getSettingDefinitions(), L.rotationBackupSectionTitle)],
            L.rotationBackupCreate,
        );
        buttonOf(renderRow(h, create), L.rotationBackupCreate).trigger();
        await settle();
        await settle();

        // The reading is cached, and the cache used to be filled once per
        // screen - so the press wrote a generation and the list under it went
        // on showing the two that were there before.
        const after = backupRowsOf(tab, L);
        assert.equal(after.length, 2);
        assert.ok(after[0].name.startsWith('1.'));
        assert.ok(after[1].name.startsWith('2.'));
    } finally { await settle(); h.restore(); }
});

test('a reading that has not moved does not send the screen round again', async () => {
    const h = setupHarness();
    try {
        let reads = 0;
        const { tab } = makeTab(h, {
            plugin: {
                getRotationBackupInfo() {
                    reads += 1;
                    // A fresh array every call, the way the real one builds it.
                    return Promise.resolve([{ generation: 1, savedAt: 1000, sessionCount: 1 }]);
                },
            },
        });

        tab.getSettingDefinitions();
        await settle();
        await settle();
        await settle();

        // One read for the first pass, one for the pass its result caused, and
        // then it settles: the comparison is what closes the loop.
        assert.ok(reads <= 3, `the screen kept re-reading: ${reads} reads`);
        assert.ok(reads >= 2, `the reading was never refreshed: ${reads} reads`);
    } finally { await settle(); h.restore(); }
});

test('the backup page says so when there is nothing in it, rather than showing a bare heading', async () => {
    const h = setupHarness();
    try {
        const { tab, L } = makeTab(h, { backupFiles: [] });
        tab.getSettingDefinitions();
        await settle();

        const page = pageNamed(tab.getSettingDefinitions(), L.rotationBackupSectionTitle);
        const names = rows([page]).map((row) => row.name);
        assert.ok(names.includes(L.rotationBackupNone));
    } finally { await settle(); h.restore(); }
});

// --- the groups page ----------------------------------------------------

test('the group list is empty until the feature is on, and then holds one row per group', async () => {
    const h = setupHarness();
    try {
        const groups = [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }];
        let enabled = false;
        const { tab, L } = makeTab(h, {
            plugin: {
                isGroupFeatureEnabled() { return enabled; },
                getOrderedGroups() { return groups; },
                getGroupSessionIds() { return ['s1']; },
            },
        });
        const list = () => listIn([pageNamed(tab.getSettingDefinitions(), L.settingsSectionGroups)]);

        assert.deepEqual(list().items, []);
        assert.equal(resolve(list().visible), false);

        enabled = true;
        assert.deepEqual(list().items.map((row) => row.name), ['Alpha', 'Beta']);
        assert.equal(resolve(list().visible), true);
    } finally { await settle(); h.restore(); }
});

test('deleting a group asks first and names the one that was aimed at', async () => {
    const h = setupHarness();
    try {
        const groups = [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }];
        const { tab, calls, L } = makeTab(h, {
            plugin: {
                isGroupFeatureEnabled() { return true; },
                getOrderedGroups() { return groups; },
                deleteGroup(id) { calls.push(['deleteGroup', id]); return Promise.resolve(true); },
            },
        });
        const list = listIn([pageNamed(tab.getSettingDefinitions(), L.settingsSectionGroups)]);

        list.onDelete(1);
        const message = h.dom.document.querySelector('.modal-container p').textContent;
        assert.ok(message.includes('Beta'), `the confirmation names the group: ${message}`);
        confirmOrCancel(h, 1);
        assert.deepEqual(calls.filter((entry) => entry[0] === 'deleteGroup'), [['deleteGroup', 'b']]);
    } finally { await settle(); h.restore(); }
});

test('reordering groups writes the order the drag produced', async () => {
    const h = setupHarness();
    try {
        const groups = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'c', name: 'C' }];
        const orders = [];
        const { tab, L } = makeTab(h, {
            plugin: {
                isGroupFeatureEnabled() { return true; },
                getOrderedGroups() { return groups; },
                setGroupTabOrder(order) { orders.push(order); return Promise.resolve(true); },
            },
        });
        const list = listIn([pageNamed(tab.getSettingDefinitions(), L.settingsSectionGroups)]);

        list.onReorder(0, 2);
        assert.deepEqual(orders, [['b', 'c', 'a']]);
    } finally { await settle(); h.restore(); }
});

test('creating a group asks for a name and passes it to the store', async () => {
    const h = setupHarness();
    try {
        const created = [];
        const { tab, L } = makeTab(h, {
            plugin: {
                isGroupFeatureEnabled() { return true; },
                createGroupValidated(name) { created.push(name); return Promise.resolve('id'); },
            },
        });
        const list = listIn([pageNamed(tab.getSettingDefinitions(), L.settingsSectionGroups)]);

        list.addItem.action(h.dom.container());
        const input = h.dom.document.querySelector('.modal-container .wpp-rename-input');
        assert.ok(input, 'the name dialog is what asks');
        input.value = 'Gamma';
        const buttons = h.dom.document.querySelectorAll('.modal-container button');
        buttons[buttons.length - 1].click();
        assert.deepEqual(created, ['Gamma']);
    } finally { await settle(); h.restore(); }
});

// --- the data page ------------------------------------------------------

test('the storage toggle dispatches both directions', async () => {
    const h = setupHarness();
    try {
        const { tab, calls } = makeTab(h);
        await tab.setControlValue('vaultOnlySessions', true);
        await tab.setControlValue('vaultOnlySessions', false);
        assert.deepEqual(
            calls.filter((entry) => entry[0] === 'storage'),
            [['storage', 'vault-folder'], ['storage', 'plugin-folder']],
        );
    } finally { await settle(); h.restore(); }
});

test('each reset keeps its own target', async () => {
    const h = setupHarness();
    try {
        const { tab, calls, L } = makeTab(h);
        const items = tab.getSettingDefinitions();

        for (const [name, expected] of [
            [L.settingsResetSettings, 'resetSettings'],
            [L.settingsResetSessions, 'resetSessions'],
            [L.settingsResetBackupsAndHistory, 'clearBackups'],
            [L.settingsResetSessionsAndSettings, 'resetEverything'],
        ]) {
            calls.length = 0;
            buttonOf(renderRow(h, rowNamed(items, name)), name).trigger();
            confirmOrCancel(h, 1);
            await settle();
            assert.ok(
                calls.some((entry) => entry[0] === expected),
                `${name} did not reach ${expected}: ${JSON.stringify(calls)}`,
            );
        }
    } finally { await settle(); h.restore(); }
});

test('a reset that is cancelled runs nothing', async () => {
    const h = setupHarness();
    try {
        const { tab, calls, L } = makeTab(h);
        const row = rowNamed(tab.getSettingDefinitions(), L.settingsResetSessions);
        calls.length = 0;
        buttonOf(renderRow(h, row), L.settingsResetSessions).trigger();
        confirmOrCancel(h, 0);
        await settle();
        assert.deepEqual(calls.filter((entry) => entry[0] === 'resetSessions'), []);
    } finally { await settle(); h.restore(); }
});

test('export runs straight away; import asks first', async () => {
    const h = setupHarness();
    try {
        const { tab, calls, L } = makeTab(h);
        const items = tab.getSettingDefinitions();

        rowNamed(items, L.settingsExportSessions).action(h.dom.container(), 0);
        assert.ok(calls.some((entry) => entry[0] === 'export'));

        calls.length = 0;
        rowNamed(items, L.settingsImportSessions).action(h.dom.container(), 0);
        confirmOrCancel(h, 0);
        assert.deepEqual(calls.filter((entry) => entry[0] === 'import'), []);

        rowNamed(items, L.settingsImportSessions).action(h.dom.container(), 0);
        confirmOrCancel(h, 1);
        assert.ok(calls.some((entry) => entry[0] === 'import'));
    } finally { await settle(); h.restore(); }
});

test('the diagnostics show a placeholder until the size arrives, then the size', async () => {
    const h = setupHarness();
    try {
        const { tab, L } = makeTab(h);
        const size = () => rowNamed(tab.getSettingDefinitions(), L.settingsStorageFieldDataSize).desc;

        assert.equal(size(), '…');
        await settle();
        assert.equal(size(), '100 B');
    } finally { await settle(); h.restore(); }
});

// --- the group rename button --------------------------------------------

test('the rename button on a group row asks for the new name', async () => {
    const h = setupHarness();
    try {
        const renamed = [];
        const { tab, L } = makeTab(h, {
            plugin: {
                isGroupFeatureEnabled() { return true; },
                getOrderedGroups() { return [{ id: 'a', name: 'Alpha' }]; },
                renameGroupValidated(id, name) { renamed.push([id, name]); return Promise.resolve(true); },
            },
        });
        const row = rowNamed([pageNamed(tab.getSettingDefinitions(), L.settingsSectionGroups)], 'Alpha');

        renderRow(h, row);
        const rename = h.obsidian.settings
            .flatMap((setting) => setting.components)
            .find((component) => component.constructor.name === 'ButtonStub');
        rename.trigger();

        const input = h.dom.document.querySelector('.modal-container .wpp-rename-input');
        assert.ok(input, 'the name dialog is what asks');
        input.value = 'Renamed';
        const buttons = h.dom.document.querySelectorAll('.modal-container button');
        buttons[buttons.length - 1].click();
        assert.deepEqual(renamed, [['a', 'Renamed']]);
    } finally { await settle(); h.restore(); }
});

// --- the clock ----------------------------------------------------------

test('two rows on the backup page are measured from one instant', async () => {
    const h = setupHarness();
    try {
        const savedAt = 1_700_000_000_000;
        const realNow = Date.now;
        // A minute per reading, so any two readings land in different minutes.
        // Whether the page agrees with itself then depends entirely on whether
        // it reads the clock once or once per row.
        let clock = savedAt;
        Date.now = () => { clock += 60000; return clock; };

        const { tab, plugin, L } = makeTab(h, {
            backupFiles: [
                [`backups/sessions.${savedAt}.json`, { _wppSavedAt: savedAt, sessions: { a: 1 } }],
                [`backups/sessions.${savedAt - 60000}.json`, { _wppSavedAt: savedAt - 60000, sessions: { b: 2 } }],
            ],
        });
        tab.plugin = plugin;
        try {
            tab.getSettingDefinitions();
            await settle();
            const page = pageNamed(tab.getSettingDefinitions(), L.rotationBackupSectionTitle);
            const generations = rows([page]).filter((row) => /^\d+\./.test(row.name));
            assert.equal(generations.length, 2);

            // A minute apart in the file names, so a minute apart in the
            // readings - and no more, which a second clock read would add.
            const ages = generations.map((row) => Number(/(\d+)/.exec(row.desc)[1]));
            assert.equal(ages[1] - ages[0], 1, `ages were ${ages}`);
        } finally {
            Date.now = realNow;
            tab.hide();
        }
    } finally { await settle(); h.restore(); }
});

test('an open settings screen keeps its clock running, and stops on the way out', async () => {
    let tab;
    const h = setupHarness();
    try {
        ({ tab } = makeTab(h));
        let rebuilds = 0;
        tab.update = () => { rebuilds += 1; };

        tab.getSettingDefinitions();
        // Nothing redraws a definition on its own, so "2 minutes ago" would
        // stay on screen until something else happened to rebuild the row.
        assert.notEqual(tab.clockTick, null, 'the tab is not watching the clock');

        tab.hide();
        assert.equal(tab.clockTick, null, 'the timer outlived the screen');
        assert.equal(rebuilds, 0, 'nothing should have ticked yet');
    } finally { tab.hide(); await settle(); h.restore(); }
});

test('a screen whose container is gone stops ticking rather than rebuilding for nobody', async () => {
    let tab;
    const h = setupHarness();
    try {
        ({ tab } = makeTab(h));
        let rebuilds = 0;
        tab.update = () => { rebuilds += 1; };

        tab.getSettingDefinitions();
        assert.notEqual(tab.clockTick, null);

        // The plugin being disabled with the settings open: the container goes
        // and `hide()` never runs.
        tab.containerEl.detach();
        tab.tick();
        assert.equal(tab.clockTick, null);
        assert.equal(rebuilds, 0);
    } finally { tab.hide(); await settle(); h.restore(); }
});

test('the resets are on the surface, at the foot of it, and not behind a door', async () => {
    const h = setupHarness();
    try {
        const { tab, L } = makeTab(h);
        const items = tab.getSettingDefinitions();

        const resets = items.filter((item) => item.heading === L.settingsSectionReset);
        assert.equal(resets.length, 1, 'the reset group is not at the top level');
        assert.deepEqual(resets[0].items.map((row) => row.name), [
            L.settingsResetSettings,
            L.settingsResetSessions,
            L.settingsResetBackupsAndHistory,
            L.settingsResetSessionsAndSettings,
        ]);

        // Nothing but the footer below them.
        const index = items.indexOf(resets[0]);
        assert.equal(index, items.length - 2, `reset group at ${index} of ${items.length}`);

        // And no reset is left inside a page.
        for (const page of pages(items)) {
            const names = rows([page]).map((row) => row.name);
            assert.ok(!names.includes(L.settingsResetSessions), `${page.name} still holds a reset`);
        }
    } finally { await settle(); h.restore(); }
});

test('the storage page is about the files, and nothing else', async () => {
    const h = setupHarness();
    try {
        const { tab, L } = makeTab(h);
        const page = pageNamed(tab.getSettingDefinitions(), L.settingsSectionStorage);
        const headings = groupsIn([page]).map((group) => group.heading);

        assert.deepEqual(headings, [
            L.settingsAdvancedStorageSubsection,
            L.settingsAdvancedTransferSubsection,
            L.settingsDeveloperSection,
        ]);
    } finally { await settle(); h.restore(); }
});

test('the generation count is a setting, and lowering it prunes there and then', async () => {
    const h = setupHarness();
    try {
        const { BACKUP_GENERATION_CHOICES } = require('../src/storage/backup-pool.ts');
        const now = Date.now();
        const seeded = [];
        for (let i = 1; i <= 20; i++) {
            const savedAt = now - i * 3600000;
            seeded.push([`backups/sessions.${savedAt}.json`, { _wppSavedAt: savedAt, i }]);
        }
        const { tab, plugin, L } = makeTab(h, { backupFiles: seeded });
        tab.plugin = plugin;

        const row = rowNamed(
            [pageNamed(tab.getSettingDefinitions(), L.rotationBackupSectionTitle)],
            L.settingsBackupGenerations,
        );
        assert.deepEqual(
            Object.keys(row.control.options).map(Number),
            [...BACKUP_GENERATION_CHOICES],
        );
        assert.equal(tab.getControlValue('rotationBackupGenerations'), '5');

        await tab.setControlValue('rotationBackupGenerations', '12');
        const atTwelve = poolFiles(tab).length;

        await tab.setControlValue('rotationBackupGenerations', '3');
        const atThree = poolFiles(tab).length;

        // Applied on the write rather than at the next backup: otherwise the
        // list below would go on showing files the setting says are gone.
        assert.ok(atThree < atTwelve, `12 kept ${atTwelve}, 3 kept ${atThree}`);
        assert.equal(tab.getControlValue('rotationBackupGenerations'), '3');
    } finally { await settle(); h.restore(); }
});

test('a generation count the ladder does not offer falls back to the default', async () => {
    const h = setupHarness();
    try {
        const { tab } = makeTab(h);
        await tab.setControlValue('rotationBackupGenerations', '999');
        assert.equal(tab.getControlValue('rotationBackupGenerations'), '5');
    } finally { await settle(); h.restore(); }
});

test('the storage group is the one toggle, and the path is named once on the page', async () => {
    const h = setupHarness();
    try {
        const { tab, L } = makeTab(h);
        const page = pageNamed(tab.getSettingDefinitions(), L.settingsSectionStorage);

        const storage = groupsIn([page])
            .find((group) => group.heading === L.settingsAdvancedStorageSubsection);
        assert.deepEqual(storage.items.map((row) => row.name), [L.settingsVaultOnlySessions]);

        // Still on the page, once: the diagnostics name it along with the two
        // files beside it, which is where a path belongs.
        const pathRows = rows([page]).filter((row) => row.desc === 's');
        assert.equal(pathRows.length, 1);
        assert.equal(pathRows[0].name, L.settingsStorageFieldSessions);
    } finally { await settle(); h.restore(); }
});

test('the doors are in the order the maintainer set, and the count is last on its page', async () => {
    const h = setupHarness();
    try {
        const { tab, plugin, L } = makeTab(h);
        tab.plugin = plugin;
        const items = tab.getSettingDefinitions();

        assert.deepEqual(pages(items).filter((page) => items.some((group) => group.items?.includes(page)))
            .map((page) => page.name), [
            L.settingsSectionStatusBar,
            L.settingsSubsectionScrollSwitch,
            L.settingsSectionGroups,
            L.historyTitle,
            L.rotationBackupSectionTitle,
            L.settingsSectionStorage,
        ]);

        // The count sits under the list it governs: what is there is what
        // decides how much of it to keep.
        const backupPage = pageNamed(items, L.rotationBackupSectionTitle);
        const names = rows([backupPage]).map((row) => row.name);
        assert.equal(names[0], L.rotationBackupCreate);
        assert.equal(names[names.length - 1], L.settingsBackupGenerations);
    } finally { await settle(); h.restore(); }
});

test('the language dropdown offers auto first, then the languages by ISO code', async () => {
    const h = setupHarness();
    try {
        const { tab, L } = makeTab(h);
        const row = rowNamed(tab.getSettingDefinitions(), L.settingsLanguage);
        const codes = Object.keys(row.control.options);

        assert.equal(codes[0], 'auto');
        const languages = codes.slice(1);
        // Obsidian's own list is Object.keys(languages).sort() shown by
        // endonym; matching it means one rule and no guessing about where a
        // new language goes.
        assert.deepEqual(languages, [...languages].sort());
        assert.equal(languages.length, 21);
        assert.equal(row.control.options.ja, '日本語');
    } finally { await settle(); h.restore(); }
});
