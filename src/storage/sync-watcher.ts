export const EXTERNAL_SESSION_RELOAD_DEBOUNCE_MS = 500;
export const SESSION_FILE_MTIME_EPSILON_MS = 25;
export const STARTUP_SESSION_RECHECK_DELAYS = [3000, 10000] as const;

export interface SyncWatcherOptions {
    onReload: () => void | Promise<unknown>;
    registerDomEvent?: ((target: Window, event: string, handler: () => void) => void) | undefined;
}

export class SyncWatcher {
    private readonly onReload: () => void | Promise<unknown>;
    private readonly registerDomEvent?: ((target: Window, event: string, handler: () => void) => void) | undefined;
    private reloadTimer: number | null = null;
    private startupTimers: number[] = [];
    private listenersRegistered = false;

    constructor(options: SyncWatcherOptions) {
        this.onReload = options.onReload;
        this.registerDomEvent = options.registerDomEvent;
    }

    scheduleReload(debounceMs = EXTERNAL_SESSION_RELOAD_DEBOUNCE_MS): void {
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
    }

    onExternalSettingsChange(): void {
        this.scheduleReload();
    }

    scheduleStartupChecks(): void {
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
        if (this.reloadTimer !== null) {
            window.clearTimeout(this.reloadTimer);
            this.reloadTimer = null;
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
