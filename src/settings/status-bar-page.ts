import type { SettingDefinitionPage, SettingGroupItem } from 'obsidian';
import { L, formatString, text } from '../i18n.ts';
import * as statusBarActions from '../statusbar-actions.ts';

/**
 * The twelve status-bar slots.
 *
 * The single largest block on the screen, and one nobody sets twice, so it is
 * the clearest case for a page: the navigable row says how many slots carry an
 * action, which is the whole of what a reader wants from it without opening it.
 */

const SLOT_LABEL_KEYS: Record<string, string> = {
    click: 'statusBarSlotClick',
    altClick: 'statusBarSlotAltClick',
    modClick: 'statusBarSlotModClick',
    shiftClick: 'statusBarSlotShiftClick',
    middleClick: 'statusBarSlotMiddleClick',
    altMiddleClick: 'statusBarSlotAltMiddleClick',
    modMiddleClick: 'statusBarSlotModMiddleClick',
    shiftMiddleClick: 'statusBarSlotShiftMiddleClick',
    rightClick: 'statusBarSlotRightClick',
    altRightClick: 'statusBarSlotAltRightClick',
    modRightClick: 'statusBarSlotModRightClick',
    shiftRightClick: 'statusBarSlotShiftRightClick',
};

/**
 * What the slot is called, in this locale, on this platform.
 *
 * `formatString`, not `text`: nine of the twelve are builders, because the
 * label has to name the key the user actually has - Obsidian's own settings
 * write the modifier as a glyph on macOS and as a word elsewhere, so the string
 * cannot be a constant. `text` returns '' for a function, which is what left
 * nine of these twelve rows nameless.
 */
function slotLabel(slotKey: string): string {
    const labelKey = SLOT_LABEL_KEYS[slotKey];
    if (!labelKey) return slotKey;
    return formatString((L as Record<string, unknown>)[labelKey]) || slotKey;
}

export function statusBarPage(): SettingDefinitionPage {
    const actionOptions: Record<string, string> = {};
    for (const actionId of statusBarActions.ACTION_IDS) {
        actionOptions[actionId] = statusBarActions.getActionLabel(L, actionId);
    }

    const slots: SettingGroupItem[] = statusBarActions.SLOT_KEYS.map((slotKey) => ({
        name: slotLabel(slotKey),
        control: { type: 'dropdown', key: `statusBarActions.${slotKey}`, options: actionOptions },
    }));

    return {
        type: 'page',
        name: text(L.settingsSectionStatusBar),
        desc: text(L.settingsSectionStatusBarDesc),
        // No summary. "5 / 12" was accurate and told the reader nothing they
        // wanted: how many slots are spoken for is not why anyone opens this.
        items: [{ type: 'group', items: slots }],
    };
}
