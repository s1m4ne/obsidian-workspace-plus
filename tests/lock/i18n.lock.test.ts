// Behavior Lock: i18n
//
// Locks the resolved i18n fixed point after all 6 string tables and 5 merge
// loops have executed. Captures all 319 keys across all 21 locales, calling
// all 63 function-valued keys with representative arguments (including Russian
// 3-form and Arabic 4-form plurals) and under both Mac and Windows platforms.
//
// Also locks the language resolution logic and the P15 language-switch path.
//
// RULE: Behavior Lock tests in tests/lock/ are NEVER edited during the refactor.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './harness/index.ts';
import { PLATFORM } from './harness/dom.ts';

const EXPECTED_LOCALES = [
    'en', 'zh', 'zh-TW', 'ja', 'ko', 'es', 'fr', 'ar', 'pt', 'ru',
    'de', 'it', 'tr', 'id', 'vi', 'th', 'hi', 'bn', 'fa', 'ms', 'pl',
] as const;

// 318 -> 319 -> 321 -> 316 with the maintainer's authorization: a description
// for the status-bar page, the two keys the backup pool's generation count
// needs, the five belonging to the overlay focus setting that was dropped, and
// then three for the settings wording pass.
// See the notes in i18n-values.lock.test.ts, which carry the reasons.
const EXPECTED_KEY_COUNT = 319;
const EXPECTED_FUNCTION_KEY_COUNT = 63;

interface I18nModule {
    LANG_OPTIONS: Record<string, string>;
    LANG_ORDER: readonly string[];
    L: Record<string, unknown>;
    resolveLocale(override?: string): Record<string, unknown>;
}

async function loadI18n(): Promise<I18nModule> {
    const raw: unknown = await import('../../src/i18n.ts');
    const rec = raw as { default?: I18nModule } & I18nModule;
    return rec.default ?? rec;
}

test('i18n exposes all 21 supported locales in LANG_ORDER and LANG_OPTIONS', async () => {
    const h = setupHarness();
    try {
        const i18n = await loadI18n();

        assert.deepEqual(i18n.LANG_ORDER, EXPECTED_LOCALES);
        assert.equal(Object.keys(i18n.LANG_OPTIONS).length, 21);

        for (const loc of EXPECTED_LOCALES) {
            assert.ok(i18n.LANG_OPTIONS[loc], `LANG_OPTIONS missing ${loc}`);
            assert.equal(typeof i18n.LANG_OPTIONS[loc], 'string');
        }
    } finally {
        h.restore();
    }
});

test('every locale contains exactly all 319 keys and matches English keys', async () => {
    const h = setupHarness();
    try {
        const i18n = await loadI18n();
        const en = i18n.resolveLocale('en');
        const enKeys = Object.keys(en).sort();

        assert.equal(enKeys.length, EXPECTED_KEY_COUNT, `Expected ${EXPECTED_KEY_COUNT} keys in en, got ${enKeys.length}`);

        const functionKeys = enKeys.filter(k => typeof en[k] === 'function');
        assert.equal(functionKeys.length, EXPECTED_FUNCTION_KEY_COUNT, `Expected ${EXPECTED_FUNCTION_KEY_COUNT} function keys in en, got ${functionKeys.length}`);

        for (const loc of EXPECTED_LOCALES) {
            const strings = i18n.resolveLocale(loc);
            const locKeys = Object.keys(strings).sort();

            assert.equal(locKeys.length, EXPECTED_KEY_COUNT, `Locale ${loc} has ${locKeys.length} keys, expected ${EXPECTED_KEY_COUNT}`);
            assert.deepEqual(locKeys, enKeys, `Key set mismatch in locale ${loc}`);

            for (const key of enKeys) {
                const val = strings[key];
                assert.ok(val !== undefined, `Locale ${loc} has undefined for key "${key}"`);
                assert.equal(typeof val, typeof en[key], `Type mismatch for key "${key}" in locale ${loc}`);
                if (typeof val === 'string') {
                    assert.ok(val.length > 0, `Empty string for key "${key}" in locale ${loc}`);
                }
            }
        }
    } finally {
        h.restore();
    }
});

