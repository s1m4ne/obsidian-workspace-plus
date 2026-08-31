import { setIcon } from 'obsidian';
import { L } from './i18n.ts';
import { isMacPlatform, isModPressed } from './utils.ts';
import {
    executeStatusBarAction,
    type StatusBarActionPluginHost,
} from './statusbar-actions.ts';
import type { PluginData, SessionGroup, SessionItem } from './storage/default-data.ts';

export interface StatusBarScrollPresetConfig {
    threshold: number;
    cooldownMs: number;
    resetMs: number;
}

export const STATUS_BAR_SCROLL_PRESETS: Record<string, StatusBarScrollPresetConfig> = {
    trackpad: {
        threshold: 30,
        cooldownMs: 500,
        resetMs: 250,
    },
    notchedWheel: {
        threshold: 16,
        cooldownMs: 350,
        resetMs: 220,
    },
    freeSpinWheel: {
        threshold: 48,
        cooldownMs: 650,
        resetMs: 320,
    },
};

export interface StatusBarControllerHost extends StatusBarActionPluginHost {
    data: PluginData;
    statusBarEl?: HTMLElement | null;
    addStatusBarItem(): HTMLElement;
    getActiveSession(): SessionItem | null;
    getActiveGroup(): SessionGroup | null;
    shouldShowUnsavedStatusBarHighlight(): boolean;
    switchRelativeFromScroll(direction: number): Promise<boolean>;
    getSessionSwitcher?(): { isSwitching?: boolean };
    getStatusBarController?(): StatusBarController;
    registerDomEvent?(
        el: HTMLElement,
        type: string,
        handler: EventListener,
        options?: boolean | AddEventListenerOptions
    ): void;
}

export function getStatusBarScrollConfig(
    data?: PluginData | Partial<PluginData> | null
): StatusBarScrollPresetConfig {
    const presetId = (data && data.statusBarScrollPreset) || 'trackpad';
    if (presetId === 'custom') {
        return {
            threshold: Number((data && data.statusBarScrollThreshold) || 30) || 30,
            cooldownMs: Number((data && data.statusBarScrollCooldownMs) || 500) || 500,
            resetMs: Number((data && data.statusBarScrollResetMs) || 250) || 250,
        };
    }
    return STATUS_BAR_SCROLL_PRESETS[presetId] || STATUS_BAR_SCROLL_PRESETS.trackpad!;
}

export function matchesStatusBarScrollModifier(
    evt: MouseEvent | WheelEvent,
    isMac: boolean,
    mode?: string | null
): boolean {
    const activeMode = mode || 'none';
    const modPressed = isMac ? Boolean(evt.metaKey) : Boolean(evt.ctrlKey);
    const altPressed = Boolean(evt.altKey);

    if (activeMode === 'none') return !modPressed && !altPressed;
    if (activeMode === 'modOnly') return modPressed;
    if (activeMode === 'altOnly') return altPressed;
    if (activeMode === 'modOrAlt') return modPressed || altPressed;
    return modPressed || altPressed;
}

export function getModifiedStatusBarSlot(evt: MouseEvent, baseSlot: string): string {
    const baseName = baseSlot.charAt(0).toUpperCase() + baseSlot.slice(1);
    if (evt.altKey) return 'alt' + baseName;
    if (isModPressed(evt)) return 'mod' + baseName;
    if (evt.shiftKey) return 'shift' + baseName;
    return baseSlot;
}

export function getClickSlot(evt: MouseEvent): string {
    return getModifiedStatusBarSlot(evt, 'click');
}

export function getMiddleClickSlot(evt: MouseEvent): string {
    return getModifiedStatusBarSlot(evt, 'middleClick');
}

export function getRightClickSlot(evt: MouseEvent): string {
    return getModifiedStatusBarSlot(evt, 'rightClick');
}

export function getStatusBarAction(plugin: { data?: PluginData | null }, slotKey: string): string {
    const actions = (plugin.data?.statusBarActions || {}) as Record<string, string | undefined>;
    return actions[slotKey] || 'none';
}

export function executeStatusBarSlot(
    plugin: StatusBarActionPluginHost,
    slotKey: string,
    evt: MouseEvent,
    options?: { preventDefault?: boolean }
): unknown {
    const opts = options || {};
    const action = getStatusBarAction(plugin, slotKey);
    if (action !== 'none' && opts.preventDefault !== false) {
        evt.preventDefault();
        evt.stopPropagation();
    }
    return executeStatusBarAction(plugin, action, evt);
}

