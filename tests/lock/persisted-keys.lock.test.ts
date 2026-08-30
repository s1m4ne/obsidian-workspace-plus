// Behavior Lock: which keys reach disk.
//
// The round-trip lock next door proves that what is written comes back byte for
// byte. It does not prove that the right things are written: dropping
// 'sessionGroups' from SESSION_KEYS passes all of it, and every other test in
// the repository, while silently ending group membership for anyone using
// groups. That is data loss, not a regression in formatting.
//
// So this locks the set itself, from two directions - the declared list, and
// the keys that actually appear in a written payload.
//
// RULE: Behavior Lock tests are NEVER edited during the refactor. If this fails,
// the shape of what is persisted changed. That needs a migration and the
// maintainer's decision, never a test edit.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './harness/index.ts';

// The on-disk contract. Order is part of it: pickSessionPayload copies in this
// order, so the JSON key order - which the round-trip lock compares byte for
// byte - follows from it.
const SESSION_KEYS = [
    'activeSessionId',
    'sessions',
    'sessionOrder',
    'groups',
    'groupOrder',
    'sessionGroups',
    'activeGroupId',
] as const;

// Settings live in data.json and are deliberately not part of the session
// payload; a key moving between the two changes which file it syncs with.
const SETTINGS_KEYS_NOT_PERSISTED_WITH_SESSIONS = [
    'language',
    'autoSaveOnSwitch',
    'sessionStorageLocation',
    'statusBarActions',
] as const;

interface SessionDataModule {
    SESSION_KEYS: string[];
    pickSessionPayload(data: Record<string, unknown>): Record<string, unknown>;
    splitSessionHistory(data: Record<string, unknown>): unknown;
    hasSessionShape(data: unknown): boolean;
}

function sampleData(): Record<string, unknown> {
    return {
        activeSessionId: 'a',
        sessions: { a: { id: 'a', name: 'A', layout: { root: {} }, modified: 1 } },
        sessionOrder: ['a'],
        groups: { g1: { id: 'g1', name: 'Group' } },
        groupOrder: ['__all__', 'g1'],
        sessionGroups: { a: ['g1'] },
        activeGroupId: null,
        language: 'en',
        autoSaveOnSwitch: true,
        sessionStorageLocation: 'plugin-folder',
        statusBarActions: { click: 'quickSwitcher' },
        _wppSavedAt: 1234,
    };
}

async function loadSessionData(): Promise<SessionDataModule> {
    // A CommonJS module reached through import() arrives on `default`; the
    // named-export view TypeScript infers from its JSDoc does not match the
    // narrow shape this lock needs.
    const loaded: unknown = await import('../../src/plugin/session-data.js');
    const mod = (loaded as { default?: unknown }).default ?? loaded;
    return mod as SessionDataModule;
}

test('SESSION_KEYS is exactly the set that reaches the sessions file, in order', async () => {
    const harness = setupHarness();
    try {
        const sessionData = await loadSessionData();
        assert.deepEqual(sessionData.SESSION_KEYS, [...SESSION_KEYS]);
    } finally {
        harness.restore();
    }
});

test('a written payload carries every session key and no settings key', async () => {
    const harness = setupHarness();
    try {
        const sessionData = await loadSessionData();
        const payload = sessionData.pickSessionPayload(sampleData());
        const keys = Object.keys(payload);

        // The save stamp rides along; external-change detection compares it.
        assert.deepEqual(keys, [...SESSION_KEYS, '_wppSavedAt']);

        for (const key of SESSION_KEYS) {
            assert.ok(key in payload, `${key} is missing from the persisted payload`);
        }
        for (const key of SETTINGS_KEYS_NOT_PERSISTED_WITH_SESSIONS) {
            assert.ok(!(key in payload), `${key} must not be persisted with sessions`);
        }
    } finally {
        harness.restore();
    }
});

test('group membership survives a payload round trip', async () => {
    const harness = setupHarness();
    try {
        const sessionData = await loadSessionData();
        const payload = sessionData.pickSessionPayload(sampleData());
        const revived: unknown = JSON.parse(JSON.stringify(payload));
        if (typeof revived !== 'object' || revived === null) throw new Error('payload did not survive JSON');
        const record = revived as Record<string, unknown>;

        // The specific loss the round-trip lock could not see.
        assert.deepEqual(record.sessionGroups, { a: ['g1'] });
        assert.deepEqual(record.groups, { g1: { id: 'g1', name: 'Group' } });
        assert.deepEqual(record.groupOrder, ['__all__', 'g1']);
    } finally {
        harness.restore();
    }
});

test('a payload missing a session key is not mistaken for session data', async () => {
    const harness = setupHarness();
    try {
        const sessionData = await loadSessionData();

        assert.equal(sessionData.hasSessionShape(sampleData()), true);
        assert.equal(sessionData.hasSessionShape({ language: 'en' }), false);
        assert.equal(sessionData.hasSessionShape(null), false);
    } finally {
        harness.restore();
    }
});
