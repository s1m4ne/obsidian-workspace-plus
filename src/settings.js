'use strict';

var obsidian = require('obsidian');
var i18n = require('./i18n');
var modals = require('./modals');
var formatRelativeTime = require('./modals/format-relative-time');
var statusBarActions = require('./statusbar-actions');
var settingsUi = require('./settings-ui');

var GroupSessionsModal = settingsUi.GroupSessionsModal;
var resolveSettingText = settingsUi.resolveSettingText;
var addToggleSetting = settingsUi.addToggleSetting;
var addDropdownSetting = settingsUi.addDropdownSetting;
var addSubsection = settingsUi.addSubsection;
var addDangerResetSetting = settingsUi.addDangerResetSetting;
var addAsyncActionSetting = settingsUi.addAsyncActionSetting;

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
            contentEl.createEl('h3', { text: resolveSettingText(title), cls: 'wpp-settings-section-title' });
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
                        self.plugin.setLanguageSetting(value).then(function () {
                            self.display();
                        });
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

            // ── Status bar click actions ──
            addSection(L.settingsSectionStatusBar);

            var slotKeys = statusBarActions.SLOT_KEYS;
            var actionIds = statusBarActions.ACTION_IDS;
            var slotLabelMap = {
                click: 'statusBarSlotClick',
                altClick: 'statusBarSlotAltClick',
                modClick: 'statusBarSlotModClick',
                shiftClick: 'statusBarSlotShiftClick',
                middleClick: 'statusBarSlotMiddleClick',
                altMiddleClick: 'statusBarSlotAltMiddleClick',
                modMiddleClick: 'statusBarSlotModMiddleClick',
                shiftMiddleClick: 'statusBarSlotShiftMiddleClick',
                rightClick: 'statusBarSlotRightClick',
                altRightClick: 'statusBarSlotAltRightClick',
                modRightClick: 'statusBarSlotModRightClick',
                shiftRightClick: 'statusBarSlotShiftRightClick',
            };

            for (var si = 0; si < slotKeys.length; si++) {
                (function (slotKey) {
                    var labelKey = slotLabelMap[slotKey];
                    var slotLabel = typeof L[labelKey] === 'function' ? L[labelKey]() : L[labelKey];
                    new obsidian.Setting(contentEl)
                        .setName(slotLabel)
                        .addDropdown(function (dropdown) {
                            for (var ai = 0; ai < actionIds.length; ai++) {
                                var aid = actionIds[ai];
                                dropdown.addOption(aid, statusBarActions.getActionLabel(L, aid));
                            }
                            dropdown.setValue((self.plugin.data.statusBarActions || {})[slotKey] || 'none');
                            dropdown.onChange(function (value) {
                                self.plugin.setStatusBarAction(slotKey, value);
                            });
                        });
                })(slotKeys[si]);
            }
        }

        // ── Sessions tab ──
        if (self.activeTab === 'sessions') {
            addSubsection(contentEl, L.settingsSubsectionAutoSaveMode);

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

            if (!autoSaveOnSwitch) {
                addToggleSetting(contentEl, {
                    name: L.settingsWarnUnsavedSwitch,
                    desc: L.settingsWarnUnsavedSwitchDesc,
                    value: self.plugin.isWarnOnUnsavedSwitchEnabled(),
                    onChange: function (value) {
                        self.plugin.setWarnOnUnsavedSwitch(value);
                    },
                });

                addToggleSetting(contentEl, {
                    name: L.settingsHighlightUnsavedSessionChanges,
                    desc: L.settingsHighlightUnsavedSessionChangesDesc,
                    value: self.plugin.isUnsavedStatusBarHighlightEnabled(),
                    onChange: function (value) {
                        self.plugin.setUnsavedStatusBarHighlight(value);
                    },
                });

                addToggleSetting(contentEl, {
                    name: L.settingsConfirmQuickActions,
                    desc: L.settingsConfirmQuickActionsDesc,
                    value: !!self.plugin.data.confirmQuickActions,
                    onChange: function (value) {
                        self.plugin.setConfirmQuickActions(value);
                    },
                });
            }

            addSubsection(contentEl, L.settingsSubsectionScrollSwitch);

            addToggleSetting(contentEl, {
                name: L.settingsStatusBarModScrollSwitch,
                desc: L.settingsStatusBarModScrollSwitchDesc,
                value: !!self.plugin.data.statusBarModScrollSwitch,
                onChange: function (value) {
                    self.plugin.setStatusBarModScrollSwitch(value).then(function () {
                        self.display();
                    });
                },
            });

            if (self.plugin.data.statusBarModScrollSwitch) {
                addDropdownSetting(contentEl, {
                    name: L.settingsStatusBarScrollPreset,
                    desc: L.settingsStatusBarScrollPresetDesc,
                    value: self.plugin.data.statusBarScrollPreset || 'trackpad',
                    items: {
                        trackpad: L.settingsStatusBarScrollPresetTrackpad,
                        notchedWheel: L.settingsStatusBarScrollPresetNotchedWheel,
                        freeSpinWheel: L.settingsStatusBarScrollPresetFreeSpinWheel,
                        custom: L.settingsStatusBarScrollPresetCustom,
                    },
                    onChange: function (value) {
                        self.plugin.setStatusBarScrollPreset(value).then(function () {
                            self.display();
                        });
                    },
                });

                addDropdownSetting(contentEl, {
                    name: L.settingsStatusBarScrollModifier,
                    desc: L.settingsStatusBarScrollModifierDesc,
                    value: self.plugin.data.statusBarScrollModifierMode === 'recommended'
                        ? 'modOrAlt'
                        : (self.plugin.data.statusBarScrollModifierMode || 'none'),
                    items: {
                        none: L.settingsStatusBarScrollModifierNone,
                        modOnly: L.settingsStatusBarScrollModifierModOnly,
                        altOnly: L.settingsStatusBarScrollModifierAltOnly,
                        modOrAlt: L.settingsStatusBarScrollModifierModOrAlt,
                    },
                    onChange: function (value) {
                        self.plugin.setStatusBarScrollModifierMode(value);
                    },
                });

                var useCustomScroll = (self.plugin.data.statusBarScrollPreset || 'trackpad') === 'custom';

                addDropdownSetting(contentEl, {
                    name: L.settingsStatusBarScrollThreshold,
                    desc: L.settingsStatusBarScrollThresholdDesc,
                    value: String(self.plugin.data.statusBarScrollThreshold || 30),
                    disabled: !useCustomScroll,
                    items: {
                        '12': '12',
                        '16': '16',
                        '24': '24',
                        '30': '30',
                        '40': '40',
                        '60': '60',
                        '90': '90',
                    },
                    onChange: function (value) {
                        self.plugin.setStatusBarScrollThreshold(value);
                    },
                });

                addDropdownSetting(contentEl, {
                    name: L.settingsStatusBarScrollCooldown,
                    desc: L.settingsStatusBarScrollCooldownDesc,
                    value: String(self.plugin.data.statusBarScrollCooldownMs || 500),
                    disabled: !useCustomScroll,
                    items: {
                        '200': '200 ms',
                        '350': '350 ms',
                        '500': '500 ms',
                        '750': '750 ms',
                        '1000': '1000 ms',
                    },
                    onChange: function (value) {
                        self.plugin.setStatusBarScrollCooldownMs(value);
                    },
                });

                addDropdownSetting(contentEl, {
                    name: L.settingsStatusBarScrollResetWindow,
                    desc: L.settingsStatusBarScrollResetWindowDesc,
                    value: String(self.plugin.data.statusBarScrollResetMs || 250),
                    disabled: !useCustomScroll,
                    items: {
                        '150': '150 ms',
                        '250': '250 ms',
                        '400': '400 ms',
                        '600': '600 ms',
                    },
                    onChange: function (value) {
                        self.plugin.setStatusBarScrollResetMs(value);
                    },
                });

                addToggleSetting(contentEl, {
                    name: L.settingsStatusBarScrollInvert,
                    desc: L.settingsStatusBarScrollInvertDesc,
                    value: !!self.plugin.data.statusBarScrollInvert,
                    onChange: function (value) {
                        self.plugin.setStatusBarScrollInvert(value);
                    },
                });
            }

            addSubsection(contentEl, L.settingsSubsectionSwitchCommands);

            addToggleSetting(contentEl, {
                name: L.settingsShowActiveSwitchCommand,
                desc: L.settingsShowActiveSwitchCommandDesc,
                value: !!self.plugin.data.showActiveSwitchCommand,
                onChange: function (value) {
                    self.plugin.setShowActiveSwitchCommand(value);
                },
            });

            addToggleSetting(contentEl, {
                name: L.settingsNumberedSwitchCommands,
                desc: L.settingsNumberedSwitchCommandsDesc,
                value: !!self.plugin.data.numberedSwitchCommands,
                onChange: function (value) {
                    self.plugin.setNumberedSwitchCommands(value);
                },
            });

            addSubsection(contentEl, L.settingsSubsectionSwitchPreview);

            // Preview before switching — master toggle with nested sub-toggles
            var allOn = !!self.plugin.data.previewNext && !!self.plugin.data.previewPrevious;
            var masterSetting = new obsidian.Setting(contentEl)
                .setName(L.settingsPreviewHeading)
                .setDesc(L.settingsPreviewDesc)
                .addToggle(function (toggle) {
                    toggle.setValue(allOn);
                    toggle.onChange(function (value) {
                        self.plugin.setSwitchPreviewEnabled(value).then(function () {
                            self.display();
                        });
                    });
                });

            masterSetting.settingEl.addClass('wpp-has-nested');
            var nestedDiv = masterSetting.settingEl.createDiv({ cls: 'wpp-nested-settings' });

            new obsidian.Setting(nestedDiv)
                .setName(L.settingsPreviewNext)
                .addToggle(function (toggle) {
                    toggle.setValue(!!self.plugin.data.previewNext);
                    toggle.onChange(function (value) {
                        self.plugin.setPreviewNext(value).then(function () {
                            self.display();
                        });
                    });
                });

            new obsidian.Setting(nestedDiv)
                .setName(L.settingsPreviewPrevious)
                .addToggle(function (toggle) {
                    toggle.setValue(!!self.plugin.data.previewPrevious);
                    toggle.onChange(function (value) {
                        self.plugin.setPreviewPrevious(value).then(function () {
                            self.display();
                        });
                    });
                });

            addSection(L.settingsSectionSessionListSearch);

            addToggleSetting(contentEl, {
                name: L.settingsShowFilterInput,
                desc: L.settingsShowFilterInputDesc,
                value: !!self.plugin.data.showFilterInput,
                onChange: function (value) {
                    self.plugin.setShowFilterInput(value);
                },
            });

            new obsidian.Setting(contentEl)
                .setName(L.settingsOverlayDefaultFocus)
                .setDesc(L.settingsOverlayDefaultFocusDesc)
                .addDropdown(function (dropdown) {
                    dropdown.addOption('current-session', L.settingsOverlayFocusCurrentSession);
                    dropdown.addOption('session-filter', L.settingsOverlayFocusSessionFilter);
                    dropdown.addOption('session-create', L.settingsOverlayFocusSessionCreate);
                    dropdown.setValue(self.plugin.data.overlayDefaultFocus || 'current-session');
                    dropdown.onChange(function (value) {
                        self.plugin.setOverlayDefaultFocus(value);
                    });
                });

            addSection(L.settingsSectionDeletion);

            addToggleSetting(contentEl, {
                name: L.settingsConfirmDelete,
                desc: L.settingsConfirmDeleteDesc,
                value: self.plugin.data.confirmDeleteByHotkey !== false,
                onChange: function (value) {
                    self.plugin.setConfirmDeleteByHotkey(value);
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
                        self.plugin.setVersionHistoryEnabled(value).then(function () {
                            self.display();
                        });
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
                            self.plugin.setVersionHistorySnapshotInterval(value);
                        });
                    });
            }

            addToggleSetting(vhNestedDiv, {
                name: L.settingsVersionHistoryConfirmRestore,
                desc: L.settingsVersionHistoryConfirmRestoreDesc,
                value: self.plugin.isVersionHistoryConfirmRestoreEnabled(),
                disabled: !versionHistoryEnabled,
                onChange: function (value) {
                    self.plugin.setVersionHistoryConfirmRestore(value);
                },
            });

            // --- Backup ---
            addSection(L.rotationBackupSectionTitle);

            new obsidian.Setting(contentEl)
                .setName(L.rotationBackupCreate)
                .setDesc(L.rotationBackupDesc)
                .addButton(function (btn) {
                    btn.setButtonText(L.rotationBackupCreateBtn);
                    btn.onClick(function () {
                        btn.setDisabled(true);
                        var sessionData = self.plugin.extractSessionData(self.plugin.data);
                        sessionData._wppSavedAt = Date.now();
                        var backupData = self.plugin.prepareRotationBackupData(sessionData);
                        self.plugin.ensureDir(self.plugin.getBackupsDirPath())
                            .then(function () {
                                return self.plugin.copyFileIfExists(
                                    self.plugin.getRotationBackupPath(2),
                                    self.plugin.getRotationBackupPath(3)
                                );
                            })
                            .then(function () {
                                return self.plugin.copyFileIfExists(
                                    self.plugin.getRotationBackupPath(1),
                                    self.plugin.getRotationBackupPath(2)
                                );
                            })
                            .then(function () {
                                return self.plugin.writeJson(
                                    self.plugin.getRotationBackupPath(1),
                                    backupData
                                );
                            })
                            .then(function () {
                                self.plugin._lastRotationBackupAt = Date.now();
                                self.display();
                            })
                            .catch(function () {
                                btn.setDisabled(false);
                            });
                    });
                });

            var backupListEl = contentEl.createDiv({ cls: 'wpp-backup-list' });
            backupListEl.createDiv({ text: L.rotationBackupNone, cls: 'wpp-backup-none' });

            self.plugin.getRotationBackupInfo().then(function (backups) {
                backupListEl.empty();
                if (backups.length === 0) {
                    backupListEl.createDiv({ text: L.rotationBackupNone, cls: 'wpp-backup-none' });
                    return;
                }
                for (var i = 0; i < backups.length; i++) {
                    (function (backup) {
                        var absoluteTime = '';
                        try {
                            absoluteTime = new Date(backup.savedAt).toLocaleString();
                        } catch (e) {
                            absoluteTime = String(backup.savedAt);
                        }
                        var relativeTime = formatRelativeTime(backup.savedAt);
                        var backupSummary = relativeTime + '  ·  ' + L.rotationBackupGeneration(backup.sessionCount);
                        var backupDesc = absoluteTime;
                        if (backup.backupPlatform) backupDesc += '  ·  ' + backup.backupPlatform;
                        var setting = new obsidian.Setting(backupListEl);
                        var nameEl = setting.nameEl;
                        var numSpan = document.createElement('span');
                        numSpan.textContent = backup.generation + '.';
                        numSpan.style.color = 'var(--text-accent)';
                        numSpan.style.marginRight = '6px';
                        nameEl.appendChild(numSpan);
                        nameEl.appendText(backupSummary);
                        setting.setDesc(backupDesc)
                            .addButton(function (btn) {
                                btn.setButtonText(L.rotationBackupRestore);
                                btn.onClick(function () {
                                    new modals.ConfirmModal(self.app,
                                        L.rotationBackupRestoreConfirm(absoluteTime, backup.sessionCount),
                                        function () {
                                            return self.plugin.restoreFromRotationBackup(backup.generation)
                                                .then(function (ok) {
                                                    if (ok) self.display();
                                                });
                                        },
                                        { confirmText: L.rotationBackupRestore }
                                    ).open();
                                });
                            });
                    })(backups[i]);
                }
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
