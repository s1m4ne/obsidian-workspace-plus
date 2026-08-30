# Design targets

## Contents
- The rule
- Measured problems
- What is not changed
- Data ownership: expand / migrate / contract
- Recording the decision
- Where to be bold

## The rule

A migration commit is not a mechanical port. It also improves the design of the module it touches — but only where the change removes a **named, concrete cost**.

> Cleanliness for its own sake is out of scope. A change that cannot say what it costs today is not made; the module is ported as-is and the commit says so.

This is the guard against both failure modes: porting ES5 into TypeScript unchanged, and rewriting working code because a different shape feels nicer.

## Measured problems

| Problem | Measured | Cost today |
|---|---|---|
| Shared mutable state | `plugin.data.*` read directly 264+ times across 23 files (`.data.sessions` 49, `.data.groups` 44, `.data.activeSessionId` 39, `.data.sessionGroups` 38, `.data.activeGroupId` 37, `.data.sessionOrder` 27) | Changing the shape of session state has a blast radius of 23 files, and nothing can be tested without building the whole bag — the reason function coverage is 20% |
| API sprawl | 6 `switchRelative*` methods; `FromStatusBar` and `FromScroll` are byte-identical; `switchRelative` is a pure alias | A caller cannot tell which path it is on without reading all six |
| God functions | `openSearchOverlay` ~1,000 lines, 20+ closures, 34 plugin methods reached through `this` | Untestable as a unit — the reason `overlays.js` sits at 0% coverage |
| Method attachment | 309 methods attached to one prototype from 19 modules | No encapsulation, and TypeScript cannot type it, which keeps 33 lint rules blind |

## What is not changed

Module boundaries and dependency direction. There are **zero circular dependencies**, and fan-in is unremarkable (`i18n` 31, `utils` 8). The existing decomposition works. Replacing a working convention without a demonstrated defect is out of scope.

## Data ownership: expand / migrate / contract

The state move is the largest design change, so it is staged. Additive and reversible steps come first; the destructive step waits for measured zero use.

| Stage | Action | Gate before proceeding |
|---|---|---|
| Expand | The store owns its slice and exposes methods. `plugin.data` stays, backed by the store, so every existing reader keeps working. | Behavior Lock passes, no reader touched |
| Migrate | Replace direct `plugin.data.*` reads with store methods, inside each module's own migration commit | The `grep -c` count for that key falls |
| Contract | Delete the `plugin.data` accessor for that slice | `grep -rc "\.data\.groups" src` returns **0** — measured, never assumed |

The on-disk shape never changes: the store serializes to the same JSON. The persisted-data lock is what proves it.

## Recording the decision

Each migration commit message states the design change as `SELECTED`, with the cost it removes, and any alternative considered as `REJECTED`, with the reason it lost. This is what makes the choice reviewable later, when the reasoning is no longer in anyone's head.

## Where to be bold

| Change freely | Write a targeted test first |
|---|---|
| Names, file splits, function extraction | Async ordering — the switch queue from #107 |
| Data encapsulation | Event registration timing |
| Collapsing duplicate methods | The startup settle window |

The right column is behaviour the locks observe only indirectly, so restructuring it without a direct test is how a silent regression gets in.
