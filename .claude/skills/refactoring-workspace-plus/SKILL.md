---
name: refactoring-workspace-plus
description: Rules and workflow for the Workspace++ modernization in issue #111 - migrating src/ to TypeScript and class composition without changing behaviour. Use when working on any commit of that refactor, when touching files under src/, or when the user mentions issue #111, the Behavior Lock, phases, or the class migration.
---

# Workspace++ Modernization

Issue #111 migrates `src/` (18k lines) to TypeScript and class composition, and brings it into compliance with Obsidian's plugin guidelines. One PR, ~50 commits, spread across many sessions.

**Announce at start:** "I'm using the refactoring-workspace-plus skill."

Read the plan in issue #111 (`gh issue view 111`) before the first commit of a session. It is the source of truth for scope and phase order.

## The three iron laws

### 1. Behaviour does not change

This is the whole point of the exercise. Every commit must leave the plugin behaving exactly as before.

```
Behavior Lock tests are NEVER edited during this refactor.
```

If a Behavior Lock test fails, the refactor broke something — fix the code, not the test. If you believe the test itself is wrong, **stop and ask the user**. Editing a lock test to make it pass destroys the only guarantee this plan has.

See [reference/behavior-lock.md](reference/behavior-lock.md).

### 2. Evidence before claims

Never state that something passes, builds, or is complete without having run the command in the current message and read its output.

"Should pass", "looks right", "I've updated it so it works now" are all violations.

### 3. One module per commit, always green

Each commit migrates one module and leaves the repo fully working. Never leave a commit in a broken intermediate state — the strangler pattern exists so old and new can coexist.

A migration commit converts the module to TypeScript, turns it into a class, **and fixes the Obsidian guideline violations that conversion makes visible** — all three, in one commit. They cannot be separated: making a file `.ts` is what lets the 33 type-aware lint rules see it, so its violation count rises at that moment. Verified on `src/utils.js`: 255 → 257 from the conversion alone. Deferring the fixes means the ratchet blocks every commit and every file is edited twice.

## Per-commit workflow

Copy this checklist into your response and tick it off:

```
- [ ] 1. Identify the single module for this commit
- [ ] 2. Read the module and its existing tests
- [ ] 3. Migrate: .js -> .ts, prototype attachment -> class
- [ ] 4. Wire the class into the plugin; keep old call sites working
- [ ] 5. Update tests to the new surface (NOT Behavior Lock tests)
- [ ] 6. Run the gate (below) - all four must pass
- [ ] 7. Commit with a message explaining WHY, not just what
```

### The gate

Run all four. Do not commit until every one passes.

```bash
npm test              # all tests, Behavior Lock included
npm run lint          # violation count must not increase
npx tsc --noEmit      # type check
npm run build         # bundle succeeds
```

If a gate fails: fix it and run the gate again from the top. Do not proceed with a failing gate, and do not disable a rule to make it pass without asking.

## Phase exit — do not start the next phase until this passes

A phase is finished when it has been reviewed, not when its commits exist.

```
- [ ] 1. review-suite:ln-12-delivery-reviewer over the phase's commit range
- [ ] 2. /code-review over the same range
- [ ] 3. /simplify over the same range
- [ ] 4. node scripts/progress.js - does the state match what the plan said
- [ ] 5. Findings addressed, or written into the PR with the reason they were not
```

**Phase 2 additionally requires proving each lock works.** A characterization
test that asserts nothing passes forever and proves nothing. For every lock
suite: deliberately break the behaviour it covers, confirm the lock fails,
revert, confirm it passes. Record the result in the PR. A lock that cannot be
made to fail is deleted or rewritten.

## Reporting progress

Cite `node scripts/progress.js` output, never prose. If the commit sequence
diverges from the plan, write the divergence and its reason into issue #111 —
amend the plan, do not quietly abandon it.

## Migration order

Leaf-first. Later modules depend on earlier ones, so do not reorder without reason.

```
utils -> layout-utils -> navigation-utils -> i18n -> storage/paths
-> storage/json-file-store -> storage/migrations -> storage/session-storage
-> storage/sync-watcher -> SessionStore -> GroupManager -> HistoryService
-> SessionSwitcher -> SessionSaver -> FrontmatterLinker -> StatusBarController
-> CommandRegistry -> Modals -> shared/session-drag -> shared/group-tabs
-> SwitchOverlay -> SearchOverlay -> SettingsTab -> main.ts
```

A module may not be migrated until the lock suite executes 80% of its functions
(60% for `overlays.js`). Check with `--experimental-test-coverage` before
starting. The final `main.ts` commit deletes the shims and updates
`esbuild.config.mjs`, whose entry point is still `src/main.js`.

Target structure and class responsibilities: [reference/architecture.md](reference/architecture.md).

## Code conventions

Two sibling skills own the rules; this skill does not repeat them.

- **`writing-typescript`** — how to write the code: the runtime constraints of Node's type stripping (no `enum`, no `namespace`, no parameter properties, no decorators; `import type` and `.ts` extensions are mandatory), naming, typing, class composition, error handling.
- **`obsidian`** — the official plugin rules: `registerDomEvent`, `createEl`, `Platform`, `activeDocument`, accessibility, CSS.

Consult both before writing code in a migration commit.

## Stop and ask when

- A Behavior Lock test fails and you think the test is wrong
- The type checker reveals what looks like a real bug (do not silently fix it — it may be load-bearing)
- A module does not fit the planned class boundary
- A lint rule would need disabling
- You are about to change anything user-visible

Raise it in one or two sentences and wait. Guessing here costs more than asking.

## Manual verification checkpoints

DOM behaviour cannot be proven by tests alone. Ask the user to exercise the plugin in Obsidian after:

- **Modals** migrated
- **Overlays** migrated — Cmd+Shift+Enter cycling, drag reorder, group tabs, search
- **Final commit**

Do not claim the refactor is verified before the user has confirmed these.

## Out of scope

Features, UI changes, and bug fixes. Also: the declarative settings API (`getSettingDefinitions` is absent from the published `obsidian` types, currently 1.12.3), and removing default hotkeys (kept deliberately — `Cmd+Shift+Enter` is core UX).
