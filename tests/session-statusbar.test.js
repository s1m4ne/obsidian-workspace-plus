'use strict';

const harness = require('./lock/harness/index.ts').setupHarness();

const test = require('node:test');
const assert = require('node:assert/strict');

const i18n = require('../src/i18n.ts');

i18n.resolveLocale('en');

const attachSessionStatusBarMethods = require('../src/plugin/methods/session-statusbar.js');
const attachSessionMethods = require('../src/plugin/methods/sessions.js');

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

function createPlugin(options) {
    options = options || {};
    function PluginMock() {}
    attachSessionMethods(PluginMock);
    attachSessionStatusBarMethods(PluginMock);
    const plugin = new PluginMock();
    plugin.data = {
        activeSessionId: options.session ? 's1' : null,
        sessions: options.session ? { s1: options.session } : {},
        sessionOrder: options.session ? ['s1'] : [],
        groupFeatureEnabled: true,
        activeGroupId: options.group ? 'g1' : null,
        groups: options.group ? { g1: options.group } : {},
        groupOrder: options.group ? ['__all__', 'g1'] : ['__all__'],
        sessionGroups: {},
    };
    plugin.statusBarEl = options.statusBarEl === false ? null : createStatusBarEl();
    plugin.shouldShowUnsavedStatusBarHighlight = function () {
        return !!options.unsaved;
    };
    return plugin;
}

test('session status bar renders icon and session name', function () {
    const plugin = createPlugin({
        session: { id: 's1', name: 'Session One' },
    });

    plugin.updateStatusBar();

    assert.deepEqual(plugin.statusBarEl.classes, []);
    assert.equal(plugin.statusBarEl.children[0].cls, 'wpp-status-icon');
    assert.equal(plugin.statusBarEl.children[0].icon, 'panels-top-left');
    assert.deepEqual(plugin.statusBarEl.children.map(function (child) {
        return child.text;
    }), ['', 'Session One']);
});

test('session status bar renders active group before session name', function () {
    const plugin = createPlugin({
        session: { id: 's1', name: 'Session One' },
        group: { id: 'g1', name: 'Group One' },
    });

    plugin.updateStatusBar();

    assert.deepEqual(plugin.statusBarEl.children.map(function (child) {
        return child.cls;
    }), [
        'wpp-status-icon',
        'wpp-status-group',
        'wpp-status-separator',
        'wpp-status-name',
    ]);
    assert.deepEqual(plugin.statusBarEl.children.map(function (child) {
        return child.text;
    }), ['', 'Group One', ' / ', 'Session One']);
});

test('session status bar toggles unsaved highlight class', function () {
    const plugin = createPlugin({
        session: { id: 's1', name: 'Session One' },
        unsaved: true,
    });

    plugin.updateStatusBar();

    assert.deepEqual(plugin.statusBarEl.classes, ['wpp-status-bar-unsaved']);
});

test('session status bar safely skips rendering before element exists', function () {
    const plugin = createPlugin({
        statusBarEl: false,
        session: { id: 's1', name: 'Session One' },
    });

    assert.doesNotThrow(function () {
        plugin.updateStatusBar();
    });
});
