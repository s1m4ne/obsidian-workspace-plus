'use strict';

var obsidian = require('obsidian');
var i18n = require('../../i18n');

function attachSessionValidationMethods(WorkspacePlusPlus) {
    WorkspacePlusPlus.prototype.isSessionNameTaken = function (name, excludeSessionId) {
        var sessions = this.data.sessions || {};
        var keys = Object.keys(sessions);
        for (var i = 0; i < keys.length; i++) {
            var id = keys[i];
            if (excludeSessionId && id === excludeSessionId) continue;
            if (!sessions[id]) continue;
            if (sessions[id].name === name) return true;
        }
        return false;
    };

    WorkspacePlusPlus.prototype.isGroupNameTaken = function (name, excludeGroupId) {
        var groups = this.data.groups || {};
        var keys = Object.keys(groups);
        for (var i = 0; i < keys.length; i++) {
            var id = keys[i];
            if (excludeGroupId && id === excludeGroupId) continue;
            if (!groups[id]) continue;
            if (groups[id].name === name) return true;
        }
        return false;
    };

    WorkspacePlusPlus.prototype.createSessionValidated = function (name, options) {
        var L = i18n.L;
        options = options || {};
        var rawName = typeof name === 'string' ? name : '';
        var finalName = rawName.trim();
        if (!finalName) {
            // Empty input can auto-generate, but whitespace-only input is treated as invalid.
            if (rawName.length > 0) {
                if (options.notify !== false) {
                    new obsidian.Notice(L.emptyName);
                }
                return Promise.resolve({
                    created: false,
                    reason: 'empty',
                    name: '',
                    sessionId: null,
                });
            }
            finalName = this.getNextSessionName();
        }

        if (this.isSessionNameTaken(finalName)) {
            if (options.notify !== false) {
                new obsidian.Notice(L.duplicateName);
            }
            return Promise.resolve({
                created: false,
                reason: 'duplicate',
                name: finalName,
                sessionId: null,
            });
        }

        var self = this;
        return this.createSession(finalName).then(function () {
            return {
                created: true,
                reason: '',
                name: finalName,
                sessionId: self.data.activeSessionId,
            };
        });
    };

    WorkspacePlusPlus.prototype.createSessionForViewedGroup = function (name, viewedGroupId, options) {
        var self = this;
        var groupsEnabled = this.isGroupFeatureEnabled();
        var targetGroupId = groupsEnabled ? (viewedGroupId || null) : null;
        var beforeActiveGroupId = groupsEnabled ? (this.data.activeGroupId || null) : null;

        return this.createSessionValidated(name, options).then(function (result) {
            if (!result || !result.created) return result;

            if (!groupsEnabled) {
                result.viewGroupId = null;
                return result;
            }

            var createdSessionId = result.sessionId;
            if (targetGroupId && targetGroupId !== beforeActiveGroupId) {
                // When creating from a different viewed group, keep membership exclusive
                // so the new session doesn't remain in the previously active group.
                return self.moveSessionToGroupExclusive(createdSessionId, targetGroupId).then(function () {
                    return self.resolveGroupSelection(targetGroupId).then(function (selection) {
                        result.viewGroupId = selection.resolvedGroupId || null;
                        return result;
                    });
                });
            }

            result.viewGroupId = self.data.activeGroupId || null;
            return result;
        });
    };

    WorkspacePlusPlus.prototype.renameSessionById = function (sessionId, newName, options) {
        var L = i18n.L;
        options = options || {};
        var session = this.data.sessions[sessionId];
        if (!session) return Promise.resolve(false);

        var normalized = typeof newName === 'string' ? newName.trim() : '';
        if (!normalized) {
            if (options.notify !== false) {
                new obsidian.Notice(L.emptyName);
            }
            return Promise.resolve(false);
        }
        if (normalized === session.name) return Promise.resolve(false);

        if (this.isSessionNameTaken(normalized, sessionId)) {
            if (options.notify !== false) {
                new obsidian.Notice(L.duplicateName);
            }
            return Promise.resolve(false);
        }

        var oldName = session.name;
        session.name = normalized;
        session.modified = Date.now();
        this.updateStatusBar();
        this.syncSessionCommands();

        return this.persistData().then(function () {
            if (options.notify !== false) {
                new obsidian.Notice(L.renamed(oldName, normalized));
            }
            return true;
        });
    };

    WorkspacePlusPlus.prototype.createGroupValidated = function (name, options) {
        var L = i18n.L;
        options = options || {};
        var normalized = typeof name === 'string' ? name.trim() : '';

        if (!normalized) {
            if (options.notify !== false) {
                new obsidian.Notice(L.groupEmptyName);
            }
            return Promise.resolve(false);
        }
        if (this.isGroupNameTaken(normalized)) {
            if (options.notify !== false) {
                new obsidian.Notice(L.groupDuplicateName);
            }
            return Promise.resolve(false);
        }

        return this.createGroup(normalized);
    };

    WorkspacePlusPlus.prototype.renameGroupValidated = function (groupId, newName, options) {
        var L = i18n.L;
        options = options || {};
        var groups = this.data.groups || {};
        var group = groups[groupId];
        if (!group) return Promise.resolve(false);

        var normalized = typeof newName === 'string' ? newName.trim() : '';
        if (!normalized) {
            if (options.notify !== false) {
                new obsidian.Notice(L.groupEmptyName);
            }
            return Promise.resolve(false);
        }
        if (normalized === group.name) return Promise.resolve(false);

        if (this.isGroupNameTaken(normalized, groupId)) {
            if (options.notify !== false) {
                new obsidian.Notice(L.groupDuplicateName);
            }
            return Promise.resolve(false);
        }

        return this.renameGroup(groupId, normalized);
    };
}

module.exports = attachSessionValidationMethods;
