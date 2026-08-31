'use strict';

var commandRegistry = require('../core/command-registry.ts');

function registerCommands(plugin) {
    if (typeof plugin.getCommandRegistry === 'function') {
        plugin.getCommandRegistry().registerCommands();
        return;
    }
    var registry = new commandRegistry.CommandRegistry(plugin);
    registry.registerCommands();
}

module.exports = registerCommands;
