'use strict';

var commandRegistry = require('../../core/command-registry.ts');

function attachSessionCommandMethods(WorkspacePlusPlus) {
    if (!WorkspacePlusPlus.prototype.getCommandRegistry) {
        WorkspacePlusPlus.prototype.getCommandRegistry = function () {
            if (!this._commandRegistry) {
                this._commandRegistry = new commandRegistry.CommandRegistry(this);
            }
            return this._commandRegistry;
        };
    }

    WorkspacePlusPlus.prototype.syncSessionCommands = function () {
        return this.getCommandRegistry().syncSessionCommands();
    };

    WorkspacePlusPlus.prototype.registerCommands = function () {
        return this.getCommandRegistry().registerCommands();
    };

    WorkspacePlusPlus.prototype.formatHotkey = function (hotkey) {
        return this.getCommandRegistry().formatHotkey(hotkey);
    };

    WorkspacePlusPlus.prototype.getCommandHotkey = function (commandId, index) {
        return this.getCommandRegistry().getCommandHotkey(commandId, index);
    };
}

module.exports = attachSessionCommandMethods;
