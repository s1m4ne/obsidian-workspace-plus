import test from 'node:test';
import assert from 'node:assert/strict';
import { installObsidianStub } from './lock/harness/index.ts';

installObsidianStub();

test('generateId generates non-empty alphanumeric unique IDs', async () => {
    const { generateId } = await import('../src/utils.ts');
    const id1 = generateId();
    const id2 = generateId();

    assert.equal(typeof id1, 'string');
    assert.ok(id1.length > 5);
    assert.notEqual(id1, id2);
});

test('isMacPlatform returns boolean based on Platform.isMacOS', async () => {
    const { isMacPlatform } = await import('../src/utils.ts');
    const result = isMacPlatform();
    assert.equal(typeof result, 'boolean');
});

test('isModPressed handles null or undefined event gracefully', async () => {
    const { isModPressed } = await import('../src/utils.ts');
    assert.equal(isModPressed(null), false);
    assert.equal(isModPressed(undefined), false);
});

test('isModPressed checks metaKey on Mac and ctrlKey on non-Mac', async () => {
    const { isMacPlatform, isModPressed } = await import('../src/utils.ts');
    const isMac = isMacPlatform();
    if (isMac) {
        assert.equal(isModPressed({ metaKey: true }), true);
        assert.equal(isModPressed({ ctrlKey: true }), false);
    } else {
        assert.equal(isModPressed({ ctrlKey: true }), true);
        assert.equal(isModPressed({ metaKey: true }), false);
    }
});

test('isModShiftPressed checks both modifier and shift key', async () => {
    const { isMacPlatform, isModShiftPressed } = await import('../src/utils.ts');
    const isMac = isMacPlatform();
    const modKey = isMac ? { metaKey: true } : { ctrlKey: true };

    assert.equal(isModShiftPressed(null), false);
    assert.equal(isModShiftPressed({ ...modKey, shiftKey: false }), false);
    assert.equal(isModShiftPressed({ ...modKey, shiftKey: true }), true);
});
