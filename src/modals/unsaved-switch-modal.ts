import { type App } from 'obsidian';
import { L } from '../i18n.ts';
import { DialogModal, type DialogAction } from './dialog-modal.ts';

export class UnsavedSwitchModal extends DialogModal {
    private readonly message: string;
    private readonly onSaveAndSwitch: () => void;
    private readonly onSwitchWithoutSaving: () => void;

    constructor(
        app: App,
        message: string,
        onSaveAndSwitch: () => void,
        onSwitchWithoutSaving: () => void,
        onCancel?: () => void
    ) {
        // The once-only settle this dialog used to implement itself, with its own
        // `didResolve` flag, is the base class's behaviour for all three now. It
        // is required here rather than optional: a switch is waiting on the
        // answer, and dismissing the dialog has to count as "no".
        super(app, { onCancel: onCancel || (() => {}) });
        this.message = message;
        this.onSaveAndSwitch = onSaveAndSwitch;
        this.onSwitchWithoutSaving = onSwitchWithoutSaving;
    }

    protected override renderBody(contentEl: HTMLElement): void {
        contentEl.createEl('p', { text: this.message });
    }

    protected override actions(): readonly DialogAction[] {
        // The order this produces is the one thing about these three dialogs
        // that changes visibly:
        //
        //   was  [ Cancel ][ Save and switch ][ Switch without saving ]
        //   now  [ Switch without saving ][ Cancel ][ Save and switch ]
        //
        // "Switch without saving" throws away work that is not recorded
        // anywhere, and it used to sit at the right-hand end, one arrow key from
        // the default. macOS puts the discard choice at the far left of its own
        // save dialog for exactly this reason.
        return [
            {
                text: String(L.switchWithoutSaving || 'Switch without saving'),
                kind: 'secondary',
                tone: 'destructive',
                run: () => { this.onSwitchWithoutSaving(); },
            },
            {
                text: String(L.saveAndSwitch || 'Save and switch'),
                kind: 'affirmative',
                run: () => { this.onSaveAndSwitch(); },
            },
        ];
    }
}
