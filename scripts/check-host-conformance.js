#!/usr/bin/env node
'use strict';

// Does the plugin actually have every member the hosts it is handed to declare?
//
// `asHost<T>()` used to be `return this as unknown as T`. Every call site
// type-checked, because a double cast asserts rather than verifies, and
// fourteen required members had gone missing behind it:
//
//   openSearchOverlay              the status bar's left click did nothing
//   openConfirmModal               restore-latest-history did nothing
//   setSessionStorageLocation      the vault-only storage toggle did nothing
//   restoreFromHistoryEntry        the version-history Restore button did nothing
//   syncSessionOrder, updateStatusBar, syncSessionCommands,
//   notifySessionsChanged, normalizeGroupFeatureState
//                                  external sync moved the data and left the
//                                  screen showing the old state
//   getActiveSession, applyWorkspaceLayout
//                                  same, for restore-from-backup
//   reloadCurrentSessionWithoutSaving, resetSessionsToDefault
//
// check:hooks deliberately covers only members declared *optional*, on the
// grounds that a missing required member is the type checker's job. The cast had
// switched that job off, so the two mechanisms each assumed the other was
// covering this and neither was.
//
// asHost is checked now - `asHost<T>(this: T)` makes tsc verify the receiver at
// every call site - so this script is the guard against that being undone. It
// asks the question directly and does not depend on the type checker to do it.
//
// Not a ratchet. A required member the plugin does not have is always a defect.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const MAIN = path.join(SRC, 'main.ts');

function walk(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, out);
        else if (/\.ts$/.test(entry.name)) out.push(full);
    }
    return out;
}

const files = walk(SRC);
const sources = new Map(files.map((f) => [f, fs.readFileSync(f, 'utf8')]));
const mainText = sources.get(MAIN);
if (!mainText) {
    console.error('src/main.ts not found.');
    process.exit(1);
}

// ---------------------------------------------------------------------------
// The hosts the plugin claims to satisfy.
// ---------------------------------------------------------------------------

const claimed = new Set();
// `.asHost<X>()` - the call sites. Matching bare `asHost<` would also pick up
// the declaration's own type parameter.
for (const m of mainText.matchAll(/\.asHost<\s*([A-Za-z_$][\w$]*)\s*>/g)) claimed.add(m[1]);

if (claimed.size === 0) {
    // Nothing to check is a finding in itself: it means the handoff moved and
    // this script is now measuring nothing.
    console.error('No asHost<...>() call sites found in src/main.ts.');
    console.error('If the handoff mechanism changed, this check has to change with it.');
    process.exit(1);
}

// ---------------------------------------------------------------------------
// Each interface's own required members, plus what it extends.
// ---------------------------------------------------------------------------

/** name -> { members: Set<string>, extends: string[] } */
const interfaces = new Map();

