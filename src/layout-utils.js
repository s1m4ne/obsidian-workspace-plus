'use strict';

function serializeLayout(layout) {
    try {
        return JSON.stringify(layout || null);
    } catch (e) {
        return '';
    }
}

function layoutsEqual(a, b) {
    return serializeLayout(a) === serializeLayout(b);
}

function cloneLayout(layout) {
    if (layout === undefined) return undefined;
    return JSON.parse(JSON.stringify(layout));
}

function nodeContainsId(node, id) {
    if (!id || !node) return false;
    if (Array.isArray(node)) {
        for (var i = 0; i < node.length; i++) {
            if (nodeContainsId(node[i], id)) return true;
        }
        return false;
    }
    if (typeof node === 'object') {
        if (node.id === id) return true;
        var keys = Object.keys(node);
        for (var k = 0; k < keys.length; k++) {
            if (nodeContainsId(node[keys[k]], id)) return true;
        }
    }
    return false;
}

function mergeMainLayoutIntoCurrent(targetLayout, currentLayout) {
    var target = cloneLayout(targetLayout);
    if (!target || typeof target !== 'object' || !target.main) return target;

    var current = currentLayout && typeof currentLayout === 'object'
        ? cloneLayout(currentLayout)
        : {};

    current.main = target.main;
    if (typeof target.active === 'string' && nodeContainsId(target.main, target.active)) {
        current.active = target.active;
    }
    return current;
}

function looksLikeWorkspaceItem(value) {
    return value
        && typeof value === 'object'
        && typeof value.id === 'string'
        && typeof value.type === 'string'
        && (
            Array.isArray(value.children)
            || value.state !== undefined
            || value.currentTab !== undefined
            || value.direction !== undefined
            || value.collapsed !== undefined
        );
}

function normalizeLayoutForComparison(layout) {
    var options = arguments.length > 1 && arguments[1] ? arguments[1] : {};
    if (options.restoreScope === 'main-only' && layout && typeof layout === 'object' && layout.main) {
        layout = layout.main;
    }

    var volatileKeys = {
        eState: true,
        lastOpenFiles: true,
        scroll: true,
        top: true,
    };

    function normalizeNode(value, depth) {
        if (Array.isArray(value)) {
            return value.map(function (item) { return normalizeNode(item, depth + 1); });
        }
        if (value && typeof value === 'object') {
            var normalized = {};
            var isWorkspaceItem = looksLikeWorkspaceItem(value);
            var keys = Object.keys(value).sort();
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                if (volatileKeys[key]) continue;
                if (key === 'left' && (value[key] === null || typeof value[key] !== 'object')) continue;
                if (key === 'id' && isWorkspaceItem) continue;
                if (key === 'active' && depth === 0 && typeof value[key] === 'string') continue;
                normalized[key] = normalizeNode(value[key], depth + 1);
            }
            return normalized;
        }
        return value;
    }

    return normalizeNode(layout || null, 0);
}

function layoutsEqualStructural(a, b) {
    var options = arguments.length > 2 && arguments[2] ? arguments[2] : {};
    try {
        return JSON.stringify(normalizeLayoutForComparison(a, options)) === JSON.stringify(normalizeLayoutForComparison(b, options));
    } catch (e) {
        return layoutsEqual(a, b);
    }
}

module.exports = {
    serializeLayout: serializeLayout,
    layoutsEqual: layoutsEqual,
    cloneLayout: cloneLayout,
    mergeMainLayoutIntoCurrent: mergeMainLayoutIntoCurrent,
    normalizeLayoutForComparison: normalizeLayoutForComparison,
    layoutsEqualStructural: layoutsEqualStructural,
};
