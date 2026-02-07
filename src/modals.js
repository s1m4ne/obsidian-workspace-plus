'use strict';

var obsidian = require('obsidian');
var i18n = require('./i18n');

function formatRelativeTime(timestamp) {
    var L = i18n.L;
    var diff = Date.now() - timestamp;
    var minutes = Math.floor(diff / 60000);
    var hours = Math.floor(diff / 3600000);
    var days = Math.floor(diff / 86400000);

    if (minutes < 1) return L.modifiedJustNow;
    if (minutes < 60) return L.modifiedMinutes(minutes);
    if (hours < 24) return L.modifiedHours(hours);
    return L.modifiedDays(days);
}

// ============================================================
// Session Manager Modal
// ============================================================
var SessionManagerModal = /** @class */ (function (_super) {
    // Inherit from Modal
    function SessionManagerModal(app, plugin) {
        var _this = _super.call(this, app) || this;
        _this.plugin = plugin;
        return _this;
    }

    // Prototype chain
    SessionManagerModal.prototype = Object.create(_super.prototype);
    SessionManagerModal.prototype.constructor = SessionManagerModal;

    SessionManagerModal.prototype.onOpen = function () {
        var L = i18n.L;
        var contentEl = this.contentEl;
        contentEl.empty();
        contentEl.addClass('wpp-modal');

        this.titleEl.setText(L.modalTitle);

        // Save section
        var saveContainer = contentEl.createDiv({ cls: 'wpp-save-container' });
        this.nameInput = saveContainer.createEl('input', {
            type: 'text',
            placeholder: L.savePlaceholder,
            cls: 'wpp-save-input',
        });
        var saveBtn = saveContainer.createEl('button', {
            text: L.save,
            cls: 'wpp-save-btn',
        });

        var self = this;
        saveBtn.addEventListener('click', function () { self.onSave(); });
        this.nameInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.isComposing) self.onSave();
        });

        // Focus & selection state
        this.focusedIndex = -1;
        this.focusedButtonIndex = -1;
        this.selectedIds = new Set();

        // Bulk actions bar
        this.bulkActionsEl = contentEl.createDiv({ cls: 'wpp-bulk-actions' });
        this.bulkActionsEl.style.display = 'none';
        this.bulkDeleteBtn = this.bulkActionsEl.createEl('button', { cls: 'mod-warning' });
        this.bulkDeleteBtn.addEventListener('click', function () { self.onBulkDelete(); });
        var deselectBtn = this.bulkActionsEl.createEl('button', { text: L.deselect, cls: 'wpp-deselect-btn' });
        deselectBtn.addEventListener('click', function () {
            self.selectedIds.clear();
            self.updateSelectionUI();
        });

        // Session list
        this.listEl = contentEl.createDiv({ cls: 'wpp-session-list' });
        this.renderList();

        // Set initial focus to active session
        var ordered = this.plugin.getOrderedSessions();
        for (var fi = 0; fi < ordered.length; fi++) {
            if (ordered[fi].id === this.plugin.data.activeSessionId) {
                this.focusedIndex = fi;
                break;
            }
        }
        this.updateFocusUI();

        // Hotkey footer
        var nextKey = this.plugin.getCommandHotkey('next-session');
        var footer = contentEl.createDiv({ cls: 'wpp-modal-footer' });
        if (nextKey) {
            footer.createDiv({ text: L.cmdNext + '  ' + nextKey });
        }
        footer.createDiv({ text: L.footerDragReorder });
        var hotkeyLink = footer.createEl('a', { text: L.footerHotkeyHint });
        hotkeyLink.addEventListener('click', function (e) {
            e.preventDefault();
            self.close();
            self.app.setting.open();
            self.app.setting.openTabById('hotkeys');
            var sc = self.app.setting.activeTab.searchComponent;
            sc.setValue('Workspace++');
            sc.inputEl.dispatchEvent(new Event('input'));
        });

        // Keyboard handler
        this.modalKeyHandler = function (e) {
            // Skip if a confirm/rename modal or switch overlay is on top
            if (document.querySelector('.wpp-confirm-buttons')) return;
            if (document.querySelector('.wpp-switch-overlay')) return;

            var isMac = navigator.platform.indexOf('Mac') !== -1;
            var modKey = isMac ? e.metaKey : e.ctrlKey;

            // Mod+Shift+Enter (cycle next session)
            if (modKey && e.shiftKey && e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                var ordered = self.plugin.getOrderedSessions();
                if (ordered.length <= 1) return;
                var currentIndex = -1;
                for (var i = 0; i < ordered.length; i++) {
                    if (ordered[i].id === self.plugin.data.activeSessionId) {
                        currentIndex = i;
                        break;
                    }
                }
                if (currentIndex === -1) return;
                var next = (currentIndex + 1 + ordered.length) % ordered.length;
                self.plugin.switchSession(ordered[next].id, { silent: true }).then(function () {
                    self.renderList();
                });
                return;
            }

            // Arrow keys — navigate focus (up/down only)
            // Works even when input is focused
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
                var dir = e.key === 'ArrowUp' ? -1 : 1;
                self.moveFocus(dir);
                return;
            }

            // Skip remaining keys if input is focused
            if (document.activeElement === self.nameInput) return;

            // ArrowLeft / ArrowRight — navigate action buttons in focused row
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                if (self.focusedIndex < 0) return;
                e.preventDefault();
                var buttons = self.getActionButtons();
                if (buttons.length === 0) return;
                if (e.key === 'ArrowRight') {
                    if (self.focusedButtonIndex < buttons.length - 1) {
                        self.focusedButtonIndex++;
                    }
                } else {
                    if (self.focusedButtonIndex > 0) {
                        self.focusedButtonIndex--;
                    } else {
                        self.focusedButtonIndex = -1;
                    }
                }
                self.updateButtonFocusUI();
                return;
            }

            // Enter — activate focused button, or switch to focused session
            if (e.key === 'Enter') {
                e.preventDefault();
                if (self.focusedButtonIndex >= 0) {
                    var buttons = self.getActionButtons();
                    if (buttons[self.focusedButtonIndex]) {
                        buttons[self.focusedButtonIndex].click();
                    }
                    return;
                }
                self.onFocusedLoad();
                return;
            }

            // Delete / Backspace — delete focused or selected
            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                self.onKeyDelete();
                return;
            }
        };
        document.addEventListener('keydown', this.modalKeyHandler, true);
    };

    SessionManagerModal.prototype.renderList = function () {
        this.listEl.empty();
        var sessions = this.plugin.getOrderedSessions();
        for (var i = 0; i < sessions.length; i++) {
            this.renderSessionItem(sessions[i], i);
        }
        this.setupDragAndDrop();

        // Clamp focus index
        if (this.focusedIndex >= sessions.length) {
            this.focusedIndex = sessions.length - 1;
        }
        // Clean up stale selections
        var validIds = {};
        sessions.forEach(function (s) { validIds[s.id] = true; });
        var self = this;
        this.selectedIds.forEach(function (id) {
            if (!validIds[id]) self.selectedIds.delete(id);
        });
        this.updateFocusUI();
        this.updateSelectionUI();
    };

    SessionManagerModal.prototype.renderSessionItem = function (session, index) {
        var L = i18n.L;
        var isActive = session.id === this.plugin.data.activeSessionId;
        var self = this;

        var item = this.listEl.createDiv({ cls: 'wpp-session-item' });
        item.dataset.sessionId = session.id;

        // Click handler for focus / Cmd+Click selection
        item.addEventListener('click', function (e) {
            // Always move focus to clicked item
            self.focusedIndex = index;
            self.focusedButtonIndex = -1;
            self.updateButtonFocusUI();
            self.updateFocusUI();

            if (e.target.closest('button, .wpp-icon-btn')) return;
            var isMac = navigator.platform.indexOf('Mac') !== -1;
            var cmdKey = isMac ? e.metaKey : e.ctrlKey;
            if (cmdKey) {
                // Cmd+Click: toggle selection
                if (self.selectedIds.has(session.id)) {
                    self.selectedIds.delete(session.id);
                } else {
                    self.selectedIds.add(session.id);
                }
                self.updateSelectionUI();
            } else if (!cmdKey) {
                // Normal click: move focus only
                self.selectedIds.clear();
                self.updateSelectionUI();
            }
        });

        // Hotkey hint
        var hk = index <= 8 ? self.plugin.getCommandHotkey('switch-to-' + (index + 1)) : '';
        item.createSpan({ text: hk || String(index + 1), cls: 'wpp-session-index' });

        // Info section
        var info = item.createDiv({ cls: 'wpp-session-info' });
        var nameRow = info.createDiv({ cls: 'wpp-session-name-row' });
        nameRow.createSpan({ text: session.name, cls: 'wpp-session-name' });
        if (session.isDefault && session.name !== 'default') {
            nameRow.createSpan({ text: L.defaultLabel, cls: 'wpp-default-label' });
        }
        if (isActive) {
            nameRow.createSpan({ text: L.active, cls: 'wpp-active-badge' });
        }
        info.createDiv({ text: formatRelativeTime(session.modified), cls: 'wpp-session-modified' });

        // Action buttons
        var actions = item.createDiv({ cls: 'wpp-session-actions' });

        var loadBtn = actions.createEl('button', { text: L.load, cls: 'wpp-load-btn' });
        loadBtn.addEventListener('click', function () { self.onLoad(session.id); });

        // Rename button
        var renameBtn = actions.createDiv({ cls: 'wpp-icon-btn', attr: { 'aria-label': L.rename } });
        obsidian.setIcon(renameBtn, 'pencil');
        renameBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            self.onRename(session);
        });

        // Delete button (hidden for last remaining session)
        if (Object.keys(self.plugin.data.sessions).length > 1) {
            var deleteBtn = actions.createDiv({ cls: 'wpp-icon-btn', attr: { 'aria-label': L.delete } });
            obsidian.setIcon(deleteBtn, 'x');
            deleteBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                self.onDelete(session);
            });
        }
    };

    SessionManagerModal.prototype.setupDragAndDrop = function () {
        var self = this;

        this.listEl.querySelectorAll('.wpp-session-item').forEach(function (item) {
            item.addEventListener('mousedown', function (e) {
                if (e.button !== 0) return;
                if (e.target.closest('button, input, .wpp-icon-btn')) return;
                var isMac = navigator.platform.indexOf('Mac') !== -1;
                if (isMac ? e.metaKey : e.ctrlKey) return;

                var startX = e.clientX;
                var startY = e.clientY;
                var dragStarted = false;
                var draggedEl = item;
                var cloneEl = null;

                function startDrag(ev) {
                    dragStarted = true;
                    var rect = item.getBoundingClientRect();
                    var offsetX = startX - rect.left;
                    var offsetY = startY - rect.top;

                    cloneEl = item.cloneNode(true);
                    cloneEl.classList.add('wpp-drag-clone');
                    cloneEl.style.position = 'fixed';
                    cloneEl.style.width = rect.width + 'px';
                    cloneEl.style.top = (ev.clientY - offsetY) + 'px';
                    cloneEl.style.left = (ev.clientX - offsetX) + 'px';
                    cloneEl.style.zIndex = '10000';
                    cloneEl.style.pointerEvents = 'none';
                    document.body.appendChild(cloneEl);

                    item.classList.add('is-dragging');

                    // Store offset for move handler
                    cloneEl._offsetX = offsetX;
                    cloneEl._offsetY = offsetY;
                }

                function onMouseMove(ev) {
                    if (!dragStarted) {
                        var dx = ev.clientX - startX;
                        var dy = ev.clientY - startY;
                        if (Math.abs(dx) + Math.abs(dy) < 5) return;
                        startDrag(ev);
                    }

                    cloneEl.style.top = (ev.clientY - cloneEl._offsetY) + 'px';
                    cloneEl.style.left = (ev.clientX - cloneEl._offsetX) + 'px';

                    var siblings = self.listEl.querySelectorAll('.wpp-session-item');
                    var placed = false;
                    for (var i = 0; i < siblings.length; i++) {
                        var el = siblings[i];
                        if (el === draggedEl) continue;
                        var r = el.getBoundingClientRect();
                        if (ev.clientY < r.top + r.height / 2) {
                            self.listEl.insertBefore(draggedEl, el);
                            placed = true;
                            break;
                        }
                    }
                    if (!placed) {
                        self.listEl.appendChild(draggedEl);
                    }
                }

                function onMouseUp() {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);

                    if (!dragStarted) return;

                    cloneEl.remove();
                    draggedEl.classList.remove('is-dragging');

                    // Read order from DOM
                    var newOrder = [];
                    var items = self.listEl.querySelectorAll('.wpp-session-item');
                    items.forEach(function (el) {
                        newOrder.push(el.dataset.sessionId);
                    });
                    self.plugin.data.sessionOrder = newOrder;

                    // Update index labels in-place
                    items.forEach(function (el, i) {
                        var indexEl = el.querySelector('.wpp-session-index');
                        if (indexEl) {
                            var hk = i <= 8 ? self.plugin.getCommandHotkey('switch-to-' + (i + 1)) : '';
                            indexEl.textContent = hk || String(i + 1);
                        }
                    });

                    // Highlight moved item
                    draggedEl.classList.add('wpp-just-moved');
                    var movedRef = draggedEl;
                    setTimeout(function () {
                        movedRef.classList.remove('wpp-just-moved');
                    }, 600);

                    self.plugin.persistData();
                }

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        });
    };

    SessionManagerModal.prototype.onSave = function () {
        var L = i18n.L;
        var self = this;
        var name = this.nameInput.value.trim();
        if (!name) {
            new obsidian.Notice(L.emptyName);
            return;
        }
        // Check duplicate
        var exists = Object.values(this.plugin.data.sessions)
            .some(function (s) { return s.name === name; });
        if (exists) {
            new obsidian.Notice(L.duplicateName);
            return;
        }
        this.plugin.createSession(name).then(function () {
            self.nameInput.value = '';
            self.renderList();
            new obsidian.Notice(L.created(name));
        });
    };

    SessionManagerModal.prototype.onLoad = function (sessionId) {
        if (sessionId === this.plugin.data.activeSessionId) return;
        var self = this;
        this.plugin.switchSession(sessionId).then(function () {
            self.close();
        });
    };

    SessionManagerModal.prototype.onRename = function (session) {
        var L = i18n.L;
        var self = this;
        new RenameModal(this.app, session.name, function (newName) {
            var exists = Object.values(self.plugin.data.sessions)
                .some(function (s) { return s.name === newName && s.id !== session.id; });
            if (exists) {
                new obsidian.Notice(L.duplicateName);
                return;
            }
            var oldName = session.name;
            session.name = newName;
            session.modified = Date.now();
            self.plugin.updateStatusBar();
            self.plugin.persistData().then(function () {
                self.renderList();
                new obsidian.Notice(L.renamed(oldName, newName));
            });
        }).open();
    };

    SessionManagerModal.prototype.onDelete = function (session) {
        var L = i18n.L;
        var self = this;
        var isActive = session.id === this.plugin.data.activeSessionId;
        var message = isActive
            ? L.confirmDeleteActive(session.name)
            : L.confirmDelete(session.name);

        new ConfirmModal(this.app, message, function () {
            return self.plugin.deleteSession(session.id).then(function (deleted) {
                if (!deleted) return;
                self.renderList();
                new obsidian.Notice(L.deleted(session.name));
            });
        }).open();
    };

    // --- Focus & selection helpers ---

    SessionManagerModal.prototype.moveFocus = function (dir) {
        if (document.activeElement === this.nameInput) {
            this.nameInput.blur();
        }
        var sessions = this.plugin.getOrderedSessions();
        if (sessions.length === 0) return;
        if (this.focusedIndex === -1) {
            this.focusedIndex = dir > 0 ? 0 : sessions.length - 1;
        } else {
            this.focusedIndex = (this.focusedIndex + dir + sessions.length) % sessions.length;
        }
        this.focusedButtonIndex = -1;
        this.updateButtonFocusUI();
        this.updateFocusUI();
    };

    SessionManagerModal.prototype.updateFocusUI = function () {
        var self = this;
        var items = this.listEl.querySelectorAll('.wpp-session-item');
        items.forEach(function (el, i) {
            el.classList.toggle('wpp-focused', i === self.focusedIndex);
        });
        if (this.focusedIndex >= 0 && items[this.focusedIndex]) {
            items[this.focusedIndex].scrollIntoView({ block: 'nearest' });
        }
    };

    SessionManagerModal.prototype.getActionButtons = function () {
        var items = this.listEl.querySelectorAll('.wpp-session-item');
        if (this.focusedIndex < 0 || !items[this.focusedIndex]) return [];
        var actions = items[this.focusedIndex].querySelector('.wpp-session-actions');
        if (!actions) return [];
        return actions.querySelectorAll('button, .wpp-icon-btn');
    };

    SessionManagerModal.prototype.updateButtonFocusUI = function () {
        this.listEl.querySelectorAll('.wpp-session-actions .wpp-btn-focused').forEach(function (el) {
            el.classList.remove('wpp-btn-focused');
        });
        var buttons = this.getActionButtons();
        if (this.focusedButtonIndex >= 0 && this.focusedButtonIndex < buttons.length) {
            buttons[this.focusedButtonIndex].classList.add('wpp-btn-focused');
        }
    };

    SessionManagerModal.prototype.updateSelectionUI = function () {
        var self = this;
        var items = this.listEl.querySelectorAll('.wpp-session-item');
        items.forEach(function (el) {
            el.classList.toggle('wpp-selected', self.selectedIds.has(el.dataset.sessionId));
        });
        this.updateBulkActions();
    };

    SessionManagerModal.prototype.updateBulkActions = function () {
        var L = i18n.L;
        if (this.selectedIds.size > 0) {
            this.bulkActionsEl.style.display = '';
            this.bulkDeleteBtn.textContent = L.bulkDelete(this.selectedIds.size);
        } else {
            this.bulkActionsEl.style.display = 'none';
        }
    };

    SessionManagerModal.prototype.onFocusedLoad = function () {
        var sessions = this.plugin.getOrderedSessions();
        if (this.focusedIndex < 0 || this.focusedIndex >= sessions.length) return;
        this.onLoad(sessions[this.focusedIndex].id);
    };

    SessionManagerModal.prototype.onKeyDelete = function () {
        var L = i18n.L;
        if (this.selectedIds.size > 0) {
            this.onBulkDelete();
        } else {
            var sessions = this.plugin.getOrderedSessions();
            if (this.focusedIndex < 0 || this.focusedIndex >= sessions.length) return;
            var session = sessions[this.focusedIndex];
            if (Object.keys(this.plugin.data.sessions).length <= 1) {
                new obsidian.Notice(L.cannotDeleteLast);
                return;
            }
            this.onDelete(session);
        }
    };

    SessionManagerModal.prototype.onBulkDelete = function () {
        var L = i18n.L;
        var self = this;
        var ids = [];
        this.selectedIds.forEach(function (id) { ids.push(id); });
        var count = ids.length;

        new ConfirmModal(this.app, L.confirmBulkDelete(count), function () {
            var promises = ids.map(function (id) {
                return self.plugin.deleteSession(id);
            });
            return Promise.all(promises).then(function (results) {
                var deletedCount = results.filter(function (d) { return d; }).length;
                self.selectedIds.clear();
                self.renderList();
                if (deletedCount > 0) {
                    new obsidian.Notice(L.bulkDeleted(deletedCount));
                }
            });
        }).open();
    };

    SessionManagerModal.prototype.onClose = function () {
        if (this.modalKeyHandler) {
            document.removeEventListener('keydown', this.modalKeyHandler, true);
            this.modalKeyHandler = null;
        }
        this.contentEl.empty();
    };

    return SessionManagerModal;
})(obsidian.Modal);

