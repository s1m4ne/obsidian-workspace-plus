import { L } from '../../i18n.ts';
import { deriveSessionPresentation } from '../shared/session-presenter.ts';
import { isModShiftPressed } from '../../utils.ts';
import type { SessionItem } from '../../storage/default-data.ts';
import type { GroupStore } from '../../state/group-store.ts';

export interface SwitchOverlayHost {
    /**
     * Group state is owned by GroupStore. Naming the store rather than
     * restating its methods keeps one list: the plugin used to carry a
     * forwarding method per call, and one added to the store without a shim did
     * nothing from here while the type checker saw a host merely lacking it.
     */
    getGroupStore(): GroupStore;

    data: {
        activeSessionId: string;
        activeGroupId: string | null;
        groups?: Record<string, { id: string; name: string }>;
        [key: string]: unknown;
    };
    getOrderedSessionsUnfiltered(): SessionItem[];
    getCommandHotkey(cmd: string, slot?: number): string;
    findActiveSessionIndex(sessions: SessionItem[]): number;
    switchSession(sessionId: string, options?: { silent?: boolean }): Promise<boolean>;
    getOrderedSessionsForGroup(groupId: string | null): SessionItem[];
    onSessionsChanged(listener: () => void): () => void;
    clearSessionSwitchNotice?: (() => void) | undefined;
    hideSearchOverlay?: (() => void) | undefined;
}

export interface SwitchOverlayOptions {
    mode?: 'preview' | 'feedback' | undefined;
    durationMs?: number | undefined;
    // Set when re-rendering an overlay that is already up, so the 300 ms
    // minimum-visibility floor is measured from when the person actually saw it
    // rather than restarting on every redraw.
    keepShownAt?: boolean | undefined;
}

export class SwitchOverlay {
    private host: SwitchOverlayHost;
    overlayEl: HTMLElement | null = null;
    viewGroupId: string | null = null;
    private unsubscribeSessions: (() => void) | null = null;
    private shownAt = 0;
    timer: number | null = null;
    keyUpHandler: ((e: KeyboardEvent) => void) | null = null;
    keyDownHandler: ((e: KeyboardEvent) => void) | null = null;
    blurHandler: (() => void) | null = null;

    constructor(host: SwitchOverlayHost) {
        this.host = host;
    }

    get isVisible(): boolean {
        return this.overlayEl !== null;
    }

    showPreview(ordered: SessionItem[], activeIndex: number, viewGroupId?: string | null): void {
        this.show(ordered, activeIndex, viewGroupId, { mode: 'preview' });
    }

    showFeedback(ordered: SessionItem[], activeIndex: number, viewGroupId?: string | null, options?: SwitchOverlayOptions): void {
        this.show(ordered, activeIndex, viewGroupId, Object.assign({}, options, { mode: 'feedback' as const }));
    }

    show(ordered: SessionItem[], activeIndex: number, viewGroupId?: string | null, options?: SwitchOverlayOptions): void {
        const opts = options || {};
        if (this.host.clearSessionSwitchNotice) {
            this.host.clearSessionSwitchNotice();
        }
        if (this.host.hideSearchOverlay) {
            this.host.hideSearchOverlay();
        }

        // Clean up existing overlay and listeners
        this.cleanupListeners();
        if (this.overlayEl) {
            this.overlayEl.remove();
            this.overlayEl = null;
        }

        let overlayGroupId: string | null = this.host.getGroupStore().isGroupFeatureEnabled()
            ? (typeof viewGroupId === 'undefined'
                ? (this.host.data.activeGroupId || null)
                : (viewGroupId || null))
            : null;

        const groups = this.host.data.groups || {};
        if (overlayGroupId && !groups[overlayGroupId]) {
            overlayGroupId = this.host.data.activeGroupId || null;
        }

        const overlayMode = opts.mode || 'preview';
        const feedbackDurationMs = Math.max(0, Number(opts.durationMs) || 400);
        this.viewGroupId = overlayGroupId;

        const reopenOverlayForGroup = (result: { sessions: SessionItem[]; resolvedGroupId: string | null }): void => {
            const newOrdered = result.sessions;
            const newActiveIndex = this.host.findActiveSessionIndex(newOrdered);
            this.show(newOrdered, newActiveIndex, result.resolvedGroupId, opts);
        };

        const onGroupTabClick = (targetGroupId: string | null, e?: MouseEvent): void => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            void this.host.getGroupStore().resolveGroupSelection(targetGroupId || null).then(reopenOverlayForGroup);
        };

