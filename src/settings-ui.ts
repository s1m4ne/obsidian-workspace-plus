import { Modal, Notice, Setting, type App } from 'obsidian';
import { L } from './i18n.ts';
import { ConfirmModal } from './modals/confirm-modal.ts';
import type { SessionGroup } from './storage/default-data.ts';
import type { GroupStore } from './state/group-store.ts';
import type { SessionStore } from './state/session-store.ts';

/** A label that is either already a string or a locale getter to call now. */
export type SettingText = string | (() => string) | undefined;

export interface GroupSessionsModalHost {
    /**
     * The session set, its ordering and the CRUD on it are owned by
     * SessionStore. Naming the store rather than restating its methods keeps
     * one list, the way getGroupStore() and getSessionSaver() do.
     */
    getSessionStore(): SessionStore;

    /**
     * Group state is owned by GroupStore. Naming the store rather than
     * restating its methods keeps one list: the plugin used to carry a
     * forwarding method per call, and one added to the store without a shim
     * did nothing from here while the type checker saw a host that simply
     * lacked the member.
     */
    getGroupStore(): GroupStore;

}

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

export class GroupSessionsModal extends Modal {
    private readonly plugin: GroupSessionsModalHost;
    private readonly group: SessionGroup;

    constructor(app: App, plugin: GroupSessionsModalHost, group: SessionGroup) {
        super(app);
        this.plugin = plugin;
        this.group = group;
    }

    override onOpen(): void {
        const contentEl = this.contentEl;
        contentEl.empty();
        contentEl.createEl('h3', { text: `${this.group.name} — ${resolveSettingText(L.settingsGroupManageSessions)}` });

        const allSessions = this.plugin.getSessionStore().getOrderedSessionsUnfiltered();
        // Membership is read once: the toggles below change it, and re-reading
        // per row would have each row see the previous row's edit.
        const memberIds = this.plugin.getGroupStore().getGroupSessionIds(this.group.id);

        for (const session of allSessions) {
            const isMember = memberIds.indexOf(session.id) !== -1;
            new Setting(contentEl)
                .setName(session.name)
                .addToggle((toggle) => {
                    toggle.setValue(isMember);
                    toggle.onChange((value) => {
                        if (value) void this.plugin.getGroupStore().addSessionToGroup(session.id, this.group.id);
                        else void this.plugin.getGroupStore().removeSessionFromGroup(session.id, this.group.id);
                    });
                });
        }
    }

    override onClose(): void {
        this.contentEl.empty();
    }
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

export function addSubsection(parentEl: HTMLElement, title: SettingText): HTMLElement {
    const headingEl = parentEl.createEl('h4', { text: resolveSettingText(title) });
    headingEl.addClass('wpp-settings-subsection');
    return headingEl;
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
