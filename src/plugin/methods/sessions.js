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

    WorkspacePlusPlus.prototype.getOrderedSessionsUnfiltered = function () {
        var sessions = this.data.sessions;
        return this.data.sessionOrder
            .map(function (id) { return sessions[id]; })
            .filter(function (s) { return !!s; });
    };

    WorkspacePlusPlus.prototype.getOrderedSessionsForGroup = function (groupId) {
        var all = this.getOrderedSessionsUnfiltered();
        var targetGroupId = groupId || null;
        if (!targetGroupId) return all;

        var sessionGroups = this.data.sessionGroups || {};
        return all.filter(function (s) {
            var groups = sessionGroups[s.id];
            return groups && groups.indexOf(targetGroupId) !== -1;
        });
    };

    WorkspacePlusPlus.prototype.getOrderedSessions = function () {
        return this.getOrderedSessionsForGroup(this.data.activeGroupId);
    };

    WorkspacePlusPlus.prototype.getSessionIndex = function (sessions, sessionId) {
        if (!sessions || sessions.length === 0) return 0;
        for (var i = 0; i < sessions.length; i++) {
            if (sessions[i] && sessions[i].id === sessionId) return i;
        }
        return 0;
    };

    WorkspacePlusPlus.prototype.getActiveSessionIndex = function (sessions) {
        return this.getSessionIndex(sessions, this.data.activeSessionId);
    };

    WorkspacePlusPlus.prototype.syncSessionCommands = function () {
        var L = i18n.L;
        var ordered = this.getOrderedSessions();
        var self = this;

        // 1. Re-register numbered commands (1-9) with session names
        for (var n = 1; n <= 9; n++) {
            (function (num) {
                self.removeCommand('switch-to-' + num);
                var session = ordered[num - 1];
                self.addCommand({
                    id: 'switch-to-' + num,
                    name: L.cmdSwitchTo(num, session ? session.name : undefined),
                    callback: function () { self.switchToIndex(num - 1); },
                });
            })(n);
        }

        // 2. Remove old dynamic commands
        var oldIds = this._dynamicSessionCommandIds || [];
        for (var i = 0; i < oldIds.length; i++) {
            this.removeCommand(oldIds[i]);
        }
        this._dynamicSessionCommandIds = [];

        // 3. Register dynamic commands for sessions beyond the first 9
        for (var j = 9; j < ordered.length; j++) {
            (function (session) {
                var cmdId = 'switch-to-named-' + session.id;
                self.addCommand({
                    id: cmdId,
                    name: L.cmdSwitchToNamed(session.name),
                    callback: function () {
                        self.switchSession(session.id);
                    },
                });
                self._dynamicSessionCommandIds.push(cmdId);
            })(ordered[j]);
        }
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
        if (ordered.length === 0) {
            // Empty group – still show overlay so user can switch groups via Tab
            this.showSwitchOverlay(ordered, 0);
            return;
        }
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

    // Compare layouts ignoring volatile scroll/position state (left, top, scroll)
    WorkspacePlusPlus.prototype.layoutsEqualStructural = function (a, b) {
        try {
            var normalize = function (layout) {
                return JSON.stringify(layout || null)
                    .replace(/"(?:left|top|scroll)":-?\d+(?:\.\d+)?/g, '"_":0');
            };
            return normalize(a) === normalize(b);
        } catch (e) {
            return this.layoutsEqual(a, b);
        }
    };

    WorkspacePlusPlus.prototype.isAutoSaveOnSwitchEnabled = function () {
        return this.data.autoSaveOnSwitch !== false;
    };

    WorkspacePlusPlus.prototype.isWarnOnUnsavedSwitchEnabled = function () {
        return this.data.warnOnUnsavedSwitch !== false;
    };

    WorkspacePlusPlus.prototype.getDefaultSessionName = function () {
        return i18n.L.defaultSessionName || 'default';
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
        var changed = !this.layoutsEqualStructural(session.layout, currentLayout);
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

    WorkspacePlusPlus.prototype.reloadCurrentSessionWithoutSaving = function (options) {
        var L = i18n.L;
        options = options || {};
        var session = this.getActiveSession();
        if (!session) {
            if (!options.silent) new obsidian.Notice(L.noSession);
            return Promise.resolve(false);
        }

        var applyLayout = session.layout
            ? this.app.workspace.changeLayout(session.layout).catch(function () {})
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

    WorkspacePlusPlus.prototype.updateStatusBar = function () {
        var L = i18n.L;
        var session = this.getActiveSession();
        this.statusBarEl.empty();
        var icon = this.statusBarEl.createSpan({ cls: 'wpp-status-icon' });
        obsidian.setIcon(icon, 'panels-left-bottom');

        // Show group name if a group is active
        var activeGroup = this.getActiveGroup();
        if (activeGroup) {
            this.statusBarEl.createSpan({
                text: activeGroup.name,
                cls: 'wpp-status-group',
            });
            this.statusBarEl.createSpan({
                text: ' / ',
                cls: 'wpp-status-separator',
            });
        }

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

        // Auto-add to active group
        if (this.data.activeGroupId) {
            if (!this.data.sessionGroups) this.data.sessionGroups = {};
            if (!this.data.sessionGroups[id]) this.data.sessionGroups[id] = [];
            this.data.sessionGroups[id].push(this.data.activeGroupId);
        }

        this.updateStatusBar();
        this.syncSessionCommands();
        return this.persistData();
    };

    WorkspacePlusPlus.prototype.runSwitchRequest = function (request) {
        var self = this;
        this.isSwitchingSession = true;
        this.switchLockAt = Date.now();

        this.performSessionSwitch(request.targetId, request.options || {})
            .then(function (ok) {
                request.resolve(ok);
            })
            .catch(function () {
                request.resolve(false);
            })
            .then(function () {
                self.isSwitchingSession = false;
                self.switchLockAt = 0;
                if (!self.pendingSwitchRequest) return;
                var next = self.pendingSwitchRequest;
                self.pendingSwitchRequest = null;
                self.runSwitchRequest(next);
            });
    };

    WorkspacePlusPlus.prototype.switchSession = function (targetId, options) {
        var self = this;
        options = options || {};

        // Recover from stale switching lock (e.g. interrupted modal flow).
        if (this.isSwitchingSession) {
            var lockAt = this.switchLockAt || 0;
            var elapsed = lockAt ? (Date.now() - lockAt) : Number.MAX_SAFE_INTEGER;
            var hasBlockingUi = !!document.querySelector('.wpp-confirm-buttons')
                || !!document.querySelector('.wpp-switch-overlay');
            if (!hasBlockingUi && elapsed > 5000) {
                this.isSwitchingSession = false;
                this.switchLockAt = 0;
                if (this.pendingSwitchRequest) {
                    this.pendingSwitchRequest.resolve(false);
                    this.pendingSwitchRequest = null;
                }
            }
        }

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
                ? self.app.workspace.changeLayout(target.layout).catch(function () {})
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
                    },
                    function () {
                        resolve(false);
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

        // Clean up group membership
        if (this.data.sessionGroups && this.data.sessionGroups[sessionId]) {
            delete this.data.sessionGroups[sessionId];
        }
        if (this.data.activeSessionId === sessionId) {
            // Keep same index position; if it was the last, move to index - 1
            var fallbackIdx = Math.min(orderIdx, this.data.sessionOrder.length - 1);
            var remaining = this.data.sessionOrder[fallbackIdx] || Object.keys(this.data.sessions)[0];
            this.data.activeSessionId = remaining || null;
        }
        this.updateStatusBar();
        this.syncSessionCommands();
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
            self.syncSessionCommands();
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
        this.data.groups = {};
        this.data.groupOrder = [];
        this.data.sessionGroups = {};
        this.data.activeGroupId = null;
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
        this.syncSessionCommands();
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

        // Auto-add to active group
        if (this.data.activeGroupId) {
            if (!this.data.sessionGroups) this.data.sessionGroups = {};
            if (!this.data.sessionGroups[id]) this.data.sessionGroups[id] = [];
            this.data.sessionGroups[id].push(this.data.activeGroupId);
        }

        // Close only main area leaves (keep sidebars intact)
        var leaves = [];
        this.app.workspace.iterateRootLeaves(function (leaf) { leaves.push(leaf); });
        for (var i = 0; i < leaves.length; i++) { leaves[i].detach(); }

        // Capture the empty state
        this.data.sessions[id].layout = this.getCurrentWorkspaceLayout();

        this.updateStatusBar();
        this.syncSessionCommands();
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

        // Auto-add to active group
        if (this.data.activeGroupId) {
            if (!this.data.sessionGroups) this.data.sessionGroups = {};
            if (!this.data.sessionGroups[id]) this.data.sessionGroups[id] = [];
            this.data.sessionGroups[id].push(this.data.activeGroupId);
        }

        this.updateStatusBar();
        this.syncSessionCommands();
        new obsidian.Notice(L.duplicated(name));
        var ordered = this.getOrderedSessions();
        this.showSwitchOverlay(ordered, ordered.length - 1);
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
        this.data.sessions[newId] = {
            id: newId,
            name: name,
            modified: Date.now(),
            layout: JSON.parse(JSON.stringify(source.layout)),
        };
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
        this.syncSessionCommands();
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

    // --- Group operations ---

    WorkspacePlusPlus.prototype.getOrderedGroups = function () {
        var groups = this.data.groups || {};
        return (this.data.groupOrder || [])
            .map(function (id) { return groups[id]; })
            .filter(function (g) { return !!g; });
    };

    WorkspacePlusPlus.prototype.getActiveGroup = function () {
        if (!this.data.activeGroupId) return null;
        return (this.data.groups || {})[this.data.activeGroupId] || null;
    };

    WorkspacePlusPlus.prototype.createGroup = function (name) {
        var L = i18n.L;
        var id = utils.generateId();
        if (!this.data.groups) this.data.groups = {};
        if (!this.data.groupOrder) this.data.groupOrder = [];

        this.data.groups[id] = { id: id, name: name };
        this.data.groupOrder.push(id);

        new obsidian.Notice(L.groupCreated(name));
        return this.persistData().then(function () { return id; });
    };

    WorkspacePlusPlus.prototype.deleteGroup = function (groupId) {
        var L = i18n.L;
        if (!this.data.groups || !this.data.groups[groupId]) return Promise.resolve(false);

        var name = this.data.groups[groupId].name;
        delete this.data.groups[groupId];

        var orderIdx = (this.data.groupOrder || []).indexOf(groupId);
        if (orderIdx !== -1) this.data.groupOrder.splice(orderIdx, 1);

        // Remove group from all session memberships
        var sg = this.data.sessionGroups || {};
        var keys = Object.keys(sg);
        for (var i = 0; i < keys.length; i++) {
            var arr = sg[keys[i]];
            var idx = arr.indexOf(groupId);
            if (idx !== -1) {
                arr.splice(idx, 1);
                if (arr.length === 0) delete sg[keys[i]];
            }
        }

        // Reset active group if deleted
        if (this.data.activeGroupId === groupId) {
            this.data.activeGroupId = null;
        }

        this.updateStatusBar();
        this.syncSessionCommands();
        new obsidian.Notice(L.groupDeleted(name));
        return this.persistData().then(function () { return true; });
    };

    WorkspacePlusPlus.prototype.renameGroup = function (groupId, newName) {
        var L = i18n.L;
        if (!this.data.groups || !this.data.groups[groupId]) return Promise.resolve(false);

        var oldName = this.data.groups[groupId].name;
        this.data.groups[groupId].name = newName;
        this.updateStatusBar();

        new obsidian.Notice(L.groupRenamed(oldName, newName));
        return this.persistData().then(function () { return true; });
    };

    WorkspacePlusPlus.prototype.setActiveGroup = function (groupId) {
        var nextGroupId = groupId || null;
        if (nextGroupId && (!this.data.groups || !this.data.groups[nextGroupId])) return Promise.resolve(false);

        var self = this;
        var commitGroup = function () {
            self.data.activeGroupId = nextGroupId;
            self.syncSessionCommands();
            self.updateStatusBar();
            return self.persistData().then(function () { return true; });
        };

        if (!nextGroupId) {
            return commitGroup();
        }

        // Resolve target sessions before mutating group to keep group/session switch atomic.
        var sessionGroups = this.data.sessionGroups || {};
        var targetSessions = this.getOrderedSessionsUnfiltered().filter(function (s) {
            var groups = sessionGroups[s.id];
            return groups && groups.indexOf(nextGroupId) !== -1;
        });
        if (targetSessions.length === 0) {
            return Promise.resolve(false);
        }

        var activeId = this.data.activeSessionId;
        var isInTarget = targetSessions.some(function (s) { return s.id === activeId; });
        if (isInTarget) {
            return commitGroup();
        }

        return this.switchSession(targetSessions[0].id).then(function (switched) {
            if (!switched) return false;
            return commitGroup();
        });
    };

    WorkspacePlusPlus.prototype.exitGroup = function () {
        return this.setActiveGroup(null);
    };

    WorkspacePlusPlus.prototype.getRelativeGroupId = function (baseGroupId, offset) {
        var ordered = this.getOrderedGroups();
        if (ordered.length === 0) return undefined;

        var currentId = baseGroupId || null;
        if (!currentId) {
            var edgeIdx = offset > 0 ? 0 : ordered.length - 1;
            return ordered[edgeIdx].id;
        }

        var currentIdx = -1;
        for (var i = 0; i < ordered.length; i++) {
            if (ordered[i].id === currentId) { currentIdx = i; break; }
        }
        if (currentIdx === -1) return ordered[0].id;

        var nextIdx = currentIdx + offset;
        if (nextIdx < 0 || nextIdx >= ordered.length) return null;
        return ordered[nextIdx].id;
    };

    WorkspacePlusPlus.prototype.resolveGroupSelection = function (groupId) {
        var targetGroupId = groupId || null;
        var targetSessions = this.getOrderedSessionsForGroup(targetGroupId);
        var self = this;

        return this.setActiveGroup(targetGroupId).then(function (switched) {
            var resolvedGroupId;
            if (switched) {
                resolvedGroupId = self.data.activeGroupId || null;
            } else if (targetSessions.length === 0) {
                // Empty group is a view-only selection in overlays/modals.
                resolvedGroupId = targetGroupId;
            } else {
                resolvedGroupId = self.data.activeGroupId || null;
            }
            return {
                switched: switched,
                targetGroupId: targetGroupId,
                resolvedGroupId: resolvedGroupId,
                sessions: self.getOrderedSessionsForGroup(resolvedGroupId),
            };
        });
    };

    WorkspacePlusPlus.prototype.switchGroupRelative = function (offset) {
        var targetGroupId = this.getRelativeGroupId(this.data.activeGroupId, offset);
        if (typeof targetGroupId === 'undefined') return Promise.resolve(false);
        return this.setActiveGroup(targetGroupId);
    };

    WorkspacePlusPlus.prototype.addSessionToGroup = function (sessionId, groupId) {
        if (!this.data.sessions[sessionId]) return Promise.resolve(false);
        if (!this.data.groups || !this.data.groups[groupId]) return Promise.resolve(false);

        if (!this.data.sessionGroups) this.data.sessionGroups = {};
        if (!this.data.sessionGroups[sessionId]) this.data.sessionGroups[sessionId] = [];

        if (this.data.sessionGroups[sessionId].indexOf(groupId) === -1) {
            this.data.sessionGroups[sessionId].push(groupId);
        }

        return this.persistData();
    };

    WorkspacePlusPlus.prototype.removeSessionFromGroup = function (sessionId, groupId) {
        if (!this.data.sessionGroups || !this.data.sessionGroups[sessionId]) return Promise.resolve(false);

        var arr = this.data.sessionGroups[sessionId];
        var idx = arr.indexOf(groupId);
        if (idx === -1) return Promise.resolve(false);

        arr.splice(idx, 1);
        if (arr.length === 0) delete this.data.sessionGroups[sessionId];

        return this.persistData();
    };

    WorkspacePlusPlus.prototype.getGroupSessionIds = function (groupId) {
        var sg = this.data.sessionGroups || {};
        var result = [];
        var keys = Object.keys(sg);
        for (var i = 0; i < keys.length; i++) {
            if (sg[keys[i]].indexOf(groupId) !== -1) result.push(keys[i]);
        }
        return result;
    };
}

module.exports = attachSessionMethods;
