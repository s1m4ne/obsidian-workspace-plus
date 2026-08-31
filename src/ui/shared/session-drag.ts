import { isModPressed } from '../../utils.ts';

export interface SessionDragOptions {
    itemEl: HTMLElement;
    listEl: HTMLElement;
    itemSelector?: string | undefined;
    ignoreSelector?: string | undefined;
    groupTabsContainer?: HTMLElement | null | undefined;
    bodyDraggingClass?: string | undefined;
    stopPropagationOnMouseDown?: boolean | undefined;
    onDropOnGroup?: ((sessionId: string, groupId: string) => void | Promise<void>) | undefined;
    onDropOnAllGroup?: ((sessionId: string) => void | Promise<void>) | undefined;
    onReorder?: ((newOrder: string[]) => void | Promise<void>) | undefined;
}

export function findHoveredGroupTab(
    groupTabsContainer: HTMLElement,
    clientX: number,
    clientY: number
): HTMLElement | null {
    const tabs = groupTabsContainer.querySelectorAll<HTMLElement>('.wpp-group-tab');
    for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        if (!tab) continue;
        const rect = tab.getBoundingClientRect();
        if (
            clientX >= rect.left &&
            clientX <= rect.right &&
            clientY >= rect.top &&
            clientY <= rect.bottom
        ) {
            return tab;
        }
    }
    return null;
}

export function updateGroupDropTargets(
    groupTabsContainer: HTMLElement,
    clientX: number,
    clientY: number
): HTMLElement | null {
    const hoveredTab = findHoveredGroupTab(groupTabsContainer, clientX, clientY);
    const tabs = groupTabsContainer.querySelectorAll<HTMLElement>('.wpp-group-tab');
    for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        if (!tab) continue;
        tab.classList.toggle('wpp-group-drop-target', tab === hoveredTab);
    }
    return hoveredTab;
}

export function clearGroupDropTargets(groupTabsContainer: HTMLElement): void {
    const tabs = groupTabsContainer.querySelectorAll<HTMLElement>('.wpp-group-tab');
    for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        if (!tab) continue;
        tab.classList.remove('wpp-group-drop-target');
    }
}

export function attachSessionDrag(options: SessionDragOptions): void {
    const {
        itemEl,
        listEl,
        itemSelector = '.wpp-switch-item, .wpp-session-item',
        ignoreSelector = 'button, input, select, textarea, .wpp-icon-btn, .wpp-qs-action-btn',
        groupTabsContainer = null,
        bodyDraggingClass,
        stopPropagationOnMouseDown = false,
        onDropOnGroup,
        onDropOnAllGroup,
        onReorder,
    } = options;

    itemEl.addEventListener('mousedown', (e: MouseEvent) => {
        if (e.button !== 0) return;
        if (isModPressed(e)) return;
        if (ignoreSelector && e.target instanceof Element && e.target.closest(ignoreSelector)) {
            return;
        }
        if (stopPropagationOnMouseDown) {
            e.stopPropagation();
        }

        const startX = e.clientX;
        const startY = e.clientY;
        let dragStarted = false;
        let cloneEl: HTMLElement | null = null;
        let offsetX = 0;
        let offsetY = 0;

        function startDrag(ev: MouseEvent): void {
            dragStarted = true;
            if (bodyDraggingClass) {
                document.body.classList.add(bodyDraggingClass);
            }
            const rect = itemEl.getBoundingClientRect();
            offsetX = startX - rect.left;
            offsetY = startY - rect.top;

            const clone = itemEl.cloneNode(true) as HTMLElement;
            clone.classList.add('wpp-drag-clone');
            clone.setCssProps({
                width: `${rect.width}px`,
                top: `${ev.clientY - offsetY}px`,
                left: `${ev.clientX - offsetX}px`,
            });
            document.body.appendChild(clone);
            itemEl.classList.add('is-dragging');
            cloneEl = clone;
        }

        function onMouseMove(ev: MouseEvent): void {
            if (!dragStarted) {
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;
                if (Math.abs(dx) + Math.abs(dy) < 5) return;
                startDrag(ev);
            }

            if (cloneEl) {
                cloneEl.setCssProps({
                    top: `${ev.clientY - offsetY}px`,
                    left: `${ev.clientX - offsetX}px`,
                });
            }

            // Check if hovering over a group tab
            if (groupTabsContainer) {
                const hoverTab = updateGroupDropTargets(groupTabsContainer, ev.clientX, ev.clientY);
                if (hoverTab) return; // Don't reorder while hovering group tabs
            }

            const siblings = listEl.querySelectorAll<HTMLElement>(itemSelector);
            let placed = false;
            for (let i = 0; i < siblings.length; i++) {
                const sibling = siblings[i];
                if (!sibling || sibling === itemEl) continue;
                const r = sibling.getBoundingClientRect();
                if (ev.clientY < r.top + r.height / 2) {
                    listEl.insertBefore(itemEl, sibling);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                listEl.appendChild(itemEl);
            }
        }

        function onMouseUp(ev: MouseEvent): void {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            if (bodyDraggingClass) {
                document.body.classList.remove(bodyDraggingClass);
            }

            if (!dragStarted) return;

            if (cloneEl) {
                cloneEl.remove();
            }
            itemEl.classList.remove('is-dragging');

            let droppedTab: HTMLElement | null = null;
            if (groupTabsContainer) {
                droppedTab = updateGroupDropTargets(groupTabsContainer, ev.clientX, ev.clientY);
                clearGroupDropTargets(groupTabsContainer);
            }

            const sessionId = itemEl.dataset['sessionId'];
            if (droppedTab && droppedTab.dataset['groupId'] && sessionId) {
                const groupId = droppedTab.dataset['groupId'];
                if (groupId !== '__all__' && onDropOnGroup) {
                    void onDropOnGroup(sessionId, groupId);
                    return;
                }
                if (groupId === '__all__' && onDropOnAllGroup) {
                    void onDropOnAllGroup(sessionId);
                    return;
                }
            }

            if (onReorder) {
                const items = listEl.querySelectorAll<HTMLElement>(itemSelector);
                const newOrder: string[] = [];
                for (let i = 0; i < items.length; i++) {
                    const id = items[i]?.dataset['sessionId'];
                    if (id) {
                        newOrder.push(id);
                    }
                }
                void onReorder(newOrder);
            }
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}
