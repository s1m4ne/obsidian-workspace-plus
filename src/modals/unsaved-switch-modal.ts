import { type App, Modal } from 'obsidian';
import { L } from '../i18n.ts';

export class UnsavedSwitchModal extends Modal {
    private readonly message: string;
    private readonly onSaveAndSwitch: () => void;
    private readonly onSwitchWithoutSaving: () => void;
    private readonly onCancel: () => void;
    private didResolve: boolean = false;
    private buttons: HTMLButtonElement[] = [];
    private focusedButtonIndex: number = 1;
    private keyHandler: ((e: KeyboardEvent) => void) | null = null;

    constructor(
        app: App,
        message: string,
        onSaveAndSwitch: () => void,
        onSwitchWithoutSaving: () => void,
        onCancel?: () => void
    ) {
        super(app);
        this.message = message;
        this.onSaveAndSwitch = onSaveAndSwitch;
        this.onSwitchWithoutSaving = onSwitchWithoutSaving;
        this.onCancel = onCancel || (() => {});
    }

    override onOpen(): void {
        this.containerEl.style.setProperty('z-index', '10001');

        const contentEl = this.contentEl;
        contentEl.createEl('p', { text: this.message });

        const btns = contentEl.createDiv({ cls: 'wpp-confirm-buttons' });
        const finish = (callback: () => void) => {
            if (this.didResolve) return;
            this.didResolve = true;
            callback();
        };

        const cancelBtn = btns.createEl('button', { text: String(L.cancel || 'Cancel') });
        cancelBtn.addEventListener('click', () => {
            finish(this.onCancel);
            this.close();
        });

        const saveAndSwitchBtn = btns.createEl('button', {
            text: String(L.saveAndSwitch || 'Save and switch'),
            cls: 'mod-cta',
        });
        saveAndSwitchBtn.addEventListener('click', () => {
            finish(this.onSaveAndSwitch);
            this.close();
        });

        const switchWithoutSavingBtn = btns.createEl('button', {
            text: String(L.switchWithoutSaving || 'Switch without saving'),
            cls: 'mod-warning',
        });
        switchWithoutSavingBtn.addEventListener('click', () => {
            finish(this.onSwitchWithoutSaving);
            this.close();
        });

        this.buttons = [cancelBtn, saveAndSwitchBtn, switchWithoutSavingBtn];
        this.focusedButtonIndex = 1;
        this.updateButtonFocus();

        this.keyHandler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                this.focusedButtonIndex =
                    (this.focusedButtonIndex - 1 + this.buttons.length) % this.buttons.length;
                this.updateButtonFocus();
                return;
            }
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                this.focusedButtonIndex = (this.focusedButtonIndex + 1) % this.buttons.length;
                this.updateButtonFocus();
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                const btn = this.buttons[this.focusedButtonIndex];
                if (btn) btn.click();
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopImmediatePropagation();
                finish(this.onCancel);
                this.close();
            }
        };

        const targetDoc = this.containerEl.ownerDocument || document;
        targetDoc.addEventListener('keydown', this.keyHandler, true);
    }

    private updateButtonFocus(): void {
        this.buttons.forEach((btn, i) => {
            btn.classList.toggle('wpp-btn-focused', i === this.focusedButtonIndex);
        });
    }

    override onClose(): void {
        if (this.keyHandler) {
            const targetDoc = this.containerEl.ownerDocument || document;
            targetDoc.removeEventListener('keydown', this.keyHandler, true);
            this.keyHandler = null;
        }
        if (!this.didResolve) {
            this.didResolve = true;
            this.onCancel();
        }
        this.contentEl.empty();
    }
}
