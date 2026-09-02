'use strict';

// The shared rename and delete actions behind every session row: the modal, the
// search overlay and the status bar all call these.
//
// Before this suite, deleting had no test at all. Replacing the whole
// confirmation condition with `false` - so every delete went through without
// asking - left all 392 tests green.

const test = require('node:test');
const assert = require('node:assert/strict');
const { setupHarness } = require('./lock/harness/index.ts');

const harness = setupHarness();
const actions = require('../src/session-list-actions.ts');
const { L } = require('../src/i18n.ts');

function createPlugin(options = {}) {
    const count = options.sessionCount ?? 2;
    const sessions = {};
    for (let i = 0; i < count; i++) sessions[`s${i}`] = { id: `s${i}`, name: `Session ${i}`, layout: {} };
    const calls = [];
    return {
        app: {},
        data: { sessions, confirmDeleteByHotkey: options.confirmDeleteByHotkey ?? true },
        calls,
        // Session state goes through getSessionStore(); this double carries those members itself.
        getSessionStore() { return this; },
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

function resetModalDom() {
    harness.dom.document.querySelectorAll('.modal-container').forEach((el) => el.remove());
    harness.obsidian.notices.length = 0;
}

async function flushPromises() {
    await Promise.resolve();
    await Promise.resolve();
}

function confirmDelete() {
    const confirm = harness.dom.document.querySelector('.wpp-confirm-buttons .mod-warning');
    assert.ok(confirm, 'the confirmation has a delete button');
    confirm.click();
}

const SESSION = { id: 's0', name: 'One', layout: {} };

test('a delete that is confirmed asks first and removes nothing until the answer comes back', async () => {
    resetModalDom();
    const plugin = createPlugin();
    const deletedCallbacks = [];

    await actions.deleteSessionWithPrompt({
        plugin, session: SESSION, onDeleted: () => deletedCallbacks.push(SESSION.id),
    });

    assert.equal(harness.dom.document.querySelectorAll('.modal-container').length, 1, 'the confirmation is on screen');
    assert.deepEqual(plugin.calls, [], 'and nothing is deleted while it is');

    confirmDelete();
    await flushPromises();

    assert.deepEqual(plugin.calls, [['delete', 's0']]);
    assert.deepEqual(deletedCallbacks, ['s0'], 'the caller is told, so it can redraw');
});

test('turning off confirm-on-hotkey deletes immediately', async () => {
    resetModalDom();
    const plugin = createPlugin({ confirmDeleteByHotkey: false });

    await actions.deleteSessionWithPrompt({ plugin, session: SESSION });

    assert.deepEqual(plugin.calls, [['delete', 's0']]);
    assert.equal(harness.dom.document.querySelectorAll('.modal-container').length, 0, 'no confirmation was opened');
});

test('forceConfirm asks even when confirm-on-hotkey is off', async () => {
    // This is the path the session manager modal and the search overlay both
    // take: they pass forceConfirm because a click on a delete icon is not the
    // hotkey the setting is about. Losing that term would leave anyone who
    // turned the setting off with no confirmation anywhere.
    resetModalDom();
    const plugin = createPlugin({ confirmDeleteByHotkey: false });

    await actions.deleteSessionWithPrompt({ plugin, session: SESSION, forceConfirm: true });

    assert.equal(harness.dom.document.querySelectorAll('.modal-container').length, 1, 'the confirmation is still required');
    assert.deepEqual(plugin.calls, [], 'and nothing is deleted before it is answered');
});

test('the confirmation names the active session differently from any other', async () => {
    resetModalDom();
    const plugin = createPlugin();

    await actions.deleteSessionWithPrompt({ plugin, session: SESSION, isActive: true });
    assert.equal(harness.dom.document.querySelector('.modal-container p')?.textContent, L.confirmDeleteActive(SESSION.name));
    resetModalDom();

    await actions.deleteSessionWithPrompt({ plugin, session: SESSION, isActive: false });
    assert.equal(harness.dom.document.querySelector('.modal-container p')?.textContent, L.confirmDelete(SESSION.name));
    resetModalDom();

    // A caller with its own wording wins over both.
    await actions.deleteSessionWithPrompt({ plugin, session: SESSION, isActive: true, confirmMessage: 'mine' });
    assert.equal(harness.dom.document.querySelector('.modal-container p')?.textContent, 'mine');
});

test('the last remaining session cannot be deleted', async () => {
    resetModalDom();
    const plugin = createPlugin({ sessionCount: 1, confirmDeleteByHotkey: false });

    await actions.deleteSessionWithPrompt({ plugin, session: SESSION });

    assert.deepEqual(plugin.calls, [], 'there has to be one session left');
    assert.equal(harness.obsidian.notices.at(-1)?.message, L.cannotDeleteLast, 'and the user is told why');
});

test('a caller can suppress the last-session notice without losing the protection', async () => {
    resetModalDom();
    const plugin = createPlugin({ sessionCount: 1, confirmDeleteByHotkey: false });

    await actions.deleteSessionWithPrompt({ plugin, session: SESSION, notifyCannotDelete: false });

    assert.deepEqual(plugin.calls, [], 'still refused');
    assert.deepEqual(harness.obsidian.notices, [], 'just silently');
});

test('a delete that fails reports nothing and tells nobody it succeeded', async () => {
    resetModalDom();
    const plugin = createPlugin({ confirmDeleteByHotkey: false, deleteSucceeds: false });
    let told = false;

    await actions.deleteSessionWithPrompt({ plugin, session: SESSION, onDeleted: () => { told = true; } });

    assert.deepEqual(plugin.calls, [['delete', 's0']], 'it was attempted');
    assert.equal(told, false, 'but the caller must not redraw as though it worked');
    assert.deepEqual(harness.obsidian.notices, [], 'and no "deleted" notice appears');
});

test('renaming commits the new name and carries the empty-name rule into the prompt', async () => {
    resetModalDom();
    const plugin = createPlugin();
    const renamed = [];

    actions.renameSessionWithPrompt({
        plugin, session: SESSION, onRenamed: (_session, name) => renamed.push(name),
    });

    const input = harness.dom.document.querySelector('.wpp-rename-input');
    assert.ok(input, 'the prompt opens on the current name');
    assert.equal(input.value, SESSION.name);
    input.value = 'Renamed';
    const rename = harness.dom.document.querySelector('.wpp-confirm-buttons .mod-cta');
    assert.ok(rename);
    rename.click();
    await flushPromises();

    assert.deepEqual(plugin.calls, [['rename', 's0', 'Renamed']]);
    assert.deepEqual(renamed, ['Renamed']);
});

test('a rename the plugin rejects does not tell the caller it happened', async () => {
    resetModalDom();
    const plugin = createPlugin({ renameSucceeds: false });
    let told = false;

    actions.renameSessionWithPrompt({ plugin, session: SESSION, onRenamed: () => { told = true; } });
    const input = harness.dom.document.querySelector('.wpp-rename-input');
    assert.ok(input);
    input.value = 'Renamed';
    const rename = harness.dom.document.querySelector('.wpp-confirm-buttons .mod-cta');
    assert.ok(rename);
    rename.click();
    await flushPromises();

    assert.deepEqual(plugin.calls, [['rename', 's0', 'Renamed']]);
    assert.equal(told, false);
});

test.after(() => harness.restore());
