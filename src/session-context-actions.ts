import { Notice, type App } from 'obsidian';
import { L, formatString } from './i18n.ts';
import { HistoryModal, type HistoryModalPluginHost } from './modals/history-modal.ts';
import * as sessionContextMenu from './session-context-menu-items.ts';
import type { SessionContextMenuPluginHost } from './session-context-menu-items.ts';
import {
    deleteSessionWithPrompt,
    renameSessionWithPrompt,
    type DeleteSessionWithPromptOptions,
    type SessionListActionsHost,
} from './session-list-actions.ts';
import type { SessionGroup, SessionItem } from './storage/default-data.ts';
import type { GroupStore } from './state/group-store.ts';
import type { SessionSaver } from './state/session-saver.ts';
import type { SessionStore } from './state/session-store.ts';

type Action = () => unknown;
type GroupIdGetter = () => string | null;
type MoveToGroupAction = (groupId: string) => unknown;
type ContextActionName =
    | 'onSave'
    | 'onReload'
    | 'onSaveAs'
    | 'onOverwriteWithCurrentLayout'
    | 'onSwitch'
    | 'onRename'
    | 'onDuplicate'
    | 'onDelete'
    | 'onRemoveFromGroup'
    | 'onMoveToGroup'
    | 'onVersionHistory';
type ContextActionOverrides = Partial<Record<ContextActionName, Action | MoveToGroupAction>>;

export interface SessionContextActionsHost extends SessionListActionsHost, HistoryModalPluginHost, SessionContextMenuPluginHost {
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

    data: SessionListActionsHost['data'] & {
        activeSessionId: string | null;
        groups: Record<string, SessionGroup>;
    };
}

export type SessionContextMenuOptions = ContextActionOverrides & {
    plugin?: SessionContextActionsHost | undefined;
    app?: App | undefined;
    session?: SessionItem | undefined;
    isActive?: boolean | undefined;
    event?: MouseEvent | undefined;
    showSaveAs?: boolean | undefined;
    showSwitch?: boolean | undefined;
    showRemoveFromGroup?: boolean | undefined;
    showMoveToGroup?: boolean | undefined;
    showCustomizeClicks?: boolean | undefined;
    forceDeleteConfirm?: boolean | undefined;
    notifyDeleted?: boolean | undefined;
    deleteConfirmMessage?: string | undefined;
    deleteConfirmOptions?: DeleteSessionWithPromptOptions['confirmOptions'];
    getViewGroupId?: GroupIdGetter | undefined;
    onGroupsChanged?: (() => void) | undefined;
    onSessionsChanged?: (() => void) | undefined;
};

export interface OpenSessionContextMenuOptions extends SessionContextMenuOptions {
    event: MouseEvent;
}

function hasOwn(options: object, key: string): boolean {
    return Object.prototype.hasOwnProperty.call(options, key);
}

function optionOrDefault(
    options: SessionContextMenuOptions,
    key: 'showRemoveFromGroup' | 'showMoveToGroup',
    fallback: boolean
): boolean {
    return hasOwn(options, key) ? !!options[key] : fallback;
}

function call(fn: Action | undefined): void {
    if (typeof fn === 'function') fn();
}

function isThenable(value: unknown): value is { then(callback: (result: unknown) => unknown): unknown } {
    if ((typeof value !== 'object' && typeof value !== 'function') || value === null) return false;
    return typeof Reflect.get(value, 'then') === 'function';
}

function callAfter(value: unknown, fn: Action | undefined): unknown {
    if (!isThenable(value)) {
        call(fn);
        return value;
    }
    return value.then((result) => {
        call(fn);
        return result;
    });
}

function getGroupName(plugin: SessionContextActionsHost, groupId: string): string {
    const groups = plugin.getGroupStore().getGroupMap();
    return groups[groupId]?.name || '';
}

function shouldShowMoveToGroup(plugin: SessionContextActionsHost): boolean {
    // The two existence checks are gone with the shims they guarded: the host
    // names the store, so a missing member is a type error rather than a menu
    // item that quietly never appears.
    return !!(
        plugin
        && plugin.getGroupStore().isGroupFeatureEnabled()
        && plugin.getGroupStore().getOrderedGroups().length > 0
    );
}

function refreshSessions(options: SessionContextMenuOptions): void {
    call(options.onSessionsChanged);
}

function refreshGroups(options: SessionContextMenuOptions): void {
    call(options.onGroupsChanged);
}

function refreshGroupsAndSessions(options: SessionContextMenuOptions): void {
    refreshGroups(options);
    refreshSessions(options);
}

