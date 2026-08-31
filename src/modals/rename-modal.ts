import { type App, Modal, Notice } from 'obsidian';
import { L } from '../i18n.ts';

export interface RenameModalOptions {
    title?: string;
    placeholder?: string;
    buttonText?: string;
    skipButtonText?: string;
    emptyNotice?: string;
    onSkip?: () => void;
}

export class RenameModal extends Modal {
    private readonly currentName: string;
    private readonly onRename: (newName: string) => void;
    private readonly modalOptions: RenameModalOptions;
    private buttons: HTMLButtonElement[] = [];
    private focusedButtonIndex: number = -1;
    private renameKeyHandler: ((e: KeyboardEvent) => void) | null = null;
    private keyHandlerDoc: Document = document;

    constructor(
        app: App,
        currentName: string,
        onRename: (newName: string) => void,
        options?: RenameModalOptions
    ) {
        super(app);
        this.currentName = currentName;
        this.onRename = onRename;
        this.modalOptions = options || {};
    }

    override onOpen(): void {
        const contentEl = this.contentEl;
        const opts = this.modalOptions;
        this.titleEl.setText(opts.title || String(L.renameTitle || ''));

        const input = contentEl.createEl('input', {
            type: 'text',
            value: this.currentName,
            placeholder: opts.placeholder || String(L.renamePlaceholder || ''),
            cls: 'wpp-rename-input',
        });
        input.select();

        const btns = contentEl.createDiv({ cls: 'wpp-confirm-buttons' });
        const cancelBtn = btns.createEl('button', { text: String(L.cancel || 'Cancel') });
        cancelBtn.addEventListener('click', () => {
            this.close();
        });

        // Optional skip button (e.g. "Save without naming")
        let skipBtn: HTMLButtonElement | null = null;
        if (opts.skipButtonText && opts.onSkip) {
            skipBtn = btns.createEl('button', { text: opts.skipButtonText });
            skipBtn.addEventListener('click', () => {
                if (opts.onSkip) {
                    opts.onSkip();
                }
                this.close();
            });
        }

        const renameBtn = btns.createEl('button', {
            text: opts.buttonText || String(L.rename || 'Rename'),
            cls: 'mod-cta',
        });

        const doRename = () => {
            const newName = input.value.trim();
            if (!newName) {
                if (opts.onSkip) {
                    opts.onSkip();
                    this.close();
                    return;
                }
                if (opts.emptyNotice) {
                    new Notice(opts.emptyNotice);
                }
                return;
            }
            if (newName === this.currentName) return;
            this.onRename(newName);
            this.close();
        };

        renameBtn.addEventListener('click', doRename);

        this.buttons = skipBtn ? [cancelBtn, skipBtn, renameBtn] : [cancelBtn, renameBtn];
        const lastBtnIdx = this.buttons.length - 1;
        this.focusedButtonIndex = -1; // -1 = input focused

        this.renameKeyHandler = (e: KeyboardEvent) => {
            // Skip during IME composition (e.g. Japanese input conversion)
            if (e.isComposing) return;

            if (this.focusedButtonIndex === -1) {
                // Input focused
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.focusedButtonIndex = lastBtnIdx;
                    this.updateRenameBtnFocus();
                    input.blur();
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    doRename();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    this.close();
                }
            } else {
                // Button focused
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.focusedButtonIndex = -1;
                    this.updateRenameBtnFocus();
                    input.focus();
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    if (this.focusedButtonIndex > 0) {
                        this.focusedButtonIndex--;
                    } else {
                        this.focusedButtonIndex = -1;
                        this.updateRenameBtnFocus();
                        input.focus();
                        return;
                    }
                    this.updateRenameBtnFocus();
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    if (this.focusedButtonIndex < lastBtnIdx) {
                        this.focusedButtonIndex++;
                        this.updateRenameBtnFocus();
                    }
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    this.buttons[this.focusedButtonIndex]?.click();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    this.close();
                }
            }
        };

        // Held rather than recomputed at close: removeEventListener has to target
        // the same document the listener went onto.
        this.keyHandlerDoc = this.containerEl.ownerDocument || document;
        this.keyHandlerDoc.addEventListener('keydown', this.renameKeyHandler, true);

        window.setTimeout(() => {
            input.focus();
        }, 50);
    }

    private updateRenameBtnFocus(): void {
        this.buttons.forEach((btn, i) => {
            btn.classList.toggle('wpp-btn-focused', i === this.focusedButtonIndex);
        });
    }

    override onClose(): void {
        if (this.renameKeyHandler) {
            this.keyHandlerDoc.removeEventListener('keydown', this.renameKeyHandler, true);
            this.renameKeyHandler = null;
        }
        this.contentEl.empty();
    }
}
