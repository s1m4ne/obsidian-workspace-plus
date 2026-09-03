import { PluginSettingTab, type App, type Plugin } from 'obsidian';
import type { SettingDefinitionItem, SettingGroupItem } from 'obsidian';
import { L, text } from './i18n.ts';
import { CONTROL_BINDINGS } from './settings/control-bindings.ts';
import { pagesGroup, surfaceGroups } from './settings/surface.ts';
import { statusBarPage } from './settings/status-bar-page.ts';
import { scrollSwitchPage } from './settings/scroll-switch-page.ts';
import { historyPage } from './settings/history-page.ts';
import { backupPage } from './settings/backup-page.ts';
import { groupsPage } from './settings/groups-page.ts';
import { dataPage } from './settings/data-page.ts';
import type { StatusBarActions } from './storage/default-data.ts';
import type { StorageDiagnosticsInfo } from './storage/persistence-service.ts';
import type { RotationBackupInfo } from './storage/storage-backup.ts';
import type { ReadJsonResult } from './storage/json-file-store.ts';
import type { SettingsState } from './state/settings-state.ts';
import type { GroupStore } from './state/group-store.ts';
import type { SessionSaver } from './state/session-saver.ts';
import type { SessionStore } from './state/session-store.ts';
import type { HistoryService } from './state/history-service.ts';

export interface SettingsTabHost {
    /**
     * The session set, its ordering and the CRUD on it are owned by
     * SessionStore. Naming the store rather than restating its methods keeps
     * one list, the way getGroupStore() and getSessionSaver() do.
     *
     * Declared here rather than inherited: these two came from
     * GroupSessionsModalHost, an interface that existed only to type the
     * group-membership modal, which is gone.
     */
    getSessionStore(): SessionStore;

    /** Group state is owned by GroupStore; naming the store keeps one list. */
    getGroupStore(): GroupStore;

    /**
     * Owned by HistoryService; naming it keeps one list rather than a
     * forwarding method per call on the plugin.
     */
    getHistoryService(): HistoryService;

    /**
     * The session set, its ordering and the CRUD on it are owned by
     * SessionStore. Naming the store rather than restating its methods keeps
     * one list, the way getGroupStore() and getSessionSaver() do.
     */
    getSessionStore(): SessionStore;

    /**
     * Saving and the auto-save flags are owned by SessionSaver. Naming it here
     * rather than restating its methods keeps one list, the way getGroupStore()
     * does for group state.
     */
    getSessionSaver(): SessionSaver;

    /**
     * Group state is owned by GroupStore. Naming the store rather than
     * restating its methods keeps one list: the plugin used to carry a
     * forwarding method per call, and one added to the store without a shim
     * did nothing from here while the type checker saw a host that simply
     * lacked the member.
     */
    getGroupStore(): GroupStore;

    /**
     * The settings the UI writes are owned by SettingsState. Naming the store
     * here rather than restating its twenty-four setters keeps one list: the
     * plugin used to carry a forwarding method per setter, and a setter added
     * to the store without one silently did nothing from the settings screen.
     */
    getSettingsState(): SettingsState;

    manifest?: { name?: string } | undefined;
    data: {
        language?: string;
        statusBarActions?: Partial<StatusBarActions>;
        confirmQuickActions?: boolean;
        statusBarModScrollSwitch?: boolean;
        statusBarScrollPreset?: string;
        statusBarScrollModifierMode?: string;
        statusBarScrollThreshold?: number;
        statusBarScrollCooldownMs?: number;
        statusBarScrollResetMs?: number;
        statusBarScrollInvert?: boolean;
        showActiveSwitchCommand?: boolean;
        numberedSwitchCommands?: boolean;
        previewNext?: boolean;
        previewPrevious?: boolean;
        showFilterInput?: boolean;
        overlayDefaultFocus?: string;
        confirmDeleteByHotkey?: boolean;
        [key: string]: unknown;
    };
    /** Written by the manual backup button; a prototype accessor on the plugin. */
    _lastRotationBackupAt?: number;





