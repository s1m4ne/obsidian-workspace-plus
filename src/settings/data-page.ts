import { Notice } from 'obsidian';
import type { SettingDefinitionItem, SettingDefinitionPage, SettingGroupItem } from 'obsidian';
import { L, text } from '../i18n.ts';
import { ConfirmModal } from '../modals/confirm-modal.ts';
import type { SettingsContext } from '../settings-tab.ts';
import { absoluteTime, formatByteSize } from './format.ts';

/**
 * Where the sessions live, moving them in and out, and what the plugin can say
 * about its own files.
 *
 * One door, one subject: the files. Nothing here is set twice, and the
 * diagnostics are a read-out rather than a setting. The resets used to be here
 * too and are on the surface now - see reset-group.ts.
 */

/**
 * Where the sessions live: the one control that moves them.
 *
 * The path used to be spelled out above the toggle, as a row that read out
 * `getSessionsPath()`. It is on this same page already - the diagnostics group
 * names it, along with the two files beside it - so the row said a second time
 * what one screen only needs to say once.
 */
function storageGroup(): SettingDefinitionItem {
    return {
        type: 'group',
        heading: text(L.settingsAdvancedStorageSubsection),
        items: [{
            name: text(L.settingsVaultOnlySessions),
            desc: text(L.settingsVaultOnlySessionsDesc),
            control: { type: 'toggle', key: 'vaultOnlySessions' },
        }],
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
        name: text(L.settingsSectionStorage),
        desc: text(L.settingsSectionStorageDesc),
        items: [
            storageGroup(),
            transferGroup(ctx),
            diagnosticsGroup(ctx, storageSize),
        ],
    };
}
