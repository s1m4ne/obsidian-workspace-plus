#!/usr/bin/env node
'use strict';

// Records what every i18n key resolves to, for every locale, as the fixture the
// Behavior Lock compares against.
//
// A full value dump is 610 KB, which is too much to keep in the repository and
// to read in a diff. A single hash per locale is 21 lines but tells you only
// that "ja changed" - useless when 21 locale files are being split apart.
//
// So: one hash per key per locale, keyed by name. That is the smallest form that
// still names the key that moved, which is the whole point of the lock.
//
//   node scripts/snapshot-i18n.js            verify against the fixture
//   node scripts/snapshot-i18n.js --update   regenerate it

const { createHash } = require('node:crypto');
const fs = require('fs');
const path = require('path');

const FIXTURE = path.join(__dirname, '..', 'tests', 'lock', 'fixtures', 'i18n-values.json');

// Function-valued keys are called with each of these. The numbers cover the
// plural boundaries that Russian (3 forms), Arabic (4) and Polish need; the
// strings cover the one- and two-argument message builders.
const PROBES = [['Session name'], [0], [1], [2], [5], [11], ['A', 'B']];

function hash(value) {
    return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

async function collect() {
    const { installObsidianStub } = await import('../tests/lock/harness/index.ts');
    installObsidianStub();
    const i18n = await import('../src/i18n.ts');

    const snapshot = {};
    for (const locale of i18n.LANG_ORDER) {
        const strings = i18n.resolveLocale(locale);
        const record = {};
        for (const key of Object.keys(strings).sort()) {
            const value = strings[key];
            if (typeof value === 'function') {
                const results = PROBES.map((args) => {
                    try {
                        return String(value(...args));
                    } catch (error) {
                        return 'THREW:' + error.name;
                    }
                });
                record[key] = 'fn:' + hash(results.join(' '));
            } else {
                record[key] = hash(String(value));
            }
        }
        snapshot[locale] = record;
    }
    return snapshot;
}

function diff(expected, actual) {
    const problems = [];
    for (const locale of Object.keys(expected)) {
        if (!actual[locale]) {
            problems.push('locale ' + locale + ' is gone');
            continue;
        }
        const before = expected[locale];
        const after = actual[locale];
        for (const key of Object.keys(before)) {
            if (!(key in after)) problems.push(locale + '.' + key + ' removed');
            else if (before[key] !== after[key]) problems.push(locale + '.' + key + ' changed');
        }
        for (const key of Object.keys(after)) {
            if (!(key in before)) problems.push(locale + '.' + key + ' added');
        }
    }
    for (const locale of Object.keys(actual)) {
        if (!expected[locale]) problems.push('locale ' + locale + ' added');
    }
    return problems;
}

async function main() {
    const snapshot = await collect();

    if (process.argv.includes('--update')) {
        fs.mkdirSync(path.dirname(FIXTURE), { recursive: true });
        fs.writeFileSync(FIXTURE, JSON.stringify(snapshot, null, 0) + '\n');
        const locales = Object.keys(snapshot).length;
        const keys = Object.keys(snapshot.en).length;
        const size = (fs.statSync(FIXTURE).size / 1024).toFixed(0);
        console.log('Recorded ' + locales + ' locales x ' + keys + ' keys (' + size + ' KB).');
        return;
    }

    if (!fs.existsSync(FIXTURE)) {
        console.error('No fixture. Run: node scripts/snapshot-i18n.js --update');
        process.exit(1);
    }

    const problems = diff(JSON.parse(fs.readFileSync(FIXTURE, 'utf8')), snapshot);
    if (problems.length === 0) {
        console.log('i18n values match the recorded fixture.');
        return;
    }

    console.error('i18n values changed (' + problems.length + '):');
    for (const problem of problems.slice(0, 40)) console.error('  ' + problem);
    if (problems.length > 40) console.error('  ... and ' + (problems.length - 40) + ' more');
    process.exit(1);
}

main();
