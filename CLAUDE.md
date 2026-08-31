# Workspace++

A session manager for Obsidian workspaces, published in the community plugin
directory. `src/` is ES5-style CommonJS JavaScript, bundled by esbuild into
`main.js` (which is generated, not tracked).

## Right now, this repository is mid-migration

Issue #111 is rewriting `src/` as TypeScript with owned state and real classes.
It runs to 57 commits on one branch, and the constraint is that **observable
behaviour must not change** apart from four named exceptions.

**Before touching anything under `src/` or `tests/`:**

```bash
node scripts/progress.js     # where the migration stands, measured
gh issue view 111            # the plan - the source of truth for what comes next
```

Then load the `refactoring-workspace-plus` skill. It carries the rules that make
this safe, and they are not obvious from the code:

- Behavior Lock tests in `tests/lock/` are **never edited**. If one fails, the
  refactor broke something. If the test itself looks wrong, stop and ask.
- One module per commit, and every commit stays green.
- Evidence before claims: if you have not run the command in this message, you
  cannot say it passes.

Two sibling skills own the details: `writing-typescript` for how to write the
code, `obsidian` for the plugin guidelines. Load them before writing `.ts` or
touching UI, events, storage or styles.

`refactoring-workspace-plus/reference/commit-specs.md` carries what is peculiar
about the code each near-term commit touches. Read the entry for your commit
before writing it.

## Commands

```bash
npm run check        # the gate: typecheck, lint, dual dispatch, hooks, delegation,
                     # reachability, readonly, imports, tests, coverage, build
npm run dev          # esbuild watch; hot reload picks it up
npm run build        # production bundle
npm run progress     # migration status
npm run coverage:floors   # which modules are ready to migrate
npm run check:i18n   # locale key completeness across 21 locales
```

`npm run check` must pass before every commit. It is eleven gates. Three are
ratchets; five exist because this migration produced the same failure seven times
and none of the others could see it.

- **Lint** compares per-rule counts against `.eslint-baseline.json`. There are
  255 known violations; the gate fails only when a count *rises*. Failing on the
  existing set would block every commit until the last one.
- **Coverage** compares project-wide function coverage against
  `.coverage-baseline.json`. It starts at 22% and has to climb.

- **Dual dispatch** counts `typeof this.host.X === 'function'` across
  `src/state/` and `src/storage/`. A class that keeps its own fallback for a
  hook the adapter always supplies has two implementations, and the one in the
  class runs neither in production nor in the tests. Fifteen sites are recorded
  because the adapter returns `undefined` there unless a test overrides the
  plugin method - those fallbacks are the live path. The question for any new
  site is only: does the adapter always supply this hook?

- **Reachability** asks the bundler whether every file under `src/` is reachable
  from `src/main.js`. Twice a module was extracted, tested and reported complete
  while nothing imported it - 1,235 lines the first time, 77 the second - and the
  code it replaced kept working, so every other gate stayed green. Zero
  unreachable files; a file that must stay out needs a reason and a removal
  condition in the script.

- **Delegation** resolves every `this.getX().y()` in `src` against the methods
  class X defines. Three shims pointed at methods nobody wrote; the file is
  JavaScript so the type checker never looked, and nothing called them so the
  tests never ran them.

- **Read-only writes** finds prototype accessors with a getter and no setter,
  then any assignment to one. `onunload` was assigning to three, which throws in
  the strict bundle: it never reached `flushPendingPersistence()`, so unsaved
  work was lost on every disable and reload. P2 keeps creating these accessors.

- **Unwired hooks** is not a ratchet - zero is the only acceptable count.
  `plugin.openHistoryModal?.(session)` reads like a call, but if nothing defines
  the method it does nothing, and neither the type checker nor the tests object.
  Four user-facing paths shipped dead that way. The check flags an optional call
  or `typeof` guard whose name is declared on one of this repo's own `*Host`
  interfaces and defined nowhere; names that come from `obsidian.d.ts` are
  Obsidian's to define, and `platform/obsidian-internals.ts` is exempt because
  guarding undocumented API is its whole purpose.

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
covers the gap. The same applies to CommonJS callers: once a module is `paths.ts`,
`require('./paths')` no longer resolves.

**During the migration, export by name only.** A `.js` caller doing
`require('./thing.ts')` gets `{ default, __esModule }`, so a default export
breaks it.

**`main.js` is build output** and is not tracked. A fresh clone must run
`npm run build` before Obsidian can load the plugin.

**The plugin's own data lives in the repository root** — `data.json`,
`sessions.json`, `history.json` — because this working copy is also an installed
plugin folder in a vault. They are gitignored. Do not read or modify them as
part of a task.

## Testing

`tests/` holds ordinary unit tests. `tests/lock/` holds Behavior Lock suites and
the harness they run on.

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
