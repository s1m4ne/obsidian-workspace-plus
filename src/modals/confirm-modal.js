'use strict';

var obsidian = require('obsidian');
var i18n = require('../i18n');

// ============================================================
// Confirm Modal
// ============================================================
var ConfirmModal = /** @class */ (function (_super) {
    function ConfirmModal(app, message, onConfirm, options) {
        var _this = _super.call(this, app) || this;
        _this.message = message;
        _this.onConfirm = onConfirm;
        _this.options = options || {};
        return _this;
    }

    ConfirmModal.prototype = Object.create(_super.prototype);
    ConfirmModal.prototype.constructor = ConfirmModal;

    ConfirmModal.prototype.onOpen = function () {
        var L = i18n.L;
        // Ensure confirm modal appears above the switch overlay (z-index 9999)
        this.containerEl.style.zIndex = '10001';
        var contentEl = this.contentEl;
        contentEl.createEl('p', { text: this.message });
        var btns = contentEl.createDiv({ cls: 'wpp-confirm-buttons' });
        var self = this;

        var cancelBtn = btns.createEl('button', { text: L.cancel });
        cancelBtn.addEventListener('click', function () { self.close(); });

        var confirmText = this.options.confirmText || L.delete;
        var confirmClass = this.options.confirmClass || 'mod-warning';
        var confirmBtn = btns.createEl('button', { text: confirmText, cls: confirmClass });
        confirmBtn.addEventListener('click', function () {
            self.onConfirm();
            self.close();
        });

        if (this.options.hint) {
            var hintEl = contentEl.createDiv({ cls: 'wpp-confirm-hint' });
            var hintLink = hintEl.createEl('a', { text: this.options.hint });
            hintLink.addEventListener('click', function (e) {
                e.preventDefault();
                self.close();
                if (self.options.onHintClick) self.options.onHintClick();
            });
        }

        this.buttons = [cancelBtn, confirmBtn];
        this.focusedButtonIndex = 1; // Default focus on confirm action
        this.updateButtonFocus();

        // Keyboard handler
        this.confirmKeyHandler = function (e) {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                self.focusedButtonIndex = 0;
                self.updateButtonFocus();
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                self.focusedButtonIndex = 1;
                self.updateButtonFocus();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (self.focusedButtonIndex === 0) {
                    self.close();
                } else {
                    self.onConfirm();
                    self.close();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopImmediatePropagation();
                self.close();
            }
        };
        document.addEventListener('keydown', this.confirmKeyHandler, true);
    };

    ConfirmModal.prototype.updateButtonFocus = function () {
        var self = this;
        this.buttons.forEach(function (btn, i) {
            btn.classList.toggle('wpp-btn-focused', i === self.focusedButtonIndex);
        });
    };

    ConfirmModal.prototype.onClose = function () {
        if (this.confirmKeyHandler) {
            document.removeEventListener('keydown', this.confirmKeyHandler, true);
            this.confirmKeyHandler = null;
        }
        this.contentEl.empty();
    };

    return ConfirmModal;
})(obsidian.Modal);

module.exports = ConfirmModal;
