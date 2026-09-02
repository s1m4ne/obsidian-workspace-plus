import { Notice, type App } from 'obsidian';
import { L } from './i18n.ts';
import { ConfirmModal, type ConfirmModalOptions } from './modals/confirm-modal.ts';
import { RenameModal, type RenameModalOptions } from './modals/rename-modal.ts';
import type { SessionItem } from './storage/default-data.ts';
import type { SessionStore } from './state/session-store.ts';

export interface SessionRenameActionsHost {
    /**
     * The session set, its ordering and the CRUD on it are owned by
     * SessionStore. Naming the store rather than restating its methods keeps
     * one list, the way getGroupStore() and getSessionSaver() do.
     */
    getSessionStore(): SessionStore;

    app: App;
    renameSessionById(sessionId: string, name: string): Promise<boolean>;
}

export interface SessionDeleteActionsHost {
    /**
     * Deleting is owned by SessionStore; naming the store keeps one list.
     */
    getSessionStore(): SessionStore;

    app: App;
    data: {
        sessions: Record<string, SessionItem>;
        confirmDeleteByHotkey: boolean;
    };
}

export interface SessionListActionsHost extends SessionRenameActionsHost, SessionDeleteActionsHost {}

export interface RenameSessionWithPromptOptions {
    app?: App | undefined;
    plugin?: SessionRenameActionsHost | undefined;
    session?: SessionItem | undefined;
    modalOptions?: RenameModalOptions | undefined;
    onRenamed?: ((session: SessionItem, newName: string) => void) | undefined;
}

export interface DeleteSessionWithPromptOptions {
    app?: App | undefined;
    plugin?: SessionDeleteActionsHost | undefined;
    session?: SessionItem | undefined;
    confirmMessage?: string | undefined;
    isActive?: boolean | undefined;
    forceConfirm?: boolean | undefined;
    notifyCannotDelete?: boolean | undefined;
    notifyDeleted?: boolean | undefined;
    confirmOptions?: ConfirmModalOptions | undefined;
    onDeleted?: ((session: SessionItem) => void) | undefined;
}

function text(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

function format(value: unknown, ...args: (string | number)[]): string {
    if (typeof value !== 'function') return '';
    return (value as (...callArgs: (string | number)[]) => string)(...args);
}

function resolveApp(options: {
    app?: App | undefined;
    plugin?: { app: App } | undefined;
}): App | null {
    if (options.app) return options.app;
    if (options.plugin?.app) return options.plugin.app;
    return null;
}

export function renameSessionWithPrompt(options: RenameSessionWithPromptOptions = {}): void {
    const app = resolveApp(options);
    const plugin = options.plugin;
    const session = options.session;
    if (!app || !plugin || !session) return;

    const modalOptions: RenameModalOptions = {
        emptyNotice: text(L.emptyName),
        ...options.modalOptions,
    };

    new RenameModal(app, session.name, (newName) => {
        void plugin.renameSessionById(session.id, newName).then((renamed) => {
            if (!renamed) return;
            options.onRenamed?.(session, newName);
        });
    }, modalOptions).open();
}

function getDeleteConfirmMessage(
    session: SessionItem,
    options: DeleteSessionWithPromptOptions
): string {
    if (options.confirmMessage) return options.confirmMessage;
    return options.isActive
        ? format(L.confirmDeleteActive, session.name)
        : format(L.confirmDelete, session.name);
}

export function deleteSessionWithPrompt(
    options: DeleteSessionWithPromptOptions = {}
): Promise<boolean> {
    const app = resolveApp(options);
    const plugin = options.plugin;
    const session = options.session;
    if (!app || !plugin || !session) return Promise.resolve(false);

    if (Object.keys(plugin.data.sessions || {}).length <= 1) {
        if (options.notifyCannotDelete !== false) {
            new Notice(text(L.cannotDeleteLast));
        }
        return Promise.resolve(false);
    }

    const doDelete = (): Promise<boolean> => {
        return plugin.getSessionStore().deleteSession(session.id).then((deleted) => {
            if (!deleted) return false;
            if (options.notifyDeleted !== false) {
                new Notice(format(L.deleted, session.name));
            }
            options.onDeleted?.(session);
            return true;
        });
    };

    const shouldConfirm = !!options.forceConfirm || plugin.data.confirmDeleteByHotkey !== false;
    if (shouldConfirm) {
        new ConfirmModal(
            app,
            getDeleteConfirmMessage(session, options),
            () => { void doDelete(); },
            options.confirmOptions || {}
        ).open();
        return Promise.resolve(true);
    }

    return doDelete();
}
