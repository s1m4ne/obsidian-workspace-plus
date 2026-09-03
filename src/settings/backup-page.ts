import { type Setting } from 'obsidian';
import type { SettingDefinitionItem, SettingDefinitionPage, SettingGroupItem } from 'obsidian';
import { L, formatString, text } from '../i18n.ts';
import { ConfirmModal } from '../modals/confirm-modal.ts';
import { formatRelativeTime } from '../modals/format-relative-time.ts';
import { createRotationBackupNow, type RotationBackupInfo } from '../storage/storage-backup.ts';
import type { SettingsContext } from '../settings-tab.ts';
import { absoluteTime } from './format.ts';

/**
 * The three rotating backups: take one, see what is there, put one back.
 *
 * Built as two groups of ordinary rows rather than a `list`. A list is for
 * entries the user adds and removes, and it renders them compactly, with its
 * add affordance as a bare `+` in the header - which reads as "add a row",
 * not "back up now". These are generations the plugin rotates, and each one is
 * worth a full row: when it was taken, how long ago, how much is in it, and
 * which machine took it, with the button that puts it back beside it.
 *
 * `backups` is null while the read is in flight.
 */

/**
 * One generation.
 *
 * The absolute time is the name because it is what identifies the backup; the
 * description carries what makes it legible - how long ago, how many sessions,
 * and the platform when the file records one, which is what tells two machines'
 * backups apart.
 */
function backupRow(ctx: SettingsContext, backup: RotationBackupInfo): SettingGroupItem {
    const savedAtText = absoluteTime(backup.savedAt);
    const summary = [
        formatRelativeTime(backup.savedAt),
        formatString(L.rotationBackupGeneration, backup.sessionCount),
    ];
    if (backup.backupPlatform) summary.push(backup.backupPlatform);

    return {
        name: `${backup.generation}.  ${savedAtText}`,
        desc: summary.join('  ·  '),
        // Not indexed: the generations rotate, and a search result naming one
        // that has since moved would be worse than none.
        searchable: false,
        render: (setting: Setting) => {
            setting.addButton((button) => {
                button.setButtonText(text(L.rotationBackupRestore));
                button.onClick(() => {
                    new ConfirmModal(
                        ctx.app,
                        formatString(L.rotationBackupRestoreConfirm, savedAtText, backup.sessionCount),
                        // ConfirmModal ignores what this returns, so the restore
                        // is deliberately not awaited - the screen is re-read
                        // when it lands.
                        () => {
                            void ctx.plugin.restoreFromRotationBackup(backup.generation).then((ok) => {
                                if (ok) ctx.update();
                            });
                        },
                        { confirmText: text(L.rotationBackupRestore) },
                    ).open();
                });
            });
        },
    };
}

/** Copy the live sessions into generation 1, shifting the older two down. */
function createBackup(ctx: SettingsContext, button: { setDisabled(disabled: boolean): unknown }): void {
    const plugin = ctx.plugin;
    const sessionData = plugin.extractSessionData(plugin.data);
    sessionData._wppSavedAt = Date.now();

    // Disabled for the write, or a second click would shift the generations
    // again and push the one just taken out of the window.
    button.setDisabled(true);
    void createRotationBackupNow(plugin, plugin.prepareRotationBackupData(sessionData))
        .then(() => { ctx.update(); })
        .catch(() => {
            button.setDisabled(false);
            ctx.update();
        });
}

function createGroup(ctx: SettingsContext): SettingDefinitionItem {
    return {
        type: 'group',
        items: [{
            name: text(L.rotationBackupCreate),
            desc: text(L.rotationBackupDesc),
            render: (setting: Setting) => {
                setting.addButton((button) => {
                    button.setButtonText(text(L.rotationBackupCreateBtn));
                    button.setCta();
                    button.onClick(() => { createBackup(ctx, button); });
                });
            },
        }],
    };
}

function generationsGroup(
    ctx: SettingsContext,
    backups: readonly RotationBackupInfo[] | null
): SettingDefinitionItem {
    const rows = (backups ?? []).map((backup) => backupRow(ctx, backup));
    return {
        type: 'group',
        // A row rather than a list's `emptyState`, so the section is never a
        // heading with nothing under it - which is what it looked like while
        // the read was still in flight.
        items: rows.length > 0
            ? rows
            : [{ name: text(L.rotationBackupNone), searchable: false }],
    };
}

export function backupPage(
    ctx: SettingsContext,
    backups: readonly RotationBackupInfo[] | null
): SettingDefinitionPage {
    const newest = backups?.[0];

    return {
        type: 'page',
        name: text(L.rotationBackupSectionTitle),
        desc: text(L.rotationBackupDesc),
        // When the newest backup was taken. The one summary worth keeping on a
        // door: it answers "am I covered?" without opening it. Three
        // generations is the fixed maximum, so a count would say nothing.
        displayValue: () => (newest ? formatRelativeTime(newest.savedAt) : ''),
        items: [createGroup(ctx), generationsGroup(ctx, backups)],
    };
}
