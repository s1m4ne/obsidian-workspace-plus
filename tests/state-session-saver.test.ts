import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';
import { DEFAULT_DATA, type PluginData, type SessionItem } from '../src/storage/default-data.ts';
import type { SessionSaverHost } from '../src/state/session-saver.ts';

const harness = setupHarness();
const {
    SessionSaver,
    findSessionByName,
    isGroupFeatureEnabled,
    chooseSessionGroupForView,
} = await import('../src/state/session-saver.ts');

function createMockHost(initialData?: Partial<PluginData>): {
    host: SessionSaverHost;
    events: {
        persists: number;
        statusBarUpdates: number;
        commandSyncs: number;
        pushedHistory: SessionItem[];
        historyStarts: number;
        historyStops: number;
        appliedLayouts: unknown[];
    };
} {
    const events = {
        persists: 0,
        statusBarUpdates: 0,
        commandSyncs: 0,
        pushedHistory: [] as SessionItem[],
        historyStarts: 0,
        historyStops: 0,
        appliedLayouts: [] as unknown[],
    };

    const host: SessionSaverHost = {
        data: Object.assign({}, DEFAULT_DATA, {
            activeSessionId: 's1',
            sessions: {
                s1: { id: 's1', name: 'Work', layout: { type: 'main', id: 'l1' }, modified: 1 },
                s2: { id: 's2', name: 'Home', layout: { type: 'main', id: 'l2' }, modified: 1 },
            },
            sessionOrder: ['s1', 's2'],
            restoreSidebars: true,
            autoSaveOnSwitch: true,
            warnOnUnsavedSwitch: true,
            highlightUnsavedSessionChanges: true,
            groups: {},
            groupOrder: [],
            sessionGroups: {},
            activeGroupId: null,
            groupFeatureEnabled: false,
        }, initialData || {}),
        getActiveSession: () => (host.data.sessions && host.data.activeSessionId ? host.data.sessions[host.data.activeSessionId] || null : null),
        getCurrentWorkspaceLayout: () => ({ type: 'main', id: 'l-current' }),
        layoutsEqualStructural: (a, b) => JSON.stringify(a) === JSON.stringify(b),
        getDefaultSessionName: () => 'Default',
        pushLayoutToHistory: (session: SessionItem) => {
            events.pushedHistory.push(session);
        },
        updateStatusBar: () => {
            events.statusBarUpdates += 1;
        },
        syncSessionCommands: () => {
            events.commandSyncs += 1;
        },
        persistData: async () => {
            events.persists += 1;
            return true;
        },
        startHistorySnapshotTimer: () => {
            events.historyStarts += 1;
        },
        stopHistorySnapshotTimer: () => {
            events.historyStops += 1;
        },
        applyWorkspaceLayout: async (layout: unknown) => {
            events.appliedLayouts.push(layout);
            return true;
        },
        getOrderedSessionsUnfiltered: () => [
            host.data.sessions.s1!,
            host.data.sessions.s2!,
        ],
        createSessionRecord: (id, name, layout, options) => ({
            id,
            name,
            layout,
            modified: options?.modified ?? Date.now(),
        }),
        insertSessionAndActivate: (session) => {
            host.data.sessions[session.id] = session;
            host.data.sessionOrder.push(session.id);
            host.data.activeSessionId = session.id;
        },
        getOrderedGroupTabIds: () => ['__all__'],
        isGroupFeatureEnabled: () => Boolean(host.data.groupFeatureEnabled),
        app: {
            workspace: {
                changeLayout: async (layout: unknown) => {
                    events.appliedLayouts.push(layout);
                    return true;
                },
                getLayout: () => ({ type: 'app-layout' }),
            },
        } as unknown as import('obsidian').App,
    };

    return { host, events };
}

test('SessionSaver: autoSave and dirty checks', async () => {
    const { host, events } = createMockHost();
    const saver = new SessionSaver(host);

    assert.equal(saver.isAutoSaveOnSwitchEnabled(), true);
    assert.equal(saver.isWarnOnUnsavedSwitchEnabled(), true);
    assert.equal(saver.isUnsavedStatusBarHighlightEnabled(), true);

    // Layout l-current != l1 -> dirty
    assert.equal(saver.isActiveSessionDirty(), true);
    assert.equal(saver.shouldShowUnsavedStatusBarHighlight(), false); // autoSave is on

    // Turn auto-save off -> highlight becomes active
    await saver.setAutoSaveOnSwitch(false, { notify: false });
    assert.equal(saver.isAutoSaveOnSwitchEnabled(), false);
    assert.equal(events.historyStops, 1);
    assert.equal(saver.shouldShowUnsavedStatusBarHighlight(), true);

    // Toggle back on
    await saver.toggleAutoSaveOnSwitch({ notify: false });
    assert.equal(saver.isAutoSaveOnSwitchEnabled(), true);
    assert.equal(events.historyStarts, 1);
});

