'use strict';

var obsidian = require('obsidian');
var i18n = require('../../i18n');
var utils = require('../../utils');
var modals = require('../../modals');
var attachSessionValidationMethods = require('./sessions-validation');

var STARTUP_SETTLE_MS = 1200;
var STARTUP_LAYOUT_CHANGE_SETTLE_MS = 400;
var STARTUP_SETTLE_MAX_MS = 5000;
var SESSION_SWITCH_NOTICE_DURATION_MS = 1200;

function attachSessionMethods(WorkspacePlusPlus) {
    attachSessionValidationMethods(WorkspacePlusPlus);
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

    WorkspacePlusPlus.prototype.clearSessionSwitchNotice = function () {
        if (!this.sessionSwitchNotice) return;
        this.sessionSwitchNotice.hide();
        this.sessionSwitchNotice = null;
    };

    WorkspacePlusPlus.prototype.showSessionSwitchNotice = function (sessionName, options) {
        var self = this;
        var L = i18n.L;
        options = options || {};
        var durationMs = typeof options.durationMs === 'number'
            ? options.durationMs
            : SESSION_SWITCH_NOTICE_DURATION_MS;

        this.clearSessionSwitchNotice();
        var notice = new obsidian.Notice(L.loaded(sessionName), durationMs);
        this.sessionSwitchNotice = notice;

        if (durationMs > 0) {
            setTimeout(function () {
                if (self.sessionSwitchNotice === notice) {
                    self.sessionSwitchNotice = null;
                }
            }, durationMs + 50);
        }

        return notice;
    };

    WorkspacePlusPlus.prototype.getOrderedSessionsUnfiltered = function () {
        var sessions = this.data.sessions;
        return this.data.sessionOrder
            .map(function (id) { return sessions[id]; })
            .filter(function (s) { return !!s; });
    };

    WorkspacePlusPlus.prototype.getOrderedSessionsForGroup = function (groupId) {
        var all = this.getOrderedSessionsUnfiltered();
        if (!this.isGroupFeatureEnabled()) return all;
        var targetGroupId = groupId || null;
        if (!targetGroupId) return all;

        var sessionGroups = this.data.sessionGroups || {};
        return all.filter(function (s) {
            var groups = sessionGroups[s.id];
            return groups && groups.indexOf(targetGroupId) !== -1;
        });
    };

    WorkspacePlusPlus.prototype.getOrderedSessions = function () {
        if (!this.isGroupFeatureEnabled()) {
            return this.getOrderedSessionsUnfiltered();
        }
        return this.getOrderedSessionsForGroup(this.data.activeGroupId);
    };

    WorkspacePlusPlus.prototype.mergeVisibleSessionOrder = function (visibleOrder) {
        var fullOrder = Array.isArray(this.data.sessionOrder) ? this.data.sessionOrder : [];
        var visible = Array.isArray(visibleOrder) ? visibleOrder : [];
        var visibleSet = {};
        for (var i = 0; i < visible.length; i++) {
            visibleSet[visible[i]] = true;
        }

        var visibleIdx = 0;
        var merged = [];
        for (var fi = 0; fi < fullOrder.length; fi++) {
            if (visibleSet[fullOrder[fi]]) {
                merged.push(visible[visibleIdx++]);
            } else {
                merged.push(fullOrder[fi]);
            }
        }
        while (visibleIdx < visible.length) {
            merged.push(visible[visibleIdx++]);
        }
        return merged;
    };

    WorkspacePlusPlus.prototype.setSessionOrderFromVisible = function (visibleOrder, options) {
        var prev = Array.isArray(this.data.sessionOrder) ? this.data.sessionOrder : [];
        var merged = this.mergeVisibleSessionOrder(visibleOrder);
        var changed = prev.length !== merged.length;
        if (!changed) {
            for (var i = 0; i < prev.length; i++) {
                if (prev[i] !== merged[i]) {
                    changed = true;
                    break;
                }
            }
        }

        this.data.sessionOrder = merged;
        if (!(options && options.syncCommands === false)) {
            this.syncSessionCommands();
        }
        if (options && options.persist === false) return Promise.resolve(changed);
        if (!changed) return Promise.resolve(false);
        return this.persistData().then(function () { return true; });
    };

    WorkspacePlusPlus.prototype.getSessionIndex = function (sessions, sessionId) {
        var idx = this.findSessionIndex(sessions, sessionId);
        return idx === -1 ? 0 : idx;
    };

    WorkspacePlusPlus.prototype.findSessionIndex = function (sessions, sessionId) {
        if (!sessions || sessions.length === 0) return -1;
        for (var i = 0; i < sessions.length; i++) {
            if (sessions[i] && sessions[i].id === sessionId) {
                return i;
            }
        }
        return -1;
    };

    WorkspacePlusPlus.prototype.findActiveSessionIndex = function (sessions) {
        return this.findSessionIndex(sessions, this.data.activeSessionId);
    };

    WorkspacePlusPlus.prototype.getActiveSessionIndex = function (sessions) {
        return this.getSessionIndex(sessions, this.data.activeSessionId);
    };

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

    WorkspacePlusPlus.prototype.getRelativeSwitchContext = function (offset) {
        var ordered = this.getOrderedSessions();
        if (ordered.length === 0) {
            return {
                ordered: ordered,
                currentIndex: -1,
                targetIndex: 0,
                isEmpty: true,
            };
        }
        var currentIndex = this.findActiveSessionIndex(ordered);
        if (currentIndex === -1) return null;

        return {
            ordered: ordered,
            currentIndex: currentIndex,
            targetIndex: (currentIndex + offset + ordered.length) % ordered.length,
            isEmpty: false,
        };
    };

    WorkspacePlusPlus.prototype.switchSessionAtOrderedIndex = function (ordered, index, options) {
        options = options || {};
        if (!ordered || index < 0 || index >= ordered.length) {
            return Promise.resolve(false);
        }

        if (options.overlayMode === 'preview') {
            this.showSwitchPreviewOverlay(ordered, index, options.viewGroupId);
        } else if (options.overlayMode === 'feedback') {
            this.showSwitchFeedbackOverlay(ordered, index, options.viewGroupId, options.overlayOptions);
        }

        if (!ordered[index]) {
            return Promise.resolve(false);
        }

        if (ordered[index].id === this.data.activeSessionId) {
            if (options.noticeMode === 'replace') {
                this.showSessionSwitchNotice(ordered[index].name, {
                    durationMs: options.switchNoticeDurationMs,
                });
            }
            return Promise.resolve(false);
        }

        return this.switchSession(ordered[index].id, {
            silent: options.silent !== false,
            switchNoticeMode: options.noticeMode,
            switchNoticeDurationMs: options.switchNoticeDurationMs,
        });
    };

    WorkspacePlusPlus.prototype.switchToIndex = function (index) {
        var ordered = this.getOrderedSessions();
        return this.switchSessionAtOrderedIndex(ordered, index, {
            overlayMode: 'feedback',
            silent: true,
        });
    };

    WorkspacePlusPlus.prototype.switchSessionByIdFromCommand = function (sessionId) {
        var ordered = this.getOrderedSessions();
        var index = this.findSessionIndex(ordered, sessionId);
        return this.switchSessionAtOrderedIndex(ordered, index, {
            overlayMode: 'feedback',
            silent: true,
        });
    };

    WorkspacePlusPlus.prototype.switchRelativeDirect = function (offset, options) {
        options = options || {};
        var context = this.getRelativeSwitchContext(offset);
        if (!context) return Promise.resolve(false);

        if (context.isEmpty) {
            if (options.overlayMode === 'preview') {
                this.showSwitchPreviewOverlay(context.ordered, 0, options.viewGroupId);
            } else if (options.overlayMode === 'feedback') {
                this.showSwitchFeedbackOverlay(context.ordered, 0, options.viewGroupId, options.overlayOptions);
            }
            return Promise.resolve(false);
        }

        return this.switchSessionAtOrderedIndex(context.ordered, context.targetIndex, options);
    };

    WorkspacePlusPlus.prototype.switchRelativeFromCommand = function (offset) {
        var context = this.getRelativeSwitchContext(offset);
        if (!context) return Promise.resolve(false);
        if (context.isEmpty) {
            // Empty group – still show overlay so user can switch groups via Tab
            this.showSwitchPreviewOverlay(context.ordered, 0);
            return Promise.resolve(false);
        }

        var previewEnabled = offset > 0 ? this.data.previewNext : this.data.previewPrevious;
        if (previewEnabled && !this.switchOverlayEl) {
            this.showSwitchPreviewOverlay(context.ordered, context.currentIndex);
            return Promise.resolve(false);
        }

        return this.switchSessionAtOrderedIndex(context.ordered, context.targetIndex, {
            overlayMode: 'preview',
            silent: true,
        });
    };

    WorkspacePlusPlus.prototype.switchRelativeFromStatusBar = function (offset) {
        return this.switchRelativeDirect(offset, {
            overlayMode: 'none',
            noticeMode: 'replace',
            silent: true,
        });
    };

    WorkspacePlusPlus.prototype.switchRelativeFromScroll = function (offset) {
        return this.switchRelativeDirect(offset, {
            overlayMode: 'none',
            noticeMode: 'replace',
            silent: true,
        });
    };

    WorkspacePlusPlus.prototype.switchRelative = function (offset) {
        return this.switchRelativeFromCommand(offset);
    };

    WorkspacePlusPlus.prototype.switchRelativeImmediate = function (offset, options) {
        options = options || {};
        return this.switchRelativeDirect(offset, {
            overlayMode: options.showOverlay === false ? 'none' : 'feedback',
            overlayOptions: options.overlayOptions,
            silent: true,
        });
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

    WorkspacePlusPlus.prototype.isGroupFeatureEnabled = function () {
        return this.data.groupFeatureEnabled !== false;
    };

    WorkspacePlusPlus.prototype.normalizeGroupFeatureState = function () {
        if (this.isGroupFeatureEnabled()) return;
        this.data.activeGroupId = null;
    };

    WorkspacePlusPlus.prototype.setGroupFeatureEnabled = function (enabled) {
        var nextEnabled = enabled !== false;
        var changed = this.isGroupFeatureEnabled() !== nextEnabled;
        this.data.groupFeatureEnabled = nextEnabled;

        if (!nextEnabled && this.data.activeGroupId) {
            this.data.activeGroupId = null;
            changed = true;
        }

        if (!nextEnabled) {
            this.hideSwitchOverlay();
            this.hideSearchOverlay();
        }

        this.syncSessionCommands();
        this.updateStatusBar();

        if (!changed) return Promise.resolve(false);
        return this.persistData().then(function () { return true; });
    };

    WorkspacePlusPlus.prototype.getDefaultSessionName = function () {
        return i18n.L.defaultSessionName;
    };

    WorkspacePlusPlus.prototype.getAutoSessionName = function (n) {
        return i18n.L.sessionAutoName(n);
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

        // Sync snapshot timer — it requires both version history and auto-save
        if (isOn) {
            this.startHistorySnapshotTimer();
        } else {
            this.stopHistorySnapshotTimer();
        }

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
        obsidian.setIcon(icon, 'panels-top-left');

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

    WorkspacePlusPlus.prototype.attachSessionToActiveGroup = function (sessionId) {
        if (!this.isGroupFeatureEnabled()) return;
        var activeGroupId = this.data.activeGroupId;
        if (!activeGroupId) return;
        if (!this.data.sessionGroups) this.data.sessionGroups = {};
        if (!Array.isArray(this.data.sessionGroups[sessionId])) {
            this.data.sessionGroups[sessionId] = [];
        }
        if (this.data.sessionGroups[sessionId].indexOf(activeGroupId) === -1) {
            this.data.sessionGroups[sessionId].push(activeGroupId);
        }
    };

    WorkspacePlusPlus.prototype.insertSessionAndActivate = function (session) {
        this.data.sessions[session.id] = session;
        this.data.sessionOrder.push(session.id);
        this.data.activeSessionId = session.id;
        this.attachSessionToActiveGroup(session.id);
    };

    WorkspacePlusPlus.prototype.captureActiveSessionLayoutIfAutoSave = function () {
        var current = this.getActiveSession();
        if (!current || !this.isAutoSaveOnSwitchEnabled()) return;
        this.pushLayoutToHistory(current);
        current.layout = this.getCurrentWorkspaceLayout();
        current.modified = Date.now();
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

        var startupDelayMs = this.getStartupSettleRemainingMs();
        if (startupDelayMs > 0) {
            return new Promise(function (resolve) {
                setTimeout(function () {
                    self.switchSession(targetId, options).then(resolve);
                }, startupDelayMs);
            });
        }

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
                self.pushLayoutToHistory(current);
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
                if (options.switchNoticeMode === 'replace') {
                    self.showSessionSwitchNotice(target.name, {
                        durationMs: options.switchNoticeDurationMs,
                    });
                } else if (!options.silent) {
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
                ? this.app.workspace.changeLayout(nextSession.layout).catch(function () {})
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
            JSON.parse(JSON.stringify(source.layout))
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

    WorkspacePlusPlus.prototype.setStartupSettleDeadline = function (deadlineMs) {
        var self = this;
        var nextDeadline = typeof deadlineMs === 'number' ? deadlineMs : 0;

        if (this.startupSettleTimer) {
            clearTimeout(this.startupSettleTimer);
            this.startupSettleTimer = null;
        }

        if (nextDeadline <= Date.now()) {
            this.startupSettleStartedAt = 0;
            this.startupSettleUntil = 0;
            return 0;
        }

        this.startupSettleUntil = nextDeadline;
        this.startupSettleTimer = setTimeout(function () {
            self.startupSettleStartedAt = 0;
            self.startupSettleUntil = 0;
            self.startupSettleTimer = null;
        }, nextDeadline - Date.now());
        return this.startupSettleUntil;
    };

    WorkspacePlusPlus.prototype.startStartupSettleWindow = function (durationMs) {
        var startedAt = Date.now();
        var duration = typeof durationMs === 'number' && durationMs > 0
            ? durationMs
            : STARTUP_SETTLE_MS;

        this.startupSettleStartedAt = startedAt;
        return this.setStartupSettleDeadline(startedAt + duration);
    };

    WorkspacePlusPlus.prototype.getStartupSettleRemainingMs = function () {
        var remaining = (this.startupSettleUntil || 0) - Date.now();
        return remaining > 0 ? remaining : 0;
    };

    WorkspacePlusPlus.prototype.isStartupSettling = function () {
        return this.getStartupSettleRemainingMs() > 0;
    };

    WorkspacePlusPlus.prototype.noteStartupLayoutChange = function () {
        if (!this.isStartupSettling()) return;

        var startedAt = this.startupSettleStartedAt || Date.now();
        var maxDeadline = startedAt + STARTUP_SETTLE_MAX_MS;
        var nextDeadline = Math.min(maxDeadline, Date.now() + STARTUP_LAYOUT_CHANGE_SETTLE_MS);

        if (nextDeadline <= (this.startupSettleUntil || 0)) return;
        this.setStartupSettleDeadline(nextDeadline);
        this.scheduleStartupFlush();
    };

    WorkspacePlusPlus.prototype.scheduleStartupFlush = function () {
        var self = this;

        if (this.startupFlushTimer) {
            clearTimeout(this.startupFlushTimer);
            this.startupFlushTimer = null;
        }

        if (!this.isAutoSaveOnSwitchEnabled()) return Promise.resolve(false);

        var delayMs = this.getStartupSettleRemainingMs();
        if (delayMs <= 0) {
            return Promise.resolve(this.flushOnStartup());
        }

        return new Promise(function (resolve) {
            self.startupFlushTimer = setTimeout(function () {
                self.startupFlushTimer = null;
                resolve(self.flushOnStartup());
            }, delayMs);
        });
    };

    WorkspacePlusPlus.prototype.flushOnStartup = function () {
        if (!this.isAutoSaveOnSwitchEnabled()) return;

        var session = this.getActiveSession();
        if (!session) return;

        this.pushLayoutToHistory(session);
        session.layout = this.getCurrentWorkspaceLayout();
        session.modified = Date.now();
        return this.persistData();
    };

    // --- Group operations ---

    WorkspacePlusPlus.prototype.getOrderedGroups = function () {
        if (!this.isGroupFeatureEnabled()) return [];
        var groups = this.data.groups || {};
        return (this.data.groupOrder || [])
            .map(function (id) { return groups[id]; })
            .filter(function (g) { return !!g; });
    };

    WorkspacePlusPlus.prototype.normalizeGroupTabOrder = function (order) {
        var groups = this.data.groups || {};
        var input = Array.isArray(order) ? order : [];
        var seen = {};
        var out = [];
        var i;

        for (i = 0; i < input.length; i++) {
            var gid = input[i];
            if (gid !== '__all__' && !groups[gid]) continue;
            if (seen[gid]) continue;
            seen[gid] = true;
            out.push(gid);
        }

        if (!seen.__all__) {
            out.unshift('__all__');
            seen.__all__ = true;
        }

        var existingIds = Object.keys(groups);
        for (i = 0; i < existingIds.length; i++) {
            if (seen[existingIds[i]]) continue;
            seen[existingIds[i]] = true;
            out.push(existingIds[i]);
        }

        return out;
    };

    WorkspacePlusPlus.prototype.getOrderedGroupTabIds = function () {
        if (!this.isGroupFeatureEnabled()) return [];
        this.data.groupOrder = this.normalizeGroupTabOrder(this.data.groupOrder);
        return this.data.groupOrder.slice();
    };

    WorkspacePlusPlus.prototype.setGroupTabOrder = function (order, options) {
        if (!this.isGroupFeatureEnabled()) return Promise.resolve(false);
        var prev = Array.isArray(this.data.groupOrder) ? this.data.groupOrder : [];
        var normalized = this.normalizeGroupTabOrder(order);
        var changed = prev.length !== normalized.length;
        if (!changed) {
            for (var i = 0; i < prev.length; i++) {
                if (prev[i] !== normalized[i]) {
                    changed = true;
                    break;
                }
            }
        }
        this.data.groupOrder = normalized;

        if (options && options.persist === false) return Promise.resolve(changed);
        if (!changed) return Promise.resolve(false);
        return this.persistData().then(function () { return true; });
    };

    WorkspacePlusPlus.prototype.getActiveGroup = function () {
        if (!this.isGroupFeatureEnabled()) return null;
        if (!this.data.activeGroupId) return null;
        return (this.data.groups || {})[this.data.activeGroupId] || null;
    };

    WorkspacePlusPlus.prototype.createGroup = function (name) {
        var L = i18n.L;
        var id = utils.generateId();
        if (!this.data.groups) this.data.groups = {};

        this.data.groups[id] = { id: id, name: name };
        var nextOrder = Array.isArray(this.data.groupOrder) ? this.data.groupOrder.slice() : [];
        nextOrder.push(id);
        this.data.groupOrder = this.normalizeGroupTabOrder(nextOrder);

        new obsidian.Notice(L.groupCreated(name));
        return this.persistData().then(function () { return id; });
    };

    WorkspacePlusPlus.prototype.deleteGroup = function (groupId) {
        var L = i18n.L;
        if (!this.data.groups || !this.data.groups[groupId]) return Promise.resolve(false);

        var name = this.data.groups[groupId].name;
        delete this.data.groups[groupId];

        var nextOrder = (this.data.groupOrder || []).filter(function (gid) {
            return gid !== groupId;
        });
        this.data.groupOrder = this.normalizeGroupTabOrder(nextOrder);

        this.removeGroupMembershipFromAllSessions(groupId, { persist: false });

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
        if (!this.isGroupFeatureEnabled()) return Promise.resolve(false);
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
        if (!this.isGroupFeatureEnabled()) return undefined;
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
        if (!this.isGroupFeatureEnabled()) {
            return Promise.resolve({
                switched: false,
                targetGroupId: null,
                resolvedGroupId: null,
                sessions: this.getOrderedSessionsUnfiltered(),
            });
        }
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
        if (!this.isGroupFeatureEnabled()) return Promise.resolve(false);
        var targetGroupId = this.getRelativeGroupId(this.data.activeGroupId, offset);
        if (typeof targetGroupId === 'undefined') return Promise.resolve(false);
        return this.setActiveGroup(targetGroupId);
    };

    WorkspacePlusPlus.prototype.removeGroupMembershipFromAllSessions = function (groupId, options) {
        if (!groupId) return Promise.resolve(false);

        var sg = this.data.sessionGroups || {};
        var keys = Object.keys(sg);
        var changed = false;
        for (var i = 0; i < keys.length; i++) {
            var arr = sg[keys[i]];
            var idx = arr.indexOf(groupId);
            if (idx !== -1) {
                arr.splice(idx, 1);
                changed = true;
                if (arr.length === 0) delete sg[keys[i]];
            }
        }

        if (!changed) return Promise.resolve(false);
        this.syncSessionCommands();
        if (options && options.persist === false) return Promise.resolve(true);
        return this.persistData().then(function () { return true; });
    };

    WorkspacePlusPlus.prototype.removeAllSessionsFromGroup = function (groupId, options) {
        if (!groupId) return Promise.resolve(false);
        var groups = this.data.groups || {};
        if (!groups[groupId]) return Promise.resolve(false);
        return this.removeGroupMembershipFromAllSessions(groupId, options);
    };

    WorkspacePlusPlus.prototype.moveSessionToGroupExclusive = function (sessionId, groupId, options) {
        if (!this.data.sessions[sessionId]) return Promise.resolve(false);
        if (!this.data.groups || !this.data.groups[groupId]) return Promise.resolve(false);

        if (!this.data.sessionGroups) this.data.sessionGroups = {};
        var prev = this.data.sessionGroups[sessionId] || [];
        var changed = prev.length !== 1 || prev[0] !== groupId;

        if (!changed) return Promise.resolve(false);
        this.data.sessionGroups[sessionId] = [groupId];
        this.syncSessionCommands();
        if (options && options.persist === false) return Promise.resolve(true);
        return this.persistData().then(function () { return true; });
    };

    WorkspacePlusPlus.prototype.clearAllGroups = function (options) {
        var groupCount = Object.keys(this.data.groups || {}).length;
        var sessionGroupCount = Object.keys(this.data.sessionGroups || {}).length;
        var hasActiveGroup = !!this.data.activeGroupId;
        var hadCustomOrder = Array.isArray(this.data.groupOrder)
            ? this.data.groupOrder.some(function (id) { return id !== '__all__'; })
            : false;
        var changed = groupCount > 0 || sessionGroupCount > 0 || hasActiveGroup || hadCustomOrder;

        this.data.sessionGroups = {};
        this.data.groups = {};
        this.data.groupOrder = this.normalizeGroupTabOrder([]);
        this.data.activeGroupId = null;

        this.syncSessionCommands();
        this.updateStatusBar();

        if (!changed) return Promise.resolve(false);
        if (options && options.persist === false) return Promise.resolve(true);
        return this.persistData().then(function () { return true; });
    };

    WorkspacePlusPlus.prototype.addSessionToGroup = function (sessionId, groupId) {
        if (!this.data.sessions[sessionId]) return Promise.resolve(false);
        if (!this.data.groups || !this.data.groups[groupId]) return Promise.resolve(false);

        if (!this.data.sessionGroups) this.data.sessionGroups = {};
        if (!this.data.sessionGroups[sessionId]) this.data.sessionGroups[sessionId] = [];

        if (this.data.sessionGroups[sessionId].indexOf(groupId) !== -1) return Promise.resolve(false);

        this.data.sessionGroups[sessionId].push(groupId);
        this.syncSessionCommands();
        return this.persistData().then(function () { return true; });
    };

    WorkspacePlusPlus.prototype.removeSessionFromGroup = function (sessionId, groupId) {
        if (!this.data.sessionGroups || !this.data.sessionGroups[sessionId]) return Promise.resolve(false);

        var arr = this.data.sessionGroups[sessionId];
        var idx = arr.indexOf(groupId);
        if (idx === -1) return Promise.resolve(false);

        arr.splice(idx, 1);
        if (arr.length === 0) delete this.data.sessionGroups[sessionId];

        this.syncSessionCommands();
        return this.persistData().then(function () { return true; });
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
