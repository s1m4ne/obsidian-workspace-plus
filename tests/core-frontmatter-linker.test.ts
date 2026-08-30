import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';
import type { FrontmatterLinkerHost } from '../src/core/frontmatter-linker.ts';
import { DEFAULT_DATA, type PluginData } from '../src/storage/default-data.ts';
import type { App, EventRef, TFile as TFileType, WorkspaceLeaf } from 'obsidian';

const harness = setupHarness();
const { TFile } = await import('obsidian');
const { FrontmatterLinker } = await import('../src/core/frontmatter-linker.ts');

function createTestFile(data: Partial<TFileType>): TFileType {
    const file = new TFile();
    Object.assign(file, data);
    return file;
}

function createMockHost(initialData?: Partial<PluginData>) {
    const data: PluginData = {
        ...DEFAULT_DATA,
        sessions: {
            s1: { id: 's1', name: 'Work Note', layout: {} },
            s2: { id: 's2', name: 'Personal', layout: {} },
        },
        sessionOrder: ['s1', 's2'],
        activeSessionId: 's1',
        groups: {
            g1: { id: 'g1', name: 'Work', sessionIds: ['s1'] },
        },
        groupOrder: ['g1'],
        sessionGroups: { s1: ['g1'] },
        activeGroupId: 'g1',
        groupFeatureEnabled: true,
        ...initialData,
    };

    const events = {
        switchedSessions: [] as string[],
        activeGroups: [] as string[],
        savedLayouts: [] as string[],
        registeredEvents: [] as EventRef[],
        processedFrontmatter: [] as Array<{ file: TFileType; data: Record<string, unknown> }>,
    };

    let activeFile: TFileType | null = createTestFile({
        path: 'Notes/Work Note.md',
        name: 'Work Note.md',
        basename: 'Work Note',
        extension: 'md',
    });

    const fileCache: Record<string, { frontmatter?: Record<string, unknown> }> = {
        'Notes/Work Note.md': {
            frontmatter: { 'workspace-session': 'Personal' },
        },
    };

    const listeners: Record<string, (arg: unknown) => void> = {};

    const app = {
        metadataCache: {
            getFileCache: (file: TFileType) => fileCache[file.path] || null,
        },
        fileManager: {
            processFrontMatter: async (file: TFileType, fn: (fm: Record<string, unknown>) => void) => {
                const fm = fileCache[file.path]?.frontmatter || {};
                fn(fm);
                events.processedFrontmatter.push({ file, data: fm });
            },
        },
        workspace: {
            getActiveFile: () => activeFile,
            activeLeaf: { id: 'leaf-1' },
            iterateAllLeaves: (fn: (leaf: WorkspaceLeaf) => void) => {
                fn({
                    id: 'leaf-1',
                    view: { file: activeFile },
                } as unknown as WorkspaceLeaf);
            },
            on: (eventName: string, fn: (arg: unknown) => void) => {
                listeners[eventName] = fn;
                return { eventName, fn } as unknown as EventRef;
            },
        },
    } as unknown as App;

    const host: FrontmatterLinkerHost = {
        data,
        app,
        saveCurrentLayoutAsSessionName: async (name: string) => {
            events.savedLayouts.push(name);
            return true;
        },
        switchSession: async (sessionId: string) => {
            events.switchedSessions.push(sessionId);
            return true;
        },
        setActiveGroup: async (groupId: string) => {
            events.activeGroups.push(groupId);
            return true;
        },
        isGroupFeatureEnabled: () => data.groupFeatureEnabled !== false,
        getStartupSettleRemainingMs: () => 0,
        isSessionSwitcherActive: () => false,
        registerEvent: (ref: EventRef) => {
            events.registeredEvents.push(ref);
        },
    };

    return {
        host,
        data,
        events,
        listeners,
        setActiveFile: (f: TFileType | null) => { activeFile = f; },
        setFileCache: (path: string, cache: { frontmatter?: Record<string, unknown> }) => {
            fileCache[path] = cache;
        },
    };
}

