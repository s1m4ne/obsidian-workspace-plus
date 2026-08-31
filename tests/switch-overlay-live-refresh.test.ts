// The overlay follows the session set while it is held open (issue #118).
//
// Cmd+Shift+Enter opens the switch overlay, and holding Cmd+Shift keeps it up by
// design. Commands still fire under it: Cmd+Shift+M duplicates a session,
// Cmd+Shift+Backspace deletes one. Both really happened - the status bar updated
// - but the overlay went on showing the list it was given when it opened, and
// the only way to see the change was to let go and press the hotkey again.
//
// The overlay now subscribes to SessionStore while it is visible, so one
// notification covers every command that changes the set. Adding an eighth such
// command needs no change here, which is the point: the seven that exist today
// would each have had to remember to refresh.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';

const harness = setupHarness();
const { SwitchOverlay } = await import('../src/ui/overlays/switch-overlay.ts');

type Session = { id: string; name: string; layout?: unknown };

interface Overlay {
    show(ordered: Session[], activeIndex: number, viewGroupId?: string | null): void;
    hide(): void;
    refreshSessions(): void;
    overlayEl: HTMLElement | null;
}

function visibleNames(overlay: Overlay): string[] {
    const el = overlay.overlayEl;
    if (!el) return [];
    return Array.from(el.querySelectorAll('.wpp-switch-name')).map((n) => n.textContent ?? '');
}

function createOverlay(): { overlay: Overlay; sessions: Session[]; announce: () => void } {
    let sessions: Session[] = [
        { id: 's1', name: 'One' },
        { id: 's2', name: 'Two' },
    ];
    const listeners = new Set<() => void>();

    const host = {
        data: { activeSessionId: 's1', activeGroupId: null, groups: {} },
        isGroupFeatureEnabled: (): boolean => false,
        getOrderedGroups: (): Array<{ id: string; name: string }> => [],
        getOrderedGroupTabIds: (): string[] => [],
        getOrderedSessionsUnfiltered: (): Session[] => sessions,
        getOrderedSessionsForGroup: (): Session[] => sessions,
        getCommandHotkey: (): string => '',
        findActiveSessionIndex: (list: Session[]): number => list.findIndex((s) => s.id === host.data.activeSessionId),
        resolveGroupSelection: async (): Promise<{ sessions: Session[]; resolvedGroupId: string | null }> => ({
            sessions,
            resolvedGroupId: null,
        }),
        switchSession: async (): Promise<boolean> => true,
        getRelativeGroupId: (): undefined => undefined,
        onSessionsChanged: (listener: () => void): (() => void) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
    };

    const Ctor = SwitchOverlay as unknown as new (h: unknown) => Overlay;
    return {
        overlay: new Ctor(host),
        sessions,
        announce: (): void => {
            for (const l of [...listeners]) l();
        },
    };
}

test('a session created under the held overlay appears in it at once', () => {
    const { overlay, sessions, announce } = createOverlay();
    overlay.show(sessions, 0);
    assert.deepEqual(visibleNames(overlay), ['One', 'Two']);

    // What Cmd+Shift+M does, without letting go of the modifiers.
    sessions.push({ id: 's3', name: 'Three' });
    announce();

    assert.deepEqual(
        visibleNames(overlay),
        ['One', 'Two', 'Three'],
        'the new session must be visible without releasing and pressing again',
    );
    overlay.hide();
});

test('a session deleted under the held overlay disappears from it at once', () => {
    const { overlay, sessions, announce } = createOverlay();
    overlay.show(sessions, 0);

    // What Cmd+Shift+Backspace does.
    sessions.splice(1, 1);
    announce();

    assert.deepEqual(visibleNames(overlay), ['One']);
    overlay.hide();
});

test('nothing is redrawn, and nothing listens, once the overlay is closed', () => {
    const { overlay, sessions, announce } = createOverlay();
    overlay.show(sessions, 0);
    overlay.hide();

    sessions.push({ id: 's9', name: 'Nine' });
    announce();

    assert.equal(overlay.overlayEl, null, 'a closed overlay must not come back on a notification');
});

test.after(() => harness.restore());

test('a redraw does not restart the minimum-visibility clock', async () => {
    const { overlay, sessions, announce } = createOverlay();
    overlay.show(sessions, 0);

    // Sit with the overlay open past the 300 ms floor, then change the set. If
    // the redraw reset the clock, releasing now would hold the overlay for
    // another 300 ms - the overlay would appear to stick after every command.
    await new Promise((resolve) => setTimeout(resolve, 320));
    sessions.push({ id: 's3', name: 'Three' });
    announce();

    harness.dom.document.dispatchEvent(
        new harness.dom.window.KeyboardEvent('keyup', { key: 'Meta', metaKey: false, shiftKey: false })
    );

    assert.equal(overlay.overlayEl, null, 'releasing after the floor has passed closes it immediately');
});
