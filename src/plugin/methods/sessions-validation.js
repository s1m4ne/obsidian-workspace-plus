'use strict';

var obsidian = require('obsidian');
var i18n = require('../../i18n.ts');
var attachSessionStoreGetter = require('./session-store-getter');

function attachSessionValidationMethods(WorkspacePlusPlus) {
    attachSessionStoreGetter(WorkspacePlusPlus);

    WorkspacePlusPlus.prototype.isSessionNameTaken = function (name, excludeSessionId) {
        return this.getSessionStore().isSessionNameTaken(name, excludeSessionId);
    };

    WorkspacePlusPlus.prototype.isGroupNameTaken = function (name, excludeGroupId) {
        return this.getSessionStore().isGroupNameTaken(name, excludeGroupId);
    };

    WorkspacePlusPlus.prototype.createSessionValidated = function (name, options) {
        return this.getSessionStore().createSessionValidated(name, options);
    };

    WorkspacePlusPlus.prototype.createSessionForViewedGroup = function (name, viewedGroupId, options) {
        return this.getSessionStore().createSessionForViewedGroup(name, viewedGroupId, options);
    };

    WorkspacePlusPlus.prototype.renameSessionById = function (sessionId, newName, options) {
        return this.getSessionStore().renameSessionById(sessionId, newName, options);
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
