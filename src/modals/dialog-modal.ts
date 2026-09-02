import { type App, Modal } from 'obsidian';
import { L } from '../i18n.ts';

/**
 * The shared behaviour of every question dialog: a message or a field, a row of
 * buttons, and one keyboard contract.
 *
 * Three dialogs implemented this separately and agreed on almost nothing - three
 * different arrow models, two different Enter routes, the focus ring painted in
 * two of the three, and only one of them guaranteeing a result when dismissed.
 * Rename's Enter appearing to do nothing came out of exactly that spread.
 *
 * The contract, decided rather than derived:
 *
 * - **Order is macOS's.** `[ discard ] … [ cancel ] [ affirmative ]`. A third
 *   option that throws work away sits at the far left, away from the Enter
 *   target. Apple's own save dialog is `Don't Save … Cancel  Save` for this
 *   reason: putting "discard" next to the default is how one arrow key plus
 *   Enter loses work.
 * - **The dialog focuses what you came to do.** A dialog with a field focuses
 *   the field, because you came to type; one without focuses the affirmative
 *   button, because you came to confirm. That has to be done explicitly and
 *   late: Obsidian focuses something of its own when the modal opens, and for
 *   a confirmation that is the first button in the row, which is Cancel. While
 *   nothing here chose, the delete dialog opened with Cancel focused and Enter
 *   cancelled the delete.
 * - **Arrow left and right move real focus along the row**, clamped rather
 *   than wrapped, so the discard choice is never one key from the default.
 * - **Enter fires whatever holds focus**; with the field focused, it fires the
 *   affirmative action. Through `click()`, never a re-implementation, so the
 *   mouse and the keyboard cannot drift apart.
 *
 *   Two indicators, because they say different things, which is how every
 *   platform's dialogs work: the *focus ring* is where typing goes and where
 *   the arrows left off, and the *fill* - `mod-cta` or `mod-warning` against a
 *   plain Cancel - is what Enter does. The ring is Obsidian's own, because
 *   these are real `<button>` elements.
 *
 *   The version before this one painted its own ring, `.wpp-btn-focused`, a 2px
 *   `--interactive-accent` outline that moved with the arrows while real focus
 *   stayed elsewhere. Two problems: on a red `mod-warning` button the accent
 *   outline is a different colour from the fill, so it read as "this row is
 *   selected"; and the handler clicked `buttons[ringIndex]` unconditionally, so
 *   tabbing to Cancel and pressing Enter ran the affirmative action anyway.
 * - **Cancel settles exactly once, however the dialog goes away** - button,
 *   Escape, click-outside, or Obsidian closing it. `saveAsSession()` wraps this
 *   dialog in a promise whose `resolve` was reachable only from the affirmative
 *   paths, so dismissing it leaked the promise and dropped the continuation.
 * - **`isComposing` guards everything**, whether or not the dialog has a field
 *   today. An IME commit arrives as Enter and belongs to the field.
 *
 * Tab works too, and is left alone. The plugin's own `:focus-visible` rules
 * exist for the controls it builds out of divs, which inherit nothing; these
 * buttons need none of that.
 *
 * `kind` and `tone` are separate on purpose. They were one field in the first
 * draft, which broke the commonest dialog of the three: a delete confirmation's
 * button is destructive *and* is the affirmative action, so colour and position
 * cannot be the same decision.
 */

/** Where the button sits. Exactly one action is `affirmative`, and it goes last. */
export type DialogActionKind = 'affirmative' | 'secondary';

/** How the button is painted. `destructive` is anything that cannot be undone. */
export type DialogActionTone = 'default' | 'destructive';

/**
 * An action closes the dialog unless it says otherwise. `'keep-open'` is for the
 * case where the answer is not usable yet and the user has to correct it - an
 * empty name, say - so the dialog stays up with what they typed still in it.
 */
export type DialogResult = void | 'keep-open';

