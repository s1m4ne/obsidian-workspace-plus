#!/usr/bin/env node
'use strict';

// `text()` renders a locale builder as the empty string.
//
// Sixty of the 319 locale keys are functions rather than strings, because their
// text depends on something known only at render time - a count, a session
// name, or the platform. Nine of the twelve status-bar slot labels are in that
// group: the modifier is a glyph on macOS and a word everywhere else, so
// `statusBarSlotModClick` has to be built, not stored.
//
//   export function text(value) {
//       return typeof value === 'string' ? value : '';
//   }
//
// Hand a builder to that and it returns ''. The row renders, the dropdown
// renders, and the name above it is blank. Nine of the twelve status-bar rows
// shipped that way when the settings screen moved to definitions, and nothing
// caught it: the types are identical (`L` is a dictionary of `unknown`), the
// key exists, the i18n completeness check is satisfied, and every test that
// looked the rows up did so by the same empty string.
//
// `formatString` is the one that calls a builder, and it returns the string
// unchanged for a plain key, so it is always safe. This check fails on:
//
//   text(L.someBuilder)              a known builder key, statically
//   text(L[expr]) / text((L as ...)[expr])   a key this script cannot resolve
//
// The second is the shape the status-bar bug had - a label chosen from a table
// at run time - so it is refused rather than trusted.
//
// Zero is the only acceptable count.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const I18N = path.join(ROOT, 'src', 'i18n.ts');
const SRC = path.join(ROOT, 'src');

/** The keys that are functions in English, which the locks prove holds for all 21. */
function builderKeys() {
    const lines = fs.readFileSync(I18N, 'utf8').split('\n');
    const tableStart = lines.findIndex((line) => line.startsWith('const STRINGS'));
    const enStart = lines.findIndex((line, i) => i > tableStart && line.trim() === 'en: {');
    const keys = new Set();
    for (let i = enStart + 1; i < lines.length; i++) {
        if (/^ {4}\},/.test(lines[i])) break;
        const match = /^ {8}(\w+): function/.exec(lines[i]);
        if (match) keys.add(match[1]);
    }
    return keys;
}

function tsFiles(dir) {
    const found = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) found.push(...tsFiles(full));
        else if (entry.name.endsWith('.ts')) found.push(full);
    }
    return found;
}

const builders = builderKeys();
const findings = [];

for (const file of tsFiles(SRC)) {
    const rel = path.relative(ROOT, file);
    if (rel === path.join('src', 'i18n.ts')) continue;
    const lines = fs.readFileSync(file, 'utf8').split('\n');

    lines.forEach((line, index) => {
        for (const match of line.matchAll(/\btext\(L\.(\w+)\)/g)) {
            if (builders.has(match[1])) {
                findings.push({ rel, line: index + 1, what: `L.${match[1]} is a builder` });
            }
        }
        for (const match of line.matchAll(/\btext\(\s*\(?\s*L\b[^)]*?\)?\s*\[/g)) {
            void match;
            findings.push({ rel, line: index + 1, what: 'a locale key this check cannot resolve' });
        }
    });
}

if (findings.length === 0) {
    console.log(`No locale builder reaches text() (${builders.size} builder keys checked).`);
    process.exit(0);
}

console.log(`\n${findings.length} call(s) that would render as the empty string:\n`);
for (const finding of findings) {
    console.log(`  ${finding.rel}:${finding.line}  ${finding.what}`);
}
console.log(`
Use formatString() instead. It calls a builder and returns a plain string
unchanged, so it is correct for either kind of key.
`);
process.exit(1);
