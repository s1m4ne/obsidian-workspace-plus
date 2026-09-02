import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';

/**
 * Loaded inside openModal(), after setupHarness(). This file sets the harness
 * up per test rather than once at module scope, so even a top-level dynamic
 * import would link `obsidian` before the hooks that point it at the stubs
 * exist.
 */
let SettingsState: typeof import('../src/state/settings-state.ts').SettingsState;

interface Session {
    readonly id: string;
    readonly name: string;
    readonly modified: number;
    readonly layout: object;
}

interface ModalPlugin {
    readonly app: { workspace: { containerEl: HTMLElement } };
    data: {
        activeSessionId: string;
        sessionOrder: string[];
        sessions: Record<string, Session>;
        groups: Record<string, { id: string; name: string }>;
        groupOrder: string[];
        sessionGroups: Record<string, string[]>;
        activeGroupId: string | null;
        groupFeatureEnabled: boolean;
        showFilterInput: boolean;
        overlayDefaultFocus: string;
        [key: string]: unknown;
    };
    switchedIds: string[];
    deletedIds: string[];
    /** Sessions this mock refuses to delete, as a real failure would. */
    undeletable: Set<string>;
    movedToGroup: Array<{ sessionId: string; groupId: string }>;
    removedFromGroup: Array<{ sessionId: string; groupId: string }>;
    reordered: string[][];
    getGroupStore(): never;
    isGroupFeatureEnabled(): boolean;
    getSessionStore(): never;
    getSettingsState(): never;
    getSessionSwitcher(): never;
    getCommandRegistry(): never;
    getOrderedSessionsForGroup(groupId: string | null): Session[];
    getOrderedGroups(): Array<{ id: string; name: string }>;
    getOrderedGroupTabIds(): string[];
    getCommandHotkey(command: string): string;
    findActiveSessionIndex(sessions: Session[]): number;
    getDefaultSessionName(): string;
    getSessionSaver(): never;
    isAutoSaveOnSwitchEnabled(): boolean;
    saveActiveSession(): Promise<void>;
    createSessionForViewedGroup(name: string, groupId: string | null): Promise<{ created: boolean; name: string; viewGroupId: string | null }>;
    switchSession(id: string): Promise<boolean>;
    resolveGroupSelection(groupId: string | null): Promise<{ resolvedGroupId: string | null; switched: boolean }>;
    deleteSession(id: string): Promise<boolean>;
    moveSessionToGroupExclusive(sessionId: string, groupId: string): Promise<void>;
    removeSessionFromGroup(sessionId: string, groupId: string): Promise<void>;
    setSessionOrderFromVisible(order: string[]): void;
    setGroupTabOrder(order: string[]): void;
}

interface SessionManagerModalInstance {
    readonly contentEl: HTMLElement;
    readonly groupTabsRow: HTMLElement;
    readonly listEl: HTMLElement;
    readonly nameInput: HTMLInputElement;
    readonly saveBtn: HTMLButtonElement;
    readonly filterInput: HTMLInputElement | null;
    readonly selectedIds: Set<string>;
    keyboardTarget: { zone: string; rowIndex: number | null; actionKey: string | null };
    open(): void;
    close(): void;
    getRowActionTarget(row: HTMLElement | null, actionKey?: string): HTMLElement | null;
    renderList(): void;
    onBulkDelete(): void;
    selectGroup(groupId: string | null): Promise<boolean>;
}

type ModalConstructor = new (app: unknown, plugin: ModalPlugin) => SessionManagerModalInstance;

function clearModals(doc: Document): void {
    for (const el of doc.querySelectorAll('.modal-container')) el.remove();
}

function makeVisible(root: ParentNode): void {
    for (const el of root.querySelectorAll<HTMLElement>('*')) {
        el.getClientRects = (): DOMRectList => [{
            bottom: 20,
            height: 20,
            left: 0,
            right: 100,
            top: 0,
            width: 100,
            x: 0,
            y: 0,
            toJSON: (): object => ({}),
        }] as unknown as DOMRectList;
    }
}

