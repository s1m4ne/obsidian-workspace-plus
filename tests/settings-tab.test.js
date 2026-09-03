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
        getRotationBackupInfo() { return Promise.resolve([{ generation: 1, savedAt: 0, sessionCount: 1 }]); },
        // What generation 1 already holds. `null` data means "no backup
        // there", which is what makes a manual backup rotate.
        readJsonIfExists(path) {
            calls.push(['readJson', path]);
            return Promise.resolve(overrides.generationOne
                ? { exists: true, data: overrides.generationOne, error: null }
                : { exists: false, data: null, error: null });
        },
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
            L.settingsSectionAdvanced,
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

test('only the backup door carries a summary; the others carry a description', async () => {
    const h = setupHarness();
    try {
        const { tab, L } = makeTab(h);
        tab.getSettingDefinitions();
        await settle();
        const items = tab.getSettingDefinitions();

        // A summary has to answer a question the reader has before opening the
        // page. "How many of the twelve slots are spoken for", "which interval
        // is set", "how many groups exist" are not those questions, and they
        // were noise on the surface. When the last backup was taken is.
        // The scroll page keeps one, and so does this: both name the value in
        // force, the way Obsidian's font pages show the font. What went were
        // the three that showed a count.
        for (const name of [
            L.settingsSectionStatusBar,
            L.historyTitle,
            L.settingsSectionGroups,
        ]) {
            const page = pageNamed(items, name);
            assert.equal(page.displayValue, undefined, `${name} still shows a summary`);
            assert.ok(page.desc, `${name} has no description`);
        }

        for (const name of [L.rotationBackupSectionTitle, L.settingsSubsectionScrollSwitch]) {
            const page = pageNamed(items, name);
            assert.notEqual(resolve(page.displayValue), '', `${name} shows no value`);
        }
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

test('turning the preview master on sets both directions, so it leaves no half state', async () => {
    const h = setupHarness();
    try {
        const { tab, calls } = makeTab(h);
        await tab.setControlValue('switchPreviewEnabled', true);
        assert.deepEqual(calls.filter((entry) => entry[0] === 'preview'), [['preview', true]]);
    } finally { await settle(); h.restore(); }
});

test('the scroll rows stay hidden until scroll switching is on', async () => {
    const h = setupHarness();
    try {
        const { tab, plugin, L } = makeTab(h);
        const page = () => pageNamed(tab.getSettingDefinitions(), L.settingsSubsectionScrollSwitch);
        const preset = () => rowNamed([page()], L.settingsStatusBarScrollPreset);

        plugin.data.statusBarModScrollSwitch = true;
        assert.equal(resolve(preset().visible), true);
        plugin.data.statusBarModScrollSwitch = false;
        assert.equal(resolve(preset().visible), false);

        // The master itself is never hidden, or there would be no way back.
        assert.equal(resolve(rowNamed([page()], L.settingsStatusBarModScrollSwitch).visible), undefined);
    } finally { await settle(); h.restore(); }
});

test('the three custom numbers are greyed rather than hidden when a preset owns them', async () => {
    const h = setupHarness();
    try {
        const { tab, plugin, L } = makeTab(h);
        const page = () => pageNamed(tab.getSettingDefinitions(), L.settingsSubsectionScrollSwitch);
        const threshold = () => rowNamed([page()], L.settingsStatusBarScrollThreshold);

        plugin.data.statusBarScrollPreset = 'custom';
        assert.equal(resolve(threshold().control.disabled), false);
        plugin.data.statusBarScrollPreset = 'trackpad';
        assert.equal(resolve(threshold().control.disabled), true);
        // Still on screen: the preset sets these, and their values are worth
        // reading even when they cannot be changed.
        assert.equal(resolve(threshold().visible), true);
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
            ['overlayDefaultFocus', 'session-filter', 'focus'],
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

test('a manual backup shifts the generations oldest-first so none is overwritten early', async () => {
    const h = setupHarness();
    try {
        const { tab, calls, L } = makeTab(h);
        const page = pageNamed(tab.getSettingDefinitions(), L.rotationBackupSectionTitle);
        const create = rowNamed([page], L.rotationBackupCreate);

        buttonOf(renderRow(h, create), L.rotationBackupCreate).trigger();
        await settle();

        const copies = calls.filter((entry) => entry[0] === 'copy').map((entry) => entry.slice(1));
        assert.deepEqual(copies, [['backup-2', 'backup-3'], ['backup-1', 'backup-2']]);
        assert.ok(calls.some((entry) => entry[0] === 'writeJson' && entry[1] === 'backup-1'));
    } finally { await settle(); h.restore(); }
});

test('a press that would back up nothing new moves no generation, and says so', async () => {
    const h = setupHarness();
    try {
        // extractSessionData returns {} for this double, so generation 1
        // holding {} - under any stamp, from any machine - is the same backup.
        const { tab, calls, L } = makeTab(h, {
            generationOne: { _wppSavedAt: 111, _wppBackupPlatform: 'Windows' },
        });
        const create = rowNamed(
            [pageNamed(tab.getSettingDefinitions(), L.rotationBackupSectionTitle)],
            L.rotationBackupCreate,
        );
        const button = buttonOf(renderRow(h, create), L.rotationBackupCreate);

        button.trigger();
        await settle();

        assert.deepEqual(calls.filter((entry) => entry[0] === 'copy'), []);
        assert.deepEqual(calls.filter((entry) => entry[0] === 'writeJson'), []);
        assert.deepEqual(h.obsidian.notices.map((notice) => notice.message), [L.noChanges]);
    } finally { await settle(); h.restore(); }
});

test('key order in the stored backup does not read as a change', async () => {
    const h = setupHarness();
    try {
        const { tab, calls, L } = makeTab(h, {
            generationOne: { sessions: { b: 2, a: 1 }, _wppSavedAt: 5 },
            plugin: { extractSessionData() { return { sessions: { a: 1, b: 2 } }; } },
        });
        const create = rowNamed(
            [pageNamed(tab.getSettingDefinitions(), L.rotationBackupSectionTitle)],
            L.rotationBackupCreate,
        );

        buttonOf(renderRow(h, create), L.rotationBackupCreate).trigger();
        await settle();

        // One side is parsed from a file and the other assembled from live
        // state, so their key order differs by construction.
        assert.deepEqual(calls.filter((entry) => entry[0] === 'copy'), []);
        assert.deepEqual(h.obsidian.notices.map((notice) => notice.message), [L.noChanges]);
    } finally { await settle(); h.restore(); }
});

test('a press that has something new to record backs it up and says so', async () => {
    const h = setupHarness();
    try {
        const { tab, calls, L } = makeTab(h, {
            generationOne: { sessions: { a: 1 } },
            plugin: { extractSessionData() { return { sessions: { a: 1, b: 2 } }; } },
        });
        const create = rowNamed(
            [pageNamed(tab.getSettingDefinitions(), L.rotationBackupSectionTitle)],
            L.rotationBackupCreate,
        );

        buttonOf(renderRow(h, create), L.rotationBackupCreate).trigger();
        await settle();

        assert.equal(calls.filter((entry) => entry[0] === 'copy').length, 2);
        assert.deepEqual(h.obsidian.notices.map((notice) => notice.message), [L.rotationBackupCreated]);
    } finally { await settle(); h.restore(); }
});

test('a backup that cannot be read is not taken as a reason to skip one', async () => {
    const h = setupHarness();
    try {
        const { tab, calls, L } = makeTab(h, {
            plugin: { readJsonIfExists() { return Promise.reject(new Error('unreadable')); } },
        });
        const create = rowNamed(
            [pageNamed(tab.getSettingDefinitions(), L.rotationBackupSectionTitle)],
            L.rotationBackupCreate,
        );

        buttonOf(renderRow(h, create), L.rotationBackupCreate).trigger();
        await settle();

        assert.equal(calls.filter((entry) => entry[0] === 'copy').length, 2);
        assert.deepEqual(h.obsidian.notices.map((notice) => notice.message), [L.rotationBackupCreated]);
    } finally { await settle(); h.restore(); }
});

test('a write that fails says so rather than reporting a backup that is not there', async () => {
    const h = setupHarness();
    try {
        const { tab, L } = makeTab(h, {
            plugin: { writeJson() { return Promise.reject(new Error('disk full')); } },
        });
        const create = rowNamed(
            [pageNamed(tab.getSettingDefinitions(), L.rotationBackupSectionTitle)],
            L.rotationBackupCreate,
        );

        buttonOf(renderRow(h, create), L.rotationBackupCreate).trigger();
        await settle();

        assert.deepEqual(h.obsidian.notices.map((notice) => notice.message), [L.rotationBackupFailed]);
    } finally { await settle(); h.restore(); }
});

test('a second click on create cannot rotate the generations twice', async () => {
    const h = setupHarness();
    try {
        const { tab, calls, L } = makeTab(h);
        const create = rowNamed(
            [pageNamed(tab.getSettingDefinitions(), L.rotationBackupSectionTitle)],
            L.rotationBackupCreate,
        );
        const button = buttonOf(renderRow(h, create), L.rotationBackupCreate);

        button.trigger();
        button.trigger();
        await settle();

        // Two rotations would push the backup just taken straight out of the
        // three-generation window.
        assert.equal(calls.filter((entry) => entry[0] === 'copy').length, 2);
    } finally { await settle(); h.restore(); }
});

test('each generation gets its own row, with the time that identifies it', async () => {
    const h = setupHarness();
    try {
        const { tab, L } = makeTab(h, {
            plugin: {
                getRotationBackupInfo() {
                    return Promise.resolve([
                        { generation: 1, savedAt: 1000, sessionCount: 3, backupPlatform: 'macOS' },
                        { generation: 2, savedAt: 500, sessionCount: 2 },
                    ]);
                },
            },
        });
        tab.getSettingDefinitions();
        await settle();

        const page = pageNamed(tab.getSettingDefinitions(), L.rotationBackupSectionTitle);
        // The create row, plus one row per generation.
        const backupRows = rows([page]).filter((row) => row.name !== L.rotationBackupCreate);
        assert.equal(backupRows.length, 2);
        assert.ok(backupRows[0].name.startsWith('1.'), backupRows[0].name);
        assert.ok(backupRows[1].name.startsWith('2.'), backupRows[1].name);
        // The platform is only in the summary when the file recorded one.
        assert.ok(backupRows[0].desc.includes('macOS'));
        assert.ok(!backupRows[1].desc.includes('macOS'));
    } finally { await settle(); h.restore(); }
});

test('restoring a backup asks first, and restores the generation that was named', async () => {
    const h = setupHarness();
    try {
        const { tab, calls, L } = makeTab(h);
        tab.getSettingDefinitions();
        await settle();

        const page = pageNamed(tab.getSettingDefinitions(), L.rotationBackupSectionTitle);
        const backupRow = rows([page]).find((row) => row.name.startsWith('1.'));
        assert.ok(backupRow, 'the one backup the double reports');

        const restore = () => buttonOf(renderRow(h, backupRow), L.rotationBackupRestore);

        restore().trigger();
        confirmOrCancel(h, 0);
        assert.deepEqual(calls.filter((entry) => entry[0] === 'restore'), []);

        restore().trigger();
        confirmOrCancel(h, 1);
        assert.deepEqual(calls.filter((entry) => entry[0] === 'restore'), [['restore', 1]]);
    } finally { await settle(); h.restore(); }
});

test('the backup page says so when there is nothing in it, rather than showing a bare heading', async () => {
    const h = setupHarness();
    try {
        const { tab, L } = makeTab(h, {
            plugin: { getRotationBackupInfo() { return Promise.resolve([]); } },
        });
        tab.getSettingDefinitions();
        await settle();

        const page = pageNamed(tab.getSettingDefinitions(), L.rotationBackupSectionTitle);
        const names = rows([page]).map((row) => row.name);
        assert.ok(names.includes(L.rotationBackupNone));
        assert.equal(resolve(page.displayValue), '', 'and the door says nothing either');
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