export function normalizeWheelDeltaY(evt: WheelEvent): number {
    const deltaY = evt.deltaY || 0;
    if (evt.deltaMode === 1) return deltaY * 16;
    if (evt.deltaMode === 2) return deltaY * 240;
    return deltaY;
}

export class StatusBarController {
    private readonly hostProvider: () => StatusBarControllerHost;
    private _scrollSwitchAt = 0;
    private _scrollEventAt = 0;
    private _scrollDelta = 0;
    statusBarEl: HTMLElement | null = null;

    constructor(hostOrProvider: StatusBarControllerHost | (() => StatusBarControllerHost)) {
        if (typeof hostOrProvider === 'function') {
            this.hostProvider = hostOrProvider;
        } else {
            this.hostProvider = () => hostOrProvider;
        }
        const hostObj = (typeof hostOrProvider === 'function' ? hostOrProvider() : hostOrProvider) as unknown as Record<string, unknown>;
        const descDelta = Object.getOwnPropertyDescriptor(hostObj, 'statusBarScrollDelta');
        if (descDelta && !descDelta.get && typeof hostObj.statusBarScrollDelta === 'number') {
            this._scrollDelta = hostObj.statusBarScrollDelta;
        }
        const descEventAt = Object.getOwnPropertyDescriptor(hostObj, 'statusBarScrollEventAt');
        if (descEventAt && !descEventAt.get && typeof hostObj.statusBarScrollEventAt === 'number') {
            this._scrollEventAt = hostObj.statusBarScrollEventAt;
        }
        const descSwitchAt = Object.getOwnPropertyDescriptor(hostObj, 'statusBarScrollSwitchAt');
        if (descSwitchAt && !descSwitchAt.get && typeof hostObj.statusBarScrollSwitchAt === 'number') {
            this._scrollSwitchAt = hostObj.statusBarScrollSwitchAt;
        }
    }

    private get host(): StatusBarControllerHost {
        return this.hostProvider();
    }

    private get data(): PluginData {
        return this.host.data;
    }

    get scrollSwitchAt(): number {
        return this._scrollSwitchAt;
    }

    get scrollEventAt(): number {
        return this._scrollEventAt;
    }

    get scrollDelta(): number {
        return this._scrollDelta;
    }

    handleWheel(evt: WheelEvent, now?: number): boolean {
        if (!this.data?.statusBarModScrollSwitch) return false;
        const isMac = isMacPlatform();
        const cfg = getStatusBarScrollConfig(this.data);
        if (!matchesStatusBarScrollModifier(evt, isMac, this.data?.statusBarScrollModifierMode)) return false;
        if (Math.abs(evt.deltaY || 0) <= Math.abs(evt.deltaX || 0)) return false;

        evt.preventDefault();
        evt.stopPropagation();

        const currentTime = typeof now === 'number' ? now : Date.now();
        if (this.host.getSessionSwitcher?.()?.isSwitching) return false;
        if (currentTime - this._scrollSwitchAt < cfg.cooldownMs) return false;

        if (currentTime - this._scrollEventAt > cfg.resetMs) {
            this._scrollDelta = 0;
        }
        this._scrollEventAt = currentTime;
        this._scrollDelta += normalizeWheelDeltaY(evt);

        const hostObj = this.host as unknown as Record<string, unknown>;
        const descDelta = Object.getOwnPropertyDescriptor(hostObj, 'statusBarScrollDelta');
        if (descDelta && !descDelta.get) {
            hostObj.statusBarScrollDelta = this._scrollDelta;
        }
        const descEventAt = Object.getOwnPropertyDescriptor(hostObj, 'statusBarScrollEventAt');
        if (descEventAt && !descEventAt.get) {
            hostObj.statusBarScrollEventAt = this._scrollEventAt;
        }

        if (Math.abs(this._scrollDelta) < cfg.threshold) return false;

        let direction = this._scrollDelta < 0 ? -1 : 1;
        if (this.data?.statusBarScrollInvert) direction *= -1;
        this._scrollDelta = 0;
        this._scrollSwitchAt = currentTime;

        if (descDelta && !descDelta.get) {
            hostObj.statusBarScrollDelta = 0;
        }
        const descSwitchAt = Object.getOwnPropertyDescriptor(hostObj, 'statusBarScrollSwitchAt');
        if (descSwitchAt && !descSwitchAt.get) {
            hostObj.statusBarScrollSwitchAt = this._scrollSwitchAt;
        }

        // A scroll gesture that cannot switch is not worth a message; the next
        // notch tries again.
        void this.host.switchRelativeFromScroll(direction).catch(() => {});
        return true;
    }

