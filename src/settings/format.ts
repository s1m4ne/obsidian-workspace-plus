/**
 * The two readings the settings screen shows as text.
 *
 * One home rather than two: both the backup page and the data page print a
 * timestamp, and they had the same fallback written twice.
 */

/** A timestamp the user can read, falling back to the raw number rather than blank. */
export function absoluteTime(savedAt: number): string {
    try {
        return new Date(savedAt).toLocaleString();
    } catch {
        return String(savedAt);
    }
}

export function formatByteSize(bytes: number | null): string {
    if (typeof bytes !== 'number' || !isFinite(bytes) || bytes < 0) return '—';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
}
