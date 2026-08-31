import {
    type App,
    type Command,
    FuzzySuggestModal,
    type Hotkey,
    Notice,
} from 'obsidian';
import { L } from '../i18n.ts';
import type { PluginData, SessionItem } from '../storage/default-data.ts';

export interface CommandRegistryHost {
    data: PluginData;
    app: App;
    addCommand(command: Command): Command;
    removeCommand(id: string): void;
    getOrderedSessions(): SessionItem[];
    getOrderedSessionsUnfiltered(): SessionItem[];
    confirmOverwriteSessionWithCurrentLayout(sessionId: string): void;
    renameCurrentSession(): void;
    deleteCurrentSession(): void;
    createEmptySession(): void;
    duplicateCurrentSession(): Promise<boolean> | void;
    switchToIndex(index: number): Promise<boolean> | void;
    switchRelativeFromCommand(direction: number): Promise<boolean> | void;
    saveActiveSession(): Promise<boolean> | void;
    saveAsSession(): Promise<boolean> | void;
    saveCurrentNoteNameAsSession(): Promise<boolean> | void;
    isAutoSaveOnSwitchEnabled(): boolean;
    setAutoSaveOnSwitch(enabled: boolean, opts?: { notify?: boolean }): Promise<void> | void;
    reloadCurrentSessionWithoutSaving(): Promise<boolean> | void;
    toggleAutoSaveOnSwitch(opts?: { notify?: boolean }): Promise<boolean> | void;
    openSearchOverlay(): void;
    isVersionHistoryEnabled(): boolean;
    getActiveSession(): SessionItem | null;
    exportSessionsSnapshot(): Promise<void>;
    importSessionsFromLatestExport(): Promise<void>;
    isGroupFeatureEnabled(): boolean;
    getOrderedSessionsForGroup(groupId: string | null): SessionItem[];
    getActiveSessionIndex(sessions: SessionItem[]): number;
    showSwitchOverlay(sessions: SessionItem[], activeIndex: number, groupId: string | null): void;
    getRelativeGroupId(currentGroupId: string | null, step: number): string | undefined;
    resolveGroupSelection(groupId: string): Promise<{ resolvedGroupId: string }>;
    exitGroup(): void;
    switchGroupRelative(step: number): void;
    switchSessionByIdFromCommand(sessionId: string): Promise<boolean> | void;

    switchOverlayEl?: HTMLElement | null;
    switchOverlayViewGroupId?: string | null;
    searchOverlayEl?: HTMLElement | null;
    searchOverlayViewGroupId?: string | null;

    openSessionManagerModal?(focusName?: boolean): void;
    openHistoryModal?(session: SessionItem): void;
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

    private get data(): PluginData {
        return this.host.data;
    }

    get dynamicSessionCommandIds(): readonly string[] {
        return this._dynamicSessionCommandIds;
    }

