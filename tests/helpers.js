'use strict';

// Loading plugin modules for plain unit tests - no DOM, no rendering.
//
// The `obsidian` package ships type definitions with no runtime entry, so
// anything requiring it needs a stand-in. Resolution goes through the same
// module.registerHooks redirection the lock harness uses, rather than a
// Module._load patch: _load only intercepts require(), and these modules become
// ESM as the migration converts them. A patch would keep working right up to
// the first `.ts` module that writes `import { Platform } from 'obsidian'`, and
// then fail to resolve it.
//
// i18n has to resolve a locale first, because persistence.js reads i18n.L when
// it builds its notices.

const { installObsidianStub } = require('./lock/harness/index.ts');

function loadPluginMethods(requestedModules) {
    installObsidianStub();

    const i18n = require('../src/i18n.ts');
    i18n.resolveLocale('en');

    const loaded = {};
    for (const name of requestedModules || []) {
        loaded[name] = require('../src/plugin/methods/' + name);
    }
    loaded.DEFAULT_DATA = require('../src/plugin/default-data');
    return loaded;
}

module.exports = { loadPluginMethods };
