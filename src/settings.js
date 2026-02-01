'use strict';

var obsidian = require('obsidian');
var i18n = require('./i18n');

// ============================================================
// Settings Tab
// ============================================================
var WorkspacePlusPlusSettingTab = /** @class */ (function (_super) {
    function WorkspacePlusPlusSettingTab(app, plugin) {
        var _this = _super.call(this, app, plugin) || this;
        _this.plugin = plugin;
        return _this;
    }

    WorkspacePlusPlusSettingTab.prototype = Object.create(_super.prototype);
    WorkspacePlusPlusSettingTab.prototype.constructor = WorkspacePlusPlusSettingTab;

    WorkspacePlusPlusSettingTab.prototype.display = function () {
        var L = i18n.L;
        var self = this;
        var containerEl = this.containerEl;
        containerEl.empty();

        new obsidian.Setting(containerEl)
            .setName(L.settingsHotkeys)
            .addButton(function (btn) {
                btn.setButtonText(L.settingsHotkeysBtn);
                btn.onClick(function () {
                    self.app.setting.openTabById('hotkeys');
                    var sc = self.app.setting.activeTab.searchComponent;
                    sc.setValue('Workspace++');
                    sc.inputEl.dispatchEvent(new Event('input'));
                });
            });

        new obsidian.Setting(containerEl)
            .setName(L.settingsLanguage)
            .setDesc(L.settingsLanguageDesc)
            .addDropdown(function (dropdown) {
                dropdown.addOption('auto', L.settingsLangAuto);
                var order = i18n.LANG_ORDER;
                for (var i = 0; i < order.length; i++) {
                    dropdown.addOption(order[i], i18n.LANG_OPTIONS[order[i]]);
                }
                dropdown.setValue(self.plugin.data.language || 'auto');
                dropdown.onChange(function (value) {
                    self.plugin.data.language = value;
                    i18n.resolveLocale(value);
                    self.plugin.persistData();
                    self.display();
                });
            });

        new obsidian.Setting(containerEl)
            .setName(L.settingsConfirmDelete)
            .setDesc(L.settingsConfirmDeleteDesc)
            .addToggle(function (toggle) {
                toggle.setValue(self.plugin.data.confirmDeleteByHotkey !== false);
                toggle.onChange(function (value) {
                    self.plugin.data.confirmDeleteByHotkey = value;
                    self.plugin.persistData();
                });
            });

        // Preview before switching — master toggle with nested sub-toggles
        var allOn = !!self.plugin.data.previewNext && !!self.plugin.data.previewPrevious;
        var masterSetting = new obsidian.Setting(containerEl)
            .setName(L.settingsPreviewHeading)
            .setDesc(L.settingsPreviewDesc)
            .addToggle(function (toggle) {
                toggle.setValue(allOn);
                toggle.onChange(function (value) {
                    self.plugin.data.previewNext = value;
                    self.plugin.data.previewPrevious = value;
                    self.plugin.persistData();
                    self.display();
                });
            });

        masterSetting.settingEl.addClass('wpp-has-nested');
        var nestedDiv = masterSetting.settingEl.createDiv({ cls: 'wpp-nested-settings' });

        new obsidian.Setting(nestedDiv)
            .setName(L.settingsPreviewNext)
            .addToggle(function (toggle) {
                toggle.setValue(!!self.plugin.data.previewNext);
                toggle.onChange(function (value) {
                    self.plugin.data.previewNext = value;
                    self.plugin.persistData();
                    self.display();
                });
            });

        new obsidian.Setting(nestedDiv)
            .setName(L.settingsPreviewPrevious)
            .addToggle(function (toggle) {
                toggle.setValue(!!self.plugin.data.previewPrevious);
                toggle.onChange(function (value) {
                    self.plugin.data.previewPrevious = value;
                    self.plugin.persistData();
                    self.display();
                });
            });

        var footerEl = containerEl.createDiv();
        footerEl.style.fontSize = '12px';
        footerEl.style.color = 'var(--text-faint)';
        footerEl.style.marginTop = '24px';

        var helpEl = footerEl.createEl('p', { text: L.settingsTranslationHelp });
        helpEl.style.margin = '0 0 4px';

        var linkEl = footerEl.createEl('a', {
            text: 'GitHub',
            href: 'https://github.com/s1m4ne/obsidian-workspace-plus',
        });
    };

    return WorkspacePlusPlusSettingTab;
})(obsidian.PluginSettingTab);

exports.WorkspacePlusPlusSettingTab = WorkspacePlusPlusSettingTab;
