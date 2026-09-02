#!/usr/bin/env node
'use strict';

// Two functions with the same body are one function written twice.
//
// This repository produced that eight times over. Four of the eleven relative-
// switch entry points had bodies identical to a fifth; `formatString` was
// written eight times and its call-only variant five more;
// `captureActiveSessionLayoutIfAutoSave` existed twice, byte for byte, on two
// different classes; `showAtMouseEvent` and one whole menu item were duplicated
// between the two context-menu modules. None of it was visible to any other
// gate: every copy was reachable, typed, linted and covered.
//
// The check normalises each function body - comments out, whitespace collapsed -
// hashes it, and reports every hash with more than one site.
//
//   node scripts/check-duplicate-bodies.js

const ts = require('typescript');
const fs = require('fs');
const path = require('path');
const { createHash } = require('node:crypto');

const SRC = path.join(__dirname, '..', 'src');

// Bodies shorter than this are things like `return this.host.x();` - a one-line
// forwarder repeated across classes is not duplication worth a gate.
const MIN_BODY_CHARS = 60;

// i18n.ts is 21 locale tables. Two locales legitimately share a word - French
// and Spanish both build "Alt + Clic" - and that is not duplicated logic.
const EXEMPT_FILES = new Set(['src/i18n.ts']);

// A duplicate that is allowed, and why. Each entry names the exact sites, so a
// fourth copy appearing is still a failure - the allowance is for these three
// and not for the shape.
const ALLOWED = [
    {
        sites: [
            'src/state/group-store.ts persistIfNeeded',
            'src/state/session-store.ts persistIfNeeded',
            'src/state/settings-state.ts persistIfNeeded',
        ],
        reason: 'One-line delegations to state/persist-option.ts, one per owner. '
            + 'The 43 call sites say `this.persistIfNeeded(...)`; the meaning of '
            + 'the flag is defined once, in the function all three forward to.',
    },
];

function allowanceFor(sites) {
    const names = sites.map((s) => s.replace(/:\d+ /, ' '));
    return ALLOWED.find((allowed) =>
        allowed.sites.length === names.length
        && allowed.sites.every((site) => names.includes(site)));
}

function listFiles(dir) {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...listFiles(full));
        else if (entry.name.endsWith('.ts')) out.push(full);
    }
    return out;
}

function normalise(text) {
    return text
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function collect() {
    const buckets = new Map();
    for (const file of listFiles(SRC)) {
        const rel = path.relative(path.join(__dirname, '..'), file);
        if (EXEMPT_FILES.has(rel)) continue;

        const source = ts.createSourceFile(
            file,
            fs.readFileSync(file, 'utf8'),
            ts.ScriptTarget.Latest,
            true
        );

        const visit = (node) => {
            const isFunction = ts.isMethodDeclaration(node)
                || ts.isFunctionDeclaration(node)
                || ts.isArrowFunction(node)
                || ts.isFunctionExpression(node);
            if (isFunction && node.body) {
                const body = normalise(node.body.getText(source));
                if (body.length >= MIN_BODY_CHARS) {
                    const key = createHash('sha1').update(body).digest('hex');
                    const name = node.name && ts.isIdentifier(node.name) ? node.name.text : '<anonymous>';
                    const line = source.getLineAndCharacterOfPosition(node.getStart()).line + 1;
                    if (!buckets.has(key)) buckets.set(key, { body, sites: [] });
                    buckets.get(key).sites.push(`${rel}:${line} ${name}`);
                }
            }
            ts.forEachChild(node, visit);
        };
        ts.forEachChild(source, visit);
    }
    return [...buckets.values()].filter((b) => b.sites.length > 1);
}

const found = collect().sort((a, b) => b.sites.length - a.sites.length);

const allowed = [];
const duplicates = [];
for (const dup of found) {
    const allowance = allowanceFor(dup.sites);
    if (allowance) allowed.push(allowance);
    else duplicates.push(dup);
}

if (duplicates.length === 0) {
    console.log(`No unexplained duplicated function bodies in src/ (${allowed.length} recorded).`);
    process.exit(0);
}

const total = duplicates.reduce((sum, d) => sum + d.sites.length, 0);
console.error(`\n${duplicates.length} duplicated function body/bodies across ${total} sites:\n`);
for (const dup of duplicates) {
    console.error(`  ${dup.sites.length} sites`);
    for (const site of dup.sites) console.error(`    ${site}`);
    console.error(`    > ${dup.body.slice(0, 100)}${dup.body.length > 100 ? '…' : ''}\n`);
}
console.error('Give the shared body one home, or explain the exception here.');
process.exit(1);
