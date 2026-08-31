'use strict';

require('./lock/harness/index.ts').installObsidianStub();

const test = require('node:test');
const assert = require('node:assert/strict');
const { FrontmatterLinker } = require('../src/core/frontmatter-linker.ts');

function createLinker(options) {
    options = options || {};
    const host = {
        data: { sessions: {}, groups: {}, activeSessionId: null, activeGroupId: null },
        registeredEvent: null,
        app: Object.assign({
        workspace: {},
        metadataCache: {
            getFileCache: function () {
                return null;
            },
        },
        fileManager: {},
        }, options.app || {}),
        saveCurrentLayoutAsSessionName: options.saveCurrentLayoutAsSessionName || (() => Promise.resolve(false)),
        switchSession: () => Promise.resolve(false),
        isGroupFeatureEnabled: () => true,
        registerEvent: function (ref) { host.registeredEvent = ref; },
    };
    return { linker: new FrontmatterLinker(host), host };
}

test('frontmatter listener uses file-open instead of active leaf changes', function () {
    let eventName = '';
    let eventCallback = null;
    let handledFile = null;
    const file = { path: 'Project.md', basename: 'Project', extension: 'md' };
    const { linker, host } = createLinker({
        app: {
            workspace: {
                on: function (name, callback) {
                    eventName = name;
                    eventCallback = callback;
                    return { name };
                },
            },
        },
    });
    host.handleFrontmatterTriggers = function (incomingFile) {
        handledFile = incomingFile;
    };

    linker.registerFrontmatterListeners();
    eventCallback(file);

    assert.equal(eventName, 'file-open');
    assert.equal(host.registeredEvent.name, 'file-open');
    assert.equal(handledFile, file);
});

test('frontmatter listener skips files that are already loaded in the active leaf', function () {
    let eventCallback = null;
    let handledCount = 0;
    const file = { path: 'Project.md', basename: 'Project', extension: 'md' };
    const { linker, host } = createLinker({
        app: {
            workspace: {
                activeLeaf: { id: 'leaf-a' },
                iterateAllLeaves: function (callback) {
                    callback({ id: 'leaf-a', view: { file } });
                },
                on: function (_name, callback) {
                    eventCallback = callback;
                    return {};
                },
            },
        },
    });
    host.handleFrontmatterTriggers = function () {
        handledCount += 1;
    };

    linker.registerFrontmatterListeners();
    eventCallback(file);
    eventCallback(file);

    assert.equal(handledCount, 0);
});

test('frontmatter listener handles a new file loaded into the active leaf once', function () {
    let eventCallback = null;
    let handledCount = 0;
    const existingFile = { path: 'Existing.md', basename: 'Existing', extension: 'md' };
    const newFile = { path: 'New.md', basename: 'New', extension: 'md' };
    const { linker, host } = createLinker({
        app: {
            workspace: {
                activeLeaf: { id: 'leaf-a' },
                iterateAllLeaves: function (callback) {
                    callback({ id: 'leaf-a', view: { file: existingFile } });
                },
                on: function (_name, callback) {
                    eventCallback = callback;
                    return {};
                },
            },
        },
    });
    host.handleFrontmatterTriggers = function () {
        handledCount += 1;
    };

    linker.registerFrontmatterListeners();
    eventCallback(newFile);
    eventCallback(newFile);

    assert.equal(handledCount, 1);
});

test('frontmatter listener treats a file as newly loaded after active leaf closes its file', function () {
    let eventCallback = null;
    let handledCount = 0;
    const file = { path: 'Project.md', basename: 'Project', extension: 'md' };
    const { linker, host } = createLinker({
        app: {
            workspace: {
                activeLeaf: { id: 'leaf-a' },
                iterateAllLeaves: function (callback) {
                    callback({ id: 'leaf-a', view: { file } });
                },
                on: function (_name, callback) {
                    eventCallback = callback;
                    return {};
                },
            },
        },
    });
    host.handleFrontmatterTriggers = function () {
        handledCount += 1;
    };

    linker.registerFrontmatterListeners();
    eventCallback(file);
    eventCallback(null);
    eventCallback(file);

    assert.equal(handledCount, 1);
});

test('save current note name as session writes workspace-session frontmatter', async function () {
    const file = { path: 'Folder/Project Note.md', basename: 'Project Note', extension: 'md' };
    let processedFile = null;
    let processedFrontmatter = null;
    let savedSessionName = null;
    const { linker } = createLinker({
        app: {
            workspace: {
                getActiveFile: function () {
                    return file;
                },
            },
            fileManager: {
                processFrontMatter: function (incomingFile, mutate) {
                    const frontmatter = {};
                    processedFile = incomingFile;
                    mutate(frontmatter);
                    processedFrontmatter = frontmatter;
                    return Promise.resolve();
                },
            },
        },
        saveCurrentLayoutAsSessionName: function (name) {
            savedSessionName = name;
            return Promise.resolve({ saved: true, name });
        },
    });

    const result = await linker.saveCurrentNoteNameAsSession({ silent: true });

    assert.equal(result.saved, true);
    assert.equal(processedFile, file);
    assert.deepEqual(processedFrontmatter, { 'workspace-session': 'Project Note' });
    assert.equal(savedSessionName, 'Project Note');
});

test('save current note name as session requires an active Markdown note', async function () {
    let called = false;
    const { linker } = createLinker({
        app: {
            workspace: {
                getActiveFile: function () {
                    return { path: 'Sketch.canvas', basename: 'Sketch', extension: 'canvas' };
                },
            },
        },
        saveCurrentLayoutAsSessionName: function () {
            called = true;
            return Promise.resolve({ saved: true });
        },
    });

    const result = await linker.saveCurrentNoteNameAsSession({ silent: true });

    assert.equal(result, false);
    assert.equal(called, false);
});
