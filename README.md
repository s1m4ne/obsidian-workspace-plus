# Workspace++

An [Obsidian](https://obsidian.md/) plugin for workspace sessions — a UI aligned with Obsidian's core plugins, refined for maximum ease of use. Save and switch layouts instantly.

Bug reports, feature requests, and pull requests are welcome — feel free to open an [issue](https://github.com/s1m4ne/obsidian-workspace-plus/issues) or PR.

> **If you find this plugin useful, please give it a ⭐ on GitHub — it helps others discover it!**

## Features

### Switch by hotkey

Cycle through sessions with <kbd>⌘</kbd><kbd>⇧</kbd><kbd>Enter</kbd> (Mac) / <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Enter</kbd> (Win), or navigate left/right with <kbd>⌘</kbd><kbd>⇧</kbd><kbd><</kbd> / <kbd>⌘</kbd><kbd>⇧</kbd><kbd>></kbd>. You can also assign hotkeys to jump to sessions by number (1–9).


https://github.com/user-attachments/assets/b1dc94f7-b979-4b09-97e6-3ebf4837b5ed


### Switch sessions

Open the session manager and switch between saved layouts with a click.



https://github.com/user-attachments/assets/27a02a7b-aaa8-4795-b67d-4348fa4012f7




### Create and delete sessions

Create a new session from the current layout, duplicate it with <kbd>⌘</kbd><kbd>⇧</kbd><kbd>M</kbd>, or delete it with <kbd>⌘</kbd><kbd>⇧</kbd><kbd>⌫</kbd>.




https://github.com/user-attachments/assets/c86b8000-c49e-442c-8246-17c181a4d921




### Rename sessions

Rename the current session with <kbd>⌘</kbd><kbd>⇧</kbd><kbd>R</kbd>, or right-click a session in the manager.



https://github.com/user-attachments/assets/6041d80f-9c15-4a59-8d27-8a8f39d9dba6





### Drag to reorder

Rearrange sessions by dragging them in the session manager.



https://github.com/user-attachments/assets/6c2b5a13-cc9f-43ca-bff1-944c5b318a92





### And more

- **Full hotkey workflow** — create, duplicate, rename, delete, and switch sessions without ever opening the manager
- **Manual save command** for current session (`Cmd/Ctrl+Shift+S` by default)
- **Auto-save mode control** — toggle enable/disable auto-save-on-switch and use warning prompts for unsaved changes
- **Status bar quick switcher** — enabled by default; click to open quick overlay, `Cmd/Ctrl+Click` to save current session
- **Session groups** — enabled by default; organize sessions by group and toggle the feature ON/OFF in settings
- **Bulk select** with `Cmd/Ctrl+Click` to delete multiple sessions
- **Keyboard navigation** in manager — arrow keys, Enter to switch, Delete/Backspace to remove
- **Status bar** shows the active session and group name
- **Automatic backup** — restored automatically if data is corrupted
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

### From Community Plugins

1. Open Obsidian **Settings** > **Community plugins**
2. Click **Browse** and search for **Workspace++**
3. Click **Install**, then **Enable**

## Commands

| Command                  | Default Hotkey                                    |
| ------------------------ | ------------------------------------------------- |
| Manage sessions          | —                                                 |
| Create new session       | —                                                 |
| New empty session        | —                                                 |
| Duplicate current session| `Cmd/Ctrl+Shift+M`                                |
| Rename current session   | `Cmd/Ctrl+Shift+R`                                |
| Delete current session   | `Cmd/Ctrl+Shift+Backspace`                        |
| Save current session     | `Cmd/Ctrl+Shift+S`                                |
| Toggle auto-save on switch | —                                              |
| Enable auto-save on switch | —                                              |
| Disable auto-save on switch | —                                             |
| Previous session         | `Cmd/Ctrl+Shift+<`                                |
| Next session             | `Cmd/Ctrl+Shift+Enter`, `Cmd/Ctrl+Shift+>`       |
| Switch group             | —                                                 |
| Exit group (show all sessions) | —                                          |
| Next group               | `Cmd/Ctrl+Shift+Tab`                              |
| Previous group           | —                                                 |
| Search session overlay   | —                                                 |
| Export sessions snapshot | —                                                 |
| Import latest sessions snapshot | —                                           |
| Switch to session 1–9    | —                                                 |

All commands can be assigned custom hotkeys in **Settings** > **Hotkeys**.

## Alternatives (and when to pick each)

- **Workspaces** (core plugin): Built-in snapshot layouts—simple save/load for tabs + sidebar state.
- **Workspaces Plus**: Workspaces with quick save/switch UI, hotkeys, and workspace-specific theming/overrides.
- **Workspace Navigator**: Workspaces with better state restore (sidebars + file explorer expansion) and a fast switcher.
- **Context Workspaces**: Space-style UI with Live/Snapshot modes and quick Prev/Next switching.
- **Contexts**: Switch sets of open notes (tab groups) without full layout—simple and cross-device friendly.

### Where Workspace++ fits

**Workspace++** is for people who want workspace sessions to feel native to Obsidian — fast, polished, and keyboard-driven.

- **Core-aligned UI** designed to blend seamlessly with Obsidian
- **Full keyboard workflow** — hotkeys for every action, with a Cmd-Tab style overlay
- **Session manager** with create, rename, delete, bulk select, and drag reorder
- **Sensible defaults** that work out of the box

## License

MIT
