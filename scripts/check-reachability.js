#!/usr/bin/env node
'use strict';

// Five times during this migration, code was written, tested, reported complete
// and never ran. Twice the whole file was unreachable from the plugin entry:
//
//   SessionStorage and SyncWatcher   1,235 lines, never instantiated
//   storage/migrations.ts               77 lines, never imported
//
// Both times every gate was green, because the code they replaced was still
// there doing the work. That is the strangler pattern's safety property and its
// blind spot at once: old and new coexist, so nothing fails when only the old
// one runs. The other gates ask "does the plugin still work?" - which the old
// path guarantees. This one asks the question none of them did: "is the new code
// on the path that runs?"
//
// It answers at file granularity, using the bundler as the authority on what
// actually ships. Zero unreachable files is the only acceptable count; a file
// that has to stay out needs an entry below with a reason and a removal
// condition.

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ENTRY = 'src/main.ts';

// Reachable from the tests but deliberately not from the plugin entry.
const ALLOWED = new Map([
    [
        'src/plugin/register-commands.js',
        'Behavior Lock suites import it to register commands; main.js goes through '
        + 'getCommandRegistry(). Locks are never edited, so it stays until they are '
        + 'retired at the end of issue #111.',
    ],
]);

function walk(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, out);
        else if (/\.(ts|js)$/.test(entry.name)) out.push(path.relative(ROOT, full));
    }
    return out;
}

async function main() {
    const result = await esbuild.build({
        entryPoints: [ENTRY],
        bundle: true,
        write: false,
        metafile: true,
        platform: 'browser',
        format: 'cjs',
        external: ['obsidian', 'electron', '@codemirror/*', '@lezer/*'],
        logLevel: 'silent',
    });

    const reached = new Set(Object.keys(result.metafile.inputs));
    const unreachable = walk(path.join(ROOT, 'src')).filter((f) => !reached.has(f));

    const unexplained = unreachable.filter((f) => !ALLOWED.has(f));
    const explained = unreachable.filter((f) => ALLOWED.has(f));

    if (unexplained.length > 0) {
        console.error(`Unreachable from ${ENTRY} (${unexplained.length}):`);
        for (const f of unexplained) console.error(`  ${f}`);
        console.error('\nNothing in this file runs in Obsidian, whatever its tests say. Wire it');
        console.error('into the path that ships, delete it, or - if it must stay out - add it to');
        console.error('ALLOWED in this script with a reason and the condition for removing it.');
        process.exit(1);
    }

    const suffix = explained.length > 0 ? ` (${explained.length} allowed out)` : '';
    console.log(`Every file reaches ${ENTRY}${suffix}.`);
}

main().catch((error) => {
    console.error(`Reachability check could not run: ${error.message}`);
    process.exit(1);
});
