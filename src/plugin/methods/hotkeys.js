'use strict';

var utils = require('../../utils.ts');
var obsidianInternals = require('../../platform/obsidian-internals.ts');

function attachHotkeyMethods(WorkspacePlusPlus) {
    // --- Hotkey helpers ---

    WorkspacePlusPlus.prototype.formatHotkey = function (hotkey) {
        var isMac = utils.isMacPlatform();
        var parts = [];
        var mods = hotkey.modifiers || [];
        for (var i = 0; i < mods.length; i++) {
            var m = mods[i];
            if (m === 'Mod') parts.push(isMac ? '\u2318' : 'Ctrl');
            else if (m === 'Alt') parts.push(isMac ? '\u2325' : 'Alt');
            else if (m === 'Shift') parts.push(isMac ? '\u21e7' : 'Shift');
            else if (m === 'Ctrl') parts.push(isMac ? '\u2303' : 'Ctrl');
        }
        var key = hotkey.key;
        if (key === 'ArrowLeft') key = '\u2190';
        else if (key === 'ArrowRight') key = '\u2192';
        else if (key === 'ArrowUp') key = '\u2191';
        else if (key === 'ArrowDown') key = '\u2193';
        else if (key === ',') key = '<';
        else if (key === '.') key = '>';

        if (isMac) return parts.join('') + key;
        parts.push(key);
        return parts.join('+');
    };

    WorkspacePlusPlus.prototype.getCommandHotkey = function (cmdId, index) {
        var idx = index || 0;
        var fullId = this.manifest.id + ':' + cmdId;
        var hotkeys = obsidianInternals.getCommandHotkeys(this.app, fullId);
        if (!hotkeys || hotkeys.length <= idx) return '';
        return this.formatHotkey(hotkeys[idx]);
    };
}

module.exports = attachHotkeyMethods;
