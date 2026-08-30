'use strict';

var obsidian = require('obsidian');
var i18n = require('./i18n.ts');
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

function resolveSettingText(value) {
    return typeof value === 'function' ? value() : value;
}

function addToggleSetting(parentEl, options) {
    var setting = new obsidian.Setting(parentEl)
        .setName(resolveSettingText(options.name));

    if (options.desc) {
        setting.setDesc(resolveSettingText(options.desc));
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

function addDropdownSetting(parentEl, options) {
    var setting = new obsidian.Setting(parentEl)
        .setName(resolveSettingText(options.name));

    if (options.desc) {
        setting.setDesc(resolveSettingText(options.desc));
    }

    setting.addDropdown(function (dropdown) {
        var optionKeys = Object.keys(options.items || {});
        for (var i = 0; i < optionKeys.length; i++) {
            dropdown.addOption(optionKeys[i], resolveSettingText(options.items[optionKeys[i]]));
        }
        dropdown.setValue(String(options.value));
        if (options.disabled && typeof dropdown.setDisabled === 'function') {
            dropdown.setDisabled(true);
        }
        dropdown.onChange(function (value) {
            options.onChange(value);
        });
    });

    return setting;
}

function addSubsection(parentEl, title) {
    var headingEl = parentEl.createEl('h4', { text: resolveSettingText(title) });
    headingEl.addClass('wpp-settings-subsection');
    return headingEl;
}

function addDangerResetSetting(parentEl, app, display, options) {
    new obsidian.Setting(parentEl)
        .setName(resolveSettingText(options.name))
        .setDesc(resolveSettingText(options.desc))
        .addButton(function (btn) {
            var isRunning = false;
            btn.setButtonText(resolveSettingText(options.buttonText));
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
        .setName(resolveSettingText(options.name))
        .setDesc(resolveSettingText(options.desc))
        .addButton(function (btn) {
            btn.setButtonText(resolveSettingText(options.buttonText));
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

module.exports = {
    GroupSessionsModal: GroupSessionsModal,
    resolveSettingText: resolveSettingText,
    addToggleSetting: addToggleSetting,
    addDropdownSetting: addDropdownSetting,
    addSubsection: addSubsection,
    addDangerResetSetting: addDangerResetSetting,
    addAsyncActionSetting: addAsyncActionSetting,
};
