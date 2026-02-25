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
        this.modalGroupId = this.plugin.data.activeGroupId || null;
        saveBtn.addEventListener('click', function () { self.onSave(); });
        this.nameInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.isComposing) self.onSave();
        });
        this.nameInput.addEventListener('focus', function () {
            self.focusedIndex = -2;
            self.updateFocusUI();
        });
        this.filterQuery = '';
        this.filterInput.addEventListener('focus', function () {
            self.focusedIndex = -1;
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
            self.renderList();
        });

        // Group tabs
        this.groupTabsRow = contentEl.createDiv({ cls: 'wpp-group-tabs-row' });
        this.renderGroupTabs();

        // Focus & selection state
        this.focusedIndex = -1;
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
        if (this.plugin.getOrderedGroups().length > 0) {
            footer.createDiv({ text: L.footerDragToGroup });
        }

        // Keyboard handling: Enter activation + directional arrow traversal.
        this.modalKeyHandler = function (e) {
            if (document.querySelector('.wpp-confirm-buttons')) return;
            if (document.querySelector('.wpp-switch-overlay')) return;

            var activeEl = document.activeElement;
            if (activeEl && activeEl !== document.body && !self.contentEl.contains(activeEl)) return;
            var controlEl = activeEl && activeEl.closest
                ? activeEl.closest('button, .wpp-icon-btn, input, select, textarea, a')
                : activeEl;
            if (controlEl && !self.contentEl.contains(controlEl)) controlEl = activeEl;

            function isElementVisible(el) {
                if (!el) return false;
                if (el.offsetParent !== null) return true;
                var rects = el.getClientRects ? el.getClientRects() : [];
                return rects && rects.length > 0;
            }

            function getArrowNavigables() {
                var selector = [
                    'button:not([disabled])',
                    'input:not([disabled]):not([type="hidden"])',
                    'select:not([disabled])',
                    'textarea:not([disabled])',
                    'a[href]',
                    '[tabindex]:not([tabindex="-1"])',
                    '.wpp-icon-btn[tabindex="-1"]',
                ].join(',');
                return Array.from(self.contentEl.querySelectorAll(selector)).filter(function (el) {
                    if (!isElementVisible(el)) return false;
                    if (el.getAttribute('aria-hidden') === 'true') return false;
                    if (el.tabIndex < 0 && !el.classList.contains('wpp-icon-btn')) return false;
                    return true;
                });
            }

            // Left/Right: move only inside the current session-action row.
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                if (e.isComposing) return;
                if (!controlEl) return;
                var actionRow = controlEl.closest('.wpp-session-actions');
                if (!actionRow || !self.contentEl.contains(actionRow)) return;
                var rowControls = Array.from(actionRow.querySelectorAll('button, .wpp-icon-btn')).filter(function (el) {
                    return isElementVisible(el);
                });
                if (rowControls.length === 0) return;
                var rowIndex = rowControls.indexOf(controlEl);
                if (rowIndex === -1) return;
                var nextRowIndex = rowIndex + (e.key === 'ArrowRight' ? 1 : -1);
                if (nextRowIndex < 0 || nextRowIndex >= rowControls.length) return;

                e.preventDefault();
                e.stopPropagation();
                if (self.focusedIndex >= 0) {
                    self.focusedIndex = -1;
                    self.updateFocusUI();
                }
                rowControls[nextRowIndex].focus();
                return;
            }

            // Up/Down: move across all arrow-navigable controls (Tab range + icon buttons).
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                if (e.isComposing) return;
                var isTextInput = !!(activeEl && (
                    activeEl.tagName === 'INPUT'
                    || activeEl.tagName === 'TEXTAREA'
                ));
                if (isTextInput && activeEl.tagName === 'TEXTAREA') return;
                if (activeEl && activeEl.tagName === 'SELECT') return;
                var dir = e.key === 'ArrowUp' ? -1 : 1;

                // From filter area, ArrowDown always goes to the first row's load/switch button.
                var isFilterFocused = document.activeElement === self.filterInput || controlEl === self.filterInput;
                if (isFilterFocused && e.key === 'ArrowDown') {
                    var firstLoadBtn = self.listEl.querySelector('.wpp-session-item .wpp-load-btn');
                    if (firstLoadBtn && isElementVisible(firstLoadBtn)) {
                        e.preventDefault();
                        e.stopPropagation();
                        self.focusedIndex = 0;
                        self.updateFocusUI();
                        firstLoadBtn.focus();
                    }
                    return;
                }

                // Keep vertical movement in the same action type (column) across session rows.
                var activeActionRow = controlEl && controlEl.closest ? controlEl.closest('.wpp-session-actions') : null;
                if (!activeActionRow && self.focusedIndex >= 0) {
                    var rowModeRows = Array.from(self.listEl.querySelectorAll('.wpp-session-item')).filter(function (rowEl) {
                        return isElementVisible(rowEl);
                    });
                    if (rowModeRows.length === 0) return;
                    var rowModeNext = self.focusedIndex + dir;

                    e.preventDefault();
                    e.stopPropagation();

                    if (rowModeNext >= 0 && rowModeNext < rowModeRows.length) {
                        var rowModeTarget = rowModeRows[rowModeNext].querySelector('.wpp-session-actions [data-action-key="load"]');
                        if (!rowModeTarget || !isElementVisible(rowModeTarget)) {
                            rowModeTarget = rowModeRows[rowModeNext].querySelector('.wpp-session-actions button, .wpp-session-actions .wpp-icon-btn');
                        }
                        self.focusedIndex = rowModeNext;
                        self.updateFocusUI();
                        if (rowModeTarget && rowModeTarget.focus) rowModeTarget.focus();
                        return;
                    }

                    if (e.key === 'ArrowUp' && self.focusedIndex === 0) {
                        self.focusedIndex = -1;
                        self.updateFocusUI();
                        self.filterInput.focus();
                        self.filterInput.select();
                        return;
                    }
                    if (e.key === 'ArrowDown' && self.focusedIndex === rowModeRows.length - 1) {
                        self.focusedIndex = -2;
                        self.updateFocusUI();
                        self.nameInput.focus();
                        var rowNameLen = self.nameInput.value.length;
                        self.nameInput.setSelectionRange(rowNameLen, rowNameLen);
                        return;
                    }
                }

                if (activeActionRow && self.contentEl.contains(activeActionRow)) {
                    var actionKey = controlEl && controlEl.getAttribute ? controlEl.getAttribute('data-action-key') : '';
                    // save-inline exists only on the active row, so treat it as "load" for vertical movement.
                    var verticalActionKey = actionKey === 'save-inline' ? 'load' : actionKey;
                    var currentRowEl = controlEl && controlEl.closest ? controlEl.closest('.wpp-session-item') : null;
                    if (!currentRowEl || !self.listEl.contains(currentRowEl)) return;

                    var rows = Array.from(self.listEl.querySelectorAll('.wpp-session-item')).filter(function (rowEl) {
                        return isElementVisible(rowEl);
                    });
                    var currentRowIndex = rows.indexOf(currentRowEl);
                    if (currentRowIndex === -1 || rows.length === 0) return;

                    e.preventDefault();
                    e.stopPropagation();
                    if (self.focusedIndex >= 0) {
                        self.focusedIndex = -1;
                        self.updateFocusUI();
                    }

                    if (verticalActionKey) {
                        var nextRowIndex = currentRowIndex + dir;
                        while (nextRowIndex >= 0 && nextRowIndex < rows.length) {
                            var nextRowEl = rows[nextRowIndex];
                            var target = nextRowEl.querySelector('.wpp-session-actions [data-action-key="' + verticalActionKey + '"]');
                            if ((!target || !isElementVisible(target)) && verticalActionKey !== 'load') {
                                target = nextRowEl.querySelector('.wpp-session-actions [data-action-key="load"]');
                            }
                            if (!target || !isElementVisible(target)) {
                                var fallbackRowControls = Array.from(nextRowEl.querySelectorAll('.wpp-session-actions button, .wpp-session-actions .wpp-icon-btn'));
                                for (var fi = 0; fi < fallbackRowControls.length; fi++) {
                                    if (isElementVisible(fallbackRowControls[fi])) {
                                        target = fallbackRowControls[fi];
                                        break;
                                    }
                                }
                            }
                            if (target && isElementVisible(target)) {
                                target.focus();
                                return;
                            }
                            nextRowIndex += dir;
                        }
                    }

                    // No same-column target: only allow boundary escape.
                    if (e.key === 'ArrowUp' && currentRowIndex === 0) {
                        self.filterInput.focus();
                        self.filterInput.select();
                    } else if (e.key === 'ArrowDown' && currentRowIndex === rows.length - 1) {
                        self.nameInput.focus();
                        var nameLen = self.nameInput.value.length;
                        self.nameInput.setSelectionRange(nameLen, nameLen);
                    }
                    return;
                }

                var navigables = getArrowNavigables();
                if (navigables.length === 0) return;
                var currentIndex = navigables.indexOf(controlEl);
                var nextEl = null;
                if (currentIndex === -1) {
                    var startKey = e.key === 'ArrowUp';
                    nextEl = startKey ? navigables[navigables.length - 1] : navigables[0];
                } else {
                    var fallbackIndex = currentIndex + dir;
                    if (fallbackIndex < 0) fallbackIndex = navigables.length - 1;
                    if (fallbackIndex >= navigables.length) fallbackIndex = 0;
                    nextEl = navigables[fallbackIndex];
                }

                e.preventDefault();
                e.stopPropagation();
                if (nextEl && nextEl.focus) {
                    if (self.focusedIndex >= 0) {
                        self.focusedIndex = -1;
                        self.updateFocusUI();
                    }
                    nextEl.focus();
                }
                return;
            }

            if (e.key !== 'Enter') return;

            if (controlEl === self.filterInput && !e.isComposing) {
                var filtered = self.getNavigationSessions();
                if (filtered.length === 1) {
                    e.preventDefault();
                    self.onLoad(filtered[0].id);
                }
                return;
            }

            if (controlEl && controlEl.classList && controlEl.classList.contains('wpp-icon-btn') && self.contentEl.contains(controlEl)) {
                e.preventDefault();
                e.stopPropagation();
                controlEl.click();
                return;
            }

            if (controlEl && controlEl.tagName === 'BUTTON' && self.contentEl.contains(controlEl)) {
                e.preventDefault();
                e.stopPropagation();
                if (controlEl.classList.contains('wpp-load-btn')) {
                    var row = controlEl.closest('.wpp-session-item');
                    if (row && row.dataset && row.dataset.sessionId) {
                        self.onLoad(row.dataset.sessionId);
                        return;
                    }
                }
                controlEl.click();
                return;
            }

            if (controlEl && (
                controlEl.tagName === 'INPUT'
                || controlEl.tagName === 'TEXTAREA'
                || controlEl.tagName === 'SELECT'
                || controlEl.tagName === 'A'
            )) {
                return;
            }

            if (self.focusedIndex >= 0) {
                e.preventDefault();
                self.onFocusedLoad();
            }
        };
        document.addEventListener('keydown', this.modalKeyHandler, true);

    };

    SessionManagerModal.prototype.getVisibleSessions = function () {
        var sessions = this.plugin.getOrderedSessionsForGroup(this.getModalGroupId());
        var query = (this.filterQuery || '').trim().toLowerCase();
        if (!query) return sessions;
        return sessions.filter(function (s) {
            return (s.name || '').toLowerCase().indexOf(query) !== -1;
        });
    };

    SessionManagerModal.prototype.getModalGroupId = function () {
        var groups = this.plugin.data.groups || {};
        if (this.modalGroupId && !groups[this.modalGroupId]) {
            this.modalGroupId = this.plugin.data.activeGroupId || null;
        }
        return this.modalGroupId || null;
    };

    SessionManagerModal.prototype.selectGroup = function (groupId) {
        var self = this;
        var nextGroupId = groupId || null;
        return this.plugin.resolveGroupSelection(nextGroupId).then(function (result) {
            self.modalGroupId = result.resolvedGroupId || null;
            self.renderGroupTabs();
            self.renderList();
            return result.switched;
        });
    };

    SessionManagerModal.prototype.getNavigationSessions = function () {
        return this.getVisibleSessions();
    };

    SessionManagerModal.prototype.renderList = function () {
        var L = i18n.L;
        this.listEl.empty();
        var sessions = this.getVisibleSessions();
        var selectedGroupId = this.getModalGroupId();
        var ordered = this.plugin.getOrderedSessionsForGroup(selectedGroupId);
        var orderIndex = {};
        for (var oi = 0; oi < ordered.length; oi++) {
            orderIndex[ordered[oi].id] = oi;
        }
        for (var i = 0; i < sessions.length; i++) {
            this.renderSessionItem(sessions[i], i, orderIndex[sessions[i].id]);
        }
        if (sessions.length === 0) {
            var isGroupEmpty = !!selectedGroupId && ordered.length === 0;
            var emptyMsg = isGroupEmpty
                ? L.noGroupSessions : L.noFilteredSessions;
            var emptyEl = this.listEl.createDiv({ text: emptyMsg, cls: 'wpp-empty-state' });
            if (isGroupEmpty) emptyEl.addClass('wpp-empty-state-group');
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

        // Right-click context menu
        item.addEventListener('contextmenu', function (e) {
            e.preventDefault();
            var menu = new obsidian.Menu();

            // Switch
            if (!isActive) {
                menu.addItem(function (mi) {
                    mi.setTitle(L.contextSwitchSession);
                    mi.setIcon('arrow-right');
                    mi.onClick(function () { self.onLoad(session.id); });
                });
            }

            // Rename
            menu.addItem(function (mi) {
                mi.setTitle(L.contextRenameSession);
                mi.setIcon('pencil');
                mi.onClick(function () { self.onRename(session); });
            });

            // Duplicate
            menu.addItem(function (mi) {
                mi.setTitle(L.contextDuplicateSession);
                mi.setIcon('copy');
                mi.onClick(function () {
                    self.plugin.duplicateSession(session.id).then(function () {
                        self.renderList();
                    });
                });
            });

            // Remove from group (only when a group is active)
            var selectedGroupId = self.getModalGroupId();
            if (selectedGroupId) {
                menu.addItem(function (mi) {
                    mi.setTitle(L.groupRemoveFromGroup);
                    mi.setIcon('log-out');
                    mi.onClick(function () {
                        var activeGid = self.getModalGroupId();
                        if (!activeGid) return;
                        var gName = (self.plugin.data.groups[activeGid] || {}).name || '';
                        self.plugin.removeSessionFromGroup(session.id, activeGid).then(function () {
                            new obsidian.Notice(L.groupRemovedSession(session.name, gName));
                            self.renderGroupTabs();
                            self.renderList();
                        });
                    });
                });
            }

            // Delete (with separator, hidden for last session)
            if (Object.keys(self.plugin.data.sessions).length > 1) {
                menu.addSeparator();
                menu.addItem(function (mi) {
                    mi.setTitle(L.contextDeleteSession);
                    mi.setIcon('trash-2');
                    mi.setSection('danger');
                    mi.onClick(function () { self.onDelete(session); });
                });
            }

            menu.showAtMouseEvent(e);
        });

        // Hotkey hint
        var hintIndex = typeof orderIndex === 'number' ? orderIndex : index;
        var hk = hintIndex <= 8 ? self.plugin.getCommandHotkey('switch-to-' + (hintIndex + 1)) : '';
        item.createSpan({ text: hk || String(hintIndex + 1), cls: 'wpp-session-index' });

        // Info section
        var info = item.createDiv({ cls: 'wpp-session-info' });
        var nameRow = info.createDiv({ cls: 'wpp-session-name-row' });
        nameRow.createSpan({ text: session.name, cls: 'wpp-session-name' });
        if (session.isDefault && session.name !== this.plugin.getDefaultSessionName()) {
            nameRow.createSpan({ text: L.defaultLabel, cls: 'wpp-default-label' });
        }
        if (isActive) {
            nameRow.createSpan({ text: L.active, cls: 'wpp-active-badge' });
        }
        info.createDiv({ text: formatRelativeTime(session.modified), cls: 'wpp-session-modified' });

        // Action buttons
        var actions = item.createDiv({ cls: 'wpp-session-actions' });

        var loadBtn = actions.createEl('button', { text: L.load, cls: 'wpp-load-btn' });
        loadBtn.setAttribute('data-action-key', 'load');
        loadBtn.addEventListener('click', function () { self.onLoad(session.id); });

        if (isActive && !self.plugin.isAutoSaveOnSwitchEnabled()) {
            var saveCurrentBtn = actions.createEl('button', {
                text: L.saveInline,
                cls: 'wpp-save-inline-btn',
            });
            saveCurrentBtn.setAttribute('data-action-key', 'save-inline');
            saveCurrentBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                self.plugin.saveActiveSession().then(function () {
                    self.renderList();
                });
            });
            actions.insertBefore(saveCurrentBtn, loadBtn);
            // Keep the save button width consistent with the switch button.
            saveCurrentBtn.style.width = loadBtn.offsetWidth + 'px';
        }

        // Rename button
        var renameBtn = actions.createDiv({
            cls: 'wpp-icon-btn',
            attr: { 'aria-label': L.rename, role: 'button', tabindex: '-1', 'data-action-key': 'rename' },
        });
        obsidian.setIcon(renameBtn, 'pencil');
        renameBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            self.onRename(session);
        });

        // Delete button (hidden for last remaining session)
        if (Object.keys(self.plugin.data.sessions).length > 1) {
            var deleteBtn = actions.createDiv({
                cls: 'wpp-icon-btn',
                attr: { 'aria-label': L.delete, role: 'button', tabindex: '-1', 'data-action-key': 'delete' },
            });
            obsidian.setIcon(deleteBtn, 'trash-2');
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
                    document.body.classList.add('wpp-session-list-dragging');
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

                function updateGroupDropTarget(ev) {
                    var tabs = self.groupTabsRow.querySelectorAll('.wpp-group-tab');
                    var hoveredTab = null;
                    for (var t = 0; t < tabs.length; t++) {
                        var tr = tabs[t].getBoundingClientRect();
                        if (ev.clientX >= tr.left && ev.clientX <= tr.right &&
                            ev.clientY >= tr.top && ev.clientY <= tr.bottom) {
                            hoveredTab = tabs[t];
                            break;
                        }
                    }
                    for (var t2 = 0; t2 < tabs.length; t2++) {
                        tabs[t2].classList.toggle('wpp-group-drop-target', tabs[t2] === hoveredTab);
                    }
                    return hoveredTab;
                }

                function clearGroupDropTargets() {
                    var tabs = self.groupTabsRow.querySelectorAll('.wpp-group-tab');
                    for (var t = 0; t < tabs.length; t++) {
                        tabs[t].classList.remove('wpp-group-drop-target');
                    }
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

                    // Check if hovering over a group tab
                    var hoverTab = updateGroupDropTarget(ev);
                    if (hoverTab) return; // Don't reorder while over group tabs

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

                function onMouseUp(ev) {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                    document.body.classList.remove('wpp-session-list-dragging');

                    if (!dragStarted) return;

                    cloneEl.remove();
                    draggedEl.classList.remove('is-dragging');

                    // Check if dropped on a group tab
                    var dropTab = updateGroupDropTarget(ev);
                    clearGroupDropTargets();

                    if (dropTab && dropTab.dataset.groupId && dropTab.dataset.groupId !== '__all__') {
                        var sessionId = draggedEl.dataset.sessionId;
                        var groupId = dropTab.dataset.groupId;
                        var sessionName = (self.plugin.data.sessions[sessionId] || {}).name || '';
                        var groupName = (self.plugin.data.groups[groupId] || {}).name || '';
                        self.plugin.moveSessionToGroupExclusive(sessionId, groupId).then(function () {
                            new obsidian.Notice(i18n.L.groupAddedSession(sessionName, groupName));
                            self.renderGroupTabs();
                            self.renderList();
                        });
                        return;
                    } else {
                        var currentGroupId = self.getModalGroupId();
                        if (dropTab && dropTab.dataset.groupId === '__all__' && currentGroupId) {
                        // Drop on "All" tab while viewing a group → remove from group
                            var rmSessionId = draggedEl.dataset.sessionId;
                            var rmGroupId = currentGroupId;
                            var rmSessionName = (self.plugin.data.sessions[rmSessionId] || {}).name || '';
                            var rmGroupName = (self.plugin.data.groups[rmGroupId] || {}).name || '';
                            self.plugin.removeSessionFromGroup(rmSessionId, rmGroupId).then(function () {
                                new obsidian.Notice(i18n.L.groupRemovedSession(rmSessionName, rmGroupName));
                                self.renderGroupTabs();
                                self.renderList();
                            });
                            return;
                        }
                    }

                    // Read order from DOM
                    var newVisibleOrder = [];
                    var items = self.listEl.querySelectorAll('.wpp-session-item');
                    items.forEach(function (el) {
                        newVisibleOrder.push(el.dataset.sessionId);
                    });

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

                    self.plugin.setSessionOrderFromVisible(newVisibleOrder, { syncCommands: false });
                }

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        });
    };

    SessionManagerModal.prototype.onSave = function () {
        var L = i18n.L;
        var self = this;
        var selectedGroupId = this.getModalGroupId();
        var beforeActiveGroupId = this.plugin.data.activeGroupId || null;
        var name = this.nameInput.value.trim();
        if (!name) {
            name = this.plugin.getNextSessionName();
        }
        // Check duplicate
        var exists = this.plugin.isSessionNameTaken(name);
        if (exists) {
            new obsidian.Notice(L.duplicateName);
            return;
        }
        this.plugin.createSession(name).then(function () {
            var createdSessionId = self.plugin.data.activeSessionId;
            var chain = Promise.resolve();

            if (selectedGroupId && selectedGroupId !== beforeActiveGroupId) {
                chain = self.plugin.addSessionToGroup(createdSessionId, selectedGroupId).then(function () {
                    return self.plugin.resolveGroupSelection(selectedGroupId).then(function (result) {
                        self.modalGroupId = result.resolvedGroupId || null;
                    });
                });
            } else {
                self.modalGroupId = self.plugin.data.activeGroupId || null;
            }

            return chain.then(function () {
                self.nameInput.value = '';
                self.renderGroupTabs();
                self.renderList();
                new obsidian.Notice(L.created(name));
            });
        });
    };

    SessionManagerModal.prototype.onLoad = function (sessionId) {
        if (sessionId === this.plugin.data.activeSessionId) return;
        var self = this;
        this.plugin.switchSession(sessionId).then(function (switched) {
            if (switched) self.close();
        });
    };

    SessionManagerModal.prototype.onRename = function (session) {
        var L = i18n.L;
        var self = this;
        new RenameModal(this.app, session.name, function (newName) {
            var exists = self.plugin.isSessionNameTaken(newName, session.id);
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

    SessionManagerModal.prototype.renderGroupTabs = function () {
        var L = i18n.L;
        var self = this;
        var el = this.groupTabsRow;
        while (el.firstChild) el.removeChild(el.firstChild);

        var groups = this.plugin.data.groups || {};
        var selectedGroupId = this.getModalGroupId();

        var groupOrder = this.plugin.getOrderedGroupTabIds();

        // --- Group tab D&D helper ---
        function setupGroupTabDrag(tabEl) {
            tabEl.addEventListener('mousedown', function (e) {
                if (e.button !== 0) return;
                var startX = e.clientX;
                var dragStarted = false;
                var cloneEl = null;

                function startDrag(ev) {
                    dragStarted = true;
                    var rect = tabEl.getBoundingClientRect();
                    cloneEl = tabEl.cloneNode(true);
                    cloneEl.classList.add('wpp-drag-clone');
                    cloneEl.style.position = 'fixed';
                    cloneEl.style.width = rect.width + 'px';
                    cloneEl.style.height = rect.height + 'px';
                    cloneEl.style.top = rect.top + 'px';
                    cloneEl.style.left = (ev.clientX - (startX - rect.left)) + 'px';
                    cloneEl.style.zIndex = '10000';
                    cloneEl.style.pointerEvents = 'none';
                    document.body.appendChild(cloneEl);
                    tabEl.classList.add('is-dragging');
                    cloneEl._offsetX = startX - rect.left;
                }

                function onMove(ev) {
                    if (!dragStarted) {
                        if (Math.abs(ev.clientX - startX) < 5) return;
                        startDrag(ev);
                    }
                    cloneEl.style.left = (ev.clientX - cloneEl._offsetX) + 'px';

                    // Reorder tabs in DOM based on horizontal position
                    var tabs = el.querySelectorAll('.wpp-group-tab');
                    var placed = false;
                    for (var ti = 0; ti < tabs.length; ti++) {
                        var sibling = tabs[ti];
                        if (sibling === tabEl) continue;
                        var r = sibling.getBoundingClientRect();
                        if (ev.clientX < r.left + r.width / 2) {
                            el.insertBefore(tabEl, sibling);
                            placed = true;
                            break;
                        }
                    }
                    if (!placed) {
                        var addBtnEl = el.querySelector('.wpp-group-add-btn');
                        if (addBtnEl) {
                            el.insertBefore(tabEl, addBtnEl);
                        }
                    }
                }

                function onUp() {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                    if (!dragStarted) return;
                    cloneEl.remove();
                    tabEl.classList.remove('is-dragging');

                    // Read new order from DOM
                    var tabs = el.querySelectorAll('.wpp-group-tab');
                    var newOrder = [];
                    for (var ti = 0; ti < tabs.length; ti++) {
                        newOrder.push(tabs[ti].dataset.groupId);
                    }
                    self.plugin.setGroupTabOrder(newOrder);
                }

                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });
        }

        // Render tabs in groupOrder
        for (var gi = 0; gi < groupOrder.length; gi++) {
            var gid = groupOrder[gi];

            if (gid === '__all__') {
                // "All" tab
                var allTab = el.createDiv({ cls: 'wpp-group-tab' });
                if (!selectedGroupId) allTab.classList.add('is-active');
                allTab.textContent = L.groupAll;
                allTab.dataset.groupId = '__all__';
                allTab.addEventListener('click', function () {
                    self.selectGroup(null);
                });

                // "All" tab right-click context menu
                allTab.addEventListener('contextmenu', function (e) {
                    e.preventDefault();
                    var menu = new obsidian.Menu();

                    menu.addItem(function (mi) {
                        mi.setTitle(L.groupCreateNew);
                        mi.setIcon('plus');
                        mi.onClick(function () {
                            new RenameModal(self.app, '', function (name) {
                                if (!name.trim()) {
                                    new obsidian.Notice(L.groupEmptyName);
                                    return;
                                }
                                var groupName = name.trim();
                                if (self.plugin.isGroupNameTaken(groupName)) {
                                    new obsidian.Notice(L.groupDuplicateName);
                                    return;
                                }
                                self.plugin.createGroup(groupName).then(function () {
                                    self.renderGroupTabs();
                                });
                            }, {
                                title: L.groupCreateNew,
                                placeholder: L.groupCreatePlaceholder,
                                buttonText: L.save,
                            }).open();
                        });
                    });

                    var allGroups = self.plugin.getOrderedGroups();
                    if (allGroups.length > 0) {
                        menu.addSeparator();
                        menu.addItem(function (mi) {
                            mi.setTitle(L.contextDeleteAllGroups);
                            mi.setIcon('folder-x');
                            mi.setSection('danger');
                            mi.onClick(function () {
                                new ConfirmModal(self.app, L.confirmDeleteAllGroups(allGroups.length), function () {
                                    return self.plugin.clearAllGroups().then(function () {
                                        self.modalGroupId = null;
                                        new obsidian.Notice(L.deletedAllGroups(allGroups.length));
                                        self.renderGroupTabs();
                                        self.renderList();
                                    });
                                }).open();
                            });
                        });
                    }

                    var sessionCount = Object.keys(self.plugin.data.sessions).length;
                    if (sessionCount > 1) {
                        if (allGroups.length === 0) menu.addSeparator();
                        menu.addItem(function (mi) {
                            mi.setTitle(L.contextDeleteAllSessions);
                            mi.setIcon('trash-2');
                            mi.setSection('danger');
                            mi.onClick(function () {
                                new ConfirmModal(self.app, L.confirmDeleteAllSessions(sessionCount - 1), function () {
                                    var activeId = self.plugin.data.activeSessionId;
                                    var ids = Object.keys(self.plugin.data.sessions).filter(function (id) {
                                        return id !== activeId;
                                    });
                                    var promises = ids.map(function (id) {
                                        return self.plugin.deleteSession(id);
                                    });
                                    return Promise.all(promises).then(function (results) {
                                        var deletedCount = results.filter(function (d) { return d; }).length;
                                        self.renderGroupTabs();
                                        self.renderList();
                                        if (deletedCount > 0) {
                                            new obsidian.Notice(L.deletedAllSessions(deletedCount));
                                        }
                                    });
                                }).open();
                            });
                        });
                    }

                    menu.showAtMouseEvent(e);
                });

                setupGroupTabDrag(allTab);

            } else if (groups[gid]) {
                // Group tab
                (function (group) {
                    var tab = el.createDiv({ cls: 'wpp-group-tab' });
                    if (selectedGroupId === group.id) tab.classList.add('is-active');
                    tab.textContent = group.name;
                    tab.dataset.groupId = group.id;
                    tab.addEventListener('click', function () {
                        self.selectGroup(group.id);
                    });
                    // Right-click context menu
                    tab.addEventListener('contextmenu', function (e) {
                        e.preventDefault();
                        var menu = new obsidian.Menu();
                        menu.addItem(function (item) {
                            item.setTitle(L.groupContextRename);
                            item.setIcon('pencil');
                            item.onClick(function () {
                                new RenameModal(self.app, group.name, function (newName) {
                                    if (self.plugin.isGroupNameTaken(newName, group.id)) {
                                        new obsidian.Notice(L.groupDuplicateName);
                                        return;
                                    }
                                    self.plugin.renameGroup(group.id, newName).then(function () {
                                        self.renderGroupTabs();
                                    });
                                }, { title: L.groupContextRename }).open();
                            });
                        });
                        var groupSessionIds = self.plugin.getGroupSessionIds(group.id);
                        if (groupSessionIds.length > 0) {
                            menu.addItem(function (item) {
                                item.setTitle(L.groupRemoveAllSessions);
                                item.setIcon('log-out');
                                item.onClick(function () {
                                    new ConfirmModal(self.app, L.confirmRemoveAllFromGroup(group.name, groupSessionIds.length), function () {
                                        return self.plugin.removeAllSessionsFromGroup(group.id).then(function () {
                                            new obsidian.Notice(L.groupRemovedAllSessions(group.name));
                                            self.renderGroupTabs();
                                            self.renderList();
                                        });
                                    }, {
                                        confirmText: L.remove,
                                        confirmClass: 'mod-cta',
                                    }).open();
                                });
                            });
                        }

                        menu.addSeparator();
                        menu.addItem(function (item) {
                            item.setTitle(L.groupContextDelete);
                            item.setIcon('trash-2');
                            item.setSection('danger');
                            item.onClick(function () {
                                new ConfirmModal(self.app, L.confirmDeleteGroup(group.name), function () {
                                    self.plugin.deleteGroup(group.id).then(function () {
                                        if (self.modalGroupId === group.id) {
                                            self.modalGroupId = self.plugin.data.activeGroupId || null;
                                        }
                                        self.renderGroupTabs();
                                        self.renderList();
                                    });
                                }).open();
                            });
                        });
                        menu.showAtMouseEvent(e);
                    });

                    setupGroupTabDrag(tab);
                })(groups[gid]);
            }
        }

        // "+" add group button
        var addBtn = el.createDiv({ cls: 'wpp-group-add-btn' });
        obsidian.setIcon(addBtn, 'plus');
        obsidian.setTooltip(addBtn, L.groupCreateNew, {
            placement: 'bottom',
            delay: 0,
        });

        addBtn.addEventListener('click', function () {
            new RenameModal(self.app, '', function (name) {
                if (!name.trim()) {
                    new obsidian.Notice(L.groupEmptyName);
                    return;
                }
                var groupName = name.trim();
                if (self.plugin.isGroupNameTaken(groupName)) {
                    new obsidian.Notice(L.groupDuplicateName);
                    return;
                }
                self.plugin.createGroup(groupName).then(function () {
                    self.renderGroupTabs();
                });
            }, {
                title: L.groupCreateNew,
                placeholder: L.groupCreatePlaceholder,
                buttonText: L.save,
            }).open();
        });
    };

    SessionManagerModal.prototype.onClose = function () {
        document.body.classList.remove('wpp-session-list-dragging');
        if (this.modalKeyHandler) {
            document.removeEventListener('keydown', this.modalKeyHandler, true);
            this.modalKeyHandler = null;
        }
        this.contentEl.empty();
    };

    return SessionManagerModal;
})(obsidian.Modal);

module.exports = SessionManagerModal;
