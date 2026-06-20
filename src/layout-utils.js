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
    var volatileKeys = {
        eState: true,
        lastOpenFiles: true,
        left: true,
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
    try {
        return JSON.stringify(normalizeLayoutForComparison(a)) === JSON.stringify(normalizeLayoutForComparison(b));
    } catch (e) {
        return layoutsEqual(a, b);
    }
}

module.exports = {
    serializeLayout: serializeLayout,
    layoutsEqual: layoutsEqual,
    cloneLayout: cloneLayout,
    normalizeLayoutForComparison: normalizeLayoutForComparison,
    layoutsEqualStructural: layoutsEqualStructural,
};
