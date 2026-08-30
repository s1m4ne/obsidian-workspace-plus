// The module that stands in for `obsidian` inside the lock suite.
//
// A resolve hook points the specifier here, which works for both `require()`
// and `import` - the plugin is CommonJS today and becomes ESM during the
// migration, and a lock must survive that change without being rewritten.
//
// State lives in one registry that setupHarness() resets per test, because a
// module is loaded once per process while tests need a clean slate each time.

import { CallLog, MenuStub, NoticeStub, SettingStub } from './obsidian-stub.ts';

export interface Registry {
    log: CallLog;
    settings: SettingStub[];
    menus: MenuStub[];
    notices: NoticeStub[];
    icons: Map<HTMLElement, string>;
    document: Document | null;
}

export const registry: Registry = {
    log: new CallLog(),
    settings: [],
    menus: [],
    notices: [],
    icons: new Map(),
    document: null,
};

export function resetRegistry(document: Document): void {
    registry.log = new CallLog();
    registry.settings = [];
    registry.menus = [];
    registry.notices = [];
    registry.icons = new Map();
    registry.document = document;
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

export class Plugin {}

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

export const Platform = { isDesktop: true, isDesktopApp: true, isMacOS: true, isMobile: false };

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
