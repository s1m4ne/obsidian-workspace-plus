'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { installObsidianStub } = require('./lock/harness/index.ts');

installObsidianStub();

const i18n = require('../src/i18n.ts');
i18n.resolveLocale('en');

const { PersistenceService } = require('../src/storage/persistence-service.ts');
const DEFAULT_DATA = require('../src/plugin/default-data');

// Keys that are intentionally persisted outside SETTINGS_KEYS / SESSION_KEYS.
// sessionStorageLocation is written explicitly by persistGlobalSettings() because
// its value comes from getSessionStorageLocation(), not from this.data.
const PERSISTED_ELSEWHERE = ['sessionStorageLocation'];

function createService(initialData) {
    const data = Object.assign({}, DEFAULT_DATA, initialData || {});
    return { service: new PersistenceService({ data }), data };
}

test('restoreSidebars survives the settings extract used when persisting', function () {
    const { service, data } = createService({ restoreSidebars: false });

    const settings = service.extractSettingsData(data);

    assert.equal(
        settings.restoreSidebars,
        false,
        'restoreSidebars must be extracted so persistGlobalSettings() writes it to data.json'
    );
});

test('restoreSidebars round-trips through extract and default merge', function () {
    const { service, data } = createService({ restoreSidebars: false });

    // Persist path: only extractSettingsData() output reaches data.json.
    const saved = service.extractSettingsData(data);

    // Load path: main.js merges DEFAULT_DATA with whatever was saved.
    const reloaded = Object.assign({}, DEFAULT_DATA, saved);

    assert.equal(
        reloaded.restoreSidebars,
        false,
        'restoreSidebars must stay off after a restart'
    );
});

test('every default data key is covered by the settings or session key list', function () {
    const { service, data } = createService();

    const persisted = Object.assign(
        {},
        service.extractSettingsData(data),
        service.extractSessionData(data)
    );

    const uncovered = Object.keys(DEFAULT_DATA).filter(function (key) {
        return !(key in persisted) && PERSISTED_ELSEWHERE.indexOf(key) === -1;
    });

    assert.deepEqual(
        uncovered,
        [],
        'keys in DEFAULT_DATA must be added to SETTINGS_KEYS or SESSION_KEYS, '
            + 'otherwise they are silently dropped on save and reset to the default on load'
    );
});
