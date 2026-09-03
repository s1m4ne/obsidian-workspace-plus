// Importing a snapshot has to reach the screen, not just the data.
//
// Before this, import replaced data.sessions and stopped. The workspace kept
// showing the pre-import layout while the data held the imported one, and the
// first session switch wrote the screen back over the import - auto-save on
// switch captures the current layout before leaving. So the active session in a
// restored snapshot was lost by the very action a user takes to check whether
// the import worked, with no message and no obvious way back.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';
import type { PluginData, SessionItem } from '../src/storage/default-data.ts';
import type { SessionDataPayload } from '../src/storage/storage-backup.ts';

const EXPORT_DIR = '.obsidian/plugins/workspace-plus-plus/exports';
const EXPORT_FILE = `${EXPORT_DIR}/sessions-20260101-000000.json`;

type Layout = { readonly pane: string };

interface TestHost {
    data: PluginData;
    appliedLayouts: Layout[];
    app: { vault: { adapter: { read: (p: string) => Promise<string> } } };
    importSessionsFromLatestExport(): Promise<boolean>;
}

function snapshot(layout: Layout): string {
    return JSON.stringify({
        exportedAt: 1,
        source: 'workspace-plus-plus',
        data: {
            activeSessionId: 'a',
            sessions: { a: { id: 'a', name: 'A', layout, modified: 1 } },
            sessionOrder: ['a'],
            groups: {},
            groupOrder: [],
            sessionGroups: {},
            activeGroupId: null,
        },
    });
}


// The old fixture handed the import an identity function, so nothing narrowed
// the parsed snapshot. Typed here as a guard rather than a cast: it passes
// through exactly the fields the import path reads, and returns an empty
// payload for anything that is not a record - which is what makes the
// corrupted-snapshot test fail the import rather than throw.
function toSessionDataPayload(raw: unknown): SessionDataPayload {
    if (raw === null || typeof raw !== 'object') return {};
    const record: Record<string, unknown> = { ...raw };
    const out: SessionDataPayload = {};
    if (typeof record.activeSessionId === 'string') out.activeSessionId = record.activeSessionId;
    if (isSessionMap(record.sessions)) out.sessions = record.sessions;
    if (isStringArray(record.sessionOrder)) out.sessionOrder = record.sessionOrder;
    if (isStringArray(record.groupOrder)) out.groupOrder = record.groupOrder;
    if (record.activeGroupId === null || typeof record.activeGroupId === 'string') {
        out.activeGroupId = record.activeGroupId;
    }
    return out;
}

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isSessionMap(value: unknown): value is Record<string, SessionItem> {
    if (value === null || typeof value !== 'object') return false;
    return Object.values(value).every((entry) => (
        entry !== null && typeof entry === 'object' && typeof (entry as { id?: unknown }).id === 'string'
    ));
}

