'use strict';

var obsidian = require('obsidian');
var i18n = require('../../i18n.ts');

// ============================================================
// Front-matter integration
//
// Watches for file-open events and reads front-matter properties
// to trigger plugin actions (e.g. auto-loading a session).
// ============================================================

module.exports = function attachFrontmatterMethods(WorkspacePlusPlus) {

    // ----------------------------------------------------------
    // Core: read front-matter from the active file
    // ----------------------------------------------------------

    /**
     * Returns the front-matter object for the given TFile, or null.
     */
    WorkspacePlusPlus.prototype.getFileFrontmatter = function (file) {
        if (!file) return null;
        var cache = this.app.metadataCache.getFileCache(file);
        return (cache && cache.frontmatter) || null;
    };

    WorkspacePlusPlus.prototype.isMarkdownNoteFile = function (file) {
        return !!file && String(file.extension || '').toLowerCase() === 'md';
    };

    WorkspacePlusPlus.prototype.getSessionNameFromNoteFile = function (file) {
        if (!this.isMarkdownNoteFile(file)) return '';
        if (typeof file.basename === 'string' && file.basename.trim()) {
            return file.basename.trim();
        }
        var name = typeof file.name === 'string' ? file.name : '';
        if (!name && typeof file.path === 'string') {
            var parts = file.path.split('/');
            name = parts[parts.length - 1] || '';
        }
        return name.replace(/\.md$/i, '').trim();
    };

    WorkspacePlusPlus.prototype.setWorkspaceSessionFrontmatter = function (file, sessionName) {
        if (!this.app.fileManager || typeof this.app.fileManager.processFrontMatter !== 'function') {
            return Promise.reject(new Error('processFrontMatter unavailable'));
        }
        return this.app.fileManager.processFrontMatter(file, function (frontmatter) {
            frontmatter['workspace-session'] = sessionName;
        });
    };

    WorkspacePlusPlus.prototype.saveCurrentNoteNameAsSession = function (options) {
        var L = i18n.L;
        options = options || {};
        var file = this.app.workspace.getActiveFile ? this.app.workspace.getActiveFile() : null;
        var sessionName = this.getSessionNameFromNoteFile(file);
        var self = this;

        if (!file || !sessionName) {
            if (!options.silent) new obsidian.Notice(L.noActiveMarkdownFile);
            return Promise.resolve(false);
        }

        return this.setWorkspaceSessionFrontmatter(file, sessionName)
            .then(function () {
                return self.saveCurrentLayoutAsSessionName(sessionName, { silent: true });
            })
            .then(function (result) {
                if (!options.silent) {
                    new obsidian.Notice(L.savedCurrentNoteNameAsSession(sessionName));
                }
                return result;
            })
            .catch(function () {
                if (!options.silent) {
                    new obsidian.Notice(L.saveCurrentNoteNameAsSessionFailed);
                }
                return false;
            });
    };

    // ----------------------------------------------------------
    // workspace-session property
    // ----------------------------------------------------------

    /**
     * Parse a workspace-session value into { groupName, sessionName }.
     *
     * "my session"          → { groupName: null, sessionName: "my session" }
     * "work/my session"     → first checks if group "work" exists;
     *                          if yes → { groupName: "work", sessionName: "my session" }
     *                          if no  → { groupName: null, sessionName: "work/my session" }
     */
    WorkspacePlusPlus.prototype.parseWorkspaceSessionValue = function (value) {
        if (!value || typeof value !== 'string') return null;
        value = value.trim();
        if (!value) return null;

        var slashIndex = value.indexOf('/');
        if (slashIndex === -1) {
            return { groupName: null, sessionName: value };
        }

        var candidateGroup = value.substring(0, slashIndex).trim();
        var candidateSession = value.substring(slashIndex + 1).trim();

        if (!candidateGroup || !candidateSession) {
            return { groupName: null, sessionName: value };
        }

        // Check if a group with this name actually exists
        var groups = this.data.groups || {};
        var groupKeys = Object.keys(groups);
        var matchedGroup = null;
        for (var i = 0; i < groupKeys.length; i++) {
            if (groups[groupKeys[i]].name === candidateGroup) {
                matchedGroup = groups[groupKeys[i]];
                break;
            }
        }

        if (matchedGroup) {
            return { groupName: candidateGroup, groupId: matchedGroup.id, sessionName: candidateSession };
        }

        // No matching group — treat entire value as session name
        return { groupName: null, sessionName: value };
    };

    /**
     * Find a session by name. Returns the session object or null.
     */
    WorkspacePlusPlus.prototype.findSessionByName = function (name) {
        if (!name) return null;
        var sessions = this.data.sessions || {};
        var keys = Object.keys(sessions);
        for (var i = 0; i < keys.length; i++) {
            if (sessions[keys[i]].name === name) {
                return sessions[keys[i]];
            }
        }
        return null;
    };

    /**
     * Handle the workspace-session front-matter property.
     * Switches to the named session (and optionally the group).
     */
    WorkspacePlusPlus.prototype.handleWorkspaceSessionProperty = function (value) {
        var L = i18n.L;
        var parsed = this.parseWorkspaceSessionValue(value);
        if (!parsed) return;

        var session = this.findSessionByName(parsed.sessionName);
        if (!session) {
            new obsidian.Notice(L.frontmatterSessionNotFound(parsed.sessionName));
            return;
        }

        var alreadyOnSession = session.id === this.data.activeSessionId;
        var alreadyOnGroup = !parsed.groupId || this.data.activeGroupId === parsed.groupId;

        // Already on the correct session and group — notify and skip
        if (alreadyOnSession && alreadyOnGroup) {
            new obsidian.Notice(L.frontmatterAlreadyActive(parsed.sessionName));
            return;
        }

        var self = this;

        // If a group was specified and group feature is enabled, switch group
        if (parsed.groupId && this.isGroupFeatureEnabled() && !alreadyOnGroup) {
            this.setActiveGroup(parsed.groupId).then(function () {
                if (session.id !== self.data.activeSessionId) {
                    self.switchSession(session.id);
                }
            });
        } else if (!alreadyOnSession) {
            this.switchSession(session.id);
        }
    };

    // ----------------------------------------------------------
    // Dispatcher: called on file-open
    // ----------------------------------------------------------

    /**
     * Central dispatcher that reads front-matter from the active file
     * and delegates to the appropriate handler(s).
     *
     * New front-matter keys can be added here in the future.
     */
    WorkspacePlusPlus.prototype.handleFrontmatterTriggers = function (file) {
        var fm = this.getFileFrontmatter(file);
        if (!fm) return;

        // workspace-session
        if (fm['workspace-session']) {
            this.handleWorkspaceSessionProperty(fm['workspace-session']);
        }

        // Future front-matter keys can be handled here:
        // if (fm['workspace-xxx']) { ... }
    };

    WorkspacePlusPlus.prototype.getFrontmatterTriggerLeafId = function () {
        var activeLeaf = this.app.workspace.activeLeaf || null;
        return activeLeaf && activeLeaf.id ? activeLeaf.id : 'active';
    };

    WorkspacePlusPlus.prototype.markCurrentFrontmatterFilesLoaded = function () {
        var loadedByLeaf = {};
        if (typeof this.app.workspace.iterateAllLeaves === 'function') {
            this.app.workspace.iterateAllLeaves(function (leaf) {
                var file = leaf && leaf.view && leaf.view.file;
                if (!leaf || !leaf.id || !file || !file.path) return;
                loadedByLeaf[leaf.id] = file.path;
            });
        }
        this.frontmatterLoadedFilePathsByLeaf = loadedByLeaf;
    };

    WorkspacePlusPlus.prototype.clearFrontmatterFileForActiveLeaf = function () {
        if (!this.frontmatterLoadedFilePathsByLeaf) return;
        delete this.frontmatterLoadedFilePathsByLeaf[this.getFrontmatterTriggerLeafId()];
    };

    WorkspacePlusPlus.prototype.shouldHandleFrontmatterFileOpen = function (file) {
        var filePath = file && file.path ? file.path : '';
        if (!filePath) return false;
        var leafId = this.getFrontmatterTriggerLeafId();
        if (!this.frontmatterLoadedFilePathsByLeaf) this.frontmatterLoadedFilePathsByLeaf = {};
        if (this.frontmatterLoadedFilePathsByLeaf[leafId] === filePath) return false;
        this.frontmatterLoadedFilePathsByLeaf[leafId] = filePath;
        return true;
    };

    // ----------------------------------------------------------
    // Event registration
    // ----------------------------------------------------------

    /**
     * Register the file-open listener.
     * Should be called once during plugin onload().
     */
    WorkspacePlusPlus.prototype.registerFrontmatterListeners = function () {
        var self = this;
        this.markCurrentFrontmatterFilesLoaded();

        this.registerEvent(this.app.workspace.on('file-open', function (file) {
            // Guard: don't trigger during session switch or startup settle
            if (typeof self.getSessionSwitcher === 'function' && self.getSessionSwitcher().isSwitching) return;
            if (self.getStartupSettleRemainingMs() > 0) return;

            if (!file) {
                self.clearFrontmatterFileForActiveLeaf();
                return;
            }
            if (!self.shouldHandleFrontmatterFileOpen(file)) return;
            self.handleFrontmatterTriggers(file);
        }));
    };
};
