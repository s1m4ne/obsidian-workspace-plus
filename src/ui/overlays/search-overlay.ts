import { Component, Notice, setIcon, setTooltip, type App } from 'obsidian';
import { L } from '../../i18n.ts';
import { ConfirmModal } from '../../modals/confirm-modal.ts';
import * as groupTabUi from '../../group-tab-ui.ts';
import type { GroupTabPluginHost } from '../../group-tab-ui.ts';
import * as navigationUtils from '../../navigation-utils.ts';
import { deriveSessionPresentation } from '../shared/session-presenter.ts';
import * as sessionDrag from '../shared/session-drag.ts';
import * as sessionContextActions from '../../session-context-actions.ts';
import * as settingsContextMenu from '../../settings-context-menu.js';
import type { SettingsContextMenuPluginHost } from '../../settings-context-menu-items.ts';
import * as sessionListActions from '../../session-list-actions.ts';
import * as utils from '../../utils.ts';
import type { SessionGroup, SessionItem } from '../../storage/default-data.ts';
import type { HistoryModalPluginHost } from '../../modals/history-modal.ts';
import type { GroupStore } from '../../state/group-store.ts';
import type { SessionSaver } from '../../state/session-saver.ts';
import type { SessionStore } from '../../state/session-store.ts';
import type { SessionSwitcher } from '../../state/session-switcher.ts';

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
    if (typeof value !== 'function') return '';
    return (value as (...callArgs: (string | number)[]) => string)(...args);
}

function closest(target: EventTarget | null, selector: string): HTMLElement | null {
    const result = target instanceof Element ? target.closest(selector) : null;
    return result instanceof HTMLElement ? result : null;
}

function containsTarget(container: HTMLElement, target: EventTarget | null): boolean {
    return target instanceof Node && container.contains(target);
}

interface SearchOverlayKeyboardOptions {
    plugin: SearchOverlayHost;
    saveInput: HTMLInputElement;
    saveBtn: HTMLButtonElement;
    searchInput: HTMLInputElement;
    getOverlayGroupId(): string | null;
    applyOverlayGroupSelection(groupId: string | null): Promise<boolean>;
    switchSelected(options: { shiftKey?: boolean }): void;
    refreshOrderedSessions(): void;
    updateSelection(): void;
    focusSaveInput(): void;
    focusSearchInput(): void;
    focusFirstResult(): void;
    focusLastResult(): void;
    hasSearchInput(): boolean;
    getFiltered(): SessionItem[];
    getSelectedIndex(): number;
    setSelectedIndex(value: number): void;
    setKeyboardNav(value: boolean): void;
}

function hasBlockingModal(): boolean {
    return !!document.querySelector('.modal-container');
}

function syncSearchOverlaySelectedIndex(
    plugin: SearchOverlayHost,
    filtered: SessionItem[],
    currentIndex: number,
    options: { preserveWhenMissing?: boolean } = {},
): number {
    if (filtered.length === 0) return -1;

    const activeIdx = plugin.getSessionStore().findActiveSessionIndex(filtered);
    if (activeIdx !== -1) return activeIdx;

    if (options.preserveWhenMissing) {
        if (currentIndex >= filtered.length) return filtered.length - 1;
        return currentIndex < 0 ? 0 : currentIndex;
    }

    return 0;
}

function handleSearchOverlayHorizontalKey(event: KeyboardEvent, activeEl: Element | null, options: SearchOverlayKeyboardOptions): boolean {
    if (activeEl === options.saveInput && event.key === 'ArrowRight') {
        if (navigationUtils.isTextInputCursorAtEnd(options.saveInput)) {
            event.preventDefault();
            event.stopImmediatePropagation();
            options.saveBtn.focus();
        }
        return true;
    }
    if (activeEl === options.saveBtn && event.key === 'ArrowLeft') {
        event.preventDefault();
        event.stopImmediatePropagation();
        options.focusSaveInput();
        return true;
    }
    return false;
}

