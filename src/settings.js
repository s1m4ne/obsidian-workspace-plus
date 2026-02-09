'use strict';

var obsidian = require('obsidian');
var i18n = require('./i18n');
var modals = require('./modals');

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

        function addSection(title) {
            containerEl.createEl('h3', { text: title, cls: 'wpp-settings-section-title' });
        }

        addSection(L.settingsSectionGeneral);

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
            .setName(L.settingsHotkeys)
            .addButton(function (btn) {
                btn.setButtonText(L.settingsHotkeysBtn);
                btn.onClick(function () {
                    self.app.setting.openTabById('hotkeys');
                    var sc = self.app.setting.activeTab.searchComponent;
                    var pluginName = (self.plugin.manifest && self.plugin.manifest.name)
                        ? self.plugin.manifest.name
                        : 'Workspace++';
                    sc.setValue(pluginName);
                    sc.inputEl.dispatchEvent(new Event('input'));
                });
            });

        addSection(L.settingsSectionSwitching);

        var autoSaveOnSwitch = self.plugin.isAutoSaveOnSwitchEnabled();
        new obsidian.Setting(containerEl)
            .setName(L.settingsAutoSaveOnSwitch)
            .setDesc(L.settingsAutoSaveOnSwitchDesc)
            .addToggle(function (toggle) {
                toggle.setValue(autoSaveOnSwitch);
                toggle.onChange(function (value) {
                    self.plugin.setAutoSaveOnSwitch(value).then(function () {
                        self.display();
                    });
                });
            });

        new obsidian.Setting(containerEl)
            .setName(L.settingsWarnUnsavedSwitch)
            .setDesc(L.settingsWarnUnsavedSwitchDesc)
            .addToggle(function (toggle) {
                toggle.setValue(self.plugin.isWarnOnUnsavedSwitchEnabled());
                if (toggle.setDisabled) {
                    toggle.setDisabled(autoSaveOnSwitch);
                }
                toggle.onChange(function (value) {
                    self.plugin.data.warnOnUnsavedSwitch = value;
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

        addSection(L.settingsSectionDeletion);

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

        addSection(L.settingsSectionReset);

        new obsidian.Setting(containerEl)
            .setName(L.settingsResetSettings)
            .setDesc(L.settingsResetSettingsDesc)
            .addButton(function (btn) {
                var isResetting = false;
                btn.setButtonText(L.settingsResetSettingsBtn);
                if (typeof btn.setWarning === 'function') {
                    btn.setWarning();
                } else if (btn.buttonEl) {
                    btn.buttonEl.addClass('mod-warning');
                }
                btn.onClick(function () {
                    if (isResetting) return;
                    new modals.ConfirmModal(self.app, L.confirmResetSettings, function () {
                        isResetting = true;
                        btn.setDisabled(true);
                        return self.plugin.resetSettingsToDefault()
                            .then(function () {
                                new obsidian.Notice(L.resetSettingsDone);
                            })
                            .catch(function () {
                                new obsidian.Notice(L.resetSettingsFailed);
                            })
                            .then(function () {
                                isResetting = false;
                                btn.setDisabled(false);
                                self.display();
                            });
                    }, {
                        confirmText: L.settingsResetSettingsBtn,
                    }).open();
                });
            });

        new obsidian.Setting(containerEl)
            .setName(L.settingsResetSessions)
            .setDesc(L.settingsResetSessionsDesc)
            .addButton(function (btn) {
                var isResetting = false;
                btn.setButtonText(L.settingsResetSessionsBtn);
                if (typeof btn.setWarning === 'function') {
                    btn.setWarning();
                } else if (btn.buttonEl) {
                    btn.buttonEl.addClass('mod-warning');
                }
                btn.onClick(function () {
                    if (isResetting) return;
                    new modals.ConfirmModal(self.app, L.confirmResetSessions, function () {
                        isResetting = true;
                        btn.setDisabled(true);
                        return self.plugin.resetSessionsToDefault()
                            .then(function () {
                                new obsidian.Notice(L.resetSessionsDone);
                            })
                            .catch(function () {
                                new obsidian.Notice(L.resetSessionsFailed);
                            })
                            .then(function () {
                                isResetting = false;
                                btn.setDisabled(false);
                                self.display();
                            });
                    }, {
                        hint: L.resetSessionsHint,
                        confirmText: L.settingsResetSessionsBtn,
                    }).open();
                });
            });

        new obsidian.Setting(containerEl)
            .setName(L.settingsResetSessionsAndSettings)
            .setDesc(L.settingsResetSessionsAndSettingsDesc)
            .addButton(function (btn) {
                var isResetting = false;
                btn.setButtonText(L.settingsResetSessionsAndSettingsBtn);
                if (typeof btn.setWarning === 'function') {
                    btn.setWarning();
                } else if (btn.buttonEl) {
                    btn.buttonEl.addClass('mod-warning');
                }
                btn.onClick(function () {
                    if (isResetting) return;
                    new modals.ConfirmModal(self.app, L.confirmResetSessionsAndSettings, function () {
                        isResetting = true;
                        btn.setDisabled(true);
                        return self.plugin.resetSessionsAndSettingsToDefault()
                            .then(function () {
                                new obsidian.Notice(L.resetSessionsAndSettingsDone);
                            })
                            .catch(function () {
                                new obsidian.Notice(L.resetSessionsAndSettingsFailed);
                            })
                            .then(function () {
                                isResetting = false;
                                btn.setDisabled(false);
                                self.display();
                            });
                    }, {
                        confirmText: L.settingsResetSessionsAndSettingsBtn,
                    }).open();
                });
            });

        var useLocalSettings = self.plugin.isUsingLocalSettings();
        var advancedDetailsEl = containerEl.createEl('details', { cls: 'wpp-advanced-details' });
        advancedDetailsEl.createEl('summary', {
            text: L.settingsSectionAdvanced,
            cls: 'wpp-advanced-summary',
        });
        var advancedBodyEl = advancedDetailsEl.createDiv({ cls: 'wpp-advanced-body' });

        advancedBodyEl.createEl('h3', {
            text: L.settingsAdvancedStorageSubsection,
            cls: 'wpp-settings-section-title wpp-advanced-subsection-title',
        });

        new obsidian.Setting(advancedBodyEl)
            .setName(L.settingsUseLocalSettings)
            .setDesc(L.settingsUseLocalSettingsDesc)
            .addToggle(function (toggle) {
                toggle.setValue(useLocalSettings);
                toggle.onChange(function (value) {
                    self.plugin.setUseLocalSettings(value, { notify: true })
                        .then(function () {
                            self.display();
                        })
                        .catch(function () {
                            new obsidian.Notice(L.localSettingsOperationFailed);
                            self.display();
                        });
                });
            });

        new obsidian.Setting(advancedBodyEl)
            .setName(L.settingsCopyGlobalToLocal)
            .setDesc(L.settingsCopyGlobalToLocalDesc)
            .addButton(function (btn) {
                btn.setButtonText(L.settingsCopyGlobalToLocalBtn);
                btn.setDisabled(!useLocalSettings);
                btn.onClick(function () {
                    self.plugin.copyGlobalSettingsToLocal({ notify: true })
                        .then(function () {
                            self.display();
                        })
                        .catch(function () {
                            new obsidian.Notice(L.localSettingsOperationFailed);
                        });
                });
            });

        new obsidian.Setting(advancedBodyEl)
            .setName(L.settingsResetLocalSettings)
            .setDesc(L.settingsResetLocalSettingsDesc)
            .addButton(function (btn) {
                btn.setButtonText(L.settingsResetLocalSettingsBtn);
                btn.setDisabled(!useLocalSettings);
                btn.onClick(function () {
                    self.plugin.resetLocalSettings({ notify: true })
                        .then(function () {
                            self.display();
                        })
                        .catch(function () {
                            new obsidian.Notice(L.localSettingsOperationFailed);
                        });
                });
            });

        advancedBodyEl.createEl('h3', {
            text: L.settingsAdvancedTransferSubsection,
            cls: 'wpp-settings-section-title wpp-advanced-subsection-title',
        });

        new obsidian.Setting(advancedBodyEl)
            .setName(L.settingsExportSessions)
            .setDesc(L.settingsExportSessionsDesc)
            .addButton(function (btn) {
                btn.setButtonText(L.settingsExportSessionsBtn);
                btn.onClick(function () {
                    self.plugin.exportSessionsSnapshot().catch(function () {
                        new obsidian.Notice(L.exportSessionsFailed);
                    });
                });
            });

        new obsidian.Setting(advancedBodyEl)
            .setName(L.settingsImportSessions)
            .setDesc(L.settingsImportSessionsDesc)
            .addButton(function (btn) {
                btn.setButtonText(L.settingsImportSessionsBtn);
                btn.onClick(function () {
                    new modals.ConfirmModal(self.app, L.confirmImportSessions, function () {
                        return self.plugin.importSessionsFromLatestExport().catch(function () {
                            new obsidian.Notice(L.importSessionsFailed);
                        });
                    }, {
                        confirmText: L.settingsImportSessionsBtn,
                    }).open();
                });
            });

        var diagnosticsInfo = self.plugin.getStorageDiagnosticsInfo();
        var diagnosticsUpdatedText = '';
        try {
            diagnosticsUpdatedText = new Date(diagnosticsInfo.updatedAt).toLocaleString();
        } catch (e) {
            diagnosticsUpdatedText = String(diagnosticsInfo.updatedAt);
        }

        var devDetailsEl = containerEl.createEl('details', { cls: 'wpp-dev-details' });
        devDetailsEl.createEl('summary', {
            text: L.settingsDeveloperSection,
            cls: 'wpp-dev-summary',
        });
        var devBodyEl = devDetailsEl.createDiv({ cls: 'wpp-dev-body' });
        var devCardEl = devBodyEl.createDiv({ cls: 'wpp-dev-card' });
        devCardEl.createDiv({
            text: L.settingsStorageDiagnostics,
            cls: 'wpp-dev-card-title',
        });
        devCardEl.createDiv({
            text: L.settingsStorageDiagnosticsDesc,
            cls: 'wpp-dev-card-desc',
        });

        function addDevCardRow(label, value, options) {
            options = options || {};
            var row = devCardEl.createDiv({ cls: 'wpp-dev-card-row' });
            row.createDiv({ text: label, cls: 'wpp-dev-card-label' });
            row.createDiv({
                text: String(value),
                cls: options.code ? 'wpp-dev-card-value wpp-dev-card-value-code' : 'wpp-dev-card-value',
            });
        }

        addDevCardRow(L.settingsStorageFieldSessions, diagnosticsInfo.sessionsPath, { code: true });
        addDevCardRow(L.settingsStorageFieldSessionsBackup, diagnosticsInfo.sessionsBackupPath, { code: true });
        addDevCardRow(L.settingsStorageFieldLocalSettings, diagnosticsInfo.localSettingsPath, { code: true });
        addDevCardRow(L.settingsStorageFieldGlobalSettings, diagnosticsInfo.globalSettingsPath, { code: true });
        addDevCardRow(L.settingsStorageFieldSessionCount, diagnosticsInfo.sessionCount);
        addDevCardRow(L.settingsStorageFieldUpdatedAt, diagnosticsUpdatedText);

        var footerEl = containerEl.createDiv();
        footerEl.style.fontSize = '12px';
        footerEl.style.color = 'var(--text-faint)';
        footerEl.style.marginTop = '24px';

        var helpEl = footerEl.createEl('p', { text: L.settingsTranslationHelp });
        helpEl.style.margin = '0 0 4px';

        footerEl.createEl('a', {
            text: L.settingsGitHubLink,
            href: 'https://github.com/s1m4ne/obsidian-workspace-plus',
        });
    };

    return WorkspacePlusPlusSettingTab;
})(obsidian.PluginSettingTab);

exports.WorkspacePlusPlusSettingTab = WorkspacePlusPlusSettingTab;
