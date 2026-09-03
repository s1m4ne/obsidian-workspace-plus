import type { SettingDefinitionPage } from 'obsidian';
import { L, formatString, text } from '../i18n.ts';
import type { SettingsContext } from '../settings-tab.ts';

/**
 * Switching sessions by scrolling the status bar.
 *
 * Seven rows, six of which mean nothing until the first is on, and three of
 * those are the numbers only the custom preset uses. The page's own row shows
 * which preset is live, so the state is legible without opening it.
 */

const PRESET_LABEL_KEYS: Record<string, string> = {
    trackpad: 'settingsStatusBarScrollPresetTrackpad',
    notchedWheel: 'settingsStatusBarScrollPresetNotchedWheel',
    freeSpinWheel: 'settingsStatusBarScrollPresetFreeSpinWheel',
    custom: 'settingsStatusBarScrollPresetCustom',
};

// `formatString` rather than `text` throughout this file: three of the modifier
// labels are builders, for the same reason the status-bar slots are - the
// modifier is a glyph on macOS and a word elsewhere. `text` renders a builder
// as the empty string.
function presetOptions(): Record<string, string> {
    const options: Record<string, string> = {};
    for (const [value, key] of Object.entries(PRESET_LABEL_KEYS)) {
        options[value] = formatString((L as Record<string, unknown>)[key]);
    }
    return options;
}

export function scrollSwitchPage(ctx: SettingsContext): SettingDefinitionPage {
    const settingsState = (): ReturnType<SettingsContext['plugin']['getSettingsState']> =>
        ctx.plugin.getSettingsState();

    const whenEnabled = (): boolean => settingsState().statusBarModScrollSwitch;
    // The three numbers below belong to the custom preset; the other presets
    // set them, so they are shown greyed rather than hidden.
    const notCustom = (): boolean => settingsState().statusBarScrollPreset !== 'custom';

    return {
        type: 'page',
        name: text(L.settingsSubsectionScrollSwitch),
        desc: text(L.settingsStatusBarModScrollSwitchDesc),
        items: [
            // What the feature is and which way it goes. Everything else on
            // this page is tuning.
            {
                type: 'group',
                items: [
                    {
                        name: text(L.settingsStatusBarModScrollSwitch),
                        desc: text(L.settingsStatusBarModScrollSwitchDesc),
                        control: { type: 'toggle', key: 'statusBarModScrollSwitch' },
                    },
                    {
                        name: text(L.settingsStatusBarScrollInvert),
                        desc: text(L.settingsStatusBarScrollInvertDesc),
                        visible: whenEnabled,
                        control: { type: 'toggle', key: 'statusBarScrollInvert' },
                    },
                ],
            },
            {
                type: 'group',
                heading: text(L.settingsSectionAdvanced),
                // The group goes as a whole rather than row by row: with the
                // feature off there is nothing here to tune.
                visible: whenEnabled,
                items: [
                    {
                        name: text(L.settingsStatusBarScrollPreset),
                        desc: text(L.settingsStatusBarScrollPresetDesc),
                        control: { type: 'dropdown', key: 'statusBarScrollPreset', options: presetOptions() },
                    },
                    {
                        name: text(L.settingsStatusBarScrollModifier),
                        desc: text(L.settingsStatusBarScrollModifierDesc),
                        control: {
                            type: 'dropdown',
                            key: 'statusBarScrollModifier',
                            options: {
                                none: formatString(L.settingsStatusBarScrollModifierNone),
                                modOnly: formatString(L.settingsStatusBarScrollModifierModOnly),
                                altOnly: formatString(L.settingsStatusBarScrollModifierAltOnly),
                                modOrAlt: formatString(L.settingsStatusBarScrollModifierModOrAlt),
                            },
                        },
                    },
                    {
                        name: text(L.settingsStatusBarScrollThreshold),
                        desc: text(L.settingsStatusBarScrollThresholdDesc),
                        control: {
                            type: 'dropdown',
                            key: 'statusBarScrollThreshold',
                            disabled: notCustom,
                            options: { '12': '12', '16': '16', '24': '24', '30': '30', '40': '40', '60': '60', '90': '90' },
                        },
                    },
                    {
                        name: text(L.settingsStatusBarScrollCooldown),
                        desc: text(L.settingsStatusBarScrollCooldownDesc),
                        control: {
                            type: 'dropdown',
                            key: 'statusBarScrollCooldown',
                            disabled: notCustom,
                            options: { '200': '200 ms', '350': '350 ms', '500': '500 ms', '750': '750 ms', '1000': '1000 ms' },
                        },
                    },
                    {
                        name: text(L.settingsStatusBarScrollResetWindow),
                        desc: text(L.settingsStatusBarScrollResetWindowDesc),
                        control: {
                            type: 'dropdown',
                            key: 'statusBarScrollResetWindow',
                            disabled: notCustom,
                            options: { '150': '150 ms', '250': '250 ms', '400': '400 ms', '600': '600 ms' },
                        },
                    },
                ],
            },
        ],
    };
}