        const onSessionItemClick = (sessionId: string, e?: MouseEvent): void => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            if (!sessionId) return;
            if (sessionId === this.host.data.activeSessionId) {
                this.hide();
                return;
            }
            void this.host.switchSession(sessionId, { silent: true }).then((switched) => {
                if (switched) this.hide();
            });
        };

        const overlay = document.body.createDiv({ cls: 'wpp-switch-overlay' });

        // Count
        const countText = activeIndex >= 0
            ? `${activeIndex + 1} / ${ordered.length}`
            : `– / ${ordered.length}`;
        overlay.createDiv({ cls: 'wpp-switch-count', text: countText });

        // Group tabs (only when groups exist)
        const realGroups = this.host.getGroupStore().getOrderedGroups();
        if (realGroups.length > 0) {
            const groupTabsRow = overlay.createDiv({ cls: 'wpp-group-tabs' });

            const allGroups = this.host.data.groups || {};
            const groupOrder = this.host.getGroupStore().getOrderedGroupTabIds();
            for (let gi = 0; gi < groupOrder.length; gi++) {
                const gid = groupOrder[gi];
                if (gid === '__all__') {
                    const allText = typeof L.groupAll === 'string' ? L.groupAll : 'All';
                    const allTab = groupTabsRow.createDiv({
                        cls: overlayGroupId ? 'wpp-group-tab' : 'wpp-group-tab is-active',
                        text: allText,
                    });
                    allTab.addEventListener('click', (e) => {
                        onGroupTabClick(null, e);
                    });
                } else if (gid && allGroups[gid]) {
                    const tabName = allGroups[gid]?.name ?? '';
                    const tab = groupTabsRow.createDiv({
                        cls: overlayGroupId === gid ? 'wpp-group-tab is-active' : 'wpp-group-tab',
                        text: tabName,
                    });
                    tab.addEventListener('click', (e) => {
                        onGroupTabClick(gid, e);
                    });
                }
            }
        }

        // Session list
        const list = overlay.createDiv({ cls: 'wpp-switch-list' });

        for (let i = 0; i < ordered.length; i++) {
            const session = ordered[i];
            if (!session) continue;
            const presentation = deriveSessionPresentation(session, {
                activeSessionId: this.host.data.activeSessionId,
                index: i,
                commandHotkey: i <= 8 ? this.host.getCommandHotkey(`switch-to-${i + 1}`) : '',
            });
            const item = list.createDiv({
                cls: i === activeIndex ? 'wpp-switch-item is-active' : 'wpp-switch-item',
            });
            item.dataset['sessionId'] = presentation.id;

            item.createDiv({ cls: 'wpp-switch-name', text: presentation.name });
            item.createDiv({ cls: 'wpp-switch-hotkey', text: presentation.hotkeyText });

            const targetId = session.id;
            item.addEventListener('click', (e) => {
                onSessionItemClick(targetId, e);
            });
        }

        // Footer
        const footerRow = overlay.createDiv({ cls: 'wpp-switch-footer' });

        // Group hint (only when groups exist)
        if (realGroups.length > 0) {
            const switchGroupText = typeof L.switchGroup === 'string' ? L.switchGroup : '';
            const keyTabText = typeof L.keyTab === 'string' ? L.keyTab : 'Tab';
            // Both keys do the same thing, and neither is a translated word.
            footerRow.createDiv({ text: `${keyTabText} / G  ${switchGroupText}` });
        }

        const nextKey = this.host.getCommandHotkey('next-session');
        if (nextKey) {
            const cmdNextText = typeof L.cmdNext === 'string' ? L.cmdNext : '';
            footerRow.createDiv({ text: `${cmdNextText}  ${nextKey}` });
        }

        const prevKey2 = this.host.getCommandHotkey('previous-session');
        const nextKey2 = this.host.getCommandHotkey('next-session', 1);
        if (prevKey2 || nextKey2) {
            const parts: string[] = [];
            if (prevKey2) {
                const switchLeftText = typeof L.switchLeft === 'string' ? L.switchLeft : '';
                parts.push(`${switchLeftText} ${prevKey2}`);
            }
            if (nextKey2) {
                const switchRightText = typeof L.switchRight === 'string' ? L.switchRight : '';
                parts.push(`${switchRightText} ${nextKey2}`);
            }
            footerRow.createDiv({ text: parts.join('  /  ') });
        }

        // Measure max size using ALL sessions (unfiltered) before showing
        const allSessions = this.host.getOrderedSessionsUnfiltered();
        if (allSessions.length > ordered.length) {
            // Carries the overlay's own class as well. Measuring inside a bare
            // div loses the flex layout and the padding, so the width came back
            // as the full viewport and got baked into min-width - the overlay
            // stretched edge to edge in any group but "All", which is the only
            // case that reaches this branch.
            const measure = document.body.createDiv({ cls: 'wpp-switch-overlay wpp-measure-overlay' });
            // Clone count + group tabs
            for (let ci = 0; ci < overlay.childNodes.length; ci++) {
                const child = overlay.childNodes[ci];
                if (child === list) break;
                if (child) measure.appendChild(child.cloneNode(true));
            }
            // Build full session list for measurement
            const measureList = measure.createDiv({ cls: 'wpp-switch-list' });
            for (let mi = 0; mi < allSessions.length; mi++) {
                const s = allSessions[mi];
                if (!s) continue;
                const mPresentation = deriveSessionPresentation(s, {
                    index: mi,
                });
                const mItem = measureList.createDiv({ cls: 'wpp-switch-item' });
                mItem.createDiv({ cls: 'wpp-switch-name', text: mPresentation.name });
                mItem.createDiv({ cls: 'wpp-switch-hotkey', text: mPresentation.hotkeyText });
            }
            // Clone footer
            measure.appendChild(footerRow.cloneNode(true));
            overlay.style.setProperty('min-width', `${measure.offsetWidth}px`);
            overlay.style.setProperty('min-height', `${measure.offsetHeight}px`);
            measure.remove();
        }

        this.overlayEl = overlay;

        // Listen only while visible, so there is nothing to leak and no work
        // done when the overlay is closed.
        if (!this.unsubscribeSessions) {
            this.unsubscribeSessions = this.host.onSessionsChanged(() => {
                this.refreshSessions();
            });
        }

        if (overlayMode === 'feedback') {
            this.blurHandler = (): void => {
                this.hide();
            };
            window.addEventListener('blur', this.blurHandler);
            this.timer = window.setTimeout(() => {
                if (!this.overlayEl) return;
                this.hide();
            }, feedbackDurationMs);
            return;
        }

        // Dismiss when modifier keys are released
        if (!opts.keepShownAt || this.shownAt === 0) {
            this.shownAt = Date.now();
        }
        const showTime = this.shownAt;

        this.keyUpHandler = (e: KeyboardEvent): void => {
            if (!isModShiftPressed(e)) {
                // Ensure minimum 300ms visibility
                const elapsed = Date.now() - showTime;
                const minDelay = Math.max(0, 300 - elapsed);
                this.cleanupListeners();
                if (minDelay > 0) {
                    this.timer = window.setTimeout(() => {
                        this.hide();
                    }, minDelay);
                } else {
                    this.hide();
                }
            }
        };

        this.blurHandler = (): void => {
            this.hide();
        };

        document.addEventListener('keyup', this.keyUpHandler);
        window.addEventListener('blur', this.blurHandler);

        // Safety fallback – only dismiss if modifier keys are no longer held
        const safetyCheck = (): void => {
            this.timer = window.setTimeout(() => {
                if (!this.overlayEl) return;
                this.hide();
            }, 5000);
        };

        this.keyDownHandler = (e: KeyboardEvent): void => {
            // Any keydown means user is still active – reset the safety timer
            if (this.timer) {
                window.clearTimeout(this.timer);
            }
            safetyCheck();

            // Tab or G cycles groups, Shift for the other direction.
            //
            // The guard here used to be `!isModPressed(e)`, which can never be
            // true: this overlay exists only while Mod+Shift is held, so every
            // keypress it sees carries Mod. The hint in the footer advertised a
            // key that had never once fired.
            //
            // G is offered alongside Tab because Mod+Shift+Tab is spoken for -
            // by the window manager on macOS and by Obsidian's own tab
            // switching - and Tab cannot be given up while people rely on it.
            const cyclesGroup = e.key === 'Tab' || e.key === 'g' || e.key === 'G';
            if (cyclesGroup && this.overlayEl) {
                if (!this.host.getGroupStore().isGroupFeatureEnabled() || this.host.getGroupStore().getOrderedGroups().length === 0) return;
                e.preventDefault();
                e.stopImmediatePropagation();
                const nextGroupId = this.host.getGroupStore().getRelativeGroupId(overlayGroupId, e.shiftKey ? -1 : 1);
                if (typeof nextGroupId === 'undefined') return;

                void this.host.getGroupStore().resolveGroupSelection(nextGroupId).then((result) => {
                    const newOrdered = result.sessions;
                    const newActiveIndex = this.host.findActiveSessionIndex(newOrdered);
                    this.show(newOrdered, newActiveIndex, result.resolvedGroupId);
                });
            }
        };

        document.addEventListener('keydown', this.keyDownHandler);
        safetyCheck();
    }

    // Redraw an overlay that is already on screen because the session set
    // changed under it (issue #118). A person can hold the modifiers down and
    // create or delete a session without ever letting go, and until now the
    // overlay went on showing the list it was opened with.
    //
    // This reuses show(), which is the path Tab cycling and group-tab clicks
    // already take mid-hold, rather than a second rendering route that would
    // drift from it. What it does not reuse is the visibility clock: keepShownAt
    // keeps the 300 ms floor measured from when the overlay appeared.
    refreshSessions(): void {
        if (!this.overlayEl) return;
        const ordered = this.host.getOrderedSessionsForGroup(this.viewGroupId);
        const activeIndex = this.host.findActiveSessionIndex(ordered);
        this.show(ordered, activeIndex, this.viewGroupId, { mode: 'preview', keepShownAt: true });
    }

    hide(): void {
        if (this.overlayEl) {
            this.overlayEl.remove();
            this.overlayEl = null;
        }
        this.viewGroupId = null;
        this.shownAt = 0;
        if (this.unsubscribeSessions) {
            this.unsubscribeSessions();
            this.unsubscribeSessions = null;
        }
        this.cleanupListeners();
    }

    cleanupListeners(): void {
        if (this.keyUpHandler) {
            document.removeEventListener('keyup', this.keyUpHandler);
            this.keyUpHandler = null;
        }
        if (this.keyDownHandler) {
            document.removeEventListener('keydown', this.keyDownHandler);
            this.keyDownHandler = null;
        }
        if (this.blurHandler) {
            window.removeEventListener('blur', this.blurHandler);
            this.blurHandler = null;
        }
        if (this.timer) {
            window.clearTimeout(this.timer);
            this.timer = null;
        }
    }
}
