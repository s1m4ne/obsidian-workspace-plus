import { type Setting } from 'obsidian';
import type { SettingDefinitionPage, SettingGroupItem } from 'obsidian';
import { L, formatString, text } from '../i18n.ts';
import { ConfirmModal } from '../modals/confirm-modal.ts';
import { RenameModal } from '../modals/rename-modal.ts';
import type { SessionGroup } from '../storage/default-data.ts';
import type { SettingsContext } from '../settings-tab.ts';

/**
 * Session groups: the feature toggle, and the groups themselves.
 *
 * The groups are a `list`, which is what they are: entries the user adds,
 * renames, reorders and deletes. Three of those four affordances now come from
 * the list rather than from this file - the `+` in the header, the delete
 * button with its Delete key, and the drag handle whose reorder used to be a
 * hand-written pointer-event module. Rename stays a per-row button, because a
 * list has no notion of one.
 */

function createGroup(ctx: SettingsContext): void {
    new RenameModal(ctx.app, '', (name: string) => {
        void ctx.plugin.getGroupStore().createGroupValidated(name).then((created) => {
            if (created) ctx.update();
        });
    }, {
        title: text(L.settingsGroupCreate),
        placeholder: text(L.settingsGroupCreatePlaceholder),
        buttonText: text(L.settingsGroupCreateBtn),
        emptyNotice: text(L.groupEmptyName),
    }).open();
}

function renameGroup(ctx: SettingsContext, group: SessionGroup): void {
    new RenameModal(ctx.app, group.name, (newName: string) => {
        void ctx.plugin.getGroupStore().renameGroupValidated(group.id, newName).then((renamed) => {
            if (renamed) ctx.update();
        });
    }, { emptyNotice: text(L.groupEmptyName) }).open();
}

function groupRow(ctx: SettingsContext, group: SessionGroup): SettingGroupItem {
    const sessionCount = ctx.plugin.getGroupStore().getGroupSessionIds(group.id).length;
    return {
        name: group.name,
        // The description used to lead with "Add or remove sessions from this
        // group", which named a button that is gone: membership is changed by
        // dragging a session onto a group tab, or from a session's context
        // menu. The count is what is left worth saying.
        desc: formatString(L.settingsGroupSessionCount, sessionCount),
        // Group names are the user's own words and they come and go.
        searchable: false,
        render: (setting: Setting) => {
            setting.addExtraButton((btn) => {
                btn.setIcon('pencil');
                btn.setTooltip(text(L.rename));
                btn.onClick(() => { renameGroup(ctx, group); });
            });
        },
    };
}

export function groupsPage(ctx: SettingsContext): SettingDefinitionPage {
    const store = ctx.plugin.getGroupStore();
    const enabled = store.isGroupFeatureEnabled();
    const groups = enabled ? store.getOrderedGroups() : [];

    const items: SettingGroupItem[] = groups.map((group) => groupRow(ctx, group));

    return {
        type: 'page',
        name: text(L.settingsSectionGroups),
        desc: text(L.settingsSectionGroupsDesc),
        items: [
            {
                type: 'group',
                items: [{
                    name: text(L.settingsSectionGroups),
                    desc: text(L.settingsSectionGroupsDesc),
                    control: { type: 'toggle', key: 'groupFeatureEnabled' },
                }],
            },
            {
                type: 'list',
                heading: text(L.settingsGroupCreate),
                visible: () => store.isGroupFeatureEnabled(),
                addItem: {
                    name: text(L.settingsGroupCreateBtn),
                    action: () => { createGroup(ctx); },
                },
                onDelete: (index) => {
                    const group = groups[index];
                    if (!group) return;
                    new ConfirmModal(
                        ctx.app,
                        formatString(L.settingsGroupDeleteConfirm, group.name),
                        () => {
                            void store.deleteGroup(group.id).then(() => { ctx.update(); });
                        },
                    ).open();
                },
                onReorder: (from, to) => {
                    const order = groups.map((group) => group.id);
                    const [moved] = order.splice(from, 1);
                    if (!moved) return;
                    order.splice(to, 0, moved);
                    void store.setGroupTabOrder(order).then(() => { ctx.update(); });
                },
                items,
            },
        ],
    };
}
