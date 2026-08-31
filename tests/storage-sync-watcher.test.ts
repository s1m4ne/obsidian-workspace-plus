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

test('session sync host functions: state recording, info check, and sync watcher lifecycle', async () => {
    const {
        getComparableSessionData,
        getComparableSessionDataJson,
        recordSessionStorageState,
        recordSessionDataStored,
        getSessionStorageInfo,
        hasLocalSessionChangesSinceStorage,
        applySessionDataFromStorage,
        reloadExternalSessionStorageIfChanged,
        getSyncWatcher,
        onExternalSettingsChange,
        clearSessionStorageSyncTimers,
    } = await import('../src/storage/session-sync.ts');

    const normalize = (d: unknown) => (d || {}) as import('../src/storage/storage-backup.ts').SessionDataPayload;

    const comp = getComparableSessionData(normalize, { sessions: { s1: {} } });
    assert.ok(comp.sessions.s1);

    const compJson = getComparableSessionDataJson(normalize, { sessions: { s1: {} } });
    assert.ok(typeof compJson === 'string');

    const stateHost: import('../src/storage/session-sync.ts').SessionStorageStateHost & { data: import('../src/storage/default-data.ts').PluginData } = {
        normalizeSessionData: normalize,
        data: {
            activeSessionId: 's1',
            sessions: { s1: { id: 's1', name: 'S1', layout: {} } },
            sessionOrder: ['s1'],
            groups: {},
            groupOrder: [],
            sessionGroups: {},
            activeGroupId: null,
        } as unknown as import('../src/storage/default-data.ts').PluginData,
    };

    recordSessionStorageState(stateHost, 123, 456, stateHost.data);
    assert.equal(stateHost._sessionStorageStamp, 123);
    assert.equal(stateHost._sessionStorageMtime, 456);
    assert.equal(hasLocalSessionChangesSinceStorage(stateHost), false);

    stateHost.data.sessionOrder = ['s1', 's2'];
    assert.equal(hasLocalSessionChangesSinceStorage(stateHost), true);

    const recordHost: import('../src/storage/session-sync.ts').RecordSessionDataStoredHost = {
        ...stateHost,
        getSessionsPath: () => 'sessions.json',
        getFileMtime: async () => 789,
    };
    const storedOk = await recordSessionDataStored(recordHost, { _wppSavedAt: 999 });
    assert.equal(storedOk, true);
    assert.equal(recordHost._sessionStorageStamp, 999);
    assert.equal(recordHost._sessionStorageMtime, 789);

    const infoHost: import('../src/storage/session-sync.ts').GetSessionStorageInfoHost = {
        getSessionsPath: () => 'sessions.json',
        readJsonIfExists: async () => ({ exists: true, data: { sessions: { s1: {} } }, error: null }),
        getFileMtime: async () => 1000,
    };
    const info = await getSessionStorageInfo(infoHost);
    assert.equal(info.exists, true);
    assert.equal(info.valid, true);

    let changedNotified = false;
    const applyHost: import('../src/storage/session-sync.ts').ApplySessionDataHost = {
        data: {
            activeSessionId: 's1',
            sessions: { s1: { id: 's1', name: 'S1', layout: {} } },
            sessionOrder: ['s1'],
            groups: {},
            groupOrder: [],
            sessionGroups: {},
            activeGroupId: null,
        } as unknown as import('../src/storage/default-data.ts').PluginData,
        normalizeSessionData: normalize,
        extractSessionData: (d) => d as Record<string, unknown>,
        syncSessionOrder: () => {},
        normalizeGroupFeatureState: () => {},
        updateStatusBar: () => {},
        syncSessionCommands: () => {},
        notifySessionsChanged: () => {
            changedNotified = true;
        },
    };

    const applyResult = applySessionDataFromStorage(applyHost, { sessions: { s2: { id: 's2', name: 'S2', layout: {} } } });
    assert.equal(applyResult, true);
    assert.equal(changedNotified, true);

    const reloadHost: import('../src/storage/session-sync.ts').ReloadExternalSessionHost = {
        ...applyHost,
        ...infoHost,
        _sessionStorageStamp: 50,
        _sessionStorageMtime: 50,
        loadSessionDataFromStorage: async () => ({ sessions: { s3: { id: 's3', name: 'S3', layout: {} } } }),
    };
    const reloadResult = await reloadExternalSessionStorageIfChanged(reloadHost, { force: true });
    assert.equal(reloadResult, true);

    const watcherHost: import('../src/storage/session-sync.ts').SyncWatcherHost = {
        reloadExternalSessionStorageIfChanged: async () => true,
        data: applyHost.data,
    };
    const watcher = getSyncWatcher(watcherHost);
    assert.ok(watcher);

    let scheduledReload = false;
    onExternalSettingsChange({
        ...watcherHost,
        scheduleExternalSessionStorageReload: () => {
            scheduledReload = true;
        },
    });
    assert.equal(scheduledReload, true);

    clearSessionStorageSyncTimers(watcherHost);
});
