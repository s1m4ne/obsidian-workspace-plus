# Commit specs

## Contents
- How to use this
- Phase 2 commit 5 — i18n lock
- Phase 2 commit 6 — persisted data lock
- Phase 2 commit 7 — switch overlay lock
- Phase 2 commits 8–10 — search overlay locks
- Phase 2 commits 11–13 — modal, settings, menus
- Writing any lock

## How to use this

Issue #111 says *what* each commit delivers. This says what is peculiar about
the code it touches — the things that cost an afternoon if discovered while
writing rather than before.

It covers the near-term commits only. When Phase 3 begins, the specs for its
modules get written the same way, from measurement, not from memory.

## Phase 2 commit 5 — i18n lock

Target: `src/i18n.js`, 7,334 lines. Coverage today: 0.9% of functions.

**It is not one table.** Six string tables are merged by five loops that run at
module load:

| Table | Line |
|---|---|
| `STRINGS` | 43 |
| `EXTENDED_STRINGS` | 5496 |
| `NOTE_SESSION_STRINGS` | 6435 |
| `RESET_STRINGS` | 6589 |
| `RESTORE_STRINGS` | 6907 |
| `SESSION_STORAGE_STRINGS` | 7037 |

**Two different precedence rules are in play.** `i18n.js:6571` assigns
unconditionally — `NOTE_SESSION_STRINGS` overwrites whatever `EXTENDED_STRINGS`
had. The other four only fill gaps, e.g. `i18n.js:6583` writes solely when the
key is `undefined`. Flattening these in Phase 3 must preserve which rule applied
where, and the lock is the only thing that will notice if it does not.

**`resolveLocale` mutates.** It copies English into the resolved locale object in
place (`i18n.js:7332` region). The observable value is the one *after* that
merge, so the lock records the post-merge state, and calling `resolveLocale` for
one locale changes the module for every later caller. Resolve deliberately, and
do not assume purity.

**63 of the 320 keys are functions**, in two kinds:

- Those taking arguments — `created`, `deleted`, `modifiedMinutes`, `historyPanes`.
  Call each with representative values. Russian has three plural forms and Arabic
  has four, so pass 1, 2, 5 and 11 at minimum.
- Those taking none but branching on platform — `statusBarSlotAltClick`,
  `settingsStatusBarScrollModifierModOnly`. Record these under at least
  `PLATFORM.mac` and `PLATFORM.windows`; `harness.dom.setPlatform()` moves the
  single value both the stub and `navigator.platform` read.

**P15 — the language-switch path.** `exports.L` is a mutable module-level export
that `settings-context-menu.js:18`, `session-list-actions.js` and
`register-commands.js` capture at load time. Under CommonJS that copies a value,
so a stale `L` survives a language change. ESM `import` is a live binding and
would start updating. **The migration changes behaviour here on its own**, so the
lock must record what each caller sees after a switch, not just the resolved
table.

All 21 locales already carry all 320 keys, verified — so the runtime English
fallback is dead code, and typing `Strings` as a complete interface is achievable.

## Phase 2 commit 6 — persisted data lock

**The highest-stakes lock: this is users' sessions.**

Reuse the in-memory vault adapter in `tests/upgrade-path.test.js:24-45` rather
than rebuilding it — extract it into the harness. It fakes `exists`, `read`,
`write`, `remove`, `mkdir` over a plain object, which is all the storage code
touches.

Cover both storage locations (`plugin-folder`, `vault-folder`) and the legacy
migration paths. `session-sync.js:226-230` replaces all five session properties
at once when another device's data arrives; that path is what #105 added and what
the expand stage of P1 must not break.

Assert byte-level equality of the persisted JSON, not object equality. Key order
and formatting are part of what must not change.

## Phase 2 commit 7 — switch overlay lock

**Protects #107**, whose fix currently lives only in
`tests/session-switching.test.js` — an ordinary test that calls
`plugin.switchRelativeFromCommand` directly and is due to be rewritten in the
commit that restructures the switcher.

Two behaviours, both reachable through `runCommand`:

```ts
h.runCommand('next-session');
h.runCommand('next-session');
h.runCommand('next-session');   // must advance three sessions, not one
```

and: switching stays responsive when the active session is not in the current
view. Observe the outcome through persisted state or the rendered list, never
through the switcher.

Note `previewNext` / `previewPrevious` default to `true` (`default-data.js`), so
the first press only opens the overlay. Account for it or set them false.

## Phase 2 commits 8–10 — search overlay locks

Target: `openSearchOverlay`, ~1,000 lines with 20+ closures reaching 34 plugin
methods through `this`. Split three ways: render and filter, keyboard, drag and
resize.

The overlay builds its DOM with `document.createElement` (43 uses), so jsdom
alone suffices — the element extensions are not involved.

Coverage floor is **60%**, not 80%. Resize geometry and pointer sequences need
fakes elaborate enough to stop being evidence; the gap is covered by the manual
check.

Positioning reads `plugin.statusBarEl` (`overlays.js:751`) and caches
`_cachedBarHeight` / `_cachedAnchorCenterX`. In jsdom every rect is zero, so lock
the *structure and ordering*, not coordinates.

## Phase 2 commits 11–13 — modal, settings, menus

`session-manager-modal.js` uses the Obsidian element helpers (28 `createEl`
calls), so the harness patch matters here. Floor is **60%**; it sits at 2.6%.

The settings lock records the `Setting` call sequence — which rows, in what
order, with which handlers — through the recording stub, not the rendered DOM.
That sequence is what the Phase 3 `display()` adapter must reproduce once the
definitions become data.

Menus are recorded too: `h.obsidian.menus[0].item('Rename')?.trigger()` invokes
what a click would.

## Writing any lock

```ts
const h = setupHarness();
try {
    const mod = await import('../../src/plugin/methods/x.js');   // dynamic, always
    …
} finally {
    h.restore();
}
```

Static imports resolve while the module graph links, before `setupHarness()`
installs the hooks, and the real `obsidian` package has no runtime entry.

Then prove the lock works: break the behaviour it covers, confirm it fails,
revert, confirm it passes. Record that in the PR. A lock that cannot be made to
fail is rewritten.
