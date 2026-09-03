import { Notice, Setting, type App } from 'obsidian';
import { ConfirmModal } from './modals/confirm-modal.ts';

/** A label that is either already a string or a locale getter to call now. */
export type SettingText = string | (() => string) | undefined;

export interface ToggleSettingOptions {
    name: SettingText;
    desc?: SettingText;
    value?: boolean | undefined;
    disabled?: boolean | undefined;
    onChange(value: boolean): void;
}

export interface DropdownSettingOptions {
    name: SettingText;
    desc?: SettingText;
    items?: Record<string, SettingText> | undefined;
    value: string | number | boolean;
    disabled?: boolean | undefined;
    onChange(value: string): void;
}

export interface DangerResetSettingOptions {
    name: SettingText;
    desc: SettingText;
    buttonText: SettingText;
    confirmMessage: string;
    confirmHint?: string | undefined;
    successNotice: string;
    failureNotice: string;
    run(): Promise<unknown>;
}

/** Obsidian's button handle, plus the pre-1.12 fallback this code still allows for. */
interface WarnableButton {
    setWarning?: () => unknown;
    buttonEl?: HTMLElement;
}

export function resolveSettingText(value: SettingText): string {
    if (typeof value === 'function') return value();
    return typeof value === 'string' ? value : '';
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

export function addToggleSetting(parentEl: HTMLElement, options: ToggleSettingOptions): Setting {
    const setting = new Setting(parentEl).setName(resolveSettingText(options.name));
    if (options.desc) setting.setDesc(resolveSettingText(options.desc));

    setting.addToggle((toggle) => {
        toggle.setValue(!!options.value);
        if (options.disabled) toggle.setDisabled(true);
        toggle.onChange((value) => { options.onChange(value); });
    });

    return setting;
}

export function addDropdownSetting(parentEl: HTMLElement, options: DropdownSettingOptions): Setting {
    const setting = new Setting(parentEl).setName(resolveSettingText(options.name));
    if (options.desc) setting.setDesc(resolveSettingText(options.desc));

    setting.addDropdown((dropdown) => {
        const items = options.items || {};
        for (const key of Object.keys(items)) {
            dropdown.addOption(key, resolveSettingText(items[key]));
        }
        // The value is set after the options exist, or the dropdown has nothing
        // to select.
        dropdown.setValue(String(options.value));
        if (options.disabled) dropdown.setDisabled(true);
        dropdown.onChange((value) => { options.onChange(value); });
    });

    return setting;
}

/**
 * A subsection heading, through Obsidian's own `setHeading()`.
 *
 * Same reason as `addSection`: a raw `<h4>` is a heading element the settings
 * screen did not style. The scanner flagged only the `<h3>`, but both are the
 * same mistake and the pair should not disagree.
 *
 * Returns the row element for callers that want to nest inside it - the switch
 * preview block hangs its two per-direction toggles off the master row.
 */
export function addSubsection(parentEl: HTMLElement, title: SettingText): HTMLElement {
    const setting = new Setting(parentEl).setName(resolveSettingText(title)).setHeading();
    setting.settingEl.addClass('wpp-settings-subsection');
    return setting.settingEl;
}

export function addDangerResetSetting(
    parentEl: HTMLElement,
    app: App,
    display: () => void,
    options: DangerResetSettingOptions
): void {
    new Setting(parentEl)
        .setName(resolveSettingText(options.name))
        .setDesc(resolveSettingText(options.desc))
        .addButton((btn) => {
            // Per button, not per module: two of these can be on screen at once
            // and they must not disable each other.
            let isRunning = false;
            btn.setButtonText(resolveSettingText(options.buttonText));
            applyWarningStyle(btn);
            btn.onClick(() => {
                // A second click while the first is still running would delete
                // twice, and the second run sees the state the first left.
                if (isRunning) return;
                const confirmOptions: { confirmText?: string; hint?: string } = {
                    confirmText: resolveSettingText(options.buttonText),
                };
                if (options.confirmHint) confirmOptions.hint = options.confirmHint;
                new ConfirmModal(app, options.confirmMessage, () => {
                    isRunning = true;
                    btn.setDisabled(true);
                    // ConfirmModal ignores what this returns; the chain below is
                    // what re-enables the button and redraws.
                    void options.run()
                        .then(() => { new Notice(options.successNotice); })
                        .catch(() => { new Notice(options.failureNotice); })
                        .then(() => {
                            isRunning = false;
                            btn.setDisabled(false);
                            // Redraw: what the action changed is on this screen.
                            display();
                        });
                }, confirmOptions).open();
            });
        });
}
