import { L } from '../i18n.ts';

export function formatRelativeTime(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return String(L.modifiedJustNow || '');
    if (minutes < 60) return (L.modifiedMinutes as (m: number) => string)(minutes);
    if (hours < 24) return (L.modifiedHours as (h: number) => string)(hours);
    return (L.modifiedDays as (d: number) => string)(days);
}
