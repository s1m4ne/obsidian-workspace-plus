import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';
import { DEFAULT_DATA, type PluginData } from '../src/storage/default-data.ts';
import type { SessionStoreHost } from '../src/state/session-store.ts';

const harness = setupHarness();
const { SessionStore } = await import('../src/state/session-store.ts');

function createMockHost(initialData?: Partial<PluginData>): {
    host: SessionStoreHost;
    events: {
        persists: number;
        statusBarUpdates: number;
        commandSyncs: number;
        appliedLayouts: unknown[];
        hiddenOverlay: number;
        capturedLayout: number;
    };
} {
    const events = {
        persists: 0,
        statusBarUpdates: 0,
        commandSyncs: 0,
        appliedLayouts: [] as unknown[],
        hiddenOverlay: 0,
        capturedLayout: 0,
    };

    const host: SessionStoreHost = {
        groupStore: {
            isGroupFeatureEnabled: () => true,
        } as unknown as import('../src/state/group-store.ts').GroupStore,
        data: Object.assign({}, DEFAULT_DATA, {
            activeSessionId: 's1',
            sessions: {
                s1: { id: 's1', name: 'Session 1', layout: { val: 1 } },
                s2: { id: 's2', name: 'Session 2', layout: { val: 2 } },
            },
            sessionOrder: ['s1', 's2'],
            groupFeatureEnabled: true,
            sessionGroups: {
                s1: ['g1'],
            },
            groups: {
                g1: { id: 'g1', name: 'Group 1' },
            },
            groupOrder: ['g1'],
            activeGroupId: 'g1',
        }, initialData || {}),
        persistData: async () => {
            events.persists += 1;
            return true;
        },
        updateStatusBar: () => {
            events.statusBarUpdates += 1;
        },
        syncSessionCommands: () => {
            events.commandSyncs += 1;
        },
        hideSwitchOverlay: () => {
            events.hiddenOverlay += 1;
        },
        captureActiveSessionLayoutIfAutoSave: () => {
            events.capturedLayout += 1;
        },
        applyWorkspaceLayout: async (layout: unknown) => {
            events.appliedLayouts.push(layout);
            return true;
        },
        getWorkspaceRestoreScope: () => 'full',
        getCurrentWorkspaceLayout: () => ({ val: 0 }),
        moveSessionToGroupExclusive: async () => true,
        resolveGroupSelection: async (groupId: string | null) => ({ resolvedGroupId: groupId }),
        attachSessionToActiveGroup: () => {},
    };

    return { host, events };
}

test('SessionStore: container reference reactivity on reassignment (P1)', () => {
    let currentData: PluginData = Object.assign({}, DEFAULT_DATA, {
        activeSessionId: 's1',
        sessions: { s1: { id: 's1', name: 'First', layout: {} } },
        sessionOrder: ['s1'],
    });

    const { host: template } = createMockHost();
    const store = new SessionStore(() => Object.assign({}, template, { data: currentData }));

    assert.equal(store.getActiveSession()?.name, 'First');

    // External replacement
    currentData = Object.assign({}, DEFAULT_DATA, {
        activeSessionId: 's2',
        sessions: { s2: { id: 's2', name: 'Second', layout: {} } },
        sessionOrder: ['s2'],
    });

    assert.equal(store.getActiveSession()?.name, 'Second');
});

test('SessionStore: P9 and P10 contracts for lookup and indexing', () => {
    const { host } = createMockHost();
    const store = new SessionStore(host);

    const list = store.getOrderedSessionsUnfiltered();

    // P9: an absent session stays absent instead of becoming the first entry.
    assert.equal(store.findSessionIndex(list, 'nonexistent'), -1);
    assert.equal(store.findSessionIndex(list, 's1'), 0);

    // Active session index queries
    assert.equal(store.findActiveSessionIndex(list), 0);
    host.data.activeSessionId = 'nonexistent';
    assert.equal(store.findActiveSessionIndex(list), -1);

    // P10: findSession vs getSession
    assert.equal(store.findSession('s1')?.name, 'Session 1');
    assert.equal(store.findSession('nonexistent'), null);
    assert.equal(store.getSession('s1').name, 'Session 1');
    assert.throws(() => store.getSession('nonexistent'));
});

