import { Menu, Notice, setIcon, setTooltip, type App } from 'obsidian';
import { L } from './i18n.ts';
import { ConfirmModal } from './modals/confirm-modal.ts';
import { RenameModal } from './modals/rename-modal.ts';
import type { SessionGroup, SessionItem } from './storage/default-data.ts';
import type { GroupStore } from './state/group-store.ts';

export interface GroupTabPluginHost {
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
        groups?: Record<string, SessionGroup> | undefined;
        groupOrder?: string[] | undefined;
        sessions?: Record<string, SessionItem> | undefined;
    };
    createGroupValidated(name: string): Promise<boolean>;
    renameGroupValidated(groupId: string, name: string): Promise<boolean>;
    deleteAllInactiveSessions(): Promise<number>;
}

export interface AttachGroupTabDragOptions {
    stopPropagationOnMouseDown?: boolean | undefined;
    onCommit?: ((newOrder: string[]) => void) | undefined;
}

export interface RenderGroupTabsOptions {
    plugin: GroupTabPluginHost;
    containerEl: HTMLElement;
    app?: App | undefined;
    groups?: Record<string, SessionGroup> | undefined;
    groupOrder?: string[] | undefined;
    selectedGroupId?: string | null | undefined;
    stopPropagationOnMouseDown?: boolean | undefined;
    addButtonTooltip?: string | undefined;
    addButtonTooltipPlacement?: ('top' | 'bottom' | 'left' | 'right') | undefined;
    addButtonTooltipDelay?: number | undefined;
    onSelectGroup?: ((groupId: string | null) => void) | undefined;
    onGroupOrderCommit?: ((newOrder: string[]) => void) | undefined;
    onAddGroupClick?: (() => void) | undefined;
    onGroupsChanged?: (() => void) | undefined;
    onSessionsChanged?: (() => void) | undefined;
    onDeleteGroup?: ((groupId: string) => void) | undefined;
    onResetViewGroup?: (() => void) | undefined;
}

export interface AllGroupsContextMenuOptions {
    plugin: GroupTabPluginHost;
    app?: App | undefined;
    event?: MouseEvent | undefined;
    onResetViewGroup?: (() => void) | undefined;
    onGroupsChanged?: (() => void) | undefined;
    onSessionsChanged?: (() => void) | undefined;
}

export interface GroupContextMenuOptions {
    plugin: GroupTabPluginHost;
    group: SessionGroup;
    app?: App | undefined;
    event?: MouseEvent | undefined;
    onDeleteGroup?: ((groupId: string) => void) | undefined;
    onGroupsChanged?: (() => void) | undefined;
    onSessionsChanged?: (() => void) | undefined;
}

export function openCreateGroupPrompt(
    app: App,
    plugin: GroupTabPluginHost,
    onCreated?: () => void
): void {
    new RenameModal(
        app,
        '',
        (name) => {
            void plugin.createGroupValidated(name).then((created) => {
                if (!created) return;
                if (typeof onCreated === 'function') onCreated();
            });
        },
        {
            title: String(L.groupCreateNew || ''),
            placeholder: String(L.groupCreatePlaceholder || ''),
            buttonText: String(L.save || ''),
            emptyNotice: String(L.groupEmptyName || ''),
        }
    ).open();
}

export function openRenameGroupPrompt(
    app: App,
    plugin: GroupTabPluginHost,
    group: SessionGroup,
    onRenamed?: () => void
): void {
    new RenameModal(
        app,
        group.name,
        (newName) => {
            void plugin.renameGroupValidated(group.id, newName).then((renamed) => {
                if (!renamed) return;
                if (typeof onRenamed === 'function') onRenamed();
            });
        },
        {
            title: String(L.groupContextRename || ''),
            emptyNotice: String(L.groupEmptyName || ''),
        }
    ).open();
}

