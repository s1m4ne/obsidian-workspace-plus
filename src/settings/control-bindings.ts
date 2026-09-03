import { Notice } from 'obsidian';
import { L, text } from '../i18n.ts';
import * as statusBarActions from '../statusbar-actions.ts';
import type { SettingsTabHost } from '../settings-tab.ts';

/**
 * Where a declarative control's `key` reads and writes.
 *
 * A `control` definition carries only a `key`; the tab resolves it here.
 * Obsidian's own defaults read and write `plugin.settings`, which this plugin
 * does not have - settings live on `SettingsState`, and a few on other owners -
 * so every key is spelled out.
 *
 * A table rather than deriving `setLanguageSetting` from `language`:
 * string-built method names are what this repository has gates against, the
 * status-bar slots are entries in one record rather than fields of their own,
 * and four keys belong to owners other than `SettingsState`. The pattern would
 * not hold, and one explicit line per key is the thing a reader can check.
 */
export interface ControlBinding {
    readonly read: (plugin: SettingsTabHost) => unknown;
    readonly write: (plugin: SettingsTabHost, value: unknown) => Promise<unknown> | void;

    /**
     * The write changed something other than this control's own value, so the
     * definitions have to be read again rather than re-evaluated.
     *
     * Obsidian re-evaluates after every write, but `refreshDomState` only
     * re-runs each row's `visible` and `disabled`:
     *
     *     function X2(e) { ... e.settingEl.toggle(i) ... setting.setDisabled(...) }
     *
     * It does not re-read a `control`'s value. So a write that moves another
     * row's stored value leaves that row showing the old one until the
     * definitions are rebuilt, which is what this asks for. A changed set of
     * items needs it for the same reason.
     */
    readonly rereadDefinitions?: boolean;
}

function state(plugin: SettingsTabHost) {
    return plugin.getSettingsState();
}

