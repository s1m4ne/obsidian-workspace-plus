// Builds the real plugin class for the production-wiring tests.
//
// Those tests exist to prove the plugin's own wiring reaches Obsidian rather
// than a test double. Attaching the adapters to a mock, which is what they used
// to do, cannot prove that: the mock carries a copy of the wiring, so the copy
// could pass while the plugin's own wiring was broken. That is the failure this
// group of tests was written to catch, so they build the real class.
//
// onload() is deliberately not run. It reads data from disk, registers events
// and starts timers; a wiring test wants none of that, only the lazily built
// collaborators and whatever fields the path under test reads.

const WorkspacePlusPlus = (await import('../src/main.ts')).default as unknown as new (
    app: unknown,
    manifest: { id: string; dir: string },
) => RealPlugin;

export interface RealPlugin {
    data: Record<string, unknown>;
    [key: string]: unknown;
}

export interface RealPluginOptions {
    /** Whatever of Obsidian's App the path under test reaches. */
    app?: Record<string, unknown>;
    /** Set on the instance instead of being loaded from disk. */
    data?: Record<string, unknown>;
}

export function createRealPlugin(options: RealPluginOptions = {}): RealPlugin {
    const app = Object.assign({
        vault: { configDir: '.obsidian', adapter: {} },
        workspace: {},
        metadataCache: { on: () => ({}), getFileCache: () => null },
        keymap: {},
        scope: {},
    }, options.app || {});

    const plugin = new WorkspacePlusPlus(app, {
        id: 'workspace-plus-plus',
        dir: '.obsidian/plugins/workspace-plus-plus',
    });
    plugin.data = options.data || {};
    return plugin;
}
