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
