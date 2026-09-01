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
const os = require('os');
const path = require('path');
const { fileURLToPath } = require('url');

const ROOT = path.join(__dirname, '..');
const BASELINE_PATH = path.join(ROOT, '.coverage-baseline.json');
const FLOORS_PATH = path.join(ROOT, '.coverage-floors.json');

// The figures are computed from V8's own coverage dump rather than from the
// table `--experimental-test-coverage` prints.
//
// That table omits a .ts module reached only through require(), which is exactly
// the shape every migrated module has while a .js caller still loads it. Three
// of them - search-overlay.ts, persistence-service.ts,
// session-manager-modal-class.ts, about 2,400 lines - had dropped out of the
// report without any gate noticing, and because they left the denominator too,
// the recorded percentage went *up* each time one disappeared. Adding an import
// does not fix it: require() and import() are separate module records to V8, so
// the imported copy reports zero.
//
// The cause is in the dump: a .ts loaded through require() is recorded under a
// bare filesystem path, while everything else gets a file:// URL, and the
// renderer keeps only the URLs. The data was there all along, so this reads it
// directly and accepts both spellings.

function runCoverage() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wpp-cov-'));
    try {
        try {
            execFileSync(
                process.execPath,
                ['--test', 'tests/**/*.test.{js,ts}'],
                {
                    encoding: 'utf8',
                    maxBuffer: 64 * 1024 * 1024,
                    cwd: ROOT,
                    env: Object.assign({}, process.env, { NODE_V8_COVERAGE: dir }),
                },
            );
        } catch (error) {
            // A failing test still leaves a usable dump behind; report the
            // failure rather than a coverage number computed from a red run.
            if (!fs.existsSync(dir) || fs.readdirSync(dir).length === 0) throw error;
            console.error('Tests failed during the coverage run; fix them before trusting these figures.');
        }
        return collect(dir);
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

/** A script's url is a file:// URL, except for a .ts reached through require(), which is a bare path. */
function toPath(url) {
    if (typeof url !== 'string' || url === '') return null;
    if (url.startsWith('file:')) {
        try {
            return fileURLToPath(url);
        } catch {
            return null;
        }
    }
    return path.isAbsolute(url) ? url : null;
}

/** Files the report covers: this repository's own source, excluding the tests themselves. */
function isMeasured(file) {
    if (!file.startsWith(ROOT + path.sep)) return false;
    const rel = path.relative(ROOT, file);
    if (rel.split(path.sep).includes('node_modules')) return false;
    if (/\.test\.[jt]s$/.test(rel)) return false;
    return /\.[jt]s$/.test(rel);
}

const UNKNOWN = 0;
const COVERED = 1;
const UNCOVERED = 2;

/**
 * V8 reports nested ranges: a function's own span first, then the blocks inside
 * it that ran a different number of times. Applying them outermost-first lets
 * each inner range overwrite its parent, which is what makes an untaken branch
 * inside a called function show as uncovered.
 *
 * This has to be done per process before merging. A worker that merely loaded
 * the module contributes an outer range with a count, and if that were applied
 * over another worker's state it would paint over the untaken branches that
 * worker actually recorded - which read as 100% of every line.
 */
function applyRanges(state, ranges) {
    const ordered = ranges.slice().sort((a, b) => (
        a.startOffset - b.startOffset || b.endOffset - a.endOffset
    ));
    for (const range of ordered) {
        const value = range.count > 0 ? COVERED : UNCOVERED;
        const end = Math.min(range.endOffset, state.length);
        for (let i = range.startOffset; i < end; i++) state[i] = value;
    }
}

/** Covered in any process means executed. */
function mergeState(target, source) {
    for (let i = 0; i < target.length; i++) {
        if (source[i] === UNKNOWN) continue;
        if (source[i] === COVERED || target[i] === UNKNOWN) target[i] = source[i];
    }
}

/**
 * src/plugin/methods/* are the retiring adapters: thin forwarding shims that
 * exist only until their callers reach the classes directly. They are still
 * measured per file, but they do not steer the project-wide ratchet.
 *
 * Counting them inverts the gate's incentive. Pointing a test at the real class
 * instead of the adapter is the whole object of the migration, and it strands
 * the adapter at once - one such conversion dropped sessions-validation.js from
 * 100% to 33% and the project figure by 0.20 with no other file moving. The
 * ratchet then blocks the commit that made things better, and the only ways
 * through are to keep the test aimed at code being deleted, or to loosen the
 * baseline for real code too.
 *
 * Removal condition: delete this constant and the two guards that read it in
 * the same commit that deletes src/plugin/methods/. If the directory is gone
 * and this is still here, the exclusion is hiding something.
 */
const RETIRING = /^src[\\/]plugin[\\/]methods[\\/]/;

function collect(dir) {
    const sources = new Map();
    const functions = new Map();

    for (const name of fs.readdirSync(dir)) {
        if (!name.endsWith('.json')) continue;
        let dump;
        try {
            dump = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
        } catch {
            // A worker killed mid-write leaves a truncated file; the others still count.
            continue;
        }
        for (const script of dump.result || []) {
            const file = toPath(script.url);
            if (!file || !isMeasured(file)) continue;

            if (!sources.has(file)) {
                let text;
                try {
                    text = fs.readFileSync(file, 'utf8');
                } catch {
                    continue;
                }
                sources.set(file, { text, state: new Uint8Array(text.length) });
            }
            const entry = sources.get(file);

            if (!functions.has(file)) functions.set(file, new Map());
            const seen = functions.get(file);

            const local = new Uint8Array(entry.text.length);
            for (const fn of script.functions || []) {
                const own = fn.ranges && fn.ranges[0];
                if (!own) continue;
                const key = `${own.startOffset}-${own.endOffset}`;
                seen.set(key, (seen.get(key) || false) || own.count > 0);
                applyRanges(local, fn.ranges);
            }
            mergeState(entry.state, local);
        }
    }

    const files = {};
    let funcTotal = 0;
    let funcHit = 0;
    let lineTotal = 0;
    let lineHit = 0;

    for (const [file, { text, state }] of sources) {
        const seen = functions.get(file) || new Map();
        let fnTotal = 0;
        let fnHit = 0;
        for (const covered of seen.values()) {
            fnTotal += 1;
            if (covered) fnHit += 1;
        }

        // A line counts only when it holds code V8 tracked: blank lines, and
        // lines outside every range, are neither covered nor uncovered.
        let lTotal = 0;
        let lHit = 0;
        let lineState = UNKNOWN;
        for (let i = 0; i <= text.length; i++) {
            const ch = i < text.length ? text[i] : '\n';
            if (ch === '\n') {
                if (lineState !== UNKNOWN) {
                    lTotal += 1;
                    if (lineState === COVERED) lHit += 1;
                }
                lineState = UNKNOWN;
                continue;
            }
            if (ch === ' ' || ch === '\t' || ch === '\r') continue;
            if (state[i] === COVERED) lineState = COVERED;
            else if (state[i] === UNCOVERED && lineState !== COVERED) lineState = UNCOVERED;
        }

        const relative = path.relative(ROOT, file);

        // Measured and reported, but kept out of the project-wide figure.
        if (!RETIRING.test(relative)) {
            funcTotal += fnTotal;
            funcHit += fnHit;
            lineTotal += lTotal;
            lineHit += lHit;
        }

        files[relative] = {
            line: percent(lHit, lTotal),
            func: percent(fnHit, fnTotal),
        };
    }

    return {
        all: { line: percent(lineHit, lineTotal), func: percent(funcHit, funcTotal) },
        files,
    };
}

/**
 * Every file under src/ has to appear in the report. Zero is the only acceptable
 * count, like the reachability gate - this is the check that was missing when
 * three migrated modules dropped out of the measurement and the recorded
 * percentage rose because they had left the denominator.
 *
 * A file absent here is not being measured by anything: not the ratchet, not its
 * floor. If a module legitimately cannot be loaded by any test, it needs a
 * reason and a removal condition recorded in this list, not silence.
 */
const UNMEASURED_ALLOWED = new Map();

function listSourceFiles(dir, found) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules') continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) listSourceFiles(full, found);
        else if (/\.[jt]s$/.test(entry.name)) found.push(path.relative(ROOT, full));
    }
    return found;
}

