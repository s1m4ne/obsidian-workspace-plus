// Entry point for the lock suite: installs a jsdom document and points the
// `obsidian` specifier at recording stubs, then hands back the registry so a
// lock can assert on what the plugin built and invoke the handlers it wired.
//
// Resolution goes through module.registerHooks, which intercepts both
// `require()` and `import`. The plugin is CommonJS today and becomes ESM during
// the migration; a lock written now has to survive that without being edited.
//
// Consequence for every lock: load the code under test *dynamically*, after
// calling setupHarness(). A static `import` is resolved while the module graph
// links, which happens before any function body runs, so the hooks would not
// be installed yet and the real `obsidian` package - which ships types only,
// with no runtime entry - would fail to resolve.

import { registerHooks } from 'node:module';
import { setupDom } from './dom.ts';
import type { DomHarness } from './dom.ts';
import { registry, resetRegistry, runCommand } from './obsidian-module.ts';
import type { Registry } from './obsidian-module.ts';

export * from './obsidian-stub.ts';
export type { DomHarness } from './dom.ts';
export type { Registry } from './obsidian-module.ts';

const OBSIDIAN_STUB_URL = new URL('./obsidian-module.ts', import.meta.url).href;
let hooksInstalled = false;

// Registered once per process: hooks cannot be removed, and re-registering
// would stack them. Which document the stubs render into is swapped per test
// through the registry instead.
function installHooksOnce(): void {
    if (hooksInstalled) return;
    hooksInstalled = true;
    registerHooks({
        resolve(specifier, context, next) {
            if (specifier === 'obsidian') {
                return { url: OBSIDIAN_STUB_URL, shortCircuit: true };
            }
            return next(specifier, context);
        },
    });
}

export interface Harness {
    readonly dom: DomHarness;
    readonly obsidian: Registry;
    /** Trigger a registered command the way a hotkey would. Locks use this
     *  rather than calling a plugin method, which would not survive the
     *  migration. */
    runCommand(id: string): unknown;
    restore(): void;
}

export function setupHarness(): Harness {
    installHooksOnce();
    const dom = setupDom();
    resetRegistry(dom.document);

    return {
        dom,
        obsidian: registry,
        runCommand,
        restore(): void {
            dom.restore();
        },
    };
}