export function attachGroupTabDrag(
    tabEl: HTMLElement,
    tabsContainerEl: HTMLElement,
    options?: AttachGroupTabDragOptions
): void {
    const opts = options || {};
    tabEl.addEventListener('mousedown', (e: MouseEvent) => {
        if (e.button !== 0) return;
        if (opts.stopPropagationOnMouseDown) {
            e.stopPropagation();
        }

        const startX = e.clientX;
        let dragStarted = false;
        let cloneEl: (HTMLElement & { _offsetX?: number }) | null = null;

        function startDrag(ev: MouseEvent): void {
            dragStarted = true;
            const rect = tabEl.getBoundingClientRect();
            const clone = tabEl.cloneNode(true) as HTMLElement & { _offsetX?: number };
            clone.classList.add('wpp-drag-clone');
            clone.setCssProps({
                width: `${rect.width}px`,
                height: `${rect.height}px`,
                top: `${rect.top}px`,
                left: `${ev.clientX - (startX - rect.left)}px`,
            });
            document.body.appendChild(clone);
            tabEl.classList.add('is-dragging');
            clone._offsetX = startX - rect.left;
            cloneEl = clone;
        }

        function onMove(ev: MouseEvent): void {
            if (!dragStarted) {
                if (Math.abs(ev.clientX - startX) < 5) return;
                startDrag(ev);
            }
            if (!cloneEl) return;
            cloneEl.setCssProps({
                left: `${ev.clientX - (cloneEl._offsetX || 0)}px`,
            });

            const tabs = tabsContainerEl.querySelectorAll<HTMLElement>('.wpp-group-tab');
            let placed = false;
            for (let ti = 0; ti < tabs.length; ti++) {
                const sibling = tabs[ti]!;
                if (sibling === tabEl) continue;
                const r = sibling.getBoundingClientRect();
                if (ev.clientX < r.left + r.width / 2) {
                    tabsContainerEl.insertBefore(tabEl, sibling);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                const addBtnEl = tabsContainerEl.querySelector('.wpp-group-add-btn');
                if (addBtnEl) {
                    tabsContainerEl.insertBefore(tabEl, addBtnEl);
                } else {
                    tabsContainerEl.appendChild(tabEl);
                }
            }
        }

        function onUp(): void {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            if (!dragStarted || !cloneEl) return;
            cloneEl.remove();
            tabEl.classList.remove('is-dragging');

            const tabs = tabsContainerEl.querySelectorAll<HTMLElement>('.wpp-group-tab');
            const newOrder: string[] = [];
            for (const tab of tabs) {
                const gid = tab.dataset['groupId'];
                if (gid) {
                    newOrder.push(gid);
                }
            }
            if (typeof opts.onCommit === 'function') {
                opts.onCommit(newOrder);
            }
        }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    });
}

export function renderGroupTabs(options: RenderGroupTabsOptions): void {
    const opts = options || {};
    const plugin = opts.plugin;
    const containerEl = opts.containerEl;
    if (!plugin || !containerEl) return;

    while (containerEl.firstChild) containerEl.removeChild(containerEl.firstChild);

    const app = opts.app || plugin.app;
    const groups = opts.groups || plugin.data.groups || {};
    const groupOrder = opts.groupOrder || plugin.getGroupStore().getOrderedGroupTabIds();
    const selectedGroupId = opts.selectedGroupId || null;

    function setupGroupTabDrag(tabEl: HTMLElement): void {
        if (!opts.onGroupOrderCommit) return;
        attachGroupTabDrag(tabEl, containerEl, {
            stopPropagationOnMouseDown: !!opts.stopPropagationOnMouseDown,
            onCommit: (newOrder) => {
                if (opts.onGroupOrderCommit) {
                    opts.onGroupOrderCommit(newOrder);
                }
            },
        });
    }

    for (let gi = 0; gi < groupOrder.length; gi++) {
        const gid = groupOrder[gi]!;

        if (gid === '__all__') {
            const allTab = containerEl.createDiv({ cls: 'wpp-group-tab' });
            allTab.dataset['groupId'] = '__all__';
            if (!selectedGroupId) allTab.classList.add('is-active');
            allTab.textContent = String(L.groupAll || 'All');
            allTab.addEventListener('click', () => {
                if (typeof opts.onSelectGroup === 'function') {
                    opts.onSelectGroup(null);
                }
            });
            allTab.addEventListener('contextmenu', (e: MouseEvent) => {
                e.preventDefault();
                openAllGroupsTabContextMenu({
                    app,
                    plugin,
                    event: e,
                    onResetViewGroup: opts.onResetViewGroup,
                    onGroupsChanged: opts.onGroupsChanged,
                    onSessionsChanged: opts.onSessionsChanged,
                });
            });
            setupGroupTabDrag(allTab);
            continue;
        }

        const group = groups[gid];
        if (!group) continue;

        const currentGroup = group;
        const tab = containerEl.createDiv({ cls: 'wpp-group-tab' });
        tab.dataset['groupId'] = currentGroup.id;
        if (selectedGroupId === currentGroup.id) tab.classList.add('is-active');
        tab.textContent = currentGroup.name;
        tab.addEventListener('click', () => {
            if (typeof opts.onSelectGroup === 'function') {
                opts.onSelectGroup(currentGroup.id);
            }
        });
        tab.addEventListener('contextmenu', (e: MouseEvent) => {
            e.preventDefault();
            openGroupTabContextMenu({
                app,
                plugin,
                event: e,
                group: currentGroup,
                onDeleteGroup: opts.onDeleteGroup,
                onGroupsChanged: opts.onGroupsChanged,
                onSessionsChanged: opts.onSessionsChanged,
            });
        });
        setupGroupTabDrag(tab);
    }

    const addBtn = containerEl.createDiv({ cls: 'wpp-group-add-btn' });
    setIcon(addBtn, 'plus');
    if (opts.addButtonTooltip) {
        setTooltip(addBtn, opts.addButtonTooltip);
    }
    addBtn.addEventListener('click', () => {
        if (typeof opts.onAddGroupClick === 'function') {
            opts.onAddGroupClick();
            return;
        }
        openCreateGroupPrompt(app, plugin, opts.onGroupsChanged);
    });
}

export function openAllGroupsTabContextMenu(options: AllGroupsContextMenuOptions): void {
    const opts = options || {};
    const plugin = opts.plugin;
    const app = opts.app || (plugin ? plugin.app : null);
    if (!plugin || !app) return;

    const menu = new Menu();
    menu.addItem((mi) => {
        mi.setTitle(String(L.groupCreateNew || ''));
        mi.setIcon('plus');
        mi.onClick(() => {
            openCreateGroupPrompt(app, plugin, opts.onGroupsChanged);
        });
    });

    const allGroups = plugin.getGroupStore().getOrderedGroups();
    if (allGroups.length > 0) {
        menu.addSeparator();
        menu.addItem((mi) => {
            mi.setTitle(String(L.contextDeleteAllGroups || ''));
            mi.setIcon('folder-x');
            mi.setSection('danger');
            mi.onClick(() => {
                new ConfirmModal(
                    app,
                    (L.confirmDeleteAllGroups as (n: number) => string)(allGroups.length),
                    () => {
                        void plugin.getGroupStore().clearAllGroups().then(() => {
                            if (typeof opts.onResetViewGroup === 'function') {
                                opts.onResetViewGroup();
                            }
                            new Notice((L.deletedAllGroups as (n: number) => string)(allGroups.length));
                            if (typeof opts.onGroupsChanged === 'function') {
                                opts.onGroupsChanged();
                            }
                            if (typeof opts.onSessionsChanged === 'function') {
                                opts.onSessionsChanged();
                            }
                        });
                    }
                ).open();
            });
        });
    }

    const sessionCount = Object.keys(plugin.data.sessions || {}).length;
    if (sessionCount > 1) {
        if (allGroups.length === 0) menu.addSeparator();
        menu.addItem((mi) => {
            mi.setTitle(String(L.contextDeleteAllSessions || ''));
            mi.setIcon('trash-2');
            mi.setSection('danger');
            mi.onClick(() => {
                new ConfirmModal(
                    app,
                    (L.confirmDeleteAllSessions as (n: number) => string)(sessionCount - 1),
                    () => {
                        void plugin.deleteAllInactiveSessions().then((deletedCount) => {
                            if (typeof opts.onGroupsChanged === 'function') {
                                opts.onGroupsChanged();
                            }
                            if (typeof opts.onSessionsChanged === 'function') {
                                opts.onSessionsChanged();
                            }
                            if (deletedCount > 0) {
                                new Notice((L.deletedAllSessions as (n: number) => string)(deletedCount));
                            }
                        });
                    }
                ).open();
            });
        });
    }

    if (opts.event) {
        menu.showAtMouseEvent(opts.event);
    }
}

export function openGroupTabContextMenu(options: GroupContextMenuOptions): void {
    const opts = options || {};
    const plugin = opts.plugin;
    const app = opts.app || (plugin ? plugin.app : null);
    const group = opts.group;
    if (!plugin || !app || !group) return;

    const menu = new Menu();
    menu.addItem((mi) => {
        mi.setTitle(String(L.groupContextRename || ''));
        mi.setIcon('pencil');
        mi.onClick(() => {
            openRenameGroupPrompt(app, plugin, group, opts.onGroupsChanged);
        });
    });

    const groupSessionIds = plugin.getGroupStore().getGroupSessionIds(group.id);
    if (groupSessionIds.length > 0) {
        menu.addItem((mi) => {
            mi.setTitle(String(L.groupRemoveAllSessions || ''));
            mi.setIcon('log-out');
            mi.onClick(() => {
                new ConfirmModal(
                    app,
                    (L.confirmRemoveAllFromGroup as (g: string, n: number) => string)(group.name, groupSessionIds.length),
                    () => {
                        void plugin.getGroupStore().removeAllSessionsFromGroup(group.id).then(() => {
                            new Notice((L.groupRemovedAllSessions as (g: string) => string)(group.name));
                            if (typeof opts.onGroupsChanged === 'function') {
                                opts.onGroupsChanged();
                            }
                            if (typeof opts.onSessionsChanged === 'function') {
                                opts.onSessionsChanged();
                            }
                        });
                    },
                    {
                        confirmText: String(L.remove || ''),
                        confirmClass: 'mod-cta',
                    }
                ).open();
            });
        });
    }

    menu.addSeparator();
    menu.addItem((mi) => {
        mi.setTitle(String(L.groupContextDelete || ''));
        mi.setIcon('trash-2');
        mi.setSection('danger');
        mi.onClick(() => {
            new ConfirmModal(
                app,
                (L.confirmDeleteGroup as (g: string) => string)(group.name),
                () => {
                    void plugin.getGroupStore().deleteGroup(group.id).then(() => {
                        if (typeof opts.onDeleteGroup === 'function') {
                            opts.onDeleteGroup(group.id);
                        }
                        if (typeof opts.onGroupsChanged === 'function') {
                            opts.onGroupsChanged();
                        }
                        if (typeof opts.onSessionsChanged === 'function') {
                            opts.onSessionsChanged();
                        }
                    });
                }
            ).open();
        });
    });

    if (opts.event) {
        menu.showAtMouseEvent(opts.event);
    }
}
