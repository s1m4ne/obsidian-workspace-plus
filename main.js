"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// src/i18n.js
var require_i18n = __commonJS({
  "src/i18n.js"(exports2) {
    "use strict";
    function ruPlural(n, one, few, many) {
      var mod100 = Math.abs(n) % 100;
      var mod10 = mod100 % 10;
      if (mod100 >= 11 && mod100 <= 14) return many;
      if (mod10 === 1) return one;
      if (mod10 >= 2 && mod10 <= 4) return few;
      return many;
    }
    function arPlural(n, one, two, few, many) {
      if (n === 1) return one;
      if (n === 2) return two;
      if (n <= 10) return n + " " + few;
      return n + " " + many;
    }
    function isMacPlatform() {
      return typeof navigator !== "undefined" && typeof navigator.platform === "string" && navigator.platform.indexOf("Mac") !== -1;
    }
    function platformLabel(macText, otherText) {
      return function() {
        return isMacPlatform() ? macText : otherText;
      };
    }
    function modifiedClickLabel(baseText, macKey, otherKey) {
      return function() {
        return (isMacPlatform() ? macKey : otherKey) + " + " + baseText;
      };
    }
    var STRINGS = {
      en: {
        modalTitle: "Manage sessions",
        savePlaceholder: "New session name...",
        filterPlaceholder: "Filter sessions...",
        settingsShowFilterInput: "Show session filter",
        settingsShowFilterInputDesc: "Display a text filter in the Session Manager to quickly find sessions.",
        settingsOverlayDefaultFocus: "Default overlay focus",
        settingsOverlayDefaultFocusDesc: "Choose which element receives focus when the Session Manager opens.",
        settingsOverlayFocusCurrentSession: "Current session",
        settingsOverlayFocusSessionFilter: "Session filter",
        settingsOverlayFocusSessionCreate: "Session creation",
        settingsSectionSessionManager: "Session list and search",
        settingsSectionSessionListSearch: "Session list and search",
        settingsShowActiveSwitchCommand: "Show active session in command palette",
        settingsShowActiveSwitchCommandDesc: "Show the switch command for the currently active session in the command palette. Hotkeys always work regardless of this setting.",
        settingsNumberedSwitchCommands: "Numbered session switching commands",
        settingsNumberedSwitchCommandsDesc: "Register switch commands with numbered slots (1\u20139) that can be bound to hotkeys. When off, all sessions use name-based commands instead.",
        save: "Create",
        load: "Switch",
        saveInline: "Save",
        active: "ACTIVE",
        modifiedJustNow: "Modified just now",
        modifiedMinutes: function(n) {
          return "Modified " + n + " minute" + (n !== 1 ? "s" : "") + " ago";
        },
        modifiedHours: function(n) {
          return "Modified " + n + " hour" + (n !== 1 ? "s" : "") + " ago";
        },
        modifiedDays: function(n) {
          return "Modified " + n + " day" + (n !== 1 ? "s" : "") + " ago";
        },
        duplicateName: "A session with this name already exists.",
        emptyName: "Session name cannot be empty.",
        created: function(n) {
          return 'Session "' + n + '" created';
        },
        deleted: function(n) {
          return 'Session "' + n + '" deleted';
        },
        loaded: function(n) {
          return 'Switched to "' + n + '"';
        },
        renamed: function(o, n) {
          return 'Renamed "' + o + '" to "' + n + '"';
        },
        confirmDelete: function(n) {
          return 'Delete session "' + n + '"?';
        },
        confirmDeleteActive: function(n) {
          return '"' + n + '" is the active session. Delete anyway?';
        },
        confirmSaveSession: function(n) {
          return 'Save session "' + n + '"?';
        },
        confirmOverwriteSessionWithCurrentLayout: function(n) {
          return 'Overwrite "' + n + '" with the current layout?';
        },
        confirmReloadSession: function(n) {
          return 'Reload session "' + n + '"? Unsaved changes will be lost.';
        },
        renameTitle: "Rename session",
        renamePlaceholder: "New name...",
        noSession: "No session",
        cannotDeleteLast: "The last session cannot be deleted.",
        confirmBulkDelete: function(n) {
          return "Delete " + n + " sessions?";
        },
        bulkDeleted: function(n) {
          return n + " sessions deleted";
        },
        bulkDelete: function(n) {
          return "Delete " + n + " sessions";
        },
        cmdManage: "Manage sessions",
        cmdCreate: "Create new session",
        cmdRename: "Rename current session",
        cmdDelete: "Delete current session",
        cmdNewEmpty: "Create blank session",
        cmdDuplicate: "Duplicate current session",
        duplicated: function(n) {
          return 'Duplicated as "' + n + '"';
        },
        deselect: "Deselect",
        footerDragReorder: "Drag to reorder",
        footerDragToGroup: "Drag to group tab to move",
        defaultLabel: "(default)",
        rename: "Rename",
        delete: "Delete",
        remove: "Remove",
        cancel: "Cancel",
        ribbonTooltip: "Workspace++",
        cmdSwitchTo: function(n, name) {
          return name ? "Switch to session " + n + ": " + name : "Switch to session " + n;
        },
        cmdSwitchToNamed: function(name) {
          return 'Switch to "' + name + '"';
        },
        cmdPrevious: "Previous session",
        cmdNext: "Next session",
        cmdSaveCurrent: "Save current session",
        cmdSaveAs: "Save current session as...",
        cmdSaveCurrentLayoutToSession: "Save current layout to session...",
        cmdReloadCurrentWithoutSaving: "Reload current session (without saving)",
        cmdToggleAutoSave: "Toggle auto-save on switch",
        cmdEnableAutoSave: "Enable auto-save on switch",
        cmdDisableAutoSave: "Disable auto-save on switch",
        cmdSearchOverlay: "Search sessions",
        cmdExportSessions: "Export sessions snapshot",
        cmdImportSessions: "Import latest sessions snapshot",
        switchLeft: "Left",
        switchRight: "Right",
        switchGroup: "Group",
        keyTab: "Tab",
        savedSession: function(n) {
          return 'Saved "' + n + '"';
        },
        savedAs: function(n) {
          return 'Saved as "' + n + '"';
        },
        savedCurrentLayoutToSession: function(n) {
          return 'Saved current layout to "' + n + '"';
        },
        noChanges: "No changes to save",
        reloadedSession: function(n) {
          return 'Reloaded "' + n + '"';
        },
        autoSaveEnabled: "Auto-save on switch enabled.",
        autoSaveDisabled: "Auto-save on switch disabled.",
        confirmUnsavedSwitch: function(n) {
          return 'Current session has unsaved changes. Switch to "' + n + '"?';
        },
        saveAndSwitch: "Save and switch",
        switchWithoutSaving: "Switch without saving",
        defaultSessionName: "default",
        nameSessionTitle: "Save with a session name",
        nameSessionPlaceholder: "Session name...",
        saveWithoutNaming: "Save without naming",
        sessionAutoName: function(n) {
          return "New session " + n;
        },
        noFilteredSessions: "No matching sessions",
        noGroupSessions: "No sessions in this group",
        searchOverlayPlaceholder: "Type to filter sessions...",
        saveCurrentLayoutToSessionPlaceholder: "Select a session to overwrite...",
        searchOverlayHelp: "\u2191\u2193 move  /  Enter switch  /  \u21E7Enter save  /  \u232B delete  /  Esc close",
        backupRestored: "Workspace++: Restored sessions from backup.",
        sessionDataMigrated: "Workspace++: Session data moved to .workspace-plus-plus/sessions.json.",
        sessionDataMigrationFailed: "Workspace++: Failed to migrate session data. Legacy data is still kept.",
        localSettingsEnabled: "Workspace++: Vault-local settings enabled.",
        localSettingsDisabled: "Workspace++: Vault-local settings disabled.",
        localSettingsCopied: "Workspace++: Copied global settings to vault-local settings.",
        localSettingsLoadFailed: "Workspace++: Failed to load vault-local settings. Using global settings.",
        localSettingsOperationFailed: "Workspace++: Failed to update vault-local settings.",
        exportSessionsDone: function(path) {
          return "Workspace++: Exported sessions to " + path;
        },
        exportSessionsFailed: "Workspace++: Failed to export sessions.",
        importSessionsDone: function(path) {
          return "Workspace++: Imported sessions from " + path;
        },
        importSessionsNoFile: "Workspace++: No export file found in .workspace-plus-plus/exports.",
        importSessionsFailed: "Workspace++: Failed to import sessions.",
        settingsLanguage: "Language",
        settingsLanguageDesc: "Plugin UI language. Restart Obsidian to apply to command names.",
        settingsSectionGeneral: "General",
        settingsTabSessions: "Sessions",
        settingsSectionSwitching: "Session switching",
        settingsSectionSwitchCommands: "Switch commands",
        settingsSectionScrollSwitch: "Scroll switching",
        settingsSectionSwitchPreview: "Preview before switching",
        settingsSubsectionSwitchSaving: "Saving when switching sessions",
        settingsSubsectionAutoSaveMode: "Session auto-save mode",
        settingsSubsectionSwitchCommands: "Session switching commands",
        settingsSubsectionScrollSwitch: "Session switching with scroll",
        settingsSubsectionSwitchPreview: "Preview before switching sessions",
        settingsSectionDeletion: "Deleting sessions",
        settingsSectionAdvanced: "Advanced",
        settingsSectionReset: "Reset",
        settingsStatusBarModScrollSwitch: "Enable session switching from the status bar",
        settingsStatusBarModScrollSwitchDesc: "On the status bar item, scroll vertically while holding the selected modifier key to switch sessions. Thresholding and cooldown reduce accidental trackpad triggers.",
        settingsStatusBarScrollPreset: "Scroll input preset",
        settingsStatusBarScrollPresetDesc: "Choose a preset tuned for your device, or switch to Custom to adjust the numbers yourself.",
        settingsStatusBarScrollPresetTrackpad: "Trackpad",
        settingsStatusBarScrollPresetNotchedWheel: "Notched mouse wheel",
        settingsStatusBarScrollPresetFreeSpinWheel: "Free-spin mouse wheel",
        settingsStatusBarScrollPresetCustom: "Custom",
        settingsStatusBarScrollModifier: "Required modifier",
        settingsStatusBarScrollModifierDesc: "Choose which modifier must be held while scrolling on the status bar item.",
        settingsStatusBarScrollModifierRecommended: function() {
          return typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "Cmd or Option" : "Ctrl or Alt";
        },
        settingsStatusBarScrollModifierNone: "None",
        settingsStatusBarScrollModifierModOnly: function() {
          return typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "Cmd only" : "Ctrl only";
        },
        settingsStatusBarScrollModifierAltOnly: function() {
          return typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "Option only" : "Alt only";
        },
        settingsStatusBarScrollModifierModOrAlt: function() {
          return typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "Cmd or Option" : "Ctrl or Alt";
        },
        settingsStatusBarScrollThreshold: "Sensitivity threshold",
        settingsStatusBarScrollThresholdDesc: "Lower values switch more easily. Used only when the preset is Custom.",
        settingsStatusBarScrollCooldown: "Cooldown",
        settingsStatusBarScrollCooldownDesc: "Minimum time between scroll-triggered session switches. Used only when the preset is Custom.",
        settingsStatusBarScrollResetWindow: "Accumulation reset window",
        settingsStatusBarScrollResetWindowDesc: "How long to keep combining small scroll deltas before resetting. Used only when the preset is Custom.",
        settingsStatusBarScrollInvert: "Invert scroll direction",
        settingsStatusBarScrollInvertDesc: "Reverse the previous/next direction for status bar scroll switching.",
        settingsLangAuto: "Auto (system language)",
        settingsGitHubLink: "GitHub",
        settingsTranslationHelp: "Found a translation error? Please open an issue or pull request on GitHub.",
        settingsPreviewHeading: "Enable preview before switching sessions",
        settingsPreviewDesc: "When switching sessions with a hotkey, the first press shows your current position without switching.",
        settingsPreviewNext: "Next session",
        settingsPreviewPrevious: "Previous session",
        settingsHotkeys: "Hotkeys",
        settingsHotkeysBtn: "Open hotkey settings",
        contextOpenSettings: "Open settings",
        contextCustomizeClicks: "Customize click actions",
        settingsSectionStatusBar: "Status bar click actions",
        statusBarSlotClick: "Click",
        statusBarSlotAltClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + Click";
        },
        statusBarSlotModClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + Click";
        },
        statusBarSlotShiftClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + Click";
        },
        statusBarSlotMiddleClick: "Middle-click",
        statusBarSlotAltMiddleClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + Middle-click";
        },
        statusBarSlotModMiddleClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + Middle-click";
        },
        statusBarSlotShiftMiddleClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + Middle-click";
        },
        statusBarSlotRightClick: "Right-click",
        statusBarSlotAltRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + Right-click";
        },
        statusBarSlotModRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + Right-click";
        },
        statusBarSlotShiftRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + Right-click";
        },
        statusBarActionNone: "Do nothing",
        statusBarActionQuickSwitcher: "Open Quick Switcher",
        statusBarActionSessionManager: "Open Session Manager",
        statusBarActionSaveSession: "Save session",
        statusBarActionReloadWithoutSaving: "Reload without saving",
        statusBarActionVersionHistory: "Show version history",
        statusBarActionRestoreLatestHistory: "Restore latest history",
        statusBarActionSessionMenu: "Session context menu",
        statusBarActionSettingsMenu: "Settings context menu",
        contextResetOverlayPosition: "Reset position and size",
        settingsConfirmDelete: "Confirm before deleting a session",
        settingsConfirmDeleteDesc: "Show a confirmation dialog before deleting a session.",
        settingsConfirmQuickActions: "Confirm save/reload in quick switcher",
        settingsConfirmQuickActionsDesc: "Show a confirmation dialog before saving or reloading a session from the quick switcher overlay.",
        settingsAutoSaveOnSwitch: "Auto-save mode",
        settingsAutoSaveOnSwitchDesc: "Automatically saves the current session when switching (default: ON). When OFF, you can save and reload sessions manually.",
        settingsWarnUnsavedSwitch: "Warn before switching without saving",
        settingsWarnUnsavedSwitchDesc: "When auto-save is off and current session has unsaved changes, show a warning before switching.",
        settingsStatusBarQuickSwitcher: "Quick switcher on status bar click",
        settingsStatusBarQuickSwitcherDesc: "When enabled, clicking the status bar opens the quick switcher overlay instead of the full session manager.",
        settingsUseLocalSettings: "Use vault-local settings",
        settingsUseLocalSettingsDesc: "Turn this on if you sync .obsidian between vaults (for example, with Settings Profiles) and want Workspace++ settings to stay different per vault.",
        settingsCopyGlobalToLocal: "Copy global settings to this vault",
        settingsCopyGlobalToLocalDesc: "Overwrite vault-local settings with your current global settings.",
        settingsCopyGlobalToLocalBtn: "Copy",
        settingsResetLocalSettings: "Reset vault-local settings",
        settingsResetLocalSettingsDesc: "Reset vault-local settings back to your global settings.",
        settingsResetLocalSettingsBtn: "Reset local",
        settingsAdvancedStorageSubsection: "Storage behavior",
        settingsAdvancedTransferSubsection: "Data transfer",
        settingsDeveloperSection: "Developer tools",
        settingsStorageDiagnostics: "Storage diagnostics",
        settingsStorageDiagnosticsDesc: "Storage details currently used by Workspace++.",
        settingsStorageFieldSessions: "Sessions file",
        settingsStorageFieldSessionsBackup: "Sessions backup",
        settingsStorageFieldLocalSettings: "Local settings file",
        settingsStorageFieldGlobalSettings: "Global settings file",
        settingsStorageFieldSessionCount: "Session count",
        settingsStorageFieldUpdatedAt: "Updated at",
        settingsExportSessions: "Export sessions",
        settingsExportSessionsDesc: "Save a snapshot to .workspace-plus-plus/exports.",
        settingsExportSessionsBtn: "Export",
        settingsImportSessions: "Import sessions",
        settingsImportSessionsDesc: "Import the latest snapshot from .workspace-plus-plus/exports.",
        settingsImportSessionsBtn: "Import latest",
        confirmImportSessions: "Import the latest exported sessions? Current sessions will be replaced.",
        settingsResetSettings: "Reset settings",
        settingsResetSettingsDesc: "Reset Workspace++ settings for the current settings scope.",
        settingsResetSettingsBtn: "Reset settings",
        confirmResetSettings: "Reset Workspace++ settings to defaults?",
        resetSettingsDone: "Workspace++ settings have been reset.",
        resetSettingsFailed: "Failed to reset Workspace++ settings.",
        settingsResetSessions: "Reset sessions",
        settingsResetSessionsDesc: "Delete all saved sessions and keep only a fresh default session from the current layout.",
        settingsResetSessionsBtn: "Reset",
        confirmResetSessions: "Reset all sessions to default? This cannot be undone.",
        resetSessionsHint: "This will remove every saved session and keep only one default session.",
        resetSessionsDone: "Sessions have been reset to default.",
        resetSessionsFailed: "Failed to reset sessions.",
        settingsResetSessionsAndSettings: "Reset sessions and settings",
        settingsResetSessionsAndSettingsDesc: "Reset both saved sessions and Workspace++ settings at once.",
        settingsResetSessionsAndSettingsBtn: "Reset both",
        confirmResetSessionsAndSettings: "Reset both sessions and settings? This cannot be undone.",
        resetSessionsAndSettingsDone: "Sessions and settings have been reset.",
        resetSessionsAndSettingsFailed: "Failed to reset sessions and settings.",
        confirmDeleteSettingsHint: "To disable this confirmation, go to Settings.",
        // --- Groups ---
        groupCreated: function(n) {
          return 'Group "' + n + '" created';
        },
        groupDeleted: function(n) {
          return 'Group "' + n + '" deleted';
        },
        groupRenamed: function(o, n) {
          return 'Group renamed: "' + o + '" \u2192 "' + n + '"';
        },
        groupAll: "All",
        groupDuplicateName: "A group with this name already exists.",
        groupEmptyName: "Group name cannot be empty.",
        cmdSwitchGroup: "Switch group",
        cmdExitGroup: "Show all sessions (exit group)",
        cmdNextGroup: "Next group",
        cmdPreviousGroup: "Previous group",
        searchOverlayHelpWithGroups: "\u2191\u2193 move  /  Tab group  /  Enter switch  /  \u21E7Enter save  /  \u232B delete  /  Esc close",
        settingsSectionGroups: "Session groups",
        contextToggleGroups: "Enable session groups",
        settingsSectionGroupsDesc: "Use groups to organize sessions. Turn this off to hide group tabs and group-switch actions.",
        settingsGroupCreate: "Create group",
        settingsGroupCreateDesc: "Create a new session group.",
        settingsGroupCreatePlaceholder: "Group name...",
        settingsGroupCreateBtn: "Create",
        settingsGroupManageSessions: "Manage sessions",
        settingsGroupManageSessionsDesc: "Add or remove sessions from this group.",
        settingsGroupSessionCount: function(n) {
          return n + " session" + (n !== 1 ? "s" : "");
        },
        settingsGroupDelete: "Delete group",
        settingsGroupDeleteConfirm: function(n) {
          return 'Delete group "' + n + '"? Sessions will not be deleted.';
        },
        confirmDeleteGroup: function(n) {
          return 'Delete group "' + n + '"? Sessions inside this group will NOT be deleted.';
        },
        groupAddedSession: function(s, g) {
          return 'Added "' + s + '" to "' + g + '"';
        },
        groupRemovedSession: function(s, g) {
          return 'Removed "' + s + '" from "' + g + '"';
        },
        groupRemoveFromGroup: "Remove from group",
        groupMoveToGroup: "Move to group",
        groupCreateNew: "New group",
        groupCreatePlaceholder: "Group name...",
        groupContextRename: "Rename group",
        groupContextDelete: "Delete group",
        contextSwitchSession: "Switch to this session",
        contextRenameSession: "Rename this session",
        contextDeleteSession: "Delete this session",
        contextDuplicateSession: "Duplicate this session",
        contextReloadSession: "Reload this session",
        contextSaveSession: "Save this session",
        contextSaveCurrentLayoutToThisSession: "Save current layout to this session",
        groupRemoveAllSessions: "Remove all sessions from this group",
        confirmRemoveAllFromGroup: function(g, n) {
          return "Remove all " + n + ' sessions from "' + g + '"?';
        },
        groupRemovedAllSessions: function(g) {
          return 'Removed all sessions from "' + g + '"';
        },
        contextDeleteAllGroups: "Delete all groups",
        confirmDeleteAllGroups: function(n) {
          return "Delete all " + n + " groups? Sessions will not be deleted.";
        },
        deletedAllGroups: function(n) {
          return n + " groups deleted";
        },
        contextDeleteAllSessions: "Delete all sessions",
        confirmDeleteAllSessions: function(n) {
          return "Delete " + n + " sessions? The active session will be kept.";
        },
        deletedAllSessions: function(n) {
          return n + " sessions deleted";
        },
        contextVersionHistory: "Version history",
        cmdVersionHistory: "View session version history",
        historyTitle: "Version history",
        historyEmpty: "No version history for this session.",
        historyRestore: "Restore",
        historyRestoreConfirm: function(name, time) {
          return 'Restore "' + name + '" layout from ' + time + "?";
        },
        historyRestored: function(name) {
          return 'Restored layout for "' + name + '"';
        },
        historyQuickRestored: function(name) {
          return 'Quick-restored previous layout for "' + name + '"';
        },
        historyNoEntries: "No previous layouts to restore.",
        historyToday: "Today",
        historyYesterday: "Yesterday",
        historyThisWeek: "This week",
        historyFiles: function(n) {
          return n + " file" + (n !== 1 ? "s" : "");
        },
        historyPanes: function(n) {
          return n + " pane" + (n !== 1 ? "s" : "");
        },
        settingsVersionHistoryEnabled: "Enable version history",
        settingsVersionHistoryEnabledDesc: "Keep a history of layout changes for each session.",
        settingsVersionHistoryInterval: "Snapshot interval (minutes)",
        settingsVersionHistoryIntervalDesc: "How often to check for layout changes and save a snapshot.",
        settingsVersionHistoryCtrlRmb: function() {
          return "Quick restore (" + (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "Cmd" : "Ctrl") + " + Right-click)";
        },
        settingsVersionHistoryCtrlRmbDesc: function() {
          return "Right-click the status bar while holding " + (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "Cmd" : "Ctrl") + " to restore the previous layout.";
        },
        settingsVersionHistoryConfirmRestore: "Confirm before restoring",
        settingsVersionHistoryConfirmRestoreDesc: "Show a confirmation dialog before restoring a previous layout.",
        rotationBackupSectionTitle: "Backup",
        rotationBackupCreate: "Create backup",
        rotationBackupCreateBtn: "Backup now",
        rotationBackupCreated: "Backup created.",
        rotationBackupFailed: "Failed to create backup.",
        rotationBackupDesc: "Automatic backups are created on save (hourly, up to 3 generations).",
        rotationBackupRestore: "Restore",
        rotationBackupRestoreConfirm: function(time, count) {
          return "Restore from backup at " + time + " (" + count + " session" + (count !== 1 ? "s" : "") + ")? Current data will be overwritten.";
        },
        rotationBackupRestored: "Restored from backup.",
        rotationBackupRestoreFailed: "Failed to restore from backup.",
        rotationBackupNone: "No backups available.",
        rotationBackupGeneration: function(count) {
          return count + " session" + (count !== 1 ? "s" : "");
        },
        frontmatterSessionNotFound: function(n) {
          return 'Session "' + n + '" not found (workspace-session)';
        },
        frontmatterAlreadyActive: function(n) {
          return 'Session "' + n + '" is already active';
        }
      },
      zh: {
        settingsStatusBarModScrollSwitch: "\u6309\u4F4F Ctrl/Cmd \u5E76\u6EDA\u52A8\u4EE5\u5207\u6362\u4F1A\u8BDD",
        settingsStatusBarModScrollSwitchDesc: "\u5728\u72B6\u6001\u680F\u9879\u76EE\u4E0A\uFF0C\u6309\u4F4F\u6240\u9009\u4FEE\u9970\u952E\u5E76\u5782\u76F4\u6EDA\u52A8\u5373\u53EF\u5207\u6362\u4F1A\u8BDD\u3002\u4F7F\u7528\u9608\u503C\u548C\u51B7\u5374\u65F6\u95F4\u4EE5\u51CF\u5C11\u89E6\u63A7\u677F\u8BEF\u89E6\u3002",
        modalTitle: "\u7BA1\u7406\u4F1A\u8BDD",
        savePlaceholder: "\u65B0\u4F1A\u8BDD\u540D\u79F0\u2026",
        filterPlaceholder: "\u7B5B\u9009\u4F1A\u8BDD...",
        settingsShowFilterInput: "\u663E\u793A\u4F1A\u8BDD\u7B5B\u9009",
        settingsShowFilterInputDesc: "\u5728\u4F1A\u8BDD\u7BA1\u7406\u5668\u4E2D\u663E\u793A\u6587\u672C\u7B5B\u9009\u6846\uFF0C\u5FEB\u901F\u67E5\u627E\u4F1A\u8BDD\u3002",
        settingsOverlayDefaultFocus: "\u9ED8\u8BA4\u53E0\u52A0\u5C42\u7126\u70B9",
        settingsOverlayDefaultFocusDesc: "\u9009\u62E9\u4F1A\u8BDD\u7BA1\u7406\u5668\u6253\u5F00\u65F6\u9ED8\u8BA4\u805A\u7126\u7684\u5143\u7D20\u3002",
        settingsOverlayFocusCurrentSession: "\u5F53\u524D\u4F1A\u8BDD",
        settingsOverlayFocusSessionFilter: "\u4F1A\u8BDD\u7B5B\u9009",
        settingsOverlayFocusSessionCreate: "\u521B\u5EFA\u4F1A\u8BDD",
        settingsSectionSessionManager: "\u4F1A\u8BDD\u7BA1\u7406\u5668",
        settingsShowActiveSwitchCommand: "\u5728\u547D\u4EE4\u9762\u677F\u4E2D\u663E\u793A\u5F53\u524D\u4F1A\u8BDD",
        settingsShowActiveSwitchCommandDesc: "\u5728\u547D\u4EE4\u9762\u677F\u4E2D\u663E\u793A\u5F53\u524D\u6D3B\u52A8\u4F1A\u8BDD\u7684\u5207\u6362\u547D\u4EE4\u3002\u65E0\u8BBA\u6B64\u8BBE\u7F6E\u5982\u4F55\uFF0C\u5FEB\u6377\u952E\u59CB\u7EC8\u6709\u6548\u3002",
        settingsNumberedSwitchCommands: "\u7F16\u53F7\u5207\u6362\u547D\u4EE4",
        settingsNumberedSwitchCommandsDesc: "\u6CE8\u518C\u7F16\u53F7\u69FD\u4F4D\uFF081\u20139\uFF09\u7684\u5207\u6362\u547D\u4EE4\uFF0C\u53EF\u7ED1\u5B9A\u5FEB\u6377\u952E\u3002\u5173\u95ED\u540E\uFF0C\u6240\u6709\u4F1A\u8BDD\u6539\u7528\u57FA\u4E8E\u540D\u79F0\u7684\u547D\u4EE4\u3002",
        save: "\u521B\u5EFA",
        load: "\u5207\u6362",
        saveInline: "\u4FDD\u5B58",
        active: "\u4F7F\u7528\u4E2D",
        modifiedJustNow: "\u521A\u521A\u4FEE\u6539",
        modifiedMinutes: function(n) {
          return n + " \u5206\u949F\u524D\u4FEE\u6539";
        },
        modifiedHours: function(n) {
          return n + " \u5C0F\u65F6\u524D\u4FEE\u6539";
        },
        modifiedDays: function(n) {
          return n + " \u5929\u524D\u4FEE\u6539";
        },
        duplicateName: "\u5DF2\u5B58\u5728\u540C\u540D\u4F1A\u8BDD\u3002",
        emptyName: "\u4F1A\u8BDD\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A\u3002",
        created: function(n) {
          return "\u5DF2\u521B\u5EFA\u4F1A\u8BDD\u201C" + n + "\u201D";
        },
        deleted: function(n) {
          return "\u5DF2\u5220\u9664\u4F1A\u8BDD\u201C" + n + "\u201D";
        },
        loaded: function(n) {
          return "\u5DF2\u5207\u6362\u81F3\u201C" + n + "\u201D";
        },
        renamed: function(o, n) {
          return "\u5DF2\u5C06\u201C" + o + "\u201D\u91CD\u547D\u540D\u4E3A\u201C" + n + "\u201D";
        },
        confirmDelete: function(n) {
          return "\u786E\u5B9A\u5220\u9664\u4F1A\u8BDD\u201C" + n + "\u201D\uFF1F";
        },
        confirmDeleteActive: function(n) {
          return "\u201C" + n + "\u201D\u662F\u5F53\u524D\u6D3B\u52A8\u4F1A\u8BDD\uFF0C\u786E\u5B9A\u5220\u9664\uFF1F";
        },
        confirmSaveSession: function(n) {
          return '\u4FDD\u5B58\u4F1A\u8BDD "' + n + '"\uFF1F';
        },
        confirmReloadSession: function(n) {
          return '\u91CD\u65B0\u52A0\u8F7D\u4F1A\u8BDD "' + n + '"\uFF1F\u672A\u4FDD\u5B58\u7684\u66F4\u6539\u5C06\u4E22\u5931\u3002';
        },
        renameTitle: "\u91CD\u547D\u540D\u4F1A\u8BDD",
        renamePlaceholder: "\u65B0\u540D\u79F0\u2026",
        noSession: "\u65E0\u4F1A\u8BDD",
        cannotDeleteLast: "\u6700\u540E\u4E00\u4E2A\u4F1A\u8BDD\u65E0\u6CD5\u5220\u9664\u3002",
        confirmBulkDelete: function(n) {
          return "\u786E\u5B9A\u5220\u9664 " + n + " \u4E2A\u4F1A\u8BDD\uFF1F";
        },
        bulkDeleted: function(n) {
          return "\u5DF2\u5220\u9664 " + n + " \u4E2A\u4F1A\u8BDD";
        },
        bulkDelete: function(n) {
          return "\u5220\u9664 " + n + " \u4E2A\u4F1A\u8BDD";
        },
        cmdManage: "\u7BA1\u7406\u4F1A\u8BDD",
        cmdCreate: "\u521B\u5EFA\u65B0\u4F1A\u8BDD",
        cmdRename: "\u91CD\u547D\u540D\u5F53\u524D\u4F1A\u8BDD",
        cmdDelete: "\u5220\u9664\u5F53\u524D\u4F1A\u8BDD",
        cmdNewEmpty: "\u521B\u5EFA\u7A7A\u767D\u4F1A\u8BDD",
        cmdDuplicate: "\u590D\u5236\u5F53\u524D\u4F1A\u8BDD",
        duplicated: function(n) {
          return "\u5DF2\u590D\u5236\u4E3A\u201C" + n + "\u201D";
        },
        deselect: "\u53D6\u6D88\u9009\u62E9",
        footerDragReorder: "\u62D6\u62FD\u6392\u5E8F",
        footerDragToGroup: "\u62D6\u62FD\u5230\u5206\u7EC4\u6807\u7B7E\u79FB\u52A8",
        defaultLabel: "\uFF08\u9ED8\u8BA4\uFF09",
        rename: "\u91CD\u547D\u540D",
        delete: "\u5220\u9664",
        remove: "\u79FB\u9664",
        cancel: "\u53D6\u6D88",
        ribbonTooltip: "Workspace++",
        cmdSwitchTo: function(n, name) {
          return name ? "\u5207\u6362\u81F3\u4F1A\u8BDD " + n + ": " + name : "\u5207\u6362\u81F3\u4F1A\u8BDD " + n;
        },
        cmdSwitchToNamed: function(name) {
          return '\u5207\u6362\u81F3 "' + name + '"';
        },
        cmdPrevious: "\u4E0A\u4E00\u4E2A\u4F1A\u8BDD",
        cmdNext: "\u4E0B\u4E00\u4E2A\u4F1A\u8BDD",
        cmdSaveCurrent: "\u4FDD\u5B58\u5F53\u524D\u4F1A\u8BDD",
        cmdSaveAs: "\u5C06\u5F53\u524D\u4F1A\u8BDD\u53E6\u5B58\u4E3A...",
        cmdToggleAutoSave: "\u5207\u6362\u4F1A\u8BDD\u5207\u6362\u65F6\u81EA\u52A8\u4FDD\u5B58",
        cmdEnableAutoSave: "\u542F\u7528\u4F1A\u8BDD\u5207\u6362\u65F6\u81EA\u52A8\u4FDD\u5B58",
        cmdDisableAutoSave: "\u7981\u7528\u4F1A\u8BDD\u5207\u6362\u65F6\u81EA\u52A8\u4FDD\u5B58",
        cmdSearchOverlay: "\u641C\u7D22\u4F1A\u8BDD",
        switchLeft: "\u5DE6",
        switchRight: "\u53F3",
        switchGroup: "\u5206\u7EC4",
        keyTab: "Tab",
        savedSession: function(n) {
          return "\u5DF2\u4FDD\u5B58\u4F1A\u8BDD\u201D" + n + "\u201D";
        },
        savedAs: function(n) {
          return "\u5DF2\u53E6\u5B58\u4E3A\u201D" + n + "\u201D";
        },
        noChanges: "\u6CA1\u6709\u9700\u8981\u4FDD\u5B58\u7684\u66F4\u6539",
        autoSaveEnabled: "\u5DF2\u542F\u7528\u4F1A\u8BDD\u5207\u6362\u65F6\u81EA\u52A8\u4FDD\u5B58\u3002",
        autoSaveDisabled: "\u5DF2\u7981\u7528\u4F1A\u8BDD\u5207\u6362\u65F6\u81EA\u52A8\u4FDD\u5B58\u3002",
        confirmUnsavedSwitch: function(n) {
          return "\u5F53\u524D\u4F1A\u8BDD\u6709\u672A\u4FDD\u5B58\u7684\u66F4\u6539\u3002\u8981\u5207\u6362\u5230\u201C" + n + "\u201D\u5417\uFF1F";
        },
        saveAndSwitch: "\u4FDD\u5B58\u5E76\u5207\u6362",
        switchWithoutSaving: "\u4E0D\u4FDD\u5B58\u76F4\u63A5\u5207\u6362",
        sessionAutoName: function(n) {
          return "\u65B0\u4F1A\u8BDD " + n;
        },
        noFilteredSessions: "\u6CA1\u6709\u5339\u914D\u7684\u4F1A\u8BDD",
        noGroupSessions: "\u6B64\u5206\u7EC4\u4E2D\u6CA1\u6709\u4F1A\u8BDD",
        searchOverlayPlaceholder: "\u8F93\u5165\u4EE5\u7B5B\u9009\u4F1A\u8BDD...",
        searchOverlayHelp: "\u2191\u2193 \u79FB\u52A8  /  Enter \u5207\u6362  /  \u21E7Enter \u4FDD\u5B58  /  \u232B \u5220\u9664  /  Esc \u5173\u95ED",
        backupRestored: "Workspace++: \u5DF2\u4ECE\u5907\u4EFD\u6062\u590D\u4F1A\u8BDD\u3002",
        settingsLanguage: "\u8BED\u8A00",
        settingsLanguageDesc: "\u63D2\u4EF6\u754C\u9762\u8BED\u8A00\u3002\u91CD\u542F Obsidian \u540E\u547D\u4EE4\u540D\u79F0\u624D\u4F1A\u66F4\u65B0\u3002",
        settingsSectionGeneral: "\u5E38\u89C4",
        settingsTabSessions: "\u4F1A\u8BDD",
        settingsSectionSwitching: "\u4F1A\u8BDD\u81EA\u52A8\u4FDD\u5B58",
        settingsSectionSwitchPreview: "\u4F1A\u8BDD\u5207\u6362",
        settingsSectionDeletion: "\u4F1A\u8BDD\u5220\u9664",
        settingsLangAuto: "\u81EA\u52A8\uFF08\u7CFB\u7EDF\u8BED\u8A00\uFF09",
        settingsTranslationHelp: "\u53D1\u73B0\u7FFB\u8BD1\u9519\u8BEF\uFF1F\u8BF7\u5728 GitHub \u4E0A\u63D0\u4EA4 issue \u6216 Pull request\u3002",
        settingsPreviewHeading: "\u5207\u6362\u524D\u663E\u793A\u5F53\u524D\u4F1A\u8BDD",
        settingsPreviewDesc: "\u4F7F\u7528\u5FEB\u6377\u952E\u5207\u6362\u4F1A\u8BDD\u65F6\uFF0C\u7B2C\u4E00\u6B21\u6309\u4E0B\u4EC5\u663E\u793A\u5F53\u524D\u4F4D\u7F6E\uFF0C\u4E0D\u8FDB\u884C\u5207\u6362\u3002",
        settingsPreviewNext: "\u4E0B\u4E00\u4E2A\u4F1A\u8BDD",
        settingsPreviewPrevious: "\u4E0A\u4E00\u4E2A\u4F1A\u8BDD",
        settingsHotkeys: "\u5FEB\u6377\u952E",
        settingsHotkeysBtn: "\u6253\u5F00\u5FEB\u6377\u952E\u8BBE\u7F6E",
        contextOpenSettings: "\u6253\u5F00\u8BBE\u7F6E",
        contextCustomizeClicks: "\u81EA\u5B9A\u4E49\u70B9\u51FB\u64CD\u4F5C",
        settingsSectionStatusBar: "\u72B6\u6001\u680F\u70B9\u51FB\u64CD\u4F5C",
        statusBarSlotClick: "\u70B9\u51FB",
        statusBarSlotAltClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + \u70B9\u51FB";
        },
        statusBarSlotModClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + \u70B9\u51FB";
        },
        statusBarSlotShiftClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + \u70B9\u51FB";
        },
        statusBarSlotMiddleClick: "\u4E2D\u952E\u70B9\u51FB",
        statusBarSlotAltMiddleClick: modifiedClickLabel("\u4E2D\u952E\u70B9\u51FB", "\u2325", "Alt"),
        statusBarSlotModMiddleClick: modifiedClickLabel("\u4E2D\u952E\u70B9\u51FB", "\u2318", "Ctrl"),
        statusBarSlotShiftMiddleClick: modifiedClickLabel("\u4E2D\u952E\u70B9\u51FB", "\u21E7", "Shift"),
        statusBarSlotRightClick: "\u53F3\u952E",
        statusBarSlotAltRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + \u53F3\u952E";
        },
        statusBarSlotModRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + \u53F3\u952E";
        },
        statusBarSlotShiftRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + \u53F3\u952E";
        },
        statusBarActionNone: "\u65E0\u64CD\u4F5C",
        statusBarActionQuickSwitcher: "\u6253\u5F00\u5FEB\u901F\u5207\u6362\u5668",
        statusBarActionSessionManager: "\u6253\u5F00\u4F1A\u8BDD\u7BA1\u7406\u5668",
        statusBarActionSaveSession: "\u4FDD\u5B58\u4F1A\u8BDD",
        statusBarActionReloadWithoutSaving: "\u4E0D\u4FDD\u5B58\u91CD\u65B0\u52A0\u8F7D",
        statusBarActionVersionHistory: "\u663E\u793A\u7248\u672C\u5386\u53F2",
        statusBarActionRestoreLatestHistory: "\u6062\u590D\u6700\u65B0\u5386\u53F2",
        statusBarActionSessionMenu: "\u4F1A\u8BDD\u4E0A\u4E0B\u6587\u83DC\u5355",
        statusBarActionSettingsMenu: "\u8BBE\u7F6E\u4E0A\u4E0B\u6587\u83DC\u5355",
        contextResetOverlayPosition: "\u91CD\u7F6E\u4F4D\u7F6E\u548C\u5927\u5C0F",
        settingsConfirmDelete: "\u5220\u9664\u4F1A\u8BDD\u524D\u786E\u8BA4",
        settingsConfirmDeleteDesc: "\u5220\u9664\u4F1A\u8BDD\u524D\u663E\u793A\u786E\u8BA4\u5BF9\u8BDD\u6846\u3002",
        settingsConfirmQuickActions: "\u5FEB\u901F\u5207\u6362\u5668\u4E2D\u4FDD\u5B58/\u91CD\u8F7D\u524D\u786E\u8BA4",
        settingsConfirmQuickActionsDesc: "\u5728\u5FEB\u901F\u5207\u6362\u5668\u4E2D\u4FDD\u5B58\u6216\u91CD\u65B0\u52A0\u8F7D\u4F1A\u8BDD\u524D\u663E\u793A\u786E\u8BA4\u5BF9\u8BDD\u6846\u3002",
        settingsAutoSaveOnSwitch: "\u81EA\u52A8\u4FDD\u5B58\u6A21\u5F0F",
        settingsAutoSaveOnSwitchDesc: "\u5207\u6362\u4F1A\u8BDD\u65F6\u81EA\u52A8\u4FDD\u5B58\u5F53\u524D\u4F1A\u8BDD\uFF08\u9ED8\u8BA4\uFF1A\u5F00\u542F\uFF09\u3002\u5173\u95ED\u540E\u53EF\u624B\u52A8\u63A7\u5236\u4FDD\u5B58\u548C\u91CD\u65B0\u52A0\u8F7D\u3002",
        settingsWarnUnsavedSwitch: "\u672A\u4FDD\u5B58\u65F6\u5207\u6362\u524D\u8B66\u544A",
        settingsWarnUnsavedSwitchDesc: "\u5F53\u81EA\u52A8\u4FDD\u5B58\u5173\u95ED\u4E14\u5F53\u524D\u4F1A\u8BDD\u6709\u672A\u4FDD\u5B58\u66F4\u6539\u65F6\uFF0C\u5207\u6362\u524D\u663E\u793A\u8B66\u544A\u3002",
        settingsStatusBarQuickSwitcher: "\u72B6\u6001\u680F\u70B9\u51FB\u65F6\u4F7F\u7528\u5FEB\u901F\u5207\u6362\u5668",
        settingsStatusBarQuickSwitcherDesc: "\u542F\u7528\u540E\uFF0C\u70B9\u51FB\u72B6\u6001\u680F\u5C06\u6253\u5F00\u5FEB\u901F\u5207\u6362\u8986\u76D6\u5C42\uFF0C\u800C\u975E\u5B8C\u6574\u7684\u4F1A\u8BDD\u7BA1\u7406\u5668\u3002",
        settingsResetSessions: "\u91CD\u7F6E\u4F1A\u8BDD",
        settingsResetSessionsDesc: "\u5220\u9664\u6240\u6709\u5DF2\u4FDD\u5B58\u4F1A\u8BDD\uFF0C\u5E76\u4EC5\u4FDD\u7559\u57FA\u4E8E\u5F53\u524D\u5E03\u5C40\u7684\u65B0\u9ED8\u8BA4\u4F1A\u8BDD\u3002",
        settingsResetSessionsBtn: "\u91CD\u7F6E",
        confirmResetSessions: "\u8981\u5C06\u6240\u6709\u4F1A\u8BDD\u91CD\u7F6E\u4E3A\u9ED8\u8BA4\u5417\uFF1F\u6B64\u64CD\u4F5C\u65E0\u6CD5\u64A4\u9500\u3002",
        resetSessionsHint: "\u8FD9\u5C06\u79FB\u9664\u6240\u6709\u5DF2\u4FDD\u5B58\u4F1A\u8BDD\uFF0C\u5E76\u4EC5\u4FDD\u7559\u4E00\u4E2A\u9ED8\u8BA4\u4F1A\u8BDD\u3002",
        resetSessionsDone: "\u4F1A\u8BDD\u5DF2\u91CD\u7F6E\u4E3A\u9ED8\u8BA4\u3002",
        resetSessionsFailed: "\u91CD\u7F6E\u4F1A\u8BDD\u5931\u8D25\u3002",
        confirmDeleteSettingsHint: "\u5982\u4E0D\u9700\u8981\u6B64\u786E\u8BA4\uFF0C\u8BF7\u524D\u5F80\u8BBE\u7F6E\u5173\u95ED\u3002",
        // --- Groups ---
        groupCreated: function(n) {
          return "\u5DF2\u521B\u5EFA\u5206\u7EC4\u201C" + n + "\u201D";
        },
        groupDeleted: function(n) {
          return "\u5DF2\u5220\u9664\u5206\u7EC4\u201C" + n + "\u201D";
        },
        groupRenamed: function(o, n) {
          return "\u5206\u7EC4\u5DF2\u91CD\u547D\u540D\uFF1A\u201C" + o + "\u201D \u2192 \u201C" + n + "\u201D";
        },
        groupAll: "\u5168\u90E8",
        groupDuplicateName: "\u5DF2\u5B58\u5728\u540C\u540D\u5206\u7EC4\u3002",
        groupEmptyName: "\u5206\u7EC4\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A\u3002",
        cmdSwitchGroup: "\u5207\u6362\u5206\u7EC4",
        cmdExitGroup: "\u663E\u793A\u6240\u6709\u4F1A\u8BDD\uFF08\u9000\u51FA\u5206\u7EC4\uFF09",
        cmdNextGroup: "\u4E0B\u4E00\u4E2A\u5206\u7EC4",
        cmdPreviousGroup: "\u4E0A\u4E00\u4E2A\u5206\u7EC4",
        searchOverlayHelpWithGroups: "\u2191\u2193 \u79FB\u52A8  /  Tab \u5206\u7EC4  /  Enter \u5207\u6362  /  \u21E7Enter \u4FDD\u5B58  /  \u232B \u5220\u9664  /  Esc \u5173\u95ED",
        settingsSectionGroups: "\u4F1A\u8BDD\u5206\u7EC4",
        contextToggleGroups: "\u542F\u7528\u4F1A\u8BDD\u5206\u7EC4",
        settingsSectionGroupsDesc: "\u4F7F\u7528\u5206\u7EC4\u6765\u6574\u7406\u4F1A\u8BDD\u3002\u5173\u95ED\u540E\u5C06\u9690\u85CF\u5206\u7EC4\u6807\u7B7E\u548C\u5206\u7EC4\u5207\u6362\u64CD\u4F5C\u3002",
        settingsGroupCreate: "\u521B\u5EFA\u5206\u7EC4",
        settingsGroupCreateDesc: "\u521B\u5EFA\u4E00\u4E2A\u65B0\u7684\u4F1A\u8BDD\u5206\u7EC4\u3002",
        settingsGroupCreatePlaceholder: "\u5206\u7EC4\u540D\u79F0...",
        settingsGroupCreateBtn: "\u521B\u5EFA",
        settingsGroupManageSessions: "\u7BA1\u7406\u4F1A\u8BDD",
        settingsGroupManageSessionsDesc: "\u6DFB\u52A0\u6216\u79FB\u9664\u6B64\u5206\u7EC4\u4E2D\u7684\u4F1A\u8BDD\u3002",
        settingsGroupSessionCount: function(n) {
          return n + " \u4E2A\u4F1A\u8BDD";
        },
        settingsGroupDelete: "\u5220\u9664\u5206\u7EC4",
        settingsGroupDeleteConfirm: function(n) {
          return "\u786E\u5B9A\u5220\u9664\u5206\u7EC4\u201C" + n + "\u201D\uFF1F\u4F1A\u8BDD\u4E0D\u4F1A\u88AB\u5220\u9664\u3002";
        },
        confirmDeleteGroup: function(n) {
          return "\u786E\u5B9A\u5220\u9664\u5206\u7EC4\u201C" + n + "\u201D\uFF1F\u5206\u7EC4\u5185\u7684\u4F1A\u8BDD\u4E0D\u4F1A\u88AB\u5220\u9664\u3002";
        },
        groupAddedSession: function(s, g) {
          return "\u5DF2\u5C06\u201C" + s + "\u201D\u6DFB\u52A0\u5230\u201C" + g + "\u201D";
        },
        groupRemovedSession: function(s, g) {
          return "\u5DF2\u5C06\u201C" + s + "\u201D\u4ECE\u201C" + g + "\u201D\u4E2D\u79FB\u9664";
        },
        groupRemoveFromGroup: "\u4ECE\u5206\u7EC4\u4E2D\u79FB\u9664",
        groupMoveToGroup: "\u79FB\u52A8\u5230\u5206\u7EC4",
        groupCreateNew: "\u65B0\u5EFA\u5206\u7EC4",
        groupCreatePlaceholder: "\u5206\u7EC4\u540D\u79F0...",
        groupContextRename: "\u91CD\u547D\u540D\u5206\u7EC4",
        groupContextDelete: "\u5220\u9664\u5206\u7EC4",
        contextSwitchSession: "\u5207\u6362\u5230\u6B64\u4F1A\u8BDD",
        contextRenameSession: "\u91CD\u547D\u540D\u6B64\u4F1A\u8BDD",
        contextDeleteSession: "\u5220\u9664\u6B64\u4F1A\u8BDD",
        contextDuplicateSession: "\u590D\u5236\u6B64\u4F1A\u8BDD",
        contextReloadSession: "\u91CD\u65B0\u52A0\u8F7D\u6B64\u4F1A\u8BDD",
        contextSaveSession: "\u4FDD\u5B58\u6B64\u4F1A\u8BDD",
        groupRemoveAllSessions: "\u79FB\u9664\u6B64\u5206\u7EC4\u4E2D\u7684\u6240\u6709\u4F1A\u8BDD",
        confirmRemoveAllFromGroup: function(g, n) {
          return "\u786E\u5B9A\u4ECE\u201C" + g + "\u201D\u4E2D\u79FB\u9664\u5168\u90E8 " + n + " \u4E2A\u4F1A\u8BDD\uFF1F";
        },
        groupRemovedAllSessions: function(g) {
          return "\u5DF2\u4ECE\u201C" + g + "\u201D\u4E2D\u79FB\u9664\u6240\u6709\u4F1A\u8BDD";
        },
        contextDeleteAllGroups: "\u5220\u9664\u6240\u6709\u5206\u7EC4",
        confirmDeleteAllGroups: function(n) {
          return "\u786E\u5B9A\u5220\u9664\u5168\u90E8 " + n + " \u4E2A\u5206\u7EC4\uFF1F\u4F1A\u8BDD\u4E0D\u4F1A\u88AB\u5220\u9664\u3002";
        },
        deletedAllGroups: function(n) {
          return "\u5DF2\u5220\u9664 " + n + " \u4E2A\u5206\u7EC4";
        },
        contextDeleteAllSessions: "\u5220\u9664\u6240\u6709\u4F1A\u8BDD",
        confirmDeleteAllSessions: function(n) {
          return "\u786E\u5B9A\u5220\u9664 " + n + " \u4E2A\u4F1A\u8BDD\uFF1F\u5F53\u524D\u6D3B\u52A8\u4F1A\u8BDD\u5C06\u4FDD\u7559\u3002";
        },
        deletedAllSessions: function(n) {
          return "\u5DF2\u5220\u9664 " + n + " \u4E2A\u4F1A\u8BDD";
        },
        contextVersionHistory: "\u7248\u672C\u5386\u53F2",
        cmdVersionHistory: "\u67E5\u770B\u4F1A\u8BDD\u7248\u672C\u5386\u53F2",
        historyTitle: "\u7248\u672C\u5386\u53F2",
        historyEmpty: "\u6B64\u4F1A\u8BDD\u6682\u65E0\u7248\u672C\u5386\u53F2\u3002",
        historyRestore: "\u6062\u590D",
        historyRestoreConfirm: function(name, time) {
          return "\u5C06\u300C" + name + "\u300D\u7684\u5E03\u5C40\u6062\u590D\u5230 " + time + " \u7684\u72B6\u6001\uFF1F";
        },
        historyRestored: function(name) {
          return "\u5DF2\u6062\u590D\u300C" + name + "\u300D\u7684\u5E03\u5C40";
        },
        historyQuickRestored: function(name) {
          return "\u5DF2\u5FEB\u901F\u6062\u590D\u300C" + name + "\u300D\u7684\u4E0A\u4E00\u4E2A\u5E03\u5C40";
        },
        historyNoEntries: "\u6CA1\u6709\u53EF\u6062\u590D\u7684\u5386\u53F2\u8BB0\u5F55\u3002",
        historyToday: "\u4ECA\u5929",
        historyYesterday: "\u6628\u5929",
        historyThisWeek: "\u672C\u5468",
        historyFiles: function(n) {
          return n + " \u4E2A\u6587\u4EF6";
        },
        historyPanes: function(n) {
          return n + " \u4E2A\u9762\u677F";
        },
        settingsVersionHistoryEnabled: "\u542F\u7528\u7248\u672C\u5386\u53F2",
        settingsVersionHistoryEnabledDesc: "\u4E3A\u6BCF\u4E2A\u4F1A\u8BDD\u4FDD\u7559\u5E03\u5C40\u53D8\u66F4\u7684\u5386\u53F2\u8BB0\u5F55\u3002",
        settingsVersionHistoryInterval: "\u5FEB\u7167\u95F4\u9694\uFF08\u5206\u949F\uFF09",
        settingsVersionHistoryIntervalDesc: "\u68C0\u67E5\u5E03\u5C40\u53D8\u66F4\u5E76\u4FDD\u5B58\u5FEB\u7167\u7684\u9891\u7387\u3002",
        settingsVersionHistoryCtrlRmb: platformLabel("\u5FEB\u901F\u6062\u590D (Cmd + \u53F3\u952E)", "\u5FEB\u901F\u6062\u590D (Ctrl + \u53F3\u952E)"),
        settingsVersionHistoryCtrlRmbDesc: platformLabel("\u6309\u4F4F Cmd \u952E\u53F3\u952E\u70B9\u51FB\u72B6\u6001\u680F\u53EF\u6062\u590D\u4E0A\u4E00\u4E2A\u5E03\u5C40\u3002", "\u6309\u4F4F Ctrl \u952E\u53F3\u952E\u70B9\u51FB\u72B6\u6001\u680F\u53EF\u6062\u590D\u4E0A\u4E00\u4E2A\u5E03\u5C40\u3002"),
        settingsVersionHistoryConfirmRestore: "\u6062\u590D\u524D\u786E\u8BA4",
        settingsVersionHistoryConfirmRestoreDesc: "\u6062\u590D\u5E03\u5C40\u524D\u663E\u793A\u786E\u8BA4\u5BF9\u8BDD\u6846\u3002",
        rotationBackupSectionTitle: "\u5907\u4EFD",
        rotationBackupCreate: "\u521B\u5EFA\u5907\u4EFD",
        rotationBackupCreateBtn: "\u7ACB\u5373\u5907\u4EFD",
        rotationBackupCreated: "\u5907\u4EFD\u5DF2\u521B\u5EFA\u3002",
        rotationBackupFailed: "\u521B\u5EFA\u5907\u4EFD\u5931\u8D25\u3002",
        rotationBackupDesc: "\u4FDD\u5B58\u65F6\u81EA\u52A8\u521B\u5EFA\u5907\u4EFD\uFF08\u6BCF\u5C0F\u65F6\uFF0C\u6700\u591A3\u4E2A\u4E16\u4EE3\uFF09\u3002",
        rotationBackupRestore: "\u6062\u590D",
        rotationBackupRestoreConfirm: function(time, count) {
          return "\u4ECE " + time + " \u7684\u5907\u4EFD\u6062\u590D\uFF08" + count + " \u4E2A\u4F1A\u8BDD\uFF09\uFF1F\u5F53\u524D\u6570\u636E\u5C06\u88AB\u8986\u76D6\u3002";
        },
        rotationBackupRestored: "\u5DF2\u4ECE\u5907\u4EFD\u6062\u590D\u3002",
        rotationBackupRestoreFailed: "\u4ECE\u5907\u4EFD\u6062\u590D\u5931\u8D25\u3002",
        rotationBackupNone: "\u6CA1\u6709\u53EF\u7528\u7684\u5907\u4EFD\u3002",
        rotationBackupGeneration: function(count) {
          return count + " \u4E2A\u4F1A\u8BDD";
        },
        frontmatterSessionNotFound: function(n) {
          return "\u4F1A\u8BDD\u201C" + n + "\u201D\u672A\u627E\u5230\uFF08workspace-session\uFF09";
        },
        frontmatterAlreadyActive: function(n) {
          return "\u4F1A\u8BDD\u201C" + n + "\u201D\u5DF2\u5904\u4E8E\u6D3B\u52A8\u72B6\u6001";
        }
      },
      "zh-TW": {
        settingsStatusBarModScrollSwitch: "\u6309\u4F4F Ctrl/Cmd \u4E26\u6372\u52D5\u4EE5\u5207\u63DB\u5DE5\u4F5C\u968E\u6BB5",
        settingsStatusBarModScrollSwitchDesc: "\u5728\u72C0\u614B\u5217\u9805\u76EE\u4E0A\uFF0C\u6309\u4F4F\u6240\u9078\u4FEE\u98FE\u9375\u4E26\u5782\u76F4\u6372\u52D5\u5373\u53EF\u5207\u63DB\u5DE5\u4F5C\u968E\u6BB5\u3002\u4F7F\u7528\u95BE\u503C\u8207\u51B7\u537B\u6642\u9593\u4EE5\u6E1B\u5C11\u89F8\u63A7\u677F\u8AA4\u89F8\u3002",
        modalTitle: "\u7BA1\u7406\u5DE5\u4F5C\u968E\u6BB5",
        savePlaceholder: "\u65B0\u5DE5\u4F5C\u968E\u6BB5\u540D\u7A31\u2026",
        filterPlaceholder: "\u7BE9\u9078\u5DE5\u4F5C\u968E\u6BB5...",
        settingsShowFilterInput: "\u986F\u793A\u5DE5\u4F5C\u968E\u6BB5\u7BE9\u9078",
        settingsShowFilterInputDesc: "\u5728\u5DE5\u4F5C\u968E\u6BB5\u7BA1\u7406\u5668\u4E2D\u986F\u793A\u6587\u5B57\u7BE9\u9078\u6846\uFF0C\u5FEB\u901F\u5C0B\u627E\u5DE5\u4F5C\u968E\u6BB5\u3002",
        settingsOverlayDefaultFocus: "\u9810\u8A2D\u8986\u84CB\u5C64\u7126\u9EDE",
        settingsOverlayDefaultFocusDesc: "\u9078\u64C7\u5DE5\u4F5C\u968E\u6BB5\u7BA1\u7406\u5668\u958B\u555F\u6642\u9810\u8A2D\u805A\u7126\u7684\u5143\u7D20\u3002",
        settingsOverlayFocusCurrentSession: "\u76EE\u524D\u5DE5\u4F5C\u968E\u6BB5",
        settingsOverlayFocusSessionFilter: "\u5DE5\u4F5C\u968E\u6BB5\u7BE9\u9078",
        settingsOverlayFocusSessionCreate: "\u5EFA\u7ACB\u5DE5\u4F5C\u968E\u6BB5",
        settingsSectionSessionManager: "\u5DE5\u4F5C\u968E\u6BB5\u7BA1\u7406\u5668",
        settingsShowActiveSwitchCommand: "\u5728\u547D\u4EE4\u9762\u677F\u4E2D\u986F\u793A\u76EE\u524D\u5DE5\u4F5C\u968E\u6BB5",
        settingsShowActiveSwitchCommandDesc: "\u5728\u547D\u4EE4\u9762\u677F\u4E2D\u986F\u793A\u76EE\u524D\u6D3B\u52D5\u5DE5\u4F5C\u968E\u6BB5\u7684\u5207\u63DB\u547D\u4EE4\u3002\u7121\u8AD6\u6B64\u8A2D\u5B9A\u5982\u4F55\uFF0C\u5FEB\u6377\u9375\u59CB\u7D42\u6709\u6548\u3002",
        settingsNumberedSwitchCommands: "\u7DE8\u865F\u5207\u63DB\u547D\u4EE4",
        settingsNumberedSwitchCommandsDesc: "\u8A3B\u518A\u7DE8\u865F\u63D2\u69FD\uFF081\u20139\uFF09\u7684\u5207\u63DB\u547D\u4EE4\uFF0C\u53EF\u7D81\u5B9A\u5FEB\u6377\u9375\u3002\u95DC\u9589\u5F8C\uFF0C\u6240\u6709\u5DE5\u4F5C\u968E\u6BB5\u6539\u7528\u57FA\u65BC\u540D\u7A31\u7684\u547D\u4EE4\u3002",
        save: "\u5EFA\u7ACB",
        load: "\u5207\u63DB",
        saveInline: "\u5132\u5B58",
        active: "\u4F7F\u7528\u4E2D",
        modifiedJustNow: "\u525B\u525B\u4FEE\u6539",
        modifiedMinutes: function(n) {
          return n + " \u5206\u9418\u524D\u4FEE\u6539";
        },
        modifiedHours: function(n) {
          return n + " \u5C0F\u6642\u524D\u4FEE\u6539";
        },
        modifiedDays: function(n) {
          return n + " \u5929\u524D\u4FEE\u6539";
        },
        duplicateName: "\u5DF2\u6709\u540C\u540D\u7684\u5DE5\u4F5C\u968E\u6BB5\u3002",
        emptyName: "\u5DE5\u4F5C\u968E\u6BB5\u540D\u7A31\u4E0D\u53EF\u70BA\u7A7A\u3002",
        created: function(n) {
          return "\u5DF2\u5EFA\u7ACB\u5DE5\u4F5C\u968E\u6BB5\u300C" + n + "\u300D";
        },
        deleted: function(n) {
          return "\u5DF2\u522A\u9664\u5DE5\u4F5C\u968E\u6BB5\u300C" + n + "\u300D";
        },
        loaded: function(n) {
          return "\u5DF2\u5207\u63DB\u81F3\u300C" + n + "\u300D";
        },
        renamed: function(o, n) {
          return "\u5DF2\u5C07\u300C" + o + "\u300D\u91CD\u65B0\u547D\u540D\u70BA\u300C" + n + "\u300D";
        },
        confirmDelete: function(n) {
          return "\u78BA\u5B9A\u522A\u9664\u5DE5\u4F5C\u968E\u6BB5\u300C" + n + "\u300D\uFF1F";
        },
        confirmDeleteActive: function(n) {
          return "\u300C" + n + "\u300D\u662F\u76EE\u524D\u4F7F\u7528\u4E2D\u7684\u5DE5\u4F5C\u968E\u6BB5\uFF0C\u78BA\u5B9A\u522A\u9664\uFF1F";
        },
        confirmSaveSession: function(n) {
          return '\u5132\u5B58\u5DE5\u4F5C\u968E\u6BB5 "' + n + '"\uFF1F';
        },
        confirmReloadSession: function(n) {
          return '\u91CD\u65B0\u8F09\u5165\u5DE5\u4F5C\u968E\u6BB5 "' + n + '"\uFF1F\u672A\u5132\u5B58\u7684\u8B8A\u66F4\u5C07\u907A\u5931\u3002';
        },
        renameTitle: "\u91CD\u65B0\u547D\u540D\u5DE5\u4F5C\u968E\u6BB5",
        renamePlaceholder: "\u65B0\u540D\u7A31\u2026",
        noSession: "\u7121\u5DE5\u4F5C\u968E\u6BB5",
        cannotDeleteLast: "\u6700\u5F8C\u4E00\u500B\u5DE5\u4F5C\u968E\u6BB5\u7121\u6CD5\u522A\u9664\u3002",
        confirmBulkDelete: function(n) {
          return "\u78BA\u5B9A\u522A\u9664 " + n + " \u500B\u5DE5\u4F5C\u968E\u6BB5\uFF1F";
        },
        bulkDeleted: function(n) {
          return "\u5DF2\u522A\u9664 " + n + " \u500B\u5DE5\u4F5C\u968E\u6BB5";
        },
        bulkDelete: function(n) {
          return "\u522A\u9664 " + n + " \u500B\u5DE5\u4F5C\u968E\u6BB5";
        },
        cmdManage: "\u7BA1\u7406\u5DE5\u4F5C\u968E\u6BB5",
        cmdCreate: "\u5EFA\u7ACB\u65B0\u5DE5\u4F5C\u968E\u6BB5",
        cmdRename: "\u91CD\u65B0\u547D\u540D\u76EE\u524D\u7684\u5DE5\u4F5C\u968E\u6BB5",
        cmdDelete: "\u522A\u9664\u76EE\u524D\u7684\u5DE5\u4F5C\u968E\u6BB5",
        cmdNewEmpty: "\u5EFA\u7ACB\u7A7A\u767D\u5DE5\u4F5C\u968E\u6BB5",
        cmdDuplicate: "\u8907\u88FD\u76EE\u524D\u7684\u5DE5\u4F5C\u968E\u6BB5",
        duplicated: function(n) {
          return "\u5DF2\u8907\u88FD\u70BA\u300C" + n + "\u300D";
        },
        deselect: "\u53D6\u6D88\u9078\u53D6",
        footerDragReorder: "\u62D6\u66F3\u6392\u5E8F",
        footerDragToGroup: "\u62D6\u66F3\u5230\u7FA4\u7D44\u6A19\u7C64\u79FB\u52D5",
        defaultLabel: "\uFF08\u9810\u8A2D\uFF09",
        rename: "\u91CD\u65B0\u547D\u540D",
        delete: "\u522A\u9664",
        remove: "\u79FB\u9664",
        cancel: "\u53D6\u6D88",
        ribbonTooltip: "Workspace++",
        cmdSwitchTo: function(n, name) {
          return name ? "\u5207\u63DB\u81F3\u5DE5\u4F5C\u968E\u6BB5 " + n + ": " + name : "\u5207\u63DB\u81F3\u5DE5\u4F5C\u968E\u6BB5 " + n;
        },
        cmdSwitchToNamed: function(name) {
          return '\u5207\u63DB\u81F3 "' + name + '"';
        },
        cmdPrevious: "\u4E0A\u4E00\u500B\u5DE5\u4F5C\u968E\u6BB5",
        cmdNext: "\u4E0B\u4E00\u500B\u5DE5\u4F5C\u968E\u6BB5",
        cmdSaveCurrent: "\u5132\u5B58\u76EE\u524D\u5DE5\u4F5C\u968E\u6BB5",
        cmdSaveAs: "\u5C07\u76EE\u524D\u5DE5\u4F5C\u968E\u6BB5\u53E6\u5B58\u70BA...",
        cmdToggleAutoSave: "\u5207\u63DB\u5DE5\u4F5C\u968E\u6BB5\u5207\u63DB\u6642\u81EA\u52D5\u5132\u5B58",
        cmdEnableAutoSave: "\u555F\u7528\u5DE5\u4F5C\u968E\u6BB5\u5207\u63DB\u6642\u81EA\u52D5\u5132\u5B58",
        cmdDisableAutoSave: "\u505C\u7528\u5DE5\u4F5C\u968E\u6BB5\u5207\u63DB\u6642\u81EA\u52D5\u5132\u5B58",
        cmdSearchOverlay: "\u641C\u5C0B\u5DE5\u4F5C\u968E\u6BB5",
        switchLeft: "\u5DE6",
        switchRight: "\u53F3",
        switchGroup: "\u7FA4\u7D44",
        keyTab: "Tab",
        savedSession: function(n) {
          return "\u5DF2\u5132\u5B58\u5DE5\u4F5C\u968E\u6BB5\u300C" + n + "\u300D";
        },
        savedAs: function(n) {
          return "\u5DF2\u53E6\u5B58\u70BA\u300C" + n + "\u300D";
        },
        noChanges: "\u6C92\u6709\u9700\u8981\u5132\u5B58\u7684\u8B8A\u66F4",
        autoSaveEnabled: "\u5DF2\u555F\u7528\u5DE5\u4F5C\u968E\u6BB5\u5207\u63DB\u6642\u81EA\u52D5\u5132\u5B58\u3002",
        autoSaveDisabled: "\u5DF2\u505C\u7528\u5DE5\u4F5C\u968E\u6BB5\u5207\u63DB\u6642\u81EA\u52D5\u5132\u5B58\u3002",
        confirmUnsavedSwitch: function(n) {
          return "\u76EE\u524D\u5DE5\u4F5C\u968E\u6BB5\u6709\u672A\u5132\u5B58\u7684\u8B8A\u66F4\u3002\u8981\u5207\u63DB\u5230\u300C" + n + "\u300D\u55CE\uFF1F";
        },
        saveAndSwitch: "\u5132\u5B58\u4E26\u5207\u63DB",
        switchWithoutSaving: "\u4E0D\u5132\u5B58\u76F4\u63A5\u5207\u63DB",
        sessionAutoName: function(n) {
          return "\u65B0\u5DE5\u4F5C\u968E\u6BB5 " + n;
        },
        noFilteredSessions: "\u627E\u4E0D\u5230\u7B26\u5408\u7684\u5DE5\u4F5C\u968E\u6BB5",
        noGroupSessions: "\u6B64\u7FA4\u7D44\u4E2D\u6C92\u6709\u5DE5\u4F5C\u968E\u6BB5",
        searchOverlayPlaceholder: "\u8F38\u5165\u4EE5\u7BE9\u9078\u5DE5\u4F5C\u968E\u6BB5...",
        searchOverlayHelp: "\u2191\u2193 \u79FB\u52D5  /  Enter \u5207\u63DB  /  \u21E7Enter \u5132\u5B58  /  \u232B \u522A\u9664  /  Esc \u95DC\u9589",
        backupRestored: "Workspace++: \u5DF2\u5F9E\u5099\u4EFD\u9084\u539F\u5DE5\u4F5C\u968E\u6BB5\u3002",
        settingsLanguage: "\u8A9E\u8A00",
        settingsLanguageDesc: "\u5916\u639B\u4ECB\u9762\u8A9E\u8A00\u3002\u91CD\u65B0\u555F\u52D5 Obsidian \u5F8C\u547D\u4EE4\u540D\u7A31\u624D\u6703\u66F4\u65B0\u3002",
        settingsSectionGeneral: "\u4E00\u822C",
        settingsTabSessions: "\u5DE5\u4F5C\u968E\u6BB5",
        settingsSectionSwitching: "\u5DE5\u4F5C\u968E\u6BB5\u81EA\u52D5\u5132\u5B58",
        settingsSectionSwitchPreview: "\u5DE5\u4F5C\u968E\u6BB5\u5207\u63DB",
        settingsSectionDeletion: "\u5DE5\u4F5C\u968E\u6BB5\u522A\u9664",
        settingsLangAuto: "\u81EA\u52D5\uFF08\u7CFB\u7D71\u8A9E\u8A00\uFF09",
        settingsTranslationHelp: "\u767C\u73FE\u7FFB\u8B6F\u932F\u8AA4\uFF1F\u8ACB\u5728 GitHub \u4E0A\u63D0\u4EA4 issue \u6216 Pull request\u3002",
        settingsPreviewHeading: "\u5207\u63DB\u524D\u986F\u793A\u76EE\u524D\u5DE5\u4F5C\u968E\u6BB5",
        settingsPreviewDesc: "\u4F7F\u7528\u5FEB\u6377\u9375\u5207\u63DB\u5DE5\u4F5C\u968E\u6BB5\u6642\uFF0C\u7B2C\u4E00\u6B21\u6309\u4E0B\u50C5\u986F\u793A\u76EE\u524D\u4F4D\u7F6E\uFF0C\u4E0D\u9032\u884C\u5207\u63DB\u3002",
        settingsPreviewNext: "\u4E0B\u4E00\u500B\u5DE5\u4F5C\u968E\u6BB5",
        settingsPreviewPrevious: "\u4E0A\u4E00\u500B\u5DE5\u4F5C\u968E\u6BB5",
        settingsHotkeys: "\u5FEB\u6377\u9375",
        settingsHotkeysBtn: "\u958B\u555F\u5FEB\u6377\u9375\u8A2D\u5B9A",
        contextOpenSettings: "\u958B\u555F\u8A2D\u5B9A",
        contextCustomizeClicks: "\u81EA\u8A02\u9EDE\u64CA\u64CD\u4F5C",
        settingsSectionStatusBar: "\u72C0\u614B\u5217\u9EDE\u64CA\u64CD\u4F5C",
        statusBarSlotClick: "\u9EDE\u64CA",
        statusBarSlotAltClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + \u9EDE\u64CA";
        },
        statusBarSlotModClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + \u9EDE\u64CA";
        },
        statusBarSlotShiftClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + \u9EDE\u64CA";
        },
        statusBarSlotMiddleClick: "\u4E2D\u9375\u9EDE\u64CA",
        statusBarSlotAltMiddleClick: modifiedClickLabel("\u4E2D\u9375\u9EDE\u64CA", "\u2325", "Alt"),
        statusBarSlotModMiddleClick: modifiedClickLabel("\u4E2D\u9375\u9EDE\u64CA", "\u2318", "Ctrl"),
        statusBarSlotShiftMiddleClick: modifiedClickLabel("\u4E2D\u9375\u9EDE\u64CA", "\u21E7", "Shift"),
        statusBarSlotRightClick: "\u53F3\u9375",
        statusBarSlotAltRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + \u53F3\u9375";
        },
        statusBarSlotModRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + \u53F3\u9375";
        },
        statusBarSlotShiftRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + \u53F3\u9375";
        },
        statusBarActionNone: "\u7121\u64CD\u4F5C",
        statusBarActionQuickSwitcher: "\u958B\u555F\u5FEB\u901F\u5207\u63DB\u5668",
        statusBarActionSessionManager: "\u958B\u555F\u5DE5\u4F5C\u968E\u6BB5\u7BA1\u7406\u5668",
        statusBarActionSaveSession: "\u5132\u5B58\u5DE5\u4F5C\u968E\u6BB5",
        statusBarActionReloadWithoutSaving: "\u4E0D\u5132\u5B58\u91CD\u65B0\u8F09\u5165",
        statusBarActionVersionHistory: "\u986F\u793A\u7248\u672C\u6B77\u53F2",
        statusBarActionRestoreLatestHistory: "\u9084\u539F\u6700\u65B0\u6B77\u53F2",
        statusBarActionSessionMenu: "\u5DE5\u4F5C\u968E\u6BB5\u4E0A\u4E0B\u6587\u9078\u55AE",
        statusBarActionSettingsMenu: "\u8A2D\u5B9A\u4E0A\u4E0B\u6587\u9078\u55AE",
        contextResetOverlayPosition: "\u91CD\u7F6E\u4F4D\u7F6E\u548C\u5927\u5C0F",
        settingsConfirmDelete: "\u522A\u9664\u5DE5\u4F5C\u968E\u6BB5\u524D\u78BA\u8A8D",
        settingsConfirmDeleteDesc: "\u522A\u9664\u5DE5\u4F5C\u968E\u6BB5\u524D\u986F\u793A\u78BA\u8A8D\u5C0D\u8A71\u6846\u3002",
        settingsConfirmQuickActions: "\u5FEB\u901F\u5207\u63DB\u5668\u4E2D\u5132\u5B58/\u91CD\u8F09\u524D\u78BA\u8A8D",
        settingsConfirmQuickActionsDesc: "\u5728\u5FEB\u901F\u5207\u63DB\u5668\u4E2D\u5132\u5B58\u6216\u91CD\u65B0\u8F09\u5165\u5DE5\u4F5C\u968E\u6BB5\u524D\u986F\u793A\u78BA\u8A8D\u5C0D\u8A71\u6846\u3002",
        settingsAutoSaveOnSwitch: "\u81EA\u52D5\u5132\u5B58\u6A21\u5F0F",
        settingsAutoSaveOnSwitchDesc: "\u5207\u63DB\u5DE5\u4F5C\u968E\u6BB5\u6642\u81EA\u52D5\u5132\u5B58\u76EE\u524D\u5DE5\u4F5C\u968E\u6BB5\uFF08\u9810\u8A2D\uFF1A\u958B\u555F\uFF09\u3002\u95DC\u9589\u5F8C\u53EF\u624B\u52D5\u63A7\u5236\u5132\u5B58\u548C\u91CD\u65B0\u8F09\u5165\u3002",
        settingsWarnUnsavedSwitch: "\u672A\u5132\u5B58\u6642\u5207\u63DB\u524D\u8B66\u544A",
        settingsWarnUnsavedSwitchDesc: "\u7576\u81EA\u52D5\u5132\u5B58\u95DC\u9589\u4E14\u76EE\u524D\u5DE5\u4F5C\u968E\u6BB5\u6709\u672A\u5132\u5B58\u8B8A\u66F4\u6642\uFF0C\u5207\u63DB\u524D\u986F\u793A\u8B66\u544A\u3002",
        settingsStatusBarQuickSwitcher: "\u72C0\u614B\u5217\u9EDE\u64CA\u6642\u4F7F\u7528\u5FEB\u901F\u5207\u63DB\u5668",
        settingsStatusBarQuickSwitcherDesc: "\u555F\u7528\u5F8C\uFF0C\u9EDE\u64CA\u72C0\u614B\u5217\u5C07\u958B\u555F\u5FEB\u901F\u5207\u63DB\u8986\u84CB\u5C64\uFF0C\u800C\u975E\u5B8C\u6574\u7684\u5DE5\u4F5C\u968E\u6BB5\u7BA1\u7406\u5668\u3002",
        settingsResetSessions: "\u91CD\u8A2D\u5DE5\u4F5C\u968E\u6BB5",
        settingsResetSessionsDesc: "\u522A\u9664\u6240\u6709\u5DF2\u5132\u5B58\u7684\u5DE5\u4F5C\u968E\u6BB5\uFF0C\u4E26\u50C5\u4FDD\u7559\u4EE5\u76EE\u524D\u7248\u9762\u914D\u7F6E\u5EFA\u7ACB\u7684\u5168\u65B0\u9810\u8A2D\u5DE5\u4F5C\u968E\u6BB5\u3002",
        settingsResetSessionsBtn: "\u91CD\u8A2D",
        confirmResetSessions: "\u8981\u5C07\u6240\u6709\u5DE5\u4F5C\u968E\u6BB5\u91CD\u8A2D\u70BA\u9810\u8A2D\u55CE\uFF1F\u6B64\u64CD\u4F5C\u7121\u6CD5\u5FA9\u539F\u3002",
        resetSessionsHint: "\u9019\u5C07\u79FB\u9664\u6240\u6709\u5DF2\u5132\u5B58\u7684\u5DE5\u4F5C\u968E\u6BB5\uFF0C\u4E26\u53EA\u4FDD\u7559\u4E00\u500B\u9810\u8A2D\u5DE5\u4F5C\u968E\u6BB5\u3002",
        resetSessionsDone: "\u5DE5\u4F5C\u968E\u6BB5\u5DF2\u91CD\u8A2D\u70BA\u9810\u8A2D\u3002",
        resetSessionsFailed: "\u91CD\u8A2D\u5DE5\u4F5C\u968E\u6BB5\u5931\u6557\u3002",
        confirmDeleteSettingsHint: "\u5982\u4E0D\u9700\u8981\u6B64\u78BA\u8A8D\uFF0C\u8ACB\u524D\u5F80\u8A2D\u5B9A\u95DC\u9589\u3002",
        // --- Groups ---
        groupCreated: function(n) {
          return "\u5DF2\u5EFA\u7ACB\u7FA4\u7D44\u300C" + n + "\u300D";
        },
        groupDeleted: function(n) {
          return "\u5DF2\u522A\u9664\u7FA4\u7D44\u300C" + n + "\u300D";
        },
        groupRenamed: function(o, n) {
          return "\u7FA4\u7D44\u5DF2\u91CD\u65B0\u547D\u540D\uFF1A\u300C" + o + "\u300D\u2192\u300C" + n + "\u300D";
        },
        groupAll: "\u5168\u90E8",
        groupDuplicateName: "\u5DF2\u6709\u540C\u540D\u7684\u7FA4\u7D44\u3002",
        groupEmptyName: "\u7FA4\u7D44\u540D\u7A31\u4E0D\u53EF\u70BA\u7A7A\u3002",
        cmdSwitchGroup: "\u5207\u63DB\u7FA4\u7D44",
        cmdExitGroup: "\u986F\u793A\u6240\u6709\u5DE5\u4F5C\u968E\u6BB5\uFF08\u96E2\u958B\u7FA4\u7D44\uFF09",
        cmdNextGroup: "\u4E0B\u4E00\u500B\u7FA4\u7D44",
        cmdPreviousGroup: "\u4E0A\u4E00\u500B\u7FA4\u7D44",
        searchOverlayHelpWithGroups: "\u2191\u2193 \u79FB\u52D5  /  Tab \u7FA4\u7D44  /  Enter \u5207\u63DB  /  \u21E7Enter \u5132\u5B58  /  \u232B \u522A\u9664  /  Esc \u95DC\u9589",
        settingsSectionGroups: "\u5DE5\u4F5C\u968E\u6BB5\u7FA4\u7D44",
        contextToggleGroups: "\u555F\u7528\u5DE5\u4F5C\u968E\u6BB5\u7FA4\u7D44",
        settingsSectionGroupsDesc: "\u4F7F\u7528\u7FA4\u7D44\u6574\u7406\u5DE5\u4F5C\u968E\u6BB5\u3002\u95DC\u9589\u5F8C\u6703\u96B1\u85CF\u7FA4\u7D44\u5206\u9801\u8207\u7FA4\u7D44\u5207\u63DB\u64CD\u4F5C\u3002",
        settingsGroupCreate: "\u5EFA\u7ACB\u7FA4\u7D44",
        settingsGroupCreateDesc: "\u5EFA\u7ACB\u65B0\u7684\u5DE5\u4F5C\u968E\u6BB5\u7FA4\u7D44\u3002",
        settingsGroupCreatePlaceholder: "\u7FA4\u7D44\u540D\u7A31...",
        settingsGroupCreateBtn: "\u5EFA\u7ACB",
        settingsGroupManageSessions: "\u7BA1\u7406\u5DE5\u4F5C\u968E\u6BB5",
        settingsGroupManageSessionsDesc: "\u65B0\u589E\u6216\u79FB\u9664\u6B64\u7FA4\u7D44\u4E2D\u7684\u5DE5\u4F5C\u968E\u6BB5\u3002",
        settingsGroupSessionCount: function(n) {
          return n + " \u500B\u5DE5\u4F5C\u968E\u6BB5";
        },
        settingsGroupDelete: "\u522A\u9664\u7FA4\u7D44",
        settingsGroupDeleteConfirm: function(n) {
          return "\u78BA\u5B9A\u522A\u9664\u7FA4\u7D44\u300C" + n + "\u300D\uFF1F\u5DE5\u4F5C\u968E\u6BB5\u4E0D\u6703\u88AB\u522A\u9664\u3002";
        },
        confirmDeleteGroup: function(n) {
          return "\u78BA\u5B9A\u522A\u9664\u7FA4\u7D44\u300C" + n + "\u300D\uFF1F\u7FA4\u7D44\u5167\u7684\u5DE5\u4F5C\u968E\u6BB5\u4E0D\u6703\u88AB\u522A\u9664\u3002";
        },
        groupAddedSession: function(s, g) {
          return "\u5DF2\u5C07\u300C" + s + "\u300D\u65B0\u589E\u81F3\u300C" + g + "\u300D";
        },
        groupRemovedSession: function(s, g) {
          return "\u5DF2\u5C07\u300C" + s + "\u300D\u5F9E\u300C" + g + "\u300D\u4E2D\u79FB\u9664";
        },
        groupRemoveFromGroup: "\u5F9E\u7FA4\u7D44\u4E2D\u79FB\u9664",
        groupMoveToGroup: "\u79FB\u52D5\u5230\u7FA4\u7D44",
        groupCreateNew: "\u65B0\u5EFA\u7FA4\u7D44",
        groupCreatePlaceholder: "\u7FA4\u7D44\u540D\u7A31...",
        groupContextRename: "\u91CD\u65B0\u547D\u540D\u7FA4\u7D44",
        groupContextDelete: "\u522A\u9664\u7FA4\u7D44",
        contextSwitchSession: "\u5207\u63DB\u81F3\u6B64\u5DE5\u4F5C\u968E\u6BB5",
        contextRenameSession: "\u91CD\u65B0\u547D\u540D\u6B64\u5DE5\u4F5C\u968E\u6BB5",
        contextDeleteSession: "\u522A\u9664\u6B64\u5DE5\u4F5C\u968E\u6BB5",
        contextDuplicateSession: "\u8907\u88FD\u6B64\u5DE5\u4F5C\u968E\u6BB5",
        contextReloadSession: "\u91CD\u65B0\u8F09\u5165\u6B64\u5DE5\u4F5C\u968E\u6BB5",
        contextSaveSession: "\u5132\u5B58\u6B64\u5DE5\u4F5C\u968E\u6BB5",
        groupRemoveAllSessions: "\u79FB\u9664\u6B64\u7FA4\u7D44\u4E2D\u7684\u6240\u6709\u5DE5\u4F5C\u968E\u6BB5",
        confirmRemoveAllFromGroup: function(g, n) {
          return "\u78BA\u5B9A\u5F9E\u300C" + g + "\u300D\u4E2D\u79FB\u9664\u5168\u90E8 " + n + " \u500B\u5DE5\u4F5C\u968E\u6BB5\uFF1F";
        },
        groupRemovedAllSessions: function(g) {
          return "\u5DF2\u5F9E\u300C" + g + "\u300D\u4E2D\u79FB\u9664\u6240\u6709\u5DE5\u4F5C\u968E\u6BB5";
        },
        contextDeleteAllGroups: "\u522A\u9664\u6240\u6709\u7FA4\u7D44",
        confirmDeleteAllGroups: function(n) {
          return "\u78BA\u5B9A\u522A\u9664\u5168\u90E8 " + n + " \u500B\u7FA4\u7D44\uFF1F\u5DE5\u4F5C\u968E\u6BB5\u4E0D\u6703\u88AB\u522A\u9664\u3002";
        },
        deletedAllGroups: function(n) {
          return "\u5DF2\u522A\u9664 " + n + " \u500B\u7FA4\u7D44";
        },
        contextDeleteAllSessions: "\u522A\u9664\u6240\u6709\u5DE5\u4F5C\u968E\u6BB5",
        confirmDeleteAllSessions: function(n) {
          return "\u78BA\u5B9A\u522A\u9664 " + n + " \u500B\u5DE5\u4F5C\u968E\u6BB5\uFF1F\u76EE\u524D\u7684\u5DE5\u4F5C\u968E\u6BB5\u5C07\u4FDD\u7559\u3002";
        },
        deletedAllSessions: function(n) {
          return "\u5DF2\u522A\u9664 " + n + " \u500B\u5DE5\u4F5C\u968E\u6BB5";
        },
        contextVersionHistory: "\u7248\u672C\u6B77\u53F2",
        cmdVersionHistory: "\u6AA2\u8996\u5DE5\u4F5C\u968E\u6BB5\u7248\u672C\u6B77\u53F2",
        historyTitle: "\u7248\u672C\u6B77\u53F2",
        historyEmpty: "\u6B64\u5DE5\u4F5C\u968E\u6BB5\u66AB\u7121\u7248\u672C\u6B77\u53F2\u3002",
        historyRestore: "\u9084\u539F",
        historyRestoreConfirm: function(name, time) {
          return "\u5C07\u300C" + name + "\u300D\u7684\u4F48\u5C40\u9084\u539F\u5230 " + time + " \u7684\u72C0\u614B\uFF1F";
        },
        historyRestored: function(name) {
          return "\u5DF2\u9084\u539F\u300C" + name + "\u300D\u7684\u4F48\u5C40";
        },
        historyQuickRestored: function(name) {
          return "\u5DF2\u5FEB\u901F\u9084\u539F\u300C" + name + "\u300D\u7684\u4E0A\u4E00\u500B\u4F48\u5C40";
        },
        historyNoEntries: "\u6C92\u6709\u53EF\u9084\u539F\u7684\u6B77\u53F2\u7D00\u9304\u3002",
        historyToday: "\u4ECA\u5929",
        historyYesterday: "\u6628\u5929",
        historyThisWeek: "\u672C\u9031",
        historyFiles: function(n) {
          return n + " \u500B\u6A94\u6848";
        },
        historyPanes: function(n) {
          return n + " \u500B\u9762\u677F";
        },
        settingsVersionHistoryEnabled: "\u555F\u7528\u7248\u672C\u6B77\u53F2",
        settingsVersionHistoryEnabledDesc: "\u70BA\u6BCF\u500B\u5DE5\u4F5C\u968E\u6BB5\u4FDD\u7559\u4F48\u5C40\u8B8A\u66F4\u7684\u6B77\u53F2\u7D00\u9304\u3002",
        settingsVersionHistoryInterval: "\u5FEB\u7167\u9593\u9694\uFF08\u5206\u9418\uFF09",
        settingsVersionHistoryIntervalDesc: "\u6AA2\u67E5\u4F48\u5C40\u8B8A\u66F4\u4E26\u5132\u5B58\u5FEB\u7167\u7684\u983B\u7387\u3002",
        settingsVersionHistoryCtrlRmb: platformLabel("\u5FEB\u901F\u9084\u539F (Cmd + \u53F3\u9375)", "\u5FEB\u901F\u9084\u539F (Ctrl + \u53F3\u9375)"),
        settingsVersionHistoryCtrlRmbDesc: platformLabel("\u6309\u4F4F Cmd \u9375\u53F3\u9375\u9EDE\u64CA\u72C0\u614B\u5217\u53EF\u9084\u539F\u4E0A\u4E00\u500B\u4F48\u5C40\u3002", "\u6309\u4F4F Ctrl \u9375\u53F3\u9375\u9EDE\u64CA\u72C0\u614B\u5217\u53EF\u9084\u539F\u4E0A\u4E00\u500B\u4F48\u5C40\u3002"),
        settingsVersionHistoryConfirmRestore: "\u9084\u539F\u524D\u78BA\u8A8D",
        settingsVersionHistoryConfirmRestoreDesc: "\u9084\u539F\u4F48\u5C40\u524D\u986F\u793A\u78BA\u8A8D\u5C0D\u8A71\u6846\u3002",
        rotationBackupSectionTitle: "\u5099\u4EFD",
        rotationBackupCreate: "\u5EFA\u7ACB\u5099\u4EFD",
        rotationBackupCreateBtn: "\u7ACB\u5373\u5099\u4EFD",
        rotationBackupCreated: "\u5DF2\u5EFA\u7ACB\u5099\u4EFD\u3002",
        rotationBackupFailed: "\u5EFA\u7ACB\u5099\u4EFD\u5931\u6557\u3002",
        rotationBackupDesc: "\u5132\u5B58\u6642\u81EA\u52D5\u5EFA\u7ACB\u5099\u4EFD\uFF08\u6BCF\u5C0F\u6642\uFF0C\u6700\u591A3\u500B\u4E16\u4EE3\uFF09\u3002",
        rotationBackupRestore: "\u9084\u539F",
        rotationBackupRestoreConfirm: function(time, count) {
          return "\u5F9E " + time + " \u7684\u5099\u4EFD\u9084\u539F\uFF08" + count + " \u500B\u5DE5\u4F5C\u968E\u6BB5\uFF09\uFF1F\u76EE\u524D\u7684\u8CC7\u6599\u5C07\u88AB\u8986\u84CB\u3002";
        },
        rotationBackupRestored: "\u5DF2\u5F9E\u5099\u4EFD\u9084\u539F\u3002",
        rotationBackupRestoreFailed: "\u5F9E\u5099\u4EFD\u9084\u539F\u5931\u6557\u3002",
        rotationBackupNone: "\u6C92\u6709\u53EF\u7528\u7684\u5099\u4EFD\u3002",
        rotationBackupGeneration: function(count) {
          return count + " \u500B\u5DE5\u4F5C\u968E\u6BB5";
        },
        frontmatterSessionNotFound: function(n) {
          return "\u5DE5\u4F5C\u968E\u6BB5\u300C" + n + "\u300D\u672A\u627E\u5230\uFF08workspace-session\uFF09";
        },
        frontmatterAlreadyActive: function(n) {
          return "\u5DE5\u4F5C\u968E\u6BB5\u300C" + n + "\u300D\u5DF2\u8655\u65BC\u6D3B\u52D5\u72C0\u614B";
        }
      },
      es: {
        settingsStatusBarModScrollSwitch: "Mod + rueda para cambiar de sesi\xF3n",
        settingsStatusBarModScrollSwitchDesc: "Sobre el elemento de la barra de estado, despl\xE1zate verticalmente mientras mantienes la tecla modificadora elegida para cambiar de sesi\xF3n. Usa umbral y enfriamiento para reducir activaciones accidentales del trackpad.",
        modalTitle: "Gesti\xF3n de sesiones",
        savePlaceholder: "Nombre de la nueva sesi\xF3n...",
        filterPlaceholder: "Filtrar sesiones...",
        settingsShowFilterInput: "Mostrar filtro de sesiones",
        settingsShowFilterInputDesc: "Mostrar un filtro de texto en el gestor de sesiones para encontrar sesiones r\xE1pidamente.",
        settingsOverlayDefaultFocus: "Foco predeterminado de la superposici\xF3n",
        settingsOverlayDefaultFocusDesc: "Elegir qu\xE9 elemento recibe el foco cuando se abre el gestor de sesiones.",
        settingsOverlayFocusCurrentSession: "Sesi\xF3n actual",
        settingsOverlayFocusSessionFilter: "Filtro de sesiones",
        settingsOverlayFocusSessionCreate: "Creaci\xF3n de sesi\xF3n",
        settingsSectionSessionManager: "Gestor de sesiones",
        settingsShowActiveSwitchCommand: "Mostrar sesi\xF3n activa en paleta de comandos",
        settingsShowActiveSwitchCommandDesc: "Muestra el comando de cambio para la sesi\xF3n activa en la paleta de comandos. Los atajos siempre funcionan independientemente de esta opci\xF3n.",
        settingsNumberedSwitchCommands: "Comandos de cambio numerados",
        settingsNumberedSwitchCommandsDesc: "Registra comandos de cambio con ranuras numeradas (1\u20139) que se pueden asignar a atajos. Si se desactiva, todas las sesiones usan comandos basados en nombre.",
        save: "Crear",
        load: "Cambiar",
        saveInline: "Guardar",
        active: "ACTIVO",
        modifiedJustNow: "Modificado hace un momento",
        modifiedMinutes: function(n) {
          return "Modificado hace " + n + " minuto" + (n !== 1 ? "s" : "");
        },
        modifiedHours: function(n) {
          return "Modificado hace " + n + " hora" + (n !== 1 ? "s" : "");
        },
        modifiedDays: function(n) {
          return "Modificado hace " + n + " d\xEDa" + (n !== 1 ? "s" : "");
        },
        duplicateName: "Ya existe una sesi\xF3n con este nombre.",
        emptyName: "El nombre de la sesi\xF3n no puede estar vac\xEDo.",
        created: function(n) {
          return "Sesi\xF3n \xAB" + n + "\xBB creada";
        },
        deleted: function(n) {
          return "Sesi\xF3n \xAB" + n + "\xBB eliminada";
        },
        loaded: function(n) {
          return "Cambiado a \xAB" + n + "\xBB";
        },
        renamed: function(o, n) {
          return "\xAB" + o + "\xBB renombrado a \xAB" + n + "\xBB";
        },
        confirmDelete: function(n) {
          return "\xBFEliminar la sesi\xF3n \xAB" + n + "\xBB?";
        },
        confirmDeleteActive: function(n) {
          return "\xAB" + n + "\xBB es la sesi\xF3n activa. \xBFEliminar de todas formas?";
        },
        confirmSaveSession: function(n) {
          return '\xBFGuardar sesi\xF3n "' + n + '"?';
        },
        confirmReloadSession: function(n) {
          return '\xBFRecargar sesi\xF3n "' + n + '"? Los cambios no guardados se perder\xE1n.';
        },
        renameTitle: "Renombrar sesi\xF3n",
        renamePlaceholder: "Nuevo nombre...",
        noSession: "Sin sesi\xF3n",
        cannotDeleteLast: "La \xFAltima sesi\xF3n no se puede eliminar.",
        confirmBulkDelete: function(n) {
          return "\xBFEliminar " + n + (n !== 1 ? " sesiones" : " sesi\xF3n") + "?";
        },
        bulkDeleted: function(n) {
          return n + (n !== 1 ? " sesiones eliminadas" : " sesi\xF3n eliminada");
        },
        bulkDelete: function(n) {
          return "Eliminar " + n + (n !== 1 ? " sesiones" : " sesi\xF3n");
        },
        cmdManage: "Gestionar sesiones",
        cmdCreate: "Crear nueva sesi\xF3n",
        cmdRename: "Renombrar sesi\xF3n actual",
        cmdDelete: "Eliminar sesi\xF3n actual",
        cmdNewEmpty: "Crear sesi\xF3n en blanco",
        cmdDuplicate: "Duplicar sesi\xF3n actual",
        duplicated: function(n) {
          return "Duplicada como \xAB" + n + "\xBB";
        },
        deselect: "Deseleccionar",
        footerDragReorder: "Arrastrar para reordenar",
        footerDragToGroup: "Arrastrar a pesta\xF1a de grupo para mover",
        defaultLabel: "(por defecto)",
        rename: "Renombrar",
        delete: "Eliminar",
        remove: "Quitar",
        cancel: "Cancelar",
        ribbonTooltip: "Workspace++",
        cmdSwitchTo: function(n, name) {
          return name ? "Cambiar a la sesi\xF3n " + n + ": " + name : "Cambiar a la sesi\xF3n " + n;
        },
        cmdSwitchToNamed: function(name) {
          return 'Cambiar a "' + name + '"';
        },
        cmdPrevious: "Sesi\xF3n anterior",
        cmdNext: "Sesi\xF3n siguiente",
        cmdSaveCurrent: "Guardar sesi\xF3n actual",
        cmdSaveAs: "Guardar sesi\xF3n actual como...",
        cmdToggleAutoSave: "Alternar guardado autom\xE1tico al cambiar",
        cmdEnableAutoSave: "Activar guardado autom\xE1tico al cambiar",
        cmdDisableAutoSave: "Desactivar guardado autom\xE1tico al cambiar",
        cmdSearchOverlay: "Buscar sesiones",
        switchLeft: "Izquierda",
        switchRight: "Derecha",
        switchGroup: "Grupo",
        keyTab: "Tab",
        savedSession: function(n) {
          return "Sesi\xF3n \xAB" + n + "\xBB guardada";
        },
        savedAs: function(n) {
          return "Guardada como \xAB" + n + "\xBB";
        },
        noChanges: "No hay cambios que guardar",
        autoSaveEnabled: "Guardado autom\xE1tico al cambiar activado.",
        autoSaveDisabled: "Guardado autom\xE1tico al cambiar desactivado.",
        confirmUnsavedSwitch: function(n) {
          return "La sesi\xF3n actual tiene cambios sin guardar. \xBFCambiar a \xAB" + n + "\xBB?";
        },
        saveAndSwitch: "Guardar y cambiar",
        switchWithoutSaving: "Cambiar sin guardar",
        sessionAutoName: function(n) {
          return "Nueva sesi\xF3n " + n;
        },
        noFilteredSessions: "No hay sesiones coincidentes",
        noGroupSessions: "No hay sesiones en este grupo",
        searchOverlayPlaceholder: "Escribe para filtrar sesiones...",
        searchOverlayHelp: "\u2191\u2193 mover  /  Enter cambiar  /  \u21E7Enter guardar  /  \u232B eliminar  /  Esc cerrar",
        backupRestored: "Workspace++: sesiones restauradas desde la copia de seguridad.",
        settingsLanguage: "Idioma",
        settingsLanguageDesc: "Idioma de la interfaz. Reinicie Obsidian para aplicar a los nombres de comandos.",
        settingsSectionGeneral: "General",
        settingsTabSessions: "Sesiones",
        settingsSectionSwitching: "Guardado autom\xE1tico de sesi\xF3n",
        settingsSectionSwitchPreview: "Cambio de sesi\xF3n",
        settingsSectionDeletion: "Eliminaci\xF3n de sesi\xF3n",
        settingsLangAuto: "Auto (idioma del sistema)",
        settingsTranslationHelp: "\xBFError de traducci\xF3n? Abra un issue o pull request en GitHub.",
        settingsPreviewHeading: "Mostrar sesi\xF3n actual antes de cambiar",
        settingsPreviewDesc: "Al cambiar de sesi\xF3n con un atajo, la primera pulsaci\xF3n muestra tu posici\xF3n actual sin cambiar.",
        settingsPreviewNext: "Sesi\xF3n siguiente",
        settingsPreviewPrevious: "Sesi\xF3n anterior",
        settingsHotkeys: "Atajos de teclado",
        settingsHotkeysBtn: "Abrir atajos",
        contextOpenSettings: "Abrir ajustes",
        contextCustomizeClicks: "Personalizar acciones de clic",
        settingsSectionStatusBar: "Acciones de clic en la barra de estado",
        statusBarSlotClick: "Clic",
        statusBarSlotAltClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + Clic";
        },
        statusBarSlotModClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + Clic";
        },
        statusBarSlotShiftClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + Clic";
        },
        statusBarSlotMiddleClick: "Clic central",
        statusBarSlotAltMiddleClick: modifiedClickLabel("Clic central", "\u2325", "Alt"),
        statusBarSlotModMiddleClick: modifiedClickLabel("Clic central", "\u2318", "Ctrl"),
        statusBarSlotShiftMiddleClick: modifiedClickLabel("Clic central", "\u21E7", "Shift"),
        statusBarSlotRightClick: "Clic derecho",
        statusBarSlotAltRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + Clic derecho";
        },
        statusBarSlotModRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + Clic derecho";
        },
        statusBarSlotShiftRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + Clic derecho";
        },
        statusBarActionNone: "No hacer nada",
        statusBarActionQuickSwitcher: "Abrir selector r\xE1pido",
        statusBarActionSessionManager: "Abrir gestor de sesiones",
        statusBarActionSaveSession: "Guardar sesi\xF3n",
        statusBarActionReloadWithoutSaving: "Recargar sin guardar",
        statusBarActionVersionHistory: "Mostrar historial de versiones",
        statusBarActionRestoreLatestHistory: "Restaurar historial reciente",
        statusBarActionSessionMenu: "Men\xFA de sesi\xF3n",
        statusBarActionSettingsMenu: "Men\xFA de ajustes",
        contextResetOverlayPosition: "Restablecer posici\xF3n y tama\xF1o",
        settingsConfirmDelete: "Confirmar antes de eliminar una sesi\xF3n",
        settingsConfirmDeleteDesc: "Mostrar un di\xE1logo de confirmaci\xF3n antes de eliminar una sesi\xF3n.",
        settingsConfirmQuickActions: "Confirmar guardar/recargar en el conmutador r\xE1pido",
        settingsConfirmQuickActionsDesc: "Mostrar un di\xE1logo de confirmaci\xF3n antes de guardar o recargar una sesi\xF3n desde el conmutador r\xE1pido.",
        settingsAutoSaveOnSwitch: "Modo de guardado autom\xE1tico",
        settingsAutoSaveOnSwitchDesc: "Guarda autom\xE1ticamente la sesi\xF3n actual al cambiar (por defecto: activado). Si est\xE1 desactivado, puedes guardar y recargar sesiones manualmente.",
        settingsWarnUnsavedSwitch: "Advertir antes de cambiar sin guardar",
        settingsWarnUnsavedSwitchDesc: "Si el guardado autom\xE1tico est\xE1 desactivado y la sesi\xF3n actual tiene cambios sin guardar, muestra una advertencia antes de cambiar.",
        settingsStatusBarQuickSwitcher: "Cambio r\xE1pido al hacer clic en la barra de estado",
        settingsStatusBarQuickSwitcherDesc: "Si est\xE1 activado, al hacer clic en la barra de estado se abre el selector r\xE1pido en lugar del gestor de sesiones completo.",
        settingsResetSessions: "Restablecer sesiones",
        settingsResetSessionsDesc: "Elimina todas las sesiones guardadas y conserva solo una sesi\xF3n predeterminada nueva basada en el dise\xF1o actual.",
        settingsResetSessionsBtn: "Restablecer",
        confirmResetSessions: "\xBFRestablecer todas las sesiones al estado predeterminado? Esta acci\xF3n no se puede deshacer.",
        resetSessionsHint: "Esto eliminar\xE1 todas las sesiones guardadas y conservar\xE1 solo una sesi\xF3n predeterminada.",
        resetSessionsDone: "Las sesiones se restablecieron al estado predeterminado.",
        resetSessionsFailed: "No se pudieron restablecer las sesiones.",
        confirmDeleteSettingsHint: "Para desactivar esta confirmaci\xF3n, ve a Ajustes.",
        // --- Groups ---
        groupCreated: function(n) {
          return "Grupo \xAB" + n + "\xBB creado";
        },
        groupDeleted: function(n) {
          return "Grupo \xAB" + n + "\xBB eliminado";
        },
        groupRenamed: function(o, n) {
          return "Grupo renombrado: \xAB" + o + "\xBB \u2192 \xAB" + n + "\xBB";
        },
        groupAll: "Todos",
        groupDuplicateName: "Ya existe un grupo con este nombre.",
        groupEmptyName: "El nombre del grupo no puede estar vac\xEDo.",
        cmdSwitchGroup: "Cambiar de grupo",
        cmdExitGroup: "Mostrar todas las sesiones (salir del grupo)",
        cmdNextGroup: "Siguiente grupo",
        cmdPreviousGroup: "Grupo anterior",
        searchOverlayHelpWithGroups: "\u2191\u2193 mover  /  Tab grupo  /  Enter cambiar  /  \u21E7Enter guardar  /  \u232B eliminar  /  Esc cerrar",
        settingsSectionGroups: "Grupos de sesiones",
        contextToggleGroups: "Habilitar grupos de sesiones",
        settingsSectionGroupsDesc: "Usa grupos para organizar sesiones. Si lo desactivas, se ocultar\xE1n las pesta\xF1as y acciones de cambio de grupo.",
        settingsGroupCreate: "Crear grupo",
        settingsGroupCreateDesc: "Crear un nuevo grupo de sesiones.",
        settingsGroupCreatePlaceholder: "Nombre del grupo...",
        settingsGroupCreateBtn: "Crear",
        settingsGroupManageSessions: "Gestionar sesiones",
        settingsGroupManageSessionsDesc: "Agregar o quitar sesiones de este grupo.",
        settingsGroupSessionCount: function(n) {
          return n + (n !== 1 ? " sesiones" : " sesi\xF3n");
        },
        settingsGroupDelete: "Eliminar grupo",
        settingsGroupDeleteConfirm: function(n) {
          return "\xBFEliminar el grupo \xAB" + n + "\xBB? Las sesiones no se eliminar\xE1n.";
        },
        confirmDeleteGroup: function(n) {
          return "\xBFEliminar el grupo \xAB" + n + "\xBB? Las sesiones del grupo NO se eliminar\xE1n.";
        },
        groupAddedSession: function(s, g) {
          return "\xAB" + s + "\xBB a\xF1adido a \xAB" + g + "\xBB";
        },
        groupRemovedSession: function(s, g) {
          return "\xAB" + s + "\xBB eliminado de \xAB" + g + "\xBB";
        },
        groupRemoveFromGroup: "Quitar del grupo",
        groupMoveToGroup: "Mover al grupo",
        groupCreateNew: "Nuevo grupo",
        groupCreatePlaceholder: "Nombre del grupo...",
        groupContextRename: "Renombrar grupo",
        groupContextDelete: "Eliminar grupo",
        contextSwitchSession: "Cambiar a esta sesi\xF3n",
        contextRenameSession: "Renombrar esta sesi\xF3n",
        contextDeleteSession: "Eliminar esta sesi\xF3n",
        contextDuplicateSession: "Duplicar esta sesi\xF3n",
        contextReloadSession: "Recargar esta sesi\xF3n",
        contextSaveSession: "Guardar esta sesi\xF3n",
        groupRemoveAllSessions: "Quitar todas las sesiones de este grupo",
        confirmRemoveAllFromGroup: function(g, n) {
          return "\xBFQuitar las " + n + " sesiones de \xAB" + g + "\xBB?";
        },
        groupRemovedAllSessions: function(g) {
          return "Se quitaron todas las sesiones de \xAB" + g + "\xBB";
        },
        contextDeleteAllGroups: "Eliminar todos los grupos",
        confirmDeleteAllGroups: function(n) {
          return "\xBFEliminar los " + n + " grupos? Las sesiones no se eliminar\xE1n.";
        },
        deletedAllGroups: function(n) {
          return n + " grupos eliminados";
        },
        contextDeleteAllSessions: "Eliminar todas las sesiones",
        confirmDeleteAllSessions: function(n) {
          return "\xBFEliminar " + n + " sesiones? La sesi\xF3n activa se conservar\xE1.";
        },
        deletedAllSessions: function(n) {
          return n + " sesiones eliminadas";
        },
        contextVersionHistory: "Historial de versiones",
        cmdVersionHistory: "Ver historial de versiones de la sesi\xF3n",
        historyTitle: "Historial de versiones",
        historyEmpty: "No hay historial para esta sesi\xF3n.",
        historyRestore: "Restaurar",
        historyRestoreConfirm: function(name, time) {
          return '\xBFRestaurar el dise\xF1o de "' + name + '" desde ' + time + "?";
        },
        historyRestored: function(name) {
          return 'Dise\xF1o de "' + name + '" restaurado';
        },
        historyQuickRestored: function(name) {
          return 'Dise\xF1o anterior de "' + name + '" restaurado r\xE1pidamente';
        },
        historyNoEntries: "No hay dise\xF1os anteriores para restaurar.",
        historyToday: "Hoy",
        historyYesterday: "Ayer",
        historyThisWeek: "Esta semana",
        historyFiles: function(n) {
          return n + " archivo" + (n !== 1 ? "s" : "");
        },
        historyPanes: function(n) {
          return n + " panel" + (n !== 1 ? "es" : "");
        },
        settingsVersionHistoryEnabled: "Habilitar historial de versiones",
        settingsVersionHistoryEnabledDesc: "Mantener un historial de cambios de dise\xF1o para cada sesi\xF3n.",
        settingsVersionHistoryInterval: "Intervalo de instant\xE1neas (minutos)",
        settingsVersionHistoryIntervalDesc: "Con qu\xE9 frecuencia verificar cambios de dise\xF1o y guardar una instant\xE1nea.",
        settingsVersionHistoryCtrlRmb: platformLabel("Restauraci\xF3n r\xE1pida (Cmd + clic derecho)", "Restauraci\xF3n r\xE1pida (Ctrl + clic derecho)"),
        settingsVersionHistoryCtrlRmbDesc: platformLabel("Haz clic derecho en la barra de estado mientras presionas Cmd para restaurar el dise\xF1o anterior.", "Haz clic derecho en la barra de estado mientras presionas Ctrl para restaurar el dise\xF1o anterior."),
        settingsVersionHistoryConfirmRestore: "Confirmar antes de restaurar",
        settingsVersionHistoryConfirmRestoreDesc: "Mostrar un di\xE1logo de confirmaci\xF3n antes de restaurar un dise\xF1o anterior.",
        rotationBackupSectionTitle: "Copia de seguridad",
        rotationBackupCreate: "Crear copia de seguridad",
        rotationBackupCreateBtn: "Crear ahora",
        rotationBackupCreated: "Copia de seguridad creada.",
        rotationBackupFailed: "Error al crear la copia de seguridad.",
        rotationBackupDesc: "Las copias de seguridad se crean autom\xE1ticamente al guardar (cada hora, hasta 3 generaciones).",
        rotationBackupRestore: "Restaurar",
        rotationBackupRestoreConfirm: function(time, count) {
          return "\xBFRestaurar desde la copia de seguridad de " + time + " (" + count + " sesi\xF3n" + (count !== 1 ? "es" : "") + ")? Los datos actuales se sobrescribir\xE1n.";
        },
        rotationBackupRestored: "Restaurado desde copia de seguridad.",
        rotationBackupRestoreFailed: "Error al restaurar desde copia de seguridad.",
        rotationBackupNone: "No hay copias de seguridad disponibles.",
        rotationBackupGeneration: function(count) {
          return count + " sesi\xF3n" + (count !== 1 ? "es" : "");
        },
        frontmatterSessionNotFound: function(n) {
          return "Sesi\xF3n \xAB" + n + "\xBB no encontrada (workspace-session)";
        },
        frontmatterAlreadyActive: function(n) {
          return "La sesi\xF3n \xAB" + n + "\xBB ya est\xE1 activa";
        }
      },
      fr: {
        settingsStatusBarModScrollSwitch: "Mod + molette pour changer de session",
        settingsStatusBarModScrollSwitchDesc: "Sur l\u2019\xE9l\xE9ment de la barre d\u2019\xE9tat, faites d\xE9filer verticalement en maintenant la touche modificatrice choisie pour changer de session. Utilise un seuil et un d\xE9lai pour r\xE9duire les d\xE9clenchements accidentels du trackpad.",
        modalTitle: "Gestion des sessions",
        savePlaceholder: "Nom de la nouvelle session...",
        filterPlaceholder: "Filtrer les sessions...",
        settingsShowFilterInput: "Afficher le filtre de sessions",
        settingsShowFilterInputDesc: "Afficher un filtre textuel dans le gestionnaire de sessions pour trouver rapidement une session.",
        settingsOverlayDefaultFocus: "Focus par d\xE9faut de la superposition",
        settingsOverlayDefaultFocusDesc: "Choisir quel \xE9l\xE9ment re\xE7oit le focus \xE0 l'ouverture du gestionnaire de sessions.",
        settingsOverlayFocusCurrentSession: "Session actuelle",
        settingsOverlayFocusSessionFilter: "Filtre de sessions",
        settingsOverlayFocusSessionCreate: "Cr\xE9ation de session",
        settingsSectionSessionManager: "Gestionnaire de sessions",
        settingsShowActiveSwitchCommand: "Afficher la session active dans la palette de commandes",
        settingsShowActiveSwitchCommandDesc: "Affiche la commande de basculement pour la session active dans la palette de commandes. Les raccourcis fonctionnent toujours quel que soit ce r\xE9glage.",
        settingsNumberedSwitchCommands: "Commandes de basculement num\xE9rot\xE9es",
        settingsNumberedSwitchCommandsDesc: "Enregistre des commandes avec des emplacements num\xE9rot\xE9s (1\u20139) pouvant \xEAtre li\xE9s \xE0 des raccourcis. D\xE9sactiv\xE9, toutes les sessions utilisent des commandes par nom.",
        save: "Cr\xE9er",
        load: "Basculer",
        saveInline: "Enregistrer",
        active: "ACTIF",
        modifiedJustNow: "Modifi\xE9 \xE0 l'instant",
        modifiedMinutes: function(n) {
          return "Modifi\xE9 il y a " + n + " minute" + (n !== 1 ? "s" : "");
        },
        modifiedHours: function(n) {
          return "Modifi\xE9 il y a " + n + " heure" + (n !== 1 ? "s" : "");
        },
        modifiedDays: function(n) {
          return "Modifi\xE9 il y a " + n + " jour" + (n !== 1 ? "s" : "");
        },
        duplicateName: "Une session avec ce nom existe d\xE9j\xE0.",
        emptyName: "Le nom de la session ne peut pas \xEAtre vide.",
        created: function(n) {
          return "Session \xAB\xA0" + n + "\xA0\xBB cr\xE9\xE9e";
        },
        deleted: function(n) {
          return "Session \xAB\xA0" + n + "\xA0\xBB supprim\xE9e";
        },
        loaded: function(n) {
          return "Bascul\xE9 vers \xAB\xA0" + n + "\xA0\xBB";
        },
        renamed: function(o, n) {
          return "\xAB\xA0" + o + "\xA0\xBB renomm\xE9 en \xAB\xA0" + n + "\xA0\xBB";
        },
        confirmDelete: function(n) {
          return "Supprimer la session \xAB\xA0" + n + "\xA0\xBB ?";
        },
        confirmDeleteActive: function(n) {
          return "\xAB\xA0" + n + "\xA0\xBB est la session active. Supprimer quand m\xEAme ?";
        },
        confirmSaveSession: function(n) {
          return 'Sauvegarder la session "' + n + '" ?';
        },
        confirmReloadSession: function(n) {
          return 'Recharger la session "' + n + '" ? Les modifications non sauvegard\xE9es seront perdues.';
        },
        renameTitle: "Renommer la session",
        renamePlaceholder: "Nouveau nom...",
        noSession: "Aucune session",
        cannotDeleteLast: "La derni\xE8re session ne peut pas \xEAtre supprim\xE9e.",
        confirmBulkDelete: function(n) {
          return "Supprimer " + n + " session" + (n !== 1 ? "s" : "") + " ?";
        },
        bulkDeleted: function(n) {
          return n + " session" + (n !== 1 ? "s" : "") + " supprim\xE9e" + (n !== 1 ? "s" : "");
        },
        bulkDelete: function(n) {
          return "Supprimer " + n + " session" + (n !== 1 ? "s" : "");
        },
        cmdManage: "G\xE9rer les sessions",
        cmdCreate: "Cr\xE9er une nouvelle session",
        cmdRename: "Renommer la session en cours",
        cmdDelete: "Supprimer la session en cours",
        cmdNewEmpty: "Cr\xE9er une session vierge",
        cmdDuplicate: "Dupliquer la session en cours",
        duplicated: function(n) {
          return "Dupliqu\xE9e sous \xAB\xA0" + n + "\xA0\xBB";
        },
        deselect: "D\xE9s\xE9lectionner",
        footerDragReorder: "Glisser pour r\xE9organiser",
        footerDragToGroup: "Glisser sur un onglet de groupe pour d\xE9placer",
        defaultLabel: "(par d\xE9faut)",
        rename: "Renommer",
        delete: "Supprimer",
        remove: "Retirer",
        cancel: "Annuler",
        ribbonTooltip: "Workspace++",
        cmdSwitchTo: function(n, name) {
          return name ? "Basculer vers la session " + n + " : " + name : "Basculer vers la session " + n;
        },
        cmdSwitchToNamed: function(name) {
          return 'Basculer vers "' + name + '"';
        },
        cmdPrevious: "Session pr\xE9c\xE9dente",
        cmdNext: "Session suivante",
        cmdSaveCurrent: "Enregistrer la session en cours",
        cmdSaveAs: "Enregistrer la session en cours sous...",
        cmdToggleAutoSave: "Activer/d\xE9sactiver l\u2019enregistrement auto au changement",
        cmdEnableAutoSave: "Activer l\u2019enregistrement auto au changement",
        cmdDisableAutoSave: "D\xE9sactiver l\u2019enregistrement auto au changement",
        cmdSearchOverlay: "Rechercher des sessions",
        switchLeft: "Gauche",
        switchRight: "Droite",
        switchGroup: "Groupe",
        keyTab: "Tab",
        savedSession: function(n) {
          return "Session \xAB\xA0" + n + "\xA0\xBB enregistr\xE9e";
        },
        savedAs: function(n) {
          return "Enregistr\xE9e sous \xAB\xA0" + n + "\xA0\xBB";
        },
        noChanges: "Aucune modification \xE0 enregistrer",
        autoSaveEnabled: "Enregistrement automatique au changement activ\xE9.",
        autoSaveDisabled: "Enregistrement automatique au changement d\xE9sactiv\xE9.",
        confirmUnsavedSwitch: function(n) {
          return "La session actuelle contient des modifications non enregistr\xE9es. Basculer vers \xAB\xA0" + n + "\xA0\xBB ?";
        },
        saveAndSwitch: "Enregistrer et basculer",
        switchWithoutSaving: "Basculer sans enregistrer",
        sessionAutoName: function(n) {
          return "Nouvelle session " + n;
        },
        noFilteredSessions: "Aucune session correspondante",
        noGroupSessions: "Aucune session dans ce groupe",
        searchOverlayPlaceholder: "Saisissez pour filtrer les sessions...",
        searchOverlayHelp: "\u2191\u2193 d\xE9placer  /  Entr\xE9e basculer  /  \u21E7Entr\xE9e sauvegarder  /  \u232B supprimer  /  \xC9chap fermer",
        backupRestored: "Workspace++ : sessions restaur\xE9es depuis la sauvegarde.",
        settingsLanguage: "Langue",
        settingsLanguageDesc: "Langue de l'interface. Red\xE9marrez Obsidian pour appliquer aux noms de commandes.",
        settingsSectionGeneral: "G\xE9n\xE9ral",
        settingsTabSessions: "Sessions",
        settingsSectionSwitching: "Enregistrement automatique de session",
        settingsSectionSwitchPreview: "Changement de session",
        settingsSectionDeletion: "Suppression de session",
        settingsLangAuto: "Auto (langue du syst\xE8me)",
        settingsTranslationHelp: "Erreur de traduction ? Ouvrez une issue ou une pull request sur GitHub.",
        settingsPreviewHeading: "Afficher la session actuelle avant de basculer",
        settingsPreviewDesc: "Lors du changement de session par raccourci, la premi\xE8re pression affiche votre position actuelle sans basculer.",
        settingsPreviewNext: "Session suivante",
        settingsPreviewPrevious: "Session pr\xE9c\xE9dente",
        settingsHotkeys: "Raccourcis",
        settingsHotkeysBtn: "Ouvrir les raccourcis",
        contextOpenSettings: "Ouvrir les param\xE8tres",
        contextCustomizeClicks: "Personnaliser les actions de clic",
        settingsSectionStatusBar: "Actions de clic de la barre d\u2019\xE9tat",
        statusBarSlotClick: "Clic",
        statusBarSlotAltClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + Clic";
        },
        statusBarSlotModClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + Clic";
        },
        statusBarSlotShiftClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + Clic";
        },
        statusBarSlotMiddleClick: "Clic du milieu",
        statusBarSlotAltMiddleClick: modifiedClickLabel("Clic du milieu", "\u2325", "Alt"),
        statusBarSlotModMiddleClick: modifiedClickLabel("Clic du milieu", "\u2318", "Ctrl"),
        statusBarSlotShiftMiddleClick: modifiedClickLabel("Clic du milieu", "\u21E7", "Shift"),
        statusBarSlotRightClick: "Clic droit",
        statusBarSlotAltRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + Clic droit";
        },
        statusBarSlotModRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + Clic droit";
        },
        statusBarSlotShiftRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + Clic droit";
        },
        statusBarActionNone: "Ne rien faire",
        statusBarActionQuickSwitcher: "Ouvrir le s\xE9lecteur rapide",
        statusBarActionSessionManager: "Ouvrir le gestionnaire de sessions",
        statusBarActionSaveSession: "Enregistrer la session",
        statusBarActionReloadWithoutSaving: "Recharger sans enregistrer",
        statusBarActionVersionHistory: "Afficher l\u2019historique des versions",
        statusBarActionRestoreLatestHistory: "Restaurer le dernier historique",
        statusBarActionSessionMenu: "Menu contextuel de session",
        statusBarActionSettingsMenu: "Menu contextuel des param\xE8tres",
        contextResetOverlayPosition: "R\xE9initialiser position et taille",
        settingsConfirmDelete: "Confirmer avant de supprimer une session",
        settingsConfirmDeleteDesc: "Afficher une bo\xEEte de confirmation avant de supprimer une session.",
        settingsConfirmQuickActions: "Confirmer sauvegarde/rechargement dans le s\xE9lecteur rapide",
        settingsConfirmQuickActionsDesc: "Afficher une bo\xEEte de dialogue de confirmation avant de sauvegarder ou recharger une session depuis le s\xE9lecteur rapide.",
        settingsAutoSaveOnSwitch: "Mode d'enregistrement automatique",
        settingsAutoSaveOnSwitchDesc: "Enregistre automatiquement la session en cours lors du changement (par d\xE9faut : activ\xE9). D\xE9sactiv\xE9, vous pouvez enregistrer et recharger les sessions manuellement.",
        settingsWarnUnsavedSwitch: "Avertir avant de basculer sans enregistrer",
        settingsWarnUnsavedSwitchDesc: "Si l\u2019enregistrement auto est d\xE9sactiv\xE9 et que la session actuelle a des modifications non enregistr\xE9es, affiche un avertissement avant le basculement.",
        settingsStatusBarQuickSwitcher: "Changement rapide via la barre d\u2019\xE9tat",
        settingsStatusBarQuickSwitcherDesc: "Si activ\xE9, un clic sur la barre d\u2019\xE9tat ouvre le s\xE9lecteur rapide au lieu du gestionnaire de sessions complet.",
        settingsResetSessions: "R\xE9initialiser les sessions",
        settingsResetSessionsDesc: "Supprime toutes les sessions enregistr\xE9es et ne conserve qu'une session par d\xE9faut recr\xE9\xE9e depuis la disposition actuelle.",
        settingsResetSessionsBtn: "R\xE9initialiser",
        confirmResetSessions: "R\xE9initialiser toutes les sessions par d\xE9faut ? Cette action est irr\xE9versible.",
        resetSessionsHint: "Cela supprimera toutes les sessions enregistr\xE9es et ne conservera qu'une seule session par d\xE9faut.",
        resetSessionsDone: "Les sessions ont \xE9t\xE9 r\xE9initialis\xE9es par d\xE9faut.",
        resetSessionsFailed: "\xC9chec de la r\xE9initialisation des sessions.",
        confirmDeleteSettingsHint: "Pour d\xE9sactiver cette confirmation, allez dans les Param\xE8tres.",
        // --- Groups ---
        groupCreated: function(n) {
          return "Groupe \xAB " + n + " \xBB cr\xE9\xE9";
        },
        groupDeleted: function(n) {
          return "Groupe \xAB " + n + " \xBB supprim\xE9";
        },
        groupRenamed: function(o, n) {
          return "Groupe renomm\xE9 : \xAB " + o + " \xBB \u2192 \xAB " + n + " \xBB";
        },
        groupAll: "Tous",
        groupDuplicateName: "Un groupe avec ce nom existe d\xE9j\xE0.",
        groupEmptyName: "Le nom du groupe ne peut pas \xEAtre vide.",
        cmdSwitchGroup: "Changer de groupe",
        cmdExitGroup: "Afficher toutes les sessions (quitter le groupe)",
        cmdNextGroup: "Groupe suivant",
        cmdPreviousGroup: "Groupe pr\xE9c\xE9dent",
        searchOverlayHelpWithGroups: "\u2191\u2193 d\xE9placer  /  Tab groupe  /  Entr\xE9e changer  /  \u21E7Entr\xE9e sauvegarder  /  \u232B supprimer  /  \xC9chap fermer",
        settingsSectionGroups: "Groupes de sessions",
        contextToggleGroups: "Activer les groupes de sessions",
        settingsSectionGroupsDesc: "Utilisez des groupes pour organiser les sessions. D\xE9sactivez cette option pour masquer les onglets et actions de groupe.",
        settingsGroupCreate: "Cr\xE9er un groupe",
        settingsGroupCreateDesc: "Cr\xE9er un nouveau groupe de sessions.",
        settingsGroupCreatePlaceholder: "Nom du groupe...",
        settingsGroupCreateBtn: "Cr\xE9er",
        settingsGroupManageSessions: "G\xE9rer les sessions",
        settingsGroupManageSessionsDesc: "Ajouter ou retirer des sessions de ce groupe.",
        settingsGroupSessionCount: function(n) {
          return n + " session" + (n !== 1 ? "s" : "");
        },
        settingsGroupDelete: "Supprimer le groupe",
        settingsGroupDeleteConfirm: function(n) {
          return "Supprimer le groupe \xAB " + n + " \xBB ? Les sessions ne seront pas supprim\xE9es.";
        },
        confirmDeleteGroup: function(n) {
          return "Supprimer le groupe \xAB " + n + " \xBB ? Les sessions du groupe ne seront PAS supprim\xE9es.";
        },
        groupAddedSession: function(s, g) {
          return "\xAB " + s + " \xBB ajout\xE9 \xE0 \xAB " + g + " \xBB";
        },
        groupRemovedSession: function(s, g) {
          return "\xAB " + s + " \xBB retir\xE9 de \xAB " + g + " \xBB";
        },
        groupRemoveFromGroup: "Retirer du groupe",
        groupMoveToGroup: "D\xE9placer vers le groupe",
        groupCreateNew: "Nouveau groupe",
        groupCreatePlaceholder: "Nom du groupe...",
        groupContextRename: "Renommer le groupe",
        groupContextDelete: "Supprimer le groupe",
        contextSwitchSession: "Basculer vers cette session",
        contextRenameSession: "Renommer cette session",
        contextDeleteSession: "Supprimer cette session",
        contextDuplicateSession: "Dupliquer cette session",
        contextReloadSession: "Recharger cette session",
        contextSaveSession: "Enregistrer cette session",
        groupRemoveAllSessions: "Retirer toutes les sessions de ce groupe",
        confirmRemoveAllFromGroup: function(g, n) {
          return "Retirer les " + n + " sessions de \xAB " + g + " \xBB ?";
        },
        groupRemovedAllSessions: function(g) {
          return "Toutes les sessions retir\xE9es de \xAB " + g + " \xBB";
        },
        contextDeleteAllGroups: "Supprimer tous les groupes",
        confirmDeleteAllGroups: function(n) {
          return "Supprimer les " + n + " groupes ? Les sessions ne seront pas supprim\xE9es.";
        },
        deletedAllGroups: function(n) {
          return n + " groupes supprim\xE9s";
        },
        contextDeleteAllSessions: "Supprimer toutes les sessions",
        confirmDeleteAllSessions: function(n) {
          return "Supprimer " + n + " sessions ? La session active sera conserv\xE9e.";
        },
        deletedAllSessions: function(n) {
          return n + " sessions supprim\xE9es";
        },
        contextVersionHistory: "Historique des versions",
        cmdVersionHistory: "Voir l'historique des versions de la session",
        historyTitle: "Historique des versions",
        historyEmpty: "Aucun historique pour cette session.",
        historyRestore: "Restaurer",
        historyRestoreConfirm: function(name, time) {
          return "Restaurer la disposition de \xAB " + name + " \xBB depuis " + time + " ?";
        },
        historyRestored: function(name) {
          return "Disposition de \xAB " + name + " \xBB restaur\xE9e";
        },
        historyQuickRestored: function(name) {
          return "Disposition pr\xE9c\xE9dente de \xAB " + name + " \xBB restaur\xE9e rapidement";
        },
        historyNoEntries: "Aucune disposition pr\xE9c\xE9dente \xE0 restaurer.",
        historyToday: "Aujourd'hui",
        historyYesterday: "Hier",
        historyThisWeek: "Cette semaine",
        historyFiles: function(n) {
          return n + " fichier" + (n !== 1 ? "s" : "");
        },
        historyPanes: function(n) {
          return n + " panneau" + (n !== 1 ? "x" : "");
        },
        settingsVersionHistoryEnabled: "Activer l'historique des versions",
        settingsVersionHistoryEnabledDesc: "Conserver un historique des modifications de disposition pour chaque session.",
        settingsVersionHistoryInterval: "Intervalle des instantan\xE9s (minutes)",
        settingsVersionHistoryIntervalDesc: "Fr\xE9quence de v\xE9rification des modifications et de sauvegarde d'un instantan\xE9.",
        settingsVersionHistoryCtrlRmb: platformLabel("Restauration rapide (Cmd + clic droit)", "Restauration rapide (Ctrl + clic droit)"),
        settingsVersionHistoryCtrlRmbDesc: platformLabel("Cliquez droit sur la barre d'\xE9tat en maintenant Cmd pour restaurer la disposition pr\xE9c\xE9dente.", "Cliquez droit sur la barre d'\xE9tat en maintenant Ctrl pour restaurer la disposition pr\xE9c\xE9dente."),
        settingsVersionHistoryConfirmRestore: "Confirmer avant de restaurer",
        settingsVersionHistoryConfirmRestoreDesc: "Afficher une bo\xEEte de dialogue de confirmation avant de restaurer une disposition.",
        rotationBackupSectionTitle: "Sauvegarde",
        rotationBackupCreate: "Cr\xE9er une sauvegarde",
        rotationBackupCreateBtn: "Sauvegarder",
        rotationBackupCreated: "Sauvegarde cr\xE9\xE9e.",
        rotationBackupFailed: "\xC9chec de la cr\xE9ation de la sauvegarde.",
        rotationBackupDesc: "Les sauvegardes sont cr\xE9\xE9es automatiquement lors de l'enregistrement (toutes les heures, jusqu'\xE0 3 g\xE9n\xE9rations).",
        rotationBackupRestore: "Restaurer",
        rotationBackupRestoreConfirm: function(time, count) {
          return "Restaurer depuis la sauvegarde de " + time + " (" + count + " session" + (count !== 1 ? "s" : "") + ") ? Les donn\xE9es actuelles seront \xE9cras\xE9es.";
        },
        rotationBackupRestored: "Restaur\xE9 depuis la sauvegarde.",
        rotationBackupRestoreFailed: "\xC9chec de la restauration depuis la sauvegarde.",
        rotationBackupNone: "Aucune sauvegarde disponible.",
        rotationBackupGeneration: function(count) {
          return count + " session" + (count !== 1 ? "s" : "");
        },
        frontmatterSessionNotFound: function(n) {
          return "Session \xAB\xA0" + n + "\xA0\xBB introuvable (workspace-session)";
        },
        frontmatterAlreadyActive: function(n) {
          return "La session \xAB\xA0" + n + "\xA0\xBB est d\xE9j\xE0 active";
        }
      },
      ar: {
        settingsStatusBarModScrollSwitch: "\u0627\u0633\u062A\u062E\u062F\u0645 Mod + \u0627\u0644\u062A\u0645\u0631\u064A\u0631 \u0644\u0644\u062A\u0628\u062F\u064A\u0644 \u0628\u064A\u0646 \u0627\u0644\u062C\u0644\u0633\u0627\u062A",
        settingsStatusBarModScrollSwitchDesc: "\u0639\u0644\u0649 \u0639\u0646\u0635\u0631 \u0634\u0631\u064A\u0637 \u0627\u0644\u062D\u0627\u0644\u0629\u060C \u0627\u0636\u063A\u0637 \u0645\u0639 \u0627\u0644\u0627\u0633\u062A\u0645\u0631\u0627\u0631 \u0639\u0644\u0649 \u0645\u0641\u062A\u0627\u062D \u0627\u0644\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0645\u062D\u062F\u062F \u062B\u0645 \u0645\u0631\u0631 \u0639\u0645\u0648\u062F\u064A\u064B\u0627 \u0644\u0644\u062A\u0628\u062F\u064A\u0644 \u0628\u064A\u0646 \u0627\u0644\u062C\u0644\u0633\u0627\u062A. \u064A\u0633\u062A\u062E\u062F\u0645 \u062D\u062F\u064B\u0627 \u0623\u062F\u0646\u0649 \u0648\u0641\u062A\u0631\u0629 \u062A\u0647\u062F\u0626\u0629 \u0644\u062A\u0642\u0644\u064A\u0644 \u062A\u0641\u0639\u064A\u0644\u0627\u062A \u0644\u0648\u062D\u0629 \u0627\u0644\u0644\u0645\u0633 \u063A\u064A\u0631 \u0627\u0644\u0645\u0642\u0635\u0648\u062F\u0629.",
        modalTitle: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062C\u0644\u0633\u0627\u062A",
        savePlaceholder: "\u0627\u0633\u0645 \u0627\u0644\u062C\u0644\u0633\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629...",
        filterPlaceholder: "\u062A\u0635\u0641\u064A\u0629 \u0627\u0644\u062C\u0644\u0633\u0627\u062A...",
        settingsShowFilterInput: "\u0625\u0638\u0647\u0627\u0631 \u0641\u0644\u062A\u0631 \u0627\u0644\u062C\u0644\u0633\u0627\u062A",
        settingsShowFilterInputDesc: "\u0639\u0631\u0636 \u0641\u0644\u062A\u0631 \u0646\u0635\u064A \u0641\u064A \u0645\u062F\u064A\u0631 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0644\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0628\u0633\u0631\u0639\u0629.",
        settingsOverlayDefaultFocus: "\u0627\u0644\u062A\u0631\u0643\u064A\u0632 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A \u0644\u0644\u0637\u0628\u0642\u0629",
        settingsOverlayDefaultFocusDesc: "\u0627\u062E\u062A\u0631 \u0627\u0644\u0639\u0646\u0635\u0631 \u0627\u0644\u0630\u064A \u064A\u062A\u0644\u0642\u0649 \u0627\u0644\u062A\u0631\u0643\u064A\u0632 \u0639\u0646\u062F \u0641\u062A\u062D \u0645\u062F\u064A\u0631 \u0627\u0644\u062C\u0644\u0633\u0627\u062A.",
        settingsOverlayFocusCurrentSession: "\u0627\u0644\u062C\u0644\u0633\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629",
        settingsOverlayFocusSessionFilter: "\u0641\u0644\u062A\u0631 \u0627\u0644\u062C\u0644\u0633\u0627\u062A",
        settingsOverlayFocusSessionCreate: "\u0625\u0646\u0634\u0627\u0621 \u062C\u0644\u0633\u0629",
        settingsSectionSessionManager: "\u0645\u062F\u064A\u0631 \u0627\u0644\u062C\u0644\u0633\u0627\u062A",
        settingsShowActiveSwitchCommand: "\u0625\u0638\u0647\u0627\u0631 \u0627\u0644\u062C\u0644\u0633\u0629 \u0627\u0644\u0646\u0634\u0637\u0629 \u0641\u064A \u0644\u0648\u062D\u0629 \u0627\u0644\u0623\u0648\u0627\u0645\u0631",
        settingsShowActiveSwitchCommandDesc: "\u0639\u0631\u0636 \u0623\u0645\u0631 \u0627\u0644\u062A\u0628\u062F\u064A\u0644 \u0644\u0644\u062C\u0644\u0633\u0629 \u0627\u0644\u0646\u0634\u0637\u0629 \u062D\u0627\u0644\u064A\u064B\u0627 \u0641\u064A \u0644\u0648\u062D\u0629 \u0627\u0644\u0623\u0648\u0627\u0645\u0631. \u062A\u0639\u0645\u0644 \u0627\u0644\u0627\u062E\u062A\u0635\u0627\u0631\u0627\u062A \u062F\u0627\u0626\u0645\u064B\u0627 \u0628\u063A\u0636 \u0627\u0644\u0646\u0638\u0631 \u0639\u0646 \u0647\u0630\u0627 \u0627\u0644\u0625\u0639\u062F\u0627\u062F.",
        settingsNumberedSwitchCommands: "\u0623\u0648\u0627\u0645\u0631 \u0627\u0644\u062A\u0628\u062F\u064A\u0644 \u0627\u0644\u0645\u0631\u0642\u0645\u0629",
        settingsNumberedSwitchCommandsDesc: "\u062A\u0633\u062C\u064A\u0644 \u0623\u0648\u0627\u0645\u0631 \u062A\u0628\u062F\u064A\u0644 \u0628\u0641\u062A\u062D\u0627\u062A \u0645\u0631\u0642\u0645\u0629 (1\u20139) \u064A\u0645\u0643\u0646 \u0631\u0628\u0637\u0647\u0627 \u0628\u0627\u0644\u0627\u062E\u062A\u0635\u0627\u0631\u0627\u062A. \u0639\u0646\u062F \u0627\u0644\u0625\u064A\u0642\u0627\u0641\u060C \u062A\u0633\u062A\u062E\u062F\u0645 \u062C\u0645\u064A\u0639 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0623\u0648\u0627\u0645\u0631 \u0645\u0628\u0646\u064A\u0629 \u0639\u0644\u0649 \u0627\u0644\u0627\u0633\u0645.",
        save: "\u0625\u0646\u0634\u0627\u0621",
        load: "\u062A\u0628\u062F\u064A\u0644",
        saveInline: "\u062D\u0641\u0638",
        active: "\u0646\u0634\u0637",
        modifiedJustNow: "\u062A\u0645 \u0627\u0644\u062A\u0639\u062F\u064A\u0644 \u0644\u0644\u062A\u0648",
        modifiedMinutes: function(n) {
          return "\u062A\u0645 \u0627\u0644\u062A\u0639\u062F\u064A\u0644 \u0645\u0646\u0630 " + arPlural(n, "\u062F\u0642\u064A\u0642\u0629", "\u062F\u0642\u064A\u0642\u062A\u064A\u0646", "\u062F\u0642\u0627\u0626\u0642", "\u062F\u0642\u064A\u0642\u0629");
        },
        modifiedHours: function(n) {
          return "\u062A\u0645 \u0627\u0644\u062A\u0639\u062F\u064A\u0644 \u0645\u0646\u0630 " + arPlural(n, "\u0633\u0627\u0639\u0629", "\u0633\u0627\u0639\u062A\u064A\u0646", "\u0633\u0627\u0639\u0627\u062A", "\u0633\u0627\u0639\u0629");
        },
        modifiedDays: function(n) {
          return "\u062A\u0645 \u0627\u0644\u062A\u0639\u062F\u064A\u0644 \u0645\u0646\u0630 " + arPlural(n, "\u064A\u0648\u0645", "\u064A\u0648\u0645\u064A\u0646", "\u0623\u064A\u0627\u0645", "\u064A\u0648\u0645");
        },
        duplicateName: "\u062A\u0648\u062C\u062F \u062C\u0644\u0633\u0629 \u0628\u0647\u0630\u0627 \u0627\u0644\u0627\u0633\u0645 \u0628\u0627\u0644\u0641\u0639\u0644.",
        emptyName: "\u0644\u0627 \u064A\u0645\u0643\u0646 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0627\u0633\u0645 \u0627\u0644\u062C\u0644\u0633\u0629 \u0641\u0627\u0631\u063A\u064B\u0627.",
        created: function(n) {
          return "\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062C\u0644\u0633\u0629 \u201C" + n + "\u201D";
        },
        deleted: function(n) {
          return "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u062C\u0644\u0633\u0629 \u201C" + n + "\u201D";
        },
        loaded: function(n) {
          return "\u062A\u0645 \u0627\u0644\u062A\u0628\u062F\u064A\u0644 \u0625\u0644\u0649 \u201C" + n + "\u201D";
        },
        renamed: function(o, n) {
          return "\u062A\u0645\u062A \u0625\u0639\u0627\u062F\u0629 \u062A\u0633\u0645\u064A\u0629 \u201C" + o + "\u201D \u0625\u0644\u0649 \u201C" + n + "\u201D";
        },
        confirmDelete: function(n) {
          return "\u0647\u0644 \u062A\u0631\u064A\u062F \u062D\u0630\u0641 \u0627\u0644\u062C\u0644\u0633\u0629 \u201C" + n + "\u201D\u061F";
        },
        confirmDeleteActive: function(n) {
          return "\u201C" + n + "\u201D \u0647\u064A \u0627\u0644\u062C\u0644\u0633\u0629 \u0627\u0644\u0646\u0634\u0637\u0629. \u0647\u0644 \u062A\u0631\u064A\u062F \u0627\u0644\u062D\u0630\u0641 \u0639\u0644\u0649 \u0623\u064A \u062D\u0627\u0644\u061F";
        },
        confirmSaveSession: function(n) {
          return '\u062D\u0641\u0638 \u0627\u0644\u062C\u0644\u0633\u0629 "' + n + '"\u061F';
        },
        confirmReloadSession: function(n) {
          return '\u0625\u0639\u0627\u062F\u0629 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u062C\u0644\u0633\u0629 "' + n + '"\u061F \u0633\u064A\u062A\u0645 \u0641\u0642\u062F\u0627\u0646 \u0627\u0644\u062A\u063A\u064A\u064A\u0631\u0627\u062A \u063A\u064A\u0631 \u0627\u0644\u0645\u062D\u0641\u0648\u0638\u0629.';
        },
        renameTitle: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0633\u0645\u064A\u0629 \u0627\u0644\u062C\u0644\u0633\u0629",
        renamePlaceholder: "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u062C\u062F\u064A\u062F...",
        noSession: "\u0644\u0627 \u062A\u0648\u062C\u062F \u062C\u0644\u0633\u0627\u062A",
        cannotDeleteLast: "\u0644\u0627 \u064A\u0645\u0643\u0646 \u062D\u0630\u0641 \u0627\u0644\u062C\u0644\u0633\u0629 \u0627\u0644\u0623\u062E\u064A\u0631\u0629.",
        confirmBulkDelete: function(n) {
          return "\u0647\u0644 \u062A\u0631\u064A\u062F \u062D\u0630\u0641 " + arPlural(n, "\u062C\u0644\u0633\u0629 \u0648\u0627\u062D\u062F\u0629", "\u062C\u0644\u0633\u062A\u064A\u0646", "\u062C\u0644\u0633\u0627\u062A", "\u062C\u0644\u0633\u0629") + "\u061F";
        },
        bulkDeleted: function(n) {
          return "\u062A\u0645 \u062D\u0630\u0641 " + arPlural(n, "\u062C\u0644\u0633\u0629 \u0648\u0627\u062D\u062F\u0629", "\u062C\u0644\u0633\u062A\u064A\u0646", "\u062C\u0644\u0633\u0627\u062A", "\u062C\u0644\u0633\u0629");
        },
        bulkDelete: function(n) {
          return "\u062D\u0630\u0641 " + arPlural(n, "\u062C\u0644\u0633\u0629 \u0648\u0627\u062D\u062F\u0629", "\u062C\u0644\u0633\u062A\u064A\u0646", "\u062C\u0644\u0633\u0627\u062A", "\u062C\u0644\u0633\u0629");
        },
        cmdManage: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062C\u0644\u0633\u0627\u062A",
        cmdCreate: "\u0625\u0646\u0634\u0627\u0621 \u062C\u0644\u0633\u0629 \u062C\u062F\u064A\u062F\u0629",
        cmdRename: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0633\u0645\u064A\u0629 \u0627\u0644\u062C\u0644\u0633\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629",
        cmdDelete: "\u062D\u0630\u0641 \u0627\u0644\u062C\u0644\u0633\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629",
        cmdNewEmpty: "\u0625\u0646\u0634\u0627\u0621 \u062C\u0644\u0633\u0629 \u0641\u0627\u0631\u063A\u0629",
        cmdDuplicate: "\u0646\u0633\u062E \u0627\u0644\u062C\u0644\u0633\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629",
        duplicated: function(n) {
          return "\u062A\u0645 \u0627\u0644\u0646\u0633\u062E \u0628\u0627\u0633\u0645 \u201C" + n + "\u201D";
        },
        deselect: "\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062A\u062D\u062F\u064A\u062F",
        footerDragReorder: "\u0627\u0633\u062D\u0628 \u0644\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0631\u062A\u064A\u0628",
        footerDragToGroup: "\u0627\u0633\u062D\u0628 \u0625\u0644\u0649 \u0639\u0644\u0627\u0645\u0629 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629 \u0644\u0644\u0646\u0642\u0644",
        defaultLabel: "(\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629)",
        rename: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0633\u0645\u064A\u0629",
        delete: "\u062D\u0630\u0641",
        remove: "\u0625\u0632\u0627\u0644\u0629",
        cancel: "\u0625\u0644\u063A\u0627\u0621",
        ribbonTooltip: "Workspace++",
        cmdSwitchTo: function(n, name) {
          return name ? "\u0627\u0644\u062A\u0628\u062F\u064A\u0644 \u0625\u0644\u0649 \u0627\u0644\u062C\u0644\u0633\u0629 " + n + ": " + name : "\u0627\u0644\u062A\u0628\u062F\u064A\u0644 \u0625\u0644\u0649 \u0627\u0644\u062C\u0644\u0633\u0629 " + n;
        },
        cmdSwitchToNamed: function(name) {
          return '\u0627\u0644\u062A\u0628\u062F\u064A\u0644 \u0625\u0644\u0649 "' + name + '"';
        },
        cmdPrevious: "\u0627\u0644\u062C\u0644\u0633\u0629 \u0627\u0644\u0633\u0627\u0628\u0642\u0629",
        cmdNext: "\u0627\u0644\u062C\u0644\u0633\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629",
        cmdSaveCurrent: "\u062D\u0641\u0638 \u0627\u0644\u062C\u0644\u0633\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629",
        cmdSaveAs: "\u062D\u0641\u0638 \u0627\u0644\u062C\u0644\u0633\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u0628\u0627\u0633\u0645...",
        cmdToggleAutoSave: "\u062A\u0628\u062F\u064A\u0644 \u0627\u0644\u062D\u0641\u0638 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A \u0639\u0646\u062F \u0627\u0644\u062A\u0628\u062F\u064A\u0644",
        cmdEnableAutoSave: "\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u062D\u0641\u0638 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A \u0639\u0646\u062F \u0627\u0644\u062A\u0628\u062F\u064A\u0644",
        cmdDisableAutoSave: "\u062A\u0639\u0637\u064A\u0644 \u0627\u0644\u062D\u0641\u0638 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A \u0639\u0646\u062F \u0627\u0644\u062A\u0628\u062F\u064A\u0644",
        cmdSearchOverlay: "\u0628\u062D\u062B \u0627\u0644\u062C\u0644\u0633\u0627\u062A",
        switchLeft: "\u064A\u0633\u0627\u0631",
        switchRight: "\u064A\u0645\u064A\u0646",
        switchGroup: "\u0645\u062C\u0645\u0648\u0639\u0629",
        keyTab: "Tab",
        savedSession: function(n) {
          return "\u062A\u0645 \u062D\u0641\u0638 \u0627\u0644\u062C\u0644\u0633\u0629 \u201C" + n + "\u201D";
        },
        savedAs: function(n) {
          return "\u062A\u0645 \u0627\u0644\u062D\u0641\u0638 \u0628\u0627\u0633\u0645 \u201C" + n + "\u201D";
        },
        noChanges: "\u0644\u0627 \u062A\u0648\u062C\u062F \u062A\u063A\u064A\u064A\u0631\u0627\u062A \u0644\u0644\u062D\u0641\u0638",
        autoSaveEnabled: "\u062A\u0645 \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u062D\u0641\u0638 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A \u0639\u0646\u062F \u0627\u0644\u062A\u0628\u062F\u064A\u0644.",
        autoSaveDisabled: "\u062A\u0645 \u062A\u0639\u0637\u064A\u0644 \u0627\u0644\u062D\u0641\u0638 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A \u0639\u0646\u062F \u0627\u0644\u062A\u0628\u062F\u064A\u0644.",
        confirmUnsavedSwitch: function(n) {
          return "\u062A\u0648\u062C\u062F \u062A\u063A\u064A\u064A\u0631\u0627\u062A \u063A\u064A\u0631 \u0645\u062D\u0641\u0648\u0638\u0629 \u0641\u064A \u0627\u0644\u062C\u0644\u0633\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629. \u0647\u0644 \u062A\u0631\u064A\u062F \u0627\u0644\u062A\u0628\u062F\u064A\u0644 \u0625\u0644\u0649 \u201C" + n + "\u201D\u061F";
        },
        saveAndSwitch: "\u062D\u0641\u0638 \u062B\u0645 \u062A\u0628\u062F\u064A\u0644",
        switchWithoutSaving: "\u062A\u0628\u062F\u064A\u0644 \u0628\u062F\u0648\u0646 \u062D\u0641\u0638",
        sessionAutoName: function(n) {
          return "\u062C\u0644\u0633\u0629 \u062C\u062F\u064A\u062F\u0629 " + n;
        },
        noFilteredSessions: "\u0644\u0627 \u062A\u0648\u062C\u062F \u062C\u0644\u0633\u0627\u062A \u0645\u0637\u0627\u0628\u0642\u0629",
        noGroupSessions: "\u0644\u0627 \u062A\u0648\u062C\u062F \u062C\u0644\u0633\u0627\u062A \u0641\u064A \u0647\u0630\u0647 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629",
        searchOverlayPlaceholder: "\u0627\u0643\u062A\u0628 \u0644\u062A\u0635\u0641\u064A\u0629 \u0627\u0644\u062C\u0644\u0633\u0627\u062A...",
        searchOverlayHelp: "\u2191\u2193 \u0644\u0644\u062A\u062D\u0631\u064A\u0643  /  Enter \u0644\u0644\u062A\u0628\u062F\u064A\u0644  /  \u21E7Enter \u062D\u0641\u0638  /  \u232B \u0644\u0644\u062D\u0630\u0641  /  Esc \u0644\u0644\u0625\u063A\u0644\u0627\u0642",
        backupRestored: "Workspace++: \u062A\u0645\u062A \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0645\u0646 \u0627\u0644\u0646\u0633\u062E\u0629 \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629.",
        settingsLanguage: "\u0627\u0644\u0644\u063A\u0629",
        settingsLanguageDesc: "\u0644\u063A\u0629 \u0648\u0627\u062C\u0647\u0629 \u0627\u0644\u0625\u0636\u0627\u0641\u0629. \u0623\u0639\u062F \u062A\u0634\u063A\u064A\u0644 Obsidian \u0644\u062A\u0637\u0628\u064A\u0642 \u0623\u0633\u0645\u0627\u0621 \u0627\u0644\u0623\u0648\u0627\u0645\u0631.",
        settingsSectionGeneral: "\u0639\u0627\u0645",
        settingsTabSessions: "\u0627\u0644\u062C\u0644\u0633\u0627\u062A",
        settingsSectionSwitching: "\u0627\u0644\u062D\u0641\u0638 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A \u0644\u0644\u062C\u0644\u0633\u0627\u062A",
        settingsSectionSwitchPreview: "\u062A\u0628\u062F\u064A\u0644 \u0627\u0644\u062C\u0644\u0633\u0627\u062A",
        settingsSectionDeletion: "\u062D\u0630\u0641 \u0627\u0644\u062C\u0644\u0633\u0627\u062A",
        settingsLangAuto: "\u062A\u0644\u0642\u0627\u0626\u064A (\u0644\u063A\u0629 \u0627\u0644\u0646\u0638\u0627\u0645)",
        settingsTranslationHelp: "\u0648\u062C\u062F\u062A \u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062A\u0631\u062C\u0645\u0629\u061F \u064A\u0631\u062C\u0649 \u0641\u062A\u062D issue \u0623\u0648 pull request \u0639\u0644\u0649 GitHub.",
        settingsPreviewHeading: "\u0639\u0631\u0636 \u0627\u0644\u062C\u0644\u0633\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u0642\u0628\u0644 \u0627\u0644\u062A\u0628\u062F\u064A\u0644",
        settingsPreviewDesc: "\u0639\u0646\u062F \u0627\u0644\u062A\u0628\u062F\u064A\u0644 \u0628\u064A\u0646 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0628\u0627\u0644\u0627\u062E\u062A\u0635\u0627\u0631\u060C \u064A\u0639\u0631\u0636 \u0627\u0644\u0636\u063A\u0637 \u0627\u0644\u0623\u0648\u0644 \u0645\u0648\u0642\u0639\u0643 \u0627\u0644\u062D\u0627\u0644\u064A \u062F\u0648\u0646 \u0627\u0644\u062A\u0628\u062F\u064A\u0644.",
        settingsPreviewNext: "\u0627\u0644\u062C\u0644\u0633\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629",
        settingsPreviewPrevious: "\u0627\u0644\u062C\u0644\u0633\u0629 \u0627\u0644\u0633\u0627\u0628\u0642\u0629",
        settingsHotkeys: "\u0627\u062E\u062A\u0635\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0641\u0627\u062A\u064A\u062D",
        settingsHotkeysBtn: "\u0641\u062A\u062D \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0627\u062E\u062A\u0635\u0627\u0631\u0627\u062A",
        contextOpenSettings: "\u0641\u062A\u062D \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",
        contextCustomizeClicks: "\u062A\u062E\u0635\u064A\u0635 \u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u0646\u0642\u0631",
        settingsSectionStatusBar: "\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u0646\u0642\u0631 \u0639\u0644\u0649 \u0634\u0631\u064A\u0637 \u0627\u0644\u062D\u0627\u0644\u0629",
        statusBarSlotClick: "\u0646\u0642\u0631",
        statusBarSlotAltClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + \u0646\u0642\u0631";
        },
        statusBarSlotModClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + \u0646\u0642\u0631";
        },
        statusBarSlotShiftClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + \u0646\u0642\u0631";
        },
        statusBarSlotRightClick: "\u0646\u0642\u0631 \u064A\u0645\u064A\u0646",
        statusBarSlotAltRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + \u0646\u0642\u0631 \u064A\u0645\u064A\u0646";
        },
        statusBarSlotModRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + \u0646\u0642\u0631 \u064A\u0645\u064A\u0646";
        },
        statusBarSlotShiftRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + \u0646\u0642\u0631 \u064A\u0645\u064A\u0646";
        },
        statusBarSlotMiddleClick: "\u0646\u0642\u0631 \u0628\u0627\u0644\u0632\u0631 \u0627\u0644\u0623\u0648\u0633\u0637",
        statusBarSlotAltMiddleClick: modifiedClickLabel("\u0646\u0642\u0631 \u0628\u0627\u0644\u0632\u0631 \u0627\u0644\u0623\u0648\u0633\u0637", "\u2325", "Alt"),
        statusBarSlotModMiddleClick: modifiedClickLabel("\u0646\u0642\u0631 \u0628\u0627\u0644\u0632\u0631 \u0627\u0644\u0623\u0648\u0633\u0637", "\u2318", "Ctrl"),
        statusBarSlotShiftMiddleClick: modifiedClickLabel("\u0646\u0642\u0631 \u0628\u0627\u0644\u0632\u0631 \u0627\u0644\u0623\u0648\u0633\u0637", "\u21E7", "Shift"),
        statusBarActionNone: "\u0644\u0627 \u0634\u064A\u0621",
        statusBarActionQuickSwitcher: "\u0641\u062A\u062D \u0627\u0644\u0645\u0628\u062F\u0651\u0644 \u0627\u0644\u0633\u0631\u064A\u0639",
        statusBarActionSessionManager: "\u0641\u062A\u062D \u0645\u062F\u064A\u0631 \u0627\u0644\u062C\u0644\u0633\u0627\u062A",
        statusBarActionSaveSession: "\u062D\u0641\u0638 \u0627\u0644\u062C\u0644\u0633\u0629",
        statusBarActionReloadWithoutSaving: "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u062D\u0645\u064A\u0644 \u0628\u062F\u0648\u0646 \u062D\u0641\u0638",
        statusBarActionVersionHistory: "\u0639\u0631\u0636 \u0633\u062C\u0644 \u0627\u0644\u0625\u0635\u062F\u0627\u0631\u0627\u062A",
        statusBarActionRestoreLatestHistory: "\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0623\u062D\u062F\u062B \u0633\u062C\u0644",
        statusBarActionSessionMenu: "\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062C\u0644\u0633\u0629",
        statusBarActionSettingsMenu: "\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",
        contextResetOverlayPosition: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0627\u0644\u0645\u0648\u0636\u0639 \u0648\u0627\u0644\u062D\u062C\u0645",
        settingsConfirmDelete: "\u062A\u0623\u0643\u064A\u062F \u0642\u0628\u0644 \u062D\u0630\u0641 \u0627\u0644\u062C\u0644\u0633\u0629",
        settingsConfirmDeleteDesc: "\u0639\u0631\u0636 \u0645\u0631\u0628\u0639 \u062A\u0623\u0643\u064A\u062F \u0642\u0628\u0644 \u062D\u0630\u0641 \u0627\u0644\u062C\u0644\u0633\u0629.",
        settingsConfirmQuickActions: "\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062D\u0641\u0638/\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u062D\u0645\u064A\u0644 \u0641\u064A \u0627\u0644\u0645\u0628\u062F\u0644 \u0627\u0644\u0633\u0631\u064A\u0639",
        settingsConfirmQuickActionsDesc: "\u0639\u0631\u0636 \u0645\u0631\u0628\u0639 \u062D\u0648\u0627\u0631 \u062A\u0623\u0643\u064A\u062F \u0642\u0628\u0644 \u062D\u0641\u0638 \u0623\u0648 \u0625\u0639\u0627\u062F\u0629 \u062A\u062D\u0645\u064A\u0644 \u062C\u0644\u0633\u0629 \u0645\u0646 \u0627\u0644\u0645\u0628\u062F\u0644 \u0627\u0644\u0633\u0631\u064A\u0639.",
        settingsAutoSaveOnSwitch: "\u0648\u0636\u0639 \u0627\u0644\u062D\u0641\u0638 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A",
        settingsAutoSaveOnSwitchDesc: "\u064A\u062D\u0641\u0638 \u0627\u0644\u062C\u0644\u0633\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u062A\u0644\u0642\u0627\u0626\u064A\u064B\u0627 \u0639\u0646\u062F \u0627\u0644\u062A\u0628\u062F\u064A\u0644 (\u0627\u0641\u062A\u0631\u0627\u0636\u064A: \u0645\u0641\u0639\u0651\u0644). \u0639\u0646\u062F \u0627\u0644\u0625\u064A\u0642\u0627\u0641\u060C \u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u062D\u0641\u0638 \u0648\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u062D\u0645\u064A\u0644 \u064A\u062F\u0648\u064A\u064B\u0627.",
        settingsWarnUnsavedSwitch: "\u0627\u0644\u062A\u062D\u0630\u064A\u0631 \u0642\u0628\u0644 \u0627\u0644\u062A\u0628\u062F\u064A\u0644 \u0628\u062F\u0648\u0646 \u062D\u0641\u0638",
        settingsWarnUnsavedSwitchDesc: "\u0625\u0630\u0627 \u0643\u0627\u0646 \u0627\u0644\u062D\u0641\u0638 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A \u0645\u0639\u0637\u0644\u0627\u064B \u0648\u0627\u0644\u062C\u0644\u0633\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u062A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u062A\u063A\u064A\u064A\u0631\u0627\u062A \u063A\u064A\u0631 \u0645\u062D\u0641\u0648\u0638\u0629\u060C \u0641\u0627\u0639\u0631\u0636 \u062A\u062D\u0630\u064A\u0631\u064B\u0627 \u0642\u0628\u0644 \u0627\u0644\u062A\u0628\u062F\u064A\u0644.",
        settingsStatusBarQuickSwitcher: "\u0627\u0644\u062A\u0628\u062F\u064A\u0644 \u0627\u0644\u0633\u0631\u064A\u0639 \u0639\u0646\u062F \u0627\u0644\u0646\u0642\u0631 \u0639\u0644\u0649 \u0634\u0631\u064A\u0637 \u0627\u0644\u062D\u0627\u0644\u0629",
        settingsStatusBarQuickSwitcherDesc: "\u0639\u0646\u062F \u0627\u0644\u062A\u0641\u0639\u064A\u0644\u060C \u064A\u0624\u062F\u064A \u0627\u0644\u0646\u0642\u0631 \u0639\u0644\u0649 \u0634\u0631\u064A\u0637 \u0627\u0644\u062D\u0627\u0644\u0629 \u0625\u0644\u0649 \u0641\u062A\u062D \u0627\u0644\u0645\u0628\u062F\u0651\u0644 \u0627\u0644\u0633\u0631\u064A\u0639 \u0628\u062F\u0644\u0627\u064B \u0645\u0646 \u0645\u062F\u064A\u0631 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0627\u0644\u0643\u0627\u0645\u0644.",
        settingsResetSessions: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0627\u0644\u062C\u0644\u0633\u0627\u062A",
        settingsResetSessionsDesc: "\u0627\u062D\u0630\u0641 \u062C\u0645\u064A\u0639 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0627\u0644\u0645\u062D\u0641\u0648\u0638\u0629 \u0648\u0627\u062D\u062A\u0641\u0638 \u0641\u0642\u0637 \u0628\u062C\u0644\u0633\u0629 \u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629 \u062C\u062F\u064A\u062F\u0629 \u0645\u0646 \u0627\u0644\u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u062D\u0627\u0644\u064A.",
        settingsResetSessionsBtn: "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0639\u064A\u064A\u0646",
        confirmResetSessions: "\u0647\u0644 \u062A\u0631\u064A\u062F \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u062C\u0645\u064A\u0639 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0625\u0644\u0649 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u061F \u0644\u0627 \u064A\u0645\u0643\u0646 \u0627\u0644\u062A\u0631\u0627\u062C\u0639 \u0639\u0646 \u0647\u0630\u0627 \u0627\u0644\u0625\u062C\u0631\u0627\u0621.",
        resetSessionsHint: "\u0633\u064A\u0624\u062F\u064A \u0647\u0630\u0627 \u0625\u0644\u0649 \u0625\u0632\u0627\u0644\u0629 \u062C\u0645\u064A\u0639 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0627\u0644\u0645\u062D\u0641\u0648\u0638\u0629 \u0648\u0627\u0644\u0627\u062D\u062A\u0641\u0627\u0638 \u0628\u062C\u0644\u0633\u0629 \u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629 \u0648\u0627\u062D\u062F\u0629 \u0641\u0642\u0637.",
        resetSessionsDone: "\u062A\u0645\u062A \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0625\u0644\u0649 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A.",
        resetSessionsFailed: "\u0641\u0634\u0644 \u0641\u064A \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0627\u0644\u062C\u0644\u0633\u0627\u062A.",
        confirmDeleteSettingsHint: "\u0644\u062A\u0639\u0637\u064A\u0644 \u0647\u0630\u0627 \u0627\u0644\u062A\u0623\u0643\u064A\u062F\u060C \u0627\u0646\u062A\u0642\u0644 \u0625\u0644\u0649 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A.",
        // --- Groups ---
        groupCreated: function(n) {
          return '\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629 "' + n + '"';
        },
        groupDeleted: function(n) {
          return '\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629 "' + n + '"';
        },
        groupRenamed: function(o, n) {
          return '\u062A\u0645\u062A \u0625\u0639\u0627\u062F\u0629 \u062A\u0633\u0645\u064A\u0629 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629: "' + o + '" \u2192 "' + n + '"';
        },
        groupAll: "\u0627\u0644\u0643\u0644",
        groupDuplicateName: "\u064A\u0648\u062C\u062F \u0645\u062C\u0645\u0648\u0639\u0629 \u0628\u0647\u0630\u0627 \u0627\u0644\u0627\u0633\u0645 \u0628\u0627\u0644\u0641\u0639\u0644.",
        groupEmptyName: "\u0644\u0627 \u064A\u0645\u0643\u0646 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0627\u0633\u0645 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629 \u0641\u0627\u0631\u063A\u064B\u0627.",
        cmdSwitchGroup: "\u062A\u0628\u062F\u064A\u0644 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629",
        cmdExitGroup: "\u0639\u0631\u0636 \u062C\u0645\u064A\u0639 \u0627\u0644\u062C\u0644\u0633\u0627\u062A (\u0645\u063A\u0627\u062F\u0631\u0629 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629)",
        cmdNextGroup: "\u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629",
        cmdPreviousGroup: "\u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629 \u0627\u0644\u0633\u0627\u0628\u0642\u0629",
        searchOverlayHelpWithGroups: "\u2191\u2193 \u062A\u0646\u0642\u0644  /  Tab \u0645\u062C\u0645\u0648\u0639\u0629  /  Enter \u062A\u0628\u062F\u064A\u0644  /  \u21E7Enter \u062D\u0641\u0638  /  \u232B \u062D\u0630\u0641  /  Esc \u0625\u063A\u0644\u0627\u0642",
        settingsSectionGroups: "\u0645\u062C\u0645\u0648\u0639\u0627\u062A \u0627\u0644\u062C\u0644\u0633\u0627\u062A",
        contextToggleGroups: "\u062A\u0641\u0639\u064A\u0644 \u0645\u062C\u0645\u0648\u0639\u0627\u062A \u0627\u0644\u062C\u0644\u0633\u0627\u062A",
        settingsSectionGroupsDesc: "\u0627\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A \u0644\u062A\u0646\u0638\u064A\u0645 \u0627\u0644\u062C\u0644\u0633\u0627\u062A. \u0639\u0646\u062F \u0627\u0644\u0625\u064A\u0642\u0627\u0641 \u0633\u064A\u062A\u0645 \u0625\u062E\u0641\u0627\u0621 \u0639\u0644\u0627\u0645\u0627\u062A \u062A\u0628\u0648\u064A\u0628 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A \u0648\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u062A\u0628\u062F\u064A\u0644 \u0628\u064A\u0646\u0647\u0627.",
        settingsGroupCreate: "\u0625\u0646\u0634\u0627\u0621 \u0645\u062C\u0645\u0648\u0639\u0629",
        settingsGroupCreateDesc: "\u0625\u0646\u0634\u0627\u0621 \u0645\u062C\u0645\u0648\u0639\u0629 \u062C\u0644\u0633\u0627\u062A \u062C\u062F\u064A\u062F\u0629.",
        settingsGroupCreatePlaceholder: "\u0627\u0633\u0645 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629...",
        settingsGroupCreateBtn: "\u0625\u0646\u0634\u0627\u0621",
        settingsGroupManageSessions: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062C\u0644\u0633\u0627\u062A",
        settingsGroupManageSessionsDesc: "\u0625\u0636\u0627\u0641\u0629 \u0623\u0648 \u0625\u0632\u0627\u0644\u0629 \u062C\u0644\u0633\u0627\u062A \u0645\u0646 \u0647\u0630\u0647 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629.",
        settingsGroupSessionCount: function(n) {
          return arPlural(n, "\u062C\u0644\u0633\u0629 \u0648\u0627\u062D\u062F\u0629", "\u062C\u0644\u0633\u062A\u0627\u0646", "\u062C\u0644\u0633\u0627\u062A", "\u062C\u0644\u0633\u0629");
        },
        settingsGroupDelete: "\u062D\u0630\u0641 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629",
        settingsGroupDeleteConfirm: function(n) {
          return '\u062D\u0630\u0641 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629 "' + n + '"\u061F \u0644\u0646 \u064A\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u062C\u0644\u0633\u0627\u062A.';
        },
        confirmDeleteGroup: function(n) {
          return '\u062D\u0630\u0641 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629 "' + n + '"\u061F \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u062F\u0627\u062E\u0644 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629 \u0644\u0646 \u064A\u062A\u0645 \u062D\u0630\u0641\u0647\u0627.';
        },
        groupAddedSession: function(s, g) {
          return '\u062A\u0645\u062A \u0625\u0636\u0627\u0641\u0629 "' + s + '" \u0625\u0644\u0649 "' + g + '"';
        },
        groupRemovedSession: function(s, g) {
          return '\u062A\u0645\u062A \u0625\u0632\u0627\u0644\u0629 "' + s + '" \u0645\u0646 "' + g + '"';
        },
        groupRemoveFromGroup: "\u0625\u0632\u0627\u0644\u0629 \u0645\u0646 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629",
        groupMoveToGroup: "\u0646\u0642\u0644 \u0625\u0644\u0649 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629",
        groupCreateNew: "\u0645\u062C\u0645\u0648\u0639\u0629 \u062C\u062F\u064A\u062F\u0629",
        groupCreatePlaceholder: "\u0627\u0633\u0645 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629...",
        groupContextRename: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0633\u0645\u064A\u0629 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629",
        groupContextDelete: "\u062D\u0630\u0641 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629",
        contextSwitchSession: "\u0627\u0644\u062A\u0628\u062F\u064A\u0644 \u0625\u0644\u0649 \u0647\u0630\u0647 \u0627\u0644\u062C\u0644\u0633\u0629",
        contextRenameSession: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0633\u0645\u064A\u0629 \u0647\u0630\u0647 \u0627\u0644\u062C\u0644\u0633\u0629",
        contextDeleteSession: "\u062D\u0630\u0641 \u0647\u0630\u0647 \u0627\u0644\u062C\u0644\u0633\u0629",
        contextDuplicateSession: "\u062A\u0643\u0631\u0627\u0631 \u0647\u0630\u0647 \u0627\u0644\u062C\u0644\u0633\u0629",
        contextReloadSession: "\u0625\u0639\u0627\u062F\u0629 \u062A\u062D\u0645\u064A\u0644 \u0647\u0630\u0647 \u0627\u0644\u062C\u0644\u0633\u0629",
        contextSaveSession: "\u062D\u0641\u0638 \u0647\u0630\u0647 \u0627\u0644\u062C\u0644\u0633\u0629",
        groupRemoveAllSessions: "\u0625\u0632\u0627\u0644\u0629 \u062C\u0645\u064A\u0639 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0645\u0646 \u0647\u0630\u0647 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629",
        confirmRemoveAllFromGroup: function(g, n) {
          return "\u0625\u0632\u0627\u0644\u0629 \u062C\u0645\u064A\u0639 \u0627\u0644\u062C\u0644\u0633\u0627\u062A (" + n + ') \u0645\u0646 "' + g + '"\u061F';
        },
        groupRemovedAllSessions: function(g) {
          return '\u062A\u0645\u062A \u0625\u0632\u0627\u0644\u0629 \u062C\u0645\u064A\u0639 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0645\u0646 "' + g + '"';
        },
        contextDeleteAllGroups: "\u062D\u0630\u0641 \u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A",
        confirmDeleteAllGroups: function(n) {
          return "\u062D\u0630\u0641 \u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A (" + n + ")\u061F \u0644\u0646 \u064A\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u062C\u0644\u0633\u0627\u062A.";
        },
        deletedAllGroups: function(n) {
          return "\u062A\u0645 \u062D\u0630\u0641 " + n + " \u0645\u062C\u0645\u0648\u0639\u0629";
        },
        contextDeleteAllSessions: "\u062D\u0630\u0641 \u062C\u0645\u064A\u0639 \u0627\u0644\u062C\u0644\u0633\u0627\u062A",
        confirmDeleteAllSessions: function(n) {
          return "\u062D\u0630\u0641 " + n + " \u062C\u0644\u0633\u0629\u061F \u0633\u064A\u062A\u0645 \u0627\u0644\u0627\u062D\u062A\u0641\u0627\u0638 \u0628\u0627\u0644\u062C\u0644\u0633\u0629 \u0627\u0644\u0646\u0634\u0637\u0629.";
        },
        deletedAllSessions: function(n) {
          return "\u062A\u0645 \u062D\u0630\u0641 " + n + " \u062C\u0644\u0633\u0629";
        },
        contextVersionHistory: "\u0633\u062C\u0644 \u0627\u0644\u0625\u0635\u062F\u0627\u0631\u0627\u062A",
        cmdVersionHistory: "\u0639\u0631\u0636 \u0633\u062C\u0644 \u0625\u0635\u062F\u0627\u0631\u0627\u062A \u0627\u0644\u062C\u0644\u0633\u0629",
        historyTitle: "\u0633\u062C\u0644 \u0627\u0644\u0625\u0635\u062F\u0627\u0631\u0627\u062A",
        historyEmpty: "\u0644\u0627 \u064A\u0648\u062C\u062F \u0633\u062C\u0644 \u0625\u0635\u062F\u0627\u0631\u0627\u062A \u0644\u0647\u0630\u0647 \u0627\u0644\u062C\u0644\u0633\u0629.",
        historyRestore: "\u0627\u0633\u062A\u0639\u0627\u062F\u0629",
        historyRestoreConfirm: function(name, time) {
          return '\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u062A\u062E\u0637\u064A\u0637 "' + name + '" \u0645\u0646 ' + time + "\u061F";
        },
        historyRestored: function(name) {
          return '\u062A\u0645 \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u062A\u062E\u0637\u064A\u0637 "' + name + '"';
        },
        historyQuickRestored: function(name) {
          return '\u062A\u0645 \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u0633\u0627\u0628\u0642 \u0644\u0640 "' + name + '" \u0628\u0633\u0631\u0639\u0629';
        },
        historyNoEntries: "\u0644\u0627 \u062A\u0648\u062C\u062F \u062A\u062E\u0637\u064A\u0637\u0627\u062A \u0633\u0627\u0628\u0642\u0629 \u0644\u0644\u0627\u0633\u062A\u0639\u0627\u062F\u0629.",
        historyToday: "\u0627\u0644\u064A\u0648\u0645",
        historyYesterday: "\u0623\u0645\u0633",
        historyThisWeek: "\u0647\u0630\u0627 \u0627\u0644\u0623\u0633\u0628\u0648\u0639",
        historyFiles: function(n) {
          return n + " \u0645\u0644\u0641";
        },
        historyPanes: function(n) {
          return n + " \u0644\u0648\u062D\u0629";
        },
        settingsVersionHistoryEnabled: "\u062A\u0641\u0639\u064A\u0644 \u0633\u062C\u0644 \u0627\u0644\u0625\u0635\u062F\u0627\u0631\u0627\u062A",
        settingsVersionHistoryEnabledDesc: "\u0627\u0644\u0627\u062D\u062A\u0641\u0627\u0638 \u0628\u0633\u062C\u0644 \u062A\u063A\u064A\u064A\u0631\u0627\u062A \u0627\u0644\u062A\u062E\u0637\u064A\u0637 \u0644\u0643\u0644 \u062C\u0644\u0633\u0629.",
        settingsVersionHistoryInterval: "\u0641\u062A\u0631\u0629 \u0627\u0644\u0644\u0642\u0637\u0627\u062A (\u0628\u0627\u0644\u062F\u0642\u0627\u0626\u0642)",
        settingsVersionHistoryIntervalDesc: "\u0639\u062F\u062F \u0645\u0631\u0627\u062A \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u062A\u063A\u064A\u064A\u0631\u0627\u062A \u0627\u0644\u062A\u062E\u0637\u064A\u0637 \u0648\u062D\u0641\u0638 \u0644\u0642\u0637\u0629.",
        settingsVersionHistoryCtrlRmb: platformLabel("\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0633\u0631\u064A\u0639\u0629 (Cmd + \u0646\u0642\u0631 \u064A\u0645\u064A\u0646)", "\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0633\u0631\u064A\u0639\u0629 (Ctrl + \u0646\u0642\u0631 \u064A\u0645\u064A\u0646)"),
        settingsVersionHistoryCtrlRmbDesc: platformLabel("\u0627\u0646\u0642\u0631 \u0628\u0632\u0631 \u0627\u0644\u0645\u0627\u0648\u0633 \u0627\u0644\u0623\u064A\u0645\u0646 \u0639\u0644\u0649 \u0634\u0631\u064A\u0637 \u0627\u0644\u062D\u0627\u0644\u0629 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u0636\u063A\u0637 \u0639\u0644\u0649 Cmd \u0644\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u0633\u0627\u0628\u0642.", "\u0627\u0646\u0642\u0631 \u0628\u0632\u0631 \u0627\u0644\u0645\u0627\u0648\u0633 \u0627\u0644\u0623\u064A\u0645\u0646 \u0639\u0644\u0649 \u0634\u0631\u064A\u0637 \u0627\u0644\u062D\u0627\u0644\u0629 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u0636\u063A\u0637 \u0639\u0644\u0649 Ctrl \u0644\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u0633\u0627\u0628\u0642."),
        settingsVersionHistoryConfirmRestore: "\u062A\u0623\u0643\u064A\u062F \u0642\u0628\u0644 \u0627\u0644\u0627\u0633\u062A\u0639\u0627\u062F\u0629",
        settingsVersionHistoryConfirmRestoreDesc: "\u0639\u0631\u0636 \u0645\u0631\u0628\u0639 \u062D\u0648\u0627\u0631 \u062A\u0623\u0643\u064A\u062F \u0642\u0628\u0644 \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u062A\u062E\u0637\u064A\u0637 \u0633\u0627\u0628\u0642.",
        rotationBackupSectionTitle: "\u0627\u0644\u0646\u0633\u062E \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A",
        rotationBackupCreate: "\u0625\u0646\u0634\u0627\u0621 \u0646\u0633\u062E\u0629 \u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629",
        rotationBackupCreateBtn: "\u0646\u0633\u062E \u0627\u0644\u0622\u0646",
        rotationBackupCreated: "\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0646\u0633\u062E\u0629 \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629.",
        rotationBackupFailed: "\u0641\u0634\u0644 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0646\u0633\u062E\u0629 \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629.",
        rotationBackupDesc: "\u064A\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0646\u0633\u062E \u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B \u0639\u0646\u062F \u0627\u0644\u062D\u0641\u0638 (\u0643\u0644 \u0633\u0627\u0639\u0629\u060C \u062D\u062A\u0649 3 \u0623\u062C\u064A\u0627\u0644).",
        rotationBackupRestore: "\u0627\u0633\u062A\u0639\u0627\u062F\u0629",
        rotationBackupRestoreConfirm: function(time, count) {
          return "\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0645\u0646 \u0627\u0644\u0646\u0633\u062E\u0629 \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629 \u0641\u064A " + time + " (" + count + " \u062C\u0644\u0633\u0629)\u061F \u0633\u064A\u062A\u0645 \u0627\u0644\u0643\u062A\u0627\u0628\u0629 \u0641\u0648\u0642 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062D\u0627\u0644\u064A\u0629.";
        },
        rotationBackupRestored: "\u062A\u0645\u062A \u0627\u0644\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0645\u0646 \u0627\u0644\u0646\u0633\u062E\u0629 \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629.",
        rotationBackupRestoreFailed: "\u0641\u0634\u0644\u062A \u0627\u0644\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0645\u0646 \u0627\u0644\u0646\u0633\u062E\u0629 \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629.",
        rotationBackupNone: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0646\u0633\u062E \u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629 \u0645\u062A\u0627\u062D\u0629.",
        rotationBackupGeneration: function(count) {
          return count + " \u062C\u0644\u0633\u0629";
        },
        frontmatterSessionNotFound: function(n) {
          return "\u0627\u0644\u062C\u0644\u0633\u0629 \u201C" + n + "\u201D \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629 (workspace-session)";
        },
        frontmatterAlreadyActive: function(n) {
          return "\u0627\u0644\u062C\u0644\u0633\u0629 \u201C" + n + "\u201D \u0646\u0634\u0637\u0629 \u0628\u0627\u0644\u0641\u0639\u0644";
        }
      },
      pt: {
        settingsStatusBarModScrollSwitch: "Mod + rolagem para trocar de sess\xE3o",
        settingsStatusBarModScrollSwitchDesc: "No item da barra de status, segure a tecla modificadora selecionada e role verticalmente para trocar de sess\xE3o. Usa limiar e intervalo de espera para reduzir acionamentos acidentais do trackpad.",
        modalTitle: "Gerenciar sess\xF5es",
        savePlaceholder: "Nome da nova sess\xE3o...",
        filterPlaceholder: "Filtrar sess\xF5es...",
        settingsShowFilterInput: "Mostrar filtro de sess\xF5es",
        settingsShowFilterInputDesc: "Exibir um filtro de texto no gerenciador de sess\xF5es para encontrar sess\xF5es rapidamente.",
        settingsOverlayDefaultFocus: "Foco padr\xE3o da sobreposi\xE7\xE3o",
        settingsOverlayDefaultFocusDesc: "Escolher qual elemento recebe o foco quando o gerenciador de sess\xF5es \xE9 aberto.",
        settingsOverlayFocusCurrentSession: "Sess\xE3o atual",
        settingsOverlayFocusSessionFilter: "Filtro de sess\xF5es",
        settingsOverlayFocusSessionCreate: "Cria\xE7\xE3o de sess\xE3o",
        settingsSectionSessionManager: "Gerenciador de sess\xF5es",
        settingsShowActiveSwitchCommand: "Mostrar sess\xE3o ativa na paleta de comandos",
        settingsShowActiveSwitchCommandDesc: "Exibe o comando de altern\xE2ncia para a sess\xE3o ativa na paleta de comandos. Os atalhos sempre funcionam independentemente desta configura\xE7\xE3o.",
        settingsNumberedSwitchCommands: "Comandos de altern\xE2ncia numerados",
        settingsNumberedSwitchCommandsDesc: "Registra comandos de altern\xE2ncia com slots numerados (1\u20139) que podem ser vinculados a atalhos. Quando desativado, todas as sess\xF5es usam comandos baseados em nome.",
        save: "Criar",
        load: "Alternar",
        saveInline: "Salvar",
        active: "ATIVO",
        modifiedJustNow: "Modificado agora mesmo",
        modifiedMinutes: function(n) {
          return "Modificado h\xE1 " + n + " minuto" + (n !== 1 ? "s" : "");
        },
        modifiedHours: function(n) {
          return "Modificado h\xE1 " + n + " hora" + (n !== 1 ? "s" : "");
        },
        modifiedDays: function(n) {
          return "Modificado h\xE1 " + n + " dia" + (n !== 1 ? "s" : "");
        },
        duplicateName: "J\xE1 existe uma sess\xE3o com este nome.",
        emptyName: "O nome da sess\xE3o n\xE3o pode estar vazio.",
        created: function(n) {
          return "Sess\xE3o \u201C" + n + "\u201D criada";
        },
        deleted: function(n) {
          return "Sess\xE3o \u201C" + n + "\u201D exclu\xEDda";
        },
        loaded: function(n) {
          return "Alternado para \u201C" + n + "\u201D";
        },
        renamed: function(o, n) {
          return "\u201C" + o + "\u201D renomeado para \u201C" + n + "\u201D";
        },
        confirmDelete: function(n) {
          return "Excluir a sess\xE3o \u201C" + n + "\u201D?";
        },
        confirmDeleteActive: function(n) {
          return "\u201C" + n + "\u201D \xE9 a sess\xE3o ativa. Excluir mesmo assim?";
        },
        confirmSaveSession: function(n) {
          return 'Salvar sess\xE3o "' + n + '"?';
        },
        confirmReloadSession: function(n) {
          return 'Recarregar sess\xE3o "' + n + '"? Altera\xE7\xF5es n\xE3o salvas ser\xE3o perdidas.';
        },
        renameTitle: "Renomear sess\xE3o",
        renamePlaceholder: "Novo nome...",
        noSession: "Nenhuma sess\xE3o",
        cannotDeleteLast: "A \xFAltima sess\xE3o n\xE3o pode ser exclu\xEDda.",
        confirmBulkDelete: function(n) {
          return "Excluir " + n + (n !== 1 ? " sess\xF5es" : " sess\xE3o") + "?";
        },
        bulkDeleted: function(n) {
          return n + (n !== 1 ? " sess\xF5es exclu\xEDdas" : " sess\xE3o exclu\xEDda");
        },
        bulkDelete: function(n) {
          return "Excluir " + n + (n !== 1 ? " sess\xF5es" : " sess\xE3o");
        },
        cmdManage: "Gerenciar sess\xF5es",
        cmdCreate: "Criar nova sess\xE3o",
        cmdRename: "Renomear sess\xE3o atual",
        cmdDelete: "Excluir sess\xE3o atual",
        cmdNewEmpty: "Criar sess\xE3o em branco",
        cmdDuplicate: "Duplicar sess\xE3o atual",
        duplicated: function(n) {
          return "Duplicada como \u201C" + n + "\u201D";
        },
        deselect: "Desmarcar",
        footerDragReorder: "Arrastar para reordenar",
        footerDragToGroup: "Arrastar para aba de grupo para mover",
        defaultLabel: "(padr\xE3o)",
        rename: "Renomear",
        delete: "Excluir",
        remove: "Remover",
        cancel: "Cancelar",
        ribbonTooltip: "Workspace++",
        cmdSwitchTo: function(n, name) {
          return name ? "Alternar para a sess\xE3o " + n + ": " + name : "Alternar para a sess\xE3o " + n;
        },
        cmdSwitchToNamed: function(name) {
          return 'Alternar para "' + name + '"';
        },
        cmdPrevious: "Sess\xE3o anterior",
        cmdNext: "Pr\xF3xima sess\xE3o",
        cmdSaveCurrent: "Salvar sess\xE3o atual",
        cmdSaveAs: "Salvar sess\xE3o atual como...",
        cmdToggleAutoSave: "Alternar salvamento autom\xE1tico ao trocar",
        cmdEnableAutoSave: "Ativar salvamento autom\xE1tico ao trocar",
        cmdDisableAutoSave: "Desativar salvamento autom\xE1tico ao trocar",
        cmdSearchOverlay: "Buscar sess\xF5es",
        switchLeft: "Esquerda",
        switchRight: "Direita",
        switchGroup: "Grupo",
        keyTab: "Tab",
        savedSession: function(n) {
          return "Sess\xE3o \u201C" + n + "\u201D salva";
        },
        savedAs: function(n) {
          return "Salva como \u201C" + n + "\u201D";
        },
        noChanges: "Nenhuma altera\xE7\xE3o para salvar",
        autoSaveEnabled: "Salvamento autom\xE1tico ao trocar ativado.",
        autoSaveDisabled: "Salvamento autom\xE1tico ao trocar desativado.",
        confirmUnsavedSwitch: function(n) {
          return "A sess\xE3o atual tem altera\xE7\xF5es n\xE3o salvas. Alternar para \u201C" + n + "\u201D?";
        },
        saveAndSwitch: "Salvar e alternar",
        switchWithoutSaving: "Alternar sem salvar",
        sessionAutoName: function(n) {
          return "Nova sess\xE3o " + n;
        },
        noFilteredSessions: "Nenhuma sess\xE3o correspondente",
        noGroupSessions: "Nenhuma sess\xE3o neste grupo",
        searchOverlayPlaceholder: "Digite para filtrar sess\xF5es...",
        searchOverlayHelp: "\u2191\u2193 mover  /  Enter alternar  /  \u21E7Enter salvar  /  \u232B excluir  /  Esc fechar",
        backupRestored: "Workspace++: sess\xF5es restauradas a partir do backup.",
        settingsLanguage: "Idioma",
        settingsLanguageDesc: "Idioma da interface. Reinicie o Obsidian para aplicar aos nomes dos comandos.",
        settingsSectionGeneral: "Geral",
        settingsTabSessions: "Sess\xF5es",
        settingsSectionSwitching: "Salvamento autom\xE1tico de sess\xE3o",
        settingsSectionSwitchPreview: "Troca de sess\xE3o",
        settingsSectionDeletion: "Exclus\xE3o de sess\xE3o",
        settingsLangAuto: "Auto (idioma do sistema)",
        settingsTranslationHelp: "Encontrou um erro de tradu\xE7\xE3o? Abra uma issue ou pull request no GitHub.",
        settingsPreviewHeading: "Mostrar sess\xE3o atual antes de alternar",
        settingsPreviewDesc: "Ao alternar sess\xF5es com um atalho, o primeiro pressionamento mostra sua posi\xE7\xE3o atual sem alternar.",
        settingsPreviewNext: "Pr\xF3xima sess\xE3o",
        settingsPreviewPrevious: "Sess\xE3o anterior",
        settingsHotkeys: "Atalhos",
        settingsHotkeysBtn: "Abrir atalhos",
        contextOpenSettings: "Abrir configura\xE7\xF5es",
        contextCustomizeClicks: "Personalizar a\xE7\xF5es de clique",
        settingsSectionStatusBar: "A\xE7\xF5es de clique na barra de status",
        statusBarSlotClick: "Clique",
        statusBarSlotAltClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + Clique";
        },
        statusBarSlotModClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + Clique";
        },
        statusBarSlotShiftClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + Clique";
        },
        statusBarSlotRightClick: "Clique direito",
        statusBarSlotAltRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + Clique direito";
        },
        statusBarSlotModRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + Clique direito";
        },
        statusBarSlotShiftRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + Clique direito";
        },
        statusBarSlotMiddleClick: "Clique do meio",
        statusBarSlotAltMiddleClick: modifiedClickLabel("Clique do meio", "\u2325", "Alt"),
        statusBarSlotModMiddleClick: modifiedClickLabel("Clique do meio", "\u2318", "Ctrl"),
        statusBarSlotShiftMiddleClick: modifiedClickLabel("Clique do meio", "\u21E7", "Shift"),
        statusBarActionNone: "N\xE3o fazer nada",
        statusBarActionQuickSwitcher: "Abrir seletor r\xE1pido",
        statusBarActionSessionManager: "Abrir gerenciador de sess\xF5es",
        statusBarActionSaveSession: "Salvar sess\xE3o",
        statusBarActionReloadWithoutSaving: "Recarregar sem salvar",
        statusBarActionVersionHistory: "Mostrar hist\xF3rico de vers\xF5es",
        statusBarActionRestoreLatestHistory: "Restaurar hist\xF3rico recente",
        statusBarActionSessionMenu: "Menu de sess\xE3o",
        statusBarActionSettingsMenu: "Menu de configura\xE7\xF5es",
        contextResetOverlayPosition: "Redefinir posi\xE7\xE3o e tamanho",
        settingsConfirmDelete: "Confirmar antes de excluir uma sess\xE3o",
        settingsConfirmDeleteDesc: "Exibir uma caixa de confirma\xE7\xE3o antes de excluir uma sess\xE3o.",
        settingsConfirmQuickActions: "Confirmar salvar/recarregar no alternador r\xE1pido",
        settingsConfirmQuickActionsDesc: "Mostrar um di\xE1logo de confirma\xE7\xE3o antes de salvar ou recarregar uma sess\xE3o no alternador r\xE1pido.",
        settingsAutoSaveOnSwitch: "Modo de salvamento autom\xE1tico",
        settingsAutoSaveOnSwitchDesc: "Salva automaticamente a sess\xE3o atual ao trocar (padr\xE3o: ativado). Quando desativado, voc\xEA pode salvar e recarregar sess\xF5es manualmente.",
        settingsWarnUnsavedSwitch: "Avisar antes de trocar sem salvar",
        settingsWarnUnsavedSwitchDesc: "Quando o salvamento autom\xE1tico estiver desativado e a sess\xE3o atual tiver altera\xE7\xF5es n\xE3o salvas, exibe um aviso antes da troca.",
        settingsStatusBarQuickSwitcher: "Troca r\xE1pida ao clicar na barra de status",
        settingsStatusBarQuickSwitcherDesc: "Quando ativado, clicar na barra de status abre o seletor r\xE1pido em vez do gerenciador de sess\xF5es completo.",
        settingsResetSessions: "Redefinir sess\xF5es",
        settingsResetSessionsDesc: "Exclui todas as sess\xF5es salvas e mant\xE9m apenas uma nova sess\xE3o padr\xE3o com base no layout atual.",
        settingsResetSessionsBtn: "Redefinir",
        confirmResetSessions: "Redefinir todas as sess\xF5es para o padr\xE3o? Esta a\xE7\xE3o n\xE3o pode ser desfeita.",
        resetSessionsHint: "Isso remover\xE1 todas as sess\xF5es salvas e manter\xE1 apenas uma sess\xE3o padr\xE3o.",
        resetSessionsDone: "As sess\xF5es foram redefinidas para o padr\xE3o.",
        resetSessionsFailed: "Falha ao redefinir as sess\xF5es.",
        confirmDeleteSettingsHint: "Para desativar esta confirma\xE7\xE3o, v\xE1 para Configura\xE7\xF5es.",
        // --- Groups ---
        groupCreated: function(n) {
          return 'Grupo "' + n + '" criado';
        },
        groupDeleted: function(n) {
          return 'Grupo "' + n + '" exclu\xEDdo';
        },
        groupRenamed: function(o, n) {
          return 'Grupo renomeado: "' + o + '" \u2192 "' + n + '"';
        },
        groupAll: "Todos",
        groupDuplicateName: "J\xE1 existe um grupo com este nome.",
        groupEmptyName: "O nome do grupo n\xE3o pode estar vazio.",
        cmdSwitchGroup: "Trocar de grupo",
        cmdExitGroup: "Mostrar todas as sess\xF5es (sair do grupo)",
        cmdNextGroup: "Pr\xF3ximo grupo",
        cmdPreviousGroup: "Grupo anterior",
        searchOverlayHelpWithGroups: "\u2191\u2193 mover  /  Tab grupo  /  Enter trocar  /  \u21E7Enter salvar  /  \u232B excluir  /  Esc fechar",
        settingsSectionGroups: "Grupos de sess\xF5es",
        contextToggleGroups: "Ativar grupos de sess\xF5es",
        settingsSectionGroupsDesc: "Use grupos para organizar sess\xF5es. Ao desativar, as abas e a\xE7\xF5es de troca de grupo ser\xE3o ocultadas.",
        settingsGroupCreate: "Criar grupo",
        settingsGroupCreateDesc: "Criar um novo grupo de sess\xF5es.",
        settingsGroupCreatePlaceholder: "Nome do grupo...",
        settingsGroupCreateBtn: "Criar",
        settingsGroupManageSessions: "Gerenciar sess\xF5es",
        settingsGroupManageSessionsDesc: "Adicionar ou remover sess\xF5es deste grupo.",
        settingsGroupSessionCount: function(n) {
          return n + (n !== 1 ? " sess\xF5es" : " sess\xE3o");
        },
        settingsGroupDelete: "Excluir grupo",
        settingsGroupDeleteConfirm: function(n) {
          return 'Excluir o grupo "' + n + '"? As sess\xF5es n\xE3o ser\xE3o exclu\xEDdas.';
        },
        confirmDeleteGroup: function(n) {
          return 'Excluir o grupo "' + n + '"? As sess\xF5es do grupo N\xC3O ser\xE3o exclu\xEDdas.';
        },
        groupAddedSession: function(s, g) {
          return '"' + s + '" adicionado a "' + g + '"';
        },
        groupRemovedSession: function(s, g) {
          return '"' + s + '" removido de "' + g + '"';
        },
        groupRemoveFromGroup: "Remover do grupo",
        groupMoveToGroup: "Mover para o grupo",
        groupCreateNew: "Novo grupo",
        groupCreatePlaceholder: "Nome do grupo...",
        groupContextRename: "Renomear grupo",
        groupContextDelete: "Excluir grupo",
        contextSwitchSession: "Alternar para esta sess\xE3o",
        contextRenameSession: "Renomear esta sess\xE3o",
        contextDeleteSession: "Excluir esta sess\xE3o",
        contextDuplicateSession: "Duplicar esta sess\xE3o",
        contextReloadSession: "Recarregar esta sess\xE3o",
        contextSaveSession: "Salvar esta sess\xE3o",
        groupRemoveAllSessions: "Remover todas as sess\xF5es deste grupo",
        confirmRemoveAllFromGroup: function(g, n) {
          return "Remover todas as " + n + ' sess\xF5es de "' + g + '"?';
        },
        groupRemovedAllSessions: function(g) {
          return 'Todas as sess\xF5es removidas de "' + g + '"';
        },
        contextDeleteAllGroups: "Excluir todos os grupos",
        confirmDeleteAllGroups: function(n) {
          return "Excluir todos os " + n + " grupos? As sess\xF5es n\xE3o ser\xE3o exclu\xEDdas.";
        },
        deletedAllGroups: function(n) {
          return n + " grupos exclu\xEDdos";
        },
        contextDeleteAllSessions: "Excluir todas as sess\xF5es",
        confirmDeleteAllSessions: function(n) {
          return "Excluir " + n + " sess\xF5es? A sess\xE3o ativa ser\xE1 mantida.";
        },
        deletedAllSessions: function(n) {
          return n + " sess\xF5es exclu\xEDdas";
        },
        contextVersionHistory: "Hist\xF3rico de vers\xF5es",
        cmdVersionHistory: "Ver hist\xF3rico de vers\xF5es da sess\xE3o",
        historyTitle: "Hist\xF3rico de vers\xF5es",
        historyEmpty: "Sem hist\xF3rico para esta sess\xE3o.",
        historyRestore: "Restaurar",
        historyRestoreConfirm: function(name, time) {
          return 'Restaurar o layout de "' + name + '" de ' + time + "?";
        },
        historyRestored: function(name) {
          return 'Layout de "' + name + '" restaurado';
        },
        historyQuickRestored: function(name) {
          return 'Layout anterior de "' + name + '" restaurado rapidamente';
        },
        historyNoEntries: "Sem layouts anteriores para restaurar.",
        historyToday: "Hoje",
        historyYesterday: "Ontem",
        historyThisWeek: "Esta semana",
        historyFiles: function(n) {
          return n + " arquivo" + (n !== 1 ? "s" : "");
        },
        historyPanes: function(n) {
          return n + " painel" + (n !== 1 ? "s" : "");
        },
        settingsVersionHistoryEnabled: "Ativar hist\xF3rico de vers\xF5es",
        settingsVersionHistoryEnabledDesc: "Manter um hist\xF3rico de altera\xE7\xF5es de layout para cada sess\xE3o.",
        settingsVersionHistoryInterval: "Intervalo de snapshots (minutos)",
        settingsVersionHistoryIntervalDesc: "Com que frequ\xEAncia verificar altera\xE7\xF5es de layout e salvar um snapshot.",
        settingsVersionHistoryCtrlRmb: platformLabel("Restaura\xE7\xE3o r\xE1pida (Cmd + clique direito)", "Restaura\xE7\xE3o r\xE1pida (Ctrl + clique direito)"),
        settingsVersionHistoryCtrlRmbDesc: platformLabel("Clique com o bot\xE3o direito na barra de status segurando Cmd para restaurar o layout anterior.", "Clique com o bot\xE3o direito na barra de status segurando Ctrl para restaurar o layout anterior."),
        settingsVersionHistoryConfirmRestore: "Confirmar antes de restaurar",
        settingsVersionHistoryConfirmRestoreDesc: "Mostrar di\xE1logo de confirma\xE7\xE3o antes de restaurar um layout anterior.",
        rotationBackupSectionTitle: "Backup",
        rotationBackupCreate: "Criar backup",
        rotationBackupCreateBtn: "Criar agora",
        rotationBackupCreated: "Backup criado.",
        rotationBackupFailed: "Falha ao criar backup.",
        rotationBackupDesc: "Backups autom\xE1ticos s\xE3o criados ao salvar (a cada hora, at\xE9 3 gera\xE7\xF5es).",
        rotationBackupRestore: "Restaurar",
        rotationBackupRestoreConfirm: function(time, count) {
          return "Restaurar do backup de " + time + " (" + count + " sess\xE3o" + (count !== 1 ? "\xF5es" : "") + ")? Os dados atuais ser\xE3o sobrescritos.";
        },
        rotationBackupRestored: "Restaurado a partir do backup.",
        rotationBackupRestoreFailed: "Falha ao restaurar a partir do backup.",
        rotationBackupNone: "Nenhum backup dispon\xEDvel.",
        rotationBackupGeneration: function(count) {
          return count + " sess\xE3o" + (count !== 1 ? "\xF5es" : "");
        },
        frontmatterSessionNotFound: function(n) {
          return "Sess\xE3o \u201C" + n + "\u201D n\xE3o encontrada (workspace-session)";
        },
        frontmatterAlreadyActive: function(n) {
          return "A sess\xE3o \u201C" + n + "\u201D j\xE1 est\xE1 ativa";
        }
      },
      ru: {
        settingsStatusBarModScrollSwitch: "Mod + \u043F\u0440\u043E\u043A\u0440\u0443\u0442\u043A\u0430 \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F \u0441\u0435\u0441\u0441\u0438\u0439",
        settingsStatusBarModScrollSwitchDesc: "\u041D\u0430 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0435 \u0441\u0442\u0440\u043E\u043A\u0438 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F \u0443\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0439\u0442\u0435 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u0443\u044E \u043A\u043B\u0430\u0432\u0438\u0448\u0443-\u043C\u043E\u0434\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440 \u0438 \u043F\u0440\u043E\u043A\u0440\u0443\u0447\u0438\u0432\u0430\u0439\u0442\u0435 \u0432\u0435\u0440\u0442\u0438\u043A\u0430\u043B\u044C\u043D\u043E, \u0447\u0442\u043E\u0431\u044B \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0430\u0442\u044C \u0441\u0435\u0441\u0441\u0438\u0438. \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u044E\u0442\u0441\u044F \u043F\u043E\u0440\u043E\u0433 \u0438 \u0437\u0430\u0434\u0435\u0440\u0436\u043A\u0430, \u0447\u0442\u043E\u0431\u044B \u0443\u043C\u0435\u043D\u044C\u0448\u0438\u0442\u044C \u0441\u043B\u0443\u0447\u0430\u0439\u043D\u044B\u0435 \u0441\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u043D\u0438\u044F \u0442\u0440\u0435\u043A\u043F\u0430\u0434\u0430.",
        modalTitle: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0441\u0435\u0441\u0441\u0438\u044F\u043C\u0438",
        savePlaceholder: "\u0418\u043C\u044F \u043D\u043E\u0432\u043E\u0439 \u0441\u0435\u0441\u0441\u0438\u0438...",
        filterPlaceholder: "\u0424\u0438\u043B\u044C\u0442\u0440 \u0441\u0435\u0441\u0441\u0438\u0439...",
        settingsShowFilterInput: "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0444\u0438\u043B\u044C\u0442\u0440 \u0441\u0435\u0441\u0441\u0438\u0439",
        settingsShowFilterInputDesc: "\u041E\u0442\u043E\u0431\u0440\u0430\u0436\u0430\u0442\u044C \u0442\u0435\u043A\u0441\u0442\u043E\u0432\u044B\u0439 \u0444\u0438\u043B\u044C\u0442\u0440 \u0432 \u043C\u0435\u043D\u0435\u0434\u0436\u0435\u0440\u0435 \u0441\u0435\u0441\u0441\u0438\u0439 \u0434\u043B\u044F \u0431\u044B\u0441\u0442\u0440\u043E\u0433\u043E \u043F\u043E\u0438\u0441\u043A\u0430.",
        settingsOverlayDefaultFocus: "\u0424\u043E\u043A\u0443\u0441 \u043D\u0430\u043B\u043E\u0436\u0435\u043D\u0438\u044F \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E",
        settingsOverlayDefaultFocusDesc: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u044D\u043B\u0435\u043C\u0435\u043D\u0442, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u043F\u043E\u043B\u0443\u0447\u0430\u0435\u0442 \u0444\u043E\u043A\u0443\u0441 \u043F\u0440\u0438 \u043E\u0442\u043A\u0440\u044B\u0442\u0438\u0438 \u043C\u0435\u043D\u0435\u0434\u0436\u0435\u0440\u0430 \u0441\u0435\u0441\u0441\u0438\u0439.",
        settingsOverlayFocusCurrentSession: "\u0422\u0435\u043A\u0443\u0449\u0430\u044F \u0441\u0435\u0441\u0441\u0438\u044F",
        settingsOverlayFocusSessionFilter: "\u0424\u0438\u043B\u044C\u0442\u0440 \u0441\u0435\u0441\u0441\u0438\u0439",
        settingsOverlayFocusSessionCreate: "\u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0441\u0435\u0441\u0441\u0438\u0438",
        settingsSectionSessionManager: "\u041C\u0435\u043D\u0435\u0434\u0436\u0435\u0440 \u0441\u0435\u0441\u0441\u0438\u0439",
        settingsShowActiveSwitchCommand: "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0430\u043A\u0442\u0438\u0432\u043D\u0443\u044E \u0441\u0435\u0441\u0441\u0438\u044E \u0432 \u043F\u0430\u043B\u0438\u0442\u0440\u0435 \u043A\u043E\u043C\u0430\u043D\u0434",
        settingsShowActiveSwitchCommandDesc: "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442 \u043A\u043E\u043C\u0430\u043D\u0434\u0443 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F \u043D\u0430 \u0442\u0435\u043A\u0443\u0449\u0443\u044E \u0430\u043A\u0442\u0438\u0432\u043D\u0443\u044E \u0441\u0435\u0441\u0441\u0438\u044E \u0432 \u043F\u0430\u043B\u0438\u0442\u0440\u0435 \u043A\u043E\u043C\u0430\u043D\u0434. \u0413\u043E\u0440\u044F\u0447\u0438\u0435 \u043A\u043B\u0430\u0432\u0438\u0448\u0438 \u0440\u0430\u0431\u043E\u0442\u0430\u044E\u0442 \u043D\u0435\u0437\u0430\u0432\u0438\u0441\u0438\u043C\u043E \u043E\u0442 \u044D\u0442\u043E\u0439 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438.",
        settingsNumberedSwitchCommands: "\u041D\u0443\u043C\u0435\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u044B \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F",
        settingsNumberedSwitchCommandsDesc: "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u0443\u0435\u0442 \u043A\u043E\u043C\u0430\u043D\u0434\u044B \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F \u0441 \u043D\u0443\u043C\u0435\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u043C\u0438 \u0441\u043B\u043E\u0442\u0430\u043C\u0438 (1\u20139), \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u043C\u043E\u0436\u043D\u043E \u043F\u0440\u0438\u0432\u044F\u0437\u0430\u0442\u044C \u043A \u0433\u043E\u0440\u044F\u0447\u0438\u043C \u043A\u043B\u0430\u0432\u0438\u0448\u0430\u043C. \u041F\u0440\u0438 \u043E\u0442\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0438 \u0432\u0441\u0435 \u0441\u0435\u0441\u0441\u0438\u0438 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u044E\u0442 \u043A\u043E\u043C\u0430\u043D\u0434\u044B \u043F\u043E \u0438\u043C\u0435\u043D\u0438.",
        save: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C",
        load: "\u041F\u0435\u0440\u0435\u0439\u0442\u0438",
        saveInline: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C",
        active: "\u0410\u041A\u0422\u0418\u0412\u041D\u041E",
        modifiedJustNow: "\u0422\u043E\u043B\u044C\u043A\u043E \u0447\u0442\u043E \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u043E",
        modifiedMinutes: function(n) {
          return "\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u043E " + n + " " + ruPlural(n, "\u043C\u0438\u043D\u0443\u0442\u0443", "\u043C\u0438\u043D\u0443\u0442\u044B", "\u043C\u0438\u043D\u0443\u0442") + " \u043D\u0430\u0437\u0430\u0434";
        },
        modifiedHours: function(n) {
          return "\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u043E " + n + " " + ruPlural(n, "\u0447\u0430\u0441", "\u0447\u0430\u0441\u0430", "\u0447\u0430\u0441\u043E\u0432") + " \u043D\u0430\u0437\u0430\u0434";
        },
        modifiedDays: function(n) {
          return "\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u043E " + n + " " + ruPlural(n, "\u0434\u0435\u043D\u044C", "\u0434\u043D\u044F", "\u0434\u043D\u0435\u0439") + " \u043D\u0430\u0437\u0430\u0434";
        },
        duplicateName: "\u0421\u0435\u0441\u0441\u0438\u044F \u0441 \u0442\u0430\u043A\u0438\u043C \u0438\u043C\u0435\u043D\u0435\u043C \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442.",
        emptyName: "\u0418\u043C\u044F \u0441\u0435\u0441\u0441\u0438\u0438 \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u043F\u0443\u0441\u0442\u044B\u043C.",
        created: function(n) {
          return "\u0421\u0435\u0441\u0441\u0438\u044F \xAB" + n + "\xBB \u0441\u043E\u0437\u0434\u0430\u043D\u0430";
        },
        deleted: function(n) {
          return "\u0421\u0435\u0441\u0441\u0438\u044F \xAB" + n + "\xBB \u0443\u0434\u0430\u043B\u0435\u043D\u0430";
        },
        loaded: function(n) {
          return "\u041F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u043E \u043D\u0430 \xAB" + n + "\xBB";
        },
        renamed: function(o, n) {
          return "\xAB" + o + "\xBB \u043F\u0435\u0440\u0435\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0430 \u0432 \xAB" + n + "\xBB";
        },
        confirmDelete: function(n) {
          return "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0441\u0435\u0441\u0441\u0438\u044E \xAB" + n + "\xBB?";
        },
        confirmDeleteActive: function(n) {
          return "\xAB" + n + "\xBB \u2014 \u0430\u043A\u0442\u0438\u0432\u043D\u0430\u044F \u0441\u0435\u0441\u0441\u0438\u044F. \u0412\u0441\u0451 \u0440\u0430\u0432\u043D\u043E \u0443\u0434\u0430\u043B\u0438\u0442\u044C?";
        },
        confirmSaveSession: function(n) {
          return '\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0441\u0435\u0441\u0441\u0438\u044E "' + n + '"?';
        },
        confirmReloadSession: function(n) {
          return '\u041F\u0435\u0440\u0435\u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0441\u0435\u0441\u0441\u0438\u044E "' + n + '"? \u041D\u0435\u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u044B\u0435 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u0431\u0443\u0434\u0443\u0442 \u043F\u043E\u0442\u0435\u0440\u044F\u043D\u044B.';
        },
        renameTitle: "\u041F\u0435\u0440\u0435\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u0442\u044C \u0441\u0435\u0441\u0441\u0438\u044E",
        renamePlaceholder: "\u041D\u043E\u0432\u043E\u0435 \u0438\u043C\u044F...",
        noSession: "\u041D\u0435\u0442 \u0441\u0435\u0441\u0441\u0438\u0439",
        cannotDeleteLast: "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u044E\u044E \u0441\u0435\u0441\u0441\u0438\u044E \u043D\u0435\u043B\u044C\u0437\u044F \u0443\u0434\u0430\u043B\u0438\u0442\u044C.",
        confirmBulkDelete: function(n) {
          return "\u0423\u0434\u0430\u043B\u0438\u0442\u044C " + n + " " + ruPlural(n, "\u0441\u0435\u0441\u0441\u0438\u044E", "\u0441\u0435\u0441\u0441\u0438\u0438", "\u0441\u0435\u0441\u0441\u0438\u0439") + "?";
        },
        bulkDeleted: function(n) {
          return n + " " + ruPlural(n, "\u0441\u0435\u0441\u0441\u0438\u044F \u0443\u0434\u0430\u043B\u0435\u043D\u0430", "\u0441\u0435\u0441\u0441\u0438\u0438 \u0443\u0434\u0430\u043B\u0435\u043D\u044B", "\u0441\u0435\u0441\u0441\u0438\u0439 \u0443\u0434\u0430\u043B\u0435\u043D\u043E");
        },
        bulkDelete: function(n) {
          return "\u0423\u0434\u0430\u043B\u0438\u0442\u044C " + n + " " + ruPlural(n, "\u0441\u0435\u0441\u0441\u0438\u044E", "\u0441\u0435\u0441\u0441\u0438\u0438", "\u0441\u0435\u0441\u0441\u0438\u0439");
        },
        cmdManage: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0441\u0435\u0441\u0441\u0438\u044F\u043C\u0438",
        cmdCreate: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043D\u043E\u0432\u0443\u044E \u0441\u0435\u0441\u0441\u0438\u044E",
        cmdRename: "\u041F\u0435\u0440\u0435\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u0442\u044C \u0442\u0435\u043A\u0443\u0449\u0443\u044E \u0441\u0435\u0441\u0441\u0438\u044E",
        cmdDelete: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0442\u0435\u043A\u0443\u0449\u0443\u044E \u0441\u0435\u0441\u0441\u0438\u044E",
        cmdNewEmpty: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u0443\u0441\u0442\u0443\u044E \u0441\u0435\u0441\u0441\u0438\u044E",
        cmdDuplicate: "\u0414\u0443\u0431\u043B\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0442\u0435\u043A\u0443\u0449\u0443\u044E \u0441\u0435\u0441\u0441\u0438\u044E",
        duplicated: function(n) {
          return "\u041F\u0440\u043E\u0434\u0443\u0431\u043B\u0438\u0440\u043E\u0432\u0430\u043D\u043E \u043A\u0430\u043A \xAB" + n + "\xBB";
        },
        deselect: "\u0421\u043D\u044F\u0442\u044C \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435",
        footerDragReorder: "\u041F\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u0434\u043B\u044F \u0441\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u043A\u0438",
        footerDragToGroup: "\u041F\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u043D\u0430 \u0432\u043A\u043B\u0430\u0434\u043A\u0443 \u0433\u0440\u0443\u043F\u043F\u044B \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u043C\u0435\u0449\u0435\u043D\u0438\u044F",
        defaultLabel: "(\u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E)",
        rename: "\u041F\u0435\u0440\u0435\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u0442\u044C",
        delete: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C",
        remove: "\u0423\u0431\u0440\u0430\u0442\u044C",
        cancel: "\u041E\u0442\u043C\u0435\u043D\u0430",
        ribbonTooltip: "Workspace++",
        cmdSwitchTo: function(n, name) {
          return name ? "\u041F\u0435\u0440\u0435\u0439\u0442\u0438 \u043A \u0441\u0435\u0441\u0441\u0438\u0438 " + n + ": " + name : "\u041F\u0435\u0440\u0435\u0439\u0442\u0438 \u043A \u0441\u0435\u0441\u0441\u0438\u0438 " + n;
        },
        cmdSwitchToNamed: function(name) {
          return '\u041F\u0435\u0440\u0435\u0439\u0442\u0438 \u043A "' + name + '"';
        },
        cmdPrevious: "\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0430\u044F \u0441\u0435\u0441\u0441\u0438\u044F",
        cmdNext: "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0430\u044F \u0441\u0435\u0441\u0441\u0438\u044F",
        cmdSaveCurrent: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0442\u0435\u043A\u0443\u0449\u0443\u044E \u0441\u0435\u0441\u0441\u0438\u044E",
        cmdSaveAs: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0442\u0435\u043A\u0443\u0449\u0443\u044E \u0441\u0435\u0441\u0441\u0438\u044E \u043A\u0430\u043A...",
        cmdToggleAutoSave: "\u041F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0430\u0432\u0442\u043E\u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435 \u043F\u0440\u0438 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0438",
        cmdEnableAutoSave: "\u0412\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0430\u0432\u0442\u043E\u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435 \u043F\u0440\u0438 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0438",
        cmdDisableAutoSave: "\u0412\u044B\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0430\u0432\u0442\u043E\u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435 \u043F\u0440\u0438 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0438",
        cmdSearchOverlay: "\u041F\u043E\u0438\u0441\u043A \u0441\u0435\u0441\u0441\u0438\u0439",
        switchLeft: "\u041B\u0435\u0432\u043E",
        switchRight: "\u041F\u0440\u0430\u0432\u043E",
        switchGroup: "\u0413\u0440\u0443\u043F\u043F\u0430",
        keyTab: "Tab",
        savedSession: function(n) {
          return "\u0421\u0435\u0441\u0441\u0438\u044F \xAB" + n + "\xBB \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0430";
        },
        savedAs: function(n) {
          return "\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E \u043A\u0430\u043A \xAB" + n + "\xBB";
        },
        noChanges: "\u041D\u0435\u0442 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0439 \u0434\u043B\u044F \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F",
        autoSaveEnabled: "\u0410\u0432\u0442\u043E\u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435 \u043F\u0440\u0438 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0438 \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u043E.",
        autoSaveDisabled: "\u0410\u0432\u0442\u043E\u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435 \u043F\u0440\u0438 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0438 \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u043E.",
        confirmUnsavedSwitch: function(n) {
          return "\u0412 \u0442\u0435\u043A\u0443\u0449\u0435\u0439 \u0441\u0435\u0441\u0441\u0438\u0438 \u0435\u0441\u0442\u044C \u043D\u0435\u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u044B\u0435 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F. \u041F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438\u0442\u044C\u0441\u044F \u043D\u0430 \xAB" + n + "\xBB?";
        },
        saveAndSwitch: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0438 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438\u0442\u044C\u0441\u044F",
        switchWithoutSaving: "\u041F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438\u0442\u044C\u0441\u044F \u0431\u0435\u0437 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F",
        sessionAutoName: function(n) {
          return "\u041D\u043E\u0432\u0430\u044F \u0441\u0435\u0441\u0441\u0438\u044F " + n;
        },
        noFilteredSessions: "\u041D\u0435\u0442 \u043F\u043E\u0434\u0445\u043E\u0434\u044F\u0449\u0438\u0445 \u0441\u0435\u0441\u0441\u0438\u0439",
        noGroupSessions: "\u041D\u0435\u0442 \u0441\u0435\u0441\u0441\u0438\u0439 \u0432 \u044D\u0442\u043E\u0439 \u0433\u0440\u0443\u043F\u043F\u0435",
        searchOverlayPlaceholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0434\u043B\u044F \u0444\u0438\u043B\u044C\u0442\u0440\u0430\u0446\u0438\u0438 \u0441\u0435\u0441\u0441\u0438\u0439...",
        searchOverlayHelp: "\u2191\u2193 \u043F\u0435\u0440\u0435\u043C\u0435\u0449\u0435\u043D\u0438\u0435  /  Enter \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438\u0442\u044C  /  \u21E7Enter \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C  /  \u232B \u0443\u0434\u0430\u043B\u0438\u0442\u044C  /  Esc \u0437\u0430\u043A\u0440\u044B\u0442\u044C",
        backupRestored: "Workspace++: \u0441\u0435\u0441\u0441\u0438\u0438 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u044B \u0438\u0437 \u0440\u0435\u0437\u0435\u0440\u0432\u043D\u043E\u0439 \u043A\u043E\u043F\u0438\u0438.",
        settingsLanguage: "\u042F\u0437\u044B\u043A",
        settingsLanguageDesc: "\u042F\u0437\u044B\u043A \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430 \u043F\u043B\u0430\u0433\u0438\u043D\u0430. \u041F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0435 Obsidian \u0434\u043B\u044F \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0439 \u043A\u043E\u043C\u0430\u043D\u0434.",
        settingsSectionGeneral: "\u041E\u0431\u0449\u0438\u0435",
        settingsTabSessions: "\u0421\u0435\u0441\u0441\u0438\u0438",
        settingsSectionSwitching: "\u0410\u0432\u0442\u043E\u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435 \u0441\u0435\u0441\u0441\u0438\u0439",
        settingsSectionSwitchPreview: "\u041F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u0441\u0435\u0441\u0441\u0438\u0439",
        settingsSectionDeletion: "\u0423\u0434\u0430\u043B\u0435\u043D\u0438\u0435 \u0441\u0435\u0441\u0441\u0438\u0439",
        settingsLangAuto: "\u0410\u0432\u0442\u043E (\u044F\u0437\u044B\u043A \u0441\u0438\u0441\u0442\u0435\u043C\u044B)",
        settingsTranslationHelp: "\u041D\u0430\u0448\u043B\u0438 \u043E\u0448\u0438\u0431\u043A\u0443 \u0432 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0435? \u0421\u043E\u0437\u0434\u0430\u0439\u0442\u0435 issue \u0438\u043B\u0438 pull request \u043D\u0430 GitHub.",
        settingsPreviewHeading: "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0442\u0435\u043A\u0443\u0449\u0443\u044E \u0441\u0435\u0441\u0441\u0438\u044E \u043F\u0435\u0440\u0435\u0434 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435\u043C",
        settingsPreviewDesc: "\u041F\u0440\u0438 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0438 \u0441\u0435\u0441\u0441\u0438\u0439 \u0433\u043E\u0440\u044F\u0447\u0435\u0439 \u043A\u043B\u0430\u0432\u0438\u0448\u0435\u0439 \u043F\u0435\u0440\u0432\u043E\u0435 \u043D\u0430\u0436\u0430\u0442\u0438\u0435 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442 \u0442\u0435\u043A\u0443\u0449\u0443\u044E \u043F\u043E\u0437\u0438\u0446\u0438\u044E \u0431\u0435\u0437 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F.",
        settingsPreviewNext: "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0430\u044F \u0441\u0435\u0441\u0441\u0438\u044F",
        settingsPreviewPrevious: "\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0430\u044F \u0441\u0435\u0441\u0441\u0438\u044F",
        settingsHotkeys: "\u0413\u043E\u0440\u044F\u0447\u0438\u0435 \u043A\u043B\u0430\u0432\u0438\u0448\u0438",
        settingsHotkeysBtn: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
        contextOpenSettings: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
        contextCustomizeClicks: "\u041D\u0430\u0441\u0442\u0440\u043E\u0438\u0442\u044C \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u043A\u043B\u0438\u043A\u043E\u0432",
        settingsSectionStatusBar: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u043A\u043B\u0438\u043A\u043E\u0432 \u043D\u0430 \u0441\u0442\u0440\u043E\u043A\u0435 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F",
        statusBarSlotClick: "\u041A\u043B\u0438\u043A",
        statusBarSlotAltClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + \u041A\u043B\u0438\u043A";
        },
        statusBarSlotModClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + \u041A\u043B\u0438\u043A";
        },
        statusBarSlotShiftClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + \u041A\u043B\u0438\u043A";
        },
        statusBarSlotRightClick: "\u041F\u0440\u0430\u0432\u044B\u0439 \u043A\u043B\u0438\u043A",
        statusBarSlotAltRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + \u041F\u0440\u0430\u0432\u044B\u0439 \u043A\u043B\u0438\u043A";
        },
        statusBarSlotModRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + \u041F\u0440\u0430\u0432\u044B\u0439 \u043A\u043B\u0438\u043A";
        },
        statusBarSlotShiftRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + \u041F\u0440\u0430\u0432\u044B\u0439 \u043A\u043B\u0438\u043A";
        },
        statusBarSlotMiddleClick: "\u0421\u0440\u0435\u0434\u043D\u0438\u0439 \u043A\u043B\u0438\u043A",
        statusBarSlotAltMiddleClick: modifiedClickLabel("\u0421\u0440\u0435\u0434\u043D\u0438\u0439 \u043A\u043B\u0438\u043A", "\u2325", "Alt"),
        statusBarSlotModMiddleClick: modifiedClickLabel("\u0421\u0440\u0435\u0434\u043D\u0438\u0439 \u043A\u043B\u0438\u043A", "\u2318", "Ctrl"),
        statusBarSlotShiftMiddleClick: modifiedClickLabel("\u0421\u0440\u0435\u0434\u043D\u0438\u0439 \u043A\u043B\u0438\u043A", "\u21E7", "Shift"),
        statusBarActionNone: "\u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0434\u0435\u043B\u0430\u0442\u044C",
        statusBarActionQuickSwitcher: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0431\u044B\u0441\u0442\u0440\u043E\u0435 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435",
        statusBarActionSessionManager: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043C\u0435\u043D\u0435\u0434\u0436\u0435\u0440 \u0441\u0435\u0441\u0441\u0438\u0439",
        statusBarActionSaveSession: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0441\u0435\u0441\u0441\u0438\u044E",
        statusBarActionReloadWithoutSaving: "\u041F\u0435\u0440\u0435\u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0431\u0435\u0437 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F",
        statusBarActionVersionHistory: "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0438\u0441\u0442\u043E\u0440\u0438\u044E \u0432\u0435\u0440\u0441\u0438\u0439",
        statusBarActionRestoreLatestHistory: "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u044E\u044E \u0432\u0435\u0440\u0441\u0438\u044E",
        statusBarActionSessionMenu: "\u041C\u0435\u043D\u044E \u0441\u0435\u0441\u0441\u0438\u0438",
        statusBarActionSettingsMenu: "\u041C\u0435\u043D\u044E \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A",
        contextResetOverlayPosition: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u043F\u043E\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0438 \u0440\u0430\u0437\u043C\u0435\u0440",
        settingsConfirmDelete: "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0430\u0442\u044C \u043F\u0435\u0440\u0435\u0434 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0435\u043C \u0441\u0435\u0441\u0441\u0438\u0438",
        settingsConfirmDeleteDesc: "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u0434\u0438\u0430\u043B\u043E\u0433 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F \u043F\u0435\u0440\u0435\u0434 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0435\u043C \u0441\u0435\u0441\u0441\u0438\u0438.",
        settingsConfirmQuickActions: "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F/\u043F\u0435\u0440\u0435\u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0432 \u0431\u044B\u0441\u0442\u0440\u043E\u043C \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0430\u0442\u0435\u043B\u0435",
        settingsConfirmQuickActionsDesc: "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u0434\u0438\u0430\u043B\u043E\u0433 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F \u043F\u0435\u0440\u0435\u0434 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435\u043C \u0438\u043B\u0438 \u043F\u0435\u0440\u0435\u0437\u0430\u0433\u0440\u0443\u0437\u043A\u043E\u0439 \u0441\u0435\u0441\u0441\u0438\u0438 \u0438\u0437 \u0431\u044B\u0441\u0442\u0440\u043E\u0433\u043E \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0430\u0442\u0435\u043B\u044F.",
        settingsAutoSaveOnSwitch: "\u0420\u0435\u0436\u0438\u043C \u0430\u0432\u0442\u043E\u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F",
        settingsAutoSaveOnSwitchDesc: "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0435\u0442 \u0442\u0435\u043A\u0443\u0449\u0443\u044E \u0441\u0435\u0441\u0441\u0438\u044E \u043F\u0440\u0438 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0438 (\u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E: \u0432\u043A\u043B.). \u041F\u0440\u0438 \u043E\u0442\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0438 \u043C\u043E\u0436\u043D\u043E \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0442\u044C \u0438 \u043F\u0435\u0440\u0435\u0437\u0430\u0433\u0440\u0443\u0436\u0430\u0442\u044C \u0441\u0435\u0441\u0441\u0438\u0438 \u0432\u0440\u0443\u0447\u043D\u0443\u044E.",
        settingsWarnUnsavedSwitch: "\u041F\u0440\u0435\u0434\u0443\u043F\u0440\u0435\u0436\u0434\u0430\u0442\u044C \u043F\u0435\u0440\u0435\u0434 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435\u043C \u0431\u0435\u0437 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F",
        settingsWarnUnsavedSwitchDesc: "\u0415\u0441\u043B\u0438 \u0430\u0432\u0442\u043E\u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435 \u043E\u0442\u043A\u043B\u044E\u0447\u0435\u043D\u043E \u0438 \u0432 \u0442\u0435\u043A\u0443\u0449\u0435\u0439 \u0441\u0435\u0441\u0441\u0438\u0438 \u0435\u0441\u0442\u044C \u043D\u0435\u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u044B\u0435 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F, \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u043F\u0440\u0435\u0434\u0443\u043F\u0440\u0435\u0436\u0434\u0435\u043D\u0438\u0435 \u043F\u0435\u0440\u0435\u0434 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435\u043C.",
        settingsStatusBarQuickSwitcher: "\u0411\u044B\u0441\u0442\u0440\u043E\u0435 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u043F\u043E \u043A\u043B\u0438\u043A\u0443 \u043D\u0430 \u0441\u0442\u0440\u043E\u043A\u0435 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F",
        settingsStatusBarQuickSwitcherDesc: "\u041F\u0440\u0438 \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0438 \u043A\u043B\u0438\u043A \u043F\u043E \u0441\u0442\u0440\u043E\u043A\u0435 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442 \u0431\u044B\u0441\u0442\u0440\u044B\u0439 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0430\u0442\u0435\u043B\u044C \u0432\u043C\u0435\u0441\u0442\u043E \u043F\u043E\u043B\u043D\u043E\u0433\u043E \u043C\u0435\u043D\u0435\u0434\u0436\u0435\u0440\u0430 \u0441\u0435\u0441\u0441\u0438\u0439.",
        settingsResetSessions: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0441\u0435\u0441\u0441\u0438\u0438",
        settingsResetSessionsDesc: "\u0423\u0434\u0430\u043B\u044F\u0435\u0442 \u0432\u0441\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u044B\u0435 \u0441\u0435\u0441\u0441\u0438\u0438 \u0438 \u043E\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u043D\u043E\u0432\u0443\u044E \u0441\u0435\u0441\u0441\u0438\u044E \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E \u043D\u0430 \u043E\u0441\u043D\u043E\u0432\u0435 \u0442\u0435\u043A\u0443\u0449\u0435\u0433\u043E \u043C\u0430\u043A\u0435\u0442\u0430.",
        settingsResetSessionsBtn: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C",
        confirmResetSessions: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0432\u0441\u0435 \u0441\u0435\u0441\u0441\u0438\u0438 \u043A \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044E \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E? \u042D\u0442\u043E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u043D\u0435\u043B\u044C\u0437\u044F \u043E\u0442\u043C\u0435\u043D\u0438\u0442\u044C.",
        resetSessionsHint: "\u042D\u0442\u043E \u0443\u0434\u0430\u043B\u0438\u0442 \u0432\u0441\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u044B\u0435 \u0441\u0435\u0441\u0441\u0438\u0438 \u0438 \u043E\u0441\u0442\u0430\u0432\u0438\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u043E\u0434\u043D\u0443 \u0441\u0435\u0441\u0441\u0438\u044E \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E.",
        resetSessionsDone: "\u0421\u0435\u0441\u0441\u0438\u0438 \u0441\u0431\u0440\u043E\u0448\u0435\u043D\u044B \u043A \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044E \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E.",
        resetSessionsFailed: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0441\u0435\u0441\u0441\u0438\u0438.",
        confirmDeleteSettingsHint: "\u0427\u0442\u043E\u0431\u044B \u043E\u0442\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u044D\u0442\u043E \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435, \u043F\u0435\u0440\u0435\u0439\u0434\u0438\u0442\u0435 \u0432 \u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438.",
        // --- Groups ---
        groupCreated: function(n) {
          return "\u0413\u0440\u0443\u043F\u043F\u0430 \xAB" + n + "\xBB \u0441\u043E\u0437\u0434\u0430\u043D\u0430";
        },
        groupDeleted: function(n) {
          return "\u0413\u0440\u0443\u043F\u043F\u0430 \xAB" + n + "\xBB \u0443\u0434\u0430\u043B\u0435\u043D\u0430";
        },
        groupRenamed: function(o, n) {
          return "\u0413\u0440\u0443\u043F\u043F\u0430 \u043F\u0435\u0440\u0435\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0430: \xAB" + o + "\xBB \u2192 \xAB" + n + "\xBB";
        },
        groupAll: "\u0412\u0441\u0435",
        groupDuplicateName: "\u0413\u0440\u0443\u043F\u043F\u0430 \u0441 \u0442\u0430\u043A\u0438\u043C \u0438\u043C\u0435\u043D\u0435\u043C \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442.",
        groupEmptyName: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0433\u0440\u0443\u043F\u043F\u044B \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u043F\u0443\u0441\u0442\u044B\u043C.",
        cmdSwitchGroup: "\u041F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0433\u0440\u0443\u043F\u043F\u0443",
        cmdExitGroup: "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0432\u0441\u0435 \u0441\u0435\u0441\u0441\u0438\u0438 (\u0432\u044B\u0439\u0442\u0438 \u0438\u0437 \u0433\u0440\u0443\u043F\u043F\u044B)",
        cmdNextGroup: "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0430\u044F \u0433\u0440\u0443\u043F\u043F\u0430",
        cmdPreviousGroup: "\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0430\u044F \u0433\u0440\u0443\u043F\u043F\u0430",
        searchOverlayHelpWithGroups: "\u2191\u2193 \u043D\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044F  /  Tab \u0433\u0440\u0443\u043F\u043F\u0430  /  Enter \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438\u0442\u044C  /  \u21E7Enter \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C  /  \u232B \u0443\u0434\u0430\u043B\u0438\u0442\u044C  /  Esc \u0437\u0430\u043A\u0440\u044B\u0442\u044C",
        settingsSectionGroups: "\u0413\u0440\u0443\u043F\u043F\u044B \u0441\u0435\u0441\u0441\u0438\u0439",
        contextToggleGroups: "\u0412\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0433\u0440\u0443\u043F\u043F\u044B \u0441\u0435\u0441\u0441\u0438\u0439",
        settingsSectionGroupsDesc: "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 \u0433\u0440\u0443\u043F\u043F\u044B \u0434\u043B\u044F \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438 \u0441\u0435\u0441\u0441\u0438\u0439. \u041F\u0440\u0438 \u043E\u0442\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0438 \u0432\u043A\u043B\u0430\u0434\u043A\u0438 \u0438 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F \u0433\u0440\u0443\u043F\u043F \u0431\u0443\u0434\u0443\u0442 \u0441\u043A\u0440\u044B\u0442\u044B.",
        settingsGroupCreate: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0433\u0440\u0443\u043F\u043F\u0443",
        settingsGroupCreateDesc: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043D\u043E\u0432\u0443\u044E \u0433\u0440\u0443\u043F\u043F\u0443 \u0441\u0435\u0441\u0441\u0438\u0439.",
        settingsGroupCreatePlaceholder: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0433\u0440\u0443\u043F\u043F\u044B...",
        settingsGroupCreateBtn: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C",
        settingsGroupManageSessions: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0441\u0435\u0441\u0441\u0438\u044F\u043C\u0438",
        settingsGroupManageSessionsDesc: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0438\u043B\u0438 \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u0441\u0435\u0441\u0441\u0438\u0438 \u0438\u0437 \u044D\u0442\u043E\u0439 \u0433\u0440\u0443\u043F\u043F\u044B.",
        settingsGroupSessionCount: function(n) {
          return n + " " + ruPlural(n, "\u0441\u0435\u0441\u0441\u0438\u044F", "\u0441\u0435\u0441\u0441\u0438\u0438", "\u0441\u0435\u0441\u0441\u0438\u0439");
        },
        settingsGroupDelete: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0433\u0440\u0443\u043F\u043F\u0443",
        settingsGroupDeleteConfirm: function(n) {
          return "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0433\u0440\u0443\u043F\u043F\u0443 \xAB" + n + "\xBB? \u0421\u0435\u0441\u0441\u0438\u0438 \u043D\u0435 \u0431\u0443\u0434\u0443\u0442 \u0443\u0434\u0430\u043B\u0435\u043D\u044B.";
        },
        confirmDeleteGroup: function(n) {
          return "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0433\u0440\u0443\u043F\u043F\u0443 \xAB" + n + "\xBB? \u0421\u0435\u0441\u0441\u0438\u0438 \u0432\u043D\u0443\u0442\u0440\u0438 \u0433\u0440\u0443\u043F\u043F\u044B \u041D\u0415 \u0431\u0443\u0434\u0443\u0442 \u0443\u0434\u0430\u043B\u0435\u043D\u044B.";
        },
        groupAddedSession: function(s, g) {
          return "\xAB" + s + "\xBB \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0430 \u0432 \xAB" + g + "\xBB";
        },
        groupRemovedSession: function(s, g) {
          return "\xAB" + s + "\xBB \u0443\u0434\u0430\u043B\u0435\u043D\u0430 \u0438\u0437 \xAB" + g + "\xBB";
        },
        groupRemoveFromGroup: "\u0423\u0431\u0440\u0430\u0442\u044C \u0438\u0437 \u0433\u0440\u0443\u043F\u043F\u044B",
        groupMoveToGroup: "\u041F\u0435\u0440\u0435\u043C\u0435\u0441\u0442\u0438\u0442\u044C \u0432 \u0433\u0440\u0443\u043F\u043F\u0443",
        groupCreateNew: "\u041D\u043E\u0432\u0430\u044F \u0433\u0440\u0443\u043F\u043F\u0430",
        groupCreatePlaceholder: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0433\u0440\u0443\u043F\u043F\u044B...",
        groupContextRename: "\u041F\u0435\u0440\u0435\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u0442\u044C \u0433\u0440\u0443\u043F\u043F\u0443",
        groupContextDelete: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0433\u0440\u0443\u043F\u043F\u0443",
        contextSwitchSession: "\u041F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438\u0442\u044C\u0441\u044F \u043D\u0430 \u044D\u0442\u0443 \u0441\u0435\u0441\u0441\u0438\u044E",
        contextRenameSession: "\u041F\u0435\u0440\u0435\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u0442\u044C \u044D\u0442\u0443 \u0441\u0435\u0441\u0441\u0438\u044E",
        contextDeleteSession: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u044D\u0442\u0443 \u0441\u0435\u0441\u0441\u0438\u044E",
        contextDuplicateSession: "\u0414\u0443\u0431\u043B\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u044D\u0442\u0443 \u0441\u0435\u0441\u0441\u0438\u044E",
        contextReloadSession: "\u041F\u0435\u0440\u0435\u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u044D\u0442\u0443 \u0441\u0435\u0441\u0441\u0438\u044E",
        contextSaveSession: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u044D\u0442\u0443 \u0441\u0435\u0441\u0441\u0438\u044E",
        groupRemoveAllSessions: "\u0423\u0431\u0440\u0430\u0442\u044C \u0432\u0441\u0435 \u0441\u0435\u0441\u0441\u0438\u0438 \u0438\u0437 \u044D\u0442\u043E\u0439 \u0433\u0440\u0443\u043F\u043F\u044B",
        confirmRemoveAllFromGroup: function(g, n) {
          return "\u0423\u0431\u0440\u0430\u0442\u044C \u0432\u0441\u0435 " + n + " " + ruPlural(n, "\u0441\u0435\u0441\u0441\u0438\u044E", "\u0441\u0435\u0441\u0441\u0438\u0438", "\u0441\u0435\u0441\u0441\u0438\u0439") + " \u0438\u0437 \xAB" + g + "\xBB?";
        },
        groupRemovedAllSessions: function(g) {
          return "\u0412\u0441\u0435 \u0441\u0435\u0441\u0441\u0438\u0438 \u0443\u0431\u0440\u0430\u043D\u044B \u0438\u0437 \xAB" + g + "\xBB";
        },
        contextDeleteAllGroups: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0432\u0441\u0435 \u0433\u0440\u0443\u043F\u043F\u044B",
        confirmDeleteAllGroups: function(n) {
          return "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0432\u0441\u0435 " + n + " " + ruPlural(n, "\u0433\u0440\u0443\u043F\u043F\u0443", "\u0433\u0440\u0443\u043F\u043F\u044B", "\u0433\u0440\u0443\u043F\u043F") + "? \u0421\u0435\u0441\u0441\u0438\u0438 \u043D\u0435 \u0431\u0443\u0434\u0443\u0442 \u0443\u0434\u0430\u043B\u0435\u043D\u044B.";
        },
        deletedAllGroups: function(n) {
          return n + " " + ruPlural(n, "\u0433\u0440\u0443\u043F\u043F\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0430", "\u0433\u0440\u0443\u043F\u043F\u044B \u0443\u0434\u0430\u043B\u0435\u043D\u044B", "\u0433\u0440\u0443\u043F\u043F \u0443\u0434\u0430\u043B\u0435\u043D\u043E");
        },
        contextDeleteAllSessions: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0432\u0441\u0435 \u0441\u0435\u0441\u0441\u0438\u0438",
        confirmDeleteAllSessions: function(n) {
          return "\u0423\u0434\u0430\u043B\u0438\u0442\u044C " + n + " " + ruPlural(n, "\u0441\u0435\u0441\u0441\u0438\u044E", "\u0441\u0435\u0441\u0441\u0438\u0438", "\u0441\u0435\u0441\u0441\u0438\u0439") + "? \u0410\u043A\u0442\u0438\u0432\u043D\u0430\u044F \u0441\u0435\u0441\u0441\u0438\u044F \u0431\u0443\u0434\u0435\u0442 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0430.";
        },
        deletedAllSessions: function(n) {
          return n + " " + ruPlural(n, "\u0441\u0435\u0441\u0441\u0438\u044F \u0443\u0434\u0430\u043B\u0435\u043D\u0430", "\u0441\u0435\u0441\u0441\u0438\u0438 \u0443\u0434\u0430\u043B\u0435\u043D\u044B", "\u0441\u0435\u0441\u0441\u0438\u0439 \u0443\u0434\u0430\u043B\u0435\u043D\u043E");
        },
        contextVersionHistory: "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u0432\u0435\u0440\u0441\u0438\u0439",
        cmdVersionHistory: "\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u0438\u0441\u0442\u043E\u0440\u0438\u0438 \u0432\u0435\u0440\u0441\u0438\u0439 \u0441\u0435\u0441\u0441\u0438\u0438",
        historyTitle: "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u0432\u0435\u0440\u0441\u0438\u0439",
        historyEmpty: "\u041D\u0435\u0442 \u0438\u0441\u0442\u043E\u0440\u0438\u0438 \u0432\u0435\u0440\u0441\u0438\u0439 \u0434\u043B\u044F \u044D\u0442\u043E\u0439 \u0441\u0435\u0441\u0441\u0438\u0438.",
        historyRestore: "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C",
        historyRestoreConfirm: function(name, time) {
          return "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u043C\u0430\u043A\u0435\u0442 \xAB" + name + "\xBB \u043E\u0442 " + time + "?";
        },
        historyRestored: function(name) {
          return "\u041C\u0430\u043A\u0435\u0442 \xAB" + name + "\xBB \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D";
        },
        historyQuickRestored: function(name) {
          return "\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0438\u0439 \u043C\u0430\u043A\u0435\u0442 \xAB" + name + "\xBB \u0431\u044B\u0441\u0442\u0440\u043E \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D";
        },
        historyNoEntries: "\u041D\u0435\u0442 \u043F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0438\u0445 \u043C\u0430\u043A\u0435\u0442\u043E\u0432 \u0434\u043B\u044F \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F.",
        historyToday: "\u0421\u0435\u0433\u043E\u0434\u043D\u044F",
        historyYesterday: "\u0412\u0447\u0435\u0440\u0430",
        historyThisWeek: "\u041D\u0430 \u044D\u0442\u043E\u0439 \u043D\u0435\u0434\u0435\u043B\u0435",
        historyFiles: function(n) {
          return n + " \u0444\u0430\u0439\u043B" + ruPlural(n, "", "\u0430", "\u043E\u0432");
        },
        historyPanes: function(n) {
          return n + " \u043F\u0430\u043D\u0435\u043B" + ruPlural(n, "\u044C", "\u0438", "\u0435\u0439");
        },
        settingsVersionHistoryEnabled: "\u0412\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0438\u0441\u0442\u043E\u0440\u0438\u044E \u0432\u0435\u0440\u0441\u0438\u0439",
        settingsVersionHistoryEnabledDesc: "\u0421\u043E\u0445\u0440\u0430\u043D\u044F\u0442\u044C \u0438\u0441\u0442\u043E\u0440\u0438\u044E \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0439 \u043C\u0430\u043A\u0435\u0442\u0430 \u0434\u043B\u044F \u043A\u0430\u0436\u0434\u043E\u0439 \u0441\u0435\u0441\u0441\u0438\u0438.",
        settingsVersionHistoryInterval: "\u0418\u043D\u0442\u0435\u0440\u0432\u0430\u043B \u0441\u043D\u0438\u043C\u043A\u043E\u0432 (\u043C\u0438\u043D\u0443\u0442\u044B)",
        settingsVersionHistoryIntervalDesc: "\u041A\u0430\u043A \u0447\u0430\u0441\u0442\u043E \u043F\u0440\u043E\u0432\u0435\u0440\u044F\u0442\u044C \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u043C\u0430\u043A\u0435\u0442\u0430 \u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0442\u044C \u0441\u043D\u0438\u043C\u043E\u043A.",
        settingsVersionHistoryCtrlRmb: platformLabel("\u0411\u044B\u0441\u0442\u0440\u043E\u0435 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435 (Cmd + \u043F\u0440\u0430\u0432\u044B\u0439 \u043A\u043B\u0438\u043A)", "\u0411\u044B\u0441\u0442\u0440\u043E\u0435 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435 (Ctrl + \u043F\u0440\u0430\u0432\u044B\u0439 \u043A\u043B\u0438\u043A)"),
        settingsVersionHistoryCtrlRmbDesc: platformLabel("\u0429\u0451\u043B\u043A\u043D\u0438\u0442\u0435 \u043F\u0440\u0430\u0432\u043E\u0439 \u043A\u043D\u043E\u043F\u043A\u043E\u0439 \u043C\u044B\u0448\u0438 \u043F\u043E \u0441\u0442\u0440\u043E\u043A\u0435 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F, \u0443\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u044F Cmd, \u0434\u043B\u044F \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u043F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0435\u0433\u043E \u043C\u0430\u043A\u0435\u0442\u0430.", "\u0429\u0451\u043B\u043A\u043D\u0438\u0442\u0435 \u043F\u0440\u0430\u0432\u043E\u0439 \u043A\u043D\u043E\u043F\u043A\u043E\u0439 \u043C\u044B\u0448\u0438 \u043F\u043E \u0441\u0442\u0440\u043E\u043A\u0435 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F, \u0443\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u044F Ctrl, \u0434\u043B\u044F \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u043F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0435\u0433\u043E \u043C\u0430\u043A\u0435\u0442\u0430."),
        settingsVersionHistoryConfirmRestore: "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0430\u0442\u044C \u043F\u0435\u0440\u0435\u0434 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435\u043C",
        settingsVersionHistoryConfirmRestoreDesc: "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u0434\u0438\u0430\u043B\u043E\u0433 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F \u043F\u0435\u0440\u0435\u0434 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435\u043C \u043C\u0430\u043A\u0435\u0442\u0430.",
        rotationBackupSectionTitle: "\u0420\u0435\u0437\u0435\u0440\u0432\u043D\u043E\u0435 \u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435",
        rotationBackupCreate: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0440\u0435\u0437\u0435\u0440\u0432\u043D\u0443\u044E \u043A\u043E\u043F\u0438\u044E",
        rotationBackupCreateBtn: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0441\u0435\u0439\u0447\u0430\u0441",
        rotationBackupCreated: "\u0420\u0435\u0437\u0435\u0440\u0432\u043D\u0430\u044F \u043A\u043E\u043F\u0438\u044F \u0441\u043E\u0437\u0434\u0430\u043D\u0430.",
        rotationBackupFailed: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u0440\u0435\u0437\u0435\u0440\u0432\u043D\u0443\u044E \u043A\u043E\u043F\u0438\u044E.",
        rotationBackupDesc: "\u0420\u0435\u0437\u0435\u0440\u0432\u043D\u044B\u0435 \u043A\u043E\u043F\u0438\u0438 \u0441\u043E\u0437\u0434\u0430\u044E\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u043F\u0440\u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0438 (\u043A\u0430\u0436\u0434\u044B\u0439 \u0447\u0430\u0441, \u0434\u043E 3 \u043F\u043E\u043A\u043E\u043B\u0435\u043D\u0438\u0439).",
        rotationBackupRestore: "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C",
        rotationBackupRestoreConfirm: function(time, count) {
          return "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0438\u0437 \u0440\u0435\u0437\u0435\u0440\u0432\u043D\u043E\u0439 \u043A\u043E\u043F\u0438\u0438 \u043E\u0442 " + time + " (" + count + " \u0441\u0435\u0430\u043D\u0441" + (count === 1 ? "" : "\u043E\u0432") + ")? \u0422\u0435\u043A\u0443\u0449\u0438\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u0431\u0443\u0434\u0443\u0442 \u043F\u0435\u0440\u0435\u0437\u0430\u043F\u0438\u0441\u0430\u043D\u044B.";
        },
        rotationBackupRestored: "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E \u0438\u0437 \u0440\u0435\u0437\u0435\u0440\u0432\u043D\u043E\u0439 \u043A\u043E\u043F\u0438\u0438.",
        rotationBackupRestoreFailed: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0438\u0437 \u0440\u0435\u0437\u0435\u0440\u0432\u043D\u043E\u0439 \u043A\u043E\u043F\u0438\u0438.",
        rotationBackupNone: "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0445 \u0440\u0435\u0437\u0435\u0440\u0432\u043D\u044B\u0445 \u043A\u043E\u043F\u0438\u0439.",
        rotationBackupGeneration: function(count) {
          return count + " \u0441\u0435\u0430\u043D\u0441" + (count === 1 ? "" : "\u043E\u0432");
        },
        frontmatterSessionNotFound: function(n) {
          return "\u0421\u0435\u0430\u043D\u0441 \xAB" + n + "\xBB \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D (workspace-session)";
        },
        frontmatterAlreadyActive: function(n) {
          return "\u0421\u0435\u0430\u043D\u0441 \xAB" + n + "\xBB \u0443\u0436\u0435 \u0430\u043A\u0442\u0438\u0432\u0435\u043D";
        }
      },
      de: {
        settingsStatusBarModScrollSwitch: "Mit Mod + Scroll zwischen Sitzungen wechseln",
        settingsStatusBarModScrollSwitchDesc: "Auf dem Statusleisten-Eintrag die ausgew\xE4hlte Modifikatortaste gedr\xFCckt halten und vertikal scrollen, um zwischen Sitzungen zu wechseln. Nutzt Schwelle und Abklingzeit, um versehentliche Trackpad-Ausl\xF6ser zu reduzieren.",
        modalTitle: "Sitzungen verwalten",
        savePlaceholder: "Neuer Sitzungsname...",
        filterPlaceholder: "Sitzungen filtern...",
        settingsShowFilterInput: "Sitzungsfilter anzeigen",
        settingsShowFilterInputDesc: "Einen Textfilter im Sitzungsmanager anzeigen, um Sitzungen schnell zu finden.",
        settingsOverlayDefaultFocus: "Standard-Overlay-Fokus",
        settingsOverlayDefaultFocusDesc: "W\xE4hlen Sie, welches Element den Fokus erh\xE4lt, wenn der Sitzungsmanager ge\xF6ffnet wird.",
        settingsOverlayFocusCurrentSession: "Aktuelle Sitzung",
        settingsOverlayFocusSessionFilter: "Sitzungsfilter",
        settingsOverlayFocusSessionCreate: "Sitzung erstellen",
        settingsSectionSessionManager: "Sitzungsmanager",
        settingsShowActiveSwitchCommand: "Aktive Sitzung in Befehlspalette anzeigen",
        settingsShowActiveSwitchCommandDesc: "Zeigt den Wechselbefehl f\xFCr die aktive Sitzung in der Befehlspalette an. Tastenkombinationen funktionieren unabh\xE4ngig von dieser Einstellung.",
        settingsNumberedSwitchCommands: "Nummerierte Wechselbefehle",
        settingsNumberedSwitchCommandsDesc: "Registriert Wechselbefehle mit nummerierten Pl\xE4tzen (1\u20139), die mit Tastenkombinationen belegt werden k\xF6nnen. Bei Deaktivierung verwenden alle Sitzungen namensbasierte Befehle.",
        save: "Erstellen",
        load: "Wechseln",
        saveInline: "Speichern",
        active: "AKTIV",
        modifiedJustNow: "Gerade eben ge\xE4ndert",
        modifiedMinutes: function(n) {
          return "Vor " + n + " Minute" + (n !== 1 ? "n" : "") + " ge\xE4ndert";
        },
        modifiedHours: function(n) {
          return "Vor " + n + " Stunde" + (n !== 1 ? "n" : "") + " ge\xE4ndert";
        },
        modifiedDays: function(n) {
          return "Vor " + n + " Tag" + (n !== 1 ? "en" : "") + " ge\xE4ndert";
        },
        duplicateName: "Eine Sitzung mit diesem Namen existiert bereits.",
        emptyName: "Der Sitzungsname darf nicht leer sein.",
        created: function(n) {
          return "Sitzung \u201E" + n + "\u201C erstellt";
        },
        deleted: function(n) {
          return "Sitzung \u201E" + n + "\u201C gel\xF6scht";
        },
        loaded: function(n) {
          return "Gewechselt zu \u201E" + n + "\u201C";
        },
        renamed: function(o, n) {
          return "\u201E" + o + "\u201C umbenannt in \u201E" + n + "\u201C";
        },
        confirmDelete: function(n) {
          return "Sitzung \u201E" + n + "\u201C l\xF6schen?";
        },
        confirmDeleteActive: function(n) {
          return "\u201E" + n + "\u201C ist die aktive Sitzung. Trotzdem l\xF6schen?";
        },
        confirmSaveSession: function(n) {
          return 'Sitzung "' + n + '" speichern?';
        },
        confirmReloadSession: function(n) {
          return 'Sitzung "' + n + '" neu laden? Nicht gespeicherte \xC4nderungen gehen verloren.';
        },
        renameTitle: "Sitzung umbenennen",
        renamePlaceholder: "Neuer Name...",
        noSession: "Keine Sitzung",
        cannotDeleteLast: "Die letzte Sitzung kann nicht gel\xF6scht werden.",
        confirmBulkDelete: function(n) {
          return n + " Sitzung" + (n !== 1 ? "en" : "") + " l\xF6schen?";
        },
        bulkDeleted: function(n) {
          return n + " Sitzung" + (n !== 1 ? "en" : "") + " gel\xF6scht";
        },
        bulkDelete: function(n) {
          return n + " Sitzung" + (n !== 1 ? "en" : "") + " l\xF6schen";
        },
        cmdManage: "Sitzungen verwalten",
        cmdCreate: "Neue Sitzung erstellen",
        cmdRename: "Aktuelle Sitzung umbenennen",
        cmdDelete: "Aktuelle Sitzung l\xF6schen",
        cmdNewEmpty: "Leere Sitzung erstellen",
        cmdDuplicate: "Aktuelle Sitzung duplizieren",
        duplicated: function(n) {
          return "Dupliziert als \u201E" + n + "\u201C";
        },
        deselect: "Auswahl aufheben",
        footerDragReorder: "Ziehen zum Neuordnen",
        footerDragToGroup: "Auf Gruppen-Tab ziehen zum Verschieben",
        defaultLabel: "(Standard)",
        rename: "Umbenennen",
        delete: "L\xF6schen",
        remove: "Entfernen",
        cancel: "Abbrechen",
        ribbonTooltip: "Workspace++",
        cmdSwitchTo: function(n, name) {
          return name ? "Zu Sitzung " + n + " wechseln: " + name : "Zu Sitzung " + n + " wechseln";
        },
        cmdSwitchToNamed: function(name) {
          return 'Zu "' + name + '" wechseln';
        },
        cmdPrevious: "Vorherige Sitzung",
        cmdNext: "N\xE4chste Sitzung",
        cmdSaveCurrent: "Aktuelle Sitzung speichern",
        cmdSaveAs: "Aktuelle Sitzung speichern als...",
        cmdToggleAutoSave: "Automatisches Speichern beim Wechsel umschalten",
        cmdEnableAutoSave: "Automatisches Speichern beim Wechsel aktivieren",
        cmdDisableAutoSave: "Automatisches Speichern beim Wechsel deaktivieren",
        cmdSearchOverlay: "Sitzungen suchen",
        switchLeft: "Links",
        switchRight: "Rechts",
        switchGroup: "Gruppe",
        keyTab: "Tab",
        savedSession: function(n) {
          return "Sitzung \u201E" + n + "\u201C gespeichert";
        },
        savedAs: function(n) {
          return "Gespeichert als \u201E" + n + "\u201C";
        },
        noChanges: "Keine \xC4nderungen zu speichern",
        autoSaveEnabled: "Automatisches Speichern beim Wechsel aktiviert.",
        autoSaveDisabled: "Automatisches Speichern beim Wechsel deaktiviert.",
        confirmUnsavedSwitch: function(n) {
          return "Die aktuelle Sitzung hat ungespeicherte \xC4nderungen. Zu \u201E" + n + "\u201C wechseln?";
        },
        saveAndSwitch: "Speichern und wechseln",
        switchWithoutSaving: "Ohne Speichern wechseln",
        sessionAutoName: function(n) {
          return "Neue Sitzung " + n;
        },
        noFilteredSessions: "Keine passenden Sitzungen",
        noGroupSessions: "Keine Sitzungen in dieser Gruppe",
        searchOverlayPlaceholder: "Eingeben, um Sitzungen zu filtern...",
        searchOverlayHelp: "\u2191\u2193 bewegen  /  Enter wechseln  /  \u21E7Enter speichern  /  \u232B l\xF6schen  /  Esc schlie\xDFen",
        backupRestored: "Workspace++: Sitzungen aus Sicherung wiederhergestellt.",
        settingsLanguage: "Sprache",
        settingsLanguageDesc: "Sprache der Oberfl\xE4che. Starten Sie Obsidian neu, um Befehlsnamen zu aktualisieren.",
        settingsSectionGeneral: "Allgemein",
        settingsTabSessions: "Sitzungen",
        settingsSectionSwitching: "Automatische Sitzungsspeicherung",
        settingsSectionSwitchPreview: "Sitzungswechsel",
        settingsSectionDeletion: "Sitzungsl\xF6schung",
        settingsLangAuto: "Automatisch (Systemsprache)",
        settingsTranslationHelp: "\xDCbersetzungsfehler gefunden? Erstellen Sie ein Issue oder einen Pull Request auf GitHub.",
        settingsPreviewHeading: "Aktuelle Sitzung vor dem Wechsel anzeigen",
        settingsPreviewDesc: "Beim Sitzungswechsel per Tastenkombination zeigt der erste Tastendruck die aktuelle Position an, ohne zu wechseln.",
        settingsPreviewNext: "N\xE4chste Sitzung",
        settingsPreviewPrevious: "Vorherige Sitzung",
        settingsHotkeys: "Tastenkombinationen",
        settingsHotkeysBtn: "Tastenkombinationen \xF6ffnen",
        contextOpenSettings: "Einstellungen \xF6ffnen",
        contextCustomizeClicks: "Klickaktionen anpassen",
        settingsSectionStatusBar: "Klickaktionen der Statusleiste",
        statusBarSlotClick: "Klick",
        statusBarSlotAltClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + Klick";
        },
        statusBarSlotModClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Strg") + " + Klick";
        },
        statusBarSlotShiftClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + Klick";
        },
        statusBarSlotRightClick: "Rechtsklick",
        statusBarSlotAltRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + Rechtsklick";
        },
        statusBarSlotModRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Strg") + " + Rechtsklick";
        },
        statusBarSlotShiftRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + Rechtsklick";
        },
        statusBarSlotMiddleClick: "Mittelklick",
        statusBarSlotAltMiddleClick: modifiedClickLabel("Mittelklick", "\u2325", "Alt"),
        statusBarSlotModMiddleClick: modifiedClickLabel("Mittelklick", "\u2318", "Strg"),
        statusBarSlotShiftMiddleClick: modifiedClickLabel("Mittelklick", "\u21E7", "Shift"),
        statusBarActionNone: "Nichts tun",
        statusBarActionQuickSwitcher: "Schnellwechsel \xF6ffnen",
        statusBarActionSessionManager: "Sitzungsmanager \xF6ffnen",
        statusBarActionSaveSession: "Sitzung speichern",
        statusBarActionReloadWithoutSaving: "Ohne Speichern neu laden",
        statusBarActionVersionHistory: "Versionsverlauf anzeigen",
        statusBarActionRestoreLatestHistory: "Neuesten Verlauf wiederherstellen",
        statusBarActionSessionMenu: "Sitzungsmen\xFC",
        statusBarActionSettingsMenu: "Einstellungsmen\xFC",
        contextResetOverlayPosition: "Position und Gr\xF6\xDFe zur\xFCcksetzen",
        settingsConfirmDelete: "Vor dem L\xF6schen einer Sitzung best\xE4tigen",
        settingsConfirmDeleteDesc: "Best\xE4tigungsdialog vor dem L\xF6schen einer Sitzung anzeigen.",
        settingsConfirmQuickActions: "Speichern/Neuladen im Schnellumschalter best\xE4tigen",
        settingsConfirmQuickActionsDesc: "Vor dem Speichern oder Neuladen einer Sitzung im Schnellumschalter einen Best\xE4tigungsdialog anzeigen.",
        settingsAutoSaveOnSwitch: "Automatischer Speichermodus",
        settingsAutoSaveOnSwitchDesc: "Speichert die aktuelle Sitzung automatisch beim Wechsel (Standard: ein). Bei Deaktivierung k\xF6nnen Sie Sitzungen manuell speichern und neu laden.",
        settingsWarnUnsavedSwitch: "Vor Wechsel ohne Speichern warnen",
        settingsWarnUnsavedSwitchDesc: "Wenn automatisches Speichern deaktiviert ist und die aktuelle Sitzung ungespeicherte \xC4nderungen hat, vor dem Wechsel warnen.",
        settingsStatusBarQuickSwitcher: "Schnellwechsel bei Klick auf die Statusleiste",
        settingsStatusBarQuickSwitcherDesc: "Wenn aktiviert, \xF6ffnet ein Klick auf die Statusleiste den Schnellwechsler statt des vollst\xE4ndigen Sitzungsmanagers.",
        settingsResetSessions: "Sitzungen zur\xFCcksetzen",
        settingsResetSessionsDesc: "L\xF6scht alle gespeicherten Sitzungen und beh\xE4lt nur eine neue Standardsitzung basierend auf dem aktuellen Layout.",
        settingsResetSessionsBtn: "Zur\xFCcksetzen",
        confirmResetSessions: "Alle Sitzungen auf Standard zur\xFCcksetzen? Diese Aktion kann nicht r\xFCckg\xE4ngig gemacht werden.",
        resetSessionsHint: "Dadurch werden alle gespeicherten Sitzungen entfernt und nur eine Standardsitzung beibehalten.",
        resetSessionsDone: "Sitzungen wurden auf Standard zur\xFCckgesetzt.",
        resetSessionsFailed: "Sitzungen konnten nicht zur\xFCckgesetzt werden.",
        confirmDeleteSettingsHint: "Um diese Best\xE4tigung zu deaktivieren, gehen Sie zu Einstellungen.",
        // --- Groups ---
        groupCreated: function(n) {
          return "Gruppe \u201E" + n + "\u201C erstellt";
        },
        groupDeleted: function(n) {
          return "Gruppe \u201E" + n + "\u201C gel\xF6scht";
        },
        groupRenamed: function(o, n) {
          return "Gruppe umbenannt: \u201E" + o + "\u201C \u2192 \u201E" + n + "\u201C";
        },
        groupAll: "Alle",
        groupDuplicateName: "Eine Gruppe mit diesem Namen existiert bereits.",
        groupEmptyName: "Der Gruppenname darf nicht leer sein.",
        cmdSwitchGroup: "Gruppe wechseln",
        cmdExitGroup: "Alle Sitzungen anzeigen (Gruppe verlassen)",
        cmdNextGroup: "N\xE4chste Gruppe",
        cmdPreviousGroup: "Vorherige Gruppe",
        searchOverlayHelpWithGroups: "\u2191\u2193 bewegen  /  Tab Gruppe  /  Enter wechseln  /  \u21E7Enter speichern  /  \u232B l\xF6schen  /  Esc schlie\xDFen",
        settingsSectionGroups: "Sitzungsgruppen",
        contextToggleGroups: "Sitzungsgruppen aktivieren",
        settingsSectionGroupsDesc: "Verwende Gruppen, um Sitzungen zu organisieren. Wenn deaktiviert, werden Gruppen-Tabs und Gruppenwechsel-Aktionen ausgeblendet.",
        settingsGroupCreate: "Gruppe erstellen",
        settingsGroupCreateDesc: "Eine neue Sitzungsgruppe erstellen.",
        settingsGroupCreatePlaceholder: "Gruppenname...",
        settingsGroupCreateBtn: "Erstellen",
        settingsGroupManageSessions: "Sitzungen verwalten",
        settingsGroupManageSessionsDesc: "Sitzungen zu dieser Gruppe hinzuf\xFCgen oder entfernen.",
        settingsGroupSessionCount: function(n) {
          return n + " Sitzung" + (n !== 1 ? "en" : "");
        },
        settingsGroupDelete: "Gruppe l\xF6schen",
        settingsGroupDeleteConfirm: function(n) {
          return "Gruppe \u201E" + n + "\u201C l\xF6schen? Sitzungen werden nicht gel\xF6scht.";
        },
        confirmDeleteGroup: function(n) {
          return "Gruppe \u201E" + n + "\u201C l\xF6schen? Die Sitzungen in der Gruppe werden NICHT gel\xF6scht.";
        },
        groupAddedSession: function(s, g) {
          return "\u201E" + s + "\u201C zu \u201E" + g + "\u201C hinzugef\xFCgt";
        },
        groupRemovedSession: function(s, g) {
          return "\u201E" + s + "\u201C aus \u201E" + g + "\u201C entfernt";
        },
        groupRemoveFromGroup: "Aus Gruppe entfernen",
        groupMoveToGroup: "In Gruppe verschieben",
        groupCreateNew: "Neue Gruppe",
        groupCreatePlaceholder: "Gruppenname...",
        groupContextRename: "Gruppe umbenennen",
        groupContextDelete: "Gruppe l\xF6schen",
        contextSwitchSession: "Zu dieser Sitzung wechseln",
        contextRenameSession: "Diese Sitzung umbenennen",
        contextDeleteSession: "Diese Sitzung l\xF6schen",
        contextDuplicateSession: "Diese Sitzung duplizieren",
        contextReloadSession: "Diese Sitzung neu laden",
        contextSaveSession: "Diese Sitzung speichern",
        groupRemoveAllSessions: "Alle Sitzungen aus dieser Gruppe entfernen",
        confirmRemoveAllFromGroup: function(g, n) {
          return "Alle " + n + " Sitzungen aus \u201E" + g + "\u201C entfernen?";
        },
        groupRemovedAllSessions: function(g) {
          return "Alle Sitzungen aus \u201E" + g + "\u201C entfernt";
        },
        contextDeleteAllGroups: "Alle Gruppen l\xF6schen",
        confirmDeleteAllGroups: function(n) {
          return "Alle " + n + " Gruppen l\xF6schen? Sitzungen werden nicht gel\xF6scht.";
        },
        deletedAllGroups: function(n) {
          return n + " Gruppen gel\xF6scht";
        },
        contextDeleteAllSessions: "Alle Sitzungen l\xF6schen",
        confirmDeleteAllSessions: function(n) {
          return n + " Sitzungen l\xF6schen? Die aktive Sitzung wird beibehalten.";
        },
        deletedAllSessions: function(n) {
          return n + " Sitzungen gel\xF6scht";
        },
        contextVersionHistory: "Versionsverlauf",
        cmdVersionHistory: "Sitzungsversionsverlauf anzeigen",
        historyTitle: "Versionsverlauf",
        historyEmpty: "Kein Versionsverlauf f\xFCr diese Sitzung.",
        historyRestore: "Wiederherstellen",
        historyRestoreConfirm: function(name, time) {
          return "Layout von \u201E" + name + '" von ' + time + " wiederherstellen?";
        },
        historyRestored: function(name) {
          return "Layout von \u201E" + name + '" wiederhergestellt';
        },
        historyQuickRestored: function(name) {
          return "Vorheriges Layout von \u201E" + name + '" schnell wiederhergestellt';
        },
        historyNoEntries: "Keine vorherigen Layouts zum Wiederherstellen.",
        historyToday: "Heute",
        historyYesterday: "Gestern",
        historyThisWeek: "Diese Woche",
        historyFiles: function(n) {
          return n + " Datei" + (n !== 1 ? "en" : "");
        },
        historyPanes: function(n) {
          return n + " Bereich" + (n !== 1 ? "e" : "");
        },
        settingsVersionHistoryEnabled: "Versionsverlauf aktivieren",
        settingsVersionHistoryEnabledDesc: "Einen Verlauf der Layout\xE4nderungen f\xFCr jede Sitzung speichern.",
        settingsVersionHistoryInterval: "Snapshot-Intervall (Minuten)",
        settingsVersionHistoryIntervalDesc: "Wie oft auf Layout\xE4nderungen gepr\xFCft und ein Snapshot gespeichert wird.",
        settingsVersionHistoryCtrlRmb: platformLabel("Schnellwiederherstellung (Cmd + Rechtsklick)", "Schnellwiederherstellung (Strg + Rechtsklick)"),
        settingsVersionHistoryCtrlRmbDesc: platformLabel("Klicken Sie bei gedr\xFCckter Cmd-Taste mit der rechten Maustaste auf die Statusleiste, um das vorherige Layout wiederherzustellen.", "Rechtsklicken Sie bei gedr\xFCckter Strg-Taste auf die Statusleiste, um das vorherige Layout wiederherzustellen."),
        settingsVersionHistoryConfirmRestore: "Vor Wiederherstellung best\xE4tigen",
        settingsVersionHistoryConfirmRestoreDesc: "Einen Best\xE4tigungsdialog vor der Wiederherstellung anzeigen.",
        rotationBackupSectionTitle: "Sicherung",
        rotationBackupCreate: "Sicherung erstellen",
        rotationBackupCreateBtn: "Jetzt sichern",
        rotationBackupCreated: "Sicherung erstellt.",
        rotationBackupFailed: "Sicherung konnte nicht erstellt werden.",
        rotationBackupDesc: "Sicherungen werden automatisch beim Speichern erstellt (st\xFCndlich, bis zu 3 Generationen).",
        rotationBackupRestore: "Wiederherstellen",
        rotationBackupRestoreConfirm: function(time, count) {
          return "Aus Sicherung von " + time + " wiederherstellen (" + count + " Sitzung" + (count !== 1 ? "en" : "") + ")? Aktuelle Daten werden \xFCberschrieben.";
        },
        rotationBackupRestored: "Aus Sicherung wiederhergestellt.",
        rotationBackupRestoreFailed: "Wiederherstellung aus Sicherung fehlgeschlagen.",
        rotationBackupNone: "Keine Sicherungen verf\xFCgbar.",
        rotationBackupGeneration: function(count) {
          return count + " Sitzung" + (count !== 1 ? "en" : "");
        },
        frontmatterSessionNotFound: function(n) {
          return "Sitzung \u201E" + n + "\u201C nicht gefunden (workspace-session)";
        },
        frontmatterAlreadyActive: function(n) {
          return "Sitzung \u201E" + n + "\u201C ist bereits aktiv";
        }
      },
      ja: {
        modalTitle: "\u30BB\u30C3\u30B7\u30E7\u30F3\u7BA1\u7406",
        savePlaceholder: "\u65B0\u3057\u3044\u30BB\u30C3\u30B7\u30E7\u30F3\u540D...",
        filterPlaceholder: "\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u7D5E\u308A\u8FBC\u307F...",
        settingsShowFilterInput: "\u30BB\u30C3\u30B7\u30E7\u30F3\u7D5E\u308A\u8FBC\u307F\u3092\u8868\u793A",
        settingsShowFilterInputDesc: "\u30BB\u30C3\u30B7\u30E7\u30F3\u30DE\u30CD\u30FC\u30B8\u30E3\u30FC\u306B\u30C6\u30AD\u30B9\u30C8\u7D5E\u308A\u8FBC\u307F\u3092\u8868\u793A\u3057\u3001\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u7D20\u65E9\u304F\u691C\u7D22\u3057\u307E\u3059\u3002",
        settingsOverlayDefaultFocus: "\u30AA\u30FC\u30D0\u30FC\u30EC\u30A4\u306E\u30C7\u30D5\u30A9\u30EB\u30C8\u30D5\u30A9\u30FC\u30AB\u30B9",
        settingsOverlayDefaultFocusDesc: "\u30BB\u30C3\u30B7\u30E7\u30F3\u30DE\u30CD\u30FC\u30B8\u30E3\u30FC\u3092\u958B\u3044\u305F\u3068\u304D\u306B\u30D5\u30A9\u30FC\u30AB\u30B9\u3059\u308B\u8981\u7D20\u3092\u9078\u629E\u3057\u307E\u3059\u3002",
        settingsOverlayFocusCurrentSession: "\u73FE\u5728\u306E\u30BB\u30C3\u30B7\u30E7\u30F3",
        settingsOverlayFocusSessionFilter: "\u30BB\u30C3\u30B7\u30E7\u30F3\u7D5E\u308A\u8FBC\u307F",
        settingsOverlayFocusSessionCreate: "\u30BB\u30C3\u30B7\u30E7\u30F3\u4F5C\u6210",
        settingsSectionSessionManager: "\u30BB\u30C3\u30B7\u30E7\u30F3\u4E00\u89A7\u3068\u691C\u7D22",
        settingsSectionSessionListSearch: "\u30BB\u30C3\u30B7\u30E7\u30F3\u4E00\u89A7\u3068\u691C\u7D22",
        settingsShowActiveSwitchCommand: "\u73FE\u5728\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u306E\u5207\u308A\u66FF\u3048\u30B3\u30DE\u30F3\u30C9\u3092\u30B3\u30DE\u30F3\u30C9\u30D1\u30EC\u30C3\u30C8\u306B\u8868\u793A",
        settingsShowActiveSwitchCommandDesc: "\u73FE\u5728\u30A2\u30AF\u30C6\u30A3\u30D6\u306A\u30BB\u30C3\u30B7\u30E7\u30F3\u3078\u306E\u5207\u66FF\u30B3\u30DE\u30F3\u30C9\u3092\u30B3\u30DE\u30F3\u30C9\u30D1\u30EC\u30C3\u30C8\u306B\u8868\u793A\u3057\u307E\u3059\u3002\u30DB\u30C3\u30C8\u30AD\u30FC\u306F\u3053\u306E\u8A2D\u5B9A\u306B\u95A2\u308F\u3089\u305A\u5E38\u306B\u52D5\u4F5C\u3057\u307E\u3059\u3002",
        settingsNumberedSwitchCommands: "\u756A\u53F7\u4ED8\u304D\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u5207\u308A\u66FF\u3048\u30B3\u30DE\u30F3\u30C9",
        settingsNumberedSwitchCommandsDesc: "\u756A\u53F7\u4ED8\u304D\u30B9\u30ED\u30C3\u30C8\uFF081\u20139\uFF09\u306E\u5207\u66FF\u30B3\u30DE\u30F3\u30C9\u3092\u767B\u9332\u3057\u3001\u30DB\u30C3\u30C8\u30AD\u30FC\u306B\u5272\u308A\u5F53\u3066\u3089\u308C\u307E\u3059\u3002OFF \u306B\u3059\u308B\u3068\u3001\u3059\u3079\u3066\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u304C\u540D\u524D\u30D9\u30FC\u30B9\u306E\u30B3\u30DE\u30F3\u30C9\u306B\u306A\u308A\u307E\u3059\u3002",
        save: "\u4F5C\u6210",
        load: "\u5207\u66FF",
        saveInline: "\u4FDD\u5B58",
        active: "\u4F7F\u7528\u4E2D",
        modifiedJustNow: "\u305F\u3063\u305F\u4ECA\u5909\u66F4",
        modifiedMinutes: function(n) {
          return n + "\u5206\u524D\u306B\u5909\u66F4";
        },
        modifiedHours: function(n) {
          return n + "\u6642\u9593\u524D\u306B\u5909\u66F4";
        },
        modifiedDays: function(n) {
          return n + "\u65E5\u524D\u306B\u5909\u66F4";
        },
        duplicateName: "\u540C\u3058\u540D\u524D\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u304C\u65E2\u306B\u5B58\u5728\u3057\u307E\u3059\u3002",
        emptyName: "\u30BB\u30C3\u30B7\u30E7\u30F3\u540D\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
        created: function(n) {
          return "\u30BB\u30C3\u30B7\u30E7\u30F3\u300C" + n + "\u300D\u3092\u4F5C\u6210\u3057\u307E\u3057\u305F";
        },
        deleted: function(n) {
          return "\u30BB\u30C3\u30B7\u30E7\u30F3\u300C" + n + "\u300D\u3092\u524A\u9664\u3057\u307E\u3057\u305F";
        },
        loaded: function(n) {
          return "\u300C" + n + "\u300D\u306B\u5207\u308A\u66FF\u3048\u307E\u3057\u305F";
        },
        renamed: function(o, n) {
          return "\u300C" + o + "\u300D\u3092\u300C" + n + "\u300D\u306B\u540D\u524D\u5909\u66F4\u3057\u307E\u3057\u305F";
        },
        confirmDelete: function(n) {
          return "\u30BB\u30C3\u30B7\u30E7\u30F3\u300C" + n + "\u300D\u3092\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F";
        },
        confirmDeleteActive: function(n) {
          return "\u300C" + n + "\u300D\u306F\u30A2\u30AF\u30C6\u30A3\u30D6\u306A\u30BB\u30C3\u30B7\u30E7\u30F3\u3067\u3059\u3002\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F";
        },
        confirmSaveSession: function(n) {
          return '\u30BB\u30C3\u30B7\u30E7\u30F3 "' + n + '" \u3092\u4FDD\u5B58\u3057\u307E\u3059\u304B\uFF1F';
        },
        confirmOverwriteSessionWithCurrentLayout: function(n) {
          return "\u300C" + n + "\u300D\u3092\u73FE\u5728\u306E\u30EC\u30A4\u30A2\u30A6\u30C8\u3067\u4E0A\u66F8\u304D\u3057\u307E\u3059\u304B\uFF1F";
        },
        confirmReloadSession: function(n) {
          return '\u30BB\u30C3\u30B7\u30E7\u30F3 "' + n + '" \u3092\u518D\u8AAD\u307F\u8FBC\u307F\u3057\u307E\u3059\u304B\uFF1F\u4FDD\u5B58\u3055\u308C\u3066\u3044\u306A\u3044\u5909\u66F4\u306F\u5931\u308F\u308C\u307E\u3059\u3002';
        },
        renameTitle: "\u30BB\u30C3\u30B7\u30E7\u30F3\u540D\u306E\u5909\u66F4",
        renamePlaceholder: "\u65B0\u3057\u3044\u540D\u524D...",
        noSession: "\u30BB\u30C3\u30B7\u30E7\u30F3\u306A\u3057",
        cannotDeleteLast: "\u6700\u5F8C\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u306F\u524A\u9664\u3067\u304D\u307E\u305B\u3093\u3002",
        confirmBulkDelete: function(n) {
          return n + "\u4EF6\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F";
        },
        bulkDeleted: function(n) {
          return n + "\u4EF6\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u524A\u9664\u3057\u307E\u3057\u305F";
        },
        bulkDelete: function(n) {
          return n + "\u4EF6\u3092\u524A\u9664";
        },
        cmdManage: "\u30BB\u30C3\u30B7\u30E7\u30F3\u7BA1\u7406",
        cmdCreate: "\u65B0\u3057\u3044\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u4F5C\u6210",
        cmdRename: "\u73FE\u5728\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u540D\u3092\u5909\u66F4",
        cmdDelete: "\u73FE\u5728\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u524A\u9664",
        cmdNewEmpty: "\u7A7A\u767D\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u4F5C\u6210",
        cmdDuplicate: "\u73FE\u5728\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u8907\u88FD",
        duplicated: function(n) {
          return "\u300C" + n + "\u300D\u3068\u3057\u3066\u8907\u88FD\u3057\u307E\u3057\u305F";
        },
        deselect: "\u9078\u629E\u89E3\u9664",
        footerDragReorder: "\u30C9\u30E9\u30C3\u30B0\u3067\u4E26\u3079\u66FF\u3048",
        footerDragToGroup: "\u30B0\u30EB\u30FC\u30D7\u30BF\u30D6\u306B\u30C9\u30E9\u30C3\u30B0\u3067\u79FB\u52D5",
        defaultLabel: "\uFF08\u30C7\u30D5\u30A9\u30EB\u30C8\uFF09",
        rename: "\u540D\u524D\u5909\u66F4",
        delete: "\u524A\u9664",
        remove: "\u5916\u3059",
        cancel: "\u30AD\u30E3\u30F3\u30BB\u30EB",
        ribbonTooltip: "Workspace++",
        cmdSwitchTo: function(n, name) {
          return name ? "\u30BB\u30C3\u30B7\u30E7\u30F3 " + n + " \u306B\u5207\u308A\u66FF\u3048: " + name : "\u30BB\u30C3\u30B7\u30E7\u30F3 " + n + " \u306B\u5207\u308A\u66FF\u3048";
        },
        cmdSwitchToNamed: function(name) {
          return '"' + name + '" \u306B\u5207\u308A\u66FF\u3048';
        },
        cmdPrevious: "\u524D\u306E\u30BB\u30C3\u30B7\u30E7\u30F3",
        cmdNext: "\u6B21\u306E\u30BB\u30C3\u30B7\u30E7\u30F3",
        cmdSaveCurrent: "\u73FE\u5728\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u4FDD\u5B58",
        cmdSaveAs: "\u73FE\u5728\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u5225\u540D\u3067\u4FDD\u5B58...",
        cmdSaveCurrentLayoutToSession: "\u73FE\u5728\u306E\u30EC\u30A4\u30A2\u30A6\u30C8\u3092\u30BB\u30C3\u30B7\u30E7\u30F3\u306B\u4FDD\u5B58...",
        cmdReloadCurrentWithoutSaving: "\u73FE\u5728\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u4FDD\u5B58\u305B\u305A\u518D\u8AAD\u307F\u8FBC\u307F",
        cmdToggleAutoSave: "\u30BB\u30C3\u30B7\u30E7\u30F3\u5207\u66FF\u6642\u306E\u81EA\u52D5\u4FDD\u5B58\u3092\u5207\u308A\u66FF\u3048",
        cmdEnableAutoSave: "\u30BB\u30C3\u30B7\u30E7\u30F3\u5207\u66FF\u6642\u306E\u81EA\u52D5\u4FDD\u5B58\u3092\u6709\u52B9\u5316",
        cmdDisableAutoSave: "\u30BB\u30C3\u30B7\u30E7\u30F3\u5207\u66FF\u6642\u306E\u81EA\u52D5\u4FDD\u5B58\u3092\u7121\u52B9\u5316",
        cmdSearchOverlay: "\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u691C\u7D22",
        cmdExportSessions: "\u30BB\u30C3\u30B7\u30E7\u30F3\u30B9\u30CA\u30C3\u30D7\u30B7\u30E7\u30C3\u30C8\u3092\u66F8\u304D\u51FA\u3057",
        cmdImportSessions: "\u6700\u65B0\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u30B9\u30CA\u30C3\u30D7\u30B7\u30E7\u30C3\u30C8\u3092\u8AAD\u307F\u8FBC\u307F",
        switchLeft: "\u5DE6",
        switchRight: "\u53F3",
        switchGroup: "\u30B0\u30EB\u30FC\u30D7",
        keyTab: "Tab",
        savedSession: function(n) {
          return "\u300C" + n + "\u300D\u3092\u4FDD\u5B58\u3057\u307E\u3057\u305F";
        },
        savedAs: function(n) {
          return "\u300C" + n + "\u300D\u3068\u3057\u3066\u4FDD\u5B58\u3057\u307E\u3057\u305F";
        },
        savedCurrentLayoutToSession: function(n) {
          return "\u73FE\u5728\u306E\u30EC\u30A4\u30A2\u30A6\u30C8\u3092\u300C" + n + "\u300D\u306B\u4FDD\u5B58\u3057\u307E\u3057\u305F";
        },
        noChanges: "\u5909\u66F4\u306F\u3042\u308A\u307E\u305B\u3093",
        reloadedSession: function(n) {
          return "\u300C" + n + "\u300D\u3092\u518D\u8AAD\u307F\u8FBC\u307F\u3057\u307E\u3057\u305F";
        },
        autoSaveEnabled: "\u30BB\u30C3\u30B7\u30E7\u30F3\u5207\u66FF\u6642\u306E\u81EA\u52D5\u4FDD\u5B58\u3092\u6709\u52B9\u306B\u3057\u307E\u3057\u305F\u3002",
        autoSaveDisabled: "\u30BB\u30C3\u30B7\u30E7\u30F3\u5207\u66FF\u6642\u306E\u81EA\u52D5\u4FDD\u5B58\u3092\u7121\u52B9\u306B\u3057\u307E\u3057\u305F\u3002",
        confirmUnsavedSwitch: function(n) {
          return "\u73FE\u5728\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u306B\u672A\u4FDD\u5B58\u306E\u5909\u66F4\u304C\u3042\u308A\u307E\u3059\u3002\u300C" + n + "\u300D\u3078\u5207\u308A\u66FF\u3048\u307E\u3059\u304B\uFF1F";
        },
        saveAndSwitch: "\u4FDD\u5B58\u3057\u3066\u5207\u308A\u66FF\u3048",
        switchWithoutSaving: "\u4FDD\u5B58\u305B\u305A\u5207\u308A\u66FF\u3048",
        defaultSessionName: "\u30C7\u30D5\u30A9\u30EB\u30C8",
        nameSessionTitle: "\u30BB\u30C3\u30B7\u30E7\u30F3\u540D\u3092\u4ED8\u3051\u3066\u4FDD\u5B58",
        nameSessionPlaceholder: "\u30BB\u30C3\u30B7\u30E7\u30F3\u540D...",
        saveWithoutNaming: "\u540D\u524D\u3092\u4ED8\u3051\u305A\u306B\u4FDD\u5B58",
        sessionAutoName: function(n) {
          return "\u65B0\u3057\u3044\u30BB\u30C3\u30B7\u30E7\u30F3 " + n;
        },
        noFilteredSessions: "\u4E00\u81F4\u3059\u308B\u30BB\u30C3\u30B7\u30E7\u30F3\u304C\u3042\u308A\u307E\u305B\u3093",
        noGroupSessions: "\u3053\u306E\u30B0\u30EB\u30FC\u30D7\u306B\u30BB\u30C3\u30B7\u30E7\u30F3\u306F\u3042\u308A\u307E\u305B\u3093",
        searchOverlayPlaceholder: "\u5165\u529B\u3057\u3066\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u7D5E\u308A\u8FBC\u307F...",
        saveCurrentLayoutToSessionPlaceholder: "\u4E0A\u66F8\u304D\u3059\u308B\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u9078\u629E...",
        searchOverlayHelp: "\u2191\u2193 \u79FB\u52D5  /  Enter \u5207\u66FF  /  \u21E7Enter \u4FDD\u5B58  /  \u232B \u524A\u9664  /  Esc \u9589\u3058\u308B",
        backupRestored: "Workspace++: \u30D0\u30C3\u30AF\u30A2\u30C3\u30D7\u304B\u3089\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u5FA9\u5143\u3057\u307E\u3057\u305F\u3002",
        sessionDataMigrated: "Workspace++: \u30BB\u30C3\u30B7\u30E7\u30F3\u30C7\u30FC\u30BF\u3092 .workspace-plus-plus/sessions.json \u306B\u79FB\u884C\u3057\u307E\u3057\u305F\u3002",
        sessionDataMigrationFailed: "Workspace++: \u30BB\u30C3\u30B7\u30E7\u30F3\u30C7\u30FC\u30BF\u306E\u79FB\u884C\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u65E2\u5B58\u30C7\u30FC\u30BF\u306F\u4FDD\u6301\u3055\u308C\u3066\u3044\u307E\u3059\u3002",
        localSettingsEnabled: "Workspace++: Vault\u3054\u3068\u306E\u8A2D\u5B9A\u3092\u6709\u52B9\u306B\u3057\u307E\u3057\u305F\u3002",
        localSettingsDisabled: "Workspace++: Vault\u3054\u3068\u306E\u8A2D\u5B9A\u3092\u7121\u52B9\u306B\u3057\u307E\u3057\u305F\u3002",
        localSettingsCopied: "Workspace++: \u30B0\u30ED\u30FC\u30D0\u30EB\u8A2D\u5B9A\u3092Vault\u3054\u3068\u306E\u8A2D\u5B9A\u306B\u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F\u3002",
        localSettingsLoadFailed: "Workspace++: Vault\u3054\u3068\u306E\u8A2D\u5B9A\u3092\u8AAD\u307F\u8FBC\u3081\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u30B0\u30ED\u30FC\u30D0\u30EB\u8A2D\u5B9A\u3092\u4F7F\u7528\u3057\u307E\u3059\u3002",
        localSettingsOperationFailed: "Workspace++: Vault\u3054\u3068\u306E\u8A2D\u5B9A\u306E\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002",
        exportSessionsDone: function(path) {
          return "Workspace++: \u30BB\u30C3\u30B7\u30E7\u30F3\u3092 " + path + " \u306B\u66F8\u304D\u51FA\u3057\u307E\u3057\u305F\u3002";
        },
        exportSessionsFailed: "Workspace++: \u30BB\u30C3\u30B7\u30E7\u30F3\u306E\u66F8\u304D\u51FA\u3057\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002",
        importSessionsDone: function(path) {
          return "Workspace++: \u30BB\u30C3\u30B7\u30E7\u30F3\u3092 " + path + " \u304B\u3089\u8AAD\u307F\u8FBC\u307F\u307E\u3057\u305F\u3002";
        },
        importSessionsNoFile: "Workspace++: .workspace-plus-plus/exports \u306B\u8AAD\u307F\u8FBC\u307F\u53EF\u80FD\u306A\u30D5\u30A1\u30A4\u30EB\u304C\u3042\u308A\u307E\u305B\u3093\u3002",
        importSessionsFailed: "Workspace++: \u30BB\u30C3\u30B7\u30E7\u30F3\u306E\u8AAD\u307F\u8FBC\u307F\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002",
        settingsLanguage: "\u8A00\u8A9E",
        settingsLanguageDesc: "\u30D7\u30E9\u30B0\u30A4\u30F3\u306E\u8868\u793A\u8A00\u8A9E\u3002\u30B3\u30DE\u30F3\u30C9\u540D\u3078\u306E\u53CD\u6620\u306B\u306FObsidian\u306E\u518D\u8D77\u52D5\u304C\u5FC5\u8981\u3067\u3059\u3002",
        settingsSectionGeneral: "\u4E00\u822C",
        settingsTabSessions: "\u30BB\u30C3\u30B7\u30E7\u30F3",
        settingsSectionSwitching: "\u30BB\u30C3\u30B7\u30E7\u30F3\u5207\u308A\u66FF\u3048",
        settingsSectionSwitchCommands: "\u30BB\u30C3\u30B7\u30E7\u30F3\u306E\u5207\u308A\u66FF\u3048",
        settingsSectionScrollSwitch: "\u30BB\u30C3\u30B7\u30E7\u30F3\u5207\u308A\u66FF\u3048",
        settingsSectionSwitchPreview: "\u30BB\u30C3\u30B7\u30E7\u30F3\u5207\u308A\u66FF\u3048\u524D\u30D7\u30EC\u30D3\u30E5\u30FC",
        settingsSubsectionSwitchSaving: "\u30BB\u30C3\u30B7\u30E7\u30F3\u5207\u308A\u66FF\u3048\u6642\u306E\u4FDD\u5B58",
        settingsSubsectionAutoSaveMode: "\u30BB\u30C3\u30B7\u30E7\u30F3\u306E\u81EA\u52D5\u4FDD\u5B58\u30E2\u30FC\u30C9",
        settingsSubsectionSwitchCommands: "\u30BB\u30C3\u30B7\u30E7\u30F3\u5207\u308A\u66FF\u3048\u30B3\u30DE\u30F3\u30C9",
        settingsSubsectionScrollSwitch: "\u30BB\u30C3\u30B7\u30E7\u30F3\u5207\u308A\u66FF\u3048\u306E\u30B9\u30AF\u30ED\u30FC\u30EB\u64CD\u4F5C",
        settingsSubsectionSwitchPreview: "\u30BB\u30C3\u30B7\u30E7\u30F3\u5207\u308A\u66FF\u3048\u524D\u30D7\u30EC\u30D3\u30E5\u30FC",
        settingsSectionDeletion: "\u30BB\u30C3\u30B7\u30E7\u30F3\u306E\u524A\u9664",
        settingsSectionAdvanced: "\u8A73\u7D30",
        settingsSectionReset: "\u30EA\u30BB\u30C3\u30C8",
        settingsStatusBarModScrollSwitch: "\u30B9\u30C6\u30FC\u30BF\u30B9\u30D0\u30FC\u3067\u30BB\u30C3\u30B7\u30E7\u30F3\u5207\u308A\u66FF\u3048\u3092\u6709\u52B9\u306B\u3059\u308B",
        settingsStatusBarModScrollSwitchDesc: "\u30B9\u30C6\u30FC\u30BF\u30B9\u30D0\u30FC\u9805\u76EE\u306E\u4E0A\u3067\u3001\u9078\u3093\u3060\u4FEE\u98FE\u30AD\u30FC\u3092\u62BC\u3057\u306A\u304C\u3089\u7E26\u30B9\u30AF\u30ED\u30FC\u30EB\u3059\u308B\u3068\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u5207\u308A\u66FF\u3048\u307E\u3059\u3002\u30C8\u30E9\u30C3\u30AF\u30D1\u30C3\u30C9\u306E\u8AA4\u53CD\u5FDC\u3092\u6E1B\u3089\u3059\u305F\u3081\u3001\u3057\u304D\u3044\u5024\u3068\u30AF\u30FC\u30EB\u30C0\u30A6\u30F3\u3092\u4F7F\u3044\u307E\u3059\u3002",
        settingsStatusBarScrollPreset: "\u30B9\u30AF\u30ED\u30FC\u30EB\u5165\u529B\u30D7\u30EA\u30BB\u30C3\u30C8",
        settingsStatusBarScrollPresetDesc: "\u30C7\u30D0\u30A4\u30B9\u306B\u5408\u308F\u305B\u305F\u30D7\u30EA\u30BB\u30C3\u30C8\u3092\u9078\u3076\u304B\u3001Custom \u3067\u6570\u5024\u3092\u81EA\u5206\u3067\u8ABF\u6574\u3057\u307E\u3059\u3002",
        settingsStatusBarScrollPresetTrackpad: "\u30C8\u30E9\u30C3\u30AF\u30D1\u30C3\u30C9",
        settingsStatusBarScrollPresetNotchedWheel: "\u30CE\u30C3\u30C1\u4ED8\u304D\u30DE\u30A6\u30B9\u30DB\u30A4\u30FC\u30EB",
        settingsStatusBarScrollPresetFreeSpinWheel: "\u30D5\u30EA\u30FC\u30B9\u30D4\u30F3\u30DE\u30A6\u30B9\u30DB\u30A4\u30FC\u30EB",
        settingsStatusBarScrollPresetCustom: "Custom",
        settingsStatusBarScrollModifier: "\u5FC5\u8981\u306A\u4FEE\u98FE\u30AD\u30FC",
        settingsStatusBarScrollModifierDesc: "\u30B9\u30C6\u30FC\u30BF\u30B9\u30D0\u30FC\u9805\u76EE\u4E0A\u3067\u30B9\u30AF\u30ED\u30FC\u30EB\u3059\u308B\u3068\u304D\u306B\u5FC5\u8981\u306A\u4FEE\u98FE\u30AD\u30FC\u3092\u9078\u3073\u307E\u3059\u3002",
        settingsStatusBarScrollModifierRecommended: function() {
          return typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "Cmd \u307E\u305F\u306F Option" : "Ctrl \u307E\u305F\u306F Alt";
        },
        settingsStatusBarScrollModifierNone: "\u306A\u3057",
        settingsStatusBarScrollModifierModOnly: function() {
          return typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "Cmd \u306E\u307F" : "Ctrl \u306E\u307F";
        },
        settingsStatusBarScrollModifierAltOnly: function() {
          return typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "Option \u306E\u307F" : "Alt \u306E\u307F";
        },
        settingsStatusBarScrollModifierModOrAlt: function() {
          return typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "Cmd \u307E\u305F\u306F Option" : "Ctrl \u307E\u305F\u306F Alt";
        },
        settingsStatusBarScrollThreshold: "\u611F\u5EA6\u3057\u304D\u3044\u5024",
        settingsStatusBarScrollThresholdDesc: "\u5C0F\u3055\u3044\u307B\u3069\u5C11\u3057\u306E\u30B9\u30AF\u30ED\u30FC\u30EB\u3067\u5207\u308A\u66FF\u308F\u308A\u307E\u3059\u3002Custom \u30D7\u30EA\u30BB\u30C3\u30C8\u306E\u3068\u304D\u3060\u3051\u4F7F\u3044\u307E\u3059\u3002",
        settingsStatusBarScrollCooldown: "\u30AF\u30FC\u30EB\u30C0\u30A6\u30F3",
        settingsStatusBarScrollCooldownDesc: "\u30B9\u30AF\u30ED\u30FC\u30EB\u306B\u3088\u308B\u30BB\u30C3\u30B7\u30E7\u30F3\u5207\u66FF\u306E\u6700\u5C0F\u9593\u9694\u3067\u3059\u3002Custom \u30D7\u30EA\u30BB\u30C3\u30C8\u306E\u3068\u304D\u3060\u3051\u4F7F\u3044\u307E\u3059\u3002",
        settingsStatusBarScrollResetWindow: "\u7D2F\u7A4D\u30EA\u30BB\u30C3\u30C8\u6642\u9593",
        settingsStatusBarScrollResetWindowDesc: "\u7D30\u304B\u3044\u30B9\u30AF\u30ED\u30FC\u30EB\u91CF\u3092\u307E\u3068\u3081\u3066\u6271\u3046\u6642\u9593\u3067\u3059\u3002Custom \u30D7\u30EA\u30BB\u30C3\u30C8\u306E\u3068\u304D\u3060\u3051\u4F7F\u3044\u307E\u3059\u3002",
        settingsStatusBarScrollInvert: "\u30B9\u30AF\u30ED\u30FC\u30EB\u65B9\u5411\u3092\u53CD\u8EE2",
        settingsStatusBarScrollInvertDesc: "\u30B9\u30C6\u30FC\u30BF\u30B9\u30D0\u30FC\u306E\u30B9\u30AF\u30ED\u30FC\u30EB\u5207\u66FF\u3067\u524D\u5F8C\u306E\u65B9\u5411\u3092\u53CD\u8EE2\u3057\u307E\u3059\u3002",
        settingsLangAuto: "\u81EA\u52D5\uFF08\u30B7\u30B9\u30C6\u30E0\u8A00\u8A9E\uFF09",
        settingsGitHubLink: "GitHub",
        settingsTranslationHelp: "\u7FFB\u8A33\u306E\u8AA4\u308A\u3092\u898B\u3064\u3051\u305F\u3089\u3001GitHub\u3067issue\u307E\u305F\u306FPull request\u3092\u304A\u9858\u3044\u3057\u307E\u3059\u3002",
        settingsPreviewHeading: "\u30BB\u30C3\u30B7\u30E7\u30F3\u5207\u308A\u66FF\u3048\u524D\u30D7\u30EC\u30D3\u30E5\u30FC\u3092\u6709\u52B9\u306B\u3059\u308B",
        settingsPreviewDesc: "\u30DB\u30C3\u30C8\u30AD\u30FC\u3067\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u79FB\u52D5\u3059\u308B\u969B\u30011\u56DE\u76EE\u306F\u79FB\u52D5\u305B\u305A\u73FE\u5728\u306E\u4F4D\u7F6E\u3092\u8868\u793A\u3057\u307E\u3059\u3002",
        settingsPreviewNext: "\u6B21\u306E\u30BB\u30C3\u30B7\u30E7\u30F3",
        settingsPreviewPrevious: "\u524D\u306E\u30BB\u30C3\u30B7\u30E7\u30F3",
        settingsHotkeys: "\u30DB\u30C3\u30C8\u30AD\u30FC",
        settingsHotkeysBtn: "\u30DB\u30C3\u30C8\u30AD\u30FC\u8A2D\u5B9A\u3092\u958B\u304F",
        contextOpenSettings: "\u8A2D\u5B9A\u3092\u958B\u304F",
        contextCustomizeClicks: "\u30AF\u30EA\u30C3\u30AF\u64CD\u4F5C\u3092\u30AB\u30B9\u30BF\u30DE\u30A4\u30BA",
        settingsSectionStatusBar: "\u30B9\u30C6\u30FC\u30BF\u30B9\u30D0\u30FC\u306E\u30AF\u30EA\u30C3\u30AF\u64CD\u4F5C",
        statusBarSlotClick: "\u30AF\u30EA\u30C3\u30AF",
        statusBarSlotAltClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + \u30AF\u30EA\u30C3\u30AF";
        },
        statusBarSlotModClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + \u30AF\u30EA\u30C3\u30AF";
        },
        statusBarSlotShiftClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + \u30AF\u30EA\u30C3\u30AF";
        },
        statusBarSlotMiddleClick: "\u30DF\u30C9\u30EB\u30AF\u30EA\u30C3\u30AF",
        statusBarSlotAltMiddleClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + \u30DF\u30C9\u30EB\u30AF\u30EA\u30C3\u30AF";
        },
        statusBarSlotModMiddleClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + \u30DF\u30C9\u30EB\u30AF\u30EA\u30C3\u30AF";
        },
        statusBarSlotShiftMiddleClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + \u30DF\u30C9\u30EB\u30AF\u30EA\u30C3\u30AF";
        },
        statusBarSlotRightClick: "\u53F3\u30AF\u30EA\u30C3\u30AF",
        statusBarSlotAltRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + \u53F3\u30AF\u30EA\u30C3\u30AF";
        },
        statusBarSlotModRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + \u53F3\u30AF\u30EA\u30C3\u30AF";
        },
        statusBarSlotShiftRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + \u53F3\u30AF\u30EA\u30C3\u30AF";
        },
        statusBarActionNone: "\u4F55\u3082\u3057\u306A\u3044",
        statusBarActionQuickSwitcher: "Quick Switcher\u3092\u958B\u304F",
        statusBarActionSessionManager: "Session Manager\u3092\u958B\u304F",
        statusBarActionSaveSession: "\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u4FDD\u5B58",
        statusBarActionReloadWithoutSaving: "\u4FDD\u5B58\u305B\u305A\u30EA\u30ED\u30FC\u30C9",
        statusBarActionVersionHistory: "\u30D0\u30FC\u30B8\u30E7\u30F3\u5C65\u6B74\u3092\u8868\u793A",
        statusBarActionRestoreLatestHistory: "\u6700\u65B0\u5C65\u6B74\u3092\u30EA\u30B9\u30C8\u30A2",
        statusBarActionSessionMenu: "\u30BB\u30C3\u30B7\u30E7\u30F3\u30E1\u30CB\u30E5\u30FC",
        statusBarActionSettingsMenu: "\u8A2D\u5B9A\u30E1\u30CB\u30E5\u30FC",
        contextResetOverlayPosition: "\u4F4D\u7F6E\u3068\u30B5\u30A4\u30BA\u3092\u30EA\u30BB\u30C3\u30C8",
        settingsConfirmDelete: "\u30BB\u30C3\u30B7\u30E7\u30F3\u524A\u9664\u524D\u306B\u78BA\u8A8D",
        settingsConfirmDeleteDesc: "\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u524A\u9664\u3059\u308B\u524D\u306B\u78BA\u8A8D\u30C0\u30A4\u30A2\u30ED\u30B0\u3092\u8868\u793A\u3057\u307E\u3059\u3002",
        settingsConfirmQuickActions: "\u30AF\u30A4\u30C3\u30AF\u30B9\u30A4\u30C3\u30C1\u30E3\u30FC\u3067\u306E\u4FDD\u5B58/\u518D\u8AAD\u307F\u8FBC\u307F\u3092\u78BA\u8A8D",
        settingsConfirmQuickActionsDesc: "\u30AF\u30A4\u30C3\u30AF\u30B9\u30A4\u30C3\u30C1\u30E3\u30FC\u304B\u3089\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u4FDD\u5B58\u307E\u305F\u306F\u518D\u8AAD\u307F\u8FBC\u307F\u3059\u308B\u524D\u306B\u78BA\u8A8D\u30C0\u30A4\u30A2\u30ED\u30B0\u3092\u8868\u793A\u3057\u307E\u3059\u3002",
        settingsAutoSaveOnSwitch: "\u81EA\u52D5\u4FDD\u5B58\u30E2\u30FC\u30C9",
        settingsAutoSaveOnSwitchDesc: "\u30BB\u30C3\u30B7\u30E7\u30F3\u5207\u66FF\u6642\u306B\u81EA\u52D5\u3067\u4FDD\u5B58\u3057\u307E\u3059\uFF08\u30C7\u30D5\u30A9\u30EB\u30C8: ON\uFF09\u3002OFF\u306B\u3059\u308B\u3068\u3001\u4FDD\u5B58\u30FB\u518D\u8AAD\u307F\u8FBC\u307F\u3092\u624B\u52D5\u3067\u884C\u3048\u308B\u3088\u3046\u306B\u306A\u308A\u307E\u3059\u3002",
        settingsWarnUnsavedSwitch: "\u672A\u4FDD\u5B58\u306E\u307E\u307E\u5207\u308A\u66FF\u3048\u308B\u524D\u306B\u8B66\u544A\u3059\u308B",
        settingsWarnUnsavedSwitchDesc: "\u81EA\u52D5\u4FDD\u5B58\u304C\u7121\u52B9\u3067\u73FE\u5728\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u306B\u672A\u4FDD\u5B58\u306E\u5909\u66F4\u304C\u3042\u308B\u5834\u5408\u3001\u5207\u308A\u66FF\u3048\u524D\u306B\u8B66\u544A\u3092\u8868\u793A\u3057\u307E\u3059\u3002",
        settingsStatusBarQuickSwitcher: "\u30B9\u30C6\u30FC\u30BF\u30B9\u30D0\u30FC\u30AF\u30EA\u30C3\u30AF\u3067\u30AF\u30A4\u30C3\u30AF\u30B9\u30A4\u30C3\u30C1\u30E3\u30FC\u3092\u958B\u304F",
        settingsStatusBarQuickSwitcherDesc: "\u6709\u52B9\u306B\u3059\u308B\u3068\u3001\u30B9\u30C6\u30FC\u30BF\u30B9\u30D0\u30FC\u306E\u30AF\u30EA\u30C3\u30AF\u3067\u30BB\u30C3\u30B7\u30E7\u30F3\u30DE\u30CD\u30FC\u30B8\u30E3\u30FC\u306E\u4EE3\u308F\u308A\u306B\u30AF\u30A4\u30C3\u30AF\u30B9\u30A4\u30C3\u30C1\u30E3\u30FC\u3092\u958B\u304D\u307E\u3059\u3002",
        settingsUseLocalSettings: "Vault\u3054\u3068\u306E\u8A2D\u5B9A\u3092\u4F7F\u3046",
        settingsUseLocalSettingsDesc: "\u8907\u6570Vault\u3067 .obsidian \u3092\u540C\u671F\u3057\u3066\u3044\u308B\u5834\u5408\uFF08\u4F8B: Settings Profiles\uFF09\u306B\u6709\u52B9\u3067\u3059\u3002Workspace++ \u306E\u8A2D\u5B9A\u3092Vault\u3054\u3068\u306B\u5206\u3051\u3066\u4FDD\u5B58\u3057\u307E\u3059\u3002",
        settingsCopyGlobalToLocal: "\u30B0\u30ED\u30FC\u30D0\u30EB\u8A2D\u5B9A\u3092\u3053\u306EVault\u3078\u30B3\u30D4\u30FC",
        settingsCopyGlobalToLocalDesc: "\u73FE\u5728\u306E\u30B0\u30ED\u30FC\u30D0\u30EB\u8A2D\u5B9A\u3067Vault\u3054\u3068\u306E\u8A2D\u5B9A\u3092\u4E0A\u66F8\u304D\u3057\u307E\u3059\u3002",
        settingsCopyGlobalToLocalBtn: "\u30B3\u30D4\u30FC",
        settingsResetLocalSettings: "Vault\u3054\u3068\u306E\u8A2D\u5B9A\u3092\u30EA\u30BB\u30C3\u30C8",
        settingsResetLocalSettingsDesc: "Vault\u3054\u3068\u306E\u8A2D\u5B9A\u3092\u30B0\u30ED\u30FC\u30D0\u30EB\u8A2D\u5B9A\u306B\u623B\u3057\u307E\u3059\u3002",
        settingsResetLocalSettingsBtn: "\u30ED\u30FC\u30AB\u30EB\u3092\u30EA\u30BB\u30C3\u30C8",
        settingsAdvancedStorageSubsection: "\u4FDD\u5B58\u5148\u306E\u6319\u52D5",
        settingsAdvancedTransferSubsection: "\u30C7\u30FC\u30BF\u79FB\u884C",
        settingsDeveloperSection: "\u958B\u767A\u8005\u5411\u3051",
        settingsStorageDiagnostics: "\u4FDD\u5B58\u5148\u306E\u8A3A\u65AD",
        settingsStorageDiagnosticsDesc: "Workspace++ \u304C\u73FE\u5728\u4F7F\u3063\u3066\u3044\u308B\u4FDD\u5B58\u5148\u60C5\u5831\u3067\u3059\u3002",
        settingsStorageFieldSessions: "\u30BB\u30C3\u30B7\u30E7\u30F3\u4FDD\u5B58\u30D5\u30A1\u30A4\u30EB",
        settingsStorageFieldSessionsBackup: "\u30BB\u30C3\u30B7\u30E7\u30F3\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7",
        settingsStorageFieldLocalSettings: "\u30ED\u30FC\u30AB\u30EB\u8A2D\u5B9A\u30D5\u30A1\u30A4\u30EB",
        settingsStorageFieldGlobalSettings: "\u30B0\u30ED\u30FC\u30D0\u30EB\u8A2D\u5B9A\u30D5\u30A1\u30A4\u30EB",
        settingsStorageFieldSessionCount: "\u30BB\u30C3\u30B7\u30E7\u30F3\u6570",
        settingsStorageFieldUpdatedAt: "\u66F4\u65B0\u65E5\u6642",
        settingsExportSessions: "\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u66F8\u304D\u51FA\u3057",
        settingsExportSessionsDesc: ".workspace-plus-plus/exports \u306B\u30B9\u30CA\u30C3\u30D7\u30B7\u30E7\u30C3\u30C8\u3092\u4FDD\u5B58\u3057\u307E\u3059\u3002",
        settingsExportSessionsBtn: "\u66F8\u304D\u51FA\u3057",
        settingsImportSessions: "\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u8AAD\u307F\u8FBC\u307F",
        settingsImportSessionsDesc: ".workspace-plus-plus/exports \u306E\u6700\u65B0\u30B9\u30CA\u30C3\u30D7\u30B7\u30E7\u30C3\u30C8\u3092\u8AAD\u307F\u8FBC\u307F\u307E\u3059\u3002",
        settingsImportSessionsBtn: "\u6700\u65B0\u3092\u8AAD\u307F\u8FBC\u307F",
        confirmImportSessions: "\u6700\u65B0\u306E\u66F8\u304D\u51FA\u3057\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u8AAD\u307F\u8FBC\u307F\u307E\u3059\u304B\uFF1F\u73FE\u5728\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u306F\u7F6E\u304D\u63DB\u3048\u3089\u308C\u307E\u3059\u3002",
        settingsResetSettings: "\u8A2D\u5B9A\u3092\u30EA\u30BB\u30C3\u30C8",
        settingsResetSettingsDesc: "\u73FE\u5728\u306E\u8A2D\u5B9A\u30B9\u30B3\u30FC\u30D7\u306B\u5BFE\u3057\u3066 Workspace++ \u8A2D\u5B9A\u3092\u521D\u671F\u5024\u306B\u623B\u3057\u307E\u3059\u3002",
        settingsResetSettingsBtn: "\u8A2D\u5B9A\u3092\u30EA\u30BB\u30C3\u30C8",
        confirmResetSettings: "Workspace++ \u306E\u8A2D\u5B9A\u3092\u521D\u671F\u5024\u306B\u623B\u3057\u307E\u3059\u304B\uFF1F",
        resetSettingsDone: "Workspace++ \u306E\u8A2D\u5B9A\u3092\u30EA\u30BB\u30C3\u30C8\u3057\u307E\u3057\u305F\u3002",
        resetSettingsFailed: "Workspace++ \u306E\u8A2D\u5B9A\u30EA\u30BB\u30C3\u30C8\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002",
        settingsResetSessions: "\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u30EA\u30BB\u30C3\u30C8",
        settingsResetSessionsDesc: "\u4FDD\u5B58\u6E08\u307F\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u3059\u3079\u3066\u524A\u9664\u3057\u3001\u73FE\u5728\u306E\u30EC\u30A4\u30A2\u30A6\u30C8\u304B\u3089\u65B0\u3057\u3044\u30C7\u30D5\u30A9\u30EB\u30C8\u30BB\u30C3\u30B7\u30E7\u30F31\u3064\u3060\u3051\u3092\u6B8B\u3057\u307E\u3059\u3002",
        settingsResetSessionsBtn: "\u30EA\u30BB\u30C3\u30C8",
        confirmResetSessions: "\u3059\u3079\u3066\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u521D\u671F\u72B6\u614B\u306B\u30EA\u30BB\u30C3\u30C8\u3057\u307E\u3059\u304B\uFF1F\u3053\u306E\u64CD\u4F5C\u306F\u5143\u306B\u623B\u305B\u307E\u305B\u3093\u3002",
        resetSessionsHint: "\u4FDD\u5B58\u6E08\u307F\u30BB\u30C3\u30B7\u30E7\u30F3\u306F\u3059\u3079\u3066\u524A\u9664\u3055\u308C\u3001\u30C7\u30D5\u30A9\u30EB\u30C8\u30BB\u30C3\u30B7\u30E7\u30F31\u3064\u3060\u3051\u304C\u6B8B\u308A\u307E\u3059\u3002",
        resetSessionsDone: "\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u521D\u671F\u72B6\u614B\u306B\u30EA\u30BB\u30C3\u30C8\u3057\u307E\u3057\u305F\u3002",
        resetSessionsFailed: "\u30BB\u30C3\u30B7\u30E7\u30F3\u306E\u30EA\u30BB\u30C3\u30C8\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002",
        settingsResetSessionsAndSettings: "\u30BB\u30C3\u30B7\u30E7\u30F3\u3068\u8A2D\u5B9A\u3092\u540C\u6642\u30EA\u30BB\u30C3\u30C8",
        settingsResetSessionsAndSettingsDesc: "\u4FDD\u5B58\u6E08\u307F\u30BB\u30C3\u30B7\u30E7\u30F3\u3068 Workspace++ \u8A2D\u5B9A\u3092\u307E\u3068\u3081\u3066\u521D\u671F\u5316\u3057\u307E\u3059\u3002",
        settingsResetSessionsAndSettingsBtn: "\u4E21\u65B9\u30EA\u30BB\u30C3\u30C8",
        confirmResetSessionsAndSettings: "\u30BB\u30C3\u30B7\u30E7\u30F3\u3068\u8A2D\u5B9A\u3092\u540C\u6642\u306B\u30EA\u30BB\u30C3\u30C8\u3057\u307E\u3059\u304B\uFF1F\u3053\u306E\u64CD\u4F5C\u306F\u5143\u306B\u623B\u305B\u307E\u305B\u3093\u3002",
        resetSessionsAndSettingsDone: "\u30BB\u30C3\u30B7\u30E7\u30F3\u3068\u8A2D\u5B9A\u3092\u30EA\u30BB\u30C3\u30C8\u3057\u307E\u3057\u305F\u3002",
        resetSessionsAndSettingsFailed: "\u30BB\u30C3\u30B7\u30E7\u30F3\u3068\u8A2D\u5B9A\u306E\u30EA\u30BB\u30C3\u30C8\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002",
        confirmDeleteSettingsHint: "\u78BA\u8A8D\u753B\u9762\u3092\u8868\u793A\u3057\u305F\u304F\u306A\u3044\u5834\u5408\u306F\u8A2D\u5B9A\u3078\u3002",
        // --- Groups ---
        groupCreated: function(n) {
          return "\u30B0\u30EB\u30FC\u30D7\u300C" + n + "\u300D\u3092\u4F5C\u6210\u3057\u307E\u3057\u305F";
        },
        groupDeleted: function(n) {
          return "\u30B0\u30EB\u30FC\u30D7\u300C" + n + "\u300D\u3092\u524A\u9664\u3057\u307E\u3057\u305F";
        },
        groupRenamed: function(o, n) {
          return "\u30B0\u30EB\u30FC\u30D7\u540D\u3092\u300C" + o + "\u300D\u304B\u3089\u300C" + n + "\u300D\u306B\u5909\u66F4\u3057\u307E\u3057\u305F";
        },
        groupAll: "\u3059\u3079\u3066",
        groupDuplicateName: "\u540C\u3058\u540D\u524D\u306E\u30B0\u30EB\u30FC\u30D7\u304C\u65E2\u306B\u5B58\u5728\u3057\u307E\u3059\u3002",
        groupEmptyName: "\u30B0\u30EB\u30FC\u30D7\u540D\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
        cmdSwitchGroup: "\u30B0\u30EB\u30FC\u30D7\u3092\u5207\u308A\u66FF\u3048",
        cmdExitGroup: "\u3059\u3079\u3066\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u8868\u793A\uFF08\u30B0\u30EB\u30FC\u30D7\u89E3\u9664\uFF09",
        cmdNextGroup: "\u6B21\u306E\u30B0\u30EB\u30FC\u30D7",
        cmdPreviousGroup: "\u524D\u306E\u30B0\u30EB\u30FC\u30D7",
        searchOverlayHelpWithGroups: "\u2191\u2193 \u79FB\u52D5  /  Tab \u30B0\u30EB\u30FC\u30D7  /  Enter \u5207\u66FF  /  \u21E7Enter \u4FDD\u5B58  /  \u232B \u524A\u9664  /  Esc \u9589\u3058\u308B",
        settingsSectionGroups: "\u30BB\u30C3\u30B7\u30E7\u30F3\u30B0\u30EB\u30FC\u30D7",
        contextToggleGroups: "\u30BB\u30C3\u30B7\u30E7\u30F3\u30B0\u30EB\u30FC\u30D7\u3092\u6709\u52B9\u5316",
        settingsSectionGroupsDesc: "\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u30B0\u30EB\u30FC\u30D7\u3067\u6574\u7406\u3057\u307E\u3059\u3002\u30AA\u30D5\u306B\u3059\u308B\u3068\u30B0\u30EB\u30FC\u30D7\u30BF\u30D6\u3068\u30B0\u30EB\u30FC\u30D7\u5207\u66FF\u64CD\u4F5C\u3092\u975E\u8868\u793A\u306B\u3057\u307E\u3059\u3002",
        settingsGroupCreate: "\u30B0\u30EB\u30FC\u30D7\u3092\u4F5C\u6210",
        settingsGroupCreateDesc: "\u65B0\u3057\u3044\u30BB\u30C3\u30B7\u30E7\u30F3\u30B0\u30EB\u30FC\u30D7\u3092\u4F5C\u6210\u3057\u307E\u3059\u3002",
        settingsGroupCreatePlaceholder: "\u30B0\u30EB\u30FC\u30D7\u540D...",
        settingsGroupCreateBtn: "\u4F5C\u6210",
        settingsGroupManageSessions: "\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u7BA1\u7406",
        settingsGroupManageSessionsDesc: "\u3053\u306E\u30B0\u30EB\u30FC\u30D7\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u8FFD\u52A0\u30FB\u524A\u9664\u3057\u307E\u3059\u3002",
        settingsGroupSessionCount: function(n) {
          return n + "\u4EF6\u306E\u30BB\u30C3\u30B7\u30E7\u30F3";
        },
        settingsGroupDelete: "\u30B0\u30EB\u30FC\u30D7\u3092\u524A\u9664",
        settingsGroupDeleteConfirm: function(n) {
          return "\u30B0\u30EB\u30FC\u30D7\u300C" + n + "\u300D\u3092\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F\u30BB\u30C3\u30B7\u30E7\u30F3\u306F\u524A\u9664\u3055\u308C\u307E\u305B\u3093\u3002";
        },
        confirmDeleteGroup: function(n) {
          return "\u30B0\u30EB\u30FC\u30D7\u300C" + n + "\u300D\u3092\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F\u30B0\u30EB\u30FC\u30D7\u5185\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u306F\u524A\u9664\u3055\u308C\u307E\u305B\u3093\u3002";
        },
        groupAddedSession: function(s, g) {
          return "\u300C" + s + "\u300D\u3092\u300C" + g + "\u300D\u306B\u8FFD\u52A0\u3057\u307E\u3057\u305F";
        },
        groupRemovedSession: function(s, g) {
          return "\u300C" + s + "\u300D\u3092\u300C" + g + "\u300D\u304B\u3089\u5916\u3057\u307E\u3057\u305F";
        },
        groupRemoveFromGroup: "\u30B0\u30EB\u30FC\u30D7\u304B\u3089\u5916\u3059",
        groupMoveToGroup: "\u30B0\u30EB\u30FC\u30D7\u306B\u79FB\u52D5",
        groupCreateNew: "\u65B0\u3057\u3044\u30B0\u30EB\u30FC\u30D7",
        groupCreatePlaceholder: "\u30B0\u30EB\u30FC\u30D7\u540D...",
        groupContextRename: "\u30B0\u30EB\u30FC\u30D7\u540D\u3092\u5909\u66F4",
        groupContextDelete: "\u30B0\u30EB\u30FC\u30D7\u3092\u524A\u9664",
        contextSwitchSession: "\u3053\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u306B\u5207\u308A\u66FF\u3048\u308B",
        contextRenameSession: "\u3053\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u540D\u3092\u5909\u66F4",
        contextDeleteSession: "\u3053\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u524A\u9664",
        contextDuplicateSession: "\u3053\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u8907\u88FD",
        contextReloadSession: "\u3053\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u518D\u8AAD\u307F\u8FBC\u307F",
        contextSaveSession: "\u3053\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u4FDD\u5B58",
        contextSaveCurrentLayoutToThisSession: "\u73FE\u5728\u306E\u30EC\u30A4\u30A2\u30A6\u30C8\u3092\u3053\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u306B\u4FDD\u5B58",
        groupRemoveAllSessions: "\u3059\u3079\u3066\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u3053\u306E\u30B0\u30EB\u30FC\u30D7\u304B\u3089\u5916\u3059",
        confirmRemoveAllFromGroup: function(g, n) {
          return "\u300C" + g + "\u300D\u304B\u3089 " + n + " \u4EF6\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u3059\u3079\u3066\u5916\u3057\u307E\u3059\u304B\uFF1F";
        },
        groupRemovedAllSessions: function(g) {
          return "\u300C" + g + "\u300D\u304B\u3089\u3059\u3079\u3066\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u5916\u3057\u307E\u3057\u305F";
        },
        contextDeleteAllGroups: "\u3059\u3079\u3066\u306E\u30B0\u30EB\u30FC\u30D7\u3092\u524A\u9664",
        confirmDeleteAllGroups: function(n) {
          return n + " \u500B\u306E\u30B0\u30EB\u30FC\u30D7\u3092\u3059\u3079\u3066\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F\u30BB\u30C3\u30B7\u30E7\u30F3\u306F\u524A\u9664\u3055\u308C\u307E\u305B\u3093\u3002";
        },
        deletedAllGroups: function(n) {
          return n + " \u500B\u306E\u30B0\u30EB\u30FC\u30D7\u3092\u524A\u9664\u3057\u307E\u3057\u305F";
        },
        contextDeleteAllSessions: "\u3059\u3079\u3066\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u524A\u9664",
        confirmDeleteAllSessions: function(n) {
          return n + " \u4EF6\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F\u30A2\u30AF\u30C6\u30A3\u30D6\u306A\u30BB\u30C3\u30B7\u30E7\u30F3\u306F\u6B8B\u308A\u307E\u3059\u3002";
        },
        deletedAllSessions: function(n) {
          return n + " \u4EF6\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u524A\u9664\u3057\u307E\u3057\u305F";
        },
        contextVersionHistory: "\u30D0\u30FC\u30B8\u30E7\u30F3\u5C65\u6B74",
        cmdVersionHistory: "\u30BB\u30C3\u30B7\u30E7\u30F3\u306E\u30D0\u30FC\u30B8\u30E7\u30F3\u5C65\u6B74\u3092\u8868\u793A",
        historyTitle: "\u30D0\u30FC\u30B8\u30E7\u30F3\u5C65\u6B74",
        historyEmpty: "\u3053\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u306E\u5C65\u6B74\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
        historyRestore: "\u5FA9\u5143",
        historyRestoreConfirm: function(name, time) {
          return "\u300C" + name + "\u300D\u306E\u30EC\u30A4\u30A2\u30A6\u30C8\u3092 " + time + " \u306E\u72B6\u614B\u306B\u5FA9\u5143\u3057\u307E\u3059\u304B\uFF1F";
        },
        historyRestored: function(name) {
          return "\u300C" + name + "\u300D\u306E\u30EC\u30A4\u30A2\u30A6\u30C8\u3092\u5FA9\u5143\u3057\u307E\u3057\u305F";
        },
        historyQuickRestored: function(name) {
          return "\u300C" + name + "\u300D\u3092\u76F4\u524D\u306E\u30EC\u30A4\u30A2\u30A6\u30C8\u306B\u5FA9\u5143\u3057\u307E\u3057\u305F";
        },
        historyNoEntries: "\u5FA9\u5143\u53EF\u80FD\u306A\u5C65\u6B74\u304C\u3042\u308A\u307E\u305B\u3093\u3002",
        historyToday: "\u4ECA\u65E5",
        historyYesterday: "\u6628\u65E5",
        historyThisWeek: "\u4ECA\u9031",
        historyFiles: function(n) {
          return n + " \u30D5\u30A1\u30A4\u30EB";
        },
        historyPanes: function(n) {
          return n + " \u30DA\u30A4\u30F3";
        },
        settingsVersionHistoryEnabled: "\u30D0\u30FC\u30B8\u30E7\u30F3\u5C65\u6B74\u3092\u6709\u52B9\u5316",
        settingsVersionHistoryEnabledDesc: "\u30BB\u30C3\u30B7\u30E7\u30F3\u3054\u3068\u306B\u30EC\u30A4\u30A2\u30A6\u30C8\u5909\u66F4\u306E\u5C65\u6B74\u3092\u4FDD\u6301\u3057\u307E\u3059\u3002",
        settingsVersionHistoryInterval: "\u30B9\u30CA\u30C3\u30D7\u30B7\u30E7\u30C3\u30C8\u9593\u9694\uFF08\u5206\uFF09",
        settingsVersionHistoryIntervalDesc: "\u30EC\u30A4\u30A2\u30A6\u30C8\u306E\u5909\u66F4\u3092\u78BA\u8A8D\u3057\u3066\u30B9\u30CA\u30C3\u30D7\u30B7\u30E7\u30C3\u30C8\u3092\u4FDD\u5B58\u3059\u308B\u983B\u5EA6\u3002",
        settingsVersionHistoryCtrlRmb: function() {
          return "\u30AF\u30A4\u30C3\u30AF\u5FA9\u5143 (" + (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "Cmd" : "Ctrl") + " + \u53F3\u30AF\u30EA\u30C3\u30AF)";
        },
        settingsVersionHistoryCtrlRmbDesc: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "Cmd" : "Ctrl") + "\u30AD\u30FC\u3092\u62BC\u3057\u306A\u304C\u3089\u30B9\u30C6\u30FC\u30BF\u30B9\u30D0\u30FC\u3092\u53F3\u30AF\u30EA\u30C3\u30AF\u3059\u308B\u3068\u76F4\u524D\u306E\u30EC\u30A4\u30A2\u30A6\u30C8\u3092\u5FA9\u5143\u3057\u307E\u3059\u3002";
        },
        settingsVersionHistoryConfirmRestore: "\u5FA9\u5143\u524D\u306B\u78BA\u8A8D",
        settingsVersionHistoryConfirmRestoreDesc: "\u30EC\u30A4\u30A2\u30A6\u30C8\u3092\u5FA9\u5143\u3059\u308B\u524D\u306B\u78BA\u8A8D\u30C0\u30A4\u30A2\u30ED\u30B0\u3092\u8868\u793A\u3057\u307E\u3059\u3002",
        rotationBackupSectionTitle: "\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7",
        rotationBackupCreate: "\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7\u3092\u4F5C\u6210\u3059\u308B",
        rotationBackupCreateBtn: "\u4ECA\u3059\u3050\u4F5C\u6210",
        rotationBackupCreated: "\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7\u3092\u4F5C\u6210\u3057\u307E\u3057\u305F\u3002",
        rotationBackupFailed: "\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7\u306E\u4F5C\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002",
        rotationBackupDesc: "\u4FDD\u5B58\u6642\u306B\u81EA\u52D5\u7684\u306B\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7\u3092\u4F5C\u6210\u3057\u307E\u3059\uFF081\u6642\u9593\u3054\u3068\u3001\u6700\u59273\u4E16\u4EE3\uFF09\u3002",
        rotationBackupRestore: "\u5FA9\u5143",
        rotationBackupRestoreConfirm: function(time, count) {
          return time + " \u306E\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7\u304B\u3089\u5FA9\u5143\u3057\u307E\u3059\u304B\uFF08" + count + " \u30BB\u30C3\u30B7\u30E7\u30F3\uFF09\uFF1F\u73FE\u5728\u306E\u30C7\u30FC\u30BF\u306F\u4E0A\u66F8\u304D\u3055\u308C\u307E\u3059\u3002";
        },
        rotationBackupRestored: "\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7\u304B\u3089\u5FA9\u5143\u3057\u307E\u3057\u305F\u3002",
        rotationBackupRestoreFailed: "\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7\u304B\u3089\u306E\u5FA9\u5143\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002",
        rotationBackupNone: "\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
        rotationBackupGeneration: function(count) {
          return count + " \u30BB\u30C3\u30B7\u30E7\u30F3";
        },
        frontmatterSessionNotFound: function(n) {
          return "\u30BB\u30C3\u30B7\u30E7\u30F3\u300C" + n + "\u300D\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\uFF08workspace-session\uFF09";
        },
        frontmatterAlreadyActive: function(n) {
          return "\u30BB\u30C3\u30B7\u30E7\u30F3\u300C" + n + "\u300D\u306F\u65E2\u306B\u30A2\u30AF\u30C6\u30A3\u30D6\u3067\u3059";
        }
      },
      ko: {
        settingsStatusBarModScrollSwitch: "Mod + \uC2A4\uD06C\uB864\uB85C \uC138\uC158 \uC804\uD658",
        settingsStatusBarModScrollSwitchDesc: "\uC0C1\uD0DC \uD45C\uC2DC\uC904 \uD56D\uBAA9 \uC704\uC5D0\uC11C \uC120\uD0DD\uD55C \uBCF4\uC870 \uD0A4\uB97C \uB204\uB978 \uCC44 \uC138\uB85C \uC2A4\uD06C\uB864\uD558\uBA74 \uC138\uC158\uC744 \uC804\uD658\uD569\uB2C8\uB2E4. \uD2B8\uB799\uD328\uB4DC \uC624\uC791\uB3D9\uC744 \uC904\uC774\uAE30 \uC704\uD574 \uC784\uACC4\uAC12\uACFC \uCFE8\uB2E4\uC6B4\uC744 \uC0AC\uC6A9\uD569\uB2C8\uB2E4.",
        modalTitle: "\uC138\uC158 \uAD00\uB9AC",
        savePlaceholder: "\uC0C8 \uC138\uC158 \uC774\uB984...",
        filterPlaceholder: "\uC138\uC158 \uD544\uD130...",
        settingsShowFilterInput: "\uC138\uC158 \uD544\uD130 \uD45C\uC2DC",
        settingsShowFilterInputDesc: "\uC138\uC158 \uAD00\uB9AC\uC790\uC5D0 \uD14D\uC2A4\uD2B8 \uD544\uD130\uB97C \uD45C\uC2DC\uD558\uC5EC \uC138\uC158\uC744 \uBE60\uB974\uAC8C \uCC3E\uC2B5\uB2C8\uB2E4.",
        settingsOverlayDefaultFocus: "\uC624\uBC84\uB808\uC774 \uAE30\uBCF8 \uD3EC\uCEE4\uC2A4",
        settingsOverlayDefaultFocusDesc: "\uC138\uC158 \uAD00\uB9AC\uC790\uB97C \uC5F4 \uB54C \uD3EC\uCEE4\uC2A4\uB97C \uBC1B\uB294 \uC694\uC18C\uB97C \uC120\uD0DD\uD569\uB2C8\uB2E4.",
        settingsOverlayFocusCurrentSession: "\uD604\uC7AC \uC138\uC158",
        settingsOverlayFocusSessionFilter: "\uC138\uC158 \uD544\uD130",
        settingsOverlayFocusSessionCreate: "\uC138\uC158 \uC0DD\uC131",
        settingsSectionSessionManager: "\uC138\uC158 \uAD00\uB9AC\uC790",
        settingsShowActiveSwitchCommand: "\uBA85\uB839 \uD314\uB808\uD2B8\uC5D0 \uD65C\uC131 \uC138\uC158 \uD45C\uC2DC",
        settingsShowActiveSwitchCommandDesc: "\uBA85\uB839 \uD314\uB808\uD2B8\uC5D0\uC11C \uD604\uC7AC \uD65C\uC131 \uC138\uC158\uC758 \uC804\uD658 \uBA85\uB839\uC744 \uD45C\uC2DC\uD569\uB2C8\uB2E4. \uB2E8\uCD95\uD0A4\uB294 \uC774 \uC124\uC815\uC5D0 \uAD00\uACC4\uC5C6\uC774 \uD56D\uC0C1 \uC791\uB3D9\uD569\uB2C8\uB2E4.",
        settingsNumberedSwitchCommands: "\uBC88\uD638 \uC804\uD658 \uBA85\uB839",
        settingsNumberedSwitchCommandsDesc: "\uBC88\uD638 \uC2AC\uB86F(1\u20139)\uC758 \uC804\uD658 \uBA85\uB839\uC744 \uB4F1\uB85D\uD558\uC5EC \uB2E8\uCD95\uD0A4\uC5D0 \uD560\uB2F9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uBE44\uD65C\uC131\uD654\uD558\uBA74 \uBAA8\uB4E0 \uC138\uC158\uC774 \uC774\uB984 \uAE30\uBC18 \uBA85\uB839\uC744 \uC0AC\uC6A9\uD569\uB2C8\uB2E4.",
        save: "\uB9CC\uB4E4\uAE30",
        load: "\uC804\uD658",
        saveInline: "\uC800\uC7A5",
        active: "\uC0AC\uC6A9 \uC911",
        modifiedJustNow: "\uBC29\uAE08 \uC218\uC815\uB428",
        modifiedMinutes: function(n) {
          return n + "\uBD84 \uC804 \uC218\uC815\uB428";
        },
        modifiedHours: function(n) {
          return n + "\uC2DC\uAC04 \uC804 \uC218\uC815\uB428";
        },
        modifiedDays: function(n) {
          return n + "\uC77C \uC804 \uC218\uC815\uB428";
        },
        duplicateName: "\uAC19\uC740 \uC774\uB984\uC758 \uC138\uC158\uC774 \uC774\uBBF8 \uC874\uC7AC\uD569\uB2C8\uB2E4.",
        emptyName: "\uC138\uC158 \uC774\uB984\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.",
        created: function(n) {
          return "\u201C" + n + "\u201D \uC138\uC158\uC744 \uB9CC\uB4E4\uC5C8\uC2B5\uB2C8\uB2E4";
        },
        deleted: function(n) {
          return "\u201C" + n + "\u201D \uC138\uC158\uC744 \uC0AD\uC81C\uD588\uC2B5\uB2C8\uB2E4";
        },
        loaded: function(n) {
          return "\u201C" + n + "\u201D \uC138\uC158\uC73C\uB85C \uC804\uD658\uD588\uC2B5\uB2C8\uB2E4";
        },
        renamed: function(o, n) {
          return "\uC774\uB984 \uBCC0\uACBD: \u201C" + o + "\u201D \u2192 \u201C" + n + "\u201D";
        },
        confirmDelete: function(n) {
          return "\u201C" + n + "\u201D \uC138\uC158\uC744 \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?";
        },
        confirmDeleteActive: function(n) {
          return "\u201C" + n + "\u201D \uC138\uC158\uC740 \uD604\uC7AC \uC0AC\uC6A9 \uC911\uC785\uB2C8\uB2E4. \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?";
        },
        confirmSaveSession: function(n) {
          return '\uC138\uC158 "' + n + '"\uC744(\uB97C) \uC800\uC7A5\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?';
        },
        confirmReloadSession: function(n) {
          return '\uC138\uC158 "' + n + '"\uC744(\uB97C) \uB2E4\uC2DC \uBD88\uB7EC\uC624\uC2DC\uACA0\uC2B5\uB2C8\uAE4C? \uC800\uC7A5\uD558\uC9C0 \uC54A\uC740 \uBCC0\uACBD \uC0AC\uD56D\uC774 \uC190\uC2E4\uB429\uB2C8\uB2E4.';
        },
        renameTitle: "\uC138\uC158 \uC774\uB984 \uBCC0\uACBD",
        renamePlaceholder: "\uC0C8 \uC774\uB984...",
        noSession: "\uC138\uC158 \uC5C6\uC74C",
        cannotDeleteLast: "\uB9C8\uC9C0\uB9C9 \uC138\uC158\uC740 \uC0AD\uC81C\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
        confirmBulkDelete: function(n) {
          return n + "\uAC1C \uC138\uC158\uC744 \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?";
        },
        bulkDeleted: function(n) {
          return n + "\uAC1C \uC138\uC158\uC744 \uC0AD\uC81C\uD588\uC2B5\uB2C8\uB2E4";
        },
        bulkDelete: function(n) {
          return n + "\uAC1C \uC138\uC158 \uC0AD\uC81C";
        },
        cmdManage: "\uC138\uC158 \uAD00\uB9AC",
        cmdCreate: "\uC0C8 \uC138\uC158 \uB9CC\uB4E4\uAE30",
        cmdRename: "\uD604\uC7AC \uC138\uC158 \uC774\uB984 \uBCC0\uACBD",
        cmdDelete: "\uD604\uC7AC \uC138\uC158 \uC0AD\uC81C",
        cmdNewEmpty: "\uBE48 \uC138\uC158 \uB9CC\uB4E4\uAE30",
        cmdDuplicate: "\uD604\uC7AC \uC138\uC158 \uBCF5\uC81C",
        duplicated: function(n) {
          return "\u201C" + n + "\u201D(\uC73C)\uB85C \uBCF5\uC81C\uD588\uC2B5\uB2C8\uB2E4";
        },
        deselect: "\uC120\uD0DD \uD574\uC81C",
        footerDragReorder: "\uB4DC\uB798\uADF8\uD558\uC5EC \uC815\uB82C",
        footerDragToGroup: "\uADF8\uB8F9 \uD0ED\uC73C\uB85C \uB4DC\uB798\uADF8\uD558\uC5EC \uC774\uB3D9",
        defaultLabel: "\uFF08\uAE30\uBCF8\uFF09",
        rename: "\uC774\uB984 \uBCC0\uACBD",
        delete: "\uC0AD\uC81C",
        remove: "\uC81C\uAC70",
        cancel: "\uCDE8\uC18C",
        ribbonTooltip: "Workspace++",
        cmdSwitchTo: function(n, name) {
          return name ? "\uC138\uC158 " + n + " \uC804\uD658: " + name : "\uC138\uC158 " + n + " \uC804\uD658";
        },
        cmdSwitchToNamed: function(name) {
          return '"' + name + '"(\uC73C)\uB85C \uC804\uD658';
        },
        cmdPrevious: "\uC774\uC804 \uC138\uC158",
        cmdNext: "\uB2E4\uC74C \uC138\uC158",
        cmdSaveCurrent: "\uD604\uC7AC \uC138\uC158 \uC800\uC7A5",
        cmdSaveAs: "\uD604\uC7AC \uC138\uC158\uC744 \uB2E4\uB978 \uC774\uB984\uC73C\uB85C \uC800\uC7A5...",
        cmdToggleAutoSave: "\uC804\uD658 \uC2DC \uC790\uB3D9 \uC800\uC7A5 \uC804\uD658",
        cmdEnableAutoSave: "\uC804\uD658 \uC2DC \uC790\uB3D9 \uC800\uC7A5 \uCF1C\uAE30",
        cmdDisableAutoSave: "\uC804\uD658 \uC2DC \uC790\uB3D9 \uC800\uC7A5 \uB044\uAE30",
        cmdSearchOverlay: "\uC138\uC158 \uAC80\uC0C9",
        switchLeft: "\uC67C\uCABD",
        switchRight: "\uC624\uB978\uCABD",
        switchGroup: "\uADF8\uB8F9",
        keyTab: "Tab",
        savedSession: function(n) {
          return "\u201C" + n + "\u201D \uC138\uC158\uC744 \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4";
        },
        savedAs: function(n) {
          return "\u201C" + n + "\u201D(\uC73C)\uB85C \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4";
        },
        noChanges: "\uC800\uC7A5\uD560 \uBCC0\uACBD \uC0AC\uD56D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4",
        autoSaveEnabled: "\uC138\uC158 \uC804\uD658 \uC2DC \uC790\uB3D9 \uC800\uC7A5\uC744 \uCF30\uC2B5\uB2C8\uB2E4.",
        autoSaveDisabled: "\uC138\uC158 \uC804\uD658 \uC2DC \uC790\uB3D9 \uC800\uC7A5\uC744 \uAED0\uC2B5\uB2C8\uB2E4.",
        confirmUnsavedSwitch: function(n) {
          return "\uD604\uC7AC \uC138\uC158\uC5D0 \uC800\uC7A5\uB418\uC9C0 \uC54A\uC740 \uBCC0\uACBD \uC0AC\uD56D\uC774 \uC788\uC2B5\uB2C8\uB2E4. \u201C" + n + "\u201D \uC138\uC158\uC73C\uB85C \uC804\uD658\uD560\uAE4C\uC694?";
        },
        saveAndSwitch: "\uC800\uC7A5 \uD6C4 \uC804\uD658",
        switchWithoutSaving: "\uC800\uC7A5\uD558\uC9C0 \uC54A\uACE0 \uC804\uD658",
        sessionAutoName: function(n) {
          return "\uC0C8 \uC138\uC158 " + n;
        },
        noFilteredSessions: "\uC77C\uCE58\uD558\uB294 \uC138\uC158\uC774 \uC5C6\uC2B5\uB2C8\uB2E4",
        noGroupSessions: "\uC774 \uADF8\uB8F9\uC5D0 \uC138\uC158\uC774 \uC5C6\uC2B5\uB2C8\uB2E4",
        searchOverlayPlaceholder: "\uC785\uB825\uD558\uC5EC \uC138\uC158 \uD544\uD130\uB9C1...",
        searchOverlayHelp: "\u2191\u2193 \uC774\uB3D9  /  Enter \uC804\uD658  /  \u21E7Enter \uC800\uC7A5  /  \u232B \uC0AD\uC81C  /  Esc \uB2EB\uAE30",
        backupRestored: "Workspace++: \uBC31\uC5C5\uC5D0\uC11C \uC138\uC158\uC744 \uBCF5\uC6D0\uD588\uC2B5\uB2C8\uB2E4.",
        settingsLanguage: "\uC5B8\uC5B4",
        settingsLanguageDesc: "\uD50C\uB7EC\uADF8\uC778 UI \uC5B8\uC5B4. \uBA85\uB839\uC5B4 \uC774\uB984\uC5D0 \uC801\uC6A9\uD558\uB824\uBA74 Obsidian\uC744 \uB2E4\uC2DC \uC2DC\uC791\uD558\uC138\uC694.",
        settingsSectionGeneral: "\uC77C\uBC18",
        settingsTabSessions: "\uC138\uC158",
        settingsSectionSwitching: "\uC138\uC158 \uC790\uB3D9 \uC800\uC7A5",
        settingsSectionSwitchPreview: "\uC138\uC158 \uC804\uD658",
        settingsSectionDeletion: "\uC138\uC158 \uC0AD\uC81C",
        settingsLangAuto: "\uC790\uB3D9 (\uC2DC\uC2A4\uD15C \uC5B8\uC5B4)",
        settingsTranslationHelp: "\uBC88\uC5ED \uC624\uB958\uB97C \uBC1C\uACAC\uD558\uC168\uB098\uC694? GitHub\uC5D0\uC11C issue \uB610\uB294 Pull request\uB97C \uBCF4\uB0B4\uC8FC\uC138\uC694.",
        settingsPreviewHeading: "\uC804\uD658 \uC804 \uD604\uC7AC \uC138\uC158 \uD45C\uC2DC",
        settingsPreviewDesc: "\uB2E8\uCD95\uD0A4\uB85C \uC138\uC158\uC744 \uC804\uD658\uD560 \uB54C \uCCAB \uBC88\uC9F8 \uC785\uB825\uC5D0\uC11C\uB294 \uC804\uD658\uD558\uC9C0 \uC54A\uACE0 \uD604\uC7AC \uC704\uCE58\uB9CC \uD45C\uC2DC\uD569\uB2C8\uB2E4.",
        settingsPreviewNext: "\uB2E4\uC74C \uC138\uC158",
        settingsPreviewPrevious: "\uC774\uC804 \uC138\uC158",
        settingsHotkeys: "\uB2E8\uCD95\uD0A4",
        settingsHotkeysBtn: "\uB2E8\uCD95\uD0A4 \uC124\uC815 \uC5F4\uAE30",
        contextOpenSettings: "\uC124\uC815 \uC5F4\uAE30",
        contextCustomizeClicks: "\uD074\uB9AD \uB3D9\uC791 \uC0AC\uC6A9\uC790 \uC9C0\uC815",
        settingsSectionStatusBar: "\uC0C1\uD0DC \uD45C\uC2DC\uC904 \uD074\uB9AD \uB3D9\uC791",
        statusBarSlotClick: "\uD074\uB9AD",
        statusBarSlotAltClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + \uD074\uB9AD";
        },
        statusBarSlotModClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + \uD074\uB9AD";
        },
        statusBarSlotShiftClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + \uD074\uB9AD";
        },
        statusBarSlotRightClick: "\uC6B0\uD074\uB9AD",
        statusBarSlotAltRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + \uC6B0\uD074\uB9AD";
        },
        statusBarSlotModRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + \uC6B0\uD074\uB9AD";
        },
        statusBarSlotShiftRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + \uC6B0\uD074\uB9AD";
        },
        statusBarSlotMiddleClick: "\uAC00\uC6B4\uB370 \uD074\uB9AD",
        statusBarSlotAltMiddleClick: modifiedClickLabel("\uAC00\uC6B4\uB370 \uD074\uB9AD", "\u2325", "Alt"),
        statusBarSlotModMiddleClick: modifiedClickLabel("\uAC00\uC6B4\uB370 \uD074\uB9AD", "\u2318", "Ctrl"),
        statusBarSlotShiftMiddleClick: modifiedClickLabel("\uAC00\uC6B4\uB370 \uD074\uB9AD", "\u21E7", "Shift"),
        statusBarActionNone: "\uC544\uBB34\uAC83\uB3C4 \uD558\uC9C0 \uC54A\uC74C",
        statusBarActionQuickSwitcher: "\uBE60\uB978 \uC804\uD658\uAE30 \uC5F4\uAE30",
        statusBarActionSessionManager: "\uC138\uC158 \uAD00\uB9AC\uC790 \uC5F4\uAE30",
        statusBarActionSaveSession: "\uC138\uC158 \uC800\uC7A5",
        statusBarActionReloadWithoutSaving: "\uC800\uC7A5\uD558\uC9C0 \uC54A\uACE0 \uB2E4\uC2DC \uB85C\uB4DC",
        statusBarActionVersionHistory: "\uBC84\uC804 \uAE30\uB85D \uD45C\uC2DC",
        statusBarActionRestoreLatestHistory: "\uCD5C\uC2E0 \uAE30\uB85D \uBCF5\uC6D0",
        statusBarActionSessionMenu: "\uC138\uC158 \uBA54\uB274",
        statusBarActionSettingsMenu: "\uC124\uC815 \uBA54\uB274",
        contextResetOverlayPosition: "\uC704\uCE58\uC640 \uD06C\uAE30 \uCD08\uAE30\uD654",
        settingsConfirmDelete: "\uC138\uC158 \uC0AD\uC81C \uC804 \uD655\uC778",
        settingsConfirmDeleteDesc: "\uC138\uC158\uC744 \uC0AD\uC81C\uD558\uAE30 \uC804\uC5D0 \uD655\uC778 \uB300\uD654 \uC0C1\uC790\uB97C \uD45C\uC2DC\uD569\uB2C8\uB2E4.",
        settingsConfirmQuickActions: "\uBE60\uB978 \uC804\uD658\uAE30\uC5D0\uC11C \uC800\uC7A5/\uB2E4\uC2DC \uBD88\uB7EC\uC624\uAE30 \uD655\uC778",
        settingsConfirmQuickActionsDesc: "\uBE60\uB978 \uC804\uD658\uAE30\uC5D0\uC11C \uC138\uC158\uC744 \uC800\uC7A5\uD558\uAC70\uB098 \uB2E4\uC2DC \uBD88\uB7EC\uC624\uAE30 \uC804\uC5D0 \uD655\uC778 \uB300\uD654\uC0C1\uC790\uB97C \uD45C\uC2DC\uD569\uB2C8\uB2E4.",
        settingsAutoSaveOnSwitch: "\uC790\uB3D9 \uC800\uC7A5 \uBAA8\uB4DC",
        settingsAutoSaveOnSwitchDesc: "\uC138\uC158 \uC804\uD658 \uC2DC \uD604\uC7AC \uC138\uC158\uC744 \uC790\uB3D9\uC73C\uB85C \uC800\uC7A5\uD569\uB2C8\uB2E4 (\uAE30\uBCF8\uAC12: \uCF1C\uC9D0). \uB044\uBA74 \uC800\uC7A5\uACFC \uB2E4\uC2DC \uBD88\uB7EC\uC624\uAE30\uB97C \uC218\uB3D9\uC73C\uB85C \uC81C\uC5B4\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
        settingsWarnUnsavedSwitch: "\uC800\uC7A5 \uC5C6\uC774 \uC804\uD658 \uC804 \uACBD\uACE0",
        settingsWarnUnsavedSwitchDesc: "\uC790\uB3D9 \uC800\uC7A5\uC774 \uAEBC\uC838 \uC788\uACE0 \uD604\uC7AC \uC138\uC158\uC5D0 \uC800\uC7A5\uB418\uC9C0 \uC54A\uC740 \uBCC0\uACBD \uC0AC\uD56D\uC774 \uC788\uC73C\uBA74 \uC804\uD658 \uC804\uC5D0 \uACBD\uACE0\uB97C \uD45C\uC2DC\uD569\uB2C8\uB2E4.",
        settingsStatusBarQuickSwitcher: "\uC0C1\uD0DC \uD45C\uC2DC\uC904 \uD074\uB9AD \uC2DC \uBE60\uB978 \uC804\uD658\uAE30 \uC5F4\uAE30",
        settingsStatusBarQuickSwitcherDesc: "\uD65C\uC131\uD654\uD558\uBA74 \uC0C1\uD0DC \uD45C\uC2DC\uC904\uC744 \uD074\uB9AD\uD560 \uB54C \uC804\uCCB4 \uC138\uC158 \uAD00\uB9AC\uC790 \uB300\uC2E0 \uBE60\uB978 \uC804\uD658\uAE30\uAC00 \uC5F4\uB9BD\uB2C8\uB2E4.",
        settingsResetSessions: "\uC138\uC158 \uCD08\uAE30\uD654",
        settingsResetSessionsDesc: "\uC800\uC7A5\uB41C \uBAA8\uB4E0 \uC138\uC158\uC744 \uC0AD\uC81C\uD558\uACE0 \uD604\uC7AC \uB808\uC774\uC544\uC6C3 \uAE30\uC900\uC758 \uC0C8 \uAE30\uBCF8 \uC138\uC158 \uD558\uB098\uB9CC \uB0A8\uAE41\uB2C8\uB2E4.",
        settingsResetSessionsBtn: "\uCD08\uAE30\uD654",
        confirmResetSessions: "\uBAA8\uB4E0 \uC138\uC158\uC744 \uAE30\uBCF8 \uC0C1\uD0DC\uB85C \uCD08\uAE30\uD654\uD560\uAE4C\uC694? \uC774 \uC791\uC5C5\uC740 \uB418\uB3CC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
        resetSessionsHint: "\uC774 \uC791\uC5C5\uC740 \uC800\uC7A5\uB41C \uBAA8\uB4E0 \uC138\uC158\uC744 \uC0AD\uC81C\uD558\uACE0 \uAE30\uBCF8 \uC138\uC158 \uD558\uB098\uB9CC \uB0A8\uAE41\uB2C8\uB2E4.",
        resetSessionsDone: "\uC138\uC158\uC774 \uAE30\uBCF8 \uC0C1\uD0DC\uB85C \uCD08\uAE30\uD654\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
        resetSessionsFailed: "\uC138\uC158 \uCD08\uAE30\uD654\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.",
        confirmDeleteSettingsHint: "\uC774 \uD655\uC778\uC744 \uBE44\uD65C\uC131\uD654\uD558\uB824\uBA74 \uC124\uC815\uC73C\uB85C \uC774\uB3D9\uD558\uC138\uC694.",
        // --- Groups ---
        groupCreated: function(n) {
          return '\uADF8\uB8F9 "' + n + '" \uC0DD\uC131\uB428';
        },
        groupDeleted: function(n) {
          return '\uADF8\uB8F9 "' + n + '" \uC0AD\uC81C\uB428';
        },
        groupRenamed: function(o, n) {
          return '\uADF8\uB8F9 \uC774\uB984 \uBCC0\uACBD: "' + o + '" \u2192 "' + n + '"';
        },
        groupAll: "\uC804\uCCB4",
        groupDuplicateName: "\uAC19\uC740 \uC774\uB984\uC758 \uADF8\uB8F9\uC774 \uC774\uBBF8 \uC788\uC2B5\uB2C8\uB2E4.",
        groupEmptyName: "\uADF8\uB8F9 \uC774\uB984\uC744 \uBE44\uC6CC\uB458 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
        cmdSwitchGroup: "\uADF8\uB8F9 \uC804\uD658",
        cmdExitGroup: "\uBAA8\uB4E0 \uC138\uC158 \uD45C\uC2DC (\uADF8\uB8F9 \uD574\uC81C)",
        cmdNextGroup: "\uB2E4\uC74C \uADF8\uB8F9",
        cmdPreviousGroup: "\uC774\uC804 \uADF8\uB8F9",
        searchOverlayHelpWithGroups: "\u2191\u2193 \uC774\uB3D9  /  Tab \uADF8\uB8F9  /  Enter \uC804\uD658  /  \u21E7Enter \uC800\uC7A5  /  \u232B \uC0AD\uC81C  /  Esc \uB2EB\uAE30",
        settingsSectionGroups: "\uC138\uC158 \uADF8\uB8F9",
        contextToggleGroups: "\uC138\uC158 \uADF8\uB8F9 \uD65C\uC131\uD654",
        settingsSectionGroupsDesc: "\uC138\uC158\uC744 \uADF8\uB8F9\uC73C\uB85C \uC815\uB9AC\uD569\uB2C8\uB2E4. \uB044\uBA74 \uADF8\uB8F9 \uD0ED\uACFC \uADF8\uB8F9 \uC804\uD658 \uB3D9\uC791\uC774 \uC228\uACA8\uC9D1\uB2C8\uB2E4.",
        settingsGroupCreate: "\uADF8\uB8F9 \uB9CC\uB4E4\uAE30",
        settingsGroupCreateDesc: "\uC0C8 \uC138\uC158 \uADF8\uB8F9\uC744 \uB9CC\uB4ED\uB2C8\uB2E4.",
        settingsGroupCreatePlaceholder: "\uADF8\uB8F9 \uC774\uB984...",
        settingsGroupCreateBtn: "\uB9CC\uB4E4\uAE30",
        settingsGroupManageSessions: "\uC138\uC158 \uAD00\uB9AC",
        settingsGroupManageSessionsDesc: "\uC774 \uADF8\uB8F9\uC5D0\uC11C \uC138\uC158\uC744 \uCD94\uAC00\uD558\uAC70\uB098 \uC81C\uAC70\uD569\uB2C8\uB2E4.",
        settingsGroupSessionCount: function(n) {
          return n + "\uAC1C \uC138\uC158";
        },
        settingsGroupDelete: "\uADF8\uB8F9 \uC0AD\uC81C",
        settingsGroupDeleteConfirm: function(n) {
          return '\uADF8\uB8F9 "' + n + '"\uC744(\uB97C) \uC0AD\uC81C\uD560\uAE4C\uC694? \uC138\uC158\uC740 \uC0AD\uC81C\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.';
        },
        confirmDeleteGroup: function(n) {
          return '\uADF8\uB8F9 "' + n + '"\uC744(\uB97C) \uC0AD\uC81C\uD560\uAE4C\uC694? \uADF8\uB8F9 \uC548\uC758 \uC138\uC158\uC740 \uC0AD\uC81C\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.';
        },
        groupAddedSession: function(s, g) {
          return '"' + s + '"\uC744(\uB97C) "' + g + '"\uC5D0 \uCD94\uAC00\uD588\uC2B5\uB2C8\uB2E4';
        },
        groupRemovedSession: function(s, g) {
          return '"' + s + '"\uC744(\uB97C) "' + g + '"\uC5D0\uC11C \uC81C\uAC70\uD588\uC2B5\uB2C8\uB2E4';
        },
        groupRemoveFromGroup: "\uADF8\uB8F9\uC5D0\uC11C \uC81C\uAC70",
        groupMoveToGroup: "\uADF8\uB8F9\uC73C\uB85C \uC774\uB3D9",
        groupCreateNew: "\uC0C8 \uADF8\uB8F9",
        groupCreatePlaceholder: "\uADF8\uB8F9 \uC774\uB984...",
        groupContextRename: "\uADF8\uB8F9 \uC774\uB984 \uBCC0\uACBD",
        groupContextDelete: "\uADF8\uB8F9 \uC0AD\uC81C",
        contextSwitchSession: "\uC774 \uC138\uC158\uC73C\uB85C \uC804\uD658",
        contextRenameSession: "\uC774 \uC138\uC158 \uC774\uB984 \uBCC0\uACBD",
        contextDeleteSession: "\uC774 \uC138\uC158 \uC0AD\uC81C",
        contextDuplicateSession: "\uC774 \uC138\uC158 \uBCF5\uC81C",
        contextReloadSession: "\uC774 \uC138\uC158 \uB2E4\uC2DC \uBD88\uB7EC\uC624\uAE30",
        contextSaveSession: "\uC774 \uC138\uC158 \uC800\uC7A5",
        groupRemoveAllSessions: "\uC774 \uADF8\uB8F9\uC5D0\uC11C \uBAA8\uB4E0 \uC138\uC158 \uC81C\uAC70",
        confirmRemoveAllFromGroup: function(g, n) {
          return '"' + g + '"\uC5D0\uC11C ' + n + "\uAC1C \uC138\uC158\uC744 \uBAA8\uB450 \uC81C\uAC70\uD560\uAE4C\uC694?";
        },
        groupRemovedAllSessions: function(g) {
          return '"' + g + '"\uC5D0\uC11C \uBAA8\uB4E0 \uC138\uC158\uC744 \uC81C\uAC70\uD588\uC2B5\uB2C8\uB2E4';
        },
        contextDeleteAllGroups: "\uBAA8\uB4E0 \uADF8\uB8F9 \uC0AD\uC81C",
        confirmDeleteAllGroups: function(n) {
          return n + "\uAC1C \uADF8\uB8F9\uC744 \uBAA8\uB450 \uC0AD\uC81C\uD560\uAE4C\uC694? \uC138\uC158\uC740 \uC0AD\uC81C\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.";
        },
        deletedAllGroups: function(n) {
          return n + "\uAC1C \uADF8\uB8F9 \uC0AD\uC81C\uB428";
        },
        contextDeleteAllSessions: "\uBAA8\uB4E0 \uC138\uC158 \uC0AD\uC81C",
        confirmDeleteAllSessions: function(n) {
          return n + "\uAC1C \uC138\uC158\uC744 \uC0AD\uC81C\uD560\uAE4C\uC694? \uD65C\uC131 \uC138\uC158\uC740 \uC720\uC9C0\uB429\uB2C8\uB2E4.";
        },
        deletedAllSessions: function(n) {
          return n + "\uAC1C \uC138\uC158 \uC0AD\uC81C\uB428";
        },
        contextVersionHistory: "\uBC84\uC804 \uAE30\uB85D",
        cmdVersionHistory: "\uC138\uC158 \uBC84\uC804 \uAE30\uB85D \uBCF4\uAE30",
        historyTitle: "\uBC84\uC804 \uAE30\uB85D",
        historyEmpty: "\uC774 \uC138\uC158\uC758 \uBC84\uC804 \uAE30\uB85D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
        historyRestore: "\uBCF5\uC6D0",
        historyRestoreConfirm: function(name, time) {
          return '"' + name + '"\uC758 \uB808\uC774\uC544\uC6C3\uC744 ' + time + " \uC0C1\uD0DC\uB85C \uBCF5\uC6D0\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?";
        },
        historyRestored: function(name) {
          return '"' + name + '"\uC758 \uB808\uC774\uC544\uC6C3\uC744 \uBCF5\uC6D0\uD588\uC2B5\uB2C8\uB2E4';
        },
        historyQuickRestored: function(name) {
          return '"' + name + '"\uC758 \uC774\uC804 \uB808\uC774\uC544\uC6C3\uC744 \uBE60\uB974\uAC8C \uBCF5\uC6D0\uD588\uC2B5\uB2C8\uB2E4';
        },
        historyNoEntries: "\uBCF5\uC6D0\uD560 \uC774\uC804 \uB808\uC774\uC544\uC6C3\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
        historyToday: "\uC624\uB298",
        historyYesterday: "\uC5B4\uC81C",
        historyThisWeek: "\uC774\uBC88 \uC8FC",
        historyFiles: function(n) {
          return n + "\uAC1C \uD30C\uC77C";
        },
        historyPanes: function(n) {
          return n + "\uAC1C \uD328\uB110";
        },
        settingsVersionHistoryEnabled: "\uBC84\uC804 \uAE30\uB85D \uD65C\uC131\uD654",
        settingsVersionHistoryEnabledDesc: "\uAC01 \uC138\uC158\uC758 \uB808\uC774\uC544\uC6C3 \uBCC0\uACBD \uAE30\uB85D\uC744 \uC720\uC9C0\uD569\uB2C8\uB2E4.",
        settingsVersionHistoryInterval: "\uC2A4\uB0C5\uC0F7 \uAC04\uACA9 (\uBD84)",
        settingsVersionHistoryIntervalDesc: "\uB808\uC774\uC544\uC6C3 \uBCC0\uACBD\uC744 \uD655\uC778\uD558\uACE0 \uC2A4\uB0C5\uC0F7\uC744 \uC800\uC7A5\uD558\uB294 \uBE48\uB3C4.",
        settingsVersionHistoryCtrlRmb: platformLabel("\uBE60\uB978 \uBCF5\uC6D0 (Cmd + \uC6B0\uD074\uB9AD)", "\uBE60\uB978 \uBCF5\uC6D0 (Ctrl + \uC6B0\uD074\uB9AD)"),
        settingsVersionHistoryCtrlRmbDesc: platformLabel("Cmd \uD0A4\uB97C \uB204\uB978 \uCC44 \uC0C1\uD0DC \uD45C\uC2DC\uC904\uC744 \uC6B0\uD074\uB9AD\uD558\uBA74 \uC774\uC804 \uB808\uC774\uC544\uC6C3\uC744 \uBCF5\uC6D0\uD569\uB2C8\uB2E4.", "Ctrl \uD0A4\uB97C \uB204\uB978 \uCC44 \uC0C1\uD0DC \uD45C\uC2DC\uC904\uC744 \uC6B0\uD074\uB9AD\uD558\uBA74 \uC774\uC804 \uB808\uC774\uC544\uC6C3\uC744 \uBCF5\uC6D0\uD569\uB2C8\uB2E4."),
        settingsVersionHistoryConfirmRestore: "\uBCF5\uC6D0 \uC804 \uD655\uC778",
        settingsVersionHistoryConfirmRestoreDesc: "\uC774\uC804 \uB808\uC774\uC544\uC6C3\uC744 \uBCF5\uC6D0\uD558\uAE30 \uC804\uC5D0 \uD655\uC778 \uB300\uD654 \uC0C1\uC790\uB97C \uD45C\uC2DC\uD569\uB2C8\uB2E4.",
        rotationBackupSectionTitle: "\uBC31\uC5C5",
        rotationBackupCreate: "\uBC31\uC5C5 \uB9CC\uB4E4\uAE30",
        rotationBackupCreateBtn: "\uC9C0\uAE08 \uB9CC\uB4E4\uAE30",
        rotationBackupCreated: "\uBC31\uC5C5\uC774 \uC0DD\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
        rotationBackupFailed: "\uBC31\uC5C5 \uC0DD\uC131\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.",
        rotationBackupDesc: "\uC800\uC7A5 \uC2DC \uC790\uB3D9\uC73C\uB85C \uBC31\uC5C5\uC774 \uC0DD\uC131\uB429\uB2C8\uB2E4(\uB9E4\uC2DC\uAC04, \uCD5C\uB300 3\uC138\uB300).",
        rotationBackupRestore: "\uBCF5\uC6D0",
        rotationBackupRestoreConfirm: function(time, count) {
          return time + "\uC758 \uBC31\uC5C5\uC5D0\uC11C \uBCF5\uC6D0\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C(" + count + "\uAC1C \uC138\uC158)? \uD604\uC7AC \uB370\uC774\uD130\uAC00 \uB36E\uC5B4\uC50C\uC6CC\uC9D1\uB2C8\uB2E4.";
        },
        rotationBackupRestored: "\uBC31\uC5C5\uC5D0\uC11C \uBCF5\uC6D0\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
        rotationBackupRestoreFailed: "\uBC31\uC5C5\uC5D0\uC11C \uBCF5\uC6D0\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
        rotationBackupNone: "\uC0AC\uC6A9 \uAC00\uB2A5\uD55C \uBC31\uC5C5\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
        rotationBackupGeneration: function(count) {
          return count + "\uAC1C \uC138\uC158";
        },
        frontmatterSessionNotFound: function(n) {
          return "\u201C" + n + "\u201D \uC138\uC158\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4 (workspace-session)";
        },
        frontmatterAlreadyActive: function(n) {
          return "\u201C" + n + "\u201D \uC138\uC158\uC774 \uC774\uBBF8 \uD65C\uC131 \uC0C1\uD0DC\uC785\uB2C8\uB2E4";
        }
      },
      it: {
        settingsStatusBarModScrollSwitch: "Mod + rotellina per cambiare sessione",
        settingsStatusBarModScrollSwitchDesc: "Sull\u2019elemento della barra di stato, tieni premuto il tasto modificatore selezionato e scorri verticalmente per cambiare sessione. Usa soglia e cooldown per ridurre gli attivamenti accidentali del trackpad.",
        modalTitle: "Gestione sessioni",
        savePlaceholder: "Nome nuova sessione...",
        filterPlaceholder: "Filtra sessioni...",
        settingsShowFilterInput: "Mostra filtro sessioni",
        settingsShowFilterInputDesc: "Mostra un filtro di testo nel gestore sessioni per trovare rapidamente le sessioni.",
        settingsOverlayDefaultFocus: "Focus predefinito dell'overlay",
        settingsOverlayDefaultFocusDesc: "Scegli quale elemento riceve il focus quando si apre il gestore sessioni.",
        settingsOverlayFocusCurrentSession: "Sessione corrente",
        settingsOverlayFocusSessionFilter: "Filtro sessioni",
        settingsOverlayFocusSessionCreate: "Creazione sessione",
        settingsSectionSessionManager: "Gestore sessioni",
        settingsShowActiveSwitchCommand: "Mostra sessione attiva nella palette comandi",
        settingsShowActiveSwitchCommandDesc: "Mostra il comando di cambio per la sessione attiva nella palette dei comandi. Le scorciatoie funzionano sempre indipendentemente da questa impostazione.",
        settingsNumberedSwitchCommands: "Comandi di cambio numerati",
        settingsNumberedSwitchCommandsDesc: "Registra comandi di cambio con slot numerati (1\u20139) associabili a scorciatoie. Se disattivato, tutte le sessioni usano comandi basati sul nome.",
        save: "Crea",
        load: "Passa",
        saveInline: "Salva",
        active: "ATTIVO",
        modifiedJustNow: "Modificato ora",
        modifiedMinutes: function(n) {
          return "Modificato " + n + " minut" + (n !== 1 ? "i" : "o") + " fa";
        },
        modifiedHours: function(n) {
          return "Modificato " + n + " or" + (n !== 1 ? "e" : "a") + " fa";
        },
        modifiedDays: function(n) {
          return "Modificato " + n + " giorn" + (n !== 1 ? "i" : "o") + " fa";
        },
        duplicateName: "Esiste gi\xE0 una sessione con questo nome.",
        emptyName: "Il nome della sessione non pu\xF2 essere vuoto.",
        created: function(n) {
          return "Sessione \xAB" + n + "\xBB creata";
        },
        deleted: function(n) {
          return "Sessione \xAB" + n + "\xBB eliminata";
        },
        loaded: function(n) {
          return "Passato a \xAB" + n + "\xBB";
        },
        renamed: function(o, n) {
          return "\xAB" + o + "\xBB rinominata in \xAB" + n + "\xBB";
        },
        confirmDelete: function(n) {
          return "Eliminare la sessione \xAB" + n + "\xBB?";
        },
        confirmDeleteActive: function(n) {
          return "\xAB" + n + "\xBB \xE8 la sessione attiva. Eliminare comunque?";
        },
        confirmSaveSession: function(n) {
          return 'Salvare la sessione "' + n + '"?';
        },
        confirmReloadSession: function(n) {
          return 'Ricaricare la sessione "' + n + '"? Le modifiche non salvate andranno perse.';
        },
        renameTitle: "Rinomina sessione",
        renamePlaceholder: "Nuovo nome...",
        noSession: "Nessuna sessione",
        cannotDeleteLast: "L'ultima sessione non pu\xF2 essere eliminata.",
        confirmBulkDelete: function(n) {
          return "Eliminare " + n + " session" + (n !== 1 ? "i" : "e") + "?";
        },
        bulkDeleted: function(n) {
          return n + " session" + (n !== 1 ? "i eliminate" : "e eliminata");
        },
        bulkDelete: function(n) {
          return "Elimina " + n + " session" + (n !== 1 ? "i" : "e");
        },
        cmdManage: "Gestisci sessioni",
        cmdCreate: "Crea nuova sessione",
        cmdRename: "Rinomina sessione corrente",
        cmdDelete: "Elimina sessione corrente",
        cmdNewEmpty: "Crea sessione vuota",
        cmdDuplicate: "Duplica sessione corrente",
        duplicated: function(n) {
          return "Duplicata come \xAB" + n + "\xBB";
        },
        deselect: "Deseleziona",
        footerDragReorder: "Trascina per riordinare",
        footerDragToGroup: "Trascina sulla scheda gruppo per spostare",
        defaultLabel: "(predefinita)",
        rename: "Rinomina",
        delete: "Elimina",
        remove: "Rimuovi",
        cancel: "Annulla",
        ribbonTooltip: "Workspace++",
        cmdSwitchTo: function(n, name) {
          return name ? "Passa alla sessione " + n + ": " + name : "Passa alla sessione " + n;
        },
        cmdSwitchToNamed: function(name) {
          return 'Passa a "' + name + '"';
        },
        cmdPrevious: "Sessione precedente",
        cmdNext: "Sessione successiva",
        cmdSaveCurrent: "Salva sessione corrente",
        cmdSaveAs: "Salva sessione corrente come...",
        cmdToggleAutoSave: "Attiva/disattiva salvataggio automatico al cambio",
        cmdEnableAutoSave: "Attiva salvataggio automatico al cambio",
        cmdDisableAutoSave: "Disattiva salvataggio automatico al cambio",
        cmdSearchOverlay: "Cerca sessioni",
        switchLeft: "Sinistra",
        switchRight: "Destra",
        switchGroup: "Gruppo",
        keyTab: "Tab",
        savedSession: function(n) {
          return "Sessione \xAB" + n + "\xBB salvata";
        },
        savedAs: function(n) {
          return "Salvata come \xAB" + n + "\xBB";
        },
        noChanges: "Nessuna modifica da salvare",
        autoSaveEnabled: "Salvataggio automatico al cambio attivato.",
        autoSaveDisabled: "Salvataggio automatico al cambio disattivato.",
        confirmUnsavedSwitch: function(n) {
          return "La sessione corrente ha modifiche non salvate. Passare a \xAB" + n + "\xBB?";
        },
        saveAndSwitch: "Salva e passa",
        switchWithoutSaving: "Passa senza salvare",
        sessionAutoName: function(n) {
          return "Nuova sessione " + n;
        },
        noFilteredSessions: "Nessuna sessione corrispondente",
        noGroupSessions: "Nessuna sessione in questo gruppo",
        searchOverlayPlaceholder: "Digita per filtrare le sessioni...",
        searchOverlayHelp: "\u2191\u2193 sposta  /  Invio passa  /  \u21E7Invio salva  /  \u232B elimina  /  Esc chiudi",
        backupRestored: "Workspace++: sessioni ripristinate dal backup.",
        settingsLanguage: "Lingua",
        settingsLanguageDesc: "Lingua dell'interfaccia. Riavvia Obsidian per applicare ai nomi dei comandi.",
        settingsSectionGeneral: "Generale",
        settingsTabSessions: "Sessioni",
        settingsSectionSwitching: "Salvataggio automatico sessione",
        settingsSectionSwitchPreview: "Cambio sessione",
        settingsSectionDeletion: "Eliminazione sessione",
        settingsLangAuto: "Auto (lingua di sistema)",
        settingsTranslationHelp: "Errore di traduzione? Apri una issue o una pull request su GitHub.",
        settingsPreviewHeading: "Mostra la sessione corrente prima del cambio",
        settingsPreviewDesc: "Quando si cambiano le sessioni con una scorciatoia, la prima pressione mostra la posizione attuale senza cambiare.",
        settingsPreviewNext: "Sessione successiva",
        settingsPreviewPrevious: "Sessione precedente",
        settingsHotkeys: "Scorciatoie",
        settingsHotkeysBtn: "Apri scorciatoie",
        contextOpenSettings: "Apri impostazioni",
        contextCustomizeClicks: "Personalizza azioni clic",
        settingsSectionStatusBar: "Azioni clic barra di stato",
        statusBarSlotClick: "Clic",
        statusBarSlotAltClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + Clic";
        },
        statusBarSlotModClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + Clic";
        },
        statusBarSlotShiftClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + Clic";
        },
        statusBarSlotRightClick: "Clic destro",
        statusBarSlotAltRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + Clic destro";
        },
        statusBarSlotModRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + Clic destro";
        },
        statusBarSlotShiftRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + Clic destro";
        },
        statusBarSlotMiddleClick: "Clic centrale",
        statusBarSlotAltMiddleClick: modifiedClickLabel("Clic centrale", "\u2325", "Alt"),
        statusBarSlotModMiddleClick: modifiedClickLabel("Clic centrale", "\u2318", "Ctrl"),
        statusBarSlotShiftMiddleClick: modifiedClickLabel("Clic centrale", "\u21E7", "Shift"),
        statusBarActionNone: "Non fare nulla",
        statusBarActionQuickSwitcher: "Apri selettore rapido",
        statusBarActionSessionManager: "Apri gestore sessioni",
        statusBarActionSaveSession: "Salva sessione",
        statusBarActionReloadWithoutSaving: "Ricarica senza salvare",
        statusBarActionVersionHistory: "Mostra cronologia versioni",
        statusBarActionRestoreLatestHistory: "Ripristina cronologia recente",
        statusBarActionSessionMenu: "Menu sessione",
        statusBarActionSettingsMenu: "Menu impostazioni",
        contextResetOverlayPosition: "Reimposta posizione e dimensione",
        settingsConfirmDelete: "Conferma prima di eliminare una sessione",
        settingsConfirmDeleteDesc: "Mostra una finestra di conferma prima di eliminare una sessione.",
        settingsConfirmQuickActions: "Conferma salvataggio/ricaricamento nel selettore rapido",
        settingsConfirmQuickActionsDesc: "Mostra una finestra di conferma prima di salvare o ricaricare una sessione dal selettore rapido.",
        settingsAutoSaveOnSwitch: "Modalit\xE0 salvataggio automatico",
        settingsAutoSaveOnSwitchDesc: "Salva automaticamente la sessione corrente al cambio (predefinito: attivato). Se disattivato, puoi salvare e ricaricare le sessioni manualmente.",
        settingsWarnUnsavedSwitch: "Avvisa prima di cambiare senza salvare",
        settingsWarnUnsavedSwitchDesc: "Se il salvataggio automatico \xE8 disattivato e la sessione corrente ha modifiche non salvate, mostra un avviso prima del cambio.",
        settingsStatusBarQuickSwitcher: "Cambio rapido cliccando sulla barra di stato",
        settingsStatusBarQuickSwitcherDesc: "Se attivato, cliccando sulla barra di stato si apre il selettore rapido invece del gestore sessioni completo.",
        settingsResetSessions: "Reimposta sessioni",
        settingsResetSessionsDesc: "Elimina tutte le sessioni salvate e mantiene solo una nuova sessione predefinita basata sul layout corrente.",
        settingsResetSessionsBtn: "Reimposta",
        confirmResetSessions: "Reimpostare tutte le sessioni ai valori predefiniti? Questa azione non pu\xF2 essere annullata.",
        resetSessionsHint: "Questa operazione rimuover\xE0 tutte le sessioni salvate e manterr\xE0 solo una sessione predefinita.",
        resetSessionsDone: "Le sessioni sono state reimpostate ai valori predefiniti.",
        resetSessionsFailed: "Impossibile reimpostare le sessioni.",
        confirmDeleteSettingsHint: "Per disattivare questa conferma, vai nelle Impostazioni.",
        // --- Groups ---
        groupCreated: function(n) {
          return 'Gruppo "' + n + '" creato';
        },
        groupDeleted: function(n) {
          return 'Gruppo "' + n + '" eliminato';
        },
        groupRenamed: function(o, n) {
          return 'Gruppo rinominato: "' + o + '" \u2192 "' + n + '"';
        },
        groupAll: "Tutti",
        groupDuplicateName: "Esiste gi\xE0 un gruppo con questo nome.",
        groupEmptyName: "Il nome del gruppo non pu\xF2 essere vuoto.",
        cmdSwitchGroup: "Cambia gruppo",
        cmdExitGroup: "Mostra tutte le sessioni (esci dal gruppo)",
        cmdNextGroup: "Gruppo successivo",
        cmdPreviousGroup: "Gruppo precedente",
        searchOverlayHelpWithGroups: "\u2191\u2193 sposta  /  Tab gruppo  /  Invio cambia  /  \u21E7Invio salva  /  \u232B elimina  /  Esc chiudi",
        settingsSectionGroups: "Gruppi di sessioni",
        contextToggleGroups: "Attiva gruppi di sessioni",
        settingsSectionGroupsDesc: "Usa i gruppi per organizzare le sessioni. Se disattivato, schede e azioni di cambio gruppo vengono nascoste.",
        settingsGroupCreate: "Crea gruppo",
        settingsGroupCreateDesc: "Crea un nuovo gruppo di sessioni.",
        settingsGroupCreatePlaceholder: "Nome del gruppo...",
        settingsGroupCreateBtn: "Crea",
        settingsGroupManageSessions: "Gestisci sessioni",
        settingsGroupManageSessionsDesc: "Aggiungi o rimuovi sessioni da questo gruppo.",
        settingsGroupSessionCount: function(n) {
          return n + (n !== 1 ? " sessioni" : " sessione");
        },
        settingsGroupDelete: "Elimina gruppo",
        settingsGroupDeleteConfirm: function(n) {
          return 'Eliminare il gruppo "' + n + '"? Le sessioni non verranno eliminate.';
        },
        confirmDeleteGroup: function(n) {
          return 'Eliminare il gruppo "' + n + '"? Le sessioni nel gruppo NON verranno eliminate.';
        },
        groupAddedSession: function(s, g) {
          return '"' + s + '" aggiunto a "' + g + '"';
        },
        groupRemovedSession: function(s, g) {
          return '"' + s + '" rimosso da "' + g + '"';
        },
        groupRemoveFromGroup: "Rimuovi dal gruppo",
        groupMoveToGroup: "Sposta nel gruppo",
        groupCreateNew: "Nuovo gruppo",
        groupCreatePlaceholder: "Nome del gruppo...",
        groupContextRename: "Rinomina gruppo",
        groupContextDelete: "Elimina gruppo",
        contextSwitchSession: "Passa a questa sessione",
        contextRenameSession: "Rinomina questa sessione",
        contextDeleteSession: "Elimina questa sessione",
        contextDuplicateSession: "Duplica questa sessione",
        contextReloadSession: "Ricarica questa sessione",
        contextSaveSession: "Salva questa sessione",
        groupRemoveAllSessions: "Rimuovi tutte le sessioni da questo gruppo",
        confirmRemoveAllFromGroup: function(g, n) {
          return "Rimuovere tutte le " + n + ' sessioni da "' + g + '"?';
        },
        groupRemovedAllSessions: function(g) {
          return 'Tutte le sessioni rimosse da "' + g + '"';
        },
        contextDeleteAllGroups: "Elimina tutti i gruppi",
        confirmDeleteAllGroups: function(n) {
          return "Eliminare tutti i " + n + " gruppi? Le sessioni non verranno eliminate.";
        },
        deletedAllGroups: function(n) {
          return n + " gruppi eliminati";
        },
        contextDeleteAllSessions: "Elimina tutte le sessioni",
        confirmDeleteAllSessions: function(n) {
          return "Eliminare " + n + " sessioni? La sessione attiva verr\xE0 mantenuta.";
        },
        deletedAllSessions: function(n) {
          return n + " sessioni eliminate";
        },
        contextVersionHistory: "Cronologia versioni",
        cmdVersionHistory: "Visualizza cronologia versioni della sessione",
        historyTitle: "Cronologia versioni",
        historyEmpty: "Nessuna cronologia per questa sessione.",
        historyRestore: "Ripristina",
        historyRestoreConfirm: function(name, time) {
          return 'Ripristinare il layout di "' + name + '" da ' + time + "?";
        },
        historyRestored: function(name) {
          return 'Layout di "' + name + '" ripristinato';
        },
        historyQuickRestored: function(name) {
          return 'Layout precedente di "' + name + '" ripristinato rapidamente';
        },
        historyNoEntries: "Nessun layout precedente da ripristinare.",
        historyToday: "Oggi",
        historyYesterday: "Ieri",
        historyThisWeek: "Questa settimana",
        historyFiles: function(n) {
          return n + " file";
        },
        historyPanes: function(n) {
          return n + " pannell" + (n !== 1 ? "i" : "o");
        },
        settingsVersionHistoryEnabled: "Abilita cronologia versioni",
        settingsVersionHistoryEnabledDesc: "Mantieni una cronologia delle modifiche al layout per ogni sessione.",
        settingsVersionHistoryInterval: "Intervallo snapshot (minuti)",
        settingsVersionHistoryIntervalDesc: "Con quale frequenza verificare le modifiche al layout e salvare uno snapshot.",
        settingsVersionHistoryCtrlRmb: platformLabel("Ripristino rapido (Cmd + clic destro)", "Ripristino rapido (Ctrl + clic destro)"),
        settingsVersionHistoryCtrlRmbDesc: platformLabel("Fai clic destro sulla barra di stato tenendo premuto Cmd per ripristinare il layout precedente.", "Fai clic destro sulla barra di stato tenendo premuto Ctrl per ripristinare il layout precedente."),
        settingsVersionHistoryConfirmRestore: "Conferma prima del ripristino",
        settingsVersionHistoryConfirmRestoreDesc: "Mostra una finestra di conferma prima di ripristinare un layout precedente.",
        rotationBackupSectionTitle: "Backup",
        rotationBackupCreate: "Crea backup",
        rotationBackupCreateBtn: "Crea ora",
        rotationBackupCreated: "Backup creato.",
        rotationBackupFailed: "Impossibile creare il backup.",
        rotationBackupDesc: "I backup vengono creati automaticamente al salvataggio (ogni ora, fino a 3 generazioni).",
        rotationBackupRestore: "Ripristina",
        rotationBackupRestoreConfirm: function(time, count) {
          return "Ripristinare dal backup di " + time + " (" + count + " session" + (count !== 1 ? "i" : "e") + ")? I dati attuali verranno sovrascritti.";
        },
        rotationBackupRestored: "Ripristinato dal backup.",
        rotationBackupRestoreFailed: "Ripristino dal backup non riuscito.",
        rotationBackupNone: "Nessun backup disponibile.",
        rotationBackupGeneration: function(count) {
          return count + " session" + (count !== 1 ? "i" : "e");
        },
        frontmatterSessionNotFound: function(n) {
          return "Sessione \xAB" + n + "\xBB non trovata (workspace-session)";
        },
        frontmatterAlreadyActive: function(n) {
          return "La sessione \xAB" + n + "\xBB \xE8 gi\xE0 attiva";
        }
      },
      tr: {
        settingsStatusBarModScrollSwitch: "Mod + kayd\u0131rma ile oturum de\u011Fi\u015Ftir",
        settingsStatusBarModScrollSwitchDesc: "Durum \xE7ubu\u011Fu \xF6\u011Fesi \xFCzerinde se\xE7ilen de\u011Fi\u015Ftirici tu\u015Fa bas\u0131l\u0131 tutup dikey kayd\u0131rarak oturum de\u011Fi\u015Ftirin. Trackpad kaynakl\u0131 yanl\u0131\u015F tetiklemeleri azaltmak i\xE7in e\u015Fik ve bekleme s\xFCresi kullan\u0131r.",
        modalTitle: "Oturumlar\u0131 y\xF6net",
        savePlaceholder: "Yeni oturum ad\u0131...",
        filterPlaceholder: "Oturumlar\u0131 filtrele...",
        settingsShowFilterInput: "Oturum filtresini g\xF6ster",
        settingsShowFilterInputDesc: "Oturum y\xF6neticisinde oturumlar\u0131 h\u0131zl\u0131ca bulmak i\xE7in metin filtresi g\xF6ster.",
        settingsOverlayDefaultFocus: "Varsay\u0131lan kaplama oda\u011F\u0131",
        settingsOverlayDefaultFocusDesc: "Oturum y\xF6neticisi a\xE7\u0131ld\u0131\u011F\u0131nda oda\u011F\u0131 alan \xF6\u011Feyi se\xE7in.",
        settingsOverlayFocusCurrentSession: "Mevcut oturum",
        settingsOverlayFocusSessionFilter: "Oturum filtresi",
        settingsOverlayFocusSessionCreate: "Oturum olu\u015Fturma",
        settingsSectionSessionManager: "Oturum y\xF6neticisi",
        settingsShowActiveSwitchCommand: "Komut paletinde aktif oturumu g\xF6ster",
        settingsShowActiveSwitchCommandDesc: "Komut paletinde etkin oturum i\xE7in ge\xE7i\u015F komutunu g\xF6sterir. K\u0131sayollar bu ayardan ba\u011F\u0131ms\u0131z olarak her zaman \xE7al\u0131\u015F\u0131r.",
        settingsNumberedSwitchCommands: "Numaral\u0131 ge\xE7i\u015F komutlar\u0131",
        settingsNumberedSwitchCommandsDesc: "Numaral\u0131 slotlarla (1\u20139) k\u0131sayollara atanabilecek ge\xE7i\u015F komutlar\u0131 kaydeder. Kapat\u0131ld\u0131\u011F\u0131nda t\xFCm oturumlar ad tabanl\u0131 komutlar\u0131 kullan\u0131r.",
        save: "Olu\u015Ftur",
        load: "Ge\xE7i\u015F",
        saveInline: "Kaydet",
        active: "AKT\u0130F",
        modifiedJustNow: "Az \xF6nce de\u011Fi\u015Ftirildi",
        modifiedMinutes: function(n) {
          return n + " dakika \xF6nce de\u011Fi\u015Ftirildi";
        },
        modifiedHours: function(n) {
          return n + " saat \xF6nce de\u011Fi\u015Ftirildi";
        },
        modifiedDays: function(n) {
          return n + " g\xFCn \xF6nce de\u011Fi\u015Ftirildi";
        },
        duplicateName: "Bu adla bir oturum zaten var.",
        emptyName: "Oturum ad\u0131 bo\u015F b\u0131rak\u0131lamaz.",
        created: function(n) {
          return "\u201C" + n + "\u201D oturumu olu\u015Fturuldu";
        },
        deleted: function(n) {
          return "\u201C" + n + "\u201D oturumu silindi";
        },
        loaded: function(n) {
          return "\u201C" + n + "\u201D oturumuna ge\xE7ildi";
        },
        renamed: function(o, n) {
          return "\u201C" + o + "\u201D, \u201C" + n + "\u201D olarak yeniden adland\u0131r\u0131ld\u0131";
        },
        confirmDelete: function(n) {
          return "\u201C" + n + "\u201D oturumu silinsin mi?";
        },
        confirmDeleteActive: function(n) {
          return "\u201C" + n + "\u201D etkin oturum. Yine de silinsin mi?";
        },
        confirmSaveSession: function(n) {
          return '"' + n + '" oturumunu kaydet?';
        },
        confirmReloadSession: function(n) {
          return '"' + n + '" oturumunu yeniden y\xFCkle? Kaydedilmemi\u015F de\u011Fi\u015Fiklikler kaybolacak.';
        },
        renameTitle: "Oturumu yeniden adland\u0131r",
        renamePlaceholder: "Yeni ad...",
        noSession: "Oturum yok",
        cannotDeleteLast: "Son oturum silinemez.",
        confirmBulkDelete: function(n) {
          return n + " oturum silinsin mi?";
        },
        bulkDeleted: function(n) {
          return n + " oturum silindi";
        },
        bulkDelete: function(n) {
          return n + " oturum sil";
        },
        cmdManage: "Oturumlar\u0131 y\xF6net",
        cmdCreate: "Yeni oturum olu\u015Ftur",
        cmdRename: "Ge\xE7erli oturumu yeniden adland\u0131r",
        cmdDelete: "Ge\xE7erli oturumu sil",
        cmdNewEmpty: "Bo\u015F oturum olu\u015Ftur",
        cmdDuplicate: "Ge\xE7erli oturumu \xE7o\u011Falt",
        duplicated: function(n) {
          return "\u201C" + n + "\u201D olarak \xE7o\u011Falt\u0131ld\u0131";
        },
        deselect: "Se\xE7imi kald\u0131r",
        footerDragReorder: "S\u0131ralamak i\xE7in s\xFCr\xFCkle",
        footerDragToGroup: "Ta\u015F\u0131mak i\xE7in grup sekmesine s\xFCr\xFCkle",
        defaultLabel: "(varsay\u0131lan)",
        rename: "Yeniden adland\u0131r",
        delete: "Sil",
        remove: "\xC7\u0131kar",
        cancel: "\u0130ptal",
        ribbonTooltip: "Workspace++",
        cmdSwitchTo: function(n, name) {
          return name ? n + ". oturuma ge\xE7: " + name : n + ". oturuma ge\xE7";
        },
        cmdSwitchToNamed: function(name) {
          return '"' + name + '" oturumuna ge\xE7';
        },
        cmdPrevious: "\xD6nceki oturum",
        cmdNext: "Sonraki oturum",
        cmdSaveCurrent: "Ge\xE7erli oturumu kaydet",
        cmdSaveAs: "Ge\xE7erli oturumu farkl\u0131 kaydet...",
        cmdToggleAutoSave: "Ge\xE7i\u015Fte otomatik kaydetmeyi de\u011Fi\u015Ftir",
        cmdEnableAutoSave: "Ge\xE7i\u015Fte otomatik kaydetmeyi etkinle\u015Ftir",
        cmdDisableAutoSave: "Ge\xE7i\u015Fte otomatik kaydetmeyi devre d\u0131\u015F\u0131 b\u0131rak",
        cmdSearchOverlay: "Oturum ara",
        switchLeft: "Sol",
        switchRight: "Sa\u011F",
        switchGroup: "Grup",
        keyTab: "Tab",
        savedSession: function(n) {
          return "\u201C" + n + "\u201D oturumu kaydedildi";
        },
        savedAs: function(n) {
          return "\u201C" + n + "\u201D olarak kaydedildi";
        },
        noChanges: "Kaydedilecek de\u011Fi\u015Fiklik yok",
        autoSaveEnabled: "Ge\xE7i\u015Fte otomatik kaydetme etkinle\u015Ftirildi.",
        autoSaveDisabled: "Ge\xE7i\u015Fte otomatik kaydetme devre d\u0131\u015F\u0131 b\u0131rak\u0131ld\u0131.",
        confirmUnsavedSwitch: function(n) {
          return "Ge\xE7erli oturumda kaydedilmemi\u015F de\u011Fi\u015Fiklikler var. \u201C" + n + "\u201D oturumuna ge\xE7ilsin mi?";
        },
        saveAndSwitch: "Kaydet ve ge\xE7",
        switchWithoutSaving: "Kaydetmeden ge\xE7",
        sessionAutoName: function(n) {
          return "Yeni oturum " + n;
        },
        noFilteredSessions: "E\u015Fle\u015Fen oturum yok",
        noGroupSessions: "Bu grupta oturum yok",
        searchOverlayPlaceholder: "Oturumlar\u0131 filtrelemek i\xE7in yaz\u0131n...",
        searchOverlayHelp: "\u2191\u2193 hareket  /  Enter ge\xE7i\u015F  /  \u21E7Enter kaydet  /  \u232B sil  /  Esc kapat",
        backupRestored: "Workspace++: Oturumlar yedekten geri y\xFCklendi.",
        settingsLanguage: "Dil",
        settingsLanguageDesc: "Eklenti aray\xFCz dili. Komut adlar\u0131na uygulamak i\xE7in Obsidian'\u0131 yeniden ba\u015Flat\u0131n.",
        settingsSectionGeneral: "Genel",
        settingsTabSessions: "Oturumlar",
        settingsSectionSwitching: "Otomatik oturum kaydetme",
        settingsSectionSwitchPreview: "Oturum ge\xE7i\u015Fi",
        settingsSectionDeletion: "Oturum silme",
        settingsLangAuto: "Otomatik (sistem dili)",
        settingsTranslationHelp: "\xC7eviri hatas\u0131 m\u0131 buldunuz? GitHub'da issue veya pull request a\xE7\u0131n.",
        settingsPreviewHeading: "Ge\xE7i\u015F \xF6ncesi mevcut oturumu g\xF6ster",
        settingsPreviewDesc: "K\u0131sayolla oturum de\u011Fi\u015Ftirirken ilk bas\u0131\u015Fta ge\xE7i\u015F yapmadan mevcut konumunuz g\xF6sterilir.",
        settingsPreviewNext: "Sonraki oturum",
        settingsPreviewPrevious: "\xD6nceki oturum",
        settingsHotkeys: "K\u0131sayollar",
        settingsHotkeysBtn: "K\u0131sayol ayarlar\u0131n\u0131 a\xE7",
        contextOpenSettings: "Ayarlar\u0131 a\xE7",
        contextCustomizeClicks: "T\u0131klama eylemlerini \xF6zelle\u015Ftir",
        settingsSectionStatusBar: "Durum \xE7ubu\u011Fu t\u0131klama eylemleri",
        statusBarSlotClick: "T\u0131klama",
        statusBarSlotAltClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + T\u0131klama";
        },
        statusBarSlotModClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + T\u0131klama";
        },
        statusBarSlotShiftClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + T\u0131klama";
        },
        statusBarSlotRightClick: "Sa\u011F t\u0131klama",
        statusBarSlotAltRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + Sa\u011F t\u0131klama";
        },
        statusBarSlotModRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + Sa\u011F t\u0131klama";
        },
        statusBarSlotShiftRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + Sa\u011F t\u0131klama";
        },
        statusBarSlotMiddleClick: "Orta t\u0131klama",
        statusBarSlotAltMiddleClick: modifiedClickLabel("Orta t\u0131klama", "\u2325", "Alt"),
        statusBarSlotModMiddleClick: modifiedClickLabel("Orta t\u0131klama", "\u2318", "Ctrl"),
        statusBarSlotShiftMiddleClick: modifiedClickLabel("Orta t\u0131klama", "\u21E7", "Shift"),
        statusBarActionNone: "Hi\xE7bir \u015Fey yapma",
        statusBarActionQuickSwitcher: "H\u0131zl\u0131 ge\xE7i\u015Fi a\xE7",
        statusBarActionSessionManager: "Oturum y\xF6neticisini a\xE7",
        statusBarActionSaveSession: "Oturumu kaydet",
        statusBarActionReloadWithoutSaving: "Kaydetmeden yeniden y\xFCkle",
        statusBarActionVersionHistory: "S\xFCr\xFCm ge\xE7mi\u015Fini g\xF6ster",
        statusBarActionRestoreLatestHistory: "Son ge\xE7mi\u015Fi geri y\xFCkle",
        statusBarActionSessionMenu: "Oturum men\xFCs\xFC",
        statusBarActionSettingsMenu: "Ayarlar men\xFCs\xFC",
        contextResetOverlayPosition: "Konumu ve boyutu s\u0131f\u0131rla",
        settingsConfirmDelete: "Oturumu silmeden \xF6nce onayla",
        settingsConfirmDeleteDesc: "Bir oturumu silmeden \xF6nce onay ileti\u015Fim kutusu g\xF6ster.",
        settingsConfirmQuickActions: "H\u0131zl\u0131 de\u011Fi\u015Ftiricide kaydet/yeniden y\xFCkle onay\u0131",
        settingsConfirmQuickActionsDesc: "H\u0131zl\u0131 de\u011Fi\u015Ftiricide bir oturumu kaydetmeden veya yeniden y\xFCklemeden \xF6nce onay ileti\u015Fim kutusu g\xF6ster.",
        settingsAutoSaveOnSwitch: "Otomatik kaydetme modu",
        settingsAutoSaveOnSwitchDesc: "Ge\xE7i\u015F s\u0131ras\u0131nda mevcut oturumu otomatik olarak kaydeder (varsay\u0131lan: a\xE7\u0131k). Kapat\u0131ld\u0131\u011F\u0131nda oturumlar\u0131 elle kaydedip yeniden y\xFCkleyebilirsiniz.",
        settingsWarnUnsavedSwitch: "Kaydetmeden ge\xE7meden \xF6nce uyar",
        settingsWarnUnsavedSwitchDesc: "Otomatik kaydetme kapal\u0131ysa ve mevcut oturumda kaydedilmemi\u015F de\u011Fi\u015Fiklikler varsa ge\xE7i\u015Ften \xF6nce uyar\u0131 g\xF6ster.",
        settingsStatusBarQuickSwitcher: "Durum \xE7ubu\u011Funa t\u0131kland\u0131\u011F\u0131nda h\u0131zl\u0131 ge\xE7i\u015F",
        settingsStatusBarQuickSwitcherDesc: "Etkinle\u015Ftirildi\u011Finde, durum \xE7ubu\u011Funa t\u0131klamak tam oturum y\xF6neticisi yerine h\u0131zl\u0131 ge\xE7i\u015F panelini a\xE7ar.",
        settingsResetSessions: "Oturumlar\u0131 s\u0131f\u0131rla",
        settingsResetSessionsDesc: "Kaydedilmi\u015F t\xFCm oturumlar\u0131 siler ve yaln\u0131zca mevcut d\xFCzene g\xF6re yeni bir varsay\u0131lan oturum b\u0131rak\u0131r.",
        settingsResetSessionsBtn: "S\u0131f\u0131rla",
        confirmResetSessions: "T\xFCm oturumlar varsay\u0131lana s\u0131f\u0131rlans\u0131n m\u0131? Bu i\u015Flem geri al\u0131namaz.",
        resetSessionsHint: "Bu i\u015Flem kaydedilmi\u015F t\xFCm oturumlar\u0131 kald\u0131r\u0131r ve yaln\u0131zca bir varsay\u0131lan oturum b\u0131rak\u0131r.",
        resetSessionsDone: "Oturumlar varsay\u0131lana s\u0131f\u0131rland\u0131.",
        resetSessionsFailed: "Oturumlar s\u0131f\u0131rlanamad\u0131.",
        confirmDeleteSettingsHint: "Bu onay\u0131 devre d\u0131\u015F\u0131 b\u0131rakmak i\xE7in Ayarlara gidin.",
        // --- Groups ---
        groupCreated: function(n) {
          return '"' + n + '" grubu olu\u015Fturuldu';
        },
        groupDeleted: function(n) {
          return '"' + n + '" grubu silindi';
        },
        groupRenamed: function(o, n) {
          return 'Grup yeniden adland\u0131r\u0131ld\u0131: "' + o + '" \u2192 "' + n + '"';
        },
        groupAll: "T\xFCm\xFC",
        groupDuplicateName: "Bu isimde bir grup zaten mevcut.",
        groupEmptyName: "Grup ad\u0131 bo\u015F olamaz.",
        cmdSwitchGroup: "Grup de\u011Fi\u015Ftir",
        cmdExitGroup: "T\xFCm oturumlar\u0131 g\xF6ster (gruptan \xE7\u0131k)",
        cmdNextGroup: "Sonraki grup",
        cmdPreviousGroup: "\xD6nceki grup",
        searchOverlayHelpWithGroups: "\u2191\u2193 ta\u015F\u0131  /  Tab grup  /  Enter de\u011Fi\u015Ftir  /  \u21E7Enter kaydet  /  \u232B sil  /  Esc kapat",
        settingsSectionGroups: "Oturum gruplar\u0131",
        contextToggleGroups: "Oturum gruplar\u0131n\u0131 etkinle\u015Ftir",
        settingsSectionGroupsDesc: "Oturumlar\u0131 gruplarla d\xFCzenleyin. Kapat\u0131ld\u0131\u011F\u0131nda grup sekmeleri ve grup ge\xE7i\u015F eylemleri gizlenir.",
        settingsGroupCreate: "Grup olu\u015Ftur",
        settingsGroupCreateDesc: "Yeni bir oturum grubu olu\u015Fturun.",
        settingsGroupCreatePlaceholder: "Grup ad\u0131...",
        settingsGroupCreateBtn: "Olu\u015Ftur",
        settingsGroupManageSessions: "Oturumlar\u0131 y\xF6net",
        settingsGroupManageSessionsDesc: "Bu gruba oturum ekleyin veya \xE7\u0131kar\u0131n.",
        settingsGroupSessionCount: function(n) {
          return n + " oturum";
        },
        settingsGroupDelete: "Grubu sil",
        settingsGroupDeleteConfirm: function(n) {
          return '"' + n + '" grubu silinsin mi? Oturumlar silinmeyecek.';
        },
        confirmDeleteGroup: function(n) {
          return '"' + n + '" grubu silinsin mi? Gruptaki oturumlar S\u0130L\u0130NMEYECEK.';
        },
        groupAddedSession: function(s, g) {
          return '"' + s + '" grubuna "' + g + '" eklendi';
        },
        groupRemovedSession: function(s, g) {
          return '"' + s + '" grubundan "' + g + '" \xE7\u0131kar\u0131ld\u0131';
        },
        groupRemoveFromGroup: "Gruptan \xE7\u0131kar",
        groupMoveToGroup: "Gruba ta\u015F\u0131",
        groupCreateNew: "Yeni grup",
        groupCreatePlaceholder: "Grup ad\u0131...",
        groupContextRename: "Grubu yeniden adland\u0131r",
        groupContextDelete: "Grubu sil",
        contextSwitchSession: "Bu oturuma ge\xE7",
        contextRenameSession: "Bu oturumu yeniden adland\u0131r",
        contextDeleteSession: "Bu oturumu sil",
        contextDuplicateSession: "Bu oturumu \xE7o\u011Falt",
        contextReloadSession: "Bu oturumu yeniden y\xFCkle",
        contextSaveSession: "Bu oturumu kaydet",
        groupRemoveAllSessions: "T\xFCm oturumlar\u0131 bu gruptan \xE7\u0131kar",
        confirmRemoveAllFromGroup: function(g, n) {
          return '"' + g + '" grubundaki ' + n + " oturumun t\xFCm\xFC \xE7\u0131kar\u0131ls\u0131n m\u0131?";
        },
        groupRemovedAllSessions: function(g) {
          return '"' + g + '" grubundan t\xFCm oturumlar \xE7\u0131kar\u0131ld\u0131';
        },
        contextDeleteAllGroups: "T\xFCm gruplar\u0131 sil",
        confirmDeleteAllGroups: function(n) {
          return "T\xFCm " + n + " grup silinsin mi? Oturumlar silinmeyecek.";
        },
        deletedAllGroups: function(n) {
          return n + " grup silindi";
        },
        contextDeleteAllSessions: "T\xFCm oturumlar\u0131 sil",
        confirmDeleteAllSessions: function(n) {
          return n + " oturum silinsin mi? Etkin oturum korunacak.";
        },
        deletedAllSessions: function(n) {
          return n + " oturum silindi";
        },
        contextVersionHistory: "S\xFCr\xFCm ge\xE7mi\u015Fi",
        cmdVersionHistory: "Oturum s\xFCr\xFCm ge\xE7mi\u015Fini g\xF6r\xFCnt\xFCle",
        historyTitle: "S\xFCr\xFCm ge\xE7mi\u015Fi",
        historyEmpty: "Bu oturum i\xE7in s\xFCr\xFCm ge\xE7mi\u015Fi yok.",
        historyRestore: "Geri y\xFCkle",
        historyRestoreConfirm: function(name, time) {
          return '"' + name + '" d\xFCzenini ' + time + " durumuna geri y\xFCklensin mi?";
        },
        historyRestored: function(name) {
          return '"' + name + '" d\xFCzeni geri y\xFCklendi';
        },
        historyQuickRestored: function(name) {
          return '"' + name + '" \xF6nceki d\xFCzeni h\u0131zl\u0131ca geri y\xFCklendi';
        },
        historyNoEntries: "Geri y\xFCklenecek \xF6nceki d\xFCzen yok.",
        historyToday: "Bug\xFCn",
        historyYesterday: "D\xFCn",
        historyThisWeek: "Bu hafta",
        historyFiles: function(n) {
          return n + " dosya";
        },
        historyPanes: function(n) {
          return n + " panel";
        },
        settingsVersionHistoryEnabled: "S\xFCr\xFCm ge\xE7mi\u015Fini etkinle\u015Ftir",
        settingsVersionHistoryEnabledDesc: "Her oturum i\xE7in d\xFCzen de\u011Fi\u015Fikliklerinin ge\xE7mi\u015Fini sakla.",
        settingsVersionHistoryInterval: "Anl\u0131k g\xF6r\xFCnt\xFC aral\u0131\u011F\u0131 (dakika)",
        settingsVersionHistoryIntervalDesc: "D\xFCzen de\u011Fi\u015Fikliklerini kontrol etme ve anl\u0131k g\xF6r\xFCnt\xFC kaydetme s\u0131kl\u0131\u011F\u0131.",
        settingsVersionHistoryCtrlRmb: platformLabel("H\u0131zl\u0131 geri y\xFCkleme (Cmd + sa\u011F t\u0131k)", "H\u0131zl\u0131 geri y\xFCkleme (Ctrl + sa\u011F t\u0131k)"),
        settingsVersionHistoryCtrlRmbDesc: platformLabel("Cmd tu\u015Funu bas\u0131l\u0131 tutarak durum \xE7ubu\u011Funa sa\u011F t\u0131klayarak \xF6nceki d\xFCzeni geri y\xFCkleyin.", "Ctrl tu\u015Funu bas\u0131l\u0131 tutarak durum \xE7ubu\u011Funa sa\u011F t\u0131klayarak \xF6nceki d\xFCzeni geri y\xFCkleyin."),
        settingsVersionHistoryConfirmRestore: "Geri y\xFCklemeden \xF6nce onayla",
        settingsVersionHistoryConfirmRestoreDesc: "\xD6nceki bir d\xFCzeni geri y\xFCklemeden \xF6nce onay ileti\u015Fim kutusu g\xF6ster.",
        rotationBackupSectionTitle: "Yedekleme",
        rotationBackupCreate: "Yedek olu\u015Ftur",
        rotationBackupCreateBtn: "\u015Eimdi olu\u015Ftur",
        rotationBackupCreated: "Yedek olu\u015Fturuldu.",
        rotationBackupFailed: "Yedek olu\u015Fturulamad\u0131.",
        rotationBackupDesc: "Kaydetme s\u0131ras\u0131nda otomatik yedekler olu\u015Fturulur (saatlik, en fazla 3 nesil).",
        rotationBackupRestore: "Geri y\xFCkle",
        rotationBackupRestoreConfirm: function(time, count) {
          return time + " yedeklemesinden geri y\xFCklensin mi (" + count + " oturum)? Mevcut veriler \xFCzerine yaz\u0131lacak.";
        },
        rotationBackupRestored: "Yedekten geri y\xFCklendi.",
        rotationBackupRestoreFailed: "Yedekten geri y\xFCkleme ba\u015Far\u0131s\u0131z.",
        rotationBackupNone: "Kullan\u0131labilir yedek yok.",
        rotationBackupGeneration: function(count) {
          return count + " oturum";
        },
        frontmatterSessionNotFound: function(n) {
          return "\u201C" + n + "\u201D oturumu bulunamad\u0131 (workspace-session)";
        },
        frontmatterAlreadyActive: function(n) {
          return "\u201C" + n + "\u201D oturumu zaten aktif";
        }
      },
      id: {
        settingsStatusBarModScrollSwitch: "Mod + gulir untuk berpindah sesi",
        settingsStatusBarModScrollSwitchDesc: "Pada item bilah status, tahan tombol pengubah yang dipilih lalu gulir vertikal untuk berpindah sesi. Menggunakan ambang dan jeda untuk mengurangi pemicu trackpad yang tidak disengaja.",
        modalTitle: "Kelola sesi",
        savePlaceholder: "Nama sesi baru...",
        filterPlaceholder: "Filter sesi...",
        settingsShowFilterInput: "Tampilkan filter sesi",
        settingsShowFilterInputDesc: "Tampilkan filter teks di pengelola sesi untuk menemukan sesi dengan cepat.",
        settingsOverlayDefaultFocus: "Fokus overlay default",
        settingsOverlayDefaultFocusDesc: "Pilih elemen yang menerima fokus saat pengelola sesi dibuka.",
        settingsOverlayFocusCurrentSession: "Sesi saat ini",
        settingsOverlayFocusSessionFilter: "Filter sesi",
        settingsOverlayFocusSessionCreate: "Pembuatan sesi",
        settingsSectionSessionManager: "Pengelola sesi",
        settingsShowActiveSwitchCommand: "Tampilkan sesi aktif di palet perintah",
        settingsShowActiveSwitchCommandDesc: "Menampilkan perintah beralih untuk sesi aktif saat ini di palet perintah. Pintasan selalu berfungsi terlepas dari pengaturan ini.",
        settingsNumberedSwitchCommands: "Perintah beralih bernomor",
        settingsNumberedSwitchCommandsDesc: "Mendaftarkan perintah beralih dengan slot bernomor (1\u20139) yang dapat diikat ke pintasan. Saat dinonaktifkan, semua sesi menggunakan perintah berbasis nama.",
        save: "Buat",
        load: "Beralih",
        saveInline: "Simpan",
        active: "AKTIF",
        modifiedJustNow: "Baru saja diubah",
        modifiedMinutes: function(n) {
          return "Diubah " + n + " menit lalu";
        },
        modifiedHours: function(n) {
          return "Diubah " + n + " jam lalu";
        },
        modifiedDays: function(n) {
          return "Diubah " + n + " hari lalu";
        },
        duplicateName: "Sesi dengan nama ini sudah ada.",
        emptyName: "Nama sesi tidak boleh kosong.",
        created: function(n) {
          return "Sesi \u201C" + n + "\u201D dibuat";
        },
        deleted: function(n) {
          return "Sesi \u201C" + n + "\u201D dihapus";
        },
        loaded: function(n) {
          return "Beralih ke \u201C" + n + "\u201D";
        },
        renamed: function(o, n) {
          return "\u201C" + o + "\u201D diganti nama menjadi \u201C" + n + "\u201D";
        },
        confirmDelete: function(n) {
          return "Hapus sesi \u201C" + n + "\u201D?";
        },
        confirmDeleteActive: function(n) {
          return "\u201C" + n + "\u201D adalah sesi aktif. Tetap hapus?";
        },
        confirmSaveSession: function(n) {
          return 'Simpan sesi "' + n + '"?';
        },
        confirmReloadSession: function(n) {
          return 'Muat ulang sesi "' + n + '"? Perubahan yang belum disimpan akan hilang.';
        },
        renameTitle: "Ganti nama sesi",
        renamePlaceholder: "Nama baru...",
        noSession: "Tidak ada sesi",
        cannotDeleteLast: "Sesi terakhir tidak dapat dihapus.",
        confirmBulkDelete: function(n) {
          return "Hapus " + n + " sesi?";
        },
        bulkDeleted: function(n) {
          return n + " sesi dihapus";
        },
        bulkDelete: function(n) {
          return "Hapus " + n + " sesi";
        },
        cmdManage: "Kelola sesi",
        cmdCreate: "Buat sesi baru",
        cmdRename: "Ganti nama sesi saat ini",
        cmdDelete: "Hapus sesi saat ini",
        cmdNewEmpty: "Buat sesi kosong",
        cmdDuplicate: "Duplikat sesi saat ini",
        duplicated: function(n) {
          return "Diduplikasi sebagai \u201C" + n + "\u201D";
        },
        deselect: "Batalkan pilihan",
        footerDragReorder: "Seret untuk mengurutkan",
        footerDragToGroup: "Seret ke tab grup untuk memindahkan",
        defaultLabel: "(bawaan)",
        rename: "Ganti nama",
        delete: "Hapus",
        remove: "Keluarkan",
        cancel: "Batal",
        ribbonTooltip: "Workspace++",
        cmdSwitchTo: function(n, name) {
          return name ? "Beralih ke sesi " + n + ": " + name : "Beralih ke sesi " + n;
        },
        cmdSwitchToNamed: function(name) {
          return 'Beralih ke "' + name + '"';
        },
        cmdPrevious: "Sesi sebelumnya",
        cmdNext: "Sesi berikutnya",
        cmdSaveCurrent: "Simpan sesi saat ini",
        cmdSaveAs: "Simpan sesi saat ini sebagai...",
        cmdToggleAutoSave: "Alihkan simpan otomatis saat berpindah",
        cmdEnableAutoSave: "Aktifkan simpan otomatis saat berpindah",
        cmdDisableAutoSave: "Nonaktifkan simpan otomatis saat berpindah",
        cmdSearchOverlay: "Cari sesi",
        switchLeft: "Kiri",
        switchRight: "Kanan",
        switchGroup: "Grup",
        keyTab: "Tab",
        savedSession: function(n) {
          return "Sesi \u201C" + n + "\u201D disimpan";
        },
        savedAs: function(n) {
          return "Disimpan sebagai \u201C" + n + "\u201D";
        },
        noChanges: "Tidak ada perubahan untuk disimpan",
        autoSaveEnabled: "Simpan otomatis saat berpindah diaktifkan.",
        autoSaveDisabled: "Simpan otomatis saat berpindah dinonaktifkan.",
        confirmUnsavedSwitch: function(n) {
          return "Sesi saat ini memiliki perubahan yang belum disimpan. Beralih ke \u201C" + n + "\u201D?";
        },
        saveAndSwitch: "Simpan lalu beralih",
        switchWithoutSaving: "Beralih tanpa menyimpan",
        sessionAutoName: function(n) {
          return "Sesi baru " + n;
        },
        noFilteredSessions: "Tidak ada sesi yang cocok",
        noGroupSessions: "Tidak ada sesi dalam grup ini",
        searchOverlayPlaceholder: "Ketik untuk memfilter sesi...",
        searchOverlayHelp: "\u2191\u2193 pindah  /  Enter beralih  /  \u21E7Enter simpan  /  \u232B hapus  /  Esc tutup",
        backupRestored: "Workspace++: sesi dipulihkan dari cadangan.",
        settingsLanguage: "Bahasa",
        settingsLanguageDesc: "Bahasa antarmuka plugin. Mulai ulang Obsidian untuk menerapkan ke nama perintah.",
        settingsSectionGeneral: "Umum",
        settingsTabSessions: "Sesi",
        settingsSectionSwitching: "Simpan otomatis sesi",
        settingsSectionSwitchPreview: "Perpindahan sesi",
        settingsSectionDeletion: "Penghapusan sesi",
        settingsLangAuto: "Otomatis (bahasa sistem)",
        settingsTranslationHelp: "Menemukan kesalahan terjemahan? Silakan buka issue atau pull request di GitHub.",
        settingsPreviewHeading: "Tampilkan sesi saat ini sebelum beralih",
        settingsPreviewDesc: "Saat beralih sesi dengan pintasan, penekanan pertama menampilkan posisi Anda saat ini tanpa beralih.",
        settingsPreviewNext: "Sesi berikutnya",
        settingsPreviewPrevious: "Sesi sebelumnya",
        settingsHotkeys: "Pintasan",
        settingsHotkeysBtn: "Buka pengaturan pintasan",
        contextOpenSettings: "Buka pengaturan",
        contextCustomizeClicks: "Sesuaikan tindakan klik",
        settingsSectionStatusBar: "Tindakan klik bilah status",
        statusBarSlotClick: "Klik",
        statusBarSlotAltClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + Klik";
        },
        statusBarSlotModClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + Klik";
        },
        statusBarSlotShiftClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + Klik";
        },
        statusBarSlotRightClick: "Klik kanan",
        statusBarSlotAltRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + Klik kanan";
        },
        statusBarSlotModRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + Klik kanan";
        },
        statusBarSlotShiftRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + Klik kanan";
        },
        statusBarSlotMiddleClick: "Klik tengah",
        statusBarSlotAltMiddleClick: modifiedClickLabel("Klik tengah", "\u2325", "Alt"),
        statusBarSlotModMiddleClick: modifiedClickLabel("Klik tengah", "\u2318", "Ctrl"),
        statusBarSlotShiftMiddleClick: modifiedClickLabel("Klik tengah", "\u21E7", "Shift"),
        statusBarActionNone: "Tidak melakukan apa-apa",
        statusBarActionQuickSwitcher: "Buka pengalih cepat",
        statusBarActionSessionManager: "Buka pengelola sesi",
        statusBarActionSaveSession: "Simpan sesi",
        statusBarActionReloadWithoutSaving: "Muat ulang tanpa menyimpan",
        statusBarActionVersionHistory: "Tampilkan riwayat versi",
        statusBarActionRestoreLatestHistory: "Pulihkan riwayat terbaru",
        statusBarActionSessionMenu: "Menu sesi",
        statusBarActionSettingsMenu: "Menu pengaturan",
        contextResetOverlayPosition: "Atur ulang posisi dan ukuran",
        settingsConfirmDelete: "Konfirmasi sebelum menghapus sesi",
        settingsConfirmDeleteDesc: "Tampilkan dialog konfirmasi sebelum menghapus sesi.",
        settingsConfirmQuickActions: "Konfirmasi simpan/muat ulang di pengalih cepat",
        settingsConfirmQuickActionsDesc: "Tampilkan dialog konfirmasi sebelum menyimpan atau memuat ulang sesi dari pengalih cepat.",
        settingsAutoSaveOnSwitch: "Mode simpan otomatis",
        settingsAutoSaveOnSwitchDesc: "Menyimpan sesi saat ini secara otomatis saat berpindah (default: aktif). Jika dimatikan, Anda dapat menyimpan dan memuat ulang sesi secara manual.",
        settingsWarnUnsavedSwitch: "Peringatkan sebelum berpindah tanpa menyimpan",
        settingsWarnUnsavedSwitchDesc: "Jika simpan otomatis dimatikan dan sesi saat ini punya perubahan yang belum disimpan, tampilkan peringatan sebelum berpindah.",
        settingsStatusBarQuickSwitcher: "Pengalih cepat saat klik bilah status",
        settingsStatusBarQuickSwitcherDesc: "Jika diaktifkan, mengklik bilah status akan membuka pengalih cepat alih-alih pengelola sesi lengkap.",
        settingsResetSessions: "Setel ulang sesi",
        settingsResetSessionsDesc: "Hapus semua sesi tersimpan dan sisakan hanya satu sesi bawaan baru berdasarkan tata letak saat ini.",
        settingsResetSessionsBtn: "Setel ulang",
        confirmResetSessions: "Setel ulang semua sesi ke bawaan? Tindakan ini tidak dapat dibatalkan.",
        resetSessionsHint: "Ini akan menghapus semua sesi tersimpan dan hanya menyisakan satu sesi bawaan.",
        resetSessionsDone: "Sesi berhasil disetel ulang ke bawaan.",
        resetSessionsFailed: "Gagal menyetel ulang sesi.",
        confirmDeleteSettingsHint: "Untuk menonaktifkan konfirmasi ini, buka Pengaturan.",
        // --- Groups ---
        groupCreated: function(n) {
          return 'Grup "' + n + '" dibuat';
        },
        groupDeleted: function(n) {
          return 'Grup "' + n + '" dihapus';
        },
        groupRenamed: function(o, n) {
          return 'Grup diubah namanya: "' + o + '" \u2192 "' + n + '"';
        },
        groupAll: "Semua",
        groupDuplicateName: "Sudah ada grup dengan nama ini.",
        groupEmptyName: "Nama grup tidak boleh kosong.",
        cmdSwitchGroup: "Ganti grup",
        cmdExitGroup: "Tampilkan semua sesi (keluar dari grup)",
        cmdNextGroup: "Grup berikutnya",
        cmdPreviousGroup: "Grup sebelumnya",
        searchOverlayHelpWithGroups: "\u2191\u2193 pindah  /  Tab grup  /  Enter ganti  /  \u21E7Enter simpan  /  \u232B hapus  /  Esc tutup",
        settingsSectionGroups: "Grup sesi",
        contextToggleGroups: "Aktifkan grup sesi",
        settingsSectionGroupsDesc: "Gunakan grup untuk mengatur sesi. Jika dimatikan, tab grup dan aksi pindah grup akan disembunyikan.",
        settingsGroupCreate: "Buat grup",
        settingsGroupCreateDesc: "Buat grup sesi baru.",
        settingsGroupCreatePlaceholder: "Nama grup...",
        settingsGroupCreateBtn: "Buat",
        settingsGroupManageSessions: "Kelola sesi",
        settingsGroupManageSessionsDesc: "Tambah atau hapus sesi dari grup ini.",
        settingsGroupSessionCount: function(n) {
          return n + " sesi";
        },
        settingsGroupDelete: "Hapus grup",
        settingsGroupDeleteConfirm: function(n) {
          return 'Hapus grup "' + n + '"? Sesi tidak akan dihapus.';
        },
        confirmDeleteGroup: function(n) {
          return 'Hapus grup "' + n + '"? Sesi di dalam grup TIDAK akan dihapus.';
        },
        groupAddedSession: function(s, g) {
          return '"' + s + '" ditambahkan ke "' + g + '"';
        },
        groupRemovedSession: function(s, g) {
          return '"' + s + '" dikeluarkan dari "' + g + '"';
        },
        groupRemoveFromGroup: "Keluarkan dari grup",
        groupMoveToGroup: "Pindahkan ke grup",
        groupCreateNew: "Grup baru",
        groupCreatePlaceholder: "Nama grup...",
        groupContextRename: "Ubah nama grup",
        groupContextDelete: "Hapus grup",
        contextSwitchSession: "Beralih ke sesi ini",
        contextRenameSession: "Ubah nama sesi ini",
        contextDeleteSession: "Hapus sesi ini",
        contextDuplicateSession: "Duplikat sesi ini",
        contextReloadSession: "Muat ulang sesi ini",
        contextSaveSession: "Simpan sesi ini",
        groupRemoveAllSessions: "Keluarkan semua sesi dari grup ini",
        confirmRemoveAllFromGroup: function(g, n) {
          return "Keluarkan semua " + n + ' sesi dari "' + g + '"?';
        },
        groupRemovedAllSessions: function(g) {
          return 'Semua sesi dikeluarkan dari "' + g + '"';
        },
        contextDeleteAllGroups: "Hapus semua grup",
        confirmDeleteAllGroups: function(n) {
          return "Hapus semua " + n + " grup? Sesi tidak akan dihapus.";
        },
        deletedAllGroups: function(n) {
          return n + " grup dihapus";
        },
        contextDeleteAllSessions: "Hapus semua sesi",
        confirmDeleteAllSessions: function(n) {
          return "Hapus " + n + " sesi? Sesi aktif akan dipertahankan.";
        },
        deletedAllSessions: function(n) {
          return n + " sesi dihapus";
        },
        contextVersionHistory: "Riwayat versi",
        cmdVersionHistory: "Lihat riwayat versi sesi",
        historyTitle: "Riwayat versi",
        historyEmpty: "Tidak ada riwayat versi untuk sesi ini.",
        historyRestore: "Pulihkan",
        historyRestoreConfirm: function(name, time) {
          return 'Pulihkan tata letak "' + name + '" dari ' + time + "?";
        },
        historyRestored: function(name) {
          return 'Tata letak "' + name + '" dipulihkan';
        },
        historyQuickRestored: function(name) {
          return 'Tata letak sebelumnya "' + name + '" dipulihkan dengan cepat';
        },
        historyNoEntries: "Tidak ada tata letak sebelumnya untuk dipulihkan.",
        historyToday: "Hari ini",
        historyYesterday: "Kemarin",
        historyThisWeek: "Minggu ini",
        historyFiles: function(n) {
          return n + " file";
        },
        historyPanes: function(n) {
          return n + " panel";
        },
        settingsVersionHistoryEnabled: "Aktifkan riwayat versi",
        settingsVersionHistoryEnabledDesc: "Simpan riwayat perubahan tata letak untuk setiap sesi.",
        settingsVersionHistoryInterval: "Interval snapshot (menit)",
        settingsVersionHistoryIntervalDesc: "Seberapa sering memeriksa perubahan tata letak dan menyimpan snapshot.",
        settingsVersionHistoryCtrlRmb: platformLabel("Pemulihan cepat (Cmd + klik kanan)", "Pemulihan cepat (Ctrl + klik kanan)"),
        settingsVersionHistoryCtrlRmbDesc: platformLabel("Klik kanan bilah status sambil menahan Cmd untuk memulihkan tata letak sebelumnya.", "Klik kanan bilah status sambil menahan Ctrl untuk memulihkan tata letak sebelumnya."),
        settingsVersionHistoryConfirmRestore: "Konfirmasi sebelum memulihkan",
        settingsVersionHistoryConfirmRestoreDesc: "Tampilkan dialog konfirmasi sebelum memulihkan tata letak sebelumnya.",
        rotationBackupSectionTitle: "Cadangan",
        rotationBackupCreate: "Buat cadangan",
        rotationBackupCreateBtn: "Buat sekarang",
        rotationBackupCreated: "Cadangan dibuat.",
        rotationBackupFailed: "Gagal membuat cadangan.",
        rotationBackupDesc: "Cadangan otomatis dibuat saat menyimpan (setiap jam, hingga 3 generasi).",
        rotationBackupRestore: "Pulihkan",
        rotationBackupRestoreConfirm: function(time, count) {
          return "Pulihkan dari cadangan " + time + " (" + count + " sesi)? Data saat ini akan ditimpa.";
        },
        rotationBackupRestored: "Dipulihkan dari cadangan.",
        rotationBackupRestoreFailed: "Gagal memulihkan dari cadangan.",
        rotationBackupNone: "Tidak ada cadangan tersedia.",
        rotationBackupGeneration: function(count) {
          return count + " sesi";
        },
        frontmatterSessionNotFound: function(n) {
          return "Sesi \u201C" + n + "\u201D tidak ditemukan (workspace-session)";
        },
        frontmatterAlreadyActive: function(n) {
          return "Sesi \u201C" + n + "\u201D sudah aktif";
        }
      },
      vi: {
        modalTitle: "Qu\u1EA3n l\xFD phi\xEAn l\xE0m vi\u1EC7c",
        savePlaceholder: "T\xEAn phi\xEAn l\xE0m vi\u1EC7c m\u1EDBi...",
        filterPlaceholder: "L\u1ECDc phi\xEAn l\xE0m vi\u1EC7c...",
        settingsShowFilterInput: "Hi\u1EC3n th\u1ECB b\u1ED9 l\u1ECDc phi\xEAn l\xE0m vi\u1EC7c",
        settingsShowFilterInputDesc: "Hi\u1EC3n th\u1ECB b\u1ED9 l\u1ECDc v\u0103n b\u1EA3n trong tr\xECnh qu\u1EA3n l\xFD phi\xEAn l\xE0m vi\u1EC7c \u0111\u1EC3 t\xECm nhanh phi\xEAn l\xE0m vi\u1EC7c.",
        settingsOverlayDefaultFocus: "Ti\xEAu \u0111i\u1EC3m l\u1EDBp ph\u1EE7 m\u1EB7c \u0111\u1ECBnh",
        settingsOverlayDefaultFocusDesc: "Ch\u1ECDn ph\u1EA7n t\u1EED nh\u1EADn ti\xEAu \u0111i\u1EC3m khi tr\xECnh qu\u1EA3n l\xFD phi\xEAn l\xE0m vi\u1EC7c m\u1EDF.",
        settingsOverlayFocusCurrentSession: "Phi\xEAn l\xE0m vi\u1EC7c hi\u1EC7n t\u1EA1i",
        settingsOverlayFocusSessionFilter: "B\u1ED9 l\u1ECDc phi\xEAn l\xE0m vi\u1EC7c",
        settingsOverlayFocusSessionCreate: "T\u1EA1o phi\xEAn l\xE0m vi\u1EC7c",
        settingsSectionSessionManager: "Danh s\xE1ch v\xE0 t\xECm ki\u1EBFm phi\xEAn l\xE0m vi\u1EC7c",
        settingsSectionSessionListSearch: "Danh s\xE1ch v\xE0 t\xECm ki\u1EBFm phi\xEAn l\xE0m vi\u1EC7c",
        settingsShowActiveSwitchCommand: "Hi\u1EC3n th\u1ECB phi\xEAn \u0111ang ho\u1EA1t \u0111\u1ED9ng trong b\u1EA3ng l\u1EC7nh",
        settingsShowActiveSwitchCommandDesc: "Hi\u1EC3n th\u1ECB l\u1EC7nh chuy\u1EC3n t\u1EDBi phi\xEAn \u0111ang ho\u1EA1t \u0111\u1ED9ng trong b\u1EA3ng l\u1EC7nh. Ph\xEDm t\u1EAFt lu\xF4n ho\u1EA1t \u0111\u1ED9ng b\u1EA5t k\u1EC3 c\xE0i \u0111\u1EB7t n\xE0y.",
        settingsNumberedSwitchCommands: "L\u1EC7nh chuy\u1EC3n phi\xEAn \u0111\u01B0\u1EE3c \u0111\xE1nh s\u1ED1",
        settingsNumberedSwitchCommandsDesc: "\u0110\u0103ng k\xFD c\xE1c l\u1EC7nh chuy\u1EC3n v\u1EDBi v\u1ECB tr\xED \u0111\u01B0\u1EE3c \u0111\xE1nh s\u1ED1 (1\u20139) \u0111\u1EC3 g\xE1n ph\xEDm t\u1EAFt. Khi t\u1EAFt, t\u1EA5t c\u1EA3 phi\xEAn s\u1EBD d\xF9ng l\u1EC7nh theo t\xEAn.",
        save: "T\u1EA1o",
        load: "Chuy\u1EC3n",
        saveInline: "L\u01B0u",
        active: "\u0110ANG HO\u1EA0T \u0110\u1ED8NG",
        modifiedJustNow: "V\u1EEBa s\u1EEDa \u0111\u1ED5i",
        modifiedMinutes: function(n) {
          return "\u0110\xE3 s\u1EEDa \u0111\u1ED5i " + n + " ph\xFAt tr\u01B0\u1EDBc";
        },
        modifiedHours: function(n) {
          return "\u0110\xE3 s\u1EEDa \u0111\u1ED5i " + n + " gi\u1EDD tr\u01B0\u1EDBc";
        },
        modifiedDays: function(n) {
          return "\u0110\xE3 s\u1EEDa \u0111\u1ED5i " + n + " ng\xE0y tr\u01B0\u1EDBc";
        },
        duplicateName: "\u0110\xE3 c\xF3 phi\xEAn l\xE0m vi\u1EC7c v\u1EDBi t\xEAn n\xE0y.",
        emptyName: "T\xEAn phi\xEAn l\xE0m vi\u1EC7c kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng.",
        created: function(n) {
          return '\u0110\xE3 t\u1EA1o phi\xEAn l\xE0m vi\u1EC7c "' + n + '"';
        },
        deleted: function(n) {
          return '\u0110\xE3 x\xF3a phi\xEAn l\xE0m vi\u1EC7c "' + n + '"';
        },
        loaded: function(n) {
          return '\u0110\xE3 chuy\u1EC3n sang "' + n + '"';
        },
        renamed: function(o, n) {
          return '\u0110\xE3 \u0111\u1ED5i t\xEAn "' + o + '" th\xE0nh "' + n + '"';
        },
        confirmDelete: function(n) {
          return 'X\xF3a phi\xEAn l\xE0m vi\u1EC7c "' + n + '"?';
        },
        confirmDeleteActive: function(n) {
          return '"' + n + '" l\xE0 phi\xEAn \u0111ang ho\u1EA1t \u0111\u1ED9ng. V\u1EABn x\xF3a?';
        },
        confirmSaveSession: function(n) {
          return 'L\u01B0u phi\xEAn l\xE0m vi\u1EC7c "' + n + '"?';
        },
        confirmOverwriteSessionWithCurrentLayout: function(n) {
          return 'Ghi \u0111\xE8 "' + n + '" b\u1EB1ng b\u1ED1 c\u1EE5c hi\u1EC7n t\u1EA1i?';
        },
        confirmReloadSession: function(n) {
          return 'T\u1EA3i l\u1EA1i phi\xEAn l\xE0m vi\u1EC7c "' + n + '"? C\xE1c thay \u0111\u1ED5i ch\u01B0a l\u01B0u s\u1EBD b\u1ECB m\u1EA5t.';
        },
        renameTitle: "\u0110\u1ED5i t\xEAn phi\xEAn l\xE0m vi\u1EC7c",
        renamePlaceholder: "T\xEAn m\u1EDBi...",
        noSession: "Kh\xF4ng c\xF3 phi\xEAn l\xE0m vi\u1EC7c",
        cannotDeleteLast: "Kh\xF4ng th\u1EC3 x\xF3a phi\xEAn l\xE0m vi\u1EC7c cu\u1ED1i c\xF9ng.",
        confirmBulkDelete: function(n) {
          return "X\xF3a " + n + " phi\xEAn l\xE0m vi\u1EC7c?";
        },
        bulkDeleted: function(n) {
          return "\u0110\xE3 x\xF3a " + n + " phi\xEAn l\xE0m vi\u1EC7c";
        },
        bulkDelete: function(n) {
          return "X\xF3a " + n + " phi\xEAn l\xE0m vi\u1EC7c";
        },
        cmdManage: "Qu\u1EA3n l\xFD phi\xEAn l\xE0m vi\u1EC7c",
        cmdCreate: "T\u1EA1o phi\xEAn l\xE0m vi\u1EC7c m\u1EDBi",
        cmdRename: "\u0110\u1ED5i t\xEAn phi\xEAn l\xE0m vi\u1EC7c hi\u1EC7n t\u1EA1i",
        cmdDelete: "X\xF3a phi\xEAn l\xE0m vi\u1EC7c hi\u1EC7n t\u1EA1i",
        cmdNewEmpty: "T\u1EA1o phi\xEAn l\xE0m vi\u1EC7c tr\u1ED1ng",
        cmdDuplicate: "Nh\xE2n b\u1EA3n phi\xEAn l\xE0m vi\u1EC7c hi\u1EC7n t\u1EA1i",
        duplicated: function(n) {
          return '\u0110\xE3 nh\xE2n b\u1EA3n th\xE0nh "' + n + '"';
        },
        deselect: "B\u1ECF ch\u1ECDn",
        footerDragReorder: "K\xE9o \u0111\u1EC3 s\u1EAFp x\u1EBFp l\u1EA1i",
        footerDragToGroup: "K\xE9o v\xE0o tab nh\xF3m \u0111\u1EC3 di chuy\u1EC3n",
        defaultLabel: "(m\u1EB7c \u0111\u1ECBnh)",
        rename: "\u0110\u1ED5i t\xEAn",
        delete: "X\xF3a",
        remove: "G\u1EE1",
        cancel: "H\u1EE7y",
        ribbonTooltip: "Workspace++",
        cmdSwitchTo: function(n, name) {
          return name ? "Chuy\u1EC3n sang phi\xEAn " + n + ": " + name : "Chuy\u1EC3n sang phi\xEAn " + n;
        },
        cmdSwitchToNamed: function(name) {
          return 'Chuy\u1EC3n sang "' + name + '"';
        },
        cmdPrevious: "Phi\xEAn tr\u01B0\u1EDBc",
        cmdNext: "Phi\xEAn ti\u1EBFp theo",
        cmdSaveCurrent: "L\u01B0u phi\xEAn hi\u1EC7n t\u1EA1i",
        cmdSaveAs: "L\u01B0u phi\xEAn hi\u1EC7n t\u1EA1i th\xE0nh...",
        cmdSaveCurrentLayoutToSession: "L\u01B0u b\u1ED1 c\u1EE5c hi\u1EC7n t\u1EA1i v\xE0o phi\xEAn...",
        cmdReloadCurrentWithoutSaving: "T\u1EA3i l\u1EA1i phi\xEAn hi\u1EC7n t\u1EA1i (kh\xF4ng l\u01B0u)",
        cmdToggleAutoSave: "B\u1EADt/t\u1EAFt t\u1EF1 \u0111\u1ED9ng l\u01B0u khi chuy\u1EC3n phi\xEAn",
        cmdEnableAutoSave: "B\u1EADt t\u1EF1 \u0111\u1ED9ng l\u01B0u khi chuy\u1EC3n phi\xEAn",
        cmdDisableAutoSave: "T\u1EAFt t\u1EF1 \u0111\u1ED9ng l\u01B0u khi chuy\u1EC3n phi\xEAn",
        cmdSearchOverlay: "T\xECm ki\u1EBFm phi\xEAn l\xE0m vi\u1EC7c",
        cmdExportSessions: "Xu\u1EA5t b\u1EA3n ch\u1EE5p nhanh phi\xEAn l\xE0m vi\u1EC7c",
        cmdImportSessions: "Nh\u1EADp b\u1EA3n ch\u1EE5p nhanh phi\xEAn l\xE0m vi\u1EC7c m\u1EDBi nh\u1EA5t",
        switchLeft: "Tr\xE1i",
        switchRight: "Ph\u1EA3i",
        switchGroup: "Nh\xF3m",
        keyTab: "Tab",
        savedSession: function(n) {
          return '\u0110\xE3 l\u01B0u "' + n + '"';
        },
        savedAs: function(n) {
          return '\u0110\xE3 l\u01B0u th\xE0nh "' + n + '"';
        },
        savedCurrentLayoutToSession: function(n) {
          return '\u0110\xE3 l\u01B0u b\u1ED1 c\u1EE5c hi\u1EC7n t\u1EA1i v\xE0o "' + n + '"';
        },
        noChanges: "Kh\xF4ng c\xF3 thay \u0111\u1ED5i \u0111\u1EC3 l\u01B0u",
        reloadedSession: function(n) {
          return '\u0110\xE3 t\u1EA3i l\u1EA1i "' + n + '"';
        },
        autoSaveEnabled: "\u0110\xE3 b\u1EADt t\u1EF1 \u0111\u1ED9ng l\u01B0u khi chuy\u1EC3n phi\xEAn.",
        autoSaveDisabled: "\u0110\xE3 t\u1EAFt t\u1EF1 \u0111\u1ED9ng l\u01B0u khi chuy\u1EC3n phi\xEAn.",
        confirmUnsavedSwitch: function(n) {
          return 'Phi\xEAn hi\u1EC7n t\u1EA1i c\xF3 thay \u0111\u1ED5i ch\u01B0a l\u01B0u. Chuy\u1EC3n sang "' + n + '"?';
        },
        saveAndSwitch: "L\u01B0u v\xE0 chuy\u1EC3n",
        switchWithoutSaving: "Chuy\u1EC3n m\xE0 kh\xF4ng l\u01B0u",
        defaultSessionName: "m\u1EB7c \u0111\u1ECBnh",
        nameSessionTitle: "L\u01B0u v\u1EDBi t\xEAn phi\xEAn l\xE0m vi\u1EC7c",
        nameSessionPlaceholder: "T\xEAn phi\xEAn l\xE0m vi\u1EC7c...",
        saveWithoutNaming: "L\u01B0u m\xE0 kh\xF4ng \u0111\u1EB7t t\xEAn",
        sessionAutoName: function(n) {
          return "Phi\xEAn l\xE0m vi\u1EC7c m\u1EDBi " + n;
        },
        noFilteredSessions: "Kh\xF4ng c\xF3 phi\xEAn l\xE0m vi\u1EC7c ph\xF9 h\u1EE3p",
        noGroupSessions: "Kh\xF4ng c\xF3 phi\xEAn l\xE0m vi\u1EC7c trong nh\xF3m n\xE0y",
        searchOverlayPlaceholder: "Nh\u1EADp \u0111\u1EC3 l\u1ECDc phi\xEAn l\xE0m vi\u1EC7c...",
        saveCurrentLayoutToSessionPlaceholder: "Ch\u1ECDn phi\xEAn l\xE0m vi\u1EC7c \u0111\u1EC3 ghi \u0111\xE8...",
        searchOverlayHelp: "\u2191\u2193 di chuy\u1EC3n  /  Enter chuy\u1EC3n  /  \u21E7Enter l\u01B0u  /  \u232B x\xF3a  /  Esc \u0111\xF3ng",
        backupRestored: "Workspace++: \u0110\xE3 kh\xF4i ph\u1EE5c phi\xEAn l\xE0m vi\u1EC7c t\u1EEB b\u1EA3n sao l\u01B0u.",
        sessionDataMigrated: "Workspace++: D\u1EEF li\u1EC7u phi\xEAn l\xE0m vi\u1EC7c \u0111\xE3 \u0111\u01B0\u1EE3c chuy\u1EC3n sang .workspace-plus-plus/sessions.json.",
        sessionDataMigrationFailed: "Workspace++: Kh\xF4ng th\u1EC3 chuy\u1EC3n d\u1EEF li\u1EC7u phi\xEAn l\xE0m vi\u1EC7c. D\u1EEF li\u1EC7u c\u0169 v\u1EABn \u0111\u01B0\u1EE3c gi\u1EEF l\u1EA1i.",
        localSettingsEnabled: "Workspace++: \u0110\xE3 b\u1EADt c\xE0i \u0111\u1EB7t ri\xEAng cho vault.",
        localSettingsDisabled: "Workspace++: \u0110\xE3 t\u1EAFt c\xE0i \u0111\u1EB7t ri\xEAng cho vault.",
        localSettingsCopied: "Workspace++: \u0110\xE3 sao ch\xE9p c\xE0i \u0111\u1EB7t to\xE0n c\u1EE5c sang c\xE0i \u0111\u1EB7t ri\xEAng cho vault.",
        localSettingsLoadFailed: "Workspace++: Kh\xF4ng th\u1EC3 t\u1EA3i c\xE0i \u0111\u1EB7t ri\xEAng cho vault. S\u1EBD d\xF9ng c\xE0i \u0111\u1EB7t to\xE0n c\u1EE5c.",
        localSettingsOperationFailed: "Workspace++: Kh\xF4ng th\u1EC3 c\u1EADp nh\u1EADt c\xE0i \u0111\u1EB7t ri\xEAng cho vault.",
        exportSessionsDone: function(path) {
          return "Workspace++: \u0110\xE3 xu\u1EA5t phi\xEAn l\xE0m vi\u1EC7c t\u1EDBi " + path;
        },
        exportSessionsFailed: "Workspace++: Kh\xF4ng th\u1EC3 xu\u1EA5t phi\xEAn l\xE0m vi\u1EC7c.",
        importSessionsDone: function(path) {
          return "Workspace++: \u0110\xE3 nh\u1EADp phi\xEAn l\xE0m vi\u1EC7c t\u1EEB " + path;
        },
        importSessionsNoFile: "Workspace++: Kh\xF4ng t\xECm th\u1EA5y t\u1EC7p xu\u1EA5t trong .workspace-plus-plus/exports.",
        importSessionsFailed: "Workspace++: Kh\xF4ng th\u1EC3 nh\u1EADp phi\xEAn l\xE0m vi\u1EC7c.",
        settingsLanguage: "Ng\xF4n ng\u1EEF",
        settingsLanguageDesc: "Ng\xF4n ng\u1EEF giao di\u1EC7n c\u1EE7a plugin. Kh\u1EDFi \u0111\u1ED9ng l\u1EA1i Obsidian \u0111\u1EC3 \xE1p d\u1EE5ng cho t\xEAn l\u1EC7nh.",
        settingsSectionGeneral: "Chung",
        settingsTabSessions: "Phi\xEAn l\xE0m vi\u1EC7c",
        settingsSectionSwitching: "Chuy\u1EC3n phi\xEAn l\xE0m vi\u1EC7c",
        settingsSectionSwitchCommands: "L\u1EC7nh chuy\u1EC3n phi\xEAn",
        settingsSectionScrollSwitch: "Chuy\u1EC3n phi\xEAn b\u1EB1ng cu\u1ED9n",
        settingsSectionSwitchPreview: "Xem tr\u01B0\u1EDBc tr\u01B0\u1EDBc khi chuy\u1EC3n",
        settingsSubsectionSwitchSaving: "L\u01B0u khi chuy\u1EC3n phi\xEAn l\xE0m vi\u1EC7c",
        settingsSubsectionAutoSaveMode: "Ch\u1EBF \u0111\u1ED9 t\u1EF1 \u0111\u1ED9ng l\u01B0u phi\xEAn",
        settingsSubsectionSwitchCommands: "L\u1EC7nh chuy\u1EC3n phi\xEAn l\xE0m vi\u1EC7c",
        settingsSubsectionScrollSwitch: "Chuy\u1EC3n phi\xEAn l\xE0m vi\u1EC7c b\u1EB1ng cu\u1ED9n",
        settingsSubsectionSwitchPreview: "Xem tr\u01B0\u1EDBc tr\u01B0\u1EDBc khi chuy\u1EC3n phi\xEAn",
        settingsSectionDeletion: "X\xF3a phi\xEAn l\xE0m vi\u1EC7c",
        settingsSectionAdvanced: "N\xE2ng cao",
        settingsSectionReset: "\u0110\u1EB7t l\u1EA1i",
        settingsStatusBarModScrollSwitch: "B\u1EADt chuy\u1EC3n phi\xEAn t\u1EEB thanh tr\u1EA1ng th\xE1i",
        settingsStatusBarModScrollSwitchDesc: "Tr\xEAn m\u1EE5c thanh tr\u1EA1ng th\xE1i, cu\u1ED9n d\u1ECDc trong khi gi\u1EEF ph\xEDm b\u1ED5 tr\u1EE3 \u0111\xE3 ch\u1ECDn \u0111\u1EC3 chuy\u1EC3n phi\xEAn. Ng\u01B0\u1EE1ng v\xE0 th\u1EDDi gian ch\u1EDD gi\xFAp gi\u1EA3m k\xEDch ho\u1EA1t nh\u1EA7m t\u1EEB trackpad.",
        settingsStatusBarScrollPreset: "C\u1EA5u h\xECnh cu\u1ED9n",
        settingsStatusBarScrollPresetDesc: "Ch\u1ECDn c\u1EA5u h\xECnh ph\xF9 h\u1EE3p v\u1EDBi thi\u1EBFt b\u1ECB, ho\u1EB7c chuy\u1EC3n sang T\xF9y ch\u1EC9nh \u0111\u1EC3 t\u1EF1 ch\u1EC9nh c\xE1c gi\xE1 tr\u1ECB.",
        settingsStatusBarScrollPresetTrackpad: "Trackpad",
        settingsStatusBarScrollPresetNotchedWheel: "Con l\u0103n chu\u1ED9t c\xF3 n\u1EA5c",
        settingsStatusBarScrollPresetFreeSpinWheel: "Con l\u0103n chu\u1ED9t quay t\u1EF1 do",
        settingsStatusBarScrollPresetCustom: "T\xF9y ch\u1EC9nh",
        settingsStatusBarScrollModifier: "Ph\xEDm b\u1ED5 tr\u1EE3 b\u1EAFt bu\u1ED9c",
        settingsStatusBarScrollModifierDesc: "Ch\u1ECDn ph\xEDm b\u1ED5 tr\u1EE3 c\u1EA7n gi\u1EEF khi cu\u1ED9n tr\xEAn m\u1EE5c thanh tr\u1EA1ng th\xE1i.",
        settingsStatusBarScrollModifierRecommended: "Cmd ho\u1EB7c Option",
        settingsStatusBarScrollModifierNone: "Kh\xF4ng",
        settingsStatusBarScrollModifierModOnly: "Ch\u1EC9 Cmd",
        settingsStatusBarScrollModifierAltOnly: "Ch\u1EC9 Option",
        settingsStatusBarScrollModifierModOrAlt: "Cmd ho\u1EB7c Option",
        settingsStatusBarScrollThreshold: "Ng\u01B0\u1EE1ng \u0111\u1ED9 nh\u1EA1y",
        settingsStatusBarScrollThresholdDesc: "Gi\xE1 tr\u1ECB th\u1EA5p h\u01A1n s\u1EBD chuy\u1EC3n phi\xEAn d\u1EC5 h\u01A1n. Ch\u1EC9 d\xF9ng khi c\u1EA5u h\xECnh l\xE0 T\xF9y ch\u1EC9nh.",
        settingsStatusBarScrollCooldown: "Th\u1EDDi gian ch\u1EDD",
        settingsStatusBarScrollCooldownDesc: "Th\u1EDDi gian t\u1ED1i thi\u1EC3u gi\u1EEFa c\xE1c l\u1EA7n chuy\u1EC3n phi\xEAn do cu\u1ED9n. Ch\u1EC9 d\xF9ng khi c\u1EA5u h\xECnh l\xE0 T\xF9y ch\u1EC9nh.",
        settingsStatusBarScrollResetWindow: "Kho\u1EA3ng \u0111\u1EB7t l\u1EA1i t\xEDch l\u0169y",
        settingsStatusBarScrollResetWindowDesc: "Th\u1EDDi gian c\u1ED9ng d\u1ED3n c\xE1c b\u01B0\u1EDBc cu\u1ED9n nh\u1ECF tr\u01B0\u1EDBc khi \u0111\u1EB7t l\u1EA1i. Ch\u1EC9 d\xF9ng khi c\u1EA5u h\xECnh l\xE0 T\xF9y ch\u1EC9nh.",
        settingsStatusBarScrollInvert: "\u0110\u1EA3o chi\u1EC1u cu\u1ED9n",
        settingsStatusBarScrollInvertDesc: "\u0110\u1EA3o h\u01B0\u1EDBng tr\u01B0\u1EDBc/ti\u1EBFp theo khi chuy\u1EC3n phi\xEAn b\u1EB1ng cu\u1ED9n tr\xEAn thanh tr\u1EA1ng th\xE1i.",
        settingsLangAuto: "T\u1EF1 \u0111\u1ED9ng (ng\xF4n ng\u1EEF h\u1EC7 th\u1ED1ng)",
        settingsGitHubLink: "GitHub",
        settingsTranslationHelp: "Th\u1EA5y l\u1ED7i d\u1ECBch thu\u1EADt? Vui l\xF2ng m\u1EDF issue ho\u1EB7c pull request tr\xEAn GitHub.",
        settingsPreviewHeading: "B\u1EADt xem tr\u01B0\u1EDBc tr\u01B0\u1EDBc khi chuy\u1EC3n phi\xEAn",
        settingsPreviewDesc: "Khi chuy\u1EC3n phi\xEAn b\u1EB1ng ph\xEDm t\u1EAFt, l\u1EA7n nh\u1EA5n \u0111\u1EA7u ti\xEAn ch\u1EC9 hi\u1EC3n th\u1ECB v\u1ECB tr\xED hi\u1EC7n t\u1EA1i m\xE0 kh\xF4ng chuy\u1EC3n.",
        settingsPreviewNext: "Phi\xEAn ti\u1EBFp theo",
        settingsPreviewPrevious: "Phi\xEAn tr\u01B0\u1EDBc",
        settingsHotkeys: "Ph\xEDm t\u1EAFt",
        settingsHotkeysBtn: "M\u1EDF c\xE0i \u0111\u1EB7t ph\xEDm t\u1EAFt",
        contextOpenSettings: "M\u1EDF c\xE0i \u0111\u1EB7t",
        contextCustomizeClicks: "T\xF9y ch\u1EC9nh thao t\xE1c nh\u1EA5p",
        settingsSectionStatusBar: "Thao t\xE1c nh\u1EA5p tr\xEAn thanh tr\u1EA1ng th\xE1i",
        statusBarSlotClick: "Nh\u1EA5p",
        statusBarSlotAltClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + Nh\u1EA5p";
        },
        statusBarSlotModClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + Nh\u1EA5p";
        },
        statusBarSlotShiftClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + Nh\u1EA5p";
        },
        statusBarSlotMiddleClick: "Nh\u1EA5p chu\u1ED9t gi\u1EEFa",
        statusBarSlotAltMiddleClick: modifiedClickLabel("Nh\u1EA5p chu\u1ED9t gi\u1EEFa", "\u2325", "Alt"),
        statusBarSlotModMiddleClick: modifiedClickLabel("Nh\u1EA5p chu\u1ED9t gi\u1EEFa", "\u2318", "Ctrl"),
        statusBarSlotShiftMiddleClick: modifiedClickLabel("Nh\u1EA5p chu\u1ED9t gi\u1EEFa", "\u21E7", "Shift"),
        statusBarSlotRightClick: "Nh\u1EA5p chu\u1ED9t ph\u1EA3i",
        statusBarSlotAltRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + Nh\u1EA5p chu\u1ED9t ph\u1EA3i";
        },
        statusBarSlotModRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + Nh\u1EA5p chu\u1ED9t ph\u1EA3i";
        },
        statusBarSlotShiftRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + Nh\u1EA5p chu\u1ED9t ph\u1EA3i";
        },
        statusBarActionNone: "Kh\xF4ng l\xE0m g\xEC",
        statusBarActionQuickSwitcher: "M\u1EDF tr\xECnh chuy\u1EC3n nhanh",
        statusBarActionSessionManager: "M\u1EDF tr\xECnh qu\u1EA3n l\xFD phi\xEAn l\xE0m vi\u1EC7c",
        statusBarActionSaveSession: "L\u01B0u phi\xEAn l\xE0m vi\u1EC7c",
        statusBarActionReloadWithoutSaving: "T\u1EA3i l\u1EA1i m\xE0 kh\xF4ng l\u01B0u",
        statusBarActionVersionHistory: "Hi\u1EC3n th\u1ECB l\u1ECBch s\u1EED phi\xEAn b\u1EA3n",
        statusBarActionRestoreLatestHistory: "Kh\xF4i ph\u1EE5c l\u1ECBch s\u1EED m\u1EDBi nh\u1EA5t",
        statusBarActionSessionMenu: "Menu ng\u1EEF c\u1EA3nh phi\xEAn",
        statusBarActionSettingsMenu: "Menu ng\u1EEF c\u1EA3nh c\xE0i \u0111\u1EB7t",
        contextResetOverlayPosition: "\u0110\u1EB7t l\u1EA1i v\u1ECB tr\xED v\xE0 k\xEDch th\u01B0\u1EDBc",
        settingsConfirmDelete: "X\xE1c nh\u1EADn tr\u01B0\u1EDBc khi x\xF3a phi\xEAn",
        settingsConfirmDeleteDesc: "Hi\u1EC3n th\u1ECB h\u1ED9p tho\u1EA1i x\xE1c nh\u1EADn tr\u01B0\u1EDBc khi x\xF3a phi\xEAn l\xE0m vi\u1EC7c.",
        settingsConfirmQuickActions: "X\xE1c nh\u1EADn l\u01B0u/t\u1EA3i l\u1EA1i trong tr\xECnh chuy\u1EC3n nhanh",
        settingsConfirmQuickActionsDesc: "Hi\u1EC3n th\u1ECB h\u1ED9p tho\u1EA1i x\xE1c nh\u1EADn tr\u01B0\u1EDBc khi l\u01B0u ho\u1EB7c t\u1EA3i l\u1EA1i phi\xEAn t\u1EEB l\u1EDBp ph\u1EE7 tr\xECnh chuy\u1EC3n nhanh.",
        settingsAutoSaveOnSwitch: "Ch\u1EBF \u0111\u1ED9 t\u1EF1 \u0111\u1ED9ng l\u01B0u",
        settingsAutoSaveOnSwitchDesc: "T\u1EF1 \u0111\u1ED9ng l\u01B0u phi\xEAn hi\u1EC7n t\u1EA1i khi chuy\u1EC3n phi\xEAn (m\u1EB7c \u0111\u1ECBnh: B\u1EACT). Khi T\u1EAET, b\u1EA1n c\xF3 th\u1EC3 l\u01B0u v\xE0 t\u1EA3i l\u1EA1i phi\xEAn th\u1EE7 c\xF4ng.",
        settingsWarnUnsavedSwitch: "C\u1EA3nh b\xE1o tr\u01B0\u1EDBc khi chuy\u1EC3n m\xE0 kh\xF4ng l\u01B0u",
        settingsWarnUnsavedSwitchDesc: "Khi t\u1EF1 \u0111\u1ED9ng l\u01B0u b\u1ECB t\u1EAFt v\xE0 phi\xEAn hi\u1EC7n t\u1EA1i c\xF3 thay \u0111\u1ED5i ch\u01B0a l\u01B0u, hi\u1EC3n th\u1ECB c\u1EA3nh b\xE1o tr\u01B0\u1EDBc khi chuy\u1EC3n.",
        settingsStatusBarQuickSwitcher: "M\u1EDF tr\xECnh chuy\u1EC3n nhanh khi nh\u1EA5p thanh tr\u1EA1ng th\xE1i",
        settingsStatusBarQuickSwitcherDesc: "Khi b\u1EADt, nh\u1EA5p v\xE0o thanh tr\u1EA1ng th\xE1i s\u1EBD m\u1EDF l\u1EDBp ph\u1EE7 tr\xECnh chuy\u1EC3n nhanh thay v\xEC tr\xECnh qu\u1EA3n l\xFD phi\xEAn \u0111\u1EA7y \u0111\u1EE7.",
        settingsUseLocalSettings: "D\xF9ng c\xE0i \u0111\u1EB7t ri\xEAng cho vault",
        settingsUseLocalSettingsDesc: "B\u1EADt t\xF9y ch\u1ECDn n\xE0y n\u1EBFu b\u1EA1n \u0111\u1ED3ng b\u1ED9 .obsidian gi\u1EEFa nhi\u1EC1u vault (v\xED d\u1EE5 b\u1EB1ng Settings Profiles) v\xE0 mu\u1ED1n c\xE0i \u0111\u1EB7t Workspace++ kh\xE1c nhau theo t\u1EEBng vault.",
        settingsCopyGlobalToLocal: "Sao ch\xE9p c\xE0i \u0111\u1EB7t to\xE0n c\u1EE5c v\xE0o vault n\xE0y",
        settingsCopyGlobalToLocalDesc: "Ghi \u0111\xE8 c\xE0i \u0111\u1EB7t ri\xEAng cho vault b\u1EB1ng c\xE0i \u0111\u1EB7t to\xE0n c\u1EE5c hi\u1EC7n t\u1EA1i.",
        settingsCopyGlobalToLocalBtn: "Sao ch\xE9p",
        settingsResetLocalSettings: "\u0110\u1EB7t l\u1EA1i c\xE0i \u0111\u1EB7t ri\xEAng cho vault",
        settingsResetLocalSettingsDesc: "\u0110\u1EB7t l\u1EA1i c\xE0i \u0111\u1EB7t ri\xEAng cho vault v\u1EC1 c\xE0i \u0111\u1EB7t to\xE0n c\u1EE5c.",
        settingsResetLocalSettingsBtn: "\u0110\u1EB7t l\u1EA1i c\u1EE5c b\u1ED9",
        settingsAdvancedStorageSubsection: "H\xE0nh vi l\u01B0u tr\u1EEF",
        settingsAdvancedTransferSubsection: "Chuy\u1EC3n d\u1EEF li\u1EC7u",
        settingsDeveloperSection: "C\xF4ng c\u1EE5 nh\xE0 ph\xE1t tri\u1EC3n",
        settingsStorageDiagnostics: "Ch\u1EA9n \u0111o\xE1n l\u01B0u tr\u1EEF",
        settingsStorageDiagnosticsDesc: "Th\xF4ng tin l\u01B0u tr\u1EEF Workspace++ \u0111ang d\xF9ng.",
        settingsStorageFieldSessions: "T\u1EC7p phi\xEAn l\xE0m vi\u1EC7c",
        settingsStorageFieldSessionsBackup: "B\u1EA3n sao l\u01B0u phi\xEAn",
        settingsStorageFieldLocalSettings: "T\u1EC7p c\xE0i \u0111\u1EB7t c\u1EE5c b\u1ED9",
        settingsStorageFieldGlobalSettings: "T\u1EC7p c\xE0i \u0111\u1EB7t to\xE0n c\u1EE5c",
        settingsStorageFieldSessionCount: "S\u1ED1 phi\xEAn",
        settingsStorageFieldUpdatedAt: "C\u1EADp nh\u1EADt l\xFAc",
        settingsExportSessions: "Xu\u1EA5t phi\xEAn l\xE0m vi\u1EC7c",
        settingsExportSessionsDesc: "L\u01B0u b\u1EA3n ch\u1EE5p nhanh v\xE0o .workspace-plus-plus/exports.",
        settingsExportSessionsBtn: "Xu\u1EA5t",
        settingsImportSessions: "Nh\u1EADp phi\xEAn l\xE0m vi\u1EC7c",
        settingsImportSessionsDesc: "Nh\u1EADp b\u1EA3n ch\u1EE5p nhanh m\u1EDBi nh\u1EA5t t\u1EEB .workspace-plus-plus/exports.",
        settingsImportSessionsBtn: "Nh\u1EADp m\u1EDBi nh\u1EA5t",
        confirmImportSessions: "Nh\u1EADp phi\xEAn l\xE0m vi\u1EC7c \u0111\xE3 xu\u1EA5t m\u1EDBi nh\u1EA5t? Phi\xEAn hi\u1EC7n t\u1EA1i s\u1EBD b\u1ECB thay th\u1EBF.",
        settingsResetSettings: "\u0110\u1EB7t l\u1EA1i c\xE0i \u0111\u1EB7t",
        settingsResetSettingsDesc: "\u0110\u1EB7t l\u1EA1i c\xE0i \u0111\u1EB7t Workspace++ cho ph\u1EA1m vi c\xE0i \u0111\u1EB7t hi\u1EC7n t\u1EA1i.",
        settingsResetSettingsBtn: "\u0110\u1EB7t l\u1EA1i c\xE0i \u0111\u1EB7t",
        confirmResetSettings: "\u0110\u1EB7t l\u1EA1i c\xE0i \u0111\u1EB7t Workspace++ v\u1EC1 m\u1EB7c \u0111\u1ECBnh?",
        resetSettingsDone: "\u0110\xE3 \u0111\u1EB7t l\u1EA1i c\xE0i \u0111\u1EB7t Workspace++.",
        resetSettingsFailed: "Kh\xF4ng th\u1EC3 \u0111\u1EB7t l\u1EA1i c\xE0i \u0111\u1EB7t Workspace++.",
        settingsResetSessions: "\u0110\u1EB7t l\u1EA1i phi\xEAn l\xE0m vi\u1EC7c",
        settingsResetSessionsDesc: "X\xF3a t\u1EA5t c\u1EA3 phi\xEAn \u0111\xE3 l\u01B0u v\xE0 ch\u1EC9 gi\u1EEF m\u1ED9t phi\xEAn m\u1EB7c \u0111\u1ECBnh m\u1EDBi t\u1EEB b\u1ED1 c\u1EE5c hi\u1EC7n t\u1EA1i.",
        settingsResetSessionsBtn: "\u0110\u1EB7t l\u1EA1i",
        confirmResetSessions: "\u0110\u1EB7t l\u1EA1i t\u1EA5t c\u1EA3 phi\xEAn v\u1EC1 m\u1EB7c \u0111\u1ECBnh? Kh\xF4ng th\u1EC3 ho\xE0n t\xE1c thao t\xE1c n\xE0y.",
        resetSessionsHint: "Thao t\xE1c n\xE0y s\u1EBD x\xF3a m\u1ECDi phi\xEAn \u0111\xE3 l\u01B0u v\xE0 ch\u1EC9 gi\u1EEF l\u1EA1i m\u1ED9t phi\xEAn m\u1EB7c \u0111\u1ECBnh.",
        resetSessionsDone: "\u0110\xE3 \u0111\u1EB7t l\u1EA1i phi\xEAn l\xE0m vi\u1EC7c v\u1EC1 m\u1EB7c \u0111\u1ECBnh.",
        resetSessionsFailed: "Kh\xF4ng th\u1EC3 \u0111\u1EB7t l\u1EA1i phi\xEAn l\xE0m vi\u1EC7c.",
        settingsResetSessionsAndSettings: "\u0110\u1EB7t l\u1EA1i phi\xEAn v\xE0 c\xE0i \u0111\u1EB7t",
        settingsResetSessionsAndSettingsDesc: "\u0110\u1EB7t l\u1EA1i c\u1EA3 phi\xEAn \u0111\xE3 l\u01B0u v\xE0 c\xE0i \u0111\u1EB7t Workspace++ c\xF9ng l\xFAc.",
        settingsResetSessionsAndSettingsBtn: "\u0110\u1EB7t l\u1EA1i c\u1EA3 hai",
        confirmResetSessionsAndSettings: "\u0110\u1EB7t l\u1EA1i c\u1EA3 phi\xEAn v\xE0 c\xE0i \u0111\u1EB7t? Kh\xF4ng th\u1EC3 ho\xE0n t\xE1c thao t\xE1c n\xE0y.",
        resetSessionsAndSettingsDone: "\u0110\xE3 \u0111\u1EB7t l\u1EA1i phi\xEAn v\xE0 c\xE0i \u0111\u1EB7t.",
        resetSessionsAndSettingsFailed: "Kh\xF4ng th\u1EC3 \u0111\u1EB7t l\u1EA1i phi\xEAn v\xE0 c\xE0i \u0111\u1EB7t.",
        confirmDeleteSettingsHint: "\u0110\u1EC3 t\u1EAFt x\xE1c nh\u1EADn n\xE0y, h\xE3y v\xE0o C\xE0i \u0111\u1EB7t.",
        groupCreated: function(n) {
          return '\u0110\xE3 t\u1EA1o nh\xF3m "' + n + '"';
        },
        groupDeleted: function(n) {
          return '\u0110\xE3 x\xF3a nh\xF3m "' + n + '"';
        },
        groupRenamed: function(o, n) {
          return '\u0110\xE3 \u0111\u1ED5i t\xEAn nh\xF3m: "' + o + '" \u2192 "' + n + '"';
        },
        groupAll: "T\u1EA5t c\u1EA3",
        groupDuplicateName: "\u0110\xE3 c\xF3 nh\xF3m v\u1EDBi t\xEAn n\xE0y.",
        groupEmptyName: "T\xEAn nh\xF3m kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng.",
        cmdSwitchGroup: "Chuy\u1EC3n nh\xF3m",
        cmdExitGroup: "Hi\u1EC3n th\u1ECB t\u1EA5t c\u1EA3 phi\xEAn (tho\xE1t nh\xF3m)",
        cmdNextGroup: "Nh\xF3m ti\u1EBFp theo",
        cmdPreviousGroup: "Nh\xF3m tr\u01B0\u1EDBc",
        searchOverlayHelpWithGroups: "\u2191\u2193 di chuy\u1EC3n  /  Tab nh\xF3m  /  Enter chuy\u1EC3n  /  \u21E7Enter l\u01B0u  /  \u232B x\xF3a  /  Esc \u0111\xF3ng",
        settingsSectionGroups: "Nh\xF3m phi\xEAn l\xE0m vi\u1EC7c",
        contextToggleGroups: "B\u1EADt nh\xF3m phi\xEAn l\xE0m vi\u1EC7c",
        settingsSectionGroupsDesc: "D\xF9ng nh\xF3m \u0111\u1EC3 s\u1EAFp x\u1EBFp phi\xEAn l\xE0m vi\u1EC7c. T\u1EAFt t\xF9y ch\u1ECDn n\xE0y \u0111\u1EC3 \u1EA9n tab nh\xF3m v\xE0 thao t\xE1c chuy\u1EC3n nh\xF3m.",
        settingsGroupCreate: "T\u1EA1o nh\xF3m",
        settingsGroupCreateDesc: "T\u1EA1o nh\xF3m phi\xEAn l\xE0m vi\u1EC7c m\u1EDBi.",
        settingsGroupCreatePlaceholder: "T\xEAn nh\xF3m...",
        settingsGroupCreateBtn: "T\u1EA1o",
        settingsGroupManageSessions: "Qu\u1EA3n l\xFD phi\xEAn l\xE0m vi\u1EC7c",
        settingsGroupManageSessionsDesc: "Th\xEAm ho\u1EB7c g\u1EE1 phi\xEAn l\xE0m vi\u1EC7c kh\u1ECFi nh\xF3m n\xE0y.",
        settingsGroupSessionCount: function(n) {
          return n + " phi\xEAn l\xE0m vi\u1EC7c";
        },
        settingsGroupDelete: "X\xF3a nh\xF3m",
        settingsGroupDeleteConfirm: function(n) {
          return 'X\xF3a nh\xF3m "' + n + '"? Phi\xEAn l\xE0m vi\u1EC7c s\u1EBD kh\xF4ng b\u1ECB x\xF3a.';
        },
        confirmDeleteGroup: function(n) {
          return 'X\xF3a nh\xF3m "' + n + '"? Phi\xEAn l\xE0m vi\u1EC7c trong nh\xF3m s\u1EBD KH\xD4NG b\u1ECB x\xF3a.';
        },
        groupAddedSession: function(s, g) {
          return '\u0110\xE3 th\xEAm "' + s + '" v\xE0o "' + g + '"';
        },
        groupRemovedSession: function(s, g) {
          return '\u0110\xE3 g\u1EE1 "' + s + '" kh\u1ECFi "' + g + '"';
        },
        groupRemoveFromGroup: "G\u1EE1 kh\u1ECFi nh\xF3m",
        groupMoveToGroup: "Di chuy\u1EC3n v\xE0o nh\xF3m",
        groupCreateNew: "Nh\xF3m m\u1EDBi",
        groupCreatePlaceholder: "T\xEAn nh\xF3m...",
        groupContextRename: "\u0110\u1ED5i t\xEAn nh\xF3m",
        groupContextDelete: "X\xF3a nh\xF3m",
        contextSwitchSession: "Chuy\u1EC3n sang phi\xEAn n\xE0y",
        contextRenameSession: "\u0110\u1ED5i t\xEAn phi\xEAn n\xE0y",
        contextDeleteSession: "X\xF3a phi\xEAn n\xE0y",
        contextDuplicateSession: "Nh\xE2n b\u1EA3n phi\xEAn n\xE0y",
        contextReloadSession: "T\u1EA3i l\u1EA1i phi\xEAn n\xE0y",
        contextSaveSession: "L\u01B0u phi\xEAn n\xE0y",
        contextSaveCurrentLayoutToThisSession: "L\u01B0u b\u1ED1 c\u1EE5c hi\u1EC7n t\u1EA1i v\xE0o phi\xEAn n\xE0y",
        groupRemoveAllSessions: "G\u1EE1 t\u1EA5t c\u1EA3 phi\xEAn kh\u1ECFi nh\xF3m n\xE0y",
        confirmRemoveAllFromGroup: function(g, n) {
          return "G\u1EE1 t\u1EA5t c\u1EA3 " + n + ' phi\xEAn kh\u1ECFi "' + g + '"?';
        },
        groupRemovedAllSessions: function(g) {
          return '\u0110\xE3 g\u1EE1 t\u1EA5t c\u1EA3 phi\xEAn kh\u1ECFi "' + g + '"';
        },
        contextDeleteAllGroups: "X\xF3a t\u1EA5t c\u1EA3 nh\xF3m",
        confirmDeleteAllGroups: function(n) {
          return "X\xF3a t\u1EA5t c\u1EA3 " + n + " nh\xF3m? Phi\xEAn l\xE0m vi\u1EC7c s\u1EBD kh\xF4ng b\u1ECB x\xF3a.";
        },
        deletedAllGroups: function(n) {
          return "\u0110\xE3 x\xF3a " + n + " nh\xF3m";
        },
        contextDeleteAllSessions: "X\xF3a t\u1EA5t c\u1EA3 phi\xEAn",
        confirmDeleteAllSessions: function(n) {
          return "X\xF3a " + n + " phi\xEAn? Phi\xEAn \u0111ang ho\u1EA1t \u0111\u1ED9ng s\u1EBD \u0111\u01B0\u1EE3c gi\u1EEF l\u1EA1i.";
        },
        deletedAllSessions: function(n) {
          return "\u0110\xE3 x\xF3a " + n + " phi\xEAn";
        },
        contextVersionHistory: "L\u1ECBch s\u1EED phi\xEAn b\u1EA3n",
        cmdVersionHistory: "Xem l\u1ECBch s\u1EED phi\xEAn b\u1EA3n c\u1EE7a phi\xEAn",
        historyTitle: "L\u1ECBch s\u1EED phi\xEAn b\u1EA3n",
        historyEmpty: "Kh\xF4ng c\xF3 l\u1ECBch s\u1EED phi\xEAn b\u1EA3n cho phi\xEAn n\xE0y.",
        historyRestore: "Kh\xF4i ph\u1EE5c",
        historyRestoreConfirm: function(name, time) {
          return 'Kh\xF4i ph\u1EE5c b\u1ED1 c\u1EE5c "' + name + '" t\u1EEB ' + time + "?";
        },
        historyRestored: function(name) {
          return '\u0110\xE3 kh\xF4i ph\u1EE5c b\u1ED1 c\u1EE5c cho "' + name + '"';
        },
        historyQuickRestored: function(name) {
          return '\u0110\xE3 kh\xF4i ph\u1EE5c nhanh b\u1ED1 c\u1EE5c tr\u01B0\u1EDBc \u0111\xF3 cho "' + name + '"';
        },
        historyNoEntries: "Kh\xF4ng c\xF3 b\u1ED1 c\u1EE5c tr\u01B0\u1EDBc \u0111\xF3 \u0111\u1EC3 kh\xF4i ph\u1EE5c.",
        historyToday: "H\xF4m nay",
        historyYesterday: "H\xF4m qua",
        historyThisWeek: "Tu\u1EA7n n\xE0y",
        historyFiles: function(n) {
          return n + " t\u1EC7p";
        },
        historyPanes: function(n) {
          return n + " khung";
        },
        settingsVersionHistoryEnabled: "B\u1EADt l\u1ECBch s\u1EED phi\xEAn b\u1EA3n",
        settingsVersionHistoryEnabledDesc: "Gi\u1EEF l\u1ECBch s\u1EED thay \u0111\u1ED5i b\u1ED1 c\u1EE5c cho t\u1EEBng phi\xEAn.",
        settingsVersionHistoryInterval: "Kho\u1EA3ng th\u1EDDi gian ch\u1EE5p nhanh (ph\xFAt)",
        settingsVersionHistoryIntervalDesc: "T\u1EA7n su\u1EA5t ki\u1EC3m tra thay \u0111\u1ED5i b\u1ED1 c\u1EE5c v\xE0 l\u01B0u b\u1EA3n ch\u1EE5p nhanh.",
        settingsVersionHistoryCtrlRmb: platformLabel("Kh\xF4i ph\u1EE5c nhanh (Cmd + nh\u1EA5p ph\u1EA3i)", "Kh\xF4i ph\u1EE5c nhanh (Ctrl + nh\u1EA5p ph\u1EA3i)"),
        settingsVersionHistoryCtrlRmbDesc: platformLabel("Nh\u1EA5p chu\u1ED9t ph\u1EA3i v\xE0o thanh tr\u1EA1ng th\xE1i trong khi gi\u1EEF Cmd \u0111\u1EC3 kh\xF4i ph\u1EE5c b\u1ED1 c\u1EE5c tr\u01B0\u1EDBc \u0111\xF3.", "Nh\u1EA5p chu\u1ED9t ph\u1EA3i v\xE0o thanh tr\u1EA1ng th\xE1i trong khi gi\u1EEF Ctrl \u0111\u1EC3 kh\xF4i ph\u1EE5c b\u1ED1 c\u1EE5c tr\u01B0\u1EDBc \u0111\xF3."),
        settingsVersionHistoryConfirmRestore: "X\xE1c nh\u1EADn tr\u01B0\u1EDBc khi kh\xF4i ph\u1EE5c",
        settingsVersionHistoryConfirmRestoreDesc: "Hi\u1EC3n th\u1ECB h\u1ED9p tho\u1EA1i x\xE1c nh\u1EADn tr\u01B0\u1EDBc khi kh\xF4i ph\u1EE5c b\u1ED1 c\u1EE5c tr\u01B0\u1EDBc \u0111\xF3.",
        rotationBackupSectionTitle: "Sao l\u01B0u",
        rotationBackupCreate: "T\u1EA1o b\u1EA3n sao l\u01B0u",
        rotationBackupCreateBtn: "Sao l\u01B0u ngay",
        rotationBackupCreated: "\u0110\xE3 t\u1EA1o b\u1EA3n sao l\u01B0u.",
        rotationBackupFailed: "Kh\xF4ng th\u1EC3 t\u1EA1o b\u1EA3n sao l\u01B0u.",
        rotationBackupDesc: "B\u1EA3n sao l\u01B0u t\u1EF1 \u0111\u1ED9ng \u0111\u01B0\u1EE3c t\u1EA1o khi l\u01B0u (m\u1ED7i gi\u1EDD, t\u1ED1i \u0111a 3 th\u1EBF h\u1EC7).",
        rotationBackupRestore: "Kh\xF4i ph\u1EE5c",
        rotationBackupRestoreConfirm: function(time, count) {
          return "Kh\xF4i ph\u1EE5c t\u1EEB b\u1EA3n sao l\u01B0u l\xFAc " + time + " (" + count + " phi\xEAn)? D\u1EEF li\u1EC7u hi\u1EC7n t\u1EA1i s\u1EBD b\u1ECB ghi \u0111\xE8.";
        },
        rotationBackupRestored: "\u0110\xE3 kh\xF4i ph\u1EE5c t\u1EEB b\u1EA3n sao l\u01B0u.",
        rotationBackupRestoreFailed: "Kh\xF4ng th\u1EC3 kh\xF4i ph\u1EE5c t\u1EEB b\u1EA3n sao l\u01B0u.",
        rotationBackupNone: "Kh\xF4ng c\xF3 b\u1EA3n sao l\u01B0u.",
        rotationBackupGeneration: function(count) {
          return count + " phi\xEAn";
        },
        frontmatterSessionNotFound: function(n) {
          return 'Kh\xF4ng t\xECm th\u1EA5y phi\xEAn "' + n + '" (workspace-session)';
        },
        frontmatterAlreadyActive: function(n) {
          return 'Phi\xEAn "' + n + '" \u0111\xE3 l\xE0 phi\xEAn \u0111ang ho\u1EA1t \u0111\u1ED9ng';
        }
      },
      th: {
        modalTitle: "\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        savePlaceholder: "\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E43\u0E2B\u0E21\u0E48...",
        filterPlaceholder: "\u0E01\u0E23\u0E2D\u0E07\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19...",
        settingsShowFilterInput: "\u0E41\u0E2A\u0E14\u0E07\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        settingsShowFilterInputDesc: "\u0E41\u0E2A\u0E14\u0E07\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E43\u0E19\u0E15\u0E31\u0E27\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E23\u0E27\u0E14\u0E40\u0E23\u0E47\u0E27",
        settingsOverlayDefaultFocus: "\u0E42\u0E1F\u0E01\u0E31\u0E2A\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19\u0E02\u0E2D\u0E07\u0E42\u0E2D\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E25\u0E22\u0E4C",
        settingsOverlayDefaultFocusDesc: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2D\u0E07\u0E04\u0E4C\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E17\u0E35\u0E48\u0E08\u0E30\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E42\u0E1F\u0E01\u0E31\u0E2A\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E15\u0E31\u0E27\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E40\u0E1B\u0E34\u0E14\u0E02\u0E36\u0E49\u0E19",
        settingsOverlayFocusCurrentSession: "\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19",
        settingsOverlayFocusSessionFilter: "\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        settingsOverlayFocusSessionCreate: "\u0E01\u0E32\u0E23\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        settingsSectionSessionManager: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        settingsSectionSessionListSearch: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        settingsShowActiveSwitchCommand: "\u0E41\u0E2A\u0E14\u0E07\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E41\u0E1C\u0E07\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07",
        settingsShowActiveSwitchCommandDesc: "\u0E41\u0E2A\u0E14\u0E07\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07\u0E2A\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E22\u0E31\u0E07\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E41\u0E1C\u0E07\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07 \u0E1B\u0E38\u0E48\u0E21\u0E25\u0E31\u0E14\u0E08\u0E30\u0E17\u0E33\u0E07\u0E32\u0E19\u0E40\u0E2A\u0E21\u0E2D\u0E44\u0E21\u0E48\u0E27\u0E48\u0E32\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E19\u0E35\u0E49\u0E08\u0E30\u0E40\u0E1B\u0E47\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E44\u0E23",
        settingsNumberedSwitchCommands: "\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07\u0E2A\u0E25\u0E31\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E41\u0E1A\u0E1A\u0E21\u0E35\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E25\u0E02",
        settingsNumberedSwitchCommandsDesc: "\u0E25\u0E07\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07\u0E2A\u0E25\u0E31\u0E1A\u0E14\u0E49\u0E27\u0E22\u0E0A\u0E48\u0E2D\u0E07\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E25\u0E02 (1\u20139) \u0E17\u0E35\u0E48\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E1B\u0E38\u0E48\u0E21\u0E25\u0E31\u0E14\u0E44\u0E14\u0E49 \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E1B\u0E34\u0E14 \u0E17\u0E38\u0E01\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E08\u0E30\u0E43\u0E0A\u0E49\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07\u0E15\u0E32\u0E21\u0E0A\u0E37\u0E48\u0E2D\u0E41\u0E17\u0E19",
        save: "\u0E2A\u0E23\u0E49\u0E32\u0E07",
        load: "\u0E2A\u0E25\u0E31\u0E1A",
        saveInline: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01",
        active: "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19",
        modifiedJustNow: "\u0E41\u0E01\u0E49\u0E44\u0E02\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E2A\u0E31\u0E01\u0E04\u0E23\u0E39\u0E48",
        modifiedMinutes: function(n) {
          return "\u0E41\u0E01\u0E49\u0E44\u0E02\u0E40\u0E21\u0E37\u0E48\u0E2D " + n + " \u0E19\u0E32\u0E17\u0E35\u0E17\u0E35\u0E48\u0E41\u0E25\u0E49\u0E27";
        },
        modifiedHours: function(n) {
          return "\u0E41\u0E01\u0E49\u0E44\u0E02\u0E40\u0E21\u0E37\u0E48\u0E2D " + n + " \u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07\u0E17\u0E35\u0E48\u0E41\u0E25\u0E49\u0E27";
        },
        modifiedDays: function(n) {
          return "\u0E41\u0E01\u0E49\u0E44\u0E02\u0E40\u0E21\u0E37\u0E48\u0E2D " + n + " \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E41\u0E25\u0E49\u0E27";
        },
        duplicateName: "\u0E21\u0E35\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E0A\u0E37\u0E48\u0E2D\u0E19\u0E35\u0E49\u0E2D\u0E22\u0E39\u0E48\u0E41\u0E25\u0E49\u0E27",
        emptyName: "\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E15\u0E49\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E27\u0E48\u0E32\u0E07",
        created: function(n) {
          return '\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19 "' + n + '" \u0E41\u0E25\u0E49\u0E27';
        },
        deleted: function(n) {
          return '\u0E25\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19 "' + n + '" \u0E41\u0E25\u0E49\u0E27';
        },
        loaded: function(n) {
          return '\u0E2A\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E22\u0E31\u0E07 "' + n + '" \u0E41\u0E25\u0E49\u0E27';
        },
        renamed: function(o, n) {
          return '\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E0A\u0E37\u0E48\u0E2D "' + o + '" \u0E40\u0E1B\u0E47\u0E19 "' + n + '" \u0E41\u0E25\u0E49\u0E27';
        },
        confirmDelete: function(n) {
          return '\u0E25\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19 "' + n + '"?';
        },
        confirmDeleteActive: function(n) {
          return '"' + n + '" \u0E40\u0E1B\u0E47\u0E19\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E2D\u0E22\u0E39\u0E48 \u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E25\u0E1A\u0E15\u0E48\u0E2D\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?';
        },
        confirmSaveSession: function(n) {
          return '\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19 "' + n + '"?';
        },
        confirmOverwriteSessionWithCurrentLayout: function(n) {
          return '\u0E40\u0E02\u0E35\u0E22\u0E19\u0E17\u0E31\u0E1A "' + n + '" \u0E14\u0E49\u0E27\u0E22\u0E40\u0E04\u0E49\u0E32\u0E42\u0E04\u0E23\u0E07\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19?';
        },
        confirmReloadSession: function(n) {
          return '\u0E42\u0E2B\u0E25\u0E14\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19 "' + n + '" \u0E0B\u0E49\u0E33? \u0E01\u0E32\u0E23\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E41\u0E1B\u0E25\u0E07\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E08\u0E30\u0E2B\u0E32\u0E22\u0E44\u0E1B';
        },
        renameTitle: "\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        renamePlaceholder: "\u0E0A\u0E37\u0E48\u0E2D\u0E43\u0E2B\u0E21\u0E48...",
        noSession: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        cannotDeleteLast: "\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E25\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E2A\u0E38\u0E14\u0E17\u0E49\u0E32\u0E22\u0E44\u0E14\u0E49",
        confirmBulkDelete: function(n) {
          return "\u0E25\u0E1A " + n + " \u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19?";
        },
        bulkDeleted: function(n) {
          return "\u0E25\u0E1A " + n + " \u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E41\u0E25\u0E49\u0E27";
        },
        bulkDelete: function(n) {
          return "\u0E25\u0E1A " + n + " \u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19";
        },
        cmdManage: "\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        cmdCreate: "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E43\u0E2B\u0E21\u0E48",
        cmdRename: "\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19",
        cmdDelete: "\u0E25\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19",
        cmdNewEmpty: "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E27\u0E48\u0E32\u0E07",
        cmdDuplicate: "\u0E17\u0E33\u0E2A\u0E33\u0E40\u0E19\u0E32\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19",
        duplicated: function(n) {
          return '\u0E17\u0E33\u0E2A\u0E33\u0E40\u0E19\u0E32\u0E40\u0E1B\u0E47\u0E19 "' + n + '" \u0E41\u0E25\u0E49\u0E27';
        },
        deselect: "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E01\u0E32\u0E23\u0E40\u0E25\u0E37\u0E2D\u0E01",
        footerDragReorder: "\u0E25\u0E32\u0E01\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E23\u0E35\u0E22\u0E07\u0E25\u0E33\u0E14\u0E31\u0E1A\u0E43\u0E2B\u0E21\u0E48",
        footerDragToGroup: "\u0E25\u0E32\u0E01\u0E44\u0E1B\u0E22\u0E31\u0E07\u0E41\u0E17\u0E47\u0E1A\u0E01\u0E25\u0E38\u0E48\u0E21\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E22\u0E49\u0E32\u0E22",
        defaultLabel: "(\u0E04\u0E48\u0E32\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19)",
        rename: "\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E0A\u0E37\u0E48\u0E2D",
        delete: "\u0E25\u0E1A",
        remove: "\u0E19\u0E33\u0E2D\u0E2D\u0E01",
        cancel: "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01",
        ribbonTooltip: "Workspace++",
        cmdSwitchTo: function(n, name) {
          return name ? "\u0E2A\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E22\u0E31\u0E07\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19 " + n + ": " + name : "\u0E2A\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E22\u0E31\u0E07\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19 " + n;
        },
        cmdSwitchToNamed: function(name) {
          return '\u0E2A\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E22\u0E31\u0E07 "' + name + '"';
        },
        cmdPrevious: "\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32",
        cmdNext: "\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E16\u0E31\u0E14\u0E44\u0E1B",
        cmdSaveCurrent: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19",
        cmdSaveAs: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19\u0E40\u0E1B\u0E47\u0E19...",
        cmdSaveCurrentLayoutToSession: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E04\u0E49\u0E32\u0E42\u0E04\u0E23\u0E07\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19\u0E25\u0E07\u0E43\u0E19\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19...",
        cmdReloadCurrentWithoutSaving: "\u0E42\u0E2B\u0E25\u0E14\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19\u0E0B\u0E49\u0E33 (\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01)",
        cmdToggleAutoSave: "\u0E40\u0E1B\u0E34\u0E14/\u0E1B\u0E34\u0E14\u0E01\u0E32\u0E23\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E2A\u0E25\u0E31\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        cmdEnableAutoSave: "\u0E40\u0E1B\u0E34\u0E14\u0E01\u0E32\u0E23\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E2A\u0E25\u0E31\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        cmdDisableAutoSave: "\u0E1B\u0E34\u0E14\u0E01\u0E32\u0E23\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E2A\u0E25\u0E31\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        cmdSearchOverlay: "\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        cmdExportSessions: "\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01\u0E2A\u0E41\u0E19\u0E1B\u0E0A\u0E47\u0E2D\u0E15\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        cmdImportSessions: "\u0E19\u0E33\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E41\u0E19\u0E1B\u0E0A\u0E47\u0E2D\u0E15\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14",
        switchLeft: "\u0E0B\u0E49\u0E32\u0E22",
        switchRight: "\u0E02\u0E27\u0E32",
        switchGroup: "\u0E01\u0E25\u0E38\u0E48\u0E21",
        keyTab: "Tab",
        savedSession: function(n) {
          return '\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 "' + n + '" \u0E41\u0E25\u0E49\u0E27';
        },
        savedAs: function(n) {
          return '\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E1B\u0E47\u0E19 "' + n + '" \u0E41\u0E25\u0E49\u0E27';
        },
        savedCurrentLayoutToSession: function(n) {
          return '\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E04\u0E49\u0E32\u0E42\u0E04\u0E23\u0E07\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19\u0E25\u0E07\u0E43\u0E19 "' + n + '" \u0E41\u0E25\u0E49\u0E27';
        },
        noChanges: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E41\u0E1B\u0E25\u0E07\u0E43\u0E2B\u0E49\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01",
        reloadedSession: function(n) {
          return '\u0E42\u0E2B\u0E25\u0E14 "' + n + '" \u0E0B\u0E49\u0E33\u0E41\u0E25\u0E49\u0E27';
        },
        autoSaveEnabled: "\u0E40\u0E1B\u0E34\u0E14\u0E01\u0E32\u0E23\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E2A\u0E25\u0E31\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E41\u0E25\u0E49\u0E27",
        autoSaveDisabled: "\u0E1B\u0E34\u0E14\u0E01\u0E32\u0E23\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E2A\u0E25\u0E31\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E41\u0E25\u0E49\u0E27",
        confirmUnsavedSwitch: function(n) {
          return '\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19\u0E21\u0E35\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E41\u0E1B\u0E25\u0E07\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 \u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E2A\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E22\u0E31\u0E07 "' + n + '"?';
        },
        saveAndSwitch: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E41\u0E25\u0E49\u0E27\u0E2A\u0E25\u0E31\u0E1A",
        switchWithoutSaving: "\u0E2A\u0E25\u0E31\u0E1A\u0E42\u0E14\u0E22\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01",
        defaultSessionName: "\u0E04\u0E48\u0E32\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19",
        nameSessionTitle: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        nameSessionPlaceholder: "\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19...",
        saveWithoutNaming: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E42\u0E14\u0E22\u0E44\u0E21\u0E48\u0E15\u0E31\u0E49\u0E07\u0E0A\u0E37\u0E48\u0E2D",
        sessionAutoName: function(n) {
          return "\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E43\u0E2B\u0E21\u0E48 " + n;
        },
        noFilteredSessions: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E17\u0E35\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E19",
        noGroupSessions: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E43\u0E19\u0E01\u0E25\u0E38\u0E48\u0E21\u0E19\u0E35\u0E49",
        searchOverlayPlaceholder: "\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E01\u0E23\u0E2D\u0E07\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19...",
        saveCurrentLayoutToSessionPlaceholder: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E17\u0E35\u0E48\u0E08\u0E30\u0E40\u0E02\u0E35\u0E22\u0E19\u0E17\u0E31\u0E1A...",
        searchOverlayHelp: "\u2191\u2193 \u0E22\u0E49\u0E32\u0E22  /  Enter \u0E2A\u0E25\u0E31\u0E1A  /  \u21E7Enter \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01  /  \u232B \u0E25\u0E1A  /  Esc \u0E1B\u0E34\u0E14",
        backupRestored: "Workspace++: \u0E01\u0E39\u0E49\u0E04\u0E37\u0E19\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E08\u0E32\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E33\u0E23\u0E2D\u0E07\u0E41\u0E25\u0E49\u0E27",
        sessionDataMigrated: "Workspace++: \u0E22\u0E49\u0E32\u0E22\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E44\u0E1B\u0E22\u0E31\u0E07 .workspace-plus-plus/sessions.json \u0E41\u0E25\u0E49\u0E27",
        sessionDataMigrationFailed: "Workspace++: \u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E22\u0E49\u0E32\u0E22\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E44\u0E14\u0E49 \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E14\u0E34\u0E21\u0E22\u0E31\u0E07\u0E04\u0E07\u0E16\u0E39\u0E01\u0E40\u0E01\u0E47\u0E1A\u0E44\u0E27\u0E49",
        localSettingsEnabled: "Workspace++: \u0E40\u0E1B\u0E34\u0E14\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E40\u0E09\u0E1E\u0E32\u0E30 vault \u0E41\u0E25\u0E49\u0E27",
        localSettingsDisabled: "Workspace++: \u0E1B\u0E34\u0E14\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E40\u0E09\u0E1E\u0E32\u0E30 vault \u0E41\u0E25\u0E49\u0E27",
        localSettingsCopied: "Workspace++: \u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E2A\u0E48\u0E27\u0E19\u0E01\u0E25\u0E32\u0E07\u0E44\u0E1B\u0E22\u0E31\u0E07\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E40\u0E09\u0E1E\u0E32\u0E30 vault \u0E41\u0E25\u0E49\u0E27",
        localSettingsLoadFailed: "Workspace++: \u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E42\u0E2B\u0E25\u0E14\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E40\u0E09\u0E1E\u0E32\u0E30 vault \u0E44\u0E14\u0E49 \u0E08\u0E30\u0E43\u0E0A\u0E49\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E2A\u0E48\u0E27\u0E19\u0E01\u0E25\u0E32\u0E07",
        localSettingsOperationFailed: "Workspace++: \u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E40\u0E09\u0E1E\u0E32\u0E30 vault \u0E44\u0E14\u0E49",
        exportSessionsDone: function(path) {
          return "Workspace++: \u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E44\u0E1B\u0E22\u0E31\u0E07 " + path + " \u0E41\u0E25\u0E49\u0E27";
        },
        exportSessionsFailed: "Workspace++: \u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E44\u0E14\u0E49",
        importSessionsDone: function(path) {
          return "Workspace++: \u0E19\u0E33\u0E40\u0E02\u0E49\u0E32\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E08\u0E32\u0E01 " + path + " \u0E41\u0E25\u0E49\u0E27";
        },
        importSessionsNoFile: "Workspace++: \u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E44\u0E1F\u0E25\u0E4C\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01\u0E43\u0E19 .workspace-plus-plus/exports",
        importSessionsFailed: "Workspace++: \u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E19\u0E33\u0E40\u0E02\u0E49\u0E32\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E44\u0E14\u0E49",
        settingsLanguage: "\u0E20\u0E32\u0E29\u0E32",
        settingsLanguageDesc: "\u0E20\u0E32\u0E29\u0E32\u0E02\u0E2D\u0E07\u0E2D\u0E34\u0E19\u0E40\u0E17\u0E2D\u0E23\u0E4C\u0E40\u0E1F\u0E0B\u0E1B\u0E25\u0E31\u0E4A\u0E01\u0E2D\u0E34\u0E19 \u0E23\u0E35\u0E2A\u0E15\u0E32\u0E23\u0E4C\u0E17 Obsidian \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E0A\u0E49\u0E01\u0E31\u0E1A\u0E0A\u0E37\u0E48\u0E2D\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07",
        settingsSectionGeneral: "\u0E17\u0E31\u0E48\u0E27\u0E44\u0E1B",
        settingsTabSessions: "\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        settingsSectionSwitching: "\u0E01\u0E32\u0E23\u0E2A\u0E25\u0E31\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        settingsSectionSwitchCommands: "\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07\u0E2A\u0E25\u0E31\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        settingsSectionScrollSwitch: "\u0E01\u0E32\u0E23\u0E2A\u0E25\u0E31\u0E1A\u0E14\u0E49\u0E27\u0E22\u0E01\u0E32\u0E23\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19",
        settingsSectionSwitchPreview: "\u0E14\u0E39\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E01\u0E48\u0E2D\u0E19\u0E2A\u0E25\u0E31\u0E1A",
        settingsSubsectionSwitchSaving: "\u0E01\u0E32\u0E23\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E2A\u0E25\u0E31\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        settingsSubsectionAutoSaveMode: "\u0E42\u0E2B\u0E21\u0E14\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34",
        settingsSubsectionSwitchCommands: "\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07\u0E2A\u0E25\u0E31\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        settingsSubsectionScrollSwitch: "\u0E2A\u0E25\u0E31\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E14\u0E49\u0E27\u0E22\u0E01\u0E32\u0E23\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19",
        settingsSubsectionSwitchPreview: "\u0E14\u0E39\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E01\u0E48\u0E2D\u0E19\u0E2A\u0E25\u0E31\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        settingsSectionDeletion: "\u0E01\u0E32\u0E23\u0E25\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        settingsSectionAdvanced: "\u0E02\u0E31\u0E49\u0E19\u0E2A\u0E39\u0E07",
        settingsSectionReset: "\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15",
        settingsStatusBarModScrollSwitch: "\u0E40\u0E1B\u0E34\u0E14\u0E01\u0E32\u0E23\u0E2A\u0E25\u0E31\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E08\u0E32\u0E01\u0E41\u0E16\u0E1A\u0E2A\u0E16\u0E32\u0E19\u0E30",
        settingsStatusBarModScrollSwitchDesc: "\u0E1A\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E41\u0E16\u0E1A\u0E2A\u0E16\u0E32\u0E19\u0E30 \u0E43\u0E2B\u0E49\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E41\u0E19\u0E27\u0E15\u0E31\u0E49\u0E07\u0E02\u0E13\u0E30\u0E01\u0E14\u0E1B\u0E38\u0E48\u0E21\u0E1B\u0E23\u0E31\u0E1A\u0E41\u0E15\u0E48\u0E07\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E27\u0E49\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E2A\u0E25\u0E31\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19 \u0E40\u0E01\u0E13\u0E11\u0E4C\u0E41\u0E25\u0E30\u0E0A\u0E48\u0E27\u0E07\u0E1E\u0E31\u0E01\u0E0A\u0E48\u0E27\u0E22\u0E25\u0E14\u0E01\u0E32\u0E23\u0E40\u0E23\u0E35\u0E22\u0E01\u0E43\u0E0A\u0E49\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E08\u0E32\u0E01\u0E41\u0E17\u0E23\u0E47\u0E01\u0E41\u0E1E\u0E14",
        settingsStatusBarScrollPreset: "\u0E1E\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E01\u0E32\u0E23\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19",
        settingsStatusBarScrollPresetDesc: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1E\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E17\u0E35\u0E48\u0E1B\u0E23\u0E31\u0E1A\u0E43\u0E2B\u0E49\u0E40\u0E2B\u0E21\u0E32\u0E30\u0E01\u0E31\u0E1A\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13 \u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E40\u0E2D\u0E07\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E1B\u0E23\u0E31\u0E1A\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E14\u0E49\u0E27\u0E22\u0E15\u0E31\u0E27\u0E40\u0E2D\u0E07",
        settingsStatusBarScrollPresetTrackpad: "\u0E41\u0E17\u0E23\u0E47\u0E01\u0E41\u0E1E\u0E14",
        settingsStatusBarScrollPresetNotchedWheel: "\u0E25\u0E49\u0E2D\u0E40\u0E21\u0E32\u0E2A\u0E4C\u0E41\u0E1A\u0E1A\u0E21\u0E35\u0E08\u0E31\u0E07\u0E2B\u0E27\u0E30",
        settingsStatusBarScrollPresetFreeSpinWheel: "\u0E25\u0E49\u0E2D\u0E40\u0E21\u0E32\u0E2A\u0E4C\u0E41\u0E1A\u0E1A\u0E2B\u0E21\u0E38\u0E19\u0E2D\u0E34\u0E2A\u0E23\u0E30",
        settingsStatusBarScrollPresetCustom: "\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E40\u0E2D\u0E07",
        settingsStatusBarScrollModifier: "\u0E1B\u0E38\u0E48\u0E21\u0E1B\u0E23\u0E31\u0E1A\u0E41\u0E15\u0E48\u0E07\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E14",
        settingsStatusBarScrollModifierDesc: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1B\u0E38\u0E48\u0E21\u0E1B\u0E23\u0E31\u0E1A\u0E41\u0E15\u0E48\u0E07\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E14\u0E04\u0E49\u0E32\u0E07\u0E44\u0E27\u0E49\u0E02\u0E13\u0E30\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E1A\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E41\u0E16\u0E1A\u0E2A\u0E16\u0E32\u0E19\u0E30",
        settingsStatusBarScrollModifierRecommended: "Cmd \u0E2B\u0E23\u0E37\u0E2D Option",
        settingsStatusBarScrollModifierNone: "\u0E44\u0E21\u0E48\u0E21\u0E35",
        settingsStatusBarScrollModifierModOnly: "Cmd \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19",
        settingsStatusBarScrollModifierAltOnly: "Option \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19",
        settingsStatusBarScrollModifierModOrAlt: "Cmd \u0E2B\u0E23\u0E37\u0E2D Option",
        settingsStatusBarScrollThreshold: "\u0E40\u0E01\u0E13\u0E11\u0E4C\u0E04\u0E27\u0E32\u0E21\u0E44\u0E27",
        settingsStatusBarScrollThresholdDesc: "\u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E15\u0E48\u0E33\u0E01\u0E27\u0E48\u0E32\u0E08\u0E30\u0E2A\u0E25\u0E31\u0E1A\u0E44\u0E14\u0E49\u0E07\u0E48\u0E32\u0E22\u0E02\u0E36\u0E49\u0E19 \u0E43\u0E0A\u0E49\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E1E\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E40\u0E1B\u0E47\u0E19\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E40\u0E2D\u0E07",
        settingsStatusBarScrollCooldown: "\u0E0A\u0E48\u0E27\u0E07\u0E1E\u0E31\u0E01",
        settingsStatusBarScrollCooldownDesc: "\u0E40\u0E27\u0E25\u0E32\u0E02\u0E31\u0E49\u0E19\u0E15\u0E48\u0E33\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07\u0E01\u0E32\u0E23\u0E2A\u0E25\u0E31\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E17\u0E35\u0E48\u0E40\u0E01\u0E34\u0E14\u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19 \u0E43\u0E0A\u0E49\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E1E\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E40\u0E1B\u0E47\u0E19\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E40\u0E2D\u0E07",
        settingsStatusBarScrollResetWindow: "\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E25\u0E49\u0E32\u0E07\u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E2A\u0E30\u0E2A\u0E21",
        settingsStatusBarScrollResetWindowDesc: "\u0E23\u0E30\u0E22\u0E30\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E23\u0E27\u0E21\u0E01\u0E32\u0E23\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E40\u0E25\u0E47\u0E01 \u0E46 \u0E44\u0E27\u0E49\u0E01\u0E48\u0E2D\u0E19\u0E25\u0E49\u0E32\u0E07\u0E04\u0E48\u0E32 \u0E43\u0E0A\u0E49\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E1E\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E40\u0E1B\u0E47\u0E19\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E40\u0E2D\u0E07",
        settingsStatusBarScrollInvert: "\u0E01\u0E25\u0E31\u0E1A\u0E17\u0E34\u0E28\u0E17\u0E32\u0E07\u0E01\u0E32\u0E23\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19",
        settingsStatusBarScrollInvertDesc: "\u0E01\u0E25\u0E31\u0E1A\u0E17\u0E34\u0E28\u0E17\u0E32\u0E07\u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32/\u0E16\u0E31\u0E14\u0E44\u0E1B\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E2A\u0E25\u0E31\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E14\u0E49\u0E27\u0E22\u0E01\u0E32\u0E23\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E1A\u0E19\u0E41\u0E16\u0E1A\u0E2A\u0E16\u0E32\u0E19\u0E30",
        settingsLangAuto: "\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34 (\u0E20\u0E32\u0E29\u0E32\u0E23\u0E30\u0E1A\u0E1A)",
        settingsGitHubLink: "GitHub",
        settingsTranslationHelp: "\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E41\u0E1B\u0E25? \u0E42\u0E1B\u0E23\u0E14\u0E40\u0E1B\u0E34\u0E14 issue \u0E2B\u0E23\u0E37\u0E2D pull request \u0E1A\u0E19 GitHub",
        settingsPreviewHeading: "\u0E40\u0E1B\u0E34\u0E14\u0E14\u0E39\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E01\u0E48\u0E2D\u0E19\u0E2A\u0E25\u0E31\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        settingsPreviewDesc: "\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E2A\u0E25\u0E31\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E14\u0E49\u0E27\u0E22\u0E1B\u0E38\u0E48\u0E21\u0E25\u0E31\u0E14 \u0E01\u0E32\u0E23\u0E01\u0E14\u0E04\u0E23\u0E31\u0E49\u0E07\u0E41\u0E23\u0E01\u0E08\u0E30\u0E41\u0E2A\u0E14\u0E07\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19\u0E42\u0E14\u0E22\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2A\u0E25\u0E31\u0E1A",
        settingsPreviewNext: "\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E16\u0E31\u0E14\u0E44\u0E1B",
        settingsPreviewPrevious: "\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32",
        settingsHotkeys: "\u0E1B\u0E38\u0E48\u0E21\u0E25\u0E31\u0E14",
        settingsHotkeysBtn: "\u0E40\u0E1B\u0E34\u0E14\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E1B\u0E38\u0E48\u0E21\u0E25\u0E31\u0E14",
        contextOpenSettings: "\u0E40\u0E1B\u0E34\u0E14\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32",
        contextCustomizeClicks: "\u0E1B\u0E23\u0E31\u0E1A\u0E41\u0E15\u0E48\u0E07\u0E01\u0E32\u0E23\u0E04\u0E25\u0E34\u0E01",
        settingsSectionStatusBar: "\u0E01\u0E32\u0E23\u0E04\u0E25\u0E34\u0E01\u0E1A\u0E19\u0E41\u0E16\u0E1A\u0E2A\u0E16\u0E32\u0E19\u0E30",
        statusBarSlotClick: "\u0E04\u0E25\u0E34\u0E01",
        statusBarSlotAltClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + \u0E04\u0E25\u0E34\u0E01";
        },
        statusBarSlotModClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + \u0E04\u0E25\u0E34\u0E01";
        },
        statusBarSlotShiftClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + \u0E04\u0E25\u0E34\u0E01";
        },
        statusBarSlotMiddleClick: "\u0E04\u0E25\u0E34\u0E01\u0E01\u0E25\u0E32\u0E07",
        statusBarSlotAltMiddleClick: modifiedClickLabel("\u0E04\u0E25\u0E34\u0E01\u0E01\u0E25\u0E32\u0E07", "\u2325", "Alt"),
        statusBarSlotModMiddleClick: modifiedClickLabel("\u0E04\u0E25\u0E34\u0E01\u0E01\u0E25\u0E32\u0E07", "\u2318", "Ctrl"),
        statusBarSlotShiftMiddleClick: modifiedClickLabel("\u0E04\u0E25\u0E34\u0E01\u0E01\u0E25\u0E32\u0E07", "\u21E7", "Shift"),
        statusBarSlotRightClick: "\u0E04\u0E25\u0E34\u0E01\u0E02\u0E27\u0E32",
        statusBarSlotAltRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2325" : "Alt") + " + \u0E04\u0E25\u0E34\u0E01\u0E02\u0E27\u0E32";
        },
        statusBarSlotModRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u2318" : "Ctrl") + " + \u0E04\u0E25\u0E34\u0E01\u0E02\u0E27\u0E32";
        },
        statusBarSlotShiftRightClick: function() {
          return (typeof navigator !== "undefined" && navigator.platform.indexOf("Mac") !== -1 ? "\u21E7" : "Shift") + " + \u0E04\u0E25\u0E34\u0E01\u0E02\u0E27\u0E32";
        },
        statusBarActionNone: "\u0E44\u0E21\u0E48\u0E17\u0E33\u0E2D\u0E30\u0E44\u0E23",
        statusBarActionQuickSwitcher: "\u0E40\u0E1B\u0E34\u0E14\u0E15\u0E31\u0E27\u0E2A\u0E25\u0E31\u0E1A\u0E14\u0E48\u0E27\u0E19",
        statusBarActionSessionManager: "\u0E40\u0E1B\u0E34\u0E14\u0E15\u0E31\u0E27\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        statusBarActionSaveSession: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        statusBarActionReloadWithoutSaving: "\u0E42\u0E2B\u0E25\u0E14\u0E0B\u0E49\u0E33\u0E42\u0E14\u0E22\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01",
        statusBarActionVersionHistory: "\u0E41\u0E2A\u0E14\u0E07\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E0A\u0E31\u0E19",
        statusBarActionRestoreLatestHistory: "\u0E01\u0E39\u0E49\u0E04\u0E37\u0E19\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14",
        statusBarActionSessionMenu: "\u0E40\u0E21\u0E19\u0E39\u0E1A\u0E23\u0E34\u0E1A\u0E17\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        statusBarActionSettingsMenu: "\u0E40\u0E21\u0E19\u0E39\u0E1A\u0E23\u0E34\u0E1A\u0E17\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32",
        contextResetOverlayPosition: "\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E41\u0E25\u0E30\u0E02\u0E19\u0E32\u0E14",
        settingsConfirmDelete: "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E01\u0E48\u0E2D\u0E19\u0E25\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        settingsConfirmDeleteDesc: "\u0E41\u0E2A\u0E14\u0E07\u0E01\u0E25\u0E48\u0E2D\u0E07\u0E42\u0E15\u0E49\u0E15\u0E2D\u0E1A\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E01\u0E48\u0E2D\u0E19\u0E25\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        settingsConfirmQuickActions: "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E01\u0E32\u0E23\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01/\u0E42\u0E2B\u0E25\u0E14\u0E0B\u0E49\u0E33\u0E43\u0E19\u0E15\u0E31\u0E27\u0E2A\u0E25\u0E31\u0E1A\u0E14\u0E48\u0E27\u0E19",
        settingsConfirmQuickActionsDesc: "\u0E41\u0E2A\u0E14\u0E07\u0E01\u0E25\u0E48\u0E2D\u0E07\u0E42\u0E15\u0E49\u0E15\u0E2D\u0E1A\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E01\u0E48\u0E2D\u0E19\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2B\u0E23\u0E37\u0E2D\u0E42\u0E2B\u0E25\u0E14\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E0B\u0E49\u0E33\u0E08\u0E32\u0E01\u0E42\u0E2D\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E25\u0E22\u0E4C\u0E15\u0E31\u0E27\u0E2A\u0E25\u0E31\u0E1A\u0E14\u0E48\u0E27\u0E19",
        settingsAutoSaveOnSwitch: "\u0E42\u0E2B\u0E21\u0E14\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34",
        settingsAutoSaveOnSwitchDesc: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19\u0E42\u0E14\u0E22\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E2A\u0E25\u0E31\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19 (\u0E04\u0E48\u0E32\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19: \u0E40\u0E1B\u0E34\u0E14) \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E1B\u0E34\u0E14 \u0E04\u0E38\u0E13\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E41\u0E25\u0E30\u0E42\u0E2B\u0E25\u0E14\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E0B\u0E49\u0E33\u0E14\u0E49\u0E27\u0E22\u0E15\u0E19\u0E40\u0E2D\u0E07",
        settingsWarnUnsavedSwitch: "\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E01\u0E48\u0E2D\u0E19\u0E2A\u0E25\u0E31\u0E1A\u0E42\u0E14\u0E22\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01",
        settingsWarnUnsavedSwitchDesc: "\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E1B\u0E34\u0E14\u0E01\u0E32\u0E23\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E30\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19\u0E21\u0E35\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E41\u0E1B\u0E25\u0E07\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 \u0E43\u0E2B\u0E49\u0E41\u0E2A\u0E14\u0E07\u0E04\u0E33\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E01\u0E48\u0E2D\u0E19\u0E2A\u0E25\u0E31\u0E1A",
        settingsStatusBarQuickSwitcher: "\u0E40\u0E1B\u0E34\u0E14\u0E15\u0E31\u0E27\u0E2A\u0E25\u0E31\u0E1A\u0E14\u0E48\u0E27\u0E19\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E04\u0E25\u0E34\u0E01\u0E41\u0E16\u0E1A\u0E2A\u0E16\u0E32\u0E19\u0E30",
        settingsStatusBarQuickSwitcherDesc: "\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19 \u0E01\u0E32\u0E23\u0E04\u0E25\u0E34\u0E01\u0E41\u0E16\u0E1A\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E08\u0E30\u0E40\u0E1B\u0E34\u0E14\u0E42\u0E2D\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E25\u0E22\u0E4C\u0E15\u0E31\u0E27\u0E2A\u0E25\u0E31\u0E1A\u0E14\u0E48\u0E27\u0E19\u0E41\u0E17\u0E19\u0E15\u0E31\u0E27\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E40\u0E15\u0E47\u0E21",
        settingsUseLocalSettings: "\u0E43\u0E0A\u0E49\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E40\u0E09\u0E1E\u0E32\u0E30 vault",
        settingsUseLocalSettingsDesc: "\u0E40\u0E1B\u0E34\u0E14\u0E15\u0E31\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E19\u0E35\u0E49\u0E2B\u0E32\u0E01\u0E04\u0E38\u0E13\u0E0B\u0E34\u0E07\u0E04\u0E4C .obsidian \u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07\u0E2B\u0E25\u0E32\u0E22 vault (\u0E40\u0E0A\u0E48\u0E19 \u0E14\u0E49\u0E27\u0E22 Settings Profiles) \u0E41\u0E25\u0E30\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E43\u0E2B\u0E49\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32 Workspace++ \u0E41\u0E22\u0E01\u0E01\u0E31\u0E19\u0E43\u0E19\u0E41\u0E15\u0E48\u0E25\u0E30 vault",
        settingsCopyGlobalToLocal: "\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E2A\u0E48\u0E27\u0E19\u0E01\u0E25\u0E32\u0E07\u0E44\u0E1B\u0E22\u0E31\u0E07 vault \u0E19\u0E35\u0E49",
        settingsCopyGlobalToLocalDesc: "\u0E40\u0E02\u0E35\u0E22\u0E19\u0E17\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E40\u0E09\u0E1E\u0E32\u0E30 vault \u0E14\u0E49\u0E27\u0E22\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E2A\u0E48\u0E27\u0E19\u0E01\u0E25\u0E32\u0E07\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19",
        settingsCopyGlobalToLocalBtn: "\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01",
        settingsResetLocalSettings: "\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E40\u0E09\u0E1E\u0E32\u0E30 vault",
        settingsResetLocalSettingsDesc: "\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E40\u0E09\u0E1E\u0E32\u0E30 vault \u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E40\u0E1B\u0E47\u0E19\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E2A\u0E48\u0E27\u0E19\u0E01\u0E25\u0E32\u0E07",
        settingsResetLocalSettingsBtn: "\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07",
        settingsAdvancedStorageSubsection: "\u0E1E\u0E24\u0E15\u0E34\u0E01\u0E23\u0E23\u0E21\u0E01\u0E32\u0E23\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A",
        settingsAdvancedTransferSubsection: "\u0E01\u0E32\u0E23\u0E16\u0E48\u0E32\u0E22\u0E42\u0E2D\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25",
        settingsDeveloperSection: "\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E21\u0E37\u0E2D\u0E19\u0E31\u0E01\u0E1E\u0E31\u0E12\u0E19\u0E32",
        settingsStorageDiagnostics: "\u0E01\u0E32\u0E23\u0E27\u0E34\u0E19\u0E34\u0E08\u0E09\u0E31\u0E22\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A",
        settingsStorageDiagnosticsDesc: "\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A\u0E17\u0E35\u0E48 Workspace++ \u0E43\u0E0A\u0E49\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E02\u0E13\u0E30\u0E19\u0E35\u0E49",
        settingsStorageFieldSessions: "\u0E44\u0E1F\u0E25\u0E4C\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        settingsStorageFieldSessionsBackup: "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E33\u0E23\u0E2D\u0E07\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        settingsStorageFieldLocalSettings: "\u0E44\u0E1F\u0E25\u0E4C\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07",
        settingsStorageFieldGlobalSettings: "\u0E44\u0E1F\u0E25\u0E4C\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E2A\u0E48\u0E27\u0E19\u0E01\u0E25\u0E32\u0E07",
        settingsStorageFieldSessionCount: "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        settingsStorageFieldUpdatedAt: "\u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15\u0E40\u0E21\u0E37\u0E48\u0E2D",
        settingsExportSessions: "\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        settingsExportSessionsDesc: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2A\u0E41\u0E19\u0E1B\u0E0A\u0E47\u0E2D\u0E15\u0E44\u0E1B\u0E22\u0E31\u0E07 .workspace-plus-plus/exports",
        settingsExportSessionsBtn: "\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01",
        settingsImportSessions: "\u0E19\u0E33\u0E40\u0E02\u0E49\u0E32\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        settingsImportSessionsDesc: "\u0E19\u0E33\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E41\u0E19\u0E1B\u0E0A\u0E47\u0E2D\u0E15\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14\u0E08\u0E32\u0E01 .workspace-plus-plus/exports",
        settingsImportSessionsBtn: "\u0E19\u0E33\u0E40\u0E02\u0E49\u0E32\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14",
        confirmImportSessions: "\u0E19\u0E33\u0E40\u0E02\u0E49\u0E32\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14? \u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19\u0E08\u0E30\u0E16\u0E39\u0E01\u0E41\u0E17\u0E19\u0E17\u0E35\u0E48",
        settingsResetSettings: "\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32",
        settingsResetSettingsDesc: "\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32 Workspace++ \u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E02\u0E2D\u0E1A\u0E40\u0E02\u0E15\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19",
        settingsResetSettingsBtn: "\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32",
        confirmResetSettings: "\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32 Workspace++ \u0E40\u0E1B\u0E47\u0E19\u0E04\u0E48\u0E32\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19?",
        resetSettingsDone: "\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32 Workspace++ \u0E41\u0E25\u0E49\u0E27",
        resetSettingsFailed: "\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32 Workspace++ \u0E44\u0E14\u0E49",
        settingsResetSessions: "\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        settingsResetSessionsDesc: "\u0E25\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E27\u0E49\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 \u0E41\u0E25\u0E30\u0E40\u0E01\u0E47\u0E1A\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19\u0E43\u0E2B\u0E21\u0E48\u0E08\u0E32\u0E01\u0E40\u0E04\u0E49\u0E32\u0E42\u0E04\u0E23\u0E07\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19",
        settingsResetSessionsBtn: "\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15",
        confirmResetSessions: "\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E17\u0E38\u0E01\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E04\u0E48\u0E32\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19? \u0E01\u0E32\u0E23\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E14\u0E49",
        resetSessionsHint: "\u0E01\u0E32\u0E23\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49\u0E08\u0E30\u0E25\u0E1A\u0E17\u0E38\u0E01\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E27\u0E49 \u0E41\u0E25\u0E30\u0E40\u0E01\u0E47\u0E1A\u0E44\u0E27\u0E49\u0E40\u0E1E\u0E35\u0E22\u0E07\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27",
        resetSessionsDone: "\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E04\u0E48\u0E32\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19\u0E41\u0E25\u0E49\u0E27",
        resetSessionsFailed: "\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E44\u0E14\u0E49",
        settingsResetSessionsAndSettings: "\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32",
        settingsResetSessionsAndSettingsDesc: "\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E17\u0E31\u0E49\u0E07\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E27\u0E49\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32 Workspace++ \u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E01\u0E31\u0E19",
        settingsResetSessionsAndSettingsBtn: "\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E17\u0E31\u0E49\u0E07\u0E2A\u0E2D\u0E07\u0E2D\u0E22\u0E48\u0E32\u0E07",
        confirmResetSessionsAndSettings: "\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E17\u0E31\u0E49\u0E07\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32? \u0E01\u0E32\u0E23\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E14\u0E49",
        resetSessionsAndSettingsDone: "\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E41\u0E25\u0E49\u0E27",
        resetSessionsAndSettingsFailed: "\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E44\u0E14\u0E49",
        confirmDeleteSettingsHint: "\u0E2B\u0E32\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E1B\u0E34\u0E14\u0E01\u0E32\u0E23\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E19\u0E35\u0E49 \u0E43\u0E2B\u0E49\u0E44\u0E1B\u0E17\u0E35\u0E48\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32",
        groupCreated: function(n) {
          return '\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E01\u0E25\u0E38\u0E48\u0E21 "' + n + '" \u0E41\u0E25\u0E49\u0E27';
        },
        groupDeleted: function(n) {
          return '\u0E25\u0E1A\u0E01\u0E25\u0E38\u0E48\u0E21 "' + n + '" \u0E41\u0E25\u0E49\u0E27';
        },
        groupRenamed: function(o, n) {
          return '\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E0A\u0E37\u0E48\u0E2D\u0E01\u0E25\u0E38\u0E48\u0E21: "' + o + '" \u2192 "' + n + '"';
        },
        groupAll: "\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14",
        groupDuplicateName: "\u0E21\u0E35\u0E01\u0E25\u0E38\u0E48\u0E21\u0E0A\u0E37\u0E48\u0E2D\u0E19\u0E35\u0E49\u0E2D\u0E22\u0E39\u0E48\u0E41\u0E25\u0E49\u0E27",
        groupEmptyName: "\u0E0A\u0E37\u0E48\u0E2D\u0E01\u0E25\u0E38\u0E48\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E27\u0E48\u0E32\u0E07",
        cmdSwitchGroup: "\u0E2A\u0E25\u0E31\u0E1A\u0E01\u0E25\u0E38\u0E48\u0E21",
        cmdExitGroup: "\u0E41\u0E2A\u0E14\u0E07\u0E17\u0E38\u0E01\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19 (\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E01\u0E25\u0E38\u0E48\u0E21)",
        cmdNextGroup: "\u0E01\u0E25\u0E38\u0E48\u0E21\u0E16\u0E31\u0E14\u0E44\u0E1B",
        cmdPreviousGroup: "\u0E01\u0E25\u0E38\u0E48\u0E21\u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32",
        searchOverlayHelpWithGroups: "\u2191\u2193 \u0E22\u0E49\u0E32\u0E22  /  Tab \u0E01\u0E25\u0E38\u0E48\u0E21  /  Enter \u0E2A\u0E25\u0E31\u0E1A  /  \u21E7Enter \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01  /  \u232B \u0E25\u0E1A  /  Esc \u0E1B\u0E34\u0E14",
        settingsSectionGroups: "\u0E01\u0E25\u0E38\u0E48\u0E21\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        contextToggleGroups: "\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E01\u0E25\u0E38\u0E48\u0E21\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        settingsSectionGroupsDesc: "\u0E43\u0E0A\u0E49\u0E01\u0E25\u0E38\u0E48\u0E21\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E08\u0E31\u0E14\u0E23\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19 \u0E1B\u0E34\u0E14\u0E15\u0E31\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E19\u0E35\u0E49\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E0B\u0E48\u0E2D\u0E19\u0E41\u0E17\u0E47\u0E1A\u0E01\u0E25\u0E38\u0E48\u0E21\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E2A\u0E25\u0E31\u0E1A\u0E01\u0E25\u0E38\u0E48\u0E21",
        settingsGroupCreate: "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E01\u0E25\u0E38\u0E48\u0E21",
        settingsGroupCreateDesc: "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E01\u0E25\u0E38\u0E48\u0E21\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E43\u0E2B\u0E21\u0E48",
        settingsGroupCreatePlaceholder: "\u0E0A\u0E37\u0E48\u0E2D\u0E01\u0E25\u0E38\u0E48\u0E21...",
        settingsGroupCreateBtn: "\u0E2A\u0E23\u0E49\u0E32\u0E07",
        settingsGroupManageSessions: "\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        settingsGroupManageSessionsDesc: "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2B\u0E23\u0E37\u0E2D\u0E19\u0E33\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E01\u0E25\u0E38\u0E48\u0E21\u0E19\u0E35\u0E49",
        settingsGroupSessionCount: function(n) {
          return n + " \u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19";
        },
        settingsGroupDelete: "\u0E25\u0E1A\u0E01\u0E25\u0E38\u0E48\u0E21",
        settingsGroupDeleteConfirm: function(n) {
          return '\u0E25\u0E1A\u0E01\u0E25\u0E38\u0E48\u0E21 "' + n + '"? \u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E08\u0E30\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E25\u0E1A';
        },
        confirmDeleteGroup: function(n) {
          return '\u0E25\u0E1A\u0E01\u0E25\u0E38\u0E48\u0E21 "' + n + '"? \u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E43\u0E19\u0E01\u0E25\u0E38\u0E48\u0E21\u0E08\u0E30\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E25\u0E1A';
        },
        groupAddedSession: function(s, g) {
          return '\u0E40\u0E1E\u0E34\u0E48\u0E21 "' + s + '" \u0E44\u0E1B\u0E22\u0E31\u0E07 "' + g + '" \u0E41\u0E25\u0E49\u0E27';
        },
        groupRemovedSession: function(s, g) {
          return '\u0E19\u0E33 "' + s + '" \u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01 "' + g + '" \u0E41\u0E25\u0E49\u0E27';
        },
        groupRemoveFromGroup: "\u0E19\u0E33\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E01\u0E25\u0E38\u0E48\u0E21",
        groupMoveToGroup: "\u0E22\u0E49\u0E32\u0E22\u0E44\u0E1B\u0E22\u0E31\u0E07\u0E01\u0E25\u0E38\u0E48\u0E21",
        groupCreateNew: "\u0E01\u0E25\u0E38\u0E48\u0E21\u0E43\u0E2B\u0E21\u0E48",
        groupCreatePlaceholder: "\u0E0A\u0E37\u0E48\u0E2D\u0E01\u0E25\u0E38\u0E48\u0E21...",
        groupContextRename: "\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E0A\u0E37\u0E48\u0E2D\u0E01\u0E25\u0E38\u0E48\u0E21",
        groupContextDelete: "\u0E25\u0E1A\u0E01\u0E25\u0E38\u0E48\u0E21",
        contextSwitchSession: "\u0E2A\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E22\u0E31\u0E07\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E19\u0E35\u0E49",
        contextRenameSession: "\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E19\u0E35\u0E49",
        contextDeleteSession: "\u0E25\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E19\u0E35\u0E49",
        contextDuplicateSession: "\u0E17\u0E33\u0E2A\u0E33\u0E40\u0E19\u0E32\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E19\u0E35\u0E49",
        contextReloadSession: "\u0E42\u0E2B\u0E25\u0E14\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E19\u0E35\u0E49\u0E0B\u0E49\u0E33",
        contextSaveSession: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E19\u0E35\u0E49",
        contextSaveCurrentLayoutToThisSession: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E04\u0E49\u0E32\u0E42\u0E04\u0E23\u0E07\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19\u0E25\u0E07\u0E43\u0E19\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E19\u0E35\u0E49",
        groupRemoveAllSessions: "\u0E19\u0E33\u0E17\u0E38\u0E01\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E01\u0E25\u0E38\u0E48\u0E21\u0E19\u0E35\u0E49",
        confirmRemoveAllFromGroup: function(g, n) {
          return "\u0E19\u0E33\u0E17\u0E31\u0E49\u0E07 " + n + ' \u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01 "' + g + '"?';
        },
        groupRemovedAllSessions: function(g) {
          return '\u0E19\u0E33\u0E17\u0E38\u0E01\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01 "' + g + '" \u0E41\u0E25\u0E49\u0E27';
        },
        contextDeleteAllGroups: "\u0E25\u0E1A\u0E17\u0E38\u0E01\u0E01\u0E25\u0E38\u0E48\u0E21",
        confirmDeleteAllGroups: function(n) {
          return "\u0E25\u0E1A\u0E17\u0E31\u0E49\u0E07 " + n + " \u0E01\u0E25\u0E38\u0E48\u0E21? \u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E08\u0E30\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E25\u0E1A";
        },
        deletedAllGroups: function(n) {
          return "\u0E25\u0E1A " + n + " \u0E01\u0E25\u0E38\u0E48\u0E21\u0E41\u0E25\u0E49\u0E27";
        },
        contextDeleteAllSessions: "\u0E25\u0E1A\u0E17\u0E38\u0E01\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        confirmDeleteAllSessions: function(n) {
          return "\u0E25\u0E1A " + n + " \u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19? \u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E2D\u0E22\u0E39\u0E48\u0E08\u0E30\u0E16\u0E39\u0E01\u0E40\u0E01\u0E47\u0E1A\u0E44\u0E27\u0E49";
        },
        deletedAllSessions: function(n) {
          return "\u0E25\u0E1A " + n + " \u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E41\u0E25\u0E49\u0E27";
        },
        contextVersionHistory: "\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E0A\u0E31\u0E19",
        cmdVersionHistory: "\u0E14\u0E39\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E0A\u0E31\u0E19\u0E02\u0E2D\u0E07\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        historyTitle: "\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E0A\u0E31\u0E19",
        historyEmpty: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E0A\u0E31\u0E19\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E19\u0E35\u0E49",
        historyRestore: "\u0E01\u0E39\u0E49\u0E04\u0E37\u0E19",
        historyRestoreConfirm: function(name, time) {
          return '\u0E01\u0E39\u0E49\u0E04\u0E37\u0E19\u0E40\u0E04\u0E49\u0E32\u0E42\u0E04\u0E23\u0E07 "' + name + '" \u0E08\u0E32\u0E01\u0E2A\u0E41\u0E19\u0E1B\u0E0A\u0E47\u0E2D\u0E15 ' + time + "?";
        },
        historyRestored: function(name) {
          return '\u0E01\u0E39\u0E49\u0E04\u0E37\u0E19\u0E40\u0E04\u0E49\u0E32\u0E42\u0E04\u0E23\u0E07\u0E02\u0E2D\u0E07 "' + name + '" \u0E41\u0E25\u0E49\u0E27';
        },
        historyQuickRestored: function(name) {
          return '\u0E01\u0E39\u0E49\u0E04\u0E37\u0E19\u0E40\u0E04\u0E49\u0E32\u0E42\u0E04\u0E23\u0E07\u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E02\u0E2D\u0E07 "' + name + '" \u0E41\u0E1A\u0E1A\u0E14\u0E48\u0E27\u0E19\u0E41\u0E25\u0E49\u0E27';
        },
        historyNoEntries: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E40\u0E04\u0E49\u0E32\u0E42\u0E04\u0E23\u0E07\u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E43\u0E2B\u0E49\u0E01\u0E39\u0E49\u0E04\u0E37\u0E19",
        historyToday: "\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49",
        historyYesterday: "\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E27\u0E32\u0E19",
        historyThisWeek: "\u0E2A\u0E31\u0E1B\u0E14\u0E32\u0E2B\u0E4C\u0E19\u0E35\u0E49",
        historyFiles: function(n) {
          return n + " \u0E44\u0E1F\u0E25\u0E4C";
        },
        historyPanes: function(n) {
          return n + " \u0E1A\u0E32\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E15\u0E48\u0E32\u0E07";
        },
        settingsVersionHistoryEnabled: "\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E0A\u0E31\u0E19",
        settingsVersionHistoryEnabledDesc: "\u0E40\u0E01\u0E47\u0E1A\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E41\u0E1B\u0E25\u0E07\u0E40\u0E04\u0E49\u0E32\u0E42\u0E04\u0E23\u0E07\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E41\u0E15\u0E48\u0E25\u0E30\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19",
        settingsVersionHistoryInterval: "\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E2A\u0E41\u0E19\u0E1B\u0E0A\u0E47\u0E2D\u0E15 (\u0E19\u0E32\u0E17\u0E35)",
        settingsVersionHistoryIntervalDesc: "\u0E04\u0E27\u0E32\u0E21\u0E16\u0E35\u0E48\u0E43\u0E19\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E2B\u0E32\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E41\u0E1B\u0E25\u0E07\u0E40\u0E04\u0E49\u0E32\u0E42\u0E04\u0E23\u0E07\u0E41\u0E25\u0E30\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2A\u0E41\u0E19\u0E1B\u0E0A\u0E47\u0E2D\u0E15",
        settingsVersionHistoryCtrlRmb: platformLabel("\u0E01\u0E39\u0E49\u0E04\u0E37\u0E19\u0E14\u0E48\u0E27\u0E19 (Cmd + \u0E04\u0E25\u0E34\u0E01\u0E02\u0E27\u0E32)", "\u0E01\u0E39\u0E49\u0E04\u0E37\u0E19\u0E14\u0E48\u0E27\u0E19 (Ctrl + \u0E04\u0E25\u0E34\u0E01\u0E02\u0E27\u0E32)"),
        settingsVersionHistoryCtrlRmbDesc: platformLabel("\u0E04\u0E25\u0E34\u0E01\u0E02\u0E27\u0E32\u0E17\u0E35\u0E48\u0E41\u0E16\u0E1A\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E02\u0E13\u0E30\u0E01\u0E14 Cmd \u0E04\u0E49\u0E32\u0E07\u0E44\u0E27\u0E49\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E01\u0E39\u0E49\u0E04\u0E37\u0E19\u0E40\u0E04\u0E49\u0E32\u0E42\u0E04\u0E23\u0E07\u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32", "\u0E04\u0E25\u0E34\u0E01\u0E02\u0E27\u0E32\u0E17\u0E35\u0E48\u0E41\u0E16\u0E1A\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E02\u0E13\u0E30\u0E01\u0E14 Ctrl \u0E04\u0E49\u0E32\u0E07\u0E44\u0E27\u0E49\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E01\u0E39\u0E49\u0E04\u0E37\u0E19\u0E40\u0E04\u0E49\u0E32\u0E42\u0E04\u0E23\u0E07\u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32"),
        settingsVersionHistoryConfirmRestore: "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E01\u0E48\u0E2D\u0E19\u0E01\u0E39\u0E49\u0E04\u0E37\u0E19",
        settingsVersionHistoryConfirmRestoreDesc: "\u0E41\u0E2A\u0E14\u0E07\u0E01\u0E25\u0E48\u0E2D\u0E07\u0E42\u0E15\u0E49\u0E15\u0E2D\u0E1A\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E01\u0E48\u0E2D\u0E19\u0E01\u0E39\u0E49\u0E04\u0E37\u0E19\u0E40\u0E04\u0E49\u0E32\u0E42\u0E04\u0E23\u0E07\u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32",
        rotationBackupSectionTitle: "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E33\u0E23\u0E2D\u0E07",
        rotationBackupCreate: "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E33\u0E23\u0E2D\u0E07",
        rotationBackupCreateBtn: "\u0E2A\u0E33\u0E23\u0E2D\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E15\u0E2D\u0E19\u0E19\u0E35\u0E49",
        rotationBackupCreated: "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E33\u0E23\u0E2D\u0E07\u0E41\u0E25\u0E49\u0E27",
        rotationBackupFailed: "\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E33\u0E23\u0E2D\u0E07\u0E44\u0E14\u0E49",
        rotationBackupDesc: "\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E33\u0E23\u0E2D\u0E07\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 (\u0E17\u0E38\u0E01\u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07 \u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14 3 \u0E23\u0E38\u0E48\u0E19)",
        rotationBackupRestore: "\u0E01\u0E39\u0E49\u0E04\u0E37\u0E19",
        rotationBackupRestoreConfirm: function(time, count) {
          return "\u0E01\u0E39\u0E49\u0E04\u0E37\u0E19\u0E08\u0E32\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E33\u0E23\u0E2D\u0E07 " + time + " (" + count + " \u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19)? \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19\u0E08\u0E30\u0E16\u0E39\u0E01\u0E40\u0E02\u0E35\u0E22\u0E19\u0E17\u0E31\u0E1A";
        },
        rotationBackupRestored: "\u0E01\u0E39\u0E49\u0E04\u0E37\u0E19\u0E08\u0E32\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E33\u0E23\u0E2D\u0E07\u0E41\u0E25\u0E49\u0E27",
        rotationBackupRestoreFailed: "\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E01\u0E39\u0E49\u0E04\u0E37\u0E19\u0E08\u0E32\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E33\u0E23\u0E2D\u0E07\u0E44\u0E14\u0E49",
        rotationBackupNone: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E33\u0E23\u0E2D\u0E07",
        rotationBackupGeneration: function(count) {
          return count + " \u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19";
        },
        frontmatterSessionNotFound: function(n) {
          return '\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19 "' + n + '" (workspace-session)';
        },
        frontmatterAlreadyActive: function(n) {
          return '\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19 "' + n + '" \u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E2D\u0E22\u0E39\u0E48\u0E41\u0E25\u0E49\u0E27';
        }
      }
    };
    var EXTENDED_STRINGS = {
      zh: {
        confirmOverwriteSessionWithCurrentLayout: function(n) {
          return "\u7528\u5F53\u524D\u5E03\u5C40\u8986\u76D6\u201C" + n + "\u201D\uFF1F";
        },
        cmdSaveCurrentLayoutToSession: "\u5C06\u5F53\u524D\u5E03\u5C40\u4FDD\u5B58\u5230\u4F1A\u8BDD...",
        savedCurrentLayoutToSession: function(n) {
          return "\u5DF2\u5C06\u5F53\u524D\u5E03\u5C40\u4FDD\u5B58\u5230\u201C" + n + "\u201D";
        },
        saveCurrentLayoutToSessionPlaceholder: "\u9009\u62E9\u8981\u8986\u76D6\u7684\u4F1A\u8BDD...",
        contextSaveCurrentLayoutToThisSession: "\u5C06\u5F53\u524D\u5E03\u5C40\u4FDD\u5B58\u5230\u6B64\u4F1A\u8BDD",
        cmdExportSessions: "\u5BFC\u51FA\u4F1A\u8BDD\u5FEB\u7167",
        cmdImportSessions: "\u5BFC\u5165\u6700\u65B0\u4F1A\u8BDD\u5FEB\u7167",
        cmdReloadCurrentWithoutSaving: "\u91CD\u65B0\u52A0\u8F7D\u5F53\u524D\u4F1A\u8BDD\uFF08\u4E0D\u4FDD\u5B58\uFF09",
        reloadedSession: function(n) {
          return "\u5DF2\u91CD\u65B0\u52A0\u8F7D\u4F1A\u8BDD\u201C" + n + "\u201D";
        },
        defaultSessionName: "\u9ED8\u8BA4",
        nameSessionTitle: "\u547D\u540D\u5E76\u4FDD\u5B58\u4F1A\u8BDD",
        nameSessionPlaceholder: "\u4F1A\u8BDD\u540D\u79F0...",
        saveWithoutNaming: "\u4E0D\u547D\u540D\u76F4\u63A5\u4FDD\u5B58",
        sessionDataMigrated: "Workspace++: \u4F1A\u8BDD\u6570\u636E\u5DF2\u8FC1\u79FB\u5230 .workspace-plus-plus/sessions.json\u3002",
        sessionDataMigrationFailed: "Workspace++: \u4F1A\u8BDD\u6570\u636E\u8FC1\u79FB\u5931\u8D25\u3002\u65E7\u7248\u6570\u636E\u5DF2\u4FDD\u7559\u3002",
        localSettingsEnabled: "Workspace++: \u5DF2\u542F\u7528 Vault \u672C\u5730\u8BBE\u7F6E\u3002",
        localSettingsDisabled: "Workspace++: \u5DF2\u7981\u7528 Vault \u672C\u5730\u8BBE\u7F6E\u3002",
        localSettingsCopied: "Workspace++: \u5DF2\u5C06\u5168\u5C40\u8BBE\u7F6E\u590D\u5236\u5230 Vault \u672C\u5730\u8BBE\u7F6E\u3002",
        localSettingsLoadFailed: "Workspace++: \u65E0\u6CD5\u52A0\u8F7D Vault \u672C\u5730\u8BBE\u7F6E\u3002\u5C06\u4F7F\u7528\u5168\u5C40\u8BBE\u7F6E\u3002",
        localSettingsOperationFailed: "Workspace++: \u66F4\u65B0 Vault \u672C\u5730\u8BBE\u7F6E\u5931\u8D25\u3002",
        exportSessionsDone: function(path) {
          return "Workspace++: \u5DF2\u5C06\u4F1A\u8BDD\u5BFC\u51FA\u5230 " + path;
        },
        exportSessionsFailed: "Workspace++: \u5BFC\u51FA\u4F1A\u8BDD\u5931\u8D25\u3002",
        importSessionsDone: function(path) {
          return "Workspace++: \u5DF2\u4ECE " + path + " \u5BFC\u5165\u4F1A\u8BDD\u3002";
        },
        importSessionsNoFile: "Workspace++: \u5728 .workspace-plus-plus/exports \u4E2D\u672A\u627E\u5230\u5BFC\u51FA\u6587\u4EF6\u3002",
        importSessionsFailed: "Workspace++: \u5BFC\u5165\u4F1A\u8BDD\u5931\u8D25\u3002",
        settingsSectionAdvanced: "\u9AD8\u7EA7",
        settingsSectionReset: "\u91CD\u7F6E",
        settingsGitHubLink: "GitHub",
        settingsSectionSessionListSearch: "\u4F1A\u8BDD\u5217\u8868\u4E0E\u641C\u7D22",
        settingsSectionSwitchCommands: "\u5207\u6362\u547D\u4EE4",
        settingsSectionScrollSwitch: "\u6EDA\u52A8\u5207\u6362",
        settingsSubsectionSwitchSaving: "\u5207\u6362\u4F1A\u8BDD\u65F6\u7684\u4FDD\u5B58",
        settingsSubsectionAutoSaveMode: "\u4F1A\u8BDD\u81EA\u52A8\u4FDD\u5B58\u6A21\u5F0F",
        settingsSubsectionSwitchCommands: "\u4F1A\u8BDD\u5207\u6362\u547D\u4EE4",
        settingsSubsectionScrollSwitch: "\u901A\u8FC7\u6EDA\u52A8\u5207\u6362\u4F1A\u8BDD",
        settingsSubsectionSwitchPreview: "\u5207\u6362\u4F1A\u8BDD\u524D\u9884\u89C8",
        settingsStatusBarScrollPreset: "\u6EDA\u52A8\u8F93\u5165\u9884\u8BBE",
        settingsStatusBarScrollPresetDesc: "\u9009\u62E9\u9002\u5408\u4F60\u8BBE\u5907\u7684\u9884\u8BBE\uFF0C\u6216\u5207\u6362\u5230\u201C\u81EA\u5B9A\u4E49\u201D\u81EA\u884C\u8C03\u6574\u6570\u503C\u3002",
        settingsStatusBarScrollPresetTrackpad: "\u89E6\u63A7\u677F",
        settingsStatusBarScrollPresetNotchedWheel: "\u6709\u523B\u5EA6\u9F20\u6807\u6EDA\u8F6E",
        settingsStatusBarScrollPresetFreeSpinWheel: "\u81EA\u7531\u6EDA\u52A8\u9F20\u6807\u6EDA\u8F6E",
        settingsStatusBarScrollPresetCustom: "\u81EA\u5B9A\u4E49",
        settingsStatusBarScrollModifier: "\u6240\u9700\u4FEE\u9970\u952E",
        settingsStatusBarScrollModifierDesc: "\u9009\u62E9\u5728\u72B6\u6001\u680F\u9879\u76EE\u4E0A\u6EDA\u52A8\u65F6\u5FC5\u987B\u6309\u4F4F\u7684\u4FEE\u9970\u952E\u3002",
        settingsStatusBarScrollModifierRecommended: platformLabel("Cmd \u6216 Option", "Ctrl \u6216 Alt"),
        settingsStatusBarScrollModifierNone: "\u65E0",
        settingsStatusBarScrollModifierModOnly: platformLabel("\u4EC5 Cmd", "\u4EC5 Ctrl"),
        settingsStatusBarScrollModifierAltOnly: platformLabel("\u4EC5 Option", "\u4EC5 Alt"),
        settingsStatusBarScrollModifierModOrAlt: platformLabel("Cmd \u6216 Option", "Ctrl \u6216 Alt"),
        settingsStatusBarScrollThreshold: "\u7075\u654F\u5EA6\u9608\u503C",
        settingsStatusBarScrollThresholdDesc: "\u503C\u8D8A\u5C0F\uFF0C\u8D8A\u5BB9\u6613\u89E6\u53D1\u5207\u6362\u3002\u4EC5\u5728\u201C\u81EA\u5B9A\u4E49\u201D\u9884\u8BBE\u4E0B\u4F7F\u7528\u3002",
        settingsStatusBarScrollCooldown: "\u51B7\u5374\u65F6\u95F4",
        settingsStatusBarScrollCooldownDesc: "\u4E24\u6B21\u6EDA\u52A8\u89E6\u53D1\u7684\u4F1A\u8BDD\u5207\u6362\u4E4B\u95F4\u7684\u6700\u77ED\u95F4\u9694\u3002\u4EC5\u5728\u201C\u81EA\u5B9A\u4E49\u201D\u9884\u8BBE\u4E0B\u4F7F\u7528\u3002",
        settingsStatusBarScrollResetWindow: "\u7D2F\u79EF\u91CD\u7F6E\u7A97\u53E3",
        settingsStatusBarScrollResetWindowDesc: "\u5728\u91CD\u7F6E\u524D\uFF0C\u5C06\u8F83\u5C0F\u6EDA\u52A8\u589E\u91CF\u6301\u7EED\u5408\u5E76\u7684\u65F6\u957F\u3002\u4EC5\u5728\u201C\u81EA\u5B9A\u4E49\u201D\u9884\u8BBE\u4E0B\u4F7F\u7528\u3002",
        settingsStatusBarScrollInvert: "\u53CD\u8F6C\u6EDA\u52A8\u65B9\u5411",
        settingsStatusBarScrollInvertDesc: "\u53CD\u8F6C\u72B6\u6001\u680F\u6EDA\u52A8\u5207\u6362\u65F6\u7684\u4E0A\u4E00\u9879/\u4E0B\u4E00\u9879\u65B9\u5411\u3002",
        settingsUseLocalSettings: "\u4F7F\u7528 Vault \u672C\u5730\u8BBE\u7F6E",
        settingsUseLocalSettingsDesc: "\u5982\u679C\u4F60\u5728\u591A\u4E2A Vault \u4E4B\u95F4\u540C\u6B65 .obsidian\uFF08\u4F8B\u5982\u4F7F\u7528 Settings Profiles\uFF09\uFF0C\u5E76\u5E0C\u671B Workspace++ \u8BBE\u7F6E\u6309 Vault \u5206\u5F00\u4FDD\u5B58\uFF0C\u8BF7\u5F00\u542F\u6B64\u9879\u3002",
        settingsCopyGlobalToLocal: "\u5C06\u5168\u5C40\u8BBE\u7F6E\u590D\u5236\u5230\u6B64 Vault",
        settingsCopyGlobalToLocalDesc: "\u7528\u5F53\u524D\u5168\u5C40\u8BBE\u7F6E\u8986\u76D6 Vault \u672C\u5730\u8BBE\u7F6E\u3002",
        settingsCopyGlobalToLocalBtn: "\u590D\u5236",
        settingsResetLocalSettings: "\u91CD\u7F6E Vault \u672C\u5730\u8BBE\u7F6E",
        settingsResetLocalSettingsDesc: "\u5C06 Vault \u672C\u5730\u8BBE\u7F6E\u91CD\u7F6E\u4E3A\u5168\u5C40\u8BBE\u7F6E\u3002",
        settingsResetLocalSettingsBtn: "\u91CD\u7F6E\u672C\u5730",
        settingsAdvancedStorageSubsection: "\u5B58\u50A8\u884C\u4E3A",
        settingsAdvancedTransferSubsection: "\u6570\u636E\u8FC1\u79FB",
        settingsDeveloperSection: "\u5F00\u53D1\u8005\u5DE5\u5177",
        settingsStorageDiagnostics: "\u5B58\u50A8\u8BCA\u65AD",
        settingsStorageDiagnosticsDesc: "Workspace++ \u5F53\u524D\u4F7F\u7528\u7684\u5B58\u50A8\u4FE1\u606F\u3002",
        settingsStorageFieldSessions: "\u4F1A\u8BDD\u6587\u4EF6",
        settingsStorageFieldSessionsBackup: "\u4F1A\u8BDD\u5907\u4EFD",
        settingsStorageFieldLocalSettings: "\u672C\u5730\u8BBE\u7F6E\u6587\u4EF6",
        settingsStorageFieldGlobalSettings: "\u5168\u5C40\u8BBE\u7F6E\u6587\u4EF6",
        settingsStorageFieldSessionCount: "\u4F1A\u8BDD\u6570\u91CF",
        settingsStorageFieldUpdatedAt: "\u66F4\u65B0\u65F6\u95F4",
        settingsExportSessions: "\u5BFC\u51FA\u4F1A\u8BDD",
        settingsExportSessionsDesc: "\u5C06\u5FEB\u7167\u4FDD\u5B58\u5230 .workspace-plus-plus/exports\u3002",
        settingsExportSessionsBtn: "\u5BFC\u51FA",
        settingsImportSessions: "\u5BFC\u5165\u4F1A\u8BDD",
        settingsImportSessionsDesc: "\u4ECE .workspace-plus-plus/exports \u5BFC\u5165\u6700\u65B0\u5FEB\u7167\u3002",
        settingsImportSessionsBtn: "\u5BFC\u5165\u6700\u65B0",
        confirmImportSessions: "\u8981\u5BFC\u5165\u6700\u65B0\u5BFC\u51FA\u7684\u4F1A\u8BDD\u5417\uFF1F\u5F53\u524D\u4F1A\u8BDD\u5C06\u88AB\u66FF\u6362\u3002",
        settingsResetSettings: "\u91CD\u7F6E\u8BBE\u7F6E",
        settingsResetSettingsDesc: "\u5C06\u5F53\u524D\u8BBE\u7F6E\u8303\u56F4\u4E2D\u7684 Workspace++ \u8BBE\u7F6E\u6062\u590D\u4E3A\u9ED8\u8BA4\u503C\u3002",
        settingsResetSettingsBtn: "\u91CD\u7F6E\u8BBE\u7F6E",
        confirmResetSettings: "\u8981\u5C06 Workspace++ \u8BBE\u7F6E\u91CD\u7F6E\u4E3A\u9ED8\u8BA4\u503C\u5417\uFF1F",
        resetSettingsDone: "Workspace++ \u8BBE\u7F6E\u5DF2\u91CD\u7F6E\u3002",
        resetSettingsFailed: "\u91CD\u7F6E Workspace++ \u8BBE\u7F6E\u5931\u8D25\u3002",
        settingsResetSessionsAndSettings: "\u91CD\u7F6E\u4F1A\u8BDD\u548C\u8BBE\u7F6E",
        settingsResetSessionsAndSettingsDesc: "\u4E00\u6B21\u6027\u91CD\u7F6E\u5DF2\u4FDD\u5B58\u4F1A\u8BDD\u548C Workspace++ \u8BBE\u7F6E\u3002",
        settingsResetSessionsAndSettingsBtn: "\u5168\u90E8\u91CD\u7F6E",
        confirmResetSessionsAndSettings: "\u8981\u540C\u65F6\u91CD\u7F6E\u4F1A\u8BDD\u548C\u8BBE\u7F6E\u5417\uFF1F\u6B64\u64CD\u4F5C\u65E0\u6CD5\u64A4\u9500\u3002",
        resetSessionsAndSettingsDone: "\u4F1A\u8BDD\u548C\u8BBE\u7F6E\u5DF2\u91CD\u7F6E\u3002",
        resetSessionsAndSettingsFailed: "\u91CD\u7F6E\u4F1A\u8BDD\u548C\u8BBE\u7F6E\u5931\u8D25\u3002"
      },
      "zh-TW": {
        confirmOverwriteSessionWithCurrentLayout: function(n) {
          return "\u8981\u7528\u76EE\u524D\u4F48\u5C40\u8986\u5BEB\u300C" + n + "\u300D\u55CE\uFF1F";
        },
        cmdSaveCurrentLayoutToSession: "\u5C07\u76EE\u524D\u4F48\u5C40\u5132\u5B58\u5230\u5DE5\u4F5C\u968E\u6BB5...",
        savedCurrentLayoutToSession: function(n) {
          return "\u5DF2\u5C07\u76EE\u524D\u4F48\u5C40\u5132\u5B58\u5230\u300C" + n + "\u300D";
        },
        saveCurrentLayoutToSessionPlaceholder: "\u9078\u64C7\u8981\u8986\u5BEB\u7684\u5DE5\u4F5C\u968E\u6BB5...",
        contextSaveCurrentLayoutToThisSession: "\u5C07\u76EE\u524D\u4F48\u5C40\u5132\u5B58\u5230\u6B64\u5DE5\u4F5C\u968E\u6BB5",
        cmdExportSessions: "\u532F\u51FA\u5DE5\u4F5C\u968E\u6BB5\u5FEB\u7167",
        cmdImportSessions: "\u532F\u5165\u6700\u65B0\u5DE5\u4F5C\u968E\u6BB5\u5FEB\u7167",
        cmdReloadCurrentWithoutSaving: "\u91CD\u65B0\u8F09\u5165\u76EE\u524D\u5DE5\u4F5C\u968E\u6BB5\uFF08\u4E0D\u5132\u5B58\uFF09",
        reloadedSession: function(n) {
          return "\u5DF2\u91CD\u65B0\u8F09\u5165\u5DE5\u4F5C\u968E\u6BB5\u300C" + n + "\u300D";
        },
        defaultSessionName: "\u9810\u8A2D",
        nameSessionTitle: "\u547D\u540D\u4E26\u5132\u5B58\u5DE5\u4F5C\u968E\u6BB5",
        nameSessionPlaceholder: "\u5DE5\u4F5C\u968E\u6BB5\u540D\u7A31...",
        saveWithoutNaming: "\u4E0D\u547D\u540D\u76F4\u63A5\u5132\u5B58",
        sessionDataMigrated: "Workspace++: \u5DE5\u4F5C\u968E\u6BB5\u8CC7\u6599\u5DF2\u79FB\u81F3 .workspace-plus-plus/sessions.json\u3002",
        sessionDataMigrationFailed: "Workspace++: \u5DE5\u4F5C\u968E\u6BB5\u8CC7\u6599\u79FB\u8F49\u5931\u6557\u3002\u820A\u7248\u8CC7\u6599\u5DF2\u4FDD\u7559\u3002",
        localSettingsEnabled: "Workspace++: \u5DF2\u555F\u7528 Vault \u672C\u6A5F\u8A2D\u5B9A\u3002",
        localSettingsDisabled: "Workspace++: \u5DF2\u505C\u7528 Vault \u672C\u6A5F\u8A2D\u5B9A\u3002",
        localSettingsCopied: "Workspace++: \u5DF2\u5C07\u5168\u57DF\u8A2D\u5B9A\u8907\u88FD\u5230 Vault \u672C\u6A5F\u8A2D\u5B9A\u3002",
        localSettingsLoadFailed: "Workspace++: \u7121\u6CD5\u8F09\u5165 Vault \u672C\u6A5F\u8A2D\u5B9A\u3002\u5C07\u6539\u7528\u5168\u57DF\u8A2D\u5B9A\u3002",
        localSettingsOperationFailed: "Workspace++: \u66F4\u65B0 Vault \u672C\u6A5F\u8A2D\u5B9A\u5931\u6557\u3002",
        exportSessionsDone: function(path) {
          return "Workspace++: \u5DF2\u5C07\u5DE5\u4F5C\u968E\u6BB5\u532F\u51FA\u5230 " + path;
        },
        exportSessionsFailed: "Workspace++: \u532F\u51FA\u5DE5\u4F5C\u968E\u6BB5\u5931\u6557\u3002",
        importSessionsDone: function(path) {
          return "Workspace++: \u5DF2\u5F9E " + path + " \u532F\u5165\u5DE5\u4F5C\u968E\u6BB5\u3002";
        },
        importSessionsNoFile: "Workspace++: \u5728 .workspace-plus-plus/exports \u4E2D\u627E\u4E0D\u5230\u532F\u51FA\u6A94\u6848\u3002",
        importSessionsFailed: "Workspace++: \u532F\u5165\u5DE5\u4F5C\u968E\u6BB5\u5931\u6557\u3002",
        settingsSectionAdvanced: "\u9032\u968E",
        settingsSectionReset: "\u91CD\u8A2D",
        settingsGitHubLink: "GitHub",
        settingsSectionSessionListSearch: "\u5DE5\u4F5C\u968E\u6BB5\u6E05\u55AE\u8207\u641C\u5C0B",
        settingsSectionSwitchCommands: "\u5207\u63DB\u547D\u4EE4",
        settingsSectionScrollSwitch: "\u6EFE\u52D5\u5207\u63DB",
        settingsSubsectionSwitchSaving: "\u5207\u63DB\u5DE5\u4F5C\u968E\u6BB5\u6642\u7684\u5132\u5B58",
        settingsSubsectionAutoSaveMode: "\u5DE5\u4F5C\u968E\u6BB5\u81EA\u52D5\u5132\u5B58\u6A21\u5F0F",
        settingsSubsectionSwitchCommands: "\u5DE5\u4F5C\u968E\u6BB5\u5207\u63DB\u547D\u4EE4",
        settingsSubsectionScrollSwitch: "\u900F\u904E\u6EFE\u52D5\u5207\u63DB\u5DE5\u4F5C\u968E\u6BB5",
        settingsSubsectionSwitchPreview: "\u5207\u63DB\u5DE5\u4F5C\u968E\u6BB5\u524D\u9810\u89BD",
        settingsStatusBarScrollPreset: "\u6EFE\u52D5\u8F38\u5165\u9810\u8A2D",
        settingsStatusBarScrollPresetDesc: "\u9078\u64C7\u9069\u5408\u4F60\u88DD\u7F6E\u7684\u9810\u8A2D\uFF0C\u6216\u5207\u63DB\u5230\u300C\u81EA\u8A02\u300D\u81EA\u884C\u8ABF\u6574\u6578\u503C\u3002",
        settingsStatusBarScrollPresetTrackpad: "\u89F8\u63A7\u677F",
        settingsStatusBarScrollPresetNotchedWheel: "\u6709\u6BB5\u843D\u611F\u7684\u6ED1\u9F20\u6EFE\u8F2A",
        settingsStatusBarScrollPresetFreeSpinWheel: "\u81EA\u7531\u65CB\u8F49\u6ED1\u9F20\u6EFE\u8F2A",
        settingsStatusBarScrollPresetCustom: "\u81EA\u8A02",
        settingsStatusBarScrollModifier: "\u9700\u8981\u7684\u4FEE\u98FE\u9375",
        settingsStatusBarScrollModifierDesc: "\u9078\u64C7\u5728\u72C0\u614B\u5217\u9805\u76EE\u4E0A\u6EFE\u52D5\u6642\u5FC5\u9808\u6309\u4F4F\u7684\u4FEE\u98FE\u9375\u3002",
        settingsStatusBarScrollModifierRecommended: platformLabel("Cmd \u6216 Option", "Ctrl \u6216 Alt"),
        settingsStatusBarScrollModifierNone: "\u7121",
        settingsStatusBarScrollModifierModOnly: platformLabel("\u50C5 Cmd", "\u50C5 Ctrl"),
        settingsStatusBarScrollModifierAltOnly: platformLabel("\u50C5 Option", "\u50C5 Alt"),
        settingsStatusBarScrollModifierModOrAlt: platformLabel("Cmd \u6216 Option", "Ctrl \u6216 Alt"),
        settingsStatusBarScrollThreshold: "\u9748\u654F\u5EA6\u9580\u6ABB",
        settingsStatusBarScrollThresholdDesc: "\u6578\u503C\u8D8A\u5C0F\uFF0C\u8D8A\u5BB9\u6613\u5207\u63DB\u3002\u50C5\u5728\u300C\u81EA\u8A02\u300D\u9810\u8A2D\u6642\u4F7F\u7528\u3002",
        settingsStatusBarScrollCooldown: "\u51B7\u537B\u6642\u9593",
        settingsStatusBarScrollCooldownDesc: "\u5169\u6B21\u7531\u6EFE\u52D5\u89F8\u767C\u7684\u5DE5\u4F5C\u968E\u6BB5\u5207\u63DB\u4E4B\u9593\u7684\u6700\u77ED\u9593\u9694\u3002\u50C5\u5728\u300C\u81EA\u8A02\u300D\u9810\u8A2D\u6642\u4F7F\u7528\u3002",
        settingsStatusBarScrollResetWindow: "\u7D2F\u7A4D\u91CD\u8A2D\u6642\u9593\u7A97",
        settingsStatusBarScrollResetWindowDesc: "\u5728\u91CD\u8A2D\u524D\uFF0C\u6301\u7E8C\u7D2F\u7A4D\u8F03\u5C0F\u6EFE\u52D5\u91CF\u7684\u6642\u9593\u3002\u50C5\u5728\u300C\u81EA\u8A02\u300D\u9810\u8A2D\u6642\u4F7F\u7528\u3002",
        settingsStatusBarScrollInvert: "\u53CD\u8F49\u6EFE\u52D5\u65B9\u5411",
        settingsStatusBarScrollInvertDesc: "\u53CD\u8F49\u72C0\u614B\u5217\u6EFE\u52D5\u5207\u63DB\u6642\u4E0A\u4E00\u500B/\u4E0B\u4E00\u500B\u7684\u65B9\u5411\u3002",
        settingsUseLocalSettings: "\u4F7F\u7528 Vault \u672C\u6A5F\u8A2D\u5B9A",
        settingsUseLocalSettingsDesc: "\u82E5\u4F60\u5728\u591A\u500B Vault \u4E4B\u9593\u540C\u6B65 .obsidian\uFF08\u4F8B\u5982\u4F7F\u7528 Settings Profiles\uFF09\uFF0C\u4E26\u5E0C\u671B Workspace++ \u8A2D\u5B9A\u5728\u5404 Vault \u5206\u958B\u4FDD\u5B58\uFF0C\u8ACB\u555F\u7528\u6B64\u9805\u3002",
        settingsCopyGlobalToLocal: "\u5C07\u5168\u57DF\u8A2D\u5B9A\u8907\u88FD\u5230\u6B64 Vault",
        settingsCopyGlobalToLocalDesc: "\u4EE5\u76EE\u524D\u5168\u57DF\u8A2D\u5B9A\u8986\u5BEB Vault \u672C\u6A5F\u8A2D\u5B9A\u3002",
        settingsCopyGlobalToLocalBtn: "\u8907\u88FD",
        settingsResetLocalSettings: "\u91CD\u8A2D Vault \u672C\u6A5F\u8A2D\u5B9A",
        settingsResetLocalSettingsDesc: "\u5C07 Vault \u672C\u6A5F\u8A2D\u5B9A\u91CD\u8A2D\u56DE\u5168\u57DF\u8A2D\u5B9A\u3002",
        settingsResetLocalSettingsBtn: "\u91CD\u8A2D\u672C\u6A5F",
        settingsAdvancedStorageSubsection: "\u5132\u5B58\u884C\u70BA",
        settingsAdvancedTransferSubsection: "\u8CC7\u6599\u79FB\u8F49",
        settingsDeveloperSection: "\u958B\u767C\u8005\u5DE5\u5177",
        settingsStorageDiagnostics: "\u5132\u5B58\u8A3A\u65B7",
        settingsStorageDiagnosticsDesc: "Workspace++ \u76EE\u524D\u4F7F\u7528\u7684\u5132\u5B58\u8CC7\u8A0A\u3002",
        settingsStorageFieldSessions: "\u5DE5\u4F5C\u968E\u6BB5\u6A94\u6848",
        settingsStorageFieldSessionsBackup: "\u5DE5\u4F5C\u968E\u6BB5\u5099\u4EFD",
        settingsStorageFieldLocalSettings: "\u672C\u6A5F\u8A2D\u5B9A\u6A94\u6848",
        settingsStorageFieldGlobalSettings: "\u5168\u57DF\u8A2D\u5B9A\u6A94\u6848",
        settingsStorageFieldSessionCount: "\u5DE5\u4F5C\u968E\u6BB5\u6578\u91CF",
        settingsStorageFieldUpdatedAt: "\u66F4\u65B0\u6642\u9593",
        settingsExportSessions: "\u532F\u51FA\u5DE5\u4F5C\u968E\u6BB5",
        settingsExportSessionsDesc: "\u5C07\u5FEB\u7167\u5132\u5B58\u81F3 .workspace-plus-plus/exports\u3002",
        settingsExportSessionsBtn: "\u532F\u51FA",
        settingsImportSessions: "\u532F\u5165\u5DE5\u4F5C\u968E\u6BB5",
        settingsImportSessionsDesc: "\u5F9E .workspace-plus-plus/exports \u532F\u5165\u6700\u65B0\u5FEB\u7167\u3002",
        settingsImportSessionsBtn: "\u532F\u5165\u6700\u65B0",
        confirmImportSessions: "\u8981\u532F\u5165\u6700\u65B0\u532F\u51FA\u7684\u5DE5\u4F5C\u968E\u6BB5\u55CE\uFF1F\u76EE\u524D\u5DE5\u4F5C\u968E\u6BB5\u5C07\u88AB\u53D6\u4EE3\u3002",
        settingsResetSettings: "\u91CD\u8A2D\u8A2D\u5B9A",
        settingsResetSettingsDesc: "\u5C07\u76EE\u524D\u8A2D\u5B9A\u7BC4\u570D\u5167\u7684 Workspace++ \u8A2D\u5B9A\u9084\u539F\u70BA\u9810\u8A2D\u503C\u3002",
        settingsResetSettingsBtn: "\u91CD\u8A2D\u8A2D\u5B9A",
        confirmResetSettings: "\u8981\u5C07 Workspace++ \u8A2D\u5B9A\u91CD\u8A2D\u70BA\u9810\u8A2D\u503C\u55CE\uFF1F",
        resetSettingsDone: "Workspace++ \u8A2D\u5B9A\u5DF2\u91CD\u8A2D\u3002",
        resetSettingsFailed: "\u91CD\u8A2D Workspace++ \u8A2D\u5B9A\u5931\u6557\u3002",
        settingsResetSessionsAndSettings: "\u91CD\u8A2D\u5DE5\u4F5C\u968E\u6BB5\u8207\u8A2D\u5B9A",
        settingsResetSessionsAndSettingsDesc: "\u4E00\u6B21\u91CD\u8A2D\u5DF2\u5132\u5B58\u7684\u5DE5\u4F5C\u968E\u6BB5\u8207 Workspace++ \u8A2D\u5B9A\u3002",
        settingsResetSessionsAndSettingsBtn: "\u5168\u90E8\u91CD\u8A2D",
        confirmResetSessionsAndSettings: "\u8981\u540C\u6642\u91CD\u8A2D\u5DE5\u4F5C\u968E\u6BB5\u8207\u8A2D\u5B9A\u55CE\uFF1F\u6B64\u64CD\u4F5C\u7121\u6CD5\u5FA9\u539F\u3002",
        resetSessionsAndSettingsDone: "\u5DE5\u4F5C\u968E\u6BB5\u8207\u8A2D\u5B9A\u5DF2\u91CD\u8A2D\u3002",
        resetSessionsAndSettingsFailed: "\u91CD\u8A2D\u5DE5\u4F5C\u968E\u6BB5\u8207\u8A2D\u5B9A\u5931\u6557\u3002"
      },
      es: {
        confirmOverwriteSessionWithCurrentLayout: function(n) {
          return "\xBFSobrescribir \xAB" + n + "\xBB con el dise\xF1o actual?";
        },
        cmdSaveCurrentLayoutToSession: "Guardar dise\xF1o actual en una sesi\xF3n...",
        savedCurrentLayoutToSession: function(n) {
          return "Dise\xF1o actual guardado en \xAB" + n + "\xBB";
        },
        saveCurrentLayoutToSessionPlaceholder: "Selecciona una sesi\xF3n para sobrescribir...",
        contextSaveCurrentLayoutToThisSession: "Guardar dise\xF1o actual en esta sesi\xF3n",
        cmdExportSessions: "Exportar instant\xE1nea de sesiones",
        cmdImportSessions: "Importar la instant\xE1nea m\xE1s reciente de sesiones",
        cmdReloadCurrentWithoutSaving: "Recargar sesi\xF3n actual (sin guardar)",
        reloadedSession: function(n) {
          return "Sesi\xF3n \xAB" + n + "\xBB recargada";
        },
        defaultSessionName: "predeterminada",
        nameSessionTitle: "Guardar con nombre de sesi\xF3n",
        nameSessionPlaceholder: "Nombre de la sesi\xF3n...",
        saveWithoutNaming: "Guardar sin nombrar",
        sessionDataMigrated: "Workspace++: Los datos de sesi\xF3n se movieron a .workspace-plus-plus/sessions.json.",
        sessionDataMigrationFailed: "Workspace++: No se pudieron migrar los datos de sesi\xF3n. Los datos heredados se conservan.",
        localSettingsEnabled: "Workspace++: Configuraci\xF3n local del vault activada.",
        localSettingsDisabled: "Workspace++: Configuraci\xF3n local del vault desactivada.",
        localSettingsCopied: "Workspace++: Se copiaron los ajustes globales a los ajustes locales del vault.",
        localSettingsLoadFailed: "Workspace++: No se pudieron cargar los ajustes locales del vault. Se usar\xE1n los ajustes globales.",
        localSettingsOperationFailed: "Workspace++: No se pudieron actualizar los ajustes locales del vault.",
        exportSessionsDone: function(path) {
          return "Workspace++: Sesiones exportadas a " + path;
        },
        exportSessionsFailed: "Workspace++: Error al exportar sesiones.",
        importSessionsDone: function(path) {
          return "Workspace++: Sesiones importadas desde " + path;
        },
        importSessionsNoFile: "Workspace++: No se encontr\xF3 ning\xFAn archivo exportado en .workspace-plus-plus/exports.",
        importSessionsFailed: "Workspace++: Error al importar sesiones.",
        settingsSectionAdvanced: "Avanzado",
        settingsSectionReset: "Restablecer",
        settingsGitHubLink: "GitHub",
        settingsSectionSessionListSearch: "Lista y b\xFAsqueda de sesiones",
        settingsSectionSwitchCommands: "Comandos de cambio",
        settingsSectionScrollSwitch: "Cambio con desplazamiento",
        settingsSubsectionSwitchSaving: "Guardado al cambiar de sesi\xF3n",
        settingsSubsectionAutoSaveMode: "Modo de guardado autom\xE1tico de sesiones",
        settingsSubsectionSwitchCommands: "Comandos de cambio de sesi\xF3n",
        settingsSubsectionScrollSwitch: "Cambio de sesi\xF3n con desplazamiento",
        settingsSubsectionSwitchPreview: "Vista previa antes de cambiar de sesi\xF3n",
        settingsStatusBarScrollPreset: "Preajuste de desplazamiento",
        settingsStatusBarScrollPresetDesc: "Elige un preajuste adaptado a tu dispositivo o cambia a Personalizado para ajustar los valores manualmente.",
        settingsStatusBarScrollPresetTrackpad: "Panel t\xE1ctil",
        settingsStatusBarScrollPresetNotchedWheel: "Rueda dentada del rat\xF3n",
        settingsStatusBarScrollPresetFreeSpinWheel: "Rueda libre del rat\xF3n",
        settingsStatusBarScrollPresetCustom: "Personalizado",
        settingsStatusBarScrollModifier: "Modificador requerido",
        settingsStatusBarScrollModifierDesc: "Elige qu\xE9 modificador debe mantenerse pulsado al desplazarte sobre el elemento de la barra de estado.",
        settingsStatusBarScrollModifierRecommended: platformLabel("Cmd u Opci\xF3n", "Ctrl o Alt"),
        settingsStatusBarScrollModifierNone: "Ninguno",
        settingsStatusBarScrollModifierModOnly: platformLabel("Solo Cmd", "Solo Ctrl"),
        settingsStatusBarScrollModifierAltOnly: platformLabel("Solo Opci\xF3n", "Solo Alt"),
        settingsStatusBarScrollModifierModOrAlt: platformLabel("Cmd u Opci\xF3n", "Ctrl o Alt"),
        settingsStatusBarScrollThreshold: "Umbral de sensibilidad",
        settingsStatusBarScrollThresholdDesc: "Cuanto menor sea el valor, m\xE1s f\xE1cil ser\xE1 cambiar. Solo se usa con el preajuste Personalizado.",
        settingsStatusBarScrollCooldown: "Tiempo de espera",
        settingsStatusBarScrollCooldownDesc: "Tiempo m\xEDnimo entre cambios de sesi\xF3n activados por desplazamiento. Solo se usa con el preajuste Personalizado.",
        settingsStatusBarScrollResetWindow: "Ventana de reinicio de acumulaci\xF3n",
        settingsStatusBarScrollResetWindowDesc: "Cu\xE1nto tiempo se siguen combinando peque\xF1os desplazamientos antes de reiniciarlos. Solo se usa con el preajuste Personalizado.",
        settingsStatusBarScrollInvert: "Invertir direcci\xF3n de desplazamiento",
        settingsStatusBarScrollInvertDesc: "Invierte la direcci\xF3n anterior/siguiente al cambiar sesiones con el desplazamiento en la barra de estado.",
        settingsUseLocalSettings: "Usar configuraci\xF3n local del vault",
        settingsUseLocalSettingsDesc: "Activa esto si sincronizas .obsidian entre varios vaults (por ejemplo, con Settings Profiles) y quieres que la configuraci\xF3n de Workspace++ sea diferente por vault.",
        settingsCopyGlobalToLocal: "Copiar ajustes globales a este vault",
        settingsCopyGlobalToLocalDesc: "Sobrescribe los ajustes locales del vault con los ajustes globales actuales.",
        settingsCopyGlobalToLocalBtn: "Copiar",
        settingsResetLocalSettings: "Restablecer ajustes locales del vault",
        settingsResetLocalSettingsDesc: "Restablece los ajustes locales del vault a los ajustes globales.",
        settingsResetLocalSettingsBtn: "Restablecer local",
        settingsAdvancedStorageSubsection: "Comportamiento de almacenamiento",
        settingsAdvancedTransferSubsection: "Transferencia de datos",
        settingsDeveloperSection: "Herramientas para desarrolladores",
        settingsStorageDiagnostics: "Diagn\xF3stico de almacenamiento",
        settingsStorageDiagnosticsDesc: "Detalles de almacenamiento usados actualmente por Workspace++.",
        settingsStorageFieldSessions: "Archivo de sesiones",
        settingsStorageFieldSessionsBackup: "Respaldo de sesiones",
        settingsStorageFieldLocalSettings: "Archivo de ajustes locales",
        settingsStorageFieldGlobalSettings: "Archivo de ajustes globales",
        settingsStorageFieldSessionCount: "Cantidad de sesiones",
        settingsStorageFieldUpdatedAt: "Actualizado el",
        settingsExportSessions: "Exportar sesiones",
        settingsExportSessionsDesc: "Guardar una instant\xE1nea en .workspace-plus-plus/exports.",
        settingsExportSessionsBtn: "Exportar",
        settingsImportSessions: "Importar sesiones",
        settingsImportSessionsDesc: "Importar la instant\xE1nea m\xE1s reciente desde .workspace-plus-plus/exports.",
        settingsImportSessionsBtn: "Importar \xFAltima",
        confirmImportSessions: "\xBFImportar las sesiones exportadas m\xE1s recientes? Las sesiones actuales se reemplazar\xE1n.",
        settingsResetSettings: "Restablecer ajustes",
        settingsResetSettingsDesc: "Restablece los ajustes de Workspace++ al valor predeterminado dentro del alcance de configuraci\xF3n actual.",
        settingsResetSettingsBtn: "Restablecer ajustes",
        confirmResetSettings: "\xBFRestablecer los ajustes de Workspace++ a los valores predeterminados?",
        resetSettingsDone: "Se restablecieron los ajustes de Workspace++.",
        resetSettingsFailed: "No se pudieron restablecer los ajustes de Workspace++.",
        settingsResetSessionsAndSettings: "Restablecer sesiones y ajustes",
        settingsResetSessionsAndSettingsDesc: "Restablece a la vez las sesiones guardadas y los ajustes de Workspace++.",
        settingsResetSessionsAndSettingsBtn: "Restablecer ambos",
        confirmResetSessionsAndSettings: "\xBFRestablecer sesiones y ajustes? Esta acci\xF3n no se puede deshacer.",
        resetSessionsAndSettingsDone: "Se restablecieron las sesiones y los ajustes.",
        resetSessionsAndSettingsFailed: "No se pudieron restablecer las sesiones y los ajustes."
      },
      fr: {
        confirmOverwriteSessionWithCurrentLayout: function(n) {
          return "Remplacer \xAB " + n + " \xBB par la disposition actuelle ?";
        },
        cmdSaveCurrentLayoutToSession: "Enregistrer la disposition actuelle dans une session...",
        savedCurrentLayoutToSession: function(n) {
          return "Disposition actuelle enregistr\xE9e dans \xAB " + n + " \xBB";
        },
        saveCurrentLayoutToSessionPlaceholder: "S\xE9lectionnez une session \xE0 remplacer...",
        contextSaveCurrentLayoutToThisSession: "Enregistrer la disposition actuelle dans cette session",
        cmdExportSessions: "Exporter un instantan\xE9 des sessions",
        cmdImportSessions: "Importer le dernier instantan\xE9 des sessions",
        cmdReloadCurrentWithoutSaving: "Recharger la session en cours (sans enregistrer)",
        reloadedSession: function(n) {
          return "Session \xAB\xA0" + n + "\xA0\xBB recharg\xE9e";
        },
        defaultSessionName: "par d\xE9faut",
        nameSessionTitle: "Enregistrer avec un nom de session",
        nameSessionPlaceholder: "Nom de la session...",
        saveWithoutNaming: "Enregistrer sans nommer",
        sessionDataMigrated: "Workspace++ : les donn\xE9es de session ont \xE9t\xE9 d\xE9plac\xE9es vers .workspace-plus-plus/sessions.json.",
        sessionDataMigrationFailed: "Workspace++ : \xE9chec de la migration des donn\xE9es de session. Les donn\xE9es h\xE9rit\xE9es sont conserv\xE9es.",
        localSettingsEnabled: "Workspace++ : param\xE8tres locaux du coffre activ\xE9s.",
        localSettingsDisabled: "Workspace++ : param\xE8tres locaux du coffre d\xE9sactiv\xE9s.",
        localSettingsCopied: "Workspace++ : param\xE8tres globaux copi\xE9s vers les param\xE8tres locaux du coffre.",
        localSettingsLoadFailed: "Workspace++ : impossible de charger les param\xE8tres locaux du coffre. Les param\xE8tres globaux seront utilis\xE9s.",
        localSettingsOperationFailed: "Workspace++ : impossible de mettre \xE0 jour les param\xE8tres locaux du coffre.",
        exportSessionsDone: function(path) {
          return "Workspace++ : sessions export\xE9es vers " + path;
        },
        exportSessionsFailed: "Workspace++ : \xE9chec de l\u2019export des sessions.",
        importSessionsDone: function(path) {
          return "Workspace++ : sessions import\xE9es depuis " + path;
        },
        importSessionsNoFile: "Workspace++ : aucun fichier export\xE9 trouv\xE9 dans .workspace-plus-plus/exports.",
        importSessionsFailed: "Workspace++ : \xE9chec de l\u2019import des sessions.",
        settingsSectionAdvanced: "Avanc\xE9",
        settingsSectionReset: "R\xE9initialisation",
        settingsGitHubLink: "GitHub",
        settingsSectionSessionListSearch: "Liste et recherche des sessions",
        settingsSectionSwitchCommands: "Commandes de changement",
        settingsSectionScrollSwitch: "Changement par d\xE9filement",
        settingsSubsectionSwitchSaving: "Enregistrement lors du changement de session",
        settingsSubsectionAutoSaveMode: "Mode d\u2019enregistrement automatique des sessions",
        settingsSubsectionSwitchCommands: "Commandes de changement de session",
        settingsSubsectionScrollSwitch: "Changement de session par d\xE9filement",
        settingsSubsectionSwitchPreview: "Aper\xE7u avant le changement de session",
        settingsStatusBarScrollPreset: "Pr\xE9r\xE9glage d\u2019entr\xE9e de d\xE9filement",
        settingsStatusBarScrollPresetDesc: "Choisissez un pr\xE9r\xE9glage adapt\xE9 \xE0 votre appareil, ou passez \xE0 Personnalis\xE9 pour r\xE9gler les valeurs manuellement.",
        settingsStatusBarScrollPresetTrackpad: "Pav\xE9 tactile",
        settingsStatusBarScrollPresetNotchedWheel: "Molette crant\xE9e de la souris",
        settingsStatusBarScrollPresetFreeSpinWheel: "Molette de souris libre",
        settingsStatusBarScrollPresetCustom: "Personnalis\xE9",
        settingsStatusBarScrollModifier: "Touche modificatrice requise",
        settingsStatusBarScrollModifierDesc: "Choisissez la touche modificatrice \xE0 maintenir pendant le d\xE9filement sur l\u2019\xE9l\xE9ment de la barre d\u2019\xE9tat.",
        settingsStatusBarScrollModifierRecommended: platformLabel("Cmd ou Option", "Ctrl ou Alt"),
        settingsStatusBarScrollModifierNone: "Aucune",
        settingsStatusBarScrollModifierModOnly: platformLabel("Cmd uniquement", "Ctrl uniquement"),
        settingsStatusBarScrollModifierAltOnly: platformLabel("Option uniquement", "Alt uniquement"),
        settingsStatusBarScrollModifierModOrAlt: platformLabel("Cmd ou Option", "Ctrl ou Alt"),
        settingsStatusBarScrollThreshold: "Seuil de sensibilit\xE9",
        settingsStatusBarScrollThresholdDesc: "Plus la valeur est basse, plus le basculement est facile. Utilis\xE9 uniquement avec le pr\xE9r\xE9glage Personnalis\xE9.",
        settingsStatusBarScrollCooldown: "D\xE9lai d\u2019attente",
        settingsStatusBarScrollCooldownDesc: "Temps minimal entre deux changements de session d\xE9clench\xE9s par le d\xE9filement. Utilis\xE9 uniquement avec le pr\xE9r\xE9glage Personnalis\xE9.",
        settingsStatusBarScrollResetWindow: "Fen\xEAtre de r\xE9initialisation de l\u2019accumulation",
        settingsStatusBarScrollResetWindowDesc: "Dur\xE9e pendant laquelle les petits deltas de d\xE9filement restent cumul\xE9s avant r\xE9initialisation. Utilis\xE9 uniquement avec le pr\xE9r\xE9glage Personnalis\xE9.",
        settingsStatusBarScrollInvert: "Inverser le sens du d\xE9filement",
        settingsStatusBarScrollInvertDesc: "Inverse le sens pr\xE9c\xE9dent/suivant pour le changement de session par d\xE9filement dans la barre d\u2019\xE9tat.",
        settingsUseLocalSettings: "Utiliser des param\xE8tres locaux du coffre",
        settingsUseLocalSettingsDesc: "Activez cette option si vous synchronisez .obsidian entre plusieurs coffres (par exemple avec Settings Profiles) et souhaitez des r\xE9glages Workspace++ diff\xE9rents par coffre.",
        settingsCopyGlobalToLocal: "Copier les param\xE8tres globaux vers ce coffre",
        settingsCopyGlobalToLocalDesc: "\xC9crase les param\xE8tres locaux du coffre avec les param\xE8tres globaux actuels.",
        settingsCopyGlobalToLocalBtn: "Copier",
        settingsResetLocalSettings: "R\xE9initialiser les param\xE8tres locaux du coffre",
        settingsResetLocalSettingsDesc: "R\xE9initialise les param\xE8tres locaux du coffre vers les param\xE8tres globaux.",
        settingsResetLocalSettingsBtn: "R\xE9initialiser local",
        settingsAdvancedStorageSubsection: "Comportement du stockage",
        settingsAdvancedTransferSubsection: "Transfert des donn\xE9es",
        settingsDeveloperSection: "Outils d\xE9veloppeur",
        settingsStorageDiagnostics: "Diagnostic du stockage",
        settingsStorageDiagnosticsDesc: "Informations de stockage actuellement utilis\xE9es par Workspace++.",
        settingsStorageFieldSessions: "Fichier des sessions",
        settingsStorageFieldSessionsBackup: "Sauvegarde des sessions",
        settingsStorageFieldLocalSettings: "Fichier des param\xE8tres locaux",
        settingsStorageFieldGlobalSettings: "Fichier des param\xE8tres globaux",
        settingsStorageFieldSessionCount: "Nombre de sessions",
        settingsStorageFieldUpdatedAt: "Mis \xE0 jour le",
        settingsExportSessions: "Exporter les sessions",
        settingsExportSessionsDesc: "Enregistre un instantan\xE9 dans .workspace-plus-plus/exports.",
        settingsExportSessionsBtn: "Exporter",
        settingsImportSessions: "Importer les sessions",
        settingsImportSessionsDesc: "Importe le dernier instantan\xE9 depuis .workspace-plus-plus/exports.",
        settingsImportSessionsBtn: "Importer le dernier",
        confirmImportSessions: "Importer les derni\xE8res sessions export\xE9es ? Les sessions actuelles seront remplac\xE9es.",
        settingsResetSettings: "R\xE9initialiser les param\xE8tres",
        settingsResetSettingsDesc: "R\xE9initialise les param\xE8tres Workspace++ par d\xE9faut dans la port\xE9e actuelle.",
        settingsResetSettingsBtn: "R\xE9initialiser les param\xE8tres",
        confirmResetSettings: "R\xE9initialiser les param\xE8tres Workspace++ par d\xE9faut ?",
        resetSettingsDone: "Les param\xE8tres Workspace++ ont \xE9t\xE9 r\xE9initialis\xE9s.",
        resetSettingsFailed: "\xC9chec de la r\xE9initialisation des param\xE8tres Workspace++.",
        settingsResetSessionsAndSettings: "R\xE9initialiser sessions et param\xE8tres",
        settingsResetSessionsAndSettingsDesc: "R\xE9initialise \xE0 la fois les sessions enregistr\xE9es et les param\xE8tres Workspace++.",
        settingsResetSessionsAndSettingsBtn: "R\xE9initialiser les deux",
        confirmResetSessionsAndSettings: "R\xE9initialiser les sessions et les param\xE8tres ? Cette action est irr\xE9versible.",
        resetSessionsAndSettingsDone: "Les sessions et les param\xE8tres ont \xE9t\xE9 r\xE9initialis\xE9s.",
        resetSessionsAndSettingsFailed: "\xC9chec de la r\xE9initialisation des sessions et des param\xE8tres."
      },
      ar: {
        confirmOverwriteSessionWithCurrentLayout: function(n) {
          return '\u0627\u0644\u0643\u062A\u0627\u0628\u0629 \u0641\u0648\u0642 "' + n + '" \u0628\u0627\u0644\u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u062D\u0627\u0644\u064A\u061F';
        },
        cmdSaveCurrentLayoutToSession: "\u062D\u0641\u0638 \u0627\u0644\u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u062D\u0627\u0644\u064A \u0641\u064A \u062C\u0644\u0633\u0629...",
        savedCurrentLayoutToSession: function(n) {
          return '\u062A\u0645 \u062D\u0641\u0638 \u0627\u0644\u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u062D\u0627\u0644\u064A \u0641\u064A "' + n + '"';
        },
        saveCurrentLayoutToSessionPlaceholder: "\u0627\u062E\u062A\u0631 \u062C\u0644\u0633\u0629 \u0644\u0644\u0643\u062A\u0627\u0628\u0629 \u0641\u0648\u0642\u0647\u0627...",
        contextSaveCurrentLayoutToThisSession: "\u062D\u0641\u0638 \u0627\u0644\u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u062D\u0627\u0644\u064A \u0641\u064A \u0647\u0630\u0647 \u0627\u0644\u062C\u0644\u0633\u0629",
        cmdExportSessions: "\u062A\u0635\u062F\u064A\u0631 \u0644\u0642\u0637\u0629 \u0627\u0644\u062C\u0644\u0633\u0627\u062A",
        cmdImportSessions: "\u0627\u0633\u062A\u064A\u0631\u0627\u062F \u0623\u062D\u062F\u062B \u0644\u0642\u0637\u0629 \u0644\u0644\u062C\u0644\u0633\u0627\u062A",
        cmdReloadCurrentWithoutSaving: "\u0625\u0639\u0627\u062F\u0629 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u062C\u0644\u0633\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629 (\u0628\u062F\u0648\u0646 \u062D\u0641\u0638)",
        reloadedSession: function(n) {
          return "\u062A\u0645\u062A \u0625\u0639\u0627\u062F\u0629 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u062C\u0644\u0633\u0629 \u201C" + n + "\u201D";
        },
        defaultSessionName: "\u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629",
        nameSessionTitle: "\u062D\u0641\u0638 \u0628\u0627\u0633\u0645 \u0627\u0644\u062C\u0644\u0633\u0629",
        nameSessionPlaceholder: "\u0627\u0633\u0645 \u0627\u0644\u062C\u0644\u0633\u0629...",
        saveWithoutNaming: "\u062D\u0641\u0638 \u0628\u062F\u0648\u0646 \u062A\u0633\u0645\u064A\u0629",
        sessionDataMigrated: "Workspace++: \u062A\u0645 \u0646\u0642\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0625\u0644\u0649 .workspace-plus-plus/sessions.json.",
        sessionDataMigrationFailed: "Workspace++: \u0641\u0634\u0644 \u0646\u0642\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062C\u0644\u0633\u0627\u062A. \u062A\u0645 \u0627\u0644\u0627\u062D\u062A\u0641\u0627\u0638 \u0628\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0642\u062F\u064A\u0645\u0629.",
        localSettingsEnabled: "Workspace++: \u062A\u0645 \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u062D\u0644\u064A\u0629 \u0644\u0644\u0645\u062E\u0632\u0646.",
        localSettingsDisabled: "Workspace++: \u062A\u0645 \u062A\u0639\u0637\u064A\u0644 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u062D\u0644\u064A\u0629 \u0644\u0644\u0645\u062E\u0632\u0646.",
        localSettingsCopied: "Workspace++: \u062A\u0645 \u0646\u0633\u062E \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0639\u0627\u0645\u0629 \u0625\u0644\u0649 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u062D\u0644\u064A\u0629 \u0644\u0644\u0645\u062E\u0632\u0646.",
        localSettingsLoadFailed: "Workspace++: \u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u062D\u0644\u064A\u0629 \u0644\u0644\u0645\u062E\u0632\u0646. \u0633\u064A\u062A\u0645 \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0639\u0627\u0645\u0629.",
        localSettingsOperationFailed: "Workspace++: \u0641\u0634\u0644 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u062D\u0644\u064A\u0629 \u0644\u0644\u0645\u062E\u0632\u0646.",
        exportSessionsDone: function(path) {
          return "Workspace++: \u062A\u0645 \u062A\u0635\u062F\u064A\u0631 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0625\u0644\u0649 " + path;
        },
        exportSessionsFailed: "Workspace++: \u0641\u0634\u0644 \u062A\u0635\u062F\u064A\u0631 \u0627\u0644\u062C\u0644\u0633\u0627\u062A.",
        importSessionsDone: function(path) {
          return "Workspace++: \u062A\u0645 \u0627\u0633\u062A\u064A\u0631\u0627\u062F \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0645\u0646 " + path;
        },
        importSessionsNoFile: "Workspace++: \u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0645\u0644\u0641 \u062A\u0635\u062F\u064A\u0631 \u0641\u064A .workspace-plus-plus/exports.",
        importSessionsFailed: "Workspace++: \u0641\u0634\u0644 \u0627\u0633\u062A\u064A\u0631\u0627\u062F \u0627\u0644\u062C\u0644\u0633\u0627\u062A.",
        settingsSectionAdvanced: "\u0645\u062A\u0642\u062F\u0645",
        settingsSectionReset: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646",
        settingsGitHubLink: "GitHub",
        settingsSectionSessionListSearch: "\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0648\u0627\u0644\u0628\u062D\u062B",
        settingsSectionSwitchCommands: "\u0623\u0648\u0627\u0645\u0631 \u0627\u0644\u062A\u0628\u062F\u064A\u0644",
        settingsSectionScrollSwitch: "\u0627\u0644\u062A\u0628\u062F\u064A\u0644 \u0628\u0627\u0644\u062A\u0645\u0631\u064A\u0631",
        settingsSubsectionSwitchSaving: "\u0627\u0644\u062D\u0641\u0638 \u0639\u0646\u062F \u062A\u0628\u062F\u064A\u0644 \u0627\u0644\u062C\u0644\u0633\u0627\u062A",
        settingsSubsectionAutoSaveMode: "\u0648\u0636\u0639 \u0627\u0644\u062D\u0641\u0638 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A \u0644\u0644\u062C\u0644\u0633\u0627\u062A",
        settingsSubsectionSwitchCommands: "\u0623\u0648\u0627\u0645\u0631 \u062A\u0628\u062F\u064A\u0644 \u0627\u0644\u062C\u0644\u0633\u0627\u062A",
        settingsSubsectionScrollSwitch: "\u062A\u0628\u062F\u064A\u0644 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0639\u0628\u0631 \u0627\u0644\u062A\u0645\u0631\u064A\u0631",
        settingsSubsectionSwitchPreview: "\u0645\u0639\u0627\u064A\u0646\u0629 \u0642\u0628\u0644 \u062A\u0628\u062F\u064A\u0644 \u0627\u0644\u062C\u0644\u0633\u0627\u062A",
        settingsStatusBarScrollPreset: "\u0625\u0639\u062F\u0627\u062F \u0645\u0633\u0628\u0642 \u0644\u0625\u062F\u062E\u0627\u0644 \u0627\u0644\u062A\u0645\u0631\u064A\u0631",
        settingsStatusBarScrollPresetDesc: '\u0627\u062E\u062A\u0631 \u0625\u0639\u062F\u0627\u062F\u064B\u0627 \u0645\u0633\u0628\u0642\u064B\u0627 \u0645\u0646\u0627\u0633\u0628\u064B\u0627 \u0644\u062C\u0647\u0627\u0632\u0643\u060C \u0623\u0648 \u0627\u0646\u062A\u0642\u0644 \u0625\u0644\u0649 "\u0645\u062E\u0635\u0635" \u0644\u0636\u0628\u0637 \u0627\u0644\u0642\u064A\u0645 \u0628\u0646\u0641\u0633\u0643.',
        settingsStatusBarScrollPresetTrackpad: "\u0644\u0648\u062D\u0629 \u0627\u0644\u0644\u0645\u0633",
        settingsStatusBarScrollPresetNotchedWheel: "\u0639\u062C\u0644\u0629 \u0641\u0623\u0631\u0629 \u0645\u0633\u0646\u0646\u0629",
        settingsStatusBarScrollPresetFreeSpinWheel: "\u0639\u062C\u0644\u0629 \u0641\u0623\u0631\u0629 \u062D\u0631\u0629 \u0627\u0644\u062F\u0648\u0631\u0627\u0646",
        settingsStatusBarScrollPresetCustom: "\u0645\u062E\u0635\u0635",
        settingsStatusBarScrollModifier: "\u0645\u0641\u062A\u0627\u062D \u0627\u0644\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0645\u0637\u0644\u0648\u0628",
        settingsStatusBarScrollModifierDesc: "\u0627\u062E\u062A\u0631 \u0645\u0641\u062A\u0627\u062D \u0627\u0644\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0630\u064A \u064A\u062C\u0628 \u0627\u0644\u0636\u063A\u0637 \u0639\u0644\u064A\u0647 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u062A\u0645\u0631\u064A\u0631 \u0641\u0648\u0642 \u0639\u0646\u0635\u0631 \u0634\u0631\u064A\u0637 \u0627\u0644\u062D\u0627\u0644\u0629.",
        settingsStatusBarScrollModifierRecommended: platformLabel("Cmd \u0623\u0648 Option", "Ctrl \u0623\u0648 Alt"),
        settingsStatusBarScrollModifierNone: "\u0628\u062F\u0648\u0646",
        settingsStatusBarScrollModifierModOnly: platformLabel("Cmd \u0641\u0642\u0637", "Ctrl \u0641\u0642\u0637"),
        settingsStatusBarScrollModifierAltOnly: platformLabel("Option \u0641\u0642\u0637", "Alt \u0641\u0642\u0637"),
        settingsStatusBarScrollModifierModOrAlt: platformLabel("Cmd \u0623\u0648 Option", "Ctrl \u0623\u0648 Alt"),
        settingsStatusBarScrollThreshold: "\u0639\u062A\u0628\u0629 \u0627\u0644\u062D\u0633\u0627\u0633\u064A\u0629",
        settingsStatusBarScrollThresholdDesc: '\u0643\u0644\u0645\u0627 \u0643\u0627\u0646\u062A \u0627\u0644\u0642\u064A\u0645\u0629 \u0623\u0642\u0644 \u0623\u0635\u0628\u062D \u0627\u0644\u062A\u0628\u062F\u064A\u0644 \u0623\u0633\u0647\u0644. \u064A\u064F\u0633\u062A\u062E\u062F\u0645 \u0641\u0642\u0637 \u0639\u0646\u062F \u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0645\u0633\u0628\u0642 "\u0645\u062E\u0635\u0635".',
        settingsStatusBarScrollCooldown: "\u0641\u062A\u0631\u0629 \u0627\u0644\u062A\u0647\u062F\u0626\u0629",
        settingsStatusBarScrollCooldownDesc: '\u0627\u0644\u062D\u062F \u0627\u0644\u0623\u062F\u0646\u0649 \u0644\u0644\u0648\u0642\u062A \u0628\u064A\u0646 \u0639\u0645\u0644\u064A\u062A\u064A \u062A\u0628\u062F\u064A\u0644 \u062C\u0644\u0633\u0627\u062A \u064A\u062A\u0645 \u062A\u0634\u063A\u064A\u0644\u0647\u0645\u0627 \u0628\u0627\u0644\u062A\u0645\u0631\u064A\u0631. \u064A\u064F\u0633\u062A\u062E\u062F\u0645 \u0641\u0642\u0637 \u0639\u0646\u062F \u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0645\u0633\u0628\u0642 "\u0645\u062E\u0635\u0635".',
        settingsStatusBarScrollResetWindow: "\u0646\u0627\u0641\u0630\u0629 \u0625\u0639\u0627\u062F\u0629 \u0636\u0628\u0637 \u0627\u0644\u062A\u0631\u0627\u0643\u0645",
        settingsStatusBarScrollResetWindowDesc: '\u0627\u0644\u0645\u062F\u0629 \u0627\u0644\u062A\u064A \u062A\u0633\u062A\u0645\u0631 \u0641\u064A\u0647\u0627 \u0642\u064A\u0645 \u0627\u0644\u062A\u0645\u0631\u064A\u0631 \u0627\u0644\u0635\u063A\u064A\u0631\u0629 \u0641\u064A \u0627\u0644\u062A\u0631\u0627\u0643\u0645 \u0642\u0628\u0644 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0636\u0628\u0637. \u064A\u064F\u0633\u062A\u062E\u062F\u0645 \u0641\u0642\u0637 \u0639\u0646\u062F \u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0645\u0633\u0628\u0642 "\u0645\u062E\u0635\u0635".',
        settingsStatusBarScrollInvert: "\u0639\u0643\u0633 \u0627\u062A\u062C\u0627\u0647 \u0627\u0644\u062A\u0645\u0631\u064A\u0631",
        settingsStatusBarScrollInvertDesc: "\u064A\u0639\u0643\u0633 \u0627\u062A\u062C\u0627\u0647 \u0627\u0644\u0633\u0627\u0628\u0642/\u0627\u0644\u062A\u0627\u0644\u064A \u0639\u0646\u062F \u062A\u0628\u062F\u064A\u0644 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0628\u0627\u0644\u062A\u0645\u0631\u064A\u0631 \u0641\u064A \u0634\u0631\u064A\u0637 \u0627\u0644\u062D\u0627\u0644\u0629.",
        settingsUseLocalSettings: "\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0645\u062D\u0644\u064A\u0629 \u0644\u0644\u0645\u062E\u0632\u0646",
        settingsUseLocalSettingsDesc: "\u0641\u0639\u0651\u0644 \u0647\u0630\u0627 \u0625\u0630\u0627 \u0643\u0646\u062A \u062A\u0632\u0627\u0645\u0646 .obsidian \u0628\u064A\u0646 \u0639\u062F\u0629 \u0645\u062E\u0627\u0632\u0646 (\u0645\u062B\u0644 Settings Profiles) \u0648\u062A\u0631\u064A\u062F \u0623\u0646 \u062A\u0628\u0642\u0649 \u0625\u0639\u062F\u0627\u062F\u0627\u062A Workspace++ \u0645\u062E\u062A\u0644\u0641\u0629 \u0644\u0643\u0644 \u0645\u062E\u0632\u0646.",
        settingsCopyGlobalToLocal: "\u0646\u0633\u062E \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0639\u0627\u0645\u0629 \u0625\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u0645\u062E\u0632\u0646",
        settingsCopyGlobalToLocalDesc: "\u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u062D\u0644\u064A\u0629 \u0644\u0644\u0645\u062E\u0632\u0646 \u0628\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0639\u0627\u0645\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629.",
        settingsCopyGlobalToLocalBtn: "\u0646\u0633\u062E",
        settingsResetLocalSettings: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u062D\u0644\u064A\u0629 \u0644\u0644\u0645\u062E\u0632\u0646",
        settingsResetLocalSettingsDesc: "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u062D\u0644\u064A\u0629 \u0644\u0644\u0645\u062E\u0632\u0646 \u0625\u0644\u0649 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0639\u0627\u0645\u0629.",
        settingsResetLocalSettingsBtn: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0627\u0644\u0645\u062D\u0644\u064A",
        settingsAdvancedStorageSubsection: "\u0633\u0644\u0648\u0643 \u0627\u0644\u062A\u062E\u0632\u064A\u0646",
        settingsAdvancedTransferSubsection: "\u0646\u0642\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A",
        settingsDeveloperSection: "\u0623\u062F\u0648\u0627\u062A \u0627\u0644\u0645\u0637\u0648\u0631",
        settingsStorageDiagnostics: "\u062A\u0634\u062E\u064A\u0635 \u0627\u0644\u062A\u062E\u0632\u064A\u0646",
        settingsStorageDiagnosticsDesc: "\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u062A\u062E\u0632\u064A\u0646 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u0629 \u062D\u0627\u0644\u064A\u0627\u064B \u0628\u0648\u0627\u0633\u0637\u0629 Workspace++.",
        settingsStorageFieldSessions: "\u0645\u0644\u0641 \u0627\u0644\u062C\u0644\u0633\u0627\u062A",
        settingsStorageFieldSessionsBackup: "\u0646\u0633\u062E\u0629 \u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629 \u0644\u0644\u062C\u0644\u0633\u0627\u062A",
        settingsStorageFieldLocalSettings: "\u0645\u0644\u0641 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u062D\u0644\u064A\u0629",
        settingsStorageFieldGlobalSettings: "\u0645\u0644\u0641 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0639\u0627\u0645\u0629",
        settingsStorageFieldSessionCount: "\u0639\u062F\u062F \u0627\u0644\u062C\u0644\u0633\u0627\u062A",
        settingsStorageFieldUpdatedAt: "\u0622\u062E\u0631 \u062A\u062D\u062F\u064A\u062B",
        settingsExportSessions: "\u062A\u0635\u062F\u064A\u0631 \u0627\u0644\u062C\u0644\u0633\u0627\u062A",
        settingsExportSessionsDesc: "\u062D\u0641\u0638 \u0644\u0642\u0637\u0629 \u0641\u064A .workspace-plus-plus/exports.",
        settingsExportSessionsBtn: "\u062A\u0635\u062F\u064A\u0631",
        settingsImportSessions: "\u0627\u0633\u062A\u064A\u0631\u0627\u062F \u0627\u0644\u062C\u0644\u0633\u0627\u062A",
        settingsImportSessionsDesc: "\u0627\u0633\u062A\u064A\u0631\u0627\u062F \u0623\u062D\u062F\u062B \u0644\u0642\u0637\u0629 \u0645\u0646 .workspace-plus-plus/exports.",
        settingsImportSessionsBtn: "\u0627\u0633\u062A\u064A\u0631\u0627\u062F \u0627\u0644\u0623\u062D\u062F\u062B",
        confirmImportSessions: "\u0627\u0633\u062A\u064A\u0631\u0627\u062F \u0623\u062D\u062F\u062B \u062C\u0644\u0633\u0627\u062A \u062A\u0645 \u062A\u0635\u062F\u064A\u0631\u0647\u0627\u061F \u0633\u064A\u062A\u0645 \u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0627\u0644\u062D\u0627\u0644\u064A\u0629.",
        settingsResetSettings: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",
        settingsResetSettingsDesc: "\u0625\u0639\u0627\u062F\u0629 \u0625\u0639\u062F\u0627\u062F\u0627\u062A Workspace++ \u0625\u0644\u0649 \u0627\u0644\u0642\u064A\u0645 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629 \u0636\u0645\u0646 \u0646\u0637\u0627\u0642 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u062D\u0627\u0644\u064A.",
        settingsResetSettingsBtn: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",
        confirmResetSettings: "\u0625\u0639\u0627\u062F\u0629 \u0625\u0639\u062F\u0627\u062F\u0627\u062A Workspace++ \u0625\u0644\u0649 \u0627\u0644\u0642\u064A\u0645 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629\u061F",
        resetSettingsDone: "\u062A\u0645\u062A \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0625\u0639\u062F\u0627\u062F\u0627\u062A Workspace++.",
        resetSettingsFailed: "\u0641\u0634\u0644\u062A \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0625\u0639\u062F\u0627\u062F\u0627\u062A Workspace++.",
        settingsResetSessionsAndSettings: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0648\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",
        settingsResetSessionsAndSettingsDesc: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644 \u0645\u0646 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0627\u0644\u0645\u062D\u0641\u0648\u0638\u0629 \u0648\u0625\u0639\u062F\u0627\u062F\u0627\u062A Workspace++ \u0645\u0639\u0627\u064B.",
        settingsResetSessionsAndSettingsBtn: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0627\u0644\u0643\u0644",
        confirmResetSessionsAndSettings: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0648\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0645\u0639\u0627\u064B\u061F \u0644\u0627 \u064A\u0645\u0643\u0646 \u0627\u0644\u062A\u0631\u0627\u062C\u0639 \u0639\u0646 \u0647\u0630\u0627 \u0627\u0644\u0625\u062C\u0631\u0627\u0621.",
        resetSessionsAndSettingsDone: "\u062A\u0645\u062A \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0648\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A.",
        resetSessionsAndSettingsFailed: "\u0641\u0634\u0644\u062A \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0648\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A."
      },
      pt: {
        confirmOverwriteSessionWithCurrentLayout: function(n) {
          return 'Sobrescrever "' + n + '" com o layout atual?';
        },
        cmdSaveCurrentLayoutToSession: "Salvar layout atual em uma sess\xE3o...",
        savedCurrentLayoutToSession: function(n) {
          return 'Layout atual salvo em "' + n + '"';
        },
        saveCurrentLayoutToSessionPlaceholder: "Selecione uma sess\xE3o para sobrescrever...",
        contextSaveCurrentLayoutToThisSession: "Salvar layout atual nesta sess\xE3o",
        cmdExportSessions: "Exportar snapshot de sess\xF5es",
        cmdImportSessions: "Importar snapshot mais recente de sess\xF5es",
        cmdReloadCurrentWithoutSaving: "Recarregar sess\xE3o atual (sem salvar)",
        reloadedSession: function(n) {
          return "Sess\xE3o \u201C" + n + "\u201D recarregada";
        },
        defaultSessionName: "padr\xE3o",
        nameSessionTitle: "Salvar com nome da sess\xE3o",
        nameSessionPlaceholder: "Nome da sess\xE3o...",
        saveWithoutNaming: "Salvar sem nomear",
        sessionDataMigrated: "Workspace++: Os dados de sess\xE3o foram movidos para .workspace-plus-plus/sessions.json.",
        sessionDataMigrationFailed: "Workspace++: Falha ao migrar dados de sess\xE3o. Os dados legados foram mantidos.",
        localSettingsEnabled: "Workspace++: Configura\xE7\xF5es locais do vault ativadas.",
        localSettingsDisabled: "Workspace++: Configura\xE7\xF5es locais do vault desativadas.",
        localSettingsCopied: "Workspace++: Configura\xE7\xF5es globais copiadas para as configura\xE7\xF5es locais do vault.",
        localSettingsLoadFailed: "Workspace++: Falha ao carregar configura\xE7\xF5es locais do vault. Ser\xE3o usadas as configura\xE7\xF5es globais.",
        localSettingsOperationFailed: "Workspace++: Falha ao atualizar configura\xE7\xF5es locais do vault.",
        exportSessionsDone: function(path) {
          return "Workspace++: Sess\xF5es exportadas para " + path;
        },
        exportSessionsFailed: "Workspace++: Falha ao exportar sess\xF5es.",
        importSessionsDone: function(path) {
          return "Workspace++: Sess\xF5es importadas de " + path;
        },
        importSessionsNoFile: "Workspace++: Nenhum arquivo exportado encontrado em .workspace-plus-plus/exports.",
        importSessionsFailed: "Workspace++: Falha ao importar sess\xF5es.",
        settingsSectionAdvanced: "Avan\xE7ado",
        settingsSectionReset: "Redefinir",
        settingsGitHubLink: "GitHub",
        settingsSectionSessionListSearch: "Lista e pesquisa de sess\xF5es",
        settingsSectionSwitchCommands: "Comandos de altern\xE2ncia",
        settingsSectionScrollSwitch: "Altern\xE2ncia por rolagem",
        settingsSubsectionSwitchSaving: "Salvar ao alternar sess\xF5es",
        settingsSubsectionAutoSaveMode: "Modo de salvamento autom\xE1tico de sess\xF5es",
        settingsSubsectionSwitchCommands: "Comandos de altern\xE2ncia de sess\xF5es",
        settingsSubsectionScrollSwitch: "Troca de sess\xF5es com rolagem",
        settingsSubsectionSwitchPreview: "Pr\xE9-visualiza\xE7\xE3o antes de alternar sess\xF5es",
        settingsStatusBarScrollPreset: "Predefini\xE7\xE3o de entrada de rolagem",
        settingsStatusBarScrollPresetDesc: "Escolha uma predefini\xE7\xE3o ajustada ao seu dispositivo ou mude para Personalizado para ajustar os valores manualmente.",
        settingsStatusBarScrollPresetTrackpad: "Touchpad",
        settingsStatusBarScrollPresetNotchedWheel: "Roda do mouse com entalhes",
        settingsStatusBarScrollPresetFreeSpinWheel: "Roda do mouse de giro livre",
        settingsStatusBarScrollPresetCustom: "Personalizado",
        settingsStatusBarScrollModifier: "Modificador obrigat\xF3rio",
        settingsStatusBarScrollModifierDesc: "Escolha qual modificador deve ser mantido pressionado ao rolar sobre o item da barra de status.",
        settingsStatusBarScrollModifierRecommended: platformLabel("Cmd ou Option", "Ctrl ou Alt"),
        settingsStatusBarScrollModifierNone: "Nenhum",
        settingsStatusBarScrollModifierModOnly: platformLabel("Somente Cmd", "Somente Ctrl"),
        settingsStatusBarScrollModifierAltOnly: platformLabel("Somente Option", "Somente Alt"),
        settingsStatusBarScrollModifierModOrAlt: platformLabel("Cmd ou Option", "Ctrl ou Alt"),
        settingsStatusBarScrollThreshold: "Limite de sensibilidade",
        settingsStatusBarScrollThresholdDesc: "Valores menores facilitam a troca. Usado apenas quando a predefini\xE7\xE3o \xE9 Personalizado.",
        settingsStatusBarScrollCooldown: "Intervalo de espera",
        settingsStatusBarScrollCooldownDesc: "Tempo m\xEDnimo entre trocas de sess\xE3o acionadas por rolagem. Usado apenas quando a predefini\xE7\xE3o \xE9 Personalizado.",
        settingsStatusBarScrollResetWindow: "Janela de redefini\xE7\xE3o do ac\xFAmulo",
        settingsStatusBarScrollResetWindowDesc: "Por quanto tempo pequenos deltas de rolagem continuam sendo acumulados antes de redefinir. Usado apenas quando a predefini\xE7\xE3o \xE9 Personalizado.",
        settingsStatusBarScrollInvert: "Inverter dire\xE7\xE3o da rolagem",
        settingsStatusBarScrollInvertDesc: "Inverte a dire\xE7\xE3o anterior/pr\xF3xima ao trocar sess\xF5es pela rolagem na barra de status.",
        settingsUseLocalSettings: "Usar configura\xE7\xF5es locais do vault",
        settingsUseLocalSettingsDesc: "Ative isto se voc\xEA sincroniza .obsidian entre v\xE1rios vaults (por exemplo, com Settings Profiles) e deseja manter as configura\xE7\xF5es do Workspace++ diferentes por vault.",
        settingsCopyGlobalToLocal: "Copiar configura\xE7\xF5es globais para este vault",
        settingsCopyGlobalToLocalDesc: "Substitui as configura\xE7\xF5es locais do vault pelas configura\xE7\xF5es globais atuais.",
        settingsCopyGlobalToLocalBtn: "Copiar",
        settingsResetLocalSettings: "Redefinir configura\xE7\xF5es locais do vault",
        settingsResetLocalSettingsDesc: "Redefine as configura\xE7\xF5es locais do vault para as configura\xE7\xF5es globais.",
        settingsResetLocalSettingsBtn: "Redefinir local",
        settingsAdvancedStorageSubsection: "Comportamento de armazenamento",
        settingsAdvancedTransferSubsection: "Transfer\xEAncia de dados",
        settingsDeveloperSection: "Ferramentas de desenvolvedor",
        settingsStorageDiagnostics: "Diagn\xF3stico de armazenamento",
        settingsStorageDiagnosticsDesc: "Detalhes de armazenamento usados atualmente pelo Workspace++.",
        settingsStorageFieldSessions: "Arquivo de sess\xF5es",
        settingsStorageFieldSessionsBackup: "Backup de sess\xF5es",
        settingsStorageFieldLocalSettings: "Arquivo de configura\xE7\xF5es locais",
        settingsStorageFieldGlobalSettings: "Arquivo de configura\xE7\xF5es globais",
        settingsStorageFieldSessionCount: "Quantidade de sess\xF5es",
        settingsStorageFieldUpdatedAt: "Atualizado em",
        settingsExportSessions: "Exportar sess\xF5es",
        settingsExportSessionsDesc: "Salvar um snapshot em .workspace-plus-plus/exports.",
        settingsExportSessionsBtn: "Exportar",
        settingsImportSessions: "Importar sess\xF5es",
        settingsImportSessionsDesc: "Importar o snapshot mais recente de .workspace-plus-plus/exports.",
        settingsImportSessionsBtn: "Importar mais recente",
        confirmImportSessions: "Importar as sess\xF5es exportadas mais recentes? As sess\xF5es atuais ser\xE3o substitu\xEDdas.",
        settingsResetSettings: "Redefinir configura\xE7\xF5es",
        settingsResetSettingsDesc: "Redefine as configura\xE7\xF5es do Workspace++ para o padr\xE3o no escopo de configura\xE7\xE3o atual.",
        settingsResetSettingsBtn: "Redefinir configura\xE7\xF5es",
        confirmResetSettings: "Redefinir configura\xE7\xF5es do Workspace++ para o padr\xE3o?",
        resetSettingsDone: "As configura\xE7\xF5es do Workspace++ foram redefinidas.",
        resetSettingsFailed: "Falha ao redefinir as configura\xE7\xF5es do Workspace++.",
        settingsResetSessionsAndSettings: "Redefinir sess\xF5es e configura\xE7\xF5es",
        settingsResetSessionsAndSettingsDesc: "Redefine sess\xF5es salvas e configura\xE7\xF5es do Workspace++ de uma vez.",
        settingsResetSessionsAndSettingsBtn: "Redefinir ambos",
        confirmResetSessionsAndSettings: "Redefinir sess\xF5es e configura\xE7\xF5es? Esta a\xE7\xE3o n\xE3o pode ser desfeita.",
        resetSessionsAndSettingsDone: "Sess\xF5es e configura\xE7\xF5es foram redefinidas.",
        resetSessionsAndSettingsFailed: "Falha ao redefinir sess\xF5es e configura\xE7\xF5es."
      },
      ru: {
        confirmOverwriteSessionWithCurrentLayout: function(n) {
          return "\u041F\u0435\u0440\u0435\u0437\u0430\u043F\u0438\u0441\u0430\u0442\u044C \xAB" + n + "\xBB \u0442\u0435\u043A\u0443\u0449\u0438\u043C \u043C\u0430\u043A\u0435\u0442\u043E\u043C?";
        },
        cmdSaveCurrentLayoutToSession: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0442\u0435\u043A\u0443\u0449\u0438\u0439 \u043C\u0430\u043A\u0435\u0442 \u0432 \u0441\u0435\u0441\u0441\u0438\u044E...",
        savedCurrentLayoutToSession: function(n) {
          return "\u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u043C\u0430\u043A\u0435\u0442 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D \u0432 \xAB" + n + "\xBB";
        },
        saveCurrentLayoutToSessionPlaceholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0435\u0441\u0441\u0438\u044E \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u0437\u0430\u043F\u0438\u0441\u0438...",
        contextSaveCurrentLayoutToThisSession: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0442\u0435\u043A\u0443\u0449\u0438\u0439 \u043C\u0430\u043A\u0435\u0442 \u0432 \u044D\u0442\u0443 \u0441\u0435\u0441\u0441\u0438\u044E",
        cmdExportSessions: "\u042D\u043A\u0441\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0441\u043D\u0438\u043C\u043E\u043A \u0441\u0435\u0441\u0441\u0438\u0439",
        cmdImportSessions: "\u0418\u043C\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u0441\u043D\u0438\u043C\u043E\u043A \u0441\u0435\u0441\u0441\u0438\u0439",
        cmdReloadCurrentWithoutSaving: "\u041F\u0435\u0440\u0435\u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0442\u0435\u043A\u0443\u0449\u0443\u044E \u0441\u0435\u0441\u0441\u0438\u044E (\u0431\u0435\u0437 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F)",
        reloadedSession: function(n) {
          return "\u0421\u0435\u0441\u0441\u0438\u044F \xAB" + n + "\xBB \u043F\u0435\u0440\u0435\u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u0430";
        },
        defaultSessionName: "\u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E",
        nameSessionTitle: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0441 \u0438\u043C\u0435\u043D\u0435\u043C \u0441\u0435\u0441\u0441\u0438\u0438",
        nameSessionPlaceholder: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0441\u0435\u0441\u0441\u0438\u0438...",
        saveWithoutNaming: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0431\u0435\u0437 \u0438\u043C\u0435\u043D\u0438",
        sessionDataMigrated: "Workspace++: \u0434\u0430\u043D\u043D\u044B\u0435 \u0441\u0435\u0441\u0441\u0438\u0439 \u043F\u0435\u0440\u0435\u043D\u0435\u0441\u0435\u043D\u044B \u0432 .workspace-plus-plus/sessions.json.",
        sessionDataMigrationFailed: "Workspace++: \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u0435\u0440\u0435\u043D\u0435\u0441\u0442\u0438 \u0434\u0430\u043D\u043D\u044B\u0435 \u0441\u0435\u0441\u0441\u0438\u0439. \u0423\u0441\u0442\u0430\u0440\u0435\u0432\u0448\u0438\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u044B.",
        localSettingsEnabled: "Workspace++: \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0430 \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u044B.",
        localSettingsDisabled: "Workspace++: \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0430 \u043E\u0442\u043A\u043B\u044E\u0447\u0435\u043D\u044B.",
        localSettingsCopied: "Workspace++: \u0433\u043B\u043E\u0431\u0430\u043B\u044C\u043D\u044B\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u044B \u0432 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0430.",
        localSettingsLoadFailed: "Workspace++: \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0430. \u0411\u0443\u0434\u0443\u0442 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u044B \u0433\u043B\u043E\u0431\u0430\u043B\u044C\u043D\u044B\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438.",
        localSettingsOperationFailed: "Workspace++: \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0430.",
        exportSessionsDone: function(path) {
          return "Workspace++: \u0441\u0435\u0441\u0441\u0438\u0438 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u044B \u0432 " + path;
        },
        exportSessionsFailed: "Workspace++: \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0441\u0435\u0441\u0441\u0438\u0438.",
        importSessionsDone: function(path) {
          return "Workspace++: \u0441\u0435\u0441\u0441\u0438\u0438 \u0438\u043C\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u044B \u0438\u0437 " + path;
        },
        importSessionsNoFile: "Workspace++: \u0432 .workspace-plus-plus/exports \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0444\u0430\u0439\u043B \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0430.",
        importSessionsFailed: "Workspace++: \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0438\u043C\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0441\u0435\u0441\u0441\u0438\u0438.",
        settingsSectionAdvanced: "\u0414\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u043E",
        settingsSectionReset: "\u0421\u0431\u0440\u043E\u0441",
        settingsGitHubLink: "GitHub",
        settingsSectionSessionListSearch: "\u0421\u043F\u0438\u0441\u043E\u043A \u0441\u0435\u0441\u0441\u0438\u0439 \u0438 \u043F\u043E\u0438\u0441\u043A",
        settingsSectionSwitchCommands: "\u041A\u043E\u043C\u0430\u043D\u0434\u044B \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F",
        settingsSectionScrollSwitch: "\u041F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u043F\u0440\u043E\u043A\u0440\u0443\u0442\u043A\u043E\u0439",
        settingsSubsectionSwitchSaving: "\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435 \u043F\u0440\u0438 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0438 \u0441\u0435\u0441\u0441\u0438\u0439",
        settingsSubsectionAutoSaveMode: "\u0420\u0435\u0436\u0438\u043C \u0430\u0432\u0442\u043E\u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F \u0441\u0435\u0441\u0441\u0438\u0439",
        settingsSubsectionSwitchCommands: "\u041A\u043E\u043C\u0430\u043D\u0434\u044B \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F \u0441\u0435\u0441\u0441\u0438\u0439",
        settingsSubsectionScrollSwitch: "\u041F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u0441\u0435\u0441\u0441\u0438\u0439 \u043F\u0440\u043E\u043A\u0440\u0443\u0442\u043A\u043E\u0439",
        settingsSubsectionSwitchPreview: "\u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u043F\u0435\u0440\u0435\u0434 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435\u043C \u0441\u0435\u0441\u0441\u0438\u0439",
        settingsStatusBarScrollPreset: "\u041F\u0440\u043E\u0444\u0438\u043B\u044C \u0432\u0432\u043E\u0434\u0430 \u043F\u0440\u043E\u043A\u0440\u0443\u0442\u043A\u0438",
        settingsStatusBarScrollPresetDesc: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u0440\u043E\u0444\u0438\u043B\u044C, \u043F\u043E\u0434\u0445\u043E\u0434\u044F\u0449\u0438\u0439 \u0434\u043B\u044F \u0432\u0430\u0448\u0435\u0433\u043E \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430, \u0438\u043B\u0438 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438\u0442\u0435\u0441\u044C \u043D\u0430 \xAB\u0421\u0432\u043E\u0439\xBB \u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u0442\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F \u0432\u0440\u0443\u0447\u043D\u0443\u044E.",
        settingsStatusBarScrollPresetTrackpad: "\u0422\u0440\u0435\u043A\u043F\u0430\u0434",
        settingsStatusBarScrollPresetNotchedWheel: "\u041A\u043E\u043B\u0435\u0441\u043E \u043C\u044B\u0448\u0438 \u0441 \u043E\u0442\u0441\u0435\u0447\u043A\u0430\u043C\u0438",
        settingsStatusBarScrollPresetFreeSpinWheel: "\u041A\u043E\u043B\u0435\u0441\u043E \u043C\u044B\u0448\u0438 \u0441\u043E \u0441\u0432\u043E\u0431\u043E\u0434\u043D\u043E\u0439 \u043F\u0440\u043E\u043A\u0440\u0443\u0442\u043A\u043E\u0439",
        settingsStatusBarScrollPresetCustom: "\u0421\u0432\u043E\u0439",
        settingsStatusBarScrollModifier: "\u041E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u043C\u043E\u0434\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440",
        settingsStatusBarScrollModifierDesc: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043C\u043E\u0434\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u043D\u0443\u0436\u043D\u043E \u0443\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0442\u044C \u043F\u0440\u0438 \u043F\u0440\u043E\u043A\u0440\u0443\u0442\u043A\u0435 \u043F\u043E \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0443 \u0441\u0442\u0440\u043E\u043A\u0438 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F.",
        settingsStatusBarScrollModifierRecommended: platformLabel("Cmd \u0438\u043B\u0438 Option", "Ctrl \u0438\u043B\u0438 Alt"),
        settingsStatusBarScrollModifierNone: "\u041D\u0435\u0442",
        settingsStatusBarScrollModifierModOnly: platformLabel("\u0422\u043E\u043B\u044C\u043A\u043E Cmd", "\u0422\u043E\u043B\u044C\u043A\u043E Ctrl"),
        settingsStatusBarScrollModifierAltOnly: platformLabel("\u0422\u043E\u043B\u044C\u043A\u043E Option", "\u0422\u043E\u043B\u044C\u043A\u043E Alt"),
        settingsStatusBarScrollModifierModOrAlt: platformLabel("Cmd \u0438\u043B\u0438 Option", "Ctrl \u0438\u043B\u0438 Alt"),
        settingsStatusBarScrollThreshold: "\u041F\u043E\u0440\u043E\u0433 \u0447\u0443\u0432\u0441\u0442\u0432\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u0438",
        settingsStatusBarScrollThresholdDesc: "\u0427\u0435\u043C \u043C\u0435\u043D\u044C\u0448\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435, \u0442\u0435\u043C \u043B\u0435\u0433\u0447\u0435 \u0441\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u0435\u0442 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435. \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u0441 \u043F\u0440\u043E\u0444\u0438\u043B\u0435\u043C \xAB\u0421\u0432\u043E\u0439\xBB.",
        settingsStatusBarScrollCooldown: "\u0417\u0430\u0434\u0435\u0440\u0436\u043A\u0430",
        settingsStatusBarScrollCooldownDesc: "\u041C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u044B\u0439 \u0438\u043D\u0442\u0435\u0440\u0432\u0430\u043B \u043C\u0435\u0436\u0434\u0443 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F\u043C\u0438 \u0441\u0435\u0441\u0441\u0438\u0439, \u0432\u044B\u0437\u0432\u0430\u043D\u043D\u044B\u043C\u0438 \u043F\u0440\u043E\u043A\u0440\u0443\u0442\u043A\u043E\u0439. \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u0441 \u043F\u0440\u043E\u0444\u0438\u043B\u0435\u043C \xAB\u0421\u0432\u043E\u0439\xBB.",
        settingsStatusBarScrollResetWindow: "\u041E\u043A\u043D\u043E \u0441\u0431\u0440\u043E\u0441\u0430 \u043D\u0430\u043A\u043E\u043F\u043B\u0435\u043D\u0438\u044F",
        settingsStatusBarScrollResetWindowDesc: "\u041A\u0430\u043A \u0434\u043E\u043B\u0433\u043E \u0441\u0443\u043C\u043C\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043D\u0435\u0431\u043E\u043B\u044C\u0448\u0438\u0435 \u0448\u0430\u0433\u0438 \u043F\u0440\u043E\u043A\u0440\u0443\u0442\u043A\u0438 \u043F\u0435\u0440\u0435\u0434 \u0441\u0431\u0440\u043E\u0441\u043E\u043C. \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u0441 \u043F\u0440\u043E\u0444\u0438\u043B\u0435\u043C \xAB\u0421\u0432\u043E\u0439\xBB.",
        settingsStatusBarScrollInvert: "\u0418\u043D\u0432\u0435\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043F\u0440\u043E\u043A\u0440\u0443\u0442\u043A\u0438",
        settingsStatusBarScrollInvertDesc: "\u041C\u0435\u043D\u044F\u0435\u0442 \u043C\u0435\u0441\u0442\u0430\u043C\u0438 \u043D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F \xAB\u043F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0430\u044F/\u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0430\u044F\xBB \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F \u0441\u0435\u0441\u0441\u0438\u0439 \u043F\u0440\u043E\u043A\u0440\u0443\u0442\u043A\u043E\u0439 \u043F\u043E \u0441\u0442\u0440\u043E\u043A\u0435 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F.",
        settingsUseLocalSettings: "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0430",
        settingsUseLocalSettingsDesc: "\u0412\u043A\u043B\u044E\u0447\u0438\u0442\u0435, \u0435\u0441\u043B\u0438 \u0432\u044B \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0438\u0440\u0443\u0435\u0442\u0435 .obsidian \u043C\u0435\u0436\u0434\u0443 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u0438\u043C\u0438 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0430\u043C\u0438 (\u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440, \u0447\u0435\u0440\u0435\u0437 Settings Profiles) \u0438 \u0445\u043E\u0442\u0438\u0442\u0435 \u0440\u0430\u0437\u043D\u044B\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 Workspace++ \u0434\u043B\u044F \u043A\u0430\u0436\u0434\u043E\u0433\u043E \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0430.",
        settingsCopyGlobalToLocal: "\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0433\u043B\u043E\u0431\u0430\u043B\u044C\u043D\u044B\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0432 \u044D\u0442\u043E \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0435",
        settingsCopyGlobalToLocalDesc: "\u041F\u0435\u0440\u0435\u0437\u0430\u043F\u0438\u0441\u044B\u0432\u0430\u0435\u0442 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0430 \u0442\u0435\u043A\u0443\u0449\u0438\u043C\u0438 \u0433\u043B\u043E\u0431\u0430\u043B\u044C\u043D\u044B\u043C\u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u043C\u0438.",
        settingsCopyGlobalToLocalBtn: "\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C",
        settingsResetLocalSettings: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0430",
        settingsResetLocalSettingsDesc: "\u0421\u0431\u0440\u0430\u0441\u044B\u0432\u0430\u0435\u0442 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0430 \u0434\u043E \u0433\u043B\u043E\u0431\u0430\u043B\u044C\u043D\u044B\u0445 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A.",
        settingsResetLocalSettingsBtn: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0435",
        settingsAdvancedStorageSubsection: "\u041F\u043E\u0432\u0435\u0434\u0435\u043D\u0438\u0435 \u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F",
        settingsAdvancedTransferSubsection: "\u041F\u0435\u0440\u0435\u0434\u0430\u0447\u0430 \u0434\u0430\u043D\u043D\u044B\u0445",
        settingsDeveloperSection: "\u0418\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u044B \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u0447\u0438\u043A\u0430",
        settingsStorageDiagnostics: "\u0414\u0438\u0430\u0433\u043D\u043E\u0441\u0442\u0438\u043A\u0430 \u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F",
        settingsStorageDiagnosticsDesc: "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u0441\u0435\u0439\u0447\u0430\u0441 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442 Workspace++.",
        settingsStorageFieldSessions: "\u0424\u0430\u0439\u043B \u0441\u0435\u0441\u0441\u0438\u0439",
        settingsStorageFieldSessionsBackup: "\u0420\u0435\u0437\u0435\u0440\u0432\u043D\u0430\u044F \u043A\u043E\u043F\u0438\u044F \u0441\u0435\u0441\u0441\u0438\u0439",
        settingsStorageFieldLocalSettings: "\u0424\u0430\u0439\u043B \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0445 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A",
        settingsStorageFieldGlobalSettings: "\u0424\u0430\u0439\u043B \u0433\u043B\u043E\u0431\u0430\u043B\u044C\u043D\u044B\u0445 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A",
        settingsStorageFieldSessionCount: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0441\u0435\u0441\u0441\u0438\u0439",
        settingsStorageFieldUpdatedAt: "\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u043E",
        settingsExportSessions: "\u042D\u043A\u0441\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0441\u0435\u0441\u0441\u0438\u0438",
        settingsExportSessionsDesc: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0441\u043D\u0438\u043C\u043E\u043A \u0432 .workspace-plus-plus/exports.",
        settingsExportSessionsBtn: "\u042D\u043A\u0441\u043F\u043E\u0440\u0442",
        settingsImportSessions: "\u0418\u043C\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0441\u0435\u0441\u0441\u0438\u0438",
        settingsImportSessionsDesc: "\u0418\u043C\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u0441\u043D\u0438\u043C\u043E\u043A \u0438\u0437 .workspace-plus-plus/exports.",
        settingsImportSessionsBtn: "\u0418\u043C\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439",
        confirmImportSessions: "\u0418\u043C\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0439 \u0441\u043D\u0438\u043C\u043E\u043A \u0441\u0435\u0441\u0441\u0438\u0439? \u0422\u0435\u043A\u0443\u0449\u0438\u0435 \u0441\u0435\u0441\u0441\u0438\u0438 \u0431\u0443\u0434\u0443\u0442 \u0437\u0430\u043C\u0435\u043D\u0435\u043D\u044B.",
        settingsResetSettings: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
        settingsResetSettingsDesc: "\u0421\u0431\u0440\u0430\u0441\u044B\u0432\u0430\u0435\u0442 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 Workspace++ \u0434\u043E \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0439 \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E \u0432 \u0442\u0435\u043A\u0443\u0449\u0435\u0439 \u043E\u0431\u043B\u0430\u0441\u0442\u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A.",
        settingsResetSettingsBtn: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
        confirmResetSettings: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 Workspace++ \u0434\u043E \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0439 \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E?",
        resetSettingsDone: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 Workspace++ \u0441\u0431\u0440\u043E\u0448\u0435\u043D\u044B.",
        resetSettingsFailed: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 Workspace++.",
        settingsResetSessionsAndSettings: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0441\u0435\u0441\u0441\u0438\u0438 \u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
        settingsResetSessionsAndSettingsDesc: "\u041E\u0434\u043D\u043E\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E \u0441\u0431\u0440\u0430\u0441\u044B\u0432\u0430\u0435\u0442 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043D\u044B\u0435 \u0441\u0435\u0441\u0441\u0438\u0438 \u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 Workspace++.",
        settingsResetSessionsAndSettingsBtn: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u043E\u0431\u0430",
        confirmResetSessionsAndSettings: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0441\u0435\u0441\u0441\u0438\u0438 \u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438? \u042D\u0442\u043E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u043D\u0435\u043B\u044C\u0437\u044F \u043E\u0442\u043C\u0435\u043D\u0438\u0442\u044C.",
        resetSessionsAndSettingsDone: "\u0421\u0435\u0441\u0441\u0438\u0438 \u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0441\u0431\u0440\u043E\u0448\u0435\u043D\u044B.",
        resetSessionsAndSettingsFailed: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0441\u0435\u0441\u0441\u0438\u0438 \u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438."
      },
      de: {
        confirmOverwriteSessionWithCurrentLayout: function(n) {
          return "Sitzung \u201E" + n + "\u201C mit aktuellem Layout \xFCberschreiben?";
        },
        cmdSaveCurrentLayoutToSession: "Aktuelles Layout in Sitzung speichern...",
        savedCurrentLayoutToSession: function(n) {
          return "Aktuelles Layout in \u201E" + n + "\u201C gespeichert";
        },
        saveCurrentLayoutToSessionPlaceholder: "Zu \xFCberschreibende Sitzung ausw\xE4hlen...",
        contextSaveCurrentLayoutToThisSession: "Aktuelles Layout in diese Sitzung speichern",
        cmdExportSessions: "Sitzungs-Snapshot exportieren",
        cmdImportSessions: "Neueste Sitzungs-Snapshot importieren",
        cmdReloadCurrentWithoutSaving: "Aktuelle Sitzung neu laden (ohne Speichern)",
        reloadedSession: function(n) {
          return "Sitzung \u201E" + n + "\u201C neu geladen";
        },
        defaultSessionName: "Standard",
        nameSessionTitle: "Mit Sitzungsname speichern",
        nameSessionPlaceholder: "Sitzungsname...",
        saveWithoutNaming: "Ohne Namen speichern",
        sessionDataMigrated: "Workspace++: Sitzungsdaten wurden nach .workspace-plus-plus/sessions.json verschoben.",
        sessionDataMigrationFailed: "Workspace++: Sitzungsdaten konnten nicht migriert werden. Altdaten bleiben erhalten.",
        localSettingsEnabled: "Workspace++: Vault-lokale Einstellungen aktiviert.",
        localSettingsDisabled: "Workspace++: Vault-lokale Einstellungen deaktiviert.",
        localSettingsCopied: "Workspace++: Globale Einstellungen wurden in die Vault-lokalen Einstellungen kopiert.",
        localSettingsLoadFailed: "Workspace++: Vault-lokale Einstellungen konnten nicht geladen werden. Globale Einstellungen werden verwendet.",
        localSettingsOperationFailed: "Workspace++: Vault-lokale Einstellungen konnten nicht aktualisiert werden.",
        exportSessionsDone: function(path) {
          return "Workspace++: Sitzungen nach " + path + " exportiert";
        },
        exportSessionsFailed: "Workspace++: Sitzungen konnten nicht exportiert werden.",
        importSessionsDone: function(path) {
          return "Workspace++: Sitzungen aus " + path + " importiert";
        },
        importSessionsNoFile: "Workspace++: Keine Exportdatei in .workspace-plus-plus/exports gefunden.",
        importSessionsFailed: "Workspace++: Sitzungen konnten nicht importiert werden.",
        settingsSectionAdvanced: "Erweitert",
        settingsSectionReset: "Zur\xFCcksetzen",
        settingsGitHubLink: "GitHub",
        settingsSectionSessionListSearch: "Sitzungsliste und Suche",
        settingsSectionSwitchCommands: "Wechselbefehle",
        settingsSectionScrollSwitch: "Wechsel per Scrollen",
        settingsSubsectionSwitchSaving: "Speichern beim Sitzungswechsel",
        settingsSubsectionAutoSaveMode: "Automatischer Sitzungs-Speichermodus",
        settingsSubsectionSwitchCommands: "Befehle zum Sitzungswechsel",
        settingsSubsectionScrollSwitch: "Sitzungswechsel per Scrollen",
        settingsSubsectionSwitchPreview: "Vorschau vor dem Sitzungswechsel",
        settingsStatusBarScrollPreset: "Voreinstellung f\xFCr Scroll-Eingabe",
        settingsStatusBarScrollPresetDesc: "W\xE4hlen Sie eine auf Ihr Ger\xE4t abgestimmte Voreinstellung oder wechseln Sie zu Benutzerdefiniert, um die Werte selbst anzupassen.",
        settingsStatusBarScrollPresetTrackpad: "Trackpad",
        settingsStatusBarScrollPresetNotchedWheel: "Gerastertes Mausrad",
        settingsStatusBarScrollPresetFreeSpinWheel: "Mausrad mit Freilauf",
        settingsStatusBarScrollPresetCustom: "Benutzerdefiniert",
        settingsStatusBarScrollModifier: "Erforderliche Zusatztaste",
        settingsStatusBarScrollModifierDesc: "W\xE4hlen Sie, welche Zusatztaste beim Scrollen \xFCber das Element in der Statusleiste gehalten werden muss.",
        settingsStatusBarScrollModifierRecommended: platformLabel("Cmd oder Option", "Ctrl oder Alt"),
        settingsStatusBarScrollModifierNone: "Keine",
        settingsStatusBarScrollModifierModOnly: platformLabel("Nur Cmd", "Nur Ctrl"),
        settingsStatusBarScrollModifierAltOnly: platformLabel("Nur Option", "Nur Alt"),
        settingsStatusBarScrollModifierModOrAlt: platformLabel("Cmd oder Option", "Ctrl oder Alt"),
        settingsStatusBarScrollThreshold: "Empfindlichkeitsschwelle",
        settingsStatusBarScrollThresholdDesc: "Niedrigere Werte schalten leichter um. Wird nur mit der Voreinstellung Benutzerdefiniert verwendet.",
        settingsStatusBarScrollCooldown: "Abklingzeit",
        settingsStatusBarScrollCooldownDesc: "Mindestabstand zwischen durch Scrollen ausgel\xF6sten Sitzungswechseln. Wird nur mit der Voreinstellung Benutzerdefiniert verwendet.",
        settingsStatusBarScrollResetWindow: "R\xFCcksetzfenster f\xFCr Ansammlung",
        settingsStatusBarScrollResetWindowDesc: "Wie lange kleine Scroll-Deltas vor dem Zur\xFCcksetzen weiter zusammengez\xE4hlt werden. Wird nur mit der Voreinstellung Benutzerdefiniert verwendet.",
        settingsStatusBarScrollInvert: "Scrollrichtung umkehren",
        settingsStatusBarScrollInvertDesc: "Kehrt die Richtung Vorherige/N\xE4chste f\xFCr den Sitzungswechsel per Scrollen in der Statusleiste um.",
        settingsUseLocalSettings: "Vault-lokale Einstellungen verwenden",
        settingsUseLocalSettingsDesc: "Aktiviere dies, wenn du .obsidian zwischen mehreren Vaults synchronisierst (z. B. mit Settings Profiles) und die Workspace++-Einstellungen pro Vault unterschiedlich halten m\xF6chtest.",
        settingsCopyGlobalToLocal: "Globale Einstellungen in dieses Vault kopieren",
        settingsCopyGlobalToLocalDesc: "\xDCberschreibt die Vault-lokalen Einstellungen mit den aktuellen globalen Einstellungen.",
        settingsCopyGlobalToLocalBtn: "Kopieren",
        settingsResetLocalSettings: "Vault-lokale Einstellungen zur\xFCcksetzen",
        settingsResetLocalSettingsDesc: "Setzt Vault-lokale Einstellungen auf die globalen Einstellungen zur\xFCck.",
        settingsResetLocalSettingsBtn: "Lokal zur\xFCcksetzen",
        settingsAdvancedStorageSubsection: "Speicherverhalten",
        settingsAdvancedTransferSubsection: "Daten\xFCbertragung",
        settingsDeveloperSection: "Entwicklerwerkzeuge",
        settingsStorageDiagnostics: "Speicherdiagnose",
        settingsStorageDiagnosticsDesc: "Speicherdetails, die Workspace++ aktuell verwendet.",
        settingsStorageFieldSessions: "Sitzungsdatei",
        settingsStorageFieldSessionsBackup: "Sitzungssicherung",
        settingsStorageFieldLocalSettings: "Datei f\xFCr lokale Einstellungen",
        settingsStorageFieldGlobalSettings: "Datei f\xFCr globale Einstellungen",
        settingsStorageFieldSessionCount: "Anzahl Sitzungen",
        settingsStorageFieldUpdatedAt: "Aktualisiert am",
        settingsExportSessions: "Sitzungen exportieren",
        settingsExportSessionsDesc: "Speichert einen Snapshot in .workspace-plus-plus/exports.",
        settingsExportSessionsBtn: "Exportieren",
        settingsImportSessions: "Sitzungen importieren",
        settingsImportSessionsDesc: "Importiert den neuesten Snapshot aus .workspace-plus-plus/exports.",
        settingsImportSessionsBtn: "Neueste importieren",
        confirmImportSessions: "Neueste exportierte Sitzungen importieren? Aktuelle Sitzungen werden ersetzt.",
        settingsResetSettings: "Einstellungen zur\xFCcksetzen",
        settingsResetSettingsDesc: "Setzt Workspace++-Einstellungen im aktuellen Einstellungsbereich auf Standard zur\xFCck.",
        settingsResetSettingsBtn: "Einstellungen zur\xFCcksetzen",
        confirmResetSettings: "Workspace++-Einstellungen auf Standard zur\xFCcksetzen?",
        resetSettingsDone: "Workspace++-Einstellungen wurden zur\xFCckgesetzt.",
        resetSettingsFailed: "Workspace++-Einstellungen konnten nicht zur\xFCckgesetzt werden.",
        settingsResetSessionsAndSettings: "Sitzungen und Einstellungen zur\xFCcksetzen",
        settingsResetSessionsAndSettingsDesc: "Setzt gespeicherte Sitzungen und Workspace++-Einstellungen gleichzeitig zur\xFCck.",
        settingsResetSessionsAndSettingsBtn: "Beides zur\xFCcksetzen",
        confirmResetSessionsAndSettings: "Sitzungen und Einstellungen zur\xFCcksetzen? Diese Aktion kann nicht r\xFCckg\xE4ngig gemacht werden.",
        resetSessionsAndSettingsDone: "Sitzungen und Einstellungen wurden zur\xFCckgesetzt.",
        resetSessionsAndSettingsFailed: "Sitzungen und Einstellungen konnten nicht zur\xFCckgesetzt werden."
      },
      ko: {
        confirmOverwriteSessionWithCurrentLayout: function(n) {
          return '"' + n + '" \uC138\uC158\uC744 \uD604\uC7AC \uB808\uC774\uC544\uC6C3\uC73C\uB85C \uB36E\uC5B4\uC4F0\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?';
        },
        cmdSaveCurrentLayoutToSession: "\uD604\uC7AC \uB808\uC774\uC544\uC6C3\uC744 \uC138\uC158\uC5D0 \uC800\uC7A5...",
        savedCurrentLayoutToSession: function(n) {
          return '\uD604\uC7AC \uB808\uC774\uC544\uC6C3\uC744 "' + n + '"\uC5D0 \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4';
        },
        saveCurrentLayoutToSessionPlaceholder: "\uB36E\uC5B4\uC4F8 \uC138\uC158 \uC120\uD0DD...",
        contextSaveCurrentLayoutToThisSession: "\uD604\uC7AC \uB808\uC774\uC544\uC6C3\uC744 \uC774 \uC138\uC158\uC5D0 \uC800\uC7A5",
        cmdExportSessions: "\uC138\uC158 \uC2A4\uB0C5\uC0F7 \uB0B4\uBCF4\uB0B4\uAE30",
        cmdImportSessions: "\uCD5C\uC2E0 \uC138\uC158 \uC2A4\uB0C5\uC0F7 \uAC00\uC838\uC624\uAE30",
        cmdReloadCurrentWithoutSaving: "\uD604\uC7AC \uC138\uC158 \uB2E4\uC2DC \uBD88\uB7EC\uC624\uAE30 (\uC800\uC7A5 \uC548 \uD568)",
        reloadedSession: function(n) {
          return "\u201C" + n + "\u201D \uC138\uC158\uC744 \uB2E4\uC2DC \uBD88\uB7EC\uC654\uC2B5\uB2C8\uB2E4";
        },
        defaultSessionName: "\uAE30\uBCF8",
        nameSessionTitle: "\uC138\uC158 \uC774\uB984\uC744 \uC9C0\uC815\uD558\uACE0 \uC800\uC7A5",
        nameSessionPlaceholder: "\uC138\uC158 \uC774\uB984...",
        saveWithoutNaming: "\uC774\uB984 \uC5C6\uC774 \uC800\uC7A5",
        sessionDataMigrated: "Workspace++: \uC138\uC158 \uB370\uC774\uD130\uAC00 .workspace-plus-plus/sessions.json \uC73C\uB85C \uC774\uB3D9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
        sessionDataMigrationFailed: "Workspace++: \uC138\uC158 \uB370\uC774\uD130 \uB9C8\uC774\uADF8\uB808\uC774\uC158\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. \uAE30\uC874 \uB370\uC774\uD130\uB294 \uC720\uC9C0\uB429\uB2C8\uB2E4.",
        localSettingsEnabled: "Workspace++: \uBCFC\uD2B8 \uB85C\uCEEC \uC124\uC815\uC774 \uD65C\uC131\uD654\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
        localSettingsDisabled: "Workspace++: \uBCFC\uD2B8 \uB85C\uCEEC \uC124\uC815\uC774 \uBE44\uD65C\uC131\uD654\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
        localSettingsCopied: "Workspace++: \uC804\uC5ED \uC124\uC815\uC744 \uBCFC\uD2B8 \uB85C\uCEEC \uC124\uC815\uC73C\uB85C \uBCF5\uC0AC\uD588\uC2B5\uB2C8\uB2E4.",
        localSettingsLoadFailed: "Workspace++: \uBCFC\uD2B8 \uB85C\uCEEC \uC124\uC815\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uC804\uC5ED \uC124\uC815\uC744 \uC0AC\uC6A9\uD569\uB2C8\uB2E4.",
        localSettingsOperationFailed: "Workspace++: \uBCFC\uD2B8 \uB85C\uCEEC \uC124\uC815\uC744 \uC5C5\uB370\uC774\uD2B8\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
        exportSessionsDone: function(path) {
          return "Workspace++: \uC138\uC158\uC744 " + path + " \uB85C \uB0B4\uBCF4\uB0C8\uC2B5\uB2C8\uB2E4.";
        },
        exportSessionsFailed: "Workspace++: \uC138\uC158 \uB0B4\uBCF4\uB0B4\uAE30\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.",
        importSessionsDone: function(path) {
          return "Workspace++: " + path + " \uC5D0\uC11C \uC138\uC158\uC744 \uAC00\uC838\uC654\uC2B5\uB2C8\uB2E4.";
        },
        importSessionsNoFile: "Workspace++: .workspace-plus-plus/exports \uC5D0 \uAC00\uC838\uC62C \uD30C\uC77C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
        importSessionsFailed: "Workspace++: \uC138\uC158 \uAC00\uC838\uC624\uAE30\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.",
        settingsSectionAdvanced: "\uACE0\uAE09",
        settingsSectionReset: "\uCD08\uAE30\uD654",
        settingsGitHubLink: "GitHub",
        settingsSectionSessionListSearch: "\uC138\uC158 \uBAA9\uB85D \uBC0F \uAC80\uC0C9",
        settingsSectionSwitchCommands: "\uC804\uD658 \uBA85\uB839",
        settingsSectionScrollSwitch: "\uC2A4\uD06C\uB864 \uC804\uD658",
        settingsSubsectionSwitchSaving: "\uC138\uC158 \uC804\uD658 \uC2DC \uC800\uC7A5",
        settingsSubsectionAutoSaveMode: "\uC138\uC158 \uC790\uB3D9 \uC800\uC7A5 \uBAA8\uB4DC",
        settingsSubsectionSwitchCommands: "\uC138\uC158 \uC804\uD658 \uBA85\uB839",
        settingsSubsectionScrollSwitch: "\uC2A4\uD06C\uB864\uB85C \uC138\uC158 \uC804\uD658",
        settingsSubsectionSwitchPreview: "\uC138\uC158 \uC804\uD658 \uC804 \uBBF8\uB9AC\uBCF4\uAE30",
        settingsStatusBarScrollPreset: "\uC2A4\uD06C\uB864 \uC785\uB825 \uD504\uB9AC\uC14B",
        settingsStatusBarScrollPresetDesc: "\uC0AC\uC6A9 \uC911\uC778 \uC7A5\uCE58\uC5D0 \uB9DE\uB294 \uD504\uB9AC\uC14B\uC744 \uC120\uD0DD\uD558\uAC70\uB098, \uC9C1\uC811 \uC218\uCE58\uB97C \uC870\uC815\uD558\uB824\uBA74 \uC0AC\uC6A9\uC790 \uC9C0\uC815\uC744 \uC120\uD0DD\uD558\uC138\uC694.",
        settingsStatusBarScrollPresetTrackpad: "\uD2B8\uB799\uD328\uB4DC",
        settingsStatusBarScrollPresetNotchedWheel: "\uB178\uCE58\uD615 \uB9C8\uC6B0\uC2A4 \uD720",
        settingsStatusBarScrollPresetFreeSpinWheel: "\uD504\uB9AC\uC2A4\uD540 \uB9C8\uC6B0\uC2A4 \uD720",
        settingsStatusBarScrollPresetCustom: "\uC0AC\uC6A9\uC790 \uC9C0\uC815",
        settingsStatusBarScrollModifier: "\uD544\uC218 \uBCF4\uC870 \uD0A4",
        settingsStatusBarScrollModifierDesc: "\uC0C1\uD0DC \uD45C\uC2DC\uC904 \uD56D\uBAA9 \uC704\uC5D0\uC11C \uC2A4\uD06C\uB864\uD560 \uB54C \uD568\uAED8 \uB20C\uB7EC\uC57C \uD558\uB294 \uBCF4\uC870 \uD0A4\uB97C \uC120\uD0DD\uD558\uC138\uC694.",
        settingsStatusBarScrollModifierRecommended: platformLabel("Cmd \uB610\uB294 Option", "Ctrl \uB610\uB294 Alt"),
        settingsStatusBarScrollModifierNone: "\uC5C6\uC74C",
        settingsStatusBarScrollModifierModOnly: platformLabel("Cmd\uB9CC", "Ctrl\uB9CC"),
        settingsStatusBarScrollModifierAltOnly: platformLabel("Option\uB9CC", "Alt\uB9CC"),
        settingsStatusBarScrollModifierModOrAlt: platformLabel("Cmd \uB610\uB294 Option", "Ctrl \uB610\uB294 Alt"),
        settingsStatusBarScrollThreshold: "\uBBFC\uAC10\uB3C4 \uC784\uACC4\uAC12",
        settingsStatusBarScrollThresholdDesc: "\uAC12\uC774 \uB0AE\uC744\uC218\uB85D \uB354 \uC27D\uAC8C \uC804\uD658\uB429\uB2C8\uB2E4. \uC0AC\uC6A9\uC790 \uC9C0\uC815 \uD504\uB9AC\uC14B\uC5D0\uC11C\uB9CC \uC0AC\uC6A9\uB429\uB2C8\uB2E4.",
        settingsStatusBarScrollCooldown: "\uCFE8\uB2E4\uC6B4",
        settingsStatusBarScrollCooldownDesc: "\uC2A4\uD06C\uB864\uB85C \uC138\uC158 \uC804\uD658\uC774 \uD2B8\uB9AC\uAC70\uB420 \uB54C\uC758 \uCD5C\uC18C \uAC04\uACA9\uC785\uB2C8\uB2E4. \uC0AC\uC6A9\uC790 \uC9C0\uC815 \uD504\uB9AC\uC14B\uC5D0\uC11C\uB9CC \uC0AC\uC6A9\uB429\uB2C8\uB2E4.",
        settingsStatusBarScrollResetWindow: "\uB204\uC801 \uCD08\uAE30\uD654 \uC2DC\uAC04",
        settingsStatusBarScrollResetWindowDesc: "\uC791\uC740 \uC2A4\uD06C\uB864 \uBCC0\uD654\uB7C9\uC744 \uCD08\uAE30\uD654\uD558\uAE30 \uC804\uC5D0 \uC5BC\uB9C8\uB098 \uC624\uB798 \uB204\uC801\uD560\uC9C0 \uC124\uC815\uD569\uB2C8\uB2E4. \uC0AC\uC6A9\uC790 \uC9C0\uC815 \uD504\uB9AC\uC14B\uC5D0\uC11C\uB9CC \uC0AC\uC6A9\uB429\uB2C8\uB2E4.",
        settingsStatusBarScrollInvert: "\uC2A4\uD06C\uB864 \uBC29\uD5A5 \uBC18\uC804",
        settingsStatusBarScrollInvertDesc: "\uC0C1\uD0DC \uD45C\uC2DC\uC904 \uC2A4\uD06C\uB864 \uC804\uD658\uC5D0\uC11C \uC774\uC804/\uB2E4\uC74C \uBC29\uD5A5\uC744 \uBC18\uB300\uB85C \uD569\uB2C8\uB2E4.",
        settingsUseLocalSettings: "\uBCFC\uD2B8 \uB85C\uCEEC \uC124\uC815 \uC0AC\uC6A9",
        settingsUseLocalSettingsDesc: "\uC5EC\uB7EC \uBCFC\uD2B8\uC5D0\uC11C .obsidian\uC744 \uB3D9\uAE30\uD654\uD558\uB294 \uACBD\uC6B0(\uC608: Settings Profiles) Workspace++ \uC124\uC815\uC744 \uBCFC\uD2B8\uBCC4\uB85C \uB2E4\uB974\uAC8C \uC720\uC9C0\uD558\uB824\uBA74 \uCF1C\uC138\uC694.",
        settingsCopyGlobalToLocal: "\uC804\uC5ED \uC124\uC815\uC744 \uC774 \uBCFC\uD2B8\uB85C \uBCF5\uC0AC",
        settingsCopyGlobalToLocalDesc: "\uD604\uC7AC \uC804\uC5ED \uC124\uC815\uC73C\uB85C \uBCFC\uD2B8 \uB85C\uCEEC \uC124\uC815\uC744 \uB36E\uC5B4\uC501\uB2C8\uB2E4.",
        settingsCopyGlobalToLocalBtn: "\uBCF5\uC0AC",
        settingsResetLocalSettings: "\uBCFC\uD2B8 \uB85C\uCEEC \uC124\uC815 \uCD08\uAE30\uD654",
        settingsResetLocalSettingsDesc: "\uBCFC\uD2B8 \uB85C\uCEEC \uC124\uC815\uC744 \uC804\uC5ED \uC124\uC815\uC73C\uB85C \uB418\uB3CC\uB9BD\uB2C8\uB2E4.",
        settingsResetLocalSettingsBtn: "\uB85C\uCEEC \uCD08\uAE30\uD654",
        settingsAdvancedStorageSubsection: "\uC800\uC7A5 \uB3D9\uC791",
        settingsAdvancedTransferSubsection: "\uB370\uC774\uD130 \uC774\uC804",
        settingsDeveloperSection: "\uAC1C\uBC1C\uC790 \uB3C4\uAD6C",
        settingsStorageDiagnostics: "\uC800\uC7A5 \uC9C4\uB2E8",
        settingsStorageDiagnosticsDesc: "Workspace++\uAC00 \uD604\uC7AC \uC0AC\uC6A9\uD558\uB294 \uC800\uC7A5 \uC815\uBCF4\uC785\uB2C8\uB2E4.",
        settingsStorageFieldSessions: "\uC138\uC158 \uD30C\uC77C",
        settingsStorageFieldSessionsBackup: "\uC138\uC158 \uBC31\uC5C5",
        settingsStorageFieldLocalSettings: "\uB85C\uCEEC \uC124\uC815 \uD30C\uC77C",
        settingsStorageFieldGlobalSettings: "\uC804\uC5ED \uC124\uC815 \uD30C\uC77C",
        settingsStorageFieldSessionCount: "\uC138\uC158 \uC218",
        settingsStorageFieldUpdatedAt: "\uC5C5\uB370\uC774\uD2B8 \uC2DC\uAC04",
        settingsExportSessions: "\uC138\uC158 \uB0B4\uBCF4\uB0B4\uAE30",
        settingsExportSessionsDesc: ".workspace-plus-plus/exports \uC5D0 \uC2A4\uB0C5\uC0F7\uC744 \uC800\uC7A5\uD569\uB2C8\uB2E4.",
        settingsExportSessionsBtn: "\uB0B4\uBCF4\uB0B4\uAE30",
        settingsImportSessions: "\uC138\uC158 \uAC00\uC838\uC624\uAE30",
        settingsImportSessionsDesc: ".workspace-plus-plus/exports \uC758 \uCD5C\uC2E0 \uC2A4\uB0C5\uC0F7\uC744 \uAC00\uC838\uC635\uB2C8\uB2E4.",
        settingsImportSessionsBtn: "\uCD5C\uC2E0 \uAC00\uC838\uC624\uAE30",
        confirmImportSessions: "\uAC00\uC7A5 \uCD5C\uADFC\uC5D0 \uB0B4\uBCF4\uB0B8 \uC138\uC158\uC744 \uAC00\uC838\uC624\uC2DC\uACA0\uC2B5\uB2C8\uAE4C? \uD604\uC7AC \uC138\uC158\uC740 \uB300\uCCB4\uB429\uB2C8\uB2E4.",
        settingsResetSettings: "\uC124\uC815 \uCD08\uAE30\uD654",
        settingsResetSettingsDesc: "\uD604\uC7AC \uC124\uC815 \uBC94\uC704\uC5D0\uC11C Workspace++ \uC124\uC815\uC744 \uAE30\uBCF8\uAC12\uC73C\uB85C \uB418\uB3CC\uB9BD\uB2C8\uB2E4.",
        settingsResetSettingsBtn: "\uC124\uC815 \uCD08\uAE30\uD654",
        confirmResetSettings: "Workspace++ \uC124\uC815\uC744 \uAE30\uBCF8\uAC12\uC73C\uB85C \uCD08\uAE30\uD654\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?",
        resetSettingsDone: "Workspace++ \uC124\uC815\uC774 \uCD08\uAE30\uD654\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
        resetSettingsFailed: "Workspace++ \uC124\uC815 \uCD08\uAE30\uD654\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.",
        settingsResetSessionsAndSettings: "\uC138\uC158\uACFC \uC124\uC815 \uCD08\uAE30\uD654",
        settingsResetSessionsAndSettingsDesc: "\uC800\uC7A5\uB41C \uC138\uC158\uACFC Workspace++ \uC124\uC815\uC744 \uD55C \uBC88\uC5D0 \uCD08\uAE30\uD654\uD569\uB2C8\uB2E4.",
        settingsResetSessionsAndSettingsBtn: "\uB458 \uB2E4 \uCD08\uAE30\uD654",
        confirmResetSessionsAndSettings: "\uC138\uC158\uACFC \uC124\uC815\uC744 \uBAA8\uB450 \uCD08\uAE30\uD654\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C? \uC774 \uC791\uC5C5\uC740 \uB418\uB3CC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
        resetSessionsAndSettingsDone: "\uC138\uC158\uACFC \uC124\uC815\uC774 \uCD08\uAE30\uD654\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
        resetSessionsAndSettingsFailed: "\uC138\uC158\uACFC \uC124\uC815 \uCD08\uAE30\uD654\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4."
      },
      it: {
        confirmOverwriteSessionWithCurrentLayout: function(n) {
          return 'Sovrascrivere "' + n + '" con il layout attuale?';
        },
        cmdSaveCurrentLayoutToSession: "Salva layout attuale in una sessione...",
        savedCurrentLayoutToSession: function(n) {
          return 'Layout attuale salvato in "' + n + '"';
        },
        saveCurrentLayoutToSessionPlaceholder: "Seleziona una sessione da sovrascrivere...",
        contextSaveCurrentLayoutToThisSession: "Salva layout attuale in questa sessione",
        cmdExportSessions: "Esporta snapshot delle sessioni",
        cmdImportSessions: "Importa ultimo snapshot delle sessioni",
        cmdReloadCurrentWithoutSaving: "Ricarica sessione corrente (senza salvare)",
        reloadedSession: function(n) {
          return "Sessione \xAB" + n + "\xBB ricaricata";
        },
        defaultSessionName: "predefinita",
        nameSessionTitle: "Salva con nome della sessione",
        nameSessionPlaceholder: "Nome della sessione...",
        saveWithoutNaming: "Salva senza nome",
        sessionDataMigrated: "Workspace++: i dati delle sessioni sono stati spostati in .workspace-plus-plus/sessions.json.",
        sessionDataMigrationFailed: "Workspace++: migrazione dei dati delle sessioni non riuscita. I dati legacy sono stati mantenuti.",
        localSettingsEnabled: "Workspace++: impostazioni locali del vault abilitate.",
        localSettingsDisabled: "Workspace++: impostazioni locali del vault disabilitate.",
        localSettingsCopied: "Workspace++: impostazioni globali copiate nelle impostazioni locali del vault.",
        localSettingsLoadFailed: "Workspace++: impossibile caricare le impostazioni locali del vault. Verranno usate le impostazioni globali.",
        localSettingsOperationFailed: "Workspace++: impossibile aggiornare le impostazioni locali del vault.",
        exportSessionsDone: function(path) {
          return "Workspace++: sessioni esportate in " + path;
        },
        exportSessionsFailed: "Workspace++: impossibile esportare le sessioni.",
        importSessionsDone: function(path) {
          return "Workspace++: sessioni importate da " + path;
        },
        importSessionsNoFile: "Workspace++: nessun file esportato trovato in .workspace-plus-plus/exports.",
        importSessionsFailed: "Workspace++: impossibile importare le sessioni.",
        settingsSectionAdvanced: "Avanzate",
        settingsSectionReset: "Reimposta",
        settingsGitHubLink: "GitHub",
        settingsSectionSessionListSearch: "Elenco e ricerca sessioni",
        settingsSectionSwitchCommands: "Comandi di cambio",
        settingsSectionScrollSwitch: "Cambio con scorrimento",
        settingsSubsectionSwitchSaving: "Salvataggio durante il cambio sessione",
        settingsSubsectionAutoSaveMode: "Modalit\xE0 di salvataggio automatico delle sessioni",
        settingsSubsectionSwitchCommands: "Comandi di cambio sessione",
        settingsSubsectionScrollSwitch: "Cambio sessione con scorrimento",
        settingsSubsectionSwitchPreview: "Anteprima prima del cambio sessione",
        settingsStatusBarScrollPreset: "Preimpostazione input di scorrimento",
        settingsStatusBarScrollPresetDesc: "Scegli una preimpostazione adatta al tuo dispositivo oppure passa a Personalizzato per regolare i valori manualmente.",
        settingsStatusBarScrollPresetTrackpad: "Trackpad",
        settingsStatusBarScrollPresetNotchedWheel: "Rotellina del mouse a scatti",
        settingsStatusBarScrollPresetFreeSpinWheel: "Rotellina del mouse a scorrimento libero",
        settingsStatusBarScrollPresetCustom: "Personalizzato",
        settingsStatusBarScrollModifier: "Modificatore richiesto",
        settingsStatusBarScrollModifierDesc: "Scegli quale modificatore deve essere tenuto premuto mentre scorri sull\u2019elemento della barra di stato.",
        settingsStatusBarScrollModifierRecommended: platformLabel("Cmd o Option", "Ctrl o Alt"),
        settingsStatusBarScrollModifierNone: "Nessuno",
        settingsStatusBarScrollModifierModOnly: platformLabel("Solo Cmd", "Solo Ctrl"),
        settingsStatusBarScrollModifierAltOnly: platformLabel("Solo Option", "Solo Alt"),
        settingsStatusBarScrollModifierModOrAlt: platformLabel("Cmd o Option", "Ctrl o Alt"),
        settingsStatusBarScrollThreshold: "Soglia di sensibilit\xE0",
        settingsStatusBarScrollThresholdDesc: "Valori pi\xF9 bassi rendono il cambio pi\xF9 facile. Usato solo con la preimpostazione Personalizzato.",
        settingsStatusBarScrollCooldown: "Tempo di attesa",
        settingsStatusBarScrollCooldownDesc: "Intervallo minimo tra i cambi di sessione attivati dallo scorrimento. Usato solo con la preimpostazione Personalizzato.",
        settingsStatusBarScrollResetWindow: "Finestra di azzeramento dell\u2019accumulo",
        settingsStatusBarScrollResetWindowDesc: "Per quanto tempo continuare ad accumulare piccoli delta di scorrimento prima di azzerarli. Usato solo con la preimpostazione Personalizzato.",
        settingsStatusBarScrollInvert: "Inverti direzione di scorrimento",
        settingsStatusBarScrollInvertDesc: "Inverte la direzione precedente/successiva per il cambio sessione con lo scorrimento nella barra di stato.",
        settingsUseLocalSettings: "Usa impostazioni locali del vault",
        settingsUseLocalSettingsDesc: "Attiva questa opzione se sincronizzi .obsidian tra pi\xF9 vault (ad esempio con Settings Profiles) e vuoi mantenere impostazioni Workspace++ diverse per ogni vault.",
        settingsCopyGlobalToLocal: "Copia impostazioni globali in questo vault",
        settingsCopyGlobalToLocalDesc: "Sovrascrive le impostazioni locali del vault con le impostazioni globali correnti.",
        settingsCopyGlobalToLocalBtn: "Copia",
        settingsResetLocalSettings: "Reimposta impostazioni locali del vault",
        settingsResetLocalSettingsDesc: "Reimposta le impostazioni locali del vault alle impostazioni globali.",
        settingsResetLocalSettingsBtn: "Reimposta locale",
        settingsAdvancedStorageSubsection: "Comportamento di archiviazione",
        settingsAdvancedTransferSubsection: "Trasferimento dati",
        settingsDeveloperSection: "Strumenti sviluppatore",
        settingsStorageDiagnostics: "Diagnostica archiviazione",
        settingsStorageDiagnosticsDesc: "Dettagli di archiviazione attualmente usati da Workspace++.",
        settingsStorageFieldSessions: "File sessioni",
        settingsStorageFieldSessionsBackup: "Backup sessioni",
        settingsStorageFieldLocalSettings: "File impostazioni locali",
        settingsStorageFieldGlobalSettings: "File impostazioni globali",
        settingsStorageFieldSessionCount: "Numero sessioni",
        settingsStorageFieldUpdatedAt: "Aggiornato il",
        settingsExportSessions: "Esporta sessioni",
        settingsExportSessionsDesc: "Salva uno snapshot in .workspace-plus-plus/exports.",
        settingsExportSessionsBtn: "Esporta",
        settingsImportSessions: "Importa sessioni",
        settingsImportSessionsDesc: "Importa lo snapshot pi\xF9 recente da .workspace-plus-plus/exports.",
        settingsImportSessionsBtn: "Importa ultimo",
        confirmImportSessions: "Importare le sessioni esportate pi\xF9 di recente? Le sessioni correnti saranno sostituite.",
        settingsResetSettings: "Reimposta impostazioni",
        settingsResetSettingsDesc: "Reimposta le impostazioni di Workspace++ ai valori predefiniti nell ambito corrente.",
        settingsResetSettingsBtn: "Reimposta impostazioni",
        confirmResetSettings: "Reimpostare le impostazioni di Workspace++ ai valori predefiniti?",
        resetSettingsDone: "Le impostazioni di Workspace++ sono state reimpostate.",
        resetSettingsFailed: "Impossibile reimpostare le impostazioni di Workspace++.",
        settingsResetSessionsAndSettings: "Reimposta sessioni e impostazioni",
        settingsResetSessionsAndSettingsDesc: "Reimposta insieme sessioni salvate e impostazioni di Workspace++.",
        settingsResetSessionsAndSettingsBtn: "Reimposta entrambe",
        confirmResetSessionsAndSettings: "Reimpostare sessioni e impostazioni? Questa azione non pu\xF2 essere annullata.",
        resetSessionsAndSettingsDone: "Sessioni e impostazioni sono state reimpostate.",
        resetSessionsAndSettingsFailed: "Impossibile reimpostare sessioni e impostazioni."
      },
      tr: {
        confirmOverwriteSessionWithCurrentLayout: function(n) {
          return '"' + n + '" ge\xE7erli d\xFCzenle \xFCzerine yaz\u0131ls\u0131n m\u0131?';
        },
        cmdSaveCurrentLayoutToSession: "Ge\xE7erli d\xFCzeni oturuma kaydet...",
        savedCurrentLayoutToSession: function(n) {
          return 'Ge\xE7erli d\xFCzen "' + n + '" oturumuna kaydedildi';
        },
        saveCurrentLayoutToSessionPlaceholder: "\xDCzerine yaz\u0131lacak oturumu se\xE7...",
        contextSaveCurrentLayoutToThisSession: "Ge\xE7erli d\xFCzeni bu oturuma kaydet",
        cmdExportSessions: "Oturum anl\u0131k g\xF6r\xFCnt\xFCs\xFCn\xFC d\u0131\u015Fa aktar",
        cmdImportSessions: "En son oturum anl\u0131k g\xF6r\xFCnt\xFCs\xFCn\xFC i\xE7e aktar",
        cmdReloadCurrentWithoutSaving: "Ge\xE7erli oturumu yeniden y\xFCkle (kaydetmeden)",
        reloadedSession: function(n) {
          return "\u201C" + n + "\u201D oturumu yeniden y\xFCklendi";
        },
        defaultSessionName: "varsay\u0131lan",
        nameSessionTitle: "Oturum ad\u0131yla kaydet",
        nameSessionPlaceholder: "Oturum ad\u0131...",
        saveWithoutNaming: "Adland\u0131rmadan kaydet",
        sessionDataMigrated: "Workspace++: Oturum verileri .workspace-plus-plus/sessions.json konumuna ta\u015F\u0131nd\u0131.",
        sessionDataMigrationFailed: "Workspace++: Oturum verileri ta\u015F\u0131namad\u0131. Eski veriler korunuyor.",
        localSettingsEnabled: "Workspace++: Vault yerel ayarlar\u0131 etkinle\u015Ftirildi.",
        localSettingsDisabled: "Workspace++: Vault yerel ayarlar\u0131 devre d\u0131\u015F\u0131 b\u0131rak\u0131ld\u0131.",
        localSettingsCopied: "Workspace++: Genel ayarlar vault yerel ayarlar\u0131na kopyaland\u0131.",
        localSettingsLoadFailed: "Workspace++: Vault yerel ayarlar\u0131 y\xFCklenemedi. Genel ayarlar kullan\u0131lacak.",
        localSettingsOperationFailed: "Workspace++: Vault yerel ayarlar\u0131 g\xFCncellenemedi.",
        exportSessionsDone: function(path) {
          return "Workspace++: Oturumlar " + path + " konumuna d\u0131\u015Fa aktar\u0131ld\u0131";
        },
        exportSessionsFailed: "Workspace++: Oturumlar d\u0131\u015Fa aktar\u0131lamad\u0131.",
        importSessionsDone: function(path) {
          return "Workspace++: Oturumlar " + path + " konumundan i\xE7e aktar\u0131ld\u0131";
        },
        importSessionsNoFile: "Workspace++: .workspace-plus-plus/exports i\xE7inde d\u0131\u015Fa aktarma dosyas\u0131 bulunamad\u0131.",
        importSessionsFailed: "Workspace++: Oturumlar i\xE7e aktar\u0131lamad\u0131.",
        settingsSectionAdvanced: "Geli\u015Fmi\u015F",
        settingsSectionReset: "S\u0131f\u0131rla",
        settingsGitHubLink: "GitHub",
        settingsSectionSessionListSearch: "Oturum listesi ve arama",
        settingsSectionSwitchCommands: "Ge\xE7i\u015F komutlar\u0131",
        settingsSectionScrollSwitch: "Kayd\u0131rarak ge\xE7i\u015F",
        settingsSubsectionSwitchSaving: "Oturum de\u011Fi\u015Ftirirken kaydetme",
        settingsSubsectionAutoSaveMode: "Oturum otomatik kaydetme modu",
        settingsSubsectionSwitchCommands: "Oturum de\u011Fi\u015Ftirme komutlar\u0131",
        settingsSubsectionScrollSwitch: "Kayd\u0131rarak oturum de\u011Fi\u015Ftirme",
        settingsSubsectionSwitchPreview: "Oturum de\u011Fi\u015Ftirmeden \xF6nce \xF6nizleme",
        settingsStatusBarScrollPreset: "Kayd\u0131rma giri\u015Fi \xF6n ayar\u0131",
        settingsStatusBarScrollPresetDesc: "Ayg\u0131t\u0131n\u0131za uygun bir \xF6n ayar se\xE7in ya da de\u011Ferleri kendiniz ayarlamak i\xE7in \xD6zel se\xE7ene\u011Fine ge\xE7in.",
        settingsStatusBarScrollPresetTrackpad: "\u0130zleme d\xF6rtgeni",
        settingsStatusBarScrollPresetNotchedWheel: "Kademeli fare tekerle\u011Fi",
        settingsStatusBarScrollPresetFreeSpinWheel: "Serbest d\xF6nen fare tekerle\u011Fi",
        settingsStatusBarScrollPresetCustom: "\xD6zel",
        settingsStatusBarScrollModifier: "Gerekli de\u011Fi\u015Ftirici tu\u015F",
        settingsStatusBarScrollModifierDesc: "Durum \xE7ubu\u011Fu \xF6\u011Fesi \xFCzerinde kayd\u0131r\u0131rken hangi de\u011Fi\u015Ftirici tu\u015Fun bas\u0131l\u0131 tutulaca\u011F\u0131n\u0131 se\xE7in.",
        settingsStatusBarScrollModifierRecommended: platformLabel("Cmd veya Option", "Ctrl veya Alt"),
        settingsStatusBarScrollModifierNone: "Yok",
        settingsStatusBarScrollModifierModOnly: platformLabel("Yaln\u0131zca Cmd", "Yaln\u0131zca Ctrl"),
        settingsStatusBarScrollModifierAltOnly: platformLabel("Yaln\u0131zca Option", "Yaln\u0131zca Alt"),
        settingsStatusBarScrollModifierModOrAlt: platformLabel("Cmd veya Option", "Ctrl veya Alt"),
        settingsStatusBarScrollThreshold: "Hassasiyet e\u015Fi\u011Fi",
        settingsStatusBarScrollThresholdDesc: "De\u011Fer d\xFC\u015Ft\xFCk\xE7e ge\xE7i\u015F daha kolay tetiklenir. Yaln\u0131zca \xD6zel \xF6n ayarda kullan\u0131l\u0131r.",
        settingsStatusBarScrollCooldown: "Bekleme s\xFCresi",
        settingsStatusBarScrollCooldownDesc: "Kayd\u0131rmayla tetiklenen oturum ge\xE7i\u015Fleri aras\u0131ndaki en k\u0131sa s\xFCredir. Yaln\u0131zca \xD6zel \xF6n ayarda kullan\u0131l\u0131r.",
        settingsStatusBarScrollResetWindow: "Birikim s\u0131f\u0131rlama penceresi",
        settingsStatusBarScrollResetWindowDesc: "K\xFC\xE7\xFCk kayd\u0131rma farklar\u0131n\u0131n s\u0131f\u0131rlanmadan \xF6nce ne kadar s\xFCre biriktirilece\u011Fini belirler. Yaln\u0131zca \xD6zel \xF6n ayarda kullan\u0131l\u0131r.",
        settingsStatusBarScrollInvert: "Kayd\u0131rma y\xF6n\xFCn\xFC ters \xE7evir",
        settingsStatusBarScrollInvertDesc: "Durum \xE7ubu\u011Funda kayd\u0131rarak oturum de\u011Fi\u015Ftirirken \xF6nceki/sonraki y\xF6n\xFCn\xFC tersine \xE7evirir.",
        settingsUseLocalSettings: "Vault yerel ayarlar\u0131n\u0131 kullan",
        settingsUseLocalSettingsDesc: ".obsidian klas\xF6r\xFCn\xFC birden \xE7ok vault aras\u0131nda senkronize ediyorsan\u0131z (\xF6rne\u011Fin Settings Profiles ile) ve Workspace++ ayarlar\u0131n\u0131 vault baz\u0131nda farkl\u0131 tutmak istiyorsan\u0131z bunu a\xE7\u0131n.",
        settingsCopyGlobalToLocal: "Genel ayarlar\u0131 bu vaulta kopyala",
        settingsCopyGlobalToLocalDesc: "Vault yerel ayarlar\u0131n\u0131 mevcut genel ayarlarla \xFCzerine yazar.",
        settingsCopyGlobalToLocalBtn: "Kopyala",
        settingsResetLocalSettings: "Vault yerel ayarlar\u0131n\u0131 s\u0131f\u0131rla",
        settingsResetLocalSettingsDesc: "Vault yerel ayarlar\u0131n\u0131 genel ayarlara geri d\xF6nd\xFCr\xFCr.",
        settingsResetLocalSettingsBtn: "Yereli s\u0131f\u0131rla",
        settingsAdvancedStorageSubsection: "Depolama davran\u0131\u015F\u0131",
        settingsAdvancedTransferSubsection: "Veri aktar\u0131m\u0131",
        settingsDeveloperSection: "Geli\u015Ftirici ara\xE7lar\u0131",
        settingsStorageDiagnostics: "Depolama tan\u0131lama",
        settingsStorageDiagnosticsDesc: "Workspace++ taraf\u0131ndan \u015Fu anda kullan\u0131lan depolama ayr\u0131nt\u0131lar\u0131.",
        settingsStorageFieldSessions: "Oturum dosyas\u0131",
        settingsStorageFieldSessionsBackup: "Oturum yede\u011Fi",
        settingsStorageFieldLocalSettings: "Yerel ayar dosyas\u0131",
        settingsStorageFieldGlobalSettings: "Genel ayar dosyas\u0131",
        settingsStorageFieldSessionCount: "Oturum say\u0131s\u0131",
        settingsStorageFieldUpdatedAt: "G\xFCncellenme zaman\u0131",
        settingsExportSessions: "Oturumlar\u0131 d\u0131\u015Fa aktar",
        settingsExportSessionsDesc: "Bir anl\u0131k g\xF6r\xFCnt\xFCy\xFC .workspace-plus-plus/exports i\xE7ine kaydeder.",
        settingsExportSessionsBtn: "D\u0131\u015Fa aktar",
        settingsImportSessions: "Oturumlar\u0131 i\xE7e aktar",
        settingsImportSessionsDesc: ".workspace-plus-plus/exports i\xE7indeki en son anl\u0131k g\xF6r\xFCnt\xFCy\xFC i\xE7e aktar\u0131r.",
        settingsImportSessionsBtn: "En sonu i\xE7e aktar",
        confirmImportSessions: "En son d\u0131\u015Fa aktar\u0131lan oturumlar i\xE7e aktar\u0131ls\u0131n m\u0131? Mevcut oturumlar de\u011Fi\u015Ftirilecek.",
        settingsResetSettings: "Ayarlar\u0131 s\u0131f\u0131rla",
        settingsResetSettingsDesc: "Workspace++ ayarlar\u0131n\u0131 mevcut ayar kapsam\u0131nda varsay\u0131lanlara d\xF6nd\xFCr\xFCr.",
        settingsResetSettingsBtn: "Ayarlar\u0131 s\u0131f\u0131rla",
        confirmResetSettings: "Workspace++ ayarlar\u0131 varsay\u0131lana s\u0131f\u0131rlans\u0131n m\u0131?",
        resetSettingsDone: "Workspace++ ayarlar\u0131 s\u0131f\u0131rland\u0131.",
        resetSettingsFailed: "Workspace++ ayarlar\u0131 s\u0131f\u0131rlanamad\u0131.",
        settingsResetSessionsAndSettings: "Oturumlar\u0131 ve ayarlar\u0131 s\u0131f\u0131rla",
        settingsResetSessionsAndSettingsDesc: "Kaydedilmi\u015F oturumlar\u0131 ve Workspace++ ayarlar\u0131n\u0131 birlikte s\u0131f\u0131rlar.",
        settingsResetSessionsAndSettingsBtn: "\u0130kisini de s\u0131f\u0131rla",
        confirmResetSessionsAndSettings: "Oturumlar ve ayarlar s\u0131f\u0131rlans\u0131n m\u0131? Bu i\u015Flem geri al\u0131namaz.",
        resetSessionsAndSettingsDone: "Oturumlar ve ayarlar s\u0131f\u0131rland\u0131.",
        resetSessionsAndSettingsFailed: "Oturumlar ve ayarlar s\u0131f\u0131rlanamad\u0131."
      },
      id: {
        confirmOverwriteSessionWithCurrentLayout: function(n) {
          return 'Timpa "' + n + '" dengan tata letak saat ini?';
        },
        cmdSaveCurrentLayoutToSession: "Simpan tata letak saat ini ke sesi...",
        savedCurrentLayoutToSession: function(n) {
          return 'Tata letak saat ini disimpan ke "' + n + '"';
        },
        saveCurrentLayoutToSessionPlaceholder: "Pilih sesi untuk ditimpa...",
        contextSaveCurrentLayoutToThisSession: "Simpan tata letak saat ini ke sesi ini",
        cmdExportSessions: "Ekspor snapshot sesi",
        cmdImportSessions: "Impor snapshot sesi terbaru",
        cmdReloadCurrentWithoutSaving: "Muat ulang sesi saat ini (tanpa menyimpan)",
        reloadedSession: function(n) {
          return "Sesi \u201C" + n + "\u201D dimuat ulang";
        },
        defaultSessionName: "bawaan",
        nameSessionTitle: "Simpan dengan nama sesi",
        nameSessionPlaceholder: "Nama sesi...",
        saveWithoutNaming: "Simpan tanpa nama",
        sessionDataMigrated: "Workspace++: Data sesi dipindahkan ke .workspace-plus-plus/sessions.json.",
        sessionDataMigrationFailed: "Workspace++: Gagal memigrasikan data sesi. Data lama tetap disimpan.",
        localSettingsEnabled: "Workspace++: Pengaturan lokal vault diaktifkan.",
        localSettingsDisabled: "Workspace++: Pengaturan lokal vault dinonaktifkan.",
        localSettingsCopied: "Workspace++: Pengaturan global disalin ke pengaturan lokal vault.",
        localSettingsLoadFailed: "Workspace++: Gagal memuat pengaturan lokal vault. Pengaturan global akan digunakan.",
        localSettingsOperationFailed: "Workspace++: Gagal memperbarui pengaturan lokal vault.",
        exportSessionsDone: function(path) {
          return "Workspace++: Sesi diekspor ke " + path;
        },
        exportSessionsFailed: "Workspace++: Gagal mengekspor sesi.",
        importSessionsDone: function(path) {
          return "Workspace++: Sesi diimpor dari " + path;
        },
        importSessionsNoFile: "Workspace++: Tidak ada file ekspor di .workspace-plus-plus/exports.",
        importSessionsFailed: "Workspace++: Gagal mengimpor sesi.",
        settingsSectionAdvanced: "Lanjutan",
        settingsSectionReset: "Setel ulang",
        settingsGitHubLink: "GitHub",
        settingsSectionSessionListSearch: "Daftar dan pencarian sesi",
        settingsSectionSwitchCommands: "Perintah perpindahan",
        settingsSectionScrollSwitch: "Perpindahan dengan gulir",
        settingsSubsectionSwitchSaving: "Simpan saat berpindah sesi",
        settingsSubsectionAutoSaveMode: "Mode simpan otomatis sesi",
        settingsSubsectionSwitchCommands: "Perintah perpindahan sesi",
        settingsSubsectionScrollSwitch: "Ganti sesi dengan gulir",
        settingsSubsectionSwitchPreview: "Pratinjau sebelum berpindah sesi",
        settingsStatusBarScrollPreset: "Preset input gulir",
        settingsStatusBarScrollPresetDesc: "Pilih preset yang cocok untuk perangkat Anda, atau beralih ke Kustom untuk menyesuaikan nilainya sendiri.",
        settingsStatusBarScrollPresetTrackpad: "Trackpad",
        settingsStatusBarScrollPresetNotchedWheel: "Roda mouse bertakik",
        settingsStatusBarScrollPresetFreeSpinWheel: "Roda mouse putar bebas",
        settingsStatusBarScrollPresetCustom: "Kustom",
        settingsStatusBarScrollModifier: "Modifier yang diperlukan",
        settingsStatusBarScrollModifierDesc: "Pilih modifier yang harus ditekan saat menggulir pada item bilah status.",
        settingsStatusBarScrollModifierRecommended: platformLabel("Cmd atau Option", "Ctrl atau Alt"),
        settingsStatusBarScrollModifierNone: "Tidak ada",
        settingsStatusBarScrollModifierModOnly: platformLabel("Hanya Cmd", "Hanya Ctrl"),
        settingsStatusBarScrollModifierAltOnly: platformLabel("Hanya Option", "Hanya Alt"),
        settingsStatusBarScrollModifierModOrAlt: platformLabel("Cmd atau Option", "Ctrl atau Alt"),
        settingsStatusBarScrollThreshold: "Ambang sensitivitas",
        settingsStatusBarScrollThresholdDesc: "Semakin kecil nilainya, semakin mudah pergantian terjadi. Hanya digunakan saat preset Kustom dipilih.",
        settingsStatusBarScrollCooldown: "Jeda",
        settingsStatusBarScrollCooldownDesc: "Waktu minimum antarpergantian sesi yang dipicu oleh gulir. Hanya digunakan saat preset Kustom dipilih.",
        settingsStatusBarScrollResetWindow: "Jendela reset akumulasi",
        settingsStatusBarScrollResetWindowDesc: "Berapa lama delta gulir kecil tetap digabungkan sebelum direset. Hanya digunakan saat preset Kustom dipilih.",
        settingsStatusBarScrollInvert: "Balik arah gulir",
        settingsStatusBarScrollInvertDesc: "Membalik arah sebelumnya/berikutnya untuk pergantian sesi lewat gulir pada bilah status.",
        settingsUseLocalSettings: "Gunakan pengaturan lokal vault",
        settingsUseLocalSettingsDesc: "Aktifkan ini jika Anda menyinkronkan .obsidian di beberapa vault (misalnya dengan Settings Profiles) dan ingin pengaturan Workspace++ tetap berbeda per vault.",
        settingsCopyGlobalToLocal: "Salin pengaturan global ke vault ini",
        settingsCopyGlobalToLocalDesc: "Timpa pengaturan lokal vault dengan pengaturan global saat ini.",
        settingsCopyGlobalToLocalBtn: "Salin",
        settingsResetLocalSettings: "Setel ulang pengaturan lokal vault",
        settingsResetLocalSettingsDesc: "Kembalikan pengaturan lokal vault ke pengaturan global.",
        settingsResetLocalSettingsBtn: "Setel ulang lokal",
        settingsAdvancedStorageSubsection: "Perilaku penyimpanan",
        settingsAdvancedTransferSubsection: "Transfer data",
        settingsDeveloperSection: "Alat pengembang",
        settingsStorageDiagnostics: "Diagnostik penyimpanan",
        settingsStorageDiagnosticsDesc: "Detail penyimpanan yang saat ini dipakai oleh Workspace++.",
        settingsStorageFieldSessions: "Berkas sesi",
        settingsStorageFieldSessionsBackup: "Cadangan sesi",
        settingsStorageFieldLocalSettings: "Berkas pengaturan lokal",
        settingsStorageFieldGlobalSettings: "Berkas pengaturan global",
        settingsStorageFieldSessionCount: "Jumlah sesi",
        settingsStorageFieldUpdatedAt: "Diperbarui pada",
        settingsExportSessions: "Ekspor sesi",
        settingsExportSessionsDesc: "Simpan snapshot ke .workspace-plus-plus/exports.",
        settingsExportSessionsBtn: "Ekspor",
        settingsImportSessions: "Impor sesi",
        settingsImportSessionsDesc: "Impor snapshot terbaru dari .workspace-plus-plus/exports.",
        settingsImportSessionsBtn: "Impor terbaru",
        confirmImportSessions: "Impor sesi hasil ekspor terbaru? Sesi saat ini akan diganti.",
        settingsResetSettings: "Setel ulang pengaturan",
        settingsResetSettingsDesc: "Mengembalikan pengaturan Workspace++ ke nilai bawaan pada cakupan pengaturan saat ini.",
        settingsResetSettingsBtn: "Setel ulang pengaturan",
        confirmResetSettings: "Setel ulang pengaturan Workspace++ ke bawaan?",
        resetSettingsDone: "Pengaturan Workspace++ telah disetel ulang.",
        resetSettingsFailed: "Gagal menyetel ulang pengaturan Workspace++.",
        settingsResetSessionsAndSettings: "Setel ulang sesi dan pengaturan",
        settingsResetSessionsAndSettingsDesc: "Setel ulang sesi tersimpan dan pengaturan Workspace++ sekaligus.",
        settingsResetSessionsAndSettingsBtn: "Setel ulang keduanya",
        confirmResetSessionsAndSettings: "Setel ulang sesi dan pengaturan? Tindakan ini tidak dapat dibatalkan.",
        resetSessionsAndSettingsDone: "Sesi dan pengaturan telah disetel ulang.",
        resetSessionsAndSettingsFailed: "Gagal menyetel ulang sesi dan pengaturan."
      }
    };
    var extendedLangs = Object.keys(EXTENDED_STRINGS);
    for (extendedLangIndex = 0; extendedLangIndex < extendedLangs.length; extendedLangIndex++) {
      extendedLang = extendedLangs[extendedLangIndex];
      if (!STRINGS[extendedLang]) continue;
      extendedKeys = Object.keys(EXTENDED_STRINGS[extendedLang]);
      for (extendedKeyIndex = 0; extendedKeyIndex < extendedKeys.length; extendedKeyIndex++) {
        extendedKey = extendedKeys[extendedKeyIndex];
        if (STRINGS[extendedLang][extendedKey] === void 0) {
          STRINGS[extendedLang][extendedKey] = EXTENDED_STRINGS[extendedLang][extendedKey];
        }
      }
    }
    var extendedLang;
    var extendedKeys;
    var extendedKey;
    var extendedKeyIndex;
    var extendedLangIndex;
    var LANG_OPTIONS = {
      en: "English",
      zh: "\u7B80\u4F53\u4E2D\u6587",
      "zh-TW": "\u7E41\u9AD4\u4E2D\u6587",
      es: "Espa\xF1ol",
      fr: "Fran\xE7ais",
      ar: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629",
      pt: "Portugu\xEAs",
      ru: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439",
      de: "Deutsch",
      ja: "\u65E5\u672C\u8A9E",
      ko: "\uD55C\uAD6D\uC5B4",
      it: "Italiano",
      tr: "T\xFCrk\xE7e",
      id: "Bahasa Indonesia",
      vi: "Ti\u1EBFng Vi\u1EC7t",
      th: "\u0E44\u0E17\u0E22"
    };
    var LANG_ORDER = [
      "en",
      "zh",
      "zh-TW",
      "ja",
      "ko",
      "es",
      "fr",
      "ar",
      "pt",
      "ru",
      "de",
      "it",
      "tr",
      "id",
      "vi",
      "th"
    ];
    exports2.LANG_OPTIONS = LANG_OPTIONS;
    exports2.LANG_ORDER = LANG_ORDER;
    exports2.resolveLocale = function(override) {
      var lang = override && override !== "auto" ? override : navigator.language || "";
      var key = lang.slice(0, 2);
      if (key === "zh") {
        key = /TW|HK|Hant/i.test(lang) ? "zh-TW" : "zh";
      }
      var L = STRINGS[key] || STRINGS.en;
      if (L !== STRINGS.en) {
        var keys = Object.keys(STRINGS.en);
        for (var i = 0; i < keys.length; i++) {
          if (L[keys[i]] === void 0) L[keys[i]] = STRINGS.en[keys[i]];
        }
      }
      exports2.L = L;
      return L;
    };
  }
});

// src/modals/confirm-modal.js
var require_confirm_modal = __commonJS({
  "src/modals/confirm-modal.js"(exports2, module2) {
    "use strict";
    var obsidian2 = require("obsidian");
    var i18n2 = require_i18n();
    var ConfirmModal = (
      /** @class */
      function(_super) {
        function ConfirmModal2(app, message, onConfirm, options) {
          var _this = _super.call(this, app) || this;
          _this.message = message;
          _this.onConfirm = onConfirm;
          _this.options = options || {};
          return _this;
        }
        ConfirmModal2.prototype = Object.create(_super.prototype);
        ConfirmModal2.prototype.constructor = ConfirmModal2;
        ConfirmModal2.prototype.onOpen = function() {
          var L = i18n2.L;
          this.containerEl.style.zIndex = "10001";
          var contentEl = this.contentEl;
          contentEl.createEl("p", { text: this.message });
          var btns = contentEl.createDiv({ cls: "wpp-confirm-buttons" });
          var self = this;
          var cancelBtn = btns.createEl("button", { text: L.cancel });
          cancelBtn.addEventListener("click", function() {
            self.close();
          });
          var confirmText = this.options.confirmText || L.delete;
          var confirmClass = this.options.confirmClass || "mod-warning";
          var confirmBtn = btns.createEl("button", { text: confirmText, cls: confirmClass });
          confirmBtn.addEventListener("click", function() {
            self.onConfirm();
            self.close();
          });
          if (this.options.hint) {
            var hintEl = contentEl.createDiv({ cls: "wpp-confirm-hint" });
            var hintLink = hintEl.createEl("a", { text: this.options.hint });
            hintLink.addEventListener("click", function(e) {
              e.preventDefault();
              self.close();
              if (self.options.onHintClick) self.options.onHintClick();
            });
          }
          this.buttons = [cancelBtn, confirmBtn];
          this.focusedButtonIndex = 1;
          this.updateButtonFocus();
          this.confirmKeyHandler = function(e) {
            if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
              e.preventDefault();
              self.focusedButtonIndex = 0;
              self.updateButtonFocus();
            } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
              e.preventDefault();
              self.focusedButtonIndex = 1;
              self.updateButtonFocus();
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (self.focusedButtonIndex === 0) {
                self.close();
              } else {
                self.onConfirm();
                self.close();
              }
            } else if (e.key === "Escape") {
              e.preventDefault();
              e.stopImmediatePropagation();
              self.close();
            }
          };
          document.addEventListener("keydown", this.confirmKeyHandler, true);
        };
        ConfirmModal2.prototype.updateButtonFocus = function() {
          var self = this;
          this.buttons.forEach(function(btn, i) {
            btn.classList.toggle("wpp-btn-focused", i === self.focusedButtonIndex);
          });
        };
        ConfirmModal2.prototype.onClose = function() {
          if (this.confirmKeyHandler) {
            document.removeEventListener("keydown", this.confirmKeyHandler, true);
            this.confirmKeyHandler = null;
          }
          this.contentEl.empty();
        };
        return ConfirmModal2;
      }(obsidian2.Modal)
    );
    module2.exports = ConfirmModal;
  }
});

// src/modals/history-modal.js
var require_history_modal = __commonJS({
  "src/modals/history-modal.js"(exports2, module2) {
    "use strict";
    var obsidian2 = require("obsidian");
    var i18n2 = require_i18n();
    var ConfirmModal = require_confirm_modal();
    var DAY = 864e5;
    var HistoryModal = (
      /** @class */
      function(_super) {
        function HistoryModal2(app, plugin, session) {
          var _this = _super.call(this, app) || this;
          _this.plugin = plugin;
          _this.session = session;
          return _this;
        }
        HistoryModal2.prototype = Object.create(_super.prototype);
        HistoryModal2.prototype.constructor = HistoryModal2;
        HistoryModal2.prototype.onOpen = function() {
          var L = i18n2.L;
          var self = this;
          var contentEl = this.contentEl;
          contentEl.empty();
          contentEl.addClass("wpp-modal", "wpp-history-modal");
          this.titleEl.setText(L.historyTitle + " \u2014 " + self.session.name);
          var history = self.session.history || [];
          if (history.length === 0) {
            contentEl.createEl("p", { text: L.historyEmpty, cls: "wpp-history-empty" });
            return;
          }
          var groups = self.groupByDate(history);
          var listEl = contentEl.createDiv({ cls: "wpp-history-list" });
          for (var gi = 0; gi < groups.length; gi++) {
            var group = groups[gi];
            listEl.createEl("h4", { text: group.label, cls: "wpp-history-date-label" });
            for (var ei = 0; ei < group.entries.length; ei++) {
              self.renderEntry(listEl, group.entries[ei], group.indices[ei]);
            }
          }
        };
        HistoryModal2.prototype.renderEntry = function(listEl, entry, originalIndex) {
          var L = i18n2.L;
          var self = this;
          var itemEl = listEl.createDiv({ cls: "wpp-history-item" });
          var infoEl = itemEl.createDiv({ cls: "wpp-history-info" });
          var time = new Date(entry.savedAt);
          var timeStr = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          infoEl.createDiv({ text: timeStr, cls: "wpp-history-time" });
          var filePaths = self.plugin.extractFilePathsFromLayout(entry.layout);
          var paneCount = self.plugin.countPanesInLayout(entry.layout);
          var fileNames = filePaths.map(function(p) {
            var parts = p.split("/");
            return parts[parts.length - 1];
          });
          var summary = L.historyPanes(paneCount);
          if (fileNames.length > 0) {
            var displayNames = fileNames.slice(0, 5).join(", ");
            if (fileNames.length > 5) displayNames += " ...";
            summary += " \xB7 " + displayNames;
          }
          infoEl.createDiv({ text: summary, cls: "wpp-history-summary" });
          var btnEl = itemEl.createEl("button", {
            text: L.historyRestore,
            cls: "wpp-history-restore-btn"
          });
          btnEl.addEventListener("click", function() {
            var doRestore = function() {
              self.plugin.restoreFromHistoryEntry(
                self.session.id,
                originalIndex
              ).then(function(ok) {
                if (ok) {
                  new obsidian2.Notice(L.historyRestored(self.session.name));
                }
                self.close();
              });
            };
            if (self.plugin.isVersionHistoryConfirmRestoreEnabled()) {
              new ConfirmModal(
                self.app,
                L.historyRestoreConfirm(self.session.name, timeStr),
                doRestore,
                { confirmText: L.historyRestore, confirmClass: "mod-cta" }
              ).open();
            } else {
              doRestore();
            }
          });
        };
        HistoryModal2.prototype.groupByDate = function(history) {
          var L = i18n2.L;
          var now = /* @__PURE__ */ new Date();
          var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          var yesterdayStart = todayStart - DAY;
          var weekStart = todayStart - 6 * DAY;
          var groups = {};
          var groupOrder = [];
          for (var i = 0; i < history.length; i++) {
            var entry = history[i];
            var t = entry.savedAt;
            var label;
            if (t >= todayStart) {
              label = L.historyToday;
            } else if (t >= yesterdayStart) {
              label = L.historyYesterday;
            } else if (t >= weekStart) {
              label = L.historyThisWeek;
            } else {
              var d = new Date(t);
              label = d.toLocaleDateString();
            }
            if (!groups[label]) {
              groups[label] = { label, entries: [], indices: [] };
              groupOrder.push(label);
            }
            groups[label].entries.push(entry);
            groups[label].indices.push(i);
          }
          return groupOrder.map(function(k) {
            return groups[k];
          });
        };
        HistoryModal2.prototype.onClose = function() {
          this.contentEl.empty();
        };
        return HistoryModal2;
      }(obsidian2.Modal)
    );
    module2.exports = HistoryModal;
  }
});

// src/modals/format-relative-time.js
var require_format_relative_time = __commonJS({
  "src/modals/format-relative-time.js"(exports2, module2) {
    "use strict";
    var i18n2 = require_i18n();
    function formatRelativeTime(timestamp) {
      var L = i18n2.L;
      var diff = Date.now() - timestamp;
      var minutes = Math.floor(diff / 6e4);
      var hours = Math.floor(diff / 36e5);
      var days = Math.floor(diff / 864e5);
      if (minutes < 1) return L.modifiedJustNow;
      if (minutes < 60) return L.modifiedMinutes(minutes);
      if (hours < 24) return L.modifiedHours(hours);
      return L.modifiedDays(days);
    }
    module2.exports = formatRelativeTime;
  }
});

// src/modals/rename-modal.js
var require_rename_modal = __commonJS({
  "src/modals/rename-modal.js"(exports2, module2) {
    "use strict";
    var obsidian2 = require("obsidian");
    var i18n2 = require_i18n();
    var RenameModal = (
      /** @class */
      function(_super) {
        function RenameModal2(app, currentName, onRename, options) {
          var _this = _super.call(this, app) || this;
          _this.currentName = currentName;
          _this.onRename = onRename;
          _this.modalOptions = options || {};
          return _this;
        }
        RenameModal2.prototype = Object.create(_super.prototype);
        RenameModal2.prototype.constructor = RenameModal2;
        RenameModal2.prototype.onOpen = function() {
          var L = i18n2.L;
          var contentEl = this.contentEl;
          var self = this;
          var opts = this.modalOptions;
          this.titleEl.setText(opts.title || L.renameTitle);
          var input = contentEl.createEl("input", {
            type: "text",
            value: this.currentName,
            placeholder: opts.placeholder || L.renamePlaceholder,
            cls: "wpp-rename-input"
          });
          input.select();
          var btns = contentEl.createDiv({ cls: "wpp-confirm-buttons" });
          var cancelBtn = btns.createEl("button", { text: L.cancel });
          cancelBtn.addEventListener("click", function() {
            self.close();
          });
          var skipBtn = null;
          if (opts.skipButtonText && opts.onSkip) {
            skipBtn = btns.createEl("button", { text: opts.skipButtonText });
            skipBtn.addEventListener("click", function() {
              opts.onSkip();
              self.close();
            });
          }
          var renameBtn = btns.createEl("button", { text: opts.buttonText || L.rename, cls: "mod-cta" });
          var doRename = function() {
            var newName = input.value.trim();
            if (!newName) {
              if (opts.onSkip) {
                opts.onSkip();
                self.close();
                return;
              }
              if (opts.emptyNotice) {
                new obsidian2.Notice(opts.emptyNotice);
              }
              return;
            }
            if (newName === self.currentName) return;
            self.onRename(newName);
            self.close();
          };
          renameBtn.addEventListener("click", doRename);
          this.buttons = skipBtn ? [cancelBtn, skipBtn, renameBtn] : [cancelBtn, renameBtn];
          var lastBtnIdx = this.buttons.length - 1;
          this.focusedButtonIndex = -1;
          this.renameKeyHandler = function(e) {
            if (e.isComposing) return;
            if (self.focusedButtonIndex === -1) {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                self.focusedButtonIndex = lastBtnIdx;
                self.updateRenameBtnFocus();
                input.blur();
              } else if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                doRename();
              } else if (e.key === "Escape") {
                e.preventDefault();
                e.stopImmediatePropagation();
                self.close();
              }
            } else {
              if (e.key === "ArrowUp") {
                e.preventDefault();
                self.focusedButtonIndex = -1;
                self.updateRenameBtnFocus();
                input.focus();
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                if (self.focusedButtonIndex > 0) {
                  self.focusedButtonIndex--;
                } else {
                  self.focusedButtonIndex = -1;
                  self.updateRenameBtnFocus();
                  input.focus();
                  return;
                }
                self.updateRenameBtnFocus();
              } else if (e.key === "ArrowRight") {
                e.preventDefault();
                if (self.focusedButtonIndex < lastBtnIdx) {
                  self.focusedButtonIndex++;
                  self.updateRenameBtnFocus();
                }
              } else if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                self.buttons[self.focusedButtonIndex].click();
              } else if (e.key === "Escape") {
                e.preventDefault();
                e.stopImmediatePropagation();
                self.close();
              }
            }
          };
          document.addEventListener("keydown", this.renameKeyHandler, true);
          setTimeout(function() {
            input.focus();
          }, 50);
        };
        RenameModal2.prototype.updateRenameBtnFocus = function() {
          var self = this;
          this.buttons.forEach(function(btn, i) {
            btn.classList.toggle("wpp-btn-focused", i === self.focusedButtonIndex);
          });
        };
        RenameModal2.prototype.onClose = function() {
          if (this.renameKeyHandler) {
            document.removeEventListener("keydown", this.renameKeyHandler, true);
            this.renameKeyHandler = null;
          }
          this.contentEl.empty();
        };
        return RenameModal2;
      }(obsidian2.Modal)
    );
    module2.exports = RenameModal;
  }
});

// src/group-tab-ui.js
var require_group_tab_ui = __commonJS({
  "src/group-tab-ui.js"(exports2, module2) {
    "use strict";
    var obsidian2 = require("obsidian");
    var i18n2 = require_i18n();
    var ConfirmModal = require_confirm_modal();
    var RenameModal = require_rename_modal();
    function openCreateGroupPrompt(app, plugin, onCreated) {
      var L = i18n2.L;
      new RenameModal(app, "", function(name) {
        plugin.createGroupValidated(name).then(function(created) {
          if (!created) return;
          if (typeof onCreated === "function") onCreated();
        });
      }, {
        title: L.groupCreateNew,
        placeholder: L.groupCreatePlaceholder,
        buttonText: L.save,
        emptyNotice: L.groupEmptyName
      }).open();
    }
    function openRenameGroupPrompt(app, plugin, group, onRenamed) {
      var L = i18n2.L;
      new RenameModal(app, group.name, function(newName) {
        plugin.renameGroupValidated(group.id, newName).then(function(renamed) {
          if (!renamed) return;
          if (typeof onRenamed === "function") onRenamed();
        });
      }, {
        title: L.groupContextRename,
        emptyNotice: L.groupEmptyName
      }).open();
    }
    function attachGroupTabDrag(tabEl, tabsContainerEl, options) {
      options = options || {};
      tabEl.addEventListener("mousedown", function(e) {
        if (e.button !== 0) return;
        if (options.stopPropagationOnMouseDown) {
          e.stopPropagation();
        }
        var startX = e.clientX;
        var dragStarted = false;
        var cloneEl = null;
        function startDrag(ev) {
          dragStarted = true;
          var rect = tabEl.getBoundingClientRect();
          cloneEl = tabEl.cloneNode(true);
          cloneEl.classList.add("wpp-drag-clone");
          cloneEl.style.position = "fixed";
          cloneEl.style.width = rect.width + "px";
          cloneEl.style.height = rect.height + "px";
          cloneEl.style.top = rect.top + "px";
          cloneEl.style.left = ev.clientX - (startX - rect.left) + "px";
          cloneEl.style.zIndex = "10000";
          cloneEl.style.pointerEvents = "none";
          document.body.appendChild(cloneEl);
          tabEl.classList.add("is-dragging");
          cloneEl._offsetX = startX - rect.left;
        }
        function onMove(ev) {
          if (!dragStarted) {
            if (Math.abs(ev.clientX - startX) < 5) return;
            startDrag(ev);
          }
          cloneEl.style.left = ev.clientX - cloneEl._offsetX + "px";
          var tabs = tabsContainerEl.querySelectorAll(".wpp-group-tab");
          var placed = false;
          for (var ti = 0; ti < tabs.length; ti++) {
            var sibling = tabs[ti];
            if (sibling === tabEl) continue;
            var r = sibling.getBoundingClientRect();
            if (ev.clientX < r.left + r.width / 2) {
              tabsContainerEl.insertBefore(tabEl, sibling);
              placed = true;
              break;
            }
          }
          if (!placed) {
            var addBtnEl = tabsContainerEl.querySelector(".wpp-group-add-btn");
            if (addBtnEl) {
              tabsContainerEl.insertBefore(tabEl, addBtnEl);
            } else {
              tabsContainerEl.appendChild(tabEl);
            }
          }
        }
        function onUp() {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
          if (!dragStarted) return;
          cloneEl.remove();
          tabEl.classList.remove("is-dragging");
          var tabs = tabsContainerEl.querySelectorAll(".wpp-group-tab");
          var newOrder = [];
          for (var ti = 0; ti < tabs.length; ti++) {
            newOrder.push(tabs[ti].dataset.groupId);
          }
          if (typeof options.onCommit === "function") {
            options.onCommit(newOrder);
          }
        }
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      });
    }
    function renderGroupTabs(options) {
      var L = i18n2.L;
      options = options || {};
      var plugin = options.plugin;
      var containerEl = options.containerEl;
      if (!plugin || !containerEl) return;
      while (containerEl.firstChild) containerEl.removeChild(containerEl.firstChild);
      var app = options.app || plugin.app;
      var groups = options.groups || plugin.data.groups || {};
      var groupOrder = options.groupOrder || plugin.getOrderedGroupTabIds();
      var selectedGroupId = options.selectedGroupId || null;
      function setupGroupTabDrag(tabEl) {
        if (!options.onGroupOrderCommit) return;
        attachGroupTabDrag(tabEl, containerEl, {
          stopPropagationOnMouseDown: !!options.stopPropagationOnMouseDown,
          onCommit: function(newOrder) {
            options.onGroupOrderCommit(newOrder);
          }
        });
      }
      for (var gi = 0; gi < groupOrder.length; gi++) {
        var gid = groupOrder[gi];
        if (gid === "__all__") {
          var allTab = document.createElement("div");
          allTab.className = "wpp-group-tab";
          allTab.dataset.groupId = "__all__";
          if (!selectedGroupId) allTab.classList.add("is-active");
          allTab.textContent = L.groupAll;
          allTab.addEventListener("click", function() {
            if (typeof options.onSelectGroup === "function") {
              options.onSelectGroup(null);
            }
          });
          allTab.addEventListener("contextmenu", function(e) {
            e.preventDefault();
            openAllGroupsTabContextMenu({
              app,
              plugin,
              event: e,
              onResetViewGroup: options.onResetViewGroup,
              onGroupsChanged: options.onGroupsChanged,
              onSessionsChanged: options.onSessionsChanged
            });
          });
          setupGroupTabDrag(allTab);
          containerEl.appendChild(allTab);
          continue;
        }
        var group = groups[gid];
        if (!group) continue;
        (function(currentGroup) {
          var tab = document.createElement("div");
          tab.className = "wpp-group-tab";
          tab.dataset.groupId = currentGroup.id;
          if (selectedGroupId === currentGroup.id) tab.classList.add("is-active");
          tab.textContent = currentGroup.name;
          tab.addEventListener("click", function() {
            if (typeof options.onSelectGroup === "function") {
              options.onSelectGroup(currentGroup.id);
            }
          });
          tab.addEventListener("contextmenu", function(e) {
            e.preventDefault();
            openGroupTabContextMenu({
              app,
              plugin,
              event: e,
              group: currentGroup,
              onDeleteGroup: options.onDeleteGroup,
              onGroupsChanged: options.onGroupsChanged,
              onSessionsChanged: options.onSessionsChanged
            });
          });
          setupGroupTabDrag(tab);
          containerEl.appendChild(tab);
        })(group);
      }
      var addBtn = document.createElement("div");
      addBtn.className = "wpp-group-add-btn";
      obsidian2.setIcon(addBtn, "plus");
      if (options.addButtonTooltip) {
        obsidian2.setTooltip(addBtn, options.addButtonTooltip, {
          placement: options.addButtonTooltipPlacement || "bottom",
          delay: options.addButtonTooltipDelay || 250
        });
      }
      addBtn.addEventListener("click", function() {
        if (typeof options.onAddGroupClick === "function") {
          options.onAddGroupClick();
          return;
        }
        openCreateGroupPrompt(app, plugin, options.onGroupsChanged);
      });
      containerEl.appendChild(addBtn);
    }
    function openAllGroupsTabContextMenu(options) {
      var L = i18n2.L;
      options = options || {};
      var plugin = options.plugin;
      var app = options.app || (plugin ? plugin.app : null);
      if (!plugin || !app) return;
      var menu = new obsidian2.Menu();
      menu.addItem(function(mi) {
        mi.setTitle(L.groupCreateNew);
        mi.setIcon("plus");
        mi.onClick(function() {
          openCreateGroupPrompt(app, plugin, options.onGroupsChanged);
        });
      });
      var allGroups = plugin.getOrderedGroups();
      if (allGroups.length > 0) {
        menu.addSeparator();
        menu.addItem(function(mi) {
          mi.setTitle(L.contextDeleteAllGroups);
          mi.setIcon("folder-x");
          mi.setSection("danger");
          mi.onClick(function() {
            new ConfirmModal(app, L.confirmDeleteAllGroups(allGroups.length), function() {
              return plugin.clearAllGroups().then(function() {
                if (typeof options.onResetViewGroup === "function") {
                  options.onResetViewGroup();
                }
                new obsidian2.Notice(L.deletedAllGroups(allGroups.length));
                if (typeof options.onGroupsChanged === "function") {
                  options.onGroupsChanged();
                }
                if (typeof options.onSessionsChanged === "function") {
                  options.onSessionsChanged();
                }
              });
            }).open();
          });
        });
      }
      var sessionCount = Object.keys(plugin.data.sessions || {}).length;
      if (sessionCount > 1) {
        if (allGroups.length === 0) menu.addSeparator();
        menu.addItem(function(mi) {
          mi.setTitle(L.contextDeleteAllSessions);
          mi.setIcon("trash-2");
          mi.setSection("danger");
          mi.onClick(function() {
            new ConfirmModal(app, L.confirmDeleteAllSessions(sessionCount - 1), function() {
              return plugin.deleteAllInactiveSessions().then(function(deletedCount) {
                if (typeof options.onGroupsChanged === "function") {
                  options.onGroupsChanged();
                }
                if (typeof options.onSessionsChanged === "function") {
                  options.onSessionsChanged();
                }
                if (deletedCount > 0) {
                  new obsidian2.Notice(L.deletedAllSessions(deletedCount));
                }
              });
            }).open();
          });
        });
      }
      if (options.event) {
        menu.showAtMouseEvent(options.event);
      }
    }
    function openGroupTabContextMenu(options) {
      var L = i18n2.L;
      options = options || {};
      var plugin = options.plugin;
      var app = options.app || (plugin ? plugin.app : null);
      var group = options.group;
      if (!plugin || !app || !group) return;
      var menu = new obsidian2.Menu();
      menu.addItem(function(mi) {
        mi.setTitle(L.groupContextRename);
        mi.setIcon("pencil");
        mi.onClick(function() {
          openRenameGroupPrompt(app, plugin, group, options.onGroupsChanged);
        });
      });
      var groupSessionIds = plugin.getGroupSessionIds(group.id);
      if (groupSessionIds.length > 0) {
        menu.addItem(function(mi) {
          mi.setTitle(L.groupRemoveAllSessions);
          mi.setIcon("log-out");
          mi.onClick(function() {
            new ConfirmModal(app, L.confirmRemoveAllFromGroup(group.name, groupSessionIds.length), function() {
              return plugin.removeAllSessionsFromGroup(group.id).then(function() {
                new obsidian2.Notice(L.groupRemovedAllSessions(group.name));
                if (typeof options.onGroupsChanged === "function") {
                  options.onGroupsChanged();
                }
                if (typeof options.onSessionsChanged === "function") {
                  options.onSessionsChanged();
                }
              });
            }, {
              confirmText: L.remove,
              confirmClass: "mod-cta"
            }).open();
          });
        });
      }
      menu.addSeparator();
      menu.addItem(function(mi) {
        mi.setTitle(L.groupContextDelete);
        mi.setIcon("trash-2");
        mi.setSection("danger");
        mi.onClick(function() {
          new ConfirmModal(app, L.confirmDeleteGroup(group.name), function() {
            return plugin.deleteGroup(group.id).then(function() {
              if (typeof options.onDeleteGroup === "function") {
                options.onDeleteGroup(group.id);
              }
              if (typeof options.onGroupsChanged === "function") {
                options.onGroupsChanged();
              }
              if (typeof options.onSessionsChanged === "function") {
                options.onSessionsChanged();
              }
            });
          }).open();
        });
      });
      if (options.event) {
        menu.showAtMouseEvent(options.event);
      }
    }
    module2.exports = {
      attachGroupTabDrag,
      openAllGroupsTabContextMenu,
      openCreateGroupPrompt,
      openGroupTabContextMenu,
      renderGroupTabs
    };
  }
});

// src/navigation-utils.js
var require_navigation_utils = __commonJS({
  "src/navigation-utils.js"(exports2, module2) {
    "use strict";
    function focusTextInputEnd(inputEl) {
      if (!inputEl || !inputEl.focus) return;
      inputEl.focus();
      if (typeof inputEl.setSelectionRange === "function") {
        var value = typeof inputEl.value === "string" ? inputEl.value : "";
        inputEl.setSelectionRange(value.length, value.length);
      }
    }
    function focusTextInputSelect(inputEl) {
      if (!inputEl || !inputEl.focus) return;
      inputEl.focus();
      if (typeof inputEl.select === "function") {
        inputEl.select();
      }
    }
    function isTextInputCursorAtEnd(inputEl) {
      if (!inputEl) return false;
      if (typeof inputEl.selectionStart !== "number" || typeof inputEl.selectionEnd !== "number") return false;
      var value = typeof inputEl.value === "string" ? inputEl.value : "";
      return inputEl.selectionStart === value.length && inputEl.selectionEnd === value.length;
    }
    function getScopedControlEl(containerEl, activeEl) {
      if (!activeEl || !containerEl || !containerEl.contains(activeEl)) return activeEl;
      if (!activeEl.closest) return activeEl;
      var controlEl = activeEl.closest("button, .wpp-icon-btn, input, select, textarea, a");
      if (controlEl && containerEl.contains(controlEl)) return controlEl;
      return activeEl;
    }
    module2.exports = {
      focusTextInputEnd,
      focusTextInputSelect,
      isTextInputCursorAtEnd,
      getScopedControlEl
    };
  }
});

// src/utils.js
var require_utils = __commonJS({
  "src/utils.js"(exports2) {
    "use strict";
    function generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
    }
    function isMacPlatform() {
      return typeof navigator !== "undefined" && typeof navigator.platform === "string" && navigator.platform.indexOf("Mac") !== -1;
    }
    function isModPressed(e) {
      if (!e) return false;
      return isMacPlatform() ? !!e.metaKey : !!e.ctrlKey;
    }
    function isModShiftPressed(e) {
      return isModPressed(e) && !!(e && e.shiftKey);
    }
    exports2.generateId = generateId;
    exports2.isMacPlatform = isMacPlatform;
    exports2.isModPressed = isModPressed;
    exports2.isModShiftPressed = isModShiftPressed;
  }
});

// src/session-context-menu.js
var require_session_context_menu = __commonJS({
  "src/session-context-menu.js"(exports2, module2) {
    "use strict";
    var obsidian2 = require("obsidian");
    var i18n2 = require_i18n();
    function openSessionContextMenu(options) {
      var L = i18n2.L;
      options = options || {};
      var plugin = options.plugin;
      var app = options.app || (plugin ? plugin.app : null);
      var session = options.session;
      if (!plugin || !app || !session) return;
      var isActive = !!options.isActive;
      var manualSaveMode = !plugin.isAutoSaveOnSwitchEnabled();
      var showOverwriteWithCurrentLayout = !isActive && manualSaveMode && typeof options.onOverwriteWithCurrentLayout === "function";
      var menu = new obsidian2.Menu();
      var addedSaveGroup = false;
      if (isActive && manualSaveMode) {
        menu.addItem(function(mi) {
          mi.setTitle(L.contextSaveSession);
          mi.setIcon("save");
          mi.onClick(function() {
            if (typeof options.onSave === "function") options.onSave();
          });
        });
        menu.addItem(function(mi) {
          mi.setTitle(L.contextReloadSession);
          mi.setIcon("rotate-ccw");
          mi.onClick(function() {
            if (typeof options.onReload === "function") options.onReload();
          });
        });
        if (options.showSaveAs) {
          menu.addItem(function(mi) {
            mi.setTitle(L.cmdSaveAs);
            mi.setIcon("save-all");
            mi.onClick(function() {
              if (typeof options.onSaveAs === "function") options.onSaveAs();
            });
          });
        }
        addedSaveGroup = true;
      }
      if (addedSaveGroup) {
        menu.addSeparator();
      }
      if (options.showSwitch && !isActive) {
        menu.addItem(function(mi) {
          mi.setTitle(L.contextSwitchSession);
          mi.setIcon("arrow-right");
          mi.onClick(function() {
            if (typeof options.onSwitch === "function") options.onSwitch();
          });
        });
      }
      menu.addItem(function(mi) {
        mi.setTitle(L.contextRenameSession);
        mi.setIcon("pencil");
        mi.onClick(function() {
          if (typeof options.onRename === "function") options.onRename();
        });
      });
      menu.addItem(function(mi) {
        mi.setTitle(L.contextDuplicateSession);
        mi.setIcon("copy");
        mi.onClick(function() {
          if (typeof options.onDuplicate === "function") options.onDuplicate();
        });
      });
      if (plugin.isVersionHistoryEnabled()) {
        menu.addItem(function(mi) {
          mi.setTitle(L.contextVersionHistory);
          mi.setIcon("history");
          mi.onClick(function() {
            if (typeof options.onVersionHistory === "function") options.onVersionHistory();
          });
        });
      }
      if (options.showRemoveFromGroup) {
        menu.addItem(function(mi) {
          mi.setTitle(L.groupRemoveFromGroup);
          mi.setIcon("log-out");
          mi.onClick(function() {
            if (typeof options.onRemoveFromGroup === "function") options.onRemoveFromGroup();
          });
        });
      }
      if (options.showMoveToGroup) {
        menu.addItem(function(mi) {
          mi.setTitle(L.groupMoveToGroup);
          mi.setIcon("folder-input");
          var submenu = mi.setSubmenu();
          var groups = plugin.getOrderedGroups();
          var sessionGroupIds = (plugin.data.sessionGroups || {})[session.id] || [];
          for (var gi = 0; gi < groups.length; gi++) {
            (function(group) {
              submenu.addItem(function(sub) {
                sub.setTitle(group.name);
                if (sessionGroupIds.indexOf(group.id) !== -1) {
                  sub.setChecked(true);
                }
                sub.onClick(function() {
                  if (typeof options.onMoveToGroup === "function") options.onMoveToGroup(group.id);
                });
              });
            })(groups[gi]);
          }
        });
      }
      if (showOverwriteWithCurrentLayout) {
        menu.addSeparator();
        menu.addItem(function(mi) {
          mi.setTitle(L.contextSaveCurrentLayoutToThisSession);
          mi.setIcon("save");
          mi.onClick(function() {
            if (typeof options.onOverwriteWithCurrentLayout === "function") options.onOverwriteWithCurrentLayout();
          });
        });
      }
      if (options.showCustomizeClicks) {
        menu.addSeparator();
        menu.addItem(function(mi) {
          mi.setTitle(L.contextCustomizeClicks);
          mi.setIcon("mouse-pointer-click");
          mi.onClick(function() {
            if (plugin.settingTab) plugin.settingTab.activeTab = "general";
            app.setting.open();
            app.setting.openTabById(plugin.manifest.id);
          });
        });
      }
      if (Object.keys(plugin.data.sessions).length > 1) {
        menu.addSeparator();
        menu.addItem(function(mi) {
          mi.setTitle(L.contextDeleteSession);
          mi.setIcon("trash-2");
          mi.onClick(function() {
            if (typeof options.onDelete === "function") options.onDelete();
          });
        });
      }
      menu.showAtMouseEvent(options.event);
    }
    module2.exports = {
      openSessionContextMenu
    };
  }
});

// src/settings-context-menu.js
var require_settings_context_menu = __commonJS({
  "src/settings-context-menu.js"(exports2, module2) {
    "use strict";
    var obsidian2 = require("obsidian");
    var i18n2 = require_i18n();
    function openSettingsContextMenu(options) {
      var L = i18n2.L;
      options = options || {};
      var plugin = options.plugin;
      var app = options.app || (plugin ? plugin.app : null);
      if (!plugin || !app) return;
      var menu = new obsidian2.Menu();
      var autoSaveOn = plugin.isAutoSaveOnSwitchEnabled();
      menu.addItem(function(mi) {
        mi.setTitle(L.settingsAutoSaveOnSwitch);
        mi.setIcon("save");
        if (autoSaveOn) mi.setChecked(true);
        mi.onClick(function() {
          plugin.setAutoSaveOnSwitch(!autoSaveOn, { notify: true }).then(function() {
            if (typeof options.onChanged === "function") options.onChanged();
          });
        });
      });
      if (!autoSaveOn) {
        menu.addItem(function(mi) {
          mi.setTitle(L.settingsWarnUnsavedSwitch);
          mi.setIcon("alert-triangle");
          if (plugin.isWarnOnUnsavedSwitchEnabled()) mi.setChecked(true);
          mi.onClick(function() {
            plugin.data.warnOnUnsavedSwitch = !plugin.isWarnOnUnsavedSwitchEnabled();
            plugin.persistData();
            if (typeof options.onChanged === "function") options.onChanged();
          });
        });
        menu.addItem(function(mi) {
          mi.setTitle(L.settingsConfirmQuickActions);
          mi.setIcon("check-circle");
          if (plugin.data.confirmQuickActions) mi.setChecked(true);
          mi.onClick(function() {
            plugin.data.confirmQuickActions = !plugin.data.confirmQuickActions;
            plugin.persistData();
            if (typeof options.onChanged === "function") options.onChanged();
          });
        });
      }
      menu.addItem(function(mi) {
        mi.setTitle(L.settingsConfirmDelete);
        mi.setIcon("shield");
        if (plugin.data.confirmDeleteByHotkey !== false) mi.setChecked(true);
        mi.onClick(function() {
          plugin.data.confirmDeleteByHotkey = !(plugin.data.confirmDeleteByHotkey !== false);
          plugin.persistData();
          if (typeof options.onChanged === "function") options.onChanged();
        });
      });
      menu.addSeparator();
      menu.addItem(function(mi) {
        mi.setTitle(L.settingsVersionHistoryEnabled);
        mi.setIcon("history");
        if (plugin.isVersionHistoryEnabled()) mi.setChecked(true);
        mi.onClick(function() {
          var next = !plugin.isVersionHistoryEnabled();
          plugin.data.versionHistoryEnabled = next;
          plugin.persistData();
          if (next) {
            plugin.startHistorySnapshotTimer();
          } else {
            plugin.stopHistorySnapshotTimer();
          }
          if (typeof options.onChanged === "function") options.onChanged();
        });
      });
      menu.addItem(function(mi) {
        mi.setTitle(L.contextToggleGroups);
        mi.setIcon("folder");
        if (plugin.isGroupFeatureEnabled()) mi.setChecked(true);
        mi.onClick(function() {
          plugin.setGroupFeatureEnabled(!plugin.isGroupFeatureEnabled()).then(function() {
            if (typeof options.onChanged === "function") options.onChanged();
          });
        });
      });
      menu.addItem(function(mi) {
        mi.setTitle(L.settingsShowFilterInput);
        mi.setIcon("search");
        if (plugin.data.showFilterInput) mi.setChecked(true);
        mi.onClick(function() {
          plugin.data.showFilterInput = !plugin.data.showFilterInput;
          plugin.persistData();
          if (typeof options.onChanged === "function") options.onChanged();
        });
      });
      menu.addSeparator();
      menu.addItem(function(mi) {
        mi.setTitle(L.rotationBackupCreate);
        mi.setIcon("archive");
        mi.onClick(function() {
          var sessionData = plugin.extractSessionData(plugin.data);
          sessionData._wppSavedAt = Date.now();
          plugin.ensureDir(plugin.getBackupsDirPath()).then(function() {
            return plugin.copyFileIfExists(
              plugin.getRotationBackupPath(2),
              plugin.getRotationBackupPath(3)
            );
          }).then(function() {
            return plugin.copyFileIfExists(
              plugin.getRotationBackupPath(1),
              plugin.getRotationBackupPath(2)
            );
          }).then(function() {
            return plugin.writeJson(
              plugin.getRotationBackupPath(1),
              sessionData
            );
          }).then(function() {
            plugin._lastRotationBackupAt = Date.now();
            new obsidian2.Notice(L.rotationBackupCreated);
          }).catch(function() {
            new obsidian2.Notice(L.rotationBackupFailed);
          });
        });
      });
      menu.addItem(function(mi) {
        mi.setTitle(L.settingsHotkeysBtn);
        mi.setIcon("keyboard");
        mi.onClick(function() {
          app.setting.open();
          app.setting.openTabById("hotkeys");
          var sc = app.setting.activeTab.searchComponent;
          var pluginName = plugin.manifest && plugin.manifest.name ? plugin.manifest.name : "Workspace++";
          sc.setValue(pluginName);
          sc.inputEl.dispatchEvent(new Event("input"));
        });
      });
      menu.addItem(function(mi) {
        mi.setTitle(L.contextCustomizeClicks);
        mi.setIcon("mouse-pointer-click");
        mi.onClick(function() {
          if (plugin.settingTab) plugin.settingTab.activeTab = "general";
          app.setting.open();
          app.setting.openTabById(plugin.manifest.id);
        });
      });
      menu.addItem(function(mi) {
        mi.setTitle(L.contextOpenSettings);
        mi.setIcon("settings");
        mi.onClick(function() {
          app.setting.open();
          app.setting.openTabById(plugin.manifest.id);
        });
      });
      if (options.showResetOverlay) {
        menu.addSeparator();
        menu.addItem(function(mi) {
          mi.setTitle(L.contextResetOverlayPosition);
          mi.setIcon("rotate-ccw");
          mi.onClick(function() {
            if (typeof options.onResetOverlay === "function") options.onResetOverlay();
          });
        });
      }
      menu.showAtMouseEvent(options.event);
    }
    module2.exports = {
      openSettingsContextMenu
    };
  }
});

// src/session-list-actions.js
var require_session_list_actions = __commonJS({
  "src/session-list-actions.js"(exports2, module2) {
    "use strict";
    var obsidian2 = require("obsidian");
    var i18n2 = require_i18n();
    var ConfirmModal = require_confirm_modal();
    var RenameModal = require_rename_modal();
    function resolveApp(options) {
      if (options.app) return options.app;
      if (options.plugin && options.plugin.app) return options.plugin.app;
      return null;
    }
    function renameSessionWithPrompt(options) {
      var L = i18n2.L;
      options = options || {};
      var app = resolveApp(options);
      var plugin = options.plugin;
      var session = options.session;
      if (!app || !plugin || !session) return;
      var modalOptions = Object.assign({
        emptyNotice: L.emptyName
      }, options.modalOptions || {});
      new RenameModal(app, session.name, function(newName) {
        plugin.renameSessionById(session.id, newName).then(function(renamed) {
          if (!renamed) return;
          if (typeof options.onRenamed === "function") {
            options.onRenamed(session, newName);
          }
        });
      }, modalOptions).open();
    }
    function getDeleteConfirmMessage(session, options) {
      var L = i18n2.L;
      if (options && options.confirmMessage) return options.confirmMessage;
      var isActive = !!(options && options.isActive);
      return isActive ? L.confirmDeleteActive(session.name) : L.confirmDelete(session.name);
    }
    function deleteSessionWithPrompt(options) {
      var L = i18n2.L;
      options = options || {};
      var app = resolveApp(options);
      var plugin = options.plugin;
      var session = options.session;
      if (!app || !plugin || !session) return Promise.resolve(false);
      if (Object.keys(plugin.data.sessions || {}).length <= 1) {
        if (options.notifyCannotDelete !== false) {
          new obsidian2.Notice(L.cannotDeleteLast);
        }
        return Promise.resolve(false);
      }
      var doDelete = function() {
        return plugin.deleteSession(session.id).then(function(deleted) {
          if (!deleted) return false;
          if (options.notifyDeleted !== false) {
            new obsidian2.Notice(L.deleted(session.name));
          }
          if (typeof options.onDeleted === "function") {
            options.onDeleted(session);
          }
          return true;
        });
      };
      var shouldConfirm = !!options.forceConfirm || plugin.data.confirmDeleteByHotkey !== false;
      if (shouldConfirm) {
        new ConfirmModal(
          app,
          getDeleteConfirmMessage(session, options),
          doDelete,
          options.confirmOptions || {}
        ).open();
        return Promise.resolve(true);
      }
      return doDelete();
    }
    module2.exports = {
      renameSessionWithPrompt,
      deleteSessionWithPrompt
    };
  }
});

// src/modals/session-manager-modal.js
var require_session_manager_modal = __commonJS({
  "src/modals/session-manager-modal.js"(exports2, module2) {
    "use strict";
    var obsidian2 = require("obsidian");
    var i18n2 = require_i18n();
    var ConfirmModal = require_confirm_modal();
    var HistoryModal = require_history_modal();
    var formatRelativeTime = require_format_relative_time();
    var groupTabUi = require_group_tab_ui();
    var navigationUtils = require_navigation_utils();
    var utils2 = require_utils();
    var sessionContextMenu = require_session_context_menu();
    var settingsContextMenu = require_settings_context_menu();
    var sessionListActions = require_session_list_actions();
    function isElementVisible(el) {
      if (!el) return false;
      if (el.offsetParent !== null) return true;
      var rects = el.getClientRects ? el.getClientRects() : [];
      return rects && rects.length > 0;
    }
    var SessionManagerModal = (
      /** @class */
      function(_super) {
        function SessionManagerModal2(app, plugin) {
          var _this = _super.call(this, app) || this;
          _this.plugin = plugin;
          return _this;
        }
        SessionManagerModal2.prototype = Object.create(_super.prototype);
        SessionManagerModal2.prototype.constructor = SessionManagerModal2;
        SessionManagerModal2.prototype.onOpen = function() {
          var L = i18n2.L;
          var contentEl = this.contentEl;
          contentEl.empty();
          contentEl.addClass("wpp-modal");
          this.titleEl.setText(L.modalTitle);
          var saveContainer = contentEl.createDiv({ cls: "wpp-save-container" });
          this.nameInput = saveContainer.createEl("input", {
            type: "text",
            placeholder: L.savePlaceholder,
            cls: "wpp-save-input"
          });
          var saveBtn = saveContainer.createEl("button", {
            text: L.save,
            cls: "wpp-save-btn"
          });
          this.saveBtn = saveBtn;
          this.filterInput = null;
          if (this.plugin.data.showFilterInput) {
            var filterContainer = contentEl.createDiv({ cls: "wpp-filter-container" });
            this.filterInput = filterContainer.createEl("input", {
              type: "text",
              placeholder: L.filterPlaceholder,
              cls: "wpp-filter-input"
            });
          }
          var self = this;
          this.modalGroupId = this.plugin.isGroupFeatureEnabled() ? this.plugin.data.activeGroupId || null : null;
          saveBtn.addEventListener("click", function() {
            self.onSave();
          });
          saveBtn.addEventListener("focus", function() {
            self.setKeyboardTarget({ zone: "create-button" });
          });
          this.nameInput.addEventListener("keydown", function(e) {
            if (e.key === "Enter" && !e.isComposing) self.onSave();
          });
          this.nameInput.addEventListener("focus", function() {
            self.setKeyboardTarget({ zone: "create-input" });
          });
          this.filterQuery = "";
          if (this.filterInput) {
            this.filterInput.addEventListener("focus", function() {
              self.setKeyboardTarget({ zone: "filter" });
            });
            this.filterInput.addEventListener("input", function() {
              self.filterQuery = self.filterInput.value || "";
              self.setKeyboardTarget({ zone: "filter" });
              self.renderList();
            });
          }
          this.groupTabsRow = contentEl.createDiv({ cls: "wpp-group-tabs-row" });
          this.renderGroupTabs();
          this.keyboardTarget = { zone: "none", rowIndex: null, actionKey: null };
          this.focusedIndex = -1;
          this.selectedIds = /* @__PURE__ */ new Set();
          this.bulkActionsEl = contentEl.createDiv({ cls: "wpp-bulk-actions" });
          this.bulkActionsEl.style.display = "none";
          this.bulkDeleteBtn = this.bulkActionsEl.createEl("button", { cls: "mod-warning" });
          this.bulkDeleteBtn.addEventListener("click", function() {
            self.onBulkDelete();
          });
          var deselectBtn = this.bulkActionsEl.createEl("button", { text: L.deselect, cls: "wpp-deselect-btn" });
          deselectBtn.addEventListener("click", function() {
            self.selectedIds.clear();
            self.updateSelectionUI();
          });
          this.listEl = contentEl.createDiv({ cls: "wpp-session-list" });
          this.renderList();
          this.setKeyboardTarget(this.getDefaultSessionTarget());
          this.contentFocusHandler = function(e) {
            self.syncKeyboardTargetFromElement(e.target);
          };
          contentEl.addEventListener("focusin", this.contentFocusHandler, true);
          var nextKey = this.plugin.getCommandHotkey("next-session");
          var footer = contentEl.createDiv({ cls: "wpp-modal-footer" });
          if (nextKey) {
            footer.createDiv({ text: L.cmdNext + "  " + nextKey });
          }
          footer.createDiv({ text: L.footerDragReorder });
          if (this.plugin.getOrderedGroups().length > 0) {
            footer.createDiv({ text: L.footerDragToGroup });
          }
          contentEl.addEventListener("contextmenu", function(e) {
            if (e.target.closest(".wpp-session-item")) return;
            if (e.target.closest(".wpp-save-container")) return;
            if (e.target.closest(".wpp-filter-container")) return;
            if (e.target.closest(".wpp-bulk-actions")) return;
            if (e.target.closest(".wpp-group-tab")) return;
            e.preventDefault();
            settingsContextMenu.openSettingsContextMenu({
              plugin: self.plugin,
              app: self.app,
              event: e,
              onChanged: function() {
                self.renderGroupTabs();
                self.renderList();
              }
            });
          });
          this.modalKeyHandler = function(e) {
            if (document.querySelector(".wpp-confirm-buttons")) return;
            if (document.querySelector(".wpp-switch-overlay")) return;
            var activeEl = document.activeElement;
            if (activeEl && activeEl !== document.body && !self.contentEl.contains(activeEl)) return;
            var controlEl = navigationUtils.getScopedControlEl(self.contentEl, activeEl);
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              self.handleHorizontalArrowKey(e, controlEl);
              return;
            }
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              self.handleVerticalArrowKey(e, activeEl, controlEl);
              return;
            }
            if (e.key !== "Enter") return;
            self.handleEnterKey(e, controlEl);
          };
          document.addEventListener("keydown", this.modalKeyHandler, true);
          var focusTarget = this.plugin.data.overlayDefaultFocus || "current-session";
          if (focusTarget !== "session-create") {
            var modalSelf = this;
            setTimeout(function() {
              if (focusTarget === "session-filter" && modalSelf.filterInput) {
                modalSelf.focusFilterInput();
              } else {
                modalSelf.focusSessionTarget(modalSelf.getDefaultSessionTarget());
              }
            }, 50);
          }
        };
        SessionManagerModal2.prototype.getVisibleSessions = function() {
          var sessions = this.plugin.getOrderedSessionsForGroup(this.getModalGroupId());
          var query = (this.filterQuery || "").trim().toLowerCase();
          if (!query) return sessions;
          return sessions.filter(function(s) {
            return (s.name || "").toLowerCase().indexOf(query) !== -1;
          });
        };
        SessionManagerModal2.prototype.getModalGroupId = function() {
          if (!this.plugin.isGroupFeatureEnabled()) {
            this.modalGroupId = null;
            return null;
          }
          var groups = this.plugin.data.groups || {};
          if (this.modalGroupId && !groups[this.modalGroupId]) {
            this.modalGroupId = this.plugin.data.activeGroupId || null;
          }
          return this.modalGroupId || null;
        };
        SessionManagerModal2.prototype.selectGroup = function(groupId) {
          if (!this.plugin.isGroupFeatureEnabled()) {
            this.modalGroupId = null;
            this.renderGroupTabs();
            this.renderList();
            return Promise.resolve(false);
          }
          var self = this;
          var nextGroupId = groupId || null;
          return this.plugin.resolveGroupSelection(nextGroupId).then(function(result) {
            self.modalGroupId = result.resolvedGroupId || null;
            self.renderGroupTabs();
            self.renderList();
            return result.switched;
          });
        };
        SessionManagerModal2.prototype.getNavigationSessions = function() {
          return this.getVisibleSessions();
        };
        SessionManagerModal2.prototype.getArrowNavigables = function() {
          var selector = [
            "button:not([disabled])",
            'input:not([disabled]):not([type="hidden"])',
            "select:not([disabled])",
            "textarea:not([disabled])",
            "a[href]",
            '[tabindex]:not([tabindex="-1"])',
            '.wpp-icon-btn[tabindex="-1"]'
          ].join(",");
          return Array.from(this.contentEl.querySelectorAll(selector)).filter(function(el) {
            if (!isElementVisible(el)) return false;
            if (el.getAttribute("aria-hidden") === "true") return false;
            if (el.tabIndex < 0 && !el.classList.contains("wpp-icon-btn")) return false;
            return true;
          });
        };
        SessionManagerModal2.prototype.getVisibleRowElements = function() {
          return Array.from(this.listEl.querySelectorAll(".wpp-session-item")).filter(function(rowEl) {
            return isElementVisible(rowEl);
          });
        };
        SessionManagerModal2.prototype.getVisibleRowIndex = function(rowEl) {
          if (!rowEl) return -1;
          return this.getVisibleRowElements().indexOf(rowEl);
        };
        SessionManagerModal2.prototype.getRowActionTarget = function(rowEl, actionKey) {
          if (!rowEl) return null;
          var target = null;
          var desiredKey = actionKey || "load";
          if (desiredKey === "primary") desiredKey = "load";
          if (desiredKey) {
            target = rowEl.querySelector('.wpp-session-actions [data-action-key="' + desiredKey + '"]');
          }
          if ((!target || !isElementVisible(target)) && desiredKey !== "load") {
            target = rowEl.querySelector('.wpp-session-actions [data-action-key="load"]');
          }
          if (target && isElementVisible(target)) return target;
          var rowControls = Array.from(rowEl.querySelectorAll(".wpp-session-actions button, .wpp-session-actions .wpp-icon-btn"));
          for (var i = 0; i < rowControls.length; i++) {
            if (isElementVisible(rowControls[i])) return rowControls[i];
          }
          return null;
        };
        SessionManagerModal2.prototype.getDefaultSessionTarget = function() {
          var sessions = this.getNavigationSessions();
          if (sessions.length === 0) return { zone: this.filterInput ? "filter" : "create-input" };
          var activeIdx = this.plugin.findActiveSessionIndex(sessions);
          return {
            zone: "session-action",
            rowIndex: activeIdx !== -1 ? activeIdx : 0,
            actionKey: "load"
          };
        };
        SessionManagerModal2.prototype.getEdgeSessionTarget = function(which, actionKey) {
          var rows = this.getVisibleRowElements();
          if (!rows.length) return null;
          return {
            zone: "session-action",
            rowIndex: which === "last" ? rows.length - 1 : 0,
            actionKey: actionKey || "load"
          };
        };
        SessionManagerModal2.prototype.setKeyboardTarget = function(target) {
          var nextTarget = target || { zone: "none", rowIndex: null, actionKey: null };
          if (nextTarget.zone === "session-action") {
            var sessions = this.getNavigationSessions();
            var nextIndex = typeof nextTarget.rowIndex === "number" ? nextTarget.rowIndex : -1;
            if (nextIndex >= sessions.length) nextIndex = sessions.length - 1;
            if (nextIndex < 0 && sessions.length > 0) nextIndex = 0;
            nextTarget = {
              zone: "session-action",
              rowIndex: nextIndex >= 0 ? nextIndex : null,
              actionKey: nextTarget.actionKey || "load"
            };
          } else {
            nextTarget = {
              zone: nextTarget.zone || "none",
              rowIndex: null,
              actionKey: null
            };
          }
          this.keyboardTarget = nextTarget;
          this.updateFocusUI();
        };
        SessionManagerModal2.prototype.syncKeyboardTargetFromElement = function(el) {
          if (!el || !this.contentEl.contains(el)) return;
          var rowAction = el.closest ? el.closest(".wpp-session-actions") : null;
          if (rowAction && this.contentEl.contains(rowAction)) {
            var rowEl = el.closest(".wpp-session-item");
            var rowIndex = this.getVisibleRowIndex(rowEl);
            this.setKeyboardTarget({
              zone: "session-action",
              rowIndex,
              actionKey: el.getAttribute && el.getAttribute("data-action-key") || "load"
            });
            return;
          }
          if (el === this.filterInput) {
            this.setKeyboardTarget({ zone: "filter" });
            return;
          }
          if (el === this.nameInput) {
            this.setKeyboardTarget({ zone: "create-input" });
            return;
          }
          if (el === this.saveBtn) {
            this.setKeyboardTarget({ zone: "create-button" });
          }
        };
        SessionManagerModal2.prototype.focusCreateInput = function() {
          this.setKeyboardTarget({ zone: "create-input" });
          navigationUtils.focusTextInputEnd(this.nameInput);
        };
        SessionManagerModal2.prototype.focusFilterInput = function() {
          if (!this.filterInput) return false;
          this.setKeyboardTarget({ zone: "filter" });
          navigationUtils.focusTextInputSelect(this.filterInput);
          return true;
        };
        SessionManagerModal2.prototype.handleHorizontalArrowKey = function(e, controlEl) {
          if (e.isComposing) return;
          if (controlEl === this.nameInput && e.key === "ArrowRight") {
            if (navigationUtils.isTextInputCursorAtEnd(this.nameInput)) {
              e.preventDefault();
              e.stopPropagation();
              this.saveBtn.focus();
            }
            return;
          }
          if (controlEl === this.saveBtn && e.key === "ArrowLeft") {
            e.preventDefault();
            e.stopPropagation();
            this.focusCreateInput();
            return;
          }
          if (!controlEl) return;
          var actionRow = controlEl.closest(".wpp-session-actions");
          if (!actionRow || !this.contentEl.contains(actionRow)) return;
          var rowControls = Array.from(actionRow.querySelectorAll("button, .wpp-icon-btn")).filter(function(el) {
            return isElementVisible(el);
          });
          if (rowControls.length === 0) return;
          var rowIndex = rowControls.indexOf(controlEl);
          if (rowIndex === -1) return;
          var nextRowIndex = rowIndex + (e.key === "ArrowRight" ? 1 : -1);
          if (nextRowIndex < 0 || nextRowIndex >= rowControls.length) return;
          e.preventDefault();
          e.stopPropagation();
          rowControls[nextRowIndex].focus();
        };
        SessionManagerModal2.prototype.handleVerticalArrowKey = function(e, activeEl, controlEl) {
          if (e.isComposing) return;
          var isTextInput = !!(activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA"));
          if (isTextInput && activeEl.tagName === "TEXTAREA") return;
          if (activeEl && activeEl.tagName === "SELECT") return;
          var dir = e.key === "ArrowUp" ? -1 : 1;
          if (controlEl === this.filterInput) {
            e.preventDefault();
            e.stopPropagation();
            if (e.key === "ArrowDown") {
              this.focusSessionTarget(this.getEdgeSessionTarget("first", "load"));
            } else {
              this.focusCreateInput();
            }
            return;
          }
          if (this.keyboardTarget.zone === "session-action" && this.keyboardTarget.rowIndex >= 0) {
            var activeActionRow = controlEl && controlEl.closest ? controlEl.closest(".wpp-session-actions") : null;
            var rows = this.getVisibleRowElements();
            var currentRowIndex = this.keyboardTarget.rowIndex;
            var actionKey = this.keyboardTarget.actionKey || "load";
            if (activeActionRow && this.contentEl.contains(activeActionRow) && controlEl && controlEl.getAttribute) {
              actionKey = controlEl.getAttribute("data-action-key") || actionKey;
            }
            var verticalActionKey = actionKey === "save-inline" ? "load" : actionKey || "load";
            if (rows.length === 0) return;
            e.preventDefault();
            e.stopPropagation();
            var nextRowIndex = currentRowIndex + dir;
            if (nextRowIndex >= 0 && nextRowIndex < rows.length && this.focusSessionTarget({ zone: "session-action", rowIndex: nextRowIndex, actionKey: verticalActionKey })) {
              return;
            }
            if (e.key === "ArrowUp") {
              if (this.filterInput) {
                this.focusFilterInput();
              } else {
                this.focusCreateInput();
              }
            } else {
              this.focusCreateInput();
            }
            return;
          }
          if (controlEl === this.nameInput || controlEl === this.saveBtn) {
            e.preventDefault();
            e.stopPropagation();
            if (e.key === "ArrowDown") {
              if (this.filterInput) {
                this.focusFilterInput();
              } else {
                this.focusSessionTarget(this.getEdgeSessionTarget("first", "load"));
              }
            } else {
              this.focusSessionTarget(this.getEdgeSessionTarget("last", "load"));
            }
            return;
          }
          var navigables = this.getArrowNavigables();
          if (navigables.length === 0) return;
          var currentIndex = navigables.indexOf(controlEl);
          var nextEl = null;
          if (currentIndex === -1) {
            nextEl = e.key === "ArrowUp" ? navigables[navigables.length - 1] : navigables[0];
          } else {
            var fallbackIndex = currentIndex + dir;
            if (fallbackIndex < 0) fallbackIndex = navigables.length - 1;
            if (fallbackIndex >= navigables.length) fallbackIndex = 0;
            nextEl = navigables[fallbackIndex];
          }
          e.preventDefault();
          e.stopPropagation();
          if (nextEl && nextEl.focus) {
            nextEl.focus();
          }
        };
        SessionManagerModal2.prototype.handleEnterKey = function(e, controlEl) {
          if (controlEl === this.filterInput && !e.isComposing) {
            var filtered = this.getNavigationSessions();
            if (filtered.length === 1) {
              e.preventDefault();
              this.onLoad(filtered[0].id);
            }
            return;
          }
          if (controlEl && controlEl.classList && controlEl.classList.contains("wpp-icon-btn") && this.contentEl.contains(controlEl)) {
            e.preventDefault();
            e.stopPropagation();
            controlEl.click();
            return;
          }
          if (controlEl && controlEl.tagName === "BUTTON" && this.contentEl.contains(controlEl)) {
            e.preventDefault();
            e.stopPropagation();
            if (controlEl.classList.contains("wpp-load-btn")) {
              var row = controlEl.closest(".wpp-session-item");
              if (row && row.dataset && row.dataset.sessionId) {
                this.onLoad(row.dataset.sessionId);
                return;
              }
            }
            controlEl.click();
            return;
          }
          if (controlEl && (controlEl.tagName === "INPUT" || controlEl.tagName === "TEXTAREA" || controlEl.tagName === "SELECT" || controlEl.tagName === "A")) {
            return;
          }
          if (this.keyboardTarget.zone === "session-action" && this.keyboardTarget.rowIndex >= 0) {
            e.preventDefault();
            this.onFocusedLoad();
          }
        };
        SessionManagerModal2.prototype.focusSessionTarget = function(target) {
          if (!target || target.zone !== "session-action") return false;
          var rows = this.getVisibleRowElements();
          var rowIndex = typeof target.rowIndex === "number" ? target.rowIndex : -1;
          if (rowIndex < 0 || rowIndex >= rows.length) return false;
          var actionTarget = this.getRowActionTarget(rows[rowIndex], target.actionKey);
          if (!actionTarget || !actionTarget.focus) return false;
          this.setKeyboardTarget({
            zone: "session-action",
            rowIndex,
            actionKey: actionTarget.getAttribute("data-action-key") || target.actionKey || "load"
          });
          actionTarget.focus();
          return true;
        };
        SessionManagerModal2.prototype.normalizeKeyboardTargetAfterRender = function(sessions) {
          if (this.keyboardTarget.zone !== "session-action") return;
          if (!sessions.length) {
            this.keyboardTarget = { zone: this.filterInput ? "filter" : "create-input", rowIndex: null, actionKey: null };
            return;
          }
          if (this.keyboardTarget.rowIndex >= sessions.length) {
            this.keyboardTarget.rowIndex = sessions.length - 1;
          } else if (this.keyboardTarget.rowIndex == null || this.keyboardTarget.rowIndex < 0) {
            this.keyboardTarget.rowIndex = 0;
          }
        };
        SessionManagerModal2.prototype.blurFocusedControl = function() {
          var activeEl = document.activeElement;
          if (activeEl && this.contentEl.contains(activeEl) && activeEl.blur) {
            activeEl.blur();
          }
        };
        SessionManagerModal2.prototype.renderList = function() {
          var L = i18n2.L;
          this.listEl.empty();
          var sessions = this.getVisibleSessions();
          var selectedGroupId = this.getModalGroupId();
          var ordered = this.plugin.getOrderedSessionsForGroup(selectedGroupId);
          var orderIndex = {};
          for (var oi = 0; oi < ordered.length; oi++) {
            orderIndex[ordered[oi].id] = oi;
          }
          for (var i = 0; i < sessions.length; i++) {
            this.renderSessionItem(sessions[i], i, orderIndex[sessions[i].id]);
          }
          if (sessions.length === 0) {
            var isGroupEmpty = !!selectedGroupId && ordered.length === 0;
            var emptyMsg = isGroupEmpty ? L.noGroupSessions : L.noFilteredSessions;
            var emptyEl = this.listEl.createDiv({ text: emptyMsg, cls: "wpp-empty-state" });
            if (isGroupEmpty) emptyEl.addClass("wpp-empty-state-group");
          } else {
            this.setupDragAndDrop();
          }
          this.normalizeKeyboardTargetAfterRender(sessions);
          var validIds = {};
          sessions.forEach(function(s) {
            validIds[s.id] = true;
          });
          var self = this;
          this.selectedIds.forEach(function(id) {
            if (!validIds[id]) self.selectedIds.delete(id);
          });
          this.updateFocusUI();
          this.updateSelectionUI();
        };
        SessionManagerModal2.prototype.renderSessionItem = function(session, index, orderIndex) {
          var L = i18n2.L;
          var isActive = session.id === this.plugin.data.activeSessionId;
          var self = this;
          var item = this.listEl.createDiv({ cls: "wpp-session-item" });
          item.dataset.sessionId = session.id;
          item.addEventListener("click", function(e) {
            self.setKeyboardTarget({ zone: "session-action", rowIndex: index, actionKey: "load" });
            if (e.target.closest("button, .wpp-icon-btn")) return;
            self.blurFocusedControl();
            var cmdKey = utils2.isModPressed(e);
            if (cmdKey) {
              if (self.selectedIds.has(session.id)) {
                self.selectedIds.delete(session.id);
              } else {
                self.selectedIds.add(session.id);
              }
              self.updateSelectionUI();
            } else if (!cmdKey) {
              self.selectedIds.clear();
              self.updateSelectionUI();
            }
          });
          item.addEventListener("contextmenu", function(e) {
            e.preventDefault();
            var selectedGroupId = self.getModalGroupId();
            sessionContextMenu.openSessionContextMenu({
              plugin: self.plugin,
              app: self.app,
              session,
              isActive,
              event: e,
              showSwitch: true,
              showRemoveFromGroup: !!selectedGroupId,
              onSave: function() {
                self.plugin.saveActiveSession().then(function() {
                  self.renderList();
                });
              },
              onReload: function() {
                self.plugin.reloadCurrentSessionWithoutSaving();
              },
              onOverwriteWithCurrentLayout: function() {
                self.plugin.confirmOverwriteSessionWithCurrentLayout(session.id, {
                  onSaved: function() {
                    self.renderList();
                  }
                });
              },
              onSwitch: function() {
                self.onLoad(session.id);
              },
              onRename: function() {
                self.onRename(session);
              },
              onDuplicate: function() {
                self.plugin.duplicateSession(session.id).then(function() {
                  self.renderList();
                });
              },
              onRemoveFromGroup: function() {
                var activeGid = self.getModalGroupId();
                if (!activeGid) return;
                var gName = (self.plugin.data.groups[activeGid] || {}).name || "";
                self.plugin.removeSessionFromGroup(session.id, activeGid).then(function() {
                  new obsidian2.Notice(L.groupRemovedSession(session.name, gName));
                  self.renderGroupTabs();
                  self.renderList();
                });
              },
              showMoveToGroup: self.plugin.isGroupFeatureEnabled() && self.plugin.getOrderedGroups().length > 0,
              onMoveToGroup: function(groupId) {
                var gName = (self.plugin.data.groups[groupId] || {}).name || "";
                self.plugin.moveSessionToGroupExclusive(session.id, groupId).then(function(moved) {
                  if (moved) {
                    new obsidian2.Notice(L.groupAddedSession(session.name, gName));
                    self.renderGroupTabs();
                    self.renderList();
                  }
                });
              },
              onDelete: function() {
                self.onDelete(session);
              },
              onVersionHistory: function() {
                new HistoryModal(self.app, self.plugin, session).open();
              }
            });
          });
          var hintIndex = typeof orderIndex === "number" ? orderIndex : index;
          var hk = hintIndex <= 8 ? self.plugin.getCommandHotkey("switch-to-" + (hintIndex + 1)) : "";
          item.createSpan({ text: hk || String(hintIndex + 1), cls: "wpp-session-index" });
          var info = item.createDiv({ cls: "wpp-session-info" });
          var nameRow = info.createDiv({ cls: "wpp-session-name-row" });
          nameRow.createSpan({ text: session.name, cls: "wpp-session-name" });
          if (session.isDefault && session.name !== this.plugin.getDefaultSessionName()) {
            nameRow.createSpan({ text: L.defaultLabel, cls: "wpp-default-label" });
          }
          if (isActive) {
            nameRow.createSpan({ text: L.active, cls: "wpp-active-badge" });
          }
          info.createDiv({ text: formatRelativeTime(session.modified), cls: "wpp-session-modified" });
          var actions = item.createDiv({ cls: "wpp-session-actions" });
          var loadBtn = actions.createEl("button", { text: L.load, cls: "wpp-load-btn" });
          loadBtn.setAttribute("data-action-key", "load");
          loadBtn.addEventListener("click", function() {
            self.onLoad(session.id);
          });
          if (isActive && !self.plugin.isAutoSaveOnSwitchEnabled()) {
            var saveCurrentBtn = actions.createEl("button", {
              text: L.saveInline,
              cls: "wpp-save-inline-btn"
            });
            saveCurrentBtn.setAttribute("data-action-key", "save-inline");
            saveCurrentBtn.addEventListener("click", function(e) {
              e.stopPropagation();
              self.plugin.saveActiveSession().then(function() {
                self.renderList();
              });
            });
            actions.insertBefore(saveCurrentBtn, loadBtn);
            saveCurrentBtn.style.width = loadBtn.offsetWidth + "px";
          }
          var renameBtn = actions.createDiv({
            cls: "wpp-icon-btn",
            attr: { role: "button", tabindex: "-1", "data-action-key": "rename" }
          });
          obsidian2.setIcon(renameBtn, "pencil");
          obsidian2.setTooltip(renameBtn, L.rename, { delay: 250 });
          renameBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            self.onRename(session);
          });
          if (Object.keys(self.plugin.data.sessions).length > 1) {
            var deleteBtn = actions.createDiv({
              cls: "wpp-icon-btn",
              attr: { role: "button", tabindex: "-1", "data-action-key": "delete" }
            });
            obsidian2.setIcon(deleteBtn, "trash-2");
            obsidian2.setTooltip(deleteBtn, L.delete, { delay: 250 });
            deleteBtn.addEventListener("click", function(e) {
              e.stopPropagation();
              self.onDelete(session);
            });
          }
        };
        SessionManagerModal2.prototype.setupDragAndDrop = function() {
          var self = this;
          if ((this.filterQuery || "").trim()) return;
          this.listEl.querySelectorAll(".wpp-session-item").forEach(function(item) {
            item.addEventListener("mousedown", function(e) {
              if (e.button !== 0) return;
              if (e.target.closest("button, input, .wpp-icon-btn")) return;
              if (utils2.isModPressed(e)) return;
              var startX = e.clientX;
              var startY = e.clientY;
              var dragStarted = false;
              var draggedEl = item;
              var cloneEl = null;
              function startDrag(ev) {
                dragStarted = true;
                document.body.classList.add("wpp-session-list-dragging");
                var rect = item.getBoundingClientRect();
                var offsetX = startX - rect.left;
                var offsetY = startY - rect.top;
                cloneEl = item.cloneNode(true);
                cloneEl.classList.add("wpp-drag-clone");
                cloneEl.style.position = "fixed";
                cloneEl.style.width = rect.width + "px";
                cloneEl.style.top = ev.clientY - offsetY + "px";
                cloneEl.style.left = ev.clientX - offsetX + "px";
                cloneEl.style.zIndex = "10000";
                cloneEl.style.pointerEvents = "none";
                document.body.appendChild(cloneEl);
                item.classList.add("is-dragging");
                cloneEl._offsetX = offsetX;
                cloneEl._offsetY = offsetY;
              }
              function updateGroupDropTarget(ev) {
                var tabs = self.groupTabsRow.querySelectorAll(".wpp-group-tab");
                var hoveredTab = null;
                for (var t = 0; t < tabs.length; t++) {
                  var tr = tabs[t].getBoundingClientRect();
                  if (ev.clientX >= tr.left && ev.clientX <= tr.right && ev.clientY >= tr.top && ev.clientY <= tr.bottom) {
                    hoveredTab = tabs[t];
                    break;
                  }
                }
                for (var t2 = 0; t2 < tabs.length; t2++) {
                  tabs[t2].classList.toggle("wpp-group-drop-target", tabs[t2] === hoveredTab);
                }
                return hoveredTab;
              }
              function clearGroupDropTargets() {
                var tabs = self.groupTabsRow.querySelectorAll(".wpp-group-tab");
                for (var t = 0; t < tabs.length; t++) {
                  tabs[t].classList.remove("wpp-group-drop-target");
                }
              }
              function onMouseMove(ev) {
                if (!dragStarted) {
                  var dx = ev.clientX - startX;
                  var dy = ev.clientY - startY;
                  if (Math.abs(dx) + Math.abs(dy) < 5) return;
                  startDrag(ev);
                }
                cloneEl.style.top = ev.clientY - cloneEl._offsetY + "px";
                cloneEl.style.left = ev.clientX - cloneEl._offsetX + "px";
                var hoverTab = updateGroupDropTarget(ev);
                if (hoverTab) return;
                var siblings = self.listEl.querySelectorAll(".wpp-session-item");
                var placed = false;
                for (var i = 0; i < siblings.length; i++) {
                  var el = siblings[i];
                  if (el === draggedEl) continue;
                  var r = el.getBoundingClientRect();
                  if (ev.clientY < r.top + r.height / 2) {
                    self.listEl.insertBefore(draggedEl, el);
                    placed = true;
                    break;
                  }
                }
                if (!placed) {
                  self.listEl.appendChild(draggedEl);
                }
              }
              function onMouseUp(ev) {
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
                document.body.classList.remove("wpp-session-list-dragging");
                if (!dragStarted) return;
                cloneEl.remove();
                draggedEl.classList.remove("is-dragging");
                var dropTab = updateGroupDropTarget(ev);
                clearGroupDropTargets();
                if (dropTab && dropTab.dataset.groupId && dropTab.dataset.groupId !== "__all__") {
                  var sessionId = draggedEl.dataset.sessionId;
                  var groupId = dropTab.dataset.groupId;
                  var sessionName = (self.plugin.data.sessions[sessionId] || {}).name || "";
                  var groupName = (self.plugin.data.groups[groupId] || {}).name || "";
                  self.plugin.moveSessionToGroupExclusive(sessionId, groupId).then(function() {
                    new obsidian2.Notice(i18n2.L.groupAddedSession(sessionName, groupName));
                    self.renderGroupTabs();
                    self.renderList();
                  });
                  return;
                } else {
                  var currentGroupId = self.getModalGroupId();
                  if (dropTab && dropTab.dataset.groupId === "__all__" && currentGroupId) {
                    var rmSessionId = draggedEl.dataset.sessionId;
                    var rmGroupId = currentGroupId;
                    var rmSessionName = (self.plugin.data.sessions[rmSessionId] || {}).name || "";
                    var rmGroupName = (self.plugin.data.groups[rmGroupId] || {}).name || "";
                    self.plugin.removeSessionFromGroup(rmSessionId, rmGroupId).then(function() {
                      new obsidian2.Notice(i18n2.L.groupRemovedSession(rmSessionName, rmGroupName));
                      self.renderGroupTabs();
                      self.renderList();
                    });
                    return;
                  }
                }
                var newVisibleOrder = [];
                var items = self.listEl.querySelectorAll(".wpp-session-item");
                items.forEach(function(el) {
                  newVisibleOrder.push(el.dataset.sessionId);
                });
                items.forEach(function(el, i) {
                  var indexEl = el.querySelector(".wpp-session-index");
                  if (indexEl) {
                    var hk = i <= 8 ? self.plugin.getCommandHotkey("switch-to-" + (i + 1)) : "";
                    indexEl.textContent = hk || String(i + 1);
                  }
                });
                draggedEl.classList.add("wpp-just-moved");
                var movedRef = draggedEl;
                setTimeout(function() {
                  movedRef.classList.remove("wpp-just-moved");
                }, 600);
                self.plugin.setSessionOrderFromVisible(newVisibleOrder, { syncCommands: false });
              }
              document.addEventListener("mousemove", onMouseMove);
              document.addEventListener("mouseup", onMouseUp);
            });
          });
        };
        SessionManagerModal2.prototype.onSave = function() {
          var L = i18n2.L;
          var self = this;
          var selectedGroupId = this.getModalGroupId();
          this.plugin.createSessionForViewedGroup(this.nameInput.value, selectedGroupId).then(function(result) {
            if (!result || !result.created) return;
            var createdName = result.name;
            self.modalGroupId = result.viewGroupId || null;
            self.nameInput.value = "";
            self.renderGroupTabs();
            self.renderList();
            new obsidian2.Notice(L.created(createdName));
          });
        };
        SessionManagerModal2.prototype.onLoad = function(sessionId) {
          if (sessionId === this.plugin.data.activeSessionId) return;
          var self = this;
          this.plugin.switchSession(sessionId).then(function(switched) {
            if (switched) self.close();
          });
        };
        SessionManagerModal2.prototype.onRename = function(session) {
          var self = this;
          sessionListActions.renameSessionWithPrompt({
            app: this.app,
            plugin: this.plugin,
            session,
            onRenamed: function() {
              self.renderList();
            }
          });
        };
        SessionManagerModal2.prototype.onDelete = function(session) {
          var L = i18n2.L;
          var self = this;
          var isActive = session.id === this.plugin.data.activeSessionId;
          var message = isActive ? L.confirmDeleteActive(session.name) : L.confirmDelete(session.name);
          return sessionListActions.deleteSessionWithPrompt({
            app: this.app,
            plugin: this.plugin,
            session,
            isActive,
            confirmMessage: message,
            forceConfirm: true,
            onDeleted: function() {
              self.renderList();
            }
          });
        };
        SessionManagerModal2.prototype.updateFocusUI = function() {
          var self = this;
          var items = this.listEl.querySelectorAll(".wpp-session-item");
          var focusedIndex = -1;
          if (this.keyboardTarget && this.keyboardTarget.zone === "session-action") {
            focusedIndex = typeof this.keyboardTarget.rowIndex === "number" ? this.keyboardTarget.rowIndex : -1;
          }
          this.focusedIndex = focusedIndex;
          items.forEach(function(el, i) {
            el.classList.toggle("wpp-focused", i === focusedIndex);
          });
          if (focusedIndex >= 0 && items[focusedIndex]) {
            items[focusedIndex].scrollIntoView({ block: "nearest" });
          }
        };
        SessionManagerModal2.prototype.updateSelectionUI = function() {
          var self = this;
          var items = this.listEl.querySelectorAll(".wpp-session-item");
          items.forEach(function(el) {
            el.classList.toggle("wpp-selected", self.selectedIds.has(el.dataset.sessionId));
          });
          this.updateBulkActions();
        };
        SessionManagerModal2.prototype.updateBulkActions = function() {
          var L = i18n2.L;
          if (this.selectedIds.size > 0) {
            this.bulkActionsEl.style.display = "";
            this.bulkDeleteBtn.textContent = L.bulkDelete(this.selectedIds.size);
          } else {
            this.bulkActionsEl.style.display = "none";
          }
        };
        SessionManagerModal2.prototype.onFocusedLoad = function() {
          var sessions = this.getNavigationSessions();
          var rowIndex = this.keyboardTarget && this.keyboardTarget.zone === "session-action" ? this.keyboardTarget.rowIndex : this.focusedIndex;
          if (rowIndex == null || rowIndex < 0 || rowIndex >= sessions.length) return;
          this.onLoad(sessions[rowIndex].id);
        };
        SessionManagerModal2.prototype.onBulkDelete = function() {
          var L = i18n2.L;
          var self = this;
          var ids = [];
          this.selectedIds.forEach(function(id) {
            ids.push(id);
          });
          var count = ids.length;
          new ConfirmModal(this.app, L.confirmBulkDelete(count), function() {
            var promises = ids.map(function(id) {
              return self.plugin.deleteSession(id);
            });
            return Promise.all(promises).then(function(results) {
              var deletedCount = results.filter(function(d) {
                return d;
              }).length;
              self.selectedIds.clear();
              self.renderList();
              if (deletedCount > 0) {
                new obsidian2.Notice(L.bulkDeleted(deletedCount));
              }
            });
          }).open();
        };
        SessionManagerModal2.prototype.renderGroupTabs = function() {
          var L = i18n2.L;
          var self = this;
          var el = this.groupTabsRow;
          while (el.firstChild) el.removeChild(el.firstChild);
          if (!this.plugin.isGroupFeatureEnabled()) {
            el.style.display = "none";
            return;
          }
          el.style.display = "";
          var groups = this.plugin.data.groups || {};
          var selectedGroupId = this.getModalGroupId();
          var groupOrder = this.plugin.getOrderedGroupTabIds();
          groupTabUi.renderGroupTabs({
            app: this.app,
            plugin: this.plugin,
            containerEl: el,
            groups,
            groupOrder,
            selectedGroupId,
            onSelectGroup: function(groupId) {
              self.selectGroup(groupId);
            },
            onResetViewGroup: function() {
              self.modalGroupId = null;
            },
            onDeleteGroup: function(deletedGroupId) {
              if (self.modalGroupId === deletedGroupId) {
                self.modalGroupId = self.plugin.data.activeGroupId || null;
              }
            },
            onGroupsChanged: function() {
              self.renderGroupTabs();
            },
            onSessionsChanged: function() {
              self.renderList();
            },
            onGroupOrderCommit: function(newOrder) {
              self.plugin.setGroupTabOrder(newOrder);
            },
            addButtonTooltip: L.groupCreateNew,
            onAddGroupClick: function() {
              groupTabUi.openCreateGroupPrompt(self.app, self.plugin, function() {
                self.renderGroupTabs();
              });
            }
          });
        };
        SessionManagerModal2.prototype.onClose = function() {
          document.body.classList.remove("wpp-session-list-dragging");
          if (this.modalKeyHandler) {
            document.removeEventListener("keydown", this.modalKeyHandler, true);
            this.modalKeyHandler = null;
          }
          if (this.contentFocusHandler) {
            this.contentEl.removeEventListener("focusin", this.contentFocusHandler, true);
            this.contentFocusHandler = null;
          }
          this.contentEl.empty();
        };
        return SessionManagerModal2;
      }(obsidian2.Modal)
    );
    module2.exports = SessionManagerModal;
  }
});

// src/modals/unsaved-switch-modal.js
var require_unsaved_switch_modal = __commonJS({
  "src/modals/unsaved-switch-modal.js"(exports2, module2) {
    "use strict";
    var obsidian2 = require("obsidian");
    var i18n2 = require_i18n();
    var UnsavedSwitchModal = (
      /** @class */
      function(_super) {
        function UnsavedSwitchModal2(app, message, onSaveAndSwitch, onSwitchWithoutSaving, onCancel) {
          var _this = _super.call(this, app) || this;
          _this.message = message;
          _this.onSaveAndSwitch = onSaveAndSwitch;
          _this.onSwitchWithoutSaving = onSwitchWithoutSaving;
          _this.onCancel = onCancel || function() {
          };
          _this.didResolve = false;
          return _this;
        }
        UnsavedSwitchModal2.prototype = Object.create(_super.prototype);
        UnsavedSwitchModal2.prototype.constructor = UnsavedSwitchModal2;
        UnsavedSwitchModal2.prototype.onOpen = function() {
          var L = i18n2.L;
          this.containerEl.style.zIndex = "10001";
          var contentEl = this.contentEl;
          contentEl.createEl("p", { text: this.message });
          var btns = contentEl.createDiv({ cls: "wpp-confirm-buttons" });
          var self = this;
          function finish(callback) {
            if (self.didResolve) return;
            self.didResolve = true;
            if (callback) callback();
          }
          var cancelBtn = btns.createEl("button", { text: L.cancel });
          cancelBtn.addEventListener("click", function() {
            finish(self.onCancel);
            self.close();
          });
          var saveAndSwitchBtn = btns.createEl("button", { text: L.saveAndSwitch, cls: "mod-cta" });
          saveAndSwitchBtn.addEventListener("click", function() {
            finish(self.onSaveAndSwitch);
            self.close();
          });
          var switchWithoutSavingBtn = btns.createEl("button", {
            text: L.switchWithoutSaving,
            cls: "mod-warning"
          });
          switchWithoutSavingBtn.addEventListener("click", function() {
            finish(self.onSwitchWithoutSaving);
            self.close();
          });
          this.buttons = [cancelBtn, saveAndSwitchBtn, switchWithoutSavingBtn];
          this.focusedButtonIndex = 1;
          this.updateButtonFocus();
          this.keyHandler = function(e) {
            if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
              e.preventDefault();
              self.focusedButtonIndex = (self.focusedButtonIndex - 1 + self.buttons.length) % self.buttons.length;
              self.updateButtonFocus();
              return;
            }
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
              e.preventDefault();
              self.focusedButtonIndex = (self.focusedButtonIndex + 1) % self.buttons.length;
              self.updateButtonFocus();
              return;
            }
            if (e.key === "Enter") {
              e.preventDefault();
              var btn = self.buttons[self.focusedButtonIndex];
              if (btn) btn.click();
              return;
            }
            if (e.key === "Escape") {
              e.preventDefault();
              e.stopImmediatePropagation();
              finish(self.onCancel);
              self.close();
            }
          };
          document.addEventListener("keydown", this.keyHandler, true);
        };
        UnsavedSwitchModal2.prototype.updateButtonFocus = function() {
          var self = this;
          this.buttons.forEach(function(btn, i) {
            btn.classList.toggle("wpp-btn-focused", i === self.focusedButtonIndex);
          });
        };
        UnsavedSwitchModal2.prototype.onClose = function() {
          if (this.keyHandler) {
            document.removeEventListener("keydown", this.keyHandler, true);
            this.keyHandler = null;
          }
          if (!this.didResolve) {
            this.didResolve = true;
            this.onCancel();
          }
          this.contentEl.empty();
        };
        return UnsavedSwitchModal2;
      }(obsidian2.Modal)
    );
    module2.exports = UnsavedSwitchModal;
  }
});

// src/modals/index.js
var require_modals = __commonJS({
  "src/modals/index.js"(exports2, module2) {
    "use strict";
    var SessionManagerModal = require_session_manager_modal();
    var ConfirmModal = require_confirm_modal();
    var RenameModal = require_rename_modal();
    var UnsavedSwitchModal = require_unsaved_switch_modal();
    var HistoryModal = require_history_modal();
    module2.exports = {
      SessionManagerModal,
      ConfirmModal,
      RenameModal,
      UnsavedSwitchModal,
      HistoryModal
    };
  }
});

// src/modals.js
var require_modals2 = __commonJS({
  "src/modals.js"(exports2, module2) {
    "use strict";
    module2.exports = require_modals();
  }
});

// src/statusbar-actions.js
var require_statusbar_actions = __commonJS({
  "src/statusbar-actions.js"(exports2, module2) {
    "use strict";
    var obsidian2 = require("obsidian");
    var i18n2 = require_i18n();
    var modals2 = require_modals2();
    var sessionContextMenu = require_session_context_menu();
    var settingsContextMenu = require_settings_context_menu();
    function openSessionMenuAction(plugin, event) {
      var L = i18n2.L;
      var app = plugin.app;
      var sess = plugin.getActiveSession();
      if (!sess) return;
      sessionContextMenu.openSessionContextMenu({
        plugin,
        app,
        session: sess,
        isActive: true,
        event,
        showSaveAs: true,
        showSwitch: false,
        showRemoveFromGroup: false,
        showMoveToGroup: plugin.isGroupFeatureEnabled() && plugin.getOrderedGroups().length > 0,
        showCustomizeClicks: true,
        onMoveToGroup: function(groupId) {
          var gName = (plugin.data.groups[groupId] || {}).name || "";
          plugin.moveSessionToGroupExclusive(sess.id, groupId).then(function(moved) {
            if (moved) {
              new obsidian2.Notice(L.groupAddedSession(sess.name, gName));
              plugin.updateStatusBar();
            }
          });
        },
        onSave: function() {
          plugin.saveActiveSession();
        },
        onReload: function() {
          plugin.reloadCurrentSessionWithoutSaving();
        },
        onSaveAs: function() {
          plugin.saveAsSession();
        },
        onRename: function() {
          new modals2.RenameModal(app, sess.name, function(newName) {
            plugin.renameSessionById(sess.id, newName);
          }, {
            emptyNotice: L.emptyName
          }).open();
        },
        onDuplicate: function() {
          plugin.duplicateSession(sess.id);
        },
        onDelete: function() {
          new modals2.ConfirmModal(app, L.confirmDeleteActive(sess.name), function() {
            plugin.deleteSession(sess.id);
          }).open();
        },
        onVersionHistory: function() {
          new modals2.HistoryModal(app, plugin, sess).open();
        }
      });
    }
    function openSettingsMenuAction(plugin, event) {
      var app = plugin.app;
      settingsContextMenu.openSettingsContextMenu({
        plugin,
        app,
        event,
        onChanged: function() {
          plugin.updateStatusBar();
        }
      });
    }
    function resolveLabel(L, labelKey) {
      var label = L[labelKey];
      return typeof label === "function" ? label() : label;
    }
    var ACTIONS = [
      {
        id: "quickSwitcher",
        labelKey: "statusBarActionQuickSwitcher",
        run: function(plugin) {
          if (plugin.searchOverlayEl) {
            plugin.hideSearchOverlay();
          } else {
            plugin.openSearchOverlay(plugin.statusBarEl);
          }
        }
      },
      {
        id: "sessionManager",
        labelKey: "statusBarActionSessionManager",
        run: function(plugin) {
          new modals2.SessionManagerModal(plugin.app, plugin).open();
        }
      },
      {
        id: "saveSession",
        labelKey: "statusBarActionSaveSession",
        run: function(plugin) {
          return plugin.saveActiveSession();
        }
      },
      {
        id: "saveAsSession",
        labelKey: "cmdSaveAs",
        run: function(plugin) {
          return plugin.saveAsSession();
        }
      },
      {
        id: "reloadWithoutSaving",
        labelKey: "statusBarActionReloadWithoutSaving",
        run: function(plugin) {
          return plugin.reloadCurrentSessionWithoutSaving();
        }
      },
      {
        id: "renameSession",
        labelKey: "cmdRename",
        run: function(plugin) {
          plugin.renameCurrentSession();
        }
      },
      {
        id: "duplicateSession",
        labelKey: "cmdDuplicate",
        run: function(plugin) {
          return plugin.duplicateCurrentSession();
        }
      },
      {
        id: "previousSession",
        labelKey: "cmdPrevious",
        run: function(plugin) {
          return plugin.switchRelativeFromStatusBar(-1);
        }
      },
      {
        id: "nextSession",
        labelKey: "cmdNext",
        run: function(plugin) {
          return plugin.switchRelativeFromStatusBar(1);
        }
      },
      {
        id: "newEmptySession",
        labelKey: "cmdNewEmpty",
        run: function(plugin) {
          return plugin.createEmptySession();
        }
      },
      {
        id: "toggleAutoSaveOnSwitch",
        labelKey: "cmdToggleAutoSave",
        run: function(plugin) {
          return plugin.toggleAutoSaveOnSwitch({ notify: true });
        }
      },
      {
        id: "versionHistory",
        labelKey: "statusBarActionVersionHistory",
        run: function(plugin) {
          var session = plugin.getActiveSession();
          if (session) {
            new modals2.HistoryModal(plugin.app, plugin, session).open();
          }
        }
      },
      {
        id: "restoreLatestHistory",
        labelKey: "statusBarActionRestoreLatestHistory",
        run: function(plugin) {
          var L = i18n2.L;
          if (!plugin.isVersionHistoryEnabled()) {
            new obsidian2.Notice(L.historyNoEntries);
            return;
          }
          var activeSession = plugin.getActiveSession();
          if (!activeSession || !activeSession.history || activeSession.history.length === 0) {
            new obsidian2.Notice(L.historyNoEntries);
            return;
          }
          if (plugin.isVersionHistoryConfirmRestoreEnabled()) {
            var latestTime = new Date(activeSession.history[0].savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            new modals2.ConfirmModal(
              plugin.app,
              L.historyRestoreConfirm(activeSession.name, latestTime),
              function() {
                plugin.quickRestoreLatestHistory();
              },
              { confirmText: L.historyRestore, confirmClass: "mod-cta" }
            ).open();
          } else {
            plugin.quickRestoreLatestHistory();
          }
        }
      },
      {
        id: "sessionMenu",
        labelKey: "statusBarActionSessionMenu",
        run: function(plugin, event) {
          openSessionMenuAction(plugin, event);
        }
      },
      {
        id: "settingsMenu",
        labelKey: "statusBarActionSettingsMenu",
        run: function(plugin, event) {
          openSettingsMenuAction(plugin, event);
        }
      },
      {
        id: "none",
        labelKey: "statusBarActionNone",
        run: function() {
        }
      }
    ];
    var ACTION_INDEX = {};
    for (actionIndex = 0; actionIndex < ACTIONS.length; actionIndex++) {
      ACTION_INDEX[ACTIONS[actionIndex].id] = ACTIONS[actionIndex];
    }
    var actionIndex;
    function executeStatusBarAction(plugin, actionId, event) {
      if (!actionId || actionId === "none") return;
      var action = ACTION_INDEX[actionId];
      if (!action) return;
      return action.run(plugin, event);
    }
    function getActionLabel(L, actionId) {
      var action = ACTION_INDEX[actionId] || ACTION_INDEX.none;
      return resolveLabel(L, action.labelKey);
    }
    var ACTION_IDS = ACTIONS.map(function(action) {
      return action.id;
    });
    var SLOT_KEYS = [
      "click",
      "altClick",
      "modClick",
      "shiftClick",
      "middleClick",
      "altMiddleClick",
      "modMiddleClick",
      "shiftMiddleClick",
      "rightClick",
      "altRightClick",
      "modRightClick",
      "shiftRightClick"
    ];
    module2.exports = {
      executeStatusBarAction,
      getActionLabel,
      ACTION_IDS,
      SLOT_KEYS
    };
  }
});

// src/plugin/default-data.js
var require_default_data = __commonJS({
  "src/plugin/default-data.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      activeSessionId: null,
      sessions: {},
      sessionOrder: [],
      language: "auto",
      previewNext: true,
      previewPrevious: true,
      confirmDeleteByHotkey: true,
      confirmQuickActions: false,
      autoSaveOnSwitch: true,
      warnOnUnsavedSwitch: true,
      statusBarQuickSwitcher: true,
      groupFeatureEnabled: true,
      showFilterInput: false,
      overlayDefaultFocus: "current-session",
      showActiveSwitchCommand: false,
      numberedSwitchCommands: true,
      searchOverlayPosition: null,
      searchOverlaySize: null,
      groups: {},
      groupOrder: [],
      sessionGroups: {},
      activeGroupId: null,
      versionHistoryEnabled: true,
      versionHistorySnapshotInterval: 5,
      versionHistoryCtrlRmbRestore: true,
      versionHistoryConfirmRestore: true,
      statusBarModScrollSwitch: true,
      statusBarScrollPreset: "trackpad",
      statusBarScrollModifierMode: "none",
      statusBarScrollThreshold: 30,
      statusBarScrollCooldownMs: 500,
      statusBarScrollResetMs: 250,
      statusBarScrollInvert: false,
      statusBarActions: {
        click: "quickSwitcher",
        altClick: "reloadWithoutSaving",
        modClick: "saveSession",
        shiftClick: "none",
        middleClick: "none",
        altMiddleClick: "none",
        modMiddleClick: "reloadWithoutSaving",
        shiftMiddleClick: "none",
        rightClick: "sessionMenu",
        altRightClick: "none",
        modRightClick: "restoreLatestHistory",
        shiftRightClick: "none"
      }
    };
  }
});

// src/settings.js
var require_settings = __commonJS({
  "src/settings.js"(exports2) {
    "use strict";
    var obsidian2 = require("obsidian");
    var i18n2 = require_i18n();
    var modals2 = require_modals2();
    var formatRelativeTime = require_format_relative_time();
    var statusBarActions2 = require_statusbar_actions();
    var DEFAULT_DATA2 = require_default_data();
    var GroupSessionsModal = (
      /** @class */
      function(_super) {
        function GroupSessionsModal2(app, plugin, group) {
          var _this = _super.call(this, app) || this;
          _this.plugin = plugin;
          _this.group = group;
          return _this;
        }
        GroupSessionsModal2.prototype = Object.create(_super.prototype);
        GroupSessionsModal2.prototype.constructor = GroupSessionsModal2;
        GroupSessionsModal2.prototype.onOpen = function() {
          var L = i18n2.L;
          var self = this;
          var contentEl = this.contentEl;
          contentEl.empty();
          contentEl.createEl("h3", { text: self.group.name + " \u2014 " + L.settingsGroupManageSessions });
          var allSessions = self.plugin.getOrderedSessionsUnfiltered();
          var memberIds = self.plugin.getGroupSessionIds(self.group.id);
          for (var i = 0; i < allSessions.length; i++) {
            (function(session) {
              var isMember = memberIds.indexOf(session.id) !== -1;
              new obsidian2.Setting(contentEl).setName(session.name).addToggle(function(toggle) {
                toggle.setValue(isMember);
                toggle.onChange(function(value) {
                  if (value) {
                    self.plugin.addSessionToGroup(session.id, self.group.id);
                  } else {
                    self.plugin.removeSessionFromGroup(session.id, self.group.id);
                  }
                });
              });
            })(allSessions[i]);
          }
        };
        GroupSessionsModal2.prototype.onClose = function() {
          this.contentEl.empty();
        };
        return GroupSessionsModal2;
      }(obsidian2.Modal)
    );
    function applyWarningStyle(btn) {
      if (typeof btn.setWarning === "function") {
        btn.setWarning();
        return;
      }
      if (btn.buttonEl) {
        btn.buttonEl.addClass("mod-warning");
      }
    }
    function resolveSettingText(value) {
      return typeof value === "function" ? value() : value;
    }
    function addToggleSetting(parentEl, options) {
      var setting = new obsidian2.Setting(parentEl).setName(resolveSettingText(options.name));
      if (options.desc) {
        setting.setDesc(resolveSettingText(options.desc));
      }
      setting.addToggle(function(toggle) {
        toggle.setValue(!!options.value);
        if (options.disabled && typeof toggle.setDisabled === "function") {
          toggle.setDisabled(true);
        }
        toggle.onChange(function(value) {
          options.onChange(value);
        });
      });
      return setting;
    }
    function addDropdownSetting(parentEl, options) {
      var setting = new obsidian2.Setting(parentEl).setName(resolveSettingText(options.name));
      if (options.desc) {
        setting.setDesc(resolveSettingText(options.desc));
      }
      setting.addDropdown(function(dropdown) {
        var optionKeys = Object.keys(options.items || {});
        for (var i = 0; i < optionKeys.length; i++) {
          dropdown.addOption(optionKeys[i], resolveSettingText(options.items[optionKeys[i]]));
        }
        dropdown.setValue(String(options.value));
        if (options.disabled && typeof dropdown.setDisabled === "function") {
          dropdown.setDisabled(true);
        }
        dropdown.onChange(function(value) {
          options.onChange(value);
        });
      });
      return setting;
    }
    function addSubsection(parentEl, title) {
      var headingEl = parentEl.createEl("h4", { text: resolveSettingText(title) });
      headingEl.addClass("wpp-settings-subsection");
      return headingEl;
    }
    function addDangerResetSetting(parentEl, app, display, options) {
      new obsidian2.Setting(parentEl).setName(resolveSettingText(options.name)).setDesc(resolveSettingText(options.desc)).addButton(function(btn) {
        var isRunning = false;
        btn.setButtonText(resolveSettingText(options.buttonText));
        applyWarningStyle(btn);
        btn.onClick(function() {
          if (isRunning) return;
          var confirmOptions = {
            confirmText: options.buttonText
          };
          if (options.confirmHint) {
            confirmOptions.hint = options.confirmHint;
          }
          new modals2.ConfirmModal(app, options.confirmMessage, function() {
            isRunning = true;
            btn.setDisabled(true);
            return options.run().then(function() {
              new obsidian2.Notice(options.successNotice);
            }).catch(function() {
              new obsidian2.Notice(options.failureNotice);
            }).then(function() {
              isRunning = false;
              btn.setDisabled(false);
              display();
            });
          }, confirmOptions).open();
        });
      });
    }
    function addAsyncActionSetting(parentEl, options) {
      new obsidian2.Setting(parentEl).setName(resolveSettingText(options.name)).setDesc(resolveSettingText(options.desc)).addButton(function(btn) {
        btn.setButtonText(resolveSettingText(options.buttonText));
        if (options.disabled) {
          btn.setDisabled(true);
        }
        btn.onClick(function() {
          options.run().then(function() {
            if (options.onSuccess) options.onSuccess();
          }).catch(function() {
            if (options.failureNotice) {
              new obsidian2.Notice(options.failureNotice);
            }
          });
        });
      });
    }
    var WorkspacePlusPlusSettingTab = (
      /** @class */
      function(_super) {
        function WorkspacePlusPlusSettingTab2(app, plugin) {
          var _this = _super.call(this, app, plugin) || this;
          _this.plugin = plugin;
          return _this;
        }
        WorkspacePlusPlusSettingTab2.prototype = Object.create(_super.prototype);
        WorkspacePlusPlusSettingTab2.prototype.constructor = WorkspacePlusPlusSettingTab2;
        WorkspacePlusPlusSettingTab2.prototype.display = function() {
          var L = i18n2.L;
          var self = this;
          var containerEl = this.containerEl;
          containerEl.empty();
          if (!self.activeTab) self.activeTab = "general";
          var tabs = [
            { id: "general", label: L.settingsSectionGeneral },
            { id: "sessions", label: L.settingsTabSessions },
            { id: "groups", label: L.settingsSectionGroups },
            { id: "advanced", label: L.settingsSectionAdvanced }
          ];
          var tabBarEl = containerEl.createDiv({ cls: "wpp-settings-tab-bar" });
          for (var ti = 0; ti < tabs.length; ti++) {
            (function(tab) {
              var btn = tabBarEl.createEl("button", {
                text: tab.label,
                cls: "wpp-settings-tab" + (tab.id === self.activeTab ? " is-active" : "")
              });
              btn.addEventListener("click", function() {
                self.activeTab = tab.id;
                self.display();
              });
            })(tabs[ti]);
          }
          var contentEl = containerEl.createDiv({ cls: "wpp-settings-tab-content" });
          function addSection(title) {
            contentEl.createEl("h3", { text: title, cls: "wpp-settings-section-title" });
          }
          if (self.activeTab === "general") {
            new obsidian2.Setting(contentEl).setName(L.settingsLanguage).setDesc(L.settingsLanguageDesc).addDropdown(function(dropdown) {
              dropdown.addOption("auto", L.settingsLangAuto);
              var order = i18n2.LANG_ORDER;
              for (var i = 0; i < order.length; i++) {
                dropdown.addOption(order[i], i18n2.LANG_OPTIONS[order[i]]);
              }
              dropdown.setValue(self.plugin.data.language || "auto");
              dropdown.onChange(function(value) {
                self.plugin.data.language = value;
                i18n2.resolveLocale(value);
                self.plugin.persistData();
                self.display();
              });
            });
            new obsidian2.Setting(contentEl).setName(L.settingsHotkeys).addButton(function(btn) {
              btn.setButtonText(L.settingsHotkeysBtn);
              btn.onClick(function() {
                self.app.setting.openTabById("hotkeys");
                var sc = self.app.setting.activeTab.searchComponent;
                var pluginName = self.plugin.manifest && self.plugin.manifest.name ? self.plugin.manifest.name : "Workspace++";
                sc.setValue(pluginName);
                sc.inputEl.dispatchEvent(new Event("input"));
              });
            });
            addSection(L.settingsSectionStatusBar);
            var slotKeys = statusBarActions2.SLOT_KEYS;
            var actionIds = statusBarActions2.ACTION_IDS;
            var slotLabelMap = {
              click: "statusBarSlotClick",
              altClick: "statusBarSlotAltClick",
              modClick: "statusBarSlotModClick",
              shiftClick: "statusBarSlotShiftClick",
              middleClick: "statusBarSlotMiddleClick",
              altMiddleClick: "statusBarSlotAltMiddleClick",
              modMiddleClick: "statusBarSlotModMiddleClick",
              shiftMiddleClick: "statusBarSlotShiftMiddleClick",
              rightClick: "statusBarSlotRightClick",
              altRightClick: "statusBarSlotAltRightClick",
              modRightClick: "statusBarSlotModRightClick",
              shiftRightClick: "statusBarSlotShiftRightClick"
            };
            for (var si = 0; si < slotKeys.length; si++) {
              (function(slotKey) {
                var labelKey = slotLabelMap[slotKey];
                var slotLabel = typeof L[labelKey] === "function" ? L[labelKey]() : L[labelKey];
                new obsidian2.Setting(contentEl).setName(slotLabel).addDropdown(function(dropdown) {
                  for (var ai = 0; ai < actionIds.length; ai++) {
                    var aid = actionIds[ai];
                    dropdown.addOption(aid, statusBarActions2.getActionLabel(L, aid));
                  }
                  dropdown.setValue((self.plugin.data.statusBarActions || {})[slotKey] || "none");
                  dropdown.onChange(function(value) {
                    if (!self.plugin.data.statusBarActions) {
                      self.plugin.data.statusBarActions = Object.assign({}, DEFAULT_DATA2.statusBarActions);
                    }
                    self.plugin.data.statusBarActions[slotKey] = value;
                    self.plugin.persistData();
                  });
                });
              })(slotKeys[si]);
            }
          }
          if (self.activeTab === "sessions") {
            addSubsection(contentEl, L.settingsSubsectionAutoSaveMode);
            var autoSaveOnSwitch = self.plugin.isAutoSaveOnSwitchEnabled();
            new obsidian2.Setting(contentEl).setName(L.settingsAutoSaveOnSwitch).setDesc(L.settingsAutoSaveOnSwitchDesc).addToggle(function(toggle) {
              toggle.setValue(autoSaveOnSwitch);
              toggle.onChange(function(value) {
                self.plugin.setAutoSaveOnSwitch(value).then(function() {
                  self.display();
                });
              });
            });
            if (!autoSaveOnSwitch) {
              addToggleSetting(contentEl, {
                name: L.settingsWarnUnsavedSwitch,
                desc: L.settingsWarnUnsavedSwitchDesc,
                value: self.plugin.isWarnOnUnsavedSwitchEnabled(),
                onChange: function(value) {
                  self.plugin.data.warnOnUnsavedSwitch = value;
                  self.plugin.persistData();
                }
              });
              addToggleSetting(contentEl, {
                name: L.settingsConfirmQuickActions,
                desc: L.settingsConfirmQuickActionsDesc,
                value: !!self.plugin.data.confirmQuickActions,
                onChange: function(value) {
                  self.plugin.data.confirmQuickActions = value;
                  self.plugin.persistData();
                }
              });
            }
            addSubsection(contentEl, L.settingsSubsectionScrollSwitch);
            addToggleSetting(contentEl, {
              name: L.settingsStatusBarModScrollSwitch,
              desc: L.settingsStatusBarModScrollSwitchDesc,
              value: !!self.plugin.data.statusBarModScrollSwitch,
              onChange: function(value) {
                self.plugin.data.statusBarModScrollSwitch = value;
                self.plugin.persistData();
                self.display();
              }
            });
            if (self.plugin.data.statusBarModScrollSwitch) {
              addDropdownSetting(contentEl, {
                name: L.settingsStatusBarScrollPreset,
                desc: L.settingsStatusBarScrollPresetDesc,
                value: self.plugin.data.statusBarScrollPreset || "trackpad",
                items: {
                  trackpad: L.settingsStatusBarScrollPresetTrackpad,
                  notchedWheel: L.settingsStatusBarScrollPresetNotchedWheel,
                  freeSpinWheel: L.settingsStatusBarScrollPresetFreeSpinWheel,
                  custom: L.settingsStatusBarScrollPresetCustom
                },
                onChange: function(value) {
                  self.plugin.data.statusBarScrollPreset = value;
                  self.plugin.persistData();
                  self.display();
                }
              });
              addDropdownSetting(contentEl, {
                name: L.settingsStatusBarScrollModifier,
                desc: L.settingsStatusBarScrollModifierDesc,
                value: self.plugin.data.statusBarScrollModifierMode === "recommended" ? "modOrAlt" : self.plugin.data.statusBarScrollModifierMode || "none",
                items: {
                  none: L.settingsStatusBarScrollModifierNone,
                  modOnly: L.settingsStatusBarScrollModifierModOnly,
                  altOnly: L.settingsStatusBarScrollModifierAltOnly,
                  modOrAlt: L.settingsStatusBarScrollModifierModOrAlt
                },
                onChange: function(value) {
                  self.plugin.data.statusBarScrollModifierMode = value;
                  self.plugin.persistData();
                }
              });
              var useCustomScroll = (self.plugin.data.statusBarScrollPreset || "trackpad") === "custom";
              addDropdownSetting(contentEl, {
                name: L.settingsStatusBarScrollThreshold,
                desc: L.settingsStatusBarScrollThresholdDesc,
                value: String(self.plugin.data.statusBarScrollThreshold || 30),
                disabled: !useCustomScroll,
                items: {
                  "12": "12",
                  "16": "16",
                  "24": "24",
                  "30": "30",
                  "40": "40",
                  "60": "60",
                  "90": "90"
                },
                onChange: function(value) {
                  self.plugin.data.statusBarScrollThreshold = Number(value) || 30;
                  self.plugin.persistData();
                }
              });
              addDropdownSetting(contentEl, {
                name: L.settingsStatusBarScrollCooldown,
                desc: L.settingsStatusBarScrollCooldownDesc,
                value: String(self.plugin.data.statusBarScrollCooldownMs || 500),
                disabled: !useCustomScroll,
                items: {
                  "200": "200 ms",
                  "350": "350 ms",
                  "500": "500 ms",
                  "750": "750 ms",
                  "1000": "1000 ms"
                },
                onChange: function(value) {
                  self.plugin.data.statusBarScrollCooldownMs = Number(value) || 500;
                  self.plugin.persistData();
                }
              });
              addDropdownSetting(contentEl, {
                name: L.settingsStatusBarScrollResetWindow,
                desc: L.settingsStatusBarScrollResetWindowDesc,
                value: String(self.plugin.data.statusBarScrollResetMs || 250),
                disabled: !useCustomScroll,
                items: {
                  "150": "150 ms",
                  "250": "250 ms",
                  "400": "400 ms",
                  "600": "600 ms"
                },
                onChange: function(value) {
                  self.plugin.data.statusBarScrollResetMs = Number(value) || 250;
                  self.plugin.persistData();
                }
              });
              addToggleSetting(contentEl, {
                name: L.settingsStatusBarScrollInvert,
                desc: L.settingsStatusBarScrollInvertDesc,
                value: !!self.plugin.data.statusBarScrollInvert,
                onChange: function(value) {
                  self.plugin.data.statusBarScrollInvert = value;
                  self.plugin.persistData();
                }
              });
            }
            addSubsection(contentEl, L.settingsSubsectionSwitchCommands);
            addToggleSetting(contentEl, {
              name: L.settingsShowActiveSwitchCommand,
              desc: L.settingsShowActiveSwitchCommandDesc,
              value: !!self.plugin.data.showActiveSwitchCommand,
              onChange: function(value) {
                self.plugin.data.showActiveSwitchCommand = value;
                self.plugin.persistData();
              }
            });
            addToggleSetting(contentEl, {
              name: L.settingsNumberedSwitchCommands,
              desc: L.settingsNumberedSwitchCommandsDesc,
              value: !!self.plugin.data.numberedSwitchCommands,
              onChange: function(value) {
                self.plugin.data.numberedSwitchCommands = value;
                self.plugin.persistData();
                self.plugin.syncSessionCommands();
              }
            });
            addSubsection(contentEl, L.settingsSubsectionSwitchPreview);
            var allOn = !!self.plugin.data.previewNext && !!self.plugin.data.previewPrevious;
            var masterSetting = new obsidian2.Setting(contentEl).setName(L.settingsPreviewHeading).setDesc(L.settingsPreviewDesc).addToggle(function(toggle) {
              toggle.setValue(allOn);
              toggle.onChange(function(value) {
                self.plugin.data.previewNext = value;
                self.plugin.data.previewPrevious = value;
                self.plugin.persistData();
                self.display();
              });
            });
            masterSetting.settingEl.addClass("wpp-has-nested");
            var nestedDiv = masterSetting.settingEl.createDiv({ cls: "wpp-nested-settings" });
            new obsidian2.Setting(nestedDiv).setName(L.settingsPreviewNext).addToggle(function(toggle) {
              toggle.setValue(!!self.plugin.data.previewNext);
              toggle.onChange(function(value) {
                self.plugin.data.previewNext = value;
                self.plugin.persistData();
                self.display();
              });
            });
            new obsidian2.Setting(nestedDiv).setName(L.settingsPreviewPrevious).addToggle(function(toggle) {
              toggle.setValue(!!self.plugin.data.previewPrevious);
              toggle.onChange(function(value) {
                self.plugin.data.previewPrevious = value;
                self.plugin.persistData();
                self.display();
              });
            });
            addSection(L.settingsSectionSessionListSearch);
            addToggleSetting(contentEl, {
              name: L.settingsShowFilterInput,
              desc: L.settingsShowFilterInputDesc,
              value: !!self.plugin.data.showFilterInput,
              onChange: function(value) {
                self.plugin.data.showFilterInput = value;
                self.plugin.persistData();
              }
            });
            new obsidian2.Setting(contentEl).setName(L.settingsOverlayDefaultFocus).setDesc(L.settingsOverlayDefaultFocusDesc).addDropdown(function(dropdown) {
              dropdown.addOption("current-session", L.settingsOverlayFocusCurrentSession);
              dropdown.addOption("session-filter", L.settingsOverlayFocusSessionFilter);
              dropdown.addOption("session-create", L.settingsOverlayFocusSessionCreate);
              dropdown.setValue(self.plugin.data.overlayDefaultFocus || "current-session");
              dropdown.onChange(function(value) {
                self.plugin.data.overlayDefaultFocus = value;
                self.plugin.persistData();
              });
            });
            addSection(L.settingsSectionDeletion);
            addToggleSetting(contentEl, {
              name: L.settingsConfirmDelete,
              desc: L.settingsConfirmDeleteDesc,
              value: self.plugin.data.confirmDeleteByHotkey !== false,
              onChange: function(value) {
                self.plugin.data.confirmDeleteByHotkey = value;
                self.plugin.persistData();
              }
            });
            addSection(L.historyTitle);
            var versionHistoryEnabled = self.plugin.isVersionHistoryEnabled();
            var vhMasterSetting = new obsidian2.Setting(contentEl).setName(L.settingsVersionHistoryEnabled).setDesc(L.settingsVersionHistoryEnabledDesc).addToggle(function(toggle) {
              toggle.setValue(versionHistoryEnabled);
              toggle.onChange(function(value) {
                self.plugin.data.versionHistoryEnabled = value;
                self.plugin.persistData();
                if (value) {
                  self.plugin.startHistorySnapshotTimer();
                } else {
                  self.plugin.stopHistorySnapshotTimer();
                }
                self.display();
              });
            });
            vhMasterSetting.settingEl.addClass("wpp-has-nested");
            var vhNestedDiv = vhMasterSetting.settingEl.createDiv({ cls: "wpp-nested-settings" });
            if (self.plugin.isAutoSaveOnSwitchEnabled()) {
              new obsidian2.Setting(vhNestedDiv).setName(L.settingsVersionHistoryInterval).setDesc(L.settingsVersionHistoryIntervalDesc).addDropdown(function(dropdown) {
                dropdown.addOption("1", "1");
                dropdown.addOption("2", "2");
                dropdown.addOption("5", "5");
                dropdown.addOption("10", "10");
                dropdown.addOption("15", "15");
                dropdown.addOption("30", "30");
                dropdown.setValue(String(self.plugin.getVersionHistorySnapshotInterval()));
                if (!versionHistoryEnabled) dropdown.setDisabled(true);
                dropdown.onChange(function(value) {
                  self.plugin.data.versionHistorySnapshotInterval = parseInt(value, 10);
                  self.plugin.persistData();
                  self.plugin.startHistorySnapshotTimer();
                });
              });
            }
            addToggleSetting(vhNestedDiv, {
              name: L.settingsVersionHistoryConfirmRestore,
              desc: L.settingsVersionHistoryConfirmRestoreDesc,
              value: self.plugin.isVersionHistoryConfirmRestoreEnabled(),
              disabled: !versionHistoryEnabled,
              onChange: function(value) {
                self.plugin.data.versionHistoryConfirmRestore = value;
                self.plugin.persistData();
              }
            });
            addSection(L.rotationBackupSectionTitle);
            new obsidian2.Setting(contentEl).setName(L.rotationBackupCreate).setDesc(L.rotationBackupDesc).addButton(function(btn) {
              btn.setButtonText(L.rotationBackupCreateBtn);
              btn.onClick(function() {
                btn.setDisabled(true);
                var sessionData = self.plugin.extractSessionData(self.plugin.data);
                sessionData._wppSavedAt = Date.now();
                self.plugin.ensureDir(self.plugin.getBackupsDirPath()).then(function() {
                  return self.plugin.copyFileIfExists(
                    self.plugin.getRotationBackupPath(2),
                    self.plugin.getRotationBackupPath(3)
                  );
                }).then(function() {
                  return self.plugin.copyFileIfExists(
                    self.plugin.getRotationBackupPath(1),
                    self.plugin.getRotationBackupPath(2)
                  );
                }).then(function() {
                  return self.plugin.writeJson(
                    self.plugin.getRotationBackupPath(1),
                    sessionData
                  );
                }).then(function() {
                  self.plugin._lastRotationBackupAt = Date.now();
                  self.display();
                }).catch(function() {
                  btn.setDisabled(false);
                });
              });
            });
            var backupListEl = contentEl.createDiv({ cls: "wpp-backup-list" });
            backupListEl.createDiv({ text: L.rotationBackupNone, cls: "wpp-backup-none" });
            self.plugin.getRotationBackupInfo().then(function(backups) {
              backupListEl.empty();
              if (backups.length === 0) {
                backupListEl.createDiv({ text: L.rotationBackupNone, cls: "wpp-backup-none" });
                return;
              }
              for (var i = 0; i < backups.length; i++) {
                (function(backup) {
                  var absoluteTime = "";
                  try {
                    absoluteTime = new Date(backup.savedAt).toLocaleString();
                  } catch (e) {
                    absoluteTime = String(backup.savedAt);
                  }
                  var relativeTime = formatRelativeTime(backup.savedAt);
                  var setting = new obsidian2.Setting(backupListEl);
                  var nameEl = setting.nameEl;
                  var numSpan = document.createElement("span");
                  numSpan.textContent = backup.generation + ".";
                  numSpan.style.color = "var(--text-accent)";
                  numSpan.style.marginRight = "6px";
                  nameEl.appendChild(numSpan);
                  nameEl.appendText(relativeTime + "  \xB7  " + L.rotationBackupGeneration(backup.sessionCount));
                  setting.setDesc(absoluteTime).addButton(function(btn) {
                    btn.setButtonText(L.rotationBackupRestore);
                    btn.onClick(function() {
                      new modals2.ConfirmModal(
                        self.app,
                        L.rotationBackupRestoreConfirm(absoluteTime, backup.sessionCount),
                        function() {
                          return self.plugin.restoreFromRotationBackup(backup.generation).then(function(ok) {
                            if (ok) self.display();
                          });
                        },
                        { confirmText: L.rotationBackupRestore }
                      ).open();
                    });
                  });
                })(backups[i]);
              }
            });
          }
          if (self.activeTab === "groups") {
            addToggleSetting(contentEl, {
              name: L.settingsSectionGroups,
              desc: L.settingsSectionGroupsDesc,
              value: self.plugin.isGroupFeatureEnabled(),
              onChange: function(value) {
                self.plugin.setGroupFeatureEnabled(value).then(function() {
                  self.display();
                });
              }
            });
            if (self.plugin.isGroupFeatureEnabled()) {
              var createGroupSetting = new obsidian2.Setting(contentEl).setName(L.settingsGroupCreate).setDesc(L.settingsGroupCreateDesc);
              var groupNameInput = null;
              createGroupSetting.addText(function(text) {
                groupNameInput = text;
                text.setPlaceholder(L.settingsGroupCreatePlaceholder);
              });
              createGroupSetting.addButton(function(btn) {
                btn.setButtonText(L.settingsGroupCreateBtn);
                btn.onClick(function() {
                  if (!groupNameInput) return;
                  self.plugin.createGroupValidated(groupNameInput.getValue()).then(function(created) {
                    if (!created) return;
                    self.display();
                  });
                });
              });
              var orderedGroups = self.plugin.getOrderedGroups();
              for (var gIdx = 0; gIdx < orderedGroups.length; gIdx++) {
                (function(group) {
                  var sessionCount = self.plugin.getGroupSessionIds(group.id).length;
                  var groupSetting = new obsidian2.Setting(contentEl).setName(group.name).setDesc(L.settingsGroupManageSessionsDesc + " \xB7 " + L.settingsGroupSessionCount(sessionCount));
                  groupSetting.addButton(function(btn) {
                    btn.setButtonText(L.settingsGroupManageSessions);
                    btn.onClick(function() {
                      new GroupSessionsModal(self.app, self.plugin, group).open();
                    });
                  });
                  groupSetting.addExtraButton(function(btn) {
                    btn.setIcon("pencil");
                    btn.setTooltip(L.rename);
                    btn.onClick(function() {
                      new modals2.RenameModal(self.app, group.name, function(newName) {
                        self.plugin.renameGroupValidated(group.id, newName).then(function(renamed) {
                          if (!renamed) return;
                          self.display();
                        });
                      }, {
                        emptyNotice: L.groupEmptyName
                      }).open();
                    });
                  });
                  groupSetting.addExtraButton(function(btn) {
                    btn.setIcon("trash-2");
                    btn.setTooltip(L.settingsGroupDelete);
                    btn.onClick(function() {
                      new modals2.ConfirmModal(self.app, L.settingsGroupDeleteConfirm(group.name), function() {
                        self.plugin.deleteGroup(group.id).then(function() {
                          self.display();
                        });
                      }).open();
                    });
                  });
                })(orderedGroups[gIdx]);
              }
            }
          }
          if (self.activeTab === "advanced") {
            let addDevCardRow = function(label, value, options) {
              options = options || {};
              var row = devCardEl.createDiv({ cls: "wpp-dev-card-row" });
              row.createDiv({ text: label, cls: "wpp-dev-card-label" });
              row.createDiv({
                text: String(value),
                cls: options.code ? "wpp-dev-card-value wpp-dev-card-value-code" : "wpp-dev-card-value"
              });
            };
            addSection(L.settingsAdvancedStorageSubsection);
            var useLocalSettings = self.plugin.isUsingLocalSettings();
            addToggleSetting(contentEl, {
              name: L.settingsUseLocalSettings,
              desc: L.settingsUseLocalSettingsDesc,
              value: useLocalSettings,
              onChange: function(value) {
                self.plugin.setUseLocalSettings(value, { notify: true }).then(function() {
                  self.display();
                }).catch(function() {
                  new obsidian2.Notice(L.localSettingsOperationFailed);
                  self.display();
                });
              }
            });
            addAsyncActionSetting(contentEl, {
              name: L.settingsCopyGlobalToLocal,
              desc: L.settingsCopyGlobalToLocalDesc,
              buttonText: L.settingsCopyGlobalToLocalBtn,
              disabled: !useLocalSettings,
              run: function() {
                return self.plugin.copyGlobalSettingsToLocal({ notify: true });
              },
              onSuccess: function() {
                self.display();
              },
              failureNotice: L.localSettingsOperationFailed
            });
            addAsyncActionSetting(contentEl, {
              name: L.settingsResetLocalSettings,
              desc: L.settingsResetLocalSettingsDesc,
              buttonText: L.settingsResetLocalSettingsBtn,
              disabled: !useLocalSettings,
              run: function() {
                return self.plugin.resetLocalSettings({ notify: true });
              },
              onSuccess: function() {
                self.display();
              },
              failureNotice: L.localSettingsOperationFailed
            });
            addSection(L.settingsAdvancedTransferSubsection);
            new obsidian2.Setting(contentEl).setName(L.settingsExportSessions).setDesc(L.settingsExportSessionsDesc).addButton(function(btn) {
              btn.setButtonText(L.settingsExportSessionsBtn);
              btn.onClick(function() {
                self.plugin.exportSessionsSnapshot().catch(function() {
                  new obsidian2.Notice(L.exportSessionsFailed);
                });
              });
            });
            new obsidian2.Setting(contentEl).setName(L.settingsImportSessions).setDesc(L.settingsImportSessionsDesc).addButton(function(btn) {
              btn.setButtonText(L.settingsImportSessionsBtn);
              btn.onClick(function() {
                new modals2.ConfirmModal(self.app, L.confirmImportSessions, function() {
                  return self.plugin.importSessionsFromLatestExport().catch(function() {
                    new obsidian2.Notice(L.importSessionsFailed);
                  });
                }, {
                  confirmText: L.settingsImportSessionsBtn
                }).open();
              });
            });
            addSection(L.settingsSectionReset);
            addDangerResetSetting(contentEl, self.app, function() {
              self.display();
            }, {
              name: L.settingsResetSettings,
              desc: L.settingsResetSettingsDesc,
              buttonText: L.settingsResetSettingsBtn,
              confirmMessage: L.confirmResetSettings,
              run: function() {
                return self.plugin.resetSettingsToDefault();
              },
              successNotice: L.resetSettingsDone,
              failureNotice: L.resetSettingsFailed
            });
            addDangerResetSetting(contentEl, self.app, function() {
              self.display();
            }, {
              name: L.settingsResetSessions,
              desc: L.settingsResetSessionsDesc,
              buttonText: L.settingsResetSessionsBtn,
              confirmMessage: L.confirmResetSessions,
              confirmHint: L.resetSessionsHint,
              run: function() {
                return self.plugin.resetSessionsToDefault();
              },
              successNotice: L.resetSessionsDone,
              failureNotice: L.resetSessionsFailed
            });
            addDangerResetSetting(contentEl, self.app, function() {
              self.display();
            }, {
              name: L.settingsResetSessionsAndSettings,
              desc: L.settingsResetSessionsAndSettingsDesc,
              buttonText: L.settingsResetSessionsAndSettingsBtn,
              confirmMessage: L.confirmResetSessionsAndSettings,
              run: function() {
                return self.plugin.resetSessionsAndSettingsToDefault();
              },
              successNotice: L.resetSessionsAndSettingsDone,
              failureNotice: L.resetSessionsAndSettingsFailed
            });
            addSection(L.settingsDeveloperSection);
            var diagnosticsInfo = self.plugin.getStorageDiagnosticsInfo();
            var diagnosticsUpdatedText = "";
            try {
              diagnosticsUpdatedText = new Date(diagnosticsInfo.updatedAt).toLocaleString();
            } catch (e) {
              diagnosticsUpdatedText = String(diagnosticsInfo.updatedAt);
            }
            var devCardEl = contentEl.createDiv({ cls: "wpp-dev-card" });
            devCardEl.createDiv({
              text: L.settingsStorageDiagnostics,
              cls: "wpp-dev-card-title"
            });
            devCardEl.createDiv({
              text: L.settingsStorageDiagnosticsDesc,
              cls: "wpp-dev-card-desc"
            });
            addDevCardRow(L.settingsStorageFieldSessions, diagnosticsInfo.sessionsPath, { code: true });
            addDevCardRow(L.settingsStorageFieldSessionsBackup, diagnosticsInfo.sessionsBackupPath, { code: true });
            addDevCardRow(L.settingsStorageFieldLocalSettings, diagnosticsInfo.localSettingsPath, { code: true });
            addDevCardRow(L.settingsStorageFieldGlobalSettings, diagnosticsInfo.globalSettingsPath, { code: true });
            addDevCardRow(L.settingsStorageFieldSessionCount, diagnosticsInfo.sessionCount);
            addDevCardRow(L.settingsStorageFieldUpdatedAt, diagnosticsUpdatedText);
          }
          var footerEl = containerEl.createDiv();
          footerEl.style.fontSize = "12px";
          footerEl.style.color = "var(--text-faint)";
          footerEl.style.marginTop = "24px";
          var helpEl = footerEl.createEl("p", { text: L.settingsTranslationHelp });
          helpEl.style.margin = "0 0 4px";
          footerEl.createEl("a", {
            text: L.settingsGitHubLink,
            href: "https://github.com/s1m4ne/obsidian-workspace-plus"
          });
        };
        return WorkspacePlusPlusSettingTab2;
      }(obsidian2.PluginSettingTab)
    );
    exports2.WorkspacePlusPlusSettingTab = WorkspacePlusPlusSettingTab;
  }
});

// src/plugin/register-commands.js
var require_register_commands = __commonJS({
  "src/plugin/register-commands.js"(exports2, module2) {
    "use strict";
    var obsidian2 = require("obsidian");
    var i18n2 = require_i18n();
    var modals2 = require_modals2();
    function registerCommands2(plugin) {
      var L = i18n2.L;
      function addCommand(command) {
        plugin.addCommand(command);
      }
      function addSimpleCommand(id, name, callback, hotkeys) {
        var command = {
          id,
          name,
          callback
        };
        if (hotkeys) command.hotkeys = hotkeys;
        addCommand(command);
      }
      function runWithFailureNotice(operation, failureNotice) {
        operation().catch(function() {
          new obsidian2.Notice(failureNotice);
        });
      }
      function openSaveCurrentLayoutToSessionModal() {
        var sessions = plugin.getOrderedSessionsUnfiltered();
        if (!sessions || sessions.length === 0) {
          new obsidian2.Notice(L.noSession);
          return;
        }
        var modal = new obsidian2.FuzzySuggestModal(plugin.app);
        modal.setPlaceholder(L.saveCurrentLayoutToSessionPlaceholder);
        modal.getItems = function() {
          return sessions;
        };
        modal.getItemText = function(session) {
          return session.name || "";
        };
        modal.onChooseItem = function(session) {
          plugin.confirmOverwriteSessionWithCurrentLayout(session.id);
        };
        modal.open();
      }
      addSimpleCommand("manage-sessions", L.cmdManage, function() {
        new modals2.SessionManagerModal(plugin.app, plugin).open();
      });
      addSimpleCommand("create-session", L.cmdCreate, function() {
        var modal = new modals2.SessionManagerModal(plugin.app, plugin);
        modal.open();
        setTimeout(function() {
          if (modal.nameInput) modal.nameInput.focus();
        }, 100);
      });
      addSimpleCommand("rename-session", L.cmdRename, function() {
        plugin.renameCurrentSession();
      }, [{ modifiers: ["Mod", "Shift"], key: "R" }]);
      addSimpleCommand("delete-session", L.cmdDelete, function() {
        plugin.deleteCurrentSession();
      }, [{ modifiers: ["Mod", "Shift"], key: "Backspace" }]);
      addSimpleCommand("new-empty-session", L.cmdNewEmpty, function() {
        plugin.createEmptySession();
      });
      addSimpleCommand("duplicate-session", L.cmdDuplicate, function() {
        plugin.duplicateCurrentSession();
      }, [{ modifiers: ["Mod", "Shift"], key: "M" }]);
      if (plugin.data.numberedSwitchCommands) {
        for (var n = 1; n <= 9; n++) {
          (function(num) {
            addCommand({
              id: "switch-to-" + num,
              name: L.cmdSwitchTo(num),
              checkCallback: function(checking) {
                if (!plugin.data.showActiveSwitchCommand) {
                  var ordered = plugin.getOrderedSessions();
                  var session = ordered[num - 1];
                  if (session && session.id === plugin.data.activeSessionId) return false;
                }
                if (!checking) plugin.switchToIndex(num - 1);
                return true;
              }
            });
          })(n);
        }
      }
      plugin._dynamicSessionCommandIds = [];
      addSimpleCommand("previous-session", L.cmdPrevious, function() {
        plugin.switchRelativeFromCommand(-1);
      }, [{ modifiers: ["Mod", "Shift"], key: "," }]);
      addSimpleCommand("next-session", L.cmdNext, function() {
        plugin.switchRelativeFromCommand(1);
      }, [
        { modifiers: ["Mod", "Shift"], key: "Enter" },
        { modifiers: ["Mod", "Shift"], key: "." }
      ]);
      addSimpleCommand("save-current-session", L.cmdSaveCurrent, function() {
        plugin.saveActiveSession();
      }, [{ modifiers: ["Mod", "Shift"], key: "S" }]);
      addSimpleCommand("save-as-session", L.cmdSaveAs, function() {
        plugin.saveAsSession();
      });
      addCommand({
        id: "save-current-layout-to-session",
        name: L.cmdSaveCurrentLayoutToSession,
        checkCallback: function(checking) {
          if (plugin.isAutoSaveOnSwitchEnabled()) return false;
          if (!checking) openSaveCurrentLayoutToSessionModal();
          return true;
        }
      });
      addSimpleCommand("reload-current-session-without-saving", L.cmdReloadCurrentWithoutSaving, function() {
        plugin.reloadCurrentSessionWithoutSaving();
      });
      addSimpleCommand("toggle-auto-save-on-switch", L.cmdToggleAutoSave, function() {
        plugin.toggleAutoSaveOnSwitch({ notify: true });
      });
      addCommand({
        id: "enable-auto-save-on-switch",
        name: L.cmdEnableAutoSave,
        checkCallback: function(checking) {
          var canRun = !plugin.isAutoSaveOnSwitchEnabled();
          if (!canRun) return false;
          if (!checking) plugin.setAutoSaveOnSwitch(true, { notify: true });
          return true;
        }
      });
      addCommand({
        id: "disable-auto-save-on-switch",
        name: L.cmdDisableAutoSave,
        checkCallback: function(checking) {
          var canRun = plugin.isAutoSaveOnSwitchEnabled();
          if (!canRun) return false;
          if (!checking) plugin.setAutoSaveOnSwitch(false, { notify: true });
          return true;
        }
      });
      addSimpleCommand("search-session-overlay", L.cmdSearchOverlay, function() {
        plugin.openSearchOverlay();
      });
      addCommand({
        id: "version-history",
        name: L.cmdVersionHistory,
        checkCallback: function(checking) {
          if (!plugin.isVersionHistoryEnabled()) return false;
          var session = plugin.getActiveSession();
          if (!session) return false;
          if (!checking) {
            new modals2.HistoryModal(plugin.app, plugin, session).open();
          }
          return true;
        }
      });
      addSimpleCommand("export-sessions-snapshot", L.cmdExportSessions, function() {
        runWithFailureNotice(function() {
          return plugin.exportSessionsSnapshot();
        }, L.exportSessionsFailed);
      });
      addSimpleCommand("import-latest-sessions-snapshot", L.cmdImportSessions, function() {
        new modals2.ConfirmModal(plugin.app, L.confirmImportSessions, function() {
          return plugin.importSessionsFromLatestExport().catch(function() {
            new obsidian2.Notice(L.importSessionsFailed);
          });
        }, {
          confirmText: L.settingsImportSessionsBtn || L.cmdImportSessions,
          confirmClass: "mod-cta"
        }).open();
      });
      function getCurrentGroupViewId() {
        if (plugin.switchOverlayEl) return plugin.switchOverlayViewGroupId || null;
        if (plugin.searchOverlayEl) return plugin.searchOverlayViewGroupId || null;
        return plugin.data.activeGroupId || null;
      }
      function showSwitchOverlayForGroup(groupId) {
        var ordered = plugin.getOrderedSessionsForGroup(groupId || null);
        var activeIndex = plugin.getActiveSessionIndex(ordered);
        plugin.showSwitchOverlay(ordered, activeIndex, groupId || null);
      }
      function switchGroupAndShowOverlay(step) {
        if (!plugin.isGroupFeatureEnabled()) return;
        var targetGroupId = plugin.getRelativeGroupId(getCurrentGroupViewId(), step);
        if (typeof targetGroupId === "undefined") {
          showSwitchOverlayForGroup(plugin.data.activeGroupId || null);
          return;
        }
        plugin.resolveGroupSelection(targetGroupId).then(function(result) {
          showSwitchOverlayForGroup(result.resolvedGroupId);
        });
      }
      addCommand({
        id: "switch-group",
        name: L.cmdSwitchGroup,
        callback: function() {
          switchGroupAndShowOverlay(1);
        }
      });
      addCommand({
        id: "exit-group",
        name: L.cmdExitGroup,
        checkCallback: function(checking) {
          if (!plugin.isGroupFeatureEnabled()) return false;
          if (!plugin.data.activeGroupId) return false;
          if (!checking) plugin.exitGroup();
          return true;
        }
      });
      addCommand({
        id: "next-group",
        name: L.cmdNextGroup,
        hotkeys: [{ modifiers: ["Mod", "Shift"], key: "Tab" }],
        callback: function() {
          switchGroupAndShowOverlay(1);
        }
      });
      addSimpleCommand("previous-group", L.cmdPreviousGroup, function() {
        plugin.switchGroupRelative(-1);
      });
    }
    module2.exports = registerCommands2;
  }
});

// src/plugin/methods/hotkeys.js
var require_hotkeys = __commonJS({
  "src/plugin/methods/hotkeys.js"(exports2, module2) {
    "use strict";
    var utils2 = require_utils();
    function attachHotkeyMethods2(WorkspacePlusPlus2) {
      WorkspacePlusPlus2.prototype.formatHotkey = function(hotkey) {
        var isMac = utils2.isMacPlatform();
        var parts = [];
        var mods = hotkey.modifiers || [];
        for (var i = 0; i < mods.length; i++) {
          var m = mods[i];
          if (m === "Mod") parts.push(isMac ? "\u2318" : "Ctrl");
          else if (m === "Alt") parts.push(isMac ? "\u2325" : "Alt");
          else if (m === "Shift") parts.push(isMac ? "\u21E7" : "Shift");
          else if (m === "Ctrl") parts.push(isMac ? "\u2303" : "Ctrl");
        }
        var key = hotkey.key;
        if (key === "ArrowLeft") key = "\u2190";
        else if (key === "ArrowRight") key = "\u2192";
        else if (key === "ArrowUp") key = "\u2191";
        else if (key === "ArrowDown") key = "\u2193";
        else if (key === ",") key = "<";
        else if (key === ".") key = ">";
        if (isMac) return parts.join("") + key;
        parts.push(key);
        return parts.join("+");
      };
      WorkspacePlusPlus2.prototype.getCommandHotkey = function(cmdId, index) {
        var idx = index || 0;
        var fullId = this.manifest.id + ":" + cmdId;
        try {
          var mgr = this.app.hotkeyManager;
          if (!mgr) return "";
          var hotkeys = mgr.getHotkeys ? mgr.getHotkeys(fullId) : null;
          if (!hotkeys || hotkeys.length === 0) {
            hotkeys = mgr.getDefaultHotkeys ? mgr.getDefaultHotkeys(fullId) : null;
          }
          if (!hotkeys || hotkeys.length <= idx) return "";
          return this.formatHotkey(hotkeys[idx]);
        } catch (e) {
          return "";
        }
      };
    }
    module2.exports = attachHotkeyMethods2;
  }
});

// src/plugin/methods/overlays.js
var require_overlays = __commonJS({
  "src/plugin/methods/overlays.js"(exports2, module2) {
    "use strict";
    var obsidian2 = require("obsidian");
    var i18n2 = require_i18n();
    var modals2 = require_modals2();
    var formatRelativeTime = require_format_relative_time();
    var groupTabUi = require_group_tab_ui();
    var navigationUtils = require_navigation_utils();
    var utils2 = require_utils();
    var sessionContextMenu = require_session_context_menu();
    var settingsContextMenu = require_settings_context_menu();
    var sessionListActions = require_session_list_actions();
    function hasBlockingModal() {
      return !!document.querySelector(".modal-container");
    }
    function syncSearchOverlaySelectedIndex(plugin, filtered, currentIndex, options) {
      options = options || {};
      if (!filtered || filtered.length === 0) {
        return -1;
      }
      var activeIdx = plugin.findActiveSessionIndex(filtered);
      if (activeIdx !== -1) {
        return activeIdx;
      }
      if (options.preserveWhenMissing) {
        if (currentIndex >= filtered.length) {
          return filtered.length - 1;
        }
        return currentIndex < 0 ? 0 : currentIndex;
      }
      return 0;
    }
    function handleSearchOverlayHorizontalKey(e, activeEl, options) {
      if (activeEl === options.saveInput && e.key === "ArrowRight") {
        if (navigationUtils.isTextInputCursorAtEnd(options.saveInput)) {
          e.preventDefault();
          e.stopImmediatePropagation();
          options.saveBtn.focus();
        }
        return true;
      }
      if (activeEl === options.saveBtn && e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopImmediatePropagation();
        options.focusSaveInput();
        return true;
      }
      return false;
    }
    function handleSearchOverlayVerticalKey(e, activeEl, options) {
      if (activeEl === options.searchInput) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (e.key === "ArrowDown") {
          options.focusFirstResult();
        } else {
          options.focusSaveInput();
        }
        return true;
      }
      if (activeEl === options.saveInput || activeEl === options.saveBtn) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (e.key === "ArrowDown") {
          if (options.hasSearchInput()) {
            options.focusSearchInput();
          } else {
            options.focusFirstResult();
          }
        } else {
          options.focusLastResult();
        }
        return true;
      }
      var filtered = options.getFiltered();
      e.preventDefault();
      if (filtered.length === 0) return true;
      options.setKeyboardNav(true);
      var dir = e.key === "ArrowUp" ? -1 : 1;
      var selectedIndex = options.getSelectedIndex();
      var nextIndex = selectedIndex + dir;
      if (nextIndex < 0) {
        if (options.hasSearchInput()) {
          options.focusSearchInput();
        } else {
          options.focusSaveInput();
        }
        return true;
      }
      if (nextIndex >= filtered.length) {
        options.focusSaveInput();
        return true;
      }
      options.setSelectedIndex(nextIndex);
      options.updateSelection();
      return true;
    }
    function handleSearchOverlayEnterKey(e, activeEl, options) {
      if (activeEl === options.saveInput || activeEl === options.saveBtn) return false;
      e.preventDefault();
      e.stopImmediatePropagation();
      options.switchSelected({ shiftKey: e.shiftKey });
      return true;
    }
    function handleSearchOverlayDeleteKey(e, activeEl, options) {
      var searchInput = options.searchInput;
      if (activeEl === searchInput && searchInput.value.length > 0) return false;
      if (activeEl === options.saveInput || activeEl === options.saveBtn) return false;
      e.preventDefault();
      var filteredForDelete = options.getFiltered();
      var selectedForDelete = options.getSelectedIndex();
      if (selectedForDelete < 0 || selectedForDelete >= filteredForDelete.length) return true;
      var sess = filteredForDelete[selectedForDelete];
      if (Object.keys(options.plugin.data.sessions).length <= 1) {
        new obsidian2.Notice(i18n2.L.cannotDeleteLast);
        return true;
      }
      var doDelete = function() {
        options.plugin.deleteSession(sess.id).then(function(deleted) {
          if (!deleted) return;
          new obsidian2.Notice(i18n2.L.deleted(sess.name));
          options.refreshOrderedSessions();
        });
      };
      if (options.plugin.data.confirmDeleteByHotkey !== false) {
        new modals2.ConfirmModal(options.plugin.app, i18n2.L.confirmDeleteActive(sess.name), doDelete).open();
      } else {
        doDelete();
      }
      return true;
    }
    function handleSearchOverlaySlashKey(e, activeEl, options) {
      if (activeEl === options.searchInput || activeEl === options.saveInput || activeEl === options.saveBtn) return false;
      e.preventDefault();
      navigationUtils.focusTextInputSelect(options.searchInput);
      return true;
    }
    function createSearchOverlayKeyHandler(options) {
      return function(e) {
        var plugin = options.plugin;
        if (!plugin.searchOverlayEl) return;
        if (hasBlockingModal()) return;
        var activeEl = document.activeElement;
        if (utils2.isModPressed(e)) {
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopImmediatePropagation();
          plugin.hideSearchOverlay();
          return;
        }
        if (e.key === "Tab") {
          if (activeEl === options.saveInput || activeEl === options.saveBtn) return;
          if (!plugin.isGroupFeatureEnabled() || plugin.getOrderedGroups().length === 0) return;
          e.preventDefault();
          e.stopImmediatePropagation();
          var nextGroupId = plugin.getRelativeGroupId(options.getOverlayGroupId(), e.shiftKey ? -1 : 1);
          if (typeof nextGroupId === "undefined") return;
          options.applyOverlayGroupSelection(nextGroupId);
          return;
        }
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          if (handleSearchOverlayHorizontalKey(e, activeEl, options)) return;
        }
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          if (handleSearchOverlayVerticalKey(e, activeEl, options)) return;
        }
        if (e.key === "Enter" && !e.isComposing) {
          if (handleSearchOverlayEnterKey(e, activeEl, options)) return;
        }
        if (e.key === "Delete" || e.key === "Backspace") {
          if (handleSearchOverlayDeleteKey(e, activeEl, options)) return;
        }
        if (e.key === "/" && activeEl !== options.searchInput && activeEl !== options.saveInput && activeEl !== options.saveBtn) {
          if (handleSearchOverlaySlashKey(e, activeEl, options)) return;
        }
      };
    }
    function attachOverlayMethods2(WorkspacePlusPlus2) {
      WorkspacePlusPlus2.prototype.filterSessionsByQuery = function(sessions, query) {
        var q = (query || "").trim().toLowerCase();
        if (!q) return sessions.slice();
        return sessions.filter(function(s) {
          return (s.name || "").toLowerCase().indexOf(q) !== -1;
        });
      };
      WorkspacePlusPlus2.prototype.openSearchOverlay = function(anchorEl) {
        var L = i18n2.L;
        var self = this;
        var overlayGroupId = this.isGroupFeatureEnabled() ? this.data.activeGroupId || null : null;
        this.searchOverlayViewGroupId = overlayGroupId;
        var ordered = this.getOrderedSessionsForGroup(overlayGroupId);
        var focusTarget = this.data.overlayDefaultFocus || "current-session";
        this.hideSwitchOverlay();
        this.hideSearchOverlay();
        var filtered = ordered.slice();
        var selectedIndex = 0;
        var keyboardNav = false;
        function syncSelectedIndexToActive(options) {
          selectedIndex = syncSearchOverlaySelectedIndex(self, filtered, selectedIndex, options || {});
        }
        syncSelectedIndexToActive();
        function getOverlayGroupId() {
          if (!self.isGroupFeatureEnabled()) {
            overlayGroupId = null;
            self.searchOverlayViewGroupId = null;
            return null;
          }
          var groups = self.data.groups || {};
          if (overlayGroupId && !groups[overlayGroupId]) {
            overlayGroupId = self.data.activeGroupId || null;
          }
          self.searchOverlayViewGroupId = overlayGroupId || null;
          return overlayGroupId || null;
        }
        function applyOverlayGroupSelection(groupId) {
          return self.resolveGroupSelection(groupId).then(function(result) {
            overlayGroupId = result.resolvedGroupId || null;
            self.searchOverlayViewGroupId = overlayGroupId;
            renderGroupTabs();
            refreshOrderedSessions();
            return result.switched;
          });
        }
        var overlay = document.createElement("div");
        overlay.className = "wpp-switch-overlay wpp-search-overlay";
        overlay.tabIndex = -1;
        var corners = ["tl", "tr", "bl", "br"];
        for (var ci = 0; ci < corners.length; ci++) {
          var corner = document.createElement("div");
          corner.className = "wpp-resize-corner wpp-resize-" + corners[ci];
          corner.dataset.corner = corners[ci];
          overlay.appendChild(corner);
        }
        var edges = ["top", "right", "bottom", "left"];
        for (var ei = 0; ei < edges.length; ei++) {
          var edgeEl = document.createElement("div");
          edgeEl.className = "wpp-resize-edge wpp-resize-" + edges[ei];
          edgeEl.dataset.edge = edges[ei];
          overlay.appendChild(edgeEl);
        }
        var headerRow = document.createElement("div");
        headerRow.className = "wpp-search-header";
        var countSpan = document.createElement("div");
        countSpan.className = "wpp-switch-count";
        headerRow.appendChild(countSpan);
        var closeBtn = document.createElement("div");
        closeBtn.className = "wpp-search-close";
        obsidian2.setIcon(closeBtn, "x");
        closeBtn.addEventListener("click", function(e) {
          e.stopPropagation();
          self.hideSearchOverlay();
        });
        headerRow.appendChild(closeBtn);
        overlay.appendChild(headerRow);
        var saveRow = document.createElement("div");
        saveRow.className = "wpp-save-container";
        var saveInput = document.createElement("input");
        saveInput.type = "text";
        saveInput.className = "wpp-save-input";
        saveInput.placeholder = L.savePlaceholder;
        saveRow.appendChild(saveInput);
        var saveBtn = document.createElement("button");
        saveBtn.className = "wpp-save-btn";
        saveBtn.textContent = L.save;
        saveRow.appendChild(saveBtn);
        function onOverlaySave() {
          var selectedGroupId = getOverlayGroupId();
          self.createSessionForViewedGroup(saveInput.value, selectedGroupId).then(function(result) {
            if (!result || !result.created) return;
            var createdName = result.name;
            overlayGroupId = result.viewGroupId || null;
            self.searchOverlayViewGroupId = overlayGroupId;
            saveInput.value = "";
            new obsidian2.Notice(L.created(createdName));
            renderGroupTabs();
            refreshOrderedSessions();
          });
        }
        saveBtn.addEventListener("click", function(e) {
          e.stopPropagation();
          onOverlaySave();
        });
        saveInput.addEventListener("keydown", function(e) {
          if (e.key === "Enter" && !e.isComposing) {
            e.stopPropagation();
            onOverlaySave();
          }
        });
        overlay.appendChild(saveRow);
        var searchRow = document.createElement("div");
        searchRow.className = "wpp-search-row";
        var searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.className = "wpp-search-input";
        searchInput.placeholder = L.searchOverlayPlaceholder;
        searchRow.appendChild(searchInput);
        this.searchOverlayInputEl = searchInput;
        if (!self.data.showFilterInput) {
          searchRow.style.display = "none";
        }
        overlay.appendChild(searchRow);
        var groupTabsRow = document.createElement("div");
        groupTabsRow.className = "wpp-group-tabs";
        function stripSaveHint(text) {
          return text.replace(/  \/  ⇧.+?  \/  /, "  /  ");
        }
        function renderGroupTabs() {
          while (groupTabsRow.firstChild) groupTabsRow.removeChild(groupTabsRow.firstChild);
          var autoSave = self.isAutoSaveOnSwitchEnabled();
          if (!self.isGroupFeatureEnabled()) {
            groupTabsRow.style.display = "none";
            footerRow.textContent = autoSave ? stripSaveHint(L.searchOverlayHelp) : L.searchOverlayHelp;
            return;
          }
          var groups = self.data.groups || {};
          var realGroups = self.getOrderedGroups();
          groupTabsRow.style.display = "";
          var helpText = realGroups.length > 0 ? L.searchOverlayHelpWithGroups || L.searchOverlayHelp : L.searchOverlayHelp;
          footerRow.textContent = autoSave ? stripSaveHint(helpText) : helpText;
          var groupOrder = self.getOrderedGroupTabIds();
          groupTabUi.renderGroupTabs({
            app: self.app,
            plugin: self,
            containerEl: groupTabsRow,
            groups,
            groupOrder,
            selectedGroupId: getOverlayGroupId(),
            stopPropagationOnMouseDown: true,
            onSelectGroup: function(groupId) {
              applyOverlayGroupSelection(groupId);
            },
            onResetViewGroup: function() {
              overlayGroupId = null;
              self.searchOverlayViewGroupId = null;
            },
            onDeleteGroup: function(deletedGroupId) {
              if (overlayGroupId === deletedGroupId) {
                overlayGroupId = self.data.activeGroupId || null;
                self.searchOverlayViewGroupId = overlayGroupId || null;
              }
            },
            onGroupsChanged: function() {
              renderGroupTabs();
            },
            onSessionsChanged: function() {
              refreshOrderedSessions();
            },
            onGroupOrderCommit: function(newOrder) {
              self.setGroupTabOrder(newOrder);
            },
            addButtonTooltip: L.groupCreateNew,
            onAddGroupClick: function() {
              groupTabUi.openCreateGroupPrompt(self.app, self, function() {
                renderGroupTabs();
                refreshOrderedSessions();
              });
            }
          });
        }
        overlay.appendChild(groupTabsRow);
        var list = document.createElement("div");
        list.className = "wpp-switch-list wpp-search-list";
        overlay.appendChild(list);
        var emptyEl = document.createElement("div");
        emptyEl.className = "wpp-search-empty";
        emptyEl.textContent = L.noFilteredSessions;
        overlay.appendChild(emptyEl);
        var footerRow = document.createElement("div");
        footerRow.className = "wpp-switch-footer";
        overlay.appendChild(footerRow);
        renderGroupTabs();
        self._refreshOverlaySessions = refreshOrderedSessions;
        function refreshOrderedSessions() {
          ordered = self.getOrderedSessionsForGroup(getOverlayGroupId());
          filtered = self.filterSessionsByQuery(ordered, searchInput.value);
          syncSelectedIndexToActive({ preserveWhenMissing: true });
          renderList();
        }
        function renderList() {
          while (list.firstChild) list.removeChild(list.firstChild);
          if (filtered.length === 0) {
            selectedIndex = -1;
            countSpan.textContent = "0 / 0";
            if (getOverlayGroupId() && ordered.length === 0) {
              emptyEl.textContent = L.noGroupSessions;
            } else {
              emptyEl.textContent = L.noFilteredSessions;
            }
            list.style.display = "none";
            emptyEl.style.display = "flex";
            return;
          }
          if (selectedIndex < 0 || selectedIndex >= filtered.length) {
            var activeIdx = self.findActiveSessionIndex(filtered);
            selectedIndex = activeIdx !== -1 ? activeIdx : 0;
          }
          list.style.display = "";
          emptyEl.style.display = "none";
          countSpan.textContent = selectedIndex + 1 + " / " + filtered.length;
          for (var i = 0; i < filtered.length; i++) {
            var session = filtered[i];
            var isActive = session.id === self.data.activeSessionId;
            var item = document.createElement("div");
            item.className = "wpp-switch-item";
            if (i === selectedIndex) item.classList.add("wpp-kb-selected");
            item.dataset.sessionId = session.id;
            var infoCol = document.createElement("div");
            infoCol.className = "wpp-qs-info-col";
            var nameRow = document.createElement("div");
            nameRow.className = "wpp-qs-name-row";
            var name = document.createElement("div");
            name.className = "wpp-switch-name";
            name.textContent = session.name;
            nameRow.appendChild(name);
            infoCol.appendChild(nameRow);
            var modifiedEl = document.createElement("div");
            modifiedEl.className = "wpp-qs-modified";
            modifiedEl.textContent = formatRelativeTime(session.modified);
            infoCol.appendChild(modifiedEl);
            item.appendChild(infoCol);
            if (isActive) {
              var badge = document.createElement("span");
              badge.className = "wpp-active-badge";
              badge.textContent = L.active;
              item.appendChild(badge);
            }
            var actions = document.createElement("div");
            actions.className = "wpp-qs-actions";
            var saveIcon = null;
            var reloadIcon = null;
            if (isActive && !self.isAutoSaveOnSwitchEnabled()) {
              saveIcon = document.createElement("div");
              saveIcon.className = "wpp-qs-action-btn";
              obsidian2.setIcon(saveIcon, "save");
              obsidian2.setTooltip(saveIcon, L.saveInline, { delay: 250 });
              actions.appendChild(saveIcon);
              reloadIcon = document.createElement("div");
              reloadIcon.className = "wpp-qs-action-btn";
              obsidian2.setIcon(reloadIcon, "rotate-ccw");
              obsidian2.setTooltip(reloadIcon, L.contextReloadSession, { delay: 250 });
              actions.appendChild(reloadIcon);
            }
            var renameIcon = document.createElement("div");
            renameIcon.className = "wpp-qs-action-btn";
            obsidian2.setIcon(renameIcon, "pencil");
            obsidian2.setTooltip(renameIcon, L.rename, { delay: 250 });
            actions.appendChild(renameIcon);
            var deleteIcon = document.createElement("div");
            deleteIcon.className = "wpp-qs-action-btn";
            obsidian2.setIcon(deleteIcon, "trash-2");
            obsidian2.setTooltip(deleteIcon, L.delete, { delay: 250 });
            actions.appendChild(deleteIcon);
            item.appendChild(actions);
            (function(idx, sess, itemEl, _saveIcon, _reloadIcon, _isActive) {
              itemEl.addEventListener("click", function(e) {
                if (e.target.closest(".wpp-qs-action-btn")) return;
                selectedIndex = idx;
                switchSelected();
              });
              setupDrag(itemEl);
              itemEl.addEventListener("mouseenter", function() {
                if (keyboardNav) return;
                selectedIndex = idx;
                updateSelection();
              });
              itemEl.addEventListener("contextmenu", function(e) {
                e.preventDefault();
                var selectedGroupId = getOverlayGroupId();
                sessionContextMenu.openSessionContextMenu({
                  plugin: self,
                  app: self.app,
                  session: sess,
                  isActive: _isActive,
                  event: e,
                  showSwitch: true,
                  showRemoveFromGroup: !!selectedGroupId,
                  onSave: function() {
                    self.saveActiveSession().then(function() {
                      refreshOrderedSessions();
                    });
                  },
                  onReload: function() {
                    self.reloadCurrentSessionWithoutSaving();
                  },
                  onOverwriteWithCurrentLayout: function() {
                    self.confirmOverwriteSessionWithCurrentLayout(sess.id, {
                      onSaved: function() {
                        refreshOrderedSessions();
                      }
                    });
                  },
                  onSwitch: function() {
                    selectedIndex = idx;
                    switchSelected();
                  },
                  onRename: function() {
                    sessionListActions.renameSessionWithPrompt({
                      app: self.app,
                      plugin: self,
                      session: sess,
                      onRenamed: function() {
                        refreshOrderedSessions();
                      }
                    });
                  },
                  onDuplicate: function() {
                    self.duplicateSession(sess.id).then(function() {
                      refreshOrderedSessions();
                    });
                  },
                  onRemoveFromGroup: function() {
                    var activeGid = getOverlayGroupId();
                    if (!activeGid) return;
                    var gName = (self.data.groups[activeGid] || {}).name || "";
                    self.removeSessionFromGroup(sess.id, activeGid).then(function() {
                      new obsidian2.Notice(L.groupRemovedSession(sess.name, gName));
                      renderGroupTabs();
                      refreshOrderedSessions();
                    });
                  },
                  showMoveToGroup: self.isGroupFeatureEnabled() && self.getOrderedGroups().length > 0,
                  onMoveToGroup: function(groupId) {
                    var gName = (self.data.groups[groupId] || {}).name || "";
                    self.moveSessionToGroupExclusive(sess.id, groupId).then(function(moved) {
                      if (moved) {
                        new obsidian2.Notice(L.groupAddedSession(sess.name, gName));
                        renderGroupTabs();
                        refreshOrderedSessions();
                      }
                    });
                  },
                  onDelete: function() {
                    sessionListActions.deleteSessionWithPrompt({
                      app: self.app,
                      plugin: self,
                      session: sess,
                      isActive: _isActive,
                      confirmMessage: L.confirmDeleteActive(sess.name),
                      onDeleted: function() {
                        refreshOrderedSessions();
                      }
                    });
                  },
                  onVersionHistory: function() {
                    new modals2.HistoryModal(self.app, self, sess).open();
                  }
                });
              });
              if (_saveIcon) {
                _saveIcon.addEventListener("click", function(e) {
                  e.stopPropagation();
                  var doSave = function() {
                    self.saveActiveSession().then(function() {
                      refreshOrderedSessions();
                    });
                  };
                  if (self.data.confirmQuickActions) {
                    new modals2.ConfirmModal(self.app, L.confirmSaveSession(sess.name), doSave, { confirmText: L.saveInline, confirmClass: "mod-cta" }).open();
                  } else {
                    doSave();
                  }
                });
              }
              if (_reloadIcon) {
                _reloadIcon.addEventListener("click", function(e) {
                  e.stopPropagation();
                  var doReload = function() {
                    self.reloadCurrentSessionWithoutSaving();
                  };
                  if (self.data.confirmQuickActions) {
                    new modals2.ConfirmModal(self.app, L.confirmReloadSession(sess.name), doReload, { confirmText: L.load, confirmClass: "mod-cta" }).open();
                  } else {
                    doReload();
                  }
                });
              }
              renameIcon.addEventListener("click", function(e) {
                e.stopPropagation();
                sessionListActions.renameSessionWithPrompt({
                  app: self.app,
                  plugin: self,
                  session: sess,
                  onRenamed: function() {
                    refreshOrderedSessions();
                  }
                });
              });
              deleteIcon.addEventListener("click", function(e) {
                e.stopPropagation();
                sessionListActions.deleteSessionWithPrompt({
                  app: self.app,
                  plugin: self,
                  session: sess,
                  isActive: _isActive,
                  confirmMessage: L.confirmDeleteActive(sess.name),
                  onDeleted: function() {
                    refreshOrderedSessions();
                  }
                });
              });
            })(i, session, item, saveIcon, reloadIcon, isActive);
            list.appendChild(item);
          }
          var selectedItem = list.querySelector(".wpp-kb-selected");
          if (selectedItem) {
            selectedItem.scrollIntoView({ block: "nearest" });
          }
        }
        function setupDrag(dragItem) {
          dragItem.addEventListener("mousedown", function(e) {
            if (e.button !== 0) return;
            if (e.target.closest(".wpp-qs-action-btn")) return;
            var startX = e.clientX;
            var startY = e.clientY;
            var dragStarted = false;
            var cloneEl = null;
            function startDragOp(ev) {
              dragStarted = true;
              var rect = dragItem.getBoundingClientRect();
              var offsetX = startX - rect.left;
              var offsetY = startY - rect.top;
              cloneEl = dragItem.cloneNode(true);
              cloneEl.classList.add("wpp-drag-clone");
              cloneEl.style.position = "fixed";
              cloneEl.style.width = rect.width + "px";
              cloneEl.style.top = ev.clientY - offsetY + "px";
              cloneEl.style.left = ev.clientX - offsetX + "px";
              cloneEl.style.zIndex = "9999";
              cloneEl.style.pointerEvents = "none";
              document.body.appendChild(cloneEl);
              dragItem.classList.add("is-dragging");
              cloneEl._offsetX = offsetX;
              cloneEl._offsetY = offsetY;
            }
            function updateOverlayGroupDropTarget(ev) {
              var tabs = groupTabsRow.querySelectorAll(".wpp-group-tab");
              var hoveredTab = null;
              for (var t = 0; t < tabs.length; t++) {
                var tr = tabs[t].getBoundingClientRect();
                if (ev.clientX >= tr.left && ev.clientX <= tr.right && ev.clientY >= tr.top && ev.clientY <= tr.bottom) {
                  hoveredTab = tabs[t];
                  break;
                }
              }
              for (var t2 = 0; t2 < tabs.length; t2++) {
                tabs[t2].classList.toggle("wpp-group-drop-target", tabs[t2] === hoveredTab);
              }
              return hoveredTab;
            }
            function clearOverlayGroupDropTargets() {
              var tabs = groupTabsRow.querySelectorAll(".wpp-group-tab");
              for (var t = 0; t < tabs.length; t++) {
                tabs[t].classList.remove("wpp-group-drop-target");
              }
            }
            function onMouseMove(ev) {
              if (!dragStarted) {
                var dx = ev.clientX - startX;
                var dy = ev.clientY - startY;
                if (Math.abs(dx) + Math.abs(dy) < 5) return;
                startDragOp(ev);
              }
              cloneEl.style.top = ev.clientY - cloneEl._offsetY + "px";
              cloneEl.style.left = ev.clientX - cloneEl._offsetX + "px";
              var hoverTab = updateOverlayGroupDropTarget(ev);
              if (hoverTab) return;
              var siblings = list.querySelectorAll(".wpp-switch-item");
              var placed = false;
              for (var si = 0; si < siblings.length; si++) {
                var el = siblings[si];
                if (el === dragItem) continue;
                var r = el.getBoundingClientRect();
                if (ev.clientY < r.top + r.height / 2) {
                  list.insertBefore(dragItem, el);
                  placed = true;
                  break;
                }
              }
              if (!placed) list.appendChild(dragItem);
            }
            function onMouseUp(ev) {
              document.removeEventListener("mousemove", onMouseMove);
              document.removeEventListener("mouseup", onMouseUp);
              if (!dragStarted) return;
              cloneEl.remove();
              dragItem.classList.remove("is-dragging");
              var dropTab = updateOverlayGroupDropTarget(ev);
              clearOverlayGroupDropTargets();
              if (dropTab && dropTab.dataset.groupId && dropTab.dataset.groupId !== "__all__") {
                var sessionId = dragItem.dataset.sessionId;
                var groupId = dropTab.dataset.groupId;
                var sessionName = (self.data.sessions[sessionId] || {}).name || "";
                var groupName = (self.data.groups[groupId] || {}).name || "";
                self.moveSessionToGroupExclusive(sessionId, groupId).then(function() {
                  new obsidian2.Notice(i18n2.L.groupAddedSession(sessionName, groupName));
                  renderGroupTabs();
                  refreshOrderedSessions();
                });
                return;
              } else {
                var currentGroupId = getOverlayGroupId();
                if (dropTab && dropTab.dataset.groupId === "__all__" && currentGroupId) {
                  var rmSessionId = dragItem.dataset.sessionId;
                  var rmGroupId = currentGroupId;
                  var rmSessionName = (self.data.sessions[rmSessionId] || {}).name || "";
                  var rmGroupName = (self.data.groups[rmGroupId] || {}).name || "";
                  self.removeSessionFromGroup(rmSessionId, rmGroupId).then(function() {
                    new obsidian2.Notice(i18n2.L.groupRemovedSession(rmSessionName, rmGroupName));
                    renderGroupTabs();
                    refreshOrderedSessions();
                  });
                  return;
                }
              }
              var newVisibleOrder = [];
              var items = list.querySelectorAll(".wpp-switch-item");
              for (var ni = 0; ni < items.length; ni++) {
                newVisibleOrder.push(items[ni].dataset.sessionId);
              }
              self.setSessionOrderFromVisible(newVisibleOrder);
              dragItem.classList.add("wpp-just-moved");
              setTimeout(function() {
                dragItem.classList.remove("wpp-just-moved");
              }, 600);
            }
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
          });
        }
        function updateSelection() {
          var items = list.querySelectorAll(".wpp-switch-item");
          for (var si = 0; si < items.length; si++) {
            items[si].classList.toggle("wpp-kb-selected", si === selectedIndex);
          }
          if (filtered.length > 0) {
            countSpan.textContent = selectedIndex + 1 + " / " + filtered.length;
          }
          if (keyboardNav && items[selectedIndex]) {
            items[selectedIndex].scrollIntoView({ block: "nearest" });
          }
        }
        function setKeyboardNavState(value) {
          keyboardNav = !!value;
          overlay.classList.toggle("wpp-keyboard-nav", keyboardNav);
        }
        function focusSaveInput() {
          setKeyboardNavState(false);
          navigationUtils.focusTextInputEnd(saveInput);
        }
        function focusSearchInput() {
          setKeyboardNavState(false);
          navigationUtils.focusTextInputSelect(searchInput);
        }
        function focusResultAt(index) {
          if (!filtered.length) return;
          setKeyboardNavState(true);
          selectedIndex = index;
          updateSelection();
          overlay.focus();
        }
        function focusFirstResult() {
          focusResultAt(0);
        }
        function focusLastResult() {
          focusResultAt(filtered.length - 1);
        }
        list.addEventListener("mousemove", function() {
          if (keyboardNav) {
            setKeyboardNavState(false);
          }
        });
        function switchSelected(opts) {
          opts = opts || {};
          if (selectedIndex < 0 || selectedIndex >= filtered.length) return;
          var target = filtered[selectedIndex];
          if (target.id === self.data.activeSessionId) {
            if (opts.shiftKey) {
              var doSave = function() {
                self.saveActiveSession().then(function() {
                  refreshOrderedSessions();
                });
              };
              if (self.data.confirmQuickActions) {
                new modals2.ConfirmModal(self.app, L.confirmSaveSession(target.name), doSave, { confirmText: L.saveInline, confirmClass: "mod-cta" }).open();
              } else {
                doSave();
              }
            } else {
              var doReload = function() {
                self.reloadCurrentSessionWithoutSaving();
              };
              if (self.data.confirmQuickActions) {
                new modals2.ConfirmModal(self.app, L.confirmReloadSession(target.name), doReload, { confirmText: L.load, confirmClass: "mod-cta" }).open();
              } else {
                doReload();
              }
            }
            self.hideSearchOverlay();
            return;
          }
          self.switchSession(target.id, { silent: true }).then(function(switched) {
            if (switched) self.hideSearchOverlay();
          });
        }
        this.searchOverlayInputHandler = function() {
          filtered = self.filterSessionsByQuery(ordered, searchInput.value);
          syncSelectedIndexToActive();
          renderList();
        };
        this.searchOverlayKeyHandler = createSearchOverlayKeyHandler({
          plugin: self,
          overlay,
          saveInput,
          saveBtn,
          searchInput,
          getOverlayGroupId,
          applyOverlayGroupSelection,
          switchSelected,
          refreshOrderedSessions,
          updateSelection,
          focusSaveInput,
          focusSearchInput,
          focusFirstResult,
          focusLastResult,
          hasSearchInput: function() {
            return !!self.data.showFilterInput;
          },
          getFiltered: function() {
            return filtered;
          },
          getSelectedIndex: function() {
            return selectedIndex;
          },
          setSelectedIndex: function(value) {
            selectedIndex = value;
          },
          setKeyboardNav: setKeyboardNavState
        });
        this.searchOverlayClickOutsideHandler = function(e) {
          if (!self.searchOverlayEl) return;
          if (hasBlockingModal()) return;
          if (self.statusBarEl && self.statusBarEl.contains(e.target)) return;
          if (!self.searchOverlayEl.contains(e.target)) {
            self.hideSearchOverlay();
          }
        };
        searchInput.addEventListener("input", this.searchOverlayInputHandler);
        document.addEventListener("keydown", this.searchOverlayKeyHandler, true);
        document.addEventListener("mousedown", this.searchOverlayClickOutsideHandler, true);
        document.body.appendChild(overlay);
        this.searchOverlayEl = overlay;
        setKeyboardNavState(focusTarget === "current-session");
        renderList();
        var margin = 8;
        var STATUS_BAR_FALLBACK_HEIGHT = 28;
        var MIN_VISIBLE_HEIGHT = 20;
        function cacheStatusBarMetrics() {
          var aEl = anchorEl || self.statusBarEl;
          var statusBar = aEl ? aEl.closest(".status-bar") : document.querySelector(".status-bar");
          if (statusBar) {
            var h = statusBar.getBoundingClientRect().height;
            if (h >= MIN_VISIBLE_HEIGHT) {
              self._cachedBarHeight = h;
            }
          }
          if (aEl) {
            var aRect = aEl.getBoundingClientRect();
            if (aRect.width > 0 && aRect.height > 0) {
              self._cachedAnchorCenterX = aRect.left + aRect.width / 2;
            }
          }
        }
        cacheStatusBarMetrics();
        function positionToAnchor() {
          var oRect = overlay.getBoundingClientRect();
          var barHeight = self._cachedBarHeight || STATUS_BAR_FALLBACK_HEIGHT;
          var centerX = self._cachedAnchorCenterX || window.innerWidth / 2;
          var lp = centerX - oRect.width / 2;
          lp = Math.max(margin, Math.min(lp, window.innerWidth - oRect.width - margin));
          var bp = barHeight + margin;
          if (bp + oRect.height > window.innerHeight - margin) {
            bp = margin;
          }
          overlay.style.right = "auto";
          overlay.style.top = "auto";
          overlay.style.left = lp + "px";
          overlay.style.bottom = bp + "px";
        }
        var savedSize = self.data.searchOverlaySize;
        var MIN_WIDTH = 220;
        var MIN_HEIGHT = 140;
        if (savedSize && savedSize.width != null && savedSize.height != null) {
          overlay.style.width = Math.max(MIN_WIDTH, savedSize.width) + "px";
          overlay.style.height = Math.max(MIN_HEIGHT, savedSize.height) + "px";
          overlay.style.minWidth = "0";
          overlay.style.maxWidth = "none";
          list.style.maxHeight = "none";
        }
        function resetSize() {
          overlay.style.width = "";
          overlay.style.height = "";
          overlay.style.minWidth = "";
          overlay.style.maxWidth = "";
          list.style.maxHeight = "";
        }
        var savedPos = self.data.searchOverlayPosition;
        if (savedPos && savedPos.left != null && savedPos.bottom != null) {
          var overlayRect = overlay.getBoundingClientRect();
          var sl = Math.max(margin, Math.min(savedPos.left, window.innerWidth - overlayRect.width - margin));
          var sb = Math.max(margin, Math.min(savedPos.bottom, window.innerHeight - overlayRect.height - margin));
          overlay.style.right = "auto";
          overlay.style.top = "auto";
          overlay.style.left = sl + "px";
          overlay.style.bottom = sb + "px";
        } else {
          positionToAnchor();
        }
        overlay.addEventListener("dblclick", function(e) {
          if (e.target.closest(".wpp-search-close")) return;
          if (e.target.closest(".wpp-switch-item")) return;
          if (e.target.closest(".wpp-search-input")) return;
          if (e.target.closest(".wpp-qs-action-btn")) return;
          resetSize();
          positionToAnchor();
          self.data.searchOverlayPosition = null;
          self.data.searchOverlaySize = null;
          self.persistData();
        });
        overlay.addEventListener("contextmenu", function(e) {
          if (e.target.closest(".wpp-switch-item")) return;
          if (e.target.closest(".wpp-search-input")) return;
          if (e.target.closest(".wpp-search-close")) return;
          if (e.target.closest(".wpp-qs-action-btn")) return;
          if (e.target.closest(".wpp-group-tab")) return;
          e.preventDefault();
          settingsContextMenu.openSettingsContextMenu({
            plugin: self,
            app: self.app,
            event: e,
            showResetOverlay: true,
            onResetOverlay: function() {
              resetSize();
              positionToAnchor();
              self.data.searchOverlayPosition = null;
              self.data.searchOverlaySize = null;
              self.persistData();
            },
            onChanged: function() {
              searchRow.style.display = self.data.showFilterInput ? "" : "none";
              renderGroupTabs();
              refreshOrderedSessions();
            }
          });
        });
        overlay.addEventListener("mousedown", function(e) {
          var cornerEl = e.target.closest(".wpp-resize-corner");
          var edgeEl2 = !cornerEl ? e.target.closest(".wpp-resize-edge") : null;
          if (!cornerEl && !edgeEl2) return;
          if (e.button !== 0) return;
          e.preventDefault();
          e.stopPropagation();
          var dir = cornerEl ? cornerEl.dataset.corner : null;
          var edge = edgeEl2 ? edgeEl2.dataset.edge : null;
          var startX = e.clientX;
          var startY = e.clientY;
          var startRect = overlay.getBoundingClientRect();
          var startWidth = startRect.width;
          var startHeight = startRect.height;
          var startLeft = startRect.left;
          var startBottom = window.innerHeight - startRect.bottom;
          function onMove(ev) {
            var dx = ev.clientX - startX;
            var dy = ev.clientY - startY;
            var newWidth = startWidth;
            var newHeight = startHeight;
            var newLeft = startLeft;
            var newBottom = startBottom;
            var moveRight = dir === "tr" || dir === "br" || edge === "right";
            var moveLeft = dir === "tl" || dir === "bl" || edge === "left";
            if (moveRight) {
              newWidth = Math.max(MIN_WIDTH, startWidth + dx);
            } else if (moveLeft) {
              newWidth = Math.max(MIN_WIDTH, startWidth - dx);
              newLeft = startLeft + (startWidth - newWidth);
            }
            var moveTop = dir === "tl" || dir === "tr" || edge === "top";
            var moveBottom = dir === "bl" || dir === "br" || edge === "bottom";
            if (moveTop) {
              newHeight = Math.max(MIN_HEIGHT, startHeight - dy);
            } else if (moveBottom) {
              newHeight = Math.max(MIN_HEIGHT, startHeight + dy);
              newBottom = startBottom - (newHeight - startHeight);
              if (newBottom < margin) {
                newHeight = startHeight + startBottom - margin;
                newBottom = margin;
              }
            }
            newWidth = Math.max(MIN_WIDTH, newWidth);
            newHeight = Math.max(MIN_HEIGHT, newHeight);
            if (newLeft < margin) newLeft = margin;
            if (newLeft + newWidth > window.innerWidth - margin) {
              newLeft = window.innerWidth - margin - newWidth;
              if (newLeft < margin) newLeft = margin;
            }
            if (newBottom < margin) newBottom = margin;
            if (window.innerHeight - newBottom - newHeight < margin) {
              newBottom = window.innerHeight - newHeight - margin;
              if (newBottom < margin) newBottom = margin;
            }
            overlay.style.width = newWidth + "px";
            overlay.style.height = newHeight + "px";
            overlay.style.minWidth = "0";
            overlay.style.maxWidth = "none";
            overlay.style.left = newLeft + "px";
            overlay.style.bottom = newBottom + "px";
            overlay.style.right = "auto";
            overlay.style.top = "auto";
            list.style.maxHeight = "none";
          }
          function onUp() {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
            var finalRect = overlay.getBoundingClientRect();
            self.data.searchOverlaySize = {
              width: finalRect.width,
              height: finalRect.height
            };
            self.data.searchOverlayPosition = {
              left: finalRect.left,
              bottom: window.innerHeight - finalRect.bottom
            };
            self.persistData();
          }
          document.addEventListener("mousemove", onMove);
          document.addEventListener("mouseup", onUp);
        });
        overlay.addEventListener("mousedown", function(e) {
          if (e.target.closest(".wpp-search-close")) return;
          if (e.target.closest(".wpp-switch-item")) return;
          if (e.target.closest(".wpp-search-input")) return;
          if (e.target.closest(".wpp-save-input")) return;
          if (e.target.closest(".wpp-save-btn")) return;
          if (e.target.closest(".wpp-group-tab")) return;
          if (e.target.closest(".wpp-group-add-btn")) return;
          if (e.target.closest(".wpp-group-tabs")) return;
          if (e.target.closest(".wpp-qs-action-btn")) return;
          if (e.target.closest(".wpp-resize-corner")) return;
          if (e.button !== 0) return;
          e.preventDefault();
          overlay.classList.add("wpp-dragging");
          var rect = overlay.getBoundingClientRect();
          var offsetX = e.clientX - rect.left;
          var offsetY = e.clientY - rect.top;
          function onMove(ev) {
            var newLeft = ev.clientX - offsetX;
            var newTop = ev.clientY - offsetY;
            var oRect = overlay.getBoundingClientRect();
            newLeft = Math.max(margin, Math.min(newLeft, window.innerWidth - oRect.width - margin));
            newTop = Math.max(margin, Math.min(newTop, window.innerHeight - oRect.height - margin));
            var newBottom = window.innerHeight - newTop - oRect.height;
            overlay.style.right = "auto";
            overlay.style.top = "auto";
            overlay.style.left = newLeft + "px";
            overlay.style.bottom = newBottom + "px";
          }
          function onUp() {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
            overlay.classList.remove("wpp-dragging");
            var finalRect = overlay.getBoundingClientRect();
            self.data.searchOverlayPosition = {
              left: finalRect.left,
              bottom: window.innerHeight - finalRect.bottom
            };
            self.persistData();
          }
          document.addEventListener("mousemove", onMove);
          document.addEventListener("mouseup", onUp);
        });
        if (focusTarget !== "session-create") {
          var guardHandler = function(e) {
            if (e.target === saveInput) {
              e.preventDefault();
              e.stopImmediatePropagation();
              if (focusTarget === "session-filter" && self.data.showFilterInput) {
                searchInput.focus();
              } else {
                overlay.focus();
              }
            }
          };
          overlay.addEventListener("focusin", guardHandler, true);
          setTimeout(function() {
            overlay.removeEventListener("focusin", guardHandler, true);
          }, 300);
        }
        setTimeout(function() {
          if (focusTarget === "session-filter" && self.data.showFilterInput) {
            navigationUtils.focusTextInputSelect(searchInput);
          } else if (focusTarget === "session-create") {
            saveInput.focus();
          } else {
            overlay.focus();
          }
        }, 20);
      };
      WorkspacePlusPlus2.prototype.showSwitchPreviewOverlay = function(ordered, activeIndex, viewGroupId) {
        return this.showSwitchOverlay(ordered, activeIndex, viewGroupId, { mode: "preview" });
      };
      WorkspacePlusPlus2.prototype.showSwitchFeedbackOverlay = function(ordered, activeIndex, viewGroupId, options) {
        options = Object.assign({}, options, { mode: "feedback" });
        return this.showSwitchOverlay(ordered, activeIndex, viewGroupId, options);
      };
      WorkspacePlusPlus2.prototype.showSwitchOverlay = function(ordered, activeIndex, viewGroupId, options) {
        options = options || {};
        var L = i18n2.L;
        if (this.clearSessionSwitchNotice) {
          this.clearSessionSwitchNotice();
        }
        this.hideSearchOverlay();
        this.cleanupOverlayListeners();
        if (this.switchOverlayEl) {
          this.switchOverlayEl.remove();
        }
        if (this.switchOverlayTimer) {
          clearTimeout(this.switchOverlayTimer);
        }
        var overlayGroupId = this.isGroupFeatureEnabled() ? typeof viewGroupId === "undefined" ? this.data.activeGroupId || null : viewGroupId || null : null;
        if (overlayGroupId && !(this.data.groups || {})[overlayGroupId]) {
          overlayGroupId = this.data.activeGroupId || null;
        }
        var overlayMode = options.mode || "preview";
        var feedbackDurationMs = Math.max(0, Number(options.durationMs) || 400);
        this.switchOverlayViewGroupId = overlayGroupId;
        var self = this;
        function reopenOverlayForGroup(result) {
          var newOrdered = result.sessions;
          var newActiveIndex = self.getActiveSessionIndex(newOrdered);
          self.showSwitchOverlay(newOrdered, newActiveIndex, result.resolvedGroupId, options);
        }
        function onGroupTabClick(targetGroupId, e) {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          self.resolveGroupSelection(targetGroupId || null).then(reopenOverlayForGroup);
        }
        function onSessionItemClick(sessionId, e) {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          if (!sessionId) return;
          if (sessionId === self.data.activeSessionId) {
            self.hideSwitchOverlay();
            return;
          }
          self.switchSession(sessionId, { silent: true }).then(function(switched) {
            if (switched) self.hideSwitchOverlay();
          });
        }
        var overlay = document.createElement("div");
        overlay.className = "wpp-switch-overlay";
        var countSpan = document.createElement("div");
        countSpan.className = "wpp-switch-count";
        countSpan.textContent = ordered.length > 0 ? activeIndex + 1 + " / " + ordered.length : "0 / 0";
        overlay.appendChild(countSpan);
        var realGroups = this.getOrderedGroups();
        if (realGroups.length > 0) {
          var groupTabsRow = document.createElement("div");
          groupTabsRow.className = "wpp-group-tabs";
          var allGroups = this.data.groups || {};
          var groupOrder = this.getOrderedGroupTabIds();
          for (var gi = 0; gi < groupOrder.length; gi++) {
            var gid = groupOrder[gi];
            if (gid === "__all__") {
              var allTab = document.createElement("div");
              allTab.className = "wpp-group-tab";
              if (!overlayGroupId) allTab.classList.add("is-active");
              allTab.textContent = L.groupAll;
              allTab.addEventListener("click", function(e) {
                onGroupTabClick(null, e);
              });
              groupTabsRow.appendChild(allTab);
            } else if (allGroups[gid]) {
              var tab = document.createElement("div");
              tab.className = "wpp-group-tab";
              if (overlayGroupId === gid) tab.classList.add("is-active");
              tab.textContent = allGroups[gid].name;
              (function(targetGroupId) {
                tab.addEventListener("click", function(e) {
                  onGroupTabClick(targetGroupId, e);
                });
              })(gid);
              groupTabsRow.appendChild(tab);
            }
          }
          overlay.appendChild(groupTabsRow);
        }
        var list = document.createElement("div");
        list.className = "wpp-switch-list";
        for (var i = 0; i < ordered.length; i++) {
          var item = document.createElement("div");
          item.className = "wpp-switch-item";
          if (i === activeIndex) {
            item.classList.add("is-active");
          }
          item.dataset.sessionId = ordered[i].id;
          var name = document.createElement("div");
          name.className = "wpp-switch-name";
          name.textContent = ordered[i].name;
          item.appendChild(name);
          var hk = i <= 8 ? this.getCommandHotkey("switch-to-" + (i + 1)) : "";
          var hotkeyEl = document.createElement("div");
          hotkeyEl.className = "wpp-switch-hotkey";
          hotkeyEl.textContent = hk || String(i + 1);
          item.appendChild(hotkeyEl);
          (function(targetSessionId) {
            item.addEventListener("click", function(e) {
              onSessionItemClick(targetSessionId, e);
            });
          })(ordered[i].id);
          list.appendChild(item);
        }
        overlay.appendChild(list);
        var footerRow = document.createElement("div");
        footerRow.className = "wpp-switch-footer";
        if (realGroups.length > 0) {
          var groupLine = document.createElement("div");
          groupLine.textContent = (L.keyTab || "Tab") + "  " + L.switchGroup;
          footerRow.appendChild(groupLine);
        }
        var nextKey = this.getCommandHotkey("next-session");
        if (nextKey) {
          var line1 = document.createElement("div");
          line1.textContent = L.cmdNext + "  " + nextKey;
          footerRow.appendChild(line1);
        }
        var prevKey2 = this.getCommandHotkey("previous-session");
        var nextKey2 = this.getCommandHotkey("next-session", 1);
        if (prevKey2 || nextKey2) {
          var line2 = document.createElement("div");
          var parts = [];
          if (prevKey2) parts.push(L.switchLeft + " " + prevKey2);
          if (nextKey2) parts.push(L.switchRight + " " + nextKey2);
          line2.textContent = parts.join("  /  ");
          footerRow.appendChild(line2);
        }
        overlay.appendChild(footerRow);
        var allSessions = this.getOrderedSessionsUnfiltered();
        if (allSessions.length > ordered.length) {
          var measure = overlay.cloneNode(false);
          measure.style.visibility = "hidden";
          measure.style.pointerEvents = "none";
          for (var ci = 0; ci < overlay.childNodes.length; ci++) {
            if (overlay.childNodes[ci] === list) break;
            measure.appendChild(overlay.childNodes[ci].cloneNode(true));
          }
          var measureList = document.createElement("div");
          measureList.className = "wpp-switch-list";
          for (var mi = 0; mi < allSessions.length; mi++) {
            var mItem = document.createElement("div");
            mItem.className = "wpp-switch-item";
            var mName = document.createElement("div");
            mName.className = "wpp-switch-name";
            mName.textContent = allSessions[mi].name;
            mItem.appendChild(mName);
            var mHk = document.createElement("div");
            mHk.className = "wpp-switch-hotkey";
            mHk.textContent = String(mi + 1);
            mItem.appendChild(mHk);
            measureList.appendChild(mItem);
          }
          measure.appendChild(measureList);
          measure.appendChild(footerRow.cloneNode(true));
          document.body.appendChild(measure);
          overlay.style.minWidth = measure.offsetWidth + "px";
          overlay.style.minHeight = measure.offsetHeight + "px";
          measure.remove();
        }
        document.body.appendChild(overlay);
        this.switchOverlayEl = overlay;
        if (overlayMode === "feedback") {
          this.overlayBlurHandler = function() {
            self.hideSwitchOverlay();
          };
          window.addEventListener("blur", this.overlayBlurHandler);
          this.switchOverlayTimer = setTimeout(function() {
            if (!self.switchOverlayEl) return;
            self.hideSwitchOverlay();
          }, feedbackDurationMs);
          return;
        }
        var showTime = Date.now();
        this.overlayKeyUpHandler = function(e) {
          if (!utils2.isModShiftPressed(e)) {
            var elapsed = Date.now() - showTime;
            var minDelay = Math.max(0, 300 - elapsed);
            self.cleanupOverlayListeners();
            if (minDelay > 0) {
              self.switchOverlayTimer = setTimeout(function() {
                self.hideSwitchOverlay();
              }, minDelay);
            } else {
              self.hideSwitchOverlay();
            }
          }
        };
        this.overlayBlurHandler = function() {
          self.hideSwitchOverlay();
        };
        document.addEventListener("keyup", this.overlayKeyUpHandler);
        window.addEventListener("blur", this.overlayBlurHandler);
        function safetyCheck() {
          self.switchOverlayTimer = setTimeout(function() {
            if (!self.switchOverlayEl) return;
            self.hideSwitchOverlay();
          }, 5e3);
        }
        this.overlayKeyDownHandler = function(e) {
          if (self.switchOverlayTimer) {
            clearTimeout(self.switchOverlayTimer);
          }
          safetyCheck();
          if (e.key === "Tab" && self.switchOverlayEl && !utils2.isModPressed(e)) {
            if (!self.isGroupFeatureEnabled() || self.getOrderedGroups().length === 0) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            var nextGroupId = self.getRelativeGroupId(overlayGroupId, e.shiftKey ? -1 : 1);
            if (typeof nextGroupId === "undefined") return;
            self.resolveGroupSelection(nextGroupId).then(function(result) {
              var newOrdered = result.sessions;
              var newActiveIndex = self.getActiveSessionIndex(newOrdered);
              self.showSwitchOverlay(newOrdered, newActiveIndex, result.resolvedGroupId);
            });
          }
        };
        document.addEventListener("keydown", this.overlayKeyDownHandler);
        safetyCheck();
      };
      WorkspacePlusPlus2.prototype.cleanupOverlayListeners = function() {
        if (this.overlayKeyUpHandler) {
          document.removeEventListener("keyup", this.overlayKeyUpHandler);
          this.overlayKeyUpHandler = null;
        }
        if (this.overlayKeyDownHandler) {
          document.removeEventListener("keydown", this.overlayKeyDownHandler);
          this.overlayKeyDownHandler = null;
        }
        if (this.overlayBlurHandler) {
          window.removeEventListener("blur", this.overlayBlurHandler);
          this.overlayBlurHandler = null;
        }
        if (this.switchOverlayTimer) {
          clearTimeout(this.switchOverlayTimer);
          this.switchOverlayTimer = null;
        }
      };
      WorkspacePlusPlus2.prototype.hideSwitchOverlay = function() {
        if (this.switchOverlayEl) {
          this.switchOverlayEl.remove();
          this.switchOverlayEl = null;
        }
        this.switchOverlayViewGroupId = null;
        this.cleanupOverlayListeners();
      };
      WorkspacePlusPlus2.prototype.hideSearchOverlay = function() {
        if (this.searchOverlayEl) {
          this.searchOverlayEl.remove();
          this.searchOverlayEl = null;
        }
        this.searchOverlayViewGroupId = null;
        if (this.searchOverlayInputHandler && this.searchOverlayInputEl) {
          this.searchOverlayInputEl.removeEventListener("input", this.searchOverlayInputHandler);
        }
        if (this.searchOverlayKeyHandler) {
          document.removeEventListener("keydown", this.searchOverlayKeyHandler, true);
          this.searchOverlayKeyHandler = null;
        }
        if (this.searchOverlayClickOutsideHandler) {
          document.removeEventListener("mousedown", this.searchOverlayClickOutsideHandler, true);
          this.searchOverlayClickOutsideHandler = null;
        }
        this.searchOverlayInputHandler = null;
        this.searchOverlayInputEl = null;
        this._refreshOverlaySessions = null;
      };
    }
    module2.exports = attachOverlayMethods2;
  }
});

// src/plugin/methods/persistence.js
var require_persistence = __commonJS({
  "src/plugin/methods/persistence.js"(exports2, module2) {
    "use strict";
    var obsidian2 = require("obsidian");
    var i18n2 = require_i18n();
    var DEFAULT_DATA2 = require_default_data();
    var STORAGE_DIR = ".workspace-plus-plus";
    var SESSIONS_FILE = STORAGE_DIR + "/sessions.json";
    var SESSIONS_BACKUP_FILE = STORAGE_DIR + "/sessions.backup.json";
    var LOCAL_SETTINGS_FILE = STORAGE_DIR + "/settings.local.json";
    var EXPORT_DIR = STORAGE_DIR + "/exports";
    var BACKUPS_DIR = STORAGE_DIR + "/backups";
    var BACKUP_ROTATION_INTERVAL = 36e5;
    var SESSION_KEYS = [
      "activeSessionId",
      "sessions",
      "sessionOrder",
      "groups",
      "groupOrder",
      "sessionGroups",
      "activeGroupId"
    ];
    var SETTINGS_KEYS = [
      "language",
      "previewNext",
      "previewPrevious",
      "confirmDeleteByHotkey",
      "autoSaveOnSwitch",
      "warnOnUnsavedSwitch",
      "statusBarQuickSwitcher",
      "statusBarModScrollSwitch",
      "groupFeatureEnabled",
      "overlayDefaultFocus",
      "searchOverlayPosition",
      "searchOverlaySize",
      "versionHistoryEnabled",
      "versionHistorySnapshotInterval",
      "versionHistoryCtrlRmbRestore",
      "versionHistoryConfirmRestore",
      "statusBarScrollPreset",
      "statusBarScrollModifierMode",
      "statusBarScrollThreshold",
      "statusBarScrollCooldownMs",
      "statusBarScrollResetMs",
      "statusBarScrollInvert",
      "statusBarActions",
      "confirmQuickActions",
      "showFilterInput",
      "showActiveSwitchCommand",
      "numberedSwitchCommands"
    ];
    function pickKeys(data, keys) {
      var out = {};
      if (!data) return out;
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (data[key] !== void 0) out[key] = data[key];
      }
      return out;
    }
    function hasSessionShape(data) {
      return !!(data && typeof data === "object" && (data.sessions !== void 0 || data.sessionOrder !== void 0 || data.activeSessionId !== void 0));
    }
    function hasNonEmptySessions(data) {
      return !!(data && data.sessions && typeof data.sessions === "object" && Object.keys(data.sessions).length > 0);
    }
    function getPersistStamp(data) {
      if (!data || typeof data !== "object") return 0;
      var stamp = data._wppSavedAt;
      if (typeof stamp !== "number" || !isFinite(stamp)) return 0;
      return stamp;
    }
    function pad2(n) {
      return n < 10 ? "0" + n : String(n);
    }
    function formatExportStamp(ts) {
      var d = new Date(ts);
      return String(d.getFullYear()) + pad2(d.getMonth() + 1) + pad2(d.getDate()) + "-" + pad2(d.getHours()) + pad2(d.getMinutes()) + pad2(d.getSeconds());
    }
    function attachPersistenceMethods2(WorkspacePlusPlus2) {
      WorkspacePlusPlus2.prototype.getBackupPath = function() {
        return this.manifest.dir + "/data.backup.json";
      };
      WorkspacePlusPlus2.prototype.getStorageDirPath = function() {
        return STORAGE_DIR;
      };
      WorkspacePlusPlus2.prototype.getSessionsPath = function() {
        return SESSIONS_FILE;
      };
      WorkspacePlusPlus2.prototype.getSessionsBackupPath = function() {
        return SESSIONS_BACKUP_FILE;
      };
      WorkspacePlusPlus2.prototype.getLocalSettingsPath = function() {
        return LOCAL_SETTINGS_FILE;
      };
      WorkspacePlusPlus2.prototype.getExportDirPath = function() {
        return EXPORT_DIR;
      };
      WorkspacePlusPlus2.prototype.getBackupsDirPath = function() {
        return BACKUPS_DIR;
      };
      WorkspacePlusPlus2.prototype.getRotationBackupPath = function(generation) {
        return BACKUPS_DIR + "/sessions." + generation + ".json";
      };
      WorkspacePlusPlus2.prototype.getDefaultSettingsData = function() {
        return pickKeys(DEFAULT_DATA2, SETTINGS_KEYS);
      };
      WorkspacePlusPlus2.prototype.getDefaultSessionData = function() {
        return pickKeys(DEFAULT_DATA2, SESSION_KEYS);
      };
      WorkspacePlusPlus2.prototype.extractSettingsData = function(data) {
        return pickKeys(data, SETTINGS_KEYS);
      };
      WorkspacePlusPlus2.prototype.extractSessionData = function(data) {
        return this.normalizeSessionData(pickKeys(data, SESSION_KEYS));
      };
      WorkspacePlusPlus2.prototype.normalizeSessionData = function(raw) {
        var sessions = raw && raw.sessions && typeof raw.sessions === "object" ? raw.sessions : {};
        var rawOrder = Array.isArray(raw && raw.sessionOrder) ? raw.sessionOrder : Object.keys(sessions);
        var seen = {};
        var order = [];
        var i;
        for (i = 0; i < rawOrder.length; i++) {
          var id = rawOrder[i];
          if (!sessions[id] || seen[id]) continue;
          seen[id] = true;
          order.push(id);
        }
        var allIds = Object.keys(sessions);
        for (i = 0; i < allIds.length; i++) {
          if (seen[allIds[i]]) continue;
          seen[allIds[i]] = true;
          order.push(allIds[i]);
        }
        var active = raw && typeof raw.activeSessionId === "string" ? raw.activeSessionId : null;
        if (active && !sessions[active]) active = null;
        if (!active && order.length > 0) active = order[0];
        var groups = raw && raw.groups && typeof raw.groups === "object" ? raw.groups : {};
        var rawGroupOrder = Array.isArray(raw && raw.groupOrder) ? raw.groupOrder : Object.keys(groups);
        var seenGroups = {};
        var groupOrder = [];
        for (i = 0; i < rawGroupOrder.length; i++) {
          var gid = rawGroupOrder[i];
          if (gid !== "__all__" && !groups[gid]) continue;
          if (seenGroups[gid]) continue;
          seenGroups[gid] = true;
          groupOrder.push(gid);
        }
        var allGroupIds = Object.keys(groups);
        for (i = 0; i < allGroupIds.length; i++) {
          if (seenGroups[allGroupIds[i]]) continue;
          seenGroups[allGroupIds[i]] = true;
          groupOrder.push(allGroupIds[i]);
        }
        var sessionGroups = raw && raw.sessionGroups && typeof raw.sessionGroups === "object" ? raw.sessionGroups : {};
        var sessionGroupsCleaned = {};
        var sgKeys = Object.keys(sessionGroups);
        for (i = 0; i < sgKeys.length; i++) {
          var sid = sgKeys[i];
          if (!sessions[sid]) continue;
          var gids = Array.isArray(sessionGroups[sid]) ? sessionGroups[sid] : [];
          var validGids = [];
          for (var k = 0; k < gids.length; k++) {
            if (groups[gids[k]]) validGids.push(gids[k]);
          }
          if (validGids.length > 0) sessionGroupsCleaned[sid] = validGids;
        }
        var activeGroupId = raw && typeof raw.activeGroupId === "string" && groups[raw.activeGroupId] ? raw.activeGroupId : null;
        return {
          activeSessionId: active,
          sessions,
          sessionOrder: order,
          groups,
          groupOrder,
          sessionGroups: sessionGroupsCleaned,
          activeGroupId
        };
      };
      WorkspacePlusPlus2.prototype.ensureDir = function(path) {
        var self = this;
        return this.app.vault.adapter.exists(path).then(function(exists) {
          if (exists) return;
          return self.app.vault.adapter.mkdir(path).catch(function() {
            return self.app.vault.adapter.exists(path).then(function(existsAfter) {
              if (!existsAfter) throw new Error("Failed to create directory: " + path);
            });
          });
        });
      };
      WorkspacePlusPlus2.prototype.ensureStorageDir = function() {
        return this.ensureDir(this.getStorageDirPath());
      };
      WorkspacePlusPlus2.prototype.getFileMtime = function(path) {
        return this.app.vault.adapter.stat(path).then(function(stat) {
          if (!stat || typeof stat.mtime !== "number") return 0;
          return stat.mtime;
        }).catch(function() {
          return 0;
        });
      };
      WorkspacePlusPlus2.prototype.readJsonIfExists = function(path) {
        var self = this;
        return this.app.vault.adapter.exists(path).then(function(exists) {
          if (!exists) {
            return { exists: false, data: null, error: null };
          }
          return self.app.vault.adapter.read(path).then(function(raw) {
            try {
              return { exists: true, data: JSON.parse(raw), error: null };
            } catch (e) {
              return { exists: true, data: null, error: e };
            }
          }).catch(function(e) {
            return { exists: true, data: null, error: e };
          });
        });
      };
      WorkspacePlusPlus2.prototype.writeJson = function(path, data, pretty) {
        var json = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
        return this.app.vault.adapter.write(path, json);
      };
      WorkspacePlusPlus2.prototype.writeJsonWithBackup = function(path, backupPath, data, pretty) {
        var self = this;
        return this.writeJson(backupPath, data, pretty).then(function() {
          return self.writeJson(path, data, pretty);
        });
      };
      WorkspacePlusPlus2.prototype.removeIfExists = function(path) {
        var self = this;
        return this.app.vault.adapter.exists(path).then(function(exists) {
          if (!exists) return;
          return self.app.vault.adapter.remove(path).catch(function() {
            return;
          });
        });
      };
      WorkspacePlusPlus2.prototype.persistGlobalSettings = function() {
        var self = this;
        if (!this.globalSettings) {
          this.globalSettings = Object.assign({}, this.getDefaultSettingsData());
        }
        var json = JSON.stringify(this.globalSettings);
        return this.app.vault.adapter.write(this.getBackupPath(), json).then(function() {
          return self.saveData(self.globalSettings);
        });
      };
      WorkspacePlusPlus2.prototype.isUsingLocalSettings = function() {
        return !!this.useLocalSettings;
      };
      WorkspacePlusPlus2.prototype.setUseLocalSettings = function(enabled, options) {
        var self = this;
        var L = i18n2.L;
        options = options || {};
        var next = !!enabled;
        if (next === this.isUsingLocalSettings()) return Promise.resolve(next);
        if (next) {
          var current = Object.assign({}, this.getDefaultSettingsData(), this.extractSettingsData(this.data));
          this.globalSettings = Object.assign({}, current);
          this.useLocalSettings = true;
          return this.ensureStorageDir().then(function() {
            return self.writeJson(self.getLocalSettingsPath(), current, true);
          }).then(function() {
            return self.persistData();
          }).then(function() {
            if (options.notify) new obsidian2.Notice(L.localSettingsEnabled);
            return true;
          });
        }
        this.useLocalSettings = false;
        var global = Object.assign({}, this.getDefaultSettingsData(), this.globalSettings || {});
        for (var i = 0; i < SETTINGS_KEYS.length; i++) {
          this.data[SETTINGS_KEYS[i]] = global[SETTINGS_KEYS[i]];
        }
        return this.removeIfExists(this.getLocalSettingsPath()).then(function() {
          return self.persistData();
        }).then(function() {
          if (options.notify) new obsidian2.Notice(L.localSettingsDisabled);
          return false;
        });
      };
      WorkspacePlusPlus2.prototype.copyGlobalSettingsToLocal = function(options) {
        var self = this;
        var L = i18n2.L;
        options = options || {};
        var global = Object.assign({}, this.getDefaultSettingsData(), this.globalSettings || {});
        this.useLocalSettings = true;
        for (var i = 0; i < SETTINGS_KEYS.length; i++) {
          this.data[SETTINGS_KEYS[i]] = global[SETTINGS_KEYS[i]];
        }
        return this.ensureStorageDir().then(function() {
          return self.writeJson(self.getLocalSettingsPath(), global, true);
        }).then(function() {
          return self.persistData();
        }).then(function() {
          if (options.notify) new obsidian2.Notice(L.localSettingsCopied);
          return true;
        });
      };
      WorkspacePlusPlus2.prototype.resetLocalSettings = function(options) {
        var self = this;
        options = options || {};
        if (!this.isUsingLocalSettings()) return Promise.resolve(false);
        return this.copyGlobalSettingsToLocal(options).then(function() {
          return self.isUsingLocalSettings();
        });
      };
      WorkspacePlusPlus2.prototype.applyDefaultSettingsToCurrentScope = function() {
        var defaults = this.getDefaultSettingsData();
        for (var i = 0; i < SETTINGS_KEYS.length; i++) {
          this.data[SETTINGS_KEYS[i]] = defaults[SETTINGS_KEYS[i]];
        }
        i18n2.resolveLocale(this.data.language || "auto");
      };
      WorkspacePlusPlus2.prototype.resetSettingsToDefault = function() {
        this.applyDefaultSettingsToCurrentScope();
        return this.persistData();
      };
      WorkspacePlusPlus2.prototype.resetSessionsAndSettingsToDefault = function() {
        this.applyDefaultSettingsToCurrentScope();
        return this.resetSessionsToDefault();
      };
      WorkspacePlusPlus2.prototype.getStorageDiagnosticsInfo = function() {
        return {
          sessionsPath: this.getSessionsPath(),
          sessionsBackupPath: this.getSessionsBackupPath(),
          localSettingsPath: this.getLocalSettingsPath(),
          globalSettingsPath: this.manifest.dir + "/data.json",
          sessionCount: Object.keys(this.data && this.data.sessions || {}).length,
          updatedAt: Date.now()
        };
      };
      WorkspacePlusPlus2.prototype.exportSessionsSnapshot = function() {
        var self = this;
        var L = i18n2.L;
        var stamp = formatExportStamp(Date.now());
        var filePath = this.getExportDirPath() + "/sessions-" + stamp + ".json";
        var payload = {
          exportedAt: Date.now(),
          source: this.manifest.id,
          data: this.extractSessionData(this.data)
        };
        return this.ensureStorageDir().then(function() {
          return self.ensureDir(self.getExportDirPath());
        }).then(function() {
          return self.writeJson(filePath, payload, true);
        }).then(function() {
          new obsidian2.Notice(L.exportSessionsDone(filePath), 7e3);
          return filePath;
        });
      };
      WorkspacePlusPlus2.prototype.importSessionsFromLatestExport = function() {
        var self = this;
        var L = i18n2.L;
        return this.app.vault.adapter.exists(this.getExportDirPath()).then(function(exists) {
          if (!exists) return null;
          return self.app.vault.adapter.list(self.getExportDirPath());
        }).then(function(listed) {
          if (!listed || !listed.files || listed.files.length === 0) return null;
          var files = listed.files.filter(function(path) {
            return /\.json$/i.test(path);
          });
          if (files.length === 0) return null;
          files.sort();
          return files[files.length - 1];
        }).then(function(latestPath) {
          if (!latestPath) {
            new obsidian2.Notice(L.importSessionsNoFile);
            return false;
          }
          return self.app.vault.adapter.read(latestPath).then(function(raw) {
            var parsed = JSON.parse(raw);
            var candidate = parsed && parsed.data ? parsed.data : parsed;
            if (!hasSessionShape(candidate)) {
              new obsidian2.Notice(L.importSessionsFailed);
              return false;
            }
            var imported = self.normalizeSessionData(candidate);
            if (!hasNonEmptySessions(imported)) {
              new obsidian2.Notice(L.importSessionsFailed);
              return false;
            }
            self.data.activeSessionId = imported.activeSessionId;
            self.data.sessions = imported.sessions;
            self.data.sessionOrder = imported.sessionOrder;
            self.data.groups = imported.groups || {};
            self.data.groupOrder = typeof self.normalizeGroupTabOrder === "function" ? self.normalizeGroupTabOrder(imported.groupOrder || []) : imported.groupOrder || [];
            self.data.sessionGroups = imported.sessionGroups || {};
            self.data.activeGroupId = imported.activeGroupId || null;
            self.syncSessionOrder();
            self.updateStatusBar();
            self.syncSessionCommands();
            return self.persistData().then(function() {
              new obsidian2.Notice(L.importSessionsDone(latestPath), 7e3);
              return true;
            });
          }).catch(function() {
            new obsidian2.Notice(L.importSessionsFailed);
            return false;
          });
        });
      };
      WorkspacePlusPlus2.prototype.persistDataImmediate = function() {
        var self = this;
        var sessionData = this.extractSessionData(this.data);
        var settingsData = Object.assign({}, this.getDefaultSettingsData(), this.extractSettingsData(this.data));
        var now = Date.now();
        if (typeof this._lastPersistStamp === "number" && now <= this._lastPersistStamp) {
          now = this._lastPersistStamp + 1;
        }
        this._lastPersistStamp = now;
        sessionData._wppSavedAt = now;
        if (this.isUsingLocalSettings()) {
          if (!this.globalSettings) {
            this.globalSettings = Object.assign({}, settingsData);
          }
        } else {
          this.globalSettings = Object.assign({}, settingsData);
        }
        return this.ensureStorageDir().then(function() {
          return self.writeJsonWithBackup(
            self.getSessionsPath(),
            self.getSessionsBackupPath(),
            sessionData
          );
        }).then(function() {
          return self.rotateBackupIfNeeded(sessionData);
        }).then(function() {
          if (!self.isUsingLocalSettings()) return;
          return self.writeJson(self.getLocalSettingsPath(), settingsData, true);
        }).then(function() {
          return self.persistGlobalSettings();
        });
      };
      WorkspacePlusPlus2.prototype.persistData = function() {
        var self = this;
        if (!this._persistQueue) {
          this._persistQueue = Promise.resolve();
        }
        var next = this._persistQueue.catch(function() {
          return;
        }).then(function() {
          return self.persistDataImmediate();
        });
        this._persistQueue = next;
        return next;
      };
      WorkspacePlusPlus2.prototype.flushPendingPersistence = function() {
        if (!this._persistQueue) return Promise.resolve();
        return this._persistQueue.catch(function() {
          return;
        });
      };
      WorkspacePlusPlus2.prototype.initRotationBackupTimestamp = function() {
        var self = this;
        return this.readJsonIfExists(this.getRotationBackupPath(1)).then(function(res) {
          if (res.exists && res.data) {
            self._lastRotationBackupAt = getPersistStamp(res.data) || 0;
          } else {
            self._lastRotationBackupAt = 0;
          }
        }).catch(function() {
          self._lastRotationBackupAt = 0;
        });
      };
      WorkspacePlusPlus2.prototype.rotateBackupIfNeeded = function(sessionData) {
        var now = Date.now();
        var last = this._lastRotationBackupAt || 0;
        if (now - last < BACKUP_ROTATION_INTERVAL) return Promise.resolve();
        var self = this;
        this._lastRotationBackupAt = now;
        return this.ensureDir(this.getBackupsDirPath()).then(function() {
          return self.copyFileIfExists(
            self.getRotationBackupPath(2),
            self.getRotationBackupPath(3)
          );
        }).then(function() {
          return self.copyFileIfExists(
            self.getRotationBackupPath(1),
            self.getRotationBackupPath(2)
          );
        }).then(function() {
          return self.writeJson(self.getRotationBackupPath(1), sessionData);
        }).catch(function() {
          return;
        });
      };
      WorkspacePlusPlus2.prototype.copyFileIfExists = function(srcPath, dstPath) {
        var self = this;
        return this.app.vault.adapter.exists(srcPath).then(function(exists) {
          if (!exists) return;
          return self.app.vault.adapter.read(srcPath).then(function(raw) {
            return self.app.vault.adapter.write(dstPath, raw);
          });
        });
      };
      WorkspacePlusPlus2.prototype.getRotationBackupInfo = function() {
        var self = this;
        var results = [];
        function readGeneration(n) {
          return self.readJsonIfExists(self.getRotationBackupPath(n)).then(function(res) {
            if (!res.exists || !res.data) return null;
            var stamp = getPersistStamp(res.data);
            var sessions = res.data.sessions;
            var count = sessions && typeof sessions === "object" ? Object.keys(sessions).length : 0;
            return { generation: n, savedAt: stamp, sessionCount: count };
          }).catch(function() {
            return null;
          });
        }
        return Promise.all([
          readGeneration(1),
          readGeneration(2),
          readGeneration(3)
        ]).then(function(items) {
          for (var i = 0; i < items.length; i++) {
            if (items[i]) results.push(items[i]);
          }
          return results;
        });
      };
      WorkspacePlusPlus2.prototype.restoreFromRotationBackup = function(generation) {
        var self = this;
        var L = i18n2.L;
        return this.readJsonIfExists(this.getRotationBackupPath(generation)).then(function(res) {
          if (!res.exists || res.error || !res.data) {
            new obsidian2.Notice(L.rotationBackupRestoreFailed);
            return false;
          }
          if (!hasSessionShape(res.data)) {
            new obsidian2.Notice(L.rotationBackupRestoreFailed);
            return false;
          }
          var imported = self.normalizeSessionData(res.data);
          if (!hasNonEmptySessions(imported)) {
            new obsidian2.Notice(L.rotationBackupRestoreFailed);
            return false;
          }
          self.data.activeSessionId = imported.activeSessionId;
          self.data.sessions = imported.sessions;
          self.data.sessionOrder = imported.sessionOrder;
          self.data.groups = imported.groups || {};
          self.data.groupOrder = typeof self.normalizeGroupTabOrder === "function" ? self.normalizeGroupTabOrder(imported.groupOrder || []) : imported.groupOrder || [];
          self.data.sessionGroups = imported.sessionGroups || {};
          self.data.activeGroupId = imported.activeGroupId || null;
          self.syncSessionOrder();
          self.updateStatusBar();
          self.syncSessionCommands();
          return self.persistData().then(function() {
            var active = self.getActiveSession();
            if (active && active.layout) {
              return self.app.workspace.changeLayout(active.layout).then(function() {
                new obsidian2.Notice(L.rotationBackupRestored);
                return true;
              });
            }
            new obsidian2.Notice(L.rotationBackupRestored);
            return true;
          });
        }).catch(function() {
          new obsidian2.Notice(L.rotationBackupRestoreFailed);
          return false;
        });
      };
      WorkspacePlusPlus2.prototype.loadLocalSettingsData = function() {
        var L = i18n2.L;
        return this.readJsonIfExists(this.getLocalSettingsPath()).then(function(res) {
          if (!res.exists) return null;
          if (res.error || !res.data || typeof res.data !== "object") {
            new obsidian2.Notice(L.localSettingsLoadFailed);
            return null;
          }
          return pickKeys(res.data, SETTINGS_KEYS);
        });
      };
      WorkspacePlusPlus2.prototype.loadSessionDataFromStorage = function() {
        var self = this;
        var L = i18n2.L;
        var mainPath = this.getSessionsPath();
        var backupPath = this.getSessionsBackupPath();
        return Promise.all([
          this.readJsonIfExists(mainPath),
          this.readJsonIfExists(backupPath),
          this.getFileMtime(mainPath),
          this.getFileMtime(backupPath)
        ]).then(function(parts) {
          var mainRes = parts[0];
          var backupRes = parts[1];
          var mainMtime = parts[2] || 0;
          var backupMtime = parts[3] || 0;
          var mainValid = mainRes.exists && !mainRes.error && hasSessionShape(mainRes.data);
          var backupValid = backupRes.exists && !backupRes.error && hasSessionShape(backupRes.data);
          var mainStamp = mainValid ? getPersistStamp(mainRes.data) : 0;
          var backupStamp = backupValid ? getPersistStamp(backupRes.data) : 0;
          if (!mainValid && !backupValid) return null;
          var useBackup = false;
          if (!mainValid && backupValid) {
            useBackup = true;
          } else if (mainValid && backupValid) {
            if (backupStamp > mainStamp) {
              useBackup = true;
            } else if (backupStamp === mainStamp && backupMtime > mainMtime) {
              useBackup = true;
            }
          }
          if (!useBackup) {
            return self.normalizeSessionData(mainRes.data);
          }
          var restoredRaw = backupRes.data;
          var restored = self.normalizeSessionData(restoredRaw);
          return self.writeJson(mainPath, restoredRaw).catch(function() {
            return;
          }).then(function() {
            if (!mainValid) new obsidian2.Notice(L.backupRestored);
            return restored;
          });
        });
      };
      WorkspacePlusPlus2.prototype.migrateLegacySessions = function(sessionData) {
        var self = this;
        var normalized = this.normalizeSessionData(sessionData);
        return this.ensureStorageDir().then(function() {
          return self.writeJsonWithBackup(
            self.getSessionsPath(),
            self.getSessionsBackupPath(),
            normalized
          );
        }).then(function() {
          return self.persistGlobalSettings();
        }).then(function() {
          return true;
        }).catch(function() {
          return false;
        });
      };
      WorkspacePlusPlus2.prototype.loadWithBackup = function() {
        var self = this;
        var L = i18n2.L;
        var loadedMain = null;
        var rawSaved = null;
        var legacyMain = null;
        var hadLegacyInMain = false;
        return this.loadData().catch(function() {
          return null;
        }).then(function(saved) {
          rawSaved = saved;
          loadedMain = saved || {};
          self.globalSettings = Object.assign(
            {},
            self.getDefaultSettingsData(),
            self.extractSettingsData(loadedMain)
          );
          hadLegacyInMain = hasSessionShape(loadedMain);
          legacyMain = hadLegacyInMain ? self.normalizeSessionData(loadedMain) : null;
          return self.loadSessionDataFromStorage();
        }).then(function(sessionData) {
          if (sessionData && hasNonEmptySessions(sessionData)) return sessionData;
          if (legacyMain && hasNonEmptySessions(legacyMain)) {
            return self.migrateLegacySessions(legacyMain).then(function(ok) {
              if (ok) new obsidian2.Notice(L.sessionDataMigrated);
              else new obsidian2.Notice(L.sessionDataMigrationFailed);
              return legacyMain;
            });
          }
          if (sessionData) return sessionData;
          return self.readJsonIfExists(self.getBackupPath()).then(function(legacyBackupRes) {
            if (legacyBackupRes.exists && !legacyBackupRes.error && hasSessionShape(legacyBackupRes.data) && hasNonEmptySessions(legacyBackupRes.data)) {
              var fromLegacyBackup = self.normalizeSessionData(legacyBackupRes.data);
              return self.migrateLegacySessions(fromLegacyBackup).then(function(ok) {
                if (ok) new obsidian2.Notice(L.sessionDataMigrated);
                else new obsidian2.Notice(L.sessionDataMigrationFailed);
                return fromLegacyBackup;
              });
            }
            return self.getDefaultSessionData();
          });
        }).then(function(sessionData) {
          if (!hadLegacyInMain) return sessionData;
          return self.persistGlobalSettings().catch(function() {
            return;
          }).then(function() {
            return sessionData;
          });
        }).then(function(sessionData) {
          return self.loadLocalSettingsData().then(function(localSettings) {
            self.useLocalSettings = !!localSettings;
            var effectiveSettings = self.isUsingLocalSettings() ? Object.assign({}, self.globalSettings, localSettings) : Object.assign({}, self.globalSettings);
            if (rawSaved !== null && rawSaved !== void 0 && rawSaved.showFilterInput === void 0) {
              effectiveSettings.showFilterInput = true;
            }
            var merged = Object.assign({}, self.getDefaultSessionData(), sessionData || {});
            return Object.assign(merged, effectiveSettings);
          });
        });
      };
    }
    module2.exports = attachPersistenceMethods2;
  }
});

// src/plugin/methods/sessions-validation.js
var require_sessions_validation = __commonJS({
  "src/plugin/methods/sessions-validation.js"(exports2, module2) {
    "use strict";
    var obsidian2 = require("obsidian");
    var i18n2 = require_i18n();
    function attachSessionValidationMethods(WorkspacePlusPlus2) {
      WorkspacePlusPlus2.prototype.isSessionNameTaken = function(name, excludeSessionId) {
        var sessions = this.data.sessions || {};
        var keys = Object.keys(sessions);
        for (var i = 0; i < keys.length; i++) {
          var id = keys[i];
          if (excludeSessionId && id === excludeSessionId) continue;
          if (!sessions[id]) continue;
          if (sessions[id].name === name) return true;
        }
        return false;
      };
      WorkspacePlusPlus2.prototype.isGroupNameTaken = function(name, excludeGroupId) {
        var groups = this.data.groups || {};
        var keys = Object.keys(groups);
        for (var i = 0; i < keys.length; i++) {
          var id = keys[i];
          if (excludeGroupId && id === excludeGroupId) continue;
          if (!groups[id]) continue;
          if (groups[id].name === name) return true;
        }
        return false;
      };
      WorkspacePlusPlus2.prototype.createSessionValidated = function(name, options) {
        var L = i18n2.L;
        options = options || {};
        var rawName = typeof name === "string" ? name : "";
        var finalName = rawName.trim();
        if (!finalName) {
          if (rawName.length > 0) {
            if (options.notify !== false) {
              new obsidian2.Notice(L.emptyName);
            }
            return Promise.resolve({
              created: false,
              reason: "empty",
              name: "",
              sessionId: null
            });
          }
          finalName = this.getNextSessionName();
        }
        if (this.isSessionNameTaken(finalName)) {
          if (options.notify !== false) {
            new obsidian2.Notice(L.duplicateName);
          }
          return Promise.resolve({
            created: false,
            reason: "duplicate",
            name: finalName,
            sessionId: null
          });
        }
        var self = this;
        return this.createSession(finalName).then(function() {
          return {
            created: true,
            reason: "",
            name: finalName,
            sessionId: self.data.activeSessionId
          };
        });
      };
      WorkspacePlusPlus2.prototype.createSessionForViewedGroup = function(name, viewedGroupId, options) {
        var self = this;
        var groupsEnabled = this.isGroupFeatureEnabled();
        var targetGroupId = groupsEnabled ? viewedGroupId || null : null;
        var beforeActiveGroupId = groupsEnabled ? this.data.activeGroupId || null : null;
        return this.createSessionValidated(name, options).then(function(result) {
          if (!result || !result.created) return result;
          if (!groupsEnabled) {
            result.viewGroupId = null;
            return result;
          }
          var createdSessionId = result.sessionId;
          if (targetGroupId && targetGroupId !== beforeActiveGroupId) {
            return self.moveSessionToGroupExclusive(createdSessionId, targetGroupId).then(function() {
              return self.resolveGroupSelection(targetGroupId).then(function(selection) {
                result.viewGroupId = selection.resolvedGroupId || null;
                return result;
              });
            });
          }
          result.viewGroupId = self.data.activeGroupId || null;
          return result;
        });
      };
      WorkspacePlusPlus2.prototype.renameSessionById = function(sessionId, newName, options) {
        var L = i18n2.L;
        options = options || {};
        var session = this.data.sessions[sessionId];
        if (!session) return Promise.resolve(false);
        var normalized = typeof newName === "string" ? newName.trim() : "";
        if (!normalized) {
          if (options.notify !== false) {
            new obsidian2.Notice(L.emptyName);
          }
          return Promise.resolve(false);
        }
        if (normalized === session.name) return Promise.resolve(false);
        if (this.isSessionNameTaken(normalized, sessionId)) {
          if (options.notify !== false) {
            new obsidian2.Notice(L.duplicateName);
          }
          return Promise.resolve(false);
        }
        var oldName = session.name;
        session.name = normalized;
        session.modified = Date.now();
        this.updateStatusBar();
        this.syncSessionCommands();
        return this.persistData().then(function() {
          if (options.notify !== false) {
            new obsidian2.Notice(L.renamed(oldName, normalized));
          }
          return true;
        });
      };
      WorkspacePlusPlus2.prototype.createGroupValidated = function(name, options) {
        var L = i18n2.L;
        options = options || {};
        var normalized = typeof name === "string" ? name.trim() : "";
        if (!normalized) {
          if (options.notify !== false) {
            new obsidian2.Notice(L.groupEmptyName);
          }
          return Promise.resolve(false);
        }
        if (this.isGroupNameTaken(normalized)) {
          if (options.notify !== false) {
            new obsidian2.Notice(L.groupDuplicateName);
          }
          return Promise.resolve(false);
        }
        return this.createGroup(normalized);
      };
      WorkspacePlusPlus2.prototype.renameGroupValidated = function(groupId, newName, options) {
        var L = i18n2.L;
        options = options || {};
        var groups = this.data.groups || {};
        var group = groups[groupId];
        if (!group) return Promise.resolve(false);
        var normalized = typeof newName === "string" ? newName.trim() : "";
        if (!normalized) {
          if (options.notify !== false) {
            new obsidian2.Notice(L.groupEmptyName);
          }
          return Promise.resolve(false);
        }
        if (normalized === group.name) return Promise.resolve(false);
        if (this.isGroupNameTaken(normalized, groupId)) {
          if (options.notify !== false) {
            new obsidian2.Notice(L.groupDuplicateName);
          }
          return Promise.resolve(false);
        }
        return this.renameGroup(groupId, normalized);
      };
    }
    module2.exports = attachSessionValidationMethods;
  }
});

// src/plugin/methods/sessions.js
var require_sessions = __commonJS({
  "src/plugin/methods/sessions.js"(exports2, module2) {
    "use strict";
    var obsidian2 = require("obsidian");
    var i18n2 = require_i18n();
    var utils2 = require_utils();
    var modals2 = require_modals2();
    var attachSessionValidationMethods = require_sessions_validation();
    var STARTUP_SETTLE_MS = 1200;
    var STARTUP_LAYOUT_CHANGE_SETTLE_MS = 400;
    var STARTUP_SETTLE_MAX_MS = 5e3;
    var SESSION_SWITCH_NOTICE_DURATION_MS = 1200;
    function attachSessionMethods2(WorkspacePlusPlus2) {
      attachSessionValidationMethods(WorkspacePlusPlus2);
      WorkspacePlusPlus2.prototype.syncSessionOrder = function() {
        var sessions = this.data.sessions;
        var order = this.data.sessionOrder;
        this.data.sessionOrder = order.filter(function(id) {
          return !!sessions[id];
        });
        var inOrder = {};
        for (var i = 0; i < this.data.sessionOrder.length; i++) {
          inOrder[this.data.sessionOrder[i]] = true;
        }
        var missing = Object.keys(sessions).filter(function(id) {
          return !inOrder[id];
        });
        missing.sort(function(a, b) {
          if (sessions[a].isDefault) return -1;
          if (sessions[b].isDefault) return 1;
          return sessions[a].name.localeCompare(sessions[b].name);
        });
        for (var j = 0; j < missing.length; j++) {
          if (sessions[missing[j]].isDefault) {
            this.data.sessionOrder.unshift(missing[j]);
          } else {
            this.data.sessionOrder.push(missing[j]);
          }
        }
      };
      WorkspacePlusPlus2.prototype.clearSessionSwitchNotice = function() {
        if (!this.sessionSwitchNotice) return;
        this.sessionSwitchNotice.hide();
        this.sessionSwitchNotice = null;
      };
      WorkspacePlusPlus2.prototype.showSessionSwitchNotice = function(sessionName, options) {
        var self = this;
        var L = i18n2.L;
        options = options || {};
        var durationMs = typeof options.durationMs === "number" ? options.durationMs : SESSION_SWITCH_NOTICE_DURATION_MS;
        this.clearSessionSwitchNotice();
        var notice = new obsidian2.Notice(L.loaded(sessionName), durationMs);
        this.sessionSwitchNotice = notice;
        if (durationMs > 0) {
          setTimeout(function() {
            if (self.sessionSwitchNotice === notice) {
              self.sessionSwitchNotice = null;
            }
          }, durationMs + 50);
        }
        return notice;
      };
      WorkspacePlusPlus2.prototype.getOrderedSessionsUnfiltered = function() {
        var sessions = this.data.sessions;
        return this.data.sessionOrder.map(function(id) {
          return sessions[id];
        }).filter(function(s) {
          return !!s;
        });
      };
      WorkspacePlusPlus2.prototype.getOrderedSessionsForGroup = function(groupId) {
        var all = this.getOrderedSessionsUnfiltered();
        if (!this.isGroupFeatureEnabled()) return all;
        var targetGroupId = groupId || null;
        if (!targetGroupId) return all;
        var sessionGroups = this.data.sessionGroups || {};
        return all.filter(function(s) {
          var groups = sessionGroups[s.id];
          return groups && groups.indexOf(targetGroupId) !== -1;
        });
      };
      WorkspacePlusPlus2.prototype.getOrderedSessions = function() {
        if (!this.isGroupFeatureEnabled()) {
          return this.getOrderedSessionsUnfiltered();
        }
        return this.getOrderedSessionsForGroup(this.data.activeGroupId);
      };
      WorkspacePlusPlus2.prototype.mergeVisibleSessionOrder = function(visibleOrder) {
        var fullOrder = Array.isArray(this.data.sessionOrder) ? this.data.sessionOrder : [];
        var visible = Array.isArray(visibleOrder) ? visibleOrder : [];
        var visibleSet = {};
        for (var i = 0; i < visible.length; i++) {
          visibleSet[visible[i]] = true;
        }
        var visibleIdx = 0;
        var merged = [];
        for (var fi = 0; fi < fullOrder.length; fi++) {
          if (visibleSet[fullOrder[fi]]) {
            merged.push(visible[visibleIdx++]);
          } else {
            merged.push(fullOrder[fi]);
          }
        }
        while (visibleIdx < visible.length) {
          merged.push(visible[visibleIdx++]);
        }
        return merged;
      };
      WorkspacePlusPlus2.prototype.setSessionOrderFromVisible = function(visibleOrder, options) {
        var prev = Array.isArray(this.data.sessionOrder) ? this.data.sessionOrder : [];
        var merged = this.mergeVisibleSessionOrder(visibleOrder);
        var changed = prev.length !== merged.length;
        if (!changed) {
          for (var i = 0; i < prev.length; i++) {
            if (prev[i] !== merged[i]) {
              changed = true;
              break;
            }
          }
        }
        this.data.sessionOrder = merged;
        if (!(options && options.syncCommands === false)) {
          this.syncSessionCommands();
        }
        if (options && options.persist === false) return Promise.resolve(changed);
        if (!changed) return Promise.resolve(false);
        return this.persistData().then(function() {
          return true;
        });
      };
      WorkspacePlusPlus2.prototype.getSessionIndex = function(sessions, sessionId) {
        var idx = this.findSessionIndex(sessions, sessionId);
        return idx === -1 ? 0 : idx;
      };
      WorkspacePlusPlus2.prototype.findSessionIndex = function(sessions, sessionId) {
        if (!sessions || sessions.length === 0) return -1;
        for (var i = 0; i < sessions.length; i++) {
          if (sessions[i] && sessions[i].id === sessionId) {
            return i;
          }
        }
        return -1;
      };
      WorkspacePlusPlus2.prototype.findActiveSessionIndex = function(sessions) {
        return this.findSessionIndex(sessions, this.data.activeSessionId);
      };
      WorkspacePlusPlus2.prototype.getActiveSessionIndex = function(sessions) {
        return this.getSessionIndex(sessions, this.data.activeSessionId);
      };
      WorkspacePlusPlus2.prototype.syncSessionCommands = function() {
        var L = i18n2.L;
        var ordered = this.getOrderedSessions();
        var self = this;
        var oldIds = this._dynamicSessionCommandIds || [];
        for (var i = 0; i < oldIds.length; i++) {
          this.removeCommand(oldIds[i]);
        }
        this._dynamicSessionCommandIds = [];
        var dynamicStart;
        if (self.data.numberedSwitchCommands) {
          for (var n = 1; n <= 9; n++) {
            (function(num) {
              self.removeCommand("switch-to-" + num);
              var session = ordered[num - 1];
              self.addCommand({
                id: "switch-to-" + num,
                name: L.cmdSwitchTo(num, session ? session.name : void 0),
                checkCallback: function(checking) {
                  if (!self.data.showActiveSwitchCommand) {
                    var currentOrdered = self.getOrderedSessions();
                    var targetSession = currentOrdered[num - 1];
                    if (targetSession && targetSession.id === self.data.activeSessionId) return false;
                  }
                  if (!checking) self.switchToIndex(num - 1);
                  return true;
                }
              });
            })(n);
          }
          dynamicStart = 9;
        } else {
          for (var n = 1; n <= 9; n++) {
            self.removeCommand("switch-to-" + n);
          }
          dynamicStart = 0;
        }
        for (var j = dynamicStart; j < ordered.length; j++) {
          (function(session) {
            var cmdId = "switch-to-named-" + session.id;
            self.addCommand({
              id: cmdId,
              name: L.cmdSwitchToNamed(session.name),
              checkCallback: function(checking) {
                if (!self.data.showActiveSwitchCommand) {
                  if (session.id === self.data.activeSessionId) return false;
                }
                if (!checking) self.switchSessionByIdFromCommand(session.id);
                return true;
              }
            });
            self._dynamicSessionCommandIds.push(cmdId);
          })(ordered[j]);
        }
      };
      WorkspacePlusPlus2.prototype.getRelativeSwitchContext = function(offset) {
        var ordered = this.getOrderedSessions();
        if (ordered.length === 0) {
          return {
            ordered,
            currentIndex: -1,
            targetIndex: 0,
            isEmpty: true
          };
        }
        var currentIndex = this.findActiveSessionIndex(ordered);
        if (currentIndex === -1) return null;
        return {
          ordered,
          currentIndex,
          targetIndex: (currentIndex + offset + ordered.length) % ordered.length,
          isEmpty: false
        };
      };
      WorkspacePlusPlus2.prototype.switchSessionAtOrderedIndex = function(ordered, index, options) {
        options = options || {};
        if (!ordered || index < 0 || index >= ordered.length) {
          return Promise.resolve(false);
        }
        if (options.overlayMode === "preview") {
          this.showSwitchPreviewOverlay(ordered, index, options.viewGroupId);
        } else if (options.overlayMode === "feedback") {
          this.showSwitchFeedbackOverlay(ordered, index, options.viewGroupId, options.overlayOptions);
        }
        if (!ordered[index]) {
          return Promise.resolve(false);
        }
        if (ordered[index].id === this.data.activeSessionId) {
          if (options.noticeMode === "replace") {
            this.showSessionSwitchNotice(ordered[index].name, {
              durationMs: options.switchNoticeDurationMs
            });
          }
          return Promise.resolve(false);
        }
        return this.switchSession(ordered[index].id, {
          silent: options.silent !== false,
          switchNoticeMode: options.noticeMode,
          switchNoticeDurationMs: options.switchNoticeDurationMs
        });
      };
      WorkspacePlusPlus2.prototype.switchToIndex = function(index) {
        var ordered = this.getOrderedSessions();
        return this.switchSessionAtOrderedIndex(ordered, index, {
          overlayMode: "feedback",
          silent: true
        });
      };
      WorkspacePlusPlus2.prototype.switchSessionByIdFromCommand = function(sessionId) {
        var ordered = this.getOrderedSessions();
        var index = this.findSessionIndex(ordered, sessionId);
        return this.switchSessionAtOrderedIndex(ordered, index, {
          overlayMode: "feedback",
          silent: true
        });
      };
      WorkspacePlusPlus2.prototype.switchRelativeDirect = function(offset, options) {
        options = options || {};
        var context = this.getRelativeSwitchContext(offset);
        if (!context) return Promise.resolve(false);
        if (context.isEmpty) {
          if (options.overlayMode === "preview") {
            this.showSwitchPreviewOverlay(context.ordered, 0, options.viewGroupId);
          } else if (options.overlayMode === "feedback") {
            this.showSwitchFeedbackOverlay(context.ordered, 0, options.viewGroupId, options.overlayOptions);
          }
          return Promise.resolve(false);
        }
        return this.switchSessionAtOrderedIndex(context.ordered, context.targetIndex, options);
      };
      WorkspacePlusPlus2.prototype.switchRelativeFromCommand = function(offset) {
        var context = this.getRelativeSwitchContext(offset);
        if (!context) return Promise.resolve(false);
        if (context.isEmpty) {
          this.showSwitchPreviewOverlay(context.ordered, 0);
          return Promise.resolve(false);
        }
        var previewEnabled = offset > 0 ? this.data.previewNext : this.data.previewPrevious;
        if (previewEnabled && !this.switchOverlayEl) {
          this.showSwitchPreviewOverlay(context.ordered, context.currentIndex);
          return Promise.resolve(false);
        }
        return this.switchSessionAtOrderedIndex(context.ordered, context.targetIndex, {
          overlayMode: "preview",
          silent: true
        });
      };
      WorkspacePlusPlus2.prototype.switchRelativeFromStatusBar = function(offset) {
        return this.switchRelativeDirect(offset, {
          overlayMode: "none",
          noticeMode: "replace",
          silent: true
        });
      };
      WorkspacePlusPlus2.prototype.switchRelativeFromScroll = function(offset) {
        return this.switchRelativeDirect(offset, {
          overlayMode: "none",
          noticeMode: "replace",
          silent: true
        });
      };
      WorkspacePlusPlus2.prototype.switchRelative = function(offset) {
        return this.switchRelativeFromCommand(offset);
      };
      WorkspacePlusPlus2.prototype.switchRelativeImmediate = function(offset, options) {
        options = options || {};
        return this.switchRelativeDirect(offset, {
          overlayMode: options.showOverlay === false ? "none" : "feedback",
          overlayOptions: options.overlayOptions,
          silent: true
        });
      };
      WorkspacePlusPlus2.prototype.getActiveSession = function() {
        if (!this.data.activeSessionId) return null;
        return this.data.sessions[this.data.activeSessionId] || null;
      };
      WorkspacePlusPlus2.prototype.getCurrentWorkspaceLayout = function() {
        return this.app.workspace.getLayout();
      };
      WorkspacePlusPlus2.prototype.serializeLayout = function(layout) {
        try {
          return JSON.stringify(layout || null);
        } catch (e) {
          return "";
        }
      };
      WorkspacePlusPlus2.prototype.layoutsEqual = function(a, b) {
        return this.serializeLayout(a) === this.serializeLayout(b);
      };
      WorkspacePlusPlus2.prototype.layoutsEqualStructural = function(a, b) {
        try {
          var normalize = function(layout) {
            return JSON.stringify(layout || null).replace(/"(?:left|top|scroll)":-?\d+(?:\.\d+)?/g, '"_":0');
          };
          return normalize(a) === normalize(b);
        } catch (e) {
          return this.layoutsEqual(a, b);
        }
      };
      WorkspacePlusPlus2.prototype.isAutoSaveOnSwitchEnabled = function() {
        return this.data.autoSaveOnSwitch !== false;
      };
      WorkspacePlusPlus2.prototype.isWarnOnUnsavedSwitchEnabled = function() {
        return this.data.warnOnUnsavedSwitch !== false;
      };
      WorkspacePlusPlus2.prototype.isGroupFeatureEnabled = function() {
        return this.data.groupFeatureEnabled !== false;
      };
      WorkspacePlusPlus2.prototype.normalizeGroupFeatureState = function() {
        if (this.isGroupFeatureEnabled()) return;
        this.data.activeGroupId = null;
      };
      WorkspacePlusPlus2.prototype.setGroupFeatureEnabled = function(enabled) {
        var nextEnabled = enabled !== false;
        var changed = this.isGroupFeatureEnabled() !== nextEnabled;
        this.data.groupFeatureEnabled = nextEnabled;
        if (!nextEnabled && this.data.activeGroupId) {
          this.data.activeGroupId = null;
          changed = true;
        }
        if (!nextEnabled) {
          this.hideSwitchOverlay();
          this.hideSearchOverlay();
        }
        this.syncSessionCommands();
        this.updateStatusBar();
        if (!changed) return Promise.resolve(false);
        return this.persistData().then(function() {
          return true;
        });
      };
      WorkspacePlusPlus2.prototype.getDefaultSessionName = function() {
        return i18n2.L.defaultSessionName;
      };
      WorkspacePlusPlus2.prototype.getAutoSessionName = function(n) {
        return i18n2.L.sessionAutoName(n);
      };
      WorkspacePlusPlus2.prototype.isActiveSessionDirty = function() {
        var session = this.getActiveSession();
        if (!session) return false;
        return !this.layoutsEqual(session.layout, this.getCurrentWorkspaceLayout());
      };
      WorkspacePlusPlus2.prototype.setAutoSaveOnSwitch = function(enabled, options) {
        var L = i18n2.L;
        options = options || {};
        this.data.autoSaveOnSwitch = !!enabled;
        var isOn = this.isAutoSaveOnSwitchEnabled();
        if (isOn) {
          this.startHistorySnapshotTimer();
        } else {
          this.stopHistorySnapshotTimer();
        }
        return this.persistData().then(function() {
          if (options.notify) {
            new obsidian2.Notice(isOn ? L.autoSaveEnabled : L.autoSaveDisabled);
          }
          return isOn;
        });
      };
      WorkspacePlusPlus2.prototype.toggleAutoSaveOnSwitch = function(options) {
        var next = !this.isAutoSaveOnSwitchEnabled();
        return this.setAutoSaveOnSwitch(next, options || {});
      };
      WorkspacePlusPlus2.prototype.saveActiveSession = function(options) {
        var L = i18n2.L;
        options = options || {};
        var self = this;
        var session = this.getActiveSession();
        if (!session) {
          if (!options.silent) new obsidian2.Notice(L.noSession);
          return Promise.resolve(false);
        }
        if (!options.silent && session.isDefault && session.name === this.getDefaultSessionName()) {
          var doSave = function(name2, resolve) {
            session.name = name2;
            self.pushLayoutToHistory(session);
            session.layout = self.getCurrentWorkspaceLayout();
            session.modified = Date.now();
            self.updateStatusBar();
            self.syncSessionCommands();
            self.persistData().then(function() {
              new obsidian2.Notice(L.savedSession(name2));
              resolve(true);
            });
          };
          return new Promise(function(resolve) {
            new modals2.RenameModal(self.app, "", function(newName) {
              doSave(newName, resolve);
            }, {
              title: L.nameSessionTitle,
              placeholder: L.nameSessionPlaceholder,
              buttonText: L.saveInline,
              skipButtonText: L.saveWithoutNaming,
              onSkip: function() {
                doSave(session.name, resolve);
              }
            }).open();
          });
        }
        var currentLayout = this.getCurrentWorkspaceLayout();
        var changed = !this.layoutsEqualStructural(session.layout, currentLayout);
        this.pushLayoutToHistory(session);
        session.layout = currentLayout;
        if (changed || options.touchModified) {
          session.modified = Date.now();
        }
        this.updateStatusBar();
        var name = session.name;
        return this.persistData().then(function() {
          if (!options.silent) {
            if (changed) {
              new obsidian2.Notice(L.savedSession(name));
            } else {
              new obsidian2.Notice(L.noChanges);
            }
          }
          return changed;
        });
      };
      WorkspacePlusPlus2.prototype.overwriteSessionWithCurrentLayout = function(sessionId, options) {
        var L = i18n2.L;
        options = options || {};
        var session = this.data.sessions[sessionId];
        if (!session) {
          if (!options.silent) new obsidian2.Notice(L.noSession);
          return Promise.resolve(false);
        }
        var currentLayout = this.getCurrentWorkspaceLayout();
        var changed = !this.layoutsEqualStructural(session.layout, currentLayout);
        this.pushLayoutToHistory(session);
        session.layout = currentLayout;
        if (changed || options.touchModified) {
          session.modified = Date.now();
        }
        this.updateStatusBar();
        return this.persistData().then(function() {
          if (!options.silent) {
            if (changed) {
              new obsidian2.Notice(L.savedCurrentLayoutToSession(session.name));
            } else {
              new obsidian2.Notice(L.noChanges);
            }
          }
          return changed;
        });
      };
      WorkspacePlusPlus2.prototype.confirmOverwriteSessionWithCurrentLayout = function(sessionId, options) {
        var L = i18n2.L;
        options = options || {};
        var self = this;
        var session = this.data.sessions[sessionId];
        if (!session) {
          if (!options.silent) new obsidian2.Notice(L.noSession);
          return false;
        }
        new modals2.ConfirmModal(this.app, L.confirmOverwriteSessionWithCurrentLayout(session.name), function() {
          self.overwriteSessionWithCurrentLayout(sessionId, options).then(function(saved) {
            if (saved && typeof options.onSaved === "function") options.onSaved(session);
          });
        }, {
          confirmText: L.saveInline,
          confirmClass: "mod-cta"
        }).open();
        return true;
      };
      WorkspacePlusPlus2.prototype.reloadCurrentSessionWithoutSaving = function(options) {
        var L = i18n2.L;
        options = options || {};
        var session = this.getActiveSession();
        if (!session) {
          if (!options.silent) new obsidian2.Notice(L.noSession);
          return Promise.resolve(false);
        }
        var applyLayout = session.layout ? this.app.workspace.changeLayout(session.layout).catch(function() {
        }) : Promise.resolve();
        var name = session.name;
        return applyLayout.then(function() {
          if (!options.silent) {
            new obsidian2.Notice(L.reloadedSession(name));
          }
          return true;
        }).catch(function() {
          return false;
        });
      };
      WorkspacePlusPlus2.prototype.updateStatusBar = function() {
        var L = i18n2.L;
        var session = this.getActiveSession();
        this.statusBarEl.empty();
        var icon = this.statusBarEl.createSpan({ cls: "wpp-status-icon" });
        obsidian2.setIcon(icon, "panels-top-left");
        var activeGroup = this.getActiveGroup();
        if (activeGroup) {
          this.statusBarEl.createSpan({
            text: activeGroup.name,
            cls: "wpp-status-group"
          });
          this.statusBarEl.createSpan({
            text: " / ",
            cls: "wpp-status-separator"
          });
        }
        this.statusBarEl.createSpan({
          text: session ? session.name : L.noSession,
          cls: "wpp-status-name"
        });
      };
      WorkspacePlusPlus2.prototype.attachSessionToActiveGroup = function(sessionId) {
        if (!this.isGroupFeatureEnabled()) return;
        var activeGroupId = this.data.activeGroupId;
        if (!activeGroupId) return;
        if (!this.data.sessionGroups) this.data.sessionGroups = {};
        if (!Array.isArray(this.data.sessionGroups[sessionId])) {
          this.data.sessionGroups[sessionId] = [];
        }
        if (this.data.sessionGroups[sessionId].indexOf(activeGroupId) === -1) {
          this.data.sessionGroups[sessionId].push(activeGroupId);
        }
      };
      WorkspacePlusPlus2.prototype.insertSessionAndActivate = function(session) {
        this.data.sessions[session.id] = session;
        this.data.sessionOrder.push(session.id);
        this.data.activeSessionId = session.id;
        this.attachSessionToActiveGroup(session.id);
      };
      WorkspacePlusPlus2.prototype.captureActiveSessionLayoutIfAutoSave = function() {
        var current = this.getActiveSession();
        if (!current || !this.isAutoSaveOnSwitchEnabled()) return;
        this.pushLayoutToHistory(current);
        current.layout = this.getCurrentWorkspaceLayout();
        current.modified = Date.now();
      };
      WorkspacePlusPlus2.prototype.createSessionRecord = function(id, name, layout, options) {
        options = options || {};
        var record = {
          id,
          name,
          modified: typeof options.modified === "number" ? options.modified : Date.now(),
          layout
        };
        if (options.isDefault) {
          record.isDefault = true;
        }
        return record;
      };
      WorkspacePlusPlus2.prototype.createSession = function(name) {
        var id = utils2.generateId();
        var layout = this.getCurrentWorkspaceLayout();
        this.insertSessionAndActivate(this.createSessionRecord(id, name, layout));
        this.updateStatusBar();
        this.syncSessionCommands();
        return this.persistData();
      };
      WorkspacePlusPlus2.prototype.runSwitchRequest = function(request) {
        var self = this;
        this.isSwitchingSession = true;
        this.switchLockAt = Date.now();
        this.performSessionSwitch(request.targetId, request.options || {}).then(function(ok) {
          request.resolve(ok);
        }).catch(function() {
          request.resolve(false);
        }).then(function() {
          self.isSwitchingSession = false;
          self.switchLockAt = 0;
          if (!self.pendingSwitchRequest) return;
          var next = self.pendingSwitchRequest;
          self.pendingSwitchRequest = null;
          self.runSwitchRequest(next);
        });
      };
      WorkspacePlusPlus2.prototype.switchSession = function(targetId, options) {
        var self = this;
        options = options || {};
        var startupDelayMs = this.getStartupSettleRemainingMs();
        if (startupDelayMs > 0) {
          return new Promise(function(resolve) {
            setTimeout(function() {
              self.switchSession(targetId, options).then(resolve);
            }, startupDelayMs);
          });
        }
        if (this.isSwitchingSession) {
          var lockAt = this.switchLockAt || 0;
          var elapsed = lockAt ? Date.now() - lockAt : Number.MAX_SAFE_INTEGER;
          var hasBlockingUi = !!document.querySelector(".wpp-confirm-buttons") || !!document.querySelector(".wpp-switch-overlay");
          if (!hasBlockingUi && elapsed > 5e3) {
            this.isSwitchingSession = false;
            this.switchLockAt = 0;
            if (this.pendingSwitchRequest) {
              this.pendingSwitchRequest.resolve(false);
              this.pendingSwitchRequest = null;
            }
          }
        }
        if (!this.data.sessions[targetId]) return Promise.resolve(false);
        if (targetId === this.data.activeSessionId && !this.isSwitchingSession) {
          return Promise.resolve(false);
        }
        return new Promise(function(resolve) {
          var request = {
            targetId,
            options,
            resolve
          };
          if (self.isSwitchingSession) {
            if (self.pendingSwitchRequest) {
              self.pendingSwitchRequest.resolve(false);
            }
            self.pendingSwitchRequest = request;
            return;
          }
          self.runSwitchRequest(request);
        });
      };
      WorkspacePlusPlus2.prototype.performSessionSwitch = function(targetId, options) {
        var L = i18n2.L;
        var self = this;
        options = options || {};
        var target = this.data.sessions[targetId];
        if (!target) return Promise.resolve(false);
        if (target.id === this.data.activeSessionId) return Promise.resolve(false);
        var performSwitch = function(skipCurrentSave) {
          var current = self.getActiveSession();
          if (current && !skipCurrentSave) {
            self.pushLayoutToHistory(current);
            current.layout = self.getCurrentWorkspaceLayout();
            current.modified = Date.now();
          }
          self.data.activeSessionId = targetId;
          var applyLayout = target.layout ? self.app.workspace.changeLayout(target.layout).catch(function() {
          }) : Promise.resolve();
          return applyLayout.then(function() {
            self.updateStatusBar();
            return self.persistData();
          }).then(function() {
            if (options.switchNoticeMode === "replace") {
              self.showSessionSwitchNotice(target.name, {
                durationMs: options.switchNoticeDurationMs
              });
            } else if (!options.silent) {
              new obsidian2.Notice(L.loaded(target.name));
            }
            return true;
          });
        };
        var autoSaveOnSwitch = this.isAutoSaveOnSwitchEnabled();
        var shouldWarn = !autoSaveOnSwitch && !options.skipUnsavedWarning && this.isWarnOnUnsavedSwitchEnabled() && this.isActiveSessionDirty();
        if (shouldWarn) {
          return new Promise(function(resolve) {
            new modals2.UnsavedSwitchModal(
              self.app,
              L.confirmUnsavedSwitch(target.name),
              function() {
                self.saveActiveSession({ silent: true, touchModified: true }).then(function() {
                  return performSwitch(true);
                }).then(function(ok) {
                  resolve(ok);
                }).catch(function() {
                  resolve(false);
                });
              },
              function() {
                performSwitch(true).then(function(ok) {
                  resolve(ok);
                }).catch(function() {
                  resolve(false);
                });
              },
              function() {
                resolve(false);
              }
            ).open();
          });
        }
        return performSwitch(!autoSaveOnSwitch);
      };
      WorkspacePlusPlus2.prototype.deleteSession = function(sessionId) {
        var session = this.data.sessions[sessionId];
        if (!session || Object.keys(this.data.sessions).length <= 1) return Promise.resolve(false);
        var wasActive = this.data.activeSessionId === sessionId;
        var nextActiveId = null;
        delete this.data.sessions[sessionId];
        var orderIdx = this.data.sessionOrder.indexOf(sessionId);
        if (orderIdx !== -1) this.data.sessionOrder.splice(orderIdx, 1);
        if (this.data.sessionGroups && this.data.sessionGroups[sessionId]) {
          delete this.data.sessionGroups[sessionId];
        }
        if (wasActive) {
          var fallbackIdx = Math.min(orderIdx, this.data.sessionOrder.length - 1);
          var remaining = this.data.sessionOrder[fallbackIdx] || Object.keys(this.data.sessions)[0];
          nextActiveId = remaining || null;
          this.data.activeSessionId = nextActiveId;
        }
        var applyNextLayout = Promise.resolve();
        if (wasActive && nextActiveId) {
          var nextSession = this.data.sessions[nextActiveId];
          applyNextLayout = nextSession && nextSession.layout ? this.app.workspace.changeLayout(nextSession.layout).catch(function() {
          }) : Promise.resolve();
        }
        this.updateStatusBar();
        this.syncSessionCommands();
        var self = this;
        return applyNextLayout.then(function() {
          return self.persistData();
        }).then(function() {
          return true;
        });
      };
      WorkspacePlusPlus2.prototype.renameCurrentSession = function() {
        var L = i18n2.L;
        var self = this;
        var session = this.getActiveSession();
        if (!session) {
          new obsidian2.Notice(L.noSession);
          return;
        }
        new modals2.RenameModal(this.app, session.name, function(newName) {
          self.renameSessionById(session.id, newName);
        }, {
          emptyNotice: L.emptyName
        }).open();
      };
      WorkspacePlusPlus2.prototype.deleteCurrentSession = function() {
        var L = i18n2.L;
        var self = this;
        var session = this.getActiveSession();
        if (!session) {
          new obsidian2.Notice(L.noSession);
          return;
        }
        if (Object.keys(this.data.sessions).length <= 1) {
          new obsidian2.Notice(L.cannotDeleteLast);
          return;
        }
        var doDelete = function() {
          return self.deleteSession(session.id).then(function(deleted) {
            if (!deleted) return;
            new obsidian2.Notice(L.deleted(session.name));
          });
        };
        if (!this.data.confirmDeleteByHotkey) {
          doDelete();
          return;
        }
        new modals2.ConfirmModal(this.app, L.confirmDeleteActive(session.name), doDelete, {
          hint: L.confirmDeleteSettingsHint,
          onHintClick: function() {
            self.app.setting.open();
            self.app.setting.openTabById(self.manifest.id);
          }
        }).open();
      };
      WorkspacePlusPlus2.prototype.deleteAllInactiveSessions = function() {
        var self = this;
        var activeId = this.data.activeSessionId;
        var ids = Object.keys(this.data.sessions || {}).filter(function(id) {
          return id !== activeId;
        });
        var promises = ids.map(function(id) {
          return self.deleteSession(id);
        });
        return Promise.all(promises).then(function(results) {
          var deletedCount = 0;
          for (var i = 0; i < results.length; i++) {
            if (results[i]) deletedCount++;
          }
          return deletedCount;
        });
      };
      WorkspacePlusPlus2.prototype.getNextSessionName = function() {
        var sessions = this.data.sessions;
        var existing = {};
        var keys = Object.keys(sessions);
        for (var i = 0; i < keys.length; i++) {
          existing[sessions[keys[i]].name] = true;
        }
        var n = 1;
        while (existing[this.getAutoSessionName(n)]) {
          n++;
        }
        return this.getAutoSessionName(n);
      };
      WorkspacePlusPlus2.prototype.resetSessionsToDefault = function() {
        var id = utils2.generateId();
        this.hideSwitchOverlay();
        this.data.sessions = {};
        this.data.sessionOrder = [];
        this.data.activeSessionId = null;
        this.data.groups = {};
        this.data.groupOrder = [];
        this.data.sessionGroups = {};
        this.data.activeGroupId = null;
        this.data.sessions[id] = this.createSessionRecord(
          id,
          this.getDefaultSessionName(),
          this.getCurrentWorkspaceLayout(),
          { isDefault: true }
        );
        this.data.sessionOrder.push(id);
        this.data.activeSessionId = id;
        this.updateStatusBar();
        this.syncSessionCommands();
        return this.persistData();
      };
      WorkspacePlusPlus2.prototype.createEmptySession = function() {
        var L = i18n2.L;
        var name = this.getNextSessionName();
        this.captureActiveSessionLayoutIfAutoSave();
        var id = utils2.generateId();
        var session = this.createSessionRecord(id, name, null);
        this.insertSessionAndActivate(session);
        var leaves = [];
        this.app.workspace.iterateRootLeaves(function(leaf) {
          leaves.push(leaf);
        });
        for (var i = 0; i < leaves.length; i++) {
          leaves[i].detach();
        }
        session.layout = this.getCurrentWorkspaceLayout();
        this.updateStatusBar();
        this.syncSessionCommands();
        new obsidian2.Notice(L.created(name));
        return this.persistData();
      };
      WorkspacePlusPlus2.prototype.duplicateCurrentSession = function() {
        var L = i18n2.L;
        var name = this.getNextSessionName();
        this.captureActiveSessionLayoutIfAutoSave();
        var id = utils2.generateId();
        this.insertSessionAndActivate(this.createSessionRecord(id, name, this.getCurrentWorkspaceLayout()));
        this.updateStatusBar();
        this.syncSessionCommands();
        new obsidian2.Notice(L.duplicated(name));
        return this.persistData();
      };
      WorkspacePlusPlus2.prototype.saveAsSession = function() {
        var L = i18n2.L;
        var self = this;
        var session = this.getActiveSession();
        if (!session) {
          new obsidian2.Notice(L.noSession);
          return Promise.resolve(false);
        }
        return new Promise(function(resolve) {
          new modals2.RenameModal(self.app, "", function(newName) {
            self.captureActiveSessionLayoutIfAutoSave();
            var layout = self.getCurrentWorkspaceLayout();
            var existing = null;
            var allSessions = self.getOrderedSessionsUnfiltered();
            for (var i = 0; i < allSessions.length; i++) {
              if (allSessions[i].name === newName) {
                existing = allSessions[i];
                break;
              }
            }
            if (existing) {
              existing.layout = layout;
              existing.modified = Date.now();
              self.data.activeSessionId = existing.id;
            } else {
              var id = utils2.generateId();
              self.insertSessionAndActivate(
                self.createSessionRecord(id, newName, layout)
              );
            }
            self.updateStatusBar();
            self.syncSessionCommands();
            new obsidian2.Notice(L.savedAs(newName));
            self.persistData().then(function() {
              resolve(true);
            });
          }, {
            title: L.nameSessionTitle,
            placeholder: L.nameSessionPlaceholder,
            buttonText: L.saveInline,
            emptyNotice: L.emptyName
          }).open();
        });
      };
      WorkspacePlusPlus2.prototype.duplicateSession = function(sessionId) {
        var L = i18n2.L;
        var source = this.data.sessions[sessionId];
        if (!source) return Promise.resolve();
        var name = this.getNextSessionName();
        var newId = utils2.generateId();
        this.data.sessions[newId] = this.createSessionRecord(
          newId,
          name,
          JSON.parse(JSON.stringify(source.layout))
        );
        this.data.sessionOrder.push(newId);
        var groups = (this.data.sessionGroups || {})[sessionId];
        if (groups && groups.length > 0) {
          if (!this.data.sessionGroups) this.data.sessionGroups = {};
          this.data.sessionGroups[newId] = groups.slice();
        }
        this.syncSessionCommands();
        new obsidian2.Notice(L.duplicated(name));
        return this.persistData();
      };
      WorkspacePlusPlus2.prototype.ensureDefaultSession = function() {
        var hasDefault = Object.values(this.data.sessions).some(function(s) {
          return s.isDefault;
        });
        if (hasDefault) return;
        var id = utils2.generateId();
        this.data.sessions[id] = this.createSessionRecord(
          id,
          this.getDefaultSessionName(),
          this.getCurrentWorkspaceLayout(),
          { isDefault: true }
        );
        this.data.sessionOrder.unshift(id);
        this.data.activeSessionId = id;
        this.updateStatusBar();
        this.syncSessionCommands();
        this.persistData();
      };
      WorkspacePlusPlus2.prototype.setStartupSettleDeadline = function(deadlineMs) {
        var self = this;
        var nextDeadline = typeof deadlineMs === "number" ? deadlineMs : 0;
        if (this.startupSettleTimer) {
          clearTimeout(this.startupSettleTimer);
          this.startupSettleTimer = null;
        }
        if (nextDeadline <= Date.now()) {
          this.startupSettleStartedAt = 0;
          this.startupSettleUntil = 0;
          return 0;
        }
        this.startupSettleUntil = nextDeadline;
        this.startupSettleTimer = setTimeout(function() {
          self.startupSettleStartedAt = 0;
          self.startupSettleUntil = 0;
          self.startupSettleTimer = null;
        }, nextDeadline - Date.now());
        return this.startupSettleUntil;
      };
      WorkspacePlusPlus2.prototype.startStartupSettleWindow = function(durationMs) {
        var startedAt = Date.now();
        var duration = typeof durationMs === "number" && durationMs > 0 ? durationMs : STARTUP_SETTLE_MS;
        this.startupSettleStartedAt = startedAt;
        return this.setStartupSettleDeadline(startedAt + duration);
      };
      WorkspacePlusPlus2.prototype.getStartupSettleRemainingMs = function() {
        var remaining = (this.startupSettleUntil || 0) - Date.now();
        return remaining > 0 ? remaining : 0;
      };
      WorkspacePlusPlus2.prototype.isStartupSettling = function() {
        return this.getStartupSettleRemainingMs() > 0;
      };
      WorkspacePlusPlus2.prototype.noteStartupLayoutChange = function() {
        if (!this.isStartupSettling()) return;
        var startedAt = this.startupSettleStartedAt || Date.now();
        var maxDeadline = startedAt + STARTUP_SETTLE_MAX_MS;
        var nextDeadline = Math.min(maxDeadline, Date.now() + STARTUP_LAYOUT_CHANGE_SETTLE_MS);
        if (nextDeadline <= (this.startupSettleUntil || 0)) return;
        this.setStartupSettleDeadline(nextDeadline);
        this.scheduleStartupFlush();
      };
      WorkspacePlusPlus2.prototype.scheduleStartupFlush = function() {
        var self = this;
        if (this.startupFlushTimer) {
          clearTimeout(this.startupFlushTimer);
          this.startupFlushTimer = null;
        }
        if (!this.isAutoSaveOnSwitchEnabled()) return Promise.resolve(false);
        var delayMs = this.getStartupSettleRemainingMs();
        if (delayMs <= 0) {
          return Promise.resolve(this.flushOnStartup());
        }
        return new Promise(function(resolve) {
          self.startupFlushTimer = setTimeout(function() {
            self.startupFlushTimer = null;
            resolve(self.flushOnStartup());
          }, delayMs);
        });
      };
      WorkspacePlusPlus2.prototype.flushOnStartup = function() {
        if (!this.isAutoSaveOnSwitchEnabled()) return;
        var session = this.getActiveSession();
        if (!session) return;
        this.pushLayoutToHistory(session);
        session.layout = this.getCurrentWorkspaceLayout();
        session.modified = Date.now();
        return this.persistData();
      };
      WorkspacePlusPlus2.prototype.getOrderedGroups = function() {
        if (!this.isGroupFeatureEnabled()) return [];
        var groups = this.data.groups || {};
        return (this.data.groupOrder || []).map(function(id) {
          return groups[id];
        }).filter(function(g) {
          return !!g;
        });
      };
      WorkspacePlusPlus2.prototype.normalizeGroupTabOrder = function(order) {
        var groups = this.data.groups || {};
        var input = Array.isArray(order) ? order : [];
        var seen = {};
        var out = [];
        var i;
        for (i = 0; i < input.length; i++) {
          var gid = input[i];
          if (gid !== "__all__" && !groups[gid]) continue;
          if (seen[gid]) continue;
          seen[gid] = true;
          out.push(gid);
        }
        if (!seen.__all__) {
          out.unshift("__all__");
          seen.__all__ = true;
        }
        var existingIds = Object.keys(groups);
        for (i = 0; i < existingIds.length; i++) {
          if (seen[existingIds[i]]) continue;
          seen[existingIds[i]] = true;
          out.push(existingIds[i]);
        }
        return out;
      };
      WorkspacePlusPlus2.prototype.getOrderedGroupTabIds = function() {
        if (!this.isGroupFeatureEnabled()) return [];
        this.data.groupOrder = this.normalizeGroupTabOrder(this.data.groupOrder);
        return this.data.groupOrder.slice();
      };
      WorkspacePlusPlus2.prototype.setGroupTabOrder = function(order, options) {
        if (!this.isGroupFeatureEnabled()) return Promise.resolve(false);
        var prev = Array.isArray(this.data.groupOrder) ? this.data.groupOrder : [];
        var normalized = this.normalizeGroupTabOrder(order);
        var changed = prev.length !== normalized.length;
        if (!changed) {
          for (var i = 0; i < prev.length; i++) {
            if (prev[i] !== normalized[i]) {
              changed = true;
              break;
            }
          }
        }
        this.data.groupOrder = normalized;
        if (options && options.persist === false) return Promise.resolve(changed);
        if (!changed) return Promise.resolve(false);
        return this.persistData().then(function() {
          return true;
        });
      };
      WorkspacePlusPlus2.prototype.getActiveGroup = function() {
        if (!this.isGroupFeatureEnabled()) return null;
        if (!this.data.activeGroupId) return null;
        return (this.data.groups || {})[this.data.activeGroupId] || null;
      };
      WorkspacePlusPlus2.prototype.createGroup = function(name) {
        var L = i18n2.L;
        var id = utils2.generateId();
        if (!this.data.groups) this.data.groups = {};
        this.data.groups[id] = { id, name };
        var nextOrder = Array.isArray(this.data.groupOrder) ? this.data.groupOrder.slice() : [];
        nextOrder.push(id);
        this.data.groupOrder = this.normalizeGroupTabOrder(nextOrder);
        new obsidian2.Notice(L.groupCreated(name));
        return this.persistData().then(function() {
          return id;
        });
      };
      WorkspacePlusPlus2.prototype.deleteGroup = function(groupId) {
        var L = i18n2.L;
        if (!this.data.groups || !this.data.groups[groupId]) return Promise.resolve(false);
        var name = this.data.groups[groupId].name;
        delete this.data.groups[groupId];
        var nextOrder = (this.data.groupOrder || []).filter(function(gid) {
          return gid !== groupId;
        });
        this.data.groupOrder = this.normalizeGroupTabOrder(nextOrder);
        this.removeGroupMembershipFromAllSessions(groupId, { persist: false });
        if (this.data.activeGroupId === groupId) {
          this.data.activeGroupId = null;
        }
        this.updateStatusBar();
        this.syncSessionCommands();
        new obsidian2.Notice(L.groupDeleted(name));
        return this.persistData().then(function() {
          return true;
        });
      };
      WorkspacePlusPlus2.prototype.renameGroup = function(groupId, newName) {
        var L = i18n2.L;
        if (!this.data.groups || !this.data.groups[groupId]) return Promise.resolve(false);
        var oldName = this.data.groups[groupId].name;
        this.data.groups[groupId].name = newName;
        this.updateStatusBar();
        new obsidian2.Notice(L.groupRenamed(oldName, newName));
        return this.persistData().then(function() {
          return true;
        });
      };
      WorkspacePlusPlus2.prototype.setActiveGroup = function(groupId) {
        if (!this.isGroupFeatureEnabled()) return Promise.resolve(false);
        var nextGroupId = groupId || null;
        if (nextGroupId && (!this.data.groups || !this.data.groups[nextGroupId])) return Promise.resolve(false);
        var self = this;
        var commitGroup = function() {
          self.data.activeGroupId = nextGroupId;
          self.syncSessionCommands();
          self.updateStatusBar();
          return self.persistData().then(function() {
            return true;
          });
        };
        if (!nextGroupId) {
          return commitGroup();
        }
        var sessionGroups = this.data.sessionGroups || {};
        var targetSessions = this.getOrderedSessionsUnfiltered().filter(function(s) {
          var groups = sessionGroups[s.id];
          return groups && groups.indexOf(nextGroupId) !== -1;
        });
        if (targetSessions.length === 0) {
          return Promise.resolve(false);
        }
        var activeId = this.data.activeSessionId;
        var isInTarget = targetSessions.some(function(s) {
          return s.id === activeId;
        });
        if (isInTarget) {
          return commitGroup();
        }
        return this.switchSession(targetSessions[0].id).then(function(switched) {
          if (!switched) return false;
          return commitGroup();
        });
      };
      WorkspacePlusPlus2.prototype.exitGroup = function() {
        return this.setActiveGroup(null);
      };
      WorkspacePlusPlus2.prototype.getRelativeGroupId = function(baseGroupId, offset) {
        if (!this.isGroupFeatureEnabled()) return void 0;
        var ordered = this.getOrderedGroups();
        if (ordered.length === 0) return void 0;
        var currentId = baseGroupId || null;
        if (!currentId) {
          var edgeIdx = offset > 0 ? 0 : ordered.length - 1;
          return ordered[edgeIdx].id;
        }
        var currentIdx = -1;
        for (var i = 0; i < ordered.length; i++) {
          if (ordered[i].id === currentId) {
            currentIdx = i;
            break;
          }
        }
        if (currentIdx === -1) return ordered[0].id;
        var nextIdx = currentIdx + offset;
        if (nextIdx < 0 || nextIdx >= ordered.length) return null;
        return ordered[nextIdx].id;
      };
      WorkspacePlusPlus2.prototype.resolveGroupSelection = function(groupId) {
        if (!this.isGroupFeatureEnabled()) {
          return Promise.resolve({
            switched: false,
            targetGroupId: null,
            resolvedGroupId: null,
            sessions: this.getOrderedSessionsUnfiltered()
          });
        }
        var targetGroupId = groupId || null;
        var targetSessions = this.getOrderedSessionsForGroup(targetGroupId);
        var self = this;
        return this.setActiveGroup(targetGroupId).then(function(switched) {
          var resolvedGroupId;
          if (switched) {
            resolvedGroupId = self.data.activeGroupId || null;
          } else if (targetSessions.length === 0) {
            resolvedGroupId = targetGroupId;
          } else {
            resolvedGroupId = self.data.activeGroupId || null;
          }
          return {
            switched,
            targetGroupId,
            resolvedGroupId,
            sessions: self.getOrderedSessionsForGroup(resolvedGroupId)
          };
        });
      };
      WorkspacePlusPlus2.prototype.switchGroupRelative = function(offset) {
        if (!this.isGroupFeatureEnabled()) return Promise.resolve(false);
        var targetGroupId = this.getRelativeGroupId(this.data.activeGroupId, offset);
        if (typeof targetGroupId === "undefined") return Promise.resolve(false);
        return this.setActiveGroup(targetGroupId);
      };
      WorkspacePlusPlus2.prototype.removeGroupMembershipFromAllSessions = function(groupId, options) {
        if (!groupId) return Promise.resolve(false);
        var sg = this.data.sessionGroups || {};
        var keys = Object.keys(sg);
        var changed = false;
        for (var i = 0; i < keys.length; i++) {
          var arr = sg[keys[i]];
          var idx = arr.indexOf(groupId);
          if (idx !== -1) {
            arr.splice(idx, 1);
            changed = true;
            if (arr.length === 0) delete sg[keys[i]];
          }
        }
        if (!changed) return Promise.resolve(false);
        this.syncSessionCommands();
        if (options && options.persist === false) return Promise.resolve(true);
        return this.persistData().then(function() {
          return true;
        });
      };
      WorkspacePlusPlus2.prototype.removeAllSessionsFromGroup = function(groupId, options) {
        if (!groupId) return Promise.resolve(false);
        var groups = this.data.groups || {};
        if (!groups[groupId]) return Promise.resolve(false);
        return this.removeGroupMembershipFromAllSessions(groupId, options);
      };
      WorkspacePlusPlus2.prototype.moveSessionToGroupExclusive = function(sessionId, groupId, options) {
        if (!this.data.sessions[sessionId]) return Promise.resolve(false);
        if (!this.data.groups || !this.data.groups[groupId]) return Promise.resolve(false);
        if (!this.data.sessionGroups) this.data.sessionGroups = {};
        var prev = this.data.sessionGroups[sessionId] || [];
        var changed = prev.length !== 1 || prev[0] !== groupId;
        if (!changed) return Promise.resolve(false);
        this.data.sessionGroups[sessionId] = [groupId];
        this.syncSessionCommands();
        if (options && options.persist === false) return Promise.resolve(true);
        return this.persistData().then(function() {
          return true;
        });
      };
      WorkspacePlusPlus2.prototype.clearAllGroups = function(options) {
        var groupCount = Object.keys(this.data.groups || {}).length;
        var sessionGroupCount = Object.keys(this.data.sessionGroups || {}).length;
        var hasActiveGroup = !!this.data.activeGroupId;
        var hadCustomOrder = Array.isArray(this.data.groupOrder) ? this.data.groupOrder.some(function(id) {
          return id !== "__all__";
        }) : false;
        var changed = groupCount > 0 || sessionGroupCount > 0 || hasActiveGroup || hadCustomOrder;
        this.data.sessionGroups = {};
        this.data.groups = {};
        this.data.groupOrder = this.normalizeGroupTabOrder([]);
        this.data.activeGroupId = null;
        this.syncSessionCommands();
        this.updateStatusBar();
        if (!changed) return Promise.resolve(false);
        if (options && options.persist === false) return Promise.resolve(true);
        return this.persistData().then(function() {
          return true;
        });
      };
      WorkspacePlusPlus2.prototype.addSessionToGroup = function(sessionId, groupId) {
        if (!this.data.sessions[sessionId]) return Promise.resolve(false);
        if (!this.data.groups || !this.data.groups[groupId]) return Promise.resolve(false);
        if (!this.data.sessionGroups) this.data.sessionGroups = {};
        if (!this.data.sessionGroups[sessionId]) this.data.sessionGroups[sessionId] = [];
        if (this.data.sessionGroups[sessionId].indexOf(groupId) !== -1) return Promise.resolve(false);
        this.data.sessionGroups[sessionId].push(groupId);
        this.syncSessionCommands();
        return this.persistData().then(function() {
          return true;
        });
      };
      WorkspacePlusPlus2.prototype.removeSessionFromGroup = function(sessionId, groupId) {
        if (!this.data.sessionGroups || !this.data.sessionGroups[sessionId]) return Promise.resolve(false);
        var arr = this.data.sessionGroups[sessionId];
        var idx = arr.indexOf(groupId);
        if (idx === -1) return Promise.resolve(false);
        arr.splice(idx, 1);
        if (arr.length === 0) delete this.data.sessionGroups[sessionId];
        this.syncSessionCommands();
        return this.persistData().then(function() {
          return true;
        });
      };
      WorkspacePlusPlus2.prototype.getGroupSessionIds = function(groupId) {
        var sg = this.data.sessionGroups || {};
        var result = [];
        var keys = Object.keys(sg);
        for (var i = 0; i < keys.length; i++) {
          if (sg[keys[i]].indexOf(groupId) !== -1) result.push(keys[i]);
        }
        return result;
      };
    }
    module2.exports = attachSessionMethods2;
  }
});

// src/plugin/methods/history.js
var require_history = __commonJS({
  "src/plugin/methods/history.js"(exports2, module2) {
    "use strict";
    var obsidian2 = require("obsidian");
    var i18n2 = require_i18n();
    var HOUR = 36e5;
    var DAY = 864e5;
    var WEEK = 7 * DAY;
    var MAX_HISTORY = 45;
    function attachHistoryMethods2(WorkspacePlusPlus2) {
      WorkspacePlusPlus2.prototype.isVersionHistoryEnabled = function() {
        return !!this.data.versionHistoryEnabled;
      };
      WorkspacePlusPlus2.prototype.getVersionHistorySnapshotInterval = function() {
        var val = this.data.versionHistorySnapshotInterval;
        if (typeof val !== "number" || val < 1) return 5;
        return val;
      };
      WorkspacePlusPlus2.prototype.isVersionHistoryCtrlRmbEnabled = function() {
        return this.data.versionHistoryCtrlRmbRestore !== false;
      };
      WorkspacePlusPlus2.prototype.isVersionHistoryConfirmRestoreEnabled = function() {
        return this.data.versionHistoryConfirmRestore !== false;
      };
      WorkspacePlusPlus2.prototype.extractFilePathsFromLayout = function(layout) {
        var paths = [];
        function walk(node) {
          if (!node || typeof node !== "object") return;
          if (node.type === "leaf" && node.state && node.state.state && node.state.state.file) {
            paths.push(node.state.state.file);
          }
          if (Array.isArray(node.children)) {
            for (var i = 0; i < node.children.length; i++) {
              walk(node.children[i]);
            }
          }
          if (node.main) walk(node.main);
          if (node.left) walk(node.left);
          if (node.right) walk(node.right);
        }
        walk(layout);
        return paths;
      };
      WorkspacePlusPlus2.prototype.countPanesInLayout = function(layout) {
        var count = 0;
        function walk(node) {
          if (!node || typeof node !== "object") return;
          if (node.type === "leaf") {
            count++;
            return;
          }
          if (Array.isArray(node.children)) {
            for (var i = 0; i < node.children.length; i++) {
              walk(node.children[i]);
            }
          }
          if (node.main) walk(node.main);
        }
        if (layout && layout.main) walk(layout.main);
        return count;
      };
      WorkspacePlusPlus2.prototype.compactHistory = function(history) {
        if (!history || history.length === 0) return [];
        var now = Date.now();
        history.sort(function(a, b) {
          return b.savedAt - a.savedAt;
        });
        var result = [];
        var buckets = {};
        for (var i = 0; i < history.length; i++) {
          var entry = history[i];
          var age = now - entry.savedAt;
          var key;
          if (age <= HOUR) {
            result.push(entry);
          } else if (age <= DAY) {
            key = "h" + Math.floor(age / HOUR);
            if (!buckets[key]) {
              buckets[key] = true;
              result.push(entry);
            }
          } else if (age <= WEEK) {
            key = "d" + Math.floor(age / DAY);
            if (!buckets[key]) {
              buckets[key] = true;
              result.push(entry);
            }
          } else if (age <= 30 * DAY) {
            key = "w" + Math.floor(age / WEEK);
            if (!buckets[key]) {
              buckets[key] = true;
              result.push(entry);
            }
          }
        }
        if (result.length > MAX_HISTORY) result.length = MAX_HISTORY;
        return result;
      };
      WorkspacePlusPlus2.prototype.pushLayoutToHistory = function(session) {
        if (!this.isVersionHistoryEnabled()) return;
        if (!session || !session.layout) return;
        if (!session.history) session.history = [];
        var lastEntry = session.history.length > 0 ? session.history[0] : null;
        if (lastEntry && this.layoutsEqualStructural(session.layout, lastEntry.layout)) {
          return;
        }
        session.history.unshift({
          layout: JSON.parse(JSON.stringify(session.layout)),
          savedAt: Date.now()
        });
        session.history = this.compactHistory(session.history);
      };
      WorkspacePlusPlus2.prototype.restoreFromHistoryEntry = function(sessionId, entryIndex) {
        var session = this.data.sessions[sessionId];
        if (!session || !session.history || !session.history[entryIndex]) {
          return Promise.resolve(false);
        }
        var entry = session.history[entryIndex];
        this.pushLayoutToHistory(session);
        session.layout = JSON.parse(JSON.stringify(entry.layout));
        session.modified = Date.now();
        var self = this;
        var isActive = session.id === this.data.activeSessionId;
        var applyLayout = isActive && session.layout ? this.app.workspace.changeLayout(session.layout).catch(function() {
        }) : Promise.resolve();
        return applyLayout.then(function() {
          self.updateStatusBar();
          return self.persistData();
        }).then(function() {
          return true;
        });
      };
      WorkspacePlusPlus2.prototype.quickRestoreLatestHistory = function() {
        var L = i18n2.L;
        var session = this.getActiveSession();
        if (!session || !session.history || session.history.length === 0) {
          new obsidian2.Notice(L.historyNoEntries);
          return Promise.resolve(false);
        }
        var self = this;
        return this.restoreFromHistoryEntry(session.id, 0).then(function(ok) {
          if (ok) {
            new obsidian2.Notice(L.historyQuickRestored(session.name));
          }
          return ok;
        });
      };
      WorkspacePlusPlus2.prototype.startHistorySnapshotTimer = function() {
        this.stopHistorySnapshotTimer();
        if (!this.isVersionHistoryEnabled()) return;
        if (!this.isAutoSaveOnSwitchEnabled()) return;
        var self = this;
        var intervalMs = this.getVersionHistorySnapshotInterval() * 6e4;
        this._historySnapshotTimer = setInterval(function() {
          if (!self.isVersionHistoryEnabled() || !self.isAutoSaveOnSwitchEnabled()) {
            self.stopHistorySnapshotTimer();
            return;
          }
          var session = self.getActiveSession();
          if (!session) return;
          var currentLayout = self.getCurrentWorkspaceLayout();
          if (self.layoutsEqualStructural(session.layout, currentLayout)) return;
          self.pushLayoutToHistory(session);
          session.layout = currentLayout;
          session.modified = Date.now();
          self.persistData();
        }, intervalMs);
      };
      WorkspacePlusPlus2.prototype.stopHistorySnapshotTimer = function() {
        if (this._historySnapshotTimer) {
          clearInterval(this._historySnapshotTimer);
          this._historySnapshotTimer = null;
        }
      };
    }
    module2.exports = attachHistoryMethods2;
  }
});

// src/plugin/methods/frontmatter.js
var require_frontmatter = __commonJS({
  "src/plugin/methods/frontmatter.js"(exports2, module2) {
    "use strict";
    var obsidian2 = require("obsidian");
    var i18n2 = require_i18n();
    module2.exports = function attachFrontmatterMethods2(WorkspacePlusPlus2) {
      WorkspacePlusPlus2.prototype.getFileFrontmatter = function(file) {
        if (!file) return null;
        var cache = this.app.metadataCache.getFileCache(file);
        return cache && cache.frontmatter || null;
      };
      WorkspacePlusPlus2.prototype.parseWorkspaceSessionValue = function(value) {
        if (!value || typeof value !== "string") return null;
        value = value.trim();
        if (!value) return null;
        var slashIndex = value.indexOf("/");
        if (slashIndex === -1) {
          return { groupName: null, sessionName: value };
        }
        var candidateGroup = value.substring(0, slashIndex).trim();
        var candidateSession = value.substring(slashIndex + 1).trim();
        if (!candidateGroup || !candidateSession) {
          return { groupName: null, sessionName: value };
        }
        var groups = this.data.groups || {};
        var groupKeys = Object.keys(groups);
        var matchedGroup = null;
        for (var i = 0; i < groupKeys.length; i++) {
          if (groups[groupKeys[i]].name === candidateGroup) {
            matchedGroup = groups[groupKeys[i]];
            break;
          }
        }
        if (matchedGroup) {
          return { groupName: candidateGroup, groupId: matchedGroup.id, sessionName: candidateSession };
        }
        return { groupName: null, sessionName: value };
      };
      WorkspacePlusPlus2.prototype.findSessionByName = function(name) {
        if (!name) return null;
        var sessions = this.data.sessions || {};
        var keys = Object.keys(sessions);
        for (var i = 0; i < keys.length; i++) {
          if (sessions[keys[i]].name === name) {
            return sessions[keys[i]];
          }
        }
        return null;
      };
      WorkspacePlusPlus2.prototype.handleWorkspaceSessionProperty = function(value) {
        var L = i18n2.L;
        var parsed = this.parseWorkspaceSessionValue(value);
        if (!parsed) return;
        var session = this.findSessionByName(parsed.sessionName);
        if (!session) {
          new obsidian2.Notice(L.frontmatterSessionNotFound(parsed.sessionName));
          return;
        }
        var alreadyOnSession = session.id === this.data.activeSessionId;
        var alreadyOnGroup = !parsed.groupId || this.data.activeGroupId === parsed.groupId;
        if (alreadyOnSession && alreadyOnGroup) {
          new obsidian2.Notice(L.frontmatterAlreadyActive(parsed.sessionName));
          return;
        }
        var self = this;
        if (parsed.groupId && this.isGroupFeatureEnabled() && !alreadyOnGroup) {
          this.setActiveGroup(parsed.groupId).then(function() {
            if (session.id !== self.data.activeSessionId) {
              self.switchSession(session.id);
            }
          });
        } else if (!alreadyOnSession) {
          this.switchSession(session.id);
        }
      };
      WorkspacePlusPlus2.prototype.handleFrontmatterTriggers = function(file) {
        var fm = this.getFileFrontmatter(file);
        if (!fm) return;
        if (fm["workspace-session"]) {
          this.handleWorkspaceSessionProperty(fm["workspace-session"]);
        }
      };
      WorkspacePlusPlus2.prototype.registerFrontmatterListeners = function() {
        var self = this;
        this.registerEvent(this.app.workspace.on("active-leaf-change", function(leaf) {
          if (self.isSwitchingSession) return;
          if (self.getStartupSettleRemainingMs() > 0) return;
          if (!leaf || !leaf.view || !leaf.view.file) return;
          self.handleFrontmatterTriggers(leaf.view.file);
        }));
      };
    };
  }
});

// src/main.js
var obsidian = require("obsidian");
var i18n = require_i18n();
var modals = require_modals2();
var settings = require_settings();
var DEFAULT_DATA = require_default_data();
var registerCommands = require_register_commands();
var attachHotkeyMethods = require_hotkeys();
var attachOverlayMethods = require_overlays();
var attachPersistenceMethods = require_persistence();
var attachSessionMethods = require_sessions();
var attachHistoryMethods = require_history();
var attachFrontmatterMethods = require_frontmatter();
var utils = require_utils();
var statusBarActions = require_statusbar_actions();
i18n.resolveLocale();
var STATUS_BAR_SCROLL_PRESETS = {
  trackpad: {
    threshold: 30,
    cooldownMs: 500,
    resetMs: 250
  },
  notchedWheel: {
    threshold: 16,
    cooldownMs: 350,
    resetMs: 220
  },
  freeSpinWheel: {
    threshold: 48,
    cooldownMs: 650,
    resetMs: 320
  }
};
function getStatusBarScrollConfig(data) {
  var presetId = data && data.statusBarScrollPreset || "trackpad";
  if (presetId === "custom") {
    return {
      threshold: Number(data && data.statusBarScrollThreshold || 30) || 30,
      cooldownMs: Number(data && data.statusBarScrollCooldownMs || 500) || 500,
      resetMs: Number(data && data.statusBarScrollResetMs || 250) || 250
    };
  }
  return STATUS_BAR_SCROLL_PRESETS[presetId] || STATUS_BAR_SCROLL_PRESETS.trackpad;
}
function matchesStatusBarScrollModifier(evt, isMac, mode) {
  mode = mode || "none";
  var modPressed = isMac ? !!evt.metaKey : !!evt.ctrlKey;
  var altPressed = !!evt.altKey;
  if (mode === "none") return !modPressed && !altPressed;
  if (mode === "modOnly") return modPressed;
  if (mode === "altOnly") return altPressed;
  if (mode === "modOrAlt") return modPressed || altPressed;
  return modPressed || altPressed;
}
var WorkspacePlusPlus = (
  /** @class */
  function(_super) {
    function WorkspacePlusPlus2() {
      return _super !== null && _super.apply(this, arguments) || this;
    }
    WorkspacePlusPlus2.prototype = Object.create(_super.prototype);
    WorkspacePlusPlus2.prototype.constructor = WorkspacePlusPlus2;
    WorkspacePlusPlus2.prototype.onload = function() {
      var self = this;
      return this.loadWithBackup().then(function(saved) {
        self.data = Object.assign({}, DEFAULT_DATA, saved || {});
        if (!self.data.sessions) self.data.sessions = {};
        if (!self.data.sessionOrder) self.data.sessionOrder = [];
        if (!self.data.statusBarActions) {
          self.data.statusBarActions = Object.assign({}, DEFAULT_DATA.statusBarActions);
          if (self.data.statusBarQuickSwitcher === false) {
            self.data.statusBarActions.click = "sessionManager";
          }
          if (self.data.versionHistoryCtrlRmbRestore === false) {
            self.data.statusBarActions.modRightClick = "none";
          }
        }
        self.data.statusBarActions = Object.assign({}, DEFAULT_DATA.statusBarActions, self.data.statusBarActions || {});
        self.normalizeGroupFeatureState();
        self.isSwitchingSession = false;
        self.pendingSwitchRequest = null;
        self.switchLockAt = 0;
        self.startupSettleStartedAt = 0;
        self.startupSettleUntil = 0;
        self.startupSettleTimer = null;
        self.startupFlushTimer = null;
        self.statusBarScrollDelta = 0;
        self.statusBarScrollEventAt = 0;
        self.statusBarScrollSwitchAt = 0;
        self.sessionSwitchNotice = null;
        self.syncSessionOrder();
        i18n.resolveLocale(self.data.language);
        var L = i18n.L;
        self.addRibbonIcon("panels-top-left", L.ribbonTooltip, function() {
          new modals.SessionManagerModal(self.app, self).open();
        });
        self.statusBarEl = self.addStatusBarItem();
        self.statusBarEl.addClass("wpp-status-bar");
        self.statusBarEl.addEventListener("click", function(evt) {
          var key = "click";
          if (evt.altKey) key = "altClick";
          else if (utils.isModPressed(evt)) key = "modClick";
          else if (evt.shiftKey) key = "shiftClick";
          var action = (self.data.statusBarActions || {})[key] || "none";
          if (action !== "none") {
            evt.preventDefault();
            evt.stopPropagation();
          }
          statusBarActions.executeStatusBarAction(self, action, evt);
        });
        self.statusBarEl.addEventListener("auxclick", function(evt) {
          if (evt.button !== 1) return;
          var key = "middleClick";
          if (evt.altKey) key = "altMiddleClick";
          else if (utils.isModPressed(evt)) key = "modMiddleClick";
          else if (evt.shiftKey) key = "shiftMiddleClick";
          var action = (self.data.statusBarActions || {})[key] || "none";
          if (action !== "none") {
            evt.preventDefault();
            evt.stopPropagation();
          }
          statusBarActions.executeStatusBarAction(self, action, evt);
        });
        self.statusBarEl.addEventListener("contextmenu", function(evt) {
          evt.preventDefault();
          var key = "rightClick";
          if (evt.altKey) key = "altRightClick";
          else if (utils.isModPressed(evt)) key = "modRightClick";
          else if (evt.shiftKey) key = "shiftRightClick";
          var action = (self.data.statusBarActions || {})[key] || "none";
          statusBarActions.executeStatusBarAction(self, action, evt);
        });
        self.statusBarEl.addEventListener("wheel", function(evt) {
          if (!self.data.statusBarModScrollSwitch) return;
          var isMac = utils.isMacPlatform();
          var cfg = getStatusBarScrollConfig(self.data);
          if (!matchesStatusBarScrollModifier(evt, isMac, self.data.statusBarScrollModifierMode)) return;
          if (Math.abs(evt.deltaY || 0) <= Math.abs(evt.deltaX || 0)) return;
          evt.preventDefault();
          evt.stopPropagation();
          var now = Date.now();
          if (self.isSwitchingSession) return;
          if (now - self.statusBarScrollSwitchAt < cfg.cooldownMs) return;
          if (now - self.statusBarScrollEventAt > cfg.resetMs) {
            self.statusBarScrollDelta = 0;
          }
          self.statusBarScrollEventAt = now;
          var deltaY = evt.deltaY || 0;
          if (evt.deltaMode === 1) deltaY *= 16;
          else if (evt.deltaMode === 2) deltaY *= 240;
          self.statusBarScrollDelta += deltaY;
          if (Math.abs(self.statusBarScrollDelta) < cfg.threshold) return;
          var direction = self.statusBarScrollDelta < 0 ? -1 : 1;
          if (self.data.statusBarScrollInvert) direction *= -1;
          self.statusBarScrollDelta = 0;
          self.statusBarScrollSwitchAt = now;
          self.switchRelativeFromScroll(direction).catch(function() {
          });
        }, { passive: false });
        self.updateStatusBar();
        registerCommands(self);
        self.settingTab = new settings.WorkspacePlusPlusSettingTab(self.app, self);
        self.addSettingTab(self.settingTab);
        self.registerEvent(self.app.workspace.on("layout-change", function() {
          self.noteStartupLayoutChange();
        }));
        self.app.workspace.onLayoutReady(function() {
          self.startStartupSettleWindow();
          self.ensureDefaultSession();
          self.syncSessionCommands();
          self.scheduleStartupFlush();
          self.startHistorySnapshotTimer();
          self.initRotationBackupTimestamp();
          self.registerFrontmatterListeners();
        });
      });
    };
    WorkspacePlusPlus2.prototype.onunload = function() {
      this.stopHistorySnapshotTimer();
      this.hideSwitchOverlay();
      this.hideSearchOverlay();
      this.clearSessionSwitchNotice();
      this.pendingSwitchRequest = null;
      this.isSwitchingSession = false;
      this.statusBarScrollDelta = 0;
      this.statusBarScrollEventAt = 0;
      this.statusBarScrollSwitchAt = 0;
      this.startupSettleStartedAt = 0;
      if (this.startupSettleTimer) {
        clearTimeout(this.startupSettleTimer);
        this.startupSettleTimer = null;
      }
      if (this.startupFlushTimer) {
        clearTimeout(this.startupFlushTimer);
        this.startupFlushTimer = null;
      }
      this.startupSettleUntil = 0;
      return this.flushPendingPersistence();
    };
    return WorkspacePlusPlus2;
  }(obsidian.Plugin)
);
attachHotkeyMethods(WorkspacePlusPlus);
attachOverlayMethods(WorkspacePlusPlus);
attachPersistenceMethods(WorkspacePlusPlus);
attachSessionMethods(WorkspacePlusPlus);
attachHistoryMethods(WorkspacePlusPlus);
attachFrontmatterMethods(WorkspacePlusPlus);
module.exports = WorkspacePlusPlus;
