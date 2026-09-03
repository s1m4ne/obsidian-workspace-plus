import { L } from '../i18n.ts';

/**
 * How long ago `timestamp` was, in words.
 *
 * `now` is the instant to measure from, and it exists so that several times
 * rendered together are measured from one moment. Reading the clock per call
 * let one screen disagree with itself: the settings' backup entry and the rows
 * inside it are built a few statements apart, which is enough to straddle a
 * minute boundary and print "3 minutes ago" above "2 minutes ago".
 */
export function formatRelativeTime(timestamp: number, now: number = Date.now()): string {
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return String(L.modifiedJustNow || '');
    if (minutes < 60) return (L.modifiedMinutes as (m: number) => string)(minutes);
    if (hours < 24) return (L.modifiedHours as (h: number) => string)(hours);
    return (L.modifiedDays as (d: number) => string)(days);
}
