// A failure while capturing the outgoing layout must not end switching.
//
// performSwitch does its first work synchronously: it records the outgoing
// layout into history and reads it from the workspace. Either call can throw.
// While performSwitch was a plain function returning a promise, that throw left
// the function before runSwitchRequest had a promise to attach to, so its
// .then, .catch and .finally never ran - isSwitchingSession stayed true and the
// queue was never drained. Every later hotkey press was swallowed: the plugin
// looked frozen with no message, and only a reload brought switching back.
//
// This is an authorized exception to the behaviour lock: the old behaviour left
// the plugin unusable, so the switcher now treats a capture failure like any
// other failed switch - report false, clear the lock, run whatever is queued.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';

const harness = setupHarness();
const { SessionSwitcher } = await import('../src/state/session-switcher.ts');

interface Switcher {
    switchSession(id: string): Promise<boolean>;
    readonly isSwitching: boolean;
}

function session(id: string): { id: string; name: string; layout: unknown; modified: number } {
    return { id, name: id.toUpperCase(), layout: { pane: id }, modified: 1 };
}

function createSwitcher(captureFails: () => boolean): { switcher: Switcher; data: Record<string, unknown> } {
    const data: Record<string, unknown> = {
        activeSessionId: 'a',
        sessions: { a: session('a'), b: session('b') },
        sessionOrder: ['a', 'b'],
        groups: {}, groupOrder: [], sessionGroups: {}, activeGroupId: null,
        previewNext: false,
    };
    const ordered = [session('a'), session('b')];

    const readLayout = (): unknown => {
        if (captureFails()) throw new Error('workspace refused to report its layout');
        return {};
    };

    const host = {
        data,
        app: { workspace: { getLayout: (): unknown => ({}), changeLayout: async (): Promise<boolean> => true } },
        getOrderedSessions: (): unknown[] => ordered,
        findSessionIndex: (list: { id: string }[], id: string): number => list.findIndex((s) => s.id === id),
        getActiveSession: (): unknown => (data['sessions'] as Record<string, unknown>)['a'],
        getCurrentWorkspaceLayout: readLayout,
        // CAPTURE is the saver's now, and reading the workspace is the part of
        // it that throws - so the double has to read it here, or the failure
        // this file exists for stops happening.
        commitWorkspaceToSession: (target: { layout: unknown; modified: number }): boolean => {
            target.layout = readLayout();
            target.modified = Date.now();
            return true;
        },
        changeWorkspaceLayout: async (): Promise<boolean> => true,
        persistData: async (): Promise<boolean> => true,
        saveActiveSession: async (): Promise<boolean> => true,
        isActiveSessionDirty: (): boolean => false,
        isWarnOnUnsavedSwitchEnabled: (): boolean => false,
        isAutoSaveOnSwitchEnabled: (): boolean => true,
        updateStatusBar: (): void => {},
    };

    const Ctor = SessionSwitcher as unknown as new (h: unknown) => Switcher;
    return { switcher: new Ctor(host), data };
}

const SETTLED = Symbol('settled');

async function withinDeadline(promise: Promise<boolean>, ms: number): Promise<boolean | typeof SETTLED> {
    const timeout = new Promise<typeof SETTLED>((resolve) => {
        setTimeout(() => resolve(SETTLED), ms);
    });
    return Promise.race([promise, timeout]);
}

test('a failed layout capture reports failure instead of hanging', async () => {
    const { switcher } = createSwitcher(() => true);

    const result = await withinDeadline(switcher.switchSession('b'), 500);

    assert.notEqual(result, SETTLED, 'the switch must settle rather than hang');
    assert.equal(result, false, 'and it must report that it did not switch');
});

test('switching still works after a failed layout capture', async () => {
    let failing = true;
    const { switcher, data } = createSwitcher(() => failing);

    await switcher.switchSession('b');
    failing = false;

    // Before this was fixed the throw escaped runSwitchRequest, so the lock it
    // set was never released and this second switch never resolved.
    const second = await withinDeadline(switcher.switchSession('b'), 500);

    assert.notEqual(second, SETTLED, 'the switcher must not stay locked');
    assert.equal(data['activeSessionId'], 'b', 'and the switch must actually take effect');
});

test.after(() => harness.restore());
