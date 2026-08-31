'use strict';

// The shared rename and delete actions behind every session row: the modal, the
// search overlay and the status bar all call these.
//
// Before this suite, deleting had no test at all. Replacing the whole
// confirmation condition with `false` - so every delete went through without
// asking - left all 392 tests green.

require('./lock/harness/index.ts').installObsidianStub();

const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');

const L_STUB = {
    emptyName: 'empty',
    cannotDeleteLast: 'last',
    deleted: (name) => `deleted ${name}`,
    confirmDelete: (name) => `delete ${name}`,
    confirmDeleteActive: (name) => `delete active ${name}`,
};

function loadActions(state) {
    const originalLoad = Module._load;
    const opened = state.opened;
    Module._load = function (request, parent, isMain) {
        if (request === 'obsidian') {
            return { Notice: class { constructor(message) { state.notices.push(message); } } };
        }
        // Both spellings: the module under test carries the extension, and it
        // becomes '.ts' the moment the module itself is migrated. A key that
        // matches only one of them stops intercepting silently, and the real
        // module runs while the test still passes.
        if (request === './i18n' || request === './i18n.ts') return { L: L_STUB };
        if (request === './modals/confirm-modal' || request === './modals/confirm-modal.ts') {
            return { ConfirmModal: class {
                constructor(_app, message, onConfirm) { this.message = message; this.onConfirm = onConfirm; }
                open() { opened.push(this); }
            } };
        }
        if (request === './modals/rename-modal' || request === './modals/rename-modal.ts') {
            return { RenameModal: class {
                constructor(_app, name, onRename, options) {
                    this.name = name;
                    this.onRename = onRename;
                    this.options = options;
                }
                open() { opened.push(this); }
            } };
        }
        return originalLoad(request, parent, isMain);
    };
    try {
        const path = require.resolve('../src/session-list-actions.js');
        delete require.cache[path];
        return require(path);
    } finally {
        Module._load = originalLoad;
    }
}

function createState() {
    return { opened: [], notices: [] };
}

function createPlugin(options = {}) {
    const count = options.sessionCount ?? 2;
    const sessions = {};
    for (let i = 0; i < count; i++) sessions[`s${i}`] = { id: `s${i}`, name: `Session ${i}` };
    const calls = [];
    return {
        app: {},
        data: { sessions, confirmDeleteByHotkey: options.confirmDeleteByHotkey ?? true },
        calls,
        deleteSession(id) {
            calls.push(['delete', id]);
            return Promise.resolve(options.deleteSucceeds ?? true);
        },
        renameSessionById(id, name) {
            calls.push(['rename', id, name]);
            return Promise.resolve(options.renameSucceeds ?? Boolean(name));
        },
    };
}

const SESSION = { id: 's0', name: 'One' };

test('a delete that is confirmed asks first and removes nothing until the answer comes back', async () => {
    const state = createState();
    const actions = loadActions(state);
    const plugin = createPlugin();
    const deletedCallbacks = [];

    await actions.deleteSessionWithPrompt({
        plugin, session: SESSION, onDeleted: () => deletedCallbacks.push(SESSION.id),
    });

    assert.equal(state.opened.length, 1, 'the confirmation is on screen');
    assert.deepEqual(plugin.calls, [], 'and nothing is deleted while it is');

    await state.opened.pop().onConfirm();

    assert.deepEqual(plugin.calls, [['delete', 's0']]);
    assert.deepEqual(deletedCallbacks, ['s0'], 'the caller is told, so it can redraw');
});

test('turning off confirm-on-hotkey deletes immediately', async () => {
    const state = createState();
    const actions = loadActions(state);
    const plugin = createPlugin({ confirmDeleteByHotkey: false });

    await actions.deleteSessionWithPrompt({ plugin, session: SESSION });

    assert.deepEqual(plugin.calls, [['delete', 's0']]);
    assert.equal(state.opened.length, 0, 'no confirmation was opened');
});

