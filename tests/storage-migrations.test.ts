import test from 'node:test';
import assert from 'node:assert/strict';
import { JsonFileStore, type StorageAdapter } from '../src/storage/json-file-store.ts';
import {
    migrateLegacyLocalSettings,
    migrateLegacySessions,
} from '../src/storage/migrations.ts';
import {
    splitSessionHistory,
    mergeSessionHistory,
    hasInlineSessionHistory,
    pickSessionPayload,
    pickKeys,
    hasSessionShape,
    hasNonEmptySessions,
    getPersistStamp,
} from '../src/storage/session-data.ts';

class MemoryStorageAdapter implements StorageAdapter {
    public files: Map<string, string> = new Map();
    public dirs: Set<string> = new Set();

    async exists(path: string): Promise<boolean> {
        return this.files.has(path) || this.dirs.has(path);
    }
    async read(path: string): Promise<string> {
        const c = this.files.get(path);
        if (c === undefined) throw new Error(`Not found: ${path}`);
        return c;
    }
    async write(path: string, data: string): Promise<void> {
        this.files.set(path, data);
    }
    async remove(path: string): Promise<void> {
        this.files.delete(path);
    }
    async rename(from: string, to: string): Promise<void> {
        const c = this.files.get(from);
        if (c !== undefined) {
            this.files.set(to, c);
            this.files.delete(from);
        }
    }
    async mkdir(path: string): Promise<void> {
        this.dirs.add(path);
    }
    async stat(): Promise<{ mtime: number } | null> {
        return { mtime: Date.now() };
    }
}

test('session-data pure helpers: split and merge history cleanly', () => {
    const sessionData = {
        sessions: {
            s1: {
                id: 's1',
                name: 'Session 1',
                layout: {},
                history: [{ timestamp: 100, layout: {} }],
            },
            s2: {
                id: 's2',
                name: 'Session 2',
                layout: {},
            },
        },
    };

    assert.equal(hasInlineSessionHistory(sessionData), true);

    const split = splitSessionHistory(sessionData);
    assert.deepEqual(split.history, {
        s1: [{ timestamp: 100, layout: {} }],
    });
    const strippedSessions = split.data.sessions as Record<string, Record<string, unknown>>;
    assert.equal(strippedSessions.s1?.history, undefined);

    const merged = mergeSessionHistory(split.data, split.history) as { sessions: Record<string, { history?: unknown[] }> };
    assert.deepEqual(merged.sessions.s1?.history, [{ timestamp: 100, layout: {} }]);
});

test('session-data pure helpers: shape and stamp validation', () => {
    assert.equal(hasSessionShape({ sessions: {} }), true);
    assert.equal(hasSessionShape({ language: 'en' }), false);
    assert.equal(hasNonEmptySessions({ sessions: { a: {} } }), true);
    assert.equal(hasNonEmptySessions({ sessions: {} }), false);

    assert.equal(getPersistStamp({ _wppSavedAt: 12345 }), 12345);
    assert.equal(getPersistStamp(null), 0);
    assert.equal(getPersistStamp({}), 0);

    const payload = pickSessionPayload({ activeSessionId: 's1', extra: true, _wppSavedAt: 100 });
    assert.equal(payload.activeSessionId, 's1');
    assert.equal(payload.extra, undefined);
    assert.equal(payload._wppSavedAt, 100);

    const keys = pickKeys({ a: 1, b: 2, c: 3 }, ['a', 'c']);
    assert.deepEqual(keys, { a: 1, c: 3 });
});

test('storage migrations: migrateLegacyLocalSettings reads, merges and backs up old file', async () => {
    const adapter = new MemoryStorageAdapter();
    const store = new JsonFileStore(adapter);

    adapter.files.set('.workspace-plus-plus/settings.local.json', JSON.stringify({
        language: 'ja',
        autoSaveOnSwitch: false,
    }));

    let persisted: Record<string, unknown> | null = null;
    const ok = await migrateLegacyLocalSettings(
        store,
        { language: 'en' },
        async (merged) => {
            persisted = merged;
        },
        { language: 'auto', autoSaveOnSwitch: true }
    );

    assert.equal(ok, true);
    const p = persisted as Record<string, unknown> | null;
    assert.equal(p?.language, 'ja');
    assert.equal(p?.autoSaveOnSwitch, false);
    assert.equal(adapter.files.has('.workspace-plus-plus/settings.local.json'), false);
    assert.equal(adapter.files.has('.workspace-plus-plus/settings.local.json.migrated'), true);
});

test('storage migrations: migrateLegacySessions normalizes and writes store', async () => {
    const adapter = new MemoryStorageAdapter();
    const store = new JsonFileStore(adapter);

    let writtenData: unknown = null;
    const ok = await migrateLegacySessions(
        store,
        '.workspace-plus-plus',
        async (normalized) => {
            writtenData = normalized;
        },
        { sessions: { s1: {} } },
        (raw) => {
            const rec = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {};
            return { ...rec, normalized: true };
        }
    );

    assert.equal(ok, true);
    assert.deepEqual(writtenData, { sessions: { s1: {} }, normalized: true });
});
