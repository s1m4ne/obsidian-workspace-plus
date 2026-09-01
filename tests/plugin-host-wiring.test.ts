// Every host member the plugin builds reaches the collaborator it names.
//
// The type checker sees the shape of these hooks but not their destination: an
// arrow that calls the wrong collaborator method, or the right name on the wrong
// collaborator, type-checks perfectly. The delegation gate resolves
// `this.getX().y()` and cannot see inside a host literal either. Three shims in
// this codebase once pointed at methods nobody had written, so the wiring is
// asserted rather than assumed.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';

const harness = setupHarness();
const { createRealPlugin } = await import('./real-plugin.ts');
const { sessionStoreHost, sessionSwitcherHost } = await import('../src/main.ts');

type Call = string;

/** Records every method reached on a collaborator, without implementing one. */
function recorder(name: string, calls: Call[]): Record<string, unknown> {
    return new Proxy({}, {
        get(_target, prop: string) {
            if (prop === 'then') return undefined;
            return (...args: unknown[]): unknown => {
                calls.push(`${name}.${prop}`);
                if (prop.startsWith('getOrdered') || prop === 'findSessionIndex') return [];
                return args.length >= 0 ? undefined : undefined;
            };
        },
    });
}

/**
 * The factories take the plugin class; a wiring test needs the loose view so it
 * can swap a collaborator for a recorder. Asserted here, once.
 */
function asPlugin(plugin: ReturnType<typeof createRealPlugin>): Parameters<typeof sessionStoreHost>[0] {
    return plugin as unknown as Parameters<typeof sessionStoreHost>[0];
}

function createPlugin(): { plugin: ReturnType<typeof createRealPlugin>; calls: Call[] } {
    const calls: Call[] = [];
    const plugin = createRealPlugin({
        app: {
            workspace: {
                getLayout: (): unknown => ({ pane: 'live' }),
                changeLayout: async (): Promise<void> => { calls.push('workspace.changeLayout'); },
            },
        },
        data: { sessions: {}, sessionOrder: [], activeSessionId: null },
    });

    plugin.getGroupStore = (): unknown => recorder('groupStore', calls);
    plugin.getSettingsState = (): unknown => recorder('settingsState', calls);
    plugin.getSessionStore = (): unknown => recorder('sessionStore', calls);
    plugin.getSessionSaver = (): unknown => recorder('sessionSaver', calls);
    plugin.getSessionSwitcher = (): unknown => recorder('sessionSwitcher', calls);
    plugin.getHistoryService = (): unknown => recorder('historyService', calls);
    plugin.persistData = async (): Promise<boolean> => { calls.push('plugin.persistData'); return true; };
    plugin.updateStatusBar = (): void => { calls.push('plugin.updateStatusBar'); };
    plugin.syncSessionCommands = (): void => { calls.push('plugin.syncSessionCommands'); };
    plugin.hideSwitchOverlay = (): void => { calls.push('plugin.hideSwitchOverlay'); };
    plugin.showSwitchPreviewOverlay = (): void => { calls.push('plugin.showSwitchPreviewOverlay'); };
    plugin.showSwitchFeedbackOverlay = (): void => { calls.push('plugin.showSwitchFeedbackOverlay'); };

    return { plugin, calls };
}

test('the SessionStore host reaches the collaborator each member names', () => {
    const { plugin, calls } = createPlugin();
    const host = sessionStoreHost(asPlugin(plugin));

    assert.deepEqual(host.getCurrentWorkspaceLayout(), { pane: 'live' }, 'the real workspace, not a default');

    void host.moveSessionToGroupExclusive('s1', 'g1');
    void host.resolveGroupSelection('g1');
    host.attachSessionToActiveGroup('s1');
    void host.persistData();
    host.updateStatusBar?.();
    host.syncSessionCommands?.();
    host.hideSwitchOverlay?.();
    host.captureActiveSessionLayoutIfAutoSave?.();
    void host.applyWorkspaceLayout({ pane: 'next' });
    host.getWorkspaceRestoreScope();

    assert.deepEqual(calls, [
        'groupStore.moveSessionToGroupExclusive',
        'groupStore.resolveGroupSelection',
        'groupStore.attachSessionToActiveGroup',
        'plugin.persistData',
        'plugin.updateStatusBar',
        'plugin.syncSessionCommands',
        'plugin.hideSwitchOverlay',
        'sessionSaver.captureActiveSessionLayoutIfAutoSave',
        'sessionSwitcher.applyWorkspaceLayout',
        'sessionSwitcher.getWorkspaceRestoreScope',
    ]);
});

