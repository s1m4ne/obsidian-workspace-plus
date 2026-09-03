import { DEFAULT_DATA, type PluginData, type StatusBarActions, type StatusBarSlotKey } from '../storage/default-data.ts';
import { persistIfNeeded, type PersistOption } from './persist-option.ts';
import { resolveLocale } from '../i18n.ts';
import { BACKUP_GENERATION_CHOICES, DEFAULT_BACKUP_GENERATIONS } from '../storage/backup-pool.ts';

export interface SettingsStateHost {
    data: PluginData;
    persistData: () => Promise<boolean>;
    updateStatusBar?: () => void;
    syncSessionCommands?: () => void;
    startHistorySnapshotTimer?: () => void;
    stopHistorySnapshotTimer?: () => void;
}

/** Was its own `{ persist?: boolean }`; the name stays for its 26 call sites. */
export type SetOption = PersistOption;

function numberOrFallback(value: unknown, fallback: number): number {
    const parsed = Number(value);
    return parsed || fallback;
}

export class SettingsState {
    private readonly hostProvider: () => SettingsStateHost;

    constructor(hostOrProvider: SettingsStateHost | (() => SettingsStateHost)) {
        if (typeof hostOrProvider === 'function') {
            this.hostProvider = hostOrProvider;
        } else {
            this.hostProvider = () => hostOrProvider;
        }
    }

    private get host(): SettingsStateHost {
        return this.hostProvider();
    }

    private get data(): PluginData {
        return this.host.data;
    }

    private persistIfNeeded(options?: SetOption): Promise<boolean> {
        return persistIfNeeded(() => this.host.persistData(), options);
    }

    // --- Getters with central default fallbacks (P5) ---

    get language(): string {
        return this.data.language ?? DEFAULT_DATA.language;
    }

    get statusBarActions(): StatusBarActions {
        return this.data.statusBarActions ?? DEFAULT_DATA.statusBarActions;
    }

    get warnOnUnsavedSwitch(): boolean {
        return this.data.warnOnUnsavedSwitch ?? DEFAULT_DATA.warnOnUnsavedSwitch;
    }

    get sessionSwitchNoticeMode(): string {
        const val = this.data.sessionSwitchNoticeMode;
        return typeof val === 'string' ? val : 'always';
    }

    get autoSaveOnSwitch(): boolean {
        return this.data.autoSaveOnSwitch ?? DEFAULT_DATA.autoSaveOnSwitch;
    }

    get highlightUnsavedSessionChanges(): boolean {
        return this.data.highlightUnsavedSessionChanges ?? DEFAULT_DATA.highlightUnsavedSessionChanges;
    }

    get confirmQuickActions(): boolean {
        return this.data.confirmQuickActions ?? DEFAULT_DATA.confirmQuickActions;
    }

    get restoreSidebars(): boolean {
        return this.data.restoreSidebars ?? DEFAULT_DATA.restoreSidebars;
    }

    get statusBarModScrollSwitch(): boolean {
        return this.data.statusBarModScrollSwitch ?? DEFAULT_DATA.statusBarModScrollSwitch;
    }

    get statusBarScrollPreset(): string {
        return this.data.statusBarScrollPreset ?? DEFAULT_DATA.statusBarScrollPreset;
    }

    get statusBarScrollModifierMode(): string {
        return this.data.statusBarScrollModifierMode ?? DEFAULT_DATA.statusBarScrollModifierMode;
    }

    get statusBarScrollThreshold(): number {
        return this.data.statusBarScrollThreshold ?? DEFAULT_DATA.statusBarScrollThreshold;
    }

    get statusBarScrollCooldownMs(): number {
        return this.data.statusBarScrollCooldownMs ?? DEFAULT_DATA.statusBarScrollCooldownMs;
    }

    get statusBarScrollResetMs(): number {
        return this.data.statusBarScrollResetMs ?? DEFAULT_DATA.statusBarScrollResetMs;
    }

    get statusBarScrollInvert(): boolean {
        return this.data.statusBarScrollInvert ?? DEFAULT_DATA.statusBarScrollInvert;
    }

    get showActiveSwitchCommand(): boolean {
        return this.data.showActiveSwitchCommand ?? DEFAULT_DATA.showActiveSwitchCommand;
    }

