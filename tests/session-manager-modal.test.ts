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
    getCommandHotkeyBindings(command: string): readonly { modifiers: string[]; key: string }[];
    /** What the scoped hotkeys reached (#119). */
    calls: string[];
    saveAsSession(): Promise<void>;
    reloadCurrentSessionWithoutSaving(): Promise<void>;
    toggleAutoSaveOnSwitch(options?: { notify?: boolean }): Promise<void>;
    renameCurrentSession(): void;
    duplicateCurrentSession(): Promise<void>;
    deleteCurrentSession(): void;
    findActiveSessionIndex(sessions: Session[]): number;
    getDefaultSessionName(): string;
    getSessionSaver(): never;
    isAutoSaveOnSwitchEnabled(): boolean;
    saveActiveSession(): Promise<void>;
    createSessionForViewedGroup(name: string, groupId: string | null): Promise<{ created: boolean; name: string; viewGroupId: string | null }>;
    switchSession(id: string): Promise<boolean>;
    switchRelativeImmediately(offset: number): Promise<boolean>;
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

/** One binding per scoped command, so a test can tell which one fired. */
const SCOPED_TEST_KEYS: Record<string, string | undefined> = {
    'save-current-session': 'S',
    'save-as-session': 'A',
    'reload-current-session-without-saving': 'L',
    'rename-session': 'R',
    'duplicate-session': 'M',
    'delete-session': 'Backspace',
    'toggle-auto-save-on-switch': 'O',
    'next-session': 'Enter',
    'previous-session': 'Comma',
};

/** Listeners the fixture's store hands out, so a test can fire a change. */
const sessionListeners = new Set<() => void>();

