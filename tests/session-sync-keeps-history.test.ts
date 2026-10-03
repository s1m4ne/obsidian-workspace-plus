// Version history is local to a device: sessions.json is written without it and
// history.json beside it holds it. A reload of what another device wrote used
// to replace `data.sessions` with the history-free copy from disk, so every
// session's history vanished from memory and the next save wrote history.json
// as `{}`. On a phone and a desktop sharing a vault that meant the one record
// that could undo the other device's overwrite was deleted along with it.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';
import type { PluginData } from '../src/storage/default-data.ts';
import type { ApplySessionDataHost } from '../src/storage/session-sync.ts';
import type { SessionDataPayload } from '../src/storage/storage-backup.ts';

setupHarness();
const { applySessionDataFromStorage } = await import('../src/storage/session-sync.ts');

const HISTORY = [{ savedAt: 1, layout: { pane: 'earlier' } }];

function createHost(): ApplySessionDataHost {
    const data = {
        activeSessionId: 's1',
        sessions: { s1: { id: 's1', name: 'S1', layout: { pane: 'now' }, history: HISTORY } },
        sessionOrder: ['s1'],
        groups: {},
        groupOrder: [],
        sessionGroups: {},
        activeGroupId: null,
    } as unknown as PluginData;
    return {
        data,
        normalizeSessionData: (d) => d as SessionDataPayload,
        extractSessionData: (d) => d as Record<string, unknown>,
        syncSessionOrder: () => {},
        normalizeGroupFeatureState: () => {},
        updateStatusBar: () => {},
        syncSessionCommands: () => {},
        notifySessionsChanged: () => {},
        getSessionStore: (): never => { throw new Error('not reached without applyLayout'); },
        getSessionSwitcher: (): never => { throw new Error('not reached without applyLayout'); },
    };
}

test('a reload from another device keeps each session\'s version history', async () => {
    const host = createHost();

    await applySessionDataFromStorage(host, {
        activeSessionId: 's1',
        sessions: {
            s1: { id: 's1', name: 'S1', layout: { pane: 'from-the-other-device' } },
            s2: { id: 's2', name: 'S2', layout: { pane: 'new' } },
        },
        sessionOrder: ['s1', 's2'],
    });

    assert.deepEqual(host.data.sessions['s1']?.history, HISTORY, 'the session that arrived keeps its history');
    assert.equal(host.data.sessions['s2']?.history, undefined, 'a session new to this device has none to keep');
});
