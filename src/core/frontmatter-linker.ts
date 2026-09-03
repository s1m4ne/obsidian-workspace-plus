import { Notice, type App, type EventRef, type TFile, type WorkspaceLeaf } from 'obsidian';
import { L, formatString } from '../i18n.ts';
import type { PluginData, SessionItem } from '../storage/default-data.ts';

export interface ParsedWorkspaceSession {
    groupName: string | null;
    groupId?: string;
    sessionName: string;
}

import type { SessionStore } from '../state/session-store.ts';
import type { GroupStore } from '../state/group-store.ts';

export interface FrontmatterLinkerHost {
    data: PluginData;
    app: App;
    saveCurrentLayoutAsSessionName: (name: string, options?: { silent?: boolean }) => Promise<unknown>;
    switchSession: (sessionId: string) => Promise<boolean>;
    setActiveGroup?: (groupId: string) => Promise<boolean>;
    isGroupFeatureEnabled: () => boolean;

    /**
     * The session set and the group map are owned by their stores. Naming the
     * stores rather than restating their methods keeps one list, the way the
     * other hosts do; the linker read `data.groups`, `data.sessions` and both
     * active ids directly, which is what P1's contract stage removes.
     */
    getSessionStore(): SessionStore;
    getGroupStore(): GroupStore;
    getStartupSettleRemainingMs?: () => number;
    isSessionSwitcherActive?: () => boolean;
    handleFrontmatterTriggers?: (file: TFile) => void;
    registerEvent?: (eventRef: EventRef) => void;
}

export class FrontmatterLinker {
    private readonly hostProvider: () => FrontmatterLinkerHost;
    private frontmatterLoadedFilePathsByLeaf: Record<string, string> = {};

    constructor(hostOrProvider: FrontmatterLinkerHost | (() => FrontmatterLinkerHost)) {
        if (typeof hostOrProvider === 'function') {
            this.hostProvider = hostOrProvider;
        } else {
            this.hostProvider = () => hostOrProvider;
        }
    }

    private get host(): FrontmatterLinkerHost {
        return this.hostProvider();
    }

    private get data(): PluginData {
        return this.host.data;
    }

    getFileFrontmatter(file: TFile | null | undefined): Record<string, unknown> | null {
        if (!file) return null;
        const cache = this.host.app.metadataCache.getFileCache(file);
        return (cache && cache.frontmatter) || null;
    }

    isMarkdownNoteFile(file: TFile | null | undefined): boolean {
        return Boolean(file && String(file.extension || '').toLowerCase() === 'md');
    }

    getSessionNameFromNoteFile(file: TFile | null | undefined): string {
        if (!this.isMarkdownNoteFile(file)) return '';
        if (typeof file!.basename === 'string' && file!.basename.trim()) {
            return file!.basename.trim();
        }
        let name = typeof file!.name === 'string' ? file!.name : '';
        if (!name && typeof file!.path === 'string') {
            const parts = file!.path.split('/');
            name = parts[parts.length - 1] || '';
        }
        return name.replace(/\.md$/i, '').trim();
    }

    setWorkspaceSessionFrontmatter(file: TFile, sessionName: string): Promise<void> {
        if (!this.host.app.fileManager || typeof this.host.app.fileManager.processFrontMatter !== 'function') {
            return Promise.reject(new Error('processFrontMatter unavailable'));
        }
        return this.host.app.fileManager.processFrontMatter(file, (frontmatter: Record<string, unknown>) => {
            frontmatter['workspace-session'] = sessionName;
        });
    }

    async saveCurrentNoteNameAsSession(options?: { silent?: boolean }): Promise<unknown> {
        const opts = options || {};
        const file = typeof this.host.app.workspace.getActiveFile === 'function'
            ? this.host.app.workspace.getActiveFile()
            : null;
        const sessionName = this.getSessionNameFromNoteFile(file);

        if (!file || !sessionName) {
            if (!opts.silent) new Notice(formatString(L.noActiveMarkdownFile));
            return false;
        }

        try {
            await this.setWorkspaceSessionFrontmatter(file, sessionName);
            const result = await this.host.saveCurrentLayoutAsSessionName(sessionName, { silent: true });
            if (!opts.silent) {
                new Notice(formatString(L.savedCurrentNoteNameAsSession, sessionName));
            }
            return result;
        } catch {
            if (!opts.silent) {
                new Notice(formatString(L.saveCurrentNoteNameAsSessionFailed));
            }
            return false;
        }
    }

