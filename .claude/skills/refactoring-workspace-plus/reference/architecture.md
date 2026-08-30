# Target architecture

## Contents
- Why class composition
- Target layout
- Class responsibilities
- Strangler migration
- Private API isolation

## Why class composition

The current design attaches **309 methods** onto one prototype from 19 modules:

```js
attachPersistenceMethods(WorkspacePlusPlus);      // 59 methods
attachGroupMethods(WorkspacePlusPlus);            // 24
attachSessionSwitchingMethods(WorkspacePlusPlus); // 17
```

TypeScript cannot type methods attached at runtime. Renaming to `.ts` would leave all 309 untyped, and 33 of the 39 official lint rules would stay blind — they are type-aware. Class composition is what makes the rest of the plan possible.

## Target layout

```
src/
├── main.ts                     assembly only, ~100 lines
├── core/
│   ├── session-store.ts        CRUD, ordering, validation
│   ├── session-switcher.ts     switching, request queue, startup settle
│   ├── session-saver.ts        saving, auto-save policy
│   ├── group-manager.ts
│   ├── history-service.ts
│   ├── frontmatter-linker.ts
│   └── layout.ts               pure serialise / compare
├── storage/
│   ├── paths.ts                pure path resolution
│   ├── json-file-store.ts      file IO
│   ├── session-storage.ts      location switching, backups
│   ├── migrations.ts           legacy migration
│   ├── schema.ts               frozen persisted-data types
│   └── sync-watcher.ts         external change detection
├── ui/
│   ├── status-bar/
│   ├── overlays/               search-overlay.ts, switch-overlay.ts
│   ├── modals/
│   ├── settings/
│   └── shared/                 session-drag.ts, group-tabs.ts
├── commands/
├── i18n/                       index.ts, types.ts, locales/*.ts
└── platform/
    └── obsidian-internals.ts
```

## Class responsibilities

Each class owns its state and exposes intent-revealing methods. The plugin holds them:

```ts
export default class WorkspacePlusPlus extends Plugin {
    sessions!: SessionStore;
    switcher!: SessionSwitcher;
    groups!: GroupManager;
    storage!: SessionStorage;
    // ...
}
```

Call sites read as `await this.switcher.switchRelative(1)`, not `this.switchRelative(1)`.

Two duplications are removed on the way:

- `ui/shared/session-drag.ts` replaces the ~150 near-identical lines implemented twice, in the overlay and in the session manager modal. They differed only in selectors, `zIndex` (9999 vs 10000), and the click-exclusion test.
- `ui/shared/group-tabs.ts` replaces the inline group-tab loop in the switch overlay, which reimplemented what `group-tab-ui` already did.

## Strangler migration

New classes and remaining prototype methods coexist. A migrated module becomes a class the plugin instantiates; not-yet-migrated code keeps calling through thin prototype methods that delegate to it.

```ts
// during migration - old surface preserved, new home authoritative
WorkspacePlusPlus.prototype.switchRelative = function (offset) {
    return this.switcher.switchRelative(offset);
};
```

These shims are deleted in the final `main.ts` commit, once nothing calls them.

This is why every commit stays green: nothing is half-moved at a commit boundary.

## Private API isolation

`app.hotkeyManager` is **not in the published `obsidian` type definitions** — it is a private API, used to show hotkey hints in the overlay. All access to it, and any other undocumented surface, is confined to `platform/obsidian-internals.ts`.

That file is the only place a lint suppression for undocumented APIs may appear, and the only place to fix if Obsidian changes. It must degrade gracefully: the existing behaviour of returning an empty string when the manager is unavailable is preserved.
