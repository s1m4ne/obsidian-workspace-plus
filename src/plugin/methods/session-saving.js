'use strict';

var obsidian = require('obsidian');
var i18n = require('../../i18n.ts');
var utils = require('../../utils.ts');
var modals = require('../../modals');

function findSessionByName(data, name) {
    var sessions = (data && data.sessions) || {};
    var keys = Object.keys(sessions);
    for (var i = 0; i < keys.length; i++) {
        if (sessions[keys[i]] && sessions[keys[i]].name === name) {
            return sessions[keys[i]];
        }
    }
    return null;
}

function isGroupFeatureEnabled(plugin) {
    if (typeof plugin.isGroupFeatureEnabled === 'function') {
        return plugin.isGroupFeatureEnabled();
    }
    return !plugin.data || plugin.data.groupFeatureEnabled !== false;
}

function chooseSessionGroupForView(plugin, sessionId) {
    if (!isGroupFeatureEnabled(plugin)) return undefined;

    var data = plugin.data || {};
    var groups = data.groups || {};
    var sessionGroups = data.sessionGroups || {};
    var groupIds = Array.isArray(sessionGroups[sessionId]) ? sessionGroups[sessionId] : [];
    var validGroupIds = groupIds.filter(function (groupId) {
        return !!groups[groupId];
    });

    if (validGroupIds.length === 0) return null;
    if (validGroupIds.indexOf(data.activeGroupId) !== -1) return data.activeGroupId;

    var ordered = typeof plugin.getOrderedGroupTabIds === 'function'
        ? plugin.getOrderedGroupTabIds()
        : (Array.isArray(data.groupOrder) ? data.groupOrder : []);

    for (var i = 0; i < ordered.length; i++) {
        if (ordered[i] === '__all__') continue;
        if (validGroupIds.indexOf(ordered[i]) !== -1) return ordered[i];
    }
    return validGroupIds[0];
}

