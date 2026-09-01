'use strict';


function attachSessionCommandMethods(WorkspacePlusPlus) {
    WorkspacePlusPlus.prototype.syncSessionCommands = function () {
        return this.getCommandRegistry().syncSessionCommands();
    };

    WorkspacePlusPlus.prototype.registerCommands = function () {
        return this.getCommandRegistry().registerCommands();
    };


    WorkspacePlusPlus.prototype.getCommandHotkey = function (commandId, index) {
        return this.getCommandRegistry().getCommandHotkey(commandId, index);
    };
}

module.exports = attachSessionCommandMethods;
