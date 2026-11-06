import type { App, Hotkey } from 'obsidian';

export interface ObsidianHotkeyManager {
    getHotkeys?(commandId: string): Hotkey[] | null | undefined;
    getDefaultHotkeys?(commandId: string): Hotkey[] | null | undefined;
}

export interface ObsidianSearchComponent {
    setValue(value: string): this;
    onChanged?(): void;
    inputEl?: HTMLInputElement;
}

export interface ObsidianSettingTabInstance {
    id?: string;
    searchComponent?: ObsidianSearchComponent;
}

export interface ObsidianSetting {
    open(): void;
    openTabById(id: string): ObsidianSettingTabInstance | undefined;
    activeTab?: ObsidianSettingTabInstance;
}

export interface AppWithInternals extends App {
    hotkeyManager?: ObsidianHotkeyManager;
    setting?: ObsidianSetting;
}

export function getHotkeyManager(app: App): ObsidianHotkeyManager | null {
    const internals = app as AppWithInternals;
    return internals.hotkeyManager ?? null;
}

export function getSetting(app: App): ObsidianSetting | null {
    const internals = app as AppWithInternals;
    return internals.setting ?? null;
}

export function openSettingTab(app: App, tabId: string): ObsidianSettingTabInstance | undefined {
    const setting = getSetting(app);
    if (!setting) return undefined;
    try {
        setting.open();
        return setting.openTabById(tabId);
    } catch {
        return undefined;
    }
}

export function openHotkeysSetting(app: App, searchQuery?: string): void {
    const setting = getSetting(app);
    if (!setting) return;
    try {
        setting.open();
        setting.openTabById('hotkeys');
        if (searchQuery && setting.activeTab?.searchComponent) {
            const sc = setting.activeTab.searchComponent;
            sc.setValue(searchQuery);
            if (typeof sc.onChanged === 'function') {
                sc.onChanged();
            }
            if (sc.inputEl) {
                sc.inputEl.dispatchEvent(new Event('input'));
            }
        }
    } catch {
        // Safe fall-through if internal structure changes
    }
}

export function getCommandHotkeys(app: App, fullCommandId: string): Hotkey[] | null {
    try {
        const mgr = getHotkeyManager(app);
        if (!mgr) return null;
        const custom = typeof mgr.getHotkeys === 'function' ? mgr.getHotkeys(fullCommandId) : null;
        if (custom && custom.length > 0) {
            return custom;
        }
        const defaults = typeof mgr.getDefaultHotkeys === 'function' ? mgr.getDefaultHotkeys(fullCommandId) : null;
        if (defaults && defaults.length > 0) {
            return defaults;
        }
        return null;
    } catch {
        return null;
    }
}


export interface ElectronWindowLike {
    setBounds(bounds: { x: number; y: number; width: number; height: number }): void;
    getBounds?(): { x: number; y: number; width: number; height: number };
    getNormalBounds?(): { x: number; y: number; width: number; height: number };
    isMaximized?(): boolean;
    maximize?(): void;
    unmaximize?(): void;
    isDestroyed?(): boolean;
    getTitle?(): string;
}

export interface DisplayLike {
    id: number | string;
    workArea: { x: number; y: number; width: number; height: number };
}

export interface ScreenLike {
    getDisplayMatching?(rect: { x: number; y: number; width: number; height: number }): DisplayLike;
}

export interface ElectronRemoteLike {
    getCurrentWindow?(): ElectronWindowLike;
    BrowserWindow?: {
        getAllWindows(): ElectronWindowLike[];
    };
    screen?: ScreenLike;
}

export interface ElectronModuleLike {
    remote?: ElectronRemoteLike;
    screen?: ScreenLike;
}

export interface WindowWithElectron extends Window {
    electronWindow?: ElectronWindowLike;
    require?(module: string): unknown;
}

