import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';
import { registry } from './lock/harness/obsidian-module.ts';
import type { App } from 'obsidian';

const harness = setupHarness();
const mockApp = harness.dom.window.document as unknown as App;

const {
    openCreateGroupPrompt,
    attachGroupTabDrag,
    renderGroupTabs,
    openAllGroupsTabContextMenu,
    openGroupTabContextMenu,
} = await import('../src/group-tab-ui.ts');

function createMockPlugin() {
    const calls: string[] = [];
    const plugin = {
        // Session state goes through getSessionStore(); this double carries
        // those members itself, so it stands in as its own store.
        getSessionStore(): never { return this as never; },
        app: mockApp,
        data: {
            groups: {
                g1: { id: 'g1', name: 'Work' },
                g2: { id: 'g2', name: 'Study' },
            },
            groupOrder: ['g1', 'g2'],
            sessions: {
                s1: { id: 's1', name: 'Session 1', layout: {} },
                s2: { id: 's2', name: 'Session 2', layout: {} },
            },
        },
        getOrderedGroupTabIds() {
            return ['__all__', 'g1', 'g2'];
        },
        // Group calls go through getGroupStore(). This double carries the group
        // members itself, so it stands in as its own group store.
        getGroupStore(): never { return this as never; },
        getOrderedGroups() {
            return [{ id: 'g1', name: 'Work' }, { id: 'g2', name: 'Study' }];
        },
        getGroupSessionIds(groupId: string) {
            return groupId === 'g1' ? ['s1'] : [];
        },
        createGroupValidated: async (name: string) => {
            calls.push(`createGroup:${name}`);
            return true;
        },
        renameGroupValidated: async (id: string, name: string) => {
            calls.push(`renameGroup:${id}:${name}`);
            return true;
        },
        clearAllGroups: async () => {
            calls.push('clearAllGroups');
            return true;
        },
        deleteAllInactiveSessions: async () => {
            calls.push('deleteAllInactiveSessions');
            return 1;
        },
        removeAllSessionsFromGroup: async (id: string) => {
            calls.push(`removeAllFromGroup:${id}`);
            return true;
        },
        deleteGroup: async (id: string) => {
            calls.push(`deleteGroup:${id}`);
            return true;
        },
    };
    return { plugin, calls };
}

test('creating a group from the prompt adds it and reports a duplicate name', async () => {
    const { plugin, calls } = createMockPlugin();
    let createdCalled = false;

    openCreateGroupPrompt(mockApp, plugin, () => { createdCalled = true; });
    const doc = harness.dom.window.document;
    const renameInput = doc.querySelector('.wpp-rename-input') as HTMLInputElement;
    if (renameInput) {
        renameInput.value = 'New Group';
        doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter' }));
    }
    await new Promise((r) => setTimeout(r, 10));
    assert.ok(calls.includes('createGroup:New Group'));
    assert.equal(createdCalled, true);
});

test('the tab strip renders one tab per group, marks the active one, and offers add', () => {
    const { plugin } = createMockPlugin();
    const containerEl = document.createElement('div');
    let selectedGroup: string | null = 'not_called';
    let reordered: string[] | null = null;
    let groupsChanged = false;

    renderGroupTabs({
        plugin,
        app: mockApp,
        containerEl,
        selectedGroupId: 'g1',
        stopPropagationOnMouseDown: true,
        addButtonTooltip: 'Create Group',
        onSelectGroup: (gid) => { selectedGroup = gid; },
        onGroupOrderCommit: (order) => { reordered = order; },
        onGroupsChanged: () => { groupsChanged = true; },
    });

    const tabs = containerEl.querySelectorAll('.wpp-group-tab');
    assert.equal(tabs.length, 3); // __all__, g1, g2
    assert.equal(tabs[0]?.classList.contains('is-active'), false);
    assert.equal(tabs[1]?.classList.contains('is-active'), true);
    assert.equal(tabs[2]?.classList.contains('is-active'), false);

    // Click all tab
    (tabs[0] as HTMLElement).click();
    assert.equal(selectedGroup, null);

    // Click g2 tab
    (tabs[2] as HTMLElement).click();
    assert.equal(selectedGroup, 'g2');

    // Click default add button (invokes openCreateGroupPrompt)
    const addBtn = containerEl.querySelector('.wpp-group-add-btn') as HTMLElement;
    assert.ok(addBtn);
    addBtn.click();

    // Context menu on allTab and groupTab
    const e = new window.MouseEvent('contextmenu');
    tabs[0]?.dispatchEvent(e);
    tabs[1]?.dispatchEvent(e);

    assert.equal(reordered, null);
    assert.equal(groupsChanged, false);
});

