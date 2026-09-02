import { Notice, PluginSettingTab, Setting, type App, type Plugin } from 'obsidian';
import { L, LANG_OPTIONS, LANG_ORDER } from './i18n.ts';
import { openHotkeysSetting } from './platform/obsidian-internals.ts';
import { ConfirmModal } from './modals/confirm-modal.ts';
import { RenameModal } from './modals/rename-modal.ts';
import { formatRelativeTime } from './modals/format-relative-time.ts';
import * as statusBarActions from './statusbar-actions.ts';
import {
    GroupSessionsModal,
    addDangerResetSetting,
    addDropdownSetting,
    addSubsection,
    addToggleSetting,
    resolveSettingText,
    type GroupSessionsModalHost,
    type SettingText,
} from './settings-ui.ts';
import type { SessionGroup, StatusBarActions } from './storage/default-data.ts';
import type { RotationBackupInfo } from './storage/storage-backup.ts';
import type { SettingsState } from './state/settings-state.ts';
import type { GroupStore } from './state/group-store.ts';
import type { SessionSaver } from './state/session-saver.ts';
import type { SessionStore } from './state/session-store.ts';
import type { HistoryService } from './state/history-service.ts';

export interface StorageDiagnosticsInfo {
    syncedByObsidianSync: boolean;
    sessionsPath: string;
    sessionsBackupPath: string;
    historyPath: string;
    sessionCount: number;
    updatedAt: number;
}

export interface SettingsTabHost extends GroupSessionsModalHost {
    /**
     * Owned by HistoryService; naming it keeps one list rather than a
     * forwarding method per call on the plugin.
     */
    getHistoryService(): HistoryService;

    /**
     * The session set, its ordering and the CRUD on it are owned by
     * SessionStore. Naming the store rather than restating its methods keeps
     * one list, the way getGroupStore() and getSessionSaver() do.
     */
    getSessionStore(): SessionStore;

    /**
     * Saving and the auto-save flags are owned by SessionSaver. Naming it here
     * rather than restating its methods keeps one list, the way getGroupStore()
     * does for group state.
     */
    getSessionSaver(): SessionSaver;

    /**
     * Group state is owned by GroupStore. Naming the store rather than
     * restating its methods keeps one list: the plugin used to carry a
     * forwarding method per call, and one added to the store without a shim
     * did nothing from here while the type checker saw a host that simply
     * lacked the member.
     */
    getGroupStore(): GroupStore;

    /**
     * The settings the UI writes are owned by SettingsState. Naming the store
     * here rather than restating its twenty-four setters keeps one list: the
     * plugin used to carry a forwarding method per setter, and a setter added
     * to the store without one silently did nothing from the settings screen.
     */
    getSettingsState(): SettingsState;

    manifest?: { name?: string } | undefined;
    data: {
        language?: string;
        statusBarActions?: Partial<StatusBarActions>;
        confirmQuickActions?: boolean;
        statusBarModScrollSwitch?: boolean;
        statusBarScrollPreset?: string;
        statusBarScrollModifierMode?: string;
        statusBarScrollThreshold?: number;
        statusBarScrollCooldownMs?: number;
        statusBarScrollResetMs?: number;
        statusBarScrollInvert?: boolean;
        showActiveSwitchCommand?: boolean;
        numberedSwitchCommands?: boolean;
        previewNext?: boolean;
        previewPrevious?: boolean;
        showFilterInput?: boolean;
        overlayDefaultFocus?: string;
        confirmDeleteByHotkey?: boolean;
        [key: string]: unknown;
    };
    /** Written by the manual backup button; a prototype accessor on the plugin. */
    _lastRotationBackupAt?: number;


    isSidebarRestoreEnabled(): boolean;




    extractSessionData(data: unknown): Record<string, unknown>;
    prepareRotationBackupData(sessionData: unknown): Record<string, unknown>;
    ensureDir(path: string): Promise<unknown>;
    getBackupsDirPath(): string;
    copyFileIfExists(from: string, to: string): Promise<unknown>;
    getRotationBackupPath(generation: number): string;
    writeJson(path: string, data: unknown): Promise<unknown>;
    getRotationBackupInfo(): Promise<RotationBackupInfo[]>;
    restoreFromRotationBackup(generation: number): Promise<boolean>;


    getSessionsPath(): string;
    getSessionStorageLocation(): string;
    setSessionStorageLocation(location: string): Promise<unknown>;
    exportSessionsSnapshot(): Promise<unknown>;
    importSessionsFromLatestExport(): Promise<unknown>;

