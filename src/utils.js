'use strict';

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
}

function isMacPlatform() {
    return typeof navigator !== 'undefined'
        && typeof navigator.platform === 'string'
        && navigator.platform.indexOf('Mac') !== -1;
}

function isModPressed(e) {
    if (!e) return false;
    return isMacPlatform() ? !!e.metaKey : !!e.ctrlKey;
}

function isModShiftPressed(e) {
    return isModPressed(e) && !!(e && e.shiftKey);
}

exports.generateId = generateId;
exports.isMacPlatform = isMacPlatform;
exports.isModPressed = isModPressed;
exports.isModShiftPressed = isModShiftPressed;
