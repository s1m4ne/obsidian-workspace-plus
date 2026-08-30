'use strict';

var utils = require('./utils.ts');
var statusBarActions = require('./statusbar-actions');

var STATUS_BAR_SCROLL_PRESETS = {
    trackpad: {
        threshold: 30,
        cooldownMs: 500,
        resetMs: 250,
    },
    notchedWheel: {
        threshold: 16,
        cooldownMs: 350,
        resetMs: 220,
    },
    freeSpinWheel: {
        threshold: 48,
        cooldownMs: 650,
        resetMs: 320,
    },
};

function getStatusBarScrollConfig(data) {
    var presetId = (data && data.statusBarScrollPreset) || 'trackpad';
    if (presetId === 'custom') {
        return {
            threshold: Number((data && data.statusBarScrollThreshold) || 30) || 30,
            cooldownMs: Number((data && data.statusBarScrollCooldownMs) || 500) || 500,
            resetMs: Number((data && data.statusBarScrollResetMs) || 250) || 250,
        };
    }
    return STATUS_BAR_SCROLL_PRESETS[presetId] || STATUS_BAR_SCROLL_PRESETS.trackpad;
}

function matchesStatusBarScrollModifier(evt, isMac, mode) {
    mode = mode || 'none';
    var modPressed = isMac ? !!evt.metaKey : !!evt.ctrlKey;
    var altPressed = !!evt.altKey;

    if (mode === 'none') return !modPressed && !altPressed;
    if (mode === 'modOnly') return modPressed;
    if (mode === 'altOnly') return altPressed;
    if (mode === 'modOrAlt') return modPressed || altPressed;
    return modPressed || altPressed;
}

function getModifiedStatusBarSlot(evt, baseSlot) {
    var baseName = baseSlot.charAt(0).toUpperCase() + baseSlot.slice(1);
    if (evt.altKey) return 'alt' + baseName;
    if (utils.isModPressed(evt)) return 'mod' + baseName;
    if (evt.shiftKey) return 'shift' + baseName;
    return baseSlot;
}

function getClickSlot(evt) {
    return getModifiedStatusBarSlot(evt, 'click');
}

function getMiddleClickSlot(evt) {
    return getModifiedStatusBarSlot(evt, 'middleClick');
}

function getRightClickSlot(evt) {
    return getModifiedStatusBarSlot(evt, 'rightClick');
}

function getStatusBarAction(plugin, slotKey) {
    return ((plugin.data && plugin.data.statusBarActions) || {})[slotKey] || 'none';
}

function executeStatusBarSlot(plugin, slotKey, evt, options) {
    options = options || {};
    var action = getStatusBarAction(plugin, slotKey);
    if (action !== 'none' && options.preventDefault !== false) {
        evt.preventDefault();
        evt.stopPropagation();
    }
    return statusBarActions.executeStatusBarAction(plugin, action, evt);
}

function normalizeWheelDeltaY(evt) {
    var deltaY = evt.deltaY || 0;
    if (evt.deltaMode === 1) return deltaY * 16;
    if (evt.deltaMode === 2) return deltaY * 240;
    return deltaY;
}

function handleStatusBarWheel(plugin, evt, now) {
    if (!plugin.data.statusBarModScrollSwitch) return false;
    var isMac = utils.isMacPlatform();
    var cfg = getStatusBarScrollConfig(plugin.data);
    if (!matchesStatusBarScrollModifier(evt, isMac, plugin.data.statusBarScrollModifierMode)) return false;
    if (Math.abs(evt.deltaY || 0) <= Math.abs(evt.deltaX || 0)) return false;

    evt.preventDefault();
    evt.stopPropagation();

    now = typeof now === 'number' ? now : Date.now();
    if (plugin.isSwitchingSession) return false;
    if (now - plugin.statusBarScrollSwitchAt < cfg.cooldownMs) return false;

    if (now - plugin.statusBarScrollEventAt > cfg.resetMs) {
        plugin.statusBarScrollDelta = 0;
    }
    plugin.statusBarScrollEventAt = now;
    plugin.statusBarScrollDelta += normalizeWheelDeltaY(evt);

    if (Math.abs(plugin.statusBarScrollDelta) < cfg.threshold) return false;

    var direction = plugin.statusBarScrollDelta < 0 ? -1 : 1;
    if (plugin.data.statusBarScrollInvert) direction *= -1;
    plugin.statusBarScrollDelta = 0;
    plugin.statusBarScrollSwitchAt = now;
    plugin.switchRelativeFromScroll(direction).catch(function () {});
    return true;
}

function setupStatusBar(plugin) {
    plugin.statusBarEl = plugin.addStatusBarItem();
    plugin.statusBarEl.addClass('wpp-status-bar');

    plugin.statusBarEl.addEventListener('click', function (evt) {
        executeStatusBarSlot(plugin, getClickSlot(evt), evt);
    });

    plugin.statusBarEl.addEventListener('auxclick', function (evt) {
        if (evt.button !== 1) return;
        executeStatusBarSlot(plugin, getMiddleClickSlot(evt), evt);
    });

    plugin.statusBarEl.addEventListener('contextmenu', function (evt) {
        evt.preventDefault();
        var action = getStatusBarAction(plugin, getRightClickSlot(evt));
        statusBarActions.executeStatusBarAction(plugin, action, evt);
    });

    plugin.statusBarEl.addEventListener('wheel', function (evt) {
        handleStatusBarWheel(plugin, evt);
    }, { passive: false });

    plugin.updateStatusBar();
    return plugin.statusBarEl;
}

module.exports = {
    getStatusBarScrollConfig: getStatusBarScrollConfig,
    matchesStatusBarScrollModifier: matchesStatusBarScrollModifier,
    getClickSlot: getClickSlot,
    getMiddleClickSlot: getMiddleClickSlot,
    getRightClickSlot: getRightClickSlot,
    handleStatusBarWheel: handleStatusBarWheel,
    setupStatusBar: setupStatusBar,
};
