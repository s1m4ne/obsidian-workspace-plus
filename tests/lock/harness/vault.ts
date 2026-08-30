// In-memory vault adapter for lock tests and upgrade path characterization.
//
// Fakes exists, mkdir, read, write, remove, rename, and stat over an in-memory
// string map, providing the storage seam used by loadData / persistData.

export interface MemoryVault {
    readonly files: Record<string, string>;
    readonly renames: [string, string][];
    readonly adapter: {
        exists(p: string): Promise<boolean>;
        mkdir(p: string): Promise<void>;
        read(p: string): Promise<string>;
        write(p: string, raw: string): Promise<void>;
        remove(p: string): Promise<void>;
        rename(from: string, to: string): Promise<void>;
        stat(p: string): Promise<{ mtime: number; size: number } | null>;
    };
    readonly app: {
        readonly vault: {
            readonly adapter: MemoryVault['adapter'];
        };
    };
}

export function createMemoryVault(initialFiles: Record<string, string> = {}): MemoryVault {
    const files: Record<string, string> = { ...initialFiles };
    const renames: [string, string][] = [];

    const adapter = {
        exists: (p: string): Promise<boolean> => Promise.resolve(
            Object.prototype.hasOwnProperty.call(files, p)
            || p === '.obsidian/plugins/workspace-plus-plus'
            || p === '.workspace-plus-plus'
            || p === '.obsidian/plugins/workspace-plus'
        ),
        mkdir: (): Promise<void> => Promise.resolve(),
        read: (p: string): Promise<string> => (
            Object.prototype.hasOwnProperty.call(files, p)
                ? Promise.resolve(files[p]!)
                : Promise.reject(new Error(`missing ${p}`))
        ),
        write: (p: string, raw: string): Promise<void> => {
            files[p] = raw;
            return Promise.resolve();
        },
        remove: (p: string): Promise<void> => {
            delete files[p];
            return Promise.resolve();
        },
        rename: (from: string, to: string): Promise<void> => {
            renames.push([from, to]);
            files[to] = files[from]!;
            delete files[from];
            return Promise.resolve();
        },
        stat: (p: string): Promise<{ mtime: number; size: number } | null> => Promise.resolve(
            Object.prototype.hasOwnProperty.call(files, p)
                ? { mtime: 1000, size: files[p]!.length }
                : null
        ),
    };

    return {
        files,
        renames,
        adapter,
        app: {
            vault: {
                adapter,
            },
        },
    };
}
