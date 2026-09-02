import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';

/**
 * The paths that were dead in Obsidian while every gate was green.
 *
 * `asHost<T>()` was `return this as unknown as T`, so the plugin was asserted
 * into each host's shape rather than checked against it, and fourteen required
 * members had gone missing behind it. Five of those were user-facing:
 *
 *   openSearchOverlay           the status bar's left click did nothing
 *   openConfirmModal            restore-latest-history did nothing
 *   setSessionStorageLocation   the vault-only storage toggle did nothing
 *   restoreFromHistoryEntry     the version-history Restore button did nothing
 *   resetSessionsToDefault      the Reset sessions button did nothing
 *
 * check:host-conformance now fails if a required host member is not defined on
 * the plugin, and tsc checks the receiver at every asHost call site. These tests
 * cover what neither of those can see: that the member the plugin defines
 * reaches the class that owns the behaviour. A delegate pointed at the wrong
 * collaborator satisfies both the gate and the type checker.
 *
 * They drive the real plugin class, never a double. A double carrying its own
 * copy of the wiring is what let this ship - the copy passed while the plugin's
 * own wiring was missing entirely.
 */

const harness = setupHarness();
const { createRealPlugin } = await import('./real-plugin.ts');
import type { RealPlugin } from './real-plugin.ts';
const { DEFAULT_DATA } = await import('../src/storage/default-data.ts');
const i18n = await import('../src/i18n.ts');
i18n.resolveLocale('en');

// RealPlugin is already `{ data, [key: string]: unknown }`, which is what these
// tests need: they reach members the host interfaces declare rather than ones
// the class exposes narrowly.
function makePlugin(): RealPlugin {
    const plugin = createRealPlugin({
        app: {
            workspace: {
                containerEl: harness.dom.container(),
                getLayout: () => ({}),
                changeLayout: async () => undefined,
            },
        },
        data: Object.assign({}, DEFAULT_DATA, {
            activeSessionId: 's1',
            sessionOrder: ['s1'],
            sessions: {
                s1: { id: 's1', name: 'One', layout: {}, modified: 1, history: [{ savedAt: 1, layout: {} }] },
            },
            versionHistoryEnabled: true,
        }),
    });
    plugin.statusBarEl = harness.dom.document.createElement('div');
    plugin.searchOverlayEl = null;
    return plugin;
}

/** Replace one method on the collaborator the plugin actually built. */
function spyOn(owner: Record<string, unknown>, name: string, calls: string[]): void {
    owner[name] = (...args: unknown[]): unknown => {
        calls.push(`${name}(${args.map((a) => JSON.stringify(a) ?? 'undefined').join(', ')})`);
        return undefined;
    };
}

test('the status bar left click opens the search overlay', () => {
    const plugin = makePlugin();
    const el = harness.dom.document.createElement('div');
    plugin.addStatusBarItem = () => el;
    plugin.registerDomEvent = (
        target: HTMLElement, type: string, handler: EventListener, options?: boolean | AddEventListenerOptions,
    ): void => { target.addEventListener(type, handler, options); };

    const controller = (plugin.getStatusBarController as () => { setupStatusBar(): HTMLElement })();
    const item = controller.setupStatusBar();

    const calls: string[] = [];
    spyOn((plugin.getSearchOverlay as () => Record<string, unknown>)(), 'open', calls);

    // `click` with no modifier resolves to the `click` slot, whose default
    // action is quickSwitcher. That action called plugin.openSearchOverlay?.(),
    // which was absent, so the optional call made it a no-op.
    item.dispatchEvent(new harness.dom.window.MouseEvent('click', { bubbles: true, button: 0 }));

    assert.equal(calls.length, 1, `the search overlay was not opened; calls: ${calls.join(' | ')}`);
});

test('the plugin toggles the vault-only storage location through PersistenceService', async () => {
    const plugin = makePlugin();
    const calls: string[] = [];
    spyOn((plugin.getPersistenceService as () => Record<string, unknown>)(), 'setSessionStorageLocation', calls);

    await (plugin.setSessionStorageLocation as (l: string) => Promise<unknown>)('vault-folder');

    assert.deepEqual(calls, ['setSessionStorageLocation("vault-folder")']);
});

