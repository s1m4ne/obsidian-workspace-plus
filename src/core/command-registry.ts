import {
    type App,
    type Command,
    FuzzySuggestModal,
    type Hotkey,
    Notice,
} from 'obsidian';
import { L } from '../i18n.ts';
import * as obsidianInternals from '../platform/obsidian-internals.ts';
import type { SessionItem } from '../storage/default-data.ts';
import { isMacPlatform } from '../utils.ts';
import type { GroupStore } from '../state/group-store.ts';
import type { SessionSaver } from '../state/session-saver.ts';
import type { SessionStore } from '../state/session-store.ts';
import type { HistoryService } from '../state/history-service.ts';
import type { SessionSwitcher } from '../state/session-switcher.ts';
import type { FrontmatterLinker } from '../core/frontmatter-linker.ts';
import type { SettingsState } from '../state/settings-state.ts';


export interface CommandRegistryHost {
    /**
     * Owned by FrontmatterLinker; naming it keeps one list rather than a
     * forwarding method per call on the plugin.
     */
    getFrontmatterLinker(): FrontmatterLinker;

    /**
     * Settings and their defaults are owned by SettingsState. Reading
     * `data.X` here re-derived a default the owner already holds, which is the
     * duplication P5 named and P1's contract stage removes.
     */
    getSettingsState(): SettingsState;

    /**
     * Owned by SessionSwitcher; naming it keeps one list rather than a
     * forwarding method per call on the plugin.
     */
    getSessionSwitcher(): SessionSwitcher;

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
     * forwarding method per call, and one added to the store without a shim did
     * nothing from here while the type checker saw a host merely lacking it.
     */
    getGroupStore(): GroupStore;

    // Required, not optional: an unwired modal opener must fail to compile, not
    // fail silently at run time the way `openHistoryModal?.()` did.
    openSessionManagerModal(focusName: boolean): void;
    openHistoryModal(session: SessionItem): void;

    // No `data`. The registry read `activeSessionId`, `activeGroupId`,
    // `numberedSwitchCommands` and `showActiveSwitchCommand` off the shared bag
    // and now asks the three owners instead, so it needs no access to it at
    // all - which is what P1's contract stage is for. Declaring it anyway would
    // hand back the reach it just gave up.
    app: App;
    manifest: { id: string };
    addCommand(command: Command): Command;
    removeCommand(id: string): void;
    getSearchOverlay(): { open(anchorEl?: HTMLElement): void };
    // `Promise<unknown>`: it resolves with the path it wrote, and the one
    // caller here hands the promise to runWithFailureNotice without reading it.
    // Declaring Promise<void> was simply wrong about what it returns.
    exportSessionsSnapshot(): Promise<unknown>;
    importSessionsFromLatestExport(): Promise<unknown>;
    getSwitchOverlay(): {
        show(sessions: SessionItem[], activeIndex: number, groupId: string | null): void;
        overlayEl: HTMLElement | null;
        viewGroupId: string | null;
    };

    searchOverlayEl?: HTMLElement | null;
    searchOverlayViewGroupId?: string | null;

    openConfirmModal?(
        message: string,
        onConfirm: () => void,
        opts?: { confirmText?: string; confirmClass?: string }
    ): void;
    _dynamicSessionCommandIds?: string[];
    getCommandRegistry?(): CommandRegistry;
}

class SaveLayoutSuggestModal extends FuzzySuggestModal<SessionItem> {
    private readonly sessions: SessionItem[];
    private readonly onChoose: (session: SessionItem) => void;

    constructor(
        app: App,
        sessions: SessionItem[],
        placeholder: string,
        onChoose: (session: SessionItem) => void
    ) {
        super(app);
        this.sessions = sessions;
        this.onChoose = onChoose;
        this.setPlaceholder(placeholder);
    }

    getItems(): SessionItem[] {
        return this.sessions;
    }

    getItemText(session: SessionItem): string {
        return session.name || '';
    }

    onChooseItem(session: SessionItem): void {
        this.onChoose(session);
    }
}

export class CommandRegistry {
    private readonly hostProvider: () => CommandRegistryHost;
    private _dynamicSessionCommandIds: string[] = [];

