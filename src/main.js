'use strict';

var obsidian = require('obsidian');
var i18n = require('./i18n');
var utils = require('./utils');
var modals = require('./modals');
var settings = require('./settings');

i18n.resolveLocale();

// ============================================================
// Main Plugin
// ============================================================
var DEFAULT_DATA = {
    activeSessionId: null,
    sessions: {},
    sessionOrder: [],
    language: 'auto',
    previewNext: true,
    previewPrevious: true,
    confirmDeleteByHotkey: true,
};

var WorkspacePlusPlus = /** @class */ (function (_super) {
    function WorkspacePlusPlus() {
        return _super !== null && _super.apply(this, arguments) || this;
    }

    WorkspacePlusPlus.prototype = Object.create(_super.prototype);
    WorkspacePlusPlus.prototype.constructor = WorkspacePlusPlus;

    WorkspacePlusPlus.prototype.onload = function () {
        var self = this;

        return this.loadWithBackup().then(function (saved) {
            self.data = Object.assign({}, DEFAULT_DATA, saved || {});
            if (!self.data.sessions) self.data.sessions = {};
            if (!self.data.sessionOrder) self.data.sessionOrder = [];
            self.syncSessionOrder();
            i18n.resolveLocale(self.data.language);
            var L = i18n.L;

            // Ribbon icon (left sidebar)
            self.addRibbonIcon('panels-left-bottom', L.ribbonTooltip, function () {
                new modals.SessionManagerModal(self.app, self).open();
            });

            // Status bar
            self.statusBarEl = self.addStatusBarItem();
            self.statusBarEl.addClass('wpp-status-bar');
            self.statusBarEl.addEventListener('click', function () {
                new modals.SessionManagerModal(self.app, self).open();
            });
            self.updateStatusBar();

            // Commands
            self.addCommand({
                id: 'manage-sessions',
                name: L.cmdManage,
                callback: function () {
                    new modals.SessionManagerModal(self.app, self).open();
                },
            });

            self.addCommand({
                id: 'create-session',
                name: L.cmdCreate,
                callback: function () {
                    var modal = new modals.SessionManagerModal(self.app, self);
                    modal.open();
                    setTimeout(function () {
                        if (modal.nameInput) modal.nameInput.focus();
                    }, 100);
                },
            });

            self.addCommand({
                id: 'rename-session',
                name: L.cmdRename,
                hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'R' }],
                callback: function () { self.renameCurrentSession(); },
            });

            self.addCommand({
                id: 'delete-session',
                name: L.cmdDelete,
                hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'Backspace' }],
                callback: function () { self.deleteCurrentSession(); },
            });



            self.addCommand({
                id: 'new-empty-session',
                name: L.cmdNewEmpty,
                callback: function () { self.createEmptySession(); },
            });

            self.addCommand({
                id: 'duplicate-session',
                name: L.cmdDuplicate,
                hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'M' }],
                callback: function () { self.duplicateCurrentSession(); },
            });

            // Numbered session switching (Mod+Shift+1 through 9)
            for (var n = 1; n <= 9; n++) {
                (function (num) {
                    self.addCommand({
                        id: 'switch-to-' + num,
                        name: L.cmdSwitchTo(num),
                        callback: function () { self.switchToIndex(num - 1); },
                    });
                })(n);
            }

            // Previous / Next session
            self.addCommand({
                id: 'previous-session',
                name: L.cmdPrevious,
                hotkeys: [{ modifiers: ['Mod', 'Shift'], key: ',' }],
                callback: function () { self.switchRelative(-1); },
            });

            self.addCommand({
                id: 'next-session',
                name: L.cmdNext,
                hotkeys: [
                    { modifiers: ['Mod', 'Shift'], key: 'Enter' },
                    { modifiers: ['Mod', 'Shift'], key: '.' },
                ],
                callback: function () { self.switchRelative(1); },
            });

            // Settings tab
            self.addSettingTab(new settings.WorkspacePlusPlusSettingTab(self.app, self));

            // Startup: ensure default session exists, then flush
            self.app.workspace.onLayoutReady(function () {
                self.ensureDefaultSession();
                self.flushOnStartup();
            });
        });
    };

    WorkspacePlusPlus.prototype.onunload = function () {
        this.hideSwitchOverlay();
    };

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

    // --- Hotkey helpers ---

    WorkspacePlusPlus.prototype.formatHotkey = function (hotkey) {
        var isMac = navigator.platform.indexOf('Mac') !== -1;
        var parts = [];
        var mods = hotkey.modifiers || [];
        for (var i = 0; i < mods.length; i++) {
            var m = mods[i];
            if (m === 'Mod') parts.push(isMac ? '\u2318' : 'Ctrl');
            else if (m === 'Alt') parts.push(isMac ? '\u2325' : 'Alt');
            else if (m === 'Shift') parts.push(isMac ? '\u21e7' : 'Shift');
            else if (m === 'Ctrl') parts.push(isMac ? '\u2303' : 'Ctrl');
        }
        var key = hotkey.key;
        if (key === 'ArrowLeft') key = '\u2190';
        else if (key === 'ArrowRight') key = '\u2192';
        else if (key === 'ArrowUp') key = '\u2191';
        else if (key === 'ArrowDown') key = '\u2193';
        else if (key === ',') key = '<';
        else if (key === '.') key = '>';

        if (isMac) return parts.join('') + key;
        parts.push(key);
        return parts.join('+');
    };

    WorkspacePlusPlus.prototype.getCommandHotkey = function (cmdId, index) {
        var idx = index || 0;
        var fullId = this.manifest.id + ':' + cmdId;
        try {
            var mgr = this.app.hotkeyManager;
            if (!mgr) return '';
            var hotkeys = mgr.getHotkeys ? mgr.getHotkeys(fullId) : null;
            if (!hotkeys || hotkeys.length === 0) {
                hotkeys = mgr.getDefaultHotkeys ? mgr.getDefaultHotkeys(fullId) : null;
            }
            if (!hotkeys || hotkeys.length <= idx) return '';
            return this.formatHotkey(hotkeys[idx]);
        } catch (e) {
            return '';
        }
    };

    // --- Switch overlay ---

    WorkspacePlusPlus.prototype.showSwitchOverlay = function (ordered, activeIndex) {
        var L = i18n.L;
        // Remove existing overlay
        if (this.switchOverlayEl) {
            this.switchOverlayEl.remove();
        }
        if (this.switchOverlayTimer) {
            clearTimeout(this.switchOverlayTimer);
        }

        var overlay = document.createElement('div');
        overlay.className = 'wpp-switch-overlay';

        var list = document.createElement('div');
        list.className = 'wpp-switch-list';

        for (var i = 0; i < ordered.length; i++) {
            var item = document.createElement('div');
            item.className = 'wpp-switch-item';
            if (i === activeIndex) {
                item.classList.add('is-active');
            }

            var name = document.createElement('div');
            name.className = 'wpp-switch-name';
            name.textContent = ordered[i].name;
            item.appendChild(name);

            var hk = i <= 8 ? this.getCommandHotkey('switch-to-' + (i + 1)) : '';
            var hotkeyEl = document.createElement('div');
            hotkeyEl.className = 'wpp-switch-hotkey';
            hotkeyEl.textContent = hk || String(i + 1);
            item.appendChild(hotkeyEl);

            list.appendChild(item);
        }

        var countSpan = document.createElement('div');
        countSpan.className = 'wpp-switch-count';
        countSpan.textContent = (activeIndex + 1) + ' / ' + ordered.length;
        overlay.appendChild(countSpan);

        overlay.appendChild(list);

        var footerRow = document.createElement('div');
        footerRow.className = 'wpp-switch-footer';

        var nextKey = this.getCommandHotkey('next-session');
        if (nextKey) {
            var line1 = document.createElement('div');
            line1.textContent = L.cmdNext + '  ' + nextKey;
            footerRow.appendChild(line1);
        }

        var prevKey2 = this.getCommandHotkey('previous-session');
        var nextKey2 = this.getCommandHotkey('next-session', 1);
        if (prevKey2 || nextKey2) {
            var line2 = document.createElement('div');
            var parts = [];
            if (prevKey2) parts.push(L.switchLeft + ' ' + prevKey2);
            if (nextKey2) parts.push(L.switchRight + ' ' + nextKey2);
            line2.textContent = parts.join('  /  ');
            footerRow.appendChild(line2);
        }

        overlay.appendChild(footerRow);

        document.body.appendChild(overlay);
        this.switchOverlayEl = overlay;

        // Dismiss when modifier keys are released
        var self = this;
        var showTime = Date.now();

        this.overlayKeyUpHandler = function (e) {
            var isMac = navigator.platform.indexOf('Mac') !== -1;
            var modHeld = isMac ? e.metaKey : e.ctrlKey;
            var modShiftHeld = modHeld && e.shiftKey;
            if (!modShiftHeld) {
                // Ensure minimum 300ms visibility
                var elapsed = Date.now() - showTime;
                var minDelay = Math.max(0, 300 - elapsed);
                self.cleanupOverlayListeners();
                if (minDelay > 0) {
                    self.switchOverlayTimer = setTimeout(function () {
                        self.hideSwitchOverlay();
                    }, minDelay);
                } else {
                    self.hideSwitchOverlay();
                }
            }
        };

        this.overlayBlurHandler = function () {
            self.hideSwitchOverlay();
        };

        document.addEventListener('keyup', this.overlayKeyUpHandler);
        window.addEventListener('blur', this.overlayBlurHandler);

        // Safety fallback – only dismiss if modifier keys are no longer held
        function safetyCheck() {
            self.switchOverlayTimer = setTimeout(function () {
                if (!self.switchOverlayEl) return;
                self.hideSwitchOverlay();
            }, 5000);
        }
        this.overlayKeyDownHandler = function () {
            // Any keydown means user is still active – reset the safety timer
            if (self.switchOverlayTimer) {
                clearTimeout(self.switchOverlayTimer);
            }
            safetyCheck();
        };
        document.addEventListener('keydown', this.overlayKeyDownHandler);
        safetyCheck();
    };

    WorkspacePlusPlus.prototype.cleanupOverlayListeners = function () {
        if (this.overlayKeyUpHandler) {
            document.removeEventListener('keyup', this.overlayKeyUpHandler);
            this.overlayKeyUpHandler = null;
        }
        if (this.overlayKeyDownHandler) {
            document.removeEventListener('keydown', this.overlayKeyDownHandler);
            this.overlayKeyDownHandler = null;
        }
        if (this.overlayBlurHandler) {
            window.removeEventListener('blur', this.overlayBlurHandler);
            this.overlayBlurHandler = null;
        }
        if (this.switchOverlayTimer) {
            clearTimeout(this.switchOverlayTimer);
            this.switchOverlayTimer = null;
        }
    };

    WorkspacePlusPlus.prototype.hideSwitchOverlay = function () {
        if (this.switchOverlayEl) {
            this.switchOverlayEl.remove();
            this.switchOverlayEl = null;
        }
        this.cleanupOverlayListeners();
    };

    // --- Data persistence ---

    WorkspacePlusPlus.prototype.getBackupPath = function () {
        return this.manifest.dir + '/data.backup.json';
    };

    WorkspacePlusPlus.prototype.persistData = function () {
        var self = this;
        // Write backup before saving main data
        var json = JSON.stringify(this.data);
        return this.app.vault.adapter.write(this.getBackupPath(), json)
            .then(function () {
                return self.saveData(self.data);
            });
    };

    WorkspacePlusPlus.prototype.loadWithBackup = function () {
        var self = this;
        return this.loadData().then(function (saved) {
            var L = i18n.L;
            if (saved && saved.sessions && Object.keys(saved.sessions).length > 0) {
                return saved;
            }
            // Main data is empty or corrupt — try backup
            return self.app.vault.adapter.exists(self.getBackupPath())
                .then(function (exists) {
                    if (!exists) return saved;
                    return self.app.vault.adapter.read(self.getBackupPath())
                        .then(function (raw) {
                            try {
                                var backup = JSON.parse(raw);
                                if (backup && backup.sessions && Object.keys(backup.sessions).length > 0) {
                                    new obsidian.Notice(L.backupRestored);
                                    return backup;
                                }
                            } catch (e) { /* corrupt backup, ignore */ }
                            return saved;
                        });
                });
        });
    };

    WorkspacePlusPlus.prototype.getActiveSession = function () {
        if (!this.data.activeSessionId) return null;
        return this.data.sessions[this.data.activeSessionId] || null;
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
        var layout = this.app.workspace.getLayout();

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

    WorkspacePlusPlus.prototype.switchSession = function (targetId, options) {
        var L = i18n.L;
        var self = this;
        options = options || {};
        var target = this.data.sessions[targetId];
        if (!target) return Promise.resolve();

        // 1. Save current session state
        var current = this.getActiveSession();
        if (current) {
            current.layout = this.app.workspace.getLayout();
            current.modified = Date.now();
        }

        // 2. Update active
        this.data.activeSessionId = targetId;

        // 3. Apply target layout
        var applyLayout = target.layout
            ? this.app.workspace.changeLayout(target.layout)
            : Promise.resolve();

        return applyLayout.then(function () {
            self.updateStatusBar();
            return self.persistData();
        }).then(function () {
            if (!options.silent) {
                new obsidian.Notice(L.loaded(target.name));
            }
        });
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
        while (existing['Session ' + n]) { n++; }
        return 'Session ' + n;
    };

    WorkspacePlusPlus.prototype.createEmptySession = function () {
        var L = i18n.L;
        var self = this;
        var name = this.getNextSessionName();

        // Save current session state
        var current = this.getActiveSession();
        if (current) {
            current.layout = this.app.workspace.getLayout();
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
        this.data.sessions[id].layout = this.app.workspace.getLayout();

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
        if (current) {
            current.layout = this.app.workspace.getLayout();
            current.modified = Date.now();
        }

        var id = utils.generateId();
        this.data.sessions[id] = {
            id: id,
            name: name,
            modified: Date.now(),
            layout: this.app.workspace.getLayout(),
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
            name: 'default',
            modified: Date.now(),
            layout: this.app.workspace.getLayout(),
            isDefault: true,
        };
        this.data.sessionOrder.unshift(id);
        this.data.activeSessionId = id;
        this.updateStatusBar();
        this.persistData();
    };

    WorkspacePlusPlus.prototype.flushOnStartup = function () {
        var session = this.getActiveSession();
        if (!session) return;

        session.layout = this.app.workspace.getLayout();
        session.modified = Date.now();
        return this.persistData();
    };

    return WorkspacePlusPlus;
})(obsidian.Plugin);

module.exports = WorkspacePlusPlus;
