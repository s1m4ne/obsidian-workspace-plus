// Loading and unloading the plugin has to survive its own lifecycle.
//
// onunload used to throw on its third statement - assigning to a getter-only
// accessor - and never reach flushPendingPersistence(), so unsaved work was lost
// on every disable, update and reload. Nothing caught it, because nothing in the
// suite had ever run either lifecycle method end to end. This does.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';

const harness = setupHarness();
const WorkspacePlusPlus = (await import('../src/main.js')).default as unknown as new (
    app: unknown,
    manifest: unknown,
) => {
    onload(): Promise<void>;
    onunload(): unknown;
    data: Record<string, unknown>;
    [key: string]: unknown;
};

function createApp(files: Record<string, string>): unknown {
    return {
        vault: {
            configDir: '.obsidian',
            adapter: {
                exists: async (p: string) => p in files || p.endsWith('/exports'),
                list: async () => ({ files: Object.keys(files), folders: [] }),
                read: async (p: string) => files[p] ?? '{}',
                write: async (p: string, raw: string) => { files[p] = raw; },
                mkdir: async () => {},
                remove: async () => {},
                rename: async () => {},
                stat: async () => ({ mtime: 1, size: 1 }),
            },
        },
        workspace: {
            getLayout: () => ({ pane: 'one' }),
            changeLayout: async () => {},
            on: () => ({}),
            onLayoutReady: (cb: () => void) => { cb(); },
            iterateRootLeaves: () => {},
            getActiveFile: () => null,
        },
        metadataCache: { on: () => ({}), getFileCache: () => null },
        keymap: {}, scope: {},
    };
}

async function loadPlugin(): Promise<InstanceType<typeof WorkspacePlusPlus>> {
    const files: Record<string, string> = {};
    const plugin = new WorkspacePlusPlus(createApp(files), {
        id: 'workspace-plus-plus',
        dir: '.obsidian/plugins/workspace-plus-plus',
    });
    await plugin.onload();
    return plugin;
}

test('onload brings the plugin up without throwing', async () => {
    const plugin = await loadPlugin();

    assert.ok(plugin.data, 'settings and sessions must be loaded');
    assert.equal(typeof plugin['statusBarEl'], 'object', 'the status bar must exist');
});

test('onunload runs to the end, so pending writes are flushed', async () => {
    const plugin = await loadPlugin();

    let flushed = false;
    const realFlush = plugin['flushPendingPersistence'] as () => unknown;
    plugin['flushPendingPersistence'] = function flush(this: unknown): unknown {
        flushed = true;
        return realFlush.call(this);
    };

    // The bug this guards: onunload threw partway and never got here.
    await plugin.onunload();

    assert.equal(flushed, true, 'onunload must reach flushPendingPersistence');
});

test.after(() => harness.restore());
