import { type App, Modal } from 'obsidian';
import { L } from '../i18n.ts';

export interface ConfirmModalOptions {
    confirmText?: string;
    confirmClass?: string;
    hint?: string;
    onHintClick?: () => void;
}

export class ConfirmModal extends Modal {
    private readonly message: string;
    private readonly onConfirm: () => void;
    private readonly options: ConfirmModalOptions;
    private buttons: HTMLButtonElement[] = [];
    private focusedButtonIndex: number = 1;
    private confirmKeyHandler: ((e: KeyboardEvent) => void) | null = null;

    constructor(
        app: App,
        message: string,
        onConfirm: () => void,
        options?: ConfirmModalOptions
    ) {
        super(app);
        this.message = message;
        this.onConfirm = onConfirm;
        this.options = options || {};
    }

    override onOpen(): void {
        // Ensure confirm modal appears above the switch overlay (z-index 9999)
        this.containerEl.style.setProperty('z-index', '10001');
        const contentEl = this.contentEl;
        contentEl.createEl('p', { text: this.message });
        const btns = contentEl.createDiv({ cls: 'wpp-confirm-buttons' });

        const cancelBtn = btns.createEl('button', { text: String(L.cancel || 'Cancel') });
        cancelBtn.addEventListener('click', () => {
            this.close();
        });

        const confirmText = this.options.confirmText || String(L.delete || 'Delete');
        const confirmClass = this.options.confirmClass || 'mod-warning';
        const confirmBtn = btns.createEl('button', { text: confirmText, cls: confirmClass });
        confirmBtn.addEventListener('click', () => {
            this.onConfirm();
            this.close();
        });

        if (this.options.hint) {
            const hintEl = contentEl.createDiv({ cls: 'wpp-confirm-hint' });
            const hintLink = hintEl.createEl('a', { text: this.options.hint });
            hintLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.close();
                if (this.options.onHintClick) {
                    this.options.onHintClick();
                }
            });
        }

        this.buttons = [cancelBtn, confirmBtn];
        this.focusedButtonIndex = 1; // Default focus on confirm action
        this.updateButtonFocus();

        // Keyboard handler
        this.confirmKeyHandler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                this.focusedButtonIndex = 0;
                this.updateButtonFocus();
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                this.focusedButtonIndex = 1;
                this.updateButtonFocus();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (this.focusedButtonIndex === 0) {
                    this.close();
                } else {
                    this.onConfirm();
                    this.close();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopImmediatePropagation();
                this.close();
            }
        };

        const targetDoc = this.containerEl.ownerDocument || document;
        targetDoc.addEventListener('keydown', this.confirmKeyHandler, true);
    }

    private updateButtonFocus(): void {
        this.buttons.forEach((btn, i) => {
            btn.classList.toggle('wpp-btn-focused', i === this.focusedButtonIndex);
        });
    }

    override onClose(): void {
        if (this.confirmKeyHandler) {
            const targetDoc = this.containerEl.ownerDocument || document;
            targetDoc.removeEventListener('keydown', this.confirmKeyHandler, true);
            this.confirmKeyHandler = null;
        }
        this.contentEl.empty();
    }
}
