import { Notice, type App } from 'obsidian';
import { L } from './i18n.ts';
import type { PluginData, SessionItem } from './storage/default-data.ts';
import { openSessionContextMenu } from './session-context-actions.js';
import { openSettingsContextMenu } from './settings-context-menu.js';


export interface StatusBarActionPluginHost {
    // Required: see command-registry.ts.
    openSessionManagerModal(): void;
    openHistoryModal(session: SessionItem): void;
    app: App;
    data: PluginData;
    searchOverlayEl?: HTMLElement | null;
    statusBarEl?: HTMLElement | null;
    getActiveSession(): SessionItem | null;
    isGroupFeatureEnabled(): boolean;
    getOrderedGroups(): readonly unknown[];
    isVersionHistoryEnabled(): boolean;
    isVersionHistoryConfirmRestoreEnabled(): boolean;
    updateStatusBar(): void;
    hideSearchOverlay(): void;
    openSearchOverlay(anchorEl?: HTMLElement | null): void;
    saveActiveSession(): Promise<unknown>;
    saveAsSession(): Promise<unknown>;
    saveCurrentNoteNameAsSession(): Promise<unknown>;
    reloadCurrentSessionWithoutSaving(): Promise<unknown>;
    renameCurrentSession(): void;
    duplicateCurrentSession(): Promise<unknown>;
    switchRelativeFromStatusBar(offset: number): Promise<boolean>;
    createEmptySession(): Promise<unknown>;
    toggleAutoSaveOnSwitch(options?: { notify?: boolean }): Promise<unknown>;
    quickRestoreLatestHistory(): void;
    openConfirmModal?(
        message: string,
        onConfirm: () => void,
        options: { confirmText: string; confirmClass: string }
    ): void;
    [key: string]: unknown;
}

function resolveLabel(lTable: typeof L, labelKey: string): string {
    const label = (lTable as Record<string, unknown>)[labelKey];
    if (typeof label === 'function') {
        return String((label as () => unknown)());
    }
    return typeof label === 'string' ? label : '';
}

export interface StatusBarAction {
    readonly id: string;
    readonly labelKey: string;
    readonly run: (plugin: StatusBarActionPluginHost, event?: MouseEvent) => unknown;
}

