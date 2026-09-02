#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const srcRoot = path.join(repoRoot, 'src');

async function loadI18nData() {
    const { installObsidianStub } = await import('../tests/lock/harness/index.ts');
    installObsidianStub();
    const i18n = await import('../src/i18n.ts');

    return {
        strings: i18n.STRINGS || {},
        extendedStrings: {},
        langOptions: i18n.LANG_OPTIONS || {},
        langOrder: i18n.LANG_ORDER || [],
    };
}

function mergeStrings(strings, extendedStrings) {
    const merged = {};
    const locales = Object.keys(strings);
    for (let i = 0; i < locales.length; i++) {
        const locale = locales[i];
        merged[locale] = Object.assign({}, strings[locale]);
        const ext = extendedStrings[locale] || {};
        const extKeys = Object.keys(ext);
        for (let j = 0; j < extKeys.length; j++) {
            const key = extKeys[j];
            if (merged[locale][key] === undefined) {
                merged[locale][key] = ext[key];
            }
        }
    }
    return merged;
}

function walkSourceFiles(dir, out) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const abs = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkSourceFiles(abs, out);
            continue;
        }
        if (entry.isFile() && /\.(js|ts|tsx)$/.test(entry.name)) {
            out.push(abs);
        }
    }
}

// Keys reached as `L.foo`. These are the ones that must exist in `en`.
function collectUsedI18nKeys(sourceDir) {
    const files = [];
    walkSourceFiles(sourceDir, files);

    const used = new Set();
    const refMap = {};
    // `L.key` and `i18n.L.key`, plus `strings.key`: the search overlay takes a
    // resolved table as `strings` and reads every one of its labels that way,
    // so matching only `L.` reported five live keys as unused - which trains
    // the reader to skim the warning instead of reading it.
    const re = /(?:\bL|i18n\.L|\bstrings)\.([A-Za-z0-9_]+)/g;

    for (let i = 0; i < files.length; i++) {
        const rel = path.relative(repoRoot, files[i]);
        const text = fs.readFileSync(files[i], 'utf8');
        let m;
        while ((m = re.exec(text))) {
            const key = m[1];
            used.add(key);
            if (!refMap[key]) refMap[key] = [];
            if (refMap[key].length < 3) refMap[key].push(rel);
        }
    }

    return { used, refMap };
}

