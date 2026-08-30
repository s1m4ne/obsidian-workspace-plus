#!/usr/bin/env node
'use strict';

// Where the migration in issue #111 actually stands, measured rather than
// remembered. A session picking this work up runs this first: it answers "what
// is done", "what regressed" and "what is next" without reading the diff.
//
//   node scripts/progress.js

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');

function walk(dir, out) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(abs, out);
        else if (/\.(js|ts)$/.test(entry.name)) out.push(abs);
    }
    return out;
}

function countMatches(files, pattern) {
    let total = 0;
    for (const file of files) {
        const matches = fs.readFileSync(file, 'utf8').match(pattern);
        if (matches) total += matches.length;
    }
    return total;
}

function bar(done, total, width) {
    const filled = total === 0 ? 0 : Math.round((done / total) * width);
    return '#'.repeat(filled) + '.'.repeat(width - filled);
}

function readJson(file, fallback) {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
        return fallback;
    }
}

function lintNow() {
    const eslint = path.join(ROOT, 'node_modules', '.bin', 'eslint');
    let stdout;
    try {
        stdout = execFileSync(eslint, ['src', 'scripts', 'tests', '--format', 'json'],
            { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, cwd: ROOT });
    } catch (error) {
        if (typeof error.stdout !== 'string' || error.stdout === '') throw error;
        stdout = error.stdout;
    }
    return JSON.parse(stdout).reduce((sum, file) => sum + file.messages.length, 0);
}

function coverageNow() {
    const out = execFileSync(process.execPath, [path.join(__dirname, 'coverage-ratchet.js'), '--json'],
        { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, cwd: ROOT });
    return JSON.parse(out).all;
}

function main() {
    const files = walk(SRC, []);
    const ts = files.filter((f) => f.endsWith('.ts'));
    const js = files.filter((f) => f.endsWith('.js'));

    console.log('Workspace++ modernization - issue #111\n');

    console.log('TypeScript migration');
    console.log(`  [${bar(ts.length, files.length, 28)}]  ${ts.length} / ${files.length} files`);

    // P3: the prototype attachment the migration exists to remove.
    const prototypes = countMatches(js, /\.prototype\.\w+\s*=/g);
    console.log(`  prototype methods remaining   ${prototypes}   (started at 309)`);

    // P1: direct reads of the shared bag. Contract cannot begin until these hit 0.
    const dataReads = countMatches(files, /\.data\.\w+/g);
    console.log(`  direct plugin.data reads      ${dataReads}   (started at 264+)`);
    console.log(`  CommonJS requires remaining   ${countMatches(js, /require\(/g)}`);

    const lintBaseline = readJson(path.join(ROOT, '.eslint-baseline.json'), { total: null });
    const covBaseline = readJson(path.join(ROOT, '.coverage-baseline.json'), { all: null });

    console.log('\nGates');
    const lint = lintNow();
    const lintMark = lintBaseline.total === null ? '?' : lint <= lintBaseline.total ? 'ok' : 'REGRESSED';
    console.log(`  lint         ${lint} violations (baseline ${lintBaseline.total})  ${lintMark}`);

    const cov = coverageNow();
    const covMark = !covBaseline.all ? '?' : cov.func >= covBaseline.all.func - 0.5 ? 'ok' : 'REGRESSED';
    console.log(`  coverage     ${cov.func}% functions (baseline ${covBaseline.all ? covBaseline.all.func : '?'}%)  ${covMark}`);

    console.log('\nLocks');
    const lockDir = path.join(ROOT, 'tests', 'lock');
    const locks = fs.existsSync(lockDir)
        ? fs.readdirSync(lockDir).filter((f) => f.endsWith('.test.ts'))
        : [];
    console.log(`  suites in tests/lock/         ${locks.length}`);
    for (const lock of locks) console.log(`    ${lock}`);

    console.log('\nNext');
    console.log('  gh issue view 111    the plan is the source of truth for what comes next');
    console.log('  npm run check        typecheck, lint, coverage, imports, tests, build');
}

main();