test('SessionSaver: saveActiveSession changed and unchanged', async () => {
    const { host, events } = createMockHost();
    const saver = new SessionSaver(host);

    const changed = await saver.saveActiveSession({ silent: true });
    assert.equal(changed, true);
    assert.equal(events.persists, 1);
    assert.equal(events.pushedHistory.length, 1);
    assert.deepEqual(host.data.sessions.s1?.layout, { type: 'main', id: 'l-current' });

    // Second save without changes
    const unchanged = await saver.saveActiveSession({ silent: true });
    assert.equal(unchanged, false);
    assert.equal(events.persists, 2);

    // Missing active session
    host.data.activeSessionId = 'missing';
    const noSession = await saver.saveActiveSession({ silent: true });
    assert.equal(noSession, false);
});

test('SessionSaver: overwriteSessionWithCurrentLayout', async () => {
    const { host, events } = createMockHost();
    const saver = new SessionSaver(host);

    const overwritten = await saver.overwriteSessionWithCurrentLayout('s2', { silent: true });
    assert.equal(overwritten, true);
    assert.equal(events.persists, 1);
    assert.deepEqual(host.data.sessions.s2?.layout, { type: 'main', id: 'l-current' });

    const missing = await saver.overwriteSessionWithCurrentLayout('missing', { silent: true });
    assert.equal(missing, false);
});

test('SessionSaver: saveCurrentLayoutAsSessionName new and overwrite', async () => {
    const { host, events } = createMockHost();
    const saver = new SessionSaver(host);

    // Empty name
    const empty = await saver.saveCurrentLayoutAsSessionName('   ', { silent: true });
    assert.equal(empty.saved, false);

    // New session
    const created = await saver.saveCurrentLayoutAsSessionName('Research', { silent: true });
    assert.equal(created.saved, true);
    assert.equal(created.created, true);
    assert.equal(created.overwritten, false);
    assert.ok(created.sessionId);
    assert.equal(host.data.activeSessionId, created.sessionId);
    assert.equal(events.commandSyncs, 1);

    // Overwrite existing by name
    const overwritten = await saver.saveCurrentLayoutAsSessionName('Work', { silent: true });
    assert.equal(overwritten.saved, true);
    assert.equal(overwritten.created, false);
    assert.equal(overwritten.overwritten, true);
    assert.equal(overwritten.sessionId, 's1');
    assert.equal(host.data.activeSessionId, 's1');
});

test('SessionSaver: confirmOverwriteSessionWithCurrentLayout modal flow', () => {
    const { host } = createMockHost();
    let modalOpened = false;
    host.openConfirmModal = (_msg, onConfirm) => {
        modalOpened = true;
        onConfirm();
    };

    const saver = new SessionSaver(host);
    const missing = saver.confirmOverwriteSessionWithCurrentLayout('missing');
    assert.equal(missing, false);

    const opened = saver.confirmOverwriteSessionWithCurrentLayout('s1');
    assert.equal(opened, true);
    assert.equal(modalOpened, true);
});

test('SessionSaver: reloadCurrentSessionWithoutSaving and captureActiveSessionLayoutIfAutoSave', async () => {
    const { host, events } = createMockHost();
    const saver = new SessionSaver(host);

    const reloaded = await saver.reloadCurrentSessionWithoutSaving({ silent: true });
    assert.equal(reloaded, true);
    assert.equal(events.appliedLayouts.length, 1);

    saver.captureActiveSessionLayoutIfAutoSave();
    assert.equal(events.pushedHistory.length, 1);

    // With auto-save disabled, capture does nothing
    host.data.autoSaveOnSwitch = false;
    saver.captureActiveSessionLayoutIfAutoSave();
    assert.equal(events.pushedHistory.length, 1);
});

test('SessionSaver helpers: findSessionByName and chooseSessionGroupForView', () => {
    const { host } = createMockHost({
        groups: {
            g1: { id: 'g1', name: 'WorkGroup' },
            g2: { id: 'g2', name: 'PersonalGroup' },
        },
        groupOrder: ['__all__', 'g1', 'g2'],
        sessionGroups: {
            s1: ['g1'],
            s2: ['g2'],
        },
        groupFeatureEnabled: true,
        activeGroupId: 'g1',
    });

    const found = findSessionByName(host.data, 'Work');
    assert.equal(found?.id, 's1');
    assert.equal(findSessionByName(host.data, 'Missing'), null);

    assert.equal(isGroupFeatureEnabled(host), true);
    const chosenGroup = chooseSessionGroupForView(host, 's2');
    assert.equal(chosenGroup, 'g2');

    harness.restore();
});
