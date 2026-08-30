---
name: writing-typescript
description: TypeScript conventions for the Workspace++ Obsidian plugin, including the runtime constraints imposed by Node's native type stripping, class composition patterns, and typing rules. Use when writing or editing any .ts file in this repository, when adding a class or module, or when deciding how to type Obsidian APIs and persisted data.
---

# Writing TypeScript in Workspace++

Tests run `.ts` directly through Node's native type stripping (`node --test`), and the plugin ships through esbuild. Nothing transpiles ahead of tests, which constrains the syntax available.

## Runtime constraints — these are hard errors, not style

Node strips types; it does not compile them. Any TypeScript feature that **emits runtime code** is rejected. Verified on Node 26:

| Feature | |
|---|---|
| `enum` / `const enum` | ❌ `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` |
| `namespace` | ❌ |
| Parameter properties — `constructor(private x: T)` | ❌ |
| Decorators | ❌ |
| `interface`, `type`, generics, `satisfies`, `as const` | ✅ |
| `abstract class`, `#private` fields, `private` modifier | ✅ |

### Instead of `enum`

```ts
export const STORAGE_LOCATION = { plugin: 'plugin-folder', vault: 'vault-folder' } as const;
export type StorageLocation = typeof STORAGE_LOCATION[keyof typeof STORAGE_LOCATION];
```

### Instead of parameter properties

```ts
export class SessionSwitcher {
    private readonly plugin: WorkspacePlusPlus;   // declare
    constructor(plugin: WorkspacePlusPlus) {
        this.plugin = plugin;                      // assign
    }
}
```

## Imports — the other hard error

Two rules, both verified to fail at runtime when broken:

**1. Type-only imports MUST use `import type`.** A plain import of something that only exists as a type is a runtime error, because the stripped module exports no such binding.

```ts
import type { Session } from '../storage/schema.ts';   // type
import { SessionStore } from './session-store.ts';     // value
```

**2. Import specifiers MUST carry the `.ts` extension.** Omitting it fails; writing `.js` fails.

```ts
import { paths } from './paths.ts';   // ✅
import { paths } from './paths';      // ❌ cannot resolve
import { paths } from './paths.js';   // ❌ cannot resolve
```

`tsconfig.json` enforces both: `verbatimModuleSyntax: true` and `allowImportingTsExtensions: true`. esbuild resolves `.ts` specifiers without complaint.

## Types

- `strict: true`, plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
- **No `any`.** Unknown input is `unknown`, narrowed explicitly before use.
- **No `as` casts to widen or force a shape.** `as const` and `satisfies` are fine; `x as Session` is not — narrow with a type guard instead.
- Non-null `!` only where an adjacent comment states why it holds.
- Discriminated unions over objects with many optional fields.
- Methods that hand out collections return `readonly T[]`. Callers do not mutate what a store owns.

Persisted data types live in `storage/schema.ts` and are **frozen** — the on-disk format must not change, and the types are how that is enforced. See [reference/patterns.md](reference/patterns.md).

## Naming

- Files `kebab-case.ts`; classes `PascalCase`; methods verb-first.
- Class names state a responsibility. `SessionStore` yes; `SessionHelper`, `SessionUtil`, `SessionManager` no — they name nothing.
- Predicates read `is` / `has` / `can` / `should`, and booleans are positive: `isEnabled`, never `isNotDisabled`.

## Functions

- Needing a comment to explain a *section inside* a function means that section should be its own function.
- No boolean parameters at call sites — use an options object.

```ts
switchSession(id, { silent: true });   // ✅
switchSession(id, true);               // ❌ unreadable at the call site
```

- Early return over nested conditionals.

## Async

- `async` / `await` only; no `.then()` chains.
- No floating promises. Await it, return it, or explicitly document why it is fire-and-forget.

## Errors

- No silent `catch {}`. Handle it or let it propagate.
- User-facing failures surface as a `Notice`. Obsidian's guidelines discourage routine console output, so log only genuine errors.

## Obsidian APIs

Narrowing, private-API isolation, DOM and lifecycle typing: [reference/typing-obsidian.md](reference/typing-obsidian.md).

Class composition, options objects, schema freezing: [reference/patterns.md](reference/patterns.md).

The separate `obsidian` skill covers the official plugin rules themselves — `registerDomEvent`, `createEl`, `Platform`, `activeDocument`, accessibility, CSS. Consult it for API behaviour; consult this skill for how to type it.

## Comments

Explain **why**, never **what**. No commented-out code. No JSDoc that restates the signature in prose.

## Tests

Test names state behaviour — `test('rapid presses accumulate instead of collapsing')`, not `test('switchRelative')`.
