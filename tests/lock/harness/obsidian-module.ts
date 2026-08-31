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

/** Values a test can characterise against, matching what a real browser reports. */
export const PLATFORM = { mac: 'MacIntel', windows: 'Win32', linux: 'Linux x86_64' } as const;

export interface Registry {
    log: CallLog;
    settings: SettingStub[];
    menus: MenuStub[];
    notices: NoticeStub[];
    icons: Map<HTMLElement, string>;
    /** Commands the plugin registered, so a lock can trigger one the way a
     *  hotkey would instead of reaching for an internal method. */
    commands: Map<string, RegisteredCommand>;
    /** The single source for what platform the code under test believes it is
     *  on. Both the stubbed `Platform` and the jsdom `navigator.platform` read
     *  it, so the two can never disagree - and it never depends on the host OS,
     *  which would make a lock pass on a laptop and fail in CI. */
    platform: string;
    document: Document | null;
}

export const registry: Registry = {
    log: new CallLog(),
    settings: [],
    menus: [],
    notices: [],
    icons: new Map(),
    commands: new Map(),
    platform: PLATFORM.mac,
    document: null,
};

export function resetRegistry(document: Document): void {
    registry.log = new CallLog();
    registry.settings = [];
    registry.menus = [];
    registry.notices = [];
    registry.icons = new Map();
    registry.commands = new Map();
    registry.platform = PLATFORM.mac;
    registry.document = document;
}

/** Choose the platform this test characterises. */
export function setPlatform(platform: string): void {
    registry.platform = platform;
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

export interface Modal {
    readonly app: unknown;
    readonly containerEl: HTMLElement;
    readonly modalEl: HTMLElement;
    readonly titleEl: HTMLElement;
    readonly contentEl: HTMLElement;
    readonly scope: { register: () => void };
    isOpen: boolean;
    onOpen(): void;
    onClose(): void;
    open(): void;
    close(): void;
    setTitle(title: string): this;
}

export interface ModalConstructor {
    new (app: unknown): Modal;
    prototype: Modal;
}

interface ModalInternal extends Modal {
    app: unknown;
    containerEl: HTMLElement;
    modalEl: HTMLElement;
    titleEl: HTMLElement;
    contentEl: HTMLElement;
    scope: { register: () => void };
}

const ModalProto: Record<string, unknown> = {
    onOpen(this: Modal): void {},
    onClose(this: Modal): void {},
    open(this: Modal): void {
        ownerDocument().body.appendChild(this.containerEl);
        this.isOpen = true;
        this.onOpen();
    },
    close(this: Modal): void {
        this.isOpen = false;
        this.onClose();
        this.containerEl.remove();
    },
    setTitle(this: Modal, title: string): Modal {
        this.titleEl.textContent = title;
        return this;
    },
};

function ModalConstructorFn(this: unknown, app: unknown): Modal {
    const isInstance = this instanceof ModalConstructorFn;
    const self = (isInstance ? this : Object.create(ModalProto)) as ModalInternal;
    self.app = app;
    const doc = ownerDocument();
    self.containerEl = doc.createElement('div');
    self.containerEl.classList.add('modal-container');
    self.modalEl = doc.createElement('div');
    self.titleEl = doc.createElement('div');
    self.contentEl = doc.createElement('div');
    self.modalEl.append(self.titleEl, self.contentEl);
    self.containerEl.appendChild(self.modalEl);
    self.scope = { register: (): void => {} };
    self.isOpen = false;
    return self;
}

ModalConstructorFn.prototype = ModalProto;

export const Modal: ModalConstructor = ModalConstructorFn as unknown as ModalConstructor;

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

export interface PluginSettingTab {
    readonly app: unknown;
    readonly plugin: unknown;
    readonly containerEl: HTMLElement;
}

export interface PluginSettingTabConstructor {
    new (app: unknown, plugin: unknown): PluginSettingTab;
    prototype: PluginSettingTab;
}

interface PluginSettingTabInternal extends PluginSettingTab {
    app: unknown;
    plugin: unknown;
    containerEl: HTMLElement;
}

function PluginSettingTabConstructorFn(this: unknown, app: unknown, plugin: unknown): PluginSettingTab {
    const isInstance = this instanceof PluginSettingTabConstructorFn;
    const self = (isInstance ? this : Object.create(PluginSettingTabConstructorFn.prototype as object)) as PluginSettingTabInternal;
    self.app = app;
    self.plugin = plugin;
    self.containerEl = ownerDocument().createElement('div');
    return self;
}

export const PluginSettingTab = PluginSettingTabConstructorFn as unknown as PluginSettingTabConstructor;

export type FuzzySuggestModal = Modal;
export interface FuzzySuggestModalConstructor {
    new (app: unknown): FuzzySuggestModal;
    prototype: FuzzySuggestModal;
}

function FuzzySuggestModalConstructorFn(this: unknown, app: unknown): FuzzySuggestModal {
    return ModalConstructorFn.call(this, app);
}
FuzzySuggestModalConstructorFn.prototype = ModalProto;

export const FuzzySuggestModal = FuzzySuggestModalConstructorFn as unknown as FuzzySuggestModalConstructor;

/**
 * Reads `registry.platform`, the same value the jsdom `navigator.platform`
 * reports.
 *
 * The code under test asks the same question two ways: the i18n tables branch
 * on `navigator.platform.indexOf('Mac')`, and the migration moves them to
 * `Platform.isMacOS`. If those disagreed, a lock recorded before the move would
 * fail after it - with no legal fix, since locks may not be edited.
 *
 * It is a fixed default rather than the host's real platform, so a lock records
 * the same thing on a laptop and in CI.
 */
export const Platform = {
    isDesktop: true,
    isDesktopApp: true,
    isMobile: false,
    isMobileApp: false,
    isIosApp: false,
    isAndroidApp: false,
    get isMacOS(): boolean { return registry.platform.indexOf('Mac') !== -1; },
    get isWin(): boolean { return registry.platform.indexOf('Win') !== -1; },
    get isLinux(): boolean { return registry.platform.indexOf('Linux') !== -1; },
};


export function setIcon(el: HTMLElement, icon: string): void {
    registry.icons.set(el, icon);
    (el as unknown as { icon?: string }).icon = icon;
    if (typeof el.setAttribute === 'function') {
        el.setAttribute('data-icon', icon);
    }
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

export class TAbstractFile {
    path = '';
    name = '';
    vault: unknown = null;
    parent: unknown = null;
}

export class TFile extends TAbstractFile {
    stat: unknown = null;
    basename = '';
    extension = '';
}
