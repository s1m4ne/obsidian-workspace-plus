import { Plugin } from 'obsidian';
import { L, resolveLocale } from './i18n.ts';
import { SessionManagerModal, openSessionManagerModal } from './modals/session-manager-modal-class.ts';
import { HistoryModal } from './modals/history-modal.ts';
import type { HistoryModalPluginHost } from './modals/history-modal.ts';
import { WorkspacePlusPlusSettingTab } from './settings-tab.ts';
import { DEFAULT_DATA } from './storage/default-data.ts';
import { setupStatusBar } from './statusbar-controller.ts';
import { ConfirmModal } from './modals/confirm-modal.ts';
import type { ConfirmModalOptions } from './modals/confirm-modal.ts';
import { RenameModal } from './modals/rename-modal.ts';
import { UnsavedSwitchModal } from './modals/unsaved-switch-modal.ts';
import { openSettingTab } from './platform/obsidian-internals.ts';
import type { PluginData, SessionItem } from './storage/default-data.ts';
import { CommandRegistry } from './core/command-registry.ts';
import type { CommandRegistryHost } from './core/command-registry.ts';
import { FrontmatterLinker } from './core/frontmatter-linker.ts';
import type { FrontmatterLinkerHost } from './core/frontmatter-linker.ts';
import { GroupStore } from './state/group-store.ts';
import type { GroupStoreHost } from './state/group-store.ts';
import { HistoryService } from './state/history-service.ts';
import type { HistoryServiceHost } from './state/history-service.ts';
import { SessionSaver } from './state/session-saver.ts';
import type { SessionSaverHost } from './state/session-saver.ts';
import { SessionStore } from './state/session-store.ts';
import type { SessionStoreHost } from './state/session-store.ts';
import { SessionSwitcher } from './state/session-switcher.ts';
import type { SessionSwitcherHost } from './state/session-switcher.ts';
import type { LayoutRestoreOptions } from './state/session-switcher.ts';
import { SettingsState } from './state/settings-state.ts';
import type { SettingsStateHost } from './state/settings-state.ts';
import { PersistenceService } from './storage/persistence-service.ts';
import type { PersistenceServiceHost } from './storage/persistence-service.ts';
import type { SessionStorage } from './storage/session-storage.ts';
import type { SessionStorageLocation } from './storage/paths.ts';
import type { JsonFileStore, ReadJsonResult } from './storage/json-file-store.ts';
import type { DataRecord, SessionData, StorageDiagnosticsInfo } from './storage/persistence-service.ts';
import type { SyncWatcher } from './storage/sync-watcher.ts';
import {
    getSyncWatcher,
    onExternalSettingsChange,
    clearSessionStorageSyncTimers,
    recordSessionStorageState,
    recordSessionDataStored,
    reloadExternalSessionStorageIfChanged,
} from './storage/session-sync.ts';
import type {
    SyncWatcherHost,
    SessionStorageStateHost,
    RecordSessionDataStoredHost,
    ReloadExternalSessionHost,
} from './storage/session-sync.ts';
import {
    initRotationBackupTimestampForHost,
    prepareRotationBackupData,
    rotateBackupIfNeededForHost,
    copyFileIfExists,
    getRotationBackupInfoForHost,
    restoreFromRotationBackup,
} from './storage/storage-backup.ts';
import { exportSessionsSnapshot, importSessionsFromLatestExport } from './storage/storage-transfer.ts';
import type {
    RotationBackupTimestampHost,
    RotateBackupHost,
    StorageRestoreHost,
    RotationBackupInfo,
} from './storage/storage-backup.ts';
import type { StorageExportHost, StorageImportHost } from './storage/storage-transfer.ts';
import { StatusBarController } from './statusbar-controller.ts';
import type { StatusBarControllerHost } from './statusbar-controller.ts';
import { SwitchOverlay } from './ui/overlays/switch-overlay.ts';
import type { SwitchOverlayHost } from './ui/overlays/switch-overlay.ts';
import { SearchOverlay } from './ui/overlays/search-overlay.ts';
import type { SearchOverlayHost } from './ui/overlays/search-overlay.ts';
import type { SessionManagerModalHost } from './modals/session-manager-modal-class.ts';
import type { SettingsTabHost } from './settings-tab.ts';

resolveLocale();

export class WorkspacePlusPlus extends Plugin {
    data!: PluginData;

    // Held so other modules can reach a collaborator without going through the
    // getters. The getters remain the owners; these are the same instances.
    sessionStorage?: SessionStorage;
    syncWatcher?: SyncWatcher;
    settingsState?: SettingsState;
    groupStore?: GroupStore;
    sessionStore?: SessionStore;
    historyService?: HistoryService;
    sessionSwitcher?: SessionSwitcher;
    sessionSaver?: SessionSaver;
    frontmatterLinker?: FrontmatterLinker;
    statusBarController?: StatusBarController;
    commandRegistry?: CommandRegistry;
    settingTab?: WorkspacePlusPlusSettingTab;

