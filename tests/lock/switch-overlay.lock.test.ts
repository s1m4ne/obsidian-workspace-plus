// Behavior Lock: Switch Overlay & Rapid Relative Switching
//
// Protects the #107 regression fix and switch overlay semantics.
//
// Exercised exclusively through command execution (h.runCommand('next-session'))
// and observing outcomes on persisted / active state and DOM overlays.
//
// RULE: Behavior Lock tests in tests/lock/ are NEVER edited during the refactor.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers';
import { setupHarness } from './harness/index.ts';
import { Plugin, registry } from './harness/obsidian-module.ts';

interface TestSwitchPlugin {
    data: {
        activeSessionId: string;
        sessionOrder: string[];
        sessions: Record<string, { id: string; name: string; layout?: unknown }>;
        groups: Record<string, { id: string; name: string }>;
        groupOrder: string[];
        sessionGroups: Record<string, string>;
        activeGroupId: string | null;
        groupFeatureEnabled: boolean;
        previewNext: boolean;
        previewPrevious: boolean;
        numberedSwitchCommands: boolean;
        showActiveSwitchCommand: boolean;
        [key: string]: unknown;
    };
    app: {
        workspace: {
            containerEl: HTMLElement;
        };
    };
    isSwitchingSession: boolean;
    pendingSwitchRequest: unknown;
    pendingSwitchTargetId: string | null;
    switchLockAt: number;
    appliedLayouts: unknown[];
    pendingLayoutResolvers: Array<() => void>;
    overlayIndexes: number[];
    isGroupFeatureEnabled(): boolean;
    getStartupSettleRemainingMs(): number;
    isAutoSaveOnSwitchEnabled(): boolean;
    isWarnOnUnsavedSwitchEnabled(): boolean;
    isActiveSessionDirty(): boolean;
    pushLayoutToHistory(): void;
    getCurrentWorkspaceLayout(): unknown;
    updateStatusBar(): void;
    persistData(): Promise<void>;
    applyWorkspaceLayout(layout: unknown): Promise<void>;
    releaseLayouts(): Promise<void>;
    showSwitchPreviewOverlay(ordered: unknown[], index: number): void;
    addCommand(cmd: unknown): void;
    [key: string]: unknown;
}

