// FrontmatterLinker reaches production wiring and triggers real layout saving.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';
import type { TFile as TFileType } from 'obsidian';

const harness = setupHarness();
const { createRealPlugin } = await import('./real-plugin.ts');
const { TFile } = await import('obsidian');

interface FrontmatterLinkerSurface {
    saveCurrentNoteNameAsSession(options?: { silent?: boolean }): Promise<unknown>;
    handleFrontmatterTriggers(file: TFileType): void;
}

function createPlugin(): ReturnType<typeof createRealPlugin> {
    const activeFile = new TFile();
    activeFile.path = 'Folder/Project Session.md';
    activeFile.name = 'Project Session.md';
    activeFile.basename = 'Project Session';
    activeFile.extension = 'md';

    const fileCache: Record<string, { frontmatter?: Record<string, unknown> }> = {
        'Folder/Project Session.md': { frontmatter: {} },
    };

    const plugin = createRealPlugin({
        app: {
            workspace: {
                getActiveFile: (): TFileType => activeFile,
                getLayout: (): unknown => ({ root: 'new-layout' }),
                changeLayout: async (): Promise<boolean> => true,
            },
            metadataCache: {
                on: (): unknown => ({}),
                getFileCache: (file: TFileType) => fileCache[file.path] || null,
            },
            fileManager: {
                processFrontMatter: async (file: TFileType, fn: (fm: Record<string, unknown>) => void): Promise<void> => {
                    fn(fileCache[file.path]?.frontmatter || {});
                },
            },
        },
        data: {
            sessions: { s1: { id: 's1', name: 'Work Note', layout: { root: 'layout-1' } } },
            sessionOrder: ['s1'],
            activeSessionId: 's1',
            groups: {},
            groupOrder: [],
            sessionGroups: {},
            activeGroupId: null,
            groupFeatureEnabled: false,
        },
    });

    plugin.persistData = async (): Promise<boolean> => true;
    return plugin;
}

function frontmatterLinker(plugin: ReturnType<typeof createRealPlugin>): FrontmatterLinkerSurface {
    return (plugin.getFrontmatterLinker as () => FrontmatterLinkerSurface)();
}

test('FrontmatterLinker saves current note name as session through production wiring', async () => {
    const plugin = createPlugin();

    const result = await frontmatterLinker(plugin).saveCurrentNoteNameAsSession({ silent: true });
    assert.equal((result as { saved: boolean }).saved, true);

    const sessions = plugin.data.sessions as Record<string, { name: string; layout: unknown }>;
    const createdSession = Object.values(sessions).find((s) => s.name === 'Project Session');
    assert.ok(createdSession, 'new session with note name was created in store');
    assert.deepEqual(createdSession?.layout, { root: 'new-layout' });
});

test.after(() => harness.restore());
