# Workspace++

An [Obsidian](https://obsidian.md/) plugin for managing workspace sessions with a native-feeling UI/UX.

Save, switch, and organize multiple workspace layouts — like browser tabs for your vault.

## Features

### Create sessions

Save your current workspace layout as a named session.

<video src="docs/create-session.mp4" controls muted></video>

### Switch sessions

Open the session manager and switch between saved layouts.

<video src="docs/switch-session.mp4" controls muted></video>

### Switch by hotkey

Assign hotkeys to jump directly to sessions by number, or cycle through them.

<video src="docs/switch-session-by-hotkey.mp4" controls muted></video>

### Drag to reorder

Rearrange sessions by dragging them in the session manager.

<video src="docs/reorder.mp4" controls muted></video>

### And more

- **Rename & delete** sessions from the manager modal
- **Bulk select** with `Cmd/Ctrl+Click` and delete multiple sessions at once
- **Keyboard navigation** — arrow keys, Enter to switch, Delete/Backspace to remove
- **Status bar** shows the active session name (click to open manager)
- **Automatic backup** — sessions are backed up and restored if data is corrupted
- **14 languages** — English, Japanese, Chinese (Simplified/Traditional), Korean, French, Spanish, German, Portuguese, Indonesian, Russian, Italian, Turkish, Arabic

## Installation

### From Community Plugins (coming soon)

1. Open Obsidian **Settings** > **Community plugins**
2. Click **Browse** and search for **Workspace++**
3. Click **Install**, then **Enable**

### Manual installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/s1m4ne/obsidian-workspace-plus/releases/latest)
2. Create a folder at `<your-vault>/.obsidian/plugins/workspace-plus-plus/`
3. Place the three files into that folder
4. Open Obsidian **Settings** > **Community plugins** and enable **Workspace++**

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

## License

MIT