function makeRect(left: number, top: number, width: number, height: number): DOMRect {
    return {
        bottom: top + height,
        height,
        left,
        right: left + width,
        top,
        width,
        x: left,
        y: top,
        toJSON: (): object => ({}),
    };
}

function makePlugin(containerEl: HTMLElement, groupFeatureEnabled = false): ModalPlugin {
    const data = {
        activeSessionId: 's1',
        sessionOrder: ['s1', 's2', 's3'],
        sessions: {
            s1: { id: 's1', name: 'Work', modified: 1, layout: {} },
            s2: { id: 's2', name: 'Personal', modified: 2, layout: {} },
            s3: { id: 's3', name: 'Reading', modified: 3, layout: {} },
        },
        groups: { g1: { id: 'g1', name: 'Focus' } },
        groupOrder: ['__all__', 'g1'],
        sessionGroups: { s1: ['g1'], s2: ['g1'], s3: [] },
        activeGroupId: null,
        groupFeatureEnabled,
        showFilterInput: true,
        overlayDefaultFocus: 'session-create',
    };
    // The fixture data is the modal-relevant slice, not a whole PluginData;
    // SettingsState reads its own keys off it and falls back to DEFAULT_DATA.
    const settingsState = new SettingsState({ data, persistData: async () => true } as never);
    const plugin: ModalPlugin = {
        app: { workspace: { containerEl } },
        data,
        switchedIds: [],
        deletedIds: [],
        undeletable: new Set<string>(),
        movedToGroup: [],
        removedFromGroup: [],
        reordered: [],
        // Group calls go through getGroupStore(). This double carries the group
        // members itself, so it stands in as its own group store.
        getGroupStore(): never {
            // Same as getSessionStore above: the double carries the group
            // members, plus the three P1 moved onto GroupStore, answered from
            // this fixture's own data.
            const bag = plugin.data as Record<string, unknown>;
            const groups = (): Record<string, { id: string; name: string }> =>
                (bag['groups'] ?? {}) as Record<string, { id: string; name: string }>;
            return Object.assign(Object.create(this) as object, {
                getActiveGroupId: (): string | null => (bag['activeGroupId'] ?? null) as string | null,
                findGroup: (id: string | null) => (id ? groups()[id] ?? null : null),
                getGroupMap: () => groups(),
            }) as never;
        },
        isGroupFeatureEnabled: (): boolean => plugin.data.groupFeatureEnabled,
        // Session state goes through getSessionStore(); this double carries those
        // members itself, so it stands in as its own store.
        getSessionStore(): never {
            // The double still carries the store members; these five are the
            // ones P1's contract stage moved onto the owners, answered from
            // this fixture's own data so a test that changes a session or a
            // group still steers the path under test.
            const bag = plugin.data as Record<string, unknown>;
            const groups = (): Record<string, { id: string; name: string }> =>
                (bag['groups'] ?? {}) as Record<string, { id: string; name: string }>;
            return Object.assign(Object.create(this) as object, {
                getActiveSessionId: (): string | null => (bag['activeSessionId'] ?? null) as string | null,
                getSessionCount: () => Object.keys(bag['sessions'] ?? {}).length,
                findSession: (id: string) =>
                    ((bag['sessions'] ?? {}) as Record<string, unknown>)[id] ?? null,
                getActiveGroupId: (): string | null => (bag['activeGroupId'] ?? null) as string | null,
                findGroup: (id: string | null) => (id ? groups()[id] ?? null : null),
                getGroupMap: () => groups(),
            }) as never;
        },
        // A real SettingsState over this fixture's own data: showFilterInput
        // and overlayDefaultFocus are read through the owner now, and both are
        // set above precisely to steer the tests below.
        getSettingsState(): never { return settingsState as never; },
        getOrderedSessionsForGroup: (groupId): Session[] => plugin.data.sessionOrder
            .map((id) => plugin.data.sessions[id])
            .filter((session): session is Session => session !== undefined)
            .filter((session) => groupId === null || (plugin.data.sessionGroups[session.id] || []).includes(groupId)),
        getOrderedGroups: (): Array<{ id: string; name: string }> => Object.values(plugin.data.groups),
        getOrderedGroupTabIds: (): string[] => plugin.data.groupOrder,
        // Commands go through getCommandRegistry(); this double carries those members itself.
        getCommandRegistry(): never { return this as never; },
        getCommandHotkey: (command): string => command.startsWith('switch-to-') ? 'Mod+1' : 'Mod+]',
        findActiveSessionIndex: (sessions): number => sessions.findIndex((session) => session.id === plugin.data.activeSessionId),
        getDefaultSessionName: (): string => 'Workspace',
        isAutoSaveOnSwitchEnabled: (): boolean => false,
        // Saving goes through getSessionSaver(). This double carries the save
        // members itself, so it stands in as its own saver.
        getSessionSaver(): never { return this as never; },
        saveActiveSession: async (): Promise<void> => {},
        createSessionForViewedGroup: async (name, groupId) => ({ created: Boolean(name), name, viewGroupId: groupId }),
        // Switching goes through getSessionSwitcher(); this double carries those members itself.
        getSessionSwitcher(): never { return this as never; },
        switchSession: async (id): Promise<boolean> => {
            plugin.switchedIds.push(id);
            return false;
        },
        resolveGroupSelection: async (groupId) => ({ resolvedGroupId: groupId, switched: false }),
        deleteSession: async (id): Promise<boolean> => {
            plugin.deletedIds.push(id);
            if (plugin.undeletable.has(id)) return false;
            delete plugin.data.sessions[id];
            plugin.data.sessionOrder = plugin.data.sessionOrder.filter((sessionId) => sessionId !== id);
            return true;
        },
        moveSessionToGroupExclusive: async (sessionId, groupId): Promise<void> => {
            plugin.movedToGroup.push({ sessionId, groupId });
            plugin.data.sessionGroups[sessionId] = [groupId];
        },
        removeSessionFromGroup: async (sessionId, groupId): Promise<void> => {
            plugin.removedFromGroup.push({ sessionId, groupId });
            plugin.data.sessionGroups[sessionId] = (plugin.data.sessionGroups[sessionId] || [])
                .filter((currentGroupId) => currentGroupId !== groupId);
        },
        setSessionOrderFromVisible: (order): void => {
            plugin.reordered.push(order);
            plugin.data.sessionOrder = order;
        },
        setGroupTabOrder: (): void => {},
    };
    return plugin;
}

