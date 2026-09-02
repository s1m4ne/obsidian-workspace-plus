import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';
import type { App } from 'obsidian';

const harness = setupHarness();
const app = (harness as unknown as { app: App }).app;

const { ConfirmModal } = await import('../src/modals/confirm-modal.ts');
const { RenameModal } = await import('../src/modals/rename-modal.ts');
const { UnsavedSwitchModal } = await import('../src/modals/unsaved-switch-modal.ts');
const { HistoryModal } = await import('../src/modals/history-modal.ts');
const { formatRelativeTime } = await import('../src/modals/format-relative-time.ts');
const { L } = await import('../src/i18n.ts');

test('formatRelativeTime: formats relative timestamps accurately', () => {
    const now = Date.now();
    assert.equal(formatRelativeTime(now - 10000), L.modifiedJustNow);
    assert.equal(formatRelativeTime(now - 5 * 60000), (L.modifiedMinutes as (n: number) => string)(5));
    assert.equal(formatRelativeTime(now - 3 * 3600000), (L.modifiedHours as (n: number) => string)(3));
    assert.equal(formatRelativeTime(now - 2 * 86400000), (L.modifiedDays as (n: number) => string)(2));
});

test('ConfirmModal: handles open, click, keyboard navigation and hint', () => {
    let confirmed = false;
    let hintClicked = false;

    const modal = new ConfirmModal(
        app,
        'Are you sure?',
        () => { confirmed = true; },
        {
            confirmText: 'Yes, delete',
            confirmClass: 'mod-warning',
            hint: 'Change setting',
            onHintClick: () => { hintClicked = true; },
        }
    );

    modal.open();
    assert.ok(modal.containerEl.classList.contains('wpp-modal-above-overlay'));

    const hintLink = modal.contentEl.querySelector('.wpp-confirm-hint a');
    assert.ok(hintLink);
    hintLink?.dispatchEvent(new window.MouseEvent('click'));
    assert.equal(hintClicked, true);

    // Reopen and test confirm button click
    const modal2 = new ConfirmModal(app, 'Test msg', () => { confirmed = true; });
    modal2.open();
    const doc = modal2.containerEl.ownerDocument || document;

    // Arrow keys
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight' }));
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter' }));
    assert.equal(confirmed, true);

    // Escape closes without confirming
    let confirmed3 = false;
    const modal3 = new ConfirmModal(app, 'Test msg', () => { confirmed3 = true; });
    modal3.open();
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
    assert.equal(confirmed3, false);
});

test('RenameModal: handles open, input, skip button, and keyboard handlers', () => {
    let renamed = '';
    let skipped = false;

    const modal = new RenameModal(
        app,
        'Original Name',
        (name) => { renamed = name; },
        {
            title: 'Rename test',
            placeholder: 'Enter new name',
            skipButtonText: 'Skip',
            onSkip: () => { skipped = true; },
        }
    );

    modal.open();
    const input = modal.contentEl.querySelector('input');
    assert.ok(input);
    assert.equal(input.value, 'Original Name');

    const doc = modal.containerEl.ownerDocument || document;

    // Test input Enter
    input.value = 'New Name';
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter' }));
    assert.equal(renamed, 'New Name');

    // Test skip button
    const modal2 = new RenameModal(
        app,
        '',
        (name) => { renamed = name; },
        {
            skipButtonText: 'Skip',
            onSkip: () => { skipped = true; },
        }
    );
    modal2.open();
    const input2 = modal2.contentEl.querySelector('input')!;
    input2.value = '';
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter' }));
    assert.equal(skipped, true);

    // Test arrow key navigation between buttons and input
    const modal3 = new RenameModal(app, 'Test', () => {});
    modal3.open();
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowDown' }));
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight' }));
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowUp' }));
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
});

test('UnsavedSwitchModal: handles saveAndSwitch, switchWithoutSaving, and onCancel guarantee', () => {
    let state = '';
    const modal = new UnsavedSwitchModal(
        app,
        'Unsaved changes',
        () => { state = 'save'; },
        () => { state = 'switch'; },
        () => { state = 'cancel'; }
    );

    modal.open();
    assert.ok(modal.containerEl.classList.contains('wpp-modal-above-overlay'));

    const doc = modal.containerEl.ownerDocument || document;
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight' }));
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter' }));
    assert.equal(state, 'switch');

    // Test close triggers cancel if not resolved
    let state2 = '';
    const modal2 = new UnsavedSwitchModal(
        app,
        'Unsaved changes',
        () => { state2 = 'save'; },
        () => { state2 = 'switch'; },
        () => { state2 = 'cancel'; }
    );
    modal2.open();
    modal2.close();
    assert.equal(state2, 'cancel');
});

test('HistoryModal: groups entries by date and renders summary and restore button', async () => {
    const now = Date.now();
    let restoredSessionId = '';
    let restoredIndex = -1;

    const mockPlugin = {
        app,
        // Version history goes through getHistoryService(); this double carries those members itself.
        getHistoryService(): never { return this as never; },
        extractFilePathsFromLayout: () => ['notes/A.md', 'notes/B.md'],
        countPanesInLayout: () => 2,
        restoreFromHistoryEntry: async (id: string, idx: number) => {
            restoredSessionId = id;
            restoredIndex = idx;
            return true;
        },
        isVersionHistoryConfirmRestoreEnabled: () => false,
    };

    const session = {
        id: 'sess-1',
        name: 'My Workspace',
        layout: {},
        history: [
            { savedAt: now - 1000, layout: {} },
            { savedAt: now - 86400000, layout: {} },
            { savedAt: now - 3 * 86400000, layout: {} },
            { savedAt: now - 30 * 86400000, layout: {} },
        ],
    };

    const modal = new HistoryModal(app, mockPlugin, session);
    modal.open();

    const dateLabels = modal.contentEl.querySelectorAll('.wpp-history-date-label');
    assert.ok(dateLabels.length >= 3);

    const restoreBtns = modal.contentEl.querySelectorAll('.wpp-history-restore-btn');
    assert.equal(restoreBtns.length, 4);

    (restoreBtns[0] as HTMLButtonElement).click();
    await new Promise((resolve) => setTimeout(resolve, 10));

    assert.equal(restoredSessionId, 'sess-1');
    assert.equal(restoredIndex, 0);

    // Empty state
    const emptyModal = new HistoryModal(app, mockPlugin, { id: 'sess-2', name: 'Empty', layout: {}, history: [] });
    emptyModal.open();
    assert.ok(emptyModal.contentEl.querySelector('.wpp-history-empty'));
});

test.after(() => harness.restore());