export const ACTIONS: readonly StatusBarAction[] = [
    {
        id: 'quickSwitcher',
        labelKey: 'statusBarActionQuickSwitcher',
        run(plugin) {
            if (plugin.searchOverlayEl) {
                plugin.hideSearchOverlay?.();
            } else {
                plugin.openSearchOverlay?.(plugin.statusBarEl);
            }
        },
    },
    {
        id: 'sessionManager',
        labelKey: 'statusBarActionSessionManager',
        run(plugin) {
            plugin.openSessionManagerModal();
        },
    },
    {
        id: 'saveSession',
        labelKey: 'statusBarActionSaveSession',
        run(plugin) {
            return plugin.saveActiveSession();
        },
    },
    {
        id: 'saveAsSession',
        labelKey: 'cmdSaveAs',
        run(plugin) {
            return plugin.saveAsSession();
        },
    },
    {
        id: 'saveCurrentNoteNameAsSession',
        labelKey: 'cmdSaveCurrentNoteNameAsSession',
        run(plugin) {
            return plugin.saveCurrentNoteNameAsSession();
        },
    },
    {
        id: 'reloadWithoutSaving',
        labelKey: 'statusBarActionReloadWithoutSaving',
        run(plugin) {
            return plugin.reloadCurrentSessionWithoutSaving();
        },
    },
    {
        id: 'renameSession',
        labelKey: 'cmdRename',
        run(plugin) {
            plugin.renameCurrentSession();
        },
    },
    {
        id: 'duplicateSession',
        labelKey: 'cmdDuplicate',
        run(plugin) {
            return plugin.duplicateCurrentSession();
        },
    },
    {
        id: 'previousSession',
        labelKey: 'cmdPrevious',
        run(plugin) {
            return plugin.switchRelativeFromStatusBar(-1);
        },
    },
    {
        id: 'nextSession',
        labelKey: 'cmdNext',
        run(plugin) {
            return plugin.switchRelativeFromStatusBar(1);
        },
    },
    {
        id: 'newEmptySession',
        labelKey: 'cmdNewEmpty',
        run(plugin) {
            return plugin.createEmptySession();
        },
    },
    {
        id: 'toggleAutoSaveOnSwitch',
        labelKey: 'cmdToggleAutoSave',
        run(plugin) {
            return plugin.toggleAutoSaveOnSwitch({ notify: true });
        },
    },
    {
        id: 'versionHistory',
        labelKey: 'statusBarActionVersionHistory',
        run(plugin) {
            const session = plugin.getActiveSession();
            if (session) {
                plugin.openHistoryModal(session);
            }
        },
    },
    {
        id: 'restoreLatestHistory',
        labelKey: 'statusBarActionRestoreLatestHistory',
        run(plugin) {
            if (!plugin.isVersionHistoryEnabled()) {
                new Notice(String(L.historyNoEntries || ''));
                return;
            }
            const activeSession = plugin.getActiveSession();
            if (!activeSession || !activeSession.history || activeSession.history.length === 0) {
                new Notice(String(L.historyNoEntries || ''));
                return;
            }
            if (plugin.isVersionHistoryConfirmRestoreEnabled()) {
                const historyEntries = activeSession.history;
                const latestSavedAt = historyEntries?.[0]?.savedAt ?? 0;
                const latestTime = new Date(latestSavedAt)
                    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const sessionName = activeSession.name ?? '';
                const message = (L.historyRestoreConfirm as (name: string, time: string) => string)(sessionName, latestTime);
                plugin.openConfirmModal?.(
                    message,
                    () => { plugin.quickRestoreLatestHistory(); },
                    { confirmText: String(L.historyRestore || 'Restore'), confirmClass: 'mod-cta' }
                );
            } else {
                plugin.quickRestoreLatestHistory();
            }
        },
    },
    {
        id: 'sessionMenu',
        labelKey: 'statusBarActionSessionMenu',
        run(plugin, event) {
            const sess = plugin.getActiveSession();
            if (!sess) return;
            openSessionContextMenu({
                plugin,
                app: plugin.app,
                session: sess,
                isActive: true,
                event: event as MouseEvent,
                showSaveAs: true,
                showSwitch: false,
                showRemoveFromGroup: false,
                showMoveToGroup: plugin.isGroupFeatureEnabled() && plugin.getOrderedGroups().length > 0,
                showCustomizeClicks: true,
                forceDeleteConfirm: true,
                notifyDeleted: false,
                onSessionsChanged() {
                    plugin.updateStatusBar();
                },
            });
        },
    },
    {
        id: 'settingsMenu',
        labelKey: 'statusBarActionSettingsMenu',
        run(plugin, event) {
            openSettingsContextMenu({
                plugin,
                app: plugin.app,
                event: event as MouseEvent,
                onChanged() {
                    plugin.updateStatusBar();
                },
            });
        },
    },
    {
        id: 'none',
        labelKey: 'statusBarActionNone',
        run() {},
    },
];

const ACTION_INDEX: Record<string, StatusBarAction> = {};
for (let i = 0; i < ACTIONS.length; i++) {
    const act = ACTIONS[i]!;
    ACTION_INDEX[act.id] = act;
}

export function executeStatusBarAction(
    plugin: StatusBarActionPluginHost,
    actionId: string,
    event?: MouseEvent
): unknown {
    if (!actionId || actionId === 'none') return;
    const action = ACTION_INDEX[actionId];
    if (!action) return;
    return action.run(plugin, event);
}

export function getActionLabel(lTable: typeof L, actionId: string): string {
    const action = ACTION_INDEX[actionId] || ACTION_INDEX.none!;
    return resolveLabel(lTable, action.labelKey);
}

export const ACTION_IDS: readonly string[] = ACTIONS.map((action) => action.id);

export { STATUS_BAR_SLOT_KEYS as SLOT_KEYS } from './storage/default-data.ts';
