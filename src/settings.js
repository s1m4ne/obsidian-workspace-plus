'use strict';

var obsidian = require('obsidian');
var i18n = require('./i18n');
var modals = require('./modals');

// ============================================================
// Group Sessions Modal — checkbox list to toggle session membership
// ============================================================
var GroupSessionsModal = /** @class */ (function (_super) {
    function GroupSessionsModal(app, plugin, group) {
        var _this = _super.call(this, app) || this;
        _this.plugin = plugin;
        _this.group = group;
        return _this;
    }

    GroupSessionsModal.prototype = Object.create(_super.prototype);
    GroupSessionsModal.prototype.constructor = GroupSessionsModal;

    GroupSessionsModal.prototype.onOpen = function () {
        var L = i18n.L;
        var self = this;
        var contentEl = this.contentEl;
        contentEl.empty();
        contentEl.createEl('h3', { text: self.group.name + ' — ' + L.settingsGroupManageSessions });

        var allSessions = self.plugin.getOrderedSessionsUnfiltered();
        var memberIds = self.plugin.getGroupSessionIds(self.group.id);

        for (var i = 0; i < allSessions.length; i++) {
            (function (session) {
                var isMember = memberIds.indexOf(session.id) !== -1;
                new obsidian.Setting(contentEl)
                    .setName(session.name)
                    .addToggle(function (toggle) {
                        toggle.setValue(isMember);
                        toggle.onChange(function (value) {
                            if (value) {
                                self.plugin.addSessionToGroup(session.id, self.group.id);
                            } else {
                                self.plugin.removeSessionFromGroup(session.id, self.group.id);
                            }
                        });
                    });
            })(allSessions[i]);
        }
    };

    GroupSessionsModal.prototype.onClose = function () {
        this.contentEl.empty();
    };

    return GroupSessionsModal;
})(obsidian.Modal);

function applyWarningStyle(btn) {
    if (typeof btn.setWarning === 'function') {
        btn.setWarning();
        return;
    }
    if (btn.buttonEl) {
        btn.buttonEl.addClass('mod-warning');
    }
}

function addToggleSetting(parentEl, options) {
    var setting = new obsidian.Setting(parentEl)
        .setName(options.name);

    if (options.desc) {
        setting.setDesc(options.desc);
    }

    setting.addToggle(function (toggle) {
        toggle.setValue(!!options.value);
        if (options.disabled && typeof toggle.setDisabled === 'function') {
            toggle.setDisabled(true);
        }
        toggle.onChange(function (value) {
            options.onChange(value);
        });
    });

    return setting;
}

function addDangerResetSetting(parentEl, app, display, options) {
    new obsidian.Setting(parentEl)
        .setName(options.name)
        .setDesc(options.desc)
        .addButton(function (btn) {
            var isRunning = false;
            btn.setButtonText(options.buttonText);
            applyWarningStyle(btn);
            btn.onClick(function () {
                if (isRunning) return;
                var confirmOptions = {
                    confirmText: options.buttonText,
                };
                if (options.confirmHint) {
                    confirmOptions.hint = options.confirmHint;
                }
                new modals.ConfirmModal(app, options.confirmMessage, function () {
                    isRunning = true;
                    btn.setDisabled(true);
                    return options.run()
                        .then(function () {
                            new obsidian.Notice(options.successNotice);
                        })
                        .catch(function () {
                            new obsidian.Notice(options.failureNotice);
                        })
                        .then(function () {
                            isRunning = false;
                            btn.setDisabled(false);
                            display();
                        });
                }, confirmOptions).open();
            });
        });
}

