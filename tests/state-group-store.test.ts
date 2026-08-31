import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';
import { DEFAULT_DATA, type PluginData, type SessionItem } from '../src/storage/default-data.ts';
import type { GroupStoreHost } from '../src/state/group-store.ts';

const harness = setupHarness();
const { GroupStore, normalizeGroupTabOrder } = await import('../src/state/group-store.ts');

function createMockHost(initialData?: Partial<PluginData>): {
    host: GroupStoreHost;
    events: {
        persists: number;
        statusBarUpdates: number;
        commandSyncs: number;
        switchOverlayHides: number;
        searchOverlayHides: number;
        switchedSessionId: string | null;
    };
} {
    const events = {
        persists: 0,
        statusBarUpdates: 0,
        commandSyncs: 0,
        switchOverlayHides: 0,
        searchOverlayHides: 0,
        switchedSessionId: null as string | null,
    };

    const host: GroupStoreHost = {
        // Reads the same data object the real SettingsState reads, so a test that
        // flips a setting sees the effect instead of a frozen answer.
        settingsState: {
            get groupFeatureEnabled(): boolean {
                return (host.data as Record<string, unknown>)['groupFeatureEnabled'] !== false;
            },
            get versionHistoryConfirmRestore(): boolean {
                return (host.data as Record<string, unknown>)['versionHistoryConfirmRestore'] !== false;
            },
        } as unknown as import('../src/state/settings-state.ts').SettingsState,
        data: Object.assign({}, DEFAULT_DATA, {
            groupFeatureEnabled: true,
            groups: {
                g1: { id: 'g1', name: 'Group 1' },
                g2: { id: 'g2', name: 'Group 2' },
            },
            groupOrder: ['__all__', 'g1', 'g2'],
            sessionGroups: {
                s1: ['g1'],
                s2: ['g2'],
            },
            sessions: {
                s1: { id: 's1', name: 'Session 1', layout: {} },
                s2: { id: 's2', name: 'Session 2', layout: {} },
            },
            sessionOrder: ['s1', 's2'],
            activeSessionId: 's1',
            activeGroupId: 'g1',
        }, initialData || {}),
        persistData: async () => {
            events.persists += 1;
            return true;
        },
        updateStatusBar: () => {
            events.statusBarUpdates += 1;
        },
        syncSessionCommands: () => {
            events.commandSyncs += 1;
        },
        hideSwitchOverlay: () => {
            events.switchOverlayHides += 1;
        },
        hideSearchOverlay: () => {
            events.searchOverlayHides += 1;
        },
        switchSession: async (sid: string) => {
            events.switchedSessionId = sid;
            host.data.activeSessionId = sid;
            return true;
        },
        getOrderedSessionsUnfiltered: () => {
            return (host.data.sessionOrder || []).map((id) => host.data.sessions[id]).filter((s): s is SessionItem => !!s);
        },
        getOrderedSessionsForGroup: (groupId: string | null) => {
            const all = (host.data.sessionOrder || []).map((id) => host.data.sessions[id]).filter((s): s is SessionItem => !!s);
            if (!groupId) return all;
            return all.filter((s) => host.data.sessionGroups?.[s.id]?.includes(groupId));
        },
    };

    return { host, events };
}

test('normalizeGroupTabOrder: pure order resolution with __all__ preservation', () => {
    const groups = {
        g1: { id: 'g1', name: 'G1' },
        g2: { id: 'g2', name: 'G2' },
    };

    assert.deepEqual(normalizeGroupTabOrder(['g2', 'missing', '__all__', 'g1'], groups), ['g2', '__all__', 'g1']);
    assert.deepEqual(normalizeGroupTabOrder([], groups), ['__all__', 'g1', 'g2']);
});

