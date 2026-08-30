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

const EXPORT_DIR = '.obsidian/plugins/workspace-plus-plus/exports';
const EXPORT_FILE = `${EXPORT_DIR}/sessions-20260101-000000.json`;

type Layout = { readonly pane: string };

interface TestPlugin {
    data: Record<string, unknown>;
    appliedLayouts: Layout[];
    importSessionsFromLatestExport(): Promise<boolean>;
    reloadCurrentSessionWithoutSaving(options?: { silent?: boolean }): Promise<boolean>;
    [key: string]: unknown;
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

async function createPlugin(onScreen: Layout, exported: Layout): Promise<TestPlugin> {
    const modules = await Promise.all([
        import('../src/plugin/methods/persistence.js'),
        import('../src/plugin/methods/sessions.js'),
        import('../src/plugin/methods/session-saving.js'),
        import('../src/plugin/methods/storage-transfer.js'),
        import('../src/plugin/methods/layout-restore.js'),
    ]);

    function PluginMock(this: unknown) {}
    for (const mod of modules) {
        const attach = ((mod as { default?: unknown }).default ?? mod) as (target: unknown) => void;
        attach(PluginMock);
    }

    const files: Record<string, string> = { [EXPORT_FILE]: snapshot(exported) };
    const plugin = new (PluginMock as unknown as new () => TestPlugin)();

    plugin.manifest = { id: 'workspace-plus-plus', dir: '.obsidian/plugins/workspace-plus-plus' };
    plugin.data = {
        activeSessionId: 'a',
        sessions: { a: { id: 'a', name: 'A', layout: onScreen, modified: 9 } },
        sessionOrder: ['a'],
        groups: {}, groupOrder: [], sessionGroups: {}, activeGroupId: null,
    };
    plugin.appliedLayouts = [];

    plugin.app = {
        vault: {
            configDir: '.obsidian',
            adapter: {
                exists: (p: string) => Promise.resolve(p === EXPORT_DIR || p in files),
                list: () => Promise.resolve({ files: Object.keys(files), folders: [] }),
                read: (p: string) => Promise.resolve(files[p] ?? ''),
                write: (p: string, raw: string) => { files[p] = raw; return Promise.resolve(); },
                mkdir: () => Promise.resolve(),
                stat: () => Promise.resolve({ mtime: 1 }),
            },
        },
        workspace: {
            // Records what the plugin asks the workspace to display.
            changeLayout: (layout: Layout) => { plugin.appliedLayouts.push(layout); return Promise.resolve(); },
            getLayout: () => onScreen,
        },
    };

    plugin.updateStatusBar = (): void => {};
    plugin.syncSessionCommands = (): void => {};
    plugin.persistData = (): Promise<void> => Promise.resolve();
    plugin.normalizeGroupTabOrder = (order: unknown): unknown => order ?? [];

    return plugin;
}

test('importing a snapshot applies the imported layout to the workspace', async () => {
    const harness = setupHarness();
    try {
        const plugin = await createPlugin({ pane: 'two' }, { pane: 'one' });

        const imported = await plugin.importSessionsFromLatestExport();
        assert.equal(imported, true, 'the import itself must succeed');

        const sessions = plugin.data.sessions as Record<string, { layout: Layout }>;
        assert.deepEqual(sessions.a?.layout, { pane: 'one' }, 'data holds the imported layout');

        // The point of the fix: the screen follows the data.
        assert.deepEqual(
            plugin.appliedLayouts,
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
        const plugin = await createPlugin({ pane: 'two' }, { pane: 'one' });
        // Replace the snapshot with something that is not session data.
        const app = plugin.app as { vault: { adapter: { read: (p: string) => Promise<string> } } };
        app.vault.adapter.read = (): Promise<string> => Promise.resolve(JSON.stringify({ nothing: true }));

        const imported = await plugin.importSessionsFromLatestExport();
        assert.equal(imported, false);
        assert.deepEqual(plugin.appliedLayouts, [], 'nothing is applied when the import is rejected');
    } finally {
        harness.restore();
    }
});