// ============================================================
// Confirm Modal
// ============================================================
var ConfirmModal = /** @class */ (function (_super) {
    function ConfirmModal(app, message, onConfirm, options) {
        var _this = _super.call(this, app) || this;
        _this.message = message;
        _this.onConfirm = onConfirm;
        _this.options = options || {};
        return _this;
    }

    ConfirmModal.prototype = Object.create(_super.prototype);
    ConfirmModal.prototype.constructor = ConfirmModal;

    ConfirmModal.prototype.onOpen = function () {
        var L = i18n.L;
        // Ensure confirm modal appears above the switch overlay (z-index 9999)
        this.containerEl.style.zIndex = '10001';
        var contentEl = this.contentEl;
        contentEl.createEl('p', { text: this.message });
        var btns = contentEl.createDiv({ cls: 'wpp-confirm-buttons' });
        var self = this;

        var cancelBtn = btns.createEl('button', { text: L.cancel });
        cancelBtn.addEventListener('click', function () { self.close(); });

        var confirmText = this.options.confirmText || L.delete;
        var confirmClass = this.options.confirmClass || 'mod-warning';
        var confirmBtn = btns.createEl('button', { text: confirmText, cls: confirmClass });
        confirmBtn.addEventListener('click', function () {
            self.onConfirm();
            self.close();
        });

        if (this.options.hint) {
            var hintEl = contentEl.createDiv({ cls: 'wpp-confirm-hint' });
            var hintLink = hintEl.createEl('a', { text: this.options.hint });
            hintLink.addEventListener('click', function (e) {
                e.preventDefault();
                self.close();
                if (self.options.onHintClick) self.options.onHintClick();
            });
        }

        this.buttons = [cancelBtn, confirmBtn];
        this.focusedButtonIndex = 1; // Default focus on Delete
        this.updateButtonFocus();

        // Keyboard handler
        this.confirmKeyHandler = function (e) {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                self.focusedButtonIndex = 0;
                self.updateButtonFocus();
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                self.focusedButtonIndex = 1;
                self.updateButtonFocus();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (self.focusedButtonIndex === 0) {
                    self.close();
                } else {
                    self.onConfirm();
                    self.close();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopImmediatePropagation();
                self.close();
            }
        };
        document.addEventListener('keydown', this.confirmKeyHandler, true);
    };

    ConfirmModal.prototype.updateButtonFocus = function () {
        var self = this;
        this.buttons.forEach(function (btn, i) {
            btn.classList.toggle('wpp-btn-focused', i === self.focusedButtonIndex);
        });
    };

    ConfirmModal.prototype.onClose = function () {
        if (this.confirmKeyHandler) {
            document.removeEventListener('keydown', this.confirmKeyHandler, true);
            this.confirmKeyHandler = null;
        }
        this.contentEl.empty();
    };

    return ConfirmModal;
})(obsidian.Modal);

