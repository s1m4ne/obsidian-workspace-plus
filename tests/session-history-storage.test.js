'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { installObsidianStub, setupHarness } = require('./lock/harness/index.ts');

installObsidianStub();

const i18n = require('../src/i18n.ts');
i18n.resolveLocale('en');

const { PersistenceService } = require('../src/storage/persistence-service.ts');
const sessionSync = require('../src/storage/session-sync.ts');
const storageTransfer = require('../src/storage/storage-transfer.ts');

// plugin-folder mode keeps the sessions inside data.json.
const DATA_PATH = '.obsidian/plugins/workspace-plus-plus/data.json';
const LEGACY_SESSIONS_PATH = '.obsidian/plugins/workspace-plus-plus/sessions.json';
const HISTORY_PATH = '.obsidian/plugins/workspace-plus-plus/history.json';

function historyEntry(at) {
    return { layout: { main: { id: 'leaf-' + at } }, savedAt: at };
}

function createPlugin(options) {
    options = options || {};

    const manifest = { id: 'workspace-plus-plus', dir: '.obsidian/plugins/workspace-plus-plus' };
    const data = Object.assign({
        activeSessionId: 'a',
        sessionOrder: ['a', 'b'],
        sessions: {
            a: { id: 'a', name: 'A', modified: 10, layout: { a: true }, history: [historyEntry(3), historyEntry(2)] },
            b: { id: 'b', name: 'B', modified: 20, layout: { b: true } },
        },
        groups: {},
        groupOrder: [],
        sessionGroups: {},
        activeGroupId: null,
    }, options.data || {});

    const files = Object.assign({}, options.files);
    const writes = [];

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
                    writes.push(path);
                    return Promise.resolve();
                },
                remove: (path) => {
                    delete files[path];
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
            files[DATA_PATH] = JSON.stringify(savedValue);
            return Promise.resolve();
        },
        normalizeSessionData: (d) => persistenceService.normalizeSessionData(d),
        extractSessionData: (d) => persistenceService.extractSessionData(d),
        getSessionsPath: () => persistenceService.getSessionsPath(),
        readJsonIfExists: (path) => persistenceService.getJsonStore().readJsonIfExists(path),
        getFileMtime: (path) => persistenceService.getJsonStore().getFileMtime(path),
        loadSessionDataFromStorage: () => persistenceService.loadSessionDataFromStorage(),
        // No-op UI hooks: nothing under test reads them back.
        syncSessionOrder: () => {},
        normalizeGroupFeatureState: () => {},
        updateStatusBar: () => {},
        syncSessionCommands: () => {},
        notifySessionsChanged: () => {},
        // Real implementations, matching production when session-sync is
        // attached: persistDataImmediate()'s reload-if-changed step and its
        // record-what-was-written step both run for real here.
        recordSessionStorageState: function (stamp, mtime, sessionData) {
            return sessionSync.recordSessionStorageState(host, stamp, mtime, sessionData);
        },
        recordSessionDataStored: function (sessionData) {
            return sessionSync.recordSessionDataStored(host, sessionData);
        },
        reloadExternalSessionStorageIfChanged: function (opts) {
            return sessionSync.reloadExternalSessionStorageIfChanged(host, opts);
        },
        // Backup rotation is unrelated to what these tests check and is
        // stubbed out, same as the original plugin mock did.
        rotateBackupIfNeeded: () => Promise.resolve(),
        clearVersionHistoryEntries: () => false,
        resetSessionsToDefault: () => Promise.resolve(false),
        persistData: () => persistenceService.persistData(),
        persistDataImmediate: () => persistenceService.persistDataImmediate(),
        clearBackupFiles: () => persistenceService.clearBackupFiles(),
        ensureDir: (path) => persistenceService.ensureDir(path),
    };
    persistenceService = new PersistenceService(host);
    persistenceService.setRuntimeSessionStorageLocation('plugin-folder');

    return {
        persistenceService: persistenceService,
        host: host,
        data: data,
        files: files,
        getWrites: function () {
            return writes.slice();
        },
        exportSessionsSnapshot: function () {
            return storageTransfer.exportSessionsSnapshot({
                data: data,
                manifest: manifest,
                getExportDirPath: () => persistenceService.getExportDirPath(),
                extractSessionData: (d) => persistenceService.extractSessionData(d),
                ensureSessionStorageDir: () => persistenceService.ensureSessionStorageDir(),
                ensureDir: host.ensureDir,
                writeJson: (path, payload, pretty) => persistenceService.writeJson(path, payload, pretty),
            });
        },
    };
}


