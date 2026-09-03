import type { SettingDefinitionItem, SettingGroupItem } from 'obsidian';
import { L, LANG_OPTIONS, LANG_ORDER, text } from '../i18n.ts';
import { openHotkeysSetting } from '../platform/obsidian-internals.ts';
import type { SettingsContext } from '../settings-tab.ts';

/**
 * The first screen: the settings people change, as groups.
 *
 * Nothing here is behind a door. What moved onto a `page` is what is either
 * dense (twelve status-bar slots), rarely touched (backups), or dangerous
 * (the resets) - and each of those can be summarised in the one line the
 * navigable row shows, which is the test for whether it belongs on a page at
 * all.
 */

function languageOptions(): Record<string, string> {
    const options: Record<string, string> = { auto: text(L.settingsLangAuto) };
    for (const code of LANG_ORDER) {
        options[code] = LANG_OPTIONS[code] ?? code;
    }
    return options;
}

/** True while switching does *not* save, which is when the warnings mean anything. */
function whenSwitchDoesNotAutoSave(ctx: SettingsContext): () => boolean {
    return () => !ctx.plugin.getSessionSaver().isAutoSaveOnSwitchEnabled();
}

function generalGroup(ctx: SettingsContext): SettingDefinitionItem {
    return {
        type: 'group',
        items: [
            {
                name: text(L.settingsLanguage),
                desc: text(L.settingsLanguageDesc),
                control: { type: 'dropdown', key: 'language', options: languageOptions() },
            },
            {
                // No description: there is no `settingsHotkeysDesc` key, and
                // adding one would fail the i18n value lock.
                name: text(L.settingsHotkeys),
                action: () => {
                    openHotkeysSetting(ctx.app, ctx.plugin.manifest?.name || 'Workspace++');
                },
            },
        ],
    };
}

function savingGroup(ctx: SettingsContext): SettingDefinitionItem {
    const unsaved = whenSwitchDoesNotAutoSave(ctx);
    return {
        type: 'group',
        heading: text(L.settingsSubsectionAutoSaveMode),
        items: [
            {
                name: text(L.settingsAutoSaveOnSwitch),
                desc: text(L.settingsAutoSaveOnSwitchDesc),
                control: { type: 'toggle', key: 'autoSaveOnSwitch' },
            },
            // These two only mean anything when the layout is not saved on
            // every switch: with auto-save on there is nothing unsaved to warn
            // about.
            {
                name: text(L.settingsWarnUnsavedSwitch),
                desc: text(L.settingsWarnUnsavedSwitchDesc),
                visible: unsaved,
                control: { type: 'toggle', key: 'warnUnsavedSwitch' },
            },
            {
                name: text(L.settingsHighlightUnsavedSessionChanges),
                desc: text(L.settingsHighlightUnsavedSessionChangesDesc),
                visible: unsaved,
                control: { type: 'toggle', key: 'highlightUnsavedSessionChanges' },
            },
        ],
    };
}

function restoreGroup(): SettingDefinitionItem {
    return {
        type: 'group',
        heading: text(L.settingsSubsectionSessionRestore),
        items: [{
            name: text(L.settingsRestoreSidebars),
            desc: text(L.settingsRestoreSidebarsDesc),
            control: { type: 'toggle', key: 'restoreSidebars' },
        }],
    };
}

function switchCommandsGroup(): SettingDefinitionItem {
    return {
        type: 'group',
        heading: text(L.settingsSubsectionSwitchCommands),
        items: [
            {
                name: text(L.settingsShowActiveSwitchCommand),
                desc: text(L.settingsShowActiveSwitchCommandDesc),
                control: { type: 'toggle', key: 'showActiveSwitchCommand' },
            },
            {
                name: text(L.settingsNumberedSwitchCommands),
                desc: text(L.settingsNumberedSwitchCommandsDesc),
                control: { type: 'toggle', key: 'numberedSwitchCommands' },
            },
        ],
    };
}

/**
 * The preview master and its two directions.
 *
 * The two direction rows used to sit in a nested block inside the master row.
 * A definition is one row, so they are siblings now, and they are there only
 * while the master is on - the same shape the auto-save warnings have, where a
 * setting that cannot apply is absent rather than present and inert.
 */
function switchPreviewGroup(ctx: SettingsContext): SettingDefinitionItem {
    const previewing = (): boolean => {
        const settingsState = ctx.plugin.getSettingsState();
        return settingsState.previewNext || settingsState.previewPrevious;
    };

    return {
        type: 'group',
        heading: text(L.settingsSubsectionSwitchPreview),
        items: [
            {
                name: text(L.settingsPreviewHeading),
                desc: text(L.settingsPreviewDesc),
                control: { type: 'toggle', key: 'switchPreviewEnabled' },
            },
            {
                name: text(L.settingsPreviewNext),
                visible: previewing,
                control: { type: 'toggle', key: 'previewNext' },
            },
            {
                name: text(L.settingsPreviewPrevious),
                visible: previewing,
                control: { type: 'toggle', key: 'previewPrevious' },
            },
        ],
    };
}

function overlayGroup(): SettingDefinitionItem {
    return {
        type: 'group',
        heading: text(L.settingsSectionSessionListSearch),
        items: [
            {
                name: text(L.settingsShowFilterInput),
                desc: text(L.settingsShowFilterInputDesc),
                control: { type: 'toggle', key: 'showFilterInput' },
            },
            {
                name: text(L.settingsOverlayDefaultFocus),
                desc: text(L.settingsOverlayDefaultFocusDesc),
                control: {
                    type: 'dropdown',
                    key: 'overlayDefaultFocus',
                    options: {
                        'current-session': text(L.settingsOverlayFocusCurrentSession),
                        'session-filter': text(L.settingsOverlayFocusSessionFilter),
                        'session-create': text(L.settingsOverlayFocusSessionCreate),
                    },
                },
            },
        ],
    };
}

function confirmationsGroup(ctx: SettingsContext): SettingDefinitionItem {
    return {
        type: 'group',
        heading: text(L.settingsSectionDeletion),
        items: [
            {
                name: text(L.settingsConfirmDelete),
                desc: text(L.settingsConfirmDeleteDesc),
                control: { type: 'toggle', key: 'confirmDeleteByHotkey' },
            },
            {
                name: text(L.settingsConfirmQuickActions),
                desc: text(L.settingsConfirmQuickActionsDesc),
                visible: whenSwitchDoesNotAutoSave(ctx),
                control: { type: 'toggle', key: 'confirmQuickActions' },
            },
        ],
    };
}

/** The doors, in one card at the foot of the screen. */
export function pagesGroup(pages: readonly SettingGroupItem[]): SettingDefinitionItem {
    return { type: 'group', items: [...pages] };
}

export function surfaceGroups(ctx: SettingsContext): SettingDefinitionItem[] {
    return [
        generalGroup(ctx),
        savingGroup(ctx),
        restoreGroup(),
        switchCommandsGroup(),
        switchPreviewGroup(ctx),
        overlayGroup(),
        confirmationsGroup(ctx),
    ];
}
