import { Notice, type Setting } from 'obsidian';
import type { SettingGroupItem } from 'obsidian';
import { ConfirmModal } from '../modals/confirm-modal.ts';
import type { SettingsContext } from '../settings-tab.ts';

export interface DangerRowOptions {
    readonly name: string;
    readonly desc: string;
    readonly buttonText: string;
    readonly confirmMessage: string;
    readonly confirmHint?: string;
    readonly successNotice: string;
    readonly failureNotice: string;
    run(): Promise<unknown>;
}

/** Obsidian's button handle, plus the pre-1.12 fallback this code still allows for. */
interface WarnableButton {
    setWarning?: () => unknown;
    buttonEl?: HTMLElement;
}

// setWarning() is the documented way to mark a destructive button, but it has
// not always existed; the class it adds is the same one, so an older Obsidian
// still gets the red button rather than an unstyled one.
function applyWarningStyle(btn: WarnableButton): void {
    if (typeof btn.setWarning === 'function') {
        btn.setWarning();
        return;
    }
    btn.buttonEl?.addClass('mod-warning');
}

/**
 * A destructive row: red button, confirmation, notice either way.
 *
 * A `render` rather than an `action`: an `action` makes the whole row clickable
 * and gives it no button, and a row that wipes every session on a stray click
 * is not what these four are. The red button is the affordance, and it has to
 * be aimed at.
 */
export function dangerRow(ctx: SettingsContext, options: DangerRowOptions): SettingGroupItem {
    return {
        name: options.name,
        desc: options.desc,
        render: (setting: Setting) => {
            setting.addButton((btn) => {
                // Per button, not per page: four of these are on screen at once
                // and they must not disable each other.
                let isRunning = false;
                btn.setButtonText(options.buttonText);
                applyWarningStyle(btn);
                btn.onClick(() => {
                    // A second click while the first is still running would
                    // delete twice, and the second run sees the state the first
                    // left.
                    if (isRunning) return;
                    const confirmOptions: { confirmText?: string; hint?: string } = {
                        confirmText: options.buttonText,
                    };
                    if (options.confirmHint) confirmOptions.hint = options.confirmHint;

                    new ConfirmModal(ctx.app, options.confirmMessage, () => {
                        isRunning = true;
                        btn.setDisabled(true);
                        // ConfirmModal ignores what this returns; the chain
                        // below is what re-enables the button and re-reads.
                        void options.run()
                            .then(() => { new Notice(options.successNotice); })
                            .catch(() => { new Notice(options.failureNotice); })
                            .then(() => {
                                isRunning = false;
                                btn.setDisabled(false);
                                // What the action changed is on this screen.
                                ctx.update();
                            });
                    }, confirmOptions).open();
                });
            });
        },
    };
}