    get numberedSwitchCommands(): boolean {
        return this.data.numberedSwitchCommands ?? DEFAULT_DATA.numberedSwitchCommands;
    }

    get previewNext(): boolean {
        return this.data.previewNext ?? DEFAULT_DATA.previewNext;
    }

    get previewPrevious(): boolean {
        return this.data.previewPrevious ?? DEFAULT_DATA.previewPrevious;
    }

    get showFilterInput(): boolean {
        return this.data.showFilterInput ?? DEFAULT_DATA.showFilterInput;
    }


    get confirmDeleteByHotkey(): boolean {
        return this.data.confirmDeleteByHotkey ?? DEFAULT_DATA.confirmDeleteByHotkey;
    }

    get versionHistoryEnabled(): boolean {
        return this.data.versionHistoryEnabled ?? DEFAULT_DATA.versionHistoryEnabled;
    }

    get versionHistorySnapshotInterval(): number {
        return this.data.versionHistorySnapshotInterval ?? DEFAULT_DATA.versionHistorySnapshotInterval;
    }

    get versionHistoryConfirmRestore(): boolean {
        return this.data.versionHistoryConfirmRestore ?? DEFAULT_DATA.versionHistoryConfirmRestore;
    }

    get groupFeatureEnabled(): boolean {
        return this.data.groupFeatureEnabled ?? DEFAULT_DATA.groupFeatureEnabled;
    }

    /**
     * Where the user last left the search overlay, and how big. Both are null
     * until the overlay has been dragged or resized, which is what tells it to
     * position itself against the status bar instead.
     */
    get searchOverlayPosition(): PluginData['searchOverlayPosition'] {
        return this.data.searchOverlayPosition ?? DEFAULT_DATA.searchOverlayPosition;
    }

    get searchOverlaySize(): PluginData['searchOverlaySize'] {
        return this.data.searchOverlaySize ?? DEFAULT_DATA.searchOverlaySize;
    }

    // --- Setters ---

    /**
     * The geometry is written mid-gesture on every mousemove, so these do not
     * persist on their own; the overlay persists once when the gesture ends.
     */
    setSearchOverlayGeometry(geometry: {
        position?: PluginData['searchOverlayPosition'];
        size?: PluginData['searchOverlaySize'];
    }): void {
        if ('position' in geometry) this.data.searchOverlayPosition = geometry.position ?? null;
        if ('size' in geometry) this.data.searchOverlaySize = geometry.size ?? null;
    }

    async setLanguageSetting(value: string, options?: SetOption): Promise<boolean> {
        this.data.language = value || 'auto';
        resolveLocale(this.data.language);
        return this.persistIfNeeded(options);
    }

    async setStatusBarAction(slotKey: StatusBarSlotKey, actionId: string, options?: SetOption): Promise<boolean> {
        if (!this.data.statusBarActions) {
            this.data.statusBarActions = Object.assign({}, DEFAULT_DATA.statusBarActions);
        }
        this.data.statusBarActions[slotKey] = actionId;
        return this.persistIfNeeded(options);
    }

    async setWarnOnUnsavedSwitch(enabled: boolean, options?: SetOption): Promise<boolean> {
        this.data.warnOnUnsavedSwitch = !!enabled;
        return this.persistIfNeeded(options);
    }

    async setUnsavedStatusBarHighlight(enabled: boolean, options?: SetOption): Promise<boolean> {
        this.data.highlightUnsavedSessionChanges = !!enabled;
        this.host.updateStatusBar?.();
        return this.persistIfNeeded(options);
    }

    async setConfirmQuickActions(enabled: boolean, options?: SetOption): Promise<boolean> {
        this.data.confirmQuickActions = !!enabled;
        return this.persistIfNeeded(options);
    }

    async setRestoreSidebars(enabled: boolean, options?: SetOption): Promise<boolean> {
        this.data.restoreSidebars = !!enabled;
        return this.persistIfNeeded(options);
    }

    async setStatusBarModScrollSwitch(enabled: boolean, options?: SetOption): Promise<boolean> {
        this.data.statusBarModScrollSwitch = !!enabled;
        return this.persistIfNeeded(options);
    }

    async setStatusBarScrollPreset(value: string, options?: SetOption): Promise<boolean> {
        this.data.statusBarScrollPreset = value || 'trackpad';
        return this.persistIfNeeded(options);
    }

