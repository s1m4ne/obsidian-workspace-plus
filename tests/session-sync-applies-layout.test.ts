// A session synced from another device has to reach the screen (issue #117).
//
// Before this, the sync path replaced `data.sessions` and stopped. The
// workspace went on showing the old layout, the status bar named a session
// whose layout was not up, and the next switch captured the stale screen back
// over what had just arrived - auto-save on switch writes the current layout
// before leaving. So a session synced from another device was lost by the next
// thing the user did, with no message.
//
// The import path had the same defect and fixed it in `storage-backup.ts`;
// `storage-import-applies-layout.test.ts` records that. The difference here is
// that import is an explicit "restore this snapshot" while a sync lands on its
// own, so this one has guards and they are what these tests pin.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';
import type { PluginData } from '../src/storage/default-data.ts';
import type {
    ApplySessionDataHost,
    ReloadExternalSessionHost,
} from '../src/storage/session-sync.ts';
import type { SessionDataPayload } from '../src/storage/storage-backup.ts';

const harness = setupHarness();
const { applySessionDataFromStorage, reloadExternalSessionStorageIfChanged } = await import('../src/storage/session-sync.ts');

type Layout = { readonly pane: string };

const SAVED: Layout = { pane: 'saved' };
const MOVED: Layout = { pane: 'moved-since-saving' };
const INCOMING: Layout = { pane: 'from-the-other-device' };

interface Probe {
    host: ApplySessionDataHost;
    applied: unknown[];
}

function createHost(options: {
    layoutOnScreen: Layout;
    savedLayout: Layout;
    isSwitching?: boolean;
}): Probe {
    const applied: unknown[] = [];
    const data = {
        activeSessionId: 's1',
        sessions: { s1: { id: 's1', name: 'S1', layout: options.savedLayout } },
        sessionOrder: ['s1'],
        groups: {},
        groupOrder: [],
        sessionGroups: {},
        activeGroupId: null,
    } as unknown as PluginData;

    const host: ApplySessionDataHost = {
        data,
        normalizeSessionData: (d) => d as SessionDataPayload,
        extractSessionData: (d) => d as Record<string, unknown>,
        syncSessionOrder: () => {},
        normalizeGroupFeatureState: () => {},
        updateStatusBar: () => {},
        syncSessionCommands: () => {},
        notifySessionsChanged: () => {},
        // The real comparison would resolve the restore scope; a structural
        // JSON match is enough for fixtures whose layouts differ by a field.
        getSessionStore: (): never => ({
            getCurrentWorkspaceLayout: () => options.layoutOnScreen,
            layoutsEqualStructural: (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b),
        }) as never,
        getSessionSwitcher: (): never => ({
            isSwitching: !!options.isSwitching,
            applyWorkspaceLayout: async (layout: unknown) => {
                applied.push(layout);
                return true;
            },
        }) as never,
    };
    return { host, applied };
}

/** What another device wrote: the same session, a different layout. */
function incoming(): unknown {
    return {
        activeSessionId: 's1',
        sessions: { s1: { id: 's1', name: 'S1', layout: INCOMING } },
        sessionOrder: ['s1'],
    };
}

test('an incoming layout for the active session reaches the workspace', async () => {
    const { host, applied } = createHost({ layoutOnScreen: SAVED, savedLayout: SAVED });

    assert.equal(await applySessionDataFromStorage(host, incoming(), { applyLayout: true }), true);

    assert.deepEqual(applied, [INCOMING], 'the arriving layout is put on screen');
});

test('unsaved work on screen is not replaced by an incoming layout', async () => {
    // The workspace has moved since the active session was last saved, so what
    // is on screen is the user's and not ours to discard. This is the rule an
    // editor uses for a file changed on disk: reload if unmodified, not if not.
    const { host, applied } = createHost({ layoutOnScreen: MOVED, savedLayout: SAVED });

    assert.equal(await applySessionDataFromStorage(host, incoming(), { applyLayout: true }), true);

    assert.deepEqual(applied, [], 'nothing is applied');
    // The data still updates - only the screen is left alone.
    const active = host.data.sessions?.['s1'];
    assert.deepEqual(active?.layout, INCOMING, 'the store still takes the incoming layout');
});

test('a switch in flight keeps the workspace', async () => {
    // Two changeLayout calls racing would leave the workspace in neither state.
    const { host, applied } = createHost({ layoutOnScreen: SAVED, savedLayout: SAVED, isSwitching: true });

    await applySessionDataFromStorage(host, incoming(), { applyLayout: true });

    assert.deepEqual(applied, []);
});

test('a sync that changes nothing on screen does not rebuild the workspace', async () => {
    const { host, applied } = createHost({ layoutOnScreen: SAVED, savedLayout: SAVED });

    // Another device touched a different session; the active one is unchanged.
    await applySessionDataFromStorage(host, {
        activeSessionId: 's1',
        sessions: {
            s1: { id: 's1', name: 'S1', layout: SAVED },
            s2: { id: 's2', name: 'S2', layout: { pane: 'other' } },
        },
        sessionOrder: ['s1', 's2'],
    }, { applyLayout: true });

    assert.deepEqual(applied, [], 'no layout call for an unchanged active session');
    assert.ok(host.data.sessions?.['s2'], 'and the new session still arrives');
});

test('the read-before-write path never takes the screen', async () => {
    // persistDataImmediate() reloads before it writes, so that a save does not
    // clobber another device. A save that changed the workspace out from under
    // the person saving would be worse than the bug this fixes, so only the
    // watcher's reload passes applyLayout.
    const { host, applied } = createHost({ layoutOnScreen: SAVED, savedLayout: SAVED });

    await applySessionDataFromStorage(host, incoming(), { mergeLocal: false });

    assert.deepEqual(applied, []);
});

/**
 * Through the reload wrapper, not straight into the apply, because that is
 * where the two paths are told apart: only the watcher's `onReload` passes
 * `applyLayout`. Calling the apply directly cannot see a wrapper that hands it
 * `true` regardless.
 */
function createReloadHost(applyLayoutReached: unknown[]): ReloadExternalSessionHost {
    const probe = createHost({ layoutOnScreen: SAVED, savedLayout: SAVED });
    return {
        ...probe.host,
        getSessionSwitcher: (): never => ({
            isSwitching: false,
            applyWorkspaceLayout: async (layout: unknown) => {
                applyLayoutReached.push(layout);
                return true;
            },
        }) as never,
        _sessionStorageStamp: 1,
        _sessionStorageMtime: 1,
        getSessionsPath: () => 'sessions.json',
        // Newer than what was last read, so the reload does not return early.
        readJsonIfExists: async () => ({ exists: true, data: incoming(), error: null }),
        getFileMtime: async () => 9999,
        loadSessionDataFromStorage: async () => incoming(),
    };
}

test('the reload the watcher runs takes the screen', async () => {
    const applied: unknown[] = [];
    const host = createReloadHost(applied);

    assert.equal(await reloadExternalSessionStorageIfChanged(host, {
        mergeLocal: false,
        applyLayout: true,
    }), true);

    assert.deepEqual(applied, [INCOMING]);
});

test('the reload that runs before a save does not', async () => {
    const applied: unknown[] = [];
    const host = createReloadHost(applied);

    // persistDataImmediate()'s call, verbatim.
    assert.equal(await reloadExternalSessionStorageIfChanged(host, { mergeLocal: true }), true);

    assert.deepEqual(applied, [], 'a save must not change the workspace out from under the person saving');
});

test.after(() => harness.restore());