test('GroupStore: container reference reactivity on reassignment (P1)', () => {
    let currentData: PluginData = Object.assign({}, DEFAULT_DATA, {
        groupFeatureEnabled: true,
        groups: { g1: { id: 'g1', name: 'First' } },
        groupOrder: ['__all__', 'g1'],
    });

    const { host: template } = createMockHost();
    const manager = new GroupStore(() => Object.assign({}, template, { data: currentData }));

    assert.equal(manager.getOrderedGroups().length, 1);
    assert.equal(manager.getOrderedGroups()[0]?.name, 'First');

    // External data reassignment (e.g. sync from another device)
    currentData = Object.assign({}, DEFAULT_DATA, {
        groupFeatureEnabled: true,
        groups: { g2: { id: 'g2', name: 'Second' } },
        groupOrder: ['__all__', 'g2'],
    });

    assert.equal(manager.getOrderedGroups().length, 1);
    assert.equal(manager.getOrderedGroups()[0]?.name, 'Second');
});

test('GroupStore: CRUD, active group, and session membership', async () => {
    const { host, events } = createMockHost();
    const manager = new GroupStore(host);

    // Create group
    const newGid = await manager.createGroup('Group 3');
    assert.ok(host.data.groups[newGid]);
    assert.equal(host.data.groups[newGid]?.name, 'Group 3');
    assert.equal(events.persists, 1);

    // Rename group
    await manager.renameGroup(newGid, 'Group 3 Renamed');
    assert.equal(host.data.groups[newGid]?.name, 'Group 3 Renamed');

    // Add session to group
    await manager.addSessionToGroup('s1', newGid);
    assert.ok(manager.getGroupSessionIds(newGid).includes('s1'));

    // Move session exclusive
    await manager.moveSessionToGroupExclusive('s1', 'g2');
    assert.deepEqual(host.data.sessionGroups.s1, ['g2']);

    // Set active group and switch session
    const switched = await manager.setActiveGroup('g2');
    assert.equal(switched, true);
    assert.equal(host.data.activeGroupId, 'g2');

    // Delete group
    await manager.deleteGroup(newGid);
    assert.equal(host.data.groups[newGid], undefined);

    // Disable feature
    await manager.setGroupFeatureEnabled(false);
    assert.equal(manager.isGroupFeatureEnabled(), false);
    assert.equal(host.data.activeGroupId, null);
    assert.equal(events.switchOverlayHides, 1);
    assert.equal(events.searchOverlayHides, 1);
});

test('GroupStore: validated creation and rename with notices and duplicate guards', async () => {
    const { host } = createMockHost();
    const manager = new GroupStore(host);

    // Empty name with default notify creates a Notice
    const initialNotices = harness.obsidian.notices.length;
    const emptyResult = await manager.createGroupValidated('   ');
    assert.equal(emptyResult, false);
    assert.equal(harness.obsidian.notices.length, initialNotices + 1);

    // Empty name with notify: false suppresses Notice
    const noticeCountBefore = harness.obsidian.notices.length;
    const emptyNoNotice = await manager.createGroupValidated('   ', { notify: false });
    assert.equal(emptyNoNotice, false);
    assert.equal(harness.obsidian.notices.length, noticeCountBefore);

    // Duplicate name rejected
    const dupResult = await manager.createGroupValidated('Group 1');
    assert.equal(dupResult, false);
    assert.equal(harness.obsidian.notices.length, noticeCountBefore + 1);

    // Valid creation
    const createdId = await manager.createGroupValidated('Group 3', { notify: false });
    assert.ok(typeof createdId === 'string' && createdId.length > 0);
    assert.equal(host.data.groups[createdId]?.name, 'Group 3');

    // Rename: missing group
    const missingGroupRename = await manager.renameGroupValidated('nonexistent', 'New Name');
    assert.equal(missingGroupRename, false);

    // Rename: empty name rejected
    const emptyRename = await manager.renameGroupValidated(createdId, '   ');
    assert.equal(emptyRename, false);

    // Rename: same name returns false without notice
    const sameRename = await manager.renameGroupValidated(createdId, 'Group 3');
    assert.equal(sameRename, false);

    // Rename: duplicate name rejected
    const dupRename = await manager.renameGroupValidated(createdId, 'Group 1');
    assert.equal(dupRename, false);

    // Rename: valid
    const validRename = await manager.renameGroupValidated(createdId, 'Group 3 Renamed', { notify: false });
    assert.equal(validRename, true);
    assert.equal(host.data.groups[createdId]?.name, 'Group 3 Renamed');

    harness.restore();
});
