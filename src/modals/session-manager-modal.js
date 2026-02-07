'use strict';

var obsidian = require('obsidian');
var i18n = require('../i18n');
var ConfirmModal = require('./confirm-modal');
var RenameModal = require('./rename-modal');
var formatRelativeTime = require('./format-relative-time');

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

        // Filter section
        var filterContainer = contentEl.createDiv({ cls: 'wpp-filter-container' });
        this.filterInput = filterContainer.createEl('input', {
            type: 'text',
            placeholder: L.filterPlaceholder,
            cls: 'wpp-filter-input',
        });

        var self = this;
        saveBtn.addEventListener('click', function () { self.onSave(); });
        this.nameInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.isComposing) self.onSave();
        });
        this.nameInput.addEventListener('focus', function () {
            self.focusedIndex = -2;
            self.focusedButtonIndex = -1;
            self.updateButtonFocusUI();
            self.updateFocusUI();
        });
        this.filterQuery = '';
        this.filterInput.addEventListener('focus', function () {
            self.focusedIndex = -1;
            self.focusedButtonIndex = -1;
            self.updateButtonFocusUI();
            self.updateFocusUI();
        });
        this.filterInput.addEventListener('input', function () {
            self.filterQuery = self.filterInput.value || '';
            var sessions = self.getNavigationSessions();
            var activeIdx = -1;
            for (var i = 0; i < sessions.length; i++) {
                if (sessions[i].id === self.plugin.data.activeSessionId) {
                    activeIdx = i;
                    break;
                }
            }
            if (document.activeElement === self.filterInput) {
                self.focusedIndex = -1;
            } else {
                self.focusedIndex = activeIdx !== -1 ? activeIdx : (sessions.length > 0 ? 0 : -1);
            }
            self.focusedButtonIndex = -1;
            self.renderList();
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
        var ordered = this.getNavigationSessions();
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

            // Mod+F / Mod+Shift+F — focus filter input
            if (modKey && (e.key === 'f' || e.key === 'F')) {
                e.preventDefault();
                self.filterInput.focus();
                self.filterInput.select();
                return;
            }

            // Mod+Shift+Enter (cycle next session)
            if (modKey && e.shiftKey && e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                var ordered = self.getNavigationSessions();
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

            if (e.key === '/' && document.activeElement !== self.filterInput) {
                e.preventDefault();
                self.filterInput.focus();
                self.filterInput.select();
                return;
            }

            // Enter on filter input — switch immediately when exactly one match remains
            if (document.activeElement === self.filterInput && e.key === 'Enter' && !e.isComposing) {
                var filtered = self.getNavigationSessions();
                if (filtered.length === 1) {
                    e.preventDefault();
                    self.onLoad(filtered[0].id);
                }
                return;
            }

            // Skip remaining keys if input is focused
            if (document.activeElement === self.nameInput || document.activeElement === self.filterInput) return;

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

    SessionManagerModal.prototype.getVisibleSessions = function () {
        var sessions = this.plugin.getOrderedSessions();
        var query = (this.filterQuery || '').trim().toLowerCase();
        if (!query) return sessions;
        return sessions.filter(function (s) {
            return (s.name || '').toLowerCase().indexOf(query) !== -1;
        });
    };

    SessionManagerModal.prototype.getNavigationSessions = function () {
        return this.getVisibleSessions();
    };

    SessionManagerModal.prototype.renderList = function () {
        var L = i18n.L;
        this.listEl.empty();
        var sessions = this.getVisibleSessions();
        var ordered = this.plugin.getOrderedSessions();
        var orderIndex = {};
        for (var oi = 0; oi < ordered.length; oi++) {
            orderIndex[ordered[oi].id] = oi;
        }
        for (var i = 0; i < sessions.length; i++) {
            this.renderSessionItem(sessions[i], i, orderIndex[sessions[i].id]);
        }
        if (sessions.length === 0) {
            this.listEl.createDiv({ text: L.noFilteredSessions, cls: 'wpp-empty-state' });
        } else {
            this.setupDragAndDrop();
        }

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

    SessionManagerModal.prototype.renderSessionItem = function (session, index, orderIndex) {
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
        var hintIndex = typeof orderIndex === 'number' ? orderIndex : index;
        var hk = hintIndex <= 8 ? self.plugin.getCommandHotkey('switch-to-' + (hintIndex + 1)) : '';
        item.createSpan({ text: hk || String(hintIndex + 1), cls: 'wpp-session-index' });

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
        if ((this.filterQuery || '').trim()) return;

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
        var sessions = this.getNavigationSessions();
        var targets = [{ type: 'name' }, { type: 'filter' }];
        for (var i = 0; i < sessions.length; i++) {
            targets.push({ type: 'session', index: i });
        }
        if (targets.length === 0) return;

        var currentPos = 0;
        if (document.activeElement === this.nameInput || this.focusedIndex === -2) {
            currentPos = 0;
        } else if (document.activeElement === this.filterInput || this.focusedIndex === -1) {
            currentPos = 1;
        } else if (this.focusedIndex >= 0) {
            currentPos = Math.min(2 + this.focusedIndex, targets.length - 1);
        } else {
            currentPos = dir > 0 ? 0 : targets.length - 1;
        }

        var nextPos = (currentPos + dir + targets.length) % targets.length;
        var target = targets[nextPos];

        if (target.type === 'name') {
            this.focusedIndex = -2;
            this.updateFocusUI();
            this.nameInput.focus();
            var nameLen = this.nameInput.value.length;
            this.nameInput.setSelectionRange(nameLen, nameLen);
        } else if (target.type === 'filter') {
            this.focusedIndex = -1;
            this.updateFocusUI();
            this.filterInput.focus();
            var filterLen = this.filterInput.value.length;
            this.filterInput.setSelectionRange(filterLen, filterLen);
        } else {
            if (document.activeElement === this.nameInput) this.nameInput.blur();
            if (document.activeElement === this.filterInput) this.filterInput.blur();
            this.focusedIndex = target.index;
            this.updateFocusUI();
        }

        this.focusedButtonIndex = -1;
        this.updateButtonFocusUI();
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
        var sessions = this.getNavigationSessions();
        if (this.focusedIndex < 0 || this.focusedIndex >= sessions.length) return;
        this.onLoad(sessions[this.focusedIndex].id);
    };

    SessionManagerModal.prototype.onKeyDelete = function () {
        var L = i18n.L;
        if (this.selectedIds.size > 0) {
            this.onBulkDelete();
        } else {
            var sessions = this.getNavigationSessions();
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

module.exports = SessionManagerModal;
