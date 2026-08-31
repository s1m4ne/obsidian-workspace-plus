import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';
import { DEFAULT_DATA } from '../src/storage/default-data.ts';

const harness = setupHarness();
const {
    CommandRegistry,
    registerCommands,
    syncSessionCommands,
} = await import('../src/core/command-registry.ts');

function createMockHost() {
    const commands: import('obsidian').Command[] = [];
    const calls: string[] = [];
    const shownActiveIndexes: number[] = [];

    const sessionsMap: Record<string, import('../src/storage/default-data.ts').SessionItem> = {
        s1: { id: 's1', name: 'Session 1', layout: {} },
        s2: { id: 's2', name: 'Session 2', layout: {} },
        s3: { id: 's3', name: 'Session 3', layout: {} },
    };

    const host: import('../src/core/command-registry.ts').CommandRegistryHost = {
        manifest: { id: 'workspace-plus-plus' },
        data: {
            ...DEFAULT_DATA,
            numberedSwitchCommands: true,
            showActiveSwitchCommand: false,
            activeSessionId: 's1',
            activeGroupId: 'g1',
            sessions: sessionsMap,
            sessionOrder: ['s1', 's2', 's3'],
            groups: {
                g1: { id: 'g1', name: 'Group 1', sessionIds: ['s1'] },
            },
            groupOrder: ['g1'],
            sessionGroups: { s1: ['g1'] },
        },
        app: {} as import('obsidian').App,
        _dynamicSessionCommandIds: [] as string[],
        addCommand(command: import('obsidian').Command) {
            commands.push(command);
            return command;
        },
        removeCommand(id: string) {
            calls.push(`remove:${id}`);
            const idx = commands.findIndex((c) => c.id === id);
            if (idx >= 0) commands.splice(idx, 1);
        },
        getOrderedSessions() {
            return this.data.sessionOrder.map((id) => this.data.sessions[id]!).filter(Boolean);
        },
        getOrderedSessionsUnfiltered() {
            return this.getOrderedSessions();
        },
        confirmOverwriteSessionWithCurrentLayout(id: string) {
            calls.push(`overwrite:${id}`);
        },
        renameCurrentSession() { calls.push('rename'); },
        deleteCurrentSession() { calls.push('delete'); },
        createEmptySession() { calls.push('createEmpty'); },
        duplicateCurrentSession: async () => { calls.push('duplicate'); return true; },
        switchToIndex: async (idx: number) => { calls.push(`switchToIndex:${idx}`); return true; },
        switchRelativeFromCommand: async (dir: number) => { calls.push(`switchRelative:${dir}`); return true; },
        saveActiveSession: async () => { calls.push('saveActive'); return true; },
        saveAsSession: async () => { calls.push('saveAs'); return true; },
        saveCurrentNoteNameAsSession: async () => { calls.push('saveCurrentNote'); return true; },
        isAutoSaveOnSwitchEnabled: () => false,
        setAutoSaveOnSwitch: (val: boolean) => { calls.push(`setAutoSave:${val}`); },
        reloadCurrentSessionWithoutSaving: async () => { calls.push('reloadWithoutSaving'); return true; },
        toggleAutoSaveOnSwitch: async () => { calls.push('toggleAutoSave'); return true; },
        openSearchOverlay: () => { calls.push('openSearchOverlay'); },
        isVersionHistoryEnabled: () => true,
        getActiveSession() {
            return (this.data.activeSessionId && this.data.sessions[this.data.activeSessionId]) || null;
        },
        exportSessionsSnapshot: async () => { calls.push('exportSnapshot'); },
        importSessionsFromLatestExport: async () => { calls.push('importSnapshot'); },
        isGroupFeatureEnabled: () => true,
        getOrderedSessionsForGroup() { return this.getOrderedSessions(); },
        // Answers from the data, so a caller that hard-codes an index - or
        // reintroduces the "not found means the first one" substitution P9
        // removed - is visible here.
        findActiveSessionIndex(sessions: Array<{ id: string }>) {
            return sessions.findIndex((s) => s.id === this.data.activeSessionId);
        },
        showSwitchOverlay(_ordered: unknown, activeIndex: number) {
            calls.push('showSwitchOverlay');
            shownActiveIndexes.push(activeIndex);
        },
        getRelativeGroupId(_current: string | null, step: number) { return step > 0 ? 'g1' : undefined; },
        resolveGroupSelection: async (gid: string) => ({ resolvedGroupId: gid }),
        exitGroup() { calls.push('exitGroup'); },
        switchGroupRelative(step: number) { calls.push(`switchGroupRelative:${step}`); },
        switchSessionByIdFromCommand: async (id: string) => { calls.push(`switchById:${id}`); return true; },
        openSessionManagerModal(focusName: boolean) { calls.push(`openSessionManager:${focusName}`); },
        openHistoryModal(session: import('../src/storage/default-data.ts').SessionItem) { calls.push(`openHistory:${session.name}`); },
        openConfirmModal(msg: string, onConfirm: () => void) { calls.push(`openConfirm:${msg}`); onConfirm(); },
    };

    return { host, commands, calls, shownActiveIndexes };
}

