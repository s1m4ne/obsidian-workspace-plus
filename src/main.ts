import { Plugin } from 'obsidian';
import { L, resolveLocale } from './i18n.ts';
import { SessionManagerModal, openSessionManagerModal } from './modals/session-manager-modal-class.ts';
import { HistoryModal } from './modals/history-modal.ts';
import type { HistoryModalPluginHost } from './modals/history-modal.ts';
import * as settings from './settings.js';
import DEFAULT_DATA from './plugin/default-data.js';
import attachPluginMethods from './plugin/methods/index.js';
import { setupStatusBar } from './statusbar-controller.ts';
import { ConfirmModal } from './modals/confirm-modal.ts';
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
import { SettingsState } from './state/settings-state.ts';
import type { SettingsStateHost } from './state/settings-state.ts';
import type { SessionStorage } from './storage/session-storage.ts';
import type { SyncWatcher } from './storage/sync-watcher.ts';
import { getSyncWatcher, onExternalSettingsChange, clearSessionStorageSyncTimers } from './storage/session-sync.ts';
import type { SyncWatcherHost } from './storage/session-sync.ts';
import { initRotationBackupTimestampForHost } from './storage/storage-backup.ts';
import type { RotationBackupTimestampHost } from './storage/storage-backup.ts';
import { StatusBarController } from './statusbar-controller.ts';
import type { StatusBarControllerHost } from './statusbar-controller.ts';
import { SwitchOverlay } from './ui/overlays/switch-overlay.ts';
import type { SwitchOverlayHost } from './ui/overlays/switch-overlay.ts';
import { SearchOverlay } from './ui/overlays/search-overlay.ts';
import type { SearchOverlayHost } from './ui/overlays/search-overlay.ts';
import type { SessionManagerModalHost } from './modals/session-manager-modal-class.ts';
import type { SettingsTabHost } from './settings-tab.ts';

resolveLocale();

/**
 * What plugin/methods/ still attaches to the prototype.
 *
 * Declaration merging is what makes this file type-check while the attach step
 * is still how those methods arrive: TypeScript cannot see a prototype written
 * at run time. Both this interface and the attach call are deleted in commit 34b
 * of issue #111, once the Behavior Lock - whose only seam is this mechanism -
 * has been retired.
 */
interface AttachedPluginMethods {
    loadWithBackup(): Promise<Partial<PluginData> | null>;
    flushPendingPersistence(): Promise<unknown>;
    persistData(): Promise<boolean>;

    getSessionStorage(): SessionStorage;

    syncSessionCommands(): void;

    updateStatusBar(): void;
    scheduleStartupFlush(): void;


    switchOverlayEl: HTMLElement | null;
    showSwitchPreviewOverlay(ordered: SessionItem[], index: number, viewGroupId?: string | null): void;
    showSwitchFeedbackOverlay(
        ordered: SessionItem[],
        index: number,
        viewGroupId?: string | null,
        overlayOptions?: unknown,
    ): void;
    hideSwitchOverlay(): void;
    hideSearchOverlay(): void;
}

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
    settingTab?: InstanceType<typeof settings.WorkspacePlusPlusSettingTab>;

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

        this.settingTab = new settings.WorkspacePlusPlusSettingTab(this.app, this.asHost<SettingsTabHost>());
        this.addSettingTab(this.settingTab);

        this.registerEvent(this.app.workspace.on('layout-change', () => {
            this.getSessionSwitcher().noteStartupLayoutChange();
            this.updateStatusBar();
        }));
        this.registerEvent(this.app.workspace.on('active-leaf-change', () => {
            // A switch moves many leaves; letting each one redraw the status bar
            // would show every intermediate state.
            if (this.getSessionSwitcher().isSwitching) return;
            setTimeout(() => { this.updateStatusBar(); }, 0);
        }));

        // Everything here needs the workspace to exist, so it waits rather than
        // running inside onload.
        this.app.workspace.onLayoutReady(() => {
            this.getSessionSwitcher().startStartupSettleWindow();
            this.getSessionStore().ensureDefaultSession();
            this.syncSessionCommands();
            this.scheduleStartupFlush();
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

    isSidebarRestoreEnabled(): boolean {
        return this.getSessionSwitcher().isSidebarRestoreEnabled();
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
    private asHost<T>(): T {
        return this as unknown as T;
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
        this.hideSwitchOverlay();
        this.hideSearchOverlay();
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

export interface WorkspacePlusPlus extends AttachedPluginMethods {}

attachPluginMethods(WorkspacePlusPlus);

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
        updateStatusBar: () => { plugin.updateStatusBar(); },
        syncSessionCommands: () => { plugin.syncSessionCommands(); },
        hideSwitchOverlay: () => { plugin.hideSwitchOverlay(); },
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
        get switchOverlayEl() { return plugin.switchOverlayEl; },
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
        // builds the layout and then calls this to put it on screen. Pointing it
        // back at applyWorkspaceLayout would recurse.
        applyWorkspaceLayout: (layout) => plugin.app.workspace.changeLayout(layout).then(() => true),
        pushLayoutToHistory: (session) => { plugin.getHistoryService().pushLayoutToHistory(session); },
        saveActiveSession: (options) => plugin.getSessionSaver().saveActiveSession(options),
        isActiveSessionDirty: () => plugin.getSessionSaver().isActiveSessionDirty(),
        isAutoSaveOnSwitchEnabled: () => plugin.getSessionSaver().isAutoSaveOnSwitchEnabled(),
        isWarnOnUnsavedSwitchEnabled: () => plugin.getSessionSaver().isWarnOnUnsavedSwitchEnabled(),
        persistData: () => plugin.persistData(),
        updateStatusBar: () => { plugin.updateStatusBar(); },
        showSwitchPreviewOverlay: (ordered, index, viewGroupId) => {
            plugin.showSwitchPreviewOverlay(ordered, index, viewGroupId);
        },
        showSwitchFeedbackOverlay: (ordered, index, viewGroupId, overlayOptions) => {
            plugin.showSwitchFeedbackOverlay(ordered, index, viewGroupId, overlayOptions);
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
        updateStatusBar: () => { plugin.updateStatusBar(); },
        syncSessionCommands: () => { plugin.syncSessionCommands(); },
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
        updateStatusBar: () => { plugin.updateStatusBar(); },
        syncSessionCommands: () => { plugin.syncSessionCommands(); },
        hideSwitchOverlay: () => { plugin.hideSwitchOverlay(); },
        hideSearchOverlay: () => { plugin.hideSearchOverlay(); },
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
        get sessionStore() { return plugin.getSessionStore(); },
        getActiveSession: () => plugin.getSessionStore().getActiveSession(),
        getCurrentWorkspaceLayout: () => plugin.getSessionStore().getCurrentWorkspaceLayout(),
        applyWorkspaceLayout: (layout) => plugin.getSessionSwitcher().applyWorkspaceLayout(layout),
        layoutsEqualStructural: (a, b) => plugin.getSessionStore().layoutsEqualStructural(a, b),
        updateStatusBar: () => { plugin.updateStatusBar(); },
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
        updateStatusBar: () => { plugin.updateStatusBar(); },
        syncSessionCommands: () => { plugin.syncSessionCommands(); },
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
        getStartupSettleRemainingMs: () => plugin.getSessionSwitcher().getStartupSettleRemainingMs(),
        isSessionSwitcherActive: () => plugin.getSessionSwitcher().isSwitching,
        registerEvent: (eventRef) => { plugin.registerEvent(eventRef); },
    };
}
