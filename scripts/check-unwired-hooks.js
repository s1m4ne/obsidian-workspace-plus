#!/usr/bin/env node
'use strict';

// `plugin.openHistoryModal?.(session)` reads like a call. If nothing ever
// defines openHistoryModal, it is a no-op that the type checker, the linter and
// 325 tests all accept in silence. That is how the version-history command and
// the status bar's right-click menu shipped dead: the migration replaced direct
// module calls with hooks on the plugin and never wired them, and the tests
// supplied the hooks themselves, so the gate stayed green while Obsidian did
// nothing.
//
// This is not a ratchet. An optional call to a method that no file defines is
// always a defect, so the count that matters is zero.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');

// `x.foo?.(` and `typeof x.foo === 'function'` - the two ways a missing wire
// becomes silence rather than an error.
const OPTIONAL_CALL = /\.([A-Za-z_$][\w$]*)\?\.\(/g;
const TYPEOF_GUARD = /typeof\s+[\w.$]+\.([A-Za-z_$][\w$]*)\s*===\s*['"]function['"]/g;

// Only names this codebase is responsible for defining. Obsidian's own API,
// the DOM, Node and caller-supplied callbacks are all legitimately absent from
// src, and counting them buries the real finding in forty lines of noise. A
// name declared optional on one of the migration's own *Host interfaces is a
// contract this repository has to satisfy.
const HOST_DECL = /^\s*([A-Za-z_$][\w$]*)\?(?:\(|\s*:)/gm;

function walk(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, out);
        else if (/\.(ts|js)$/.test(entry.name)) out.push(full);
    }
    return out;
}

// obsidian-internals.ts exists precisely to reach undocumented API behind a
// guard. Those names are absent from obsidian.d.ts by definition, and the guard
// there is the point rather than a defect.
const EXEMPT = new Set([path.join(SRC, 'platform', 'obsidian-internals.ts')]);

const files = walk(SRC).filter((f) => !EXEMPT.has(f));
const sources = new Map(files.map((f) => [f, fs.readFileSync(f, 'utf8')]));
const allText = [...sources.values()].join('\n');

// A definition, as opposed to a declaration in an interface (`foo?(): void;`).
function isDefined(name) {
    const n = name.replace(/[$]/g, '\\$');
    return new RegExp(
        [
            `prototype\\.${n}\\s*=`,          // prototype.foo = function
            // A class method or object shorthand opens a body. An interface
            // declaration - `foo(x: T): void;` - looks almost identical and is
            // not a definition, so the trailing brace is what separates them.
            `^\\s*(?:async\\s+)?${n}\\s*\\([^;]*\\{\\s*$`,
            `${n}\\s*:\\s*(?:function|async|\\()`, // foo: function / foo: () =>
            `${n}\\s*=\\s*(?:function|async|\\()`, // const foo = () =>
            `(?:function|class)\\s+${n}\\b`,
        ].join('|'),
        'm'
    ).test(allText);
}

// Names Obsidian itself provides are defined - just not here. obsidian.d.ts is
// the authority on that, so the check stays correct as the API moves rather
// than drifting against a hand-written allowlist.
const OBSIDIAN_DTS = path.join(ROOT, 'node_modules', 'obsidian', 'obsidian.d.ts');
const obsidianMembers = new Set();
if (fs.existsSync(OBSIDIAN_DTS)) {
    const dts = fs.readFileSync(OBSIDIAN_DTS, 'utf8');
    // `<` catches the generic signatures, e.g. registerDomEvent<K extends ...>.
    const member = /^\s*(?:abstract\s+|readonly\s+)*([A-Za-z_$][\w$]*)\s*[?(:<]/gm;
    let d;
    while ((d = member.exec(dts)) !== null) obsidianMembers.add(d[1]);
}

const ownHooks = new Set();
for (const text of sources.values()) {
    HOST_DECL.lastIndex = 0;
    let d;
    while ((d = HOST_DECL.exec(text)) !== null) ownHooks.add(d[1]);
}

const findings = [];
for (const [file, text] of sources) {
    for (const re of [OPTIONAL_CALL, TYPEOF_GUARD]) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(text)) !== null) {
            const name = m[1];
            if (!ownHooks.has(name) || obsidianMembers.has(name)) continue;
            if (isDefined(name)) continue;
            const line = text.slice(0, m.index).split('\n').length;
            findings.push(`  ${path.relative(ROOT, file)}:${line}  ${name}`);
        }
    }
}

if (findings.length > 0) {
    console.error(`Hooks called but never defined (${findings.length}):`);
    console.error([...new Set(findings)].sort().join('\n'));
    console.error('\nEach of these does nothing at run time. Either wire the hook, or call the');
    console.error('module directly the way the code did before it was migrated.');
    process.exit(1);
}

console.log('No unwired hooks.');
