'use strict';

// The tab itself lives in settings-tab.ts. This path stays because the Behavior
// Lock loads the tab through it and locks may not be edited, and src/main.js
// keeps requiring it so the file stays reachable - a shim only a test reaches is
// a file the reachability gate has to be told to ignore, which defeats the gate.
//
// Two things here are forced. The implementation cannot share this basename:
// TypeScript drops x.js from the program when x.ts sits beside it, and eslint's
// type-aware rules then fail to parse the shim. And the named export has to be
// `exports.NAME =`: `module.exports = { ... }` is only partly detected when
// import() reads a CJS module, and re-exporting the namespace not at all.
//
// Commit 34 removes this file once every caller imports the class directly.
const settingsTab = require('./settings-tab.ts');

exports.WorkspacePlusPlusSettingTab = settingsTab.WorkspacePlusPlusSettingTab;
