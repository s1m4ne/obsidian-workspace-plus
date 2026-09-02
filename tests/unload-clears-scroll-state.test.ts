// Unloading the plugin must reach flushPendingPersistence.
//
// onunload cleared three scroll counters by assigning to them. Once
// StatusBarController owned that state, the plugin exposed them as getter-only
// accessors - and the bundle is strict, so assigning to a getter throws. The
// throw left onunload before flushPendingPersistence(), so anything not yet
// written to disk was lost every time the plugin was disabled or updated.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';
import { DEFAULT_DATA } from '../src/storage/default-data.ts';
import type { StatusBarControllerHost } from '../src/statusbar-controller.ts';

const harness = setupHarness();

async function createController(): Promise<import('../src/statusbar-controller.ts').StatusBarController> {
    const { StatusBarController } = await import('../src/statusbar-controller.ts');
    const host = {
        data: Object.assign({}, DEFAULT_DATA, { sessions: {}, sessionOrder: [], groups: {}, groupOrder: [], sessionGroups: {}, activeSessionId: null, activeGroupId: null }),
        addStatusBarItem: (): HTMLElement => harness.dom.document.createElement('div'),
        getActiveSession: () => null,
        getActiveGroup: () => null,
        shouldShowUnsavedStatusBarHighlight: () => false,
        switchRelativeFromStatusBar: async () => true,
    };
    return new StatusBarController(host as unknown as StatusBarControllerHost);
}

test('the scroll counters are cleared through the controller, not by assignment', async () => {
    const controller = await createController();

    // What onunload does. Assigning to plugin.statusBarScrollDelta instead would
    // throw here, because the prototype exposes it as a getter only.
    assert.doesNotThrow(() => {
        controller.resetScrollState();
    });
    assert.equal(controller.scrollDelta, 0);
});

// The test that used to sit here defined a getter-only property on a plain
// object and asserted that assigning to it throws - JavaScript's own behaviour
// rather than this plugin's, and it referred to a mirror that no longer exists.
// check:readonly is the live guard: it finds every prototype accessor with a
// getter and no setter, then every assignment to one, and zero is the only
// acceptable count.

test.after(() => harness.restore());
