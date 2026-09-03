import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';
import { DEFAULT_DATA, type PluginData } from '../src/storage/default-data.ts';
import type { SettingsStateHost } from '../src/state/settings-state.ts';

const harness = setupHarness();
const { SettingsState } = await import('../src/state/settings-state.ts');

function createMockHost(initialData?: Partial<PluginData>): {
    host: SettingsStateHost;
    events: {
        persists: number;
        statusBarUpdates: number;
        commandSyncs: number;
        historyStarts: number;
        historyStops: number;
    };
} {
    const events = {
        persists: 0,
        statusBarUpdates: 0,
        commandSyncs: 0,
        historyStarts: 0,
        historyStops: 0,
    };

    const host: SettingsStateHost = {
        data: Object.assign({}, DEFAULT_DATA, initialData || {}),
        persistData: async () => {
            events.persists += 1;
            return true;
        },
        updateStatusBar: () => {
            events.statusBarUpdates += 1;
        },
        syncSessionCommands: () => {
            events.commandSyncs += 1;
        },
        startHistorySnapshotTimer: () => {
            events.historyStarts += 1;
        },
        stopHistorySnapshotTimer: () => {
            events.historyStops += 1;
        },
    };

    return { host, events };
}

test('SettingsState: default fallback resolution for all settings (P5)', () => {
    const rawData = {} as PluginData;
    const host: SettingsStateHost = {
        data: rawData,
        persistData: async () => true,
    };

    const state = new SettingsState(host);

    assert.equal(state.language, DEFAULT_DATA.language);
    assert.deepEqual(state.statusBarActions, DEFAULT_DATA.statusBarActions);
    assert.equal(state.warnOnUnsavedSwitch, DEFAULT_DATA.warnOnUnsavedSwitch);
    assert.equal(state.highlightUnsavedSessionChanges, DEFAULT_DATA.highlightUnsavedSessionChanges);
    assert.equal(state.confirmQuickActions, DEFAULT_DATA.confirmQuickActions);
    assert.equal(state.restoreSidebars, DEFAULT_DATA.restoreSidebars);
    assert.equal(state.statusBarModScrollSwitch, DEFAULT_DATA.statusBarModScrollSwitch);
    assert.equal(state.statusBarScrollPreset, DEFAULT_DATA.statusBarScrollPreset);
    assert.equal(state.statusBarScrollModifierMode, DEFAULT_DATA.statusBarScrollModifierMode);
    assert.equal(state.statusBarScrollThreshold, DEFAULT_DATA.statusBarScrollThreshold);
    assert.equal(state.statusBarScrollCooldownMs, DEFAULT_DATA.statusBarScrollCooldownMs);
    assert.equal(state.statusBarScrollResetMs, DEFAULT_DATA.statusBarScrollResetMs);
    assert.equal(state.statusBarScrollInvert, DEFAULT_DATA.statusBarScrollInvert);
    assert.equal(state.showActiveSwitchCommand, DEFAULT_DATA.showActiveSwitchCommand);
    assert.equal(state.numberedSwitchCommands, DEFAULT_DATA.numberedSwitchCommands);
    assert.equal(state.previewNext, DEFAULT_DATA.previewNext);
    assert.equal(state.previewPrevious, DEFAULT_DATA.previewPrevious);
    assert.equal(state.showFilterInput, DEFAULT_DATA.showFilterInput);
    assert.equal(state.confirmDeleteByHotkey, DEFAULT_DATA.confirmDeleteByHotkey);
    assert.equal(state.versionHistoryEnabled, DEFAULT_DATA.versionHistoryEnabled);
    assert.equal(state.versionHistorySnapshotInterval, DEFAULT_DATA.versionHistorySnapshotInterval);
    assert.equal(state.versionHistoryConfirmRestore, DEFAULT_DATA.versionHistoryConfirmRestore);
    assert.equal(state.groupFeatureEnabled, DEFAULT_DATA.groupFeatureEnabled);
});

test('SettingsState: container reference reads live reassigned data slice (P1)', () => {
    let currentData = Object.assign({}, DEFAULT_DATA, { language: 'en' });
    const state = new SettingsState(() => ({
        data: currentData,
        persistData: async () => true,
    }));

    assert.equal(state.language, 'en');

    // Simulate external data replacement (sync or reset)
    currentData = Object.assign({}, DEFAULT_DATA, { language: 'fr' });
    assert.equal(state.language, 'fr');
});

test('SettingsState: setters update data, trigger callbacks, and support persist option', async () => {
    const { host, events } = createMockHost();
    const state = new SettingsState(host);

    await state.setLanguageSetting('de', { persist: false });
    assert.equal(state.language, 'de');
    assert.equal(events.persists, 0);

    await state.setStatusBarAction('click', 'sessionManager');
    assert.equal(state.statusBarActions.click, 'sessionManager');
    assert.equal(events.persists, 1);

    await state.setUnsavedStatusBarHighlight(false);
    assert.equal(state.highlightUnsavedSessionChanges, false);
    assert.equal(events.statusBarUpdates, 1);

    await state.setNumberedSwitchCommands(false);
    assert.equal(state.numberedSwitchCommands, false);
    assert.equal(events.commandSyncs, 1);

    await state.setVersionHistoryEnabled(false);
    assert.equal(state.versionHistoryEnabled, false);
    assert.equal(events.historyStops, 1);

    await state.setVersionHistoryEnabled(true);
    assert.equal(state.versionHistoryEnabled, true);
    assert.equal(events.historyStarts, 1);

    await state.setVersionHistorySnapshotInterval('15');
    assert.equal(state.versionHistorySnapshotInterval, 15);
    assert.equal(events.historyStarts, 2);

    await state.setSwitchPreviewEnabled(false);
    assert.equal(state.previewNext, false);
    assert.equal(state.previewPrevious, false);

    harness.restore();
});