    override async onload(): Promise<void> {
        const saved = await this.loadWithBackup();
        this.data = Object.assign({}, DEFAULT_DATA, saved || {});
        if (!this.data.sessions) this.data.sessions = {};
        if (!this.data.sessionOrder) this.data.sessionOrder = [];

        this.sessionStorage = this.getSessionStorage();
        this.syncWatcher = this.getSyncWatcher();
        this.settingsState = this.getSettingsState();
        this.groupStore = this.getGroupStore();
        this.sessionStore = this.getSessionStore();
        this.historyService = this.getHistoryService();
        this.sessionSwitcher = this.getSessionSwitcher();
        this.sessionSaver = this.getSessionSaver();
        this.frontmatterLinker = this.getFrontmatterLinker();
        this.statusBarController = this.getStatusBarController();

        this.migrateLegacyStatusBarSettings();

        this.getGroupStore().normalizeGroupFeatureState();
        this.getSessionStore().syncSessionOrder();
        this.getSyncWatcher().registerListeners();
        // Re-resolved now that the saved language is known; the call at module
        // load only had 'auto'.
        resolveLocale(this.data.language);

        this.addRibbonIcon('panels-top-left', text(L.ribbonTooltip), () => {
            new SessionManagerModal(this.app, this.asHost<SessionManagerModalHost>()).open();
        });

        setupStatusBar(this.asHost<StatusBarControllerHost>());

        this.commandRegistry = this.getCommandRegistry();
        this.commandRegistry.registerCommands();

        this.settingTab = new WorkspacePlusPlusSettingTab(this.app, this.asHost<SettingsTabHost>());
        this.addSettingTab(this.settingTab);

        this.registerEvent(this.app.workspace.on('layout-change', () => {
            this.getSessionSwitcher().noteStartupLayoutChange();
            this.getStatusBarController().updateStatusBar();
        }));
        this.registerEvent(this.app.workspace.on('active-leaf-change', () => {
            // A switch moves many leaves; letting each one redraw the status bar
            // would show every intermediate state.
            if (this.getSessionSwitcher().isSwitching) return;
            window.setTimeout(() => { this.getStatusBarController().updateStatusBar(); }, 0);
        }));

        // Everything here needs the workspace to exist, so it waits rather than
        // running inside onload.
        this.app.workspace.onLayoutReady(() => {
            this.getSessionSwitcher().startStartupSettleWindow();
            this.getSessionStore().ensureDefaultSession();
            this.getCommandRegistry().syncSessionCommands();
            void this.getSessionSwitcher().scheduleStartupFlush();
            this.getHistoryService().startHistorySnapshotTimer();
            void initRotationBackupTimestampForHost(this.asHost<RotationBackupTimestampHost>());
            this.getFrontmatterLinker().registerFrontmatterListeners();
            this.getSyncWatcher().scheduleStartupChecks();
        });
    }

    /**
     * The store, and the host it is given.
     *
     * This is the first collaborator whose construction lives in the plugin
     * class rather than in a plugin/methods adapter. The adapter built the same
     * host as an untyped object literal, so nothing checked that the members
     * matched what SessionStore asks for; three shims in this codebase pointed
     * at methods nobody had written for exactly that reason.
     *
     * Built lazily, and behind a getter, because the collaborators reference one
     * another: the group store needs the session store's ordering and the
     * session store needs the group store's selection.
     */
    private sessionStoreInstance?: SessionStore;

    getSessionStore(): SessionStore {
        if (!this.sessionStoreInstance) {
            this.sessionStoreInstance = new SessionStore(sessionStoreHost(this));
        }
        return this.sessionStoreInstance;
    }

    /**
     * The four collaborators that take the plugin itself rather than a host
     * literal. Their host interfaces name members the plugin already has, so
     * there is nothing to wire - only the narrowing, which asHost() carries in
     * one place.
     */
    /**
     * The rotation-backup timestamp, mirrored from the service.
     *
     * Read by the settings screen and written by both it and the backup
     * rotation, so the pair is deliberate: a getter without a setter throws on
     * assignment in the strict bundle, and that is what once aborted onunload
     * before it reached flushPendingPersistence() and lost unsaved work. The
     * other three mirrored fields the adapter carried - globalSettings,
     * _lastPersistStamp and _persistQueue - had no reader outside the service
     * and are gone.
     */
    get _lastRotationBackupAt(): number {
        return this.getPersistenceService().getLastRotationBackupAt();
    }

    set _lastRotationBackupAt(value: number) {
        this.getPersistenceService().setLastRotationBackupAt(value);
    }

    private persistenceServiceInstance?: PersistenceService;

    getPersistenceService(): PersistenceService {
        if (!this.persistenceServiceInstance) {
            this.persistenceServiceInstance = new PersistenceService(persistenceServiceHost(this));
        }
        return this.persistenceServiceInstance;
    }

    private frontmatterLinkerInstance?: FrontmatterLinker;

    /**
     * The plugin owns modal construction.
     *
     * The command registry and the status bar used to reach for the modal
     * classes through optional hooks - `plugin.openHistoryModal?.(session)` -
     * that nothing defined, so the manage-sessions, create-session and
     * version-history commands and the status bar actions all did nothing while
     * every test passed. Defining them here also keeps the modal modules out of
     * the import graph of statusbar-actions.ts and command-registry.ts: both
     * modal files evaluate obsidian.Modal when they load, and a static import
     * from either would pull them in while the test harness is still linking,
     * before the obsidian stub exists.
     */
    /**
     * Settings reads this, and a settings tab has no business knowing which
     * collaborator owns the answer. Three siblings the adapter defined beside it
     * - applyWorkspaceLayout, buildLayoutForRestore and getWorkspaceRestoreScope
     * - had no caller at plugin level at all and are simply gone; the host
     * factories above reach the switcher directly.
     */
    getSyncWatcher(): SyncWatcher {
        return getSyncWatcher(this.asHost<SyncWatcherHost>());
    }

