#!/usr/bin/env node
'use strict';

// A class extracted during issue #111 can end up with two implementations of
// the same capability: one reached through a host hook, one kept for itself as
// a fallback. The adapters always supply the hook, so in production the
// fallback never runs - and because the tests inject the hook too, it never
// runs there either. That is how the workspace branch of
// SessionStore#getCurrentWorkspaceLayout could be deleted outright and leave
// all 290 tests green.
//
// The pattern is easy to write and invisible in the other five gates, so it is
// ratcheted like lint: the count per file may fall, never rise, and a file that
// was clean must stay clean.
//
// Not every occurrence is wrong. Where the adapter returns undefined unless a
// test overrides the plugin method, the class's own branch IS the production
// path, and the seam is what lets the old tests keep working. Those are the
// fifteen recorded in the baseline. The judgement is always the same question:
//
//   does the adapter always supply this hook?
//
// If yes, the class's fallback is dead and belongs to this gate. If it returns
// undefined in production, the fallback is live and is allowed to stay.
//
//   node scripts/dual-dispatch-ratchet.js            compare against the baseline
//   node scripts/dual-dispatch-ratchet.js --update   record the current counts

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BASELINE_PATH = path.join(ROOT, '.dual-dispatch-baseline.json');
const SCAN_DIRS = ['src/state', 'src/storage'];
// Quote style is not fixed by the linter, so accept either - a gate that a
// change of quotes can slip past is not a gate.
const PATTERN = /typeof this\.host\.[A-Za-z_$][\w$]* === ['"]function['"]/g;

function scan() {
    const counts = {};
    for (const dir of SCAN_DIRS) {
        const abs = path.join(ROOT, dir);
        if (!fs.existsSync(abs)) continue;
        for (const entry of fs.readdirSync(abs).sort()) {
            if (!entry.endsWith('.ts')) continue;
            const rel = `${dir}/${entry}`;
            const matches = fs.readFileSync(path.join(abs, entry), 'utf8').match(PATTERN);
            if (matches) counts[rel] = matches.length;
        }
    }
    return counts;
}

function total(counts) {
    return Object.values(counts).reduce((sum, n) => sum + n, 0);
}

function main() {
    const counts = scan();
    const now = total(counts);

    if (process.argv.includes('--update')) {
        fs.writeFileSync(BASELINE_PATH, `${JSON.stringify({ total: now, files: counts }, null, 4)}\n`);
        console.log(`Dual-dispatch baseline recorded: ${now} sites.`);
        return;
    }

    if (!fs.existsSync(BASELINE_PATH)) {
        console.error(`No baseline at ${BASELINE_PATH}. Record one: node scripts/dual-dispatch-ratchet.js --update`);
        process.exit(1);
    }

    const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
    const regressions = [];
    const improvements = [];

    for (const file of new Set([...Object.keys(baseline.files), ...Object.keys(counts)])) {
        const was = baseline.files[file] || 0;
        const is = counts[file] || 0;
        if (is > was) regressions.push(`  ${file}: ${was} -> ${is}`);
        else if (is < was) improvements.push(`  ${file}: ${was} -> ${is}`);
    }

    if (improvements.length > 0) {
        console.log('Improved:');
        console.log(improvements.join('\n'));
    }

    if (regressions.length > 0) {
        console.error(`\nDual dispatch regressed (${baseline.total} -> ${now}):`);
        console.error(regressions.join('\n'));
        console.error('\nFor each new site, ask whether the adapter always supplies that hook.');
        console.error('If it does, the class\'s own branch is dead - delete it and require the');
        console.error('dependency on the host interface. If the adapter returns undefined unless a');
        console.error('test overrides the plugin method, the site is a live seam: explain it and');
        console.error('run with --update.');
        process.exit(1);
    }

    if (improvements.length > 0) {
        console.log(`\nTotal ${baseline.total} -> ${now}. Record it: node scripts/dual-dispatch-ratchet.js --update`);
    } else {
        console.log(`Dual dispatch holding at ${now} sites (baseline ${baseline.total}).`);
    }
}

main();
