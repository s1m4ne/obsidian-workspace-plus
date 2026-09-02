import { Notice, type App } from 'obsidian';
import { L } from './i18n.ts';
import type { PluginData, SessionItem } from './storage/default-data.ts';
import { openSessionContextMenu } from './session-context-actions.ts';
import { openSettingsContextMenu } from './settings-context-menu.js';
import type { SettingsContextMenuPluginHost } from './settings-context-menu-items.ts';
import type { HistoryModalPluginHost } from './modals/history-modal.ts';
import type { GroupStore } from './state/group-store.ts';
import type { SessionSaver } from './state/session-saver.ts';
import type { SessionStore } from './state/session-store.ts';
import type { HistoryService } from './state/history-service.ts';
import type { SessionSwitcher } from './state/session-switcher.ts';
import type { StatusBarController } from './statusbar-controller.ts';
import type { FrontmatterLinker } from './core/frontmatter-linker.ts';


export interface StatusBarActionPluginHost extends HistoryModalPluginHost, SettingsContextMenuPluginHost {
    /**
     * Owned by FrontmatterLinker; naming it keeps one list rather than a
     * forwarding method per call on the plugin.
     */
    getFrontmatterLinker(): FrontmatterLinker;

    /**
     * Owned by StatusBarController; naming it keeps one list rather than a
     * forwarding method per call on the plugin.
     */
    getStatusBarController(): StatusBarController;

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
     * forwarding method per call, and one added to the store without a shim
     * did nothing from here while the type checker saw a host that simply
     * lacked the member.
     */
    getGroupStore(): GroupStore;

    // Required: see command-registry.ts.
    openSessionManagerModal(): void;
    openHistoryModal(session: SessionItem): void;
    app: App;
    data: PluginData;
    searchOverlayEl?: HTMLElement | null;
    statusBarEl?: HTMLElement | null;
    hideSearchOverlay(): void;
    openSearchOverlay(anchorEl?: HTMLElement | null): void;
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
            return plugin.getSessionSaver().saveActiveSession();
        },
    },
    {
        id: 'saveAsSession',
        labelKey: 'cmdSaveAs',
        run(plugin) {
            return plugin.getSessionSaver().saveAsSession();
        },
    },
    {
        id: 'saveCurrentNoteNameAsSession',
        labelKey: 'cmdSaveCurrentNoteNameAsSession',
        run(plugin) {
            return plugin.getFrontmatterLinker().saveCurrentNoteNameAsSession();
        },
    },
    {
        id: 'reloadWithoutSaving',
        labelKey: 'statusBarActionReloadWithoutSaving',
        run(plugin) {
            return plugin.getSessionSaver().reloadCurrentSessionWithoutSaving();
        },
    },
    {
        id: 'renameSession',
        labelKey: 'cmdRename',
        run(plugin) {
            plugin.getSessionStore().renameCurrentSession();
        },
    },
    {
        id: 'duplicateSession',
        labelKey: 'cmdDuplicate',
        run(plugin) {
            return plugin.getSessionStore().duplicateCurrentSession();
        },
    },
    {
        id: 'previousSession',
        labelKey: 'cmdPrevious',
        run(plugin) {
            return plugin.getSessionSwitcher().switchRelativeFromStatusBar(-1);
        },
    },
    {
        id: 'nextSession',
        labelKey: 'cmdNext',
        run(plugin) {
            return plugin.getSessionSwitcher().switchRelativeFromStatusBar(1);
        },
    },
    {
        id: 'newEmptySession',
        labelKey: 'cmdNewEmpty',
        run(plugin) {
            return plugin.getSessionStore().createEmptySession();
        },
    },
    {
        id: 'toggleAutoSaveOnSwitch',
        labelKey: 'cmdToggleAutoSave',
        run(plugin) {
            return plugin.getSessionSaver().toggleAutoSaveOnSwitch({ notify: true });
        },
    },
    {
        id: 'versionHistory',
        labelKey: 'statusBarActionVersionHistory',
        run(plugin) {
            const session = plugin.getSessionStore().getActiveSession();
            if (session) {
                plugin.openHistoryModal(session);
            }
        },
    },
    {
        id: 'restoreLatestHistory',
        labelKey: 'statusBarActionRestoreLatestHistory',
        run(plugin) {
            if (!plugin.getHistoryService().isVersionHistoryEnabled()) {
                new Notice(String(L.historyNoEntries || ''));
                return;
            }
            const activeSession = plugin.getSessionStore().getActiveSession();
            if (!activeSession || !activeSession.history || activeSession.history.length === 0) {
                new Notice(String(L.historyNoEntries || ''));
                return;
            }
            if (plugin.getHistoryService().isVersionHistoryConfirmRestoreEnabled()) {
                const historyEntries = activeSession.history;
                const latestSavedAt = historyEntries?.[0]?.savedAt ?? 0;
                const latestTime = new Date(latestSavedAt)
                    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const sessionName = activeSession.name ?? '';
                const message = (L.historyRestoreConfirm as (name: string, time: string) => string)(sessionName, latestTime);
                plugin.openConfirmModal?.(
                    message,
                    () => { void plugin.getHistoryService().quickRestoreLatestHistory(); },
                    { confirmText: String(L.historyRestore || 'Restore'), confirmClass: 'mod-cta' }
                );
            } else {
                void plugin.getHistoryService().quickRestoreLatestHistory();
            }
        },
    },
    {
        id: 'sessionMenu',
        labelKey: 'statusBarActionSessionMenu',
        run(plugin, event) {
            const sess = plugin.getSessionStore().getActiveSession();
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
                showMoveToGroup: plugin.getGroupStore().isGroupFeatureEnabled() && plugin.getGroupStore().getOrderedGroups().length > 0,
                showCustomizeClicks: true,
                forceDeleteConfirm: true,
                notifyDeleted: false,
                onSessionsChanged() {
                    plugin.getStatusBarController().updateStatusBar();
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
                    plugin.getStatusBarController().updateStatusBar();
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