function addAsyncActionSetting(parentEl, options) {
    new obsidian.Setting(parentEl)
        .setName(options.name)
        .setDesc(options.desc)
        .addButton(function (btn) {
            btn.setButtonText(options.buttonText);
            if (options.disabled) {
                btn.setDisabled(true);
            }
            btn.onClick(function () {
                options.run()
                    .then(function () {
                        if (options.onSuccess) options.onSuccess();
                    })
                    .catch(function () {
                        if (options.failureNotice) {
                            new obsidian.Notice(options.failureNotice);
                        }
                    });
            });
        });
}

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

        if (!self.activeTab) self.activeTab = 'general';

        // ── Tab bar ──
        var tabs = [
            { id: 'general', label: L.settingsSectionGeneral },
            { id: 'sessions', label: L.settingsTabSessions },
            { id: 'groups', label: L.settingsSectionGroups },
            { id: 'advanced', label: L.settingsSectionAdvanced },
        ];
        var tabBarEl = containerEl.createDiv({ cls: 'wpp-settings-tab-bar' });
        for (var ti = 0; ti < tabs.length; ti++) {
            (function (tab) {
                var btn = tabBarEl.createEl('button', {
                    text: tab.label,
                    cls: 'wpp-settings-tab' + (tab.id === self.activeTab ? ' is-active' : ''),
                });
                btn.addEventListener('click', function () {
                    self.activeTab = tab.id;
                    self.display();
                });
            })(tabs[ti]);
        }

        var contentEl = containerEl.createDiv({ cls: 'wpp-settings-tab-content' });

        function addSection(title) {
            contentEl.createEl('h3', { text: title, cls: 'wpp-settings-section-title' });
        }

        // ── General tab ──
        if (self.activeTab === 'general') {
            new obsidian.Setting(contentEl)
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

            new obsidian.Setting(contentEl)
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

            addToggleSetting(contentEl, {
                name: L.settingsStatusBarQuickSwitcher,
                desc: L.settingsStatusBarQuickSwitcherDesc,
                value: self.plugin.data.statusBarQuickSwitcher,
                onChange: function (value) {
                    self.plugin.data.statusBarQuickSwitcher = value;
                    self.plugin.persistData();
                },
            });
        }

        // ── Sessions tab ──
        if (self.activeTab === 'sessions') {
            addSection(L.settingsSectionSwitching);

            var autoSaveOnSwitch = self.plugin.isAutoSaveOnSwitchEnabled();
            new obsidian.Setting(contentEl)
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

            addToggleSetting(contentEl, {
                name: L.settingsWarnUnsavedSwitch,
                desc: L.settingsWarnUnsavedSwitchDesc,
                value: self.plugin.isWarnOnUnsavedSwitchEnabled(),
                disabled: autoSaveOnSwitch,
                onChange: function (value) {
                    self.plugin.data.warnOnUnsavedSwitch = value;
                    self.plugin.persistData();
                },
            });

            // Preview before switching — master toggle with nested sub-toggles
            var allOn = !!self.plugin.data.previewNext && !!self.plugin.data.previewPrevious;
            var masterSetting = new obsidian.Setting(contentEl)
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

            addToggleSetting(contentEl, {
                name: L.settingsConfirmDelete,
                desc: L.settingsConfirmDeleteDesc,
                value: self.plugin.data.confirmDeleteByHotkey !== false,
                onChange: function (value) {
                    self.plugin.data.confirmDeleteByHotkey = value;
                    self.plugin.persistData();
                },
            });

            // --- Version History ---
            addSection(L.historyTitle);

            var versionHistoryEnabled = self.plugin.isVersionHistoryEnabled();
            var vhMasterSetting = new obsidian.Setting(contentEl)
                .setName(L.settingsVersionHistoryEnabled)
                .setDesc(L.settingsVersionHistoryEnabledDesc)
                .addToggle(function (toggle) {
                    toggle.setValue(versionHistoryEnabled);
                    toggle.onChange(function (value) {
                        self.plugin.data.versionHistoryEnabled = value;
                        self.plugin.persistData();
                        if (value) {
                            self.plugin.startHistorySnapshotTimer();
                        } else {
                            self.plugin.stopHistorySnapshotTimer();
                        }
                        self.display();
                    });
                });

            vhMasterSetting.settingEl.addClass('wpp-has-nested');
            var vhNestedDiv = vhMasterSetting.settingEl.createDiv({ cls: 'wpp-nested-settings' });

            if (self.plugin.isAutoSaveOnSwitchEnabled()) {
                new obsidian.Setting(vhNestedDiv)
                    .setName(L.settingsVersionHistoryInterval)
                    .setDesc(L.settingsVersionHistoryIntervalDesc)
                    .addDropdown(function (dropdown) {
                        dropdown.addOption('1', '1');
                        dropdown.addOption('2', '2');
                        dropdown.addOption('5', '5');
                        dropdown.addOption('10', '10');
                        dropdown.addOption('15', '15');
                        dropdown.addOption('30', '30');
                        dropdown.setValue(String(self.plugin.getVersionHistorySnapshotInterval()));
                        if (!versionHistoryEnabled) dropdown.setDisabled(true);
                        dropdown.onChange(function (value) {
                            self.plugin.data.versionHistorySnapshotInterval = parseInt(value, 10);
                            self.plugin.persistData();
                            self.plugin.startHistorySnapshotTimer();
                        });
                    });
            }

            addToggleSetting(vhNestedDiv, {
                name: L.settingsVersionHistoryCtrlRmb,
                desc: L.settingsVersionHistoryCtrlRmbDesc,
                value: self.plugin.isVersionHistoryCtrlRmbEnabled(),
                disabled: !versionHistoryEnabled,
                onChange: function (value) {
                    self.plugin.data.versionHistoryCtrlRmbRestore = value;
                    self.plugin.persistData();
                },
            });

            addToggleSetting(vhNestedDiv, {
                name: L.settingsVersionHistoryConfirmRestore,
                desc: L.settingsVersionHistoryConfirmRestoreDesc,
                value: self.plugin.isVersionHistoryConfirmRestoreEnabled(),
                disabled: !versionHistoryEnabled,
                onChange: function (value) {
                    self.plugin.data.versionHistoryConfirmRestore = value;
                    self.plugin.persistData();
                },
            });
        }

        // ── Groups tab ──
        if (self.activeTab === 'groups') {
            addToggleSetting(contentEl, {
                name: L.settingsSectionGroups,
                desc: L.settingsSectionGroupsDesc,
                value: self.plugin.isGroupFeatureEnabled(),
                onChange: function (value) {
                    self.plugin.setGroupFeatureEnabled(value).then(function () {
                        self.display();
                    });
                },
            });

            if (self.plugin.isGroupFeatureEnabled()) {
                // Create group
                var createGroupSetting = new obsidian.Setting(contentEl)
                    .setName(L.settingsGroupCreate)
                    .setDesc(L.settingsGroupCreateDesc);

                var groupNameInput = null;
                createGroupSetting.addText(function (text) {
                    groupNameInput = text;
                    text.setPlaceholder(L.settingsGroupCreatePlaceholder);
                });

                createGroupSetting.addButton(function (btn) {
                    btn.setButtonText(L.settingsGroupCreateBtn);
                    btn.onClick(function () {
                        if (!groupNameInput) return;
                        self.plugin.createGroupValidated(groupNameInput.getValue()).then(function (created) {
                            if (!created) return;
                            self.display();
                        });
                    });
                });

                // List existing groups
                var orderedGroups = self.plugin.getOrderedGroups();
                for (var gIdx = 0; gIdx < orderedGroups.length; gIdx++) {
                    (function (group) {
                        var sessionCount = self.plugin.getGroupSessionIds(group.id).length;
                        var groupSetting = new obsidian.Setting(contentEl)
                            .setName(group.name)
                            .setDesc(L.settingsGroupManageSessionsDesc + ' · ' + L.settingsGroupSessionCount(sessionCount));

                        // Manage sessions button
                        groupSetting.addButton(function (btn) {
                            btn.setButtonText(L.settingsGroupManageSessions);
                            btn.onClick(function () {
                                new GroupSessionsModal(self.app, self.plugin, group).open();
                            });
                        });

                        // Rename
                        groupSetting.addExtraButton(function (btn) {
                            btn.setIcon('pencil');
                            btn.setTooltip(L.rename);
                            btn.onClick(function () {
                                new modals.RenameModal(self.app, group.name, function (newName) {
                                    self.plugin.renameGroupValidated(group.id, newName).then(function (renamed) {
                                        if (!renamed) return;
                                        self.display();
                                    });
                                }, {
                                    emptyNotice: L.groupEmptyName,
                                }).open();
                            });
                        });

                        // Delete
                        groupSetting.addExtraButton(function (btn) {
                            btn.setIcon('trash-2');
                            btn.setTooltip(L.settingsGroupDelete);
                            btn.onClick(function () {
                                new modals.ConfirmModal(self.app, L.settingsGroupDeleteConfirm(group.name), function () {
                                    self.plugin.deleteGroup(group.id).then(function () {
                                        self.display();
                                    });
                                }).open();
                            });
                        });
                    })(orderedGroups[gIdx]);
                }
            }
        }

        // ── Advanced tab ──
        if (self.activeTab === 'advanced') {
            addSection(L.settingsAdvancedStorageSubsection);

            var useLocalSettings = self.plugin.isUsingLocalSettings();

            addToggleSetting(contentEl, {
                name: L.settingsUseLocalSettings,
                desc: L.settingsUseLocalSettingsDesc,
                value: useLocalSettings,
                onChange: function (value) {
                    self.plugin.setUseLocalSettings(value, { notify: true })
                        .then(function () {
                            self.display();
                        })
                        .catch(function () {
                            new obsidian.Notice(L.localSettingsOperationFailed);
                            self.display();
                        });
                },
            });

            addAsyncActionSetting(contentEl, {
                name: L.settingsCopyGlobalToLocal,
                desc: L.settingsCopyGlobalToLocalDesc,
                buttonText: L.settingsCopyGlobalToLocalBtn,
                disabled: !useLocalSettings,
                run: function () {
                    return self.plugin.copyGlobalSettingsToLocal({ notify: true });
                },
                onSuccess: function () {
                    self.display();
                },
                failureNotice: L.localSettingsOperationFailed,
            });

            addAsyncActionSetting(contentEl, {
                name: L.settingsResetLocalSettings,
                desc: L.settingsResetLocalSettingsDesc,
                buttonText: L.settingsResetLocalSettingsBtn,
                disabled: !useLocalSettings,
                run: function () {
                    return self.plugin.resetLocalSettings({ notify: true });
                },
                onSuccess: function () {
                    self.display();
                },
                failureNotice: L.localSettingsOperationFailed,
            });

            addSection(L.settingsAdvancedTransferSubsection);

            new obsidian.Setting(contentEl)
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

            new obsidian.Setting(contentEl)
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

            addSection(L.settingsSectionReset);

            addDangerResetSetting(contentEl, self.app, function () {
                self.display();
            }, {
                name: L.settingsResetSettings,
                desc: L.settingsResetSettingsDesc,
                buttonText: L.settingsResetSettingsBtn,
                confirmMessage: L.confirmResetSettings,
                run: function () {
                    return self.plugin.resetSettingsToDefault();
                },
                successNotice: L.resetSettingsDone,
                failureNotice: L.resetSettingsFailed,
            });

            addDangerResetSetting(contentEl, self.app, function () {
                self.display();
            }, {
                name: L.settingsResetSessions,
                desc: L.settingsResetSessionsDesc,
                buttonText: L.settingsResetSessionsBtn,
                confirmMessage: L.confirmResetSessions,
                confirmHint: L.resetSessionsHint,
                run: function () {
                    return self.plugin.resetSessionsToDefault();
                },
                successNotice: L.resetSessionsDone,
                failureNotice: L.resetSessionsFailed,
            });

            addDangerResetSetting(contentEl, self.app, function () {
                self.display();
            }, {
                name: L.settingsResetSessionsAndSettings,
                desc: L.settingsResetSessionsAndSettingsDesc,
                buttonText: L.settingsResetSessionsAndSettingsBtn,
                confirmMessage: L.confirmResetSessionsAndSettings,
                run: function () {
                    return self.plugin.resetSessionsAndSettingsToDefault();
                },
                successNotice: L.resetSessionsAndSettingsDone,
                failureNotice: L.resetSessionsAndSettingsFailed,
            });

            // Developer tools
            addSection(L.settingsDeveloperSection);

            var diagnosticsInfo = self.plugin.getStorageDiagnosticsInfo();
            var diagnosticsUpdatedText = '';
            try {
                diagnosticsUpdatedText = new Date(diagnosticsInfo.updatedAt).toLocaleString();
            } catch (e) {
                diagnosticsUpdatedText = String(diagnosticsInfo.updatedAt);
            }

            var devCardEl = contentEl.createDiv({ cls: 'wpp-dev-card' });
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
        }

        // ── Footer (all tabs) ──
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
