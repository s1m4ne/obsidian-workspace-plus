'use strict';

var obsidian = require('obsidian');
var i18n = require('../../i18n');
var UnsavedSwitchModal = require('../../modals/unsaved-switch-modal');

var SESSION_SWITCH_NOTICE_DURATION_MS = 1200;

function attachSessionSwitchingMethods(WorkspacePlusPlus) {
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
            // Empty group - still show overlay so user can switch groups via Tab
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
                new UnsavedSwitchModal(
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
}

module.exports = attachSessionSwitchingMethods;
