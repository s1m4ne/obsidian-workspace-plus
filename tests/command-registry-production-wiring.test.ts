// CommandRegistry reaches production wiring and syncs session commands.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';
import { DEFAULT_DATA } from '../src/storage/default-data.ts';

const harness = setupHarness();
const { createRealPlugin } = await import('./real-plugin.ts');

function createPlugin(): {
    plugin: ReturnType<typeof createRealPlugin>;
    commands: Map<string, unknown>;
} {
    const plugin = createRealPlugin({
        data: {
            ...DEFAULT_DATA,
            sessions: {
                s1: { id: 's1', name: 'Work Session', layout: {} },
                s2: { id: 's2', name: 'Project Session', layout: {} },
            },
            sessionOrder: ['s1', 's2'],
            activeSessionId: 's1',
            numberedSwitchCommands: true,
        },
    });

    // Obsidian's own registry, recorded so the test can see what was asked for.
    const commands = new Map<string, unknown>();
    plugin.addCommand = (cmd: { id: string }): void => { commands.set(cmd.id, cmd); };
    plugin.removeCommand = (id: string): void => { commands.delete(id); };
    return { plugin, commands };
}

test('CommandRegistry reaches production prototype wiring and registers/syncs commands', async () => {
    const { plugin, commands } = createPlugin();
    const registry = (plugin.getCommandRegistry as () => { registerCommands(): void; syncSessionCommands(): void })();

    assert.ok(registry, 'getCommandRegistry returns CommandRegistry instance');

    registry.registerCommands();
    assert.ok(commands.has('manage-sessions'), 'manage-sessions registered');
    assert.ok(commands.has('previous-session'), 'previous-session registered');
    assert.ok(commands.has('next-session'), 'next-session registered');

    registry.syncSessionCommands();
    assert.ok(commands.has('switch-to-1'), 'numbered command 1 registered');
    assert.ok(commands.has('switch-to-9'), 'numbered command 9 registered');
});

test.after(() => harness.restore());
