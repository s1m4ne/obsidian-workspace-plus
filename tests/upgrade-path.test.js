'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { installObsidianStub } = require('./lock/harness/index.ts');

installObsidianStub();

const i18n = require('../src/i18n.ts');
i18n.resolveLocale('en');

const { PersistenceService } = require('../src/storage/persistence-service.ts');
const sessionSync = require('../src/storage/session-sync.ts');

const PLUGIN_DIR = '.obsidian/plugins/workspace-plus-plus';
const DATA_PATH = PLUGIN_DIR + '/data.json';
const LEGACY_SESSIONS_PATH = PLUGIN_DIR + '/sessions.json';
const HISTORY_PATH = PLUGIN_DIR + '/history.json';
const LOCAL_SETTINGS_PATH = '.workspace-plus-plus/settings.local.json';

function createPlugin(files) {
    const manifest = { id: 'workspace-plus-plus', dir: PLUGIN_DIR };
    const pluginFiles = Object.assign({}, files);
    const renames = [];
    const data = {};

    const app = {
        vault: {
            adapter: {
                exists: (p) => Promise.resolve(
                    Object.prototype.hasOwnProperty.call(pluginFiles, p)
                    || p === PLUGIN_DIR || p === '.workspace-plus-plus'
                ),
                mkdir: () => Promise.resolve(),
                read: (p) => (
                    Object.prototype.hasOwnProperty.call(pluginFiles, p)
                        ? Promise.resolve(pluginFiles[p])
                        : Promise.reject(new Error('missing ' + p))
                ),
                write: (p, raw) => {
                    pluginFiles[p] = raw;
                    return Promise.resolve();
                },
                remove: (p) => {
                    delete pluginFiles[p];
                    return Promise.resolve();
                },
                rename: (from, to) => {
                    renames.push([from, to]);
                    pluginFiles[to] = pluginFiles[from];
                    delete pluginFiles[from];
                    return Promise.resolve();
                },
                stat: (p) => Promise.resolve(
                    Object.prototype.hasOwnProperty.call(pluginFiles, p)
                        ? { mtime: 1000, size: pluginFiles[p].length }
                        : null
                ),
            },
        },
    };

    let persistenceService;
    const host = {
        data: data,
        manifest: manifest,
        app: app,
        loadData: () => Promise.resolve(
            Object.prototype.hasOwnProperty.call(pluginFiles, DATA_PATH)
                ? JSON.parse(pluginFiles[DATA_PATH])
                : null
        ),
        saveData: (savedValue) => {
            pluginFiles[DATA_PATH] = JSON.stringify(savedValue);
            return Promise.resolve();
        },
        normalizeSessionData: (d) => persistenceService.normalizeSessionData(d),
        getSessionsPath: () => persistenceService.getSessionsPath(),
        readJsonIfExists: (path) => persistenceService.getJsonStore().readJsonIfExists(path),
        getFileMtime: (path) => persistenceService.getJsonStore().getFileMtime(path),
        // Real implementations, not stubs: this is what the production adapter
        // wires when session-sync is attached, and loadWithBackup()'s legacy
        // migration path exercises them for real (recording the stamp/mtime it
        // just wrote).
        recordSessionStorageState: function (stamp, mtime, sessionData) {
            return sessionSync.recordSessionStorageState(host, stamp, mtime, sessionData);
        },
        recordSessionDataStored: function (sessionData) {
            return sessionSync.recordSessionDataStored(host, sessionData);
        },
        reloadExternalSessionStorageIfChanged: () => Promise.resolve(false),
        rotateBackupIfNeeded: () => Promise.resolve(),
        clearVersionHistoryEntries: () => false,
        resetSessionsToDefault: () => Promise.resolve(false),
        persistData: () => persistenceService.persistData(),
        persistDataImmediate: () => persistenceService.persistDataImmediate(),
        clearBackupFiles: () => persistenceService.clearBackupFiles(),
    };
    persistenceService = new PersistenceService(host);

    return {
        persistenceService: persistenceService,
        files: pluginFiles,
        getRenames: function () {
            return renames.slice();
        },
        resetRenames: function () {
            renames.length = 0;
        },
    };
}