    openSaveCurrentLayoutToSessionModal(): void {
        const sessions = this.host.getOrderedSessionsUnfiltered();
        if (!sessions || sessions.length === 0) {
            new Notice(String(L.noSession || ''));
            return;
        }

        const modal = new SaveLayoutSuggestModal(
            this.host.app,
            sessions,
            String(L.saveCurrentLayoutToSessionPlaceholder || ''),
            (session) => {
                this.host.confirmOverwriteSessionWithCurrentLayout(session.id);
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
            if (typeof host.openSessionManagerModal === 'function') {
                host.openSessionManagerModal(false);
            }
        });

        addSimpleCommand('create-session', String(L.cmdCreate || ''), () => {
            if (typeof host.openSessionManagerModal === 'function') {
                host.openSessionManagerModal(true);
            }
        });

        addSimpleCommand(
            'rename-session',
            String(L.cmdRename || ''),
            () => {
                host.renameCurrentSession();
            },
            [{ modifiers: ['Mod', 'Shift'], key: 'R' }]
        );

        addSimpleCommand(
            'delete-session',
            String(L.cmdDelete || ''),
            () => {
                host.deleteCurrentSession();
            },
            [{ modifiers: ['Mod', 'Shift'], key: 'Backspace' }]
        );

        addSimpleCommand('new-empty-session', String(L.cmdNewEmpty || ''), () => {
            host.createEmptySession();
        });

        addSimpleCommand(
            'duplicate-session',
            String(L.cmdDuplicate || ''),
            () => {
                void host.duplicateCurrentSession();
            },
            [{ modifiers: ['Mod', 'Shift'], key: 'M' }]
        );

        // Numbered session switching (Mod+Shift+1 through 9)
        if (this.data.numberedSwitchCommands) {
            for (let n = 1; n <= 9; n++) {
                const num = n;
                host.addCommand({
                    id: 'switch-to-' + num,
                    name: (L.cmdSwitchTo as (n: number) => string)(num),
                    checkCallback: (checking) => {
                        if (!this.data.showActiveSwitchCommand) {
                            const ordered = host.getOrderedSessions();
                            const session = ordered[num - 1];
                            if (session && session.id === this.data.activeSessionId) return false;
                        }
                        if (!checking) void host.switchToIndex(num - 1);
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
                void host.switchRelativeFromCommand(-1);
            },
            [{ modifiers: ['Mod', 'Shift'], key: ',' }]
        );

        addSimpleCommand(
            'next-session',
            String(L.cmdNext || ''),
            () => {
                void host.switchRelativeFromCommand(1);
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
                void host.saveActiveSession();
            },
            [{ modifiers: ['Mod', 'Shift'], key: 'S' }]
        );

        addSimpleCommand('save-as-session', String(L.cmdSaveAs || ''), () => {
            void host.saveAsSession();
        });

        addSimpleCommand(
            'save-current-note-name-as-session',
            String(L.cmdSaveCurrentNoteNameAsSession || ''),
            () => {
                void host.saveCurrentNoteNameAsSession();
            }
        );

        host.addCommand({
            id: 'save-current-layout-to-session',
            name: String(L.cmdSaveCurrentLayoutToSession || ''),
            checkCallback: (checking) => {
                if (host.isAutoSaveOnSwitchEnabled()) return false;
                if (!checking) this.openSaveCurrentLayoutToSessionModal();
                return true;
            },
        });

        addSimpleCommand(
            'reload-current-session-without-saving',
            String(L.cmdReloadCurrentWithoutSaving || ''),
            () => {
                void host.reloadCurrentSessionWithoutSaving();
            }
        );

        addSimpleCommand('toggle-auto-save-on-switch', String(L.cmdToggleAutoSave || ''), () => {
            void host.toggleAutoSaveOnSwitch({ notify: true });
        });

        host.addCommand({
            id: 'enable-auto-save-on-switch',
            name: String(L.cmdEnableAutoSave || ''),
            checkCallback: (checking) => {
                const canRun = !host.isAutoSaveOnSwitchEnabled();
                if (!canRun) return false;
                if (!checking) void host.setAutoSaveOnSwitch(true, { notify: true });
                return true;
            },
        });

        host.addCommand({
            id: 'disable-auto-save-on-switch',
            name: String(L.cmdDisableAutoSave || ''),
            checkCallback: (checking) => {
                const canRun = host.isAutoSaveOnSwitchEnabled();
                if (!canRun) return false;
                if (!checking) void host.setAutoSaveOnSwitch(false, { notify: true });
                return true;
            },
        });

        addSimpleCommand('search-session-overlay', String(L.cmdSearchOverlay || ''), () => {
            host.openSearchOverlay();
        });

        host.addCommand({
            id: 'version-history',
            name: String(L.cmdVersionHistory || ''),
            checkCallback: (checking) => {
                if (!host.isVersionHistoryEnabled()) return false;
                const session = host.getActiveSession();
                if (!session) return false;
                if (!checking && typeof host.openHistoryModal === 'function') {
                    host.openHistoryModal(session);
                }
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
            if (host.switchOverlayEl) return host.switchOverlayViewGroupId || null;
            if (host.searchOverlayEl) return host.searchOverlayViewGroupId || null;
            return this.data.activeGroupId || null;
        };

        const showSwitchOverlayForGroup = (groupId: string | null) => {
            const ordered = host.getOrderedSessionsForGroup(groupId || null);
            const activeIndex = host.getActiveSessionIndex(ordered);
            host.showSwitchOverlay(ordered, activeIndex, groupId || null);
        };

        const switchGroupAndShowOverlay = (step: number) => {
            if (!host.isGroupFeatureEnabled()) return;
            const targetGroupId = host.getRelativeGroupId(getCurrentGroupViewId(), step);
            if (typeof targetGroupId === 'undefined') {
                showSwitchOverlayForGroup(this.data.activeGroupId || null);
                return;
            }

            void host.resolveGroupSelection(targetGroupId).then((result) => {
                showSwitchOverlayForGroup(result.resolvedGroupId);
            });
        };

        host.addCommand({
            id: 'switch-group',
            name: String(L.cmdSwitchGroup || ''),
            callback: () => {
                switchGroupAndShowOverlay(1);
            },
        });

        host.addCommand({
            id: 'exit-group',
            name: String(L.cmdExitGroup || ''),
            checkCallback: (checking) => {
                if (!host.isGroupFeatureEnabled()) return false;
                if (!this.data.activeGroupId) return false;
                if (!checking) host.exitGroup();
                return true;
            },
        });

        host.addCommand({
            id: 'next-group',
            name: String(L.cmdNextGroup || ''),
            hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'Tab' }],
            callback: () => {
                switchGroupAndShowOverlay(1);
            },
        });

        addSimpleCommand('previous-group', String(L.cmdPreviousGroup || ''), () => {
            host.switchGroupRelative(-1);
        });
    }

    syncSessionCommands(): void {
        const host = this.host;
        const ordered = host.getOrderedSessions();

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

        if (this.data.numberedSwitchCommands) {
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
                        if (!this.data.showActiveSwitchCommand) {
                            const currentOrdered = host.getOrderedSessions();
                            const targetSession = currentOrdered[num - 1];
                            if (targetSession && targetSession.id === this.data.activeSessionId) {
                                return false;
                            }
                        }
                        if (!checking) void host.switchToIndex(num - 1);
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
                    if (!this.data.showActiveSwitchCommand) {
                        if (session.id === this.data.activeSessionId) return false;
                    }
                    if (!checking) void host.switchSessionByIdFromCommand(session.id);
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
