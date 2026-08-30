#!/usr/bin/env node
'use strict';

// Function coverage is the number that matters for this migration: a module
// nobody has executed cannot be refactored safely. It starts near 22% and has
// to climb, so the gate is a ratchet like the lint one - the figure may rise,
// never fall.
//
//   node scripts/coverage-ratchet.js            compare against the baseline
//   node scripts/coverage-ratchet.js --update   record the current figures
//   node scripts/coverage-ratchet.js --json     machine-readable, for progress.js

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASELINE_PATH = path.join(__dirname, '..', '.coverage-baseline.json');
const FLOORS_PATH = path.join(__dirname, '..', '.coverage-floors.json');

// Node prints the summary table to stdout; these pull the totals out of it.
const FILE_ROW = /^[^\S\n]*(?:ℹ\s*)?(?<file>[^|\s][^|]*?)\s*\|\s*(?<line>[\d.]+)\s*\|\s*(?<branch>[\d.]+)\s*\|\s*(?<func>[\d.]+)\s*\|/;

function runCoverage() {
    try {
        return execFileSync(
            process.execPath,
            ['--test', '--experimental-test-coverage', 'tests/**/*.test.{js,ts}'],
            { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, cwd: path.join(__dirname, '..') },
        );
    } catch (error) {
        // A failing test still produces the report; a missing report does not.
        if (typeof error.stdout === 'string' && error.stdout.includes('coverage')) return error.stdout;
        throw error;
    }
}

function parse(output) {
    const files = {};
    let all = null;
    for (const line of output.split('\n')) {
        const m = FILE_ROW.exec(line);
        if (!m || !m.groups) continue;
        const name = m.groups.file.trim();
        if (name === 'file' || name.startsWith('-')) continue;
        const entry = { line: Number(m.groups.line), func: Number(m.groups.func) };
        if (name === 'all files') all = entry;
        else if (name.endsWith('.js') || name.endsWith('.ts')) files[name] = entry;
    }
    return { all, files };
}

/**
 * Per-module floors from the plan. A module is checked by basename, because
 * Phase 3 moves files and a path-keyed floor would silently stop applying the
 * moment its module was renamed - exactly when it matters most.
 */
function checkFloors(files, only) {
    if (!fs.existsSync(FLOORS_PATH)) return [];
    const floors = JSON.parse(fs.readFileSync(FLOORS_PATH, 'utf8')).floors;

    const byName = {};
    for (const [file, entry] of Object.entries(files)) {
        byName[path.basename(file)] = entry;
    }

    const below = [];
    for (const [name, floor] of Object.entries(floors)) {
        if (only && name !== only && name !== only.replace(/\.ts$/, '.js')) continue;
        const entry = byName[name] || byName[name.replace(/\.js$/, '.ts')];
        if (!entry) {
            below.push({ file: name, actual: 'absent', floor });
            continue;
        }
        if (entry.func < floor) below.push({ file: name, actual: entry.func, floor });
    }
    return below;
}

function reportFloors(below, target) {
    if (below.length === 0) {
        console.log(target ? `${target} clears its coverage floor.` : 'All modules clear their coverage floors.');
        return;
    }
    console.error('Below the coverage floor:');
    for (const item of below) {
        console.error(`  ${item.file.padEnd(34)} ${String(item.actual).padStart(6)}%  floor ${item.floor}%`);
    }
    console.error('\nRaise it with lock coverage before migrating the module. See issue #111.');
    process.exit(1);
}

function main() {
    const args = process.argv.slice(2);
    const { all, files } = parse(runCoverage());

    // Floors gate one module at the moment it is migrated, not every commit -
    // requiring all of them up front would mean writing every lock before
    // touching any code. Project-wide coverage is a weighted average, so it
    // cannot stand in for them: i18n.js alone holds roughly 1,300 functions
    // across its 21 locales, and that file reaching 100% masked sixteen modules
    // standing still at the end of Phase 2.
    const floorArg = args.indexOf('--floor');
    if (floorArg !== -1) {
        const target = args[floorArg + 1];
        if (!target) {
            console.error('Usage: node scripts/coverage-ratchet.js --floor <module.js>');
            process.exit(1);
        }
        return reportFloors(checkFloors(files, target), target);
    }
    if (args.includes('--floors')) {
        return reportFloors(checkFloors(files), null);
    }

    if (!all) {
        console.error('Could not read a coverage report from the test run.');
        process.exit(1);
    }

    if (args.includes('--json')) {
        console.log(JSON.stringify({ all, files }, null, 4));
        return;
    }

    if (args.includes('--update')) {
        fs.writeFileSync(BASELINE_PATH, JSON.stringify({ all }, null, 4) + '\n');
        console.log(`Coverage baseline recorded: ${all.func}% functions, ${all.line}% lines.`);
        return;
    }

    if (!fs.existsSync(BASELINE_PATH)) {
        console.error('No .coverage-baseline.json. Run: node scripts/coverage-ratchet.js --update');
        process.exit(1);
    }



    const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8')).all;
    // A little slack: coverage shifts by fractions when unrelated files move.
    const TOLERANCE = 0.5;

    if (all.func < baseline.func - TOLERANCE) {
        console.error(`Function coverage fell: ${baseline.func}% -> ${all.func}%.`);
        console.error('Add tests for what this commit touched, or explain the drop and run with --update.');
        process.exit(1);
    }

    if (all.func > baseline.func + TOLERANCE) {
        console.log(`Function coverage rose: ${baseline.func}% -> ${all.func}%. Record it: node scripts/coverage-ratchet.js --update`);
        return;
    }

    console.log(`Coverage holding at ${all.func}% functions (baseline ${baseline.func}%).`);
}

main();