function handleSearchOverlayVerticalKey(event: KeyboardEvent, activeEl: Element | null, options: SearchOverlayKeyboardOptions): boolean {
    if (activeEl === options.searchInput) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (event.key === 'ArrowDown') options.focusFirstResult();
        else options.focusSaveInput();
        return true;
    }
    if (activeEl === options.saveInput || activeEl === options.saveBtn) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (event.key === 'ArrowDown') {
            if (options.hasSearchInput()) options.focusSearchInput();
            else options.focusFirstResult();
        } else {
            options.focusLastResult();
        }
        return true;
    }

    const filtered = options.getFiltered();
    event.preventDefault();
    if (filtered.length === 0) return true;
    options.setKeyboardNav(true);
    const direction = event.key === 'ArrowUp' ? -1 : 1;
    const nextIndex = options.getSelectedIndex() + direction;
    if (nextIndex < 0) {
        if (options.hasSearchInput()) options.focusSearchInput();
        else options.focusSaveInput();
        return true;
    }
    if (nextIndex >= filtered.length) {
        options.focusSaveInput();
        return true;
    }
    options.setSelectedIndex(nextIndex);
    options.updateSelection();
    return true;
}

function handleSearchOverlayEnterKey(event: KeyboardEvent, activeEl: Element | null, options: SearchOverlayKeyboardOptions): boolean {
    if (activeEl === options.saveInput || activeEl === options.saveBtn) return false;
    event.preventDefault();
    event.stopImmediatePropagation();
    options.switchSelected({ shiftKey: event.shiftKey });
    return true;
}

function handleSearchOverlayDeleteKey(event: KeyboardEvent, activeEl: Element | null, options: SearchOverlayKeyboardOptions): boolean {
    // Delete belongs to whatever holds the caret. In the filter box it edits the
    // filter - including when the box is empty, where it does nothing at all.
    // The test used to be `value.length > 0`, so an empty box fell through and
    // Delete removed a session instead, from a field the person was typing in.
    if (activeEl === options.searchInput) return false;
    if (activeEl === options.saveInput || activeEl === options.saveBtn) return false;
    event.preventDefault();

    const filtered = options.getFiltered();
    const selectedIndex = options.getSelectedIndex();
    if (selectedIndex < 0 || selectedIndex >= filtered.length) return true;
    const session = filtered[selectedIndex];
    if (!session) return true;
    if (Object.keys(options.plugin.data.sessions).length <= 1) {
        new Notice(localizedString(L.cannotDeleteLast));
        return true;
    }

    const doDelete = (): void => {
        void options.plugin.getSessionStore().deleteSession(session.id).then((deleted) => {
            if (!deleted) return;
            new Notice(localizedCall(L.deleted, session.name));
            options.refreshOrderedSessions();
        });
    };

    if (options.plugin.data.confirmDeleteByHotkey !== false) {
        // Only say "active session" when it is one. The message was fixed at the
        // active wording, so deleting any other row claimed the wrong thing
        // about it.
        const isActive = session.id === options.plugin.data.activeSessionId;
        const message = isActive
            ? localizedCall(L.confirmDeleteActive, session.name)
            : localizedCall(L.confirmDelete, session.name);
        new ConfirmModal(options.plugin.app, message, doDelete).open();
    } else {
        doDelete();
    }
    return true;
}

function createSearchOverlayKeyHandler(options: SearchOverlayKeyboardOptions): (event: KeyboardEvent) => void {
    return (event): void => {
        const plugin = options.plugin;
        if (!plugin.searchOverlayEl || hasBlockingModal()) return;
        const activeEl = document.activeElement;

        // Let global command hotkeys (e.g. Mod+Shift+Enter/Tab) flow through.
        if (utils.isModPressed(event)) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopImmediatePropagation();
            plugin.getSearchOverlay().hide();
            return;
        }

        if (event.key === 'Tab') {
            if (activeEl === options.saveInput || activeEl === options.saveBtn) return;
            if (!plugin.getGroupStore().isGroupFeatureEnabled() || plugin.getGroupStore().getOrderedGroups().length === 0) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            const nextGroupId = plugin.getGroupStore().getRelativeGroupId(options.getOverlayGroupId(), event.shiftKey ? -1 : 1);
            if (nextGroupId === undefined) return;
            void options.applyOverlayGroupSelection(nextGroupId);
            return;
        }

        if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && handleSearchOverlayHorizontalKey(event, activeEl, options)) return;
        if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && handleSearchOverlayVerticalKey(event, activeEl, options)) return;
        if (event.key === 'Enter' && !event.isComposing && handleSearchOverlayEnterKey(event, activeEl, options)) return;
        if ((event.key === 'Delete' || event.key === 'Backspace') && handleSearchOverlayDeleteKey(event, activeEl, options)) return;
        if (event.key === '/' && activeEl !== options.searchInput && activeEl !== options.saveInput && activeEl !== options.saveBtn) {
            handleSearchOverlaySlashKey(event, options);
        }
    };
}

