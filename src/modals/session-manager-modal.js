'use strict';

var obsidian = require('obsidian');
var i18n = require('../i18n');
var ConfirmModal = require('./confirm-modal');
var RenameModal = require('./rename-modal');
var HistoryModal = require('./history-modal');
var formatRelativeTime = require('./format-relative-time');
var groupTabUi = require('../group-tab-ui');
var utils = require('../utils');
var sessionContextMenu = require('../session-context-menu');

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
        this.modalGroupId = this.plugin.isGroupFeatureEnabled()
            ? (this.plugin.data.activeGroupId || null)
            : null;
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
            var activeIdx = self.plugin.findActiveSessionIndex(sessions);
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
        this.focusedIndex = this.plugin.findActiveSessionIndex(ordered);
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
        if (!this.plugin.isGroupFeatureEnabled()) {
            this.modalGroupId = null;
            return null;
        }
        var groups = this.plugin.data.groups || {};
        if (this.modalGroupId && !groups[this.modalGroupId]) {
            this.modalGroupId = this.plugin.data.activeGroupId || null;
        }
        return this.modalGroupId || null;
    };

    SessionManagerModal.prototype.selectGroup = function (groupId) {
        if (!this.plugin.isGroupFeatureEnabled()) {
            this.modalGroupId = null;
            this.renderGroupTabs();
            this.renderList();
            return Promise.resolve(false);
        }
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
            var cmdKey = utils.isModPressed(e);
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
            var selectedGroupId = self.getModalGroupId();
            sessionContextMenu.openSessionContextMenu({
                plugin: self.plugin,
                app: self.app,
                session: session,
                isActive: isActive,
                event: e,
                showSwitch: true,
                showRemoveFromGroup: !!selectedGroupId,
                onSave: function () {
                    self.plugin.saveActiveSession().then(function () {
                        self.renderList();
                    });
                },
                onReload: function () {
                    self.plugin.reloadCurrentSessionWithoutSaving();
                },
                onSwitch: function () {
                    self.onLoad(session.id);
                },
                onRename: function () {
                    self.onRename(session);
                },
                onDuplicate: function () {
                    self.plugin.duplicateSession(session.id).then(function () {
                        self.renderList();
                    });
                },
                onRemoveFromGroup: function () {
                    var activeGid = self.getModalGroupId();
                    if (!activeGid) return;
                    var gName = (self.plugin.data.groups[activeGid] || {}).name || '';
                    self.plugin.removeSessionFromGroup(session.id, activeGid).then(function () {
                        new obsidian.Notice(L.groupRemovedSession(session.name, gName));
                        self.renderGroupTabs();
                        self.renderList();
                    });
                },
                onDelete: function () {
                    self.onDelete(session);
                },
                onVersionHistory: function () {
                    new HistoryModal(self.app, self.plugin, session).open();
                },
            });
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
                if (utils.isModPressed(e)) return;

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
        this.plugin.createSessionForViewedGroup(this.nameInput.value, selectedGroupId).then(function (result) {
            if (!result || !result.created) return;
            var createdName = result.name;
            self.modalGroupId = result.viewGroupId || null;
            self.nameInput.value = '';
            self.renderGroupTabs();
            self.renderList();
            new obsidian.Notice(L.created(createdName));
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
            self.plugin.renameSessionById(session.id, newName).then(function (renamed) {
                if (!renamed) return;
                self.renderList();
            });
        }, {
            emptyNotice: L.emptyName,
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

        if (!this.plugin.isGroupFeatureEnabled()) {
            el.style.display = 'none';
            return;
        }
        el.style.display = '';

        var groups = this.plugin.data.groups || {};
        var selectedGroupId = this.getModalGroupId();

        var groupOrder = this.plugin.getOrderedGroupTabIds();

        // --- Group tab D&D helper ---
        function setupGroupTabDrag(tabEl) {
            groupTabUi.attachGroupTabDrag(tabEl, el, {
                onCommit: function (newOrder) {
                    self.plugin.setGroupTabOrder(newOrder);
                },
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
                    groupTabUi.openAllGroupsTabContextMenu({
                        app: self.app,
                        plugin: self.plugin,
                        event: e,
                        onResetViewGroup: function () {
                            self.modalGroupId = null;
                        },
                        onGroupsChanged: function () {
                            self.renderGroupTabs();
                        },
                        onSessionsChanged: function () {
                            self.renderList();
                        },
                    });
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
                        groupTabUi.openGroupTabContextMenu({
                            app: self.app,
                            plugin: self.plugin,
                            event: e,
                            group: group,
                            onDeleteGroup: function (deletedGroupId) {
                                if (self.modalGroupId === deletedGroupId) {
                                    self.modalGroupId = self.plugin.data.activeGroupId || null;
                                }
                            },
                            onGroupsChanged: function () {
                                self.renderGroupTabs();
                            },
                            onSessionsChanged: function () {
                                self.renderList();
                            },
                        });
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
            groupTabUi.openCreateGroupPrompt(self.app, self.plugin, function () {
                self.renderGroupTabs();
            });
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
