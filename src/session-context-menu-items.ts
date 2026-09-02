import { Menu, type App, type MenuItem } from 'obsidian';
import { L, text } from './i18n.ts';
import * as obsidianInternals from './platform/obsidian-internals.ts';
import type { SessionItem } from './storage/default-data.ts';
import type { TabId } from './settings-tab.ts';
import type { GroupStore } from './state/group-store.ts';
import type { SessionSaver } from './state/session-saver.ts';
import type { HistoryService } from './state/history-service.ts';

type Action = () => unknown;
type MoveToGroupAction = (groupId: string) => unknown;
type SessionContextMenuActionName =
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
type SessionContextMenuActions = Partial<Record<SessionContextMenuActionName, Action | MoveToGroupAction | undefined>>;

export interface SessionContextMenuPluginHost {
    /**
     * Owned by HistoryService; naming it keeps one list rather than a
     * forwarding method per call on the plugin.
     */
    getHistoryService(): HistoryService;

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

    app: App;
    data: {
        sessions: Record<string, SessionItem>;
        sessionGroups?: Record<string, string[]>;
    };
    manifest: { id: string };
    // TabId, not string - see settings-context-menu-items.ts for why.
    settingTab?: { activeTab: TabId | null } | undefined;
}

export type SessionContextMenuOptions = SessionContextMenuActions & {
    plugin?: SessionContextMenuPluginHost | undefined;
    app?: App | undefined;
    session?: SessionItem | undefined;
    isActive?: boolean | undefined;
    event?: MouseEvent | undefined;
    showSaveAs?: boolean | undefined;
    showSwitch?: boolean | undefined;
    showRemoveFromGroup?: boolean | undefined;
    showMoveToGroup?: boolean | undefined;
    showCustomizeClicks?: boolean | undefined;
};

function isAction(value: unknown): value is Action {
    return typeof value === 'function';
}

function isMoveToGroupAction(value: unknown): value is MoveToGroupAction {
    return typeof value === 'function';
}

function call(action: unknown): void {
    if (isAction(action)) action();
}

function callMoveToGroup(action: unknown, groupId: string): void {
    if (!isMoveToGroupAction(action)) return;
    action(groupId);
}

interface SubmenuMenuItem {
    setSubmenu(): Menu;
}

function hasSubmenu(item: MenuItem): item is MenuItem & SubmenuMenuItem {
    return 'setSubmenu' in item && typeof item.setSubmenu === 'function';
}

function submenuFor(item: MenuItem): Menu {
    if (!hasSubmenu(item)) {
        throw new TypeError('Menu item does not support submenus');
    }
    return item.setSubmenu();
}

function showAtMouseEvent(menu: Menu, event: MouseEvent | undefined): void {
    const show = (input: MouseEvent): unknown => menu.showAtMouseEvent(input);
    Reflect.apply(show, undefined, [event]);
}

/** Open a context menu for a session item. */
export function openSessionContextMenu(initialOptions?: SessionContextMenuOptions | null): void {
    const options = initialOptions || {};
    const plugin = options.plugin;
    const app = options.app || plugin?.app || null;
    const session = options.session;
    if (!plugin || !app || !session) return;

    const isActive = !!options.isActive;
    const manualSaveMode = !plugin.getSessionSaver().isAutoSaveOnSwitchEnabled();
    const showOverwriteWithCurrentLayout = !isActive
        && manualSaveMode
        && typeof options.onOverwriteWithCurrentLayout === 'function';
    const menu = new Menu();
    let addedSaveGroup = false;

    // --- Save group (only when active and auto-save is off) ---
    if (isActive && manualSaveMode) {
        // Save
        menu.addItem((mi) => {
            mi.setTitle(text(L.contextSaveSession));
            mi.setIcon('save');
            mi.onClick(() => {
                call(options.onSave);
            });
        });

        // Reload
        menu.addItem((mi) => {
            mi.setTitle(text(L.contextReloadSession));
            mi.setIcon('rotate-ccw');
            mi.onClick(() => {
                call(options.onReload);
            });
        });

        // Save As (status bar only)
        if (options.showSaveAs) {
            menu.addItem((mi) => {
                mi.setTitle(text(L.cmdSaveAs));
                mi.setIcon('save-all');
                mi.onClick(() => {
                    call(options.onSaveAs);
                });
            });
        }

        addedSaveGroup = true;
    }

    if (addedSaveGroup) menu.addSeparator();

    // --- Manage group ---
    // Switch (overlay / modal only, non-active sessions)
    if (options.showSwitch && !isActive) {
        menu.addItem((mi) => {
            mi.setTitle(text(L.contextSwitchSession));
            mi.setIcon('arrow-right');
            mi.onClick(() => {
                call(options.onSwitch);
            });
        });
    }

    // Rename
    menu.addItem((mi) => {
        mi.setTitle(text(L.contextRenameSession));
        mi.setIcon('pencil');
        mi.onClick(() => {
            call(options.onRename);
        });
    });

    // Duplicate
    menu.addItem((mi) => {
        mi.setTitle(text(L.contextDuplicateSession));
        mi.setIcon('copy');
        mi.onClick(() => {
            call(options.onDuplicate);
        });
    });

    // Version history
    if (plugin.getHistoryService().isVersionHistoryEnabled()) {
        menu.addItem((mi) => {
            mi.setTitle(text(L.contextVersionHistory));
            mi.setIcon('history');
            mi.onClick(() => {
                call(options.onVersionHistory);
            });
        });
    }

    // Remove from group
    if (options.showRemoveFromGroup) {
        menu.addItem((mi) => {
            mi.setTitle(text(L.groupRemoveFromGroup));
            mi.setIcon('log-out');
            mi.onClick(() => {
                call(options.onRemoveFromGroup);
            });
        });
    }

    // Move to group (submenu)
    if (options.showMoveToGroup) {
        menu.addItem((mi) => {
            mi.setTitle(text(L.groupMoveToGroup));
            mi.setIcon('folder-input');
            const submenu = submenuFor(mi);
            const groups = plugin.getGroupStore().getOrderedGroups();
            const sessionGroupIds = plugin.data.sessionGroups?.[session.id] || [];
            for (const group of groups) {
                submenu.addItem((sub) => {
                    sub.setTitle(group.name);
                    if (sessionGroupIds.includes(group.id)) sub.setChecked(true);
                    sub.onClick(() => {
                        callMoveToGroup(options.onMoveToGroup, group.id);
                    });
                });
            }
        });
    }

    if (showOverwriteWithCurrentLayout) {
        menu.addSeparator();
        menu.addItem((mi) => {
            mi.setTitle(text(L.contextSaveCurrentLayoutToThisSession));
            mi.setIcon('save');
            mi.onClick(() => {
                call(options.onOverwriteWithCurrentLayout);
            });
        });
    }

    // --- Customize click actions (status bar only) ---
    if (options.showCustomizeClicks) {
        menu.addSeparator();
        menu.addItem((mi) => {
            mi.setTitle(text(L.contextCustomizeClicks));
            mi.setIcon('mouse-pointer-click');
            mi.onClick(() => {
                if (plugin.settingTab) plugin.settingTab.activeTab = 'general';
                obsidianInternals.openSettingTab(app, plugin.manifest.id);
            });
        });
    }

    // --- Danger group ---
    if (Object.keys(plugin.data.sessions).length > 1) {
        menu.addSeparator();
        menu.addItem((mi) => {
            mi.setTitle(text(L.contextDeleteSession));
            mi.setIcon('trash-2');
            mi.onClick(() => {
                call(options.onDelete);
            });
        });
    }

    showAtMouseEvent(menu, options.event);
}
