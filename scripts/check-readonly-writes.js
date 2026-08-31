#!/usr/bin/env node
'use strict';

// P2 replaces mutable fields on the plugin with read-only accessors that
// delegate to the class now owning the state. The bundle is strict, so
// assigning to one of those accessors throws - and onunload was doing exactly
// that for three scroll counters, taking flushPendingPersistence() down with it
// and losing anything not yet written every time the plugin was disabled.
//
// Nothing caught it: the type checker does not read the .js prototype
// definitions, and no test exercised onunload. As more state moves behind
// accessors this shape gets easier to reintroduce, so it is checked. Zero.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');

function walk(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, out);
        else if (/\.(ts|js)$/.test(entry.name)) out.push(full);
    }
    return out;
}

const files = walk(SRC);
const sources = new Map(files.map((f) => [f, fs.readFileSync(f, 'utf8')]));

// Accessors defined on the prototype with a getter and no setter.
const readOnly = new Set();
const DEFINE = /Object\.defineProperty\(\s*\w+\.prototype,\s*'(\w+)'\s*,\s*\{([\s\S]*?)\n {4}\}\)/g;
for (const text of sources.values()) {
    DEFINE.lastIndex = 0;
    let m;
    while ((m = DEFINE.exec(text)) !== null) {
        const [, name, body] = m;
        if (/\bget\s*[:(]/.test(body) && !/\bset\s*[:(]/.test(body)) readOnly.add(name);
    }
}

const findings = [];
for (const [file, text] of sources) {
    text.split('\n').forEach((line, i) => {
        for (const name of readOnly) {
            if (new RegExp(`\\b(?:this|self|plugin)\\.${name}\\s*=[^=]`).test(line)) {
                findings.push(`  ${path.relative(ROOT, file)}:${i + 1}  ${name}`);
            }
        }
    });
}

if (findings.length > 0) {
    console.error(`Assignments to read-only accessors (${findings.length}):`);
    console.error(findings.join('\n'));
    console.error('\nEach throws under strict mode and abandons the rest of the function it is in.');
    console.error('Ask the owning class to change the value instead.');
    process.exit(1);
}

console.log(`No writes to read-only accessors (${readOnly.size} checked).`);