function notifySessionsChanged(): void {
    for (const listener of [...sessionListeners]) listener();
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
                // A real subscription, not a stub: the modal follows the
                // session set while it is open now, and firing this is the only
                // way a test reaches that path.
                onSessionsChanged: (listener: () => void): (() => void) => {
                    sessionListeners.add(listener);
                    return (): void => { sessionListeners.delete(listener); };
                },
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
        // What Obsidian has registered, which is what the modal puts on its
        // own scope (#119). One binding per command, distinct keys, so a test
        // can tell which one fired.
        getCommandHotkeyBindings: (command): readonly { modifiers: string[]; key: string }[] => {
            const key = SCOPED_TEST_KEYS[command];
            return key ? [{ modifiers: ['Mod', 'Shift'], key }] : [];
        },
        findActiveSessionIndex: (sessions): number => sessions.findIndex((session) => session.id === plugin.data.activeSessionId),
        getDefaultSessionName: (): string => 'Workspace',
        isAutoSaveOnSwitchEnabled: (): boolean => false,
        // Reached only through the scope this modal registers (#119); the rows
        // have their own buttons and those are covered above.
        calls: [] as string[],
        saveAsSession(): Promise<void> { this.calls.push('saveAsSession'); return Promise.resolve(); },
        reloadCurrentSessionWithoutSaving(): Promise<void> {
            this.calls.push('reloadCurrentSessionWithoutSaving');
            return Promise.resolve();
        },
        toggleAutoSaveOnSwitch(): Promise<void> { this.calls.push('toggleAutoSaveOnSwitch'); return Promise.resolve(); },
        renameCurrentSession(): void { this.calls.push('renameCurrentSession'); },
        duplicateCurrentSession(): Promise<void> { this.calls.push('duplicateCurrentSession'); return Promise.resolve(); },
        deleteCurrentSession(): void { this.calls.push('deleteCurrentSession'); },
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
        // The modal's next/previous hotkeys switch in place (#119), so the
        // offset is recorded rather than a session id.
        switchRelativeImmediately(offset: number): Promise<boolean> {
            this.calls.push(`switchRelativeImmediately:${offset}`);
            return Promise.resolve(true);
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
    sessionListeners.clear();
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

/**
 * The modal follows the session set while it is open, and keeps the keyboard.
 *
 * #118 fixed this for the switch overlay and the search overlay already had it;
 * this modal had neither, so a session arriving from another device - or created
 * by anything but its own rows - did not appear until it was reopened.
 *
 * The reason it was not a three-line subscription: `renderList()` empties the
 * list and rebuilds every row, so real DOM focus dies with the element it was
 * on. Of its ten call sites exactly one follows it with a focus call. Dropping
 * the keyboard out from under someone mid-navigation would be worse than not
 * refreshing.
 */
test('a session created under the open modal appears in it at once', async () => {
    const { h, plugin, modal } = await openModal();
    try {
        const names = (): string[] => [...modal.contentEl.querySelectorAll('.wpp-session-name')]
            .map((el) => el.textContent ?? '');
        assert.deepEqual(names(), ['Work', 'Personal', 'Reading']);

        plugin.data.sessions['s4'] = { id: 's4', name: 'Arrived', modified: 4, layout: {} };
        plugin.data.sessionOrder.push('s4');
        notifySessionsChanged();

        assert.deepEqual(names(), ['Work', 'Personal', 'Reading', 'Arrived']);
    } finally {
        modal.close();
        h.restore();
    }
});

test('an external change does not drop the keyboard focus', async () => {
    const { h, plugin, modal } = await openModal();
    try {
        const doc = h.dom.document;
        const rows = (): HTMLElement[] => [...modal.contentEl.querySelectorAll<HTMLElement>('.wpp-session-item')];

        // Put focus on the second row's switch button, the way an arrow key
        // would leave it.
        const before = rows()[1]?.querySelector<HTMLElement>('[data-action-key="load"]');
        assert.ok(before);
        before.focus();
        assert.equal(doc.activeElement, before);

        // Rows created *during* the refresh need a box too, and `makeVisible`
        // only patches the elements that exist when it runs. The modal filters
        // its keyboard targets by `getClientRects()`, so without this the new
        // button is invisible to `focusSessionTarget` and the assertion below
        // would fail for a reason that is jsdom's, not the modal's.
        const proto = (h.dom.document.defaultView as unknown as { HTMLElement: { prototype: HTMLElement } }).HTMLElement.prototype;
        const original = Object.getOwnPropertyDescriptor(proto, 'getClientRects');
        proto.getClientRects = function (this: HTMLElement): DOMRectList {
            return [makeRect(0, 0, 100, 20)] as unknown as DOMRectList;
        };

        plugin.data.sessions['s4'] = { id: 's4', name: 'Arrived', modified: 4, layout: {} };
        plugin.data.sessionOrder.push('s4');
        notifySessionsChanged();
        if (original) Object.defineProperty(proto, 'getClientRects', original);

        // The element it was on is gone - renderList rebuilt the list - so this
        // has to be the *new* button in the same position, not the old one.
        const after = rows()[1]?.querySelector<HTMLElement>('[data-action-key="load"]');
        assert.ok(after);
        assert.notEqual(after, before, 'the row really was rebuilt');
        assert.equal(doc.activeElement, after, 'and focus came back to the same place');
    } finally {
        modal.close();
        h.restore();
    }
});

test('closing the modal stops it listening', async () => {
    const { h, modal } = await openModal();
    try {
        // The subscription itself, not its effect: after close the list element
        // is detached, so a leaked listener would render into nothing and a
        // count of the rows on screen cannot tell the two apart.
        assert.equal(sessionListeners.size, 1, 'it subscribed while open');

        modal.close();

        assert.equal(sessionListeners.size, 0, 'and let go on the way out');
    } finally {
        h.restore();
    }
});

/**
 * The plugin's own hotkeys reach the modal (#119).
 *
 * An Obsidian `Modal` owns a `Scope` and captures key input before the global
 * keymap sees it, so the plugin's hotkeys did nothing while the session manager
 * was open - while the search overlay, a plain div on the body, passed them
 * through. `Cmd+Shift+M` duplicated a session in one and not the other.
 *
 * The bindings come from Obsidian rather than from the defaults the registry
 * declares, so a rebound command keeps working. The fixture hands out one key
 * per command so a test can tell which handler fired.
 */
function scopeHandlers(modal: SessionManagerModalInstance): Map<string, (e: KeyboardEvent) => unknown> {
    return (modal as unknown as { scope: { handlers: Map<string, (e: KeyboardEvent) => unknown> } })
        .scope.handlers;
}

test('the commands whose subject is the current session reach the open modal', async () => {
    const { h, plugin, modal } = await openModal();
    try {
        const handlers = scopeHandlers(modal);
        assert.deepEqual([...handlers.keys()].sort(), [
            'Mod+Shift+A', 'Mod+Shift+Backspace', 'Mod+Shift+Comma',
            'Mod+Shift+Enter', 'Mod+Shift+L', 'Mod+Shift+M', 'Mod+Shift+O',
            'Mod+Shift+R', 'Mod+Shift+S',
        ], 'nine, including the next/previous the footer advertises');

        const evt = new h.dom.window.KeyboardEvent('keydown', { key: 'M' });
        handlers.get('Mod+Shift+M')?.(evt);
        assert.ok(plugin.calls.includes('duplicateCurrentSession'), 'the duplicate command ran');
    } finally {
        modal.close();
        h.restore();
    }
});

test('a command with no binding registers nothing', async () => {
    const { h, modal } = await openModal();
    try {
        // `manage-sessions` is not in the scoped set, so no key of its own can
        // appear however it is bound.
        assert.equal(scopeHandlers(modal).has('Mod+Shift+X'), false);
    } finally {
        modal.close();
        h.restore();
    }
});

/**
 * The footer renders the next-session hotkey, so the key has to do what the
 * footer says - and switch without leaving the modal, because the overlay those
 * commands normally open would land on top of the list being read.
 *
 * Before this the modal's own Enter handler took `Cmd+Shift+Enter` (it checked
 * the key and not the modifiers), so the advertised "next session" switched to
 * the *focused row* instead.
 */
test('the next-session hotkey switches inside the modal and moves the active row', async () => {
    const { h, plugin, modal } = await openModal();
    try {
        const handlers = scopeHandlers(modal);
        const evt = new h.dom.window.KeyboardEvent('keydown', { key: 'Enter', metaKey: true, shiftKey: true });
        handlers.get('Mod+Shift+Enter')?.(evt);

        assert.ok(plugin.calls.includes('switchRelativeImmediately:1'), 'it switched on the spot');
        // The redraw that moves the active row runs when the switch settles.
        await Promise.resolve();
        assert.ok(modal.contentEl.querySelector('.wpp-session-item'), 'and stayed open');
    } finally {
        modal.close();
        h.restore();
    }
});

test('Enter with a modifier is not the modal activating a control', async () => {
    const { h, plugin, modal } = await openModal();
    try {
        const rows = [...modal.contentEl.querySelectorAll<HTMLElement>('.wpp-session-item')];
        rows[1]?.querySelector<HTMLElement>('[data-action-key="load"]')?.focus();

        const doc = h.dom.document;
        doc.dispatchEvent(new h.dom.window.KeyboardEvent('keydown', {
            key: 'Enter', metaKey: true, shiftKey: true, bubbles: true,
        }));

        // onLoad goes to switchSession, which this fixture records by id.
        assert.deepEqual(plugin.switchedIds, [],
            'the focused row must not be loaded by a command hotkey');
    } finally {
        modal.close();
        h.restore();
    }
});