test('platform-branching keys resolve differently between macOS and Windows', async () => {
    const h = setupHarness();
    try {
        const i18n = await loadI18n();

        const platformKeys = [
            'statusBarSlotAltClick',
            'statusBarSlotModClick',
            'statusBarSlotShiftClick',
            'statusBarSlotAltMiddleClick',
            'statusBarSlotModMiddleClick',
            'statusBarSlotShiftMiddleClick',
            'statusBarSlotAltRightClick',
            'statusBarSlotModRightClick',
            'statusBarSlotShiftRightClick',
            'settingsStatusBarScrollModifierModOnly',
            'settingsStatusBarScrollModifierAltOnly',
            'settingsStatusBarScrollModifierModOrAlt',
        ] as const;

        h.dom.setPlatform(PLATFORM.mac);
        const enMac = i18n.resolveLocale('en');

        const macOutputs: Record<string, string> = {};
        for (const k of platformKeys) {
            const fn = enMac[k] as () => string;
            assert.equal(typeof fn, 'function', `Expected function for ${k}`);
            macOutputs[k] = fn();
        }

        assert.equal(macOutputs.statusBarSlotModClick, '⌘ + Click');
        assert.equal(macOutputs.statusBarSlotAltClick, '⌥ + Click');
        assert.equal(macOutputs.statusBarSlotShiftClick, '⇧ + Click');
        assert.equal(macOutputs.statusBarSlotModMiddleClick, '⌘ + Middle-click');
        assert.equal(macOutputs.statusBarSlotModRightClick, '⌘ + Right-click');
        assert.equal(macOutputs.settingsStatusBarScrollModifierModOnly, 'Cmd only');
        assert.equal(macOutputs.settingsStatusBarScrollModifierAltOnly, 'Option only');
        assert.equal(macOutputs.settingsStatusBarScrollModifierModOrAlt, 'Cmd or Option');

        h.dom.setPlatform(PLATFORM.windows);
        const enWin = i18n.resolveLocale('en');

        const winOutputs: Record<string, string> = {};
        for (const k of platformKeys) {
            const fn = enWin[k] as () => string;
            assert.equal(typeof fn, 'function', `Expected function for ${k}`);
            winOutputs[k] = fn();
        }

        assert.equal(winOutputs.statusBarSlotModClick, 'Ctrl + Click');
        assert.equal(winOutputs.statusBarSlotAltClick, 'Alt + Click');
        assert.equal(winOutputs.statusBarSlotShiftClick, 'Shift + Click');
        assert.equal(winOutputs.statusBarSlotModMiddleClick, 'Ctrl + Middle-click');
        assert.equal(winOutputs.statusBarSlotModRightClick, 'Ctrl + Right-click');
        assert.equal(winOutputs.settingsStatusBarScrollModifierModOnly, 'Ctrl only');
        assert.equal(winOutputs.settingsStatusBarScrollModifierAltOnly, 'Alt only');
        assert.equal(winOutputs.settingsStatusBarScrollModifierModOrAlt, 'Ctrl or Alt');

        for (const k of platformKeys) {
            assert.notEqual(macOutputs[k], winOutputs[k], `Platform key "${k}" did not branch between Mac and Win`);
        }
    } finally {
        h.restore();
    }
});