    extractSessionData(data: unknown): Record<string, unknown>;
    prepareRotationBackupData(sessionData: unknown): Record<string, unknown>;
    ensureDir(path: string): Promise<unknown>;
    getBackupsDirPath(): string;
    copyFileIfExists(from: string, to: string): Promise<unknown>;
    getRotationBackupPath(generation: number): string;
    writeJson(path: string, data: unknown): Promise<unknown>;
    // Read back so a manual backup can tell whether anything changed before it
    // rotates a generation off the end.
    readJsonIfExists<T = unknown>(path: string): Promise<ReadJsonResult<T>>;
    getRotationBackupInfo(): Promise<RotationBackupInfo[]>;
    restoreFromRotationBackup(generation: number): Promise<boolean>;


    getSessionsPath(): string;
    getSessionStorageLocation(): string;
    setSessionStorageLocation(location: string): Promise<unknown>;
    exportSessionsSnapshot(): Promise<unknown>;
    importSessionsFromLatestExport(): Promise<unknown>;

    resetSettingsToDefault(): Promise<unknown>;
    clearBackupsAndVersionHistory(): Promise<unknown>;
    resetSessionsAndSettingsToDefault(): Promise<unknown>;

    getStorageDiagnosticsInfo(): StorageDiagnosticsInfo;
    getSessionStorageSize(): Promise<number | null>;
}

/**
 * What a definitions module needs from the settings tab.
 *
 * The tab hands the same object to every module, so a module names what it
 * uses instead of taking the tab itself. `update` and `refresh` are the two
 * redraws the declarative API distinguishes, and getting them the wrong way
 * round is the mistake this interface exists to make visible.
 */
export interface SettingsContext {
    readonly plugin: SettingsTabHost;
    readonly app: App;

    /**
     * The set of items changed - a group was created, a backup appeared - so
     * the definitions have to be read again.
     */
    update(): void;

    /**
     * The items are the same; only `visible`, `disabled` or a control's value
     * moved. Re-evaluates them in place, keeping focus and scroll.
     *
     * Obsidian calls this itself after every `control` write, so a row that
     * only reacts to a control needs nothing here.
     */
    refresh(): void;
}

/**
 * Whether two readings of the backup directory describe the same generations.
 *
 * Field by field rather than by identity: `getRotationBackupInfo` builds a
 * fresh array every call, so an identity check would report a change on every
 * pass and never settle.
 */
function sameBackups(
    a: readonly RotationBackupInfo[] | null,
    b: readonly RotationBackupInfo[] | null
): boolean {
    if (a === null || b === null) return a === b;
    if (a.length !== b.length) return false;
    return a.every((left, index) => {
        const right = b[index];
        return right !== undefined
            && left.generation === right.generation
            && left.savedAt === right.savedAt
            && left.sessionCount === right.sessionCount
            && left.backupPlatform === right.backupPlatform;
    });
}

/**
 * The settings screen.
 *
 * This class assembles; it draws nothing. Every row lives in `settings/` as a
 * definition, and Obsidian renders the tree. `display()` is not overridden at
 * all: it is deprecated from 1.13, it is not called while
 * `getSettingDefinitions()` returns anything, and `minAppVersion` is 1.13.0, so
 * there is no version left that would reach it.
 *
 * The four horizontal tabs are gone. They were a `render` row holding buttons
 * that toggled `visible` on seven groups, which put arbitrary DOM inside a
 * settings card and looked it; and the mechanism Obsidian has for a screen too
 * long to scroll is a page. What is on a page here is what can be said in the
 * one line the navigable row shows - twelve status-bar slots as "5 / 12", the
 * newest backup as "3 minutes ago" - and that test is what decided which
 * sections moved and which stayed on the surface.
 */
export class WorkspacePlusPlusSettingTab extends PluginSettingTab {
    private readonly plugin: SettingsTabHost;