test('dragging a tab past a sibling reorders the strip', () => {
    const containerEl = document.createElement('div');
    const tab1 = document.createElement('div');
    tab1.className = 'wpp-group-tab';
    tab1.dataset['groupId'] = 'g1';
    const tab2 = document.createElement('div');
    tab2.className = 'wpp-group-tab';
    tab2.dataset['groupId'] = 'g2';
    const addBtn = document.createElement('div');
    addBtn.className = 'wpp-group-add-btn';

    containerEl.appendChild(tab1);
    containerEl.appendChild(tab2);
    containerEl.appendChild(addBtn);

    let committedOrder: string[] = [];
    attachGroupTabDrag(tab1, containerEl, {
        stopPropagationOnMouseDown: true,
        onCommit: (order) => { committedOrder = order; },
    });

    // Mousedown
    tab1.dispatchEvent(new window.MouseEvent('mousedown', { button: 0, clientX: 10 }));

    // Mousemove small delta (no drag yet)
    document.dispatchEvent(new window.MouseEvent('mousemove', { clientX: 12 }));

    // Mousemove large delta (initiates drag)
    document.dispatchEvent(new window.MouseEvent('mousemove', { clientX: 50 }));

    // Mousemove further to trigger reordering
    document.dispatchEvent(new window.MouseEvent('mousemove', { clientX: 150 }));

    // Mouseup
    document.dispatchEvent(new window.MouseEvent('mouseup', { clientX: 150 }));

    assert.ok(committedOrder.length > 0);
});

test('the tab context menus offer rename, delete and clearing group membership', async () => {
    const { plugin, calls } = createMockPlugin();
    let resetView = false;
    let groupsChanged = false;
    let sessionsChanged = false;
    let deleteGroupGid = '';

    openAllGroupsTabContextMenu({
        plugin,
        app: mockApp,
        onResetViewGroup: () => { resetView = true; },
        onGroupsChanged: () => { groupsChanged = true; },
        onSessionsChanged: () => { sessionsChanged = true; },
        event: new window.MouseEvent('contextmenu'),
    });

    const allMenu = registry.menus[registry.menus.length - 1];
    assert.ok(allMenu);
    assert.ok(allMenu.items.length >= 3);

    // 1. create new group
    allMenu.items[0]?.trigger();

    // 2. delete all groups
    allMenu.items[1]?.trigger();
    const doc = harness.dom.window.document;
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter' }));
    await new Promise((r) => setTimeout(r, 10));
    assert.ok(calls.includes('clearAllGroups'));
    assert.equal(resetView, true);
    assert.equal(groupsChanged, true);
    assert.equal(sessionsChanged, true);

    // 3. delete all sessions
    allMenu.items[2]?.trigger();
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter' }));
    await new Promise((r) => setTimeout(r, 10));
    assert.ok(calls.includes('deleteAllInactiveSessions'));

    // Group tab context menu
    openGroupTabContextMenu({
        plugin,
        app: mockApp,
        group: { id: 'g1', name: 'Work' },
        onDeleteGroup: (gid) => { deleteGroupGid = gid; },
        onGroupsChanged: () => { groupsChanged = true; },
        onSessionsChanged: () => { sessionsChanged = true; },
        event: new window.MouseEvent('contextmenu'),
    });

    const groupMenu = registry.menus[registry.menus.length - 1];
    assert.ok(groupMenu);
    assert.ok(groupMenu.items.length >= 3);

    // Rename
    groupMenu.items[0]?.trigger();
    const renameInputs = doc.querySelectorAll('.wpp-rename-input');
    const renameInput = renameInputs[renameInputs.length - 1] as HTMLInputElement;
    if (renameInput) {
        renameInput.value = 'Work Renamed';
        doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter' }));
    }
    await new Promise((r) => setTimeout(r, 10));
    assert.ok(calls.includes('renameGroup:g1:Work Renamed'));

    // Remove all sessions from group
    groupMenu.items[1]?.trigger();
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter' }));
    await new Promise((r) => setTimeout(r, 10));
    assert.ok(calls.includes('removeAllFromGroup:g1'));

    // Delete group
    groupMenu.items[2]?.trigger();
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter' }));
    await new Promise((r) => setTimeout(r, 10));
    assert.ok(calls.includes('deleteGroup:g1'));
    assert.equal(deleteGroupGid, 'g1');
});

test.after(() => harness.restore());
