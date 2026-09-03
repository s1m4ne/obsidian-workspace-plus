'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { installObsidianStub } = require('./lock/harness/index.ts');

installObsidianStub();

const i18n = require('../src/i18n.ts');
i18n.resolveLocale('en');

const { PersistenceService } = require('../src/storage/persistence-service.ts');
const { HistoryService } = require('../src/state/history-service.ts');

function createPlugin(options) {
    options = options || {};

    const existingFiles = new Set(options.files || []);
    const removedFiles = [];
    let persistCalls = 0;

    const data = Object.assign({
        activeSessionId: 'a',
        sessions: {
            a: {
                id: 'a',
                name: 'A',
                history: [{ savedAt: 1, layout: { a: true } }],
            },
            b: {
                id: 'b',
                name: 'B',
                history: [],
            },
            c: {
                id: 'c',
                name: 'C',
            },
        },
    }, options.data || {});

    const historyService = new HistoryService({ data });

    let persistenceService;
    const host = {
        data: data,
        manifest: { dir: '.obsidian/plugins/workspace-plus-plus' },
        app: {
            vault: {
                adapter: {
                    exists: function (path) {
                        // A directory exists when something is in it, which is
                        // what a vault adapter reports and what listing the
                        // backup pool depends on.
                        if (existingFiles.has(path)) return Promise.resolve(true);
                        const prefix = path + '/';
                        return Promise.resolve([...existingFiles].some((f) => f.startsWith(prefix)));
                    },
                    remove: function (path) {
                        removedFiles.push(path);
                        existingFiles.delete(path);
                        return Promise.resolve();
                    },
                    // The rotating backups are a directory now, so clearing
                    // them means listing it.
                    list: function (path) {
                        const prefix = path + '/';
                        return Promise.resolve({
                            files: [...existingFiles].filter((f) => f.startsWith(prefix)),
                            folders: [],
                        });
                    },
                    read: function (path) {
                        return existingFiles.has(path)
                            ? Promise.resolve(JSON.stringify({ _wppSavedAt: 1, sessions: {} }))
                            : Promise.reject(new Error('missing'));
                    },
                    stat: function (path) {
                        return Promise.resolve(existingFiles.has(path) ? { mtime: 1, size: 10 } : null);
                    },
                },
            },
        },
        clearVersionHistoryEntries: function () {
            return historyService.clearVersionHistoryEntries();
        },
        persistData: function () {
            persistCalls += 1;
            return Promise.resolve(true);
        },
        resetSessionsToDefault: function () {
            return Promise.resolve(false);
        },
        clearBackupFiles: function () {
            return persistenceService.clearBackupFiles();
        },
        readJsonIfExists: function (path) {
            return persistenceService.getJsonStore().readJsonIfExists(path);
        },
    };
    persistenceService = new PersistenceService(host);

    return {
        persistenceService: persistenceService,
        host: host,
        data: data,
        getPersistCalls: function () {
            return persistCalls;
        },
        getRemovedFiles: function () {
            return removedFiles.slice();
        },
        hasFile: function (path) {
            return existingFiles.has(path);
        },
    };
}

test('clearBackupsAndVersionHistory removes backup files and session history', async function () {
    const files = [
        '.workspace-plus-plus/sessions.backup.json',
        '.workspace-plus-plus/backups/sessions.1700000000000.json',
        '.workspace-plus-plus/backups/sessions.1700003600000.json',
        '.workspace-plus-plus/backups/sessions.1700007200000.json',
        '.obsidian/plugins/workspace-plus-plus/data.backup.json',
        '.workspace-plus-plus/exports/sessions-keep.json',
    ];
    const plugin = createPlugin({ files: files });
    plugin.persistenceService.setLastRotationBackupAt(123);

    await plugin.persistenceService.clearBackupsAndVersionHistory();

    assert.equal(plugin.data.sessions.a.history, undefined);
    assert.equal(plugin.data.sessions.b.history, undefined);
    assert.equal(Object.prototype.hasOwnProperty.call(plugin.data.sessions.c, 'history'), false);
    assert.equal(plugin.getPersistCalls(), 1);
    assert.equal(plugin.persistenceService.getLastRotationBackupAt(), 0);

    const removed = plugin.getRemovedFiles().sort();
    assert.deepEqual(removed, [
        '.obsidian/plugins/workspace-plus-plus/data.backup.json',
        '.workspace-plus-plus/backups/sessions.1700000000000.json',
        '.workspace-plus-plus/backups/sessions.1700003600000.json',
        '.workspace-plus-plus/backups/sessions.1700007200000.json',
        '.workspace-plus-plus/sessions.backup.json',
    ]);
    assert.equal(plugin.hasFile('.workspace-plus-plus/exports/sessions-keep.json'), true);
});

test('clearBackupsAndVersionHistory deletes backups even when no history exists', async function () {
    const plugin = createPlugin({
        files: ['.workspace-plus-plus/sessions.backup.json'],
        data: {
            sessions: {
                a: { id: 'a', name: 'A' },
            },
        },
    });

    await plugin.persistenceService.clearBackupsAndVersionHistory();

    assert.equal(plugin.getPersistCalls(), 0);
    assert.deepEqual(plugin.getRemovedFiles(), ['.workspace-plus-plus/sessions.backup.json']);
});

test('resetSessionsAndSettingsToDefault also clears backup files', async function () {
    const plugin = createPlugin();
    let sessionsReset = false;
    let backupsCleared = false;

    plugin.host.resetSessionsToDefault = function () {
        sessionsReset = true;
        return Promise.resolve(true);
    };
    plugin.host.clearBackupFiles = function () {
        backupsCleared = true;
        return Promise.resolve(true);
    };

    await plugin.persistenceService.resetSessionsAndSettingsToDefault();

    assert.equal(sessionsReset, true);
    assert.equal(backupsCleared, true);
});
