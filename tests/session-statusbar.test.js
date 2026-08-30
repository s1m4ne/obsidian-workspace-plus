'use strict';

require('./lock/harness/index.ts').installObsidianStub();

const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');

const i18n = require('../src/i18n');

i18n.resolveLocale('en');

function loadSessionStatusBarMethods() {
    const obsidianStub = {
        setIcon: function (el, iconName) {
            el.icon = iconName;
        },
    };
    const originalLoad = Module._load;
    Module._load = function (request, parent, isMain) {
        if (request === 'obsidian') return obsidianStub;
        return originalLoad(request, parent, isMain);
    };

    try {
        return require('../src/plugin/methods/session-statusbar');
    } finally {
        Module._load = originalLoad;
    }
}

const attachSessionStatusBarMethods = loadSessionStatusBarMethods();

function createStatusBarEl() {
    return {
        classes: [],
        children: [],
        addClass: function (cls) {
            if (this.classes.indexOf(cls) === -1) this.classes.push(cls);
        },
        removeClass: function (cls) {
            this.classes = this.classes.filter(function (item) {
                return item !== cls;
            });
        },
        empty: function () {
            this.children = [];
        },
        createSpan: function (attrs) {
            var child = Object.assign({}, attrs || {});
            this.children.push(child);
            return child;
        },
    };
}

function createPlugin(options) {
    options = options || {};
    function PluginMock() {}
    attachSessionStatusBarMethods(PluginMock);
    const plugin = new PluginMock();
    plugin.statusBarEl = options.statusBarEl === false ? null : createStatusBarEl();
    plugin.getActiveSession = function () {
        return options.session || null;
    };
    plugin.getActiveGroup = function () {
        return options.group || null;
    };
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
    }), [undefined, 'Session One']);
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
    }), [undefined, 'Group One', ' / ', 'Session One']);
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
