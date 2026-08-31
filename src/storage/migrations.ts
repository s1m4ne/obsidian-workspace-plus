import { LEGACY_LOCAL_SETTINGS_FILE, LEGACY_LOCAL_SETTINGS_BACKUP } from './paths.ts';
import { SETTINGS_KEYS } from './default-data.ts';
import { pickKeys } from './session-data.ts';
import type { JsonFileStore } from './json-file-store.ts';

export async function migrateLegacyLocalSettings(
    store: JsonFileStore,
    currentSettings: Record<string, unknown>,
    persistSettings: (merged: Record<string, unknown>) => Promise<void>,
    defaultSettings: Record<string, unknown>
): Promise<boolean> {
    try {
        const res = await store.readJsonIfExists<Record<string, unknown>>(LEGACY_LOCAL_SETTINGS_FILE);
        // An unreadable file is left in place rather than discarded: settings we
        // cannot merge are still the user's settings.
        if (!res.exists || res.error || !res.data || typeof res.data !== 'object') {
            return false;
        }

        const merged = Object.assign(
            {},
            defaultSettings,
            currentSettings,
            pickKeys(res.data, SETTINGS_KEYS)
        );

        await persistSettings(merged);
        await store.renameIfExists(LEGACY_LOCAL_SETTINGS_FILE, LEGACY_LOCAL_SETTINGS_BACKUP);
        return true;
    } catch {
        return false;
    }
}

export async function migrateLegacySessions(
    store: JsonFileStore,
    sessionStorageDir: string,
    writeStore: (normalized: unknown) => Promise<void>,
    sessionData: unknown,
    normalize: (data: unknown) => unknown
): Promise<boolean> {
    try {
        const normalized = normalize(sessionData);
        await store.ensureDir(sessionStorageDir);
        await writeStore(normalized);
        return true;
    } catch {
        return false;
    }
}
