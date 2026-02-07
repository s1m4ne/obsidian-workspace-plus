'use strict';

var obsidian = require('obsidian');
var i18n = require('../../i18n');
var utils = require('../../utils');
var modals = require('../../modals');

function attachSessionMethods(WorkspacePlusPlus) {
    // --- Session order ---

    WorkspacePlusPlus.prototype.syncSessionOrder = function () {
        var sessions = this.data.sessions;
        var order = this.data.sessionOrder;
        // Remove IDs no longer in sessions
        this.data.sessionOrder = order.filter(function (id) { return !!sessions[id]; });
        // Find sessions not yet in order
        var inOrder = {};
        for (var i = 0; i < this.data.sessionOrder.length; i++) {
            inOrder[this.data.sessionOrder[i]] = true;
        }
        var missing = Object.keys(sessions).filter(function (id) { return !inOrder[id]; });
        missing.sort(function (a, b) {
            if (sessions[a].isDefault) return -1;
            if (sessions[b].isDefault) return 1;
            return sessions[a].name.localeCompare(sessions[b].name);
        });
        for (var j = 0; j < missing.length; j++) {
            if (sessions[missing[j]].isDefault) {
                this.data.sessionOrder.unshift(missing[j]);
            } else {
                this.data.sessionOrder.push(missing[j]);
            }
        }
    };

    WorkspacePlusPlus.prototype.getOrderedSessions = function () {
        var sessions = this.data.sessions;
        return this.data.sessionOrder
            .map(function (id) { return sessions[id]; })
            .filter(function (s) { return !!s; });
    };

    WorkspacePlusPlus.prototype.switchToIndex = function (index) {
        var ordered = this.getOrderedSessions();
        if (index >= ordered.length) return;
        if (ordered[index].id === this.data.activeSessionId) {
            this.showSwitchOverlay(ordered, index);
            return;
        }
        this.showSwitchOverlay(ordered, index);
        this.switchSession(ordered[index].id, { silent: true });
    };

    WorkspacePlusPlus.prototype.switchRelative = function (offset) {
        var ordered = this.getOrderedSessions();
        if (ordered.length === 0) return;
        var currentIndex = -1;
        for (var i = 0; i < ordered.length; i++) {
            if (ordered[i].id === this.data.activeSessionId) {
                currentIndex = i;
                break;
            }
        }
        if (currentIndex === -1) return;

        var previewEnabled = offset > 0 ? this.data.previewNext : this.data.previewPrevious;

        if (previewEnabled && !this.switchOverlayEl) {
            this.showSwitchOverlay(ordered, currentIndex);
            return;
        }

        var next = (currentIndex + offset + ordered.length) % ordered.length;
        this.showSwitchOverlay(ordered, next);
        if (next !== currentIndex) {
            this.switchSession(ordered[next].id, { silent: true });
        }
    };

    WorkspacePlusPlus.prototype.getActiveSession = function () {
        if (!this.data.activeSessionId) return null;
        return this.data.sessions[this.data.activeSessionId] || null;
    };

    WorkspacePlusPlus.prototype.getCurrentWorkspaceLayout = function () {
        return this.app.workspace.getLayout();
    };

    WorkspacePlusPlus.prototype.serializeLayout = function (layout) {
        try {
            return JSON.stringify(layout || null);
        } catch (e) {
            return '';
        }
    };

    WorkspacePlusPlus.prototype.layoutsEqual = function (a, b) {
        return this.serializeLayout(a) === this.serializeLayout(b);
    };

    WorkspacePlusPlus.prototype.isAutoSaveOnSwitchEnabled = function () {
        return this.data.autoSaveOnSwitch !== false;
    };

    WorkspacePlusPlus.prototype.isWarnOnUnsavedSwitchEnabled = function () {
        return this.data.warnOnUnsavedSwitch !== false;
    };

    WorkspacePlusPlus.prototype.getDefaultSessionName = function () {
        return 'default';
    };

    WorkspacePlusPlus.prototype.getAutoSessionName = function (n) {
        if (i18n.L.sessionAutoName) return i18n.L.sessionAutoName(n);
        return 'Session ' + n;
    };

    WorkspacePlusPlus.prototype.isActiveSessionDirty = function () {
        var session = this.getActiveSession();
        if (!session) return false;
        return !this.layoutsEqual(session.layout, this.getCurrentWorkspaceLayout());
    };

    WorkspacePlusPlus.prototype.setAutoSaveOnSwitch = function (enabled, options) {
        var L = i18n.L;
        options = options || {};
        this.data.autoSaveOnSwitch = !!enabled;
        var isOn = this.isAutoSaveOnSwitchEnabled();
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
        var session = this.getActiveSession();
        if (!session) {
            if (!options.silent) new obsidian.Notice(L.noSession);
            return Promise.resolve(false);
        }

        var currentLayout = this.getCurrentWorkspaceLayout();
        var changed = !this.layoutsEqual(session.layout, currentLayout);
        session.layout = currentLayout;
        if (changed || options.touchModified) {
            session.modified = Date.now();
        }
        this.updateStatusBar();

        var name = session.name;
        return this.persistData().then(function () {
            if (!options.silent) {
                new obsidian.Notice(L.savedSession(name));
            }
            return changed;
        });
    };

    WorkspacePlusPlus.prototype.updateStatusBar = function () {
        var L = i18n.L;
        var session = this.getActiveSession();
        this.statusBarEl.empty();
        var icon = this.statusBarEl.createSpan({ cls: 'wpp-status-icon' });
        obsidian.setIcon(icon, 'panels-left-bottom');
        this.statusBarEl.createSpan({
            text: session ? session.name : L.noSession,
            cls: 'wpp-status-name',
        });
    };

    // --- Session operations ---

    WorkspacePlusPlus.prototype.createSession = function (name) {
        var id = utils.generateId();
        var layout = this.getCurrentWorkspaceLayout();

        this.data.sessions[id] = {
            id: id,
            name: name,
            modified: Date.now(),
            layout: layout,
        };
        this.data.sessionOrder.push(id);
        this.data.activeSessionId = id;

        this.updateStatusBar();
        return this.persistData();
    };

    WorkspacePlusPlus.prototype.runSwitchRequest = function (request) {
        var self = this;
        this.isSwitchingSession = true;

        this.performSessionSwitch(request.targetId, request.options || {})
            .then(function (ok) {
                request.resolve(ok);
            })
            .catch(function () {
                request.resolve(false);
            })
            .then(function () {
                self.isSwitchingSession = false;
                if (!self.pendingSwitchRequest) return;
                var next = self.pendingSwitchRequest;
                self.pendingSwitchRequest = null;
                self.runSwitchRequest(next);
            });
    };

    WorkspacePlusPlus.prototype.switchSession = function (targetId, options) {
        var self = this;
        options = options || {};
        if (!this.data.sessions[targetId]) return Promise.resolve(false);
        if (targetId === this.data.activeSessionId && !this.isSwitchingSession) {
            return Promise.resolve(false);
        }

        return new Promise(function (resolve) {
            var request = {
                targetId: targetId,
                options: options,
                resolve: resolve,
            };

            if (self.isSwitchingSession) {
                if (self.pendingSwitchRequest) {
                    self.pendingSwitchRequest.resolve(false);
                }
                self.pendingSwitchRequest = request;
                return;
            }

            self.runSwitchRequest(request);
        });
    };

    WorkspacePlusPlus.prototype.performSessionSwitch = function (targetId, options) {
        var L = i18n.L;
        var self = this;
        options = options || {};
        var target = this.data.sessions[targetId];
        if (!target) return Promise.resolve(false);
        if (target.id === this.data.activeSessionId) return Promise.resolve(false);

        var performSwitch = function (skipCurrentSave) {
            // 1. Save current session state
            var current = self.getActiveSession();
            if (current && !skipCurrentSave) {
                current.layout = self.getCurrentWorkspaceLayout();
                current.modified = Date.now();
            }

            // 2. Update active
            self.data.activeSessionId = targetId;

            // 3. Apply target layout
            var applyLayout = target.layout
                ? self.app.workspace.changeLayout(target.layout)
                : Promise.resolve();

            return applyLayout.then(function () {
                self.updateStatusBar();
                return self.persistData();
            }).then(function () {
                if (!options.silent) {
                    new obsidian.Notice(L.loaded(target.name));
                }
                return true;
            });
        };

        var autoSaveOnSwitch = this.isAutoSaveOnSwitchEnabled();
        var shouldWarn = !autoSaveOnSwitch
            && !options.skipUnsavedWarning
            && this.isWarnOnUnsavedSwitchEnabled()
            && this.isActiveSessionDirty();

        if (shouldWarn) {
            return new Promise(function (resolve) {
                new modals.UnsavedSwitchModal(
                    self.app,
                    L.confirmUnsavedSwitch(target.name),
                    function () {
                        self.saveActiveSession({ silent: true, touchModified: true })
                            .then(function () { return performSwitch(true); })
                            .then(function (ok) { resolve(ok); })
                            .catch(function () { resolve(false); });
                    },
                    function () {
                        performSwitch(true)
                            .then(function (ok) { resolve(ok); })
                            .catch(function () { resolve(false); });
                    }
                ).open();
            });
        }

        return performSwitch(!autoSaveOnSwitch);
    };

    WorkspacePlusPlus.prototype.deleteSession = function (sessionId) {
        var session = this.data.sessions[sessionId];
        if (!session || Object.keys(this.data.sessions).length <= 1) return Promise.resolve(false);

        delete this.data.sessions[sessionId];
        var orderIdx = this.data.sessionOrder.indexOf(sessionId);
        if (orderIdx !== -1) this.data.sessionOrder.splice(orderIdx, 1);
        if (this.data.activeSessionId === sessionId) {
            // Keep same index position; if it was the last, move to index - 1
            var fallbackIdx = Math.min(orderIdx, this.data.sessionOrder.length - 1);
            var remaining = this.data.sessionOrder[fallbackIdx] || Object.keys(this.data.sessions)[0];
            this.data.activeSessionId = remaining || null;
        }
        this.updateStatusBar();
        return this.persistData().then(function () { return true; });
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
            var exists = Object.values(self.data.sessions)
                .some(function (s) { return s.name === newName && s.id !== session.id; });
            if (exists) {
                new obsidian.Notice(L.duplicateName);
                return;
            }
            var oldName = session.name;
            session.name = newName;
            session.modified = Date.now();
            self.updateStatusBar();
            self.persistData().then(function () {
                new obsidian.Notice(L.renamed(oldName, newName));
                var ordered = self.getOrderedSessions();
                var activeIdx = 0;
                for (var i = 0; i < ordered.length; i++) {
                    if (ordered[i].id === self.data.activeSessionId) { activeIdx = i; break; }
                }
                self.showSwitchOverlay(ordered, activeIdx);
            });
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
                var ordered = self.getOrderedSessions();
                var activeIdx = 0;
                for (var i = 0; i < ordered.length; i++) {
                    if (ordered[i].id === self.data.activeSessionId) { activeIdx = i; break; }
                }
                self.showSwitchOverlay(ordered, activeIdx);
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
        this.data.sessions[id] = {
            id: id,
            name: this.getDefaultSessionName(),
            modified: Date.now(),
            layout: this.getCurrentWorkspaceLayout(),
            isDefault: true,
        };
        this.data.sessionOrder.push(id);
        this.data.activeSessionId = id;
        this.updateStatusBar();
        return this.persistData();
    };

    WorkspacePlusPlus.prototype.createEmptySession = function () {
        var L = i18n.L;
        var name = this.getNextSessionName();

        // Save current session state
        var current = this.getActiveSession();
        if (current && this.isAutoSaveOnSwitchEnabled()) {
            current.layout = this.getCurrentWorkspaceLayout();
            current.modified = Date.now();
        }

        var id = utils.generateId();
        this.data.sessions[id] = {
            id: id,
            name: name,
            modified: Date.now(),
            layout: null,
        };
        this.data.sessionOrder.push(id);
        this.data.activeSessionId = id;

        // Close only main area leaves (keep sidebars intact)
        var leaves = [];
        this.app.workspace.iterateRootLeaves(function (leaf) { leaves.push(leaf); });
        for (var i = 0; i < leaves.length; i++) { leaves[i].detach(); }

        // Capture the empty state
        this.data.sessions[id].layout = this.getCurrentWorkspaceLayout();

        this.updateStatusBar();
        new obsidian.Notice(L.created(name));
        var ordered = this.getOrderedSessions();
        this.showSwitchOverlay(ordered, ordered.length - 1);
        return this.persistData();
    };

    WorkspacePlusPlus.prototype.duplicateCurrentSession = function () {
        var L = i18n.L;
        var name = this.getNextSessionName();

        // Save current session state
        var current = this.getActiveSession();
        if (current && this.isAutoSaveOnSwitchEnabled()) {
            current.layout = this.getCurrentWorkspaceLayout();
            current.modified = Date.now();
        }

        var id = utils.generateId();
        this.data.sessions[id] = {
            id: id,
            name: name,
            modified: Date.now(),
            layout: this.getCurrentWorkspaceLayout(),
        };
        this.data.sessionOrder.push(id);
        this.data.activeSessionId = id;

        this.updateStatusBar();
        new obsidian.Notice(L.duplicated(name));
        var ordered = this.getOrderedSessions();
        this.showSwitchOverlay(ordered, ordered.length - 1);
        return this.persistData();
    };

    WorkspacePlusPlus.prototype.ensureDefaultSession = function () {
        var hasDefault = Object.values(this.data.sessions)
            .some(function (s) { return s.isDefault; });
        if (hasDefault) return;

        var id = utils.generateId();
        this.data.sessions[id] = {
            id: id,
            name: this.getDefaultSessionName(),
            modified: Date.now(),
            layout: this.getCurrentWorkspaceLayout(),
            isDefault: true,
        };
        this.data.sessionOrder.unshift(id);
        this.data.activeSessionId = id;
        this.updateStatusBar();
        this.persistData();
    };

    WorkspacePlusPlus.prototype.flushOnStartup = function () {
        if (!this.isAutoSaveOnSwitchEnabled()) return;

        var session = this.getActiveSession();
        if (!session) return;

        session.layout = this.getCurrentWorkspaceLayout();
        session.modified = Date.now();
        return this.persistData();
    };
}

module.exports = attachSessionMethods;
