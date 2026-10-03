import { cloneJson } from './clone-json.ts';

/**
 * Which regions of the workspace the plugin treats as its own.
 *
 * `full` restores and compares `main` plus both sidebars. `main-only` restores
 * `main` over whatever sidebars are on screen, and must therefore compare
 * `main` alone: comparing a region that is never restored produces a dirty
 * flag that nothing can clear.
 *
 * That is why the scope is a required argument rather than an optional one. It
 * used to be `restoreScope?: string`, so a caller that forgot it, or misspelt
 * the value, silently got `full` - and only one of the three call paths passed
 * it at all.
 */
export type RestoreScope = 'full' | 'main-only';

export interface LayoutComparisonOptions {
    readonly restoreScope: RestoreScope;
}

export function serializeLayout(layout: unknown): string {
    try {
        return JSON.stringify(layout || null);
    } catch {
        return '';
    }
}

export function layoutsEqual(a: unknown, b: unknown): boolean {
    return serializeLayout(a) === serializeLayout(b);
}

/**
 * Which kind of device a layout belongs to.
 *
 * Obsidian keeps two workspaces, workspace.json and workspace-mobile.json, and
 * picks between them on `Platform.isMobile`. A phone's layout is not one a
 * desktop can show - its sidebars are drawers, which a desktop drops, leaving
 * both sidebars empty (#124). So a session keeps one layout per kind: `layout`
 * for desktops, which is what every earlier release wrote, and `mobileLayout`
 * for phones and tablets.
 */
export type LayoutSlot = 'desktop' | 'mobile';

export interface SlottedLayouts {
    layout: unknown;
    mobileLayout?: unknown;
    /**
     * When each was last written. A session's `modified` moves whenever either
     * kind saves, so it cannot say which copy of the *other* kind's layout is
     * the newer one when two devices' files are merged.
     */
    layoutSavedAt?: number;
    mobileLayoutSavedAt?: number;
}

function isDrawer(value: unknown): boolean {
    return !!value && typeof value === 'object' && (value as { type?: unknown }).type === 'mobile-drawer';
}

export function isMobileLayout(layout: unknown): boolean {
    if (!layout || typeof layout !== 'object') return false;
    const regions = layout as Record<string, unknown>;
    return isDrawer(regions.left) || isDrawer(regions.right);
}

export function layoutSlotOf(layout: unknown): LayoutSlot {
    return isMobileLayout(layout) ? 'mobile' : 'desktop';
}

export function otherLayoutSlot(slot: LayoutSlot): LayoutSlot {
    return slot === 'mobile' ? 'desktop' : 'mobile';
}

/**
 * The layout this kind of device saved, or null.
 *
 * A release before the split, running on a phone, wrote the phone's layout into
 * `layout`. Its drawers say whose it is, so no migration has to guess.
 */
export function readSessionLayout(session: SlottedLayouts, slot: LayoutSlot): unknown {
    if (slot === 'mobile') {
        return session.mobileLayout ?? (isMobileLayout(session.layout) ? session.layout : null);
    }
    return isMobileLayout(session.layout) ? null : (session.layout ?? null);
}

export function writeSessionLayout(session: SlottedLayouts, layout: unknown, slot: LayoutSlot): void {
    if (slot === 'mobile') {
        session.mobileLayout = layout;
        session.mobileLayoutSavedAt = Date.now();
    } else {
        session.layout = layout;
        session.layoutSavedAt = Date.now();
    }
}

/**
 * What to put on screen: this device's own layout, or failing that the other
 * kind's. A session first opened on a phone has only a desktop layout; showing
 * its notes beats showing nothing, and the restore takes `main` alone from a
 * layout of the other kind, so the phone keeps its own drawers.
 */
export function sessionLayoutToApply(session: SlottedLayouts, slot: LayoutSlot): unknown {
    return readSessionLayout(session, slot) ?? readSessionLayout(session, otherLayoutSlot(slot));
}

// The layout is JSON on disk; cloning it is the general operation under a
// name that says what it is used for here.
export const cloneLayout = cloneJson;

export function nodeContainsId(node: unknown, id: string): boolean {
    if (!id || !node) return false;
    if (Array.isArray(node)) {
        for (let i = 0; i < node.length; i++) {
            if (nodeContainsId(node[i], id)) return true;
        }
        return false;
    }
    if (typeof node === 'object') {
        const obj = node as Record<string, unknown>;
        if (obj.id === id) return true;
        const keys = Object.keys(obj);
        for (let k = 0; k < keys.length; k++) {
            const key = keys[k]!;
            if (nodeContainsId(obj[key], id)) return true;
        }
    }
    return false;
}

export function mergeMainLayoutIntoCurrent(targetLayout: unknown, currentLayout: unknown): unknown {
    const target = cloneLayout(targetLayout) as Record<string, unknown> | undefined;
    if (!target || typeof target !== 'object' || !target.main) return target;

    const current: Record<string, unknown> = currentLayout && typeof currentLayout === 'object'
        ? (cloneLayout(currentLayout) as Record<string, unknown>)
        : {};

    current.main = target.main;
    if (typeof target.active === 'string' && nodeContainsId(target.main, target.active)) {
        current.active = target.active;
    }
    return current;
}