// ============================================================
// Rename Modal
// ============================================================
var RenameModal = /** @class */ (function (_super) {
    function RenameModal(app, currentName, onRename) {
        var _this = _super.call(this, app) || this;
        _this.currentName = currentName;
        _this.onRename = onRename;
        return _this;
    }

    RenameModal.prototype = Object.create(_super.prototype);
    RenameModal.prototype.constructor = RenameModal;

    RenameModal.prototype.onOpen = function () {
        var L = i18n.L;
        var contentEl = this.contentEl;
        var self = this;
        this.titleEl.setText(L.renameTitle);

        var input = contentEl.createEl('input', {
            type: 'text',
            value: this.currentName,
            placeholder: L.renamePlaceholder,
            cls: 'wpp-rename-input',
        });
        input.select();

        var btns = contentEl.createDiv({ cls: 'wpp-confirm-buttons' });
        var cancelBtn = btns.createEl('button', { text: L.cancel });
        cancelBtn.addEventListener('click', function () { self.close(); });
        var renameBtn = btns.createEl('button', { text: L.rename, cls: 'mod-cta' });

        var doRename = function () {
            var newName = input.value.trim();
            if (newName && newName !== self.currentName) {
                self.onRename(newName);
                self.close();
            }
        };

        renameBtn.addEventListener('click', doRename);

        this.buttons = [cancelBtn, renameBtn];
        this.focusedButtonIndex = -1; // -1 = input focused

        this.renameKeyHandler = function (e) {
            // Skip during IME composition (e.g. Japanese input conversion)
            if (e.isComposing) return;

            if (self.focusedButtonIndex === -1) {
                // Input focused
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    self.focusedButtonIndex = 1;
                    self.updateRenameBtnFocus();
                    input.blur();
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    doRename();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    self.close();
                }
            } else {
                // Button focused
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    self.focusedButtonIndex = -1;
                    self.updateRenameBtnFocus();
                    input.focus();
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    if (self.focusedButtonIndex > 0) {
                        self.focusedButtonIndex--;
                    } else {
                        self.focusedButtonIndex = -1;
                        self.updateRenameBtnFocus();
                        input.focus();
                        return;
                    }
                    self.updateRenameBtnFocus();
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    if (self.focusedButtonIndex < 1) {
                        self.focusedButtonIndex = 1;
                        self.updateRenameBtnFocus();
                    }
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    if (self.focusedButtonIndex === 0) {
                        self.close();
                    } else {
                        doRename();
                    }
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    self.close();
                }
            }
        };
        document.addEventListener('keydown', this.renameKeyHandler, true);

        setTimeout(function () { input.focus(); }, 50);
    };

    RenameModal.prototype.updateRenameBtnFocus = function () {
        var self = this;
        this.buttons.forEach(function (btn, i) {
            btn.classList.toggle('wpp-btn-focused', i === self.focusedButtonIndex);
        });
    };

    RenameModal.prototype.onClose = function () {
        if (this.renameKeyHandler) {
            document.removeEventListener('keydown', this.renameKeyHandler, true);
            this.renameKeyHandler = null;
        }
        this.contentEl.empty();
    };

    return RenameModal;
})(obsidian.Modal);

exports.SessionManagerModal = SessionManagerModal;
exports.ConfirmModal = ConfirmModal;
exports.RenameModal = RenameModal;
