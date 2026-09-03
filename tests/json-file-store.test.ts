import test from 'node:test';
import assert from 'node:assert/strict';
import { JsonFileStore, type StorageAdapter } from '../src/storage/json-file-store.ts';

class MemoryStorageAdapter implements StorageAdapter {
    private readonly files: Map<string, string> = new Map();
    private readonly mtimes: Map<string, number> = new Map();
    private readonly dirs: Set<string> = new Set();

    async exists(path: string): Promise<boolean> {
        return this.files.has(path) || this.dirs.has(path);
    }

    async read(path: string): Promise<string> {
        const content = this.files.get(path);
        if (content === undefined) throw new Error(`File not found: ${path}`);
        return content;
    }

    async write(path: string, data: string): Promise<void> {
        this.files.set(path, data);
        this.mtimes.set(path, Date.now());
    }

    async remove(path: string): Promise<void> {
        this.files.delete(path);
        this.mtimes.delete(path);
        this.dirs.delete(path);
    }

    async rename(fromPath: string, toPath: string): Promise<void> {
        const content = this.files.get(fromPath);
        if (content !== undefined) {
            this.files.set(toPath, content);
            this.files.delete(fromPath);
            const mtime = this.mtimes.get(fromPath) ?? Date.now();
            this.mtimes.set(toPath, mtime);
            this.mtimes.delete(fromPath);
        }
    }

    async mkdir(path: string): Promise<void> {
        this.dirs.add(path);
    }

    async stat(path: string): Promise<{ mtime: number } | null> {
        const mtime = this.mtimes.get(path);
        return mtime !== undefined ? { mtime } : null;
    }
}

test('json file store: readJsonIfExists handles non-existent, valid, and invalid JSON', async () => {
    const adapter = new MemoryStorageAdapter();
    const store = new JsonFileStore(adapter);

    const nonExistent = await store.readJsonIfExists('missing.json');
    assert.equal(nonExistent.exists, false);
    assert.equal(nonExistent.data, null);
    assert.equal(nonExistent.error, null);

    await store.writeJson('valid.json', { a: 1, b: 'test' });
    const valid = await store.readJsonIfExists<{ a: number; b: string }>('valid.json');
    assert.equal(valid.exists, true);
    assert.deepEqual(valid.data, { a: 1, b: 'test' });
    assert.equal(valid.error, null);

    await adapter.write('corrupt.json', '{ bad json');
    const corrupt = await store.readJsonIfExists('corrupt.json');
    assert.equal(corrupt.exists, true);
    assert.equal(corrupt.data, null);
    assert.ok(corrupt.error instanceof Error);
});

test('json file store: writeJson formats pretty when requested', async () => {
    const adapter = new MemoryStorageAdapter();
    const store = new JsonFileStore(adapter);

    await store.writeJson('compact.json', { a: 1 });
    assert.equal(await adapter.read('compact.json'), '{"a":1}');

    await store.writeJson('pretty.json', { a: 1 }, true);
    assert.equal(await adapter.read('pretty.json'), '{\n  "a": 1\n}');
});

test('json file store: directory, rename, remove and mtime operations work cleanly', async () => {
    const adapter = new MemoryStorageAdapter();
    const store = new JsonFileStore(adapter);

    await store.ensureDir('my-dir');
    assert.equal(await adapter.exists('my-dir'), true);

    await store.writeJson('file1.json', { value: 42 });
    const mtime = await store.getFileMtime('file1.json');
    assert.ok(mtime > 0);

    await store.renameIfExists('file1.json', 'file2.json');
    assert.equal(await adapter.exists('file1.json'), false);
    assert.equal(await adapter.exists('file2.json'), true);

    await store.removeIfExists('file2.json');
    assert.equal(await adapter.exists('file2.json'), false);

    // Safe when removing/renaming non-existent files
    await store.removeIfExists('non-existent.json');
    await store.renameIfExists('non-existent.json', 'nowhere.json');
});
