export interface StorageAdapter {
    exists(normalizedPath: string): Promise<boolean>;
    read(normalizedPath: string): Promise<string>;
    write(normalizedPath: string, data: string): Promise<void>;
    remove(normalizedPath: string): Promise<void>;
    rename(normalizedPath: string, normalizedNewPath: string): Promise<void>;
    mkdir?(normalizedPath: string): Promise<void>;
    stat(normalizedPath: string): Promise<{ mtime: number } | null>;
}

export interface ReadJsonResult<T = unknown> {
    exists: boolean;
    data: T | null;
    error: Error | null;
}

export class JsonFileStore {
    private readonly adapter: StorageAdapter;

    constructor(adapter: StorageAdapter) {
        this.adapter = adapter;
    }

    async readJsonIfExists<T = unknown>(path: string): Promise<ReadJsonResult<T>> {
        try {
            const exists = await this.adapter.exists(path);
            if (!exists) {
                return { exists: false, data: null, error: null };
            }
            const raw = await this.adapter.read(path);
            try {
                return { exists: true, data: JSON.parse(raw) as T, error: null };
            } catch (parseError) {
                const err = parseError instanceof Error ? parseError : new Error(String(parseError));
                return { exists: true, data: null, error: err };
            }
        } catch (readError) {
            const err = readError instanceof Error ? readError : new Error(String(readError));
            return { exists: true, data: null, error: err };
        }
    }

    async writeJson(path: string, data: unknown, pretty = false): Promise<void> {
        const json = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
        await this.adapter.write(path, json);
    }

    async ensureDir(path: string): Promise<void> {
        try {
            const exists = await this.adapter.exists(path);
            if (!exists && typeof this.adapter.mkdir === 'function') {
                await this.adapter.mkdir(path).catch(() => {});
            }
        } catch {
            // Ignore error if already exists
        }
    }

    async getFileMtime(path: string): Promise<number> {
        try {
            const stat = await this.adapter.stat(path);
            if (!stat || typeof stat.mtime !== 'number') return 0;
            return stat.mtime;
        } catch {
            return 0;
        }
    }

    async removeIfExists(path: string): Promise<void> {
        try {
            const exists = await this.adapter.exists(path);
            if (!exists) return;
            await this.adapter.remove(path).catch(() => {});
        } catch {
            // Ignore
        }
    }

    async renameIfExists(fromPath: string, toPath: string): Promise<void> {
        try {
            const exists = await this.adapter.exists(fromPath);
            if (!exists) return;
            await this.adapter.rename(fromPath, toPath).catch(() => {});
        } catch {
            // Ignore
        }
    }
}
