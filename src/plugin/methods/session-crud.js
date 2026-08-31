'use strict';

var obsidian = require('obsidian');
var i18n = require('../../i18n.ts');
var obsidianInternals = require('../../platform/obsidian-internals.ts');
var ConfirmModal = require('../../modals/confirm-modal.ts').ConfirmModal;
var RenameModal = require('../../modals/rename-modal.ts').RenameModal;
var attachSessionStoreGetter = require('./session-store-getter');

function attachSessionCrudMethods(WorkspacePlusPlus) {
    attachSessionStoreGetter(WorkspacePlusPlus);

    WorkspacePlusPlus.prototype.getDefaultSessionName = function () {
        return this.getSessionStore().getDefaultSessionName();
    };

    WorkspacePlusPlus.prototype.getAutoSessionName = function (n) {
        return this.getSessionStore().getAutoSessionName(n);
    };

    WorkspacePlusPlus.prototype.insertSessionAndActivate = function (session) {
        return this.getSessionStore().insertSessionAndActivate(session);
    };

    WorkspacePlusPlus.prototype.createSessionRecord = function (id, name, layout, options) {
        return this.getSessionStore().createSessionRecord(id, name, layout, options);
    };

    WorkspacePlusPlus.prototype.createSession = function (name) {
        return this.getSessionStore().createSession(name);
    };

    WorkspacePlusPlus.prototype.deleteSession = function (sessionId) {
        return this.getSessionStore().deleteSession(sessionId);
    };

    WorkspacePlusPlus.prototype.renameCurrentSession = function () {
        var L = i18n.L;
        var self = this;
        var session = this.getActiveSession();
        if (!session) {
            new obsidian.Notice(L.noSession);
            return;
        }

        new RenameModal(this.app, session.name, function (newName) {
            self.renameSessionById(session.id, newName);
        }, {
            emptyNotice: L.emptyName,
        }).open();
    };

    WorkspacePlusPlus.prototype.deleteCurrentSession = function () {
        var L = i18n.L;
        var self = this;
        var session = this.getActiveSession();
        if (!session) {
            new obsidian.Notice(L.noSession);
            return;
        }
        if (Object.keys(this.data.sessions).length <= 1) {
            new obsidian.Notice(L.cannotDeleteLast);
            return;
        }

        var doDelete = function () {
            return self.deleteSession(session.id).then(function (deleted) {
                if (!deleted) return;
                new obsidian.Notice(L.deleted(session.name));
            });
        };

        if (!this.data.confirmDeleteByHotkey) {
            doDelete();
            return;
        }

        new ConfirmModal(this.app, L.confirmDeleteActive(session.name), doDelete, {
            hint: L.confirmDeleteSettingsHint,
            onHintClick: function () {
                obsidianInternals.openSettingTab(self.app, self.manifest.id);
            },
        }).open();
    };

    WorkspacePlusPlus.prototype.deleteAllInactiveSessions = function () {
        return this.getSessionStore().deleteAllInactiveSessions();
    };

    WorkspacePlusPlus.prototype.getNextSessionName = function () {
        return this.getSessionStore().getNextSessionName();
    };

    WorkspacePlusPlus.prototype.resetSessionsToDefault = function () {
        return this.getSessionStore().resetSessionsToDefault();
    };

    WorkspacePlusPlus.prototype.createEmptySession = function () {
        return this.getSessionStore().createEmptySession();
    };

    WorkspacePlusPlus.prototype.duplicateCurrentSession = function () {
        return this.getSessionStore().duplicateCurrentSession();
    };

    WorkspacePlusPlus.prototype.duplicateSession = function (sessionId) {
        return this.getSessionStore().duplicateSession(sessionId);
    };

    WorkspacePlusPlus.prototype.ensureDefaultSession = function () {
        return this.getSessionStore().ensureDefaultSession();
    };
}

module.exports = attachSessionCrudMethods;
