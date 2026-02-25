'use strict';

var obsidian = require('obsidian');
var i18n = require('../i18n');

// ============================================================
// Rename Modal
// ============================================================
var RenameModal = /** @class */ (function (_super) {
    function RenameModal(app, currentName, onRename, options) {
        var _this = _super.call(this, app) || this;
        _this.currentName = currentName;
        _this.onRename = onRename;
        _this.modalOptions = options || {};
        return _this;
    }

    RenameModal.prototype = Object.create(_super.prototype);
    RenameModal.prototype.constructor = RenameModal;

    RenameModal.prototype.onOpen = function () {
        var L = i18n.L;
        var contentEl = this.contentEl;
        var self = this;
        var opts = this.modalOptions;
        this.titleEl.setText(opts.title || L.renameTitle);

        var input = contentEl.createEl('input', {
            type: 'text',
            value: this.currentName,
            placeholder: opts.placeholder || L.renamePlaceholder,
            cls: 'wpp-rename-input',
        });
        input.select();

        var btns = contentEl.createDiv({ cls: 'wpp-confirm-buttons' });
        var cancelBtn = btns.createEl('button', { text: L.cancel });
        cancelBtn.addEventListener('click', function () { self.close(); });
        var renameBtn = btns.createEl('button', { text: opts.buttonText || L.rename, cls: 'mod-cta' });

        var doRename = function () {
            var newName = input.value.trim();
            if (newName && newName !== self.currentName) {
                self.onRename(newName);
                self.close();
            }
        };

        renameBtn.addEventListener('click', doRename);

        this.buttons = [cancelBtn, renameBtn];
        this.focusedButtonIndex = -1; // -1 = input focused

        this.renameKeyHandler = function (e) {
            // Skip during IME composition (e.g. Japanese input conversion)
            if (e.isComposing) return;

            if (self.focusedButtonIndex === -1) {
                // Input focused
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    self.focusedButtonIndex = 1;
                    self.updateRenameBtnFocus();
                    input.blur();
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    doRename();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    self.close();
                }
            } else {
                // Button focused
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    self.focusedButtonIndex = -1;
                    self.updateRenameBtnFocus();
                    input.focus();
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    if (self.focusedButtonIndex > 0) {
                        self.focusedButtonIndex--;
                    } else {
                        self.focusedButtonIndex = -1;
                        self.updateRenameBtnFocus();
                        input.focus();
                        return;
                    }
                    self.updateRenameBtnFocus();
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    if (self.focusedButtonIndex < 1) {
                        self.focusedButtonIndex = 1;
                        self.updateRenameBtnFocus();
                    }
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    if (self.focusedButtonIndex === 0) {
                        self.close();
                    } else {
                        doRename();
                    }
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    self.close();
                }
            }
        };
        document.addEventListener('keydown', this.renameKeyHandler, true);

        setTimeout(function () { input.focus(); }, 50);
    };

    RenameModal.prototype.updateRenameBtnFocus = function () {
        var self = this;
        this.buttons.forEach(function (btn, i) {
            btn.classList.toggle('wpp-btn-focused', i === self.focusedButtonIndex);
        });
    };

    RenameModal.prototype.onClose = function () {
        if (this.renameKeyHandler) {
            document.removeEventListener('keydown', this.renameKeyHandler, true);
            this.renameKeyHandler = null;
        }
        this.contentEl.empty();
    };

    return RenameModal;
})(obsidian.Modal);

module.exports = RenameModal;
