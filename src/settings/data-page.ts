import { Notice } from 'obsidian';
import type { SettingDefinitionItem, SettingDefinitionPage, SettingGroupItem } from 'obsidian';
import { L, formatString, text } from '../i18n.ts';
import { ConfirmModal } from '../modals/confirm-modal.ts';
import type { SettingsContext } from '../settings-tab.ts';
import { dangerRow } from './danger-row.ts';
import { absoluteTime, formatByteSize } from './format.ts';

/**
 * Where the sessions live, moving them in and out, wiping them, and what the
 * plugin can say about its own files.
 *
 * All of it behind one door. Nothing here is set twice, three of the rows
 * cannot be undone, and the diagnostics are a read-out rather than a setting.
 */

function storageGroup(ctx: SettingsContext): SettingDefinitionItem {
    return {
        type: 'group',
        heading: text(L.settingsAdvancedStorageSubsection),
        items: [
            {
                // A read-out, not a setting: the toggle below is what moves it.
                name: text(L.settingsSessionStorageLocation),
                desc: formatString(L.settingsSessionStorageLocationDesc, ctx.plugin.getSessionsPath()),
            },
            {
                name: text(L.settingsVaultOnlySessions),
                desc: text(L.settingsVaultOnlySessionsDesc),
                control: { type: 'toggle', key: 'vaultOnlySessions' },
            },
        ],
    };
}

function transferGroup(ctx: SettingsContext): SettingDefinitionItem {
    return {
        type: 'group',
        heading: text(L.settingsAdvancedTransferSubsection),
        items: [
            {
                name: text(L.settingsExportSessions),
                desc: text(L.settingsExportSessionsDesc),
                action: () => {
                    void ctx.plugin.exportSessionsSnapshot().catch(() => {
                        new Notice(text(L.exportSessionsFailed));
                    });
                },
            },
            {
                name: text(L.settingsImportSessions),
                desc: text(L.settingsImportSessionsDesc),
                action: () => {
                    // Import replaces every session, so it asks first even
                    // though it is not one of the resets.
                    new ConfirmModal(ctx.app, text(L.confirmImportSessions), () => {
                        void ctx.plugin.importSessionsFromLatestExport()
                            .then(() => { ctx.update(); })
                            .catch(() => { new Notice(text(L.importSessionsFailed)); });
                    }, { confirmText: text(L.settingsImportSessionsBtn) }).open();
                },
            },
        ],
    };
}

function resetGroup(ctx: SettingsContext): SettingDefinitionItem {
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

/**
 * The diagnostics, as rows.
 *
 * They were a hand-built card with its own six CSS rules. Every line of it was
 * a label and a value, which is what a setting row is, so the card is gone and
 * the rows carry the same six readings.
 *
 * `storageSize` is undefined while the read is in flight.
 */
function diagnosticsGroup(
    ctx: SettingsContext,
    storageSize: number | null | undefined
): SettingDefinitionItem {
    const info = ctx.plugin.getStorageDiagnosticsInfo();
    const rows: SettingGroupItem[] = [
        { name: text(L.settingsStorageFieldSessions), desc: info.sessionsPath, searchable: false },
        { name: text(L.settingsStorageFieldSessionsBackup), desc: info.sessionsBackupPath, searchable: false },
        { name: text(L.settingsStorageFieldHistory), desc: info.historyPath, searchable: false },
        { name: text(L.settingsStorageFieldSessionCount), desc: String(info.sessionCount), searchable: false },
        {
            name: text(L.settingsStorageFieldDataSize),
            desc: storageSize === undefined ? '…' : formatByteSize(storageSize),
            searchable: false,
        },
        {
            name: text(L.settingsStorageFieldUpdatedAt),
            desc: absoluteTime(info.updatedAt),
            searchable: false,
        },
    ];

    if (info.syncedByObsidianSync) {
        rows.push({ name: '', desc: text(L.settingsStorageSyncHint), searchable: false });
    }

    return {
        type: 'group',
        heading: text(L.settingsDeveloperSection),
        items: rows,
    };
}

export function dataPage(
    ctx: SettingsContext,
    storageSize: number | null | undefined
): SettingDefinitionPage {
    return {
        type: 'page',
        name: text(L.settingsSectionAdvanced),
        desc: text(L.settingsStorageDiagnosticsDesc),
        items: [
            storageGroup(ctx),
            transferGroup(ctx),
            resetGroup(ctx),
            diagnosticsGroup(ctx, storageSize),
        ],
    };
}
