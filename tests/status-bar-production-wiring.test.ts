// StatusBarController and statusbar-actions reach production wiring and update the status bar element.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';
import { DEFAULT_DATA } from '../src/storage/default-data.ts';

const harness = setupHarness();
const { setupStatusBar } = await import('../src/statusbar-controller.ts');

interface TestPlugin {
    data: Record<string, unknown>;
    statusBarEl?: HTMLElement;
    addStatusBarItem(): HTMLElement;
    updateStatusBar(): void;
    getActiveSession(): { id: string; name: string } | null;
    getActiveGroup(): { id: string; name: string } | null;
    shouldShowUnsavedStatusBarHighlight(): boolean;
    getStatusBarController(): {
        setupStatusBar(): HTMLElement;
        updateStatusBar(): void;
        scrollDelta: number;
        scrollEventAt: number;
        scrollSwitchAt: number;
    };
    [key: string]: unknown;
}

async function createPlugin(): Promise<TestPlugin> {
    const modules = await Promise.all([
        import('../src/plugin/methods/session-statusbar.js'),
        import('../src/plugin/methods/sessions.js'),
        import('../src/plugin/methods/session-store-getter.js'),
        import('../src/plugin/methods/session-saving.js'),
        import('../src/plugin/methods/history.js'),
        import('../src/plugin/methods/groups.js'),
    ]);

    function PluginMock(this: unknown) {}
    for (const mod of modules) {
        const attach = ((mod as { default?: unknown }).default ?? mod) as (target: unknown) => void;
        attach(PluginMock);
    }

    const plugin = new (PluginMock as unknown as new () => TestPlugin)();
    plugin.data = {
        ...DEFAULT_DATA,
        sessions: {
            s1: { id: 's1', name: 'Work Session', layout: {} },
        },
        sessionOrder: ['s1'],
        activeSessionId: 's1',
        groups: {
            g1: { id: 'g1', name: 'Project Group', sessionIds: ['s1'] },
        },
        groupOrder: ['g1'],
        sessionGroups: { s1: ['g1'] },
        activeGroupId: 'g1',
        groupFeatureEnabled: true,
    };

    plugin.addStatusBarItem = function () {
        const doc = harness.dom.document;
        const el = doc.createElement('div');
        (el as unknown as { addClass: (c: string) => void }).addClass = (cls: string) => el.classList.add(cls);
        (el as unknown as { removeClass: (c: string) => void }).removeClass = (cls: string) => el.classList.remove(cls);
        (el as unknown as { empty: () => void }).empty = () => { el.innerHTML = ''; };
        (el as unknown as { createSpan: (opts?: { text?: string; cls?: string }) => HTMLElement }).createSpan = (opts) => {
            const span = doc.createElement('span');
            if (opts?.cls) span.className = opts.cls;
            if (opts?.text) span.textContent = opts.text;
            el.appendChild(span);
            return span;
        };
        return el;
    };

    return plugin;
}

test('StatusBarController sets up status bar element and renders active session and group name', async () => {
    const plugin = await createPlugin();
    const el = setupStatusBar(plugin as unknown as import('../src/statusbar-controller.ts').StatusBarControllerHost);

    assert.ok(el, 'status bar element created');
    assert.ok(el.classList.contains('wpp-status-bar'), 'element has wpp-status-bar class');

    const spans = el.querySelectorAll('span');
    assert.ok(spans.length >= 3, 'contains icon, group, separator, and name spans');
    const texts = Array.from(spans).map((s) => s.textContent);
    assert.ok(texts.includes('Project Group'), 'contains active group name');
    assert.ok(texts.includes('Work Session'), 'contains active session name');

    // Accessors
    assert.equal(plugin.statusBarScrollDelta, 0);
    assert.equal(plugin.statusBarScrollEventAt, 0);
    assert.equal(plugin.statusBarScrollSwitchAt, 0);

    // updateStatusBar on plugin prototype delegates cleanly
    plugin.updateStatusBar();

    const ctrl = plugin.getStatusBarController();
    assert.ok(ctrl);
    assert.equal(ctrl.scrollDelta, 0);
    assert.equal(ctrl.scrollEventAt, 0);
    assert.equal(ctrl.scrollSwitchAt, 0);
    ctrl.setupStatusBar();
    ctrl.updateStatusBar();
});

test.after(() => harness.restore());