// Keys reached as `L[someVariable]`, where the name is held in a string
// literal - the status bar slot map in settings.js and the `labelKey` fields
// in statusbar-actions.js both work this way. Without this the unused-key
// warning is mostly noise, which is how real dead keys stay hidden in it.
function collectQuotedNames(sourceDir) {
    const files = [];
    walkSourceFiles(sourceDir, files);

    const quoted = new Set();
    const refMap = {};
    const re = /['"]([A-Za-z][A-Za-z0-9_]*)['"]/g;

    for (let i = 0; i < files.length; i++) {
        const rel = path.relative(repoRoot, files[i]);
        if (rel === path.join('src', 'i18n.js') || rel === path.join('src', 'i18n.ts')) continue;
        const text = fs.readFileSync(files[i], 'utf8');
        let m;
        while ((m = re.exec(text))) {
            const name = m[1];
            quoted.add(name);
            if (!refMap[name]) refMap[name] = [];
            if (refMap[name].length < 3) refMap[name].push(rel);
        }
    }

    return { quoted, refMap };
}

function formatList(list, prefix) {
    const out = [];
    for (let i = 0; i < list.length; i++) {
        out.push((prefix || '- ') + list[i]);
    }
    return out.join('\n');
}

async function main() {
    const { strings, extendedStrings, langOptions, langOrder } = await loadI18nData();
    const merged = mergeStrings(strings, extendedStrings);
    const locales = Object.keys(merged).sort();

    const errors = [];
    const warnings = [];

    if (!merged.en) {
        errors.push('Missing base locale: en');
    }

    const enKeys = new Set(Object.keys(merged.en || {}));
    const { used, refMap } = collectUsedI18nKeys(srcRoot);
    const { quoted } = collectQuotedNames(srcRoot);

    // Locale registry consistency
    const optionLocales = Object.keys(langOptions).sort();
    const missingInOptions = locales.filter(function (l) { return optionLocales.indexOf(l) === -1; });
    const extraInOptions = optionLocales.filter(function (l) { return locales.indexOf(l) === -1; });
    if (missingInOptions.length > 0) {
        errors.push('LANG_OPTIONS missing locales: ' + missingInOptions.join(', '));
    }
    if (extraInOptions.length > 0) {
        errors.push('LANG_OPTIONS has unknown locales: ' + extraInOptions.join(', '));
    }

    const orderSet = new Set(langOrder);
    const missingInOrder = locales.filter(function (l) { return !orderSet.has(l); });
    const extraInOrder = langOrder.filter(function (l) { return locales.indexOf(l) === -1; });
    if (missingInOrder.length > 0) {
        errors.push('LANG_ORDER missing locales: ' + missingInOrder.join(', '));
    }
    if (extraInOrder.length > 0) {
        errors.push('LANG_ORDER has unknown locales: ' + extraInOrder.join(', '));
    }

    // Missing translation keys by locale
    for (let i = 0; i < locales.length; i++) {
        const locale = locales[i];
        if (locale === 'en') continue;
        const localeKeys = new Set(Object.keys(merged[locale] || {}));
        const missing = [];
        enKeys.forEach(function (k) {
            if (!localeKeys.has(k)) missing.push(k);
        });
        if (missing.length > 0) {
            errors.push('Locale ' + locale + ' is missing ' + missing.length + ' keys:\n' + formatList(missing, '  - '));
        }
    }

    // Used in code but missing in en
    const usedMissingInEn = [];
    used.forEach(function (k) {
        if (!enKeys.has(k)) usedMissingInEn.push(k);
    });
    usedMissingInEn.sort();
    if (usedMissingInEn.length > 0) {
        const lines = usedMissingInEn.map(function (k) {
            const refs = refMap[k] ? ' [' + refMap[k].join(', ') + ']' : '';
            return k + refs;
        });
        errors.push('Keys used in code but missing in en:\n' + formatList(lines, '  - '));
    }

    // Defined in en but unused in code
    const unusedInCode = [];
    const indirectOnly = [];
    enKeys.forEach(function (k) {
        if (used.has(k)) return;
        if (quoted.has(k)) {
            indirectOnly.push(k);
            return;
        }
        unusedInCode.push(k);
    });
    unusedInCode.sort();
    indirectOnly.sort();
    if (unusedInCode.length > 0) {
        warnings.push('Unused i18n keys in en (' + unusedInCode.length + '):\n' + formatList(unusedInCode, '  - '));
    }

    // Soft language-quality checks
    for (let i = 0; i < locales.length; i++) {
        const locale = locales[i];
        const L = merged[locale] || {};
        if (typeof L.remove === 'string' && typeof L.delete === 'string' && L.remove === L.delete) {
            warnings.push('Locale ' + locale + ' uses the same text for remove/delete: "' + L.remove + '"');
        }
    }

    // Indonesian: ensure "remove from group" wording does not use deletion wording.
    const id = merged.id || {};
    const idRemoveCandidates = [
        typeof id.groupRemoveFromGroup === 'string' ? id.groupRemoveFromGroup : '',
        typeof id.groupRemoveAllSessions === 'string' ? id.groupRemoveAllSessions : '',
        typeof id.groupRemovedSession === 'function' ? id.groupRemovedSession('S', 'G') : '',
        typeof id.groupRemovedAllSessions === 'function' ? id.groupRemovedAllSessions('G') : '',
        typeof id.confirmRemoveAllFromGroup === 'function' ? id.confirmRemoveAllFromGroup('G', 2) : '',
    ].join(' | ').toLowerCase();
    if (idRemoveCandidates.indexOf('hapus') !== -1) {
        warnings.push('Locale id still contains "hapus" in remove-from-group copy. Prefer "keluarkan" wording.');
    }

    if (errors.length === 0) {
        console.log('i18n check passed.');
        console.log('Locales:', locales.join(', '));
        console.log('Keys in en:', enKeys.size);
        console.log('Keys referenced in code:', used.size);
        console.log('Keys referenced indirectly:', indirectOnly.length);
    }

    if (warnings.length > 0) {
        console.log('\nWarnings:');
        console.log(formatList(warnings, '- '));
    }

    if (errors.length > 0) {
        console.error('\nErrors:');
        console.error(formatList(errors, '- '));
        process.exit(1);
    }
}

main();
