'use strict';

var obsidian = require('obsidian');
var i18n = require('./i18n');
var ConfirmModal = require('./modals/confirm-modal');
var RenameModal = require('./modals/rename-modal');

function openCreateGroupPrompt(app, plugin, onCreated) {
    var L = i18n.L;
    new RenameModal(app, '', function (name) {
        plugin.createGroupValidated(name).then(function (created) {
            if (!created) return;
            if (typeof onCreated === 'function') onCreated();
        });
    }, {
        title: L.groupCreateNew,
        placeholder: L.groupCreatePlaceholder,
        buttonText: L.save,
        emptyNotice: L.groupEmptyName,
    }).open();
}

function openRenameGroupPrompt(app, plugin, group, onRenamed) {
    var L = i18n.L;
    new RenameModal(app, group.name, function (newName) {
        plugin.renameGroupValidated(group.id, newName).then(function (renamed) {
            if (!renamed) return;
            if (typeof onRenamed === 'function') onRenamed();
        });
    }, {
        title: L.groupContextRename,
        emptyNotice: L.groupEmptyName,
    }).open();
}

function attachGroupTabDrag(tabEl, tabsContainerEl, options) {
    options = options || {};
    tabEl.addEventListener('mousedown', function (e) {
        if (e.button !== 0) return;
        if (options.stopPropagationOnMouseDown) {
            e.stopPropagation();
        }

        var startX = e.clientX;
        var dragStarted = false;
        var cloneEl = null;

        function startDrag(ev) {
            dragStarted = true;
            var rect = tabEl.getBoundingClientRect();
            cloneEl = tabEl.cloneNode(true);
            cloneEl.classList.add('wpp-drag-clone');
            cloneEl.style.position = 'fixed';
            cloneEl.style.width = rect.width + 'px';
            cloneEl.style.height = rect.height + 'px';
            cloneEl.style.top = rect.top + 'px';
            cloneEl.style.left = (ev.clientX - (startX - rect.left)) + 'px';
            cloneEl.style.zIndex = '10000';
            cloneEl.style.pointerEvents = 'none';
            document.body.appendChild(cloneEl);
            tabEl.classList.add('is-dragging');
            cloneEl._offsetX = startX - rect.left;
        }

        function onMove(ev) {
            if (!dragStarted) {
                if (Math.abs(ev.clientX - startX) < 5) return;
                startDrag(ev);
            }
            cloneEl.style.left = (ev.clientX - cloneEl._offsetX) + 'px';

            var tabs = tabsContainerEl.querySelectorAll('.wpp-group-tab');
            var placed = false;
            for (var ti = 0; ti < tabs.length; ti++) {
                var sibling = tabs[ti];
                if (sibling === tabEl) continue;
                var r = sibling.getBoundingClientRect();
                if (ev.clientX < r.left + r.width / 2) {
                    tabsContainerEl.insertBefore(tabEl, sibling);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                var addBtnEl = tabsContainerEl.querySelector('.wpp-group-add-btn');
                if (addBtnEl) {
                    tabsContainerEl.insertBefore(tabEl, addBtnEl);
                } else {
                    tabsContainerEl.appendChild(tabEl);
                }
            }
        }

        function onUp() {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            if (!dragStarted) return;
            cloneEl.remove();
            tabEl.classList.remove('is-dragging');

            var tabs = tabsContainerEl.querySelectorAll('.wpp-group-tab');
            var newOrder = [];
            for (var ti = 0; ti < tabs.length; ti++) {
                newOrder.push(tabs[ti].dataset.groupId);
            }
            if (typeof options.onCommit === 'function') {
                options.onCommit(newOrder);
            }
        }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    });
}

function renderGroupTabs(options) {
    var L = i18n.L;
    options = options || {};
    var plugin = options.plugin;
    var containerEl = options.containerEl;
    if (!plugin || !containerEl) return;

    while (containerEl.firstChild) containerEl.removeChild(containerEl.firstChild);

    var app = options.app || plugin.app;
    var groups = options.groups || plugin.data.groups || {};
    var groupOrder = options.groupOrder || plugin.getOrderedGroupTabIds();
    var selectedGroupId = options.selectedGroupId || null;

    function setupGroupTabDrag(tabEl) {
        if (!options.onGroupOrderCommit) return;
        attachGroupTabDrag(tabEl, containerEl, {
            stopPropagationOnMouseDown: !!options.stopPropagationOnMouseDown,
            onCommit: function (newOrder) {
                options.onGroupOrderCommit(newOrder);
            },
        });
    }

    for (var gi = 0; gi < groupOrder.length; gi++) {
        var gid = groupOrder[gi];

        if (gid === '__all__') {
            var allTab = document.createElement('div');
            allTab.className = 'wpp-group-tab';
            allTab.dataset.groupId = '__all__';
            if (!selectedGroupId) allTab.classList.add('is-active');
            allTab.textContent = L.groupAll;
            allTab.addEventListener('click', function () {
                if (typeof options.onSelectGroup === 'function') {
                    options.onSelectGroup(null);
                }
            });
            allTab.addEventListener('contextmenu', function (e) {
                e.preventDefault();
                openAllGroupsTabContextMenu({
                    app: app,
                    plugin: plugin,
                    event: e,
                    onResetViewGroup: options.onResetViewGroup,
                    onGroupsChanged: options.onGroupsChanged,
                    onSessionsChanged: options.onSessionsChanged,
                });
            });
            setupGroupTabDrag(allTab);
            containerEl.appendChild(allTab);
            continue;
        }

        var group = groups[gid];
        if (!group) continue;

        (function (currentGroup) {
            var tab = document.createElement('div');
            tab.className = 'wpp-group-tab';
            tab.dataset.groupId = currentGroup.id;
            if (selectedGroupId === currentGroup.id) tab.classList.add('is-active');
            tab.textContent = currentGroup.name;
            tab.addEventListener('click', function () {
                if (typeof options.onSelectGroup === 'function') {
                    options.onSelectGroup(currentGroup.id);
                }
            });
            tab.addEventListener('contextmenu', function (e) {
                e.preventDefault();
                openGroupTabContextMenu({
                    app: app,
                    plugin: plugin,
                    event: e,
                    group: currentGroup,
                    onDeleteGroup: options.onDeleteGroup,
                    onGroupsChanged: options.onGroupsChanged,
                    onSessionsChanged: options.onSessionsChanged,
                });
            });
            setupGroupTabDrag(tab);
            containerEl.appendChild(tab);
        })(group);
    }

    var addBtn = document.createElement('div');
    addBtn.className = 'wpp-group-add-btn';
    obsidian.setIcon(addBtn, 'plus');
    if (options.addButtonTooltip) {
        obsidian.setTooltip(addBtn, options.addButtonTooltip, {
            placement: options.addButtonTooltipPlacement || 'bottom',
            delay: options.addButtonTooltipDelay || 250,
        });
    }
    addBtn.addEventListener('click', function () {
        if (typeof options.onAddGroupClick === 'function') {
            options.onAddGroupClick();
            return;
        }
        openCreateGroupPrompt(app, plugin, options.onGroupsChanged);
    });
    containerEl.appendChild(addBtn);
}

function openAllGroupsTabContextMenu(options) {
    var L = i18n.L;
    options = options || {};
    var plugin = options.plugin;
    var app = options.app || (plugin ? plugin.app : null);
    if (!plugin || !app) return;

    var menu = new obsidian.Menu();
    menu.addItem(function (mi) {
        mi.setTitle(L.groupCreateNew);
        mi.setIcon('plus');
        mi.onClick(function () {
            openCreateGroupPrompt(app, plugin, options.onGroupsChanged);
        });
    });

    var allGroups = plugin.getOrderedGroups();
    if (allGroups.length > 0) {
        menu.addSeparator();
        menu.addItem(function (mi) {
            mi.setTitle(L.contextDeleteAllGroups);
            mi.setIcon('folder-x');
            mi.setSection('danger');
            mi.onClick(function () {
                new ConfirmModal(app, L.confirmDeleteAllGroups(allGroups.length), function () {
                    return plugin.clearAllGroups().then(function () {
                        if (typeof options.onResetViewGroup === 'function') {
                            options.onResetViewGroup();
                        }
                        new obsidian.Notice(L.deletedAllGroups(allGroups.length));
                        if (typeof options.onGroupsChanged === 'function') {
                            options.onGroupsChanged();
                        }
                        if (typeof options.onSessionsChanged === 'function') {
                            options.onSessionsChanged();
                        }
                    });
                }).open();
            });
        });
    }

    var sessionCount = Object.keys(plugin.data.sessions || {}).length;
    if (sessionCount > 1) {
        if (allGroups.length === 0) menu.addSeparator();
        menu.addItem(function (mi) {
            mi.setTitle(L.contextDeleteAllSessions);
            mi.setIcon('trash-2');
            mi.setSection('danger');
            mi.onClick(function () {
                new ConfirmModal(app, L.confirmDeleteAllSessions(sessionCount - 1), function () {
                    return plugin.deleteAllInactiveSessions().then(function (deletedCount) {
                        if (typeof options.onGroupsChanged === 'function') {
                            options.onGroupsChanged();
                        }
                        if (typeof options.onSessionsChanged === 'function') {
                            options.onSessionsChanged();
                        }
                        if (deletedCount > 0) {
                            new obsidian.Notice(L.deletedAllSessions(deletedCount));
                        }
                    });
                }).open();
            });
        });
    }

    if (options.event) {
        menu.showAtMouseEvent(options.event);
    }
}

function openGroupTabContextMenu(options) {
    var L = i18n.L;
    options = options || {};
    var plugin = options.plugin;
    var app = options.app || (plugin ? plugin.app : null);
    var group = options.group;
    if (!plugin || !app || !group) return;

    var menu = new obsidian.Menu();
    menu.addItem(function (mi) {
        mi.setTitle(L.groupContextRename);
        mi.setIcon('pencil');
        mi.onClick(function () {
            openRenameGroupPrompt(app, plugin, group, options.onGroupsChanged);
        });
    });

    var groupSessionIds = plugin.getGroupSessionIds(group.id);
    if (groupSessionIds.length > 0) {
        menu.addItem(function (mi) {
            mi.setTitle(L.groupRemoveAllSessions);
            mi.setIcon('log-out');
            mi.onClick(function () {
                new ConfirmModal(app, L.confirmRemoveAllFromGroup(group.name, groupSessionIds.length), function () {
                    return plugin.removeAllSessionsFromGroup(group.id).then(function () {
                        new obsidian.Notice(L.groupRemovedAllSessions(group.name));
                        if (typeof options.onGroupsChanged === 'function') {
                            options.onGroupsChanged();
                        }
                        if (typeof options.onSessionsChanged === 'function') {
                            options.onSessionsChanged();
                        }
                    });
                }, {
                    confirmText: L.remove,
                    confirmClass: 'mod-cta',
                }).open();
            });
        });
    }

    menu.addSeparator();
    menu.addItem(function (mi) {
        mi.setTitle(L.groupContextDelete);
        mi.setIcon('trash-2');
        mi.setSection('danger');
        mi.onClick(function () {
            new ConfirmModal(app, L.confirmDeleteGroup(group.name), function () {
                return plugin.deleteGroup(group.id).then(function () {
                    if (typeof options.onDeleteGroup === 'function') {
                        options.onDeleteGroup(group.id);
                    }
                    if (typeof options.onGroupsChanged === 'function') {
                        options.onGroupsChanged();
                    }
                    if (typeof options.onSessionsChanged === 'function') {
                        options.onSessionsChanged();
                    }
                });
            }).open();
        });
    });

    if (options.event) {
        menu.showAtMouseEvent(options.event);
    }
}

module.exports = {
    attachGroupTabDrag: attachGroupTabDrag,
    openAllGroupsTabContextMenu: openAllGroupsTabContextMenu,
    openCreateGroupPrompt: openCreateGroupPrompt,
    openGroupTabContextMenu: openGroupTabContextMenu,
    renderGroupTabs: renderGroupTabs,
};
