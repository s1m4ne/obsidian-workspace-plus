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

A migration commit converts the module to TypeScript, turns it into a class, **improves its design**, and **fixes the Obsidian guideline violations that conversion makes visible** — all four, in one commit. It is not a mechanical port; see [reference/design-targets.md](reference/design-targets.md) for what to change and, just as importantly, what to leave alone. They cannot be separated: making a file `.ts` is what lets the 33 type-aware lint rules see it, so its violation count rises at that moment. Verified on `src/utils.js`: 255 → 257 from the conversion alone. Deferring the fixes means the ratchet blocks every commit and every file is edited twice.

## Per-commit workflow

Copy this checklist into your response and tick it off:

```
- [ ] 1. Identify the single module for this commit
- [ ] 2. Check its coverage floor:
       `node scripts/coverage-ratchet.js --floor <module>.js`
       If it is below, that is this commit's first job - raise it with lock
       coverage before restructuring anything
- [ ] 3. Read the module and its existing tests
- [ ] 4. Migrate: .js -> .ts, prototype attachment -> class
- [ ] 5. Wire the class into the plugin; keep old call sites working
- [ ] 6. Update tests to the new surface (NOT Behavior Lock tests)
- [ ] 7. Run the gate (below) - all of it must pass
- [ ] 8. Commit with a message explaining WHY, not just what
```

### The gate

Run all four. Do not commit until every one passes.

```bash
npm run check         # typecheck, lint ratchet, imports, tests, coverage, build
```

`npm run check` holds the project-wide coverage ratchet. The per-module floor is
separate, checked for the one module a commit touches, because the project figure
is a weighted average that hides individual modules - at the end of Phase 2,
`i18n.js` reaching 100% masked sixteen modules below their floors.

```bash
node scripts/coverage-ratchet.js --floor groups.js   # before migrating groups
npm run coverage:floors                              # the whole picture
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

## Before writing a commit

Read [reference/commit-specs.md](reference/commit-specs.md) for the commit you
are about to write. It records what is peculiar about the code that commit
touches — the six merge loops inside `i18n.js`, the mutation in `resolveLocale`,
which coverage floors are lowered and why — the things that cost an afternoon
when found while writing instead of before.

## Migration order

**The order lives in issue #111 and only there.** It changed three times under
review — SettingsState moved ahead of GroupManager, GroupManager ahead of
SessionStore, the shared UI components ahead of the session manager modal — and a
second copy here would go stale and be believed.

Run `gh issue view 111` at the start of a session and follow the order it gives.
Three constraints in it are forced by the code, not by preference:

- `SettingsState` before `GroupManager` — `groups.js:9` reads a default
- `GroupManager` before `SessionStore` — `sessions.js:40-58` filters by group
- shared UI components before `SessionManagerModal` — otherwise 1,097 lines are rewritten twice

A module may not be migrated until the lock suite executes 80% of its functions.
Three exemptions, each with a stated reason, are listed in the issue.

## Which skill, when

| Skill | Load it |
|---|---|
| `writing-typescript` | Before writing any `.ts`. Type stripping rejects `enum`, `namespace`, parameter properties and decorators at run time, and requires `import type` plus `.ts` extensions — hard errors, not style |
| `obsidian` | Before touching UI, events, storage or styles. `reference/memory-management.md` for `registerDomEvent` and popout windows, `css-styling.md` for inline-style conversions, `accessibility.md` for the Phase 4 sweep |
| `superpowers:verification-before-completion` | Before claiming a gate passed. Evidence in the same message, or do not make the claim |
| `superpowers:systematic-debugging` | When a lock fails and the cause is not obvious — before proposing a fix |
| `review-suite:ln-12-delivery-reviewer`, `/code-review`, `/simplify` | At each phase exit, and after any commit that grew beyond its plan |
| `review-suite:ln-11-plan-reviewer` | Only when the plan is materially amended |

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

The full list of checkpoints is in issue #111; there are seven, and the issue is
the source of truth for where they fall.

Do not claim the refactor is verified before the user has confirmed these.

## Out of scope

Features, UI changes, and bug fixes. Also: the declarative settings API (`getSettingDefinitions` is absent from the published `obsidian` types, currently 1.12.3), and removing default hotkeys (kept deliberately — `Cmd+Shift+Enter` is core UX).