async function createSwitchLockPlugin(
    harness: ReturnType<typeof setupHarness>,
    options: { names?: string[]; preview?: boolean; activeSessionId?: string } = {},
): Promise<TestSwitchPlugin> {
    const i18nMod = await import('../../src/i18n.ts');
    const i18n = (i18nMod.default ?? i18nMod) as { resolveLocale(l: string): void };
    i18n.resolveLocale('en');

    const sessionsMod = await import('../../src/plugin/methods/sessions.js');
    const attachSessions = (sessionsMod.default ?? sessionsMod) as (cls: unknown) => void;

    const switchingMod = await import('../../src/plugin/methods/session-switching.js');
    const attachSwitching = (switchingMod.default ?? switchingMod) as (cls: unknown) => void;

    const registerCmdsMod = await import('../../src/plugin/register-commands.js');
    const registerCommands = (registerCmdsMod.default ?? registerCmdsMod) as (p: unknown) => void;

    function PluginMock() {}
    attachSessions(PluginMock);
    attachSwitching(PluginMock);

    const plugin = new (PluginMock as unknown as { new(): TestSwitchPlugin })();
    const names = options.names || ['a', 'b', 'c', 'd'];
    const sessions: Record<string, { id: string; name: string; layout?: unknown }> = {};
    const sessionOrder: string[] = [];

    for (const name of names) {
        sessions[name] = { id: name, name: `Session ${name.toUpperCase()}`, layout: { root: name } };
        sessionOrder.push(name);
    }

    plugin.data = {
        sessions,
        sessionOrder,
        activeSessionId: options.activeSessionId || names[0]!,
        groups: {},
        groupOrder: [],
        sessionGroups: {},
        activeGroupId: null,
        groupFeatureEnabled: false,
        previewNext: options.preview ?? false,
        previewPrevious: options.preview ?? false,
        numberedSwitchCommands: false,
        showActiveSwitchCommand: false,
    };

    plugin.app = {
        workspace: {
            containerEl: harness.dom.container(),
        },
    };

    plugin.isSwitchingSession = false;
    plugin.pendingSwitchRequest = null;
    plugin.pendingSwitchTargetId = null;
    plugin.switchLockAt = 0;
    plugin.appliedLayouts = [];
    plugin.pendingLayoutResolvers = [];
    plugin.overlayIndexes = [];

    plugin.isGroupFeatureEnabled = (): boolean => false;
    plugin.getStartupSettleRemainingMs = (): number => 0;
    plugin.isAutoSaveOnSwitchEnabled = (): boolean => false;
    plugin.isWarnOnUnsavedSwitchEnabled = (): boolean => false;
    plugin.isActiveSessionDirty = (): boolean => false;
    plugin.pushLayoutToHistory = (): void => {};
    plugin.getCurrentWorkspaceLayout = (): unknown => ({ root: 'current' });
    plugin.updateStatusBar = (): void => {};
    plugin.persistData = (): Promise<void> => Promise.resolve();

    plugin.showSwitchPreviewOverlay = (_ordered: unknown[], index: number): void => {
        plugin.overlayIndexes.push(index);
    };
    plugin.showSwitchFeedbackOverlay = (): void => {};

    plugin.applyWorkspaceLayout = (layout: unknown): Promise<void> => {
        plugin.appliedLayouts.push(layout);
        return new Promise<void>((resolve) => {
            plugin.pendingLayoutResolvers.push(resolve);
        });
    };

    plugin.releaseLayouts = (): Promise<void> => {
        const resolvers = plugin.pendingLayoutResolvers;
        plugin.pendingLayoutResolvers = [];
        for (const resolve of resolvers) resolve();
        return new Promise<void>((resolve) => { setImmediate(resolve); });
    };

    plugin.addCommand = (cmd: unknown): void => {
        Plugin.prototype.addCommand.call(plugin, cmd as Parameters<typeof Plugin.prototype.addCommand>[0]);
    };

    registerCommands(plugin);
    return plugin;
}

test('three rapid next-session hotkey commands advance three sessions (#107 protection)', async () => {
    const h = setupHarness();
    try {
        const plugin = await createSwitchLockPlugin(h, {
            names: ['a', 'b', 'c', 'd'],
            preview: false,
            activeSessionId: 'a',
        });

        // 1st press: initiates switch to 'b' (in flight)
        h.runCommand('next-session');
        assert.equal(plugin.appliedLayouts.length, 1);
        assert.deepEqual(plugin.appliedLayouts[0], { root: 'b' });

        // 2nd and 3rd presses while 1st is still in flight
        h.runCommand('next-session');
        h.runCommand('next-session');

        // Layout shouldn't have applied 2nd or 3rd prematurely
        assert.equal(plugin.appliedLayouts.length, 1);

        // Complete the in-flight layout
        await plugin.releaseLayouts();

        // All 3 presses should have queued and applied final target 'd'
        assert.equal(plugin.appliedLayouts.length, 2);
        assert.deepEqual(plugin.appliedLayouts[1], { root: 'd' });

        await plugin.releaseLayouts();
        assert.equal(plugin.data.activeSessionId, 'd');
    } finally {
        h.restore();
    }
});

test('previous-session command navigates backwards and wraps around', async () => {
    const h = setupHarness();
    try {
        const plugin = await createSwitchLockPlugin(h, {
            names: ['a', 'b', 'c', 'd'],
            preview: false,
            activeSessionId: 'a',
        });

        // 'a' -> previous wraps to 'd'
        h.runCommand('previous-session');
        await plugin.releaseLayouts();
        assert.equal(plugin.data.activeSessionId, 'd');

        // 'd' -> previous to 'c'
        h.runCommand('previous-session');
        await plugin.releaseLayouts();
        assert.equal(plugin.data.activeSessionId, 'c');
    } finally {
        h.restore();
    }
});

test('switching stays responsive when active session is outside the current group view', async () => {
    const h = setupHarness();
    try {
        const plugin = await createSwitchLockPlugin(h, {
            names: ['s1', 's2', 's3'],
            preview: false,
            activeSessionId: 'orphan-session',
        });

        // activeSessionId is not in sessionOrder ['s1', 's2', 's3']
        // Pressing next-session must advance to first session 's1' instead of crashing or getting stuck
        h.runCommand('next-session');
        await plugin.releaseLayouts();

        assert.equal(plugin.data.activeSessionId, 's1');
    } finally {
        h.restore();
    }
});

