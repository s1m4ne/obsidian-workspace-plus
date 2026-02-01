# Workspace++

An [Obsidian](https://obsidian.md/) plugin for workspace sessions — a UI aligned with Obsidian's core plugins, refined for maximum ease of use. Save and switch layouts instantly.

Bug reports, feature requests, and pull requests are welcome — feel free to open an [issue](https://github.com/s1m4ne/obsidian-workspace-plus/issues) or PR.

## Features

### Switch by hotkey

Cycle through sessions with <kbd>⌘</kbd><kbd>⇧</kbd><kbd>Enter</kbd> (Mac) / <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Enter</kbd> (Win). You can also assign hotkeys to jump to sessions by number.


https://github.com/user-attachments/assets/210a2566-a19a-4fab-b791-0766e430de4b


### Switch sessions

Open the session manager and switch between saved layouts with a click.


https://github.com/user-attachments/assets/ecb8b9fb-610c-4dba-9702-e662b7bfd7bc


### Create sessions

Create a new session by copying the current workspace layout.


https://github.com/user-attachments/assets/0483fe8e-308f-43ae-b2cc-2cdd63b8f633


### Drag to reorder

Rearrange sessions by dragging them in the session manager.


https://github.com/user-attachments/assets/33c6629c-ebff-4073-af4a-641f9fce85e4


### And more

- **Rename & delete** sessions from the manager modal
- **Bulk select** with `Cmd/Ctrl+Click` and delete multiple sessions at once
- **Keyboard navigation** — arrow keys, Enter to switch, Delete/Backspace to remove
- **Status bar** shows the active session name (click to open manager)
- **Automatic backup** — sessions are backed up and restored if data is corrupted
- **14 languages** — English, Japanese, Chinese (Simplified/Traditional), Korean, French, Spanish, German, Portuguese, Indonesian, Russian, Italian, Turkish, Arabic

## Installation

### Manual

#### With BRAT (recommended)

1. Install the [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin
2. Open **Settings** > **BRAT** > **Add Beta plugin**
3. Paste the following URL and click **Add Plugin**
   ```
   https://github.com/s1m4ne/obsidian-workspace-plus
   ```

#### From release

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/s1m4ne/obsidian-workspace-plus/releases/latest)
2. Create a folder at `<your-vault>/.obsidian/plugins/workspace-plus-plus/`
3. Place the three files into that folder
4. Open Obsidian **Settings** > **Community plugins** and enable **Workspace++**

### From Community Plugins (coming soon)

1. Open Obsidian **Settings** > **Community plugins**
2. Click **Browse** and search for **Workspace++**
3. Click **Install**, then **Enable**

## Commands

| Command | Description |
|---|---|
| Manage sessions | Open the session manager modal |
| Create new session | Open manager with focus on the name input |
| Save current session now | Save the current layout to the active session |
| Rename current session | Rename the active session |
| Delete current session | Delete the active session |
| Switch to session 1–9 | Jump to a session by number |
| Previous / Next session | Cycle through sessions |

All commands can be assigned custom hotkeys in **Settings** > **Hotkeys**.

## Alternatives (and when to pick each)

- **Workspaces** (core plugin): Built-in snapshot layouts—simple save/load for tabs + sidebar state.
- **Workspaces Plus**: Workspaces with quick save/switch UI, hotkeys, and workspace-specific theming/overrides.
- **Workspace Navigator**: Workspaces with better state restore (sidebars + file explorer expansion) and a fast switcher.
- **Context Workspaces**: Space-style UI with Live/Snapshot modes and quick Prev/Next switching.
- **Contexts**: Switch sets of open notes (tab groups) without full layout—simple and cross-device friendly.

### Where Workspace++ fits

**Workspace++** is for people who want workspace sessions to feel effortless—without turning their setup into a feature checklist.
If you like the core Workspaces workflow but feel friction in the UI (too many clicks, easy-to-misfire saves, or switching that doesn't feel instant), Workspace++ focuses on the basics and polishes them hard.

- **Minimal, core-aligned UI** that stays out of your way
- **Fast session switching** (hotkeys + Cmd-Tab style overlay)
- **Simple session manager** (create/rename/delete + drag reorder)
- **Sensible defaults**, tuned for daily use—not power-user complexity

## License

MIT
