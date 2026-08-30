// The lock suite is only as trustworthy as this harness, so the harness gets
// tested first: every element extension against the standard DOM behaviour it
// stands in for, and every recording stub against what a lock will ask of it.

import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { setupHarness } from './harness/index.ts';
import { Menu, Modal, Notice, Setting, setIcon, setTooltip } from './harness/obsidian-module.ts';

function withHarness(fn: (h: ReturnType<typeof setupHarness>) => void): void {
    const harness = setupHarness();
    try {
        fn(harness);
    } finally {
        harness.restore();
    }
}

test('createEl appends a tagged child and applies cls and text', () => {
    withHarness((h) => {
        const root = h.dom.container();
        const el = root.createEl('button', { cls: 'wpp-icon-btn', text: 'Save' });

        assert.equal(el.tagName, 'BUTTON');
        assert.equal(el.parentElement, root);
        assert.ok(el.classList.contains('wpp-icon-btn'));
        assert.equal(el.textContent, 'Save');
    });
});

test('createEl accepts a bare string as the class', () => {
    withHarness((h) => {
        const el = (h.dom.container()).createEl('div', 'wpp-row');
        assert.equal(el.className, 'wpp-row');
    });
});

test('createEl applies attr, including the accessibility attributes already in use', () => {
    withHarness((h) => {
        const el = (h.dom.container()).createEl('div', {
            cls: 'wpp-icon-btn',
            attr: { role: 'button', tabindex: '-1', 'data-action-key': 'rename' },
        });
        assert.equal(el.getAttribute('role'), 'button');
        assert.equal(el.getAttribute('tabindex'), '-1');
        assert.equal(el.getAttribute('data-action-key'), 'rename');
    });
});

test('createEl runs the callback with the created element', () => {
    withHarness((h) => {
        let seen: HTMLElement | null = null;
        const el = (h.dom.container()).createEl('div', undefined, (created) => {
            seen = created;
        });
        assert.equal(seen, el);
    });
});

test('createDiv and createSpan produce the right tags', () => {
    withHarness((h) => {
        const root = h.dom.container();
        assert.equal(root.createDiv().tagName, 'DIV');
        assert.equal(root.createSpan({ text: 'x' }).tagName, 'SPAN');
    });
});

test('multiple classes are accepted as an array and as a space-separated string', () => {
    withHarness((h) => {
        const root = h.dom.container();
        const a = root.createEl('div', { cls: ['one', 'two'] });
        const b = root.createEl('div', { cls: 'three four' });
        assert.deepEqual([...a.classList], ['one', 'two']);
        assert.deepEqual([...b.classList], ['three', 'four']);
    });
});

test('empty removes every child, and detach removes the element itself', () => {
    withHarness((h) => {
        const root = h.dom.container();
        root.createDiv();
        root.createDiv();
        assert.equal(root.childNodes.length, 2);
        root.empty();
        assert.equal(root.childNodes.length, 0);

        const child = root.createDiv();
        child.detach();
        assert.equal(root.childNodes.length, 0);
    });
});

test('addClass, removeClass, setText and appendText match the DOM they stand in for', () => {
    withHarness((h) => {
        const el = h.dom.container();
        el.addClass('a', 'b');
        assert.deepEqual([...el.classList], ['a', 'b']);
        el.removeClass('a');
        assert.deepEqual([...el.classList], ['b']);

        el.setText('hello');
        assert.equal(el.textContent, 'hello');
        el.appendText(' world');
        assert.equal(el.textContent, 'hello world');
    });
});

test('activeDocument and activeWindow are the installed document', () => {
    withHarness((h) => {
        const scope = globalThis as unknown as { activeDocument: Document; activeWindow: Window };
        assert.equal(scope.activeDocument, h.dom.document);
        assert.equal(scope.activeWindow, h.dom.window);
    });
});