function attachSessionSavingMethods(WorkspacePlusPlus) {
    WorkspacePlusPlus.prototype.isAutoSaveOnSwitchEnabled = function () {
        return this.data.autoSaveOnSwitch !== false;
    };

    WorkspacePlusPlus.prototype.isWarnOnUnsavedSwitchEnabled = function () {
        return this.data.warnOnUnsavedSwitch !== false;
    };

    WorkspacePlusPlus.prototype.isUnsavedStatusBarHighlightEnabled = function () {
        return this.data.highlightUnsavedSessionChanges !== false;
    };

    WorkspacePlusPlus.prototype.isActiveSessionDirty = function () {
        var session = this.getActiveSession();
        if (!session) return false;
        var currentLayout;
        try {
            currentLayout = this.getCurrentWorkspaceLayout();
        } catch (e) {
            return false;
        }
        return !this.layoutsEqualStructural(session.layout, currentLayout);
    };

    WorkspacePlusPlus.prototype.shouldShowUnsavedStatusBarHighlight = function () {
        return this.isUnsavedStatusBarHighlightEnabled()
            && !this.isAutoSaveOnSwitchEnabled()
            && this.isActiveSessionDirty();
    };

    WorkspacePlusPlus.prototype.setAutoSaveOnSwitch = function (enabled, options) {
        var L = i18n.L;
        options = options || {};
        this.data.autoSaveOnSwitch = !!enabled;
        var isOn = this.isAutoSaveOnSwitchEnabled();

        // Sync snapshot timer - it requires both version history and auto-save
        if (isOn) {
            this.startHistorySnapshotTimer();
        } else {
            this.stopHistorySnapshotTimer();
        }
        this.updateStatusBar();

        return this.persistData().then(function () {
            if (options.notify) {
                new obsidian.Notice(isOn ? L.autoSaveEnabled : L.autoSaveDisabled);
            }
            return isOn;
        });
    };

    WorkspacePlusPlus.prototype.toggleAutoSaveOnSwitch = function (options) {
        var next = !this.isAutoSaveOnSwitchEnabled();
        return this.setAutoSaveOnSwitch(next, options || {});
    };

    WorkspacePlusPlus.prototype.saveActiveSession = function (options) {
        var L = i18n.L;
        options = options || {};
        var self = this;
        var session = this.getActiveSession();
        if (!session) {
            if (!options.silent) new obsidian.Notice(L.noSession);
            return Promise.resolve(false);
        }

        // Prompt for a session name when saving an unnamed default session
        if (
            !options.silent
            && session.isDefault
            && session.name === this.getDefaultSessionName()
        ) {
            var doSave = function (name, resolve) {
                session.name = name;
                self.pushLayoutToHistory(session);
                session.layout = self.getCurrentWorkspaceLayout();
                session.modified = Date.now();
                self.updateStatusBar();
                self.syncSessionCommands();
                self.persistData().then(function () {
                    new obsidian.Notice(L.savedSession(name));
                    resolve(true);
                });
            };
            return new Promise(function (resolve) {
                new modals.RenameModal(self.app, '', function (newName) {
                    doSave(newName, resolve);
                }, {
                    title: L.nameSessionTitle,
                    placeholder: L.nameSessionPlaceholder,
                    buttonText: L.saveInline,
                    skipButtonText: L.saveWithoutNaming,
                    onSkip: function () {
                        doSave(session.name, resolve);
                    },
                }).open();
            });
        }

        var currentLayout = this.getCurrentWorkspaceLayout();
        var changed = !this.layoutsEqualStructural(session.layout, currentLayout);
        this.pushLayoutToHistory(session);
        session.layout = currentLayout;
        if (changed || options.touchModified) {
            session.modified = Date.now();
        }
        this.updateStatusBar();

        var name = session.name;
        return this.persistData().then(function () {
            if (!options.silent) {
                if (changed) {
                    new obsidian.Notice(L.savedSession(name));
                } else {
                    new obsidian.Notice(L.noChanges);
                }
            }
            return changed;
        });
    };

    WorkspacePlusPlus.prototype.overwriteSessionWithCurrentLayout = function (sessionId, options) {
        var L = i18n.L;
        options = options || {};
        var session = this.data.sessions[sessionId];
        if (!session) {
            if (!options.silent) new obsidian.Notice(L.noSession);
            return Promise.resolve(false);
        }

        var currentLayout = this.getCurrentWorkspaceLayout();
        var changed = !this.layoutsEqualStructural(session.layout, currentLayout);
        this.pushLayoutToHistory(session);
        session.layout = currentLayout;
        if (changed || options.touchModified) {
            session.modified = Date.now();
        }
        this.updateStatusBar();

        return this.persistData().then(function () {
            if (!options.silent) {
                if (changed) {
                    new obsidian.Notice(L.savedCurrentLayoutToSession(session.name));
                } else {
                    new obsidian.Notice(L.noChanges);
                }
            }
            return changed;
        });
    };

    WorkspacePlusPlus.prototype.saveCurrentLayoutAsSessionName = function (name, options) {
        var L = i18n.L;
        options = options || {};
        var sessionName = typeof name === 'string' ? name.trim() : '';
        if (!sessionName) {
            if (!options.silent) new obsidian.Notice(L.emptyName);
            return Promise.resolve({
                saved: false,
                created: false,
                overwritten: false,
                sessionId: null,
                name: sessionName,
            });
        }

        var previousActiveId = this.data.activeSessionId || null;
        if (this.isAutoSaveOnSwitchEnabled()) {
            this.captureActiveSessionLayoutIfAutoSave();
        }

        var currentLayout = this.getCurrentWorkspaceLayout();
        var existing = findSessionByName(this.data, sessionName);
        var session;
        var created = false;
        var overwritten = false;
        var changed = true;

        if (existing) {
            session = existing;
            changed = !this.layoutsEqualStructural(session.layout, currentLayout);
            if (!(this.isAutoSaveOnSwitchEnabled() && session.id === previousActiveId)) {
                this.pushLayoutToHistory(session);
            }
            session.layout = currentLayout;
            session.modified = Date.now();
            this.data.activeSessionId = session.id;
            var preferredGroupId = chooseSessionGroupForView(this, session.id);
            if (typeof preferredGroupId !== 'undefined') {
                this.data.activeGroupId = preferredGroupId;
            }
            overwritten = true;
        } else {
            var id = utils.generateId();
            session = this.createSessionRecord(id, sessionName, currentLayout);
            this.insertSessionAndActivate(session);
            created = true;
        }

        this.updateStatusBar();
        this.syncSessionCommands();

        return this.persistData().then(function () {
            if (!options.silent) {
                new obsidian.Notice(L.savedAs(sessionName));
            }
            return {
                saved: true,
                created: created,
                overwritten: overwritten,
                changed: changed,
                sessionId: session.id,
                name: sessionName,
            };
        });
    };

    WorkspacePlusPlus.prototype.confirmOverwriteSessionWithCurrentLayout = function (sessionId, options) {
        var L = i18n.L;
        options = options || {};
        var self = this;
        var session = this.data.sessions[sessionId];
        if (!session) {
            if (!options.silent) new obsidian.Notice(L.noSession);
            return false;
        }

        new modals.ConfirmModal(this.app, L.confirmOverwriteSessionWithCurrentLayout(session.name), function () {
            self.overwriteSessionWithCurrentLayout(sessionId, options).then(function (saved) {
                if (saved && typeof options.onSaved === 'function') options.onSaved(session);
            });
        }, {
            confirmText: L.saveInline,
            confirmClass: 'mod-cta',
        }).open();
        return true;
    };

    WorkspacePlusPlus.prototype.reloadCurrentSessionWithoutSaving = function (options) {
        var L = i18n.L;
        options = options || {};
        var session = this.getActiveSession();
        if (!session) {
            if (!options.silent) new obsidian.Notice(L.noSession);
            return Promise.resolve(false);
        }

        var applyLayout = session.layout
            ? this.applyWorkspaceLayout(session.layout)
            : Promise.resolve();
        var name = session.name;

        return applyLayout.then(function () {
            if (!options.silent) {
                new obsidian.Notice(L.reloadedSession(name));
            }
            return true;
        }).catch(function () {
            return false;
        });
    };

    WorkspacePlusPlus.prototype.captureActiveSessionLayoutIfAutoSave = function () {
        var current = this.getActiveSession();
        if (!current || !this.isAutoSaveOnSwitchEnabled()) return;
        this.pushLayoutToHistory(current);
        current.layout = this.getCurrentWorkspaceLayout();
        current.modified = Date.now();
    };

    WorkspacePlusPlus.prototype.saveAsSession = function () {
        var L = i18n.L;
        var self = this;
        var session = this.getActiveSession();
        if (!session) {
            new obsidian.Notice(L.noSession);
            return Promise.resolve(false);
        }

        return new Promise(function (resolve) {
            new modals.RenameModal(self.app, '', function (newName) {
                self.captureActiveSessionLayoutIfAutoSave();

                var layout = self.getCurrentWorkspaceLayout();

                // Check if a session with the same name already exists
                var existing = null;
                var allSessions = self.getOrderedSessionsUnfiltered();
                for (var i = 0; i < allSessions.length; i++) {
                    if (allSessions[i].name === newName) {
                        existing = allSessions[i];
                        break;
                    }
                }

                if (existing) {
                    // Overwrite existing session
                    existing.layout = layout;
                    existing.modified = Date.now();
                    self.data.activeSessionId = existing.id;
                } else {
                    var id = utils.generateId();
                    self.insertSessionAndActivate(
                        self.createSessionRecord(id, newName, layout)
                    );
                }

                self.updateStatusBar();
                self.syncSessionCommands();
                new obsidian.Notice(L.savedAs(newName));
                self.persistData().then(function () {
                    resolve(true);
                });
            }, {
                title: L.nameSessionTitle,
                placeholder: L.nameSessionPlaceholder,
                buttonText: L.saveInline,
                emptyNotice: L.emptyName,
            }).open();
        });
    };
}

module.exports = attachSessionSavingMethods;