test('forceConfirm asks even when confirm-on-hotkey is off', async () => {
    // This is the path the session manager modal and the search overlay both
    // take: they pass forceConfirm because a click on a delete icon is not the
    // hotkey the setting is about. Losing that term would leave anyone who
    // turned the setting off with no confirmation anywhere.
    const state = createState();
    const actions = loadActions(state);
    const plugin = createPlugin({ confirmDeleteByHotkey: false });

    await actions.deleteSessionWithPrompt({ plugin, session: SESSION, forceConfirm: true });

    assert.equal(state.opened.length, 1, 'the confirmation is still required');
    assert.deepEqual(plugin.calls, [], 'and nothing is deleted before it is answered');
});

test('the confirmation names the active session differently from any other', async () => {
    const state = createState();
    const actions = loadActions(state);
    const plugin = createPlugin();

    await actions.deleteSessionWithPrompt({ plugin, session: SESSION, isActive: true });
    assert.equal(state.opened.pop().message, 'delete active One');

    await actions.deleteSessionWithPrompt({ plugin, session: SESSION, isActive: false });
    assert.equal(state.opened.pop().message, 'delete One');

    // A caller with its own wording wins over both.
    await actions.deleteSessionWithPrompt({ plugin, session: SESSION, isActive: true, confirmMessage: 'mine' });
    assert.equal(state.opened.pop().message, 'mine');
});

test('the last remaining session cannot be deleted', async () => {
    const state = createState();
    const actions = loadActions(state);
    const plugin = createPlugin({ sessionCount: 1, confirmDeleteByHotkey: false });

    await actions.deleteSessionWithPrompt({ plugin, session: SESSION });

    assert.deepEqual(plugin.calls, [], 'there has to be one session left');
    assert.equal(state.notices[state.notices.length - 1], 'last', 'and the user is told why');
});

test('a caller can suppress the last-session notice without losing the protection', async () => {
    const state = createState();
    const actions = loadActions(state);
    const plugin = createPlugin({ sessionCount: 1, confirmDeleteByHotkey: false });

    await actions.deleteSessionWithPrompt({ plugin, session: SESSION, notifyCannotDelete: false });

    assert.deepEqual(plugin.calls, [], 'still refused');
    assert.deepEqual(state.notices, [], 'just silently');
});

test('a delete that fails reports nothing and tells nobody it succeeded', async () => {
    const state = createState();
    const actions = loadActions(state);
    const plugin = createPlugin({ confirmDeleteByHotkey: false, deleteSucceeds: false });
    let told = false;

    await actions.deleteSessionWithPrompt({ plugin, session: SESSION, onDeleted: () => { told = true; } });

    assert.deepEqual(plugin.calls, [['delete', 's0']], 'it was attempted');
    assert.equal(told, false, 'but the caller must not redraw as though it worked');
    assert.deepEqual(state.notices, [], 'and no "deleted" notice appears');
});

test('renaming commits the new name and carries the empty-name rule into the prompt', async () => {
    const state = createState();
    const actions = loadActions(state);
    const plugin = createPlugin();
    const renamed = [];

    actions.renameSessionWithPrompt({
        plugin, session: SESSION, onRenamed: (session, name) => renamed.push(name),
    });

    const modal = state.opened.pop();
    assert.equal(modal.name, 'One', 'the prompt opens on the current name');
    assert.equal(modal.options.emptyNotice, 'empty');

    modal.onRename('Renamed');
    await Promise.resolve();
    await Promise.resolve();

    assert.deepEqual(plugin.calls, [['rename', 's0', 'Renamed']]);
    assert.deepEqual(renamed, ['Renamed']);
});

test('a rename the plugin rejects does not tell the caller it happened', async () => {
    const state = createState();
    const actions = loadActions(state);
    const plugin = createPlugin({ renameSucceeds: false });
    let told = false;

    actions.renameSessionWithPrompt({ plugin, session: SESSION, onRenamed: () => { told = true; } });
    state.opened.pop().onRename('Renamed');
    await Promise.resolve();
    await Promise.resolve();

    assert.deepEqual(plugin.calls, [['rename', 's0', 'Renamed']]);
    assert.equal(told, false);
});