    constructor(hostOrProvider: CommandRegistryHost | (() => CommandRegistryHost)) {
        if (typeof hostOrProvider === 'function') {
            this.hostProvider = hostOrProvider;
        } else {
            this.hostProvider = () => hostOrProvider;
        }
    }

    private get host(): CommandRegistryHost {
        return this.hostProvider();
    }

    get dynamicSessionCommandIds(): readonly string[] {
        return this._dynamicSessionCommandIds;
    }

    formatHotkey(hotkey: Hotkey): string {
        const isMac = isMacPlatform();
        const parts: string[] = [];
        for (const modifier of hotkey.modifiers ?? []) {
            if (modifier === 'Mod') parts.push(isMac ? '⌘' : 'Ctrl');
            else if (modifier === 'Alt') parts.push(isMac ? '⌥' : 'Alt');
            else if (modifier === 'Shift') parts.push(isMac ? '⇧' : 'Shift');
            else if (modifier === 'Ctrl') parts.push(isMac ? '⌃' : 'Ctrl');
        }
        const keyMap: Record<string, string> = {
            ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', ',': '<', '.': '>',
        };
        const key = keyMap[hotkey.key] ?? hotkey.key;
        if (isMac) return parts.join('') + key;
        parts.push(key);
        return parts.join('+');
    }

    /** The hotkey Obsidian has registered for one of this plugin's commands, formatted. */
    getCommandHotkey(commandId: string, index = 0): string {
        const hotkeys = obsidianInternals.getCommandHotkeys(this.host.app, `${this.host.manifest.id}:${commandId}`);
        const hotkey = hotkeys?.[index];
        return hotkey ? this.formatHotkey(hotkey) : '';
    }

    openSaveCurrentLayoutToSessionModal(): void {
        const sessions = this.host.getSessionStore().getOrderedSessionsUnfiltered();
        if (!sessions || sessions.length === 0) {
            new Notice(String(L.noSession || ''));
            return;
        }

        const modal = new SaveLayoutSuggestModal(
            this.host.app,
            sessions,
            String(L.saveCurrentLayoutToSessionPlaceholder || ''),
            (session) => {
                this.host.getSessionSaver().confirmOverwriteSessionWithCurrentLayout(session.id);
            }
        );
        modal.open();
    }

