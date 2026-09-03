# Patterns

## Contents
- Class composition
- Options objects
- Freezing the persisted schema
- Type guards over casts

## Class composition

The plugin owns services; it does not implement them. `main.ts` is assembly only.

```ts
export default class WorkspacePlusPlus extends Plugin {
    sessions!: SessionStore;
    switcher!: SessionSwitcher;
    storage!: SessionStorage;

    async onload(): Promise<void> {
        const data = await this.storage.load();
        this.sessions = new SessionStore(data);
        this.switcher = new SessionSwitcher(this, this.sessions);
    }
}
```

The `!` on service fields is one of the few justified uses: they are assigned in `onload` before anything can call them. Say so in a comment once, at the class.

A service takes what it needs, not the whole plugin, when that is practical:

```ts
// Better - the dependency is visible and the class is testable alone
constructor(private_store: SessionStore) {}

// Acceptable where Obsidian's app is genuinely needed
constructor(plugin: WorkspacePlusPlus) {}
```

Prefer the narrow dependency. A class that only needs `SessionStore` should not be handed the plugin — that is what made the previous design untestable.

## Options objects

Any call with more than one obvious argument takes an options object with a named type.

```ts
export interface SwitchOptions {
    readonly silent?: boolean;
    readonly noticeMode?: 'replace' | 'default';
    readonly overlayMode?: 'preview' | 'feedback' | 'none';
}

async switchSession(id: string, options: SwitchOptions = {}): Promise<boolean> { }
```

Union literals rather than loose `string` — the compiler then rejects a typo that would previously have silently disabled a feature.

## Freezing the persisted schema

Users' sessions live in `data.json` and `sessions.json`. Changing that format is data loss, so the shape is declared once and treated as immutable.

```ts
// storage/schema.ts - the on-disk contract. Do not change these types
// without a migration; see storage/migrations.ts.
export interface StoredSession {
    readonly id: string;
    name: string;
    layout: unknown;        // Obsidian's opaque layout blob - never inspected
    modified: number;
    isDefault?: boolean;
}
```

`layout` is `unknown` deliberately: it is Obsidian's structure, the plugin only stores and replays it, and typing it would invent a contract that does not exist.

Anything read from disk is `unknown` until validated. Never trust the file to match the type.

## Type guards over casts

```ts
// ✅ narrowing
function isStoredSession(value: unknown): value is StoredSession {
    return typeof value === 'object' && value !== null
        && typeof (value as { id?: unknown }).id === 'string';
}

// ❌ asserting - a corrupt file becomes a crash somewhere far away
const session = raw as StoredSession;
```

The single `as` inside the guard is the idiomatic exception: it is a probe, immediately checked.