export function getElectronWindow(win: unknown): ElectronWindowLike | null {
    if (!win || typeof win !== 'object') return null;
    const domWin = win as WindowWithElectron;
    if (domWin.electronWindow && typeof domWin.electronWindow.setBounds === 'function') {
        return domWin.electronWindow;
    }

    try {
        if (typeof domWin.require === 'function') {
            const electron = domWin.require('electron') as ElectronModuleLike | undefined;
            if (electron?.remote?.getCurrentWindow) {
                const bw = electron.remote.getCurrentWindow();
                if (bw) {
                    domWin.electronWindow = bw;
                    return bw;
                }
            }
            const remote = domWin.require('@electron/remote') as ElectronRemoteLike | undefined;
            if (remote?.getCurrentWindow) {
                const bw = remote.getCurrentWindow();
                if (bw) {
                    domWin.electronWindow = bw;
                    return bw;
                }
            }
        }
    } catch {
        // Safe fall-through if electron require is unavailable
    }

    try {
        const topWin = typeof window !== 'undefined' ? (window as WindowWithElectron) : domWin;
        if (typeof topWin.require === 'function') {
            const electron = topWin.require('electron') as ElectronModuleLike | undefined;
            const remote = electron?.remote || (topWin.require('@electron/remote') as ElectronRemoteLike | undefined);
            if (remote?.BrowserWindow) {
                const all = remote.BrowserWindow.getAllWindows();
                if (Array.isArray(all)) {
                    for (let i = 0; i < all.length; i++) {
                        const bw = all[i];
                        if (bw && (!bw.isDestroyed || !bw.isDestroyed())) {
                            try {
                                if (domWin.document && bw.getTitle && bw.getTitle() === domWin.document.title) {
                                    domWin.electronWindow = bw;
                                    return bw;
                                }
                            } catch {
                                // Ignore title read error
                            }
                        }
                    }
                }
            }
        }
    } catch {
        // Safe fall-through
    }
    return null;
}

export interface LayoutLeafState {
    title?: string;
    state?: {
        file?: string;
    };
}

export interface LayoutNodeLike {
    id?: string;
    type?: string;
    state?: LayoutLeafState;
    children?: LayoutNodeLike[];
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    maximize?: boolean;
}

export interface WorkspaceLeafLike {
    view?: {
        file?: {
            path?: string;
        };
    };
    children?: WorkspaceLeafLike[];
}

export interface WorkspaceWindowLike {
    id?: string;
    win?: WindowWithElectron;
    doc?: Document;
    containerEl?: HTMLElement;
    children?: WorkspaceLeafLike[];
}

export interface FloatingLayoutContainer {
    floating?: {
        children?: LayoutNodeLike[];
    };
}

export interface WorkspaceWithFloating {
    getLayout(): unknown;
    floatingSplit?: {
        children?: WorkspaceWindowLike[];
    };
}

export function findBestMatchingWindow(
    savedChild: LayoutNodeLike,
    candidateWindows: WorkspaceWindowLike[],
    usedWindows: Set<WorkspaceWindowLike>
): WorkspaceWindowLike | null {
    if (savedChild.id) {
        const matchById = candidateWindows.find((w) => w && w.id === savedChild.id && !usedWindows.has(w));
        if (matchById) return matchById;
    }

    const savedTitles: string[] = [];
    const savedFiles: string[] = [];
    const extractLeaves = (node?: LayoutNodeLike): void => {
        if (!node) return;
        if (node.type === 'leaf' && node.state) {
            if (node.state.title) savedTitles.push(String(node.state.title).toLowerCase());
            if (node.state.state?.file) savedFiles.push(String(node.state.state.file).toLowerCase());
        }
        if (Array.isArray(node.children)) {
            for (let i = 0; i < node.children.length; i++) {
                extractLeaves(node.children[i]);
            }
        }
    };
    extractLeaves(savedChild);

    let bestWin: WorkspaceWindowLike | null = null;
    let bestScore = 0;

    for (let i = 0; i < candidateWindows.length; i++) {
        const wsWin = candidateWindows[i];
        if (!wsWin || usedWindows.has(wsWin)) continue;
        let score = 0;
        const win = (wsWin.win || wsWin.doc?.defaultView || wsWin.containerEl?.ownerDocument?.defaultView) as WindowWithElectron | undefined;
        const docTitle = (win?.document?.title || '').toLowerCase();

        for (let j = 0; j < savedTitles.length; j++) {
            const t = savedTitles[j];
            if (t && docTitle.includes(t)) {
                score += 10;
            }
        }

        if (Array.isArray(wsWin.children)) {
            const checkLiveLeaves = (leaf?: WorkspaceLeafLike): void => {
                if (!leaf) return;
                const filePath = leaf.view?.file?.path;
                if (typeof filePath === 'string') {
                    const lowerPath = filePath.toLowerCase();
                    for (let f = 0; f < savedFiles.length; f++) {
                        if (savedFiles[f] === lowerPath) score += 20;
                    }
                }
                if (Array.isArray(leaf.children)) {
                    for (let c = 0; c < leaf.children.length; c++) {
                        checkLiveLeaves(leaf.children[c]);
                    }
                }
            };
            for (let k = 0; k < wsWin.children.length; k++) {
                checkLiveLeaves(wsWin.children[k]);
            }
        }

        if (score > bestScore) {
            bestScore = score;
            bestWin = wsWin;
        }
    }

    if (bestWin && bestScore > 0) {
        return bestWin;
    }

    const fallback = candidateWindows.find((w) => w && !usedWindows.has(w));
    return fallback || null;
}

