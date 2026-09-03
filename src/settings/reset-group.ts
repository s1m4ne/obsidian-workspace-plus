import type { SettingDefinitionItem } from 'obsidian';
import { L, text } from '../i18n.ts';
import type { SettingsContext } from '../settings-tab.ts';
import { dangerRow } from './danger-row.ts';

/**
 * The four things that cannot be undone.
 *
 * On the surface, at the foot of the screen, rather than behind the door with
 * the storage settings - at the maintainer's request. They were grouped with
 * the storage location because both are about the plugin's files; they are not
 * about the same *task*, and having to open "Advanced" to find a reset is a
 * worse trade than having four red buttons at the bottom of a screen nobody
 * scrolls to by accident. Each one still asks before it runs.
 */
export function resetGroup(ctx: SettingsContext): SettingDefinitionItem {
    return {
        type: 'group',
        heading: text(L.settingsSectionReset),
        items: [
            dangerRow(ctx, {
                name: text(L.settingsResetSettings),
                desc: text(L.settingsResetSettingsDesc),
                buttonText: text(L.settingsResetBtn),
                confirmMessage: text(L.confirmResetSettings),
                run: () => ctx.plugin.resetSettingsToDefault(),
                successNotice: text(L.resetSettingsDone),
                failureNotice: text(L.resetSettingsFailed),
            }),
            dangerRow(ctx, {
                name: text(L.settingsResetSessions),
                desc: text(L.settingsResetSessionsDesc),
                buttonText: text(L.settingsResetBtn),
                confirmMessage: text(L.confirmResetSessions),
                confirmHint: text(L.resetSessionsHint),
                run: () => ctx.plugin.getSessionStore().resetSessionsToDefault(),
                successNotice: text(L.resetSessionsDone),
                failureNotice: text(L.resetSessionsFailed),
            }),
            dangerRow(ctx, {
                name: text(L.settingsResetBackupsAndHistory),
                desc: text(L.settingsResetBackupsAndHistoryDesc),
                // Its own verb, not the shared reset one: this row deletes, and
                // the button has to say what the row says.
                buttonText: text(L.settingsResetBackupsAndHistoryBtn),
                confirmMessage: text(L.confirmResetBackupsAndHistory),
                confirmHint: text(L.resetBackupsAndHistoryHint),
                run: () => ctx.plugin.clearBackupsAndVersionHistory(),
                successNotice: text(L.resetBackupsAndHistoryDone),
                failureNotice: text(L.resetBackupsAndHistoryFailed),
            }),
            dangerRow(ctx, {
                name: text(L.settingsResetSessionsAndSettings),
                desc: text(L.settingsResetSessionsAndSettingsDesc),
                buttonText: text(L.settingsResetSessionsAndSettingsBtn),
                confirmMessage: text(L.confirmResetSessionsAndSettings),
                run: () => ctx.plugin.resetSessionsAndSettingsToDefault(),
                successNotice: text(L.resetSessionsAndSettingsDone),
                failureNotice: text(L.resetSessionsAndSettingsFailed),
            }),
        ],
    };
}
