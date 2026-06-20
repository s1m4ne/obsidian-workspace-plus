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
