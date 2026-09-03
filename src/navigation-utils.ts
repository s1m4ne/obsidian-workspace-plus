export function focusTextInputEnd(inputEl: HTMLInputElement | HTMLTextAreaElement | null | undefined): void {
    if (!inputEl || typeof inputEl.focus !== 'function') return;
    inputEl.focus();
    if (typeof inputEl.setSelectionRange === 'function') {
        const value = typeof inputEl.value === 'string' ? inputEl.value : '';
        inputEl.setSelectionRange(value.length, value.length);
    }
}

export function focusTextInputSelect(inputEl: HTMLInputElement | HTMLTextAreaElement | null | undefined): void {
    if (!inputEl || typeof inputEl.focus !== 'function') return;
    inputEl.focus();
    if (typeof inputEl.select === 'function') {
        inputEl.select();
    }
}

export function isTextInputCursorAtEnd(inputEl: HTMLInputElement | HTMLTextAreaElement | null | undefined): boolean {
    if (!inputEl) return false;
    if (typeof inputEl.selectionStart !== 'number' || typeof inputEl.selectionEnd !== 'number') return false;
    const value = typeof inputEl.value === 'string' ? inputEl.value : '';
    return inputEl.selectionStart === value.length && inputEl.selectionEnd === value.length;
}

export function getScopedControlEl(containerEl: HTMLElement | null | undefined, activeEl: HTMLElement | null | undefined): HTMLElement | null | undefined {
    if (!activeEl || !containerEl || !containerEl.contains(activeEl)) return activeEl;
    if (!activeEl.closest) return activeEl;
    const controlEl = activeEl.closest<HTMLElement>('button, .wpp-icon-btn, input, select, textarea, a');
    if (controlEl && containerEl.contains(controlEl)) return controlEl;
    return activeEl;
}
