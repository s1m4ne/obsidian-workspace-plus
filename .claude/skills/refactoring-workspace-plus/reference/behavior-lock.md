# Behavior Lock

## Contents
- What it is
- The rule
- What is locked
- How to write one
- When a lock test fails

## What it is

Characterization tests written **before** the refactor began, capturing how the plugin behaves today. They are not tests of what the code *should* do — they are a photograph of what it *does*, correct or not.

Their only job is to fail loudly if the refactor changes behaviour.

## The rule

> Behavior Lock tests are never edited during the refactor.

Not "rarely". Not "only when obviously wrong". Never — without stopping and asking the user first.

The moment a lock test can be edited to make it pass, it stops proving anything. This is the entire safety net for an 18,000-line rewrite, and it is only as strong as this rule.

Lock tests live in `tests/lock/` and are named `*.lock.test.ts`.

## What is locked

| Area | What the lock captures |
|---|---|
| i18n | Every resolved value for every key in all 21 locales. Function-valued keys are called with representative arguments and their output recorded. |
| Overlays | Rendered DOM structure and event wiring for the search overlay and the switch overlay, across group/no-group and filtered/unfiltered states. |
| Session manager modal | Rendered row structure, ordering, and action wiring. |
| Settings tab | The list of setting rows, their order, and their section headings. |
| Drag and group tabs | Resulting order after representative drag operations. |
| Persisted data | Round-trip equality: load a fixture, persist it, and compare byte-for-byte against the expected shape. |

The persisted-data lock matters most. Users' sessions live in these files; a format change is data loss, not a bug.

## What a lock may observe

Two constraints keep a lock stable across the migration. Both come from failures the plan review found before any lock was written.

**1. Lock semantics, not presentation.**

| Lock this | Never lock this |
|---|---|
| Which sessions appear, in what order | CSS class names |
| Which item is active | Inline styles |
| What a keypress or click does | ARIA attributes |
| What is written to disk | Which document an element is attached to |
| Which `Setting` rows are built, in what order, with which handlers | Icon names |

The right column is what the compliance work changes deliberately: inline styles become CSS classes, ARIA labels get added, `document` becomes `activeDocument`. A lock snapshotting raw `outerHTML` fails on all of it and forces the edit this document forbids.

**2. Trigger commands, do not call methods.**

The harness records `addCommand` registrations and exposes `runCommand(id)`, so a
lock exercises a hotkey path the way a user does:

```ts
h.runCommand('next-session');
h.runCommand('next-session');
h.runCommand('next-session');   // three presses must advance three sessions
```

This is how the #107 regression is protected. Its fix is currently held only by
`tests/session-switching.test.js`, which calls `plugin.switchRelativeFromCommand`
directly — an ordinary test, editable, and due to be rewritten in the same commit
that restructures the switcher. A lock cannot be edited, so that is where it belongs.

**3. Never call an internal plugin method.**

Observe through seams the migration preserves: rendered DOM, persisted files, recording stubs (`Notice`, `Setting`, `Menu`). A lock calling `plugin.switchRelativeFromCommand(1)` dies the moment that becomes `plugin.switcher.switchRelative(1)` and the shims are removed in the final commit.

Ordinary tests may call internals and be updated as the surface moves. Locks may not.

## The one exception to "behaviour does not change"

Three observable changes are intended, because each is a defect being fixed:

- `document` → `activeDocument`: overlays currently render into the wrong window when a popout has focus
- ARIA labels and keyboard paths: icon-only controls currently have no accessible name
- inline styles → CSS classes: themes and snippets currently cannot override plugin styling

Named here so they cannot be smuggled in as "just refactoring". Anything else that changes observable behaviour is a bug in the refactor.

## How to write one

Snapshot the observable output, not the implementation.

```ts
// Good - survives refactoring, catches behaviour change
const overlay = renderSwitchOverlay(plugin, sessions, 2);
assert.equal(overlay.querySelectorAll('.wpp-switch-item').length, 4);
assert.equal(overlay.querySelector('.is-active')?.textContent, 'Writing');

// Bad - couples the lock to internals, will need editing during the refactor
assert.equal(plugin._overlayRenderer.itemCache.length, 4);
```

A lock test that has to change when the code is restructured was written wrong. Assert on what a user could observe: what is on screen, what is stored, what is returned.

## When a lock test fails

1. Assume the refactor is wrong, not the test.
2. Find what behaviour changed and restore it.
3. If the behaviour genuinely should change, or the lock captured a bug that must be fixed now, **stop and ask the user**. Do not edit the test on your own judgement.

A failing lock test is the safety net doing its job. Treat it as a success of the process, not an obstacle.