test('plural rules execute correctly across representative values in Russian, Arabic, Polish, and English', async () => {
    const h = setupHarness();
    try {
        const i18n = await loadI18n();

        // English: 1 -> singular, other -> plural
        const en = i18n.resolveLocale('en');
        const enMin = en.modifiedMinutes as (n: number) => string;
        assert.equal(enMin(1), 'Modified 1 minute ago');
        assert.equal(enMin(2), 'Modified 2 minutes ago');
        assert.equal(enMin(5), 'Modified 5 minutes ago');
        assert.equal(enMin(11), 'Modified 11 minutes ago');
        assert.equal(enMin(21), 'Modified 21 minutes ago');

        const enBulkDel = en.bulkDeleted as (n: number) => string;
        assert.equal(enBulkDel(1), '1 sessions deleted');
        assert.equal(enBulkDel(5), '5 sessions deleted');

        // Russian 3-form plural:
        // mod100 in 11..14 -> many ('минут', 'сессий')
        // mod10 == 1 -> one ('минуту', 'сессию')
        // mod10 in 2..4 -> few ('минуты', 'сессии')
        // other -> many
        const ru = i18n.resolveLocale('ru');
        const ruMin = ru.modifiedMinutes as (n: number) => string;
        assert.equal(ruMin(1), 'Изменено 1 минуту назад');
        assert.equal(ruMin(2), 'Изменено 2 минуты назад');
        assert.equal(ruMin(4), 'Изменено 4 минуты назад');
        assert.equal(ruMin(5), 'Изменено 5 минут назад');
        assert.equal(ruMin(11), 'Изменено 11 минут назад');
        assert.equal(ruMin(12), 'Изменено 12 минут назад');
        assert.equal(ruMin(21), 'Изменено 21 минуту назад');
        assert.equal(ruMin(22), 'Изменено 22 минуты назад');
        assert.equal(ruMin(25), 'Изменено 25 минут назад');

        const ruHours = ru.modifiedHours as (n: number) => string;
        assert.equal(ruHours(1), 'Изменено 1 час назад');
        assert.equal(ruHours(2), 'Изменено 2 часа назад');
        assert.equal(ruHours(5), 'Изменено 5 часов назад');
        assert.equal(ruHours(11), 'Изменено 11 часов назад');
        assert.equal(ruHours(21), 'Изменено 21 час назад');

        const ruDays = ru.modifiedDays as (n: number) => string;
        assert.equal(ruDays(1), 'Изменено 1 день назад');
        assert.equal(ruDays(2), 'Изменено 2 дня назад');
        assert.equal(ruDays(5), 'Изменено 5 дней назад');

        const ruGroupRemove = ru.confirmRemoveAllFromGroup as (g: string, n: number) => string;
        assert.equal(ruGroupRemove('Work', 1), 'Убрать все 1 сессию из «Work»?');
        assert.equal(ruGroupRemove('Work', 2), 'Убрать все 2 сессии из «Work»?');
        assert.equal(ruGroupRemove('Work', 5), 'Убрать все 5 сессий из «Work»?');
        assert.equal(ruGroupRemove('Work', 11), 'Убрать все 11 сессий из «Work»?');

        // Arabic 4-form plural:
        // n == 1 -> one
        // n == 2 -> two (dual)
        // n <= 10 -> n + few
        // other -> n + many
        const ar = i18n.resolveLocale('ar');
        const arMin = ar.modifiedMinutes as (n: number) => string;
        assert.equal(arMin(1), 'تم التعديل منذ دقيقة');
        assert.equal(arMin(2), 'تم التعديل منذ دقيقتين');
        assert.equal(arMin(3), 'تم التعديل منذ 3 دقائق');
        assert.equal(arMin(5), 'تم التعديل منذ 5 دقائق');
        assert.equal(arMin(10), 'تم التعديل منذ 10 دقائق');
        assert.equal(arMin(11), 'تم التعديل منذ 11 دقيقة');
        assert.equal(arMin(25), 'تم التعديل منذ 25 دقيقة');

        const arHours = ar.modifiedHours as (n: number) => string;
        assert.equal(arHours(1), 'تم التعديل منذ ساعة');
        assert.equal(arHours(2), 'تم التعديل منذ ساعتين');
        assert.equal(arHours(5), 'تم التعديل منذ 5 ساعات');
        assert.equal(arHours(11), 'تم التعديل منذ 11 ساعة');

        // Polish
        const pl = i18n.resolveLocale('pl');
        const plMin = pl.modifiedMinutes as (n: number) => string;
        assert.equal(plMin(1), 'Zmodyfikowano 1 min temu');
        assert.equal(plMin(2), 'Zmodyfikowano 2 min temu');
        assert.equal(plMin(5), 'Zmodyfikowano 5 min temu');

        // Japanese: no plural inflection
        const ja = i18n.resolveLocale('ja');
        const jaMin = ja.modifiedMinutes as (n: number) => string;
        assert.equal(jaMin(1), '1分前に変更');
        assert.equal(jaMin(5), '5分前に変更');
        assert.equal(jaMin(11), '11分前に変更');
    } finally {
        h.restore();
    }
});

test('all 63 function keys evaluate without errors across all 21 locales with representative arguments', async () => {
    const h = setupHarness();
    try {
        const i18n = await loadI18n();

        for (const loc of EXPECTED_LOCALES) {
            const strings = i18n.resolveLocale(loc);

            for (const [key, val] of Object.entries(strings)) {
                if (typeof val !== 'function') continue;

                const fn = val as (...args: unknown[]) => string;
                if (fn.length === 0) {
                    const res = fn();
                    assert.equal(typeof res, 'string', `${loc}.${key}() did not return string`);
                    assert.ok(res.length > 0, `${loc}.${key}() returned empty string`);
                } else if (fn.length === 1) {
                    // Test numeric inputs
                    for (const num of [1, 2, 5, 11, 21]) {
                        const resNum = fn(num);
                        assert.equal(typeof resNum, 'string', `${loc}.${key}(${num}) did not return string`);
                        assert.ok(resNum.length > 0, `${loc}.${key}(${num}) returned empty string`);
                    }
                    // Test string inputs
                    const resStr = fn('TestName');
                    assert.equal(typeof resStr, 'string', `${loc}.${key}('TestName') did not return string`);
                    assert.ok(resStr.length > 0, `${loc}.${key}('TestName') returned empty string`);
                } else if (fn.length === 2) {
                    // Test (string, string) and (string, number) and (number, string)
                    for (const num of [1, 2, 5, 11]) {
                        const res1 = fn('Primary', num);
                        assert.equal(typeof res1, 'string', `${loc}.${key}('Primary', ${num}) did not return string`);
                        assert.ok(res1.length > 0, `${loc}.${key}('Primary', ${num}) returned empty string`);

                        const res2 = fn(num, 'Secondary');
                        assert.equal(typeof res2, 'string', `${loc}.${key}(${num}, 'Secondary') did not return string`);
                        assert.ok(res2.length > 0, `${loc}.${key}(${num}, 'Secondary') returned empty string`);
                    }
                    const resStrStr = fn('FirstName', 'SecondName');
                    assert.equal(typeof resStrStr, 'string', `${loc}.${key}('FirstName', 'SecondName') did not return string`);
                    assert.ok(resStrStr.length > 0, `${loc}.${key}('FirstName', 'SecondName') returned empty string`);
                }
            }
        }
    } finally {
        h.restore();
    }
});