    resetSettingsToDefault(): Promise<unknown>;
    clearBackupsAndVersionHistory(): Promise<unknown>;
    resetSessionsAndSettingsToDefault(): Promise<unknown>;

    getStorageDiagnosticsInfo(): StorageDiagnosticsInfo;
    getSessionStorageSize(): Promise<number | null>;
}

type TabId = 'general' | 'sessions' | 'groups' | 'advanced';

// Which locale key names each status-bar click slot. The slots are data, so the
// labels cannot be written beside them.
const SLOT_LABEL_KEYS: Record<string, string> = {
    click: 'statusBarSlotClick',
    altClick: 'statusBarSlotAltClick',
    modClick: 'statusBarSlotModClick',
    shiftClick: 'statusBarSlotShiftClick',
    middleClick: 'statusBarSlotMiddleClick',
    altMiddleClick: 'statusBarSlotAltMiddleClick',
    modMiddleClick: 'statusBarSlotModMiddleClick',
    shiftMiddleClick: 'statusBarSlotShiftMiddleClick',
    rightClick: 'statusBarSlotRightClick',
    altRightClick: 'statusBarSlotAltRightClick',
    modRightClick: 'statusBarSlotModRightClick',
    shiftRightClick: 'statusBarSlotShiftRightClick',
};