    /**
     * Obsidian's own hook, called when data.json changes on disk under us -
     * which is how a vault synced by Obsidian Sync delivers another device's
     * settings. Nothing in this repository calls it, so no search shows a
     * caller and it looks exactly like a shim with no purpose; deleting it
     * would silently take out the path issue #105 exists for.
     */
    override onExternalSettingsChange(): void {
        onExternalSettingsChange(this.asHost<SyncWatcherHost>());
    }

    /**
     * Snapshot export/import and the rotation backups.
     *
     * These take the plugin as their host - they read its data and reach its
     * vault - so unlike the collaborators there is nothing to construct, only
     * somewhere for the settings screen and the commands to call. That is here
     * rather than a plugin/methods adapter so the host each one wants is
     * type-checked at the call rather than assumed.
     */
    /**
     * The external-storage bookkeeping. Like the backups above, these take the
     * plugin as their host; PersistenceService reaches all three through hooks
     * it is given, and Obsidian reaches the fourth through
     * onExternalSettingsChange.
     */
    /**
     * Persistence: the twenty-five members other modules reach on the plugin.
     *
     * These were a table of name strings in an adapter, attached by a loop. A
     * typo there produced a prototype without that method rather than an error -
     * nothing else could see it, the file being JavaScript and no test happening
     * to call the missing one - so the adapter grew a run-time assertion against
     * PersistenceService.prototype to catch it. Written out, the type checker
     * does that job, and each signature is checked against the service rather
     * than assumed to match it.
     */
    getSessionStorage(): SessionStorage {
        return this.getPersistenceService().getSessionStorage();
    }

    getSessionStorageLocation(): SessionStorageLocation {
        return this.getPersistenceService().getSessionStorageLocation();
    }

    getSessionsPath(): string {
        return this.getPersistenceService().getSessionsPath();
    }

    getExportDirPath(): string {
        return this.getPersistenceService().getExportDirPath();
    }

    getBackupsDirPath(): string {
        return this.getPersistenceService().getBackupsDirPath();
    }

    getRotationBackupPath(generation: number): string {
        return this.getPersistenceService().getRotationBackupPath(generation);
    }

    extractSessionData(data: unknown): SessionData {
        return this.getPersistenceService().extractSessionData(data);
    }

    normalizeSessionData(raw: unknown): SessionData {
        return this.getPersistenceService().normalizeSessionData(raw);
    }

    getJsonStore(): JsonFileStore {
        return this.getPersistenceService().getJsonStore();
    }

    ensureDir(path: string): Promise<void> {
        return this.getPersistenceService().ensureDir(path);
    }

    ensureSessionStorageDir(): Promise<void> {
        return this.getPersistenceService().ensureSessionStorageDir();
    }

    getFileMtime(path: string): Promise<number> {
        return this.getPersistenceService().getFileMtime(path);
    }

    /**
     * Generic, like JsonFileStore's own. Non-generic it answered
     * ReadJsonResult<unknown>, which no host declaring ReadJsonFn accepts -
     * invisible for as long as asHost() cast the plugin into shape.
     */
    readJsonIfExists<T = unknown>(path: string): Promise<ReadJsonResult<T>> {
        return this.getPersistenceService().readJsonIfExists<T>(path);
    }

    writeJson(path: string, data: unknown, pretty?: boolean): Promise<void> {
        return this.getPersistenceService().writeJson(path, data, pretty);
    }

    resetSettingsToDefault(): Promise<unknown> {
        return this.getPersistenceService().resetSettingsToDefault();
    }

    resetSessionsAndSettingsToDefault(): Promise<unknown> {
        return this.getPersistenceService().resetSessionsAndSettingsToDefault();
    }

    clearBackupFiles(): Promise<boolean> {
        return this.getPersistenceService().clearBackupFiles();
    }

    clearBackupsAndVersionHistory(): Promise<unknown> {
        return this.getPersistenceService().clearBackupsAndVersionHistory();
    }

    getStorageDiagnosticsInfo(): StorageDiagnosticsInfo {
        return this.getPersistenceService().getStorageDiagnosticsInfo();
    }

    getSessionStorageSize(): Promise<number | null> {
        return this.getPersistenceService().getSessionStorageSize();
    }

    persistDataImmediate(): Promise<unknown> {
        return this.getPersistenceService().persistDataImmediate();
    }

    /**
     * The service's queue resolves to whatever the last write returned, which
     * is nothing in particular; six collaborator hosts declare this as
     * Promise<boolean> and none of them reads the value. Settled here rather
     * than widening all six, so nobody starts believing the boolean.
     */
    async persistData(): Promise<boolean> {
        await this.getPersistenceService().persistData();
        return true;
    }

    flushPendingPersistence(): Promise<unknown> {
        return this.getPersistenceService().flushPendingPersistence();
    }

