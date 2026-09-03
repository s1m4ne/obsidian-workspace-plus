// Behavior Lock: what every i18n key actually resolves to.
//
// The other i18n lock proves the shape holds - 318 keys in all 21 locales, the
// right types, plurals picking the right form. It does not prove the values are
//
// Edited deliberately, with the maintainer's authorization, at the commit that
// renamed three misleading keys and added `close`. The lock's job is to prove
// the *migration* did not move a string; a decided rename is not that, and the
// commit carries the proof that no value changed - every locale's set of string
// values is byte-identical before and after, checked across all 21.
//
//   save       -> create     the value was "Create"
//   saveInline -> save       the value was "Save"
//   load       -> switchTo   the value was "Switch"
//   + close                  the search overlay's close button had no key
//   - settingsGroupManageSessions, ...Desc   the modal that used them is gone
//
// 320 keys -> 319.
//
// Edited again, same authorization, at the commit that gave the three reset
// buttons one shared label:
//
//   settingsResetSessionsBtn -> settingsResetBtn   the shared "Reset" verb
//   - settingsResetSettingsBtn, settingsResetBackupsAndHistoryBtn
//
// No value changed: every locale already had a short reset verb in
// settingsResetSessionsBtn, and the three buttons now use it. 319 keys -> 317.
//
// And once more, restoring settingsResetBackupsAndHistoryBtn: that row deletes
// rather than resets, so its button says so. The 21 values were recovered from
// git, not retyped, which keeps the per-context wording a translator chose -
// Hindi uses मिटाएँ for deleting files against हटाएँ for deleting a session.
// 317 keys -> 318.
// unchanged, and a key can survive with the wrong text: two of the five merge
// loops in i18n.js use opposite precedence rules (6571 overwrites, 6583 fills
// only gaps), so flattening the six tables in Phase 3 can silently hand a key
// the value from the wrong table.
//
// Verified to catch that: changing one English string reports
// "en.modalTitle changed" and nothing else.
//
// The fixture holds one hash per key per locale rather than the values
// themselves - 293 KB instead of 610 KB, and still able to name what moved,
// which is what a diff across 21 new locale files needs.
//
// And once more, same authorization, for one description that was wrong in all
// 21 locales: settingsStatusBarModScrollSwitchDesc said scrolling switches
// sessions "while holding the selected modifier key", but
// statusBarScrollModifierMode defaults to 'none', which means the gesture fires
// only when *no* modifier is held. The text described a non-default
// configuration as the behaviour. The modifier is optional, and the new text
// says so. 318 keys, unchanged; one value per locale.
//
// RULE: Behavior Lock tests are NEVER edited during the refactor. If this fails,
// a translation changed. Regenerating the fixture is only correct when the change
// was intended and the maintainer has said so.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { setupHarness } from './harness/index.ts';

const FIXTURE = path.join(import.meta.dirname, 'fixtures', 'i18n-values.json');

// Kept in step with scripts/snapshot-i18n.js, which writes the fixture.
const PROBES: readonly (readonly unknown[])[] = [
    ['Session name'], [0], [1], [2], [5], [11], ['A', 'B'],
];

type Snapshot = Record<string, Record<string, string>>;
type Strings = Record<string, unknown>;

interface I18nModule {
    LANG_ORDER: readonly string[];
    resolveLocale(locale: string): Strings;
}

function readFixture(): Snapshot {
    const parsed: unknown = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
    if (typeof parsed !== 'object' || parsed === null) throw new Error('fixture is not an object');
    return parsed as Snapshot;
}

function hash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);
}

function fingerprint(value: unknown): string {
    if (typeof value !== 'function') return hash(String(value));
    const fn = value as (...args: unknown[]) => unknown;
    const results = PROBES.map((args) => {
        try {
            return String(fn(...args));
        } catch (error) {
            return 'THREW:' + (error as Error).name;
        }
    });
    return 'fn:' + hash(results.join(' '));
}

test('every key in every locale resolves to the value it resolved to before', async () => {
    const harness = setupHarness();
    try {
        const expected = readFixture();
        const i18n: I18nModule = await import('../../src/i18n.ts');

        const changed: string[] = [];
        const seen = new Set<string>();

        for (const locale of i18n.LANG_ORDER) {
            seen.add(locale);
            const before = expected[locale];
            assert.ok(before, `locale ${locale} is not in the fixture`);

            const strings = i18n.resolveLocale(locale);
            for (const key of Object.keys(strings)) {
                const recorded = before[key];
                if (recorded === undefined) {
                    changed.push(`${locale}.${key} added`);
                    continue;
                }
                if (fingerprint(strings[key]) !== recorded) {
                    changed.push(`${locale}.${key} changed`);
                }
            }
            for (const key of Object.keys(before)) {
                if (!(key in strings)) changed.push(`${locale}.${key} removed`);
            }
        }

        for (const locale of Object.keys(expected)) {
            assert.ok(seen.has(locale), `locale ${locale} disappeared from LANG_ORDER`);
        }

        assert.deepEqual(changed, [], `i18n values moved:\n  ${changed.slice(0, 30).join('\n  ')}`);
    } finally {
        harness.restore();
    }
});

test('the fixture covers every locale and key, so the comparison is not vacuous', () => {
    const expected = readFixture();
    const locales = Object.keys(expected);

    assert.equal(locales.length, 21);
    for (const locale of locales) {
        assert.equal(Object.keys(expected[locale] ?? {}).length, 318, `locale ${locale}`);
    }

    // 63 of the 318 are functions, recorded from their output rather than their
    // source, so a rewritten implementation with the same output still passes.
    const functionEntries = Object.values(expected.en ?? {}).filter((v) => v.startsWith('fn:'));
    assert.equal(functionEntries.length, 63);
});