test('CommandRegistry: registers all core commands and handles callbacks', async () => {
    const { host, commands, calls } = createMockHost();
    const registry = new CommandRegistry(host);

    registry.registerCommands();
    assert.ok(commands.length >= 20);

    const cmdMap = new Map(commands.map((c) => [c.id, c]));

    // Check simple callbacks
    cmdMap.get('manage-sessions')?.callback?.();
    assert.ok(calls.includes('openSessionManager:false'));

    cmdMap.get('create-session')?.callback?.();
    assert.ok(calls.includes('openSessionManager:true'));

    cmdMap.get('rename-session')?.callback?.();
    assert.ok(calls.includes('rename'));

    cmdMap.get('delete-session')?.callback?.();
    assert.ok(calls.includes('delete'));

    cmdMap.get('new-empty-session')?.callback?.();
    assert.ok(calls.includes('createEmpty'));

    cmdMap.get('duplicate-session')?.callback?.();
    assert.ok(calls.includes('duplicate'));

    cmdMap.get('previous-session')?.callback?.();
    assert.ok(calls.includes('switchRelative:-1'));

    cmdMap.get('next-session')?.callback?.();
    assert.ok(calls.includes('switchRelative:1'));

    cmdMap.get('save-current-session')?.callback?.();
    assert.ok(calls.includes('saveActive'));

    cmdMap.get('save-as-session')?.callback?.();
    assert.ok(calls.includes('saveAs'));

    cmdMap.get('save-current-note-name-as-session')?.callback?.();
    assert.ok(calls.includes('saveCurrentNote'));

    cmdMap.get('reload-current-session-without-saving')?.callback?.();
    assert.ok(calls.includes('reloadWithoutSaving'));

    cmdMap.get('toggle-auto-save-on-switch')?.callback?.();
    assert.ok(calls.includes('toggleAutoSave'));

    cmdMap.get('search-session-overlay')?.callback?.();
    assert.ok(calls.includes('openSearchOverlay'));

    cmdMap.get('export-sessions-snapshot')?.callback?.();
    assert.ok(calls.includes('exportSnapshot'));

    cmdMap.get('import-latest-sessions-snapshot')?.callback?.();
    assert.ok(calls.includes('importSnapshot'));

    cmdMap.get('switch-group')?.callback?.();
    // Wait for resolveGroupSelection promise
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.ok(calls.includes('showSwitchOverlay'));

    cmdMap.get('next-group')?.callback?.();
    await new Promise((resolve) => setTimeout(resolve, 10));

    cmdMap.get('previous-group')?.callback?.();
    assert.ok(calls.includes('switchGroupRelative:-1'));

    // Check checkCallbacks
    const enableAutoSave = cmdMap.get('enable-auto-save-on-switch');
    assert.equal(enableAutoSave?.checkCallback?.(true), true);
    enableAutoSave?.checkCallback?.(false);
    assert.ok(calls.includes('setAutoSave:true'));

    const disableAutoSave = cmdMap.get('disable-auto-save-on-switch');
    assert.equal(disableAutoSave?.checkCallback?.(true), false);

    const versionHistory = cmdMap.get('version-history');
    assert.equal(versionHistory?.checkCallback?.(true), true);
    versionHistory?.checkCallback?.(false);
    assert.ok(calls.includes('openHistory:Session 1'));

    const exitGroup = cmdMap.get('exit-group');
    assert.equal(exitGroup?.checkCallback?.(true), true);
    exitGroup?.checkCallback?.(false);
    assert.ok(calls.includes('exitGroup'));
});

test('CommandRegistry: syncSessionCommands manages numbered and dynamic named commands', () => {
    const { host, commands } = createMockHost();
    const registry = new CommandRegistry(host);

    registry.syncSessionCommands();

    const ids = commands.map((c) => c.id);
    assert.ok(ids.includes('switch-to-1'));
    assert.ok(ids.includes('switch-to-9'));

    // Switch to 1 checkCallback
    const switchTo1 = commands.find((c) => c.id === 'switch-to-1');
    assert.equal(switchTo1?.checkCallback?.(true), false); // s1 is activeSessionId and showActiveSwitchCommand is false

    const switchTo2 = commands.find((c) => c.id === 'switch-to-2');
    assert.equal(switchTo2?.checkCallback?.(true), true); // s2 is not active

    // Now test with numberedSwitchCommands disabled and dynamic commands from 0 onward
    host.data.numberedSwitchCommands = false;
    registry.syncSessionCommands();

    const newIds = commands.map((c) => c.id);
    assert.equal(newIds.includes('switch-to-1'), false);
    assert.ok(newIds.includes('switch-to-named-s1'));
    assert.ok(newIds.includes('switch-to-named-s2'));
    assert.ok(newIds.includes('switch-to-named-s3'));

    // Standalone functions
    registerCommands(host);
    syncSessionCommands(host);
});

test.after(() => harness.restore());

test('opening another group offers no active row when the active session is not in it', async () => {
    const { commands, shownActiveIndexes, host } = createMockHost();
    new CommandRegistry(host).registerCommands();
    const cmdMap = new Map(commands.map((c) => [c.id, c]));

    // The active session belongs somewhere else, which is the ordinary state
    // once groups are in use. Before P9 the overlay was handed 0 and highlighted
    // the first row of a group the active session is not in.
    host.data.activeSessionId = 'not-in-any-group';

    cmdMap.get('switch-group')?.callback?.();
    await new Promise((resolve) => setTimeout(resolve, 10));

    assert.equal(
        shownActiveIndexes[shownActiveIndexes.length - 1],
        -1,
        'the overlay must be told there is no active row, not handed the first one',
    );
});