// A 0.7.17 install that used every feature the storage rework touched:
// sessions in the plugin folder's sessions.json, version history inlined on each
// session, and vault-local settings in their own file. All three migrations run
// during a single load, and they have to not trip over each other.
test('a 0.7.17 install upgrades cleanly in one load', async function () {
    const plugin = createPlugin({
        [DATA_PATH]: JSON.stringify({
            language: 'en',
            autoSaveOnSwitch: true,
            numberedSwitchCommands: false,
            sessionStorageLocation: 'plugin-folder',
        }),
        [LEGACY_SESSIONS_PATH]: JSON.stringify({
            activeSessionId: 's1',
            sessionOrder: ['s1', 's2'],
            sessions: {
                s1: {
                    id: 's1',
                    name: 'Work',
                    modified: 100,
                    layout: { main: 'work' },
                    history: [{ layout: { main: 'old-work' }, savedAt: 90 }],
                },
                s2: { id: 's2', name: 'Reading', modified: 200, layout: { main: 'reading' } },
            },
            groups: { g1: { id: 'g1', name: 'Group' } },
            groupOrder: ['g1'],
            sessionGroups: { s1: ['g1'] },
            _wppSavedAt: 500,
        }),
        [LOCAL_SETTINGS_PATH]: JSON.stringify({ language: 'ja' }),
    });

    const loaded = await plugin.persistenceService.loadWithBackup();

    // Sessions survive, with history reattached in memory.
    assert.deepEqual(Object.keys(loaded.sessions).sort(), ['s1', 's2']);
    assert.equal(loaded.sessions.s1.name, 'Work');
    assert.equal(loaded.sessions.s1.history.length, 1);
    assert.deepEqual(loaded.groups.g1, { id: 'g1', name: 'Group' });
    assert.deepEqual(loaded.sessionGroups.s1, ['g1']);

    // Vault-local settings won, and untouched settings kept their value.
    assert.equal(loaded.language, 'ja');
    assert.equal(loaded.numberedSwitchCommands, false);

    // data.json now carries both settings and sessions.
    const stored = JSON.parse(plugin.files[DATA_PATH]);
    assert.equal(stored.language, 'ja');
    assert.equal(stored.sessions.s1.name, 'Work');
    assert.equal(stored.sessions.s1.history, undefined, 'history must not ride along in data.json');

    // History landed in its own local file.
    const history = JSON.parse(plugin.files[HISTORY_PATH]);
    assert.equal(history.version, 1);
    assert.equal(history.history.s1.length, 1);
    assert.equal(history.history.s2, undefined);

    // Nothing was destroyed on the way.
    assert.ok(plugin.files[LEGACY_SESSIONS_PATH], 'the old sessions file is kept');
    assert.deepEqual(
        plugin.getRenames(),
        [[LOCAL_SETTINGS_PATH, LOCAL_SETTINGS_PATH + '.migrated']],
        'local settings are renamed, not deleted'
    );
});

test('the upgraded install is stable on the next load', async function () {
    const plugin = createPlugin({
        [DATA_PATH]: JSON.stringify({
            language: 'en',
            sessionStorageLocation: 'plugin-folder',
        }),
        [LEGACY_SESSIONS_PATH]: JSON.stringify({
            activeSessionId: 's1',
            sessionOrder: ['s1'],
            sessions: {
                s1: {
                    id: 's1',
                    name: 'Work',
                    modified: 100,
                    layout: {},
                    history: [{ layout: {}, savedAt: 90 }],
                },
            },
            groups: {},
            groupOrder: [],
            sessionGroups: {},
        }),
    });

    await plugin.persistenceService.loadWithBackup();
    const afterFirst = plugin.files[DATA_PATH];
    plugin.resetRenames();

    // Second launch: nothing left to migrate, and the leftover sessions.json must
    // not overwrite what data.json now holds.
    const second = await plugin.persistenceService.loadWithBackup();

    assert.equal(second.sessions.s1.name, 'Work');
    assert.equal(second.sessions.s1.history.length, 1);
    assert.equal(plugin.files[DATA_PATH], afterFirst, 'a settled install rewrites nothing');
    assert.deepEqual(plugin.getRenames(), []);
});

test('a vault-folder install is not dragged into data.json', async function () {
    const plugin = createPlugin({
        [DATA_PATH]: JSON.stringify({
            language: 'en',
            sessionStorageLocation: 'vault-folder',
        }),
        '.workspace-plus-plus/sessions.json': JSON.stringify({
            activeSessionId: 'v1',
            sessionOrder: ['v1'],
            sessions: { v1: { id: 'v1', name: 'Vault', modified: 10, layout: {} } },
            groups: {},
            groupOrder: [],
            sessionGroups: {},
        }),
    });

    const loaded = await plugin.persistenceService.loadWithBackup();

    assert.equal(loaded.sessions.v1.name, 'Vault');
    const stored = JSON.parse(plugin.files[DATA_PATH]);
    assert.equal(stored.sessions, undefined, 'multi-vault installs keep sessions out of .obsidian');
});