    async setStatusBarScrollModifierMode(value: string, options?: SetOption): Promise<boolean> {
        this.data.statusBarScrollModifierMode = value || 'none';
        return this.persistIfNeeded(options);
    }

    async setStatusBarScrollThreshold(value: unknown, options?: SetOption): Promise<boolean> {
        this.data.statusBarScrollThreshold = numberOrFallback(value, 30);
        return this.persistIfNeeded(options);
    }

    async setStatusBarScrollCooldownMs(value: unknown, options?: SetOption): Promise<boolean> {
        this.data.statusBarScrollCooldownMs = numberOrFallback(value, 500);
        return this.persistIfNeeded(options);
    }

    async setStatusBarScrollResetMs(value: unknown, options?: SetOption): Promise<boolean> {
        this.data.statusBarScrollResetMs = numberOrFallback(value, 250);
        return this.persistIfNeeded(options);
    }

    async setStatusBarScrollInvert(enabled: boolean, options?: SetOption): Promise<boolean> {
        this.data.statusBarScrollInvert = !!enabled;
        return this.persistIfNeeded(options);
    }

    async setShowActiveSwitchCommand(enabled: boolean, options?: SetOption): Promise<boolean> {
        this.data.showActiveSwitchCommand = !!enabled;
        return this.persistIfNeeded(options);
    }

    async setNumberedSwitchCommands(enabled: boolean, options?: SetOption): Promise<boolean> {
        this.data.numberedSwitchCommands = !!enabled;
        this.host.syncSessionCommands?.();
        return this.persistIfNeeded(options);
    }

    async setSwitchPreviewEnabled(enabled: boolean, options?: SetOption): Promise<boolean> {
        this.data.previewNext = !!enabled;
        this.data.previewPrevious = !!enabled;
        return this.persistIfNeeded(options);
    }

    async setPreviewNext(enabled: boolean, options?: SetOption): Promise<boolean> {
        this.data.previewNext = !!enabled;
        return this.persistIfNeeded(options);
    }

    async setPreviewPrevious(enabled: boolean, options?: SetOption): Promise<boolean> {
        this.data.previewPrevious = !!enabled;
        return this.persistIfNeeded(options);
    }

    async setShowFilterInput(enabled: boolean, options?: SetOption): Promise<boolean> {
        this.data.showFilterInput = !!enabled;
        return this.persistIfNeeded(options);
    }


    async setConfirmDeleteByHotkey(enabled: boolean, options?: SetOption): Promise<boolean> {
        this.data.confirmDeleteByHotkey = !!enabled;
        return this.persistIfNeeded(options);
    }

    async setVersionHistoryEnabled(enabled: boolean, options?: SetOption): Promise<boolean> {
        this.data.versionHistoryEnabled = !!enabled;
        if (this.data.versionHistoryEnabled) {
            this.host.startHistorySnapshotTimer?.();
        } else {
            this.host.stopHistorySnapshotTimer?.();
        }
        return this.persistIfNeeded(options);
    }

    /**
     * How many rotating backups to keep. The value is one of the choices the
     * ladder offers; anything else falls back to the default rather than
     * becoming a count nothing on the ladder matches.
     */
    async setRotationBackupGenerations(value: unknown, options?: SetOption): Promise<boolean> {
        const parsed = Number(value);
        this.data.rotationBackupGenerations = BACKUP_GENERATION_CHOICES.includes(parsed)
            ? parsed
            : DEFAULT_BACKUP_GENERATIONS;
        return this.persistIfNeeded(options);
    }

    get rotationBackupGenerations(): number {
        return this.data.rotationBackupGenerations ?? DEFAULT_DATA.rotationBackupGenerations;
    }

    async setVersionHistorySnapshotInterval(value: unknown, options?: SetOption): Promise<boolean> {
        const parsed = typeof value === 'number' ? value : parseInt(String(value), 10);
        this.data.versionHistorySnapshotInterval = Number.isFinite(parsed) ? parsed : DEFAULT_DATA.versionHistorySnapshotInterval;
        this.host.startHistorySnapshotTimer?.();
        return this.persistIfNeeded(options);
    }

    async setVersionHistoryConfirmRestore(enabled: boolean, options?: SetOption): Promise<boolean> {
        this.data.versionHistoryConfirmRestore = !!enabled;
        return this.persistIfNeeded(options);
    }
}