    setupStatusBar(): HTMLElement {
        const el = this.host.addStatusBarItem();
        this.statusBarEl = el;
        this.host.statusBarEl = el;
        el.addClass('wpp-status-bar');

        const attachListener = (
            target: HTMLElement,
            type: string,
            handler: EventListener,
            options?: boolean | AddEventListenerOptions
        ) => {
            if (typeof this.host.registerDomEvent === 'function') {
                this.host.registerDomEvent(target, type, handler, options);
            } else {
                target.addEventListener(type, handler, options);
            }
        };

        attachListener(el, 'click', ((evt: MouseEvent) => {
            executeStatusBarSlot(this.host, getClickSlot(evt), evt);
        }) as EventListener);

        attachListener(el, 'auxclick', ((evt: MouseEvent) => {
            if (evt.button !== 1) return;
            executeStatusBarSlot(this.host, getMiddleClickSlot(evt), evt);
        }) as EventListener);

        attachListener(el, 'contextmenu', ((evt: MouseEvent) => {
            evt.preventDefault();
            const action = getStatusBarAction(this.host, getRightClickSlot(evt));
            executeStatusBarAction(this.host, action, evt);
        }) as EventListener);

        attachListener(
            el,
            'wheel',
            ((evt: WheelEvent) => {
                this.handleWheel(evt);
            }) as EventListener,
            { passive: false }
        );

        if (typeof this.host.updateStatusBar === 'function') {
            this.host.updateStatusBar();
        } else {
            this.updateStatusBar();
        }
        return el;
    }

    updateStatusBar(): void {
        const session = typeof this.host.getActiveSession === 'function' ? this.host.getActiveSession() : null;
        const el = this.statusBarEl || this.host.statusBarEl;
        if (!el) return;
        const showUnsavedHighlight = typeof this.host.shouldShowUnsavedStatusBarHighlight === 'function'
            ? this.host.shouldShowUnsavedStatusBarHighlight()
            : false;

        if (typeof el.removeClass === 'function') {
            el.removeClass('wpp-status-bar-unsaved');
        }
        if (showUnsavedHighlight && typeof el.addClass === 'function') {
            el.addClass('wpp-status-bar-unsaved');
        }

        if (typeof el.empty === 'function') {
            el.empty();
        }
        const icon = typeof el.createSpan === 'function' ? el.createSpan({ cls: 'wpp-status-icon' }) : null;
        if (icon) {
            setIcon(icon, 'panels-top-left');
        }

        // Show group name if a group is active
        const activeGroup = typeof this.host.getActiveGroup === 'function' ? this.host.getActiveGroup() : null;
        if (activeGroup && typeof el.createSpan === 'function') {
            el.createSpan({
                text: activeGroup.name,
                cls: 'wpp-status-group',
            });
            el.createSpan({
                text: ' / ',
                cls: 'wpp-status-separator',
            });
        }

        if (typeof el.createSpan === 'function') {
            el.createSpan({
                text: session ? session.name : String(L.noSession || ''),
                cls: 'wpp-status-name',
            });
        }
    }
}

export function handleStatusBarWheel(
    plugin: StatusBarControllerHost,
    evt: WheelEvent,
    now?: number
): boolean {
    if (typeof plugin.getStatusBarController === 'function') {
        return plugin.getStatusBarController().handleWheel(evt, now);
    }
    const controller = new StatusBarController(plugin);
    return controller.handleWheel(evt, now);
}

export function setupStatusBar(plugin: StatusBarControllerHost): HTMLElement {
    if (typeof plugin.getStatusBarController === 'function') {
        return plugin.getStatusBarController().setupStatusBar();
    }
    const controller = new StatusBarController(plugin);
    return controller.setupStatusBar();
}
