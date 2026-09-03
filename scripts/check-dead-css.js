#!/usr/bin/env node
'use strict';

// A class in styles.css that nothing under src/ ever applies.
//
// Seven `.wpp-advanced-*` and `.wpp-dev-*` rules - 42 lines - survived the
// settings UI moving from `<details>` sections to tabs. The
// `.wpp-session-actions .wpp-btn-focused` selector outlived the class it
// matched. Neither is visible to any other gate: CSS is not type-checked, not
// linted here, and not covered.
//
// Names built by concatenation are the one thing that makes this hard: the
// search overlay writes `'wpp-resize-' + edges[i]`, so `.wpp-resize-bottom`
// appears nowhere in the source. A leading substring of a quoted string counts
// as a use, which clears all eight of those without an allowlist.
//
//   node scripts/check-dead-css.js

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const STYLES = path.join(ROOT, 'styles.css');
const SRC = path.join(ROOT, 'src');

function listFiles(dir) {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...listFiles(full));
        else if (/\.(ts|js)$/.test(entry.name)) out.push(full);
    }
    return out;
}

const css = fs.readFileSync(STYLES, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const defined = [...new Set(
    [...css.matchAll(/\.(wpp-[a-zA-Z0-9_-]+)/g)].map((m) => m[1])
)].sort();

const source = listFiles(SRC).map((f) => fs.readFileSync(f, 'utf8')).join('\n');

// The prefixes the source builds names from: a quoted string that a `+`
// immediately follows, which is the only shape that can produce a class name
// the source never spells out. Matching any leading substring instead was too
// loose to be worth having - it reported a class called
// `wpp-never-used-anywhere` as used.
// The prefix is the last whitespace-separated token of the literal, because
// `cls` usually carries more than one class:
//   'wpp-resize-corner wpp-resize-' + corners[i]
const CONCAT_PREFIXES = [...source.matchAll(/['"]([^'"\n]*)['"]\s*\+/g)]
    .map((m) => m[1].trim().split(/\s+/).pop() || '')
    .filter((prefix) => prefix.startsWith('wpp-') && prefix.length > 4);

function isUsed(name) {
    if (source.includes(name)) return true;
    return CONCAT_PREFIXES.some((prefix) => name.startsWith(prefix));
}

const dead = defined.filter((name) => !isUsed(name));

if (dead.length === 0) {
    console.log(`Every one of the ${defined.length} wpp- classes in styles.css is applied somewhere.`);
    process.exit(0);
}

console.error(`\n${dead.length} class(es) defined in styles.css and never applied:\n`);
for (const name of dead) console.error(`  .${name}`);
console.error('\nDelete the rule, or apply the class.');
process.exit(1);