    registerCommands(): void {
        const host = this.host;

        const addSimpleCommand = (
            id: string,
            name: string,
            callback: () => void,
            hotkeys?: Hotkey[]
        ) => {
            const command: Command = {
                id,
                name,
                callback,
            };
            if (hotkeys) {
                command.hotkeys = hotkeys;
            }
            host.addCommand(command);
        };

        const runWithFailureNotice = (
            operation: () => Promise<unknown>,
            failureNotice: string
        ) => {
            operation().catch(() => {
                new Notice(failureNotice);
            });
        };

        addSimpleCommand('manage-sessions', String(L.cmdManage || ''), () => {
            host.openSessionManagerModal(false);
        });

        addSimpleCommand('create-session', String(L.cmdCreate || ''), () => {
            host.openSessionManagerModal(true);
        });

        addSimpleCommand(
            'rename-session',
            String(L.cmdRename || ''),
            () => {
                host.getSessionStore().renameCurrentSession();
            },
            [{ modifiers: ['Mod', 'Shift'], key: 'R' }]
        );

        addSimpleCommand(
            'delete-session',
            String(L.cmdDelete || ''),
            () => {
                host.getSessionStore().deleteCurrentSession();
            },
            [{ modifiers: ['Mod', 'Shift'], key: 'Backspace' }]
        );

        addSimpleCommand('new-empty-session', String(L.cmdNewEmpty || ''), () => {
            void host.getSessionStore().createEmptySession();
        });

        addSimpleCommand(
            'duplicate-session',
            String(L.cmdDuplicate || ''),
            () => {
                void host.getSessionStore().duplicateCurrentSession();
            },
            [{ modifiers: ['Mod', 'Shift'], key: 'M' }]
        );

        // Numbered session switching (Mod+Shift+1 through 9)
        if (this.host.getSettingsState().numberedSwitchCommands) {
            for (let n = 1; n <= 9; n++) {
                const num = n;
                host.addCommand({
                    id: 'switch-to-' + num,
                    name: (L.cmdSwitchTo as (n: number) => string)(num),
                    checkCallback: (checking) => {
                        if (!this.host.getSettingsState().showActiveSwitchCommand) {
                            const ordered = host.getSessionStore().getOrderedSessions();
                            const session = ordered[num - 1];
                            if (session && session.id === this.host.getSessionStore().getActiveSessionId()) return false;
                        }
                        if (!checking) void host.getSessionSwitcher().switchToIndex(num - 1);
                        return true;
                    },
                });
            }
        }

        // Initialize dynamic command IDs tracking
        this._dynamicSessionCommandIds = [];
        host._dynamicSessionCommandIds = this._dynamicSessionCommandIds;

        // Previous / Next session
        addSimpleCommand(
            'previous-session',
            String(L.cmdPrevious || ''),
            () => {
                void host.getSessionSwitcher().switchRelativeFromCommand(-1);
            },
            [{ modifiers: ['Mod', 'Shift'], key: ',' }]
        );

        addSimpleCommand(
            'next-session',
            String(L.cmdNext || ''),
            () => {
                void host.getSessionSwitcher().switchRelativeFromCommand(1);
            },
            [
                { modifiers: ['Mod', 'Shift'], key: 'Enter' },
                { modifiers: ['Mod', 'Shift'], key: '.' },
            ]
        );

        addSimpleCommand(
            'save-current-session',
            String(L.cmdSaveCurrent || ''),
            () => {
                void host.getSessionSaver().saveActiveSession();
            },
            [{ modifiers: ['Mod', 'Shift'], key: 'S' }]
        );

        addSimpleCommand('save-as-session', String(L.cmdSaveAs || ''), () => {
            void host.getSessionSaver().saveAsSession();
        });

        addSimpleCommand(
            'save-current-note-name-as-session',
            String(L.cmdSaveCurrentNoteNameAsSession || ''),
            () => {
                void host.getFrontmatterLinker().saveCurrentNoteNameAsSession();
            }
        );

        host.addCommand({
            id: 'save-current-layout-to-session',
            name: String(L.cmdSaveCurrentLayoutToSession || ''),
            checkCallback: (checking) => {
                if (host.getSessionSaver().isAutoSaveOnSwitchEnabled()) return false;
                if (!checking) this.openSaveCurrentLayoutToSessionModal();
                return true;
            },
        });

        addSimpleCommand(
            'reload-current-session-without-saving',
            String(L.cmdReloadCurrentWithoutSaving || ''),
            () => {
                void host.getSessionSaver().reloadCurrentSessionWithoutSaving();
            }
        );

        addSimpleCommand('toggle-auto-save-on-switch', String(L.cmdToggleAutoSave || ''), () => {
            void host.getSessionSaver().toggleAutoSaveOnSwitch({ notify: true });
        });

        host.addCommand({
            id: 'enable-auto-save-on-switch',
            name: String(L.cmdEnableAutoSave || ''),
            checkCallback: (checking) => {
                const canRun = !host.getSessionSaver().isAutoSaveOnSwitchEnabled();
                if (!canRun) return false;
                if (!checking) void host.getSessionSaver().setAutoSaveOnSwitch(true, { notify: true });
                return true;
            },
        });

        host.addCommand({
            id: 'disable-auto-save-on-switch',
            name: String(L.cmdDisableAutoSave || ''),
            checkCallback: (checking) => {
                const canRun = host.getSessionSaver().isAutoSaveOnSwitchEnabled();
                if (!canRun) return false;
                if (!checking) void host.getSessionSaver().setAutoSaveOnSwitch(false, { notify: true });
                return true;
            },
        });

        host.addCommand({
            id: 'search-session-overlay',
            name: String(L.cmdSearchOverlay || ''),
            // Follows the session-filter setting, the way version-history
            // follows its own. With the filter off the overlay renders no filter
            // row, so a command called "Search sessions" opened something that
            // could not search. The overlay itself stays reachable from the
            // status bar, where its job is the quick switcher.
            checkCallback: (checking) => {
                if (!host.getSettingsState().showFilterInput) return false;
                if (!checking) host.getSearchOverlay().open();
                return true;
            },
        });

        host.addCommand({
            id: 'version-history',
            name: String(L.cmdVersionHistory || ''),
            checkCallback: (checking) => {
                if (!host.getHistoryService().isVersionHistoryEnabled()) return false;
                const session = host.getSessionStore().getActiveSession();
                if (!session) return false;
                if (!checking) host.openHistoryModal(session);
                return true;
            },
        });

        addSimpleCommand('export-sessions-snapshot', String(L.cmdExportSessions || ''), () => {
            runWithFailureNotice(
                () => host.exportSessionsSnapshot(),
                String(L.exportSessionsFailed || '')
            );
        });

        addSimpleCommand('import-latest-sessions-snapshot', String(L.cmdImportSessions || ''), () => {
            if (typeof host.openConfirmModal === 'function') {
                host.openConfirmModal(
                    String(L.confirmImportSessions || ''),
                    () => {
                        host.importSessionsFromLatestExport().catch(() => {
                            new Notice(String(L.importSessionsFailed || ''));
                        });
                    },
                    {
                        confirmText: String(L.settingsImportSessionsBtn || L.cmdImportSessions || 'Import'),
                        confirmClass: 'mod-cta',
                    }
                );
            }
        });

        // --- Group commands ---

        const getCurrentGroupViewId = (): string | null => {
            const overlay = host.getSwitchOverlay();
            if (overlay.overlayEl) return overlay.viewGroupId || null;
            if (host.searchOverlayEl) return host.searchOverlayViewGroupId || null;
            return this.host.getGroupStore().getActiveGroupId();
        };

        const showSwitchOverlayForGroup = (groupId: string | null) => {
            const ordered = host.getSessionStore().getOrderedSessionsForGroup(groupId || null);
            const activeIndex = host.getSessionStore().findActiveSessionIndex(ordered);
            host.getSwitchOverlay().show(ordered, activeIndex, groupId || null);
        };

        const switchGroupAndShowOverlay = (step: number) => {
            if (!host.getGroupStore().isGroupFeatureEnabled()) return;
            const targetGroupId = host.getGroupStore().getRelativeGroupId(getCurrentGroupViewId(), step);
            if (typeof targetGroupId === 'undefined') {
                showSwitchOverlayForGroup(this.host.getGroupStore().getActiveGroupId());
                return;
            }

            void host.getGroupStore().resolveGroupSelection(targetGroupId).then((result) => {
                showSwitchOverlayForGroup(result.resolvedGroupId);
            });
        };

        /**
         * A group command is unavailable whenever the group feature is off.
         *
         * Three of the four used a plain `callback`, so turning groups off left
         * them listed in the command palette running a body that returned
         * immediately - and left next-group holding Cmd+Shift+Tab, which is
         * Obsidian's own reverse tab switch, for no benefit at all. Third
         * instance of that shape: cd2275e did it for the search command and the
         * session-filter setting.
         *
         * Writing the guard once rather than four times is the other half. It
         * also removes the one duplicate body in this file: switch-group and
         * next-group run the same action, which is a product question - the
         * vaguer name is the older one, and deleting a command silently breaks
         * whatever hotkey somebody put on it - so both stay for now.
         */
        const addGroupCommand = (
            id: string,
            name: string,
            run: () => void,
            options?: { hotkeys?: Hotkey[]; isAvailable?: () => boolean }
        ) => {
            const command: Command = {
                id,
                name,
                checkCallback: (checking) => {
                    if (!host.getGroupStore().isGroupFeatureEnabled()) return false;
                    if (options?.isAvailable && !options.isAvailable()) return false;
                    if (!checking) run();
                    return true;
                },
            };
            if (options?.hotkeys) command.hotkeys = options.hotkeys;
            host.addCommand(command);
        };

        addGroupCommand('switch-group', String(L.cmdSwitchGroup || ''), () => {
            switchGroupAndShowOverlay(1);
        });

        addGroupCommand('exit-group', String(L.cmdExitGroup || ''), () => {
            void host.getGroupStore().exitGroup();
        }, {
            isAvailable: () => Boolean(this.host.getGroupStore().getActiveGroupId()),
        });

        addGroupCommand('next-group', String(L.cmdNextGroup || ''), () => {
            switchGroupAndShowOverlay(1);
        }, {
            // Two bindings for one command. Mod+Shift+Tab is contended - the
            // window manager takes it on macOS, and Obsidian uses it for its own
            // tabs - so G is offered as the one that reliably arrives. Tab stays
            // because people already use it.
            hotkeys: [
                { modifiers: ['Mod', 'Shift'], key: 'Tab' },
                { modifiers: ['Mod', 'Shift'], key: 'G' },
            ],
        });

        addGroupCommand('previous-group', String(L.cmdPreviousGroup || ''), () => {
            void host.getGroupStore().switchGroupRelative(-1);
        });
    }

