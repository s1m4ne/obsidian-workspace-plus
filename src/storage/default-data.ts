import type { SessionStorageLocation } from './paths.ts';

// The twelve configurable click slots, in the order the settings tab shows
// them. Both the type and the runtime list come from here so a slot cannot be
// added to one and forgotten in the other.
export const STATUS_BAR_SLOT_KEYS = [
    'click',
    'altClick',
    'modClick',
    'shiftClick',
    'middleClick',
    'altMiddleClick',
    'modMiddleClick',
    'shiftMiddleClick',
    'rightClick',
    'altRightClick',
    'modRightClick',
    'shiftRightClick',
] as const;

export type StatusBarSlotKey = typeof STATUS_BAR_SLOT_KEYS[number];

export type StatusBarActions = Record<StatusBarSlotKey, string>;

export interface SessionHistoryEntry {
    timestamp?: number;
    savedAt?: number;
    layout: unknown;
    note?: string;
}

export interface SessionItem {
    id: string;
    name: string;
    layout: unknown;
    created?: number;
    modified?: number;
    history?: SessionHistoryEntry[];
    frontmatterKey?: string;
    [key: string]: unknown;
}

export interface SessionGroup {
    id: string;
    name: string;
    color?: string;
    icon?: string;
    collapsed?: boolean;
    [key: string]: unknown;
}

export interface PluginData {
    activeSessionId: string | null;
    sessions: Record<string, SessionItem>;
    sessionOrder: string[];
    sessionStorageLocation: SessionStorageLocation;
    language: string;
    previewNext: boolean;
    previewPrevious: boolean;
    confirmDeleteByHotkey: boolean;
    confirmQuickActions: boolean;
    autoSaveOnSwitch: boolean;
    warnOnUnsavedSwitch: boolean;
    highlightUnsavedSessionChanges: boolean;
    restoreSidebars: boolean;
    statusBarQuickSwitcher: boolean;
    groupFeatureEnabled: boolean;
    showFilterInput: boolean;
    overlayDefaultFocus: string;
    showActiveSwitchCommand: boolean;
    numberedSwitchCommands: boolean;
    // Written and read as left/bottom - see search-overlay.ts, which anchors
    // the overlay from the bottom-left because it hangs off the status bar. The
    // declaration said `{ x, y }`, which no code has ever produced or consumed;
    // the on-disk format is unchanged by correcting it.
    searchOverlayPosition: { left: number; bottom: number } | null;
    searchOverlaySize: { width: number; height: number } | null;
    groups: Record<string, SessionGroup>;
    groupOrder: string[];
    sessionGroups: Record<string, string[]>;
    activeGroupId: string | null;
    versionHistoryEnabled: boolean;
    versionHistorySnapshotInterval: number;
    versionHistoryCtrlRmbRestore: boolean;
    versionHistoryConfirmRestore: boolean;
    statusBarModScrollSwitch: boolean;
    statusBarScrollPreset: string;
    statusBarScrollModifierMode: string;
    statusBarScrollThreshold: number;
    statusBarScrollCooldownMs: number;
    statusBarScrollResetMs: number;
    statusBarScrollInvert: boolean;
    statusBarActions: StatusBarActions;
    [key: string]: unknown;
}

export const DEFAULT_DATA: PluginData = {
    activeSessionId: null,
    sessions: {},
    sessionOrder: [],
    sessionStorageLocation: 'plugin-folder',
    language: 'auto',
    previewNext: true,
    previewPrevious: true,
    confirmDeleteByHotkey: true,
    confirmQuickActions: false,
    autoSaveOnSwitch: true,
    warnOnUnsavedSwitch: true,
    highlightUnsavedSessionChanges: true,
    restoreSidebars: true,
    statusBarQuickSwitcher: true,
    groupFeatureEnabled: true,
    showFilterInput: false,
    overlayDefaultFocus: 'current-session',
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
    statusBarModScrollSwitch: false,
    statusBarScrollPreset: 'trackpad',
    statusBarScrollModifierMode: 'none',
    statusBarScrollThreshold: 30,
    statusBarScrollCooldownMs: 500,
    statusBarScrollResetMs: 250,
    statusBarScrollInvert: false,
    statusBarActions: {
        click: 'quickSwitcher',
        altClick: 'reloadWithoutSaving',
        modClick: 'saveSession',
        shiftClick: 'none',
        middleClick: 'none',
        altMiddleClick: 'none',
        modMiddleClick: 'reloadWithoutSaving',
        shiftMiddleClick: 'none',
        rightClick: 'sessionMenu',
        altRightClick: 'none',
        modRightClick: 'restoreLatestHistory',
        shiftRightClick: 'none',
    },
};

export const SETTINGS_KEYS: readonly string[] = [
    'language',
    'previewNext',
    'previewPrevious',
    'confirmDeleteByHotkey',
    'autoSaveOnSwitch',
    'warnOnUnsavedSwitch',
    'restoreSidebars',
    'highlightUnsavedSessionChanges',
    'statusBarQuickSwitcher',
    'statusBarModScrollSwitch',
    'groupFeatureEnabled',
    'overlayDefaultFocus',
    'searchOverlayPosition',
    'searchOverlaySize',
    'versionHistoryEnabled',
    'versionHistorySnapshotInterval',
    'versionHistoryCtrlRmbRestore',
    'versionHistoryConfirmRestore',
    'statusBarScrollPreset',
    'statusBarScrollModifierMode',
    'statusBarScrollThreshold',
    'statusBarScrollCooldownMs',
    'statusBarScrollResetMs',
    'statusBarScrollInvert',
    'statusBarActions',
    'confirmQuickActions',
    'showFilterInput',
    'showActiveSwitchCommand',
    'numberedSwitchCommands',
] as const;

export const SESSION_KEYS: readonly string[] = [
    'activeSessionId',
    'sessions',
    'sessionOrder',
    'groups',
    'groupOrder',
    'sessionGroups',
    'activeGroupId',
] as const;
