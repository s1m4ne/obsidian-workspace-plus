'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const layoutUtils = require('../src/layout-utils.ts');

test('layout utils compare exact serialized layouts', function () {
    assert.equal(layoutUtils.layoutsEqual({ a: 1 }, { a: 1 }), true);
    assert.equal(layoutUtils.layoutsEqual({ a: 1 }, { a: 2 }), false);
});

test('layout utils structural comparison ignores volatile Obsidian workspace state', function () {
    const savedLayout = {
        main: {
            id: 'saved-main',
            type: 'split',
            direction: 'vertical',
            children: [{
                id: 'saved-tabs',
                type: 'tabs',
                currentTab: 0,
                children: [
                    {
                        id: 'saved-leaf-a',
                        type: 'leaf',
                        state: {
                            type: 'markdown',
                            state: { file: 'a.md', mode: 'source' },
                            eState: { cursor: { from: 1 }, scroll: 10 },
                        },
                    },
                    {
                        id: 'saved-leaf-b',
                        type: 'leaf',
                        state: {
                            type: 'markdown',
                            state: { file: 'b.md', mode: 'source' },
                            eState: { cursor: { from: 2 }, scroll: 20 },
                        },
                    },
                ],
            }],
        },
        active: 'saved-leaf-a',
        lastOpenFiles: ['a.md', 'b.md'],
    };
    const currentLayout = {
        main: {
            id: 'current-main',
            type: 'split',
            direction: 'vertical',
            children: [{
                id: 'current-tabs',
                type: 'tabs',
                currentTab: 0,
                children: [
                    {
                        id: 'current-leaf-a',
                        type: 'leaf',
                        state: {
                            type: 'markdown',
                            state: { file: 'a.md', mode: 'source' },
                            eState: { cursor: { from: 100 }, scroll: 1000 },
                        },
                    },
                    {
                        id: 'current-leaf-b',
                        type: 'leaf',
                        state: {
                            type: 'markdown',
                            state: { file: 'b.md', mode: 'source' },
                            eState: { cursor: { from: 200 }, scroll: 2000 },
                        },
                    },
                ],
            }],
        },
        active: 'current-leaf-b',
        lastOpenFiles: ['b.md', 'a.md'],
    };

    assert.equal(layoutUtils.layoutsEqualStructural(savedLayout, currentLayout, { restoreScope: 'full' }), true);
});

test('layout utils structural comparison still detects meaningful layout differences', function () {
    const a = {
        main: {
            id: 'a-main',
            type: 'tabs',
            currentTab: 0,
            children: [
                { id: 'a-leaf', type: 'leaf', state: { type: 'markdown', state: { file: 'a.md' } } },
            ],
        },
    };
    const b = {
        main: {
            id: 'b-main',
            type: 'tabs',
            currentTab: 0,
            children: [
                { id: 'b-leaf', type: 'leaf', state: { type: 'markdown', state: { file: 'b.md' } } },
            ],
        },
    };

    assert.equal(layoutUtils.layoutsEqualStructural(a, b, { restoreScope: 'full' }), false);
});

test('layout utils cloneLayout returns a deep copy', function () {
    const layout = { main: { children: [{ state: { file: 'a.md' } }] } };
    const clone = layoutUtils.cloneLayout(layout);

    assert.deepEqual(clone, layout);
    assert.notEqual(clone, layout);
    assert.notEqual(clone.main, layout.main);

    clone.main.children[0].state.file = 'b.md';
    assert.equal(layout.main.children[0].state.file, 'a.md');
});

test('layout utils merge main layout keeps current sidebars', function () {
    const targetLayout = {
        main: { id: 'target-main', type: 'leaf', state: { type: 'markdown', state: { file: 'target.md' } } },
        left: { id: 'target-left', type: 'leaf', state: { type: 'file-explorer' } },
        right: { id: 'target-right', type: 'leaf', state: { type: 'backlink' } },
        active: 'target-main',
    };
    const currentLayout = {
        main: { id: 'current-main', type: 'leaf', state: { type: 'markdown', state: { file: 'current.md' } } },
        left: { id: 'current-left', type: 'leaf', state: { type: 'file-explorer' } },
        right: { id: 'current-right', type: 'leaf', state: { type: 'outline' } },
        active: 'current-main',
    };

    const merged = layoutUtils.mergeMainLayoutIntoCurrent(targetLayout, currentLayout);

    assert.deepEqual(merged.main, targetLayout.main);
    assert.deepEqual(merged.left, currentLayout.left);
    assert.deepEqual(merged.right, currentLayout.right);
    assert.equal(merged.active, 'target-main');

    merged.left.id = 'changed';
    assert.equal(currentLayout.left.id, 'current-left');
});

test('layout utils main-only structural comparison ignores sidebar changes', function () {
    const a = {
        main: { id: 'a-main', type: 'leaf', state: { type: 'markdown', state: { file: 'a.md' } } },
        left: { id: 'a-left', type: 'leaf', state: { type: 'file-explorer' } },
        right: { id: 'a-right', type: 'leaf', state: { type: 'backlink' } },
    };
    const b = {
        main: { id: 'b-main', type: 'leaf', state: { type: 'markdown', state: { file: 'a.md' } } },
        left: { id: 'b-left', type: 'leaf', state: { type: 'search' } },
        right: { id: 'b-right', type: 'leaf', state: { type: 'outline' } },
    };

    assert.equal(layoutUtils.layoutsEqualStructural(a, b, { restoreScope: 'full' }), false);
    assert.equal(layoutUtils.layoutsEqualStructural(a, b, { restoreScope: 'main-only' }), true);
});

