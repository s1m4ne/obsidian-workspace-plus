import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';
import { DEFAULT_DATA, type PluginData, type SessionItem } from '../src/storage/default-data.ts';
import type { SessionSwitcherHost } from '../src/state/session-switcher.ts';

const harness = setupHarness();
const { SessionSwitcher } = await import('../src/state/session-switcher.ts');

function createMockHost(initialData?: Partial<PluginData>): {
    host: SessionSwitcherHost;
    events: {
        persists: number;
        statusBarUpdates: number;
        pushedHistory: SessionItem[];
        appliedLayouts: unknown[];
        savedActive: number;
    };
} {
    const events = {
        persists: 0,
        statusBarUpdates: 0,
        pushedHistory: [] as SessionItem[],
        appliedLayouts: [] as unknown[],
        savedActive: 0,
    };

    const host: SessionSwitcherHost = {
        data: Object.assign({}, DEFAULT_DATA, {
            activeSessionId: 's1',
            sessions: {
                s1: { id: 's1', name: 'Work', layout: { type: 'main', main: { id: 'l1' } } },
                s2: { id: 's2', name: 'Home', layout: { type: 'main', main: { id: 'l2' } } },
            },
            sessionOrder: ['s1', 's2'],
            restoreSidebars: true,
            autoSaveOnSwitch: true,
            warnOnUnsavedSwitch: false,
        }, initialData || {}),
        getOrderedSessions: () => [
            host.data.sessions.s1!,
            host.data.sessions.s2!,
        ],
        findSessionIndex: (sessions: SessionItem[], id: string | null | undefined) => {
            if (!sessions || !id) return -1;
            return sessions.findIndex((s) => s.id === id);
        },
        getActiveSession: () => (host.data.sessions && host.data.activeSessionId ? host.data.sessions[host.data.activeSessionId] || null : null),
        getCurrentWorkspaceLayout: () => ({ type: 'current', main: { id: 'l-curr' } }),
        persistData: async () => {
            events.persists += 1;
            return true;
        },
        updateStatusBar: () => {
            events.statusBarUpdates += 1;
        },
        // Stands in for the saver's CAPTURE, and does the same four things, so
        // an assertion about session.layout after a switch still means something.
        commitWorkspaceToSession: (session: SessionItem, options?: { touchModified?: boolean }) => {
            events.pushedHistory.push(session);
            const layout = host.getCurrentWorkspaceLayout();
            const changed = JSON.stringify(session.layout) !== JSON.stringify(layout);
            session.layout = layout;
            if (changed || options?.touchModified) session.modified = Date.now();
            return changed;
        },
        saveActiveSession: async () => {
            events.savedActive += 1;
            return true;
        },
        changeWorkspaceLayout: async (layout: unknown) => {
            events.appliedLayouts.push(layout);
            return true;
        },
        isActiveSessionDirty: () => false,
        isWarnOnUnsavedSwitchEnabled: () => Boolean(host.data.warnOnUnsavedSwitch),
        isAutoSaveOnSwitchEnabled: () => host.data.autoSaveOnSwitch !== false,
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

test('SessionSwitcher: startup settle window and flush', async () => {
    const { host, events } = createMockHost();
    const switcher = new SessionSwitcher(host);

    switcher.startStartupSettleWindow(100);
    assert.equal(switcher.isStartupSettling(), true);
    assert.ok(switcher.getStartupSettleRemainingMs() > 0);

    switcher.noteStartupLayoutChange();
    await switcher.flushOnStartup();

    assert.equal(events.persists, 1);
    assert.equal(events.pushedHistory.length, 1);

    // noteStartupLayoutChange does nothing when not settling
    switcher.setStartupSettleDeadline(0);
    assert.equal(switcher.isStartupSettling(), false);
    switcher.noteStartupLayoutChange();

    // scheduleStartupFlush when auto-save is disabled
    const disabledHost = createMockHost({ autoSaveOnSwitch: false }).host;
    const disabledSwitcher = new SessionSwitcher(disabledHost);
    const scheduled = await disabledSwitcher.scheduleStartupFlush();
    assert.equal(scheduled, true);
});

test('SessionSwitcher: layout restore scope and building', async () => {
    const { host } = createMockHost({ restoreSidebars: false });
    const switcher = new SessionSwitcher(host);

    assert.equal(switcher.getWorkspaceRestoreScope(), 'main-only');

    const layout = { main: { leaf: 1 } };
    const built = switcher.buildLayoutForRestore(layout) as Record<string, unknown>;
    assert.deepEqual(built.main, { leaf: 1 });

    const applied = await switcher.applyWorkspaceLayout(layout);
    assert.equal(applied, true);

    const nullApplied = await switcher.applyWorkspaceLayout(null);
    assert.equal(nullApplied, false);
});

test('SessionSwitcher: relative navigation context and stepping', () => {
    const { host } = createMockHost();
    const switcher = new SessionSwitcher(host);

    const nextCtx = switcher.getRelativeSwitchContext(1);
    assert.equal(nextCtx.currentIndex, 0);
    assert.equal(nextCtx.targetIndex, 1);

    const prevCtx = switcher.getRelativeSwitchContext(-1);
    assert.equal(prevCtx.targetIndex, 1);

    // Empty list context
    const emptyHost = createMockHost().host;
    emptyHost.getOrderedSessions = () => [];
    const emptySwitcher = new SessionSwitcher(emptyHost);
    const emptyCtx = emptySwitcher.getRelativeSwitchContext(1);
    assert.equal(emptyCtx.isEmpty, true);
});

test('SessionSwitcher: direct and relative switch helpers', async () => {
    const { host, events } = createMockHost();
    const switcher = new SessionSwitcher(host);

    await switcher.switchToIndex(1);
    assert.equal(host.data.activeSessionId, 's2');

    await switcher.switchSessionByIdFromCommand('s1');
    assert.equal(host.data.activeSessionId, 's1');

    await switcher.switchRelativeFromStatusBar(1);
    assert.equal(host.data.activeSessionId, 's2');

    await switcher.switchRelativeFromStatusBar(-1);
    assert.equal(host.data.activeSessionId, 's1');

    await switcher.switchRelativeDirect(1, { silent: true });
    assert.equal(host.data.activeSessionId, 's2');

    await switcher.switchRelativeFromCommand(1);

    assert.ok(events.persists >= 5);
});

test('SessionSwitcher: unsaved switch modal handling and flows', async () => {
    const { host, events } = createMockHost({
        autoSaveOnSwitch: false,
        warnOnUnsavedSwitch: true,
    });
    host.isActiveSessionDirty = () => true;

    // 1. Save and switch flow
    let modalAction = 'save';
    host.openUnsavedSwitchModal = (_msg, onSaveAndSwitch, onSwitchWithoutSaving, onCancel) => {
        if (modalAction === 'save') onSaveAndSwitch();
        else if (modalAction === 'switch') onSwitchWithoutSaving();
        else onCancel();
    };

    const switcher = new SessionSwitcher(host);
    const switched = await switcher.switchSession('s2');
    assert.equal(switched, true);
    assert.equal(events.savedActive, 1);
    assert.equal(host.data.activeSessionId, 's2');

    // 2. Switch without saving flow
    host.data.activeSessionId = 's1';
    modalAction = 'switch';
    const switchedNoSave = await switcher.switchSession('s2');
    assert.equal(switchedNoSave, true);

    // 3. Cancel flow
    host.data.activeSessionId = 's1';
    modalAction = 'cancel';
    const cancelled = await switcher.switchSession('s2');
    assert.equal(cancelled, false);
    assert.equal(host.data.activeSessionId, 's1');
});

test('SessionSwitcher: perform session switch with lock, validation, and notices (P2)', async () => {
    const { host, events } = createMockHost();
    const switcher = new SessionSwitcher(host);

    // Switching to unknown session is false
    const invalid = await switcher.switchSession('non-existent');
    assert.equal(invalid, false);

    // Switching to valid target
    const switched = await switcher.switchSession('s2', { silent: true });
    assert.equal(switched, true);
    assert.equal(host.data.activeSessionId, 's2');
    assert.equal(events.statusBarUpdates, 1);
    assert.equal(events.persists, 1);

    // Switching to same active is no-op
    const noop = await switcher.switchSession('s2', { silent: true });
    assert.equal(noop, false);

    // Notices
    const notice = switcher.showSessionSwitchNotice('Home');
    assert.ok(notice);
    switcher.clearSessionSwitchNotice();

    // Stale lock recovery
    (switcher as unknown as { isSwitchingSession: boolean; switchLockAt: number }).isSwitchingSession = true;
    (switcher as unknown as { switchLockAt: number }).switchLockAt = Date.now() - 10000;
    const recovered = await switcher.switchSession('s1', { silent: true });
    assert.equal(recovered, true);

    // hasBlockingSwitchUi check
    assert.equal(switcher.hasBlockingSwitchUi(), false);

    harness.restore();
});