    /**
     * The two readings that come from disk. Definitions are built
     * synchronously, so each is rendered as pending and re-read when it lands:
     * `null` is "no backups", `undefined` is "not yet known".
     */
    private backups: readonly RotationBackupInfo[] | null = null;
    private storageSize: number | null | undefined = undefined;

    constructor(app: App, plugin: SettingsTabHost) {
        // At run time this *is* the plugin. The parameter is typed structurally
        // so a test can supply the sixty-odd members this tab actually uses
        // instead of a whole Plugin, which is why the base class needs the cast.
        super(app, plugin as unknown as Plugin);
        this.plugin = plugin;
    }

    /** What the definition modules are given. */
    private context(): SettingsContext {
        return {
            plugin: this.plugin,
            app: this.app,
            update: () => { this.update(); },
            refresh: () => { this.refreshDomState(); },
        };
    }

    /**
     * Read the two things that live on disk, on every pass over the
     * definitions, and re-read the definitions if either has moved.
     *
     * The loop this looks like is closed by the comparison, not by a flag: an
     * unchanged reading returns without calling `update()`, so the second pass
     * is always the last. A flag was the first attempt and it was wrong in a
     * way a test would not notice - "read once per screen" is not the rule,
     * because taking a backup and restoring one both change what is on disk
     * while the screen is open. Pressing "Back up now" left the list below it
     * showing the generations from before the press.
     */
    private requestAsyncReadings(): void {
        void this.plugin.getRotationBackupInfo().then((backups) => {
            if (sameBackups(this.backups, backups)) return;
            this.backups = backups;
            this.update();
        });
        void this.plugin.getSessionStorageSize().then((size) => {
            if (this.storageSize === size) return;
            this.storageSize = size;
            this.update();
        });
    }

    /**
     * The settings as data. Obsidian 1.13 renders from this, and its settings
     * search indexes it - including inside the pages, whose results are
     * grouped by page and navigate to the row.
     */
    override getSettingDefinitions(): SettingDefinitionItem[] {
        this.requestAsyncReadings();
        const ctx = this.context();

        const pages: SettingGroupItem[] = [
            statusBarPage(),
            scrollSwitchPage(ctx),
            historyPage(ctx),
            backupPage(ctx, this.backups),
            groupsPage(ctx),
            dataPage(ctx, this.storageSize),
        ];

        return [
            ...surfaceGroups(ctx),
            pagesGroup(pages),
            this.footerGroup(),
        ];
    }

    /**
     * The translation offer and the repository link.
     *
     * A row whose description is a fragment, rather than the div and two CSS
     * rules it was: `desc` takes a DocumentFragment, so the link belongs there.
     */
    private footerGroup(): SettingDefinitionItem {
        const desc = createFragment((frag) => {
            frag.appendText(text(L.settingsTranslationHelp));
            frag.appendText(' ');
            frag.createEl('a', {
                text: text(L.settingsGitHubLink),
                href: 'https://github.com/s1m4ne/obsidian-workspace-plus',
                attr: { target: '_blank', rel: 'noopener' },
            });
        });

        return { type: 'group', items: [{ name: '', desc, searchable: false }] };
    }

    override getControlValue(key: string): unknown {
        const binding = CONTROL_BINDINGS[key];
        return binding ? binding.read(this.plugin) : undefined;
    }

    override setControlValue(key: string, value: unknown): void | Promise<void> {
        const binding = CONTROL_BINDINGS[key];
        if (!binding) return;
        const written = binding.write(this.plugin, value);
        if (!binding.rereadDefinitions) {
            // Obsidian re-evaluates `visible` and `disabled` itself after every
            // write, so a key that only moves those needs nothing more.
            return written instanceof Promise ? written.then(() => undefined) : undefined;
        }
        if (!(written instanceof Promise)) {
            this.context().update();
            return;
        }
        return written.then(() => { this.context().update(); });
    }
}
