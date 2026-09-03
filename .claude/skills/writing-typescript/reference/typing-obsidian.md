# Typing Obsidian APIs

## Contents
- Narrowing vault files
- Private APIs
- DOM helpers and elements
- Events and lifecycle

## Narrowing vault files

`getAbstractFileByPath` returns `TAbstractFile | null`. Narrow with `instanceof`, never cast.

```ts
const file = this.app.vault.getAbstractFileByPath(path);
if (file instanceof TFile) {
    await this.app.vault.read(file);
}
```

The `no-tfile-tfolder-cast` lint rule enforces this.

## Private APIs

`app.hotkeyManager` is **not in the published `obsidian` type definitions** (checked against 1.12.3). It is a private API, used to show hotkey hints in the overlay.

All access to undocumented surfaces is confined to `platform/obsidian-internals.ts`. That file declares the minimal shape it relies on and degrades gracefully:

```ts
interface HotkeyManagerLike {
    getHotkeys?(id: string): Hotkey[] | null;
    getDefaultHotkeys?(id: string): Hotkey[] | null;
}

export function getCommandHotkeys(app: App, commandId: string): Hotkey[] {
    const manager = (app as { hotkeyManager?: HotkeyManagerLike }).hotkeyManager;
    if (!manager) return [];
    return manager.getHotkeys?.(commandId) ?? manager.getDefaultHotkeys?.(commandId) ?? [];
}
```

Nothing outside this file may reach into undocumented properties. When Obsidian changes, there is one place to fix.

## DOM helpers and elements

Obsidian extends `HTMLElement` with `createEl`, `createDiv`, `createSpan`, `addClass`, `setText`, `empty`. These are typed by the `obsidian` package — use them and the return type is already correct.

```ts
const row = container.createDiv({ cls: 'wpp-session-row' });
const button = row.createEl('button', {
    cls: 'wpp-icon-btn',
    attr: { 'aria-label': i18n.t('deleteSession') },
});
```

`createEl` is generic over the tag, so `createEl('button')` gives `HTMLButtonElement` without a cast. Reaching for a cast here means the tag argument is wrong.

Use `activeDocument` / `activeWindow`, never bare `document` / `window` — the plugin must work in popout windows, where they refer to different objects.

## Events and lifecycle

Register through the plugin so cleanup is automatic and typed:

```ts
this.registerDomEvent(activeDocument, 'keydown', (evt: KeyboardEvent) => { });
this.registerEvent(this.app.workspace.on('layout-change', () => { }));
this.registerInterval(activeWindow.setInterval(() => { }, 1000));
```

`registerDomEvent` infers the event type from the event name — annotate the parameter only where it aids reading. Manual `addEventListener` is a leak and is not used.

Components that own UI extend Obsidian's `Component` and register their own listeners, so unloading the component cleans them up rather than requiring the plugin to track them.
