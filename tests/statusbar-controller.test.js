'use strict';

require('./lock/harness/index.ts').installObsidianStub();

const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');

function loadStatusBarController(calls) {
    calls = calls || [];
    const statusBarActionsStub = {
        executeStatusBarAction: function (_plugin, actionId, event) {
            calls.push(['action', actionId, event.type || '']);
        },
    };
    const utilsStub = {
        isMacPlatform: function () {
            return false;
        },
        isModPressed: function (event) {
            return !!(event && event.ctrlKey);
        },
    };

    const originalLoad = Module._load;
    Module._load = function (request, parent, isMain) {
        if (request === './utils' || request === './utils.ts') return utilsStub;
        if (request === './statusbar-actions' || request === './statusbar-actions.ts') return statusBarActionsStub;
        return originalLoad(request, parent, isMain);
    };

    try {
        const modulePath = require.resolve('../src/statusbar-controller.ts');
        delete require.cache[modulePath];
        return require(modulePath);
    } finally {
        Module._load = originalLoad;
    }
}

function createEvent(props) {
    const event = Object.assign({
        type: 'event',
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        deltaX: 0,
        deltaY: 0,
        deltaMode: 0,
        prevented: 0,
        stopped: 0,
        preventDefault: function () {
            this.prevented += 1;
        },
        stopPropagation: function () {
            this.stopped += 1;
        },
    }, props || {});
    return event;
}

test('status bar controller resolves scroll preset configs', function () {
    const controller = loadStatusBarController();

    assert.deepEqual(controller.getStatusBarScrollConfig({ statusBarScrollPreset: 'notchedWheel' }), {
        threshold: 16,
        cooldownMs: 350,
        resetMs: 220,
    });
    assert.deepEqual(controller.getStatusBarScrollConfig({
        statusBarScrollPreset: 'custom',
        statusBarScrollThreshold: '40',
        statusBarScrollCooldownMs: '750',
        statusBarScrollResetMs: '400',
    }), {
        threshold: 40,
        cooldownMs: 750,
        resetMs: 400,
    });
    assert.deepEqual(controller.getStatusBarScrollConfig({ statusBarScrollPreset: 'missing' }), {
        threshold: 30,
        cooldownMs: 500,
        resetMs: 250,
    });
});

test('status bar controller matches scroll modifier modes', function () {
    const controller = loadStatusBarController();

    assert.equal(controller.matchesStatusBarScrollModifier(createEvent(), false, 'none'), true);
    assert.equal(controller.matchesStatusBarScrollModifier(createEvent({ ctrlKey: true }), false, 'none'), false);
    assert.equal(controller.matchesStatusBarScrollModifier(createEvent({ ctrlKey: true }), false, 'modOnly'), true);
    assert.equal(controller.matchesStatusBarScrollModifier(createEvent({ metaKey: true }), true, 'modOnly'), true);
    assert.equal(controller.matchesStatusBarScrollModifier(createEvent({ altKey: true }), false, 'altOnly'), true);
    assert.equal(controller.matchesStatusBarScrollModifier(createEvent({ altKey: true }), false, 'modOrAlt'), true);
    assert.equal(controller.matchesStatusBarScrollModifier(createEvent({ ctrlKey: true }), false, 'modOrAlt'), true);
});

test('status bar controller resolves modified click slots', function () {
    const controller = loadStatusBarController();

    assert.equal(controller.getClickSlot(createEvent()), 'click');
    assert.equal(controller.getClickSlot(createEvent({ shiftKey: true })), 'shiftClick');
    assert.equal(controller.getClickSlot(createEvent({ ctrlKey: true, metaKey: true })), 'modClick');
    assert.equal(controller.getClickSlot(createEvent({ altKey: true, ctrlKey: true })), 'altClick');
    assert.equal(controller.getMiddleClickSlot(createEvent({ ctrlKey: true, metaKey: true })), 'modMiddleClick');
    assert.equal(controller.getRightClickSlot(createEvent({ altKey: true })), 'altRightClick');
});

test('status bar controller accumulates wheel delta and switches after threshold', function () {
    const controller = loadStatusBarController();
    const calls = [];
    const plugin = {
        data: {
            statusBarModScrollSwitch: true,
            statusBarScrollPreset: 'custom',
            statusBarScrollThreshold: 30,
            statusBarScrollCooldownMs: 500,
            statusBarScrollResetMs: 250,
            statusBarScrollModifierMode: 'none',
            statusBarScrollInvert: false,
        },
        isSwitchingSession: false,
        statusBarScrollDelta: 0,
        statusBarScrollEventAt: 0,
        statusBarScrollSwitchAt: 0,
        switchRelativeFromScroll: function (direction) {
            calls.push(direction);
            return Promise.resolve(true);
        },
    };

    const first = createEvent({ type: 'wheel', deltaY: 10 });
    const second = createEvent({ type: 'wheel', deltaY: 25 });

    assert.equal(controller.handleStatusBarWheel(plugin, first, 1000), false);
    assert.equal(plugin.statusBarScrollDelta, 10);
    assert.equal(first.prevented, 1);
    assert.equal(first.stopped, 1);

    assert.equal(controller.handleStatusBarWheel(plugin, second, 1050), true);
    assert.equal(plugin.statusBarScrollDelta, 0);
    assert.equal(plugin.statusBarScrollSwitchAt, 1050);
    assert.deepEqual(calls, [1]);
});

test('status bar controller setup wires basic click handling', function () {
    const calls = [];
    const controller = loadStatusBarController(calls);
    const listeners = {};
    const plugin = {
        data: {
            statusBarActions: {
                click: 'quickSwitcher',
            },
        },
        addStatusBarItem: function () {
            return {
                addClass: function (className) {
                    calls.push(['class', className]);
                },
                addEventListener: function (type, handler) {
                    listeners[type] = handler;
                },
            };
        },
        updateStatusBar: function () {
            calls.push(['update']);
        },
        openSearchOverlay: function () {
            calls.push(['action', 'quickSwitcher', 'click']);
        },
    };

    controller.setupStatusBar(plugin);
    const event = createEvent({ type: 'click' });
    listeners.click(event);

    assert.equal(plugin.statusBarEl !== undefined, true);
    assert.equal(event.prevented, 1);
    assert.equal(event.stopped, 1);
    assert.deepEqual(calls, [
        ['class', 'wpp-status-bar'],
        ['update'],
        ['action', 'quickSwitcher', 'click'],
    ]);
});
