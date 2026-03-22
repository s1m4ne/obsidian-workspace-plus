'use strict';

var obsidian = require('obsidian');
var i18n = require('../../i18n');

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
    // Dispatcher: called on active-leaf-change
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

    // ----------------------------------------------------------
    // Event registration
    // ----------------------------------------------------------

    /**
     * Register the active-leaf-change listener.
     * Should be called once during plugin onload().
     */
    WorkspacePlusPlus.prototype.registerFrontmatterListeners = function () {
        var self = this;

        this.registerEvent(this.app.workspace.on('active-leaf-change', function (leaf) {
            // Guard: don't trigger during session switch or startup settle
            if (self.isSwitchingSession) return;
            if (self.getStartupSettleRemainingMs() > 0) return;

            if (!leaf || !leaf.view || !leaf.view.file) return;
            self.handleFrontmatterTriggers(leaf.view.file);
        }));
    };
};
