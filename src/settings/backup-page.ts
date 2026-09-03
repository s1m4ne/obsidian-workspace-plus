import type { SettingDefinitionPage, SettingGroupItem } from 'obsidian';
import { L, formatString, text } from '../i18n.ts';
import { ConfirmModal } from '../modals/confirm-modal.ts';
import { formatRelativeTime } from '../modals/format-relative-time.ts';
import { createRotationBackupNow, type RotationBackupInfo } from '../storage/storage-backup.ts';
import { absoluteTime } from './format.ts';
import type { SettingsContext } from '../settings-tab.ts';

/**
 * The three rotating backups.
 *
 * A `list` rather than a group: the entries are data that comes and goes, and
 * the affordances a list gives - the `+` in the header, the empty state - are
 * exactly the two things this section used to build by hand. Restoring is the
 * row's own action, behind a confirmation, so there is no button to lay out.
 *
 * `backups` is null while the read is in flight; the list shows its empty
 * state until then, which is what the hand-built version did with a
 * placeholder row.
 */

function backupRow(ctx: SettingsContext, backup: RotationBackupInfo): SettingGroupItem {
    const savedAtText = absoluteTime(backup.savedAt);
    const summary = formatString(L.rotationBackupGeneration, backup.sessionCount);
    let desc = savedAtText;
    if (backup.backupPlatform) desc += `  ·  ${backup.backupPlatform}`;

    return {
        name: `${backup.generation}.  ${formatRelativeTime(backup.savedAt)}  ·  ${summary}`,
        desc,
        // Not indexed: the generations change under the user, and a search
        // result naming one that has rotated away would be worse than none.
        searchable: false,
        action: () => {
            new ConfirmModal(
                ctx.app,
                formatString(L.rotationBackupRestoreConfirm, savedAtText, backup.sessionCount),
                // ConfirmModal ignores what this returns, so the restore is
                // deliberately not awaited - the screen is re-read when it lands.
                () => {
                    void ctx.plugin.restoreFromRotationBackup(backup.generation).then((ok) => {
                        if (ok) ctx.update();
                    });
                },
                { confirmText: text(L.rotationBackupRestore) },
            ).open();
        },
    };
}

/** Copy the live sessions into generation 1, shifting the older two down. */
function createBackup(ctx: SettingsContext): void {
    const plugin = ctx.plugin;
    const sessionData = plugin.extractSessionData(plugin.data);
    sessionData._wppSavedAt = Date.now();

    void createRotationBackupNow(plugin, plugin.prepareRotationBackupData(sessionData))
        .then(() => { ctx.update(); })
        .catch(() => { ctx.update(); });
}

export function backupPage(
    ctx: SettingsContext,
    backups: readonly RotationBackupInfo[] | null
): SettingDefinitionPage {
    const rows = (backups ?? []).map((backup) => backupRow(ctx, backup));
    const newest = backups?.[0];

    return {
        type: 'page',
        name: text(L.rotationBackupSectionTitle),
        desc: text(L.rotationBackupDesc),
        // When the newest backup was taken. More use than a count: three
        // generations is the fixed maximum, so the number says nothing.
        displayValue: () => (newest ? formatRelativeTime(newest.savedAt) : ''),
        items: [{
            type: 'list',
            emptyState: text(L.rotationBackupNone),
            addItem: {
                name: text(L.rotationBackupCreateBtn),
                action: () => { createBackup(ctx); },
            },
            items: rows,
        }],
    };
}
