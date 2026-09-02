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

    // The order is the decision, so it is asserted rather than assumed. The
    // discard option is at the far left, away from Enter; it used to be at the
    // right-hand end, one arrow key from the default.
    const labels = [...modal.contentEl.querySelectorAll('.wpp-confirm-buttons button')]
        .map((b) => b.textContent);
    assert.deepEqual(labels, [
        String(L.switchWithoutSaving),
        String(L.cancel),
        String(L.saveAndSwitch),
    ]);

    const buttons = [...modal.contentEl.querySelectorAll('.wpp-confirm-buttons button')];
    assert.equal(buttons[0]?.classList.contains('mod-warning'), true, 'discard is destructive');
    assert.equal(buttons[2]?.classList.contains('mod-cta'), true, 'the affirmative action is the cta');

    // The ring starts on the affirmative action, and it is painted - what Enter
    // does must never be a guess.
    assert.equal(buttons[2]?.classList.contains('wpp-btn-focused'), true);

    const doc = modal.containerEl.ownerDocument || document;

    // Right is clamped at the affirmative end rather than wrapping round to the
    // discard button.
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight' }));
    assert.equal(buttons[2]?.classList.contains('wpp-btn-focused'), true);

    // Two lefts to reach the discard option: the distance is the safety.
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowLeft' }));
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
        restoreFromHistoryEntry: async (id: string, idx: number) => {
            restoredSessionId = id;
            restoredIndex = idx;
            return true;
        },
        isVersionHistoryConfirmRestoreEnabled: () => false,
    };

    // A real layout rather than `{}`: the row summary comes from describeLayout
    // now, so the entry has to carry something for it to describe. The right
    // sidebar's backlink pane names a file that is not open, which is the case
    // that used to reach the screen.
    const entryLayout = {
        main: {
            id: 'm',
            type: 'tabs',
            currentTab: 0,
            children: [
                { id: 'l1', type: 'leaf', state: { type: 'markdown', state: { file: 'notes/A.md' } } },
                { id: 'l2', type: 'leaf', state: { type: 'markdown', state: { file: 'notes/B.md' } } },
            ],
        },
        right: {
            id: 'r',
            type: 'tabs',
            children: [
                { id: 'r1', type: 'leaf', state: { type: 'backlink', state: { file: 'archive/Old.md' } } },
            ],
        },
    };

    const session = {
        id: 'sess-1',
        name: 'My Workspace',
        layout: entryLayout,
        history: [
            { savedAt: now - 1000, layout: entryLayout },
            { savedAt: now - 86400000, layout: entryLayout },
            { savedAt: now - 3 * 86400000, layout: entryLayout },
            { savedAt: now - 30 * 86400000, layout: entryLayout },
        ],
    };

    const modal = new HistoryModal(app, mockPlugin, session);
    modal.open();

    const dateLabels = modal.contentEl.querySelectorAll('.wpp-history-date-label');
    assert.ok(dateLabels.length >= 3);

    const summaries = modal.contentEl.querySelectorAll('.wpp-history-summary');
    assert.equal(summaries.length, 4);
    assert.equal(summaries[0]!.textContent, '2 panes \u00b7 A.md, B.md');

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

/**
 * The reported fault: from every rename route, the dialog opened with the name
 * selected and Enter did nothing. `doRename` returned on
 * `newName === currentName` without closing, so pressing the button did nothing
 * either - it was never a keyboard problem.
 */
test('RenameModal: Enter with the name untouched closes and reports nothing', () => {
    let renamed: string | null = null;
    const modal = new RenameModal(app, 'Work', (name: string) => { renamed = name; });
    modal.open();

    const input = modal.contentEl.querySelector('input');
    assert.equal(input?.value, 'Work', 'it opens on the current name');

    const doc = modal.containerEl.ownerDocument || document;
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter' }));

    assert.equal(renamed, null, 'an unchanged name is nothing to do');
    // This dialog specifically, not a count of every modal on the page: other
    // tests in this file leave theirs open.
    assert.equal(
        modal.containerEl.isConnected, false,
        'and the dialog closes rather than sitting there unresponsive',
    );
});

