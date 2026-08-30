import test from 'node:test';
import assert from 'node:assert/strict';
import { installObsidianStub, setupHarness } from './lock/harness/index.ts';

installObsidianStub();

import { SyncWatcher } from '../src/storage/sync-watcher.ts';
import {
    cloneJson,
    getSessionModified,
    mergeOrder,
    mergeObjectWithLocalDeletes,
    isSessionStorageInfoNewer,
    mergeExternalSessionDataForWrite,
} from '../src/storage/session-sync.ts';

test('SyncWatcher: schedule reload, debounce and cleanup', async () => {
    const harness = setupHarness();
    try {
        let reloads = 0;
        const watcher = new SyncWatcher({
            onReload: () => {
                reloads++;
            },
        });

        watcher.scheduleReload(50);
        watcher.scheduleReload(50); // Debounced
        assert.equal(watcher.hasActiveTimers(), true);

        await new Promise((r) => setTimeout(r, 80));
        assert.equal(reloads, 1);
        assert.equal(watcher.hasActiveTimers(), false);

        watcher.scheduleStartupChecks();
        assert.equal(watcher.hasActiveTimers(), true);
        watcher.clearTimers();
        assert.equal(watcher.hasActiveTimers(), false);
    } finally {
        harness.restore();
    }
});

test('session sync pure helpers: cloneJson, getSessionModified, mergeOrder', () => {
    assert.equal(cloneJson(undefined), undefined);
    assert.deepEqual(cloneJson({ a: 1 }), { a: 1 });

    assert.equal(getSessionModified(null), 0);
    assert.equal(getSessionModified({ modified: 12345 }), 12345);
    assert.equal(getSessionModified({ modified: 'bad' }), 0);

    const order = mergeOrder(['a', 'b'], ['b', 'c'], { a: {}, b: {}, c: {}, d: {} });
    assert.deepEqual(order, ['a', 'b', 'c', 'd']);
});

test('session sync pure helpers: mergeObjectWithLocalDeletes and mergeExternalSessionDataForWrite', () => {
    const externalObj = { a: { name: 'A' }, b: { name: 'B' } };
    const localObj = { b: { name: 'B-local' } };
    const baselineObj = { a: { name: 'A' }, b: { name: 'B' } };

    // 'a' was in baseline but deleted locally, so it is skipped
    const merged = mergeObjectWithLocalDeletes(externalObj, localObj, baselineObj);
    assert.deepEqual(merged, {
        b: { name: 'B-local' },
    });

    const localData = {
        activeSessionId: 'local',
        sessions: { local: { id: 'local', modified: 200 } },
        sessionOrder: ['local'],
        groups: {},
        groupOrder: [],
        sessionGroups: {},
    };
    const externalData = {
        activeSessionId: 'ext',
        sessions: { ext: { id: 'ext', modified: 100 } },
        sessionOrder: ['ext'],
        groups: {},
        groupOrder: [],
        sessionGroups: {},
    };

    const writeMerge = mergeExternalSessionDataForWrite(
        localData,
        externalData,
        {},
        (d) => d as Record<string, unknown>
    );

    assert.ok('local' in (writeMerge.sessions as Record<string, unknown>));
    assert.ok('ext' in (writeMerge.sessions as Record<string, unknown>));
});

test('session sync pure helpers: isSessionStorageInfoNewer stamp and mtime checks', () => {
    assert.equal(isSessionStorageInfoNewer(null, 100, 100), false);
    assert.equal(isSessionStorageInfoNewer({ valid: false }, 100, 100), false);

    // Newer stamp
    assert.equal(isSessionStorageInfoNewer({ valid: true, stamp: 200 }, 100, 100), true);
    // Older stamp
    assert.equal(isSessionStorageInfoNewer({ valid: true, stamp: 50 }, 100, 100), false);
    // Equal stamp, newer mtime (> epsilon)
    assert.equal(isSessionStorageInfoNewer({ valid: true, stamp: 100, mtime: 150 }, 100, 100), true);
    // Equal stamp, within epsilon
    assert.equal(isSessionStorageInfoNewer({ valid: true, stamp: 100, mtime: 110 }, 100, 100), false);
});
