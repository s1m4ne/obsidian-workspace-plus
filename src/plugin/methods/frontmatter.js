'use strict';

var frontmatterLinker = require('../../core/frontmatter-linker.ts');

// ============================================================
// Front-matter integration adapter
// ============================================================

module.exports = function attachFrontmatterMethods(WorkspacePlusPlus) {
    if (!WorkspacePlusPlus.prototype.getFrontmatterLinker) {
        WorkspacePlusPlus.prototype.getFrontmatterLinker = function () {
            var self = this;
            if (!this._frontmatterLinker) {
                this._frontmatterLinker = new frontmatterLinker.FrontmatterLinker({
                    get data() { return self.data; },
                    get app() { return self.app; },
                    saveCurrentLayoutAsSessionName: function (name, options) {
                        if (typeof self.saveCurrentLayoutAsSessionName === 'function') {
                            return self.saveCurrentLayoutAsSessionName(name, options);
                        }
                        if (typeof self.getSessionSaver === 'function') {
                            return self.getSessionSaver().saveCurrentLayoutAsSessionName(name, options);
                        }
                        return Promise.resolve(false);
                    },
                    switchSession: function (sessionId, options) {
                        if (typeof self.switchSession === 'function') {
                            return self.switchSession(sessionId, options);
                        }
                        if (typeof self.getSessionSwitcher === 'function') {
                            return self.getSessionSwitcher().switchSession(sessionId, options);
                        }
                        return Promise.resolve(false);
                    },
                    setActiveGroup: function (groupId) {
                        if (typeof self.setActiveGroup === 'function') {
                            return self.setActiveGroup(groupId);
                        }
                        if (typeof self.getGroupManager === 'function') {
                            return self.getGroupManager().setActiveGroup(groupId);
                        }
                        return Promise.resolve(false);
                    },
                    isGroupFeatureEnabled: function () {
                        if (typeof self.isGroupFeatureEnabled === 'function') {
                            return self.isGroupFeatureEnabled();
                        }
                        if (typeof self.getGroupManager === 'function') {
                            return self.getGroupManager().isGroupFeatureEnabled();
                        }
                        return true;
                    },
                    getStartupSettleRemainingMs: function () {
                        if (typeof self.getStartupSettleRemainingMs === 'function') {
                            return self.getStartupSettleRemainingMs();
                        }
                        if (typeof self.getSessionSwitcher === 'function') {
                            return self.getSessionSwitcher().getStartupSettleRemainingMs();
                        }
                        return 0;
                    },
                    isSessionSwitcherActive: function () {
                        if (typeof self.getSessionSwitcher === 'function') {
                            return Boolean(self.getSessionSwitcher().isSwitching);
                        }
                        return false;
                    },
                    handleFrontmatterTriggers: function (file) {
                        if (typeof self.handleFrontmatterTriggers === 'function' && self.handleFrontmatterTriggers !== WorkspacePlusPlus.prototype.handleFrontmatterTriggers) {
                            self.handleFrontmatterTriggers(file);
                        }
                    },
                    registerEvent: function (eventRef) {
                        if (typeof self.registerEvent === 'function') {
                            self.registerEvent(eventRef);
                        }
                    },
                });
            }
            return this._frontmatterLinker;
        };
    }

    WorkspacePlusPlus.prototype.getFileFrontmatter = function (file) {
        return this.getFrontmatterLinker().getFileFrontmatter(file);
    };

    WorkspacePlusPlus.prototype.isMarkdownNoteFile = function (file) {
        return this.getFrontmatterLinker().isMarkdownNoteFile(file);
    };

    WorkspacePlusPlus.prototype.getSessionNameFromNoteFile = function (file) {
        return this.getFrontmatterLinker().getSessionNameFromNoteFile(file);
    };

    WorkspacePlusPlus.prototype.setWorkspaceSessionFrontmatter = function (file, sessionName) {
        return this.getFrontmatterLinker().setWorkspaceSessionFrontmatter(file, sessionName);
    };

    WorkspacePlusPlus.prototype.saveCurrentNoteNameAsSession = function (options) {
        return this.getFrontmatterLinker().saveCurrentNoteNameAsSession(options);
    };

    WorkspacePlusPlus.prototype.parseWorkspaceSessionValue = function (value) {
        return this.getFrontmatterLinker().parseWorkspaceSessionValue(value);
    };

    WorkspacePlusPlus.prototype.findSessionByName = function (name) {
        return this.getFrontmatterLinker().findSessionByName(name);
    };

    WorkspacePlusPlus.prototype.handleWorkspaceSessionProperty = function (value) {
        return this.getFrontmatterLinker().handleWorkspaceSessionProperty(value);
    };

    WorkspacePlusPlus.prototype.handleFrontmatterTriggers = function (file) {
        return this.getFrontmatterLinker().handleFrontmatterTriggers(file);
    };

    WorkspacePlusPlus.prototype.getFrontmatterTriggerLeafId = function () {
        return this.getFrontmatterLinker().getFrontmatterTriggerLeafId();
    };

    WorkspacePlusPlus.prototype.markCurrentFrontmatterFilesLoaded = function () {
        return this.getFrontmatterLinker().markCurrentFrontmatterFilesLoaded();
    };

    WorkspacePlusPlus.prototype.clearFrontmatterFileForActiveLeaf = function () {
        return this.getFrontmatterLinker().clearFrontmatterFileForActiveLeaf();
    };

    WorkspacePlusPlus.prototype.shouldHandleFrontmatterFileOpen = function (file) {
        return this.getFrontmatterLinker().shouldHandleFrontmatterFileOpen(file);
    };

    WorkspacePlusPlus.prototype.registerFrontmatterListeners = function () {
        return this.getFrontmatterLinker().registerFrontmatterListeners();
    };
};
