/**
 * "Change this, and write it to disk unless I say otherwise."
 *
 * The convention is one line - `persist === false` means the caller is batching
 * and will write once itself - and it was written three times, on SessionStore,
 * GroupStore and SettingsState, under three type names for what was in two of
 * the three cases the identical shape. Three names for one closed set is how
 * they drift.
 */
export interface PersistOption {
    /** `false` batches: the caller writes once when it is done. */
    persist?: boolean;
}

export function persistIfNeeded(
    persistData: () => Promise<boolean>,
    options?: PersistOption
): Promise<boolean> {
    if (options?.persist === false) return Promise.resolve(true);
    return persistData();
}
