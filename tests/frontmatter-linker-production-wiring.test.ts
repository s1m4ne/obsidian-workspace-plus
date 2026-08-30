// FrontmatterLinker reaches production wiring and triggers real layout saving.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';
import type { TFile as TFileType } from 'obsidian';

const harness = setupHarness();
const { TFile } = await import('obsidian');

interface TestPlugin {
    data: Record<string, unknown>;
    app: {
        workspace: {
            getActiveFile: () => TFileType | null;
            getLayout: () => unknown;
            changeLayout: (layout: unknown) => Promise<boolean>;
        };
        metadataCache: {
            getFileCache: (file: TFileType) => { frontmatter?: Record<string, unknown> } | null;
        };
        fileManager: {
            processFrontMatter: (file: TFileType, fn: (fm: Record<string, unknown>) => void) => Promise<void>;
        };
    };
    persistData(): Promise<boolean>;
    getFrontmatterLinker(): {
        saveCurrentNoteNameAsSession(options?: { silent?: boolean }): Promise<unknown>;
        handleFrontmatterTriggers(file: TFileType): void;
    };
    [key: string]: unknown;
}

async function createPlugin(): Promise<TestPlugin> {
    const modules = await Promise.all([
        import('../src/plugin/methods/frontmatter.js'),
        import('../src/plugin/methods/sessions.js'),
        import('../src/plugin/methods/session-store-getter.js'),
        import('../src/plugin/methods/session-saving.js'),
        import('../src/plugin/methods/history.js'),
        import('../src/plugin/methods/groups.js'),
        import('../src/plugin/methods/session-switcher-getter.js'),
    ]);

    function PluginMock(this: unknown) {}
    for (const mod of modules) {
        const attach = ((mod as { default?: unknown }).default ?? mod) as (target: unknown) => void;
        attach(PluginMock);
    }

    const plugin = new (PluginMock as unknown as new () => TestPlugin)();
    plugin.data = {
        sessions: {
            s1: { id: 's1', name: 'Work Note', layout: { root: 'layout-1' } },
        },
        sessionOrder: ['s1'],
        activeSessionId: 's1',
        groups: {},
        groupOrder: [],
        sessionGroups: {},
        activeGroupId: null,
        groupFeatureEnabled: false,
    };

    const activeFile = new TFile();
    activeFile.path = 'Folder/Project Session.md';
    activeFile.name = 'Project Session.md';
    activeFile.basename = 'Project Session';
    activeFile.extension = 'md';

    const fileCache: Record<string, { frontmatter?: Record<string, unknown> }> = {
        'Folder/Project Session.md': { frontmatter: {} },
    };

    plugin.app = {
        workspace: {
            getActiveFile: () => activeFile,
            getLayout: () => ({ root: 'new-layout' }),
            changeLayout: async () => true,
        },
        metadataCache: {
            getFileCache: (file: TFileType) => fileCache[file.path] || null,
        },
        fileManager: {
            processFrontMatter: async (file: TFileType, fn: (fm: Record<string, unknown>) => void) => {
                const fm = fileCache[file.path]?.frontmatter || {};
                fn(fm);
            },
        },
    };

    plugin.persistData = async function () {
        return true;
    };

    return plugin;
}

test('FrontmatterLinker saves current note name as session through production wiring', async () => {
    const plugin = await createPlugin();

    const result = await plugin.getFrontmatterLinker().saveCurrentNoteNameAsSession({ silent: true });
    assert.equal((result as { saved: boolean }).saved, true);

    const sessions = plugin.data.sessions as Record<string, { name: string; layout: unknown }>;
    const createdSession = Object.values(sessions).find((s) => s.name === 'Project Session');
    assert.ok(createdSession, 'new session with note name was created in store');
    assert.deepEqual(createdSession?.layout, { root: 'new-layout' });
});

test.after(() => harness.restore());
