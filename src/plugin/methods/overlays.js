'use strict';

var obsidian = require('obsidian');
var i18n = require('../../i18n.ts');
var ConfirmModal = require('../../modals/confirm-modal.ts').ConfirmModal;
var groupTabUi = require('../../group-tab-ui.ts');
var navigationUtils = require('../../navigation-utils.ts');
var sessionPresenter = require('../../ui/shared/session-presenter.ts');
var sessionDrag = require('../../ui/shared/session-drag.ts');
var SwitchOverlay = require('../../ui/overlays/switch-overlay.ts').SwitchOverlay;
var searchOverlayKeys = require('../../search-overlay-key-handler');
var sessionContextActions = require('../../session-context-actions');
var settingsContextMenu = require('../../settings-context-menu');
var sessionListActions = require('../../session-list-actions');

function attachOverlayMethods(WorkspacePlusPlus) {
    // --- Switch overlay ---

    WorkspacePlusPlus.prototype.filterSessionsByQuery = function (sessions, query) {
        var q = (query || '').trim().toLowerCase();
        if (!q) return sessions.slice();
        return sessions.filter(function (s) {
            return (s.name || '').toLowerCase().indexOf(q) !== -1;
        });
    };

    WorkspacePlusPlus.prototype.openSearchOverlay = function (anchorEl) {
        var L = i18n.L;
        var self = this;
        var overlayGroupId = this.isGroupFeatureEnabled()
            ? (this.data.activeGroupId || null)
            : null;
        this.searchOverlayViewGroupId = overlayGroupId;
        var ordered = this.getOrderedSessionsForGroup(overlayGroupId);
        var focusTarget = this.data.overlayDefaultFocus || 'current-session';

        this.hideSwitchOverlay();
        this.hideSearchOverlay();

        var filtered = ordered.slice();
        var selectedIndex = 0;
        var keyboardNav = false;

        function syncSelectedIndexToActive(options) {
            selectedIndex = searchOverlayKeys.syncSearchOverlaySelectedIndex(self, filtered, selectedIndex, options || {});
        }
        syncSelectedIndexToActive();

        function getOverlayGroupId() {
            if (!self.isGroupFeatureEnabled()) {
                overlayGroupId = null;
                self.searchOverlayViewGroupId = null;
                return null;
            }
            var groups = self.data.groups || {};
            if (overlayGroupId && !groups[overlayGroupId]) {
                overlayGroupId = self.data.activeGroupId || null;
            }
            self.searchOverlayViewGroupId = overlayGroupId || null;
            return overlayGroupId || null;
        }

        function applyOverlayGroupSelection(groupId) {
            return self.resolveGroupSelection(groupId).then(function (result) {
                overlayGroupId = result.resolvedGroupId || null;
                self.searchOverlayViewGroupId = overlayGroupId;
                renderGroupTabs();
                refreshOrderedSessions();
                return result.switched;
            });
        }

        var overlay = document.createElement('div');
        overlay.className = 'wpp-switch-overlay wpp-search-overlay';
        overlay.tabIndex = -1;

        // Resize handles at four corners
        var corners = ['tl', 'tr', 'bl', 'br'];
        for (var ci = 0; ci < corners.length; ci++) {
            var corner = document.createElement('div');
            corner.className = 'wpp-resize-corner wpp-resize-' + corners[ci];
            corner.dataset.corner = corners[ci];
            overlay.appendChild(corner);
        }

        // Resize handles at four edges
        var edges = ['top', 'right', 'bottom', 'left'];
        for (var ei = 0; ei < edges.length; ei++) {
            var edgeEl = document.createElement('div');
            edgeEl.className = 'wpp-resize-edge wpp-resize-' + edges[ei];
            edgeEl.dataset.edge = edges[ei];
            overlay.appendChild(edgeEl);
        }

        // Header row: count + close button
        var headerRow = document.createElement('div');
        headerRow.className = 'wpp-search-header';

        var countSpan = document.createElement('div');
        countSpan.className = 'wpp-switch-count';
        headerRow.appendChild(countSpan);

        var closeBtn = document.createElement('div');
        closeBtn.className = 'wpp-search-close';
        obsidian.setIcon(closeBtn, 'x');
        closeBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            self.hideSearchOverlay();
        });
        headerRow.appendChild(closeBtn);

        overlay.appendChild(headerRow);

        // Save section (same as main modal)
        var saveRow = document.createElement('div');
        saveRow.className = 'wpp-save-container';
        var saveInput = document.createElement('input');
        saveInput.type = 'text';
        saveInput.className = 'wpp-save-input';
        saveInput.placeholder = L.savePlaceholder;
        saveRow.appendChild(saveInput);
        var saveBtn = document.createElement('button');
        saveBtn.className = 'wpp-save-btn';
        saveBtn.textContent = L.save;
        saveRow.appendChild(saveBtn);

        function onOverlaySave() {
            var selectedGroupId = getOverlayGroupId();
            self.createSessionForViewedGroup(saveInput.value, selectedGroupId).then(function (result) {
                if (!result || !result.created) return;
                var createdName = result.name;
                overlayGroupId = result.viewGroupId || null;
                self.searchOverlayViewGroupId = overlayGroupId;
                saveInput.value = '';
                new obsidian.Notice(L.created(createdName));
                renderGroupTabs();
                refreshOrderedSessions();
            });
        }

        saveBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            onOverlaySave();
        });
        saveInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.isComposing) {
                e.stopPropagation();
                onOverlaySave();
            }
        });
        overlay.appendChild(saveRow);

        // Search / filter section
        var searchRow = document.createElement('div');
        searchRow.className = 'wpp-search-row';
        var searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'wpp-search-input';
        searchInput.placeholder = L.searchOverlayPlaceholder;
        searchRow.appendChild(searchInput);
        this.searchOverlayInputEl = searchInput;
        if (!self.data.showFilterInput) {
            searchRow.style.display = 'none';
        }
        overlay.appendChild(searchRow);

        // Group tabs row
        var groupTabsRow = document.createElement('div');
        groupTabsRow.className = 'wpp-group-tabs';

        function stripSaveHint(text) {
            return text.replace(/  \/  ⇧.+?  \/  /, '  /  ');
        }

        function renderGroupTabs() {
            while (groupTabsRow.firstChild) groupTabsRow.removeChild(groupTabsRow.firstChild);
            var autoSave = self.isAutoSaveOnSwitchEnabled();
            if (!self.isGroupFeatureEnabled()) {
                groupTabsRow.style.display = 'none';
                footerRow.textContent = autoSave ? stripSaveHint(L.searchOverlayHelp) : L.searchOverlayHelp;
                return;
            }
            var groups = self.data.groups || {};
            var realGroups = self.getOrderedGroups();
            groupTabsRow.style.display = '';
            var helpText = realGroups.length > 0
                ? (L.searchOverlayHelpWithGroups || L.searchOverlayHelp)
                : L.searchOverlayHelp;
            footerRow.textContent = autoSave ? stripSaveHint(helpText) : helpText;

            var groupOrder = self.getOrderedGroupTabIds();
            groupTabUi.renderGroupTabs({
                app: self.app,
                plugin: self,
                containerEl: groupTabsRow,
                groups: groups,
                groupOrder: groupOrder,
                selectedGroupId: getOverlayGroupId(),
                stopPropagationOnMouseDown: true,
                onSelectGroup: function (groupId) {
                    applyOverlayGroupSelection(groupId);
                },
                onResetViewGroup: function () {
                    overlayGroupId = null;
                    self.searchOverlayViewGroupId = null;
                },
                onDeleteGroup: function (deletedGroupId) {
                    if (overlayGroupId === deletedGroupId) {
                        overlayGroupId = self.data.activeGroupId || null;
                        self.searchOverlayViewGroupId = overlayGroupId || null;
                    }
                },
                onGroupsChanged: function () {
                    renderGroupTabs();
                },
                onSessionsChanged: function () {
                    refreshOrderedSessions();
                },
                onGroupOrderCommit: function (newOrder) {
                    self.setGroupTabOrder(newOrder);
                },
                addButtonTooltip: L.groupCreateNew,
                onAddGroupClick: function () {
                    groupTabUi.openCreateGroupPrompt(self.app, self, function () {
                        renderGroupTabs();
                        refreshOrderedSessions();
                    });
                },
            });
        }

        overlay.appendChild(groupTabsRow);

        var list = document.createElement('div');
        list.className = 'wpp-switch-list wpp-search-list';
        overlay.appendChild(list);

        var emptyEl = document.createElement('div');
        emptyEl.className = 'wpp-search-empty';
        emptyEl.textContent = L.noFilteredSessions;
        overlay.appendChild(emptyEl);

        var footerRow = document.createElement('div');
        footerRow.className = 'wpp-switch-footer';
        overlay.appendChild(footerRow);

        // Initial render of group tabs (also sets footer text)
        renderGroupTabs();

        self._refreshOverlaySessions = refreshOrderedSessions;
        function refreshOrderedSessions() {
            ordered = self.getOrderedSessionsForGroup(getOverlayGroupId());
            filtered = self.filterSessionsByQuery(ordered, searchInput.value);
            syncSelectedIndexToActive({ preserveWhenMissing: true });
            renderList();
        }

        function renderList() {
            while (list.firstChild) list.removeChild(list.firstChild);
            if (filtered.length === 0) {
                selectedIndex = -1;
                countSpan.textContent = '0 / 0';
                // Show appropriate message: empty group vs no search results
                if (getOverlayGroupId() && ordered.length === 0) {
                    emptyEl.textContent = L.noGroupSessions;
                } else {
                    emptyEl.textContent = L.noFilteredSessions;
                }
                list.style.display = 'none';
                emptyEl.style.display = 'flex';
                return;
            }

            if (selectedIndex < 0 || selectedIndex >= filtered.length) {
                var activeIdx = self.findActiveSessionIndex(filtered);
                selectedIndex = activeIdx !== -1 ? activeIdx : 0;
            }

            list.style.display = '';
            emptyEl.style.display = 'none';
            countSpan.textContent = (selectedIndex + 1) + ' / ' + filtered.length;

            for (var i = 0; i < filtered.length; i++) {
                var session = filtered[i];
                var presentation = sessionPresenter.deriveSessionPresentation(session, {
                    activeSessionId: self.data.activeSessionId,
                });
                var isActive = presentation.isActive;
                var item = document.createElement('div');
                item.className = 'wpp-switch-item';
                if (i === selectedIndex) item.classList.add('wpp-kb-selected');
                item.dataset.sessionId = presentation.id;

                // Info column (name + modified time)
                var infoCol = document.createElement('div');
                infoCol.className = 'wpp-qs-info-col';

                var nameRow = document.createElement('div');
                nameRow.className = 'wpp-qs-name-row';

                var name = document.createElement('div');
                name.className = 'wpp-switch-name';
                name.textContent = presentation.name;
                nameRow.appendChild(name);

                infoCol.appendChild(nameRow);

                // Modified timestamp
                var modifiedEl = document.createElement('div');
                modifiedEl.className = 'wpp-qs-modified';
                modifiedEl.textContent = presentation.modifiedText;
                infoCol.appendChild(modifiedEl);

                item.appendChild(infoCol);

                if (isActive) {
                    var badge = document.createElement('span');
                    badge.className = 'wpp-active-badge';
                    badge.textContent = L.active;
                    item.appendChild(badge);
                }

                // Action icons (save?, rename & delete)
                var actions = document.createElement('div');
                actions.className = 'wpp-qs-actions';

                // Save & reload icons (only for active session when auto-save is disabled)
                var saveIcon = null;
                var reloadIcon = null;
                if (isActive && !self.isAutoSaveOnSwitchEnabled()) {
                    saveIcon = document.createElement('div');
                    saveIcon.className = 'wpp-qs-action-btn';
                    obsidian.setIcon(saveIcon, 'save');
                    obsidian.setTooltip(saveIcon, L.saveInline, { delay: 250 });
                    actions.appendChild(saveIcon);

                    reloadIcon = document.createElement('div');
                    reloadIcon.className = 'wpp-qs-action-btn';
                    obsidian.setIcon(reloadIcon, 'rotate-ccw');
                    obsidian.setTooltip(reloadIcon, L.contextReloadSession, { delay: 250 });
                    actions.appendChild(reloadIcon);
                }

                var renameIcon = document.createElement('div');
                renameIcon.className = 'wpp-qs-action-btn';
                obsidian.setIcon(renameIcon, 'pencil');
                obsidian.setTooltip(renameIcon, L.rename, { delay: 250 });
                actions.appendChild(renameIcon);

                var deleteIcon = document.createElement('div');
                deleteIcon.className = 'wpp-qs-action-btn';
                obsidian.setIcon(deleteIcon, 'trash-2');
                obsidian.setTooltip(deleteIcon, L.delete, { delay: 250 });
                actions.appendChild(deleteIcon);

                item.appendChild(actions);

                (function (idx, sess, itemEl, _saveIcon, _reloadIcon, _isActive) {
                    // Click on item to switch
                    itemEl.addEventListener('click', function (e) {
                        if (e.target.closest('.wpp-qs-action-btn')) return;
                        selectedIndex = idx;
                        switchSelected();
                    });

                    // Drag to reorder
                    setupDrag(itemEl);

                    // Mouse hover updates selection (when not in keyboard mode)
                    itemEl.addEventListener('mouseenter', function () {
                        if (keyboardNav) return;
                        selectedIndex = idx;
                        updateSelection();
                    });

                    // Right-click context menu
                    itemEl.addEventListener('contextmenu', function (e) {
                        e.preventDefault();
                        var selectedGroupId = getOverlayGroupId();
                        sessionContextActions.openSessionContextMenu({
                            plugin: self,
                            app: self.app,
                            session: sess,
                            isActive: _isActive,
                            event: e,
                            showSwitch: true,
                            showRemoveFromGroup: !!selectedGroupId,
                            getViewGroupId: getOverlayGroupId,
                            onSwitch: function () {
                                selectedIndex = idx;
                                switchSelected();
                            },
                            showMoveToGroup: self.isGroupFeatureEnabled() && self.getOrderedGroups().length > 0,
                            deleteConfirmMessage: L.confirmDeleteActive(sess.name),
                            onGroupsChanged: renderGroupTabs,
                            onSessionsChanged: refreshOrderedSessions,
                        });
                    });

                    // Save
                    if (_saveIcon) {
                        _saveIcon.addEventListener('click', function (e) {
                            e.stopPropagation();
                            var doSave = function () {
                                self.saveActiveSession().then(function () {
                                    refreshOrderedSessions();
                                });
                            };
                            if (self.data.confirmQuickActions) {
                                new ConfirmModal(self.app, L.confirmSaveSession(sess.name), doSave, { confirmText: L.saveInline, confirmClass: 'mod-cta' }).open();
                            } else {
                                doSave();
                            }
                        });
                    }

                    // Reload
                    if (_reloadIcon) {
                        _reloadIcon.addEventListener('click', function (e) {
                            e.stopPropagation();
                            var doReload = function () {
                                self.reloadCurrentSessionWithoutSaving();
                            };
                            if (self.data.confirmQuickActions) {
                                new ConfirmModal(self.app, L.confirmReloadSession(sess.name), doReload, { confirmText: L.load, confirmClass: 'mod-cta' }).open();
                            } else {
                                doReload();
                            }
                        });
                    }

                    // Rename
                    renameIcon.addEventListener('click', function (e) {
                        e.stopPropagation();
                        sessionListActions.renameSessionWithPrompt({
                            app: self.app,
                            plugin: self,
                            session: sess,
                            onRenamed: function () {
                                refreshOrderedSessions();
                            },
                        });
                    });

                    // Delete
                    deleteIcon.addEventListener('click', function (e) {
                        e.stopPropagation();
                        sessionListActions.deleteSessionWithPrompt({
                            app: self.app,
                            plugin: self,
                            session: sess,
                            isActive: _isActive,
                            confirmMessage: L.confirmDeleteActive(sess.name),
                            onDeleted: function () {
                                refreshOrderedSessions();
                            },
                        });
                    });
                })(i, session, item, saveIcon, reloadIcon, isActive);

                list.appendChild(item);
            }

            // Scroll selected (active) item into view
            var selectedItem = list.querySelector('.wpp-kb-selected');
            if (selectedItem) {
                selectedItem.scrollIntoView({ block: 'nearest' });
            }
        }

        // --- Drag to reorder ---
        function setupDrag(dragItem) {
            sessionDrag.attachSessionDrag({
                itemEl: dragItem,
                listEl: list,
                itemSelector: '.wpp-switch-item',
                ignoreSelector: '.wpp-qs-action-btn',
                groupTabsContainer: groupTabsRow,
                onDropOnGroup: function (sessionId, groupId) {
                    var sessionName = (self.data.sessions[sessionId] || {}).name || '';
                    var groupName = (self.data.groups[groupId] || {}).name || '';
                    return self.moveSessionToGroupExclusive(sessionId, groupId).then(function () {
                        new obsidian.Notice(i18n.L.groupAddedSession(sessionName, groupName));
                        renderGroupTabs();
                        refreshOrderedSessions();
                    });
                },
                onDropOnAllGroup: function (sessionId) {
                    var currentGroupId = getOverlayGroupId();
                    if (currentGroupId) {
                        var rmSessionName = (self.data.sessions[sessionId] || {}).name || '';
                        var rmGroupName = (self.data.groups[currentGroupId] || {}).name || '';
                        return self.removeSessionFromGroup(sessionId, currentGroupId).then(function () {
                            new obsidian.Notice(i18n.L.groupRemovedSession(rmSessionName, rmGroupName));
                            renderGroupTabs();
                            refreshOrderedSessions();
                        });
                    }
                },
                onReorder: function (newVisibleOrder) {
                    self.setSessionOrderFromVisible(newVisibleOrder);
                    dragItem.classList.add('wpp-just-moved');
                    setTimeout(function () {
                        dragItem.classList.remove('wpp-just-moved');
                    }, 600);
                },
            });
        }

        function updateSelection() {
            var items = list.querySelectorAll('.wpp-switch-item');
            for (var si = 0; si < items.length; si++) {
                items[si].classList.toggle('wpp-kb-selected', si === selectedIndex);
            }
            if (filtered.length > 0) {
                countSpan.textContent = (selectedIndex + 1) + ' / ' + filtered.length;
            }
            if (keyboardNav && items[selectedIndex]) {
                items[selectedIndex].scrollIntoView({ block: 'nearest' });
            }
        }

        function setKeyboardNavState(value) {
            keyboardNav = !!value;
            overlay.classList.toggle('wpp-keyboard-nav', keyboardNav);
        }

        function focusSaveInput() {
            setKeyboardNavState(false);
            navigationUtils.focusTextInputEnd(saveInput);
        }

        function focusSearchInput() {
            setKeyboardNavState(false);
            navigationUtils.focusTextInputSelect(searchInput);
        }

        function focusResultAt(index) {
            if (!filtered.length) return;
            setKeyboardNavState(true);
            selectedIndex = index;
            updateSelection();
            overlay.focus();
        }

        function focusFirstResult() {
            focusResultAt(0);
        }

        function focusLastResult() {
            focusResultAt(filtered.length - 1);
        }

        // Exit keyboard mode when mouse moves over the list
        list.addEventListener('mousemove', function () {
            if (keyboardNav) {
                setKeyboardNavState(false);
            }
        });

        function switchSelected(opts) {
            opts = opts || {};
            if (selectedIndex < 0 || selectedIndex >= filtered.length) return;
            var target = filtered[selectedIndex];
            if (target.id === self.data.activeSessionId) {
                if (opts.shiftKey) {
                    var doSave = function () {
                        self.saveActiveSession().then(function () {
                            refreshOrderedSessions();
                        });
                    };
                    if (self.data.confirmQuickActions) {
                        new ConfirmModal(self.app, L.confirmSaveSession(target.name), doSave, { confirmText: L.saveInline, confirmClass: 'mod-cta' }).open();
                    } else {
                        doSave();
                    }
                } else {
                    var doReload = function () {
                        self.reloadCurrentSessionWithoutSaving();
                    };
                    if (self.data.confirmQuickActions) {
                        new ConfirmModal(self.app, L.confirmReloadSession(target.name), doReload, { confirmText: L.load, confirmClass: 'mod-cta' }).open();
                    } else {
                        doReload();
                    }
                }
                self.hideSearchOverlay();
                return;
            }
            self.switchSession(target.id, { silent: true }).then(function (switched) {
                if (switched) self.hideSearchOverlay();
            });
        }

        this.searchOverlayInputHandler = function () {
            filtered = self.filterSessionsByQuery(ordered, searchInput.value);
            syncSelectedIndexToActive();
            renderList();
        };

        this.searchOverlayKeyHandler = searchOverlayKeys.createSearchOverlayKeyHandler({
            plugin: self,
            overlay: overlay,
            saveInput: saveInput,
            saveBtn: saveBtn,
            searchInput: searchInput,
            getOverlayGroupId: getOverlayGroupId,
            applyOverlayGroupSelection: applyOverlayGroupSelection,
            switchSelected: switchSelected,
            refreshOrderedSessions: refreshOrderedSessions,
            updateSelection: updateSelection,
            focusSaveInput: focusSaveInput,
            focusSearchInput: focusSearchInput,
            focusFirstResult: focusFirstResult,
            focusLastResult: focusLastResult,
            hasSearchInput: function () { return !!self.data.showFilterInput; },
            getFiltered: function () { return filtered; },
            getSelectedIndex: function () { return selectedIndex; },
            setSelectedIndex: function (value) { selectedIndex = value; },
            setKeyboardNav: setKeyboardNavState,
        });

        this.searchOverlayClickOutsideHandler = function (e) {
            if (!self.searchOverlayEl) return;
            // Don't close if a modal (rename/confirm) is open
            if (searchOverlayKeys.hasBlockingModal()) return;
            // Let status bar handle its own toggle
            if (self.statusBarEl && self.statusBarEl.contains(e.target)) return;
            if (!self.searchOverlayEl.contains(e.target)) {
                self.hideSearchOverlay();
            }
        };

        searchInput.addEventListener('input', this.searchOverlayInputHandler);
        document.addEventListener('keydown', this.searchOverlayKeyHandler, true);
        document.addEventListener('mousedown', this.searchOverlayClickOutsideHandler, true);

        document.body.appendChild(overlay);
        this.searchOverlayEl = overlay;
        setKeyboardNavState(focusTarget === 'current-session');
        renderList();

        // Position overlay relative to anchor (status bar button)
        var margin = 8;

        var STATUS_BAR_FALLBACK_HEIGHT = 28;
        var MIN_VISIBLE_HEIGHT = 20;

        function cacheStatusBarMetrics() {
            var aEl = anchorEl || self.statusBarEl;
            var statusBar = aEl ? aEl.closest('.status-bar') : document.querySelector('.status-bar');
            if (statusBar) {
                var h = statusBar.getBoundingClientRect().height;
                if (h >= MIN_VISIBLE_HEIGHT) {
                    self._cachedBarHeight = h;
                }
            }
            if (aEl) {
                var aRect = aEl.getBoundingClientRect();
                if (aRect.width > 0 && aRect.height > 0) {
                    self._cachedAnchorCenterX = aRect.left + aRect.width / 2;
                }
            }
        }

        // Cache now while bar may be visible
        cacheStatusBarMetrics();

        function positionToAnchor() {
            var oRect = overlay.getBoundingClientRect();
            var barHeight = self._cachedBarHeight || STATUS_BAR_FALLBACK_HEIGHT;

            // Horizontal: use cached anchor center, or viewport center
            var centerX = self._cachedAnchorCenterX || window.innerWidth / 2;
            var lp = centerX - oRect.width / 2;
            lp = Math.max(margin, Math.min(lp, window.innerWidth - oRect.width - margin));

            // Vertical: always position above status bar area
            var bp = barHeight + margin;
            if (bp + oRect.height > window.innerHeight - margin) {
                bp = margin;
            }

            overlay.style.right = 'auto';
            overlay.style.top = 'auto';
            overlay.style.left = lp + 'px';
            overlay.style.bottom = bp + 'px';
        }

        // Apply saved size
        var savedSize = self.data.searchOverlaySize;
        var MIN_WIDTH = 220;
        var MIN_HEIGHT = 140;

        if (savedSize && savedSize.width != null && savedSize.height != null) {
            overlay.style.width = Math.max(MIN_WIDTH, savedSize.width) + 'px';
            overlay.style.height = Math.max(MIN_HEIGHT, savedSize.height) + 'px';
            overlay.style.minWidth = '0';
            overlay.style.maxWidth = 'none';
            list.style.maxHeight = 'none';
        }

        function resetSize() {
            overlay.style.width = '';
            overlay.style.height = '';
            overlay.style.minWidth = '';
            overlay.style.maxWidth = '';
            list.style.maxHeight = '';
        }

        // Position: saved position > anchor-based > CSS default
        var savedPos = self.data.searchOverlayPosition;

        if (savedPos && savedPos.left != null && savedPos.bottom != null) {
            var overlayRect = overlay.getBoundingClientRect();
            var sl = Math.max(margin, Math.min(savedPos.left, window.innerWidth - overlayRect.width - margin));
            var sb = Math.max(margin, Math.min(savedPos.bottom, window.innerHeight - overlayRect.height - margin));
            overlay.style.right = 'auto';
            overlay.style.top = 'auto';
            overlay.style.left = sl + 'px';
            overlay.style.bottom = sb + 'px';
        } else {
            positionToAnchor();
        }

        // Double-click on empty area to reset position and size
        overlay.addEventListener('dblclick', function (e) {
            if (e.target.closest('.wpp-search-close')) return;
            if (e.target.closest('.wpp-switch-item')) return;
            if (e.target.closest('.wpp-search-input')) return;
            if (e.target.closest('.wpp-qs-action-btn')) return;
            resetSize();
            positionToAnchor();
            self.data.searchOverlayPosition = null;
            self.data.searchOverlaySize = null;
            self.persistData();
        });

        // Right-click on empty area → settings context menu
        overlay.addEventListener('contextmenu', function (e) {
            if (e.target.closest('.wpp-switch-item')) return;
            if (e.target.closest('.wpp-search-input')) return;
            if (e.target.closest('.wpp-search-close')) return;
            if (e.target.closest('.wpp-qs-action-btn')) return;
            if (e.target.closest('.wpp-group-tab')) return;
            e.preventDefault();
            settingsContextMenu.openSettingsContextMenu({
                plugin: self,
                app: self.app,
                event: e,
                showResetOverlay: true,
                onResetOverlay: function () {
                    resetSize();
                    positionToAnchor();
                    self.data.searchOverlayPosition = null;
                    self.data.searchOverlaySize = null;
                    self.persistData();
                },
                onChanged: function () {
                    searchRow.style.display = self.data.showFilterInput ? '' : 'none';
                    renderGroupTabs();
                    refreshOrderedSessions();
                },
            });
        });

        // Resize via corner and edge handles
        overlay.addEventListener('mousedown', function (e) {
            var cornerEl = e.target.closest('.wpp-resize-corner');
            var edgeEl = !cornerEl ? e.target.closest('.wpp-resize-edge') : null;
            if (!cornerEl && !edgeEl) return;
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();

            var dir = cornerEl ? cornerEl.dataset.corner : null;
            var edge = edgeEl ? edgeEl.dataset.edge : null;
            var startX = e.clientX;
            var startY = e.clientY;
            var startRect = overlay.getBoundingClientRect();
            var startWidth = startRect.width;
            var startHeight = startRect.height;
            var startLeft = startRect.left;
            var startBottom = window.innerHeight - startRect.bottom;

            function onMove(ev) {
                var dx = ev.clientX - startX;
                var dy = ev.clientY - startY;
                var newWidth = startWidth;
                var newHeight = startHeight;
                var newLeft = startLeft;
                var newBottom = startBottom;

                // Horizontal
                var moveRight = dir === 'tr' || dir === 'br' || edge === 'right';
                var moveLeft  = dir === 'tl' || dir === 'bl' || edge === 'left';
                if (moveRight) {
                    newWidth = Math.max(MIN_WIDTH, startWidth + dx);
                } else if (moveLeft) {
                    newWidth = Math.max(MIN_WIDTH, startWidth - dx);
                    newLeft = startLeft + (startWidth - newWidth);
                }

                // Vertical
                var moveTop    = dir === 'tl' || dir === 'tr' || edge === 'top';
                var moveBottom = dir === 'bl' || dir === 'br' || edge === 'bottom';
                if (moveTop) {
                    newHeight = Math.max(MIN_HEIGHT, startHeight - dy);
                } else if (moveBottom) {
                    newHeight = Math.max(MIN_HEIGHT, startHeight + dy);
                    newBottom = startBottom - (newHeight - startHeight);
                    if (newBottom < margin) {
                        newHeight = startHeight + startBottom - margin;
                        newBottom = margin;
                    }
                }

                // Enforce minimum sizes
                newWidth = Math.max(MIN_WIDTH, newWidth);
                newHeight = Math.max(MIN_HEIGHT, newHeight);

                // Clamp to viewport — ensure all edges stay within margin
                if (newLeft < margin) newLeft = margin;
                if (newLeft + newWidth > window.innerWidth - margin) {
                    newLeft = window.innerWidth - margin - newWidth;
                    if (newLeft < margin) newLeft = margin;
                }
                if (newBottom < margin) newBottom = margin;
                if (window.innerHeight - newBottom - newHeight < margin) {
                    newBottom = window.innerHeight - newHeight - margin;
                    if (newBottom < margin) newBottom = margin;
                }

                overlay.style.width = newWidth + 'px';
                overlay.style.height = newHeight + 'px';
                overlay.style.minWidth = '0';
                overlay.style.maxWidth = 'none';
                overlay.style.left = newLeft + 'px';
                overlay.style.bottom = newBottom + 'px';
                overlay.style.right = 'auto';
                overlay.style.top = 'auto';
                list.style.maxHeight = 'none';
            }

            function onUp() {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);

                var finalRect = overlay.getBoundingClientRect();
                self.data.searchOverlaySize = {
                    width: finalRect.width,
                    height: finalRect.height,
                };
                self.data.searchOverlayPosition = {
                    left: finalRect.left,
                    bottom: window.innerHeight - finalRect.bottom,
                };
                self.persistData();
            }

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });

        // Drag to reposition overlay via any empty area
        overlay.addEventListener('mousedown', function (e) {
            if (e.target.closest('.wpp-search-close')) return;
            if (e.target.closest('.wpp-switch-item')) return;
            if (e.target.closest('.wpp-search-input')) return;
            if (e.target.closest('.wpp-save-input')) return;
            if (e.target.closest('.wpp-save-btn')) return;
            if (e.target.closest('.wpp-group-tab')) return;
            if (e.target.closest('.wpp-group-add-btn')) return;
            if (e.target.closest('.wpp-group-tabs')) return;
            if (e.target.closest('.wpp-qs-action-btn')) return;
            if (e.target.closest('.wpp-resize-corner')) return;
            if (e.button !== 0) return;
            e.preventDefault();
            overlay.classList.add('wpp-dragging');

            var rect = overlay.getBoundingClientRect();
            var offsetX = e.clientX - rect.left;
            var offsetY = e.clientY - rect.top;

            function onMove(ev) {
                var newLeft = ev.clientX - offsetX;
                var newTop = ev.clientY - offsetY;
                var oRect = overlay.getBoundingClientRect();
                newLeft = Math.max(margin, Math.min(newLeft, window.innerWidth - oRect.width - margin));
                newTop = Math.max(margin, Math.min(newTop, window.innerHeight - oRect.height - margin));
                var newBottom = window.innerHeight - newTop - oRect.height;
                overlay.style.right = 'auto';
                overlay.style.top = 'auto';
                overlay.style.left = newLeft + 'px';
                overlay.style.bottom = newBottom + 'px';
            }

            function onUp() {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                overlay.classList.remove('wpp-dragging');

                // Save position (bottom-based for stable positioning on resize)
                var finalRect = overlay.getBoundingClientRect();
                self.data.searchOverlayPosition = {
                    left: finalRect.left,
                    bottom: window.innerHeight - finalRect.bottom,
                };
                self.persistData();
            }

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });

        if (focusTarget !== 'session-create') {
            var guardHandler = function (e) {
                if (e.target === saveInput) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    if (focusTarget === 'session-filter' && self.data.showFilterInput) {
                        searchInput.focus();
                    } else {
                        overlay.focus();
                    }
                }
            };
            overlay.addEventListener('focusin', guardHandler, true);
            setTimeout(function () {
                overlay.removeEventListener('focusin', guardHandler, true);
            }, 300);
        }

        setTimeout(function () {
            if (focusTarget === 'session-filter' && self.data.showFilterInput) {
                navigationUtils.focusTextInputSelect(searchInput);
            } else if (focusTarget === 'session-create') {
                saveInput.focus();
            } else {
                overlay.focus();
            }
        }, 20);
    };

    WorkspacePlusPlus.prototype.getSwitchOverlay = function () {
        if (!this._switchOverlay) {
            this._switchOverlay = new SwitchOverlay(this);
        }
        return this._switchOverlay;
    };

    Object.defineProperty(WorkspacePlusPlus.prototype, 'switchOverlayEl', {
        get: function () {
            return this.getSwitchOverlay().overlayEl;
        },
        set: function (val) {
            this.getSwitchOverlay().overlayEl = val;
        },
        configurable: true,
        enumerable: true,
    });

    Object.defineProperty(WorkspacePlusPlus.prototype, 'switchOverlayViewGroupId', {
        get: function () {
            return this.getSwitchOverlay().viewGroupId;
        },
        set: function (val) {
            this.getSwitchOverlay().viewGroupId = val;
        },
        configurable: true,
        enumerable: true,
    });

    Object.defineProperty(WorkspacePlusPlus.prototype, 'switchOverlayTimer', {
        get: function () {
            return this.getSwitchOverlay().timer;
        },
        set: function (val) {
            this.getSwitchOverlay().timer = val;
        },
        configurable: true,
        enumerable: true,
    });

    Object.defineProperty(WorkspacePlusPlus.prototype, 'overlayKeyUpHandler', {
        get: function () {
            return this.getSwitchOverlay().keyUpHandler;
        },
        set: function (val) {
            this.getSwitchOverlay().keyUpHandler = val;
        },
        configurable: true,
        enumerable: true,
    });

    Object.defineProperty(WorkspacePlusPlus.prototype, 'overlayKeyDownHandler', {
        get: function () {
            return this.getSwitchOverlay().keyDownHandler;
        },
        set: function (val) {
            this.getSwitchOverlay().keyDownHandler = val;
        },
        configurable: true,
        enumerable: true,
    });

    Object.defineProperty(WorkspacePlusPlus.prototype, 'overlayBlurHandler', {
        get: function () {
            return this.getSwitchOverlay().blurHandler;
        },
        set: function (val) {
            this.getSwitchOverlay().blurHandler = val;
        },
        configurable: true,
        enumerable: true,
    });

    WorkspacePlusPlus.prototype.showSwitchPreviewOverlay = function (ordered, activeIndex, viewGroupId) {
        return this.getSwitchOverlay().showPreview(ordered, activeIndex, viewGroupId);
    };

    WorkspacePlusPlus.prototype.showSwitchFeedbackOverlay = function (ordered, activeIndex, viewGroupId, options) {
        return this.getSwitchOverlay().showFeedback(ordered, activeIndex, viewGroupId, options);
    };

    WorkspacePlusPlus.prototype.showSwitchOverlay = function (ordered, activeIndex, viewGroupId, options) {
        return this.getSwitchOverlay().show(ordered, activeIndex, viewGroupId, options);
    };

    WorkspacePlusPlus.prototype.cleanupOverlayListeners = function () {
        return this.getSwitchOverlay().cleanupListeners();
    };

    WorkspacePlusPlus.prototype.hideSwitchOverlay = function () {
        return this.getSwitchOverlay().hide();
    };

    WorkspacePlusPlus.prototype.hideSearchOverlay = function () {
        if (this.searchOverlayEl) {
            this.searchOverlayEl.remove();
            this.searchOverlayEl = null;
        }
        this.searchOverlayViewGroupId = null;
        if (this.searchOverlayInputHandler && this.searchOverlayInputEl) {
            this.searchOverlayInputEl.removeEventListener('input', this.searchOverlayInputHandler);
        }
        if (this.searchOverlayKeyHandler) {
            document.removeEventListener('keydown', this.searchOverlayKeyHandler, true);
            this.searchOverlayKeyHandler = null;
        }
        if (this.searchOverlayClickOutsideHandler) {
            document.removeEventListener('mousedown', this.searchOverlayClickOutsideHandler, true);
            this.searchOverlayClickOutsideHandler = null;
        }
        this.searchOverlayInputHandler = null;
        this.searchOverlayInputEl = null;
        this._refreshOverlaySessions = null;
    };
}

module.exports = attachOverlayMethods;
