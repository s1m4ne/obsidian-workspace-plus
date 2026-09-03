# Design targets

## Contents
- The rule
- The audit: what is wrong
- What is healthy and must not be touched
- P1: state ownership via expand / migrate / contract
- Where to be bold
- Recording the decision

## The rule

A migration commit is not a mechanical port. It also fixes the design problem the audit found in that module — but only where the change removes a **named, concrete cost**.

> A change that cannot say what it costs today is not made. The module is ported as-is and the commit says so.

This guards both failure modes: porting ES5 into TypeScript unchanged, and rewriting working code because a different shape feels nicer.

## The audit: what is wrong

Each item lists where it is fixed.

### Structural

| | Problem | Measured | Cost | Fixed in |
|---|---|---|---|---|
| P1 | Shared mutable state | `plugin.data.*` read 264+ times across 23 files and **reassigned in 35 places**; defensive `\|\| {}` 143 times | Blast radius of 23 files; nothing constructible for a test — the cause of 20% function coverage | Every core commit |
| P2 | Runtime state on the plugin | **45 mutable fields**: 12 in `onload`, 33 created lazily. `isSwitchingSession` touched from 11 places. `_refreshOverlaySessions` is a **reverse dependency** — `session-sync.js:252` calls a function the overlay registered at `overlays.js:249` | No invariant holdable; #107 lived here | SessionSwitcher, StatusBarController |
| P3 | Method attachment | 309 methods on one prototype from 19 modules | No encapsulation; TypeScript cannot type it, keeping 33 rules blind | All of Phase 3 |
| P4 | God functions | `openSearchOverlay` ~1,000 lines, 20+ closures, 34 plugin methods via `this` | Untestable — the cause of 0% coverage on `overlays.js` | SearchOverlay (3 commits) |

### Maintenance

| | Problem | Measured | Cost | Fixed in |
|---|---|---|---|---|
| P5 | Defaults duplicated | `data.X !== false` at 14 sites, same default in `DEFAULT_DATA` | Two sources of truth, nothing catches divergence | SettingsState |
| P6 | Session row logic repeated | **Four** builders (`overlays.js:286, 1165, 1240`, `session-manager-modal.js:611`). They are **not the same row** — the modal has action keys, multi-select and a context menu. Only name resolution, active detection and relative time are duplicated | Merging the DOM would trade duplication for a large config surface | shared/session-presenter — derivation only |
| P6b | Drag built three times | overlays + modal (~150 near-identical lines); `group-tab-ui` has a third | Same | shared/session-drag |
| P7 | Listener lifecycle | 20 manual `addEventListener` on document/window — **10 long-lived** (convert) and **10 drag-scoped** (leave manual; registering per gesture would accumulate) | Obsidian names this a leak the linter misses: `activeDocument` follows focus, so setup and cleanup can target different documents | Modals, Overlays |
| P8 | Inline styles | 80 — 37 static, 31 dynamic; 51 in `overlays.js` | Themes and snippets cannot override | Each UI commit + Phase 4 |

### Small

| | Problem | Fixed in |
|---|---|---|
| P9 | `getSessionIndex` returns 0 when absent (`sessions.js:107`) — turns "not found" into "the first one", the reason #107 looked stuck on the first session | SessionStore |
| P10 | `get*` (63) and `find*` (3) do not signal their contract | Each commit |
| P11 | Two private APIs absent from the published types: `app.hotkeyManager` (1 site) and **`app.setting` (13 sites)** | platform/obsidian-internals |
| P12, P14 | Accessibility (`aria-label` 0), LICENSE year, `configDir` | Phase 4; `configDir` moves to the storage commit |
| P13 | Modals and drag surfaces assume the main window | Phase 4 — **not** popout support, which is a separate issue: overlays are positioned from `statusBarEl`, which exists only in the main window |
| P16 | `isMacPlatform` duplicated in `utils.js:7-11` and `i18n.js:25-29` | utils commit; i18n imports it |
| P15 | `exports.L` is a mutable module-level export captured at load time by several modules. CommonJS copies the value, so a stale `L` survives a language change; ESM `import` is a live binding and would start updating. **The migration itself changes behaviour here** | i18n — lock the language-switch path first |

## What is healthy and must not be touched

Zero circular dependencies. Unremarkable fan-in (`i18n` 31, `utils` 8). No `innerHTML`. Three lines of dead code. Two swallowed errors. `styles.css` has no `!important`, 121 CSS variables, no raw hex colours. CI has no skipped gates.

**Module boundaries and dependency direction work.** Replacing a working convention without a demonstrated defect is out of scope.

## P1: state ownership via expand / migrate / contract

Staged, because it is the largest change. Additive and reversible first; the destructive step waits for measured zero use.

| Stage | Action | Gate before proceeding |
|---|---|---|
| Expand | The store holds a reference to the **container** (`plugin.data`) and reads its slice on every access. Every current reader keeps working — it is the same object | Locks pass, no reader touched |
| Migrate | Each module's own commit replaces its direct reads with store methods | The `grep -c` count for that key falls |
| Contract | Swap internals (`Record` → `Map`), delete the accessor | `grep -rc "\.data\.groups" src` returns **0** — measured, never assumed |

The on-disk shape never changes: `toJSON()` emits the same JSON, and the persisted-data lock proves it.

**Read through the container, never hold a child reference.** These properties are reassigned rather than mutated in 24 places: `session-sync.js:226-230` replaces all five when another device's data arrives, `session-crud.js:175-180` resets them, `groups.js:92,109` replaces `groupOrder`. A store holding `data.groups` directly would keep pointing at the old object and silently stop seeing incoming sessions — breaking the sync feature from #105. Ownership only inverts at Contract.

## Where to be bold

| Change freely | Write a targeted test first |
|---|---|
| Names, file splits, function extraction | Async ordering — the switch queue from #107 |
| State encapsulation | Event registration timing |
| Collapsing duplicate methods | The startup settle window |
| | Module-level mutable exports becoming live bindings (P15) |

## Ordering constraints

Two orderings are forced by the code, not by preference:

- **GroupManager before SessionStore.** `sessions.js:40-58` filters sessions by group — `getOrderedSessionsForGroup` reads `isGroupFeatureEnabled()` and `data.sessionGroups`, `getOrderedSessions` reads `data.activeGroupId`. Session ordering depends on group state, not the reverse.
- **SettingsState before GroupManager.** `groups.js:9` reads `data.groupFeatureEnabled !== false`.
- **Shared components before every consumer.** `session-manager-modal.js` holds both `renderSessionItem` and `setupDragAndDrop`; migrating it first would mean rewriting the same 1,097-line file twice. Extract the shared modules while their callers are still JavaScript — esbuild and `node --test` both resolve `.ts` from CommonJS callers.

The right column is behaviour the locks observe only indirectly, so restructuring it without a direct test is how a silent regression gets in.

## Recording the decision

Each migration commit records the design change as `SELECTED` with the cost it removes, and any alternative considered as `REJECTED` with why it lost — so the reasoning survives after it leaves anyone's head.
