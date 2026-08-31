import { type App, Modal, Notice } from 'obsidian';
import { L } from '../i18n.ts';
import { ConfirmModal } from './confirm-modal.ts';
import type { SessionHistoryEntry, SessionItem } from '../storage/default-data.ts';

const DAY = 86400000;

export interface HistoryModalPluginHost {
    app: App;
    extractFilePathsFromLayout(layout: unknown): string[];
    countPanesInLayout(layout: unknown): number;
    restoreFromHistoryEntry(sessionId: string, index: number): Promise<boolean>;
    isVersionHistoryConfirmRestoreEnabled(): boolean;
}

export interface HistoryDateGroup {
    label: string;
    entries: SessionHistoryEntry[];
    indices: number[];
}

export class HistoryModal extends Modal {
    private readonly plugin: HistoryModalPluginHost;
    private readonly session: SessionItem;

    constructor(app: App, plugin: HistoryModalPluginHost, session: SessionItem) {
        super(app);
        this.plugin = plugin;
        this.session = session;
    }

    override onOpen(): void {
        const contentEl = this.contentEl;
        contentEl.empty();
        contentEl.addClass('wpp-modal', 'wpp-history-modal');
        this.titleEl.setText(String(L.historyTitle || '') + ' — ' + this.session.name);

        const history = this.session.history || [];
        if (history.length === 0) {
            contentEl.createEl('p', {
                text: String(L.historyEmpty || ''),
                cls: 'wpp-history-empty',
            });
            return;
        }

        const groups = this.groupByDate(history);
        const listEl = contentEl.createDiv({ cls: 'wpp-history-list' });

        for (let gi = 0; gi < groups.length; gi++) {
            const group = groups[gi]!;
            listEl.createEl('h4', { text: group.label, cls: 'wpp-history-date-label' });

            for (let ei = 0; ei < group.entries.length; ei++) {
                this.renderEntry(listEl, group.entries[ei]!, group.indices[ei]!);
            }
        }
    }

    renderEntry(listEl: HTMLElement, entry: SessionHistoryEntry, originalIndex: number): void {
        const itemEl = listEl.createDiv({ cls: 'wpp-history-item' });

        // Info section
        const infoEl = itemEl.createDiv({ cls: 'wpp-history-info' });
        const time = new Date(entry.savedAt ?? Date.now());
        const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        infoEl.createDiv({ text: timeStr, cls: 'wpp-history-time' });

        const filePaths = this.plugin.extractFilePathsFromLayout(entry.layout);
        const paneCount = this.plugin.countPanesInLayout(entry.layout);
        const fileNames = filePaths.map((p) => {
            const parts = p.split('/');
            return parts[parts.length - 1]!;
        });

        let summary = (L.historyPanes as (n: number) => string)(paneCount);
        if (fileNames.length > 0) {
            let displayNames = fileNames.slice(0, 5).join(', ');
            if (fileNames.length > 5) displayNames += ' ...';
            summary += ' · ' + displayNames;
        }
        infoEl.createDiv({ text: summary, cls: 'wpp-history-summary' });

        // Restore button
        const btnEl = itemEl.createEl('button', {
            text: String(L.historyRestore || 'Restore'),
            cls: 'wpp-history-restore-btn',
        });
        btnEl.addEventListener('click', () => {
            const doRestore = () => {
                void this.plugin
                    .restoreFromHistoryEntry(this.session.id, originalIndex)
                    .then((ok) => {
                        if (ok) {
                            new Notice(
                                (L.historyRestored as (name: string) => string)(this.session.name)
                            );
                        }
                        this.close();
                    });
            };

            if (this.plugin.isVersionHistoryConfirmRestoreEnabled()) {
                new ConfirmModal(
                    this.app,
                    (L.historyRestoreConfirm as (name: string, time: string) => string)(
                        this.session.name,
                        timeStr
                    ),
                    doRestore,
                    {
                        confirmText: String(L.historyRestore || 'Restore'),
                        confirmClass: 'mod-cta',
                    }
                ).open();
            } else {
                doRestore();
            }
        });
    }

    groupByDate(history: SessionHistoryEntry[]): HistoryDateGroup[] {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const yesterdayStart = todayStart - DAY;
        const weekStart = todayStart - 6 * DAY;

        const groups: Record<string, HistoryDateGroup> = {};
        const groupOrder: string[] = [];

        for (let i = 0; i < history.length; i++) {
            const entry = history[i]!;
            const t = entry.savedAt ?? Date.now();
            let label: string;

            if (t >= todayStart) {
                label = String(L.historyToday || '');
            } else if (t >= yesterdayStart) {
                label = String(L.historyYesterday || '');
            } else if (t >= weekStart) {
                label = String(L.historyThisWeek || '');
            } else {
                const d = new Date(t);
                label = d.toLocaleDateString();
            }

            if (!groups[label]) {
                groups[label] = { label, entries: [], indices: [] };
                groupOrder.push(label);
            }
            groups[label]!.entries.push(entry);
            groups[label]!.indices.push(i);
        }

        return groupOrder.map((k) => groups[k]!);
    }

    override onClose(): void {
        this.contentEl.empty();
    }
}
