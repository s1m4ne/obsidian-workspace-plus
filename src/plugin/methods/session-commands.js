'use strict';

var i18n = require('../../i18n.ts');

function attachSessionCommandMethods(WorkspacePlusPlus) {
    WorkspacePlusPlus.prototype.syncSessionCommands = function () {
        var L = i18n.L;
        var ordered = this.getOrderedSessions();
        var self = this;

        // 1. Remove old dynamic commands
        var oldIds = this._dynamicSessionCommandIds || [];
        for (var i = 0; i < oldIds.length; i++) {
            this.removeCommand(oldIds[i]);
        }
        this._dynamicSessionCommandIds = [];

        var dynamicStart;

        if (self.data.numberedSwitchCommands) {
            // 2a. Re-register numbered commands (1-9) with session names
            for (var n = 1; n <= 9; n++) {
                (function (num) {
                    self.removeCommand('switch-to-' + num);
                    var session = ordered[num - 1];
                    self.addCommand({
                        id: 'switch-to-' + num,
                        name: L.cmdSwitchTo(num, session ? session.name : undefined),
                        checkCallback: function (checking) {
                            if (!self.data.showActiveSwitchCommand) {
                                var currentOrdered = self.getOrderedSessions();
                                var targetSession = currentOrdered[num - 1];
                                if (targetSession && targetSession.id === self.data.activeSessionId) return false;
                            }
                            if (!checking) self.switchToIndex(num - 1);
                            return true;
                        },
                    });
                })(n);
            }
            dynamicStart = 9;
        } else {
            // 2b. Remove numbered commands when disabled
            for (var n = 1; n <= 9; n++) {
                self.removeCommand('switch-to-' + n);
            }
            dynamicStart = 0;
        }

        // 3. Register dynamic commands for sessions from dynamicStart onward
        for (var j = dynamicStart; j < ordered.length; j++) {
            (function (session) {
                var cmdId = 'switch-to-named-' + session.id;
                self.addCommand({
                    id: cmdId,
                    name: L.cmdSwitchToNamed(session.name),
                    checkCallback: function (checking) {
                        if (!self.data.showActiveSwitchCommand) {
                            if (session.id === self.data.activeSessionId) return false;
                        }
                        if (!checking) self.switchSessionByIdFromCommand(session.id);
                        return true;
                    },
                });
                self._dynamicSessionCommandIds.push(cmdId);
            })(ordered[j]);
        }
    };
}

module.exports = attachSessionCommandMethods;
