'use strict';

// The menu itself lives in session-context-menu-items.ts. This path stays
// because the Behavior Lock loads the menu through it and locks may not be
// edited, and production keeps importing it too - a shim only a test reaches is
// a file the reachability gate has to be told to ignore, which is the opposite
// of what that gate is for.
//
// Two things about this file are not free choices. The implementation cannot
// share this basename: TypeScript drops x.js from the program when x.ts sits
// beside it, and eslint's type-aware rules then cannot parse the shim at all.
// And the named export has to be written as `exports.NAME =`, one per line -
// `module.exports = { ... }` is only partly detected when import() reads a CJS
// module, and re-exporting the whole namespace is not detected at all.
//
// Commit 34 removes this file once every caller imports the module directly.
const impl = require('./session-context-menu-items.ts');

exports.openSessionContextMenu = impl.openSessionContextMenu;
