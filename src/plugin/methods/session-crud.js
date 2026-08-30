'use strict';

var obsidian = require('obsidian');
var i18n = require('../../i18n.ts');
var obsidianInternals = require('../../platform/obsidian-internals.ts');
var utils = require('../../utils.ts');
var layoutUtils = require('../../layout-utils.ts');
var modals = require('../../modals');

function attachSessionCrudMethods(WorkspacePlusPlus) {
    WorkspacePlusPlus.prototype.getDefaultSessionName = function () {
        return i18n.L.defaultSessionName;
    };

    WorkspacePlusPlus.prototype.getAutoSessionName = function (n) {
        return i18n.L.sessionAutoName(n);
    };

    WorkspacePlusPlus.prototype.insertSessionAndActivate = function (session) {
        this.data.sessions[session.id] = session;
        this.data.sessionOrder.push(session.id);
        this.data.activeSessionId = session.id;
        this.attachSessionToActiveGroup(session.id);
    };

    WorkspacePlusPlus.prototype.createSessionRecord = function (id, name, layout, options) {
        options = options || {};
        var record = {
            id: id,
            name: name,
            modified: typeof options.modified === 'number' ? options.modified : Date.now(),
            layout: layout,
        };
        if (options.isDefault) {
            record.isDefault = true;
        }
        return record;
    };

    WorkspacePlusPlus.prototype.createSession = function (name) {
        var id = utils.generateId();
        var layout = this.getCurrentWorkspaceLayout();

        this.insertSessionAndActivate(this.createSessionRecord(id, name, layout));

        this.updateStatusBar();
        this.syncSessionCommands();
        return this.persistData();
    };

    WorkspacePlusPlus.prototype.deleteSession = function (sessionId) {
        var session = this.data.sessions[sessionId];
        if (!session || Object.keys(this.data.sessions).length <= 1) return Promise.resolve(false);

        var wasActive = this.data.activeSessionId === sessionId;
        var nextActiveId = null;

        delete this.data.sessions[sessionId];
        var orderIdx = this.data.sessionOrder.indexOf(sessionId);
        if (orderIdx !== -1) this.data.sessionOrder.splice(orderIdx, 1);

        // Clean up group membership
        if (this.data.sessionGroups && this.data.sessionGroups[sessionId]) {
            delete this.data.sessionGroups[sessionId];
        }
        if (wasActive) {
            // Keep same index position; if it was the last, move to index - 1
            var fallbackIdx = Math.min(orderIdx, this.data.sessionOrder.length - 1);
            var remaining = this.data.sessionOrder[fallbackIdx] || Object.keys(this.data.sessions)[0];
            nextActiveId = remaining || null;
            this.data.activeSessionId = nextActiveId;
        }

        var applyNextLayout = Promise.resolve();
        if (wasActive && nextActiveId) {
            var nextSession = this.data.sessions[nextActiveId];
            applyNextLayout = nextSession && nextSession.layout
                ? this.applyWorkspaceLayout(nextSession.layout)
                : Promise.resolve();
        }

        this.updateStatusBar();
        this.syncSessionCommands();
        var self = this;
        return applyNextLayout
            .then(function () {
                return self.persistData();
            })
            .then(function () { return true; });
    };

    WorkspacePlusPlus.prototype.renameCurrentSession = function () {
        var L = i18n.L;
        var self = this;
        var session = this.getActiveSession();
        if (!session) {
            new obsidian.Notice(L.noSession);
            return;
        }

        new modals.RenameModal(this.app, session.name, function (newName) {
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

        new modals.ConfirmModal(this.app, L.confirmDeleteActive(session.name), doDelete, {
            hint: L.confirmDeleteSettingsHint,
            onHintClick: function () {
                self.app.setting.open();
                self.app.setting.openTabById(self.manifest.id);
            },
        }).open();
    };

    WorkspacePlusPlus.prototype.deleteAllInactiveSessions = function () {
        var self = this;
        var activeId = this.data.activeSessionId;
        var ids = Object.keys(this.data.sessions || {}).filter(function (id) {
            return id !== activeId;
        });

        var promises = ids.map(function (id) {
            return self.deleteSession(id);
        });
        return Promise.all(promises).then(function (results) {
            var deletedCount = 0;
            for (var i = 0; i < results.length; i++) {
                if (results[i]) deletedCount++;
            }
            return deletedCount;
        });
    };

    WorkspacePlusPlus.prototype.getNextSessionName = function () {
        var sessions = this.data.sessions;
        var existing = {};
        var keys = Object.keys(sessions);
        for (var i = 0; i < keys.length; i++) {
            existing[sessions[keys[i]].name] = true;
        }
        var n = 1;
        while (existing[this.getAutoSessionName(n)]) { n++; }
        return this.getAutoSessionName(n);
    };

    WorkspacePlusPlus.prototype.resetSessionsToDefault = function () {
        var id = utils.generateId();
        this.hideSwitchOverlay();
        this.data.sessions = {};
        this.data.sessionOrder = [];
        this.data.activeSessionId = null;
        this.data.groups = {};
        this.data.groupOrder = [];
        this.data.sessionGroups = {};
        this.data.activeGroupId = null;
        this.data.sessions[id] = this.createSessionRecord(
            id,
            this.getDefaultSessionName(),
            this.getCurrentWorkspaceLayout(),
            { isDefault: true }
        );
        this.data.sessionOrder.push(id);
        this.data.activeSessionId = id;
        this.updateStatusBar();
        this.syncSessionCommands();
        return this.persistData();
    };

    WorkspacePlusPlus.prototype.createEmptySession = function () {
        var L = i18n.L;
        var name = this.getNextSessionName();
        this.captureActiveSessionLayoutIfAutoSave();

        var id = utils.generateId();
        var session = this.createSessionRecord(id, name, null);
        this.insertSessionAndActivate(session);

        // Close only main area leaves (keep sidebars intact)
        var leaves = [];
        this.app.workspace.iterateRootLeaves(function (leaf) { leaves.push(leaf); });
        for (var i = 0; i < leaves.length; i++) { leaves[i].detach(); }

        // Capture the empty state
        session.layout = this.getCurrentWorkspaceLayout();

        this.updateStatusBar();
        this.syncSessionCommands();
        new obsidian.Notice(L.created(name));
        return this.persistData();
    };

    WorkspacePlusPlus.prototype.duplicateCurrentSession = function () {
        var L = i18n.L;
        var name = this.getNextSessionName();
        this.captureActiveSessionLayoutIfAutoSave();

        var id = utils.generateId();
        this.insertSessionAndActivate(this.createSessionRecord(id, name, this.getCurrentWorkspaceLayout()));

        this.updateStatusBar();
        this.syncSessionCommands();
        new obsidian.Notice(L.duplicated(name));
        return this.persistData();
    };

    /**
     * Duplicate an arbitrary session by its ID (does NOT switch to the copy).
     */
    WorkspacePlusPlus.prototype.duplicateSession = function (sessionId) {
        var L = i18n.L;
        var source = this.data.sessions[sessionId];
        if (!source) return Promise.resolve();

        var name = this.getNextSessionName();
        var newId = utils.generateId();
        this.data.sessions[newId] = this.createSessionRecord(
            newId,
            name,
            layoutUtils.cloneLayout(source.layout)
        );
        this.data.sessionOrder.push(newId);

        // Copy group memberships
        var groups = (this.data.sessionGroups || {})[sessionId];
        if (groups && groups.length > 0) {
            if (!this.data.sessionGroups) this.data.sessionGroups = {};
            this.data.sessionGroups[newId] = groups.slice();
        }

        this.syncSessionCommands();
        new obsidian.Notice(L.duplicated(name));
        return this.persistData();
    };

    WorkspacePlusPlus.prototype.ensureDefaultSession = function () {
        var hasDefault = Object.values(this.data.sessions)
            .some(function (s) { return s.isDefault; });
        if (hasDefault) return;

        var id = utils.generateId();
        this.data.sessions[id] = this.createSessionRecord(
            id,
            this.getDefaultSessionName(),
            this.getCurrentWorkspaceLayout(),
            { isDefault: true }
        );
        this.data.sessionOrder.unshift(id);
        this.data.activeSessionId = id;
        this.updateStatusBar();
        this.syncSessionCommands();
        this.persistData();
    };
}

module.exports = attachSessionCrudMethods;
