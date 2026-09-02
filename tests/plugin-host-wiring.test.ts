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
const { sessionStoreHost, sessionSwitcherHost, settingsStateHost, groupStoreHost, historyServiceHost, sessionSaverHost, frontmatterLinkerHost } = await import('../src/main.ts');

type Call = string;

/** Records every method reached on a collaborator, without implementing one. */
function recorder(name: string, calls: Call[]): Record<string, unknown> {
    return new Proxy({}, {
        get(_target, prop: string) {
            if (prop === 'then') return undefined;
            // Data, not a method: returning a function here would make the
            // reader see a truthy value and prove nothing about the wiring.
            if (prop === 'isSwitching') {
                calls.push(`${name}.${prop}`);
                return false;
            }
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
    plugin.getStatusBarController = (): unknown => recorder('statusBarController', calls);
    plugin.getCommandRegistry = (): unknown => recorder('commandRegistry', calls);
    plugin.getSwitchOverlay = (): unknown => recorder('switchOverlay', calls);

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
        'statusBarController.updateStatusBar',
        'commandRegistry.syncSessionCommands',
        'switchOverlay.hide',
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
        'statusBarController.updateStatusBar',
        'switchOverlay.showPreview',
        'switchOverlay.showFeedback',
    ]);
});

test('the SettingsState host reaches the collaborator each member names', () => {
    const { plugin, calls } = createPlugin();
    const host = settingsStateHost(asPlugin(plugin));

    void host.persistData();
    host.updateStatusBar?.();
    host.syncSessionCommands?.();
    host.startHistorySnapshotTimer?.();
    host.stopHistorySnapshotTimer?.();

    assert.deepEqual(calls, [
        'plugin.persistData',
        'statusBarController.updateStatusBar',
        'commandRegistry.syncSessionCommands',
        'historyService.startHistorySnapshotTimer',
        'historyService.stopHistorySnapshotTimer',
    ]);
});

test('the GroupStore host reaches the collaborator each member names', () => {
    const { plugin, calls } = createPlugin();
    plugin.getSearchOverlay = (): unknown => recorder('searchOverlay', calls);
    const host = groupStoreHost(asPlugin(plugin));

    void host.persistData();
    host.updateStatusBar?.();
    host.syncSessionCommands?.();
    host.hideSwitchOverlay?.();
    host.hideSearchOverlay?.();
    void host.switchSession('s1');
    host.getOrderedSessionsUnfiltered();
    host.getOrderedSessionsForGroup('g1');

    assert.deepEqual(calls, [
        'plugin.persistData',
        'statusBarController.updateStatusBar',
        'commandRegistry.syncSessionCommands',
        'switchOverlay.hide',
        'searchOverlay.hide',
        'sessionSwitcher.switchSession',
        'sessionStore.getOrderedSessionsUnfiltered',
        'sessionStore.getOrderedSessionsForGroup',
    ]);
});

test('the HistoryService host reaches the collaborator each member names', () => {
    const { plugin, calls } = createPlugin();
    const host = historyServiceHost(asPlugin(plugin));

    host.getActiveSession();
    host.getCurrentWorkspaceLayout();
    void host.applyWorkspaceLayout({ pane: 'next' });
    // Not recomputed here: the adapter had a second implementation of this
    // comparison, reachable only when the plugin method was missing.
    host.layoutsEqualStructural({}, {});
    host.updateStatusBar?.();
    void host.persistData();
    host.isAutoSaveOnSwitchEnabled();

    assert.deepEqual(calls, [
        'sessionStore.getActiveSession',
        'sessionStore.getCurrentWorkspaceLayout',
        'sessionSwitcher.applyWorkspaceLayout',
        'sessionStore.layoutsEqualStructural',
        'statusBarController.updateStatusBar',
        'plugin.persistData',
        'sessionSaver.isAutoSaveOnSwitchEnabled',
    ]);
});