export interface DialogAction {
    readonly text: string;
    readonly kind: DialogActionKind;
    readonly tone?: DialogActionTone;
    readonly run: () => DialogResult;
}

export interface DialogModalOptions {
    /** Overrides the shared "Cancel". */
    readonly cancelText?: string;

    /** Run once, whatever makes the dialog go away without an action. */
    readonly onCancel?: () => void;
}

export abstract class DialogModal extends Modal {
    private readonly dialogOptions: DialogModalOptions;

    private buttons: HTMLButtonElement[] = [];

    /** The button Enter fires when focus is not on one of them. */
    private affirmativeBtn: HTMLButtonElement | null = null;

    /** Set by a subclass that has a text field, so real focus can start there. */
    protected inputEl: HTMLInputElement | null = null;

    private settled = false;
    private keyHandler: ((event: KeyboardEvent) => void) | null = null;

    /**
     * The document the listener went onto. Read again at close time it could be
     * a different one, and removeEventListener would take nothing off.
     */
    private listenerDoc: Document | null = null;

    constructor(app: App, options?: DialogModalOptions) {
        super(app);
        this.dialogOptions = options || {};
    }

    /** Build the message, the field, whatever sits above the buttons. */
    protected abstract renderBody(contentEl: HTMLElement): void;

    /** The actions, in any order; this class places them. */
    protected abstract actions(): readonly DialogAction[];

    /** Runs after the buttons exist, for anything that belongs below them. */
    protected renderFooter(_contentEl: HTMLElement): void {}

    override onOpen(): void {
        // Uniform across all three. Two carried this and one did not; whether
        // Obsidian's --layer-modal already clears --layer-popover cannot be read
        // from this repository, so all three carry it rather than none.
        this.containerEl.addClass('wpp-modal-above-overlay');

        const contentEl = this.contentEl;
        contentEl.addClass('wpp-modal');

        this.renderBody(contentEl);

        const actions = this.actions();
        const affirmative = actions.filter((action) => action.kind === 'affirmative');
        if (affirmative.length !== 1) {
            throw new Error(`A dialog needs exactly one affirmative action, got ${affirmative.length}.`);
        }

        const btns = contentEl.createDiv({ cls: 'wpp-confirm-buttons' });
        this.buttons = [];

        // Left group: the secondary choices, destructive ones first so the most
        // dangerous is furthest from Enter.
        const secondary = actions.filter((action) => action.kind === 'secondary');
        secondary.sort((a, b) =>
            Number(b.tone === 'destructive') - Number(a.tone === 'destructive'));
        for (const action of secondary) {
            this.addButton(btns, action);
        }

        // Then cancel, then the affirmative action: the two right-hand buttons.
        const cancelBtn = btns.createEl('button', {
            text: this.dialogOptions.cancelText || String(L.cancel || 'Cancel'),
            cls: 'wpp-dialog-cancel',
        });
        cancelBtn.addEventListener('click', () => { this.cancel(); });
        this.buttons.push(cancelBtn);

        this.affirmativeBtn = this.addButton(btns, affirmative[0]!);

        this.renderFooter(contentEl);

        this.keyHandler = (event: KeyboardEvent): void => { this.onKeyDown(event); };
        this.listenerDoc = this.containerEl.ownerDocument;
        this.listenerDoc.addEventListener('keydown', this.keyHandler, true);

        this.focusInitialTarget();
    }

    /**
     * What you came to do: the field if there is one, the affirmative button if
     * there is not.
     *
     * Late, on a timer, for the reason SessionManagerModal uses the same one:
     * Obsidian focuses something itself when the modal opens, and setting focus
     * during onOpen loses to it. Leaving it to Obsidian is what put Cancel
     * under Enter in every confirmation.
     */
    private focusInitialTarget(): void {
        const target = this.inputEl ?? this.affirmativeBtn;
        if (!target) return;
        const win = this.containerEl.ownerDocument.defaultView ?? window;
        win.setTimeout(() => {
            // The dialog may already be gone - an action can close it inside
            // the same tick a test drives.
            if (!this.buttons.length) return;
            target.focus();
        }, 50);
    }