    loadSessionDataFromStorage(): Promise<SessionData | null> {
        return this.getPersistenceService().loadSessionDataFromStorage();
    }

    loadWithBackup(): Promise<DataRecord> {
        return this.getPersistenceService().loadWithBackup();
    }
    recordSessionStorageState(stamp: number, mtime: number, data?: unknown): void {
        recordSessionStorageState(this.asHost<SessionStorageStateHost>(), stamp, mtime, data);
    }

    recordSessionDataStored(sessionData: unknown): Promise<boolean> {
        return recordSessionDataStored(this.asHost<RecordSessionDataStoredHost>(), sessionData);
    }

    reloadExternalSessionStorageIfChanged(options?: { mergeLocal?: boolean }): Promise<boolean> {
        return reloadExternalSessionStorageIfChanged(this.asHost<ReloadExternalSessionHost>(), options);
    }

    scheduleExternalSessionStorageReload(debounceMs?: number): void {
        this.getSyncWatcher().scheduleReload(debounceMs);
    }

    exportSessionsSnapshot(): Promise<string> {
        return exportSessionsSnapshot(this.asHost<StorageExportHost>());
    }

    importSessionsFromLatestExport(): Promise<boolean> {
        return importSessionsFromLatestExport(this.asHost<StorageImportHost>());
    }

    prepareRotationBackupData(sessionData: unknown): Record<string, unknown> {
        return prepareRotationBackupData(sessionData);
    }

    rotateBackupIfNeeded(sessionData: unknown): Promise<void> {
        return rotateBackupIfNeededForHost(this.asHost<RotateBackupHost>(), sessionData);
    }

    copyFileIfExists(srcPath: string, dstPath: string): Promise<void> {
        return copyFileIfExists(this.app.vault.adapter, srcPath, dstPath);
    }

    getRotationBackupInfo(): Promise<RotationBackupInfo[]> {
        return getRotationBackupInfoForHost(this.asHost<RotationBackupTimestampHost>());
    }

    restoreFromRotationBackup(generation: number): Promise<boolean> {
        return restoreFromRotationBackup(this.asHost<StorageRestoreHost>(), generation);
    }

    // ---------------------------------------------------------------------
    // The members every *Host the plugin is handed to declares as required.
    //
    // These fourteen were absent. `asHost<T>()` was `this as unknown as T`, so
    // no call site checked them, and check:hooks only covers members declared
    // optional - it treated required ones as the type checker's job, which the
    // cast had already switched off. Four were dead user-facing paths: the
    // status bar's left click, restore-latest-history, the vault-only storage
    // toggle and the version-history Restore button. The rest are the refresh
    // half of the external-sync and backup-restore paths, which moved the data
    // and then left the screen showing the old state.
    //
    // Each one delegates to the class that owns the behaviour and adds nothing.
    // ---------------------------------------------------------------------

    openSearchOverlay(anchorEl?: HTMLElement | null): void {
        this.getSearchOverlay().open(anchorEl ?? undefined);
    }

    hideSearchOverlay(): void {
        this.getSearchOverlay().hide();
    }

    openConfirmModal(
        message: string,
        onConfirm: () => void,
        options?: ConfirmModalOptions
    ): void {
        new ConfirmModal(this.app, message, onConfirm, options).open();
    }

    restoreFromHistoryEntry(sessionId: string, index: number): Promise<boolean> {
        return this.getHistoryService().restoreFromHistoryEntry(sessionId, index);
    }

    setSessionStorageLocation(location: string): Promise<boolean> {
        return this.getPersistenceService().setSessionStorageLocation(location);
    }

    resetSessionsToDefault(): Promise<boolean> {
        return this.getSessionStore().resetSessionsToDefault();
    }

    reloadCurrentSessionWithoutSaving(options?: { silent?: boolean }): Promise<boolean> {
        return this.getSessionSaver().reloadCurrentSessionWithoutSaving(options);
    }

    getActiveSession(): SessionItem | null {
        return this.getSessionStore().getActiveSession();
    }

    /**
     * Through SessionSwitcher, so a restore honours the sidebar scope and the
     * switch bookkeeping. The switcher's own host reaches
     * `app.workspace.changeLayout` directly for exactly this reason - pointing
     * both at the switcher is what recursed the first time it was tried.
     */
    applyWorkspaceLayout(layout: unknown, options?: LayoutRestoreOptions): Promise<boolean> {
        return this.getSessionSwitcher().applyWorkspaceLayout(layout, options);
    }

    syncSessionOrder(): void {
        this.getSessionStore().syncSessionOrder();
    }

    notifySessionsChanged(): void {
        this.getSessionStore().notifySessionsChanged();
    }

    normalizeGroupFeatureState(): void {
        this.getGroupStore().normalizeGroupFeatureState();
    }

    updateStatusBar(): void {
        this.getStatusBarController().updateStatusBar();
    }

    syncSessionCommands(): void {
        this.getCommandRegistry().syncSessionCommands();
    }

    openSessionManagerModal(focusName?: boolean): SessionManagerModal {
        return openSessionManagerModal(this.app, this.asHost<SessionManagerModalHost>(), focusName);
    }

    openHistoryModal(session: SessionItem): void {
        new HistoryModal(this.app, this.asHost<HistoryModalPluginHost>(), session).open();
    }

