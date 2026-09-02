import { Modal, Notice, setIcon, setTooltip, type App } from 'obsidian';
import { L } from '../i18n.ts';
import { ConfirmModal } from './confirm-modal.ts';
import * as groupTabUi from '../group-tab-ui.ts';
import type { GroupTabPluginHost } from '../group-tab-ui.ts';
import * as navigationUtils from '../navigation-utils.ts';
import * as utils from '../utils.ts';
import { deriveSessionPresentation } from '../ui/shared/session-presenter.ts';
import * as sessionDrag from '../ui/shared/session-drag.ts';
import * as sessionContextActions from '../session-context-actions.ts';
import * as settingsContextMenu from '../settings-context-menu-items.ts';
import type { SettingsContextMenuPluginHost } from '../settings-context-menu-items.ts';
import * as sessionListActions from '../session-list-actions.ts';
import type { SessionGroup, SessionItem } from '../storage/default-data.ts';
import type { HistoryModalPluginHost } from './history-modal.ts';
import type { GroupStore } from '../state/group-store.ts';
import type { SessionSaver } from '../state/session-saver.ts';
import type { SessionStore } from '../state/session-store.ts';
import type { SessionSwitcher } from '../state/session-switcher.ts';
import type { CommandRegistry } from '../core/command-registry.ts';

export interface SessionManagerModalHost extends GroupTabPluginHost, HistoryModalPluginHost, SettingsContextMenuPluginHost {
    /**
     * Owned by CommandRegistry; naming it keeps one list rather than a
     * forwarding method per call on the plugin.
     */
    getCommandRegistry(): CommandRegistry;

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
        confirmDeleteByHotkey: boolean;
        showFilterInput: boolean;
        overlayDefaultFocus: string;
        [key: string]: unknown;
    };
}

/** Where the keyboard target currently sits. */
type KeyboardZone = 'none' | 'filter' | 'create-input' | 'create-button' | 'session-action';

interface KeyboardTarget {
    zone: KeyboardZone;
    rowIndex: number | null;
    actionKey: string | null;
}

/** A target as callers supply it: only `zone` is required. */
type KeyboardTargetRequest = { zone: KeyboardZone; rowIndex?: number | null; actionKey?: string | null };

const NO_TARGET: KeyboardTarget = { zone: 'none', rowIndex: null, actionKey: null };

const ARROW_NAVIGABLE_SELECTOR = [
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '.wpp-icon-btn[tabindex="-1"]',
].join(',');