test('the SessionSaver host reaches the collaborator each member names', () => {
    const { plugin, calls } = createPlugin();
    const host = sessionSaverHost(asPlugin(plugin));

    host.getActiveSession();
    host.getCurrentWorkspaceLayout();
    host.layoutsEqualStructural({}, {});
    host.getDefaultSessionName();
    host.pushLayoutToHistory({ id: 's1', name: 'S', layout: {}, modified: 0 });
    host.updateStatusBar?.();
    host.syncSessionCommands?.();
    void host.persistData();
    host.createSessionRecord('id', 'name', {});
    host.insertSessionAndActivate({ id: 's1', name: 'S', layout: {}, modified: 0 });
    host.startHistorySnapshotTimer?.();
    host.stopHistorySnapshotTimer?.();
    void host.applyWorkspaceLayout({});
    host.getOrderedSessionsUnfiltered();
    host.getOrderedGroupTabIds();
    host.isGroupFeatureEnabled();

    assert.deepEqual(calls, [
        'sessionStore.getActiveSession',
        'sessionStore.getCurrentWorkspaceLayout',
        'sessionStore.layoutsEqualStructural',
        'sessionStore.getDefaultSessionName',
        'historyService.pushLayoutToHistory',
        'statusBarController.updateStatusBar',
        'commandRegistry.syncSessionCommands',
        'plugin.persistData',
        'sessionStore.createSessionRecord',
        'sessionStore.insertSessionAndActivate',
        'historyService.startHistorySnapshotTimer',
        'historyService.stopHistorySnapshotTimer',
        'sessionSwitcher.applyWorkspaceLayout',
        'sessionStore.getOrderedSessionsUnfiltered',
        'groupStore.getOrderedGroupTabIds',
        'groupStore.isGroupFeatureEnabled',
    ]);
});

test('the saver host leaves out the two hooks the adapter supplied as empty functions', () => {
    const { plugin } = createPlugin();
    const host = sessionSaverHost(asPlugin(plugin));

    // The saver survived the empty functions only because it tests the result
    // for undefined rather than the hook for existence.
    assert.equal('saveActiveSession' in host, false);
    assert.equal('overwriteSessionWithCurrentLayout' in host, false);
});

test('every host reads its live collaborator fields from the plugin', () => {
    const { plugin, calls } = createPlugin();

    // The fields are getters, so reading one is what proves it reaches the
    // plugin rather than a value captured when the host was built. Each recorder
    // is a distinct object, so the assertion also names which collaborator.
    const seen: string[] = [];
    const note = (label: string, value: unknown): void => {
        seen.push(`${label}:${typeof value === 'object' && value !== null ? 'object' : String(value)}`);
    };

    const store = sessionStoreHost(asPlugin(plugin));
    note('store.data', store.data);
    note('store.app', store.app);
    note('store.manifestId', store.manifestId);
    note('store.groupStore', store.groupStore);
    note('store.settingsState', store.settingsState);

    const switcher = sessionSwitcherHost(asPlugin(plugin));
    note('switcher.data', switcher.data);
    note('switcher.app', switcher.app);
    note('switcher.getSwitchOverlay', switcher.getSwitchOverlay?.());
    note('switcher.settingsState', switcher.settingsState);
    note('switcher.sessionStore', switcher.sessionStore);
    note('switcher.historyService', switcher.historyService);
    note('switcher.sessionSaver', switcher.sessionSaver);

    const saver = sessionSaverHost(asPlugin(plugin));
    note('saver.data', saver.data);
    note('saver.app', saver.app);
    note('saver.settingsState', saver.settingsState);
    note('saver.sessionStore', saver.sessionStore);
    note('saver.groupStore', saver.groupStore);
    note('saver.historyService', saver.historyService);

    const history = historyServiceHost(asPlugin(plugin));
    note('history.data', history.data);
    note('history.settingsState', history.settingsState);
    note('history.sessionStore', history.sessionStore);

    const groups = groupStoreHost(asPlugin(plugin));
    note('groups.data', groups.data);
    note('groups.settingsState', groups.settingsState);

    const settings = settingsStateHost(asPlugin(plugin));
    note('settings.data', settings.data);

    assert.deepEqual(
        seen.filter((entry) => entry.endsWith(':undefined')),
        [],
        'every field must resolve; undefined means the getter reached nothing',
    );
    assert.equal(store.manifestId, 'workspace-plus-plus');
    assert.deepEqual(calls, [], 'reading a field must not call a collaborator method');
});

test('the FrontmatterLinker host reaches the collaborator each member names', () => {
    const { plugin, calls } = createPlugin();
    plugin.registerEvent = (): void => { calls.push('plugin.registerEvent'); };
    const host = frontmatterLinkerHost(asPlugin(plugin));

    void host.saveCurrentLayoutAsSessionName('S');
    void host.switchSession('s1');
    void host.setActiveGroup?.('g1');
    host.isGroupFeatureEnabled();
    host.getStartupSettleRemainingMs?.();
    host.isSessionSwitcherActive?.();
    host.registerEvent?.({});

    assert.deepEqual(calls, [
        'sessionSaver.saveCurrentLayoutAsSessionName',
        'sessionSwitcher.switchSession',
        'groupStore.setActiveGroup',
        'groupStore.isGroupFeatureEnabled',
        'sessionSwitcher.getStartupSettleRemainingMs',
        'sessionSwitcher.isSwitching',
        'plugin.registerEvent',
    ]);
    // The linker defines this itself; a hook here would be a second answer.
    assert.equal('handleFrontmatterTriggers' in host, false);
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