    getFrontmatterLinker(): FrontmatterLinker {
        if (!this.frontmatterLinkerInstance) {
            this.frontmatterLinkerInstance = new FrontmatterLinker(frontmatterLinkerHost(this));
        }
        return this.frontmatterLinkerInstance;
    }

    private commandRegistryInstance?: CommandRegistry;
    private statusBarControllerInstance?: StatusBarController;
    private switchOverlayInstance?: SwitchOverlay;
    private searchOverlayInstance?: SearchOverlay;

    getCommandRegistry(): CommandRegistry {
        if (!this.commandRegistryInstance) {
            this.commandRegistryInstance = new CommandRegistry(this.asHost<CommandRegistryHost>());
        }
        return this.commandRegistryInstance;
    }

    getStatusBarController(): StatusBarController {
        if (!this.statusBarControllerInstance) {
            this.statusBarControllerInstance = new StatusBarController(this.asHost<StatusBarControllerHost>());
        }
        return this.statusBarControllerInstance;
    }

    getSwitchOverlay(): SwitchOverlay {
        if (!this.switchOverlayInstance) {
            this.switchOverlayInstance = new SwitchOverlay(this.asHost<SwitchOverlayHost>());
        }
        return this.switchOverlayInstance;
    }

    getSearchOverlay(): SearchOverlay {
        if (!this.searchOverlayInstance) {
            this.searchOverlayInstance = new SearchOverlay(this.asHost<SearchOverlayHost>());
        }
        return this.searchOverlayInstance;
    }

    private sessionSaverInstance?: SessionSaver;

    getSessionSaver(): SessionSaver {
        if (!this.sessionSaverInstance) {
            this.sessionSaverInstance = new SessionSaver(sessionSaverHost(this));
        }
        return this.sessionSaverInstance;
    }

    private historyServiceInstance?: HistoryService;

    getHistoryService(): HistoryService {
        if (!this.historyServiceInstance) {
            this.historyServiceInstance = new HistoryService(historyServiceHost(this));
        }
        return this.historyServiceInstance;
    }

    private groupStoreInstance?: GroupStore;

    getGroupStore(): GroupStore {
        if (!this.groupStoreInstance) {
            this.groupStoreInstance = new GroupStore(groupStoreHost(this));
        }
        return this.groupStoreInstance;
    }

    private settingsStateInstance?: SettingsState;

    getSettingsState(): SettingsState {
        if (!this.settingsStateInstance) {
            this.settingsStateInstance = new SettingsState(settingsStateHost(this));
        }
        return this.settingsStateInstance;
    }

    private sessionSwitcherInstance?: SessionSwitcher;

    getSessionSwitcher(): SessionSwitcher {
        if (!this.sessionSwitcherInstance) {
            this.sessionSwitcherInstance = new SessionSwitcher(sessionSwitcherHost(this));
        }
        return this.sessionSwitcherInstance;
    }

    /**
     * Three collaborators take the plugin as a structural host, and it does
     * satisfy all of them - plugin/methods/ attaches every member they name.
     * It cannot satisfy them as one *type*: the interfaces were written at
     * different commits and disagree on two members (`settingTab.activeTab` is
     * nullable in one, and `reloadCurrentSessionWithoutSaving` returns a promise
     * in one and not the other), so they cannot be merged onto the class.
     *
     * Reconciling those two is worth doing, and is not this commit's job -
     * commit 34b passes the real classes and deletes this along with the attach
     * step. Until then the assertion is here, named, in one place, rather than
     * spread across three call sites.
     */
    private asHost<T>(this: T): T {
        return this;
    }

    /**
     * The twelve status-bar click slots replaced two booleans, and this carries
     * an upgrader's old answers into the new shape.
     *
     * It does not currently run. `statusBarActions` is in SETTINGS_KEYS and in
     * DEFAULT_DATA, so loadWithBackup() always returns it and the guard below is
     * never true - verified by loading a 0.7.x data.json with
     * `statusBarQuickSwitcher: false` and no `statusBarActions`, which comes out
     * with the default `click: 'quickSwitcher'` rather than 'sessionManager'.
     *
     * That is a pre-existing bug, not something this migration introduced, and
     * honouring the old preference now would change what existing users see. It
     * is left exactly as it was and recorded here instead of being quietly
     * deleted or quietly fixed.
     */
    private migrateLegacyStatusBarSettings(): void {
        if (!this.data.statusBarActions) {
            this.data.statusBarActions = Object.assign({}, DEFAULT_DATA.statusBarActions);
            if (this.data.statusBarQuickSwitcher === false) {
                this.data.statusBarActions.click = 'sessionManager';
            }
            if (this.data.versionHistoryCtrlRmbRestore === false) {
                this.data.statusBarActions.modRightClick = 'none';
            }
        }
        this.data.statusBarActions = Object.assign(
            {},
            DEFAULT_DATA.statusBarActions,
            this.data.statusBarActions || {},
        );
    }