export function captureEnrichedWorkspaceLayout(app: App): unknown {
    const workspace = app.workspace as unknown as WorkspaceWithFloating;
    const rawLayout = workspace.getLayout();
    if (!rawLayout || typeof rawLayout !== 'object') {
        return rawLayout;
    }
    const layout = rawLayout as FloatingLayoutContainer;
    if (!layout.floating || !Array.isArray(layout.floating.children)) {
        return layout;
    }
    const floatingSplitChildren = workspace.floatingSplit?.children;
    if (!Array.isArray(floatingSplitChildren) || floatingSplitChildren.length === 0) {
        return layout;
    }

    const usedWindows = new Set<WorkspaceWindowLike>();

    for (let i = 0; i < layout.floating.children.length; i++) {
        const childNode = layout.floating.children[i];
        if (!childNode || typeof childNode !== 'object') continue;
        const wsWin = findBestMatchingWindow(childNode, floatingSplitChildren, usedWindows);
        if (!wsWin) continue;
        usedWindows.add(wsWin);

        const win = (wsWin.win || wsWin.doc?.defaultView || wsWin.containerEl?.ownerDocument?.defaultView) as WindowWithElectron | undefined;
        const electronWin = getElectronWindow(win);

        let normalBounds: { x: number; y: number; width: number; height: number } | null = null;
        let isMaximized = false;

        if (electronWin) {
            try {
                if (typeof electronWin.isMaximized === 'function') {
                    isMaximized = electronWin.isMaximized();
                }
                if (typeof electronWin.getNormalBounds === 'function') {
                    const nb = electronWin.getNormalBounds();
                    if (nb && typeof nb.width === 'number' && nb.width > 0 && typeof nb.height === 'number' && nb.height > 0) {
                        normalBounds = nb;
                    }
                }
                if (!normalBounds && typeof electronWin.getBounds === 'function') {
                    const b = electronWin.getBounds();
                    if (b && typeof b.width === 'number' && b.width > 0 && typeof b.height === 'number' && b.height > 0) {
                        normalBounds = b;
                    }
                }
            } catch {
                // Ignore Electron lookup error
            }
        }

        if (normalBounds) {
            childNode.x = normalBounds.x;
            childNode.y = normalBounds.y;
            childNode.width = normalBounds.width;
            childNode.height = normalBounds.height;
        } else if (win) {
            if (typeof win.screenX === 'number') childNode.x = win.screenX;
            if (typeof win.screenY === 'number') childNode.y = win.screenY;
            if (typeof win.outerWidth === 'number' && win.outerWidth > 0) childNode.width = win.outerWidth;
            if (typeof win.outerHeight === 'number' && win.outerHeight > 0) childNode.height = win.outerHeight;
        }

        if (electronWin && typeof electronWin.isMaximized === 'function') {
            childNode.maximize = isMaximized;
        }
    }

    return layout;
}

