import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';
import {
    focusTextInputEnd,
    focusTextInputSelect,
    isTextInputCursorAtEnd,
    getScopedControlEl,
} from '../src/navigation-utils.ts';

test('navigation utils: focusTextInputEnd sets selection to the end of input', () => {
    const harness = setupHarness();
    try {
        const input = document.createElement('input');
        input.value = 'hello world';
        document.body.appendChild(input);

        focusTextInputEnd(input);
        assert.equal(input.selectionStart, 11);
        assert.equal(input.selectionEnd, 11);

        // Safe on null/undefined
        focusTextInputEnd(null);
        focusTextInputEnd(undefined);
    } finally {
        harness.restore();
    }
});

test('navigation utils: focusTextInputSelect selects all input text', () => {
    const harness = setupHarness();
    try {
        const input = document.createElement('input');
        input.value = 'hello world';
        document.body.appendChild(input);

        focusTextInputSelect(input);
        // Safe on null/undefined
        focusTextInputSelect(null);
        focusTextInputSelect(undefined);
    } finally {
        harness.restore();
    }
});

test('navigation utils: isTextInputCursorAtEnd detects cursor positioning', () => {
    const harness = setupHarness();
    try {
        const input = document.createElement('input');
        input.value = 'test';
        document.body.appendChild(input);

        input.setSelectionRange(2, 2);
        assert.equal(isTextInputCursorAtEnd(input), false);

        input.setSelectionRange(4, 4);
        assert.equal(isTextInputCursorAtEnd(input), true);

        assert.equal(isTextInputCursorAtEnd(null), false);
        assert.equal(isTextInputCursorAtEnd(undefined), false);
    } finally {
        harness.restore();
    }
});

test('navigation utils: getScopedControlEl finds nearest interactive ancestor within container', () => {
    const harness = setupHarness();
    try {
        const container = document.createElement('div');
        const button = document.createElement('button');
        const iconSpan = document.createElement('span');
        button.appendChild(iconSpan);
        container.appendChild(button);
        document.body.appendChild(container);

        assert.equal(getScopedControlEl(container, iconSpan), button);
        assert.equal(getScopedControlEl(container, button), button);

        const outside = document.createElement('span');
        document.body.appendChild(outside);
        assert.equal(getScopedControlEl(container, outside), outside);

        assert.equal(getScopedControlEl(null, null), null);
    } finally {
        harness.restore();
    }
});
