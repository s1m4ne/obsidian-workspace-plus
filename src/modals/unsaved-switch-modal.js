'use strict';

var obsidian = require('obsidian');
var i18n = require('../i18n');

// ============================================================
// Unsaved Switch Modal
// ============================================================
var UnsavedSwitchModal = /** @class */ (function (_super) {
    function UnsavedSwitchModal(app, message, onSaveAndSwitch, onSwitchWithoutSaving) {
        var _this = _super.call(this, app) || this;
        _this.message = message;
        _this.onSaveAndSwitch = onSaveAndSwitch;
        _this.onSwitchWithoutSaving = onSwitchWithoutSaving;
        return _this;
    }

    UnsavedSwitchModal.prototype = Object.create(_super.prototype);
    UnsavedSwitchModal.prototype.constructor = UnsavedSwitchModal;

    UnsavedSwitchModal.prototype.onOpen = function () {
        var L = i18n.L;
        this.containerEl.style.zIndex = '10001';

        var contentEl = this.contentEl;
        contentEl.createEl('p', { text: this.message });

        var btns = contentEl.createDiv({ cls: 'wpp-confirm-buttons' });
        var self = this;

        var cancelBtn = btns.createEl('button', { text: L.cancel });
        cancelBtn.addEventListener('click', function () {
            self.close();
        });

        var saveAndSwitchBtn = btns.createEl('button', { text: L.saveAndSwitch, cls: 'mod-cta' });
        saveAndSwitchBtn.addEventListener('click', function () {
            self.onSaveAndSwitch();
            self.close();
        });

        var switchWithoutSavingBtn = btns.createEl('button', {
            text: L.switchWithoutSaving,
            cls: 'mod-warning',
        });
        switchWithoutSavingBtn.addEventListener('click', function () {
            self.onSwitchWithoutSaving();
            self.close();
        });

        this.buttons = [cancelBtn, saveAndSwitchBtn, switchWithoutSavingBtn];
        this.focusedButtonIndex = 1;
        this.updateButtonFocus();

        this.keyHandler = function (e) {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                self.focusedButtonIndex = (self.focusedButtonIndex - 1 + self.buttons.length) % self.buttons.length;
                self.updateButtonFocus();
                return;
            }
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                self.focusedButtonIndex = (self.focusedButtonIndex + 1) % self.buttons.length;
                self.updateButtonFocus();
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                var btn = self.buttons[self.focusedButtonIndex];
                if (btn) btn.click();
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopImmediatePropagation();
                self.close();
            }
        };

        document.addEventListener('keydown', this.keyHandler, true);
    };

    UnsavedSwitchModal.prototype.updateButtonFocus = function () {
        var self = this;
        this.buttons.forEach(function (btn, i) {
            btn.classList.toggle('wpp-btn-focused', i === self.focusedButtonIndex);
        });
    };

    UnsavedSwitchModal.prototype.onClose = function () {
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler, true);
            this.keyHandler = null;
        }
        this.contentEl.empty();
    };

    return UnsavedSwitchModal;
})(obsidian.Modal);

module.exports = UnsavedSwitchModal;
