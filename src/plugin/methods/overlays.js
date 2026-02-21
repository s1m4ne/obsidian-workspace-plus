'use strict';

var obsidian = require('obsidian');
var i18n = require('../../i18n');
var modals = require('../../modals');

function attachOverlayMethods(WorkspacePlusPlus) {
    // --- Switch overlay ---

    WorkspacePlusPlus.prototype.filterSessionsByQuery = function (sessions, query) {
        var q = (query || '').trim().toLowerCase();
        if (!q) return sessions.slice();
        return sessions.filter(function (s) {
            return (s.name || '').toLowerCase().indexOf(q) !== -1;
        });
    };

    WorkspacePlusPlus.prototype.openSearchOverlay = function () {
        var L = i18n.L;
        var self = this;
        var ordered = this.getOrderedSessions();
        if (ordered.length === 0) return;

        this.hideSwitchOverlay();
        this.hideSearchOverlay();

        var filtered = ordered.slice();
        var selectedIndex = 0;
        var keyboardNav = false;
        for (var ai = 0; ai < filtered.length; ai++) {
            if (filtered[ai].id === this.data.activeSessionId) {
                selectedIndex = ai;
                break;
            }
        }

        var overlay = document.createElement('div');
        overlay.className = 'wpp-switch-overlay wpp-search-overlay';

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

        var searchRow = document.createElement('div');
        searchRow.className = 'wpp-search-row';
        var searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'wpp-search-input';
        searchInput.placeholder = L.searchOverlayPlaceholder;
        searchRow.appendChild(searchInput);
        this.searchOverlayInputEl = searchInput;
        overlay.appendChild(searchRow);

        var list = document.createElement('div');
        list.className = 'wpp-switch-list wpp-search-list';
        overlay.appendChild(list);

        var emptyEl = document.createElement('div');
        emptyEl.className = 'wpp-search-empty';
        emptyEl.textContent = L.noFilteredSessions;
        overlay.appendChild(emptyEl);

        var footerRow = document.createElement('div');
        footerRow.className = 'wpp-switch-footer';
        footerRow.textContent = L.searchOverlayHelp;
        overlay.appendChild(footerRow);

        function refreshOrderedSessions() {
            ordered = self.getOrderedSessions();
            filtered = self.filterSessionsByQuery(ordered, searchInput.value);
            if (filtered.length > 0) {
                if (selectedIndex >= filtered.length) selectedIndex = filtered.length - 1;
                for (var i = 0; i < filtered.length; i++) {
                    if (filtered[i].id === self.data.activeSessionId) {
                        selectedIndex = i;
                        break;
                    }
                }
            } else {
                selectedIndex = -1;
            }
            renderList();
        }

        function renderList() {
            while (list.firstChild) list.removeChild(list.firstChild);
            if (filtered.length === 0) {
                selectedIndex = -1;
                countSpan.textContent = '0 / 0';
                emptyEl.style.display = '';
                return;
            }

            if (selectedIndex < 0 || selectedIndex >= filtered.length) {
                selectedIndex = 0;
            }

            emptyEl.style.display = 'none';
            countSpan.textContent = (selectedIndex + 1) + ' / ' + filtered.length;

            for (var i = 0; i < filtered.length; i++) {
                var session = filtered[i];
                var isActive = session.id === self.data.activeSessionId;
                var item = document.createElement('div');
                item.className = 'wpp-switch-item';
                if (i === selectedIndex) item.classList.add('wpp-kb-selected');
                item.dataset.sessionId = session.id;

                var nameRow = document.createElement('div');
                nameRow.className = 'wpp-qs-name-row';

                var name = document.createElement('div');
                name.className = 'wpp-switch-name';
                name.textContent = session.name;
                nameRow.appendChild(name);

                if (isActive) {
                    var badge = document.createElement('span');
                    badge.className = 'wpp-active-badge';
                    badge.textContent = L.active;
                    nameRow.appendChild(badge);
                }

                item.appendChild(nameRow);

                // Action icons (rename & delete)
                var actions = document.createElement('div');
                actions.className = 'wpp-qs-actions';

                var renameIcon = document.createElement('div');
                renameIcon.className = 'wpp-qs-action-btn';
                obsidian.setIcon(renameIcon, 'pencil');
                actions.appendChild(renameIcon);

                var deleteIcon = document.createElement('div');
                deleteIcon.className = 'wpp-qs-action-btn wpp-qs-action-delete';
                obsidian.setIcon(deleteIcon, 'trash-2');
                actions.appendChild(deleteIcon);

                item.appendChild(actions);

                (function (idx, sess, itemEl) {
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

                    // Rename
                    renameIcon.addEventListener('click', function (e) {
                        e.stopPropagation();
                        new modals.RenameModal(self.app, sess.name, function (newName) {
                            var exists = Object.values(self.data.sessions)
                                .some(function (s) { return s.name === newName && s.id !== sess.id; });
                            if (exists) {
                                new obsidian.Notice(L.duplicateName);
                                return;
                            }
                            sess.name = newName;
                            sess.modified = Date.now();
                            self.updateStatusBar();
                            self.syncSessionCommands();
                            self.persistData().then(function () {
                                refreshOrderedSessions();
                            });
                        }).open();
                    });

                    // Delete
                    deleteIcon.addEventListener('click', function (e) {
                        e.stopPropagation();
                        if (Object.keys(self.data.sessions).length <= 1) {
                            new obsidian.Notice(L.cannotDeleteLast);
                            return;
                        }

                        var doDelete = function () {
                            self.deleteSession(sess.id).then(function (deleted) {
                                if (!deleted) return;
                                new obsidian.Notice(L.deleted(sess.name));
                                refreshOrderedSessions();
                            });
                        };

                        if (self.data.confirmDeleteByHotkey !== false) {
                            new modals.ConfirmModal(self.app, L.confirmDeleteActive(sess.name), doDelete).open();
                        } else {
                            doDelete();
                        }
                    });
                })(i, session, item);

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
                    cloneEl.style.zIndex = '10000';
                    cloneEl.style.pointerEvents = 'none';
                    document.body.appendChild(cloneEl);

                    dragItem.classList.add('is-dragging');
                    cloneEl._offsetX = offsetX;
                    cloneEl._offsetY = offsetY;
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

                function onMouseUp() {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                    if (!dragStarted) return;

                    cloneEl.remove();
                    dragItem.classList.remove('is-dragging');

                    // Persist new order
                    var newOrder = [];
                    var items = list.querySelectorAll('.wpp-switch-item');
                    for (var ni = 0; ni < items.length; ni++) {
                        newOrder.push(items[ni].dataset.sessionId);
                    }
                    self.data.sessionOrder = newOrder;
                    self.syncSessionCommands();
                    self.persistData();

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

        // Exit keyboard mode when mouse moves over the list
        list.addEventListener('mousemove', function () {
            if (keyboardNav) {
                keyboardNav = false;
                overlay.classList.remove('wpp-keyboard-nav');
            }
        });

        function switchSelected() {
            if (selectedIndex < 0 || selectedIndex >= filtered.length) return;
            var target = filtered[selectedIndex];
            if (target.id === self.data.activeSessionId) {
                self.hideSearchOverlay();
                return;
            }
            self.switchSession(target.id, { silent: true }).then(function (switched) {
                if (switched) self.hideSearchOverlay();
            });
        }

        this.searchOverlayInputHandler = function () {
            filtered = self.filterSessionsByQuery(ordered, searchInput.value);
            if (filtered.length > 0) {
                selectedIndex = 0;
                for (var i = 0; i < filtered.length; i++) {
                    if (filtered[i].id === self.data.activeSessionId) {
                        selectedIndex = i;
                        break;
                    }
                }
            } else {
                selectedIndex = -1;
            }
            renderList();
        };

        this.searchOverlayKeyHandler = function (e) {
            if (!self.searchOverlayEl) return;
            // Don't process keys while a modal (rename/confirm) is open
            if (document.querySelector('.modal-container')) return;

            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopImmediatePropagation();
                self.hideSearchOverlay();
                return;
            }

            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                if (filtered.length === 0) return;
                keyboardNav = true;
                overlay.classList.add('wpp-keyboard-nav');
                var dir = e.key === 'ArrowUp' ? -1 : 1;
                selectedIndex = (selectedIndex + dir + filtered.length) % filtered.length;
                updateSelection();
                return;
            }

            if (e.key === 'Enter' && !e.isComposing) {
                e.preventDefault();
                switchSelected();
                return;
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                // Don't interfere with text editing in search input
                if (document.activeElement === searchInput && searchInput.value.length > 0) return;
                e.preventDefault();
                if (selectedIndex < 0 || selectedIndex >= filtered.length) return;
                var sess = filtered[selectedIndex];
                if (Object.keys(self.data.sessions).length <= 1) {
                    new obsidian.Notice(L.cannotDeleteLast);
                    return;
                }
                var doDelete = function () {
                    self.deleteSession(sess.id).then(function (deleted) {
                        if (!deleted) return;
                        new obsidian.Notice(L.deleted(sess.name));
                        refreshOrderedSessions();
                    });
                };
                if (self.data.confirmDeleteByHotkey !== false) {
                    new modals.ConfirmModal(self.app, L.confirmDeleteActive(sess.name), doDelete).open();
                } else {
                    doDelete();
                }
                return;
            }

            if (e.key === '/' && document.activeElement !== searchInput) {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            }
        };

        this.searchOverlayClickOutsideHandler = function (e) {
            if (!self.searchOverlayEl) return;
            // Don't close if a modal (rename/confirm) is open
            if (document.querySelector('.modal-container')) return;
            if (!self.searchOverlayEl.contains(e.target)) {
                self.hideSearchOverlay();
            }
        };

        searchInput.addEventListener('input', this.searchOverlayInputHandler);
        document.addEventListener('keydown', this.searchOverlayKeyHandler, true);
        document.addEventListener('mousedown', this.searchOverlayClickOutsideHandler, true);

        document.body.appendChild(overlay);
        this.searchOverlayEl = overlay;
        renderList();
        setTimeout(function () { searchInput.focus(); }, 20);
    };

    WorkspacePlusPlus.prototype.showSwitchOverlay = function (ordered, activeIndex) {
        var L = i18n.L;
        this.hideSearchOverlay();
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

    WorkspacePlusPlus.prototype.hideSearchOverlay = function () {
        if (this.searchOverlayEl) {
            this.searchOverlayEl.remove();
            this.searchOverlayEl = null;
        }
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
    };
}

module.exports = attachOverlayMethods;
