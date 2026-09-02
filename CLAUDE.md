# Workspace++

A session manager for Obsidian workspaces, published in the community plugin
directory. `src/` is TypeScript with owned state and real classes, bundled by
esbuild into `main.js` (which is generated, not tracked).

## Issue #111 is code-complete and not yet verified by hand

Issue #111 rewrote `src/` from 18k lines of ES5 CommonJS. All five phases are
committed; **the plugin has not been exercised in Obsidian since commit 34a**,
and the modal, overlay and status-bar construction paths have all changed since.
That check comes before the merge, and nothing here should be described as
verified until it has happened.

Where it landed, measured rather than claimed:

```
TypeScript                45 / 45 files          prototype methods    0  (from 309)
CommonJS requires         0                      lint                40  (from 255)
plugin.data reads         226, 190 of them inside an owner
... from outside an owner 36  (from ~145)        coverage            92% (from 22%)
417 tests, 11 gates green
```

The constraint was that **observable behaviour must not change** apart from four
named exceptions in Phase 4 and one authorized during Phase 3, all recorded in
the issue. The forty remaining lint violations are all recorded suppressions,
also explained there.

**Before touching anything under `src/` or `tests/`:**

```bash
node scripts/progress.js     # where things stand, measured
gh issue view 111            # the plan, and the record of what was decided
```

Then read `.claude/skills/refactoring-workspace-plus/SKILL.md`. It carries the
rules that make this safe, and they are not obvious from the code:

- Behavior Lock tests in `tests/lock/` are **never edited**. If one fails, the
  refactor broke something. If the test itself looks wrong, stop and ask.
- One module per commit, and every commit stays green.
- Evidence before claims: if you have not run the command in this message, you
  cannot say it passes.

Two sibling documents own the details. Read both before writing `.ts` or touching
UI, events, storage or styles:

```
.claude/skills/writing-typescript/SKILL.md     how to write the code    133 lines
.claude/skills/obsidian/SKILL.md               the plugin guidelines    360 lines
```

Each has a `reference/` directory beside it. Those are not for reading front to
back - `obsidian/reference/` alone is 3,264 lines. Open one when its subject is
the thing in front of you:

| Reading | When |
|---|---|
| `refactoring-workspace-plus/reference/commit-specs.md` | before writing the commit you are on - it records what is peculiar about that module |
| `refactoring-workspace-plus/reference/behavior-lock.md` | a lock failed, or you are tempted to edit one |
| `refactoring-workspace-plus/reference/architecture.md` | a module does not fit the planned class boundary |
| `refactoring-workspace-plus/reference/design-targets.md` | the P-number your commit carries |
| `writing-typescript/reference/patterns.md` | class composition, options objects, frozen schemas |
| `writing-typescript/reference/typing-obsidian.md` | typing an undocumented Obsidian API |
| `obsidian/reference/css-styling.md`, `ui-ux.md` | building or moving DOM - commits 25-31 |
| `obsidian/reference/memory-management.md` | listeners, timers, anything with a lifetime |
| `obsidian/reference/accessibility.md` | Phase 4 (P12) |
| `obsidian/reference/community-scanner.md`, `submission.md` | Phase 4 and release |

`AGENTS.md` and `GEMINI.md` are symlinks to this file, so every assistant reads
the same instructions. There is nothing else to configure.

`refactoring-workspace-plus/reference/commit-specs.md` carries what is peculiar
about the code each commit of the migration touched. It is a record now rather
than a plan, and still the fastest way to find out why a module looks the way it
does.

## Commands

```bash
npm run check        # the gate: typecheck, lint, dual dispatch, hooks,
                     # host conformance, delegation, reachability, readonly,
                     # imports, i18n, dead CSS, duplicated bodies, test-only
                     # members, tests, coverage, build
npm run dev          # esbuild watch; hot reload picks it up
npm run build        # production bundle
npm run progress     # where the migration landed, measured
npm run coverage:floors   # per-module coverage floors
npm run check:i18n   # locale key completeness across 21 locales (also in the gate)
```

`npm run check` must pass before every commit. It is sixteen gates, and **CI
runs the same command** - it used to run five of them by hand, which left out
every gate added because a defect had already shipped. Three are ratchets; nine
exist because this migration produced the same failure eight times and none of
the others could see it.