test('the SessionStore host exposes the live plugin fields, not copies', () => {
    const { plugin } = createPlugin();
    const host = sessionStoreHost(asPlugin(plugin));

    plugin.data = { sessions: { s9: { id: 's9', name: 'Later' } } };
    assert.equal(Object.keys(host.data.sessions)[0], 's9', 'data must be read when asked, not captured');
    assert.equal(host.manifestId, 'workspace-plus-plus');
});

test('createSessionValidated is absent, so the store uses its own', () => {
    const { plugin } = createPlugin();
    const host = sessionStoreHost(asPlugin(plugin));

    // Supplying a hook that answers undefined - which the adapter did - makes
    // the store run its own path anyway while the unwired-hooks gate cannot
    // tell the hook from a mistake.
    assert.equal(typeof host.createSessionValidated, 'undefined');
});

test('the SessionSwitcher host reaches the collaborator each member names', () => {
    const { plugin, calls } = createPlugin();
    const host = sessionSwitcherHost(asPlugin(plugin));

    host.getOrderedSessions(null);
    host.getOrderedSessions('g1');
    host.getOrderedSessions();
    host.findSessionIndex([], 's1');
    host.getActiveSession();
    host.getCurrentWorkspaceLayout();
    void host.applyWorkspaceLayout({ pane: 'next' });
    host.pushLayoutToHistory({ id: 's1', name: 'S', layout: {}, modified: 0 });
    void host.saveActiveSession();
    host.isActiveSessionDirty();
    host.isAutoSaveOnSwitchEnabled();
    host.isWarnOnUnsavedSwitchEnabled();
    void host.persistData();
    host.updateStatusBar?.();
    host.showSwitchPreviewOverlay?.([], 0);
    host.showSwitchFeedbackOverlay?.([], 0);

    assert.deepEqual(calls, [
        'sessionStore.getOrderedSessionsUnfiltered',
        'sessionStore.getOrderedSessionsForGroup',
        'sessionStore.getOrderedSessions',
        'sessionStore.findSessionIndex',
        'sessionStore.getActiveSession',
        'sessionStore.getCurrentWorkspaceLayout',
        // The workspace, not the switcher: the switcher builds the layout and
        // then calls this to put it on screen, so routing it back at the
        // switcher would recurse until the stack ran out.
        'workspace.changeLayout',
        'historyService.pushLayoutToHistory',
        'sessionSaver.saveActiveSession',
        'sessionSaver.isActiveSessionDirty',
        'sessionSaver.isAutoSaveOnSwitchEnabled',
        'sessionSaver.isWarnOnUnsavedSwitchEnabled',
        'plugin.persistData',
        'plugin.updateStatusBar',
        'plugin.showSwitchPreviewOverlay',
        'plugin.showSwitchFeedbackOverlay',
    ]);
});

test('the switcher host leaves out the hooks the switcher implements itself', () => {
    const { plugin } = createPlugin();
    const host = sessionSwitcherHost(asPlugin(plugin));

    // Each of these was a function returning undefined in the adapter, which is
    // how it said "use your own". Absent is the same thing to the switcher and
    // a fact the unwired-hooks gate can check.
    for (const name of [
        'showSessionSwitchNotice',
        'switchSession',
        'performSessionSwitch',
        'scheduleStartupFlush',
        'flushOnStartup',
        'getStartupSettleRemainingMs',
    ]) {
        assert.equal(name in host, false, `${name} must not be supplied`);
    }
});

test.after(() => harness.restore());
