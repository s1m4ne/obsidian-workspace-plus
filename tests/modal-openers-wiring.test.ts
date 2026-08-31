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

const harness = setupHarness();

interface TestPlugin {
    app: unknown;
    data: Record<string, unknown>;
    openSessionManagerModal(focusName?: boolean): unknown;
    openHistoryModal(session: unknown): unknown;
    [key: string]: unknown;
}

const SESSION = { id: 's1', name: 'Session One', layout: {}, history: [{ savedAt: 1, layout: {} }] };

async function createPlugin(): Promise<TestPlugin> {
    const mod = await import('../src/plugin/methods/modal-openers.js');
    const attach = ((mod as { default?: unknown }).default ?? mod) as (target: unknown) => void;

    function PluginMock(this: unknown) {}
    attach(PluginMock);

    const plugin = new (PluginMock as unknown as new () => TestPlugin)();
    plugin.app = { workspace: { getLayout: () => ({}) } };
    plugin.data = { sessions: { s1: SESSION }, sessionOrder: ['s1'], activeSessionId: 's1', groups: {}, groupOrder: [], sessionGroups: {}, activeGroupId: null };

    // What the two modals ask of the plugin while they build their content.
    Object.assign(plugin, {
        getOrderedGroups: () => [],
        getOrderedGroupTabIds: () => [],
        getOrderedSessionsForGroup: () => [SESSION],
        findActiveSessionIndex: () => 0,
        getCommandHotkey: () => '',
        getDefaultSessionName: () => 'Session',
        isGroupFeatureEnabled: () => false,
        isAutoSaveOnSwitchEnabled: () => true,
        isVersionHistoryConfirmRestoreEnabled: () => false,
        extractFilePathsFromLayout: () => [],
        countPanesInLayout: () => 1,
        restoreFromHistoryEntry: async () => true,
    });
    return plugin;
}

function openModalCount(): number {
    return harness.dom.document.querySelectorAll('.modal-container').length;
}

test('openSessionManagerModal puts the session manager on screen', async () => {
    const plugin = await createPlugin();
    const before = openModalCount();

    plugin.openSessionManagerModal(false);

    assert.equal(openModalCount(), before + 1, 'the session manager must open');
});

test('openHistoryModal puts the version history on screen', async () => {
    const plugin = await createPlugin();
    const before = openModalCount();

    plugin.openHistoryModal(SESSION);

    assert.equal(openModalCount(), before + 1, 'the history modal must open');
});

test.after(() => harness.restore());