- **Lint** compares per-rule counts against `.eslint-baseline.json`, and the
  gate fails only when a count *rises*. It began at 255 and is now 40 - all of
  them recorded suppressions with a reason in issue #111, so any new violation
  is a real one. The ratchet stays because a suppression is not a licence: it
  keeps forty from quietly becoming forty-one.
- **Coverage** compares project-wide function coverage against
  `.coverage-baseline.json`. It started at 22% and is now 92%. The figures come
  from V8's own dump (`NODE_V8_COVERAGE`), not from the table
  `--experimental-test-coverage` prints: that table drops a `.ts` module reached
  only through `require()`, which is the shape every migrated module has while a
  `.js` caller still loads it. Three of them, about 2,400 lines, had fallen out
  of the report unnoticed — and because they left the denominator too, the
  recorded percentage *rose* each time one vanished. The same run now also fails
  if any file under `src/` is absent from the report at all; nothing else
  measures such a file, neither the ratchet nor its floor.

- **Dual dispatch** counts `typeof this.host.X === 'function'` across
  `src/state/` and `src/storage/`. A class that keeps its own fallback for a
  hook the host always supplies has two implementations, and the one in the
  class runs neither in production nor in the tests. Twenty sites are recorded
  because the host genuinely leaves those hooks undefined unless a test supplies
  them - there, the fallback is the live path. The question for any new site is
  only: does the host always supply this hook? If it does, the fallback is dead
  code that no test can reach.

- **Reachability** asks the bundler whether every file under `src/` is reachable
  from the esbuild entry, `src/main.ts`. Twice a module was extracted, tested and reported complete
  while nothing imported it - 1,235 lines the first time, 77 the second - and the
  code it replaced kept working, so every other gate stayed green. Zero
  unreachable files; a file that must stay out needs a reason and a removal
  condition in the script.

- **Delegation** resolves every `this.getX().y()` in `src` against the methods
  class X defines. Three shims pointed at methods nobody wrote; the file was
  JavaScript so the type checker never looked, and nothing called them so the
  tests never ran them. `src/` is TypeScript throughout now, which closes that
  particular hole - but the check also catches a call across a `never`-typed
  seam, which several test doubles still use, so it stays.

- **Read-only writes** finds prototype accessors with a getter and no setter,
  then any assignment to one. `onunload` was assigning to three, which throws in
  the strict bundle: it never reached `flushPendingPersistence()`, so unsaved
  work was lost on every disable and reload. P2 keeps creating these accessors.

- **Host conformance** resolves every `asHost<X>()` in `main.ts`, collects X's
  required members through `extends`, and fails if the plugin class does not
  define one. `asHost` was `return this as unknown as T` - a double cast asserts
  a shape rather than verifying it - and fourteen required members had gone
  missing behind it, four of them user-facing paths that did nothing in Obsidian.
  `asHost<T>(this: T)` makes the type checker do this now; the gate exists so it
  still holds if a cast is ever reintroduced, and it does not consult tsc.
  Zero is the only acceptable count.

  The lesson generalises: **an erasing cast at a boundary switches off every
  check that boundary has.** `as unknown as` in `src/` is four sites, each with
  a stated reason. Adding a fifth needs one.

- **Test-only members** asks the type checker which methods and exported
  functions nothing in `src/` refers to while `tests/` does.
  `switchRelativeImmediate` had six passing tests and no production caller at
  all - the overlay it appeared to serve calls `switchSession` directly - and
  four of its siblings had no caller anywhere. Every one was typed, linted,
  reachable through its file and *covered*, because the tests were what covered
  it. This is the file-level reachability gate one level down, and it needs the
  type checker rather than the bundler. Twelve are recorded with a reason each;
  the check also fails when a recorded one stops being test-only, so the
  reasons cannot go stale.

- **Duplicated bodies** hashes every normalised function body under `src/` and
  fails on a collision. Four of the eleven relative-switch entry points had
  bodies identical to a fifth, `formatString` was written eight times,
  `captureActiveSessionLayoutIfAutoSave` existed twice byte for byte on two
  classes, and one whole menu item was duplicated between the two context-menu
  modules. `i18n.ts` is exempt - two locales sharing a word is not duplicated
  logic - and one allowance is recorded.

- **Dead CSS** checks that every `.wpp-*` class in `styles.css` is applied
  somewhere in `src/`. Seven rules and 42 lines outlived the settings UI moving
  from `<details>` to tabs, and `.wpp-session-actions .wpp-btn-focused`
  outlived the class it matched. CSS is not type-checked, linted here, or
  covered, so nothing else was looking. Names built by concatenation
  (`'wpp-resize-corner wpp-resize-' + corners[i]`) are resolved by taking the
  last token of a quoted string that a `+` follows; zero is the only acceptable
  count.

