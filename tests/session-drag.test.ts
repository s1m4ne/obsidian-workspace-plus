import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHarness } from './lock/harness/index.ts';

const harness = setupHarness();

const {
    findHoveredGroupTab,
    updateGroupDropTargets,
    clearGroupDropTargets,
    attachSessionDrag,
} = await import('../src/ui/shared/session-drag.ts');

test('session-drag: findHoveredGroupTab and drop target helpers', () => {
    const container = document.createElement('div');
    const tab1 = document.createElement('div');
    tab1.className = 'wpp-group-tab';
    tab1.dataset['groupId'] = 'g1';
    // Stub bounding rect
    tab1.getBoundingClientRect = () => ({
        left: 10,
        right: 100,
        top: 10,
        bottom: 40,
        width: 90,
        height: 30,
        x: 10,
        y: 10,
        toJSON: () => {},
    });

    const tab2 = document.createElement('div');
    tab2.className = 'wpp-group-tab';
    tab2.dataset['groupId'] = 'g2';
    tab2.getBoundingClientRect = () => ({
        left: 110,
        right: 200,
        top: 10,
        bottom: 40,
        width: 90,
        height: 30,
        x: 110,
        y: 10,
        toJSON: () => {},
    });

    container.appendChild(tab1);
    container.appendChild(tab2);

    // Hit test tab1
    const hit1 = findHoveredGroupTab(container, 50, 20);
    assert.equal(hit1, tab1);

    // Hit test tab2
    const hit2 = findHoveredGroupTab(container, 150, 20);
    assert.equal(hit2, tab2);

    // Miss
    const miss = findHoveredGroupTab(container, 300, 300);
    assert.equal(miss, null);

    // Update targets
    const hovered = updateGroupDropTargets(container, 50, 20);
    assert.equal(hovered, tab1);
    assert.equal(tab1.classList.contains('wpp-group-drop-target'), true);
    assert.equal(tab2.classList.contains('wpp-group-drop-target'), false);

    // Clear targets
    clearGroupDropTargets(container);
    assert.equal(tab1.classList.contains('wpp-group-drop-target'), false);
});

test('session-drag: attachSessionDrag reorder flow', () => {
    const listEl = document.createElement('div');
    const item1 = document.createElement('div');
    item1.className = 'wpp-session-item';
    item1.dataset['sessionId'] = 's1';
    item1.getBoundingClientRect = () => ({
        left: 0,
        right: 200,
        top: 0,
        bottom: 50,
        width: 200,
        height: 50,
        x: 0,
        y: 0,
        toJSON: () => {},
    });

    const item2 = document.createElement('div');
    item2.className = 'wpp-session-item';
    item2.dataset['sessionId'] = 's2';
    item2.getBoundingClientRect = () => ({
        left: 0,
        right: 200,
        top: 50,
        bottom: 100,
        width: 200,
        height: 50,
        x: 0,
        y: 50,
        toJSON: () => {},
    });

    listEl.appendChild(item1);
    listEl.appendChild(item2);

    let committedOrder: string[] = [];
    attachSessionDrag({
        itemEl: item1,
        listEl,
        itemSelector: '.wpp-session-item',
        bodyDraggingClass: 'wpp-session-list-dragging',
        onReorder: (order) => {
            committedOrder = order;
        },
    });

    // Mousedown
    item1.dispatchEvent(new window.MouseEvent('mousedown', { button: 0, clientX: 10, clientY: 10 }));

    // Small delta (no drag)
    document.dispatchEvent(new window.MouseEvent('mousemove', { clientX: 12, clientY: 12 }));
    assert.equal(document.body.classList.contains('wpp-session-list-dragging'), false);

    // Large delta (initiates drag)
    document.dispatchEvent(new window.MouseEvent('mousemove', { clientX: 10, clientY: 80 }));
    assert.equal(document.body.classList.contains('wpp-session-list-dragging'), true);
    assert.equal(item1.classList.contains('is-dragging'), true);

    // Mouseup commits reorder
    document.dispatchEvent(new window.MouseEvent('mouseup', { clientX: 10, clientY: 80 }));
    assert.equal(document.body.classList.contains('wpp-session-list-dragging'), false);
    assert.equal(item1.classList.contains('is-dragging'), false);
    assert.deepEqual(committedOrder, ['s2', 's1']);
});

test('session-drag: attachSessionDrag drop on group and All tabs', () => {
    const listEl = document.createElement('div');
    const item1 = document.createElement('div');
    item1.className = 'wpp-session-item';
    item1.dataset['sessionId'] = 's1';
    item1.getBoundingClientRect = () => ({
        left: 0,
        right: 200,
        top: 0,
        bottom: 50,
        width: 200,
        height: 50,
        x: 0,
        y: 0,
        toJSON: () => {},
    });
    listEl.appendChild(item1);

    const groupTabsContainer = document.createElement('div');
    const allTab = document.createElement('div');
    allTab.className = 'wpp-group-tab';
    allTab.dataset['groupId'] = '__all__';
    allTab.getBoundingClientRect = () => ({
        left: 0,
        right: 80,
        top: 0,
        bottom: 30,
        width: 80,
        height: 30,
        x: 0,
        y: 0,
        toJSON: () => {},
    });

    const workTab = document.createElement('div');
    workTab.className = 'wpp-group-tab';
    workTab.dataset['groupId'] = 'g-work';
    workTab.getBoundingClientRect = () => ({
        left: 90,
        right: 170,
        top: 0,
        bottom: 30,
        width: 80,
        height: 30,
        x: 90,
        y: 0,
        toJSON: () => {},
    });

    groupTabsContainer.appendChild(allTab);
    groupTabsContainer.appendChild(workTab);

    let droppedGroup: { session: string; group: string } | null = null;
    let droppedAllSession: string | null = null;

    attachSessionDrag({
        itemEl: item1,
        listEl,
        groupTabsContainer,
        onDropOnGroup: (s, g) => {
            droppedGroup = { session: s, group: g };
        },
        onDropOnAllGroup: (s) => {
            droppedAllSession = s;
        },
    });

    // 1. Drop on workTab
    item1.dispatchEvent(new window.MouseEvent('mousedown', { button: 0, clientX: 10, clientY: 10 }));
    document.dispatchEvent(new window.MouseEvent('mousemove', { clientX: 120, clientY: 15 }));
    document.dispatchEvent(new window.MouseEvent('mouseup', { clientX: 120, clientY: 15 }));
    assert.deepEqual(droppedGroup, { session: 's1', group: 'g-work' });

    // 2. Drop on allTab
    item1.dispatchEvent(new window.MouseEvent('mousedown', { button: 0, clientX: 10, clientY: 10 }));
    document.dispatchEvent(new window.MouseEvent('mousemove', { clientX: 30, clientY: 15 }));
    document.dispatchEvent(new window.MouseEvent('mouseup', { clientX: 30, clientY: 15 }));
    assert.equal(droppedAllSession, 's1');
});

test.after(() => harness.restore());
