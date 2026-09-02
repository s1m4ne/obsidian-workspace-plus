// StatusBarController and statusbar-actions reach production wiring and update the status bar element.

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';
import { DEFAULT_DATA } from '../src/storage/default-data.ts';

const harness = setupHarness();
const { createRealPlugin } = await import('./real-plugin.ts');
const { setupStatusBar } = await import('../src/statusbar-controller.ts');

function createPlugin(): ReturnType<typeof createRealPlugin> {
    const plugin = createRealPlugin({
        data: {
            ...DEFAULT_DATA,
            sessions: { s1: { id: 's1', name: 'Work Session', layout: {} } },
            sessionOrder: ['s1'],
            activeSessionId: 's1',
            groups: { g1: { id: 'g1', name: 'Project Group', sessionIds: ['s1'] } },
            groupOrder: ['g1'],
            sessionGroups: { s1: ['g1'] },
            activeGroupId: 'g1',
            groupFeatureEnabled: true,
        },
    });

    // Obsidian hands back an element carrying its own DOM helpers; jsdom's does
    // not, so the ones the controller uses are added here.
    plugin.addStatusBarItem = (): HTMLElement => {
        const doc = harness.dom.document;
        const el = doc.createElement('div');
        Object.assign(el, {
            addClass: (cls: string) => el.classList.add(cls),
            removeClass: (cls: string) => el.classList.remove(cls),
            empty: () => { el.innerHTML = ''; },
            createSpan: (opts?: { text?: string; cls?: string }) => {
                const span = doc.createElement('span');
                if (opts?.cls) span.className = opts.cls;
                if (opts?.text) span.textContent = opts.text;
                el.appendChild(span);
                return span;
            },
        });
        return el;
    };

    return plugin;
}

interface StatusBarControllerSurface {
    setupStatusBar(): HTMLElement;
    updateStatusBar(): void;
    scrollDelta: number;
    scrollEventAt: number;
    scrollSwitchAt: number;
}

test('StatusBarController sets up status bar element and renders active session and group name', async () => {
    const plugin = createPlugin();
    const el = setupStatusBar(plugin as unknown as import('../src/statusbar-controller.ts').StatusBarControllerHost);

    assert.ok(el, 'status bar element created');
    assert.ok(el.classList.contains('wpp-status-bar'), 'element has wpp-status-bar class');

    const spans = el.querySelectorAll('span');
    assert.ok(spans.length >= 3, 'contains icon, group, separator, and name spans');
    const texts = Array.from(spans).map((s) => s.textContent);
    assert.ok(texts.includes('Project Group'), 'contains active group name');
    assert.ok(texts.includes('Work Session'), 'contains active session name');

    // The three mirrored counters are gone from the plugin: nothing read them,
    // and a getter-only accessor is what once made onunload throw before it
    // could flush. They live on the controller, which is the one that has them.
    const ctrl = (plugin.getStatusBarController as () => StatusBarControllerSurface)();
    assert.ok(ctrl);
    assert.equal(ctrl.scrollDelta, 0);
    assert.equal(ctrl.scrollEventAt, 0);
    assert.equal(ctrl.scrollSwitchAt, 0);
    ctrl.setupStatusBar();
    ctrl.updateStatusBar();
});

test.after(() => harness.restore());
