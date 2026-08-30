#!/usr/bin/env node
'use strict';

// The modernization in issue #111 starts from a large, known set of lint
// violations and drives it to zero over many commits. Failing CI on any
// violation would block every commit until the very last one, so the gate is a
// ratchet instead: the count per rule may fall, never rise, and a rule that was
// clean must stay clean.
//
//   node scripts/lint-ratchet.js            compare against the baseline
//   node scripts/lint-ratchet.js --update   record the current counts

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASELINE_PATH = path.join(__dirname, '..', '.eslint-baseline.json');
const LINT_TARGETS = ['src', 'scripts', 'tests'];

function runEslint() {
    const eslint = path.join(__dirname, '..', 'node_modules', '.bin', 'eslint');
    let stdout;
    try {
        stdout = execFileSync(eslint, [...LINT_TARGETS, '--format', 'json'], {
            encoding: 'utf8',
            maxBuffer: 64 * 1024 * 1024,
        });
    } catch (error) {
        // eslint exits non-zero whenever it reports an error, which is the
        // normal case here - the report is still on stdout.
        if (typeof error.stdout !== 'string' || error.stdout === '') throw error;
        stdout = error.stdout;
    }
    return JSON.parse(stdout);
}

function countByRule(results) {
    const counts = {};
    for (const file of results) {
        for (const message of file.messages) {
            const rule = message.ruleId || '(parse error)';
            counts[rule] = (counts[rule] || 0) + 1;
        }
    }
    return counts;
}

function total(counts) {
    return Object.values(counts).reduce((sum, n) => sum + n, 0);
}

function readBaseline() {
    if (!fs.existsSync(BASELINE_PATH)) return null;
    return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
}

function writeBaseline(counts) {
    const sorted = {};
    for (const rule of Object.keys(counts).sort()) sorted[rule] = counts[rule];
    fs.writeFileSync(BASELINE_PATH, JSON.stringify({ total: total(counts), rules: sorted }, null, 4) + '\n');
}

function main() {
    const update = process.argv.includes('--update');
    const counts = countByRule(runEslint());
    const now = total(counts);

    if (update) {
        writeBaseline(counts);
        console.log(`Baseline recorded: ${now} violations across ${Object.keys(counts).length} rules.`);
        return;
    }

    const baseline = readBaseline();
    if (!baseline) {
        console.error('No .eslint-baseline.json. Run: node scripts/lint-ratchet.js --update');
        process.exit(1);
    }

    const regressions = [];
    const improvements = [];
    const rules = new Set([...Object.keys(baseline.rules), ...Object.keys(counts)]);
    for (const rule of [...rules].sort()) {
        const was = baseline.rules[rule] || 0;
        const is = counts[rule] || 0;
        if (is > was) regressions.push(`  ${rule}: ${was} -> ${is}`);
        else if (is < was) improvements.push(`  ${rule}: ${was} -> ${is}`);
    }

    if (improvements.length > 0) {
        console.log('Improved:');
        console.log(improvements.join('\n'));
    }

    if (regressions.length > 0) {
        console.error(`\nLint regressed (${baseline.total} -> ${now}):`);
        console.error(regressions.join('\n'));
        console.error('\nFix these, or if the increase is deliberate, explain it and run with --update.');
        process.exit(1);
    }

    if (improvements.length > 0) {
        console.log(`\nTotal ${baseline.total} -> ${now}. Record it: node scripts/lint-ratchet.js --update`);
    } else {
        console.log(`Lint holding at ${now} violations (baseline ${baseline.total}).`);
    }
}

main();
