import { type App, Notice } from 'obsidian';
import { L } from '../i18n.ts';
import { DialogModal, type DialogAction, type DialogResult } from './dialog-modal.ts';

export interface RenameModalOptions {
    title?: string;
    placeholder?: string;
    buttonText?: string;
    skipButtonText?: string;
    emptyNotice?: string;
    onSkip?: () => void;

    /**
     * Run when the dialog goes away without an answer. `saveAsSession()` and
     * `saveCurrentLayoutToSession()` wrap this dialog in a promise whose
     * `resolve` was reachable only from onRename and onSkip, so dismissing it
     * left the promise pending forever and dropped whatever was chained onto
     * it - the session list simply never refreshed.
     */
    onCancel?: () => void;
}

export class RenameModal extends DialogModal {
    private readonly currentName: string;
    private readonly onRename: (newName: string) => void;
    private readonly modalOptions: RenameModalOptions;

    constructor(
        app: App,
        currentName: string,
        onRename: (newName: string) => void,
        options?: RenameModalOptions
    ) {
        const opts = options || {};
        super(app, opts.onCancel ? { onCancel: opts.onCancel } : {});
        this.currentName = currentName;
        this.onRename = onRename;
        this.modalOptions = opts;
    }

    protected override renderBody(contentEl: HTMLElement): void {
        const opts = this.modalOptions;
        this.titleEl.setText(opts.title || String(L.renameTitle || ''));

        const input = contentEl.createEl('input', {
            type: 'text',
            value: this.currentName,
            placeholder: opts.placeholder || String(L.renamePlaceholder || ''),
            cls: 'wpp-rename-input',
        });
        input.select();
        // The base focuses this after Obsidian has had its go at the first
        // field, and keeps the ring on the affirmative button meanwhile.
        this.inputEl = input;
    }

    protected override actions(): readonly DialogAction[] {
        const opts = this.modalOptions;
        const actions: DialogAction[] = [];

        // "Save without naming" - only on the save-as flow. Secondary rather
        // than affirmative, and not destructive: it saves under the existing
        // name rather than throwing anything away.
        if (opts.skipButtonText && opts.onSkip) {
            actions.push({
                text: opts.skipButtonText,
                kind: 'secondary',
                run: () => { opts.onSkip?.(); },
            });
        }

        actions.push({
            text: opts.buttonText || String(L.rename || 'Rename'),
            kind: 'affirmative',
            run: () => this.commit(),
        });

        return actions;
    }

    private commit(): DialogResult {
        const input = this.inputEl;
        const newName = (input?.value ?? '').trim();

        if (!newName) {
            // An empty name on the save-as flow means "don't name it", which is
            // what the skip button does.
            if (this.modalOptions.onSkip) {
                this.modalOptions.onSkip();
                return;
            }
            if (this.modalOptions.emptyNotice) {
                new Notice(this.modalOptions.emptyNotice);
            }
            // The name is not usable, so the dialog stays up for it to be
            // corrected rather than closing on an empty answer.
            return 'keep-open';
        }

        // An unchanged name used to `return` here without closing, which is why
        // opening the dialog and pressing Enter - or clicking the button, the
        // same code path - appeared to do nothing at all. `input.select()`
        // preselects the current name, so "unchanged" is the state it opens in.
        // The store already treats an unchanged name as nothing to do
        // (SessionStore.renameSessionById returns false), so this now just
        // closes and says nothing.
        if (newName === this.currentName) return;

        this.onRename(newName);
    }
}
