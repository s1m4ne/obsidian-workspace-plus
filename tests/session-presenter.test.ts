import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';
import type { SessionItem } from '../src/storage/default-data.ts';

const harness = setupHarness();

const {
    isSessionActive,
    isDefaultSession,
    formatSessionHotkey,
    formatSessionModified,
    deriveSessionPresentation,
} = await import('../src/ui/shared/session-presenter.ts');

test('session-presenter: isSessionActive', () => {
    const session = { id: 's-1' };
    assert.equal(isSessionActive(session, 's-1'), true);
    assert.equal(isSessionActive(session, 's-2'), false);
    assert.equal(isSessionActive(session, null), false);
    assert.equal(isSessionActive(session, undefined), false);
});

test('session-presenter: isDefaultSession', () => {
    const defaultDifferentName = { id: 's-1', name: 'Work', isDefault: true };
    assert.equal(isDefaultSession(defaultDifferentName, 'Default'), true);

    const defaultSameName = { id: 's-1', name: 'Default', isDefault: true };
    assert.equal(isDefaultSession(defaultSameName, 'Default'), false);

    const nonDefault = { id: 's-1', name: 'Custom', isDefault: false };
    assert.equal(isDefaultSession(nonDefault, 'Default'), false);
});

test('session-presenter: formatSessionHotkey', () => {
    // Custom hotkey takes precedence
    assert.equal(formatSessionHotkey(0, 'Cmd+1'), 'Cmd+1');
    assert.equal(formatSessionHotkey(3, 'Ctrl+Alt+4'), 'Ctrl+Alt+4');

    // Index fallback (1-based string)
    assert.equal(formatSessionHotkey(0, ''), '1');
    assert.equal(formatSessionHotkey(4, undefined), '5');
    assert.equal(formatSessionHotkey(9, null), '10');

    // Undefined or negative index
    assert.equal(formatSessionHotkey(undefined, undefined), '');
    assert.equal(formatSessionHotkey(-1, ''), '');
});

test('session-presenter: formatSessionModified', () => {
    assert.equal(formatSessionModified(null), '');
    assert.equal(formatSessionModified(undefined), '');

    const now = Date.now();
    const formatted = formatSessionModified(now - 1000 * 60); // 1 minute ago
    assert.ok(typeof formatted === 'string' && formatted.length > 0);
});

test('session-presenter: deriveSessionPresentation derives all fields', () => {
    const session: SessionItem = {
        id: 'session-123',
        name: 'Project Alpha',
        isDefault: true,
        modified: Date.now() - 5000,
        layout: {},
    };

    const presentation = deriveSessionPresentation(session, {
        activeSessionId: 'session-123',
        index: 0,
        commandHotkey: 'Mod+1',
        defaultSessionName: 'Default',
    });

    assert.equal(presentation.id, 'session-123');
    assert.equal(presentation.name, 'Project Alpha');
    assert.equal(presentation.isActive, true);
    assert.equal(presentation.isDefault, true);
    assert.equal(presentation.hotkeyText, 'Mod+1');
    assert.ok(presentation.modifiedText.length > 0);
});

test('session-presenter: deriveSessionPresentation respects orderIndex over index', () => {
    const session: SessionItem = {
        id: 'session-456',
        name: 'Project Beta',
        isDefault: false,
        layout: {},
    };

    const presentation = deriveSessionPresentation(session, {
        activeSessionId: 'other-session',
        index: 1,
        orderIndex: 5,
        commandHotkey: '',
    });

    assert.equal(presentation.id, 'session-456');
    assert.equal(presentation.name, 'Project Beta');
    assert.equal(presentation.isActive, false);
    assert.equal(presentation.isDefault, false);
    assert.equal(presentation.hotkeyText, '6');
});

test.after(() => harness.restore());
