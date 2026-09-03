'use strict';

const harness = require('./lock/harness/index.ts').setupHarness();

const test = require('node:test');
const assert = require('node:assert/strict');

const i18n = require('../src/i18n.ts');

i18n.resolveLocale('en');

const { StatusBarController } = require('../src/statusbar-controller.ts');

function createStatusBarEl() {
    const el = harness.dom.document.createElement('div');
    el.addClass('wpp-status-bar');
    // Reads that the assertions used to make against a hand-rolled object, now
    // derived from the element itself.
    Object.defineProperty(el, 'classes', {
        get() {
            return Array.from(this.classList).filter((c) => c !== 'wpp-status-bar');
        },
    });
    Object.defineProperty(el, 'children', {
        get() {
            return Array.from(this.querySelectorAll('span')).map((child) => ({
                cls: child.className,
                text: child.textContent,
                icon: child.getAttribute('data-icon'),
            }));
        },
    });
    return el;
}

function createController(options) {
    options = options || {};
    const data = {
        activeSessionId: options.session ? 's1' : null,
        sessions: options.session ? { s1: options.session } : {},
        sessionOrder: options.session ? ['s1'] : [],
        groupFeatureEnabled: true,
        activeGroupId: options.group ? 'g1' : null,
        groups: options.group ? { g1: options.group } : {},
        groupOrder: options.group ? ['__all__', 'g1'] : ['__all__'],
        sessionGroups: {},
    };
    const statusBarEl = options.statusBarEl === false ? null : createStatusBarEl();
    const controller = new StatusBarController({
        data,
        statusBarEl,
        addStatusBarItem: createStatusBarEl,
        // Session state goes through getSessionStore(); this double carries those members itself.
        getSessionStore() { return this; },
        getActiveSession: () => data.activeSessionId ? data.sessions[data.activeSessionId] : null,
        // The controller asks the store whether groups are on, rather than the
        // plugin, so the double supplies just that.
        getGroupStore: () => ({
            isGroupFeatureEnabled: () => data.groupFeatureEnabled !== false,
            getActiveGroup: () => data.activeGroupId ? data.groups[data.activeGroupId] : null,
        }),
        // Saving goes through plugin.getSessionSaver(). This double records the
        // save methods itself, so it stands in as its own saver.
        getSessionSaver() { return this; },
        shouldShowUnsavedStatusBarHighlight: () => !!options.unsaved,
        switchRelativeImmediately: async () => true,
    });
    return { controller, statusBarEl };
}

test('session status bar renders icon and session name', function () {
    const { controller, statusBarEl } = createController({
        session: { id: 's1', name: 'Session One' },
    });

    controller.updateStatusBar();

    assert.deepEqual(statusBarEl.classes, []);
    assert.equal(statusBarEl.children[0].cls, 'wpp-status-icon');
    assert.equal(statusBarEl.children[0].icon, 'panels-top-left');
    assert.deepEqual(statusBarEl.children.map(function (child) {
        return child.text;
    }), ['', 'Session One']);
});

test('session status bar renders active group before session name', function () {
    const { controller, statusBarEl } = createController({
        session: { id: 's1', name: 'Session One' },
        group: { id: 'g1', name: 'Group One' },
    });

    controller.updateStatusBar();

    assert.deepEqual(statusBarEl.children.map(function (child) {
        return child.cls;
    }), [
        'wpp-status-icon',
        'wpp-status-group',
        'wpp-status-separator',
        'wpp-status-name',
    ]);
    assert.deepEqual(statusBarEl.children.map(function (child) {
        return child.text;
    }), ['', 'Group One', ' / ', 'Session One']);
});

test('session status bar toggles unsaved highlight class', function () {
    const { controller, statusBarEl } = createController({
        session: { id: 's1', name: 'Session One' },
        unsaved: true,
    });

    controller.updateStatusBar();

    assert.deepEqual(statusBarEl.classes, ['wpp-status-bar-unsaved']);
});

test('session status bar safely skips rendering before element exists', function () {
    const { controller } = createController({
        statusBarEl: false,
        session: { id: 's1', name: 'Session One' },
    });

    assert.doesNotThrow(function () {
        controller.updateStatusBar();
    });
});

test('the status bar carries one accessible name for its four spans', function () {
    const plain = createController({ session: { id: 's1', name: 'Session One' } });
    plain.controller.updateStatusBar();
    assert.equal(plain.statusBarEl.getAttribute('aria-label'), 'Session One');

    // With a group active the item reads "Group / Session" across three spans,
    // none of which a screen reader would join on its own.
    const grouped = createController({
        session: { id: 's1', name: 'Session One' },
        group: { id: 'g1', name: 'Group One' },
    });
    grouped.controller.updateStatusBar();
    assert.equal(grouped.statusBarEl.getAttribute('aria-label'), 'Group One / Session One');

    // The name has to follow the session, not be set once at setup.
    grouped.controller.host.data.sessions.s1.name = 'Session Two';
    grouped.controller.updateStatusBar();
    assert.equal(grouped.statusBarEl.getAttribute('aria-label'), 'Group One / Session Two');
});

test('with no session the status bar still has a name', function () {
    const { controller, statusBarEl } = createController({});
    controller.updateStatusBar();
    assert.equal(statusBarEl.getAttribute('aria-label'), 'No session');
});