function text(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

function format(value: unknown, ...args: (string | number)[]): string {
    if (typeof value !== 'function') return '';
    return (value as (...callArgs: (string | number)[]) => string)(...args);
}

function localeEntry(key: string): SettingText {
    const value = (L as Record<string, unknown>)[key];
    if (typeof value === 'function') return value as () => string;
    return typeof value === 'string' ? value : '';
}

function formatByteSize(bytes: number | null): string {
    if (typeof bytes !== 'number' || !isFinite(bytes) || bytes < 0) return '—';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
}

// A timestamp the user can read, falling back to the raw number rather than
// leaving the row blank if the locale formatter throws.
function absoluteTime(savedAt: number): string {
    try {
        return new Date(savedAt).toLocaleString();
    } catch {
        return String(savedAt);
    }
}

export class WorkspacePlusPlusSettingTab extends PluginSettingTab {
    private readonly plugin: SettingsTabHost;
    activeTab: TabId | null = null;

    constructor(app: App, plugin: SettingsTabHost) {
        // At run time this *is* the plugin. The parameter is typed structurally
        // so a test can supply the sixty-odd members this tab actually uses
        // instead of a whole Plugin, which is why the base class needs the cast.
        super(app, plugin as unknown as Plugin);
        this.plugin = plugin;
    }

    override display(): void {
        const containerEl = this.containerEl;
        containerEl.empty();

        if (!this.activeTab) this.activeTab = 'general';

        const tabs: { id: TabId; label: unknown }[] = [
            { id: 'general', label: L.settingsSectionGeneral },
            { id: 'sessions', label: L.settingsTabSessions },
            { id: 'groups', label: L.settingsSectionGroups },
            { id: 'advanced', label: L.settingsSectionAdvanced },
        ];
        const tabBarEl = containerEl.createDiv({ cls: 'wpp-settings-tab-bar' });
        for (const tab of tabs) {
            const btn = tabBarEl.createEl('button', {
                text: text(tab.label),
                cls: `wpp-settings-tab${tab.id === this.activeTab ? ' is-active' : ''}`,
            });
            btn.addEventListener('click', () => {
                this.activeTab = tab.id;
                this.display();
            });
        }

        const contentEl = containerEl.createDiv({ cls: 'wpp-settings-tab-content' });

        if (this.activeTab === 'general') this.displayGeneral(contentEl);
        if (this.activeTab === 'sessions') this.displaySessions(contentEl);
        if (this.activeTab === 'groups') this.displayGroups(contentEl);
        if (this.activeTab === 'advanced') this.displayAdvanced(contentEl);

        this.displayFooter(containerEl);
    }

    private addSection(contentEl: HTMLElement, title: unknown): void {
        contentEl.createEl('h3', { text: text(title), cls: 'wpp-settings-section-title' });
    }

    private displayGeneral(contentEl: HTMLElement): void {
        new Setting(contentEl)
            .setName(text(L.settingsLanguage))
            .setDesc(text(L.settingsLanguageDesc))
            .addDropdown((dropdown) => {
                dropdown.addOption('auto', text(L.settingsLangAuto));
                for (const code of LANG_ORDER) {
                    dropdown.addOption(code, LANG_OPTIONS[code] ?? code);
                }
                dropdown.setValue(this.plugin.data.language || 'auto');
                dropdown.onChange((value) => {
                    void this.plugin.getSettingsState().setLanguageSetting(value).then(() => { this.display(); });
                });
            });

        new Setting(contentEl)
            .setName(text(L.settingsHotkeys))
            .addButton((btn) => {
                btn.setButtonText(text(L.settingsHotkeysBtn));
                btn.onClick(() => {
                    openHotkeysSetting(this.app, this.plugin.manifest?.name || 'Workspace++');
                });
            });

        this.addSection(contentEl, L.settingsSectionStatusBar);

        for (const slotKey of statusBarActions.SLOT_KEYS) {
            const labelKey = SLOT_LABEL_KEYS[slotKey];
            new Setting(contentEl)
                .setName(labelKey ? resolveSettingText(localeEntry(labelKey)) : slotKey)
                .addDropdown((dropdown) => {
                    for (const actionId of statusBarActions.ACTION_IDS) {
                        dropdown.addOption(actionId, statusBarActions.getActionLabel(L, actionId));
                    }
                    dropdown.setValue((this.plugin.data.statusBarActions || {})[slotKey] || 'none');
                    dropdown.onChange((value) => { void this.plugin.getSettingsState().setStatusBarAction(slotKey, value); });
                });
        }
    }

    private displaySessions(contentEl: HTMLElement): void {
        addSubsection(contentEl, text(L.settingsSubsectionAutoSaveMode));

        const autoSaveOnSwitch = this.plugin.getSessionSaver().isAutoSaveOnSwitchEnabled();
        new Setting(contentEl)
            .setName(text(L.settingsAutoSaveOnSwitch))
            .setDesc(text(L.settingsAutoSaveOnSwitchDesc))
            .addToggle((toggle) => {
                toggle.setValue(autoSaveOnSwitch);
                toggle.onChange((value) => {
                    void this.plugin.getSessionSaver().setAutoSaveOnSwitch(value).then(() => { this.display(); });
                });
            });

        // These three only mean anything when the layout is not saved on every
        // switch: with auto-save on there is nothing unsaved to warn about.
        if (!autoSaveOnSwitch) {
            addToggleSetting(contentEl, {
                name: text(L.settingsWarnUnsavedSwitch),
                desc: text(L.settingsWarnUnsavedSwitchDesc),
                value: this.plugin.getSessionSaver().isWarnOnUnsavedSwitchEnabled(),
                onChange: (value) => { void this.plugin.getSettingsState().setWarnOnUnsavedSwitch(value); },
            });

            addToggleSetting(contentEl, {
                name: text(L.settingsHighlightUnsavedSessionChanges),
                desc: text(L.settingsHighlightUnsavedSessionChangesDesc),
                value: this.plugin.getSessionSaver().isUnsavedStatusBarHighlightEnabled(),
                onChange: (value) => { void this.plugin.getSettingsState().setUnsavedStatusBarHighlight(value); },
            });

            addToggleSetting(contentEl, {
                name: text(L.settingsConfirmQuickActions),
                desc: text(L.settingsConfirmQuickActionsDesc),
                value: !!this.plugin.data.confirmQuickActions,
                onChange: (value) => { void this.plugin.getSettingsState().setConfirmQuickActions(value); },
            });
        }

        addSubsection(contentEl, text(L.settingsSubsectionSessionRestore));

        addToggleSetting(contentEl, {
            name: text(L.settingsRestoreSidebars),
            desc: text(L.settingsRestoreSidebarsDesc),
            value: this.plugin.isSidebarRestoreEnabled(),
            onChange: (value) => { void this.plugin.getSettingsState().setRestoreSidebars(value); },
        });

        this.displayScrollSwitch(contentEl);
        this.displaySwitchCommands(contentEl);
        this.displaySwitchPreview(contentEl);
        this.displaySessionListSearch(contentEl);
        this.displayDeletion(contentEl);
        this.displayVersionHistory(contentEl);
        this.displayRotationBackup(contentEl);
    }

    private displayScrollSwitch(contentEl: HTMLElement): void {
        addSubsection(contentEl, text(L.settingsSubsectionScrollSwitch));

        addToggleSetting(contentEl, {
            name: text(L.settingsStatusBarModScrollSwitch),
            desc: text(L.settingsStatusBarModScrollSwitchDesc),
            value: !!this.plugin.data.statusBarModScrollSwitch,
            onChange: (value) => {
                void this.plugin.getSettingsState().setStatusBarModScrollSwitch(value).then(() => { this.display(); });
            },
        });

        if (!this.plugin.data.statusBarModScrollSwitch) return;

        addDropdownSetting(contentEl, {
            name: text(L.settingsStatusBarScrollPreset),
            desc: text(L.settingsStatusBarScrollPresetDesc),
            value: this.plugin.data.statusBarScrollPreset || 'trackpad',
            items: {
                trackpad: text(L.settingsStatusBarScrollPresetTrackpad),
                notchedWheel: text(L.settingsStatusBarScrollPresetNotchedWheel),
                freeSpinWheel: text(L.settingsStatusBarScrollPresetFreeSpinWheel),
                custom: text(L.settingsStatusBarScrollPresetCustom),
            },
            onChange: (value) => {
                void this.plugin.getSettingsState().setStatusBarScrollPreset(value).then(() => { this.display(); });
            },
        });

        addDropdownSetting(contentEl, {
            name: text(L.settingsStatusBarScrollModifier),
            desc: text(L.settingsStatusBarScrollModifierDesc),
            // 'recommended' is the stored name of what the UI calls modOrAlt.
            value: this.plugin.data.statusBarScrollModifierMode === 'recommended'
                ? 'modOrAlt'
                : (this.plugin.data.statusBarScrollModifierMode || 'none'),
            items: {
                none: text(L.settingsStatusBarScrollModifierNone),
                modOnly: text(L.settingsStatusBarScrollModifierModOnly),
                altOnly: text(L.settingsStatusBarScrollModifierAltOnly),
                modOrAlt: text(L.settingsStatusBarScrollModifierModOrAlt),
            },
            onChange: (value) => { void this.plugin.getSettingsState().setStatusBarScrollModifierMode(value); },
        });

        // The three numbers below belong to the custom preset; the other presets
        // set them, so they are shown greyed rather than hidden.
        const useCustomScroll = (this.plugin.data.statusBarScrollPreset || 'trackpad') === 'custom';

        addDropdownSetting(contentEl, {
            name: text(L.settingsStatusBarScrollThreshold),
            desc: text(L.settingsStatusBarScrollThresholdDesc),
            value: String(this.plugin.data.statusBarScrollThreshold || 30),
            disabled: !useCustomScroll,
            items: { '12': '12', '16': '16', '24': '24', '30': '30', '40': '40', '60': '60', '90': '90' },
            onChange: (value) => { void this.plugin.getSettingsState().setStatusBarScrollThreshold(value); },
        });

        addDropdownSetting(contentEl, {
            name: text(L.settingsStatusBarScrollCooldown),
            desc: text(L.settingsStatusBarScrollCooldownDesc),
            value: String(this.plugin.data.statusBarScrollCooldownMs || 500),
            disabled: !useCustomScroll,
            items: { '200': '200 ms', '350': '350 ms', '500': '500 ms', '750': '750 ms', '1000': '1000 ms' },
            onChange: (value) => { void this.plugin.getSettingsState().setStatusBarScrollCooldownMs(value); },
        });

        addDropdownSetting(contentEl, {
            name: text(L.settingsStatusBarScrollResetWindow),
            desc: text(L.settingsStatusBarScrollResetWindowDesc),
            value: String(this.plugin.data.statusBarScrollResetMs || 250),
            disabled: !useCustomScroll,
            items: { '150': '150 ms', '250': '250 ms', '400': '400 ms', '600': '600 ms' },
            onChange: (value) => { void this.plugin.getSettingsState().setStatusBarScrollResetMs(value); },
        });

        addToggleSetting(contentEl, {
            name: text(L.settingsStatusBarScrollInvert),
            desc: text(L.settingsStatusBarScrollInvertDesc),
            value: !!this.plugin.data.statusBarScrollInvert,
            onChange: (value) => { void this.plugin.getSettingsState().setStatusBarScrollInvert(value); },
        });
    }

    private displaySwitchCommands(contentEl: HTMLElement): void {
        addSubsection(contentEl, text(L.settingsSubsectionSwitchCommands));

        addToggleSetting(contentEl, {
            name: text(L.settingsShowActiveSwitchCommand),
            desc: text(L.settingsShowActiveSwitchCommandDesc),
            value: !!this.plugin.data.showActiveSwitchCommand,
            onChange: (value) => { void this.plugin.getSettingsState().setShowActiveSwitchCommand(value); },
        });

        addToggleSetting(contentEl, {
            name: text(L.settingsNumberedSwitchCommands),
            desc: text(L.settingsNumberedSwitchCommandsDesc),
            value: !!this.plugin.data.numberedSwitchCommands,
            onChange: (value) => { void this.plugin.getSettingsState().setNumberedSwitchCommands(value); },
        });
    }

    private displaySwitchPreview(contentEl: HTMLElement): void {
        addSubsection(contentEl, text(L.settingsSubsectionSwitchPreview));

        // The master toggle is on only when both directions are, so turning it
        // on cannot leave a half-enabled state behind.
        const allOn = !!this.plugin.data.previewNext && !!this.plugin.data.previewPrevious;
        const masterSetting = new Setting(contentEl)
            .setName(text(L.settingsPreviewHeading))
            .setDesc(text(L.settingsPreviewDesc))
            .addToggle((toggle) => {
                toggle.setValue(allOn);
                toggle.onChange((value) => {
                    void this.plugin.getSettingsState().setSwitchPreviewEnabled(value).then(() => { this.display(); });
                });
            });

        masterSetting.settingEl.addClass('wpp-has-nested');
        const nestedDiv = masterSetting.settingEl.createDiv({ cls: 'wpp-nested-settings' });

        new Setting(nestedDiv)
            .setName(text(L.settingsPreviewNext))
            .addToggle((toggle) => {
                toggle.setValue(!!this.plugin.data.previewNext);
                toggle.onChange((value) => {
                    void this.plugin.getSettingsState().setPreviewNext(value).then(() => { this.display(); });
                });
            });

        new Setting(nestedDiv)
            .setName(text(L.settingsPreviewPrevious))
            .addToggle((toggle) => {
                toggle.setValue(!!this.plugin.data.previewPrevious);
                toggle.onChange((value) => {
                    void this.plugin.getSettingsState().setPreviewPrevious(value).then(() => { this.display(); });
                });
            });
    }

    private displaySessionListSearch(contentEl: HTMLElement): void {
        this.addSection(contentEl, L.settingsSectionSessionListSearch);

        addToggleSetting(contentEl, {
            name: text(L.settingsShowFilterInput),
            desc: text(L.settingsShowFilterInputDesc),
            value: !!this.plugin.data.showFilterInput,
            onChange: (value) => { void this.plugin.getSettingsState().setShowFilterInput(value); },
        });

        new Setting(contentEl)
            .setName(text(L.settingsOverlayDefaultFocus))
            .setDesc(text(L.settingsOverlayDefaultFocusDesc))
            .addDropdown((dropdown) => {
                dropdown.addOption('current-session', text(L.settingsOverlayFocusCurrentSession));
                dropdown.addOption('session-filter', text(L.settingsOverlayFocusSessionFilter));
                dropdown.addOption('session-create', text(L.settingsOverlayFocusSessionCreate));
                dropdown.setValue(this.plugin.data.overlayDefaultFocus || 'current-session');
                dropdown.onChange((value) => { void this.plugin.getSettingsState().setOverlayDefaultFocus(value); });
            });
    }

    private displayDeletion(contentEl: HTMLElement): void {
        this.addSection(contentEl, L.settingsSectionDeletion);

        addToggleSetting(contentEl, {
            name: text(L.settingsConfirmDelete),
            desc: text(L.settingsConfirmDeleteDesc),
            // Absent means on: the confirmation predates the setting.
            value: this.plugin.data.confirmDeleteByHotkey !== false,
            onChange: (value) => { void this.plugin.getSettingsState().setConfirmDeleteByHotkey(value); },
        });
    }

    private displayVersionHistory(contentEl: HTMLElement): void {
        this.addSection(contentEl, L.historyTitle);

        const versionHistoryEnabled = this.plugin.getHistoryService().isVersionHistoryEnabled();
        const vhMasterSetting = new Setting(contentEl)
            .setName(text(L.settingsVersionHistoryEnabled))
            .setDesc(text(L.settingsVersionHistoryEnabledDesc))
            .addToggle((toggle) => {
                toggle.setValue(versionHistoryEnabled);
                toggle.onChange((value) => {
                    void this.plugin.getSettingsState().setVersionHistoryEnabled(value).then(() => { this.display(); });
                });
            });

        vhMasterSetting.settingEl.addClass('wpp-has-nested');
        const vhNestedDiv = vhMasterSetting.settingEl.createDiv({ cls: 'wpp-nested-settings' });

        // The interval only applies while switching saves automatically -
        // otherwise snapshots are taken on the explicit save instead.
        if (this.plugin.getSessionSaver().isAutoSaveOnSwitchEnabled()) {
            new Setting(vhNestedDiv)
                .setName(text(L.settingsVersionHistoryInterval))
                .setDesc(text(L.settingsVersionHistoryIntervalDesc))
                .addDropdown((dropdown) => {
                    for (const minutes of ['1', '2', '5', '10', '15', '30']) {
                        dropdown.addOption(minutes, minutes);
                    }
                    dropdown.setValue(String(this.plugin.getHistoryService().getVersionHistorySnapshotInterval()));
                    if (!versionHistoryEnabled) dropdown.setDisabled(true);
                    dropdown.onChange((value) => { void this.plugin.getSettingsState().setVersionHistorySnapshotInterval(value); });
                });
        }

        addToggleSetting(vhNestedDiv, {
            name: text(L.settingsVersionHistoryConfirmRestore),
            desc: text(L.settingsVersionHistoryConfirmRestoreDesc),
            value: this.plugin.getHistoryService().isVersionHistoryConfirmRestoreEnabled(),
            disabled: !versionHistoryEnabled,
            onChange: (value) => { void this.plugin.getSettingsState().setVersionHistoryConfirmRestore(value); },
        });
    }

    private displayRotationBackup(contentEl: HTMLElement): void {
        this.addSection(contentEl, L.rotationBackupSectionTitle);

        new Setting(contentEl)
            .setName(text(L.rotationBackupCreate))
            .setDesc(text(L.rotationBackupDesc))
            .addButton((btn) => {
                btn.setButtonText(text(L.rotationBackupCreateBtn));
                btn.onClick(() => {
                    btn.setDisabled(true);
                    const sessionData = this.plugin.extractSessionData(this.plugin.data);
                    sessionData._wppSavedAt = Date.now();
                    const backupData = this.plugin.prepareRotationBackupData(sessionData);
                    // Generations shift oldest-first, so nothing is overwritten
                    // before it has been copied forward.
                    void this.plugin.ensureDir(this.plugin.getBackupsDirPath())
                        .then(() => this.plugin.copyFileIfExists(
                            this.plugin.getRotationBackupPath(2),
                            this.plugin.getRotationBackupPath(3),
                        ))
                        .then(() => this.plugin.copyFileIfExists(
                            this.plugin.getRotationBackupPath(1),
                            this.plugin.getRotationBackupPath(2),
                        ))
                        .then(() => this.plugin.writeJson(this.plugin.getRotationBackupPath(1), backupData))
                        .then(() => {
                            this.plugin._lastRotationBackupAt = Date.now();
                            this.display();
                        })
                        .catch(() => { btn.setDisabled(false); });
                });
            });

        const backupListEl = contentEl.createDiv({ cls: 'wpp-backup-list' });
        // Shown until the read finishes, so the section is never empty.
        backupListEl.createDiv({ text: text(L.rotationBackupNone), cls: 'wpp-backup-none' });

        void this.plugin.getRotationBackupInfo().then((backups) => {
            backupListEl.empty();
            if (backups.length === 0) {
                backupListEl.createDiv({ text: text(L.rotationBackupNone), cls: 'wpp-backup-none' });
                return;
            }
            for (const backup of backups) {
                this.renderBackupRow(backupListEl, backup);
            }
        });
    }

    private renderBackupRow(backupListEl: HTMLElement, backup: RotationBackupInfo): void {
        const savedAtText = absoluteTime(backup.savedAt);
        const summary = `${formatRelativeTime(backup.savedAt)}  ·  ${format(L.rotationBackupGeneration, backup.sessionCount)}`;
        let desc = savedAtText;
        if (backup.backupPlatform) desc += `  ·  ${backup.backupPlatform}`;

        const setting = new Setting(backupListEl);
        setting.nameEl.createSpan({ text: `${backup.generation}.`, cls: 'wpp-backup-generation-num' });
        setting.nameEl.appendText(summary);

        setting.setDesc(desc).addButton((btn) => {
            btn.setButtonText(text(L.rotationBackupRestore));
            btn.onClick(() => {
                new ConfirmModal(
                    this.app,
                    format(L.rotationBackupRestoreConfirm, savedAtText, backup.sessionCount),
                    // ConfirmModal ignores what this returns, so the restore is
                    // deliberately not awaited - it redraws itself when it lands.
                    () => {
                        void this.plugin.restoreFromRotationBackup(backup.generation).then((ok) => {
                            if (ok) this.display();
                        });
                    },
                    { confirmText: text(L.rotationBackupRestore) },
                ).open();
            });
        });
    }

    private displayGroups(contentEl: HTMLElement): void {
        addToggleSetting(contentEl, {
            name: text(L.settingsSectionGroups),
            desc: text(L.settingsSectionGroupsDesc),
            value: this.plugin.getGroupStore().isGroupFeatureEnabled(),
            onChange: (value) => {
                void this.plugin.getGroupStore().setGroupFeatureEnabled(value).then(() => { this.display(); });
            },
        });

        if (!this.plugin.getGroupStore().isGroupFeatureEnabled()) return;

        const createGroupSetting = new Setting(contentEl)
            .setName(text(L.settingsGroupCreate))
            .setDesc(text(L.settingsGroupCreateDesc));

        let groupNameInput: { getValue(): string } | null = null;
        createGroupSetting.addText((input) => {
            groupNameInput = input;
            input.setPlaceholder(text(L.settingsGroupCreatePlaceholder));
        });

        createGroupSetting.addButton((btn) => {
            btn.setButtonText(text(L.settingsGroupCreateBtn));
            btn.onClick(() => {
                if (!groupNameInput) return;
                void this.plugin.getGroupStore().createGroupValidated(groupNameInput.getValue()).then((created) => {
                    if (created) this.display();
                });
            });
        });

        for (const group of this.plugin.getGroupStore().getOrderedGroups()) {
            this.renderGroupRow(contentEl, group);
        }
    }

    private renderGroupRow(contentEl: HTMLElement, group: SessionGroup): void {
        const sessionCount = this.plugin.getGroupStore().getGroupSessionIds(group.id).length;
        const groupSetting = new Setting(contentEl)
            .setName(group.name)
            .setDesc(`${text(L.settingsGroupManageSessionsDesc)} · ${format(L.settingsGroupSessionCount, sessionCount)}`);

        groupSetting.addButton((btn) => {
            btn.setButtonText(text(L.settingsGroupManageSessions));
            btn.onClick(() => { new GroupSessionsModal(this.app, this.plugin, group).open(); });
        });

        groupSetting.addExtraButton((btn) => {
            btn.setIcon('pencil');
            btn.setTooltip(text(L.rename));
            btn.onClick(() => {
                new RenameModal(this.app, group.name, (newName: string) => {
                    void this.plugin.getGroupStore().renameGroupValidated(group.id, newName).then((renamed) => {
                        if (renamed) this.display();
                    });
                }, { emptyNotice: text(L.groupEmptyName) }).open();
            });
        });

        groupSetting.addExtraButton((btn) => {
            btn.setIcon('trash-2');
            btn.setTooltip(text(L.settingsGroupDelete));
            btn.onClick(() => {
                new ConfirmModal(this.app, format(L.settingsGroupDeleteConfirm, group.name), () => {
                    void this.plugin.getGroupStore().deleteGroup(group.id).then(() => { this.display(); });
                }).open();
            });
        });
    }

    private displayAdvanced(contentEl: HTMLElement): void {
        this.addSection(contentEl, L.settingsAdvancedStorageSubsection);

        new Setting(contentEl)
            .setName(text(L.settingsSessionStorageLocation))
            .setDesc(format(L.settingsSessionStorageLocationDesc, this.plugin.getSessionsPath()));

        addToggleSetting(contentEl, {
            name: text(L.settingsVaultOnlySessions),
            desc: text(L.settingsVaultOnlySessionsDesc),
            value: this.plugin.getSessionStorageLocation() === 'vault-folder',
            onChange: (value) => {
                void this.plugin
                    .setSessionStorageLocation(value ? 'vault-folder' : 'plugin-folder')
                    .then(() => { this.display(); })
                    .catch(() => {
                        // The move rolls itself back, so the screen has to be
                        // redrawn from what the location actually is now.
                        new Notice(text(L.sessionStorageMoveFailed));
                        this.display();
                    });
            },
        });

        this.addSection(contentEl, L.settingsAdvancedTransferSubsection);

        new Setting(contentEl)
            .setName(text(L.settingsExportSessions))
            .setDesc(text(L.settingsExportSessionsDesc))
            .addButton((btn) => {
                btn.setButtonText(text(L.settingsExportSessionsBtn));
                btn.onClick(() => {
                    void this.plugin.exportSessionsSnapshot().catch(() => {
                        new Notice(text(L.exportSessionsFailed));
                    });
                });
            });

        new Setting(contentEl)
            .setName(text(L.settingsImportSessions))
            .setDesc(text(L.settingsImportSessionsDesc))
            .addButton((btn) => {
                btn.setButtonText(text(L.settingsImportSessionsBtn));
                btn.onClick(() => {
                    // Import replaces every session, so it asks first even
                    // though it is not in the reset section.
                    new ConfirmModal(this.app, text(L.confirmImportSessions), () => {
                        void this.plugin.importSessionsFromLatestExport().catch(() => {
                            new Notice(text(L.importSessionsFailed));
                        });
                    }, { confirmText: text(L.settingsImportSessionsBtn) }).open();
                });
            });

        this.displayResets(contentEl);
        this.displayDeveloperTools(contentEl);
    }

    private displayResets(contentEl: HTMLElement): void {
        this.addSection(contentEl, L.settingsSectionReset);
        const redraw = (): void => { this.display(); };

        addDangerResetSetting(contentEl, this.app, redraw, {
            name: text(L.settingsResetSettings),
            desc: text(L.settingsResetSettingsDesc),
            buttonText: text(L.settingsResetSettingsBtn),
            confirmMessage: text(L.confirmResetSettings),
            run: () => this.plugin.resetSettingsToDefault(),
            successNotice: text(L.resetSettingsDone),
            failureNotice: text(L.resetSettingsFailed),
        });

        addDangerResetSetting(contentEl, this.app, redraw, {
            name: text(L.settingsResetSessions),
            desc: text(L.settingsResetSessionsDesc),
            buttonText: text(L.settingsResetSessionsBtn),
            confirmMessage: text(L.confirmResetSessions),
            confirmHint: text(L.resetSessionsHint),
            run: () => this.plugin.getSessionStore().resetSessionsToDefault(),
            successNotice: text(L.resetSessionsDone),
            failureNotice: text(L.resetSessionsFailed),
        });

        addDangerResetSetting(contentEl, this.app, redraw, {
            name: text(L.settingsResetBackupsAndHistory),
            desc: text(L.settingsResetBackupsAndHistoryDesc),
            buttonText: text(L.settingsResetBackupsAndHistoryBtn),
            confirmMessage: text(L.confirmResetBackupsAndHistory),
            confirmHint: text(L.resetBackupsAndHistoryHint),
            run: () => this.plugin.clearBackupsAndVersionHistory(),
            successNotice: text(L.resetBackupsAndHistoryDone),
            failureNotice: text(L.resetBackupsAndHistoryFailed),
        });

        addDangerResetSetting(contentEl, this.app, redraw, {
            name: text(L.settingsResetSessionsAndSettings),
            desc: text(L.settingsResetSessionsAndSettingsDesc),
            buttonText: text(L.settingsResetSessionsAndSettingsBtn),
            confirmMessage: text(L.confirmResetSessionsAndSettings),
            run: () => this.plugin.resetSessionsAndSettingsToDefault(),
            successNotice: text(L.resetSessionsAndSettingsDone),
            failureNotice: text(L.resetSessionsAndSettingsFailed),
        });
    }

    private displayDeveloperTools(contentEl: HTMLElement): void {
        this.addSection(contentEl, L.settingsDeveloperSection);

        const info = this.plugin.getStorageDiagnosticsInfo();
        const devCardEl = contentEl.createDiv({ cls: 'wpp-dev-card' });
        devCardEl.createDiv({ text: text(L.settingsStorageDiagnostics), cls: 'wpp-dev-card-title' });
        devCardEl.createDiv({ text: text(L.settingsStorageDiagnosticsDesc), cls: 'wpp-dev-card-desc' });

        const addRow = (label: unknown, value: unknown, options: { code?: boolean } = {}): HTMLElement => {
            const row = devCardEl.createDiv({ cls: 'wpp-dev-card-row' });
            row.createDiv({ text: text(label), cls: 'wpp-dev-card-label' });
            return row.createDiv({
                text: String(value),
                cls: options.code ? 'wpp-dev-card-value wpp-dev-card-value-code' : 'wpp-dev-card-value',
            });
        };

        addRow(L.settingsStorageFieldSessions, info.sessionsPath, { code: true });
        addRow(L.settingsStorageFieldSessionsBackup, info.sessionsBackupPath, { code: true });
        addRow(L.settingsStorageFieldHistory, info.historyPath, { code: true });
        addRow(L.settingsStorageFieldSessionCount, info.sessionCount);

        // The size is read from disk, so the row is filled in when it arrives.
        const sizeValueEl = addRow(L.settingsStorageFieldDataSize, '…');
        void this.plugin.getSessionStorageSize().then((size) => {
            sizeValueEl.setText(size === null ? '—' : formatByteSize(size));
        });

        addRow(L.settingsStorageFieldUpdatedAt, absoluteTime(info.updatedAt));

        if (info.syncedByObsidianSync) {
            devCardEl.createDiv({ text: text(L.settingsStorageSyncHint), cls: 'wpp-dev-card-desc' });
        }
    }

    private displayFooter(containerEl: HTMLElement): void {
        const footerEl = containerEl.createDiv({ cls: 'wpp-settings-footer' });
        footerEl.createEl('p', { text: text(L.settingsTranslationHelp), cls: 'wpp-settings-footer-help' });

        footerEl.createEl('a', {
            text: text(L.settingsGitHubLink),
            href: 'https://github.com/s1m4ne/obsidian-workspace-plus',
        });
    }
}
