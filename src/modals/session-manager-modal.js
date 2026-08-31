'use strict';

var obsidian = require('obsidian');
var i18n = require('../i18n.ts');
var ConfirmModal = require('./confirm-modal.ts').ConfirmModal;
var groupTabUi = require('../group-tab-ui.ts');
var navigationUtils = require('../navigation-utils.ts');
var utils = require('../utils.ts');
var sessionPresenter = require('../ui/shared/session-presenter.ts');
var sessionContextActions = require('../session-context-actions');
var settingsContextMenu = require('../settings-context-menu');
var sessionListActions = require('../session-list-actions');

function isElementVisible(el) {
    if (!el) return false;
    if (el.offsetParent !== null) return true;
    var rects = el.getClientRects ? el.getClientRects() : [];
    return rects && rects.length > 0;
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
        this.saveBtn = saveBtn;

        // Filter section (conditional)
        this.filterInput = null;
        if (this.plugin.data.showFilterInput) {
            var filterContainer = contentEl.createDiv({ cls: 'wpp-filter-container' });
            this.filterInput = filterContainer.createEl('input', {
                type: 'text',
                placeholder: L.filterPlaceholder,
                cls: 'wpp-filter-input',
            });
        }

        var self = this;
        this.modalGroupId = this.plugin.isGroupFeatureEnabled()
            ? (this.plugin.data.activeGroupId || null)
            : null;
        saveBtn.addEventListener('click', function () { self.onSave(); });
        saveBtn.addEventListener('focus', function () {
            self.setKeyboardTarget({ zone: 'create-button' });
        });
        this.nameInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.isComposing) self.onSave();
        });
        this.nameInput.addEventListener('focus', function () {
            self.setKeyboardTarget({ zone: 'create-input' });
        });
        this.filterQuery = '';
        if (this.filterInput) {
            this.filterInput.addEventListener('focus', function () {
                self.setKeyboardTarget({ zone: 'filter' });
            });
            this.filterInput.addEventListener('input', function () {
                self.filterQuery = self.filterInput.value || '';
                self.setKeyboardTarget({ zone: 'filter' });
                self.renderList();
            });
        }

        // Group tabs
        this.groupTabsRow = contentEl.createDiv({ cls: 'wpp-group-tabs-row' });
        this.renderGroupTabs();

        // Focus & selection state
        this.keyboardTarget = { zone: 'none', rowIndex: null, actionKey: null };
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
        this.setKeyboardTarget(this.getDefaultSessionTarget());

        this.contentFocusHandler = function (e) {
            self.syncKeyboardTargetFromElement(e.target);
        };
        contentEl.addEventListener('focusin', this.contentFocusHandler, true);

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

        // Right-click on empty area → settings context menu
        contentEl.addEventListener('contextmenu', function (e) {
            if (e.target.closest('.wpp-session-item')) return;
            if (e.target.closest('.wpp-save-container')) return;
            if (e.target.closest('.wpp-filter-container')) return;
            if (e.target.closest('.wpp-bulk-actions')) return;
            if (e.target.closest('.wpp-group-tab')) return;
            e.preventDefault();
            settingsContextMenu.openSettingsContextMenu({
                plugin: self.plugin,
                app: self.app,
                event: e,
                onChanged: function () {
                    self.renderGroupTabs();
                    self.renderList();
                },
            });
        });

        // Keyboard handling: Enter activation + directional arrow traversal.
        this.modalKeyHandler = function (e) {
            if (document.querySelector('.wpp-confirm-buttons')) return;
            if (document.querySelector('.wpp-switch-overlay')) return;

            var activeEl = document.activeElement;
            if (activeEl && activeEl !== document.body && !self.contentEl.contains(activeEl)) return;
            var controlEl = navigationUtils.getScopedControlEl(self.contentEl, activeEl);

            // Left/Right: move only inside the current session-action row.
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                self.handleHorizontalArrowKey(e, controlEl);
                return;
            }

            // Up/Down: move across all arrow-navigable controls (Tab range + icon buttons).
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                self.handleVerticalArrowKey(e, activeEl, controlEl);
                return;
            }

            if (e.key !== 'Enter') return;
            self.handleEnterKey(e, controlEl);
        };
        document.addEventListener('keydown', this.modalKeyHandler, true);

        // Apply default focus setting (override Obsidian's auto-focus on first input)
        var focusTarget = this.plugin.data.overlayDefaultFocus || 'current-session';
        if (focusTarget !== 'session-create') {
            var modalSelf = this;
            setTimeout(function () {
                if (focusTarget === 'session-filter' && modalSelf.filterInput) {
                    modalSelf.focusFilterInput();
                } else {
                    modalSelf.focusSessionTarget(modalSelf.getDefaultSessionTarget());
                }
            }, 50);
        }

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

    SessionManagerModal.prototype.getArrowNavigables = function () {
        var selector = [
            'button:not([disabled])',
            'input:not([disabled]):not([type="hidden"])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            'a[href]',
            '[tabindex]:not([tabindex="-1"])',
            '.wpp-icon-btn[tabindex="-1"]',
        ].join(',');
        return Array.from(this.contentEl.querySelectorAll(selector)).filter(function (el) {
            if (!isElementVisible(el)) return false;
            if (el.getAttribute('aria-hidden') === 'true') return false;
            if (el.tabIndex < 0 && !el.classList.contains('wpp-icon-btn')) return false;
            return true;
        });
    };

    SessionManagerModal.prototype.getVisibleRowElements = function () {
        return Array.from(this.listEl.querySelectorAll('.wpp-session-item')).filter(function (rowEl) {
            return isElementVisible(rowEl);
        });
    };

    SessionManagerModal.prototype.getVisibleRowIndex = function (rowEl) {
        if (!rowEl) return -1;
        return this.getVisibleRowElements().indexOf(rowEl);
    };

    SessionManagerModal.prototype.getRowActionTarget = function (rowEl, actionKey) {
        if (!rowEl) return null;
        var target = null;
        var desiredKey = actionKey || 'load';
        if (desiredKey === 'primary') desiredKey = 'load';
        if (desiredKey) {
            target = rowEl.querySelector('.wpp-session-actions [data-action-key="' + desiredKey + '"]');
        }
        if ((!target || !isElementVisible(target)) && desiredKey !== 'load') {
            target = rowEl.querySelector('.wpp-session-actions [data-action-key="load"]');
        }
        if (target && isElementVisible(target)) return target;
        var rowControls = Array.from(rowEl.querySelectorAll('.wpp-session-actions button, .wpp-session-actions .wpp-icon-btn'));
        for (var i = 0; i < rowControls.length; i++) {
            if (isElementVisible(rowControls[i])) return rowControls[i];
        }
        return null;
    };

    SessionManagerModal.prototype.getDefaultSessionTarget = function () {
        var sessions = this.getNavigationSessions();
        if (sessions.length === 0) return { zone: this.filterInput ? 'filter' : 'create-input' };
        var activeIdx = this.plugin.findActiveSessionIndex(sessions);
        return {
            zone: 'session-action',
            rowIndex: activeIdx !== -1 ? activeIdx : 0,
            actionKey: 'load',
        };
    };

    SessionManagerModal.prototype.getEdgeSessionTarget = function (which, actionKey) {
        var rows = this.getVisibleRowElements();
        if (!rows.length) return null;
        return {
            zone: 'session-action',
            rowIndex: which === 'last' ? rows.length - 1 : 0,
            actionKey: actionKey || 'load',
        };
    };

    SessionManagerModal.prototype.setKeyboardTarget = function (target) {
        var nextTarget = target || { zone: 'none', rowIndex: null, actionKey: null };
        if (nextTarget.zone === 'session-action') {
            var sessions = this.getNavigationSessions();
            var nextIndex = typeof nextTarget.rowIndex === 'number' ? nextTarget.rowIndex : -1;
            if (nextIndex >= sessions.length) nextIndex = sessions.length - 1;
            if (nextIndex < 0 && sessions.length > 0) nextIndex = 0;
            nextTarget = {
                zone: 'session-action',
                rowIndex: nextIndex >= 0 ? nextIndex : null,
                actionKey: nextTarget.actionKey || 'load',
            };
        } else {
            nextTarget = {
                zone: nextTarget.zone || 'none',
                rowIndex: null,
                actionKey: null,
            };
        }
        this.keyboardTarget = nextTarget;
        this.updateFocusUI();
    };

    SessionManagerModal.prototype.syncKeyboardTargetFromElement = function (el) {
        if (!el || !this.contentEl.contains(el)) return;
        var rowAction = el.closest ? el.closest('.wpp-session-actions') : null;
        if (rowAction && this.contentEl.contains(rowAction)) {
            var rowEl = el.closest('.wpp-session-item');
            var rowIndex = this.getVisibleRowIndex(rowEl);
            this.setKeyboardTarget({
                zone: 'session-action',
                rowIndex: rowIndex,
                actionKey: el.getAttribute && el.getAttribute('data-action-key') || 'load',
            });
            return;
        }
        if (el === this.filterInput) {
            this.setKeyboardTarget({ zone: 'filter' });
            return;
        }
        if (el === this.nameInput) {
            this.setKeyboardTarget({ zone: 'create-input' });
            return;
        }
        if (el === this.saveBtn) {
            this.setKeyboardTarget({ zone: 'create-button' });
        }
    };

    SessionManagerModal.prototype.focusCreateInput = function () {
        this.setKeyboardTarget({ zone: 'create-input' });
        navigationUtils.focusTextInputEnd(this.nameInput);
    };

    SessionManagerModal.prototype.focusFilterInput = function () {
        if (!this.filterInput) return false;
        this.setKeyboardTarget({ zone: 'filter' });
        navigationUtils.focusTextInputSelect(this.filterInput);
        return true;
    };

    SessionManagerModal.prototype.handleHorizontalArrowKey = function (e, controlEl) {
        if (e.isComposing) return;
        if (controlEl === this.nameInput && e.key === 'ArrowRight') {
            if (navigationUtils.isTextInputCursorAtEnd(this.nameInput)) {
                e.preventDefault();
                e.stopPropagation();
                this.saveBtn.focus();
            }
            return;
        }
        if (controlEl === this.saveBtn && e.key === 'ArrowLeft') {
            e.preventDefault();
            e.stopPropagation();
            this.focusCreateInput();
            return;
        }
        if (!controlEl) return;
        var actionRow = controlEl.closest('.wpp-session-actions');
        if (!actionRow || !this.contentEl.contains(actionRow)) return;
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
        rowControls[nextRowIndex].focus();
    };

    SessionManagerModal.prototype.handleVerticalArrowKey = function (e, activeEl, controlEl) {
        if (e.isComposing) return;
        var isTextInput = !!(activeEl && (
            activeEl.tagName === 'INPUT'
            || activeEl.tagName === 'TEXTAREA'
        ));
        if (isTextInput && activeEl.tagName === 'TEXTAREA') return;
        if (activeEl && activeEl.tagName === 'SELECT') return;
        var dir = e.key === 'ArrowUp' ? -1 : 1;

        if (controlEl === this.filterInput) {
            e.preventDefault();
            e.stopPropagation();
            if (e.key === 'ArrowDown') {
                this.focusSessionTarget(this.getEdgeSessionTarget('first', 'load'));
            } else {
                this.focusCreateInput();
            }
            return;
        }

        if (this.keyboardTarget.zone === 'session-action' && this.keyboardTarget.rowIndex >= 0) {
            var activeActionRow = controlEl && controlEl.closest ? controlEl.closest('.wpp-session-actions') : null;
            var rows = this.getVisibleRowElements();
            var currentRowIndex = this.keyboardTarget.rowIndex;
            var actionKey = this.keyboardTarget.actionKey || 'load';
            if (activeActionRow && this.contentEl.contains(activeActionRow) && controlEl && controlEl.getAttribute) {
                actionKey = controlEl.getAttribute('data-action-key') || actionKey;
            }
            var verticalActionKey = actionKey === 'save-inline' ? 'load' : (actionKey || 'load');
            if (rows.length === 0) return;

            e.preventDefault();
            e.stopPropagation();
            var nextRowIndex = currentRowIndex + dir;
            if (nextRowIndex >= 0 && nextRowIndex < rows.length
                && this.focusSessionTarget({ zone: 'session-action', rowIndex: nextRowIndex, actionKey: verticalActionKey })) {
                return;
            }
            if (e.key === 'ArrowUp') {
                if (this.filterInput) {
                    this.focusFilterInput();
                } else {
                    this.focusCreateInput();
                }
            } else {
                this.focusCreateInput();
            }
            return;
        }

        if (controlEl === this.nameInput || controlEl === this.saveBtn) {
            e.preventDefault();
            e.stopPropagation();
            if (e.key === 'ArrowDown') {
                if (this.filterInput) {
                    this.focusFilterInput();
                } else {
                    this.focusSessionTarget(this.getEdgeSessionTarget('first', 'load'));
                }
            } else {
                this.focusSessionTarget(this.getEdgeSessionTarget('last', 'load'));
            }
            return;
        }

        var navigables = this.getArrowNavigables();
        if (navigables.length === 0) return;
        var currentIndex = navigables.indexOf(controlEl);
        var nextEl = null;
        if (currentIndex === -1) {
            nextEl = e.key === 'ArrowUp' ? navigables[navigables.length - 1] : navigables[0];
        } else {
            var fallbackIndex = currentIndex + dir;
            if (fallbackIndex < 0) fallbackIndex = navigables.length - 1;
            if (fallbackIndex >= navigables.length) fallbackIndex = 0;
            nextEl = navigables[fallbackIndex];
        }

        e.preventDefault();
        e.stopPropagation();
        if (nextEl && nextEl.focus) {
            nextEl.focus();
        }
    };

    SessionManagerModal.prototype.handleEnterKey = function (e, controlEl) {
        if (controlEl === this.filterInput && !e.isComposing) {
            var filtered = this.getNavigationSessions();
            if (filtered.length === 1) {
                e.preventDefault();
                this.onLoad(filtered[0].id);
            }
            return;
        }

        if (controlEl && controlEl.classList && controlEl.classList.contains('wpp-icon-btn') && this.contentEl.contains(controlEl)) {
            e.preventDefault();
            e.stopPropagation();
            controlEl.click();
            return;
        }

        if (controlEl && controlEl.tagName === 'BUTTON' && this.contentEl.contains(controlEl)) {
            e.preventDefault();
            e.stopPropagation();
            if (controlEl.classList.contains('wpp-load-btn')) {
                var row = controlEl.closest('.wpp-session-item');
                if (row && row.dataset && row.dataset.sessionId) {
                    this.onLoad(row.dataset.sessionId);
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

        if (this.keyboardTarget.zone === 'session-action' && this.keyboardTarget.rowIndex >= 0) {
            e.preventDefault();
            this.onFocusedLoad();
        }
    };

    SessionManagerModal.prototype.focusSessionTarget = function (target) {
        if (!target || target.zone !== 'session-action') return false;
        var rows = this.getVisibleRowElements();
        var rowIndex = typeof target.rowIndex === 'number' ? target.rowIndex : -1;
        if (rowIndex < 0 || rowIndex >= rows.length) return false;
        var actionTarget = this.getRowActionTarget(rows[rowIndex], target.actionKey);
        if (!actionTarget || !actionTarget.focus) return false;
        this.setKeyboardTarget({
            zone: 'session-action',
            rowIndex: rowIndex,
            actionKey: actionTarget.getAttribute('data-action-key') || target.actionKey || 'load',
        });
        actionTarget.focus();
        return true;
    };

    SessionManagerModal.prototype.normalizeKeyboardTargetAfterRender = function (sessions) {
        if (this.keyboardTarget.zone !== 'session-action') return;
        if (!sessions.length) {
            this.keyboardTarget = { zone: this.filterInput ? 'filter' : 'create-input', rowIndex: null, actionKey: null };
            return;
        }
        if (this.keyboardTarget.rowIndex >= sessions.length) {
            this.keyboardTarget.rowIndex = sessions.length - 1;
        } else if (this.keyboardTarget.rowIndex == null || this.keyboardTarget.rowIndex < 0) {
            this.keyboardTarget.rowIndex = 0;
        }
    };

    SessionManagerModal.prototype.blurFocusedControl = function () {
        var activeEl = document.activeElement;
        if (activeEl && this.contentEl.contains(activeEl) && activeEl.blur) {
            activeEl.blur();
        }
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
        this.normalizeKeyboardTargetAfterRender(sessions);
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
        var hintIndex = typeof orderIndex === 'number' ? orderIndex : index;
        var presentation = sessionPresenter.deriveSessionPresentation(session, {
            activeSessionId: this.plugin.data.activeSessionId,
            index: hintIndex,
            commandHotkey: hintIndex <= 8 ? this.plugin.getCommandHotkey('switch-to-' + (hintIndex + 1)) : '',
            defaultSessionName: this.plugin.getDefaultSessionName(),
        });
        var isActive = presentation.isActive;
        var self = this;

        var item = this.listEl.createDiv({ cls: 'wpp-session-item' });
        item.dataset.sessionId = presentation.id;

        // Click handler for focus / Cmd+Click selection
        item.addEventListener('click', function (e) {
            // Always move focus to clicked item
            self.setKeyboardTarget({ zone: 'session-action', rowIndex: index, actionKey: 'load' });

            if (e.target.closest('button, .wpp-icon-btn')) return;
            self.blurFocusedControl();
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
            sessionContextActions.openSessionContextMenu({
                plugin: self.plugin,
                app: self.app,
                session: session,
                isActive: isActive,
                event: e,
                showSwitch: true,
                showRemoveFromGroup: !!selectedGroupId,
                getViewGroupId: function () {
                    return self.getModalGroupId();
                },
                onSwitch: function () {
                    self.onLoad(session.id);
                },
                showMoveToGroup: self.plugin.isGroupFeatureEnabled() && self.plugin.getOrderedGroups().length > 0,
                forceDeleteConfirm: true,
                onGroupsChanged: function () {
                    self.renderGroupTabs();
                },
                onSessionsChanged: function () {
                    self.renderList();
                },
            });
        });

        // Hotkey hint
        item.createSpan({ text: presentation.hotkeyText, cls: 'wpp-session-index' });

        // Info section
        var info = item.createDiv({ cls: 'wpp-session-info' });
        var nameRow = info.createDiv({ cls: 'wpp-session-name-row' });
        nameRow.createSpan({ text: presentation.name, cls: 'wpp-session-name' });
        if (presentation.isDefault) {
            nameRow.createSpan({ text: L.defaultLabel, cls: 'wpp-default-label' });
        }
        if (isActive) {
            nameRow.createSpan({ text: L.active, cls: 'wpp-active-badge' });
        }
        info.createDiv({ text: presentation.modifiedText, cls: 'wpp-session-modified' });

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
            attr: { role: 'button', tabindex: '-1', 'data-action-key': 'rename' },
        });
        obsidian.setIcon(renameBtn, 'pencil');
        obsidian.setTooltip(renameBtn, L.rename, { delay: 250 });
        renameBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            self.onRename(session);
        });

        // Delete button (hidden for last remaining session)
        if (Object.keys(self.plugin.data.sessions).length > 1) {
            var deleteBtn = actions.createDiv({
                cls: 'wpp-icon-btn',
                attr: { role: 'button', tabindex: '-1', 'data-action-key': 'delete' },
            });
            obsidian.setIcon(deleteBtn, 'trash-2');
            obsidian.setTooltip(deleteBtn, L.delete, { delay: 250 });
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
        var self = this;
        sessionListActions.renameSessionWithPrompt({
            app: this.app,
            plugin: this.plugin,
            session: session,
            onRenamed: function () {
                self.renderList();
            },
        });
    };

    SessionManagerModal.prototype.onDelete = function (session) {
        var L = i18n.L;
        var self = this;
        var isActive = session.id === this.plugin.data.activeSessionId;
        var message = isActive
            ? L.confirmDeleteActive(session.name)
            : L.confirmDelete(session.name);
        return sessionListActions.deleteSessionWithPrompt({
            app: this.app,
            plugin: this.plugin,
            session: session,
            isActive: isActive,
            confirmMessage: message,
            forceConfirm: true,
            onDeleted: function () {
                self.renderList();
            },
        });
    };

    // --- Focus & selection helpers ---

    SessionManagerModal.prototype.updateFocusUI = function () {
        var self = this;
        var items = this.listEl.querySelectorAll('.wpp-session-item');
        var focusedIndex = -1;
        if (this.keyboardTarget && this.keyboardTarget.zone === 'session-action') {
            focusedIndex = typeof this.keyboardTarget.rowIndex === 'number'
                ? this.keyboardTarget.rowIndex
                : -1;
        }
        this.focusedIndex = focusedIndex;
        items.forEach(function (el, i) {
            el.classList.toggle('wpp-focused', i === focusedIndex);
        });
        if (focusedIndex >= 0 && items[focusedIndex]) {
            items[focusedIndex].scrollIntoView({ block: 'nearest' });
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
        var rowIndex = this.keyboardTarget && this.keyboardTarget.zone === 'session-action'
            ? this.keyboardTarget.rowIndex
            : this.focusedIndex;
        if (rowIndex == null || rowIndex < 0 || rowIndex >= sessions.length) return;
        this.onLoad(sessions[rowIndex].id);
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
        groupTabUi.renderGroupTabs({
            app: this.app,
            plugin: this.plugin,
            containerEl: el,
            groups: groups,
            groupOrder: groupOrder,
            selectedGroupId: selectedGroupId,
            onSelectGroup: function (groupId) {
                self.selectGroup(groupId);
            },
            onResetViewGroup: function () {
                self.modalGroupId = null;
            },
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
            onGroupOrderCommit: function (newOrder) {
                self.plugin.setGroupTabOrder(newOrder);
            },
            addButtonTooltip: L.groupCreateNew,
            onAddGroupClick: function () {
                groupTabUi.openCreateGroupPrompt(self.app, self.plugin, function () {
                    self.renderGroupTabs();
                });
            },
        });
    };

    SessionManagerModal.prototype.onClose = function () {
        document.body.classList.remove('wpp-session-list-dragging');
        if (this.modalKeyHandler) {
            document.removeEventListener('keydown', this.modalKeyHandler, true);
            this.modalKeyHandler = null;
        }
        if (this.contentFocusHandler) {
            this.contentEl.removeEventListener('focusin', this.contentFocusHandler, true);
            this.contentFocusHandler = null;
        }
        this.contentEl.empty();
    };

    return SessionManagerModal;
})(obsidian.Modal);

module.exports = SessionManagerModal;
