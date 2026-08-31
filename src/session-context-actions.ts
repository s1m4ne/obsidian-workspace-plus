import { Notice, type App } from 'obsidian';
import { L } from './i18n.ts';
import { HistoryModal, type HistoryModalPluginHost } from './modals/history-modal.ts';
import * as sessionContextMenu from './session-context-menu.js';
import {
    deleteSessionWithPrompt,
    renameSessionWithPrompt,
    type DeleteSessionWithPromptOptions,
    type SessionListActionsHost,
} from './session-list-actions.ts';
import type { SessionGroup, SessionItem } from './storage/default-data.ts';

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

export interface SessionContextActionsHost extends SessionListActionsHost, HistoryModalPluginHost {
    data: SessionListActionsHost['data'] & {
        activeSessionId: string | null;
        groups: Record<string, SessionGroup>;
    };
    isGroupFeatureEnabled(): boolean;
    getOrderedGroups(): readonly SessionGroup[];
    saveActiveSession(): Promise<unknown>;
    reloadCurrentSessionWithoutSaving(): unknown;
    saveAsSession(): Promise<unknown>;
    confirmOverwriteSessionWithCurrentLayout(
        sessionId: string,
        options: { onSaved: () => void }
    ): unknown;
    duplicateSession(sessionId: string): Promise<unknown>;
    removeSessionFromGroup(sessionId: string, groupId: string): Promise<unknown>;
    moveSessionToGroupExclusive(sessionId: string, groupId: string): Promise<unknown>;
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

function format(value: unknown, ...args: (string | number)[]): string {
    if (typeof value !== 'function') return '';
    return (value as (...callArgs: (string | number)[]) => string)(...args);
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
    const groups = plugin.data.groups || {};
    return groups[groupId]?.name || '';
}

function shouldShowMoveToGroup(plugin: SessionContextActionsHost): boolean {
    return !!(
        plugin
        && plugin.isGroupFeatureEnabled
        && plugin.isGroupFeatureEnabled()
        && plugin.getOrderedGroups
        && plugin.getOrderedGroups().length > 0
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
        : session.id === plugin.data.activeSessionId;
    const getViewGroupId = typeof options.getViewGroupId === 'function'
        ? options.getViewGroupId
        : () => null;

    const defaultSave = (): unknown => callAfter(plugin.saveActiveSession(), () => {
        refreshSessions(options);
    });

    const defaultReload = (): unknown => plugin.reloadCurrentSessionWithoutSaving();

    const defaultSaveAs = (): unknown => callAfter(plugin.saveAsSession(), () => {
        refreshSessions(options);
    });

    const defaultOverwriteWithCurrentLayout = (): unknown => plugin.confirmOverwriteSessionWithCurrentLayout(session.id, {
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

    const defaultDuplicate = (): unknown => callAfter(plugin.duplicateSession(session.id), () => {
        refreshSessions(options);
    });

    const defaultRemoveFromGroup = (): Promise<void> | undefined => {
        const groupId = getViewGroupId();
        if (!groupId) return;
        const groupName = getGroupName(plugin, groupId);
        return plugin.removeSessionFromGroup(session.id, groupId).then(() => {
            new Notice(format(L.groupRemovedSession, session.name, groupName));
            refreshGroupsAndSessions(options);
        });
    };

    const defaultMoveToGroup = (groupId: string): Promise<boolean> => {
        const groupName = getGroupName(plugin, groupId);
        return plugin.moveSessionToGroupExclusive(session.id, groupId).then((moved) => {
            if (!moved) return false;
            new Notice(format(L.groupAddedSession, session.name, groupName));
            refreshGroupsAndSessions(options);
            return true;
        });
    };

    const defaultDelete = (): Promise<boolean> => {
        const confirmMessage = hasOwn(options, 'deleteConfirmMessage')
            ? options.deleteConfirmMessage
            : (isActive
                ? format(L.confirmDeleteActive, session.name)
                : format(L.confirmDelete, session.name));
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
