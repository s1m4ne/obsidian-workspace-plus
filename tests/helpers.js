'use strict';

const Module = require('module');

// The `obsidian` package ships type definitions only, so anything that requires
// it at runtime needs a stub. i18n also has to resolve a locale first, because
// persistence.js reads i18n.L for its notices.
function loadPluginMethods(requestedModules) {
    const notices = [];
    const obsidianStub = {
        Notice: class {
            constructor(message) {
                notices.push(message);
            }
        },
        Platform: { isDesktop: true, isDesktopApp: true, isMacOS: true },
    };

    const originalLoad = Module._load;
    Module._load = function (request, parent, isMain) {
        if (request === 'obsidian') return obsidianStub;
        return originalLoad(request, parent, isMain);
    };

    try {
        const i18n = require('../src/i18n');
        i18n.resolveLocale('en');

        const loaded = { notices: notices };
        const names = requestedModules || [];
        for (const name of names) {
            loaded[name] = require('../src/plugin/methods/' + name);
        }
        loaded.DEFAULT_DATA = require('../src/plugin/default-data');
        return loaded;
    } finally {
        Module._load = originalLoad;
    }
}

module.exports = { loadPluginMethods };
