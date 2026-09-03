import type { SettingDefinitionPage } from 'obsidian';
import { L, text } from '../i18n.ts';
import type { SettingsContext } from '../settings-tab.ts';

/**
 * Version history.
 *
 * Its own page rather than a group: three settings that are set once, and the
 * snapshot interval only applies while switching saves automatically -
 * otherwise snapshots are taken on the explicit save instead, and the row has
 * nothing to say.
 */
export function historyPage(ctx: SettingsContext): SettingDefinitionPage {
    const enabled = (): boolean => ctx.plugin.getHistoryService().isVersionHistoryEnabled();
    const onInterval = (): boolean => ctx.plugin.getSessionSaver().isAutoSaveOnSwitchEnabled();
    const off = (): boolean => !enabled();

    const intervalOptions: Record<string, string> = {};
    for (const minutes of ['1', '2', '5', '10', '15', '30']) {
        intervalOptions[minutes] = minutes;
    }

    return {
        type: 'page',
        name: text(L.historyTitle),
        desc: text(L.settingsVersionHistoryEnabledDesc),
        // The interval, in the same bare minutes the dropdown itself shows.
        // Nothing while it is off, and nothing while the interval does not
        // apply, rather than a number that would be read as in force.
        displayValue: () => (enabled() && onInterval()
            ? String(ctx.plugin.getHistoryService().getVersionHistorySnapshotInterval())
            : ''),
        items: [{
            type: 'group',
            items: [
                {
                    name: text(L.settingsVersionHistoryEnabled),
                    desc: text(L.settingsVersionHistoryEnabledDesc),
                    control: { type: 'toggle', key: 'versionHistoryEnabled' },
                },
                {
                    name: text(L.settingsVersionHistoryInterval),
                    desc: text(L.settingsVersionHistoryIntervalDesc),
                    visible: onInterval,
                    control: { type: 'dropdown', key: 'versionHistoryInterval', disabled: off, options: intervalOptions },
                },
                {
                    name: text(L.settingsVersionHistoryConfirmRestore),
                    desc: text(L.settingsVersionHistoryConfirmRestoreDesc),
                    control: { type: 'toggle', key: 'versionHistoryConfirmRestore', disabled: off },
                },
            ],
        }],
    };
}