async function createHost(onScreen: Layout, exported: Layout): Promise<TestHost> {
    const [transfer, sessionStorageMod, saverMod, jsonStoreMod] = await Promise.all([
        import('../src/storage/storage-transfer.ts'),
        import('../src/storage/session-storage.ts'),
        import('../src/state/session-saver.ts'),
        import('../src/storage/json-file-store.ts'),
    ]);
    const { DEFAULT_DATA } = await import('../src/storage/default-data.ts');

    const files: Record<string, string> = { [EXPORT_FILE]: snapshot(exported) };
    const appliedLayouts: Layout[] = [];

    const adapter = {
        exists: (p: string) => Promise.resolve(p === EXPORT_DIR || p in files),
        list: () => Promise.resolve({ files: Object.keys(files), folders: [] }),
        read: (p: string) => Promise.resolve(files[p] ?? ''),
        write: (p: string, raw: string) => { files[p] = raw; return Promise.resolve(); },
        mkdir: () => Promise.resolve(),
        stat: () => Promise.resolve({ mtime: 1 }),
        remove: (p: string) => { delete files[p]; return Promise.resolve(); },
        rename: (from: string, to: string) => {
            const raw = files[from];
            if (raw !== undefined) { files[to] = raw; delete files[from]; }
            return Promise.resolve();
        },
    };

    const data: PluginData = Object.assign({}, DEFAULT_DATA, {
        activeSessionId: 'a',
        sessions: { a: { id: 'a', name: 'A', layout: onScreen, modified: 9 } },
        sessionOrder: ['a'],
        groups: {}, groupOrder: [], sessionGroups: {}, activeGroupId: null,
    });

    const sessionStorage = new sessionStorageMod.SessionStorage({
        store: new jsonStoreMod.JsonFileStore(() => adapter),
        manifestDir: '.obsidian/plugins/workspace-plus-plus',
        configDir: '.obsidian',
    });

    const getActiveSession = (): SessionItem | null => {
        const id = data.activeSessionId;
        return (id && data.sessions[id]) || null;
    };
    const applyWorkspaceLayout = (layout: unknown): Promise<boolean> => {
        appliedLayouts.push(layout as Layout);
        return Promise.resolve(true);
    };

    // The real saver, so the layout the import applies travels the path a
    // running plugin uses rather than a stub standing in for it.
    const saver = new saverMod.SessionSaver({
        data,
        getActiveSession,
        getCurrentWorkspaceLayout: () => onScreen,
        layoutsEqualStructural: () => false,
        getDefaultSessionName: () => 'A',
        pushLayoutToHistory: () => {},
        persistData: () => Promise.resolve(true),
        createSessionRecord: (id: string, name: string, layout: unknown) => ({ id, name, layout }),
        insertSessionAndActivate: () => {},
        getOrderedSessionsUnfiltered: () => [],
        getOrderedGroupTabIds: () => [],
        isGroupFeatureEnabled: () => false,
        applyWorkspaceLayout,
    });

    const host = {
        app: { vault: { adapter } },
        data,
        appliedLayouts,
        getExportDirPath: () => sessionStorage.getExportDirPath(),
        normalizeSessionData: toSessionDataPayload,
        normalizeGroupTabOrder: (order: string[]) => order,
        syncSessionOrder: () => {},
        updateStatusBar: () => {},
        syncSessionCommands: () => {},
        persistData: () => Promise.resolve(true),
        reloadCurrentSessionWithoutSaving: (options?: { silent?: boolean }) =>
            saver.reloadCurrentSessionWithoutSaving(options),
        importSessionsFromLatestExport: (): Promise<boolean> =>
            transfer.importSessionsFromLatestExport(host),
    };

    return host;
}

test('importing a snapshot applies the imported layout to the workspace', async () => {
    const harness = setupHarness();
    try {
        const host = await createHost({ pane: 'two' }, { pane: 'one' });

        const imported = await host.importSessionsFromLatestExport();
        assert.equal(imported, true, 'the import itself must succeed');

        assert.deepEqual(host.data.sessions.a?.layout, { pane: 'one' }, 'data holds the imported layout');

        // The point of the fix: the screen follows the data.
        assert.deepEqual(
            host.appliedLayouts,
            [{ pane: 'one' }],
            'the imported layout must be applied to the workspace exactly once',
        );
    } finally {
        harness.restore();
    }
});

test('a failed import leaves the workspace untouched', async () => {
    const harness = setupHarness();
    try {
        const host = await createHost({ pane: 'two' }, { pane: 'one' });
        // Replace the snapshot with something that is not session data.
        host.app.vault.adapter.read = (): Promise<string> => Promise.resolve(JSON.stringify({ nothing: true }));

        const imported = await host.importSessionsFromLatestExport();
        assert.equal(imported, false);
        assert.deepEqual(host.appliedLayouts, [], 'nothing is applied when the import is rejected');

        // Corrupted JSON syntax error handling
        host.app.vault.adapter.read = (): Promise<string> => Promise.resolve('{ invalid json syntax');
        const importedCorrupted = await host.importSessionsFromLatestExport();
        assert.equal(importedCorrupted, false);
    } finally {
        harness.restore();
    }
});