test('FrontmatterLinker: parses workspace session values with and without groups', () => {
    const { host } = createMockHost();
    const linker = new FrontmatterLinker(host);

    assert.equal(linker.parseWorkspaceSessionValue(null), null);
    assert.equal(linker.parseWorkspaceSessionValue(''), null);
    assert.equal(linker.parseWorkspaceSessionValue('   '), null);

    // Simple session
    assert.deepEqual(linker.parseWorkspaceSessionValue('Personal'), {
        groupName: null,
        sessionName: 'Personal',
    });

    // Existing group + session
    assert.deepEqual(linker.parseWorkspaceSessionValue('Work/Work Note'), {
        groupName: 'Work',
        groupId: 'g1',
        sessionName: 'Work Note',
    });

    // Non-existent group treated as full name
    assert.deepEqual(linker.parseWorkspaceSessionValue('NonExistent/My Session'), {
        groupName: null,
        sessionName: 'NonExistent/My Session',
    });
});

test('FrontmatterLinker: file helper methods identify markdown files and derive session names', () => {
    const { host } = createMockHost();
    const linker = new FrontmatterLinker(host);

    assert.equal(linker.isMarkdownNoteFile(null), false);
    assert.equal(linker.isMarkdownNoteFile(createTestFile({ extension: 'png' })), false);
    assert.equal(linker.isMarkdownNoteFile(createTestFile({ extension: 'md' })), true);
    assert.equal(linker.isMarkdownNoteFile(createTestFile({ extension: 'MD' })), true);

    assert.equal(linker.getSessionNameFromNoteFile(null), '');
    assert.equal(linker.getSessionNameFromNoteFile(createTestFile({ extension: 'png' })), '');
    assert.equal(linker.getSessionNameFromNoteFile(createTestFile({ extension: 'md', basename: 'My Note' })), 'My Note');
    assert.equal(linker.getSessionNameFromNoteFile(createTestFile({ extension: 'md', path: 'folder/Another Note.md' })), 'Another Note');
});

test('FrontmatterLinker: saveCurrentNoteNameAsSession writes frontmatter and saves layout', async () => {
    const { host, events } = createMockHost();
    const linker = new FrontmatterLinker(host);

    const result = await linker.saveCurrentNoteNameAsSession({ silent: true });
    assert.equal(result, true);
    assert.deepEqual(events.savedLayouts, ['Work Note']);
    assert.equal(events.processedFrontmatter.length, 1);
    assert.equal(events.processedFrontmatter[0]?.data['workspace-session'], 'Work Note');
});

test('FrontmatterLinker: handleWorkspaceSessionProperty switches session and group appropriately', async () => {
    const { host, events } = createMockHost();
    const linker = new FrontmatterLinker(host);

    // Switch to Personal (s2)
    linker.handleWorkspaceSessionProperty('Personal');
    assert.deepEqual(events.switchedSessions, ['s2']);

    // Non-existent session
    linker.handleWorkspaceSessionProperty('Does Not Exist');
    // Switched sessions should not have changed
    assert.deepEqual(events.switchedSessions, ['s2']);
});

test('FrontmatterLinker: leaf tracking and file open listener registration', () => {
    const { host, events, listeners, setFileCache } = createMockHost();
    const linker = new FrontmatterLinker(host);

    linker.registerFrontmatterListeners();
    assert.equal(events.registeredEvents.length, 1);
    assert.ok(listeners['file-open']);

    // Open file that matches session Personal
    const file2 = createTestFile({
        path: 'Notes/Personal.md',
        name: 'Personal.md',
        basename: 'Personal',
        extension: 'md',
    });
    setFileCache('Notes/Personal.md', {
        frontmatter: { 'workspace-session': 'Personal' },
    });

    const handler = listeners['file-open'];
    if (handler) {
        handler(file2);
    }
    assert.deepEqual(events.switchedSessions, ['s2']);
});

test.after(() => harness.restore());
