'use strict';

function focusTextInputEnd(inputEl) {
    if (!inputEl || !inputEl.focus) return;
    inputEl.focus();
    if (typeof inputEl.setSelectionRange === 'function') {
        var value = typeof inputEl.value === 'string' ? inputEl.value : '';
        inputEl.setSelectionRange(value.length, value.length);
    }
}

function focusTextInputSelect(inputEl) {
    if (!inputEl || !inputEl.focus) return;
    inputEl.focus();
    if (typeof inputEl.select === 'function') {
        inputEl.select();
    }
}

function isTextInputCursorAtEnd(inputEl) {
    if (!inputEl) return false;
    if (typeof inputEl.selectionStart !== 'number' || typeof inputEl.selectionEnd !== 'number') return false;
    var value = typeof inputEl.value === 'string' ? inputEl.value : '';
    return inputEl.selectionStart === value.length && inputEl.selectionEnd === value.length;
}

function getScopedControlEl(containerEl, activeEl) {
    if (!activeEl || !containerEl || !containerEl.contains(activeEl)) return activeEl;
    if (!activeEl.closest) return activeEl;
    var controlEl = activeEl.closest('button, .wpp-icon-btn, input, select, textarea, a');
    if (controlEl && containerEl.contains(controlEl)) return controlEl;
    return activeEl;
}

module.exports = {
    focusTextInputEnd: focusTextInputEnd,
    focusTextInputSelect: focusTextInputSelect,
    isTextInputCursorAtEnd: isTextInputCursorAtEnd,
    getScopedControlEl: getScopedControlEl,
};