// The locale dictionary is Record<string, StringValue>, so every lookup is
// possibly undefined and possibly a formatter. These two narrow it at the point
// of use, which is what the other migrated UI does.
function text(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

function format(value: unknown, ...args: (string | number)[]): string {
    if (typeof value !== 'function') return '';
    return (value as (...callArgs: (string | number)[]) => string)(...args);
}

// Every caller reads elements out of the modal's own markup, so an HTMLElement
// is all this ever sees. offsetParent alone is not enough: it is null for a
// fixed-position element as well as a hidden one, hence the rect fallback.
function isElementVisible(el: HTMLElement | null | undefined): boolean {
    if (!el) return false;
    if (el.offsetParent !== null) return true;
    const rects = typeof el.getClientRects === 'function' ? el.getClientRects() : null;
    return !!rects && rects.length > 0;
}

function closest(target: EventTarget | null, selector: string): HTMLElement | null {
    const found = target instanceof Element ? target.closest(selector) : null;
    return found instanceof HTMLElement ? found : null;
}

function visibleElements(root: ParentNode, selector: string): HTMLElement[] {
    return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(isElementVisible);
}

export class SessionManagerModal extends Modal {
    private readonly plugin: SessionManagerModalHost;

    nameInput!: HTMLInputElement;
    private saveBtn!: HTMLButtonElement;
    private filterInput: HTMLInputElement | null = null;
    private groupTabsRow!: HTMLElement;
    private bulkActionsEl!: HTMLElement;
    private bulkDeleteBtn!: HTMLButtonElement;
    private listEl!: HTMLElement;

    private filterQuery = '';
    private modalGroupId: string | null = null;
    private keyboardTarget: KeyboardTarget = NO_TARGET;
    private focusedIndex = -1;
    private selectedIds: Set<string> = new Set();

    private modalKeyHandler: ((event: KeyboardEvent) => void) | null = null;
    private contentFocusHandler: ((event: FocusEvent) => void) | null = null;

    /**
     * P13. The document that owns this modal, captured when the listener goes
     * on so that onClose takes it off the same one. Reading the owning document
     * again at close time would be a different object if the modal had moved,
     * and the listener would stay attached with nothing left to remove it.
     */
    private listenerDoc: Document | null = null;

    constructor(app: App, plugin: SessionManagerModalHost) {
        super(app);
        this.plugin = plugin;
    }

    override onOpen(): void {
        const contentEl = this.contentEl;
        contentEl.empty();
        contentEl.addClass('wpp-modal');

        this.titleEl.setText(text(L.modalTitle));

        const saveContainer = contentEl.createDiv({ cls: 'wpp-save-container' });
        this.nameInput = saveContainer.createEl('input', {
            type: 'text',
            placeholder: text(L.savePlaceholder),
            cls: 'wpp-save-input',
        });
        const saveBtn = saveContainer.createEl('button', { text: text(L.save), cls: 'wpp-save-btn' });
        this.saveBtn = saveBtn;

        this.filterInput = null;
        if (this.plugin.getSettingsState().showFilterInput) {
            const filterContainer = contentEl.createDiv({ cls: 'wpp-filter-container' });
            this.filterInput = filterContainer.createEl('input', {
                type: 'text',
                placeholder: text(L.filterPlaceholder),
                cls: 'wpp-filter-input',
            });
        }

        this.modalGroupId = this.plugin.getGroupStore().isGroupFeatureEnabled()
            ? this.plugin.getGroupStore().getActiveGroupId()
            : null;
        saveBtn.addEventListener('click', () => { this.onSave(); });
        saveBtn.addEventListener('focus', () => { this.setKeyboardTarget({ zone: 'create-button' }); });
        this.nameInput.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !e.isComposing) this.onSave();
        });
        this.nameInput.addEventListener('focus', () => { this.setKeyboardTarget({ zone: 'create-input' }); });
        this.filterQuery = '';
        if (this.filterInput) {
            const filterInput = this.filterInput;
            filterInput.addEventListener('focus', () => { this.setKeyboardTarget({ zone: 'filter' }); });
            filterInput.addEventListener('input', () => {
                this.filterQuery = filterInput.value || '';
                this.setKeyboardTarget({ zone: 'filter' });
                this.renderList();
            });
        }

        this.groupTabsRow = contentEl.createDiv({ cls: 'wpp-group-tabs-row' });
        this.renderGroupTabs();

        this.keyboardTarget = NO_TARGET;
        this.focusedIndex = -1;
        this.selectedIds = new Set();

        this.bulkActionsEl = contentEl.createDiv({ cls: 'wpp-bulk-actions wpp-is-hidden' });
        this.bulkDeleteBtn = this.bulkActionsEl.createEl('button', { cls: 'mod-warning' });
        this.bulkDeleteBtn.addEventListener('click', () => { this.onBulkDelete(); });
        const deselectBtn = this.bulkActionsEl.createEl('button', { text: text(L.deselect), cls: 'wpp-deselect-btn' });
        deselectBtn.addEventListener('click', () => {
            this.selectedIds.clear();
            this.updateSelectionUI();
        });

        this.listEl = contentEl.createDiv({ cls: 'wpp-session-list' });
        this.renderList();

        this.setKeyboardTarget(this.getDefaultSessionTarget());

        this.contentFocusHandler = (e: FocusEvent): void => {
            this.syncKeyboardTargetFromElement(e.target instanceof HTMLElement ? e.target : null);
        };
        contentEl.addEventListener('focusin', this.contentFocusHandler, true);

        const nextKey = this.plugin.getCommandRegistry().getCommandHotkey('next-session');
        const footer = contentEl.createDiv({ cls: 'wpp-modal-footer' });
        if (nextKey) {
            footer.createDiv({ text: `${text(L.cmdNext)}  ${nextKey}` });
        }
        footer.createDiv({ text: text(L.footerDragReorder) });
        if (this.plugin.getGroupStore().getOrderedGroups().length > 0) {
            footer.createDiv({ text: text(L.footerDragToGroup) });
        }

        // Right-click on empty area opens the settings context menu. Anything
        // that owns its own menu is skipped rather than handled here.
        contentEl.addEventListener('contextmenu', (e: MouseEvent) => {
            if (closest(e.target, '.wpp-session-item')) return;
            if (closest(e.target, '.wpp-save-container')) return;
            if (closest(e.target, '.wpp-filter-container')) return;
            if (closest(e.target, '.wpp-bulk-actions')) return;
            if (closest(e.target, '.wpp-group-tab')) return;
            e.preventDefault();
            settingsContextMenu.openSettingsContextMenu({
                plugin: this.plugin,
                app: this.app,
                event: e,
                onChanged: () => {
                    this.renderGroupTabs();
                    this.renderList();
                },
            });
        });

        // Keyboard handling: Enter activation plus directional arrow traversal.
        this.modalKeyHandler = (e: KeyboardEvent): void => {
            const doc = this.containerEl.ownerDocument;
            if (doc.querySelector('.wpp-confirm-buttons')) return;
            if (doc.querySelector('.wpp-switch-overlay')) return;

            const activeEl = doc.activeElement;
            if (activeEl && activeEl !== doc.body && !this.contentEl.contains(activeEl)) return;
            const controlEl = navigationUtils.getScopedControlEl(
                this.contentEl,
                activeEl instanceof HTMLElement ? activeEl : null,
            );

            // Left/Right moves only inside the current session-action row.
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                this.handleHorizontalArrowKey(e, controlEl ?? null);
                return;
            }

            // Up/Down moves across all arrow-navigable controls: the Tab range
            // plus the icon buttons, which are not in it.
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                this.handleVerticalArrowKey(e, activeEl instanceof HTMLElement ? activeEl : null, controlEl ?? null);
                return;
            }

            if (e.key !== 'Enter') return;
            this.handleEnterKey(e, controlEl ?? null);
        };
        this.listenerDoc = this.containerEl.ownerDocument;
        this.listenerDoc.addEventListener('keydown', this.modalKeyHandler, true);

        // Obsidian auto-focuses the first input, so the configured focus target
        // has to be applied after that has happened.
        const focusTarget = this.plugin.getSettingsState().overlayDefaultFocus;
        if (focusTarget !== 'session-create') {
            setTimeout(() => {
                if (focusTarget === 'session-filter' && this.filterInput) {
                    this.focusFilterInput();
                } else {
                    this.focusSessionTarget(this.getDefaultSessionTarget());
                }
            }, 50);
        }
    }

    getVisibleSessions(): SessionItem[] {
        const sessions = this.plugin.getSessionStore().getOrderedSessionsForGroup(this.getModalGroupId());
        const query = (this.filterQuery || '').trim().toLowerCase();
        if (!query) return sessions;
        return sessions.filter((session) => (session.name || '').toLowerCase().indexOf(query) !== -1);
    }

    getModalGroupId(): string | null {
        if (!this.plugin.getGroupStore().isGroupFeatureEnabled()) {
            this.modalGroupId = null;
            return null;
        }
        const groups = this.plugin.getGroupStore().getGroupMap();
        if (this.modalGroupId && !groups[this.modalGroupId]) {
            this.modalGroupId = this.plugin.getGroupStore().getActiveGroupId();
        }
        return this.modalGroupId || null;
    }

    async selectGroup(groupId: string | null): Promise<boolean> {
        if (!this.plugin.getGroupStore().isGroupFeatureEnabled()) {
            this.modalGroupId = null;
            this.renderGroupTabs();
            this.renderList();
            return false;
        }
        const result = await this.plugin.getGroupStore().resolveGroupSelection(groupId || null);
        this.modalGroupId = result.resolvedGroupId || null;
        this.renderGroupTabs();
        this.renderList();
        return result.switched;
    }

    getNavigationSessions(): SessionItem[] {
        return this.getVisibleSessions();
    }

    getArrowNavigables(): HTMLElement[] {
        return Array.from(this.contentEl.querySelectorAll<HTMLElement>(ARROW_NAVIGABLE_SELECTOR)).filter((el) => {
            if (!isElementVisible(el)) return false;
            if (el.getAttribute('aria-hidden') === 'true') return false;
            // The icon buttons are deliberately out of the Tab order but still
            // reachable with the arrows, so they are the one exception.
            if (el.tabIndex < 0 && !el.classList.contains('wpp-icon-btn')) return false;
            return true;
        });
    }

    getVisibleRowElements(): HTMLElement[] {
        return visibleElements(this.listEl, '.wpp-session-item');
    }

    getVisibleRowIndex(rowEl: HTMLElement | null): number {
        if (!rowEl) return -1;
        return this.getVisibleRowElements().indexOf(rowEl);
    }

    getRowActionTarget(rowEl: HTMLElement | null, actionKey?: string | null): HTMLElement | null {
        if (!rowEl) return null;
        let desiredKey = actionKey || 'load';
        if (desiredKey === 'primary') desiredKey = 'load';

        let target = rowEl.querySelector<HTMLElement>(`.wpp-session-actions [data-action-key="${desiredKey}"]`);
        if ((!target || !isElementVisible(target)) && desiredKey !== 'load') {
            target = rowEl.querySelector<HTMLElement>('.wpp-session-actions [data-action-key="load"]');
        }
        if (target && isElementVisible(target)) return target;

        const rowControls = visibleElements(rowEl, '.wpp-session-actions button, .wpp-session-actions .wpp-icon-btn');
        return rowControls[0] ?? null;
    }

    getDefaultSessionTarget(): KeyboardTargetRequest {
        const sessions = this.getNavigationSessions();
        if (sessions.length === 0) return { zone: this.filterInput ? 'filter' : 'create-input' };
        const activeIdx = this.plugin.getSessionStore().findActiveSessionIndex(sessions);
        return { zone: 'session-action', rowIndex: activeIdx !== -1 ? activeIdx : 0, actionKey: 'load' };
    }

    getEdgeSessionTarget(which: 'first' | 'last', actionKey?: string | null): KeyboardTargetRequest | null {
        const rows = this.getVisibleRowElements();
        if (!rows.length) return null;
        return {
            zone: 'session-action',
            rowIndex: which === 'last' ? rows.length - 1 : 0,
            actionKey: actionKey || 'load',
        };
    }

    setKeyboardTarget(target: KeyboardTargetRequest | null): void {
        const request = target || NO_TARGET;
        if (request.zone !== 'session-action') {
            this.keyboardTarget = { zone: request.zone || 'none', rowIndex: null, actionKey: null };
            this.updateFocusUI();
            return;
        }

        const sessions = this.getNavigationSessions();
        let nextIndex = typeof request.rowIndex === 'number' ? request.rowIndex : -1;
        if (nextIndex >= sessions.length) nextIndex = sessions.length - 1;
        if (nextIndex < 0 && sessions.length > 0) nextIndex = 0;
        this.keyboardTarget = {
            zone: 'session-action',
            rowIndex: nextIndex >= 0 ? nextIndex : null,
            actionKey: request.actionKey || 'load',
        };
        this.updateFocusUI();
    }

    syncKeyboardTargetFromElement(el: HTMLElement | null): void {
        if (!el || !this.contentEl.contains(el)) return;
        const rowAction = closest(el, '.wpp-session-actions');
        if (rowAction && this.contentEl.contains(rowAction)) {
            this.setKeyboardTarget({
                zone: 'session-action',
                rowIndex: this.getVisibleRowIndex(closest(el, '.wpp-session-item')),
                actionKey: el.getAttribute('data-action-key') || 'load',
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
    }

    focusCreateInput(): void {
        this.setKeyboardTarget({ zone: 'create-input' });
        navigationUtils.focusTextInputEnd(this.nameInput);
    }

    focusFilterInput(): boolean {
        if (!this.filterInput) return false;
        this.setKeyboardTarget({ zone: 'filter' });
        navigationUtils.focusTextInputSelect(this.filterInput);
        return true;
    }

    handleHorizontalArrowKey(e: KeyboardEvent, controlEl: HTMLElement | null): void {
        if (e.isComposing) return;
        if (controlEl === this.nameInput && e.key === 'ArrowRight') {
            // Only once the caret has nothing left to move past, so the arrows
            // still edit the text they are in.
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

        const actionRow = closest(controlEl, '.wpp-session-actions');
        if (!actionRow || !this.contentEl.contains(actionRow)) return;
        const rowControls = visibleElements(actionRow, 'button, .wpp-icon-btn');
        if (rowControls.length === 0) return;
        const rowIndex = rowControls.indexOf(controlEl);
        if (rowIndex === -1) return;
        const nextRowIndex = rowIndex + (e.key === 'ArrowRight' ? 1 : -1);
        // Horizontal movement stops at the ends of the row rather than wrapping.
        if (nextRowIndex < 0 || nextRowIndex >= rowControls.length) return;

        e.preventDefault();
        e.stopPropagation();
        rowControls[nextRowIndex]?.focus();
    }

    handleVerticalArrowKey(e: KeyboardEvent, activeEl: HTMLElement | null, controlEl: HTMLElement | null): void {
        if (e.isComposing) return;
        // A textarea and a select both use the arrows themselves.
        if (activeEl && activeEl.tagName === 'TEXTAREA') return;
        if (activeEl && activeEl.tagName === 'SELECT') return;
        const dir = e.key === 'ArrowUp' ? -1 : 1;

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

        const currentRowIndex = this.keyboardTarget.rowIndex;
        if (this.keyboardTarget.zone === 'session-action' && currentRowIndex !== null && currentRowIndex >= 0) {
            const activeActionRow = closest(controlEl, '.wpp-session-actions');
            const rows = this.getVisibleRowElements();
            let actionKey = this.keyboardTarget.actionKey || 'load';
            if (activeActionRow && this.contentEl.contains(activeActionRow) && controlEl) {
                actionKey = controlEl.getAttribute('data-action-key') || actionKey;
            }
            // The inline save button exists only on the active row, so carrying
            // that action key down would land on nothing.
            const verticalActionKey = actionKey === 'save-inline' ? 'load' : actionKey;
            if (rows.length === 0) return;

            e.preventDefault();
            e.stopPropagation();
            const nextRowIndex = currentRowIndex + dir;
            if (nextRowIndex >= 0 && nextRowIndex < rows.length
                && this.focusSessionTarget({ zone: 'session-action', rowIndex: nextRowIndex, actionKey: verticalActionKey })) {
                return;
            }
            if (e.key === 'ArrowUp') {
                if (this.filterInput) this.focusFilterInput();
                else this.focusCreateInput();
            } else {
                this.focusCreateInput();
            }
            return;
        }

        if (controlEl === this.nameInput || controlEl === this.saveBtn) {
            e.preventDefault();
            e.stopPropagation();
            if (e.key === 'ArrowDown') {
                if (this.filterInput) this.focusFilterInput();
                else this.focusSessionTarget(this.getEdgeSessionTarget('first', 'load'));
            } else {
                this.focusSessionTarget(this.getEdgeSessionTarget('last', 'load'));
            }
            return;
        }

        // Nothing recognised is focused, so fall back to plain traversal of
        // everything reachable, which does wrap.
        const navigables = this.getArrowNavigables();
        if (navigables.length === 0) return;
        const currentIndex = controlEl ? navigables.indexOf(controlEl) : -1;
        let nextEl: HTMLElement | undefined;
        if (currentIndex === -1) {
            nextEl = e.key === 'ArrowUp' ? navigables[navigables.length - 1] : navigables[0];
        } else {
            let fallbackIndex = currentIndex + dir;
            if (fallbackIndex < 0) fallbackIndex = navigables.length - 1;
            if (fallbackIndex >= navigables.length) fallbackIndex = 0;
            nextEl = navigables[fallbackIndex];
        }

        e.preventDefault();
        e.stopPropagation();
        nextEl?.focus();
    }

    handleEnterKey(e: KeyboardEvent, controlEl: HTMLElement | null): void {
        if (controlEl === this.filterInput && !e.isComposing) {
            // Enter in the filter commits only when the filter has narrowed the
            // list to a single answer.
            const filtered = this.getNavigationSessions();
            const only = filtered.length === 1 ? filtered[0] : undefined;
            if (only) {
                e.preventDefault();
                this.onLoad(only.id);
            }
            return;
        }

        if (controlEl && controlEl.classList.contains('wpp-icon-btn') && this.contentEl.contains(controlEl)) {
            e.preventDefault();
            e.stopPropagation();
            controlEl.click();
            return;
        }

        if (controlEl && controlEl.tagName === 'BUTTON' && this.contentEl.contains(controlEl)) {
            e.preventDefault();
            e.stopPropagation();
            if (controlEl.classList.contains('wpp-load-btn')) {
                const row = closest(controlEl, '.wpp-session-item');
                const sessionId = row?.dataset.sessionId;
                if (sessionId) {
                    this.onLoad(sessionId);
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

        const rowIndex = this.keyboardTarget.rowIndex;
        if (this.keyboardTarget.zone === 'session-action' && rowIndex !== null && rowIndex >= 0) {
            e.preventDefault();
            this.onFocusedLoad();
        }
    }

    focusSessionTarget(target: KeyboardTargetRequest | null): boolean {
        if (!target || target.zone !== 'session-action') return false;
        const rows = this.getVisibleRowElements();
        const rowIndex = typeof target.rowIndex === 'number' ? target.rowIndex : -1;
        const rowEl = rowIndex >= 0 ? rows[rowIndex] : undefined;
        if (!rowEl) return false;
        const actionTarget = this.getRowActionTarget(rowEl, target.actionKey);
        if (!actionTarget) return false;
        this.setKeyboardTarget({
            zone: 'session-action',
            rowIndex,
            actionKey: actionTarget.getAttribute('data-action-key') || target.actionKey || 'load',
        });
        actionTarget.focus();
        return true;
    }

    normalizeKeyboardTargetAfterRender(sessions: SessionItem[]): void {
        if (this.keyboardTarget.zone !== 'session-action') return;
        if (!sessions.length) {
            this.keyboardTarget = {
                zone: this.filterInput ? 'filter' : 'create-input',
                rowIndex: null,
                actionKey: null,
            };
            return;
        }
        const rowIndex = this.keyboardTarget.rowIndex;
        if (rowIndex !== null && rowIndex >= sessions.length) {
            this.keyboardTarget.rowIndex = sessions.length - 1;
        } else if (rowIndex === null || rowIndex < 0) {
            this.keyboardTarget.rowIndex = 0;
        }
    }

    blurFocusedControl(): void {
        const activeEl = this.containerEl.ownerDocument.activeElement;
        if (activeEl instanceof HTMLElement && this.contentEl.contains(activeEl)) {
            activeEl.blur();
        }
    }

    renderList(): void {
        this.listEl.empty();
        const sessions = this.getVisibleSessions();
        const selectedGroupId = this.getModalGroupId();
        const ordered = this.plugin.getSessionStore().getOrderedSessionsForGroup(selectedGroupId);
        const orderIndex: Record<string, number> = {};
        for (let i = 0; i < ordered.length; i++) {
            const session = ordered[i];
            if (session) orderIndex[session.id] = i;
        }
        for (let i = 0; i < sessions.length; i++) {
            const session = sessions[i];
            if (session) this.renderSessionItem(session, i, orderIndex[session.id]);
        }
        if (sessions.length === 0) {
            // An empty group and an empty filter result read differently to a
            // user: one has nothing in it, the other has nothing matching.
            const isGroupEmpty = !!selectedGroupId && ordered.length === 0;
            const emptyEl = this.listEl.createDiv({
                text: isGroupEmpty ? text(L.noGroupSessions) : text(L.noFilteredSessions),
                cls: 'wpp-empty-state',
            });
            if (isGroupEmpty) emptyEl.addClass('wpp-empty-state-group');
        } else {
            this.setupDragAndDrop();
        }

        this.normalizeKeyboardTargetAfterRender(sessions);

        const validIds: Record<string, boolean> = {};
        for (const session of sessions) validIds[session.id] = true;
        this.selectedIds.forEach((id) => {
            if (!validIds[id]) this.selectedIds.delete(id);
        });
        this.updateFocusUI();
        this.updateSelectionUI();
    }

    renderSessionItem(session: SessionItem, index: number, orderIndex?: number): void {
        // The hotkey hint follows the session's place in the unfiltered order,
        // because that is what the numbered commands switch to.
        const hintIndex = typeof orderIndex === 'number' ? orderIndex : index;
        const presentation = deriveSessionPresentation(session, {
            activeSessionId: this.plugin.getSessionStore().getActiveSessionId(),
            index: hintIndex,
            commandHotkey: hintIndex <= 8 ? this.plugin.getCommandRegistry().getCommandHotkey(`switch-to-${hintIndex + 1}`) : '',
            defaultSessionName: this.plugin.getSessionStore().getDefaultSessionName(),
        });
        const isActive = presentation.isActive;

        const item = this.listEl.createDiv({ cls: 'wpp-session-item' });
        item.dataset.sessionId = presentation.id;

        item.addEventListener('click', (e: MouseEvent) => {
            // A click always moves the keyboard target, whatever else it does.
            this.setKeyboardTarget({ zone: 'session-action', rowIndex: index, actionKey: 'load' });

            if (closest(e.target, 'button, .wpp-icon-btn')) return;
            this.blurFocusedControl();
            if (utils.isModPressed(e)) {
                if (this.selectedIds.has(session.id)) this.selectedIds.delete(session.id);
                else this.selectedIds.add(session.id);
            } else {
                this.selectedIds.clear();
            }
            this.updateSelectionUI();
        });

        item.addEventListener('contextmenu', (e: MouseEvent) => {
            e.preventDefault();
            const selectedGroupId = this.getModalGroupId();
            sessionContextActions.openSessionContextMenu({
                plugin: this.plugin,
                app: this.app,
                session,
                isActive,
                event: e,
                showSwitch: true,
                showRemoveFromGroup: !!selectedGroupId,
                getViewGroupId: () => this.getModalGroupId(),
                onSwitch: () => { this.onLoad(session.id); },
                showMoveToGroup: this.plugin.getGroupStore().isGroupFeatureEnabled() && this.plugin.getGroupStore().getOrderedGroups().length > 0,
                forceDeleteConfirm: true,
                onGroupsChanged: () => { this.renderGroupTabs(); },
                onSessionsChanged: () => { this.renderList(); },
            });
        });

        item.createSpan({ text: presentation.hotkeyText, cls: 'wpp-session-index' });

        const info = item.createDiv({ cls: 'wpp-session-info' });
        const nameRow = info.createDiv({ cls: 'wpp-session-name-row' });
        nameRow.createSpan({ text: presentation.name, cls: 'wpp-session-name' });
        if (presentation.isDefault) {
            nameRow.createSpan({ text: text(L.defaultLabel), cls: 'wpp-default-label' });
        }
        if (isActive) {
            nameRow.createSpan({ text: text(L.active), cls: 'wpp-active-badge' });
        }
        info.createDiv({ text: presentation.modifiedText, cls: 'wpp-session-modified' });

        const actions = item.createDiv({ cls: 'wpp-session-actions' });

        const loadBtn = actions.createEl('button', { text: text(L.load), cls: 'wpp-load-btn' });
        loadBtn.setAttribute('data-action-key', 'load');
        loadBtn.addEventListener('click', () => { this.onLoad(session.id); });

        // Saving the current layout only means anything on the active session,
        // and only when it is not already saved on every switch.
        if (isActive && !this.plugin.getSessionSaver().isAutoSaveOnSwitchEnabled()) {
            const saveCurrentBtn = actions.createEl('button', { text: text(L.saveInline), cls: 'wpp-save-inline-btn' });
            saveCurrentBtn.setAttribute('data-action-key', 'save-inline');
            saveCurrentBtn.addEventListener('click', (e: MouseEvent) => {
                e.stopPropagation();
                void this.plugin.getSessionSaver().saveActiveSession().then(() => { this.renderList(); });
            });
            actions.insertBefore(saveCurrentBtn, loadBtn);
            // Keep the save button the same width as the switch button it sits
            // beside, so the row does not shift when the pair appears.
            saveCurrentBtn.style.width = `${loadBtn.offsetWidth}px`;
        }

        const renameBtn = actions.createDiv({
            cls: 'wpp-icon-btn',
            attr: {
                role: 'button',
                tabindex: '-1',
                'data-action-key': 'rename',
                'aria-label': text(L.rename),
            },
        });
        setIcon(renameBtn, 'pencil');
        setTooltip(renameBtn, text(L.rename), { delay: 250 });
        renameBtn.addEventListener('click', (e: MouseEvent) => {
            e.stopPropagation();
            this.onRename(session);
        });

        // No delete on the last remaining session: there has to be one left.
        if (this.plugin.getSessionStore().getSessionCount() > 1) {
            const deleteBtn = actions.createDiv({
                cls: 'wpp-icon-btn',
                attr: {
                    role: 'button',
                    tabindex: '-1',
                    'data-action-key': 'delete',
                    'aria-label': text(L.delete),
                },
            });
            setIcon(deleteBtn, 'trash-2');
            setTooltip(deleteBtn, text(L.delete), { delay: 250 });
            deleteBtn.addEventListener('click', (e: MouseEvent) => {
                e.stopPropagation();
                void this.onDelete(session);
            });
        }
    }

    setupDragAndDrop(): void {
        // Reordering a filtered list would commit an order the user cannot see.
        if ((this.filterQuery || '').trim()) return;

        this.listEl.querySelectorAll<HTMLElement>('.wpp-session-item').forEach((item) => {
            sessionDrag.attachSessionDrag({
                itemEl: item,
                listEl: this.listEl,
                itemSelector: '.wpp-session-item',
                groupTabsContainer: this.groupTabsRow,
                bodyDraggingClass: 'wpp-session-list-dragging',
                onDropOnGroup: (sessionId: string, groupId: string) => {
                    const sessionName = this.plugin.getSessionStore().findSession(sessionId)?.name || '';
                    const groupName = this.plugin.getGroupStore().findGroup(groupId)?.name || '';
                    return this.plugin.getGroupStore().moveSessionToGroupExclusive(sessionId, groupId).then(() => {
                        new Notice(format(L.groupAddedSession, sessionName, groupName));
                        this.renderGroupTabs();
                        this.renderList();
                    });
                },
                onDropOnAllGroup: (sessionId: string) => {
                    // "All" is a view, not a group, so dropping there means
                    // leaving whichever group is currently being viewed.
                    const currentGroupId = this.getModalGroupId();
                    if (!currentGroupId) return undefined;
                    const sessionName = this.plugin.getSessionStore().findSession(sessionId)?.name || '';
                    const groupName = this.plugin.getGroupStore().findGroup(currentGroupId)?.name || '';
                    return this.plugin.getGroupStore().removeSessionFromGroup(sessionId, currentGroupId).then(() => {
                        new Notice(format(L.groupRemovedSession, sessionName, groupName));
                        this.renderGroupTabs();
                        this.renderList();
                    });
                },
                onReorder: (newVisibleOrder: string[]) => {
                    // Relabel in place rather than re-rendering: a full render
                    // would drop the element the drag is still holding.
                    this.listEl.querySelectorAll<HTMLElement>('.wpp-session-item').forEach((el, i) => {
                        const indexEl = el.querySelector('.wpp-session-index');
                        if (indexEl) {
                            const hotkey = i <= 8 ? this.plugin.getCommandRegistry().getCommandHotkey(`switch-to-${i + 1}`) : '';
                            indexEl.textContent = hotkey || String(i + 1);
                        }
                    });

                    item.classList.add('wpp-just-moved');
                    setTimeout(() => { item.classList.remove('wpp-just-moved'); }, 600);

                    void this.plugin.getSessionStore().setSessionOrderFromVisible(newVisibleOrder, { syncCommands: false });
                },
            });
        });
    }

    onSave(): void {
        const selectedGroupId = this.getModalGroupId();
        void this.plugin.getSessionStore().createSessionForViewedGroup(this.nameInput.value, selectedGroupId).then((result) => {
            if (!result || !result.created) return;
            this.modalGroupId = result.viewGroupId || null;
            this.nameInput.value = '';
            this.renderGroupTabs();
            this.renderList();
            new Notice(format(L.created, result.name));
        });
    }

    onLoad(sessionId: string): void {
        if (sessionId === this.plugin.getSessionStore().getActiveSessionId()) return;
        void this.plugin.getSessionSwitcher().switchSession(sessionId).then((switched) => {
            if (switched) this.close();
        });
    }

    onRename(session: SessionItem): void {
        sessionListActions.renameSessionWithPrompt({
            app: this.app,
            plugin: this.plugin,
            session,
            onRenamed: () => { this.renderList(); },
        });
    }

    onDelete(session: SessionItem): unknown {
        const isActive = session.id === this.plugin.getSessionStore().getActiveSessionId();
        return sessionListActions.deleteSessionWithPrompt({
            app: this.app,
            plugin: this.plugin,
            session,
            isActive,
            confirmMessage: isActive ? format(L.confirmDeleteActive, session.name) : format(L.confirmDelete, session.name),
            forceConfirm: true,
            onDeleted: () => { this.renderList(); },
        });
    }

    updateFocusUI(): void {
        const items = this.listEl.querySelectorAll<HTMLElement>('.wpp-session-item');
        let focusedIndex = -1;
        if (this.keyboardTarget.zone === 'session-action' && this.keyboardTarget.rowIndex !== null) {
            focusedIndex = this.keyboardTarget.rowIndex;
        }
        this.focusedIndex = focusedIndex;
        items.forEach((el, i) => { el.classList.toggle('wpp-focused', i === focusedIndex); });
        if (focusedIndex >= 0) {
            items[focusedIndex]?.scrollIntoView({ block: 'nearest' });
        }
    }

    updateSelectionUI(): void {
        this.listEl.querySelectorAll<HTMLElement>('.wpp-session-item').forEach((el) => {
            const sessionId = el.dataset.sessionId;
            el.classList.toggle('wpp-selected', !!sessionId && this.selectedIds.has(sessionId));
        });
        this.updateBulkActions();
    }

    updateBulkActions(): void {
        const hasSelection = this.selectedIds.size > 0;
        this.bulkActionsEl.classList.toggle('wpp-is-hidden', !hasSelection);
        if (hasSelection) {
            this.bulkDeleteBtn.textContent = format(L.bulkDelete, this.selectedIds.size);
        }
    }

    onFocusedLoad(): void {
        const sessions = this.getNavigationSessions();
        const rowIndex = this.keyboardTarget.zone === 'session-action'
            ? this.keyboardTarget.rowIndex
            : this.focusedIndex;
        if (rowIndex === null || rowIndex < 0) return;
        const session = sessions[rowIndex];
        if (session) this.onLoad(session.id);
    }

    onBulkDelete(): void {
        const ids: string[] = [];
        this.selectedIds.forEach((id) => { ids.push(id); });

        new ConfirmModal(this.app, format(L.confirmBulkDelete, ids.length), () => {
            void Promise.all(ids.map((id) => this.plugin.getSessionStore().deleteSession(id))).then((results) => {
                // Report what actually went, not what was attempted.
                const deletedCount = results.filter(Boolean).length;
                this.selectedIds.clear();
                this.renderList();
                if (deletedCount > 0) {
                    new Notice(format(L.bulkDeleted, deletedCount));
                }
            });
        }).open();
    }

    renderGroupTabs(): void {
        const el = this.groupTabsRow;
        while (el.firstChild) el.removeChild(el.firstChild);

        if (!this.plugin.getGroupStore().isGroupFeatureEnabled()) {
            el.classList.add('wpp-is-hidden');
            return;
        }
        el.classList.remove('wpp-is-hidden');

        groupTabUi.renderGroupTabs({
            app: this.app,
            plugin: this.plugin,
            containerEl: el,
            groups: this.plugin.getGroupStore().getGroupMap(),
            groupOrder: this.plugin.getGroupStore().getOrderedGroupTabIds(),
            selectedGroupId: this.getModalGroupId(),
            onSelectGroup: (groupId: string | null) => { void this.selectGroup(groupId); },
            onResetViewGroup: () => { this.modalGroupId = null; },
            onDeleteGroup: (deletedGroupId: string) => {
                if (this.modalGroupId === deletedGroupId) {
                    this.modalGroupId = this.plugin.getGroupStore().getActiveGroupId();
                }
            },
            onGroupsChanged: () => { this.renderGroupTabs(); },
            onSessionsChanged: () => { this.renderList(); },
            onGroupOrderCommit: (newOrder: string[]) => { void this.plugin.getGroupStore().setGroupTabOrder(newOrder); },
            addButtonTooltip: text(L.groupCreateNew),
            onAddGroupClick: () => {
                groupTabUi.openCreateGroupPrompt(this.app, this.plugin, () => { this.renderGroupTabs(); });
            },
        });
    }

    override onClose(): void {
        this.containerEl.ownerDocument.body.classList.remove('wpp-session-list-dragging');
        if (this.modalKeyHandler) {
            (this.listenerDoc ?? this.containerEl.ownerDocument)
                .removeEventListener('keydown', this.modalKeyHandler, true);
            this.modalKeyHandler = null;
            this.listenerDoc = null;
        }
        if (this.contentFocusHandler) {
            this.contentEl.removeEventListener('focusin', this.contentFocusHandler, true);
            this.contentFocusHandler = null;
        }
        this.contentEl.empty();
    }
}

export function openSessionManagerModal(
    app: App,
    plugin: SessionManagerModalHost,
    focusName?: boolean
): SessionManagerModal {
    const modal = new SessionManagerModal(app, plugin);
    modal.open();
    if (!focusName) return modal;
    // create-session lands the caret in the name field. The delay is the
    // one the pre-migration code used; the modal fills its content in
    // onOpen, so the input does not exist yet when open() returns.
    if (typeof window !== 'undefined') {
        window.setTimeout(() => {
            if (modal.nameInput) modal.nameInput.focus();
        }, 100);
    }
    return modal;
}

