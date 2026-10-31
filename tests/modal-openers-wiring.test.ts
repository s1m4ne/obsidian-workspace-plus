// The commands and status bar actions ask the plugin to open a modal. If
// nothing defines those methods the calls do nothing, which is exactly what
// shipped: manage-sessions, create-session, version-history and the status
// bar's session-manager action were all silent in Obsidian while every test
// passed, because the tests supplied the missing hooks themselves.
//
// This drives the plugin the way Obsidian does and asks the only question that
// matters: does a modal reach the document?

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';
import type { App } from 'obsidian';
import type { SessionManagerModalHost } from '../src/modals/session-manager-modal-class.ts';
import type { HistoryModalPluginHost } from '../src/modals/history-modal.ts';

const harness = setupHarness();
// After setupHarness, so `obsidian` resolves to the recording stubs.
const { SettingsState } = await import('../src/state/settings-state.ts');

interface TestPlugin {
    app: unknown;
    data: Record<string, unknown>;
    openSessionManagerModal(focusName?: boolean): unknown;
    openHistoryModal(session: unknown): unknown;
    [key: string]: unknown;
}

const SESSION = { id: 's1', name: 'Session One', layout: {}, history: [{ savedAt: 1, layout: {} }] };

function createPlugin(): TestPlugin {
    const settingsState = new SettingsState({
        data: { sessions: { s1: SESSION }, sessionOrder: ['s1'], activeSessionId: 's1' },
        persistData: async () => true,
    } as never);
    const plugin: TestPlugin = {
        app: { workspace: { getLayout: () => ({}) } },
        data: { sessions: { s1: SESSION }, sessionOrder: ['s1'], activeSessionId: 's1', groups: {}, groupOrder: [], sessionGroups: {}, activeGroupId: null },
        openSessionManagerModal: () => undefined,
        openHistoryModal: () => undefined,
    };

    // What the two modals ask of the plugin while they build their content.
    Object.assign(plugin, {
        getOrderedGroups: () => [],
        getOrderedGroupTabIds: () => [],
        // Session state goes through getSessionStore(); this double carries those members itself.
        getSessionStore(): never {
            // The double still carries the store members; these five are the
            // ones P1's contract stage moved onto the owners, answered from
            // this fixture's own data so a test that changes a session or a
            // group still steers the path under test.
            const bag: Record<string, unknown> = plugin.data;
            const groups = (): Record<string, { id: string; name: string }> =>
                (bag['groups'] ?? {}) as Record<string, { id: string; name: string }>;
            return Object.assign(Object.create(this) as object, {
                getActiveSessionId: (): string | null => (bag['activeSessionId'] ?? null) as string | null,
                getSessionCount: () => Object.keys(bag['sessions'] ?? {}).length,
                getActiveGroupId: (): string | null => (bag['activeGroupId'] ?? null) as string | null,
                findGroup: (id: string | null) => (id ? groups()[id] ?? null : null),
                getGroupMap: () => groups(),
                // The session manager follows the session set while it is open
                // now (#118's shape). This test opens it and checks it reached
                // the screen, so the subscription only has to exist.
                onSessionsChanged: (): (() => void) => (): void => {},
            }) as never;
        },
        // The modal reads showFilterInput and overlayDefaultFocus through the
        // owner, so it gets a real one over this fixture's own data.
        getSettingsState: () => settingsState,
        getOrderedSessionsForGroup: () => [SESSION],
        findActiveSessionIndex: () => 0,
        // Commands go through getCommandRegistry(); this double carries those members itself.
        getCommandRegistry(): never { return this as never; },
        getCommandHotkey: () => '',
        // The modal puts the plugin's command hotkeys on its own scope (#119).
        // Nothing is bound in this fixture, so nothing is registered.
        getCommandHotkeyBindings: () => [],
        getDefaultSessionName: () => 'Session',
        // Group calls go through getGroupStore(). This double carries the group
        // members itself, so it stands in as its own group store.
        getGroupStore(): never { return this as never; },
        isGroupFeatureEnabled: () => false,
        // Saving goes through getSessionSaver(). This double carries the save
        // members itself, so it stands in as its own saver.
        getSessionSaver(): never { return this as never; },
        isAutoSaveOnSwitchEnabled: () => true,
        // Version history goes through getHistoryService(); this double carries those members itself.
        getHistoryService(): never { return this as never; },
        isVersionHistoryConfirmRestoreEnabled: () => false,
        restoreFromHistoryEntry: async () => true,
    });
    return plugin;
}

function openModalCount(): number {
    return harness.dom.document.querySelectorAll('.modal-container').length;
}

test('openSessionManagerModal puts the session manager on screen', async () => {
    const plugin = createPlugin();
    const { SessionManagerModal } = await import('../src/modals/session-manager-modal-class.ts');
    const before = openModalCount();

    new SessionManagerModal(plugin.app as App, plugin as unknown as SessionManagerModalHost).open();

    assert.equal(openModalCount(), before + 1, 'the session manager must open');
});

test('openHistoryModal puts the version history on screen', async () => {
    const plugin = createPlugin();
    const { HistoryModal } = await import('../src/modals/history-modal.ts');
    const before = openModalCount();

    new HistoryModal(plugin.app as App, plugin as unknown as HistoryModalPluginHost, SESSION).open();

    assert.equal(openModalCount(), before + 1, 'the history modal must open');
});

test.after(() => harness.restore());
