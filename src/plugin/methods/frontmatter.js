'use strict';


// ============================================================
// Front-matter integration adapter
// ============================================================

module.exports = function attachFrontmatterMethods(WorkspacePlusPlus) {




    WorkspacePlusPlus.prototype.saveCurrentNoteNameAsSession = function (options) {
        return this.getFrontmatterLinker().saveCurrentNoteNameAsSession(options);
    };




    WorkspacePlusPlus.prototype.handleFrontmatterTriggers = function (file) {
        return this.getFrontmatterLinker().handleFrontmatterTriggers(file);
    };





    WorkspacePlusPlus.prototype.registerFrontmatterListeners = function () {
        return this.getFrontmatterLinker().registerFrontmatterListeners();
    };
};
