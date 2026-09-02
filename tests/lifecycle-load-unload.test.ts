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
const WorkspacePlusPlus = (await import('../src/main.ts')).default as unknown as new (
    app: unknown,
    manifest: unknown,
) => {
    onload(): Promise<void>;
    onunload(): unknown;
    data: Record<string, unknown>;
    [key: string]: unknown;
};

type WorkspaceHandlers = Record<string, (() => void) | undefined>;

function createApp(files: Record<string, string>, handlers: WorkspaceHandlers = {}): unknown {
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
            // Recorded so a test can fire the same event Obsidian would.
            on: (name: string, handler: () => void) => { handlers[name] = handler; return {}; },
            onLayoutReady: (cb: () => void) => { cb(); },
            iterateRootLeaves: () => {},
            getActiveFile: () => null,
        },
        metadataCache: { on: () => ({}), getFileCache: () => null },
        keymap: {}, scope: {},
    };
}

async function loadPlugin(
    handlers: WorkspaceHandlers = {},
): Promise<InstanceType<typeof WorkspacePlusPlus>> {
    const files: Record<string, string> = {};
    const plugin = new WorkspacePlusPlus(createApp(files, handlers), {
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

test('onload registers the settings tab and the commands', async () => {
    const plugin = await loadPlugin();

    // Neither is optional: without addSettingTab the plugin has no settings
    // screen at all, and without registerCommands every hotkey is dead.
    assert.ok(plugin['settingTab'], 'the tab is constructed');
    assert.ok(
        harness.obsidian.log.entries().some((entry) => entry.method === 'addSettingTab'),
        'and handed to Obsidian',
    );
    // A static command, not a per-session one: syncSessionCommands() also fills
    // this map during onLayoutReady, so counting entries proves nothing about
    // registerCommands having run.
    assert.ok(
        harness.obsidian.commands.has('save-current-layout-to-session'),
        'the static commands are registered',
    );
});

test('onload leaves every status-bar click slot filled in', async () => {
    const plugin = await loadPlugin();

    // Only what is actually guaranteed. main.ts also holds a carry-over from the
    // two booleans these twelve slots replaced, and that branch cannot currently
    // be reached - see the comment on migrateLegacyStatusBarSettings. Asserting
    // the carry-over here would pass on the defaults and prove nothing.
    const actions = plugin.data['statusBarActions'] as Record<string, string> | undefined;
    assert.ok(actions, 'the slots exist after load');
    for (const slot of ['click', 'modClick', 'rightClick', 'modRightClick', 'middleClick']) {
        assert.equal(typeof actions[slot], 'string', `slot ${slot} has an action`);
    }
});

test('the status bar is not redrawn while a switch is still moving leaves', async () => {
    const handlers: WorkspaceHandlers = {};
    const plugin = await loadPlugin(handlers);

    const onActiveLeafChange = handlers['active-leaf-change'];
    assert.equal(typeof onActiveLeafChange, 'function', 'onload must subscribe to active-leaf-change');

    // One switch fires this many times. Redrawing on each would show every
    // intermediate session name on the way.
    //
    // isSwitching is a getter with no setter, so the switcher is replaced rather
    // than poked - assigning to it throws, which is the point of that accessor.
    let switching = true;
    plugin['getSessionSwitcher'] = (): { isSwitching: boolean } => ({ get isSwitching() { return switching; } });
    // The redraw goes through the controller now, so the count is taken there
    // rather than on a plugin forwarder that nothing consults.
    let redraws = 0;
    plugin['getStatusBarController'] = (): { updateStatusBar(): void } => ({
        updateStatusBar: (): void => { redraws += 1; },
    });

    onActiveLeafChange?.();
    await new Promise((resolve) => setTimeout(resolve, 5));
    assert.equal(redraws, 0, 'nothing is redrawn mid-switch');

    switching = false;
    onActiveLeafChange?.();
    await new Promise((resolve) => setTimeout(resolve, 5));
    assert.equal(redraws, 1, 'and exactly one redraw once it settles');
});

test('onunload clears the scroll counters through the controller', async () => {
    const plugin = await loadPlugin();

    let cleared = false;
    const controller = (plugin['getStatusBarController'] as () => { resetScrollState(): void })();
    const realReset = controller.resetScrollState.bind(controller);
    controller.resetScrollState = (): void => { cleared = true; realReset(); };

    await plugin.onunload();

    // Assigning to the mirrored counters throws in the strict bundle, which is
    // why this goes through the controller - and why it has to actually happen.
    assert.equal(cleared, true);
});

test.after(() => harness.restore());
