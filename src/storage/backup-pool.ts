/**
 * Which rotating backups to keep, and which to delete.
 *
 * The old scheme was three fixed slots shifted by copying, on the hour. That
 * gives three hours of cover: generation 3 is at best two rotations old, so
 * "put it back the way it was last Tuesday" had no answer. It also had no
 * natural fourth slot, so "keep more" was not a question it could be asked.
 *
 * A pool of files answers both. Each backup is its own file, named for the
 * moment it was taken, and the set to keep is computed from a ladder of target
 * ages taken in priority order. One number - how many generations - decides how
 * deep the ladder goes, and the schedule follows from it rather than being
 * invented per slot.
 *
 * Nothing here does I/O. It takes what is on disk and says what should be.
 */

const HOUR = 3600000;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;

/**
 * The ages worth having a backup of, coarsest-first.
 *
 * The order is the priority, so `generations` slices from the top. Coarse
 * first, because at three generations "now, yesterday, last week" is more use
 * than "now, an hour ago, two hours ago" - the fine grain is what the version
 * history already provides per session. Raising the count fills the gaps
 * *and* reaches further back, alternating, rather than doing only one.
 */
export const BACKUP_TARGET_AGES: readonly number[] = [
    0,            // the newest, always
    DAY,
    WEEK,
    6 * HOUR,
    3 * DAY,
    2 * HOUR,
    2 * WEEK,
    MONTH,
    12 * HOUR,
    5 * DAY,
    3 * WEEK,
    3 * MONTH,
];

export const DEFAULT_BACKUP_GENERATIONS = 5;

/** What the setting offers. Bounded by the ladder above. */
export const BACKUP_GENERATION_CHOICES: readonly number[] = [3, 5, 8, 12];

/**
 * How much the whole pool may take.
 *
 * A backup is one session store without its version history, so this is
 * generous for any plausible vault; it exists so that a pathological one -
 * hundreds of sessions, each with a large layout - cannot fill a vault
 * unnoticed. Fixed rather than a setting: a number nobody can calibrate is
 * not worth a row on the settings screen.
 */
export const BACKUP_TOTAL_BUDGET_BYTES = 20 * 1024 * 1024;

/** A single backup this large is refused rather than written. */
export const BACKUP_FILE_LIMIT_BYTES = 5 * 1024 * 1024;

export interface BackupPoolEntry {
    readonly path: string;
    readonly savedAt: number;
    /** Asked for by the user rather than taken on a timer. */
    readonly manual: boolean;
    /** Bytes on disk, when they could be read. */
    readonly size?: number | undefined;
}

export interface BackupSelection<T extends BackupPoolEntry> {
    readonly keep: readonly T[];
    readonly drop: readonly T[];
}

function byNewestFirst<T extends BackupPoolEntry>(a: T, b: T): number {
    return b.savedAt - a.savedAt;
}

/**
 * Assign each target age the surviving backup closest to it, then drop the rest.
 *
 * An entry serves one target, so the result is a spread rather than a cluster:
 * with more files than targets, the ones that go are those no target wants,
 * which are the ones nearest a neighbour that is already kept.
 *
 * Two entries are never dropped - the newest, which is target zero, and the
 * newest the user asked for by hand. A backup taken deliberately, minutes
 * before, should not vanish because the ladder had no slot at that age.
 */
export function selectBackupsToKeep<T extends BackupPoolEntry>(
    entries: readonly T[],
    generations: number,
    now: number
): BackupSelection<T> {
    const sorted = entries.slice().sort(byNewestFirst);
    if (sorted.length === 0) return { keep: [], drop: [] };

    const limit = Math.max(1, generations);
    const targets = BACKUP_TARGET_AGES.slice(0, limit);
    const remaining = new Set(sorted);
    const kept: T[] = [];

    const claim = (entry: T | undefined): void => {
        if (!entry || !remaining.has(entry)) return;
        if (kept.length >= limit) return;
        remaining.delete(entry);
        kept.push(entry);
    };

    // The newest and the newest one taken by hand are kept first, and they
    // spend two of the slots rather than sitting outside them. Counting them
    // separately is what made a pool of five hold six files: the newest is
    // target zero, so claiming it before the loop had the ladder fill five
    // more places on top of it.
    claim(sorted[0]);
    claim(sorted.find((entry) => entry.manual));

    // The cap lives in `claim`, which every path goes through; this is only an
    // early exit once the slots are spent.
    for (const target of targets) {
        if (kept.length >= limit || remaining.size === 0) break;
        let best: T | undefined;
        let bestDistance = Infinity;
        for (const entry of remaining) {
            const distance = Math.abs((now - entry.savedAt) - target);
            if (distance < bestDistance) {
                bestDistance = distance;
                best = entry;
            }
        }
        claim(best);
    }

    // Exactly `generations` files survive, unless there were fewer to begin
    // with. The number on the settings screen is a number of backups.
    return {
        keep: kept.sort(byNewestFirst),
        drop: [...remaining].sort(byNewestFirst),
    };
}

/**
 * Bring a kept set under the byte budget by giving up its least useful entries.
 *
 * "Least useful" is the reverse of the order `selectBackupsToKeep` produced,
 * which is newest-first - so the oldest goes first. The newest and the newest
 * manual entry are never given up: a budget that deletes the backup taken
 * thirty seconds ago has failed at the one thing a backup is for.
 */
export function enforceBackupBudget<T extends BackupPoolEntry>(
    keep: readonly T[],
    budget: number = BACKUP_TOTAL_BUDGET_BYTES
): BackupSelection<T> {
    const total = (entries: readonly T[]): number =>
        entries.reduce((sum, entry) => sum + (entry.size ?? 0), 0);

    if (total(keep) <= budget) return { keep, drop: [] };

    const sorted = keep.slice().sort(byNewestFirst);
    const newestManual = sorted.find((entry) => entry.manual);
    const protectedEntries = new Set([sorted[0], newestManual].filter(Boolean));

    const survivors = sorted.slice();
    const dropped: T[] = [];

    // From the oldest end inwards.
    for (let i = survivors.length - 1; i >= 0 && total(survivors) > budget; i -= 1) {
        const entry = survivors[i];
        if (!entry || protectedEntries.has(entry)) continue;
        survivors.splice(i, 1);
        dropped.push(entry);
    }

    return { keep: survivors, drop: dropped.sort(byNewestFirst) };
}

const POOL_FILE_PATTERN = /^sessions\.(\d+)\.json$/;

/** The file name a backup taken at `savedAt` gets. */
export function backupFileName(savedAt: number): string {
    return `sessions.${savedAt}.json`;
}

/** The generation numbers the pre-pool scheme used, newest first. */
export const LEGACY_BACKUP_GENERATIONS: readonly number[] = [1, 2, 3];

/**
 * The moment a pool file was taken, from its name, or null if it is not one.
 *
 * `sessions.1.json` to `sessions.3.json` are the pre-pool files and are
 * excluded by value rather than by how many digits they have: no timestamp is
 * ever 1, 2 or 3, and a digit-count rule would quietly reject any name a test
 * or a future scheme chose that happened to be shorter.
 */
export function backupSavedAtFromPath(path: string): number | null {
    const name = path.slice(path.lastIndexOf('/') + 1);
    const match = POOL_FILE_PATTERN.exec(name);
    if (!match?.[1]) return null;
    const parsed = Number(match[1]);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return LEGACY_BACKUP_GENERATIONS.includes(parsed) ? null : parsed;
}
