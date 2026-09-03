import { Notice } from 'obsidian';
import { L, text } from './i18n.ts';
import {
    createRotationBackupNow,
    type ManualRotationBackupHost,
    type ManualRotationBackupResult,
} from './storage/storage-backup.ts';

/**
 * "Back up now", from either place that offers it.
 *
 * The settings page and the settings context menu both do this, and they had a
 * copy each - one of which said nothing at all on success. What the press means
 * is one decision, so it lives here: stamp the live sessions, hand them to the
 * rotation, and say which of the three things happened.
 */
export interface ManualBackupHost extends ManualRotationBackupHost {
    data: unknown;
    extractSessionData(data: unknown): Record<string, unknown>;
    prepareRotationBackupData(sessionData: Record<string, unknown>): Record<string, unknown>;
}

export async function createManualBackup(host: ManualBackupHost): Promise<ManualRotationBackupResult | 'failed'> {
    const sessionData = host.extractSessionData(host.data);
    sessionData._wppSavedAt = Date.now();

    try {
        const result = await createRotationBackupNow(host, host.prepareRotationBackupData(sessionData));
        // `noChanges` rather than a message of its own: there is nothing
        // specific to backups about it, and the alternative would be a 22nd
        // string in 21 locales saying what this one already says.
        new Notice(text(result === 'unchanged' ? L.noChanges : L.rotationBackupCreated));
        return result;
    } catch {
        new Notice(text(L.rotationBackupFailed));
        return 'failed';
    }
}
