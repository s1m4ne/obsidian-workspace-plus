import test from 'node:test';
import assert from 'node:assert/strict';
import {
    STORAGE_DIR,
    SESSION_STORAGE_VAULT,
    SESSION_STORAGE_PLUGIN,
    SESSIONS_FILE_NAME,
    PLUGIN_DATA_FILE_NAME,
    SESSIONS_BACKUP_FILE_NAME,
    HISTORY_FILE_NAME,
    joinPath,
    normalizeSessionStorageLocation,
    getPluginStorageDirPath,
} from '../src/storage/paths.ts';
import {
    DEFAULT_DATA,
    SETTINGS_KEYS,
    SESSION_KEYS,
} from '../src/storage/default-data.ts';

test('storage paths: constants match expected values', () => {
    assert.equal(STORAGE_DIR, '.workspace-plus-plus');
    assert.equal(SESSION_STORAGE_VAULT, 'vault-folder');
    assert.equal(SESSION_STORAGE_PLUGIN, 'plugin-folder');
    assert.equal(SESSIONS_FILE_NAME, 'sessions.json');
    assert.equal(PLUGIN_DATA_FILE_NAME, 'data.json');
    assert.equal(SESSIONS_BACKUP_FILE_NAME, 'sessions.backup.json');
    assert.equal(HISTORY_FILE_NAME, 'history.json');
});

test('storage paths: joinPath normalizes slashes cleanly', () => {
    assert.equal(joinPath('a', 'b'), 'a/b');
    assert.equal(joinPath('a/', 'b'), 'a/b');
    assert.equal(joinPath('a', '/b'), 'a/b');
    assert.equal(joinPath('a/', '/b'), 'a/b');
    assert.equal(joinPath('', 'b'), 'b');
    assert.equal(joinPath('a', ''), 'a');
    assert.equal(joinPath(null, 'b'), 'b');
});

test('storage paths: normalizeSessionStorageLocation accepts only valid locations', () => {
    assert.equal(normalizeSessionStorageLocation('plugin-folder'), 'plugin-folder');
    assert.equal(normalizeSessionStorageLocation('vault-folder'), 'vault-folder');
    assert.equal(normalizeSessionStorageLocation('other'), null);
    assert.equal(normalizeSessionStorageLocation(null), null);
    assert.equal(normalizeSessionStorageLocation(undefined), null);
});

test('storage paths: getPluginStorageDirPath respects manifest dir and custom config dir', () => {
    assert.equal(getPluginStorageDirPath('custom/dir', '.custom-config'), 'custom/dir');
    assert.equal(getPluginStorageDirPath(null, '.my-config'), '.my-config/plugins/workspace-plus-plus');
    assert.equal(getPluginStorageDirPath(null, null), 'plugins/workspace-plus-plus');
});

test('storage default-data: DEFAULT_DATA has all expected default keys', () => {
    assert.equal(DEFAULT_DATA.sessionStorageLocation, 'plugin-folder');
    assert.equal(DEFAULT_DATA.language, 'auto');
    assert.equal(DEFAULT_DATA.groupFeatureEnabled, true);
    assert.equal(DEFAULT_DATA.restoreSidebars, true);
    assert.deepEqual(DEFAULT_DATA.sessionOrder, []);
    assert.deepEqual(DEFAULT_DATA.sessions, {});
});

test('storage default-data: SETTINGS_KEYS and SESSION_KEYS do not overlap', () => {
    const settingsSet = new Set<string>(SETTINGS_KEYS);
    for (const key of SESSION_KEYS) {
        assert.equal(settingsSet.has(key), false, `${key} should not be in SETTINGS_KEYS`);
    }
});
