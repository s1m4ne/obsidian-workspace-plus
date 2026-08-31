import { cloneJson } from './clone-json.ts';

export interface LayoutComparisonOptions {
    restoreScope?: string;
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

export function normalizeLayoutForComparison(layout: unknown, options: LayoutComparisonOptions = {}): unknown {
    let root = layout;
    if (options.restoreScope === 'main-only' && root && typeof root === 'object') {
        const obj = root as Record<string, unknown>;
        if (obj.main) {
            root = obj.main;
        }
    }

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
                if (key === 'left' && (obj[key] === null || typeof obj[key] !== 'object')) continue;
                if (key === 'id' && isWorkspaceItem) continue;
                if (key === 'active' && depth === 0 && typeof obj[key] === 'string') continue;
                normalized[key] = normalizeNode(obj[key], depth + 1);
            }
            return normalized;
        }
        return value;
    }

    return normalizeNode(root || null, 0);
}

export function layoutsEqualStructural(a: unknown, b: unknown, options: LayoutComparisonOptions = {}): boolean {
    try {
        return JSON.stringify(normalizeLayoutForComparison(a, options)) === JSON.stringify(normalizeLayoutForComparison(b, options));
    } catch {
        return layoutsEqual(a, b);
    }
}
