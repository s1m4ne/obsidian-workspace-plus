'use strict';

// The plugin owns modal construction. The command registry and the status bar
// used to reach for the modal classes themselves through optional hooks -
// plugin.openSessionManagerModal?.() and plugin.openHistoryModal?.(session) -
// that nothing ever defined, so the manage-sessions command, the create-session
// command, the version-history command and the status bar actions all did
// nothing at all while every test passed.
//
// Defining them here also keeps the modal modules out of the import graph of
// statusbar-actions.ts and command-registry.ts. Both modal files evaluate
// obsidian.Modal when they load, and a static import would pull them in while
// the test harness is still linking, before the obsidian stub exists.

var sessionManagerModal = require('../../modals/session-manager-modal-class.ts');
var HistoryModal = require('../../modals/history-modal.ts').HistoryModal;

function attachModalOpenerMethods(WorkspacePlusPlus) {
    WorkspacePlusPlus.prototype.openSessionManagerModal = function (focusName) {
        return sessionManagerModal.openSessionManagerModal(this.app, this, focusName);
    };

    WorkspacePlusPlus.prototype.openHistoryModal = function (session) {
        return new HistoryModal(this.app, this, session).open();
    };
}

module.exports = attachModalOpenerMethods;