    private addButton(parent: HTMLElement, action: DialogAction): HTMLButtonElement {
        // Position comes from `kind`, colour from `tone`. A delete confirmation
        // is affirmative and destructive at once.
        const cls = action.tone === 'destructive'
            ? 'mod-warning'
            : action.kind === 'affirmative' ? 'mod-cta' : '';
        const btn = parent.createEl(
            'button',
            cls ? { text: action.text, cls } : { text: action.text }
        );
        btn.addEventListener('click', () => {
            // Settled before running: the action may close the dialog, and
            // onClose must not then report a cancel on top of it.
            this.settled = true;
            if (action.run() === 'keep-open') {
                // Still unanswered, so it must not count as settled either.
                this.settled = false;
                return;
            }
            this.close();
        });
        this.buttons.push(btn);
        return btn;
    }

    private onKeyDown(event: KeyboardEvent): void {
        // An IME commit arrives as Enter. It belongs to the field, not the row.
        if (event.isComposing) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.cancel();
            return;
        }

        if (event.key === 'Enter') {
            // A button the user tabbed to owns its own Enter. Taking it here is
            // what made Tab-to-Cancel-then-Enter run the affirmative action.
            // Identity against the buttons this dialog built, rather than an
            // `instanceof HTMLButtonElement`: that constructor is not a global
            // in every environment this runs in, and a ReferenceError here
            // would silently swallow Enter.
            const active = this.containerEl.ownerDocument.activeElement;
            if (active && this.buttons.some((btn) => btn === active)) return;

            event.preventDefault();
            event.stopPropagation();
            // Through click(), so Enter and the mouse run the same handler.
            this.affirmativeBtn?.click();
            return;
        }

        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            // Inside the field these belong to the caret. Taking them would
            // make a dialog you are typing in jump to a button mid-word.
            if (this.inputEl && this.containerEl.ownerDocument.activeElement === this.inputEl) return;
            event.preventDefault();
            this.moveFocus(event.key === 'ArrowLeft' ? -1 : 1);
            return;
        }

        if (!this.inputEl) return;

        // With a field, up and down move real focus in and out of it.
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            this.inputEl.focus();
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            this.inputEl.blur();
        }
    }

    /**
     * Real focus along the row, clamped at both ends.
     *
     * Clamped rather than wrapped: wrapping puts the discard choice one key
     * from the affirmative action, which is exactly what the left-to-right
     * ordering above is arranged to avoid.
     */
    private moveFocus(step: number): void {
        const active = this.containerEl.ownerDocument.activeElement;
        const from = this.buttons.findIndex((btn) => btn === active);
        if (from === -1) {
            // Nothing in the row holds focus - the initial-focus timer has not
            // fired, or focus left the dialog. Either arrow enters at the
            // default target rather than at an end, so the first press never
            // lands somewhere the user did not ask for.
            this.affirmativeBtn?.focus();
            return;
        }
        const next = from + step;
        if (next < 0 || next >= this.buttons.length) return;
        this.buttons[next]?.focus();
    }

    /** Settle as cancelled, once. */
    protected cancel(): void {
        if (!this.settled) {
            this.settled = true;
            this.dialogOptions.onCancel?.();
        }
        this.close();
    }

    override onClose(): void {
        if (this.keyHandler && this.listenerDoc) {
            this.listenerDoc.removeEventListener('keydown', this.keyHandler, true);
            this.keyHandler = null;
            this.listenerDoc = null;
        }
        // Click-outside and Obsidian's own close reach here without going
        // through cancel(), and a caller waiting on this dialog has to be told.
        if (!this.settled) {
            this.settled = true;
            this.dialogOptions.onCancel?.();
        }
        this.contentEl.empty();
    }
}
