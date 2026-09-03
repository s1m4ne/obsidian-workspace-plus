import { Setting, type App } from 'obsidian';
import type {
    SettingDefinition,
    SettingDefinitionGroup,
    SettingDefinitionItem,
    SettingDefinitionPage,
} from 'obsidian';

/**
 * Renders setting definitions the way Obsidian 1.13 would, for Obsidian that
 * cannot.
 *
 * `minAppVersion` is 1.11.0 and the declarative settings API arrived in 1.13.0,
 * so `getSettingDefinitions()` is ignored on two supported versions and
 * `display()` still has to put something on screen. This walks the same array
 * `getSettingDefinitions()` returns, so the settings are described once - which
 * is the whole point. Two descriptions of one screen is what this file exists
 * to avoid, not what it introduces.
 *
 * **Delete this file when `minAppVersion` reaches 1.13.0.** Nothing else uses
 * it, and on 1.13 Obsidian renders the same definitions itself.
 *
 * It covers what `settings-tab.ts` actually declares and nothing more: groups,
 * controls of the four types in use, actions, and imperative rows. An
 * unrecognised definition renders its name, so a new kind of definition shows
 * up as a plain row rather than vanishing.
 */

export interface ControlValueAccess {
    /** The value behind a definition's `key`. */
    read(key: string): unknown;
    /** Write it back, the way Obsidian's own renderer would. */
    write(key: string, value: unknown): void | Promise<void>;
}

/**
 * A stored value as the string a text or dropdown component needs.
 *
 * The value is `unknown` - it comes from this plugin's own storage through
 * `ControlValueAccess` - so `String()` on it would stringify an object as
 * "[object Object]" and put that in the box. Only the primitives a control can
 * actually hold are accepted; anything else renders empty, which is visible as
 * wrong rather than plausible.
 */
function asControlText(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
}

function isVisible(item: { visible?: boolean | (() => boolean) }): boolean {
    const visible = item.visible;
    if (visible === undefined) return true;
    return typeof visible === 'function' ? visible() : visible;
}

function isDisabled(source: { disabled?: boolean | (() => boolean) } | undefined): boolean {
    const disabled = source?.disabled;
    if (disabled === undefined) return false;
    return typeof disabled === 'function' ? disabled() : disabled;
}

function isGroup(item: SettingDefinitionItem): item is SettingDefinitionGroup {
    return 'type' in item && (item.type === 'group' || item.type === 'list');
}

function isPage(item: SettingDefinitionItem): item is SettingDefinitionPage {
    return 'type' in item && item.type === 'page';
}

function renderControl(
    setting: Setting,
    definition: SettingDefinition,
    access: ControlValueAccess
): void {
    const control = definition.control;
    if (!control) return;
    const current = access.read(control.key) ?? control.defaultValue;
    const disabled = isDisabled(control);

    if (control.type === 'toggle') {
        setting.addToggle((toggle) => {
            toggle.setValue(current === true);
            toggle.setDisabled(disabled);
            toggle.onChange((value) => { void access.write(control.key, value); });
        });
        return;
    }

    if (control.type === 'dropdown') {
        setting.addDropdown((dropdown) => {
            for (const [value, label] of Object.entries(control.options ?? {})) {
                dropdown.addOption(value, label);
            }
            dropdown.setValue(asControlText(current));
            dropdown.setDisabled(disabled);
            dropdown.onChange((value) => { void access.write(control.key, value); });
        });
        return;
    }

    if (control.type === 'text' || control.type === 'number') {
        setting.addText((input) => {
            input.setValue(asControlText(current));
            input.setDisabled(disabled);
            input.onChange((value) => { void access.write(control.key, value); });
        });
        return;
    }

    // A control type these settings do not declare. The row still carries its
    // name, so it is visible as unfinished rather than silently absent.
}

function renderDefinition(
    containerEl: HTMLElement,
    definition: SettingDefinition,
    access: ControlValueAccess
): void {
    const setting = new Setting(containerEl);
    setting.setName(definition.name);
    if (definition.desc !== undefined) setting.setDesc(definition.desc);

    if (definition.render) {
        // Obsidian types `render` as (setting, group). Every render in
        // settings-tab.ts takes the setting alone, and a SettingGroup cannot be
        // constructed here anyway: the class arrived with the very API this
        // file stands in for.
        const draw = definition.render as unknown as (row: Setting) => void;
        draw(setting);
        return;
    }

    if (definition.action) {
        const action = definition.action;
        setting.addButton((button) => {
            button.setButtonText(definition.name);
            button.setDisabled(isDisabled(definition));
            button.onClick(() => { action(setting.settingEl, 0); });
        });
        return;
    }

    renderControl(setting, definition, access);
}

/**
 * Put `items` on screen under `containerEl`.
 *
 * `heading` uses Obsidian's own `setHeading()` rather than a heading element,
 * which is what its review scanner asks for and what the settings screen
 * styles.
 */
export function renderDefinitions(
    containerEl: HTMLElement,
    items: readonly SettingDefinitionItem[],
    access: ControlValueAccess,
    app?: App
): void {
    void app;
    for (const item of items) {
        if (!isVisible(item)) continue;

        if (isPage(item)) {
            // A navigable sub-page has no equivalent before 1.13. Nothing here
            // declares one; if something does, its name is rendered so the gap
            // is visible.
            new Setting(containerEl).setName(item.name).setHeading();
            continue;
        }

        if (isGroup(item)) {
            const group = item;
            if (group.heading) {
                const heading = new Setting(containerEl).setName(group.heading).setHeading();
                if (group.cls) heading.settingEl.addClass(group.cls);
            }
            for (const child of group.items ?? []) {
                if (!isVisible(child)) continue;
                if (isPage(child)) continue;
                renderDefinition(containerEl, child, access);
            }
            continue;
        }

        renderDefinition(containerEl, item, access);
    }
}