test('persisting writes history to its own file and keeps sessions history-free', async function () {
    const plugin = createPlugin();

    await plugin.persistenceService.persistDataImmediate();

    const stored = JSON.parse(plugin.files[DATA_PATH]);
    assert.equal(stored.sessions.a.history, undefined, 'the stored sessions must not carry history');
    assert.equal(stored.sessions.a.name, 'A');

    const history = JSON.parse(plugin.files[HISTORY_PATH]);
    assert.equal(history.version, 1);
    assert.equal(history.history.a.length, 2);
    assert.equal(history.history.a[0].savedAt, 3);
    assert.equal(history.history.b, undefined, 'sessions without history are omitted');
});

test('persisting does not strip history from the live in-memory session', async function () {
    const plugin = createPlugin();

    await plugin.persistenceService.persistDataImmediate();

    // extractSessionData() hands back this.data.sessions by reference, so a naive
    // in-place strip would wipe the history the history modal is still reading.
    assert.ok(Array.isArray(plugin.data.sessions.a.history), 'in-memory history must survive a save');
    assert.equal(plugin.data.sessions.a.history.length, 2);
});

test('the immediate backup is history-free as well', async function () {
    const plugin = createPlugin();

    await plugin.persistenceService.persistDataImmediate();

    const backup = JSON.parse(plugin.files['.obsidian/plugins/workspace-plus-plus/sessions.backup.json']);
    assert.equal(backup.sessions.a.history, undefined);
});

test('history for deleted sessions is pruned instead of leaking', async function () {
    const plugin = createPlugin({
        files: {
            [HISTORY_PATH]: JSON.stringify({
                version: 1,
                history: { a: [historyEntry(1)], gone: [historyEntry(9)] },
            }),
        },
    });

    await plugin.persistenceService.persistDataImmediate();

    const history = JSON.parse(plugin.files[HISTORY_PATH]);
    assert.deepEqual(Object.keys(history.history), ['a'], 'orphaned history must be dropped');
});

test('loading merges history.json back onto the sessions', async function () {
    const plugin = createPlugin({
        files: {
            [LEGACY_SESSIONS_PATH]: JSON.stringify({
                activeSessionId: 'a',
                sessionOrder: ['a'],
                sessions: { a: { id: 'a', name: 'A', modified: 10, layout: { a: true } } },
            }),
            [HISTORY_PATH]: JSON.stringify({
                version: 1,
                history: { a: [historyEntry(7)] },
            }),
        },
    });

    const loaded = await plugin.persistenceService.loadWithBackup();

    assert.equal(loaded.sessions.a.history.length, 1);
    assert.equal(loaded.sessions.a.history[0].savedAt, 7);
});

test('legacy inline history is kept and migrated to history.json on load', async function () {
    const plugin = createPlugin({
        files: {
            [LEGACY_SESSIONS_PATH]: JSON.stringify({
                activeSessionId: 'a',
                sessionOrder: ['a'],
                sessions: {
                    a: { id: 'a', name: 'A', modified: 10, layout: { a: true }, history: [historyEntry(5)] },
                },
            }),
        },
    });

    const loaded = await plugin.persistenceService.loadWithBackup();

    assert.equal(loaded.sessions.a.history.length, 1, 'inline history must not be dropped');
    assert.equal(loaded.sessions.a.history[0].savedAt, 5);

    const history = JSON.parse(plugin.files[HISTORY_PATH]);
    assert.equal(history.history.a.length, 1, 'inline history is written out on load');
});

test('history.json wins over stale inline history', async function () {
    const plugin = createPlugin({
        files: {
            [LEGACY_SESSIONS_PATH]: JSON.stringify({
                activeSessionId: 'a',
                sessionOrder: ['a'],
                sessions: {
                    a: { id: 'a', name: 'A', modified: 10, layout: { a: true }, history: [historyEntry(1)] },
                },
            }),
            [HISTORY_PATH]: JSON.stringify({
                version: 1,
                history: { a: [historyEntry(8)] },
            }),
        },
    });

    const loaded = await plugin.persistenceService.loadWithBackup();

    assert.equal(loaded.sessions.a.history[0].savedAt, 8);
});

test('exported snapshots leave version history behind', async function () {
    const harness = setupHarness();
    try {
        const plugin = createPlugin();
        plugin.host.ensureDir = () => Promise.resolve();

        const countBefore = harness.obsidian.notices.length;
        await plugin.exportSessionsSnapshot();

        const exportPath = plugin.getWrites().find((p) => p.includes('/exports/'));
        assert.ok(exportPath, 'an export file should be written');
        const payload = JSON.parse(plugin.files[exportPath]);
        assert.equal(payload.data.sessions.a.history, undefined);
        assert.equal(harness.obsidian.notices.length, countBefore + 1);
    } finally {
        harness.restore();
    }
});

test('reset cleanup targets the history file', function () {
    const plugin = createPlugin();

    assert.ok(
        plugin.persistenceService.getBackupFilePaths().includes(HISTORY_PATH),
        'clearing backups must also clear recovery-only history'
    );
});
