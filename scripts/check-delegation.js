#!/usr/bin/env node
'use strict';

// The shims that keep the old prototype API alive read
// `return this.getSessionStore().getFilteredSessions(options)`. Nothing checks
// that SessionStore has a getFilteredSessions - the file is JavaScript, so the
// type checker never looks, and a shim nobody calls is never executed by the
// tests either. Three such methods were invented during the state migration
// and pointed at nothing: calling any of them would have thrown.
//
// Zero is the only acceptable count.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');

const GETTER_TO_CLASS = {
    getSessionStore: 'SessionStore',
    getSessionSwitcher: 'SessionSwitcher',
    getSessionSaver: 'SessionSaver',
    getGroupStore: 'GroupStore',
    getHistoryService: 'HistoryService',
    getSettingsState: 'SettingsState',
    getCommandRegistry: 'CommandRegistry',
    getStatusBarController: 'StatusBarController',
    getFrontmatterLinker: 'FrontmatterLinker',
};

function walk(dir, ext, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, ext, out);
        else if (entry.name.endsWith(ext)) out.push(full);
    }
    return out;
}

// Method and accessor names each exported class actually defines.
const members = new Map();
for (const file of walk(SRC, '.ts')) {
    const text = fs.readFileSync(file, 'utf8');
    const classRe = /export class (\w+)/g;
    let c;
    while ((c = classRe.exec(text)) !== null) {
        const body = text.slice(c.index);
        const found = new Set();
        for (const re of [
            /^ {4}(?:public |private |protected |readonly |async |static )*([A-Za-z_$][\w$]*)\s*\(/gm,
            /^ {4}(?:private |protected )?get ([A-Za-z_$][\w$]*)\s*\(/gm,
        ]) {
            let m;
            while ((m = re.exec(body)) !== null) found.add(m[1]);
        }
        const existing = members.get(c[1]) || new Set();
        for (const n of found) existing.add(n);
        members.set(c[1], existing);
    }
}

const findings = [];
for (const file of walk(SRC, '.js')) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
        const m = /\.(get\w+)\(\)\.([A-Za-z_$][\w$]*)\(/.exec(line);
        if (!m) return;
        const cls = GETTER_TO_CLASS[m[1]];
        if (!cls || !members.has(cls)) return;
        if (members.get(cls).has(m[2])) return;
        findings.push(`  ${path.relative(ROOT, file)}:${i + 1}  ${cls}.${m[2]} does not exist`);
    });
}

if (findings.length > 0) {
    console.error(`Delegations with no target (${findings.length}):`);
    console.error(findings.join('\n'));
    console.error('\nEither add the method to the class, or delete the shim - it throws when called.');
    process.exit(1);
}

console.log('Every delegation resolves.');