export const CONTROL_BINDINGS: Record<string, ControlBinding> = {
    // --- General -------------------------------------------------------
    language: {
        read: (plugin) => state(plugin).language,
        write: (plugin, value) => state(plugin).setLanguageSetting(String(value)),
        // Every label on the screen is built from the locale.
        rereadDefinitions: true,
    },

    // --- Saving --------------------------------------------------------
    autoSaveOnSwitch: {
        read: (plugin) => plugin.getSessionSaver().isAutoSaveOnSwitchEnabled(),
        write: (plugin, value) => plugin.getSessionSaver().setAutoSaveOnSwitch(value === true),
    },
    warnUnsavedSwitch: {
        read: (plugin) => plugin.getSessionSaver().isWarnOnUnsavedSwitchEnabled(),
        write: (plugin, value) => state(plugin).setWarnOnUnsavedSwitch(value === true),
    },
    highlightUnsavedSessionChanges: {
        read: (plugin) => plugin.getSessionSaver().isUnsavedStatusBarHighlightEnabled(),
        write: (plugin, value) => state(plugin).setUnsavedStatusBarHighlight(value === true),
    },
    restoreSidebars: {
        read: (plugin) => state(plugin).restoreSidebars,
        write: (plugin, value) => state(plugin).setRestoreSidebars(value === true),
    },

    // --- Switch commands and preview -----------------------------------
    showActiveSwitchCommand: {
        read: (plugin) => state(plugin).showActiveSwitchCommand,
        write: (plugin, value) => state(plugin).setShowActiveSwitchCommand(value === true),
    },
    numberedSwitchCommands: {
        read: (plugin) => state(plugin).numberedSwitchCommands,
        write: (plugin, value) => state(plugin).setNumberedSwitchCommands(value === true),
    },
    /**
     * On when either direction previews, which is what makes it a master.
     *
     * It used to read `next && previous`, so turning one direction off read as
     * the whole feature being off. That was harmless while the two children
     * were always on screen; now that they are hidden when the master is off,
     * `&&` would hide the row you would need to get back to one-direction-only.
     *
     * Turning it on sets *both* directions on, every time - so a press always
     * lands in the same state, whatever the two were left at before. That is
     * why all three of these ask for a re-read: this write moves the two rows
     * below it, and those two move this one, and `refreshDomState` alone would
     * leave whichever row it was not told about showing its previous value.
     */
    switchPreviewEnabled: {
        read: (plugin) => state(plugin).previewNext || state(plugin).previewPrevious,
        write: (plugin, value) => state(plugin).setSwitchPreviewEnabled(value === true),
        rereadDefinitions: true,
    },
    previewNext: {
        read: (plugin) => state(plugin).previewNext,
        write: (plugin, value) => state(plugin).setPreviewNext(value === true),
        rereadDefinitions: true,
    },
    previewPrevious: {
        read: (plugin) => state(plugin).previewPrevious,
        write: (plugin, value) => state(plugin).setPreviewPrevious(value === true),
        rereadDefinitions: true,
    },

    // --- Overlay -------------------------------------------------------
    showFilterInput: {
        read: (plugin) => state(plugin).showFilterInput,
        write: (plugin, value) => state(plugin).setShowFilterInput(value === true),
    },

    // --- Confirmations -------------------------------------------------
    confirmQuickActions: {
        read: (plugin) => state(plugin).confirmQuickActions,
        write: (plugin, value) => state(plugin).setConfirmQuickActions(value === true),
    },
    confirmDeleteByHotkey: {
        // Absent means on: the confirmation predates the setting.
        read: (plugin) => state(plugin).confirmDeleteByHotkey,
        write: (plugin, value) => state(plugin).setConfirmDeleteByHotkey(value === true),
    },

    // --- Scroll switching ----------------------------------------------
    statusBarModScrollSwitch: {
        read: (plugin) => state(plugin).statusBarModScrollSwitch,
        write: (plugin, value) => state(plugin).setStatusBarModScrollSwitch(value === true),
    },
    statusBarScrollPreset: {
        read: (plugin) => state(plugin).statusBarScrollPreset,
        write: (plugin, value) => state(plugin).setStatusBarScrollPreset(String(value)),
    },
    statusBarScrollModifier: {
        // 'recommended' is the stored name of what the UI calls modOrAlt.
        read: (plugin) => (state(plugin).statusBarScrollModifierMode === 'recommended'
            ? 'modOrAlt'
            : state(plugin).statusBarScrollModifierMode),
        write: (plugin, value) => state(plugin).setStatusBarScrollModifierMode(String(value)),
    },
    statusBarScrollThreshold: {
        read: (plugin) => String(state(plugin).statusBarScrollThreshold),
        write: (plugin, value) => state(plugin).setStatusBarScrollThreshold(String(value)),
    },
    statusBarScrollCooldown: {
        read: (plugin) => String(state(plugin).statusBarScrollCooldownMs),
        write: (plugin, value) => state(plugin).setStatusBarScrollCooldownMs(String(value)),
    },
    statusBarScrollResetWindow: {
        read: (plugin) => String(state(plugin).statusBarScrollResetMs),
        write: (plugin, value) => state(plugin).setStatusBarScrollResetMs(String(value)),
    },
    statusBarScrollInvert: {
        read: (plugin) => state(plugin).statusBarScrollInvert,
        write: (plugin, value) => state(plugin).setStatusBarScrollInvert(value === true),
    },

    // --- Version history -----------------------------------------------
    versionHistoryEnabled: {
        read: (plugin) => plugin.getHistoryService().isVersionHistoryEnabled(),
        write: (plugin, value) => state(plugin).setVersionHistoryEnabled(value === true),
    },
    versionHistoryInterval: {
        read: (plugin) => String(plugin.getHistoryService().getVersionHistorySnapshotInterval()),
        write: (plugin, value) => state(plugin).setVersionHistorySnapshotInterval(String(value)),
    },
    versionHistoryConfirmRestore: {
        read: (plugin) => plugin.getHistoryService().isVersionHistoryConfirmRestoreEnabled(),
        write: (plugin, value) => state(plugin).setVersionHistoryConfirmRestore(value === true),
    },

    /**
     * How many rotating backups to keep.
     *
     * The prune runs on the write, so lowering the count deletes what is no
     * longer kept there and then. The alternative - waiting for the next
     * backup - leaves the list below showing files the setting says are gone.
     */
    rotationBackupGenerations: {
        read: (plugin) => String(state(plugin).rotationBackupGenerations),
        write: (plugin, value) => state(plugin)
            .setRotationBackupGenerations(value)
            .then(() => plugin.pruneRotationBackups()),
        rereadDefinitions: true,
    },

    // --- Groups --------------------------------------------------------
    groupFeatureEnabled: {
        read: (plugin) => plugin.getGroupStore().isGroupFeatureEnabled(),
        write: (plugin, value) => plugin.getGroupStore().setGroupFeatureEnabled(value === true),
        // Turning the feature on reveals the group list, which is items.
        rereadDefinitions: true,
    },

    // --- Storage -------------------------------------------------------
    vaultOnlySessions: {
        read: (plugin) => plugin.getSessionStorageLocation() === 'vault-folder',
        write: (plugin, value) => plugin
            .setSessionStorageLocation(value === true ? 'vault-folder' : 'plugin-folder')
            .catch(() => {
                // The move rolls itself back, so what the screen shows has to
                // come from what the location actually is now.
                new Notice(text(L.sessionStorageMoveFailed));
            }),
        // The path is quoted in a description on the same page.
        rereadDefinitions: true,
    },
};

for (const slotKey of statusBarActions.SLOT_KEYS) {
    CONTROL_BINDINGS[`statusBarActions.${slotKey}`] = {
        read: (plugin) => state(plugin).statusBarActions[slotKey] || 'none',
        write: (plugin, value) => state(plugin).setStatusBarAction(slotKey, String(value)),
    };
}