test('SessionStore: ordering and visible order merges', async () => {
    const { host, events } = createMockHost({
        sessions: {
            s1: { id: 's1', name: 'Zebra', layout: {} },
            s2: { id: 's2', name: 'Alpha', layout: {} },
            sDef: { id: 'sDef', name: 'Default', isDefault: true, layout: {} },
        },
        sessionOrder: ['s1'],
    });
    const store = new SessionStore(host);

    store.syncSessionOrder();
    assert.equal(host.data.sessionOrder[0], 'sDef');
    assert.ok(host.data.sessionOrder.includes('s1'));
    assert.ok(host.data.sessionOrder.includes('s2'));

    // Ordering for group
    const forGroup = store.getOrderedSessionsForGroup('g1');
    assert.equal(forGroup.length, 1);
    assert.equal(forGroup[0]?.id, 's1');

    const ordered = store.getOrderedSessions();
    assert.equal(ordered.length, 1);

    // Visible reordering
    const merged = store.mergeVisibleSessionOrder(['s2', 's1']);
    assert.deepEqual(merged, ['sDef', 's2', 's1']);

    const changed = await store.setSessionOrderFromVisible(['s2', 's1']);
    assert.equal(changed, true);
    assert.equal(events.commandSyncs, 1);
    assert.equal(events.persists, 1);
});

test('SessionStore: validation and name generation', () => {
    const { host } = createMockHost();
    const store = new SessionStore(host);

    assert.equal(store.isSessionNameTaken('Session 1'), true);
    assert.equal(store.isSessionNameTaken('Session 1', 's1'), false);
    assert.equal(store.isGroupNameTaken('Group 1'), true);
    assert.equal(store.isGroupNameTaken('Group 1', 'g1'), false);

    assert.ok(store.getDefaultSessionName());
    assert.ok(store.getAutoSessionName(1));
    assert.ok(store.getNextSessionName());
});

test('SessionStore: CRUD operations, duplicate, reset, and default session', async () => {
    const { host, events } = createMockHost();
    const store = new SessionStore(host);

    // Create session validated with whitespace/empty check
    const emptyRes = await store.createSessionValidated('   ', { notify: false });
    assert.equal(emptyRes.created, false);
    assert.equal(emptyRes.reason, 'empty');

    const dupRes = await store.createSessionValidated('Session 1', { notify: false });
    assert.equal(dupRes.created, false);
    assert.equal(dupRes.reason, 'duplicate');

    const createRes = await store.createSessionValidated('Session 3', { notify: false });
    assert.equal(createRes.created, true);
    assert.equal(store.findSession(createRes.sessionId!)?.name, 'Session 3');

    // Create for viewed group
    const groupRes = await store.createSessionForViewedGroup('Session 4', 'g1', { notify: false });
    assert.equal(groupRes.created, true);

    // Rename session
    const renamed = await store.renameSessionById('s1', 'Session 1 Renamed', { notify: false });
    assert.equal(renamed, true);
    assert.equal(store.findSession('s1')?.name, 'Session 1 Renamed');

    // Duplicate session
    const dupOk = await store.duplicateSession('s1');
    assert.equal(dupOk, true);

    // Duplicate current session
    const dupCurr = await store.duplicateCurrentSession();
    assert.equal(dupCurr, true);

    // Create empty session
    const emptyCreated = await store.createEmptySession();
    assert.equal(emptyCreated, true);

    // Delete inactive sessions
    const deletedCount = await store.deleteAllInactiveSessions();
    assert.ok(deletedCount > 0);

    // Reset sessions to default
    await store.resetSessionsToDefault();
    assert.equal(Object.keys(host.data.sessions).length, 1);
    assert.equal(host.data.sessions[host.data.activeSessionId!]?.isDefault, true);

    // Ensure default session when already has default
    store.ensureDefaultSession();
    assert.equal(Object.keys(host.data.sessions).length, 1);

    // Layout utils
    const layout = store.getCurrentWorkspaceLayout();
    assert.ok(layout);
    assert.ok(typeof store.serializeLayout(layout) === 'string');
    assert.equal(store.layoutsEqual({ a: 1 }, { a: 1 }), true);
    assert.equal(store.layoutsEqualStructural({ a: 1 }, { a: 1 }), true);
    assert.ok(events.persists > 0);

    harness.restore();
});
