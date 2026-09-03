import { Notice } from 'obsidian';
import { L, text } from './i18n.ts';
import { prepareRotationBackupData } from './storage/storage-backup.ts';
import { writeRotationBackup, type BackupStoreHost, type WriteBackupResult } from './storage/backup-store.ts';

/**
 * "Back up now", from either place that offers it.
 *
 * The settings page and the settings context menu both do this, and they had a
 * copy each - one of which said nothing at all on success. What the press means
 * is one decision, so it lives here: stamp the live sessions, hand them to the
 * pool, and say which of the four things happened.
 */
export interface ManualBackupHost extends BackupStoreHost {
    data: unknown;
    extractSessionData(data: unknown): Record<string, unknown>;
    prepareRotationBackupData?(sessionData: Record<string, unknown>): Record<string, unknown>;
}

export type ManualBackupResult = WriteBackupResult | 'failed';

export async function createManualBackup(host: ManualBackupHost): Promise<ManualBackupResult> {
    const sessionData = host.extractSessionData(host.data);
    sessionData._wppSavedAt = Date.now();
    const payload = host.prepareRotationBackupData
        ? host.prepareRotationBackupData(sessionData)
        : prepareRotationBackupData(sessionData);

    try {
        // `manual: true` marks the file, and the ladder never deletes the
        // newest one so marked: a backup asked for by hand should not vanish
        // because no target age happened to sit near the moment it was taken.
        const result = await writeRotationBackup(host, payload, { manual: true });
        if (result === 'created') {
            new Notice(text(L.rotationBackupCreated));
        } else if (result === 'unchanged') {
            // `noChanges` rather than a message of its own: there is nothing
            // specific to backups about it, and the alternative would be
            // another string in 21 locales saying what this one already says.
            new Notice(text(L.noChanges));
        } else {
            // Too large to be worth writing. Nothing distinguishes this from a
            // failure to the user - both mean no backup was taken - and saying
            // so needs no new string.
            new Notice(text(L.rotationBackupFailed));
        }
        return result;
    } catch {
        new Notice(text(L.rotationBackupFailed));
        return 'failed';
    }
}