test('RenameModal: the ring is on the confirm button while the field has focus', () => {
    const modal = new RenameModal(app, 'Work', () => {});
    modal.open();

    const buttons = [...modal.contentEl.querySelectorAll('.wpp-confirm-buttons button')];
    assert.deepEqual(buttons.map((b) => b.textContent), [String(L.cancel), String(L.rename)]);

    // Painted from the start. RenameModal was the one dialog that never called
    // its own ring update, so nothing was marked and `mod-cta` merely looked
    // selected - which is what "the button is selected but Enter does nothing"
    // was describing.
    assert.equal(buttons[1]?.classList.contains('wpp-btn-focused'), true);
    modal.close();
});

test('RenameModal: an empty name keeps the dialog open to be corrected', () => {
    let renamed: string | null = null;
    const modal = new RenameModal(app, 'Work', (name: string) => { renamed = name; }, {
        emptyNotice: 'Name cannot be empty',
    });
    modal.open();

    const input = modal.contentEl.querySelector('input');
    if (input) input.value = '   ';

    const doc = modal.containerEl.ownerDocument || document;
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter' }));

    assert.equal(renamed, null);
    assert.equal(
        modal.containerEl.isConnected, true,
        'an unusable name must not close the dialog',
    );
    modal.close();
});

test('RenameModal: a changed name commits', () => {
    let renamed: string | null = null;
    const modal = new RenameModal(app, 'Work', (name: string) => { renamed = name; });
    modal.open();

    const input = modal.contentEl.querySelector('input');
    if (input) input.value = '  Work 2  ';

    const doc = modal.containerEl.ownerDocument || document;
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter' }));

    assert.equal(renamed, 'Work 2', 'trimmed, and committed');
});

/**
 * The other half of the reported fault's family: `saveAsSession()` wraps this
 * dialog in a promise whose resolve was reachable only from the affirmative
 * paths, so dismissing it left the promise pending and dropped the
 * continuation. Every dismissal settles exactly once now.
 */
test('RenameModal: dismissing settles the cancel callback exactly once', () => {
    let cancels = 0;
    const modal = new RenameModal(app, 'Work', () => {}, { onCancel: () => { cancels += 1; } });
    modal.open();

    const doc = modal.containerEl.ownerDocument || document;
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
    assert.equal(cancels, 1, 'Escape settles it');

    // onClose runs on the way out too; it must not settle a second time.
    modal.close();
    assert.equal(cancels, 1);
});

test('RenameModal: committing does not also report a cancel', () => {
    let cancels = 0;
    let renamed: string | null = null;
    const modal = new RenameModal(app, 'Work', (name: string) => { renamed = name; }, {
        onCancel: () => { cancels += 1; },
    });
    modal.open();
    const input = modal.contentEl.querySelector('input');
    if (input) input.value = 'Work 2';
    const doc = modal.containerEl.ownerDocument || document;
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter' }));

    assert.equal(renamed, 'Work 2');
    assert.equal(cancels, 0, 'an answered dialog is not a cancelled one');
});

test('the dialogs guard IME composition, so an Enter that commits a conversion is not a press', () => {
    let confirmed = false;
    const modal = new ConfirmModal(app, 'Delete?', () => { confirmed = true; });
    modal.open();

    const doc = modal.containerEl.ownerDocument || document;
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', isComposing: true }));
    assert.equal(confirmed, false, 'a composing Enter belongs to the field');

    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter' }));
    assert.equal(confirmed, true);
});

test('ConfirmModal: the destructive default is the affirmative action, and it is last', () => {
    const modal = new ConfirmModal(app, 'Delete "Work"?', () => {});
    modal.open();

    const buttons = [...modal.contentEl.querySelectorAll('.wpp-confirm-buttons button')];
    assert.deepEqual(buttons.map((b) => b.textContent), [String(L.cancel), String(L.delete)]);
    // Destructive by colour, affirmative by position: the two are separate
    // decisions, and conflating them put this button on the wrong side.
    assert.equal(buttons[1]?.classList.contains('mod-warning'), true);
    assert.equal(buttons[1]?.classList.contains('wpp-btn-focused'), true);
    modal.close();
});

test('ConfirmModal: a reversible action is the cta instead', () => {
    const modal = new ConfirmModal(app, 'Restore?', () => {}, {
        confirmText: 'Restore',
        confirmClass: 'mod-cta',
    });
    modal.open();
    const buttons = [...modal.contentEl.querySelectorAll('.wpp-confirm-buttons button')];
    assert.equal(buttons[1]?.classList.contains('mod-cta'), true);
    assert.equal(buttons[1]?.classList.contains('mod-warning'), false);
    modal.close();
});
