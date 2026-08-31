'use strict';

var obsidian = require('obsidian');
var i18n = require('../../i18n.ts');
var ConfirmModal = require('../../modals/confirm-modal.ts').ConfirmModal;
var formatRelativeTime = require('../../modals/format-relative-time.ts').formatRelativeTime;
var groupTabUi = require('../../group-tab-ui');
var navigationUtils = require('../../navigation-utils.ts');
var utils = require('../../utils.ts');
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
                var isActive = session.id === self.data.activeSessionId;
                var item = document.createElement('div');
                item.className = 'wpp-switch-item';
                if (i === selectedIndex) item.classList.add('wpp-kb-selected');
                item.dataset.sessionId = session.id;

                // Info column (name + modified time)
                var infoCol = document.createElement('div');
                infoCol.className = 'wpp-qs-info-col';

                var nameRow = document.createElement('div');
                nameRow.className = 'wpp-qs-name-row';

                var name = document.createElement('div');
                name.className = 'wpp-switch-name';
                name.textContent = session.name;
                nameRow.appendChild(name);

                infoCol.appendChild(nameRow);

                // Modified timestamp
                var modifiedEl = document.createElement('div');
                modifiedEl.className = 'wpp-qs-modified';
                modifiedEl.textContent = formatRelativeTime(session.modified);
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
            dragItem.addEventListener('mousedown', function (e) {
                if (e.button !== 0) return;
                if (e.target.closest('.wpp-qs-action-btn')) return;

                var startX = e.clientX;
                var startY = e.clientY;
                var dragStarted = false;
                var cloneEl = null;

                function startDragOp(ev) {
                    dragStarted = true;
                    var rect = dragItem.getBoundingClientRect();
                    var offsetX = startX - rect.left;
                    var offsetY = startY - rect.top;

                    cloneEl = dragItem.cloneNode(true);
                    cloneEl.classList.add('wpp-drag-clone');
                    cloneEl.style.position = 'fixed';
                    cloneEl.style.width = rect.width + 'px';
                    cloneEl.style.top = (ev.clientY - offsetY) + 'px';
                    cloneEl.style.left = (ev.clientX - offsetX) + 'px';
                    cloneEl.style.zIndex = '9999';
                    cloneEl.style.pointerEvents = 'none';
                    document.body.appendChild(cloneEl);

                    dragItem.classList.add('is-dragging');
                    cloneEl._offsetX = offsetX;
                    cloneEl._offsetY = offsetY;
                }

                function updateOverlayGroupDropTarget(ev) {
                    var tabs = groupTabsRow.querySelectorAll('.wpp-group-tab');
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

                function clearOverlayGroupDropTargets() {
                    var tabs = groupTabsRow.querySelectorAll('.wpp-group-tab');
                    for (var t = 0; t < tabs.length; t++) {
                        tabs[t].classList.remove('wpp-group-drop-target');
                    }
                }

                function onMouseMove(ev) {
                    if (!dragStarted) {
                        var dx = ev.clientX - startX;
                        var dy = ev.clientY - startY;
                        if (Math.abs(dx) + Math.abs(dy) < 5) return;
                        startDragOp(ev);
                    }
                    cloneEl.style.top = (ev.clientY - cloneEl._offsetY) + 'px';
                    cloneEl.style.left = (ev.clientX - cloneEl._offsetX) + 'px';

                    // Check if hovering over a group tab
                    var hoverTab = updateOverlayGroupDropTarget(ev);
                    if (hoverTab) return; // Don't reorder while over group tabs

                    var siblings = list.querySelectorAll('.wpp-switch-item');
                    var placed = false;
                    for (var si = 0; si < siblings.length; si++) {
                        var el = siblings[si];
                        if (el === dragItem) continue;
                        var r = el.getBoundingClientRect();
                        if (ev.clientY < r.top + r.height / 2) {
                            list.insertBefore(dragItem, el);
                            placed = true;
                            break;
                        }
                    }
                    if (!placed) list.appendChild(dragItem);
                }

                function onMouseUp(ev) {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                    if (!dragStarted) return;

                    cloneEl.remove();
                    dragItem.classList.remove('is-dragging');

                    // Check if dropped on a group tab
                    var dropTab = updateOverlayGroupDropTarget(ev);
                    clearOverlayGroupDropTargets();

                    if (dropTab && dropTab.dataset.groupId && dropTab.dataset.groupId !== '__all__') {
                        var sessionId = dragItem.dataset.sessionId;
                        var groupId = dropTab.dataset.groupId;
                        var sessionName = (self.data.sessions[sessionId] || {}).name || '';
                        var groupName = (self.data.groups[groupId] || {}).name || '';
                        self.moveSessionToGroupExclusive(sessionId, groupId).then(function () {
                            new obsidian.Notice(i18n.L.groupAddedSession(sessionName, groupName));
                            renderGroupTabs();
                            refreshOrderedSessions();
                        });
                        return;
                    } else {
                        var currentGroupId = getOverlayGroupId();
                        if (dropTab && dropTab.dataset.groupId === '__all__' && currentGroupId) {
                        // Drop on "All" tab while viewing a group → remove from group
                            var rmSessionId = dragItem.dataset.sessionId;
                            var rmGroupId = currentGroupId;
                            var rmSessionName = (self.data.sessions[rmSessionId] || {}).name || '';
                            var rmGroupName = (self.data.groups[rmGroupId] || {}).name || '';
                            self.removeSessionFromGroup(rmSessionId, rmGroupId).then(function () {
                                new obsidian.Notice(i18n.L.groupRemovedSession(rmSessionName, rmGroupName));
                                renderGroupTabs();
                                refreshOrderedSessions();
                            });
                            return;
                        }
                    }

                    // Persist new order
                    var newVisibleOrder = [];
                    var items = list.querySelectorAll('.wpp-switch-item');
                    for (var ni = 0; ni < items.length; ni++) {
                        newVisibleOrder.push(items[ni].dataset.sessionId);
                    }
                    self.setSessionOrderFromVisible(newVisibleOrder);

                    dragItem.classList.add('wpp-just-moved');
                    setTimeout(function () {
                        dragItem.classList.remove('wpp-just-moved');
                    }, 600);
                }

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
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

    WorkspacePlusPlus.prototype.showSwitchPreviewOverlay = function (ordered, activeIndex, viewGroupId) {
        return this.showSwitchOverlay(ordered, activeIndex, viewGroupId, { mode: 'preview' });
    };

    WorkspacePlusPlus.prototype.showSwitchFeedbackOverlay = function (ordered, activeIndex, viewGroupId, options) {
        options = Object.assign({}, options, { mode: 'feedback' });
        return this.showSwitchOverlay(ordered, activeIndex, viewGroupId, options);
    };

    WorkspacePlusPlus.prototype.showSwitchOverlay = function (ordered, activeIndex, viewGroupId, options) {
        options = options || {};
        var L = i18n.L;
        if (this.clearSessionSwitchNotice) {
            this.clearSessionSwitchNotice();
        }
        this.hideSearchOverlay();
        // Clean up existing overlay and listeners
        this.cleanupOverlayListeners();
        if (this.switchOverlayEl) {
            this.switchOverlayEl.remove();
        }
        if (this.switchOverlayTimer) {
            clearTimeout(this.switchOverlayTimer);
        }
        var overlayGroupId = this.isGroupFeatureEnabled()
            ? (typeof viewGroupId === 'undefined'
                ? (this.data.activeGroupId || null)
                : (viewGroupId || null))
            : null;
        if (overlayGroupId && !(this.data.groups || {})[overlayGroupId]) {
            overlayGroupId = this.data.activeGroupId || null;
        }
        var overlayMode = options.mode || 'preview';
        var feedbackDurationMs = Math.max(0, Number(options.durationMs) || 400);
        this.switchOverlayViewGroupId = overlayGroupId;
        var self = this;

        function reopenOverlayForGroup(result) {
            var newOrdered = result.sessions;
            var newActiveIndex = self.getActiveSessionIndex(newOrdered);
            self.showSwitchOverlay(newOrdered, newActiveIndex, result.resolvedGroupId, options);
        }

        function onGroupTabClick(targetGroupId, e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            self.resolveGroupSelection(targetGroupId || null).then(reopenOverlayForGroup);
        }

        function onSessionItemClick(sessionId, e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            if (!sessionId) return;
            if (sessionId === self.data.activeSessionId) {
                self.hideSwitchOverlay();
                return;
            }
            self.switchSession(sessionId, { silent: true }).then(function (switched) {
                if (switched) self.hideSwitchOverlay();
            });
        }

        var overlay = document.createElement('div');
        overlay.className = 'wpp-switch-overlay';

        // Count
        var countSpan = document.createElement('div');
        countSpan.className = 'wpp-switch-count';
        countSpan.textContent = ordered.length > 0
            ? (activeIndex + 1) + ' / ' + ordered.length
            : '0 / 0';
        overlay.appendChild(countSpan);

        // Group tabs (only when groups exist)
        var realGroups = this.getOrderedGroups();
        if (realGroups.length > 0) {
            var groupTabsRow = document.createElement('div');
            groupTabsRow.className = 'wpp-group-tabs';

            var allGroups = this.data.groups || {};
            var groupOrder = this.getOrderedGroupTabIds();
            for (var gi = 0; gi < groupOrder.length; gi++) {
                var gid = groupOrder[gi];
                if (gid === '__all__') {
                    var allTab = document.createElement('div');
                    allTab.className = 'wpp-group-tab';
                    if (!overlayGroupId) allTab.classList.add('is-active');
                    allTab.textContent = L.groupAll;
                    allTab.addEventListener('click', function (e) {
                        onGroupTabClick(null, e);
                    });
                    groupTabsRow.appendChild(allTab);
                } else if (allGroups[gid]) {
                    var tab = document.createElement('div');
                    tab.className = 'wpp-group-tab';
                    if (overlayGroupId === gid) tab.classList.add('is-active');
                    tab.textContent = allGroups[gid].name;
                    (function (targetGroupId) {
                        tab.addEventListener('click', function (e) {
                            onGroupTabClick(targetGroupId, e);
                        });
                    })(gid);
                    groupTabsRow.appendChild(tab);
                }
            }

            overlay.appendChild(groupTabsRow);
        }

        // Session list
        var list = document.createElement('div');
        list.className = 'wpp-switch-list';

        for (var i = 0; i < ordered.length; i++) {
            var item = document.createElement('div');
            item.className = 'wpp-switch-item';
            if (i === activeIndex) {
                item.classList.add('is-active');
            }
            item.dataset.sessionId = ordered[i].id;

            var name = document.createElement('div');
            name.className = 'wpp-switch-name';
            name.textContent = ordered[i].name;
            item.appendChild(name);

            var hk = i <= 8 ? this.getCommandHotkey('switch-to-' + (i + 1)) : '';
            var hotkeyEl = document.createElement('div');
            hotkeyEl.className = 'wpp-switch-hotkey';
            hotkeyEl.textContent = hk || String(i + 1);
            item.appendChild(hotkeyEl);

            (function (targetSessionId) {
                item.addEventListener('click', function (e) {
                    onSessionItemClick(targetSessionId, e);
                });
            })(ordered[i].id);

            list.appendChild(item);
        }

        overlay.appendChild(list);

        // Footer
        var footerRow = document.createElement('div');
        footerRow.className = 'wpp-switch-footer';

        // Group hint (only when groups exist)
        if (realGroups.length > 0) {
            var groupLine = document.createElement('div');
            groupLine.textContent = (L.keyTab || 'Tab') + '  ' + L.switchGroup;
            footerRow.appendChild(groupLine);
        }

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

        // Measure max size using ALL sessions (unfiltered) before showing
        var allSessions = this.getOrderedSessionsUnfiltered();
        if (allSessions.length > ordered.length) {
            var measure = overlay.cloneNode(false);
            measure.style.visibility = 'hidden';
            measure.style.pointerEvents = 'none';
            // Clone count + group tabs
            for (var ci = 0; ci < overlay.childNodes.length; ci++) {
                if (overlay.childNodes[ci] === list) break;
                measure.appendChild(overlay.childNodes[ci].cloneNode(true));
            }
            // Build full session list for measurement
            var measureList = document.createElement('div');
            measureList.className = 'wpp-switch-list';
            for (var mi = 0; mi < allSessions.length; mi++) {
                var mItem = document.createElement('div');
                mItem.className = 'wpp-switch-item';
                var mName = document.createElement('div');
                mName.className = 'wpp-switch-name';
                mName.textContent = allSessions[mi].name;
                mItem.appendChild(mName);
                var mHk = document.createElement('div');
                mHk.className = 'wpp-switch-hotkey';
                mHk.textContent = String(mi + 1);
                mItem.appendChild(mHk);
                measureList.appendChild(mItem);
            }
            measure.appendChild(measureList);
            // Clone footer
            measure.appendChild(footerRow.cloneNode(true));
            document.body.appendChild(measure);
            overlay.style.minWidth = measure.offsetWidth + 'px';
            overlay.style.minHeight = measure.offsetHeight + 'px';
            measure.remove();
        }

        document.body.appendChild(overlay);
        this.switchOverlayEl = overlay;

        if (overlayMode === 'feedback') {
            this.overlayBlurHandler = function () {
                self.hideSwitchOverlay();
            };
            window.addEventListener('blur', this.overlayBlurHandler);
            this.switchOverlayTimer = setTimeout(function () {
                if (!self.switchOverlayEl) return;
                self.hideSwitchOverlay();
            }, feedbackDurationMs);
            return;
        }

        // Dismiss when modifier keys are released
        var showTime = Date.now();

        this.overlayKeyUpHandler = function (e) {
            if (!utils.isModShiftPressed(e)) {
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
        this.overlayKeyDownHandler = function (e) {
            // Any keydown means user is still active – reset the safety timer
            if (self.switchOverlayTimer) {
                clearTimeout(self.switchOverlayTimer);
            }
            safetyCheck();

            // Tab cycles groups (only when groups exist)
            if (e.key === 'Tab' && self.switchOverlayEl && !utils.isModPressed(e)) {
                if (!self.isGroupFeatureEnabled() || self.getOrderedGroups().length === 0) return;
                e.preventDefault();
                e.stopImmediatePropagation();
                var nextGroupId = self.getRelativeGroupId(overlayGroupId, e.shiftKey ? -1 : 1);
                if (typeof nextGroupId === 'undefined') return;

                self.resolveGroupSelection(nextGroupId).then(function (result) {
                    var newOrdered = result.sessions;
                    var newActiveIndex = self.getActiveSessionIndex(newOrdered);
                    self.showSwitchOverlay(newOrdered, newActiveIndex, result.resolvedGroupId);
                });
            }
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
        this.switchOverlayViewGroupId = null;
        this.cleanupOverlayListeners();
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