function handleSearchOverlaySlashKey(event: KeyboardEvent, options: SearchOverlayKeyboardOptions): void {
    event.preventDefault();
    navigationUtils.focusTextInputSelect(options.searchInput);
}

export interface SearchOverlayHost extends GroupTabPluginHost, HistoryModalPluginHost, SettingsContextMenuPluginHost {
    /**
     * Owned by SessionSwitcher; naming it keeps one list rather than a
     * forwarding method per call on the plugin.
     */
    getSessionSwitcher(): SessionSwitcher;

    /**
     * The session set, its ordering and the CRUD on it are owned by
     * SessionStore. Naming the store rather than restating its methods keeps
     * one list, the way getGroupStore() and getSessionSaver() do.
     */
    getSessionStore(): SessionStore;

    /**
     * Saving and the auto-save flags are owned by SessionSaver. Naming it here
     * rather than restating its methods keeps one list, the way getGroupStore()
     * does for group state.
     */
    getSessionSaver(): SessionSaver;

    /**
     * Group state is owned by GroupStore. Naming the store rather than
     * restating its methods keeps one list: the plugin used to carry a
     * forwarding method per call, and one added to the store without a shim
     * did nothing from here while the type checker saw a host that simply
     * lacked the member.
     */
    getGroupStore(): GroupStore;

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
        confirmDeleteByHotkey: boolean;
        [key: string]: unknown;
    };
    statusBarEl?: HTMLElement | null;
    searchOverlayEl?: HTMLElement | null;
    searchOverlayViewGroupId?: string | null;
    searchOverlayInputEl?: HTMLInputElement | null;
    searchOverlayInputHandler?: (() => void) | null;
    searchOverlayKeyHandler?: ((event: KeyboardEvent) => void) | null;
    searchOverlayClickOutsideHandler?: ((event: MouseEvent) => void) | null;
    _cachedBarHeight?: number;
    _cachedAnchorCenterX?: number;
    getSwitchOverlay(): { hide(): void };
    getSearchOverlay(): { hide(): void };
    persistData(): Promise<unknown>;
}

export class SearchOverlay {
    private readonly host: SearchOverlayHost;
    private unsubscribeSessions: (() => void) | null = null;
    private overlayEventOwner: Component | null = null;
    private focusGuardEventOwner: Component | null = null;
    private readonly interactionEventOwners = new Set<Component>();

    // Called when the overlay closes, so nothing is left listening.
    releaseSessionSubscription(): void {
        if (!this.unsubscribeSessions) return;
        this.unsubscribeSessions();
        this.unsubscribeSessions = null;
    }

    private releaseDomEventOwners(): void {
        this.overlayEventOwner?.unload();
        this.overlayEventOwner = null;
        this.focusGuardEventOwner?.unload();
        this.focusGuardEventOwner = null;
        for (const owner of this.interactionEventOwners) owner.unload();
        this.interactionEventOwners.clear();
    }

    private createInteractionEventOwner(): Component {
        const owner = new Component();
        owner.load();
        this.interactionEventOwners.add(owner);
        return owner;
    }

    private releaseInteractionEventOwner(owner: Component): void {
        owner.unload();
        this.interactionEventOwners.delete(owner);
    }

