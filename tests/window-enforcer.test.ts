import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';
import {
    getElectronWindow,
    findBestMatchingWindow,
    captureEnrichedWorkspaceLayout,
    enforcePopoutWindowPositions,
    type WorkspaceWindowLike,
    type LayoutNodeLike,
} from '../src/platform/obsidian-internals.ts';

const harness = setupHarness();

test('getElectronWindow returns null for null or non-electron window', () => {
    assert.equal(getElectronWindow(null), null);
    assert.equal(getElectronWindow({}), null);
});

test('getElectronWindow finds window from electronWindow or require', () => {
    const mockBw = {
        setBounds: () => {},
        getBounds: () => ({ x: 100, y: 200, width: 1920, height: 1080 }),
    };
    const win = {
        electronWindow: mockBw,
    };
    assert.equal(getElectronWindow(win), mockBw);

    const winWithRequire = {
        require: (mod: string) => {
            if (mod === 'electron') {
                return {
                    remote: {
                        getCurrentWindow: () => mockBw,
                    },
                };
            }
            return null;
        },
    };
    assert.equal(getElectronWindow(winWithRequire), mockBw);
});

test('findBestMatchingWindow matches by id, title, or file path', () => {
    const candidateA: WorkspaceWindowLike = {
        id: 'win-a',
        win: {
            document: { title: 'Notes/ProjectA.md - Obsidian' },
        } as unknown as Window,
    };
    const candidateB: WorkspaceWindowLike = {
        id: 'win-b',
        children: [
            {
                view: {
                    file: {
                        path: 'work/todo.md',
                    },
                },
            },
        ],
    };

    const candidates = [candidateA, candidateB];
    const used = new Set<WorkspaceWindowLike>();

    // 1. Match by ID
    const matchById = findBestMatchingWindow({ id: 'win-a' }, candidates, used);
    assert.equal(matchById, candidateA);

    // 2. Match by file path
    const matchByFile = findBestMatchingWindow(
        {
            type: 'leaf',
            state: { state: { file: 'work/todo.md' } },
        },
        candidates,
        used
    );
    assert.equal(matchByFile, candidateB);
});

test('captureEnrichedWorkspaceLayout captures geometry and maximize state', () => {
    const mockElectronWin = {
        setBounds: () => {},
        getBounds: () => ({ x: 1920, y: 0, width: 1080, height: 2560 }),
        getNormalBounds: () => ({ x: 1920, y: 0, width: 1080, height: 2560 }),
        isMaximized: () => true,
    };

    const mockApp = {
        workspace: {
            getLayout: () => ({
                main: { id: 'main-leaf' },
                floating: {
                    children: [
                        { id: 'popout-1' },
                    ],
                },
            }),
            floatingSplit: {
                children: [
                    {
                        id: 'popout-1',
                        win: {
                            electronWindow: mockElectronWin,
                        },
                    },
                ],
            },
        },
    } as unknown as import('obsidian').App;

    const enriched = captureEnrichedWorkspaceLayout(mockApp) as {
        floating: { children: LayoutNodeLike[] };
    };

    assert.ok(enriched.floating);
    const firstChild = enriched.floating.children[0];
    assert.ok(firstChild);
    assert.equal(firstChild.x, 1920);
    assert.equal(firstChild.y, 0);
    assert.equal(firstChild.width, 1080);
    assert.equal(firstChild.height, 2560);
    assert.equal(firstChild.maximize, true);
});

test('enforcePopoutWindowPositions applies positions to candidate popouts', async () => {
    let appliedBounds: { x: number; y: number; width: number; height: number } | null = null;
    let maximized = false;

    const mockElectronWin = {
        setBounds: (b: { x: number; y: number; width: number; height: number }) => {
            appliedBounds = b;
        },
        getBounds: () => appliedBounds || { x: 0, y: 0, width: 800, height: 600 },
        isMaximized: () => false,
        unmaximize: () => { maximized = false; },
        maximize: () => { maximized = true; },
    };

    const mockApp = {
        workspace: {
            floatingSplit: {
                children: [
                    {
                        id: 'popout-1',
                        win: {
                            electronWindow: mockElectronWin,
                        },
                    },
                ],
            },
        },
    } as unknown as import('obsidian').App;

    const savedLayout = {
        floating: {
            children: [
                {
                    id: 'popout-1',
                    x: -1920,
                    y: 0,
                    width: 1920,
                    height: 1080,
                    maximize: true,
                },
            ],
        },
    };

    await enforcePopoutWindowPositions(mockApp, savedLayout);

    assert.ok(appliedBounds);
    const bounds = appliedBounds as { x: number; y: number; width: number; height: number };
    assert.equal(bounds.x, -1920);
    assert.equal(bounds.y, 0);
    assert.equal(bounds.width, 1920);
    assert.equal(bounds.height, 1080);
    assert.equal(maximized, true);
});

test.after(() => harness.restore());
