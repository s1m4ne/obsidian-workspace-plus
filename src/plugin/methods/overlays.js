'use strict';

var i18n = require('../../i18n');

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

        var orderIndex = {};
        for (var oi = 0; oi < ordered.length; oi++) {
            orderIndex[ordered[oi].id] = oi;
        }

        var filtered = ordered.slice();
        var selectedIndex = 0;
        for (var ai = 0; ai < filtered.length; ai++) {
            if (filtered[ai].id === this.data.activeSessionId) {
                selectedIndex = ai;
                break;
            }
        }

        var overlay = document.createElement('div');
        overlay.className = 'wpp-switch-overlay wpp-search-overlay';

        var countSpan = document.createElement('div');
        countSpan.className = 'wpp-switch-count';
        overlay.appendChild(countSpan);

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
                var item = document.createElement('div');
                item.className = 'wpp-switch-item';
                if (i === selectedIndex) item.classList.add('is-active');

                var name = document.createElement('div');
                name.className = 'wpp-switch-name';
                name.textContent = session.name;
                item.appendChild(name);

                var pos = orderIndex[session.id];
                var hk = pos <= 8 ? self.getCommandHotkey('switch-to-' + (pos + 1)) : '';
                var hotkeyEl = document.createElement('div');
                hotkeyEl.className = 'wpp-switch-hotkey';
                hotkeyEl.textContent = hk || String(pos + 1);
                item.appendChild(hotkeyEl);

                (function (idx) {
                    item.addEventListener('click', function () {
                        selectedIndex = idx;
                        switchSelected();
                    });
                })(i);

                list.appendChild(item);
            }
        }

        function switchSelected() {
            if (selectedIndex < 0 || selectedIndex >= filtered.length) return;
            var target = filtered[selectedIndex];
            if (target.id === self.data.activeSessionId) {
                self.hideSearchOverlay();
                return;
            }
            self.switchSession(target.id, { silent: true }).then(function () {
                self.hideSearchOverlay();
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

            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopImmediatePropagation();
                self.hideSearchOverlay();
                return;
            }

            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                if (filtered.length === 0) return;
                var dir = e.key === 'ArrowUp' ? -1 : 1;
                selectedIndex = (selectedIndex + dir + filtered.length) % filtered.length;
                renderList();
                return;
            }

            if (e.key === 'Enter' && !e.isComposing) {
                e.preventDefault();
                switchSelected();
                return;
            }

            if (e.key === '/' && document.activeElement !== searchInput) {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            }
        };

        this.searchOverlayBlurHandler = function () {
            self.hideSearchOverlay();
        };

        searchInput.addEventListener('input', this.searchOverlayInputHandler);
        document.addEventListener('keydown', this.searchOverlayKeyHandler, true);
        window.addEventListener('blur', this.searchOverlayBlurHandler);

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
        if (this.searchOverlayBlurHandler) {
            window.removeEventListener('blur', this.searchOverlayBlurHandler);
            this.searchOverlayBlurHandler = null;
        }
        this.searchOverlayInputHandler = null;
        this.searchOverlayInputEl = null;
    };
}

module.exports = attachOverlayMethods;
