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
                // Destructive, not primary: red, but not the button the eye
                // lands on first. `setWarning` is the 1.12 spelling and is
                // deprecated from 1.13.
                btn.setDestructive();
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
