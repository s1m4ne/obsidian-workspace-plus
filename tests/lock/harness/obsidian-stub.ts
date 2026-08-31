// Recording stubs for the Obsidian classes the plugin builds its UI from.
//
// These deliberately do not reimplement Obsidian's widgets. What a lock needs
// to prove is which settings, menu items and notices get built, in what order,
// with what text, and what their handlers do when invoked - and a call log
// proves exactly that while staying immune to any drift between a hand-written
// widget and the real one.
//
// Handlers are kept rather than discarded, so a lock can invoke them and
// observe the effect. That is how "what a click does" gets locked without
// depending on how the button looks.

export interface RecordedCall {
    readonly target: string;
    readonly method: string;
    readonly args: readonly unknown[];
}

export class CallLog {
    private readonly calls: RecordedCall[] = [];

    record(target: string, method: string, ...args: readonly unknown[]): void {
        this.calls.push({ target, method, args });
    }

    entries(): readonly RecordedCall[] {
        return this.calls;
    }

    /** Compact form for snapshots: "Setting.setName(Auto-save on switch)". */
    lines(): readonly string[] {
        return this.calls.map((call) => {
            const args = call.args
                .filter((arg) => typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean')
                .join(', ');
            return `${call.target}.${call.method}(${args})`;
        });
    }

    clear(): void {
        this.calls.length = 0;
    }
}

export type Handler<T> = (value: T) => unknown;

class ComponentBase {
    protected readonly log: CallLog;
    protected readonly name: string;

    constructor(log: CallLog, name: string) {
        this.log = log;
        this.name = name;
    }
}

export class ToggleStub extends ComponentBase {
    value = false;
    changeHandler: Handler<boolean> | null = null;

    setValue(value: boolean): this {
        this.value = value;
        this.log.record(this.name, 'setValue', value);
        return this;
    }
    setDisabled(disabled: boolean): this {
        this.log.record(this.name, 'setDisabled', disabled);
        return this;
    }
    setTooltip(tooltip: string): this {
        this.log.record(this.name, 'setTooltip', tooltip);
        return this;
    }
    onChange(handler: Handler<boolean>): this {
        this.changeHandler = handler;
        return this;
    }
    /** Simulate the user toggling it. */
    trigger(value: boolean): unknown {
        this.value = value;
        return this.changeHandler ? this.changeHandler(value) : undefined;
    }
}

export class DropdownStub extends ComponentBase {
    readonly options = new Map<string, string>();
    value = '';
    changeHandler: Handler<string> | null = null;

    addOption(key: string, label: string): this {
        this.options.set(key, label);
        this.log.record(this.name, 'addOption', key, label);
        return this;
    }
    addOptions(options: Record<string, string>): this {
        for (const [key, label] of Object.entries(options)) this.addOption(key, label);
        return this;
    }
    setValue(value: string): this {
        this.value = value;
        this.log.record(this.name, 'setValue', value);
        return this;
    }
    setDisabled(disabled: boolean): this {
        this.log.record(this.name, 'setDisabled', disabled);
        return this;
    }
    onChange(handler: Handler<string>): this {
        this.changeHandler = handler;
        return this;
    }
    trigger(value: string): unknown {
        this.value = value;
        return this.changeHandler ? this.changeHandler(value) : undefined;
    }
}

export class ButtonStub extends ComponentBase {
    clickHandler: Handler<MouseEvent | undefined> | null = null;

    setButtonText(text: string): this {
        this.log.record(this.name, 'setButtonText', text);
        return this;
    }
    setIcon(icon: string): this {
        this.log.record(this.name, 'setIcon', icon);
        return this;
    }
    setTooltip(tooltip: string): this {
        this.log.record(this.name, 'setTooltip', tooltip);
        return this;
    }
    setClass(cls: string): this {
        this.log.record(this.name, 'setClass', cls);
        return this;
    }
    setCta(): this {
        this.log.record(this.name, 'setCta');
        return this;
    }
    setWarning(): this {
        this.log.record(this.name, 'setWarning');
        return this;
    }
    setDisabled(disabled: boolean): this {
        this.log.record(this.name, 'setDisabled', disabled);
        return this;
    }
    onClick(handler: Handler<MouseEvent | undefined>): this {
        this.clickHandler = handler;
        return this;
    }
    trigger(): unknown {
        return this.clickHandler ? this.clickHandler(undefined) : undefined;
    }
}

export class TextStub extends ComponentBase {
    value = '';
    changeHandler: Handler<string> | null = null;

    setValue(value: string): this {
        this.value = value;
        this.log.record(this.name, 'setValue', value);
        return this;
    }
    setPlaceholder(placeholder: string): this {
        this.log.record(this.name, 'setPlaceholder', placeholder);
        return this;
    }
    setDisabled(disabled: boolean): this {
        this.log.record(this.name, 'setDisabled', disabled);
        return this;
    }
    onChange(handler: Handler<string>): this {
        this.changeHandler = handler;
        return this;
    }
    trigger(value: string): unknown {
        this.value = value;
        return this.changeHandler ? this.changeHandler(value) : undefined;
    }
}

export class SettingStub {
    readonly containerEl: HTMLElement;
    readonly settingEl: HTMLElement;
    readonly nameEl: HTMLElement;
    readonly descEl: HTMLElement;
    readonly controlEl: HTMLElement;
    readonly components: unknown[] = [];

    private readonly log: CallLog;
    private readonly index: number;