    hide(): void {
        this.releaseSessionSubscription();
        this.releaseDomEventOwners();
        const self = this.host;
        self.searchOverlayEl?.remove();
        self.searchOverlayEl = null;
        self.searchOverlayViewGroupId = null;
        self.searchOverlayInputHandler = null;
        self.searchOverlayKeyHandler = null;
        self.searchOverlayClickOutsideHandler = null;
        self.searchOverlayInputEl = null;
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
        // Some of what open() does is its own work, and it used to reach for it
        // through a plugin shim that forwarded straight back here. Bound as
        // arrows rather than aliasing `this`, which the lint ratchet counts.
        const hideThisOverlay = (): void => { this.hide(); };
        const filterByQuery = (sessions: SessionItem[], query: string): SessionItem[] =>
            this.filterSessionsByQuery(sessions, query);
        const createInteractionEventOwner = (): Component => this.createInteractionEventOwner();
        const releaseInteractionEventOwner = (owner: Component): void => this.releaseInteractionEventOwner(owner);
        let overlayGroupId = self.getGroupStore().isGroupFeatureEnabled()
            ? (self.data.activeGroupId || null)
            : null;
        self.searchOverlayViewGroupId = overlayGroupId;
        let ordered = self.getSessionStore().getOrderedSessionsForGroup(overlayGroupId);
        const focusTarget = self.data.overlayDefaultFocus || 'current-session';

        self.getSwitchOverlay().hide();
        hideThisOverlay();

        const overlayDocument = document;
        const overlayEventOwner = new Component();
        overlayEventOwner.load();
        this.overlayEventOwner = overlayEventOwner;

        let filtered = ordered.slice();
        let selectedIndex = 0;
        let keyboardNav = false;

        function syncSelectedIndexToActive(options?: { preserveWhenMissing?: boolean }): void {
            selectedIndex = syncSearchOverlaySelectedIndex(self, filtered, selectedIndex, options);
        }
        syncSelectedIndexToActive();

        function getOverlayGroupId() {
            if (!self.getGroupStore().isGroupFeatureEnabled()) {
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
            return self.getGroupStore().resolveGroupSelection(groupId).then(function (result) {
                overlayGroupId = result.resolvedGroupId || null;
                self.searchOverlayViewGroupId = overlayGroupId;
                renderGroupTabs();
                refreshOrderedSessions();
                return result.switched;
            });
        }

        const overlay = overlayDocument.body.createDiv({ cls: 'wpp-switch-overlay wpp-search-overlay' });
        overlay.tabIndex = -1;

        // Resize handles at four corners
        const corners = ['tl', 'tr', 'bl', 'br'];
        for (let ci = 0; ci < corners.length; ci++) {
            const corner = overlay.createDiv({ cls: 'wpp-resize-corner wpp-resize-' + corners[ci] });
            corner.dataset.corner = corners[ci];
        }

        // Resize handles at four edges
        const edges = ['top', 'right', 'bottom', 'left'];
        for (let ei = 0; ei < edges.length; ei++) {
            const edgeEl = overlay.createDiv({ cls: 'wpp-resize-edge wpp-resize-' + edges[ei] });
            edgeEl.dataset.edge = edges[ei];
        }

        // Header row: count + close button
        const headerRow = overlay.createDiv({ cls: 'wpp-search-header' });

        const countSpan = headerRow.createDiv({ cls: 'wpp-switch-count' });

        const closeBtn = headerRow.createDiv({ cls: 'wpp-search-close' });
        setIcon(closeBtn, 'x');
        overlayEventOwner.registerDomEvent(closeBtn, 'click', function (e) {
            e.stopPropagation();
            hideThisOverlay();
        });

        // Save section (same as main modal)
        const saveRow = overlay.createDiv({ cls: 'wpp-save-container' });
        const saveInput = saveRow.createEl('input', {
            cls: 'wpp-save-input',
            attr: { type: 'text', placeholder: localizedString(strings.savePlaceholder) },
        });
        const saveBtn = saveRow.createEl('button', { cls: 'wpp-save-btn', text: localizedString(strings.save) });

        function onOverlaySave() {
            const selectedGroupId = getOverlayGroupId();
            void self.getSessionStore().createSessionForViewedGroup(saveInput.value, selectedGroupId).then(function (result) {
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

        overlayEventOwner.registerDomEvent(saveBtn, 'click', function (e) {
            e.stopPropagation();
            onOverlaySave();
        });
        overlayEventOwner.registerDomEvent(saveInput, 'keydown', function (e) {
            if (e.key === 'Enter' && !e.isComposing) {
                e.stopPropagation();
                onOverlaySave();
            }
        });

        // Search / filter section
        const searchRow = overlay.createDiv({ cls: 'wpp-search-row' });
        const searchInput = searchRow.createEl('input', {
            cls: 'wpp-search-input',
            attr: { type: 'text', placeholder: localizedString(strings.searchOverlayPlaceholder) },
        });
        self.searchOverlayInputEl = searchInput;
        if (!self.data.showFilterInput) {
            searchRow.classList.add('is-hidden');
        }

        // Group tabs row
        const groupTabsRow = overlay.createDiv({ cls: 'wpp-group-tabs' });

        function stripSaveHint(text: string): string {
            return text.replace(/ {2}\/ {2}⇧.+? {2}\/ {2}/, '  /  ');
        }

        function renderGroupTabs() {
            while (groupTabsRow.firstChild) groupTabsRow.removeChild(groupTabsRow.firstChild);
            const autoSave = self.getSessionSaver().isAutoSaveOnSwitchEnabled();
            if (!self.getGroupStore().isGroupFeatureEnabled()) {
                groupTabsRow.classList.add('is-hidden');
                footerRow.textContent = autoSave ? stripSaveHint(localizedString(strings.searchOverlayHelp)) : localizedString(strings.searchOverlayHelp);
                return;
            }
            const groups = self.data.groups || {};
            const realGroups = self.getGroupStore().getOrderedGroups();
            groupTabsRow.classList.remove('is-hidden');
            const helpText = realGroups.length > 0
                ? (localizedString(strings.searchOverlayHelpWithGroups) || localizedString(strings.searchOverlayHelp))
                : localizedString(strings.searchOverlayHelp);
            footerRow.textContent = autoSave ? stripSaveHint(helpText) : helpText;

            const groupOrder = self.getGroupStore().getOrderedGroupTabIds();
            groupTabUi.renderGroupTabs({
                app: self.app,
                plugin: self,
                containerEl: groupTabsRow,
                groups: groups,
                groupOrder: groupOrder,
                selectedGroupId: getOverlayGroupId(),
                stopPropagationOnMouseDown: true,
                onSelectGroup: function (groupId) {
                    void applyOverlayGroupSelection(groupId);
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
                    void self.getGroupStore().setGroupTabOrder(newOrder);
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

        const list = overlay.createDiv({ cls: 'wpp-switch-list wpp-search-list' });

        const emptyEl = overlay.createDiv({ cls: 'wpp-search-empty' });
        emptyEl.textContent = localizedString(strings.noFilteredSessions);

        // Referenced by renderGroupTabs above, which only ever runs from a
        // callback - so it resolves after this line, and let is enough.
        const footerRow = overlay.createDiv({ cls: 'wpp-switch-footer' });

        // Initial render of group tabs (also sets footer text)
        renderGroupTabs();

        // Subscribed only while the overlay is up, so a session created or
        // deleted under it appears at once - by a command, by another device's
        // sync, or by its own rows (issue #118). It used to be reached the other
        // way round: the overlay wrote refreshOrderedSessions onto the plugin
        // and session-sync.js called it back, a dependency pointing from
        // storage into the UI.
        this.releaseSessionSubscription();
        this.unsubscribeSessions = self.getSessionStore().onSessionsChanged(() => {
            refreshOrderedSessions();
        });

        function refreshOrderedSessions() {
            ordered = self.getSessionStore().getOrderedSessionsForGroup(getOverlayGroupId());
            // Its own method. This used to go out to a plugin shim that
            // forwarded straight back here.
            filtered = filterByQuery(ordered, searchInput.value);
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
                list.classList.add('is-hidden');
                emptyEl.classList.add('is-visible');
                return;
            }

            if (selectedIndex < 0 || selectedIndex >= filtered.length) {
                const activeIdx = self.getSessionStore().findActiveSessionIndex(filtered);
                selectedIndex = activeIdx !== -1 ? activeIdx : 0;
            }

            list.classList.remove('is-hidden');
            emptyEl.classList.remove('is-visible');
            countSpan.textContent = (selectedIndex + 1) + ' / ' + filtered.length;

            for (let i = 0; i < filtered.length; i++) {
                const session = filtered[i];
                if (!session) continue;
                const presentation = deriveSessionPresentation(session, {
                    activeSessionId: self.data.activeSessionId,
                });
                const isActive = presentation.isActive;
                const item = list.createDiv({ cls: 'wpp-switch-item' });
                if (i === selectedIndex) item.classList.add('wpp-kb-selected');
                item.dataset.sessionId = presentation.id;

                // Info column (name + modified time)
                const infoCol = item.createDiv({ cls: 'wpp-qs-info-col' });

                const nameRow = infoCol.createDiv({ cls: 'wpp-qs-name-row' });

                const name = nameRow.createDiv({ cls: 'wpp-switch-name' });
                name.textContent = presentation.name;

                // Modified timestamp
                const modifiedEl = infoCol.createDiv({ cls: 'wpp-qs-modified' });
                modifiedEl.textContent = presentation.modifiedText;

                if (isActive) {
                    const badge = item.createSpan({ cls: 'wpp-active-badge' });
                    badge.textContent = localizedString(strings.active);
                }

                // Action icons (save?, rename & delete)
                const actions = item.createDiv({ cls: 'wpp-qs-actions' });

                // Save & reload icons (only for active session when auto-save is disabled)
                let saveIcon = null;
                let reloadIcon = null;
                if (isActive && !self.getSessionSaver().isAutoSaveOnSwitchEnabled()) {
                    saveIcon = actions.createDiv({ cls: 'wpp-qs-action-btn' });
                    setIcon(saveIcon, 'save');
                    setTooltip(saveIcon, localizedString(strings.saveInline), { delay: 250 });
                    reloadIcon = actions.createDiv({ cls: 'wpp-qs-action-btn' });
                    setIcon(reloadIcon, 'rotate-ccw');
                    setTooltip(reloadIcon, localizedString(strings.contextReloadSession), { delay: 250 });
                }

                const renameIcon = actions.createDiv({ cls: 'wpp-qs-action-btn' });
                setIcon(renameIcon, 'pencil');
                setTooltip(renameIcon, localizedString(strings.rename), { delay: 250 });
                const deleteIcon = actions.createDiv({ cls: 'wpp-qs-action-btn' });
                setIcon(deleteIcon, 'trash-2');
                setTooltip(deleteIcon, localizedString(strings.delete), { delay: 250 });

                (function (idx, sess, itemEl, _saveIcon, _reloadIcon, _isActive) {
                    // Click on item to switch
                    overlayEventOwner.registerDomEvent(itemEl, 'click', function (e) {
                        if (closest(e.target, '.wpp-qs-action-btn')) return;
                        selectedIndex = idx;
                        switchSelected();
                    });

                    // Drag to reorder
                    setupDrag(itemEl);

                    // Mouse hover updates selection (when not in keyboard mode)
                    overlayEventOwner.registerDomEvent(itemEl, 'mouseenter', function () {
                        if (keyboardNav) return;
                        selectedIndex = idx;
                        updateSelection();
                    });

                    // Right-click context menu
                    overlayEventOwner.registerDomEvent(itemEl, 'contextmenu', function (e) {
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
                            showMoveToGroup: self.getGroupStore().isGroupFeatureEnabled() && self.getGroupStore().getOrderedGroups().length > 0,
                            deleteConfirmMessage: localizedCall(strings.confirmDeleteActive, sess.name),
                            onGroupsChanged: renderGroupTabs,
                            onSessionsChanged: refreshOrderedSessions,
                        });
                    });

                    // Save
                    if (_saveIcon) {
                        overlayEventOwner.registerDomEvent(_saveIcon, 'click', function (e) {
                            e.stopPropagation();
                            const doSave = function () {
                                void self.getSessionSaver().saveActiveSession().then(function () {
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
                        overlayEventOwner.registerDomEvent(_reloadIcon, 'click', function (e) {
                            e.stopPropagation();
                            const doReload = function () {
                                void self.getSessionSaver().reloadCurrentSessionWithoutSaving();
                            };
                            if (self.data.confirmQuickActions) {
                                new ConfirmModal(self.app, localizedCall(strings.confirmReloadSession, sess.name), doReload, { confirmText: localizedString(strings.load), confirmClass: 'mod-cta' }).open();
                            } else {
                                doReload();
                            }
                        });
                    }

                    // Rename
                    overlayEventOwner.registerDomEvent(renameIcon, 'click', function (e) {
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
                    overlayEventOwner.registerDomEvent(deleteIcon, 'click', function (e) {
                        e.stopPropagation();
                        void sessionListActions.deleteSessionWithPrompt({
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
                    return self.getGroupStore().moveSessionToGroupExclusive(sessionId, groupId).then(function () {
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
                        return self.getGroupStore().removeSessionFromGroup(sessionId, currentGroupId).then(function () {
                            new Notice(localizedCall(L.groupRemovedSession, rmSessionName, rmGroupName));
                            renderGroupTabs();
                            refreshOrderedSessions();
                        });
                    }
                },
                onReorder: function (newVisibleOrder) {
                    void self.getSessionStore().setSessionOrderFromVisible(newVisibleOrder);
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
        overlayEventOwner.registerDomEvent(list, 'mousemove', function () {
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
                        void self.getSessionSaver().saveActiveSession().then(function () {
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
                        void self.getSessionSaver().reloadCurrentSessionWithoutSaving();
                    };
                    if (self.data.confirmQuickActions) {
                        new ConfirmModal(self.app, localizedCall(strings.confirmReloadSession, target.name), doReload, { confirmText: localizedString(strings.load), confirmClass: 'mod-cta' }).open();
                    } else {
                        doReload();
                    }
                }
                hideThisOverlay();
                return;
            }
            void self.getSessionSwitcher().switchSession(target.id, { silent: true }).then(function (switched) {
                if (switched) hideThisOverlay();
            });
        }

        self.searchOverlayInputHandler = function () {
            // Its own method. This used to go out to a plugin shim that
            // forwarded straight back here.
            filtered = filterByQuery(ordered, searchInput.value);
            syncSelectedIndexToActive();
            renderList();
        }

        self.searchOverlayKeyHandler = createSearchOverlayKeyHandler({
            plugin: self,
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
            if (hasBlockingModal()) return;
            // Let status bar handle its own toggle
            if (self.statusBarEl && containsTarget(self.statusBarEl, e.target)) return;
            if (!containsTarget(self.searchOverlayEl, e.target)) {
                hideThisOverlay();
            }
        };

        overlayEventOwner.registerDomEvent(searchInput, 'input', self.searchOverlayInputHandler);
        overlayEventOwner.registerDomEvent(overlayDocument, 'keydown', self.searchOverlayKeyHandler, true);
        overlayEventOwner.registerDomEvent(overlayDocument, 'mousedown', self.searchOverlayClickOutsideHandler, true);

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

            overlay.classList.add('is-positioned');
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
            overlay.classList.add('is-resized');
        }

        function resetSize() {
            overlay.style.removeProperty('width');
            overlay.style.removeProperty('height');
            overlay.classList.remove('is-resized');
        }

        // Position: saved position > anchor-based > CSS default
        const savedPos = self.data.searchOverlayPosition;

        if (savedPos && savedPos.left != null && savedPos.bottom != null) {
            const overlayRect = overlay.getBoundingClientRect();
            const sl = Math.max(margin, Math.min(savedPos.left, window.innerWidth - overlayRect.width - margin));
            const sb = Math.max(margin, Math.min(savedPos.bottom, window.innerHeight - overlayRect.height - margin));
            overlay.classList.add('is-positioned');
            overlay.style.left = sl + 'px';
            overlay.style.bottom = sb + 'px';
        } else {
            positionToAnchor();
        }

        // Double-click on empty area to reset position and size
        overlayEventOwner.registerDomEvent(overlay, 'dblclick', function (e) {
            if (closest(e.target, '.wpp-search-close')) return;
            if (closest(e.target, '.wpp-switch-item')) return;
            if (closest(e.target, '.wpp-search-input')) return;
            if (closest(e.target, '.wpp-qs-action-btn')) return;
            resetSize();
            positionToAnchor();
            self.data.searchOverlayPosition = null;
            self.data.searchOverlaySize = null;
            void self.persistData();
        });

        // Right-click on empty area → settings context menu
        overlayEventOwner.registerDomEvent(overlay, 'contextmenu', function (e) {
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
                    void self.persistData();
                },
                onChanged: function () {
                    searchRow.classList.toggle('is-hidden', !self.data.showFilterInput);
                    renderGroupTabs();
                    refreshOrderedSessions();
                },
            });
        });

        // Resize via corner and edge handles
        overlayEventOwner.registerDomEvent(overlay, 'mousedown', function (e) {
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
            // Resizing is expressed as moving edges, not as changing a width and
            // then repairing the position. The old code did the latter and got
            // two things wrong that no amount of clamping afterwards could fix.
            //
            // Dragging the left edge left grew the width and moved `left` to
            // match. When `left` hit the margin it was pinned there - but the
            // width kept growing, so the right edge marched off the far side of
            // the window. The same on the right edge, mirrored.
            //
            // Dragging a top corner grew the height with `bottom` fixed, which
            // pushes the top edge up. The clamp then moved `bottom` to bring the
            // top back inside, and when `bottom` reached the margin it stopped,
            // leaving the height too large and the top off-screen.
            //
            // Each moved edge is now clamped on its own: into the window, and
            // against the opposite edge so the box never crosses the minimum.
            // The edge that is not being dragged never moves.
            const startEdges = {
                left: startRect.left,
                right: startRect.right,
                top: startRect.top,
                bottom: startRect.bottom,
            };

            const movesLeft = dir === 'tl' || dir === 'bl' || edge === 'left';
            const movesRight = dir === 'tr' || dir === 'br' || edge === 'right';
            const movesTop = dir === 'tl' || dir === 'tr' || edge === 'top';
            const movesBottom = dir === 'bl' || dir === 'br' || edge === 'bottom';

            // Order matters. The minimum size is a preference; staying inside the
            // window is not. In a window too narrow to hold MIN_WIDTH the box
            // gets smaller rather than hanging off the edge, so the window bound
            // is applied last and wins.
            const holdEdge = (value: number, minimumBound: number, windowLow: number, windowHigh: number): number =>
                Math.min(Math.max(minimumBound, windowLow), windowHigh);

            function onMove(ev: MouseEvent): void {
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;

                let { left, right, top, bottom } = startEdges;
                if (movesLeft) left = startEdges.left + dx;
                if (movesRight) right = startEdges.right + dx;
                if (movesTop) top = startEdges.top + dy;
                if (movesBottom) bottom = startEdges.bottom + dy;

                const maxRight = window.innerWidth - margin;
                const maxBottom = window.innerHeight - margin;
                if (movesLeft) left = holdEdge(left, Math.min(left, right - MIN_WIDTH), margin, maxRight);
                if (movesRight) right = holdEdge(right, Math.max(right, left + MIN_WIDTH), margin, maxRight);
                if (movesTop) top = holdEdge(top, Math.min(top, bottom - MIN_HEIGHT), margin, maxBottom);
                if (movesBottom) bottom = holdEdge(bottom, Math.max(bottom, top + MIN_HEIGHT), margin, maxBottom);

                const newWidth = right - left;
                const newHeight = bottom - top;
                const newLeft = left;
                const newBottom = window.innerHeight - bottom;

                overlay.style.width = newWidth + 'px';
                overlay.style.height = newHeight + 'px';
                overlay.classList.add('is-resized');
                overlay.style.left = newLeft + 'px';
                overlay.style.bottom = newBottom + 'px';
                overlay.classList.add('is-positioned');
            }

            function onUp() {
                releaseInteractionEventOwner(resizeEventOwner);

                const finalRect = overlay.getBoundingClientRect();
                self.data.searchOverlaySize = {
                    width: finalRect.width,
                    height: finalRect.height,
                };
                self.data.searchOverlayPosition = {
                    left: finalRect.left,
                    bottom: window.innerHeight - finalRect.bottom,
                };
                void self.persistData();
            }

            const resizeEventOwner = createInteractionEventOwner();
            resizeEventOwner.registerDomEvent(overlayDocument, 'mousemove', onMove);
            resizeEventOwner.registerDomEvent(overlayDocument, 'mouseup', onUp);
        });

        // Drag to reposition overlay via any empty area
        overlayEventOwner.registerDomEvent(overlay, 'mousedown', function (e) {
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
                overlay.style.left = newLeft + 'px';
                overlay.style.bottom = newBottom + 'px';
                overlay.classList.add('is-positioned');
            }

            function onUp() {
                releaseInteractionEventOwner(dragEventOwner);
                overlay.classList.remove('wpp-dragging');

                // Save position (bottom-based for stable positioning on resize)
                const finalRect = overlay.getBoundingClientRect();
                self.data.searchOverlayPosition = {
                    left: finalRect.left,
                    bottom: window.innerHeight - finalRect.bottom,
                };
                void self.persistData();
            }

            const dragEventOwner = createInteractionEventOwner();
            dragEventOwner.registerDomEvent(overlayDocument, 'mousemove', onMove);
            dragEventOwner.registerDomEvent(overlayDocument, 'mouseup', onUp);
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
            const focusGuardEventOwner = new Component();
            focusGuardEventOwner.load();
            this.focusGuardEventOwner = focusGuardEventOwner;
            focusGuardEventOwner.registerDomEvent(overlay, 'focusin', guardHandler, true);
            setTimeout(() => {
                if (this.focusGuardEventOwner === focusGuardEventOwner) {
                    focusGuardEventOwner.unload();
                    this.focusGuardEventOwner = null;
                }
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