test('the harness restores the globals it replaced', () => {
    const scope = globalThis as unknown as Record<string, unknown>;
    const before = scope.document;
    const harness = setupHarness();
    assert.notEqual(scope.document, before);
    harness.restore();
    assert.equal(scope.document, before);
});

test('the obsidian specifier resolves to the stubs, for import and for require', async () => {
    const harness = setupHarness();
    try {
        // Loaded dynamically: hooks are installed by setupHarness, and a static
        // import would have been resolved before that ran. Locks load the code
        // under test the same way, which is also what makes them survive the
        // migration from require() to import.
        const esm: unknown = await import('obsidian');
        assert.equal((esm as { Notice: unknown }).Notice, Notice);

        const cjs: unknown = createRequire(import.meta.url)('obsidian');
        assert.equal((cjs as { Notice: unknown }).Notice, Notice);
    } finally {
        harness.restore();
    }
});

test('Setting records its calls in order and keeps the handlers it was given', () => {
    withHarness((h) => {
        const container = h.dom.container();

        let toggled: boolean | null = null;
        new Setting(container)
            .setName('Auto-save on switch')
            .setDesc('Save the current layout before switching')
            .addToggle((toggle) => {
                toggle.setValue(true).onChange((value) => {
                    toggled = value;
                });
            });

        assert.deepEqual(h.obsidian.log.lines(), [
            'Setting[0].setName(Auto-save on switch)',
            'Setting[0].setDesc(Save the current layout before switching)',
            'Setting[0].addToggle()',
            'Setting[0].toggle.setValue(true)',
        ]);

        // The handler is retained, so a lock can prove what the control does.
        const toggle = h.obsidian.settings[0]?.components[0] as { trigger(v: boolean): unknown };
        toggle.trigger(false);
        assert.equal(toggled, false);
    });
});

test('Menu records items and exposes their handlers by title', () => {
    withHarness((h) => {
        let clicked = false;

        new Menu()
            .addItem((item) => item.setTitle('Rename').setIcon('pencil').onClick(() => { clicked = true; }))
            .addSeparator()
            .addItem((item) => item.setTitle('Delete').setIcon('trash'))
            .showAtMouseEvent();

        const menu = h.obsidian.menus[0];
        assert.equal(menu?.items.length, 2);
        assert.equal(menu?.shown, true);
        menu?.item('Rename')?.trigger();
        assert.equal(clicked, true);
        assert.equal(menu?.item('Delete')?.icon, 'trash');
    });
});

test('Notice raises are recorded in order', () => {
    withHarness((h) => {
        new Notice('Loaded Writing');
        new Notice('Saved', 1200);

        assert.deepEqual(h.obsidian.notices.map((n) => n.message), ['Loaded Writing', 'Saved']);
        assert.equal(h.obsidian.notices[1]?.durationMs, 1200);
    });
});

test('Modal wires open and close to onOpen and onClose', () => {
    withHarness((h) => {
        const order: string[] = [];

        class Probe extends Modal {
            override onOpen(): void {
                order.push('open');
                this.contentEl.createDiv({ text: 'body' });
            }
            override onClose(): void {
                order.push('close');
            }
        }

        const modal = new Probe({});
        modal.open();
        assert.deepEqual(order, ['open']);
        assert.equal(modal.contentEl.textContent, 'body');
        assert.equal(h.dom.document.querySelectorAll('.modal-container').length, 1);

        modal.close();
        assert.deepEqual(order, ['open', 'close']);
        assert.equal(h.dom.document.querySelectorAll('.modal-container').length, 0);
    });
});

test('setIcon and setTooltip are observable on the element', () => {
    withHarness((h) => {
        const el = h.dom.container();
        setIcon(el, 'x');
        setTooltip(el, 'Close');

        assert.equal(h.obsidian.icons.get(el), 'x');
        assert.equal(el.getAttribute('data-icon'), 'x');
        assert.equal(el.getAttribute('data-tooltip'), 'Close');
    });
});
