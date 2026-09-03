import { type App } from 'obsidian';
import { L } from '../i18n.ts';
import { DialogModal, type DialogAction, type DialogActionTone } from './dialog-modal.ts';

export interface ConfirmModalOptions {
    confirmText?: string;
    confirmClass?: string;
    hint?: string;
    onHintClick?: () => void;

    /**
     * Run when the dialog goes away without confirming - button, Escape,
     * click-outside. Optional, and none of the twenty existing call sites pass
     * one, so their behaviour is unchanged: dismissing a confirmation still
     * does nothing at all.
     */
    onCancel?: () => void;
}

export class ConfirmModal extends DialogModal {
    private readonly message: string;
    private readonly onConfirm: () => void;
    private readonly options: ConfirmModalOptions;

    constructor(
        app: App,
        message: string,
        onConfirm: () => void,
        options?: ConfirmModalOptions
    ) {
        const opts = options || {};
        super(app, opts.onCancel ? { onCancel: opts.onCancel } : {});
        this.message = message;
        this.onConfirm = onConfirm;
        this.options = opts;
    }

    protected override renderBody(contentEl: HTMLElement): void {
        contentEl.createEl('p', { text: this.message });
    }

    protected override actions(): readonly DialogAction[] {
        // Affirmative *and* usually destructive. `mod-warning` is the default
        // because most of the twenty callers are deletes and resets, and
        // defaulting a confirmation to the safe-looking colour is the wrong way
        // round. Callers whose action can be undone pass `mod-cta`.
        const tone: DialogActionTone =
            this.options.confirmClass === 'mod-cta' ? 'default' : 'destructive';

        return [{
            text: this.options.confirmText || String(L.delete || 'Delete'),
            kind: 'affirmative',
            tone,
            run: () => { this.onConfirm(); },
        }];
    }

    protected override renderFooter(contentEl: HTMLElement): void {
        const hint = this.options.hint;
        if (!hint) return;
        // Below the buttons, where it was: it offers a way out rather than a
        // third answer, so it is not one of the actions.
        const hintEl = contentEl.createDiv({ cls: 'wpp-confirm-hint' });

        // A link only when there is somewhere to go. Every hint was an `<a>`
        // whose click cancelled the dialog, and only one of the three callers
        // passes an `onHintClick`: the other two are sentences explaining what
        // the confirmation will leave behind, and reading one dismissed the
        // dialog it was explaining.
        const onHintClick = this.options.onHintClick;
        if (!onHintClick) {
            hintEl.setText(hint);
            return;
        }

        const hintLink = hintEl.createEl('a', { text: hint });
        hintLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.cancel();
            onHintClick();
        });
    }
}
