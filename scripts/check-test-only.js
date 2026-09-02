#!/usr/bin/env node
'use strict';

// A method or exported function that only tests ever reach.
//
// `switchRelativeImmediate` had six passing tests and no caller in `src/` at
// all: the overlay it appeared to serve calls `switchSession` directly. Four of
// its siblings had no caller anywhere. Nothing else could see it - every one
// was typed, linted, reachable through its file, and covered, because tests
// were the thing covering it.
//
// The existing reachability gate asks the bundler whether every *file* reaches
// src/main.ts. This is the same question one level down, and it needs the type
// checker rather than the bundler: the answer is "which declarations does
// anything in src/ refer to".
//
//   node scripts/check-test-only.js
//   node scripts/check-test-only.js --list   also print the recorded allowances
//
// This is a ratchet with reasons rather than a zero: a handful of members exist
// so a test can observe state that has no production reader, which is a
// legitimate thing for a test to need. Each one is recorded below with why.

const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Recorded, with the reason. A new entry needs one; that is the whole point.
const ALLOWED = new Map([
    ['src/state/history-service.ts getSnapshotTimer', 'Reads the timer handle so a test can assert the snapshot timer started and stopped. Production starts and stops it and never asks.'],
    ['src/storage/sync-watcher.ts hasActiveTimers', 'Same shape: nine tests assert the watcher left no timer behind on unload. Production has nothing to ask.'],
    ['src/state/session-switcher.ts isStartupSettling', 'The settle window is observable only as a side effect; production reads isStartupSettleActive instead.'],
    ['src/state/session-store.ts isGroupNameTaken', 'The validation path production uses is createGroupValidated, which calls into GroupStore. This is the predicate on its own, kept for the tests that pin the rule.'],
    ['src/state/session-switcher.ts getRelativeSwitchBaseId', 'Reads which id relative switching counts from. Production reaches it through getRelativeSwitchContext.'],
    ['src/storage/persistence-service.ts setGlobalSettings', 'The setter half of a pair whose getter production uses; the tests seed through it.'],
    ['src/storage/persistence-service.ts getPluginStorageDirPath', 'Production resolves paths through getSessionStorageDirPathForLocation. This names the plugin-folder case for the tests that pin it.'],
    ['src/state/session-store.ts getSession', 'Production goes through findSession, which reports absence; this throws instead, and the tests pin both.'],
    ['src/core/command-registry.ts registerCommands', 'Called on the class by main.ts. The export is the free-function form the wiring tests use.'],
    ['src/core/command-registry.ts syncSessionCommands', 'Same as registerCommands.'],
    ['src/statusbar-controller.ts handleStatusBarWheel', 'The free-function form of the controller method, kept for the wheel-gesture tests.'],
    ['src/storage/session-sync.ts isSessionStorageInfoNewerForHost', 'The comparison on its own; production reaches it inside mergeExternalSessionData.'],
]);

function loadService() {
    const configPath = ts.findConfigFile(ROOT, ts.sys.fileExists, 'tsconfig.json');
    const config = ts.readConfigFile(configPath, ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(configPath));
    const files = parsed.fileNames;

    const host = {
        getScriptFileNames: () => files,
        getScriptVersion: () => '1',
        getScriptSnapshot: (name) => (fs.existsSync(name)
            ? ts.ScriptSnapshot.fromString(fs.readFileSync(name, 'utf8'))
            : undefined),
        getCurrentDirectory: () => ROOT,
        getCompilationSettings: () => parsed.options,
        getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
        fileExists: ts.sys.fileExists,
        readFile: ts.sys.readFile,
        readDirectory: ts.sys.readDirectory,
        directoryExists: ts.sys.directoryExists,
        getDirectories: ts.sys.getDirectories,
    };
    return ts.createLanguageService(host, ts.createDocumentRegistry());
}

const service = loadService();
const program = service.getProgram();
const rel = (file) => path.relative(ROOT, file);
const inSrc = (file) => rel(file).startsWith('src/');
const inTests = (file) => rel(file).startsWith('tests/');

const findings = [];

for (const source of program.getSourceFiles()) {
    if (!inSrc(source.fileName) || source.fileName.includes('node_modules')) continue;

    const visit = (node) => {
        let nameNode = null;
        let kind = null;

        if (ts.isMethodDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
            nameNode = node.name;
            kind = 'method';
        } else if (
            ts.isFunctionDeclaration(node)
            && node.name
            && node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
        ) {
            nameNode = node.name;
            kind = 'exported function';
        }

        if (nameNode) {
            const position = nameNode.getStart();
            const references = service.getReferencesAtPosition(source.fileName, position) || [];
            const elsewhere = references.filter((r) =>
                !(r.fileName === source.fileName && r.textSpan.start === position));
            const fromSrc = elsewhere.filter((r) => inSrc(r.fileName));
            const fromTests = elsewhere.filter((r) => inTests(r.fileName));

            // Only "tests reach it and src does not". A declaration nothing at
            // all refers to is usually an interface implementation - onload,
            // getItems, the *Host members main.ts satisfies - and that column
            // was 69 entries of false positives, so it is not reported.
            if (fromSrc.length === 0 && fromTests.length > 0) {
                findings.push({
                    key: `${rel(source.fileName)} ${nameNode.text}`,
                    line: source.getLineAndCharacterOfPosition(position).line + 1,
                    kind,
                    tests: fromTests.length,
                });
            }
        }
        ts.forEachChild(node, visit);
    };
    ts.forEachChild(source, visit);
}

const unexplained = findings.filter((f) => !ALLOWED.has(f.key));
const stale = [...ALLOWED.keys()].filter((key) => !findings.some((f) => f.key === key));

if (process.argv.includes('--list')) {
    for (const finding of findings) {
        const note = ALLOWED.get(finding.key);
        console.log(`${finding.key}:${finding.line}  (${finding.tests} tests)`);
        console.log(`    ${note ? note : 'NOT RECORDED'}`);
    }
}

let failed = false;

if (unexplained.length > 0) {
    failed = true;
    console.error(`\n${unexplained.length} member(s) that only tests reach:\n`);
    for (const finding of unexplained) {
        console.error(`  ${finding.key.replace(' ', ':' + finding.line + ' ')}  ${finding.kind}, ${finding.tests} test reference(s)`);
    }
    console.error('\nEither production should be calling it, or it should go. If a test'
        + '\ngenuinely needs to observe something production does not, record it in'
        + '\nALLOWED in this script with the reason.');
}

if (stale.length > 0) {
    failed = true;
    console.error(`\n${stale.length} recorded allowance(s) no longer apply - production reaches these now, or they are gone:\n`);
    for (const key of stale) console.error(`  ${key}`);
    console.error('\nRemove them from ALLOWED.');
}

if (failed) process.exit(1);
console.log(`No unexplained test-only members (${findings.length} recorded).`);
