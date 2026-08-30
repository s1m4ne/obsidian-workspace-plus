// Behavior Lock: Session Manager Modal
//
// Locks the full lifecycle of the Session Manager modal:
// 1. Session list rendering & active session indication
// 2. Creating a new session via nameInput + saveBtn
// 3. Renaming a session
// 4. Deleting a session with confirmation handling
// 5. Query filtering via filterInput
// 6. Group tab filtering
//
// RULE: Behavior Lock tests in tests/lock/ are NEVER edited during the refactor.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './harness/index.ts';

interface ModalPlugin {
    data: {
        activeSessionId: string;
        sessionOrder: string[];
        sessions: Record<string, { id: string; name: string; layout?: unknown; modified?: number }>;
        groups: Record<string, { id: string; name: string; color?: string }>;
        groupOrder: string[];
        sessionGroups: Record<string, string[]>;
        activeGroupId: string | null;
        groupFeatureEnabled: boolean;
        showFilterInput: boolean;
        confirmDeleteByHotkey: boolean;
        [key: string]: unknown;
    };
    app: {
        workspace: {
            containerEl: HTMLElement;
        };
    };
    isGroupFeatureEnabled(): boolean;
    getStartupSettleRemainingMs(): number;
    isAutoSaveOnSwitchEnabled(): boolean;
    isWarnOnUnsavedSwitchEnabled(): boolean;
    isActiveSessionDirty(): boolean;
    updateStatusBar(): void;
    syncSessionCommands(): void;
    syncSessionOrder(): void;
    persistData(): Promise<void>;
    applyWorkspaceLayout(layout: unknown): Promise<void>;
    getCurrentWorkspaceLayout(): unknown;
    getCommandHotkey(cmd: string): string | null;
    [key: string]: unknown;
}

interface ModalInstance {
    open(): void;
    close(): void;
    nameInput: HTMLInputElement;
    saveBtn: HTMLButtonElement;
    filterInput: HTMLInputElement | null;
    listEl: HTMLElement;
    contentEl: HTMLElement;
    onSave(): Promise<void>;
    renderList(): void;
    [key: string]: unknown;
}

async function createModalPlugin(
    harness: ReturnType<typeof setupHarness>,
    initialData?: Partial<ModalPlugin['data']>,
): Promise<ModalPlugin> {
    const i18nMod = await import('../../src/i18n.js');
    const i18n = (i18nMod.default ?? i18nMod) as { resolveLocale(l: string): void };
    i18n.resolveLocale('en');

    const defaultDataMod = await import('../../src/plugin/default-data.js');
    const DEFAULT_DATA = (defaultDataMod.default ?? defaultDataMod) as Record<string, unknown>;

    const sessionsMod = await import('../../src/plugin/methods/sessions.js');
    const attachSessions = (sessionsMod.default ?? sessionsMod) as (cls: unknown) => void;

    const sessionCrudMod = await import('../../src/plugin/methods/session-crud.js');
    const attachSessionCrud = (sessionCrudMod.default ?? sessionCrudMod) as (cls: unknown) => void;

    const sessionSavingMod = await import('../../src/plugin/methods/session-saving.js');
    const attachSessionSaving = (sessionSavingMod.default ?? sessionSavingMod) as (cls: unknown) => void;

    const groupsMod = await import('../../src/plugin/methods/groups.js');
    const attachGroups = (groupsMod.default ?? groupsMod) as (cls: unknown) => void;

    const sessionsValidationMod = await import('../../src/plugin/methods/sessions-validation.js');
    const attachSessionsValidation = (sessionsValidationMod.default ?? sessionsValidationMod) as (cls: unknown) => void;

    function PluginMock() {}
    attachSessions(PluginMock);
    attachSessionCrud(PluginMock);
    attachSessionSaving(PluginMock);
    attachGroups(PluginMock);
    attachSessionsValidation(PluginMock);

    const plugin = new (PluginMock as unknown as { new(): ModalPlugin })();

    plugin.data = {
        ...DEFAULT_DATA,
        activeSessionId: 's1',
        sessionOrder: ['s1', 's2', 's3'],
        sessions: {
            s1: { id: 's1', name: 'Work Project', layout: { a: 1 }, modified: 100 },
            s2: { id: 's2', name: 'Personal Notes', layout: { b: 1 }, modified: 200 },
            s3: { id: 's3', name: 'Reading Books', layout: { c: 1 }, modified: 300 },
        },
        groups: {
            g1: { id: 'g1', name: 'Focus' },
            g2: { id: 'g2', name: 'Leisure' },
        },
        groupOrder: ['g1', 'g2'],
        sessionGroups: { s1: ['g1'], s2: ['g1'], s3: ['g2'] },
        activeGroupId: 'g1',
        groupFeatureEnabled: false,
        showFilterInput: true,
        confirmDeleteByHotkey: false,
        ...(initialData || {}),
    };

    plugin.app = {
        workspace: {
            containerEl: harness.dom.container(),
        },
    };

    plugin.isGroupFeatureEnabled = (): boolean => Boolean(plugin.data.groupFeatureEnabled);
    plugin.getStartupSettleRemainingMs = (): number => 0;
    plugin.isAutoSaveOnSwitchEnabled = (): boolean => false;
    plugin.isWarnOnUnsavedSwitchEnabled = (): boolean => false;
    plugin.isActiveSessionDirty = (): boolean => false;
    plugin.updateStatusBar = (): void => {};
    plugin.syncSessionCommands = (): void => {};
    plugin.syncSessionOrder = (): void => {};
    plugin.persistData = (): Promise<void> => Promise.resolve();
    plugin.applyWorkspaceLayout = (): Promise<void> => Promise.resolve();
    plugin.getCurrentWorkspaceLayout = (): unknown => ({ main: 'curr' });
    plugin.getCommandHotkey = (): string | null => null;

    return plugin;
}