function looksLikeWorkspaceItem(value: unknown): boolean {
    if (!value || typeof value !== 'object') return false;
    const item = value as Record<string, unknown>;
    return typeof item.id === 'string'
        && typeof item.type === 'string'
        && (
            Array.isArray(item.children)
            || item.state !== undefined
            || item.currentTab !== undefined
            || item.direction !== undefined
            || item.collapsed !== undefined
        );
}

function normalizeLayoutForComparison(layout: unknown, options: LayoutComparisonOptions): unknown {
    let root = layout;
    if (options.restoreScope === 'main-only' && root && typeof root === 'object') {
        const obj = root as Record<string, unknown>;
        if (obj.main) {
            root = obj.main;
        }
    }

    // Pixel geometry and per-view ephemera. `left` belongs to this set too, and
    // is handled below instead of here: Obsidian uses the same key for a
    // coordinate and for the left sidebar's subtree, and 4df7f55 stripped both
    // for four months by putting the name in this list.
    const volatileKeys: Record<string, boolean> = {
        eState: true,
        lastOpenFiles: true,
        scroll: true,
        top: true,
    };

    function normalizeNode(value: unknown, depth: number): unknown {
        if (Array.isArray(value)) {
            return value.map((item) => normalizeNode(item, depth + 1));
        }
        if (value && typeof value === 'object') {
            const normalized: Record<string, unknown> = {};
            const obj = value as Record<string, unknown>;
            const isWorkspaceItem = looksLikeWorkspaceItem(obj);
            const keys = Object.keys(obj).sort();
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i]!;
                if (volatileKeys[key]) continue;
                // A numeric `left` is a coordinate; an object `left` is the sidebar.
                if (key === 'left' && (obj[key] === null || typeof obj[key] !== 'object')) continue;
                if (key === 'id' && isWorkspaceItem) continue;

                // `active` and `currentTab` are the same question at two
                // scopes - which thing is in front - so they get the same
                // answer. `active` at the root is the focused leaf's id;
                // `currentTab` is the selected tab of one tab group, which is
                // why it never sits at depth 0 and was never reached by the
                // line above it.
                //
                // Authorized exception to the behaviour lock in issue #111.
                // With auto-save on, the default, nothing changes: the layout
                // is captured on every switch regardless. With auto-save off,
                // selecting a different tab no longer lights the unsaved
                // indicator - which is already true of moving focus between
                // panes, so the two are consistent now instead of opposite.
                // It also stops the snapshot timer spending the history budget
                // on tab clicks: three entries for one session in half an hour
                // differed in nothing else.
                if (key === 'active' && depth === 0 && typeof obj[key] === 'string') continue;
                if (key === 'currentTab') continue;
                normalized[key] = normalizeNode(obj[key], depth + 1);
            }
            return normalized;
        }
        return value;
    }

    return normalizeNode(root || null, 0);
}

export function layoutsEqualStructural(a: unknown, b: unknown, options: LayoutComparisonOptions): boolean {
    try {
        return JSON.stringify(normalizeLayoutForComparison(a, options)) === JSON.stringify(normalizeLayoutForComparison(b, options));
    } catch {
        return layoutsEqual(a, b);
    }
}

export interface LayoutSummary {
    /** Leaves in the main area, `empty` ones included - Obsidian shows those. */
    readonly paneCount: number;

    /** Vault-relative paths, in main-area order, each listed once. */
    readonly filePaths: readonly string[];
}

/**
 * DESCRIBE: what a person would say was on screen, for a layout that is no
 * longer on screen - a version-history entry.
 *
 * **The main area only, and that is not a preference.** Obsidian defines the
 * region itself: `Workspace.iterateRootLeaves` is documented as "Iterate
 * through all leaves in the main area of the workspace", as against
 * `iterateAllLeaves`, which adds the sidebars and pop-outs. And there is no
 * alternative rule available: a leaf's `state.state.file` is written by
 * whatever `getState()` the view implements, and `backlink`, `outline` and
 * `outgoing-link` write the file they are *pointing at* into exactly the field
 * a `markdown` leaf writes the file it is *showing*. Nothing in the JSON tells
 * the two apart, so the region has to.
 *
 * Walking the sidebars is what made a history entry claim `A13 尺取り法.md`
 * was open when the main area held two empty tabs and that path was the
 * backlink pane's subject. Listing it once rather than three times is the same
 * defect from the other end: three sidebar panes referenced two files.
 *
 * A live workspace would be read through `iterateRootLeaves` and
 * `leaf.view instanceof FileView`, which are typed and need no JSON walking.
 * That is not available here - a history entry is a snapshot, so this walks
 * the tree Obsidian handed us.
 */
export function describeLayout(layout: unknown): LayoutSummary {
    const filePaths: string[] = [];
    const seen = new Set<string>();
    let paneCount = 0;

    function walk(node: unknown): void {
        if (!node || typeof node !== 'object') return;
        const obj = node as {
            type?: string;
            state?: { state?: { file?: unknown } };
            children?: unknown[];
        };

        if (obj.type === 'leaf') {
            paneCount++;
            const file = obj.state?.state?.file;
            if (typeof file === 'string' && file && !seen.has(file)) {
                seen.add(file);
                filePaths.push(file);
            }
            return;
        }

        if (Array.isArray(obj.children)) {
            for (const child of obj.children) walk(child);
        }
    }

    if (layout && typeof layout === 'object') {
        walk((layout as { main?: unknown }).main);
    }

    return { paneCount, filePaths };
}