    constructor(containerEl: HTMLElement, log: CallLog, index: number) {
        this.containerEl = containerEl;
        this.log = log;
        this.index = index;

        const doc = containerEl.ownerDocument;
        this.settingEl = doc.createElement('div');
        this.settingEl.className = 'setting-item';
        this.nameEl = doc.createElement('div');
        this.descEl = doc.createElement('div');
        this.controlEl = doc.createElement('div');
        this.settingEl.append(this.nameEl, this.descEl, this.controlEl);
        containerEl.appendChild(this.settingEl);
    }

    private get tag(): string {
        return `Setting[${this.index}]`;
    }

    setName(name: string): this {
        this.nameEl.textContent = name;
        this.log.record(this.tag, 'setName', name);
        return this;
    }
    setDesc(desc: string): this {
        this.descEl.textContent = desc;
        this.log.record(this.tag, 'setDesc', desc);
        return this;
    }
    setHeading(): this {
        this.log.record(this.tag, 'setHeading');
        return this;
    }
    setClass(cls: string): this {
        this.settingEl.classList.add(cls);
        this.log.record(this.tag, 'setClass', cls);
        return this;
    }
    setTooltip(tooltip: string): this {
        this.log.record(this.tag, 'setTooltip', tooltip);
        return this;
    }
    setDisabled(disabled: boolean): this {
        this.log.record(this.tag, 'setDisabled', disabled);
        return this;
    }
    addToggle(cb: (toggle: ToggleStub) => unknown): this {
        const toggle = new ToggleStub(this.log, `${this.tag}.toggle`);
        this.components.push(toggle);
        this.log.record(this.tag, 'addToggle');
        cb(toggle);
        return this;
    }
    addDropdown(cb: (dropdown: DropdownStub) => unknown): this {
        const dropdown = new DropdownStub(this.log, `${this.tag}.dropdown`);
        this.components.push(dropdown);
        this.log.record(this.tag, 'addDropdown');
        cb(dropdown);
        return this;
    }
    addButton(cb: (button: ButtonStub) => unknown): this {
        const button = new ButtonStub(this.log, `${this.tag}.button`);
        this.components.push(button);
        this.log.record(this.tag, 'addButton');
        cb(button);
        return this;
    }
    addExtraButton(cb: (button: ButtonStub) => unknown): this {
        const button = new ButtonStub(this.log, `${this.tag}.extraButton`);
        this.components.push(button);
        this.log.record(this.tag, 'addExtraButton');
        cb(button);
        return this;
    }
    addText(cb: (text: TextStub) => unknown): this {
        const text = new TextStub(this.log, `${this.tag}.text`);
        this.components.push(text);
        this.log.record(this.tag, 'addText');
        cb(text);
        return this;
    }
    then(cb: (setting: this) => unknown): this {
        cb(this);
        return this;
    }
}

export class MenuItemStub {
    clickHandler: Handler<MouseEvent | undefined> | null = null;
    title = '';
    icon = '';
    // A submenu is a menu in its own right, so its items stay observable.
    submenu: MenuStub | null = null;

    private readonly log: CallLog;
    private readonly tag: string;

    constructor(log: CallLog, tag: string) {
        this.log = log;
        this.tag = tag;
    }

    setTitle(title: string): this {
        this.title = title;
        this.log.record(this.tag, 'setTitle', title);
        return this;
    }
    setIcon(icon: string): this {
        this.icon = icon;
        this.log.record(this.tag, 'setIcon', icon);
        return this;
    }
    setSection(section: string): this {
        this.log.record(this.tag, 'setSection', section);
        return this;
    }
    setDisabled(disabled: boolean): this {
        this.log.record(this.tag, 'setDisabled', disabled);
        return this;
    }
    setChecked(checked: boolean): this {
        this.log.record(this.tag, 'setChecked', checked);
        return this;
    }
    setSubmenu(): MenuStub {
        this.log.record(this.tag, 'setSubmenu');
        if (!this.submenu) this.submenu = new MenuStub(this.log);
        return this.submenu;
    }
    onClick(handler: Handler<MouseEvent | undefined>): this {
        this.clickHandler = handler;
        return this;
    }
    trigger(): unknown {
        return this.clickHandler ? this.clickHandler(undefined) : undefined;
    }
}

export class MenuStub {
    readonly items: MenuItemStub[] = [];
    shown = false;

    private readonly log: CallLog;

    constructor(log: CallLog) {
        this.log = log;
    }

    addItem(cb: (item: MenuItemStub) => unknown): this {
        const item = new MenuItemStub(this.log, `Menu.item[${this.items.length}]`);
        this.items.push(item);
        cb(item);
        return this;
    }
    addSeparator(): this {
        this.log.record('Menu', 'addSeparator');
        return this;
    }
    showAtMouseEvent(): this {
        this.shown = true;
        this.log.record('Menu', 'showAtMouseEvent');
        return this;
    }
    showAtPosition(): this {
        this.shown = true;
        this.log.record('Menu', 'showAtPosition');
        return this;
    }
    hide(): this {
        this.shown = false;
        return this;
    }
    /** Find an item by its rendered title, so locks can assert on intent. */
    item(title: string): MenuItemStub | undefined {
        return this.items.find((item) => item.title === title);
    }
}

export class NoticeStub {
    readonly message: string;
    readonly durationMs: number | undefined;
    hidden = false;

    constructor(message: string, durationMs?: number) {
        this.message = message;
        this.durationMs = durationMs;
    }

    hide(): void {
        this.hidden = true;
    }

    setMessage(message: string): this {
        return this;
    }
}
