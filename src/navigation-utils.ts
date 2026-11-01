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

/**
 * The row a typed filter puts Enter on: the first exact name, ignoring case,
 * else the top row. -1 with nothing typed or nothing listed, so each caller
 * keeps its own answer for an empty filter. The quick switcher and the session
 * manager share it so Enter means the same in both (#132).
 */
export function findTypedSessionIndex(sessions: readonly { name?: string }[], query: string): number {
    const q = query.trim().toLowerCase();
    if (!q || sessions.length === 0) return -1;
    const exactIdx = sessions.findIndex((s) => (s.name || '').toLowerCase() === q);
    return exactIdx !== -1 ? exactIdx : 0;
}