- **Unwired hooks** is not a ratchet - zero is the only acceptable count.
  `plugin.openHistoryModal?.(session)` reads like a call, but if nothing defines
  the method it does nothing, and neither the type checker nor the tests object.
  Four user-facing paths shipped dead that way. The check flags an optional call
  or `typeof` guard whose name is declared on one of this repo's own `*Host`
  interfaces and defined nowhere; names that come from `obsidian.d.ts` are
  Obsidian's to define, and `platform/obsidian-internals.ts` is exempt because
  guarding undocumented API is its whole purpose. It covers only members
  declared **optional** - required ones are the type checker's job, which is
  exactly the split that let the host-conformance failure through, so the two
  checks have to be read as a pair.

When a commit legitimately improves any of the three, re-record it in that same
commit: `node scripts/lint-ratchet.js --update`,
`node scripts/coverage-ratchet.js --update`,
`node scripts/dual-dispatch-ratchet.js --update`.

## Things that will surprise you

**Tests run `.ts` directly** through Node's native type stripping — no
transpiler. That means TypeScript which emits runtime code is a hard error:
`enum`, `namespace`, parameter properties (`constructor(private x)`) and
decorators are all rejected. `tsconfig` sets `erasableSyntaxOnly` so they fail at
compile time instead of at run time.

**Relative imports need the `.ts` extension.** `moduleResolution: "bundler"`
type-checks without it; Node then fails at run time. `npm run check:imports`
covers the gap. This still applies to the CommonJS under `tests/` and
`scripts/`: `require('./paths')` resolves only to `paths.js`.

**Export by name only.** `src/` has no JavaScript left, but the CommonJS tests
still reach it: `require('./thing.ts')` on a default export gets
`{ default, __esModule }`, and `new require(...)()` then fails with "is not a
constructor".

**`tsconfig` is strict, and two flags are deliberately off.** `checkJs` reports
925 errors, all in the CommonJS under `tests/` and `scripts/`;
`noPropertyAccessFromIndexSignature` reports 744, nearly all of them the
`plugin.data.x` reads that remain. Both counts and both reasons are recorded in
`tsconfig.json` beside the settings, so neither needs re-measuring.

**`main.js` is build output** and is not tracked. A fresh clone must run
`npm run build` before Obsidian can load the plugin.

**The plugin's own data lives in the repository root** — `data.json`,
`sessions.json`, `history.json` — because this working copy is also an installed
plugin folder in a vault. They are gitignored. Do not read or modify them as
part of a task.

## Testing

`tests/` holds ordinary unit tests. `tests/lock/` holds what is left of the
Behavior Lock - the harness, and the two i18n locks - after 34b retired the nine
suites whose job was to prove Phase 3 changed no behaviour. The two that remain
are permanent: they pin all 320 keys in all 21 locales, by value.

**The i18n locks make adding a UI string a two-step job.**
`i18n-values.lock.test.ts` reports an *added* key as a change and fails, and a
lock may not be edited. So a new string needs the maintainer's decision, not a
fixture update. There is one place this bites today: the search overlay's close
button carries the English literal `Close` because there is no `close` key and
adding one would fail that lock. It is marked in the file.

**A test double stands in for a real owner only when it cannot be one.** Where a
fixture needs settings or session state, it builds a real `SettingsState` or
store over its own `data` rather than returning fixed answers. Five tests were
found passing while checking nothing because a stub answered instead of the
object under test.

The harness (`tests/lock/harness/`) installs jsdom and points the `obsidian`
specifier at recording stubs via `module.registerHooks`, which intercepts both
`require()` and `import`. One consequence: **a lock must load the code under test
dynamically**, after `setupHarness()`. A static import is resolved while the
module graph links, before the hooks exist, and the real `obsidian` package ships
types with no runtime entry.

Locks observe semantics, never presentation — what appears and in what order,
what a keypress does, what reaches disk. Not class names, styles or ARIA
attributes, because the compliance work changes those on purpose.

To exercise a hotkey path, trigger the command rather than calling a method:

```ts
h.runCommand('next-session');
```

## Verification in Obsidian

Some behaviour cannot be proven by tests. The plan marks seven points where the
maintainer checks the plugin by hand; at those commits, say so and stop rather
than claiming the work is verified.
