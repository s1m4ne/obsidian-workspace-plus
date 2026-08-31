// formatHotkey and getCommandHotkey are owned by the command registry.
// CommandRegistry, which already owns the command ids they depend on.
//
// Nothing tested either one before the move: inverting the Mac branch, dropping
// the plugin id from the command lookup, ignoring the requested index, and
// removing the arrow-key symbols all left 416 tests green. They decide what the
// overlays and the session manager print as the shortcut for each row.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';
import type { CommandRegistryHost } from '../src/core/command-registry.ts';

interface Hotkey {
    modifiers: string[];
    key: string;
}

function createRegistry(
    harness: ReturnType<typeof setupHarness>,
    hotkeysById: Record<string, Hotkey[]>,
): Promise<{ formatHotkey(h: Hotkey): string; getCommandHotkey(id: string, index?: number): string }> {
    const app = {
        // getCommandHotkeys reaches the undocumented hotkey manager; a custom
        // list wins over the defaults, so only that side needs answering here.
        hotkeyManager: {
            getHotkeys: (fullId: string) => hotkeysById[fullId] ?? null,
            getDefaultHotkeys: () => null,
        },
        workspace: {},
    };
    const host = {
        manifest: { id: 'workspace-plus-plus' },
        app,
    } as unknown as CommandRegistryHost;

    return import('../src/core/command-registry.ts').then((mod) => {
        void harness;
        return new mod.CommandRegistry(host);
    });
}

test('a shortcut is drawn with Mac symbols on Mac and spelled-out names elsewhere', async () => {
    const harness = setupHarness();
    try {
        const registry = await createRegistry(harness, {});
        const hotkey = { modifiers: ['Mod', 'Alt', 'Shift', 'Ctrl'], key: 'K' };

        harness.dom.setPlatform('MacIntel');
        assert.equal(registry.formatHotkey(hotkey), '⌘⌥⇧⌃K', 'Mac joins symbols with no separator');

        harness.dom.setPlatform('Win32');
        assert.equal(registry.formatHotkey(hotkey), 'Ctrl+Alt+Shift+Ctrl+K', 'elsewhere the parts are joined with +');
    } finally {
        harness.restore();
    }
});

test('keys with no printable name are shown as their symbol', async () => {
    const harness = setupHarness();
    try {
        harness.dom.setPlatform('MacIntel');
        const registry = await createRegistry(harness, {});

        // These four are what the switch overlay's footer prints; without the
        // mapping the footer would read "ArrowLeft".
        assert.equal(registry.formatHotkey({ modifiers: [], key: 'ArrowLeft' }), '←');
        assert.equal(registry.formatHotkey({ modifiers: [], key: 'ArrowRight' }), '→');
        assert.equal(registry.formatHotkey({ modifiers: [], key: 'ArrowUp' }), '↑');
        assert.equal(registry.formatHotkey({ modifiers: [], key: 'ArrowDown' }), '↓');
        // The comma and period commands are labelled with the shifted glyphs.
        assert.equal(registry.formatHotkey({ modifiers: ['Mod'], key: ',' }), '⌘<');
        assert.equal(registry.formatHotkey({ modifiers: ['Mod'], key: '.' }), '⌘>');
        // Anything else is passed through untouched.
        assert.equal(registry.formatHotkey({ modifiers: [], key: 'Enter' }), 'Enter');
    } finally {
        harness.restore();
    }
});

test('a command hotkey is looked up under the plugin id, not the bare command name', async () => {
    const harness = setupHarness();
    try {
        harness.dom.setPlatform('MacIntel');
        const registry = await createRegistry(harness, {
            'workspace-plus-plus:next-session': [{ modifiers: ['Mod'], key: ']' }],
            // Present under the unprefixed name as well, so a lookup that
            // forgot the prefix would still find something and pass.
            'next-session': [{ modifiers: ['Alt'], key: 'X' }],
        });

        assert.equal(registry.getCommandHotkey('next-session'), '⌘]');
    } finally {
        harness.restore();
    }
});

test('the second shortcut for a command is reachable, and a missing one is empty', async () => {
    const harness = setupHarness();
    try {
        harness.dom.setPlatform('MacIntel');
        const registry = await createRegistry(harness, {
            'workspace-plus-plus:next-session': [
                { modifiers: ['Mod'], key: ']' },
                { modifiers: ['Mod', 'Shift'], key: 'Tab' },
            ],
        });

        assert.equal(registry.getCommandHotkey('next-session', 0), '⌘]');
        assert.equal(registry.getCommandHotkey('next-session', 1), '⌘⇧Tab', 'the overlay footer shows both');
        assert.equal(registry.getCommandHotkey('next-session', 2), '', 'asking past the end is empty, not a crash');
        assert.equal(registry.getCommandHotkey('no-such-command'), '', 'an unbound command has no text');
    } finally {
        harness.restore();
    }
});
