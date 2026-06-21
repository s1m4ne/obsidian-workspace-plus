'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');

function loadMethods() {
    const obsidianStub = {
        Notice: class {
            constructor(_message) {}
        },
        Platform: {},
    };
    const originalLoad = Module._load;
    Module._load = function (request, parent, isMain) {
        if (request === 'obsidian') return obsidianStub;
        return originalLoad(request, parent, isMain);
    };

    try {
        return {
            attachPersistenceMethods: require('../src/plugin/methods/persistence'),
            attachHistoryMethods: require('../src/plugin/methods/history'),
        };
    } finally {
        Module._load = originalLoad;
    }
}

const methods = loadMethods();
const attachPersistenceMethods = methods.attachPersistenceMethods;
const attachHistoryMethods = methods.attachHistoryMethods;

function createPlugin(options) {
    options = options || {};
    function PluginMock() {}
    attachPersistenceMethods(PluginMock);
    attachHistoryMethods(PluginMock);

    const existingFiles = new Set(options.files || []);
    const removedFiles = [];
    const plugin = new PluginMock();

    plugin.manifest = {
        dir: '.obsidian/plugins/workspace-plus-plus',
    };
    plugin.data = Object.assign({
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
    plugin.persistCalls = 0;
    plugin.app = {
        vault: {
            adapter: {
                exists: function (path) {
                    return Promise.resolve(existingFiles.has(path));
                },
                remove: function (path) {
                    removedFiles.push(path);
                    existingFiles.delete(path);
                    return Promise.resolve();
                },
            },
        },
    };
    plugin.persistData = function () {
        plugin.persistCalls += 1;
        return Promise.resolve(true);
    };
    plugin.getRemovedFiles = function () {
        return removedFiles.slice();
    };
    plugin.hasFile = function (path) {
        return existingFiles.has(path);
    };

    return plugin;
}

test('clearBackupsAndVersionHistory removes backup files and session history', async function () {
    const files = [
        '.workspace-plus-plus/sessions.backup.json',
        '.workspace-plus-plus/backups/sessions.1.json',
        '.workspace-plus-plus/backups/sessions.2.json',
        '.workspace-plus-plus/backups/sessions.3.json',
        '.obsidian/plugins/workspace-plus-plus/data.backup.json',
        '.workspace-plus-plus/exports/sessions-keep.json',
    ];
    const plugin = createPlugin({ files: files });
    plugin._lastRotationBackupAt = 123;

    await plugin.clearBackupsAndVersionHistory();

    assert.equal(plugin.data.sessions.a.history, undefined);
    assert.equal(plugin.data.sessions.b.history, undefined);
    assert.equal(Object.prototype.hasOwnProperty.call(plugin.data.sessions.c, 'history'), false);
    assert.equal(plugin.persistCalls, 1);
    assert.equal(plugin._lastRotationBackupAt, 0);

    const removed = plugin.getRemovedFiles().sort();
    assert.deepEqual(removed, [
        '.obsidian/plugins/workspace-plus-plus/data.backup.json',
        '.workspace-plus-plus/backups/sessions.1.json',
        '.workspace-plus-plus/backups/sessions.2.json',
        '.workspace-plus-plus/backups/sessions.3.json',
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

    await plugin.clearBackupsAndVersionHistory();

    assert.equal(plugin.persistCalls, 0);
    assert.deepEqual(plugin.getRemovedFiles(), ['.workspace-plus-plus/sessions.backup.json']);
});

test('resetSessionsAndSettingsToDefault also clears backup files', async function () {
    const plugin = createPlugin();
    let sessionsReset = false;
    let backupsCleared = false;

    plugin.resetSessionsToDefault = function () {
        sessionsReset = true;
        return Promise.resolve(true);
    };
    plugin.clearBackupFiles = function () {
        backupsCleared = true;
        return Promise.resolve(true);
    };

    await plugin.resetSessionsAndSettingsToDefault();

    assert.equal(sessionsReset, true);
    assert.equal(backupsCleared, true);
});
