import { type App, type Menu } from 'obsidian';
import { L, text } from './i18n.ts';
import * as obsidianInternals from './platform/obsidian-internals.ts';
import type { TabId } from './settings-tab.ts';

/**
 * What the two context-menu modules - one for a session row, one for the empty
 * area behind it - genuinely have in common. They had a copy each.
 */

/** Anything that can be asked to open this plugin's own settings tab. */
export interface SettingTabHost {
    settingTab?: { activeTab: TabId | null } | undefined;
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

/**
 * "Customize click actions", which lands on the General tab.
 *
 * Both menus offer it, identically, and *which tab* is the decision worth
 * keeping in one place: changing it in one copy would have left the two menus
 * opening different screens from the same wording.
 */
export function addCustomizeClicksItem(menu: Menu, app: App, plugin: SettingTabHost): void {
    menu.addItem((mi) => {
        mi.setTitle(text(L.contextCustomizeClicks));
        mi.setIcon('mouse-pointer-click');
        mi.onClick(() => {
            if (plugin.settingTab) plugin.settingTab.activeTab = 'general';
            obsidianInternals.openSettingTab(app, plugin.manifest.id);
        });
    });
}