test('layout utils full structural comparison keeps sidebar branches but ignores numeric positions', function () {
    const savedLayout = {
        main: { id: 'main-a', type: 'leaf', state: { type: 'markdown', state: { file: 'a.md' } } },
        left: { id: 'left-a', type: 'leaf', state: { type: 'file-explorer' } },
    };
    const sameWithPosition = {
        main: { id: 'main-b', type: 'leaf', state: { type: 'markdown', state: { file: 'a.md' } } },
        left: { id: 'left-b', type: 'leaf', state: { type: 'file-explorer' } },
        top: 20,
    };
    const differentSidebar = {
        main: { id: 'main-c', type: 'leaf', state: { type: 'markdown', state: { file: 'a.md' } } },
        left: { id: 'left-c', type: 'leaf', state: { type: 'search' } },
    };
    const sameContentWithNumericLeft = {
        main: { id: 'main-d', type: 'leaf', state: { type: 'markdown', state: { file: 'a.md' } } },
        left: 10,
    };

    assert.equal(layoutUtils.layoutsEqualStructural(savedLayout, sameWithPosition, { restoreScope: 'full' }), true);
    assert.equal(layoutUtils.layoutsEqualStructural(savedLayout, differentSidebar, { restoreScope: 'full' }), false);
    assert.equal(layoutUtils.layoutsEqualStructural({ layout: 'saved' }, { layout: 'saved', left: 10, top: 20 }, { restoreScope: 'full' }), true);
    assert.equal(layoutUtils.layoutsEqualStructural({ layout: 'saved', left: 10 }, sameContentWithNumericLeft, { restoreScope: 'full' }), false);
});

// A layout in the shape Obsidian actually produces: the main area is a split of
// tabs holding markdown leaves, and the right sidebar holds reference views that
// write the file they are *pointing at* into the same `state.state.file` field a
// markdown leaf writes the file it is *showing*.
//
// The fixtures this replaced were synthetic - a root `split` carrying both
// `children` and a `main`, which Obsidian never emits - and that is precisely
// what let the two walkers disagree without any test noticing: one read
// `children`, the other read `main`, and both found something.
function realisticLayout() {
    return {
        main: {
            id: 'main-split',
            type: 'split',
            direction: 'vertical',
            children: [{
                id: 'main-tabs',
                type: 'tabs',
                currentTab: 1,
                children: [
                    {
                        id: 'leaf-a',
                        type: 'leaf',
                        state: { type: 'markdown', state: { file: 'Notes/A.md', mode: 'source' } },
                    },
                    {
                        id: 'leaf-b',
                        type: 'leaf',
                        state: { type: 'markdown', state: { file: 'Notes/B.md', mode: 'source' } },
                    },
                ],
            }],
        },
        left: {
            id: 'left-split',
            type: 'split',
            direction: 'horizontal',
            width: 300,
            children: [{
                id: 'left-tabs',
                type: 'tabs',
                children: [
                    { id: 'leaf-fe', type: 'leaf', state: { type: 'file-explorer', state: {} } },
                ],
            }],
        },
        right: {
            id: 'right-split',
            type: 'split',
            direction: 'horizontal',
            width: 300,
            children: [{
                id: 'right-tabs',
                type: 'tabs',
                currentTab: 0,
                children: [
                    { id: 'leaf-bl', type: 'leaf', state: { type: 'backlink', state: { file: 'Archive/Old.md' } } },
                    { id: 'leaf-ol', type: 'leaf', state: { type: 'outline', state: { file: 'Archive/Old.md' } } },
                    { id: 'leaf-og', type: 'leaf', state: { type: 'outgoing-link', state: { file: 'Notes/A.md' } } },
                    { id: 'leaf-tag', type: 'leaf', state: { type: 'tag', state: {} } },
                ],
            }],
        },
        active: 'leaf-b',
        lastOpenFiles: ['Notes/A.md', 'Notes/B.md'],
    };
}

test('describeLayout names the files the main area was showing', function () {
    const summary = layoutUtils.describeLayout(realisticLayout());

    assert.equal(summary.paneCount, 2);
    assert.deepEqual(summary.filePaths, ['Notes/A.md', 'Notes/B.md']);
});

test('describeLayout does not report a sidebar reference pane as an open file', function () {
    const summary = layoutUtils.describeLayout(realisticLayout());

    // backlink, outline and outgoing-link all carry state.state.file. Reading
    // them is what made a history row claim a file was open that never was.
    assert.equal(summary.filePaths.includes('Archive/Old.md'), false);
    // ...and the sidebars must not reach the pane count either, or the count
    // and the file list describe different trees.
    assert.equal(summary.paneCount, 2);
});

test('describeLayout counts empty main panes and lists no file for them', function () {
    // The shape behind the reported bug: two empty tabs in the main area, with
    // every name in the summary coming from the sidebars.
    const layout = realisticLayout();
    layout.main.children[0].children = [
        { id: 'leaf-e1', type: 'leaf', state: { type: 'empty', state: {} } },
        { id: 'leaf-e2', type: 'leaf', state: { type: 'empty', state: {} } },
    ];

    const summary = layoutUtils.describeLayout(layout);

    assert.equal(summary.paneCount, 2);
    assert.deepEqual(summary.filePaths, []);
});

test('describeLayout lists a file open in two main panes once', function () {
    const layout = realisticLayout();
    layout.main.children[0].children[1].state.state.file = 'Notes/A.md';

    const summary = layoutUtils.describeLayout(layout);

    assert.equal(summary.paneCount, 2);
    assert.deepEqual(summary.filePaths, ['Notes/A.md']);
});

test('describeLayout reports nothing for a layout with no main area', function () {
    assert.deepEqual(layoutUtils.describeLayout(null), { paneCount: 0, filePaths: [] });
    assert.deepEqual(layoutUtils.describeLayout({}), { paneCount: 0, filePaths: [] });
});
