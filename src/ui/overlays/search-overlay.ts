import { Notice, setIcon, setTooltip, type App } from 'obsidian';
import { L } from '../../i18n.ts';
import { ConfirmModal } from '../../modals/confirm-modal.ts';
import * as groupTabUi from '../../group-tab-ui.ts';
import type { GroupTabPluginHost } from '../../group-tab-ui.ts';
import * as navigationUtils from '../../navigation-utils.ts';
import { deriveSessionPresentation } from '../shared/session-presenter.ts';
import * as sessionDrag from '../shared/session-drag.ts';
import * as searchOverlayKeys from '../../search-overlay-key-handler.js';
import * as sessionContextActions from '../../session-context-actions.js';
import * as settingsContextMenu from '../../settings-context-menu.js';
import * as sessionListActions from '../../session-list-actions.js';
import type { SessionGroup, SessionItem } from '../../storage/default-data.ts';

export interface SearchOverlayPosition {
    left: number;
    bottom: number;
}

export interface SearchOverlaySize {
    width: number;
    height: number;
}

function localizedString(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

function localizedCall(value: unknown, ...args: (string | number)[]): string {
    return typeof value === 'function' ? value(...args) : '';
}

function closest(target: EventTarget | null, selector: string): HTMLElement | null {
    const result = target instanceof Element ? target.closest(selector) : null;
    return result instanceof HTMLElement ? result : null;
}

function containsTarget(container: HTMLElement, target: EventTarget | null): boolean {
    return target instanceof Node && container.contains(target);
}

export interface SearchOverlayHost extends GroupTabPluginHost {
    app: App;
    data: {
        activeSessionId: string | null;
        activeGroupId: string | null;
        groups: Record<string, SessionGroup>;
        sessions: Record<string, SessionItem>;
        showFilterInput: boolean;
        overlayDefaultFocus: string;
        searchOverlayPosition: SearchOverlayPosition | null;
        searchOverlaySize: SearchOverlaySize | null;
        confirmQuickActions: boolean;
        [key: string]: unknown;
    };
    statusBarEl?: HTMLElement | null;
    searchOverlayEl?: HTMLElement | null;
    searchOverlayViewGroupId?: string | null;
    searchOverlayInputEl?: HTMLInputElement | null;
    searchOverlayInputHandler?: (() => void) | null;
    searchOverlayKeyHandler?: ((event: KeyboardEvent) => void) | null;
    searchOverlayClickOutsideHandler?: ((event: MouseEvent) => void) | null;
    onSessionsChanged(listener: () => void): () => void;
    _cachedBarHeight?: number;
    _cachedAnchorCenterX?: number;
    isGroupFeatureEnabled(): boolean;
    filterSessionsByQuery(sessions: SessionItem[], query: string): SessionItem[];
    getOrderedSessionsForGroup(groupId: string | null): SessionItem[];
    hideSwitchOverlay(): void;
    hideSearchOverlay(): void;
    findActiveSessionIndex(sessions: SessionItem[]): number;
    resolveGroupSelection(groupId: string | null): Promise<{ resolvedGroupId: string | null; switched: boolean }>;
    createSessionForViewedGroup(name: string, groupId: string | null): Promise<{ created: boolean; name: string; viewGroupId?: string | null }>;
    isAutoSaveOnSwitchEnabled(): boolean;
    getOrderedGroups(): SessionGroup[];
    getOrderedGroupTabIds(): string[];
    setGroupTabOrder(order: string[]): void;
    moveSessionToGroupExclusive(sessionId: string, groupId: string): Promise<unknown>;
    removeSessionFromGroup(sessionId: string, groupId: string): Promise<unknown>;
    setSessionOrderFromVisible(order: string[]): void;
    saveActiveSession(): Promise<unknown>;
    reloadCurrentSessionWithoutSaving(): void;
    switchSession(sessionId: string, options: { silent: boolean }): Promise<boolean>;
    persistData(): Promise<unknown>;
}

export class SearchOverlay {
    private readonly host: SearchOverlayHost;
    private unsubscribeSessions: (() => void) | null = null;

    // Called when the overlay closes, so nothing is left listening.
    releaseSessionSubscription(): void {
        if (!this.unsubscribeSessions) return;
        this.unsubscribeSessions();
        this.unsubscribeSessions = null;
    }

    constructor(host: SearchOverlayHost) {
        this.host = host;
    }

    filterSessionsByQuery(sessions: SessionItem[], query: string): SessionItem[] {
        const q = (query || '').trim().toLowerCase();
        if (!q) return sessions.slice();
        return sessions.filter(function (s) {
            return (s.name || '').toLowerCase().indexOf(q) !== -1;
        });
    }

    open(anchorEl?: HTMLElement | null): void {
        const strings = L;
        const self = this.host;
        let overlayGroupId = self.isGroupFeatureEnabled()
            ? (self.data.activeGroupId || null)
            : null;
        self.searchOverlayViewGroupId = overlayGroupId;
        let ordered = self.getOrderedSessionsForGroup(overlayGroupId);
        const focusTarget = self.data.overlayDefaultFocus || 'current-session';

        self.hideSwitchOverlay();
        self.hideSearchOverlay();

        let filtered = ordered.slice();
        let selectedIndex = 0;
        let keyboardNav = false;

        function syncSelectedIndexToActive(options?: { preserveWhenMissing?: boolean }): void {
            selectedIndex = searchOverlayKeys.syncSearchOverlaySelectedIndex(self, filtered, selectedIndex, options || {});
        }
        syncSelectedIndexToActive();

        function getOverlayGroupId() {
            if (!self.isGroupFeatureEnabled()) {
                overlayGroupId = null;
                self.searchOverlayViewGroupId = null;
                return null;
            }
            const groups = self.data.groups || {};
            if (overlayGroupId && !groups[overlayGroupId]) {
                overlayGroupId = self.data.activeGroupId || null;
            }
            self.searchOverlayViewGroupId = overlayGroupId || null;
            return overlayGroupId || null;
        }

        function applyOverlayGroupSelection(groupId: string | null): Promise<boolean> {
            return self.resolveGroupSelection(groupId).then(function (result) {
                overlayGroupId = result.resolvedGroupId || null;
                self.searchOverlayViewGroupId = overlayGroupId;
                renderGroupTabs();
                refreshOrderedSessions();
                return result.switched;
            });
        }

        const overlay = document.createElement('div');
        overlay.className = 'wpp-switch-overlay wpp-search-overlay';
        overlay.tabIndex = -1;

        // Resize handles at four corners
        const corners = ['tl', 'tr', 'bl', 'br'];
        for (let ci = 0; ci < corners.length; ci++) {
            const corner = document.createElement('div');
            corner.className = 'wpp-resize-corner wpp-resize-' + corners[ci];
            corner.dataset.corner = corners[ci];
            overlay.appendChild(corner);
        }

        // Resize handles at four edges
        const edges = ['top', 'right', 'bottom', 'left'];
        for (let ei = 0; ei < edges.length; ei++) {
            const edgeEl = document.createElement('div');
            edgeEl.className = 'wpp-resize-edge wpp-resize-' + edges[ei];
            edgeEl.dataset.edge = edges[ei];
            overlay.appendChild(edgeEl);
        }

        // Header row: count + close button
        const headerRow = document.createElement('div');
        headerRow.className = 'wpp-search-header';

        const countSpan = document.createElement('div');
        countSpan.className = 'wpp-switch-count';
        headerRow.appendChild(countSpan);

        const closeBtn = document.createElement('div');
        closeBtn.className = 'wpp-search-close';
        setIcon(closeBtn, 'x');
        closeBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            self.hideSearchOverlay();
        });
        headerRow.appendChild(closeBtn);

        overlay.appendChild(headerRow);

        // Save section (same as main modal)
        const saveRow = document.createElement('div');
        saveRow.className = 'wpp-save-container';
        const saveInput = document.createElement('input');
        saveInput.type = 'text';
        saveInput.className = 'wpp-save-input';
        saveInput.placeholder = localizedString(strings.savePlaceholder);
        saveRow.appendChild(saveInput);
        const saveBtn = document.createElement('button');
        saveBtn.className = 'wpp-save-btn';
        saveBtn.textContent = localizedString(strings.save);
        saveRow.appendChild(saveBtn);

        function onOverlaySave() {
            const selectedGroupId = getOverlayGroupId();
            self.createSessionForViewedGroup(saveInput.value, selectedGroupId).then(function (result) {
                if (!result || !result.created) return;
                const createdName = result.name;
                overlayGroupId = result.viewGroupId || null;
                self.searchOverlayViewGroupId = overlayGroupId;
                saveInput.value = '';
                new Notice(localizedCall(strings.created, createdName));
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
        const searchRow = document.createElement('div');
        searchRow.className = 'wpp-search-row';
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'wpp-search-input';
        searchInput.placeholder = localizedString(strings.searchOverlayPlaceholder);
        searchRow.appendChild(searchInput);
        self.searchOverlayInputEl = searchInput;
        if (!self.data.showFilterInput) {
            searchRow.style.display = 'none';
        }
        overlay.appendChild(searchRow);

        // Group tabs row
        const groupTabsRow = document.createElement('div');
        groupTabsRow.className = 'wpp-group-tabs';

        function stripSaveHint(text: string): string {
            return text.replace(/  \/  ⇧.+?  \/  /, '  /  ');
        }

        function renderGroupTabs() {
            while (groupTabsRow.firstChild) groupTabsRow.removeChild(groupTabsRow.firstChild);
            const autoSave = self.isAutoSaveOnSwitchEnabled();
            if (!self.isGroupFeatureEnabled()) {
                groupTabsRow.style.display = 'none';
                footerRow.textContent = autoSave ? stripSaveHint(localizedString(strings.searchOverlayHelp)) : localizedString(strings.searchOverlayHelp);
                return;
            }
            const groups = self.data.groups || {};
            const realGroups = self.getOrderedGroups();
            groupTabsRow.style.display = '';
            const helpText = realGroups.length > 0
                ? (localizedString(strings.searchOverlayHelpWithGroups) || localizedString(strings.searchOverlayHelp))
                : localizedString(strings.searchOverlayHelp);
            footerRow.textContent = autoSave ? stripSaveHint(helpText) : helpText;

            const groupOrder = self.getOrderedGroupTabIds();
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
                addButtonTooltip: localizedString(strings.groupCreateNew),
                onAddGroupClick: function () {
                    groupTabUi.openCreateGroupPrompt(self.app, self, function () {
                        renderGroupTabs();
                        refreshOrderedSessions();
                    });
                },
            });
        }

        overlay.appendChild(groupTabsRow);

        const list = document.createElement('div');
        list.className = 'wpp-switch-list wpp-search-list';
        overlay.appendChild(list);

        const emptyEl = document.createElement('div');
        emptyEl.className = 'wpp-search-empty';
        emptyEl.textContent = localizedString(strings.noFilteredSessions);
        overlay.appendChild(emptyEl);

        // Referenced by renderGroupTabs above, which only ever runs from a
        // callback - so it resolves after this line, and let is enough.
        const footerRow = document.createElement('div');
        footerRow.className = 'wpp-switch-footer';
        overlay.appendChild(footerRow);

        // Initial render of group tabs (also sets footer text)
        renderGroupTabs();

        // Subscribed only while the overlay is up, so a session created or
        // deleted under it appears at once - by a command, by another device's
        // sync, or by its own rows (issue #118). It used to be reached the other
        // way round: the overlay wrote refreshOrderedSessions onto the plugin
        // and session-sync.js called it back, a dependency pointing from
        // storage into the UI.
        this.releaseSessionSubscription();
        this.unsubscribeSessions = self.onSessionsChanged(() => {
            refreshOrderedSessions();
        });

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
                    emptyEl.textContent = localizedString(strings.noGroupSessions);
                } else {
                    emptyEl.textContent = localizedString(strings.noFilteredSessions);
                }
                list.style.display = 'none';
                emptyEl.style.display = 'flex';
                return;
            }

            if (selectedIndex < 0 || selectedIndex >= filtered.length) {
                const activeIdx = self.findActiveSessionIndex(filtered);
                selectedIndex = activeIdx !== -1 ? activeIdx : 0;
            }

            list.style.display = '';
            emptyEl.style.display = 'none';
            countSpan.textContent = (selectedIndex + 1) + ' / ' + filtered.length;

            for (let i = 0; i < filtered.length; i++) {
                const session = filtered[i];
                if (!session) continue;
                const presentation = deriveSessionPresentation(session, {
                    activeSessionId: self.data.activeSessionId,
                });
                const isActive = presentation.isActive;
                const item = document.createElement('div');
                item.className = 'wpp-switch-item';
                if (i === selectedIndex) item.classList.add('wpp-kb-selected');
                item.dataset.sessionId = presentation.id;

                // Info column (name + modified time)
                const infoCol = document.createElement('div');
                infoCol.className = 'wpp-qs-info-col';

                const nameRow = document.createElement('div');
                nameRow.className = 'wpp-qs-name-row';

                const name = document.createElement('div');
                name.className = 'wpp-switch-name';
                name.textContent = presentation.name;
                nameRow.appendChild(name);

                infoCol.appendChild(nameRow);

                // Modified timestamp
                const modifiedEl = document.createElement('div');
                modifiedEl.className = 'wpp-qs-modified';
                modifiedEl.textContent = presentation.modifiedText;
                infoCol.appendChild(modifiedEl);

                item.appendChild(infoCol);

                if (isActive) {
                    const badge = document.createElement('span');
                    badge.className = 'wpp-active-badge';
                    badge.textContent = localizedString(strings.active);
                    item.appendChild(badge);
                }

                // Action icons (save?, rename & delete)
                const actions = document.createElement('div');
                actions.className = 'wpp-qs-actions';

                // Save & reload icons (only for active session when auto-save is disabled)
                let saveIcon = null;
                let reloadIcon = null;
                if (isActive && !self.isAutoSaveOnSwitchEnabled()) {
                    saveIcon = document.createElement('div');
                    saveIcon.className = 'wpp-qs-action-btn';
                    setIcon(saveIcon, 'save');
                    setTooltip(saveIcon, localizedString(strings.saveInline), { delay: 250 });
                    actions.appendChild(saveIcon);

                    reloadIcon = document.createElement('div');
                    reloadIcon.className = 'wpp-qs-action-btn';
                    setIcon(reloadIcon, 'rotate-ccw');
                    setTooltip(reloadIcon, localizedString(strings.contextReloadSession), { delay: 250 });
                    actions.appendChild(reloadIcon);
                }

                const renameIcon = document.createElement('div');
                renameIcon.className = 'wpp-qs-action-btn';
                setIcon(renameIcon, 'pencil');
                setTooltip(renameIcon, localizedString(strings.rename), { delay: 250 });
                actions.appendChild(renameIcon);

                const deleteIcon = document.createElement('div');
                deleteIcon.className = 'wpp-qs-action-btn';
                setIcon(deleteIcon, 'trash-2');
                setTooltip(deleteIcon, localizedString(strings.delete), { delay: 250 });
                actions.appendChild(deleteIcon);

                item.appendChild(actions);

                (function (idx, sess, itemEl, _saveIcon, _reloadIcon, _isActive) {
                    // Click on item to switch
                    itemEl.addEventListener('click', function (e) {
                        if (closest(e.target, '.wpp-qs-action-btn')) return;
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
                        const selectedGroupId = getOverlayGroupId();
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
                            deleteConfirmMessage: localizedCall(strings.confirmDeleteActive, sess.name),
                            onGroupsChanged: renderGroupTabs,
                            onSessionsChanged: refreshOrderedSessions,
                        });
                    });

                    // Save
                    if (_saveIcon) {
                        _saveIcon.addEventListener('click', function (e) {
                            e.stopPropagation();
                            const doSave = function () {
                                self.saveActiveSession().then(function () {
                                    refreshOrderedSessions();
                                });
                            };
                            if (self.data.confirmQuickActions) {
                                new ConfirmModal(self.app, localizedCall(strings.confirmSaveSession, sess.name), doSave, { confirmText: localizedString(strings.saveInline), confirmClass: 'mod-cta' }).open();
                            } else {
                                doSave();
                            }
                        });
                    }

                    // Reload
                    if (_reloadIcon) {
                        _reloadIcon.addEventListener('click', function (e) {
                            e.stopPropagation();
                            const doReload = function () {
                                self.reloadCurrentSessionWithoutSaving();
                            };
                            if (self.data.confirmQuickActions) {
                                new ConfirmModal(self.app, localizedCall(strings.confirmReloadSession, sess.name), doReload, { confirmText: localizedString(strings.load), confirmClass: 'mod-cta' }).open();
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
                            confirmMessage: localizedCall(strings.confirmDeleteActive, sess.name),
                            onDeleted: function () {
                                refreshOrderedSessions();
                            },
                        });
                    });
                })(i, session, item, saveIcon, reloadIcon, isActive);

                list.appendChild(item);
            }

            // Scroll selected (active) item into view
            const selectedItem = list.querySelector('.wpp-kb-selected');
            if (selectedItem) {
                selectedItem.scrollIntoView({ block: 'nearest' });
            }
        }

        // --- Drag to reorder ---
        function setupDrag(dragItem: HTMLElement): void {
            sessionDrag.attachSessionDrag({
                itemEl: dragItem,
                listEl: list,
                itemSelector: '.wpp-switch-item',
                ignoreSelector: '.wpp-qs-action-btn',
                groupTabsContainer: groupTabsRow,
                onDropOnGroup: function (sessionId, groupId) {
                    const sessionName = (self.data.sessions[sessionId] || {}).name || '';
                    const groupName = (self.data.groups[groupId] || {}).name || '';
                    return self.moveSessionToGroupExclusive(sessionId, groupId).then(function () {
                        new Notice(localizedCall(L.groupAddedSession, sessionName, groupName));
                        renderGroupTabs();
                        refreshOrderedSessions();
                    });
                },
                onDropOnAllGroup: function (sessionId) {
                    const currentGroupId = getOverlayGroupId();
                    if (currentGroupId) {
                        const rmSessionName = (self.data.sessions[sessionId] || {}).name || '';
                        const rmGroupName = (self.data.groups[currentGroupId] || {}).name || '';
                        return self.removeSessionFromGroup(sessionId, currentGroupId).then(function () {
                            new Notice(localizedCall(L.groupRemovedSession, rmSessionName, rmGroupName));
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
            const items = list.querySelectorAll('.wpp-switch-item');
            for (let si = 0; si < items.length; si++) {
                const item = items[si];
                if (item) item.classList.toggle('wpp-kb-selected', si === selectedIndex);
            }
            if (filtered.length > 0) {
                countSpan.textContent = (selectedIndex + 1) + ' / ' + filtered.length;
            }
            const selectedItem = items[selectedIndex];
            if (keyboardNav && selectedItem) {
                selectedItem.scrollIntoView({ block: 'nearest' });
            }
        }

        function setKeyboardNavState(value: boolean): void {
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

        function focusResultAt(index: number): void {
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

        function switchSelected(opts: { shiftKey?: boolean } = {}): void {
            if (selectedIndex < 0 || selectedIndex >= filtered.length) return;
            const target = filtered[selectedIndex];
            if (!target) return;
            if (target.id === self.data.activeSessionId) {
                if (opts.shiftKey) {
                    const doSave = function () {
                        self.saveActiveSession().then(function () {
                            refreshOrderedSessions();
                        });
                    };
                    if (self.data.confirmQuickActions) {
                        new ConfirmModal(self.app, localizedCall(strings.confirmSaveSession, target.name), doSave, { confirmText: localizedString(strings.saveInline), confirmClass: 'mod-cta' }).open();
                    } else {
                        doSave();
                    }
                } else {
                    const doReload = function () {
                        self.reloadCurrentSessionWithoutSaving();
                    };
                    if (self.data.confirmQuickActions) {
                        new ConfirmModal(self.app, localizedCall(strings.confirmReloadSession, target.name), doReload, { confirmText: localizedString(strings.load), confirmClass: 'mod-cta' }).open();
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

        self.searchOverlayInputHandler = function () {
            filtered = self.filterSessionsByQuery(ordered, searchInput.value);
            syncSelectedIndexToActive();
            renderList();
        }

        self.searchOverlayKeyHandler = searchOverlayKeys.createSearchOverlayKeyHandler({
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
            setSelectedIndex: function (value: number) { selectedIndex = value; },
            setKeyboardNav: setKeyboardNavState,
        });

        self.searchOverlayClickOutsideHandler = function (e) {
            if (!self.searchOverlayEl) return;
            // Don't close if a modal (rename/confirm) is open
            if (searchOverlayKeys.hasBlockingModal()) return;
            // Let status bar handle its own toggle
            if (self.statusBarEl && containsTarget(self.statusBarEl, e.target)) return;
            if (!containsTarget(self.searchOverlayEl, e.target)) {
                self.hideSearchOverlay();
            }
        };

        searchInput.addEventListener('input', self.searchOverlayInputHandler);
        document.addEventListener('keydown', self.searchOverlayKeyHandler, true);
        document.addEventListener('mousedown', self.searchOverlayClickOutsideHandler, true);

        document.body.appendChild(overlay);
        self.searchOverlayEl = overlay;
        setKeyboardNavState(focusTarget === 'current-session');
        renderList();

        // Position overlay relative to anchor (status bar button)
        const margin = 8;

        const STATUS_BAR_FALLBACK_HEIGHT = 28;
        const MIN_VISIBLE_HEIGHT = 20;

        function cacheStatusBarMetrics() {
            const aEl = anchorEl || self.statusBarEl;
            const statusBar = aEl ? aEl.closest('.status-bar') : document.querySelector('.status-bar');
            if (statusBar) {
                const h = statusBar.getBoundingClientRect().height;
                if (h >= MIN_VISIBLE_HEIGHT) {
                    self._cachedBarHeight = h;
                }
            }
            if (aEl) {
                const aRect = aEl.getBoundingClientRect();
                if (aRect.width > 0 && aRect.height > 0) {
                    self._cachedAnchorCenterX = aRect.left + aRect.width / 2;
                }
            }
        }

        // Cache now while bar may be visible
        cacheStatusBarMetrics();

        function positionToAnchor() {
            const oRect = overlay.getBoundingClientRect();
            const barHeight = self._cachedBarHeight || STATUS_BAR_FALLBACK_HEIGHT;

            // Horizontal: use cached anchor center, or viewport center
            const centerX = self._cachedAnchorCenterX || window.innerWidth / 2;
            let lp = centerX - oRect.width / 2;
            lp = Math.max(margin, Math.min(lp, window.innerWidth - oRect.width - margin));

            // Vertical: always position above status bar area
            let bp = barHeight + margin;
            if (bp + oRect.height > window.innerHeight - margin) {
                bp = margin;
            }

            overlay.style.right = 'auto';
            overlay.style.top = 'auto';
            overlay.style.left = lp + 'px';
            overlay.style.bottom = bp + 'px';
        }

        // Apply saved size
        const savedSize = self.data.searchOverlaySize;
        const MIN_WIDTH = 220;
        const MIN_HEIGHT = 140;

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
        const savedPos = self.data.searchOverlayPosition;

        if (savedPos && savedPos.left != null && savedPos.bottom != null) {
            const overlayRect = overlay.getBoundingClientRect();
            const sl = Math.max(margin, Math.min(savedPos.left, window.innerWidth - overlayRect.width - margin));
            const sb = Math.max(margin, Math.min(savedPos.bottom, window.innerHeight - overlayRect.height - margin));
            overlay.style.right = 'auto';
            overlay.style.top = 'auto';
            overlay.style.left = sl + 'px';
            overlay.style.bottom = sb + 'px';
        } else {
            positionToAnchor();
        }

        // Double-click on empty area to reset position and size
        overlay.addEventListener('dblclick', function (e) {
            if (closest(e.target, '.wpp-search-close')) return;
            if (closest(e.target, '.wpp-switch-item')) return;
            if (closest(e.target, '.wpp-search-input')) return;
            if (closest(e.target, '.wpp-qs-action-btn')) return;
            resetSize();
            positionToAnchor();
            self.data.searchOverlayPosition = null;
            self.data.searchOverlaySize = null;
            self.persistData();
        });

        // Right-click on empty area → settings context menu
        overlay.addEventListener('contextmenu', function (e) {
            if (closest(e.target, '.wpp-switch-item')) return;
            if (closest(e.target, '.wpp-search-input')) return;
            if (closest(e.target, '.wpp-search-close')) return;
            if (closest(e.target, '.wpp-qs-action-btn')) return;
            if (closest(e.target, '.wpp-group-tab')) return;
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
            const cornerEl = closest(e.target, '.wpp-resize-corner');
            const edgeEl = !cornerEl ? closest(e.target, '.wpp-resize-edge') : null;
            if (!cornerEl && !edgeEl) return;
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();

            const dir = cornerEl ? cornerEl.dataset.corner : null;
            const edge = edgeEl ? edgeEl.dataset.edge : null;
            const startX = e.clientX;
            const startY = e.clientY;
            const startRect = overlay.getBoundingClientRect();
            const startWidth = startRect.width;
            const startHeight = startRect.height;
            const startLeft = startRect.left;
            const startBottom = window.innerHeight - startRect.bottom;

            function onMove(ev: MouseEvent): void {
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;
                let newWidth = startWidth;
                let newHeight = startHeight;
                let newLeft = startLeft;
                let newBottom = startBottom;

                // Horizontal
                const moveRight = dir === 'tr' || dir === 'br' || edge === 'right';
                const moveLeft  = dir === 'tl' || dir === 'bl' || edge === 'left';
                if (moveRight) {
                    newWidth = Math.max(MIN_WIDTH, startWidth + dx);
                } else if (moveLeft) {
                    newWidth = Math.max(MIN_WIDTH, startWidth - dx);
                    newLeft = startLeft + (startWidth - newWidth);
                }

                // Vertical
                const moveTop    = dir === 'tl' || dir === 'tr' || edge === 'top';
                const moveBottom = dir === 'bl' || dir === 'br' || edge === 'bottom';
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

                const finalRect = overlay.getBoundingClientRect();
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
            if (closest(e.target, '.wpp-search-close')) return;
            if (closest(e.target, '.wpp-switch-item')) return;
            if (closest(e.target, '.wpp-search-input')) return;
            if (closest(e.target, '.wpp-save-input')) return;
            if (closest(e.target, '.wpp-save-btn')) return;
            if (closest(e.target, '.wpp-group-tab')) return;
            if (closest(e.target, '.wpp-group-add-btn')) return;
            if (closest(e.target, '.wpp-group-tabs')) return;
            if (closest(e.target, '.wpp-qs-action-btn')) return;
            if (closest(e.target, '.wpp-resize-corner')) return;
            if (e.button !== 0) return;
            e.preventDefault();
            overlay.classList.add('wpp-dragging');

            const rect = overlay.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;

            function onMove(ev: MouseEvent): void {
                let newLeft = ev.clientX - offsetX;
                let newTop = ev.clientY - offsetY;
                const oRect = overlay.getBoundingClientRect();
                newLeft = Math.max(margin, Math.min(newLeft, window.innerWidth - oRect.width - margin));
                newTop = Math.max(margin, Math.min(newTop, window.innerHeight - oRect.height - margin));
                const newBottom = window.innerHeight - newTop - oRect.height;
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
                const finalRect = overlay.getBoundingClientRect();
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
            const guardHandler = function (e: FocusEvent): void {
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
    }
}
