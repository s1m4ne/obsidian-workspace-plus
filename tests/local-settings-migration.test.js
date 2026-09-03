'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { installObsidianStub } = require('./lock/harness/index.ts');

installObsidianStub();

const i18n = require('../src/i18n.ts');
i18n.resolveLocale('en');

const { PersistenceService } = require('../src/storage/persistence-service.ts');

const LEGACY_PATH = '.workspace-plus-plus/settings.local.json';
const MIGRATED_PATH = '.workspace-plus-plus/settings.local.json.migrated';
const DATA_PATH = '.obsidian/plugins/workspace-plus-plus/data.json';

function createPlugin(options) {
    options = options || {};

    const manifest = { id: 'workspace-plus-plus', dir: '.obsidian/plugins/workspace-plus-plus' };
    const files = Object.assign({}, options.files);
    const renames = [];
    let savedData = null;

    const data = {
        sessions: {},
        sessionOrder: [],
        groups: {},
        groupOrder: [],
        sessionGroups: {},
        activeSessionId: null,
        activeGroupId: null,
    };

    const app = {
        vault: {
            adapter: {
                exists: (path) => Promise.resolve(
                    Object.prototype.hasOwnProperty.call(files, path)
                    || path === manifest.dir
                ),
                mkdir: () => Promise.resolve(),
                read: (path) => (
                    Object.prototype.hasOwnProperty.call(files, path)
                        ? Promise.resolve(files[path])
                        : Promise.reject(new Error('missing ' + path))
                ),
                write: (path, raw) => {
                    files[path] = raw;
                    return Promise.resolve();
                },
                remove: (path) => {
                    delete files[path];
                    return Promise.resolve();
                },
                rename: (from, to) => {
                    renames.push([from, to]);
                    files[to] = files[from];
                    delete files[from];
                    return Promise.resolve();
                },
                stat: () => Promise.resolve({ mtime: 1000 }),
            },
        },
    };

    let persistenceService;
    const host = {
        data: data,
        manifest: manifest,
        app: app,
        loadData: () => Promise.resolve(
            Object.prototype.hasOwnProperty.call(files, DATA_PATH)
                ? JSON.parse(files[DATA_PATH])
                : null
        ),
        saveData: (savedValue) => {
            savedData = savedValue;
            files[DATA_PATH] = JSON.stringify(savedValue);
            return Promise.resolve();
        },
        reloadExternalSessionStorageIfChanged: () => Promise.resolve(false),
        recordSessionDataStored: () => Promise.resolve(true),
        recordSessionStorageState: () => {},
        rotateBackupIfNeeded: () => Promise.resolve(),
        clearVersionHistoryEntries: () => false,
        resetSessionsToDefault: () => Promise.resolve(false),
        persistData: () => persistenceService.persistData(),
        persistDataImmediate: () => persistenceService.persistDataImmediate(),
        clearBackupFiles: () => persistenceService.clearBackupFiles(),
        readJsonIfExists: (path) => persistenceService.getJsonStore().readJsonIfExists(path),
        getFileMtime: (path) => persistenceService.getJsonStore().getFileMtime(path),
    };
    persistenceService = new PersistenceService(host);

    return {
        persistenceService: persistenceService,
        data: data,
        files: files,
        getRenames: function () {
            return renames.slice();
        },
        getSavedData: function () {
            return savedData;
        },
    };
}

test('legacy vault-local settings are folded into data.json and the file is renamed', async function () {
    const plugin = createPlugin({
        files: {
            [DATA_PATH]: JSON.stringify({ language: 'en', autoSaveOnSwitch: true }),
            [LEGACY_PATH]: JSON.stringify({ language: 'ja', autoSaveOnSwitch: false }),
        },
    });

    const loaded = await plugin.persistenceService.loadWithBackup();

    assert.equal(loaded.language, 'ja', 'the vault-local value is what the user actually saw');
    assert.equal(loaded.autoSaveOnSwitch, false);

    assert.deepEqual(plugin.getRenames(), [[LEGACY_PATH, MIGRATED_PATH]], 'the old file is renamed, not deleted');
    assert.equal(plugin.files[LEGACY_PATH], undefined);
    assert.ok(plugin.files[MIGRATED_PATH], 'the migrated copy is kept as a safety net');

    const written = JSON.parse(plugin.files[DATA_PATH]);
    assert.equal(written.language, 'ja', 'data.json now carries the merged settings');
    assert.equal(written.autoSaveOnSwitch, false);
});

test('settings absent from the legacy file keep their data.json value', async function () {
    const plugin = createPlugin({
        files: {
            [DATA_PATH]: JSON.stringify({ language: 'en', numberedSwitchCommands: false }),
            [LEGACY_PATH]: JSON.stringify({ language: 'ja' }),
        },
    });

    const loaded = await plugin.persistenceService.loadWithBackup();

    assert.equal(loaded.language, 'ja');
    assert.equal(loaded.numberedSwitchCommands, false, 'untouched keys must not be reset to the default');
});

test('loading is a no-op when no legacy file exists', async function () {
    const plugin = createPlugin({
        files: { [DATA_PATH]: JSON.stringify({ language: 'ja' }) },
    });

    const loaded = await plugin.persistenceService.loadWithBackup();

    assert.equal(loaded.language, 'ja');
    assert.deepEqual(plugin.getRenames(), []);
});

test('an unreadable legacy file is left alone instead of dropping settings', async function () {
    const plugin = createPlugin({
        files: {
            [DATA_PATH]: JSON.stringify({ language: 'ja' }),
            [LEGACY_PATH]: '{ this is not json',
        },
    });

    const loaded = await plugin.persistenceService.loadWithBackup();

    assert.equal(loaded.language, 'ja', 'existing settings survive');
    assert.deepEqual(plugin.getRenames(), [], 'the file stays put so it can be recovered by hand');
    assert.ok(plugin.files[LEGACY_PATH], 'and is not destroyed');
});

test('the vault-local settings API is gone', function () {
    const plugin = createPlugin();

    for (const name of [
        'isUsingLocalSettings',
        'setUseLocalSettings',
        'copyGlobalSettingsToLocal',
        'resetLocalSettings',
        'getLocalSettingsPath',
        'loadLocalSettingsData',
    ]) {
        assert.equal(typeof plugin.persistenceService[name], 'undefined', name + ' should no longer exist');
    }
});

test('storage diagnostics no longer advertise a settings file at all', function () {
    const plugin = createPlugin();

    const info = plugin.persistenceService.getStorageDiagnosticsInfo();

    // There is only one settings file now, and it is the same data.json the
    // sessions row already points at, so neither row carries information.
    assert.equal(info.localSettingsPath, undefined);
    assert.equal(info.globalSettingsPath, undefined);
});