test('previewNext default mode opens preview overlay on first hotkey press', async () => {
    const h = setupHarness();
    try {
        const plugin = await createSwitchLockPlugin(h, {
            names: ['a', 'b', 'c'],
            preview: true,
            activeSessionId: 'a',
        });

        // 1st press with previewNext: true and no open overlay opens overlay at current session index (0)
        h.runCommand('next-session');
        assert.equal(plugin.appliedLayouts.length, 0, 'First press must only preview without applying layout');
        assert.equal(plugin.overlayIndexes.length, 1);
        assert.equal(plugin.overlayIndexes[0], 0, 'Preview points to current session index (0)');

        // When overlay is open, next press advances to next session
        plugin.switchOverlayEl = h.dom.container();
        h.runCommand('next-session');
        assert.equal(plugin.appliedLayouts.length, 1, 'Subsequent press applies layout with overlay open');
        assert.deepEqual(plugin.appliedLayouts[0], { root: 'b' });
    } finally {
        h.restore();
    }
});

test('numbered switch commands respect checkCallback and switch to target index', async () => {
    const h = setupHarness();
    try {
        const plugin = await createSwitchLockPlugin(h, {
            names: ['s1', 's2', 's3'],
            preview: false,
            activeSessionId: 's1',
        });
        plugin.data.numberedSwitchCommands = true;

        const registerCmdsMod = await import('../../src/plugin/register-commands.js');
        const registerCommands = (registerCmdsMod.default ?? registerCmdsMod) as (p: unknown) => void;
        registerCommands(plugin);

        // switch-to-1 is current session, checkCallback returns false when showActiveSwitchCommand is false
        const cmd1 = registry.commands.get('switch-to-1');
        assert.ok(cmd1);
        assert.equal(cmd1.checkCallback?.(true), false);

        // switch-to-2 is not active session, checkCallback returns true
        const cmd2 = registry.commands.get('switch-to-2');
        assert.ok(cmd2);
        assert.equal(cmd2.checkCallback?.(true), true);

        // Run switch-to-2
        h.runCommand('switch-to-2');
        await plugin.releaseLayouts();
        assert.equal(plugin.data.activeSessionId, 's2');
    } finally {
        h.restore();
    }
});

test('registers and triggers session commands through command registry', async () => {
    const h = setupHarness();
    try {
        const plugin = await createSwitchLockPlugin(h, {
            names: ['s1', 's2'],
            preview: false,
            activeSessionId: 's1',
        });

        let saved = false;
        let reloaded = false;
        let toggled = false;
        let createdEmpty = false;
        let duplicated = false;
        let renamed = false;
        let deleted = false;

        plugin.saveActiveSession = (): void => { saved = true; };
        plugin.reloadCurrentSessionWithoutSaving = (): void => { reloaded = true; };
        plugin.toggleAutoSaveOnSwitch = (): void => { toggled = true; };
        plugin.createEmptySession = (): void => { createdEmpty = true; };
        plugin.duplicateCurrentSession = (): void => { duplicated = true; };
        plugin.renameCurrentSession = (): void => { renamed = true; };
        plugin.deleteCurrentSession = (): void => { deleted = true; };

        const registerCmdsMod = await import('../../src/plugin/register-commands.js');
        const registerCommands = (registerCmdsMod.default ?? registerCmdsMod) as (p: unknown) => void;
        registerCommands(plugin);

        h.runCommand('save-current-session');
        assert.equal(saved, true);

        h.runCommand('reload-current-session-without-saving');
        assert.equal(reloaded, true);

        h.runCommand('toggle-auto-save-on-switch');
        assert.equal(toggled, true);

        h.runCommand('new-empty-session');
        assert.equal(createdEmpty, true);

        h.runCommand('duplicate-session');
        assert.equal(duplicated, true);

        h.runCommand('rename-session');
        assert.equal(renamed, true);

        h.runCommand('delete-session');
        assert.equal(deleted, true);
    } finally {
        h.restore();
    }
});
