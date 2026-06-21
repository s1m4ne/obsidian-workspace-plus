'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const layoutUtils = require('../src/layout-utils');

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

    assert.equal(layoutUtils.layoutsEqualStructural(savedLayout, currentLayout), true);
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

    assert.equal(layoutUtils.layoutsEqualStructural(a, b), false);
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

    assert.equal(layoutUtils.layoutsEqualStructural(a, b), false);
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

    assert.equal(layoutUtils.layoutsEqualStructural(savedLayout, sameWithPosition), true);
    assert.equal(layoutUtils.layoutsEqualStructural(savedLayout, differentSidebar), false);
    assert.equal(layoutUtils.layoutsEqualStructural({ layout: 'saved' }, { layout: 'saved', left: 10, top: 20 }), true);
    assert.equal(layoutUtils.layoutsEqualStructural({ layout: 'saved', left: 10 }, sameContentWithNumericLeft), false);
});