async function openModal(
    groupFeatureEnabled = false,
): Promise<{ h: ReturnType<typeof setupHarness>; plugin: ModalPlugin; modal: SessionManagerModalInstance }> {
    const h = setupHarness();
    clearModals(h.dom.document);
    const i18n = await import('../src/i18n.ts');
    i18n.resolveLocale('en');
    ({ SettingsState } = await import('../src/state/settings-state.ts'));
    const raw = await import('../src/modals/session-manager-modal-class.ts');
    const SessionManagerModal = raw.SessionManagerModal as unknown as ModalConstructor;
    const plugin = makePlugin(h.dom.container(), groupFeatureEnabled);
    const modal = new SessionManagerModal(plugin.app, plugin);
    modal.open();
    makeVisible(modal.contentEl);
    return { h, plugin, modal };
}

test('session manager keyboard moves across filter, rows, and the create controls before loading the focused row', async () => {
    const { h, plugin, modal } = await openModal();
    try {
        const filter = modal.filterInput;
        assert.ok(filter);
        filter.focus();
        h.dom.document.dispatchEvent(new h.dom.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        assert.equal(modal.keyboardTarget.rowIndex, 0);
        assert.equal(modal.keyboardTarget.actionKey, 'load');

        h.dom.document.dispatchEvent(new h.dom.window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
        assert.equal(modal.keyboardTarget.actionKey, 'save-inline');
        h.dom.document.dispatchEvent(new h.dom.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        assert.equal(modal.keyboardTarget.rowIndex, 1);
        assert.equal(modal.keyboardTarget.actionKey, 'load', 'save-inline becomes load in the next row');

        h.dom.document.dispatchEvent(new h.dom.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        h.dom.document.dispatchEvent(new h.dom.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        assert.equal(h.dom.document.activeElement, modal.nameInput, 'down from the final row returns to creation');
        h.dom.document.dispatchEvent(new h.dom.window.KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
        assert.equal(modal.keyboardTarget.rowIndex, 2);

        h.dom.document.dispatchEvent(new h.dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        await Promise.resolve();
        assert.deepEqual(plugin.switchedIds, ['s3']);

        const firstRow = modal.listEl.querySelector<HTMLElement>('.wpp-session-item');
        assert.ok(firstRow);
        assert.equal(modal.getRowActionTarget(firstRow, 'primary')?.getAttribute('data-action-key'), 'load');
        assert.equal(modal.getRowActionTarget(firstRow, 'missing')?.getAttribute('data-action-key'), 'load');
    } finally {
        modal.close();
        h.restore();
    }
});

test('session manager drag drops a row onto a group and persists a reordered visible list', async () => {
    const { h, plugin, modal } = await openModal(true);
    try {
        makeVisible(modal.contentEl);
        const rows = modal.listEl.querySelectorAll<HTMLElement>('.wpp-session-item');
        const first = rows[0];
        const second = rows[1];
        const group = modal.groupTabsRow.querySelector<HTMLElement>('[data-group-id="g1"]');
        assert.ok(first);
        assert.ok(second);
        assert.ok(group);
        first.getBoundingClientRect = (): DOMRect => makeRect(0, 100, 200, 30);
        second.getBoundingClientRect = (): DOMRect => makeRect(0, 200, 200, 30);
        group.getBoundingClientRect = (): DOMRect => makeRect(10, 10, 100, 30);

        first.dispatchEvent(new h.dom.window.MouseEvent('mousedown', { bubbles: true, button: 0, clientX: 5, clientY: 105 }));
        h.dom.document.dispatchEvent(new h.dom.window.MouseEvent('mousemove', { bubbles: true, clientX: 20, clientY: 20 }));
        h.dom.document.dispatchEvent(new h.dom.window.MouseEvent('mouseup', { bubbles: true, clientX: 20, clientY: 20 }));
        await Promise.resolve();
        assert.deepEqual(plugin.movedToGroup, [{ sessionId: 's1', groupId: 'g1' }]);

        const reorderedFirst = modal.listEl.querySelector<HTMLElement>('.wpp-session-item');
        const reorderedSecond = modal.listEl.querySelectorAll<HTMLElement>('.wpp-session-item')[1];
        assert.ok(reorderedFirst);
        assert.ok(reorderedSecond);
        reorderedFirst.getBoundingClientRect = (): DOMRect => makeRect(0, 100, 200, 30);
        reorderedSecond.getBoundingClientRect = (): DOMRect => makeRect(0, 200, 200, 30);
        reorderedFirst.dispatchEvent(new h.dom.window.MouseEvent('mousedown', { bubbles: true, button: 0, clientX: 5, clientY: 105 }));
        h.dom.document.dispatchEvent(new h.dom.window.MouseEvent('mousemove', { bubbles: true, clientX: 5, clientY: 260 }));
        h.dom.document.dispatchEvent(new h.dom.window.MouseEvent('mouseup', { bubbles: true, clientX: 5, clientY: 260 }));
        assert.deepEqual(plugin.reordered[plugin.reordered.length - 1], ['s2', 's3', 's1']);
    } finally {
        modal.close();
        h.restore();
    }
});

test('session manager bulk delete is gated by confirmation and only reports the deletions that succeeded', async () => {
    const { h, plugin, modal } = await openModal();
    try {
        // One session declines to be deleted. Without it the selection would
        // empty itself either way - renderList() drops ids whose session is
        // gone - so nothing here could tell whether the reset ran at all.
        plugin.undeletable.add('s3');
        modal.selectedIds.add('s2');
        modal.selectedIds.add('s3');
        modal.onBulkDelete();

        const confirm = h.dom.document.querySelector<HTMLButtonElement>('.wpp-confirm-buttons .mod-warning');
        assert.ok(confirm, 'bulk delete must first open its confirmation modal');
        assert.deepEqual(plugin.deletedIds, [], 'opening confirmation must not delete anything');

        confirm.click();
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();

        assert.deepEqual(plugin.deletedIds, ['s2', 's3'], 'both selected sessions are attempted');
        assert.ok(plugin.data.sessions['s3'], 'the refused delete leaves its session in place');
        assert.equal(modal.selectedIds.size, 0, 'the selection is reset even where the delete failed');
        assert.match(
            h.obsidian.notices[h.obsidian.notices.length - 1]?.message ?? '',
            /\b1\b/,
            'the count reports one deletion, not two attempts',
        );
    } finally {
        modal.close();
        h.restore();
    }
});

test('dropping a row on the All tab takes it out of the group being viewed', async () => {
    const { h, plugin, modal } = await openModal(true);
    try {
        // "All" is a view, not a group, so the drop means "leave the group I am
        // looking at" - which only makes sense while one is selected.
        await modal.selectGroup('g1');
        makeVisible(modal.contentEl);

        const row = modal.listEl.querySelector<HTMLElement>('.wpp-session-item');
        const allTab = modal.groupTabsRow.querySelector<HTMLElement>('[data-group-id="__all__"]');
        assert.ok(row);
        assert.ok(allTab, 'the All tab has to be on screen for the drop to have a target');
        row.getBoundingClientRect = (): DOMRect => makeRect(0, 100, 200, 30);
        allTab.getBoundingClientRect = (): DOMRect => makeRect(10, 10, 60, 30);

        row.dispatchEvent(new h.dom.window.MouseEvent('mousedown', { bubbles: true, button: 0, clientX: 5, clientY: 105 }));
        h.dom.document.dispatchEvent(new h.dom.window.MouseEvent('mousemove', { bubbles: true, clientX: 20, clientY: 20 }));
        h.dom.document.dispatchEvent(new h.dom.window.MouseEvent('mouseup', { bubbles: true, clientX: 20, clientY: 20 }));
        await Promise.resolve();
        await Promise.resolve();

        assert.deepEqual(plugin.removedFromGroup, [{ sessionId: 's1', groupId: 'g1' }]);
        assert.deepEqual(plugin.movedToGroup, [], 'a drop on All must not add the session to anything');
    } finally {
        modal.close();
        h.restore();
    }
});

test('the last remaining session offers no delete button', async () => {
    const { h, plugin, modal } = await openModal();
    try {
        const withThree = modal.listEl.querySelectorAll('[data-action-key="delete"]');
        assert.equal(withThree.length, 3, 'every row is deletable while others remain');

        plugin.data.sessions = { s1: { id: 's1', name: 'Work', modified: 1, layout: {} } };
        plugin.data.sessionOrder = ['s1'];
        modal.renderList();

        // There has to be a session left, so the only row loses its delete
        // control rather than relying on the user not to press it.
        assert.equal(modal.listEl.querySelectorAll('[data-action-key="delete"]').length, 0);
        assert.equal(modal.listEl.querySelectorAll('[data-action-key="rename"]').length, 1, 'rename is still offered');
    } finally {
        modal.close();
        h.restore();
    }
});

test('the row action icons carry a name, not just a tooltip (P12)', async () => {
    const { h, modal } = await openModal();
    try {
        // Both are divs with an icon and a role, so aria-label is the only
        // thing a screen reader has to read out. setTooltip alone is not it.
        const rename = modal.listEl.querySelector('[data-action-key="rename"]');
        assert.equal(rename?.getAttribute('aria-label'), 'Rename');

        const del = modal.listEl.querySelector('[data-action-key="delete"]');
        assert.equal(del?.getAttribute('aria-label'), 'Delete');
    } finally {
        modal.close();
        h.restore();
    }
});
