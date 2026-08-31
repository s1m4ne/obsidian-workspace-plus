'use strict';

// See session-context-menu.js for why this path, this basename and this export
// shape are all forced rather than chosen.
const impl = require('./settings-context-menu-items.ts');

exports.openSettingsContextMenu = impl.openSettingsContextMenu;