    override onunload(): void {
        this.getHistoryService().stopHistorySnapshotTimer();
        this.getSwitchOverlay().hide();
        this.getSearchOverlay().hide();
        this.getSessionSwitcher().clearSessionSwitchNotice();
        this.getSessionSwitcher().cleanup();
        // Through the controller, not by assignment: the mirrored counters are
        // getter-only accessors, and writing to one throws in the strict bundle
        // - which used to abort onunload before the flush below and lose
        // whatever had not been saved.
        this.getStatusBarController().resetScrollState();
        clearSessionStorageSyncTimers(this.asHost<SyncWatcherHost>());
        void this.flushPendingPersistence();
    }
}

export default WorkspacePlusPlus;

function text(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

/**
 * The host SessionStore is given.
 *
 * A function taking the plugin, rather than a method building the object from
 * `this`: the live fields have to be getters, and a getter inside an object
 * literal sees the literal rather than the plugin.
 *
 * Exported so the wiring itself can be tested. Every member here is a hook the
 * type checker can see the shape of but not the destination of - an arrow that
 * calls the wrong collaborator method type-checks perfectly - and the delegation
 * gate only resolves `this.getX().y()`, not arrows inside a host literal.
 */
export function sessionStoreHost(plugin: WorkspacePlusPlus): SessionStoreHost {
    return {
        get data() { return plugin.data; },
        get app() { return plugin.app; },
        get manifestId() { return plugin.manifest.id; },
        get groupStore() { return plugin.getGroupStore(); },
        get settingsState() { return plugin.getSettingsState(); },
        getCurrentWorkspaceLayout: () => plugin.app.workspace.getLayout(),
        moveSessionToGroupExclusive: (sessionId, groupId) =>
            plugin.getGroupStore().moveSessionToGroupExclusive(sessionId, groupId),
        resolveGroupSelection: (groupId) => plugin.getGroupStore().resolveGroupSelection(groupId),
        attachSessionToActiveGroup: (sessionId) => {
            plugin.getGroupStore().attachSessionToActiveGroup(sessionId);
        },
        persistData: () => plugin.persistData(),
        updateStatusBar: () => { plugin.getStatusBarController().updateStatusBar(); },
        syncSessionCommands: () => { plugin.getCommandRegistry().syncSessionCommands(); },
        hideSwitchOverlay: () => { plugin.getSwitchOverlay().hide(); },
        captureActiveSessionLayoutIfAutoSave: () => {
            plugin.getSessionSaver().captureActiveSessionLayoutIfAutoSave();
        },
        applyWorkspaceLayout: (layout) => plugin.getSessionSwitcher().applyWorkspaceLayout(layout),
        getWorkspaceRestoreScope: () => plugin.getSessionSwitcher().getWorkspaceRestoreScope(),
        openRenameModal: (currentName, onRename) => {
            new RenameModal(plugin.app, currentName, onRename, { emptyNotice: text(L.emptyName) }).open();
        },
        openConfirmModal: (message, onConfirm, options) => {
            new ConfirmModal(plugin.app, message, onConfirm, options).open();
        },
        openPluginSettings: () => { openSettingTab(plugin.app, plugin.manifest.id); },
    };
}

/**
 * The host SessionSwitcher is given.
 *
 * Six hooks the adapter declared are absent rather than translated:
 * showSessionSwitchNotice, switchSession, performSessionSwitch,
 * scheduleStartupFlush, flushOnStartup and getStartupSettleRemainingMs. Each was
 * a function returning undefined, which is how the adapter said "the switcher
 * should use its own"; the switcher already does that when the hook is missing,
 * and a hook that exists and answers undefined is one the unwired-hooks gate
 * cannot tell from a mistake.
 */
export function sessionSwitcherHost(plugin: WorkspacePlusPlus): SessionSwitcherHost {
    return {
        get data() { return plugin.data; },
        get app() { return plugin.app; },
        getSwitchOverlay: () => plugin.getSwitchOverlay(),
        get settingsState() { return plugin.getSettingsState(); },
        get sessionStore() { return plugin.getSessionStore(); },
        get historyService() { return plugin.getHistoryService(); },
        get sessionSaver() { return plugin.getSessionSaver(); },
        getOrderedSessions: (viewGroupId) => {
            const store = plugin.getSessionStore();
            if (viewGroupId === null || viewGroupId === '__all__') return store.getOrderedSessionsUnfiltered();
            if (typeof viewGroupId === 'string') return store.getOrderedSessionsForGroup(viewGroupId);
            return store.getOrderedSessions();
        },
        findSessionIndex: (sessions, sessionId) => plugin.getSessionStore().findSessionIndex(sessions, sessionId),
        getActiveSession: () => plugin.getSessionStore().getActiveSession(),
        getCurrentWorkspaceLayout: () => plugin.getSessionStore().getCurrentWorkspaceLayout(),
        // The workspace itself, not the switcher's own restore: the switcher
        // builds the layout and then calls this to put it on screen.
        changeWorkspaceLayout: (layout) => plugin.app.workspace.changeLayout(layout).then(() => true),
        commitWorkspaceToSession: (session, options) =>
            plugin.getSessionSaver().commitWorkspaceToSession(session, options),
        saveActiveSession: (options) => plugin.getSessionSaver().saveActiveSession(options),
        isActiveSessionDirty: () => plugin.getSessionSaver().isActiveSessionDirty(),
        isAutoSaveOnSwitchEnabled: () => plugin.getSessionSaver().isAutoSaveOnSwitchEnabled(),
        isWarnOnUnsavedSwitchEnabled: () => plugin.getSessionSaver().isWarnOnUnsavedSwitchEnabled(),
        persistData: () => plugin.persistData(),
        updateStatusBar: () => { plugin.getStatusBarController().updateStatusBar(); },
        showSwitchPreviewOverlay: (ordered, index, viewGroupId) => {
            plugin.getSwitchOverlay().showPreview(ordered, index, viewGroupId);
        },
        showSwitchFeedbackOverlay: (ordered, index, viewGroupId, overlayOptions) => {
            plugin.getSwitchOverlay().showFeedback(ordered, index, viewGroupId, overlayOptions);
        },
        openUnsavedSwitchModal: (message, onSaveAndSwitch, onSwitchWithoutSaving, onCancel) => {
            new UnsavedSwitchModal(plugin.app, message, onSaveAndSwitch, onSwitchWithoutSaving, onCancel).open();
        },
    };
}

/** The host SettingsState is given. */
export function settingsStateHost(plugin: WorkspacePlusPlus): SettingsStateHost {
    return {
        get data() { return plugin.data; },
        persistData: () => plugin.persistData(),
        updateStatusBar: () => { plugin.getStatusBarController().updateStatusBar(); },
        syncSessionCommands: () => { plugin.getCommandRegistry().syncSessionCommands(); },
        startHistorySnapshotTimer: () => { plugin.getHistoryService().startHistorySnapshotTimer(); },
        stopHistorySnapshotTimer: () => { plugin.getHistoryService().stopHistorySnapshotTimer(); },
    };
}

/**
 * The host GroupStore is given.
 *
 * settingsState is required, not optional. The adapter guarded it with a typeof
 * check, and the branch that covered for an undefined settings state is where a
 * duplicated default survived: two places decided what "groups enabled" meant.
 */
export function groupStoreHost(plugin: WorkspacePlusPlus): GroupStoreHost {
    return {
        get data() { return plugin.data; },
        get settingsState() { return plugin.getSettingsState(); },
        persistData: () => plugin.persistData(),
        updateStatusBar: () => { plugin.getStatusBarController().updateStatusBar(); },
        syncSessionCommands: () => { plugin.getCommandRegistry().syncSessionCommands(); },
        hideSwitchOverlay: () => { plugin.getSwitchOverlay().hide(); },
        hideSearchOverlay: () => { plugin.getSearchOverlay().hide(); },
        switchSession: (sessionId) => plugin.getSessionSwitcher().switchSession(sessionId),
        getOrderedSessionsUnfiltered: () => plugin.getSessionStore().getOrderedSessionsUnfiltered(),
        getOrderedSessionsForGroup: (groupId) => plugin.getSessionStore().getOrderedSessionsForGroup(groupId),
    };
}

/**
 * The host HistoryService is given.
 *
 * layoutsEqualStructural goes to the store rather than being recomputed here.
 * The adapter had a fallback that called layout-utils directly with a restore
 * scope it resolved itself, so the same comparison had two implementations and
 * only one of them was reachable in production.
 */
export function historyServiceHost(plugin: WorkspacePlusPlus): HistoryServiceHost {
    return {
        get data() { return plugin.data; },
        get settingsState() { return plugin.getSettingsState(); },
        getSessionStore: () => plugin.getSessionStore(),
        getActiveSession: () => plugin.getSessionStore().getActiveSession(),
        getCurrentWorkspaceLayout: () => plugin.getSessionStore().getCurrentWorkspaceLayout(),
        applyWorkspaceLayout: (layout) => plugin.getSessionSwitcher().applyWorkspaceLayout(layout),
        layoutsEqualStructural: (a, b) => plugin.getSessionStore().layoutsEqualStructural(a, b),
        commitLayoutToSession: (session, layout, options) =>
            plugin.getSessionSaver().commitLayoutToSession(session, layout, options),
        updateStatusBar: () => { plugin.getStatusBarController().updateStatusBar(); },
        persistData: () => plugin.persistData(),
        isAutoSaveOnSwitchEnabled: () => plugin.getSessionSaver().isAutoSaveOnSwitchEnabled(),
    };
}

/**
 * The host SessionSaver is given.
 *
 * saveActiveSession and overwriteSessionWithCurrentLayout are absent. The
 * adapter supplied both as empty functions, which the saver survived only
 * because it tests the *result* for undefined rather than the hook for
 * existence - two of the fifteen dual-dispatch sites the ratchet records. An
 * absent hook says the same thing and cannot be mistaken for a hook someone
 * forgot to finish.
 */
export function sessionSaverHost(plugin: WorkspacePlusPlus): SessionSaverHost {
    return {
        get data() { return plugin.data; },
        get app() { return plugin.app; },
        get settingsState() { return plugin.getSettingsState(); },
        get sessionStore() { return plugin.getSessionStore(); },
        get groupStore() { return plugin.getGroupStore(); },
        get historyService() { return plugin.getHistoryService(); },
        getActiveSession: () => plugin.getSessionStore().getActiveSession(),
        getCurrentWorkspaceLayout: () => plugin.getSessionStore().getCurrentWorkspaceLayout(),
        layoutsEqualStructural: (a, b) => plugin.getSessionStore().layoutsEqualStructural(a, b),
        getDefaultSessionName: () => plugin.getSessionStore().getDefaultSessionName(),
        pushLayoutToHistory: (session) => { plugin.getHistoryService().pushLayoutToHistory(session); },
        updateStatusBar: () => { plugin.getStatusBarController().updateStatusBar(); },
        syncSessionCommands: () => { plugin.getCommandRegistry().syncSessionCommands(); },
        persistData: () => plugin.persistData(),
        createSessionRecord: (id, name, layout, options) =>
            plugin.getSessionStore().createSessionRecord(id, name, layout, options),
        insertSessionAndActivate: (session) => { plugin.getSessionStore().insertSessionAndActivate(session); },
        startHistorySnapshotTimer: () => { plugin.getHistoryService().startHistorySnapshotTimer(); },
        stopHistorySnapshotTimer: () => { plugin.getHistoryService().stopHistorySnapshotTimer(); },
        applyWorkspaceLayout: (layout) => plugin.getSessionSwitcher().applyWorkspaceLayout(layout),
        getOrderedSessionsUnfiltered: () => plugin.getSessionStore().getOrderedSessionsUnfiltered(),
        getOrderedGroupTabIds: () => plugin.getGroupStore().getOrderedGroupTabIds(),
        isGroupFeatureEnabled: () => plugin.getGroupStore().isGroupFeatureEnabled(),
        openRenameModal: (placeholder, onRename, options) => {
            new RenameModal(plugin.app, placeholder, onRename, options).open();
        },
        openConfirmModal: (message, onConfirm, options) => {
            new ConfirmModal(plugin.app, message, onConfirm, options).open();
        },
    };
}

/**
 * The host FrontmatterLinker is given.
 *
 * handleFrontmatterTriggers is absent: the linker defines it, and the adapter
 * declared no hook for it either. Every other member had a two- or three-step
 * fallback, of which only the first step ran.
 */
export function frontmatterLinkerHost(plugin: WorkspacePlusPlus): FrontmatterLinkerHost {
    return {
        get data() { return plugin.data; },
        get app() { return plugin.app; },
        saveCurrentLayoutAsSessionName: (name, options) =>
            plugin.getSessionSaver().saveCurrentLayoutAsSessionName(name, options),
        switchSession: (sessionId) => plugin.getSessionSwitcher().switchSession(sessionId),
        setActiveGroup: (groupId) => plugin.getGroupStore().setActiveGroup(groupId),
        isGroupFeatureEnabled: () => plugin.getGroupStore().isGroupFeatureEnabled(),
        getSessionStore: () => plugin.getSessionStore(),
        getGroupStore: () => plugin.getGroupStore(),
        getStartupSettleRemainingMs: () => plugin.getSessionSwitcher().getStartupSettleRemainingMs(),
        isSessionSwitcherActive: () => plugin.getSessionSwitcher().isSwitching,
        registerEvent: (eventRef) => { plugin.registerEvent(eventRef); },
    };
}

/**
 * The host PersistenceService is given.
 *
 * Five members used to go through a router. The adapter marked its own delegate
 * methods, so a caller that had replaced one of these on the plugin - a test
 * seam, or a wrapper - won over the service's own, and exactly one
 * implementation ran. Deciding it from the *return value* instead had run both,
 * and a void override of clearBackupFiles deleted eleven backup files the caller
 * had taken responsibility for.
 *
 * Nothing replaces them any more. The tests that exercise that behaviour build
 * PersistenceService with their own host and hooks, so they check the seam where
 * it lives rather than through the plugin; no module under src/ assigns to these
 * at all. What the router encoded is kept as the shape of the two answers:
 * persistData and its siblings go to the service, and readJsonIfExists and
 * getFileMtime go to the file store, because the service's versions of those two
 * call back into the host and would recurse.
 */
export function persistenceServiceHost(plugin: WorkspacePlusPlus): PersistenceServiceHost {
    const service = (): PersistenceService => plugin.getPersistenceService();
    const store = (): JsonFileStore => plugin.getPersistenceService().getJsonStore();
    return {
        get data() { return plugin.data; },
        get app() { return plugin.app; },
        get manifest() { return plugin.manifest; },
        loadData: () => plugin.loadData(),
        saveData: (data) => plugin.saveData(data),
        reloadExternalSessionStorageIfChanged: (options) =>
            plugin.reloadExternalSessionStorageIfChanged(options),
        recordSessionDataStored: (data) => plugin.recordSessionDataStored(data),
        recordSessionStorageState: (stamp, mtime, data) => {
            plugin.recordSessionStorageState(stamp, mtime, data);
        },
        rotateBackupIfNeeded: (data) => plugin.rotateBackupIfNeeded(data),
        clearVersionHistoryEntries: () => plugin.getHistoryService().clearVersionHistoryEntries(),
        resetSessionsToDefault: () => plugin.getSessionStore().resetSessionsToDefault(),
        persistData: () => service().persistData(),
        persistDataImmediate: () => service().persistDataImmediate(),
        clearBackupFiles: () => service().clearBackupFiles(),
        readJsonIfExists: (path) => store().readJsonIfExists(path),
        getFileMtime: (path) => store().getFileMtime(path),
    };
}