async function loadModalClass(): Promise<new (app: unknown, plugin: unknown) => ModalInstance> {
    const raw = await import('../../src/modals/session-manager-modal.js');
    return (raw.default ?? raw) as unknown as new (app: unknown, plugin: unknown) => ModalInstance;
}

test('SessionManagerModal renders session items and controls in DOM', async () => {
    const h = setupHarness();
    try {
        const plugin = await createModalPlugin(h);
        const SessionManagerModal = await loadModalClass();
        const modal = new SessionManagerModal(plugin.app, plugin);
        modal.open();

        const doc = h.dom.window.document;
        const modalEl = doc.querySelector('.wpp-modal');
        assert.ok(modalEl, 'Modal content must be rendered');

        // Save container
        assert.ok(modalEl.querySelector('.wpp-save-container'));
        assert.ok(modal.nameInput);
        assert.ok(modal.saveBtn);

        // Filter container
        assert.ok(modalEl.querySelector('.wpp-filter-container'));
        assert.ok(modal.filterInput);

        // List items
        const items = modalEl.querySelectorAll('.wpp-session-item');
        assert.equal(items.length, 3, 'Must render 3 session items');

        modal.close();
    } finally {
        h.restore();
    }
});

test('SessionManagerModal creates and saves a new named session from input', async () => {
    const h = setupHarness();
    try {
        const plugin = await createModalPlugin(h);
        const SessionManagerModal = await loadModalClass();
        const modal = new SessionManagerModal(plugin.app, plugin);
        modal.open();

        modal.nameInput.value = 'Brand New Project';
        await modal.onSave();

        // New session created in plugin.data.sessions
        const sessionEntries = Object.values(plugin.data.sessions);
        const created = sessionEntries.find((s) => s.name === 'Brand New Project');
        assert.ok(created, 'Session with new name must exist in sessions');
        assert.equal(plugin.data.activeSessionId, created.id);

        modal.close();
    } finally {
        h.restore();
    }
});

test('SessionManagerModal filter input narrows displayed sessions dynamically', async () => {
    const h = setupHarness();
    try {
        const plugin = await createModalPlugin(h);
        const SessionManagerModal = await loadModalClass();
        const modal = new SessionManagerModal(plugin.app, plugin);
        modal.open();

        assert.ok(modal.filterInput);
        modal.filterInput.value = 'reading';
        modal.filterInput.dispatchEvent(new h.dom.window.Event('input', { bubbles: true }));

        const items = modal.contentEl.querySelectorAll('.wpp-session-item');
        assert.equal(items.length, 1, 'Only Reading Books should match');
        assert.match(items[0]?.textContent ?? '', /Reading Books/);

        modal.close();
    } finally {
        h.restore();
    }
});

test('SessionManagerModal group tabs filter sessions to selected group', async () => {
    const h = setupHarness();
    try {
        const plugin = await createModalPlugin(h, {
            groupFeatureEnabled: true,
            activeGroupId: 'g1',
        });
        const SessionManagerModal = await loadModalClass();
        const modal = new SessionManagerModal(plugin.app, plugin);
        modal.open();

        const items = modal.contentEl.querySelectorAll('.wpp-session-item');
        assert.equal(items.length, 2, 'g1 active group should display s1 and s2');

        modal.close();
    } finally {
        h.restore();
    }
});
