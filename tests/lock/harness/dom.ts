// A DOM for the lock suite.
//
// Obsidian adds a handful of helpers to HTMLElement that the plugin uses
// instead of the standard DOM calls. jsdom gives real DOM semantics; this adds
// the ten helpers the codebase actually calls, each a direct translation of the
// standard API, so there is very little fake behaviour left to be wrong about.
//
// The overlays build their DOM with document.createElement and need none of
// this; the modals and settings tab do.

import { JSDOM } from 'jsdom';
import { registry, setPlatform } from './obsidian-module.ts';

export interface DomElementInfo {
    readonly cls?: string | string[];
    readonly text?: string;
    readonly type?: string;
    readonly value?: string;
    readonly placeholder?: string;
    readonly href?: string;
    readonly name?: string;
    readonly attr?: Record<string, string | number | boolean | null>;
}

function applyInfo(el: HTMLElement, info: DomElementInfo | string | undefined): void {
    if (info === undefined) return;
    if (typeof info === 'string') {
        el.className = info;
        return;
    }
    if (info.cls !== undefined) {
        const classes = Array.isArray(info.cls) ? info.cls : info.cls.split(/\s+/);
        for (const cls of classes) {
            if (cls !== '') el.classList.add(cls);
        }
    }
    if (info.text !== undefined) el.textContent = info.text;
    if (info.type !== undefined) el.setAttribute('type', info.type);
    if (info.value !== undefined) el.setAttribute('value', info.value);
    if (info.placeholder !== undefined) el.setAttribute('placeholder', info.placeholder);
    if (info.href !== undefined) el.setAttribute('href', info.href);
    if (info.name !== undefined) el.setAttribute('name', info.name);
    if (info.attr !== undefined) {
        for (const [key, value] of Object.entries(info.attr)) {
            if (value === null) el.removeAttribute(key);
            else el.setAttribute(key, String(value));
        }
    }
}

function makeChild(
    parent: HTMLElement | DocumentFragment,
    tag: string,
    info?: DomElementInfo | string,
    callback?: (el: HTMLElement) => void,
): HTMLElement {
    const doc = parent.ownerDocument ?? (parent as unknown as Document);
    const el = doc.createElement(tag);
    applyInfo(el, info);
    parent.appendChild(el);
    if (callback) callback(el);
    return el;
}

function patchElementPrototype(window: Window & typeof globalThis): void {
    // A DocumentFragment carries the same createEl/appendText helpers in
    // Obsidian, and `desc` on a setting definition may be one.
    for (const target of [window.HTMLElement.prototype, window.DocumentFragment.prototype]) {
        const fragProto = target as unknown as Record<string, unknown>;
        fragProto.createEl = function (this: HTMLElement, tag: string, info?: DomElementInfo | string, callback?: (el: HTMLElement) => void) {
            return makeChild(this, tag, info, callback);
        };
        fragProto.appendText = function (this: HTMLElement, value: string): void {
            this.appendChild(this.ownerDocument.createTextNode(value));
        };
    }

    const proto = window.HTMLElement.prototype as unknown as Record<string, unknown>;

    proto.createEl = function (this: HTMLElement, tag: string, info?: DomElementInfo | string, callback?: (el: HTMLElement) => void) {
        return makeChild(this, tag, info, callback);
    };
    proto.createDiv = function (this: HTMLElement, info?: DomElementInfo | string, callback?: (el: HTMLElement) => void) {
        return makeChild(this, 'div', info, callback);
    };
    proto.createSpan = function (this: HTMLElement, info?: DomElementInfo | string, callback?: (el: HTMLElement) => void) {
        return makeChild(this, 'span', info, callback);
    };

    proto.setText = function (this: HTMLElement, value: string): void {
        this.textContent = value;
    };
    proto.empty = function (this: HTMLElement): void {
        while (this.firstChild) this.removeChild(this.firstChild);
    };
    proto.addClass = function (this: HTMLElement, ...classes: string[]): void {
        this.classList.add(...classes);
    };
    proto.removeClass = function (this: HTMLElement, ...classes: string[]): void {
        this.classList.remove(...classes);
    };
    proto.detach = function (this: HTMLElement): void {
        this.parentNode?.removeChild(this);
    };
    proto.appendText = function (this: HTMLElement, value: string): void {
        this.appendChild(this.ownerDocument.createTextNode(value));
    };
    proto.hide = function (this: HTMLElement): void {
        this.style.display = 'none';
    };
    proto.setCssProps = function (this: HTMLElement, props: Record<string, string>): void {
        for (const [k, v] of Object.entries(props)) {
            this.style.setProperty(k, v);
        }
    };
    proto.setCssStyles = function (this: HTMLElement, styles: Partial<CSSStyleDeclaration>): void {
        Object.assign(this.style, styles);
    };
}

export interface DomHarness {
    readonly window: Window & typeof globalThis;
    readonly document: Document;
    /** Fresh element to render into, already attached to the body. */
    container(): HTMLElement;
    /** Choose the platform this test characterises; both `navigator.platform`
     *  and the stubbed `Platform` follow it. */
    setPlatform(platform: string): void;
    restore(): void;
}

export { PLATFORM } from './obsidian-module.ts';

/**
 * Installs a jsdom document as the ambient DOM, including Obsidian's
 * `activeDocument` / `activeWindow` aliases. Call `restore()` when done.
 */
export function setupDom(): DomHarness {
    const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
    const window = dom.window as unknown as Window & typeof globalThis;
    patchElementPrototype(window);

    // Some of these are getter-only on modern Node (navigator), so they have to
    // be redefined rather than assigned, and restored by descriptor.
    const scope = globalThis as unknown as Record<string, unknown>;
    const saved = new Map<string, PropertyDescriptor | undefined>();
    const install = (key: string, value: unknown): void => {
        saved.set(key, Object.getOwnPropertyDescriptor(scope, key));
        Object.defineProperty(scope, key, { value, configurable: true, writable: true });
    };

    install('window', window);
    install('document', window.document);
    // navigator.platform reads the registry, so the value the code under test
    // sees and the value the stubbed Platform reports cannot drift apart.
    Object.defineProperty(window.navigator, 'platform', {
        get: () => registry.platform,
        configurable: true,
    });
    install('navigator', window.navigator);
    install('activeDocument', window.document);
    install('activeWindow', window);
    install('HTMLElement', window.HTMLElement);
    install('Element', window.Element);
    install('Node', window.Node);
    install('Event', window.Event);
    install('MouseEvent', window.MouseEvent);
    install('DocumentFragment', window.DocumentFragment);
    // Obsidian's own global. `desc` on a setting definition takes a fragment,
    // which is how a description carries a link.
    install('createFragment', (callback?: (frag: DocumentFragment) => void): DocumentFragment => {
        const frag = window.document.createDocumentFragment();
        if (callback) callback(frag);
        return frag;
    });
    install('KeyboardEvent', window.KeyboardEvent);

    // jsdom does not implement scrollIntoView; provide a no-op stub for UI components
    window.Element.prototype.scrollIntoView = (): void => {};

    return {
        window,
        document: window.document,
        container(): HTMLElement {
            const el = window.document.createElement('div');
            window.document.body.appendChild(el);
            return el;
        },
        setPlatform,
        restore(): void {
            for (const [key, descriptor] of saved) {
                if (descriptor === undefined) delete scope[key];
                else Object.defineProperty(scope, key, descriptor);
            }
            dom.window.close();
        },
    };
}
