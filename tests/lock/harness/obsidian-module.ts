// The module that stands in for `obsidian` inside the lock suite.
//
// A resolve hook points the specifier here, which works for both `require()`
// and `import` - the plugin is CommonJS today and becomes ESM during the
// migration, and a lock must survive that change without being rewritten.
//
// State lives in one registry that setupHarness() resets per test, because a
// module is loaded once per process while tests need a clean slate each time.

import { CallLog, MenuStub, NoticeStub, SettingStub } from './obsidian-stub.ts';

export interface RegisteredCommand {
    readonly id: string;
    readonly name: string;
    readonly callback?: () => unknown;
    readonly checkCallback?: (checking: boolean) => boolean | void;
}

export interface Registry {
    log: CallLog;
    settings: SettingStub[];
    menus: MenuStub[];
    notices: NoticeStub[];
    icons: Map<HTMLElement, string>;
    /** Commands the plugin registered, so a lock can trigger one the way a
     *  hotkey would instead of reaching for an internal method. */
    commands: Map<string, RegisteredCommand>;
    document: Document | null;
}

export const registry: Registry = {
    log: new CallLog(),
    settings: [],
    menus: [],
    notices: [],
    icons: new Map(),
    commands: new Map(),
    document: null,
};

export function resetRegistry(document: Document): void {
    registry.log = new CallLog();
    registry.settings = [];
    registry.menus = [];
    registry.notices = [];
    registry.icons = new Map();
    registry.commands = new Map();
    registry.document = document;
}

/**
 * Runs a registered command as pressing its hotkey would: a checkCallback
 * command is asked whether it is available, then executed.
 */
export function runCommand(id: string): unknown {
    const command = registry.commands.get(id);
    if (!command) throw new Error(`No command registered with id "${id}"`);
    if (command.checkCallback) {
        if (command.checkCallback(true) === false) return undefined;
        return command.checkCallback(false);
    }
    return command.callback?.();
}

export class Setting extends SettingStub {
    constructor(containerEl: HTMLElement) {
        super(containerEl, registry.log, registry.settings.length);
        registry.settings.push(this);
    }
}

export class Menu extends MenuStub {
    constructor() {
        super(registry.log);
        registry.menus.push(this);
    }
}

export class Notice extends NoticeStub {
    constructor(message: string, durationMs?: number) {
        super(message, durationMs);
        registry.notices.push(this);
        registry.log.record('Notice', 'show', message);
    }
}

function ownerDocument(): Document {
    if (!registry.document) throw new Error('Lock harness not installed: no document');
    return registry.document;
}

export class Modal {
    readonly app: unknown;
    readonly containerEl: HTMLElement;
    readonly modalEl: HTMLElement;
    readonly titleEl: HTMLElement;
    readonly contentEl: HTMLElement;
    readonly scope = { register: (): void => {} };
    isOpen = false;

    constructor(app: unknown) {
        this.app = app;
        const doc = ownerDocument();
        this.containerEl = doc.createElement('div');
        this.containerEl.classList.add('modal-container');
        this.modalEl = doc.createElement('div');
        this.titleEl = doc.createElement('div');
        this.contentEl = doc.createElement('div');
        this.modalEl.append(this.titleEl, this.contentEl);
        this.containerEl.appendChild(this.modalEl);
    }

    // Subclasses override these, exactly as they do with Obsidian's Modal.
    onOpen(): void {}
    onClose(): void {}

    open(): void {
        ownerDocument().body.appendChild(this.containerEl);
        this.isOpen = true;
        this.onOpen();
    }

    close(): void {
        this.isOpen = false;
        this.onClose();
        this.containerEl.remove();
    }

    setTitle(title: string): this {
        this.titleEl.textContent = title;
        return this;
    }
}

export class Plugin {
    readonly app: unknown;
    readonly manifest: unknown;

    constructor(app: unknown, manifest: unknown) {
        this.app = app;
        this.manifest = manifest;
    }

    addCommand(command: RegisteredCommand): RegisteredCommand {
        registry.commands.set(command.id, command);
        registry.log.record('Plugin', 'addCommand', command.id);
        return command;
    }

    addRibbonIcon(): HTMLElement { return ownerDocument().createElement('div'); }
    addStatusBarItem(): HTMLElement { return ownerDocument().createElement('div'); }
    addSettingTab(): void {}
    registerEvent(): void {}
    registerDomEvent(el: { addEventListener(t: string, h: EventListener): void }, type: string, handler: EventListener): void {
        el.addEventListener(type, handler);
    }
    registerInterval(id: number): number { return id; }
    register(): void {}
    loadData(): Promise<unknown> { return Promise.resolve({}); }
    saveData(): Promise<void> { return Promise.resolve(); }
}

export class PluginSettingTab {
    readonly app: unknown;
    readonly plugin: unknown;
    readonly containerEl: HTMLElement;

    constructor(app: unknown, plugin: unknown) {
        this.app = app;
        this.plugin = plugin;
        this.containerEl = ownerDocument().createElement('div');
    }
}

export class FuzzySuggestModal {}

/**
 * Derived from the jsdom navigator rather than hardcoded.
 *
 * The code under test asks two different questions about the same fact: the
 * i18n tables branch on `navigator.platform.indexOf('Mac')`, and the migration
 * moves them to `Platform.isMacOS`. If the stub answered one way and the
 * navigator the other, a lock recorded before the move would fail after it -
 * with no legal fix, since locks may not be edited.
 *
 * Reading both from one source keeps the answers consistent across the change.
 * `setPlatform()` lets a test choose which platform it is characterising.
 */
export const Platform = {
    isDesktop: true,
    isDesktopApp: true,
    isMobile: false,
    isMobileApp: false,
    isIosApp: false,
    isAndroidApp: false,
    get isMacOS(): boolean {
        return currentNavigatorPlatform().indexOf('Mac') !== -1;
    },
    get isWin(): boolean {
        return currentNavigatorPlatform().indexOf('Win') !== -1;
    },
    get isLinux(): boolean {
        return currentNavigatorPlatform().indexOf('Linux') !== -1;
    },
};

function currentNavigatorPlatform(): string {
    const nav: { platform?: string } | undefined =
        typeof navigator === 'undefined' ? undefined : navigator;
    return nav && typeof nav.platform === 'string' ? nav.platform : '';
}

export function setIcon(el: HTMLElement, icon: string): void {
    registry.icons.set(el, icon);
    el.setAttribute('data-icon', icon);
}

export function setTooltip(el: HTMLElement, tooltip: string): void {
    el.setAttribute('data-tooltip', tooltip);
}

export function normalizePath(path: string): string {
    return path.replace(/\\/g, '/').replace(/\/+/g, '/');
}

export function debounce<T extends unknown[]>(fn: (...args: T) => unknown): (...args: T) => unknown {
    return (...args: T): unknown => fn(...args);
}
