import { type App, type Menu } from 'obsidian';
import * as obsidianInternals from './platform/obsidian-internals.ts';

/**
 * What the two context-menu modules - one for a session row, one for the empty
 * area behind it - genuinely have in common. They had a copy each.
 */

/** Anything that can be asked to open this plugin's own settings tab. */
export interface SettingTabHost {
    manifest: { id: string };
}

/**
 * `Menu.showAtMouseEvent` is typed as requiring a `MouseEvent`, and both
 * callers hold one that may be undefined - a menu opened from a keyboard path
 * has no event. Reflect.apply passes it through without asserting a shape the
 * value may not have, which is what an `as MouseEvent` here would do.
 */
export function showAtMouseEvent(menu: Menu, event: MouseEvent | undefined): void {
    const show = (input: MouseEvent): unknown => menu.showAtMouseEvent(input);
    Reflect.apply(show, undefined, [event]);
}

/** Run `value` if it is a function, ignore it otherwise. */
export function call(value: unknown): void {
    if (typeof value === 'function') (value as () => void)();
}

export interface OpenSettingsItemOptions {
    readonly title: string;
    readonly icon: string;
}

/**
 * A menu item that opens this plugin's settings.
 *
 * One body, two labels. The status-bar menu calls it "Customize click
 * actions", because that is what the person right-clicking the status bar is
 * after; the settings menu calls it "Open settings". Those used to be two
 * items with two identical bodies, and for a while the settings menu carried
 * both of them - the customize item preselected the General tab, and once the
 * tabs were gone the two were the same item twice.
 */
export function addOpenSettingsItem(
    menu: Menu,
    app: App,
    plugin: SettingTabHost,
    options: OpenSettingsItemOptions
): void {
    menu.addItem((mi) => {
        mi.setTitle(options.title);
        mi.setIcon(options.icon);
        mi.onClick(() => {
            obsidianInternals.openSettingTab(app, plugin.manifest.id);
        });
    });
}