function checkMeasured(files) {
    const absent = listSourceFiles(path.join(ROOT, 'src'), [])
        .filter((file) => !(file in files) && !UNMEASURED_ALLOWED.has(file));
    if (absent.length === 0) return;

    console.error(`${absent.length} file(s) under src/ are absent from the coverage report:`);
    for (const file of absent) console.error(`  ${file}`);
    console.error('\nNothing measures them - not this ratchet, not their floor. Either give a test');
    console.error('a path that loads the module, or record a reason in UNMEASURED_ALLOWED.');
    process.exit(1);
}

function percent(hit, total) {
    if (total === 0) return 100;
    return Math.round((hit / total) * 10000) / 100;
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

    // A name that is not in the floors file has no floor to clear, and saying
    // it "clears" is worse than saying nothing: the report for one commit
    // claimed a floor pass for a module that had just been deleted.
    if (only && !(only in floors) && !(only.replace(/\.ts$/, '.js') in floors)) {
        console.error(`No coverage floor is recorded for ${only}.`);
        console.error('Check the name against .coverage-floors.json, or drop the --floor argument.');
        process.exit(1);
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
    const { all, files } = runCoverage();

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

    // --json answers a question about the current state; it is not a gate, and
    // it has to keep working while a gate is red. It used to sit behind
    // checkMeasured, which made it useless for the one job it was wanted for -
    // finding out *which* files had dropped out of the report.
    if (args.includes('--json')) {
        console.log(JSON.stringify({ all, files }, null, 4));
        return;
    }

    if (!all) {
        console.error('Could not read a coverage report from the test run.');
        process.exit(1);
    }

    checkMeasured(files);

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