export async function enforcePopoutWindowPositions(app: App, layout: unknown): Promise<void> {
    const layoutObj = layout as FloatingLayoutContainer | null;
    if (!layoutObj || !layoutObj.floating || !Array.isArray(layoutObj.floating.children)) {
        return;
    }

    const workspace = app.workspace as unknown as WorkspaceWithFloating;
    let floatingSplitChildren = workspace.floatingSplit?.children;
    let attempts = 0;
    while (attempts < 6) {
        if (Array.isArray(floatingSplitChildren) && floatingSplitChildren.length >= layoutObj.floating.children.length) {
            break;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 50));
        floatingSplitChildren = workspace.floatingSplit?.children;
        attempts++;
    }

    if (!Array.isArray(floatingSplitChildren) || floatingSplitChildren.length === 0) {
        return;
    }

    const usedWindows = new Set<WorkspaceWindowLike>();

    for (let i = 0; i < layoutObj.floating.children.length; i++) {
        const savedChild = layoutObj.floating.children[i];
        if (!savedChild || typeof savedChild !== 'object') continue;

        const wsWin = findBestMatchingWindow(savedChild, floatingSplitChildren, usedWindows);
        if (!wsWin) continue;
        usedWindows.add(wsWin);

        const win = (wsWin.win || wsWin.doc?.defaultView || wsWin.containerEl?.ownerDocument?.defaultView) as WindowWithElectron | undefined;
        if (!win || win.closed) continue;
        const electronWin = getElectronWindow(win);

        const targetX = typeof savedChild.x === 'number' ? savedChild.x : undefined;
        const targetY = typeof savedChild.y === 'number' ? savedChild.y : undefined;
        const targetW = typeof savedChild.width === 'number' && savedChild.width > 0 ? savedChild.width : undefined;
        const targetH = typeof savedChild.height === 'number' && savedChild.height > 0 ? savedChild.height : undefined;
        const shouldMaximize = Boolean(savedChild.maximize);

        if (electronWin) {
            try {
                const boundsBefore = typeof electronWin.getBounds === 'function' ? electronWin.getBounds() : { x: 0, y: 0, width: 800, height: 600 };

                if (typeof electronWin.isMaximized === 'function' && electronWin.isMaximized() && typeof electronWin.unmaximize === 'function') {
                    electronWin.unmaximize();
                    let unmaxAttempts = 0;
                    while (electronWin.isMaximized && electronWin.isMaximized() && unmaxAttempts < 5) {
                        await new Promise((r) => window.setTimeout(r, 50));
                        unmaxAttempts++;
                    }
                }

                const newBounds = {
                    x: targetX !== undefined ? targetX : boundsBefore.x,
                    y: targetY !== undefined ? targetY : boundsBefore.y,
                    width: targetW !== undefined ? targetW : boundsBefore.width,
                    height: targetH !== undefined ? targetH : boundsBefore.height,
                };

                let scr: ScreenLike | null = null;
                try {
                    const topWin = typeof window !== 'undefined' ? (window as WindowWithElectron) : null;
                    if (topWin && typeof topWin.require === 'function') {
                        const electron = topWin.require('electron') as ElectronModuleLike | undefined;
                        scr = electron?.remote?.screen || electron?.screen || null;
                    }
                } catch {
                    // Safe fall-through
                }

                const targetDisplay = (scr && typeof scr.getDisplayMatching === 'function') ? scr.getDisplayMatching(newBounds) : null;

                if (targetDisplay && targetDisplay.workArea) {
                    const stageW = Math.min(newBounds.width, targetDisplay.workArea.width - 60);
                    const stageH = Math.min(newBounds.height, targetDisplay.workArea.height - 60);
                    const stageX = targetDisplay.workArea.x + Math.max(20, Math.floor((targetDisplay.workArea.width - stageW) / 2));
                    const stageY = targetDisplay.workArea.y + Math.max(20, Math.floor((targetDisplay.workArea.height - stageH) / 2));

                    electronWin.setBounds({
                        x: stageX,
                        y: stageY,
                        width: stageW,
                        height: stageH,
                    });

                    // Wait 250ms for Windows DWM and DPI settle across mixed monitors
                    await new Promise((r) => window.setTimeout(r, 250));

                    if (shouldMaximize && typeof electronWin.maximize === 'function') {
                        electronWin.maximize();
                        await new Promise((r) => window.setTimeout(r, 150));
                        const boundsAfterMax = typeof electronWin.getBounds === 'function' ? electronWin.getBounds() : null;
                        const checkDisplay = (boundsAfterMax && scr && typeof scr.getDisplayMatching === 'function')
                            ? scr.getDisplayMatching(boundsAfterMax)
                            : null;

                        // Fallback if OS snapped window to primary display instead of target monitor
                        if (checkDisplay && checkDisplay.id !== targetDisplay.id) {
                            if (typeof electronWin.isMaximized === 'function' && electronWin.isMaximized() && typeof electronWin.unmaximize === 'function') {
                                electronWin.unmaximize();
                            }
                            await new Promise((r) => window.setTimeout(r, 100));
                            electronWin.setBounds(targetDisplay.workArea);
                        }
                    } else {
                        electronWin.setBounds(newBounds);
                    }
                } else {
                    electronWin.setBounds(newBounds);
                    if (shouldMaximize && typeof electronWin.maximize === 'function') {
                        await new Promise((r) => window.setTimeout(r, 200));
                        electronWin.maximize();
                    }
                }
                continue;
            } catch {
                // Fall back to DOM window positioning if electron fails
            }
        }

        if (win && targetX !== undefined && targetY !== undefined && targetW !== undefined && targetH !== undefined) {
            try {
                if (typeof win.moveTo === 'function') win.moveTo(targetX, targetY);
                if (typeof win.resizeTo === 'function') win.resizeTo(targetW, targetH);
            } catch {
                // Safe fall-through
            }
        }
    }
}