test('the plugin restores a history entry through HistoryService', async () => {
    const plugin = makePlugin();
    const calls: string[] = [];
    spyOn((plugin.getHistoryService as () => Record<string, unknown>)(), 'restoreFromHistoryEntry', calls);

    await (plugin.restoreFromHistoryEntry as (id: string, i: number) => Promise<unknown>)('s1', 0);

    assert.deepEqual(calls, ['restoreFromHistoryEntry("s1", 0)']);
});

test('the plugin resets sessions through SessionStore', async () => {
    const plugin = makePlugin();
    const calls: string[] = [];
    spyOn((plugin.getSessionStore as () => Record<string, unknown>)(), 'resetSessionsToDefault', calls);

    await (plugin.resetSessionsToDefault as () => Promise<unknown>)();

    assert.deepEqual(calls, ['resetSessionsToDefault()']);
});

test('the plugin puts a confirmation on screen, so restore-latest-history can ask', () => {
    const plugin = makePlugin();
    const before = harness.dom.document.querySelectorAll('.modal-container').length;

    let confirmed = false;
    (plugin.openConfirmModal as (m: string, c: () => void) => void)('Restore?', () => { confirmed = true; });

    const after = harness.dom.document.querySelectorAll('.modal-container').length;
    assert.equal(after, before + 1, 'no confirmation modal was opened');
    assert.equal(confirmed, false, 'the callback runs on confirm, not on open');
});

test('the plugin hides the search overlay through the overlay that owns it', () => {
    const plugin = makePlugin();
    const calls: string[] = [];
    spyOn((plugin.getSearchOverlay as () => Record<string, unknown>)(), 'hide', calls);

    (plugin.hideSearchOverlay as () => void)();

    assert.deepEqual(calls, ['hide()']);
});

test('the refresh half of the external-sync path reaches all five owners', () => {
    const plugin = makePlugin();
    const calls: string[] = [];
    spyOn((plugin.getSessionStore as () => Record<string, unknown>)(), 'syncSessionOrder', calls);
    spyOn((plugin.getSessionStore as () => Record<string, unknown>)(), 'notifySessionsChanged', calls);
    spyOn((plugin.getGroupStore as () => Record<string, unknown>)(), 'normalizeGroupFeatureState', calls);
    spyOn((plugin.getStatusBarController as () => Record<string, unknown>)(), 'updateStatusBar', calls);
    spyOn((plugin.getCommandRegistry as () => Record<string, unknown>)(), 'syncSessionCommands', calls);

    // reloadExternalSessionStorageIfChanged calls all five when another
    // device's data arrives (#105). All five were absent, so the data landed
    // and the screen kept showing the old state.
    (plugin.syncSessionOrder as () => void)();
    (plugin.notifySessionsChanged as () => void)();
    (plugin.normalizeGroupFeatureState as () => void)();
    (plugin.updateStatusBar as () => void)();
    (plugin.syncSessionCommands as () => void)();

    assert.deepEqual(calls, [
        'syncSessionOrder()',
        'notifySessionsChanged()',
        'normalizeGroupFeatureState()',
        'updateStatusBar()',
        'syncSessionCommands()',
    ]);
});

/**
 * The remaining delegates of the fourteen. Each one only has to reach the right
 * owner - that is the whole defect class - so one assertion per delegate is the
 * right size, and a delegate pointed at the wrong collaborator fails here.
 */
test('the rest of the restored delegates reach their owners', async () => {
    const plugin = makePlugin();
    const calls: string[] = [];

    spyOn((plugin.getSessionSwitcher as () => Record<string, unknown>)(), 'applyWorkspaceLayout', calls);
    spyOn((plugin.getSessionStore as () => Record<string, unknown>)(), 'getActiveSession', calls);
    spyOn((plugin.getSessionSaver as () => Record<string, unknown>)(), 'reloadCurrentSessionWithoutSaving', calls);

    // Through SessionSwitcher, not app.workspace.changeLayout: a restore has to
    // honour the sidebar scope. Pointing this at changeLayout would look
    // identical to every other check and quietly drop that.
    await (plugin.applyWorkspaceLayout as (l: unknown) => Promise<unknown>)({ layout: 1 });
    (plugin.getActiveSession as () => unknown)();
    await (plugin.reloadCurrentSessionWithoutSaving as () => Promise<unknown>)();

    assert.deepEqual(calls, [
        'applyWorkspaceLayout({"layout":1}, undefined)',
        'getActiveSession()',
        'reloadCurrentSessionWithoutSaving(undefined)',
    ]);
});

test.after(() => harness.restore());
