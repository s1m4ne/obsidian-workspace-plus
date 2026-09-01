'use strict';


// ============================================================
// Front-matter integration adapter
// ============================================================

module.exports = function attachFrontmatterMethods(WorkspacePlusPlus) {
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
