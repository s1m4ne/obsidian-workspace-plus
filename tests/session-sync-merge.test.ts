// Two devices writing one sessions file through a file sync (#124).
//
// iCloud and its kind move whole files, seconds to a minute late. A device that
// saves before the other's file arrives writes a file without the other's
// change, and that file then reaches the other device. Merging it used to mean
// "take theirs": a session created on a phone vanished from the phone as well,
// because the desktop's file did not have it. These pin what a merge keeps.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeExternalSessionDataForWrite } from '../src/storage/session-sync.ts';
import type { SessionItem } from '../src/storage/default-data.ts';

const identity = (d: unknown): Record<string, unknown> => d as Record<string, unknown>;

function payload(sessions: Record<string, Partial<SessionItem>>, extra: Record<string, unknown> = {}): Record<string, unknown> {
    return { sessions, sessionOrder: Object.keys(sessions), ...extra };
}

function merge(local: Record<string, unknown>, external: Record<string, unknown>, baseline: Record<string, unknown>): Record<string, SessionItem> {
    return mergeExternalSessionDataForWrite(local, external, baseline, identity).sessions as Record<string, SessionItem>;
}

const a = { id: 'a', name: 'A', layout: { pane: 'a' }, modified: 100 };

test('a file written before this device\'s new session arrived does not delete it', () => {
    const created = { id: 'hello', name: 'hello', layout: null, mobileLayout: { pane: 'phone' }, modified: 200 };
    // This device wrote both sessions; the other device's file was written
    // without having seen the new one.
    const mine = payload({ a, hello: created });

    const merged = merge(mine, payload({ a }), mine);

    assert.ok(merged['hello'], 'absent from their file is not deleted');
});

test('a deletion the other device recorded removes the session here', () => {
    const merged = merge(
        payload({ a, b: { id: 'b', name: 'B', layout: null, modified: 100 } }),
        payload({ a }, { deletedSessions: { b: 150 } }),
        payload({ a, b: { id: 'b', name: 'B', layout: null, modified: 100 } }),
    );

    assert.equal(merged['b'], undefined);
});

test('a session changed after it was deleted elsewhere is kept', () => {
    const merged = merge(
        payload({ a, b: { id: 'b', name: 'B renamed', layout: null, modified: 300 } }),
        payload({ a }, { deletedSessions: { b: 150 } }),
        payload({ a }),
    );

    assert.equal(merged['b']?.name, 'B renamed');
});

test('each kind of layout is taken from whichever device saved it last', () => {
    // The desktop saved its layout after the phone saved its own, so the
    // session's `modified` favours the desktop's copy - which carries an old
    // phone layout. The save times keep the phone's.
    const phoneCopy = { id: 'a', name: 'A', modified: 200,
        layout: { pane: 'desk-old' }, layoutSavedAt: 50,
        mobileLayout: { pane: 'phone-new' }, mobileLayoutSavedAt: 200 };
    const deskCopy = { id: 'a', name: 'A', modified: 300,
        layout: { pane: 'desk-new' }, layoutSavedAt: 300,
        mobileLayout: { pane: 'phone-old' }, mobileLayoutSavedAt: 40 };

    const merged = merge(payload({ a: phoneCopy }), payload({ a: deskCopy }), payload({ a: phoneCopy }));

    assert.deepEqual(merged['a']?.layout, { pane: 'desk-new' });
    assert.deepEqual(merged['a']?.mobileLayout, { pane: 'phone-new' });
    assert.equal(merged['a']?.modified, 300);
});

test('a rename here survives a newer layout save there', () => {
    const base = { id: 'a', name: 'A', layout: { pane: 'a' }, modified: 100 };
    const merged = merge(
        payload({ a: { ...base, name: 'Renamed', modified: 150 } }),
        payload({ a: { ...base, layout: { pane: 'moved' }, layoutSavedAt: 200, modified: 200 } }),
        payload({ a: base }),
    );

    assert.equal(merged['a']?.name, 'Renamed');
    assert.deepEqual(merged['a']?.layout, { pane: 'moved' });
});

test('this device\'s version history stays with the session', () => {
    const history = [{ savedAt: 1, layout: { pane: 'earlier' } }];
    const merged = merge(
        payload({ a: { ...a, history } }),
        payload({ a: { ...a, modified: 500 } }),
        payload({ a }),
    );

    assert.deepEqual(merged['a']?.history, history);
});