    parseWorkspaceSessionValue(value: string | null | undefined): ParsedWorkspaceSession | null {
        if (!value || typeof value !== 'string') return null;
        const trimmed = value.trim();
        if (!trimmed) return null;

        const slashIndex = trimmed.indexOf('/');
        if (slashIndex === -1) {
            return { groupName: null, sessionName: trimmed };
        }

        const candidateGroup = trimmed.substring(0, slashIndex).trim();
        const candidateSession = trimmed.substring(slashIndex + 1).trim();

        if (!candidateGroup || !candidateSession) {
            return { groupName: null, sessionName: trimmed };
        }

        const groups = this.host.getGroupStore().getGroupMap();
        const groupKeys = Object.keys(groups);
        for (let i = 0; i < groupKeys.length; i++) {
            const key = groupKeys[i];
            const group = key ? groups[key] : undefined;
            if (group && group.name === candidateGroup) {
                return { groupName: candidateGroup, groupId: group.id, sessionName: candidateSession };
            }
        }

        return { groupName: null, sessionName: trimmed };
    }

    findSessionByName(name: string | null | undefined): SessionItem | null {
        if (!name) return null;
        const sessions = this.data.sessions || {};
        const keys = Object.keys(sessions);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const session = key ? sessions[key] : undefined;
            if (session && session.name === name) {
                return session;
            }
        }
        return null;
    }

    handleWorkspaceSessionProperty(value: string): void {
        const parsed = this.parseWorkspaceSessionValue(value);
        if (!parsed) return;

        const session = this.findSessionByName(parsed.sessionName);
        if (!session) {
            new Notice(formatString(L.frontmatterSessionNotFound, parsed.sessionName));
            return;
        }

        const alreadyOnSession = session.id === this.host.getSessionStore().getActiveSessionId();
        const alreadyOnGroup = !parsed.groupId || this.host.getGroupStore().getActiveGroupId() === parsed.groupId;

        if (alreadyOnSession && alreadyOnGroup) {
            new Notice(formatString(L.frontmatterAlreadyActive, parsed.sessionName));
            return;
        }

        const isGroupEnabled = this.host.isGroupFeatureEnabled();

        if (parsed.groupId && isGroupEnabled && !alreadyOnGroup && typeof this.host.setActiveGroup === 'function') {
            void this.host.setActiveGroup(parsed.groupId).then(() => {
                if (session.id !== this.host.getSessionStore().getActiveSessionId()) {
                    void this.host.switchSession(session.id);
                }
            });
        } else if (!alreadyOnSession) {
            void this.host.switchSession(session.id);
        }
    }

    handleFrontmatterTriggers(file: TFile): void {
        const fm = this.getFileFrontmatter(file);
        if (!fm) return;

        const wsVal = fm['workspace-session'];
        if (typeof wsVal === 'string' || typeof wsVal === 'number') {
            this.handleWorkspaceSessionProperty(String(wsVal));
        }
    }

    getFrontmatterTriggerLeafId(): string {
        const activeLeaf = (this.host.app.workspace as { activeLeaf?: { id?: string } | null }).activeLeaf || null;
        return activeLeaf?.id ? activeLeaf.id : 'active';
    }

    markCurrentFrontmatterFilesLoaded(): void {
        const loadedByLeaf: Record<string, string> = {};
        if (typeof this.host.app.workspace.iterateAllLeaves === 'function') {
            this.host.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
                const view = leaf?.view as { file?: TFile } | undefined;
                const file = view?.file;
                const leafId = (leaf as { id?: string })?.id;
                if (!leaf || !leafId || !file || !file.path) return;
                loadedByLeaf[leafId] = file.path;
            });
        }
        this.frontmatterLoadedFilePathsByLeaf = loadedByLeaf;
    }

    clearFrontmatterFileForActiveLeaf(): void {
        delete this.frontmatterLoadedFilePathsByLeaf[this.getFrontmatterTriggerLeafId()];
    }

    shouldHandleFrontmatterFileOpen(file: TFile): boolean {
        const filePath = file && file.path ? file.path : '';
        if (!filePath) return false;
        const leafId = this.getFrontmatterTriggerLeafId();
        if (this.frontmatterLoadedFilePathsByLeaf[leafId] === filePath) return false;
        this.frontmatterLoadedFilePathsByLeaf[leafId] = filePath;
        return true;
    }

    registerFrontmatterListeners(): void {
        this.markCurrentFrontmatterFilesLoaded();

        const eventRef = this.host.app.workspace.on('file-open', (file: TFile | null) => {
            if (this.host.isSessionSwitcherActive?.()) return;
            if ((this.host.getStartupSettleRemainingMs?.() ?? 0) > 0) return;

            if (!file) {
                this.clearFrontmatterFileForActiveLeaf();
                return;
            }
            if (!this.shouldHandleFrontmatterFileOpen(file)) return;
            if (typeof this.host.handleFrontmatterTriggers === 'function') {
                this.host.handleFrontmatterTriggers(file);
            } else {
                this.handleFrontmatterTriggers(file);
            }
        });

        if (typeof this.host.registerEvent === 'function') {
            this.host.registerEvent(eventRef);
        }
    }
}
