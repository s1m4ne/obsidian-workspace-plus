#!/usr/bin/env node
'use strict';

// tsconfig uses moduleResolution "bundler", which accepts a relative import with
// no extension. Node's runtime does not: it throws ERR_MODULE_NOT_FOUND, and the
// test suite runs .ts through Node directly. So the type checker cannot catch
// this class of mistake and something else has to.
//
// The same applies in reverse to the JavaScript still being migrated: once a
// module becomes paths.ts, `require('./paths')` stops resolving and the caller
// needs `require('./paths.ts')`.

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const RELATIVE_IMPORT = /(?:^|[^\w$])(?:import|export)[^'"]*?from\s*['"](\.[^'"]*)['"]|require\(\s*['"](\.[^'"]*)['"]\s*\)/g;

function walk(dir, out) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(abs, out);
        else if (/\.(js|ts)$/.test(entry.name)) out.push(abs);
    }
    return out;
}

function main() {
    const problems = [];

    for (const file of walk(SRC, [])) {
        const text = fs.readFileSync(file, 'utf8');
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            RELATIVE_IMPORT.lastIndex = 0;
            let m;
            while ((m = RELATIVE_IMPORT.exec(lines[i]))) {
                const specifier = m[1] || m[2];
                if (specifier === undefined) continue;

                // A directory import resolving to index.ts is fine for the bundler
                // but not for Node, so it is flagged the same way.
                if (specifier.endsWith('.ts')) continue;
                if (specifier.endsWith('.css') || specifier.endsWith('.json')) continue;
                // A specifier ending in .js that names a real .js file is
                // already resolvable. Only an extensionless one, or one whose
                // target has since become TypeScript, is a problem.
                if (specifier.endsWith('.js')
                    && fs.existsSync(path.resolve(path.dirname(file), specifier))) continue;

                const target = path.resolve(path.dirname(file), specifier);
                const isTs = fs.existsSync(target + '.ts') || fs.existsSync(path.join(target, 'index.ts'));
                // Untouched CommonJS pointing at CommonJS is still correct.
                if (!isTs && file.endsWith('.js')) continue;

                problems.push({
                    file: path.relative(path.join(__dirname, '..'), file),
                    line: i + 1,
                    specifier,
                });
            }
        }
    }

    if (problems.length === 0) {
        console.log('Import extensions OK.');
        return;
    }

    console.error(`Relative imports missing a .ts extension (${problems.length}):`);
    for (const p of problems) {
        console.error(`  ${p.file}:${p.line}  '${p.specifier}'  ->  '${p.specifier}.ts'`);
    }
    console.error('\nNode resolves .ts only with the explicit extension; tsc does not catch this.');
    process.exit(1);
}

main();