test('resolveLocale resolves language correctly from auto and explicit codes', async () => {
    const h = setupHarness();
    try {
        const i18n = await loadI18n();

        // Explicit locales
        const ja = i18n.resolveLocale('ja');
        assert.equal(ja.create, '作成');

        const fr = i18n.resolveLocale('fr');
        assert.equal(fr.create, 'Créer');

        const de = i18n.resolveLocale('de');
        assert.equal(de.create, 'Erstellen');

        // Navigator auto detection
        const win = h.dom.window;

        // Chinese variants
        Object.defineProperty(win.navigator, 'language', { value: 'zh-CN', configurable: true });
        const zhCN = i18n.resolveLocale('auto');
        assert.equal(zhCN.create, '创建');

        Object.defineProperty(win.navigator, 'language', { value: 'zh-TW', configurable: true });
        const zhTW = i18n.resolveLocale('auto');
        assert.equal(zhTW.create, '建立');

        Object.defineProperty(win.navigator, 'language', { value: 'zh-HK', configurable: true });
        const zhHK = i18n.resolveLocale('auto');
        assert.equal(zhHK.create, '建立');

        // General prefix matching
        Object.defineProperty(win.navigator, 'language', { value: 'ja-JP', configurable: true });
        const jaJP = i18n.resolveLocale('auto');
        assert.equal(jaJP.create, '作成');

        Object.defineProperty(win.navigator, 'language', { value: 'en-US', configurable: true });
        const enUS = i18n.resolveLocale('auto');
        assert.equal(enUS.create, 'Create');

        // Unknown locale falls back to en
        Object.defineProperty(win.navigator, 'language', { value: 'xyz-UNKNOWN', configurable: true });
        const fallback = i18n.resolveLocale('auto');
        assert.equal(fallback.create, 'Create');
    } finally {
        h.restore();
    }
});

test('P15 language-switch path: resolveLocale updates exports.L and leaves live bindings updated', async () => {
    const h = setupHarness();
    try {
        const i18n = await loadI18n();

        i18n.resolveLocale('en');
        assert.equal((i18n.L as Record<string, string>).create, 'Create');

        const enRef = i18n.L;

        i18n.resolveLocale('ja');
        assert.equal((i18n.L as Record<string, string>).create, '作成');
        // Under CommonJS exports.L is reassigned; enRef remains the old object
        assert.equal((enRef as Record<string, string>).create, 'Create');
        assert.notEqual(i18n.L, enRef);

        i18n.resolveLocale('de');
        assert.equal((i18n.L as Record<string, string>).create, 'Erstellen');
    } finally {
        h.restore();
    }
});

test('precedence and table merge consistency across all 6 string tables', async () => {
    const h = setupHarness();
    try {
        const i18n = await loadI18n();
        const en = i18n.resolveLocale('en');

        // From NOTE_SESSION_STRINGS
        assert.equal(en.cmdSaveCurrentNoteNameAsSession, 'Save current note name as session');
        assert.equal(en.noActiveMarkdownFile, 'No active Markdown note.');
        assert.equal((en.savedCurrentNoteNameAsSession as (n: string) => string)('MyNote'), 'Saved current note as session "MyNote"');

        // From RESET_STRINGS
        assert.equal(en.settingsResetBackupsAndHistory, 'Delete backups and version history');
        assert.equal(en.settingsResetSessionsAndSettings, 'Reset all');

        // From RESTORE_STRINGS
        assert.equal(en.settingsSubsectionSessionRestore, 'Session restore');
        assert.equal(en.settingsRestoreSidebars, 'Restore sidebars');

        // From SESSION_STORAGE_STRINGS
        assert.equal(en.settingsSessionStorageLocation, 'Session storage location');
        assert.equal(en.settingsVaultOnlySessions, 'Keep sessions in this vault only');
        assert.equal((en.sessionStorageMoved as (p: string) => string)('path/to/sessions.json'), 'Workspace++: Session storage moved to path/to/sessions.json');
    } finally {
        h.restore();
    }
});
