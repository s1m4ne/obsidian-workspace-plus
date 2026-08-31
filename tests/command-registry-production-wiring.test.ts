// CommandRegistry reaches production wiring and syncs session commands.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';
import { DEFAULT_DATA } from '../src/storage/default-data.ts';

const harness = setupHarness();

interface TestPlugin {
    data: Record<string, unknown>;
    commands: Map<string, unknown>;
    addCommand(cmd: { id: string; name: string }): void;
    removeCommand(id: string): void;
    getCommandRegistry(): {
        registerCommands(): void;
        syncSessionCommands(): void;
    };
    syncSessionCommands(): void;
    registerCommands(): void;
    [key: string]: unknown;
}

async function createPlugin(): Promise<TestPlugin> {
    const modules = await Promise.all([
        import('../src/plugin/methods/session-commands.js'),
        import('../src/plugin/methods/sessions.js'),
        import('../src/plugin/methods/session-store-getter.js'),
        import('../src/plugin/methods/session-saving.js'),
        import('../src/plugin/methods/history.js'),
        import('../src/plugin/methods/groups.js'),
    ]);

    function PluginMock(this: unknown) {}
    for (const mod of modules) {
        const attach = ((mod as { default?: unknown }).default ?? mod) as (target: unknown) => void;
        attach(PluginMock);
    }

    const plugin = new (PluginMock as unknown as new () => TestPlugin)();
    plugin.data = {
        ...DEFAULT_DATA,
        sessions: {
            s1: { id: 's1', name: 'Work Session', layout: {} },
            s2: { id: 's2', name: 'Project Session', layout: {} },
        },
        sessionOrder: ['s1', 's2'],
        activeSessionId: 's1',
        numberedSwitchCommands: true,
    };

    const registered = new Map<string, unknown>();
    plugin.commands = registered;
    plugin.addCommand = (cmd) => {
        registered.set(cmd.id, cmd);
    };
    plugin.removeCommand = (id) => {
        registered.delete(id);
    };

    return plugin;
}

test('CommandRegistry reaches production prototype wiring and registers/syncs commands', async () => {
    const plugin = await createPlugin();
    const registry = plugin.getCommandRegistry();

    assert.ok(registry, 'getCommandRegistry returns CommandRegistry instance');

    plugin.registerCommands();
    assert.ok(plugin.commands.has('manage-sessions'), 'manage-sessions registered');
    assert.ok(plugin.commands.has('previous-session'), 'previous-session registered');
    assert.ok(plugin.commands.has('next-session'), 'next-session registered');

    plugin.syncSessionCommands();
    assert.ok(plugin.commands.has('switch-to-1'), 'numbered command 1 registered');
    assert.ok(plugin.commands.has('switch-to-9'), 'numbered command 9 registered');
});

test.after(() => harness.restore());