export function createSessionContextMenuOptions(options: SessionContextMenuOptions = {}) {
    const plugin = options.plugin;
    const app = options.app || plugin?.app || null;
    const session = options.session;
    if (!plugin || !app || !session) return null;

    const isActive = hasOwn(options, 'isActive')
        ? !!options.isActive
        : session.id === plugin.getSessionStore().getActiveSessionId();
    const getViewGroupId = typeof options.getViewGroupId === 'function'
        ? options.getViewGroupId
        : () => null;

    const defaultSave = (): unknown => callAfter(plugin.getSessionSaver().saveActiveSession(), () => {
        refreshSessions(options);
    });

    const defaultReload = (): unknown => plugin.getSessionSaver().reloadCurrentSessionWithoutSaving();

    const defaultSaveAs = (): unknown => callAfter(plugin.getSessionSaver().saveAsSession(), () => {
        refreshSessions(options);
    });

    const defaultOverwriteWithCurrentLayout = (): unknown => plugin.getSessionSaver().confirmOverwriteSessionWithCurrentLayout(session.id, {
        onSaved: () => {
            refreshSessions(options);
        },
    });

    const defaultRename = (): void => {
        renameSessionWithPrompt({
            app,
            plugin,
            session,
            onRenamed: () => {
                refreshSessions(options);
            },
        });
    };

    const defaultDuplicate = (): unknown => callAfter(plugin.getSessionStore().duplicateSession(session.id), () => {
        refreshSessions(options);
    });

    const defaultRemoveFromGroup = (): Promise<void> | undefined => {
        const groupId = getViewGroupId();
        if (!groupId) return;
        const groupName = getGroupName(plugin, groupId);
        return plugin.getGroupStore().removeSessionFromGroup(session.id, groupId).then(() => {
            new Notice(formatString(L.groupRemovedSession, session.name, groupName));
            refreshGroupsAndSessions(options);
        });
    };

    const defaultMoveToGroup = (groupId: string): Promise<boolean> => {
        const groupName = getGroupName(plugin, groupId);
        return plugin.getGroupStore().moveSessionToGroupExclusive(session.id, groupId).then((moved) => {
            if (!moved) return false;
            new Notice(formatString(L.groupAddedSession, session.name, groupName));
            refreshGroupsAndSessions(options);
            return true;
        });
    };

    const defaultDelete = (): Promise<boolean> => {
        const confirmMessage = hasOwn(options, 'deleteConfirmMessage')
            ? options.deleteConfirmMessage
            : (isActive
                ? formatString(L.confirmDeleteActive, session.name)
                : formatString(L.confirmDelete, session.name));
        return deleteSessionWithPrompt({
            app,
            plugin,
            session,
            isActive,
            confirmMessage,
            forceConfirm: !!options.forceDeleteConfirm,
            notifyDeleted: options.notifyDeleted,
            confirmOptions: options.deleteConfirmOptions,
            onDeleted: () => {
                refreshSessions(options);
            },
        });
    };

    const defaultVersionHistory = (): void => {
        new HistoryModal(app, plugin, session).open();
    };

    return {
        plugin,
        app,
        session,
        isActive,
        event: options.event,
        showSaveAs: !!options.showSaveAs,
        showSwitch: !!options.showSwitch,
        showRemoveFromGroup: optionOrDefault(options, 'showRemoveFromGroup', !!getViewGroupId()),
        showMoveToGroup: optionOrDefault(options, 'showMoveToGroup', shouldShowMoveToGroup(plugin)),
        showCustomizeClicks: !!options.showCustomizeClicks,
        onSave: options.onSave || defaultSave,
        onReload: options.onReload || defaultReload,
        onSaveAs: options.onSaveAs || defaultSaveAs,
        onOverwriteWithCurrentLayout: options.onOverwriteWithCurrentLayout || defaultOverwriteWithCurrentLayout,
        onSwitch: options.onSwitch,
        onRename: options.onRename || defaultRename,
        onDuplicate: options.onDuplicate || defaultDuplicate,
        onDelete: options.onDelete || defaultDelete,
        onRemoveFromGroup: options.onRemoveFromGroup || defaultRemoveFromGroup,
        onMoveToGroup: options.onMoveToGroup || defaultMoveToGroup,
        onVersionHistory: options.onVersionHistory || defaultVersionHistory,
    };
}

export function openSessionContextMenu(options: OpenSessionContextMenuOptions): void {
    const menuOptions = createSessionContextMenuOptions(options);
    if (!menuOptions) return;
    sessionContextMenu.openSessionContextMenu({ ...menuOptions, event: options.event });
}