    syncSessionCommands(): void {
        const host = this.host;
        const ordered = host.getSessionStore().getOrderedSessions();

        // 1. Remove old dynamic commands
        const oldIds = this._dynamicSessionCommandIds.length > 0
            ? this._dynamicSessionCommandIds
            : host._dynamicSessionCommandIds || [];

        for (const cmdId of oldIds) {
            host.removeCommand(cmdId);
        }
        this._dynamicSessionCommandIds = [];
        host._dynamicSessionCommandIds = this._dynamicSessionCommandIds;

        let dynamicStart: number;

        if (this.host.getSettingsState().numberedSwitchCommands) {
            // 2a. Re-register numbered commands (1-9) with session names
            for (let n = 1; n <= 9; n++) {
                const num = n;
                host.removeCommand('switch-to-' + num);
                const session = ordered[num - 1];
                host.addCommand({
                    id: 'switch-to-' + num,
                    name: (L.cmdSwitchTo as (n: number, name?: string) => string)(
                        num,
                        session ? session.name : undefined
                    ),
                    checkCallback: (checking) => {
                        if (!this.host.getSettingsState().showActiveSwitchCommand) {
                            const currentOrdered = host.getSessionStore().getOrderedSessions();
                            const targetSession = currentOrdered[num - 1];
                            if (targetSession && targetSession.id === this.host.getSessionStore().getActiveSessionId()) {
                                return false;
                            }
                        }
                        if (!checking) void host.getSessionSwitcher().switchToIndex(num - 1);
                        return true;
                    },
                });
            }
            dynamicStart = 9;
        } else {
            // 2b. Remove numbered commands when disabled
            for (let n = 1; n <= 9; n++) {
                host.removeCommand('switch-to-' + n);
            }
            dynamicStart = 0;
        }

        // 3. Register dynamic commands for sessions from dynamicStart onward
        for (let j = dynamicStart; j < ordered.length; j++) {
            const session = ordered[j];
            if (!session) continue;
            const cmdId = 'switch-to-named-' + session.id;
            host.addCommand({
                id: cmdId,
                name: (L.cmdSwitchToNamed as (name?: string) => string)(session.name),
                checkCallback: (checking) => {
                    if (!this.host.getSettingsState().showActiveSwitchCommand) {
                        if (session.id === this.host.getSessionStore().getActiveSessionId()) return false;
                    }
                    if (!checking) void host.getSessionSwitcher().switchSessionByIdFromCommand(session.id);
                    return true;
                },
            });
            this._dynamicSessionCommandIds.push(cmdId);
        }
    }
}

export function registerCommands(plugin: CommandRegistryHost): void {
    if (typeof plugin.getCommandRegistry === 'function') {
        plugin.getCommandRegistry().registerCommands();
        return;
    }
    const registry = new CommandRegistry(plugin);
    registry.registerCommands();
}

export function syncSessionCommands(plugin: CommandRegistryHost): void {
    if (typeof plugin.getCommandRegistry === 'function') {
        plugin.getCommandRegistry().syncSessionCommands();
        return;
    }
    const registry = new CommandRegistry(plugin);
    registry.syncSessionCommands();
}