for (const text of sources.values()) {
    const decl = /export\s+interface\s+([A-Za-z_$][\w$]*)(?:\s+extends\s+([^{]+))?\s*\{/g;
    let m;
    while ((m = decl.exec(text)) !== null) {
        const name = m[1];
        const bases = (m[2] || '')
            .split(',')
            .map((s) => s.trim().replace(/<.*$/, ''))
            .filter(Boolean);

        // The body, matched by brace depth so nested object types stay inside.
        let depth = 1;
        let i = decl.lastIndex;
        for (; i < text.length && depth > 0; i++) {
            if (text[i] === '{') depth++;
            else if (text[i] === '}') depth--;
        }
        const body = text.slice(decl.lastIndex, i - 1);

        // Only the interface's own top-level members. A nested `data: { ... }`
        // slice contributes `data` and nothing from inside it.
        // Only the interface's own top-level members. Both depths matter: a
        // nested `data: { ... }` slice contributes `data` and nothing from
        // inside it, and a signature broken across lines -
        //     openConfirmModal?(
        //         message: string,
        //         onConfirm: () => void,
        //     ): void;
        // - must not contribute `message` and `onConfirm`, which is exactly
        // what a brace-only parser did.
        const members = new Set();
        let brace = 0;
        let paren = 0;
        for (const rawLine of body.split('\n')) {
            const line = rawLine.trim();
            if (brace === 0 && paren === 0) {
                // `foo(...)` or `foo: T` - and not `foo?`, which check:hooks owns.
                const own = /^(?:readonly\s+)?([A-Za-z_$][\w$]*)\s*(\(|:)/.exec(line);
                if (own && !/^(?:readonly\s+)?[A-Za-z_$][\w$]*\s*\?/.test(line)) {
                    members.add(own[1]);
                }
            }
            brace += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
            paren += (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length;
            if (brace < 0) brace = 0;
            if (paren < 0) paren = 0;
        }
        interfaces.set(name, { members, extends: bases });
    }
}

function requiredMembers(name, seen = new Set()) {
    if (seen.has(name)) return new Set();
    seen.add(name);
    const entry = interfaces.get(name);
    if (!entry) return new Set();
    const out = new Set(entry.members);
    for (const base of entry.extends) {
        for (const inherited of requiredMembers(base, seen)) out.add(inherited);
    }
    return out;
}

// ---------------------------------------------------------------------------
// What the plugin class defines.
// ---------------------------------------------------------------------------

const pluginMembers = new Set();
for (const re of [
    /^\s{4}(?:private\s+|protected\s+|public\s+)?(?:override\s+)?(?:readonly\s+)?(?:async\s+)?([A-Za-z_$][\w$]*)\s*(?:<[^(]*>)?\s*\(/gm, // methods
    /^\s{4}(?:private\s+|protected\s+|public\s+)?(?:override\s+)?(?:static\s+)?get\s+([A-Za-z_$][\w$]*)\s*\(/gm,                        // getters
    /^\s{4}(?:private\s+|protected\s+|public\s+)?(?:override\s+)?(?:readonly\s+)?([A-Za-z_$][\w$]*)\s*[?!]?\s*[:=]/gm,                  // fields
]) {
    for (const m of mainText.matchAll(re)) pluginMembers.add(m[1]);
}

// Obsidian's Plugin supplies app, manifest, addCommand, registerDomEvent and
// friends. obsidian.d.ts is the authority, so this stays correct as the API
// moves instead of drifting against a hand-written list.
const OBSIDIAN_DTS = path.join(ROOT, 'node_modules', 'obsidian', 'obsidian.d.ts');
if (fs.existsSync(OBSIDIAN_DTS)) {
    const dts = fs.readFileSync(OBSIDIAN_DTS, 'utf8');
    for (const m of dts.matchAll(/^\s*(?:abstract\s+|readonly\s+)*([A-Za-z_$][\w$]*)\s*[?(:<]/gm)) {
        pluginMembers.add(m[1]);
    }
}

// ---------------------------------------------------------------------------
// Report.
// ---------------------------------------------------------------------------

const findings = [];
const unknownHosts = [];

for (const host of [...claimed].sort()) {
    if (!interfaces.has(host)) {
        unknownHosts.push(host);
        continue;
    }
    for (const member of [...requiredMembers(host)].sort()) {
        if (!pluginMembers.has(member)) findings.push(`  ${host}.${member}`);
    }
}

if (unknownHosts.length > 0) {
    console.error(`Host types handed the plugin but not found in src/ (${unknownHosts.length}):`);
    console.error(unknownHosts.map((h) => `  ${h}`).join('\n'));
    console.error('\nThis check cannot verify a host it cannot read.');
    process.exit(1);
}

if (findings.length > 0) {
    const unique = [...new Set(findings)].sort();
    console.error(`Required host members the plugin does not define (${unique.length}):`);
    console.error(unique.join('\n'));
    console.error('\nEach of these is a path that does nothing in Obsidian. Define it on the');
    console.error('plugin, delegating to the class that owns the behaviour - or, if nothing');
    console.error('needs it, take it off the host interface.');
    process.exit(1);
}

console.log(`Every required member of ${claimed.size} hosts is defined on the plugin.`);
