export const EXTERNAL_SESSION_RELOAD_DEBOUNCE_MS = 500;
export const SESSION_FILE_MTIME_EPSILON_MS = 25;
export const STARTUP_SESSION_RECHECK_DELAYS = [3000, 10000] as const;
export const SESSION_FILE_POLL_MS = 5000;

export interface SyncWatcherOptions {
    onReload: () => void | Promise<unknown>;
    registerDomEvent?: ((target: Window, event: string, handler: () => void) => void) | undefined;
    /** Whether the sessions file is no longer the one this device last read or wrote. */
    isFileChanged?: (() => Promise<boolean>) | undefined;
    registerInterval?: ((id: number) => number) | undefined;
}

export class SyncWatcher {
    private readonly onReload: () => void | Promise<unknown>;
    private readonly registerDomEvent?: ((target: Window, event: string, handler: () => void) => void) | undefined;
    private readonly isFileChanged?: (() => Promise<boolean>) | undefined;
    private readonly registerInterval?: ((id: number) => number) | undefined;
    private reloadTimer: number | null = null;
    private pollTimer: number | null = null;
    private startupTimers: number[] = [];
    private listenersRegistered = false;

    constructor(options: SyncWatcherOptions) {
        this.onReload = options.onReload;
        this.registerDomEvent = options.registerDomEvent;
        this.isFileChanged = options.isFileChanged;
        this.registerInterval = options.registerInterval;
    }

    scheduleReload(debounceMs = EXTERNAL_SESSION_RELOAD_DEBOUNCE_MS): void {
        if (typeof window === 'undefined') {
            void this.onReload();
            return;
        }
        if (this.reloadTimer !== null) {
            window.clearTimeout(this.reloadTimer);
        }
        this.reloadTimer = window.setTimeout(() => {
            this.reloadTimer = null;
            void this.onReload();
        }, debounceMs);
    }

    registerListeners(): void {
        if (this.listenersRegistered) return;
        this.listenersRegistered = true;

        if (typeof this.registerDomEvent === 'function' && typeof window !== 'undefined') {
            this.registerDomEvent(window, 'focus', () => {
                this.scheduleReload();
            });
        }
        this.startPolling();
    }

    /**
     * Look at the sessions file's time every few seconds.
     *
     * Obsidian reports nothing about a file in a dot folder that something else
     * wrote, so a sessions file a sync delivered sat unread until the plugin's
     * data.json happened to arrive too - measured at 25 and 56 seconds on an
     * iCloud vault (#124). Only the time is read here; the file is read only
     * when it has changed. A phone suspends timers in the background, so this
     * costs nothing there while the app is not in use.
     */
    private startPolling(): void {
        const isFileChanged = this.isFileChanged;
        if (!isFileChanged || typeof window === 'undefined') return;
        this.pollTimer = window.setInterval(() => {
            // Errors are the file store's to report; a failed look is retried
            // on the next tick.
            void this.pollOnce(isFileChanged);
        }, SESSION_FILE_POLL_MS);
        this.registerInterval?.(this.pollTimer);
    }

    private async pollOnce(isFileChanged: () => Promise<boolean>): Promise<void> {
        if (this.reloadTimer !== null) return;
        if (await isFileChanged()) this.scheduleReload();
    }

    onExternalSettingsChange(): void {
        this.scheduleReload();
    }

    scheduleStartupChecks(): void {
        if (typeof window === 'undefined') return;
        for (let i = 0; i < STARTUP_SESSION_RECHECK_DELAYS.length; i++) {
            const delayMs = STARTUP_SESSION_RECHECK_DELAYS[i]!;
            const timer = window.setTimeout(() => {
                const idx = this.startupTimers.indexOf(timer);
                if (idx !== -1) {
                    this.startupTimers.splice(idx, 1);
                }
                void this.onReload();
            }, delayMs);
            this.startupTimers.push(timer);
        }
    }

    clearTimers(): void {
        if (typeof window === 'undefined') {
            this.reloadTimer = null;
            this.startupTimers = [];
            return;
        }
        if (this.reloadTimer !== null) {
            window.clearTimeout(this.reloadTimer);
            this.reloadTimer = null;
        }
        if (this.pollTimer !== null) {
            window.clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
        for (let i = 0; i < this.startupTimers.length; i++) {
            window.clearTimeout(this.startupTimers[i]);
        }
        this.startupTimers = [];
    }

    hasActiveTimers(): boolean {
        return this.reloadTimer !== null || this.startupTimers.length > 0;
    }
}
