'use strict';

// Pure helpers for reading and reshaping stored session data.
//
// These live outside persistence.js because session-sync.js needs the same
// notion of "is this session data" and "how fresh is it" - it used to carry
// byte-identical copies of getPersistStamp() and hasSessionShape(), which meant
// the rule deciding whether an incoming file was newer existed in two places.

var SESSION_KEYS = [
    'activeSessionId',
    'sessions',
    'sessionOrder',
    'groups',
    'groupOrder',
    'sessionGroups',
    'activeGroupId',
];


function joinPath(base, child) {
    return String(base || '').replace(/\/+$/, '') + '/' + child;
}

function readHistoryMap(raw) {
    if (!raw || typeof raw !== 'object') return {};
    // Accept the versioned wrapper, and tolerate a bare map for forward safety.
    var map = (raw.history && typeof raw.history === 'object') ? raw.history : raw;
    var out = {};
    var ids = Object.keys(map);
    for (var i = 0; i < ids.length; i++) {
        var entries = map[ids[i]];
        if (Array.isArray(entries) && entries.length > 0) out[ids[i]] = entries;
    }
    return out;
}

// Split session data into what gets persisted next to the sessions and the
// per-session version history, which is kept in a local-only file.
//
// The input is never mutated: extractSessionData() returns the live
// this.data.sessions object by reference (pickKeys and normalizeSessionData
// both copy shallowly), so deleting history in place would wipe the history
// the UI is still showing.
//
// Sessions that no longer exist are dropped from the history map, which keeps
// entries from leaking after a reset or a sessions import.
function splitSessionHistory(sessionData) {
    var sessions = (sessionData && sessionData.sessions) || {};
    var strippedSessions = {};
    var history = {};
    var ids = Object.keys(sessions);

    for (var i = 0; i < ids.length; i++) {
        var id = ids[i];
        var session = sessions[id];
        if (!session || typeof session !== 'object') continue;

        var copy = {};
        var keys = Object.keys(session);
        for (var k = 0; k < keys.length; k++) {
            if (keys[k] === 'history') continue;
            copy[keys[k]] = session[keys[k]];
        }
        strippedSessions[id] = copy;

        if (Array.isArray(session.history) && session.history.length > 0) {
            history[id] = session.history;
        }
    }

    return {
        data: Object.assign({}, sessionData, { sessions: strippedSessions }),
        history: history,
    };
}

// Attach history entries back onto the in-memory sessions. history.json is the
// canonical source; history still inlined in sessions.json is the pre-split
// format and is only used when the split file has nothing for that session.
function mergeSessionHistory(sessionData, historyMap) {
    var sessions = (sessionData && sessionData.sessions) || {};
    var ids = Object.keys(sessions);

    for (var i = 0; i < ids.length; i++) {
        var session = sessions[ids[i]];
        if (!session || typeof session !== 'object') continue;

        var entries = historyMap && historyMap[ids[i]];
        if (Array.isArray(entries) && entries.length > 0) {
            session.history = entries;
        } else if (!Array.isArray(session.history) || session.history.length === 0) {
            delete session.history;
        }
    }

    return sessionData;
}

function hasInlineSessionHistory(sessionData) {
    var sessions = (sessionData && sessionData.sessions) || {};
    var ids = Object.keys(sessions);
    for (var i = 0; i < ids.length; i++) {
        var session = sessions[ids[i]];
        if (session && Array.isArray(session.history) && session.history.length > 0) return true;
    }
    return false;
}

// The session-shaped part of a stored object, including the save stamp that the
// external-change detection compares.
function pickSessionPayload(data) {
    var out = {};
    if (!data || typeof data !== 'object') return out;
    for (var i = 0; i < SESSION_KEYS.length; i++) {
        var key = SESSION_KEYS[i];
        if (data[key] !== undefined) out[key] = data[key];
    }
    if (typeof data._wppSavedAt === 'number') out._wppSavedAt = data._wppSavedAt;
    return out;
}

function pickKeys(data, keys) {
    var out = {};
    if (!data) return out;
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (data[key] !== undefined) out[key] = data[key];
    }
    return out;
}

function hasSessionShape(data) {
    return !!(
        data
        && typeof data === 'object'
        && (data.sessions !== undefined || data.sessionOrder !== undefined || data.activeSessionId !== undefined)
    );
}

function hasNonEmptySessions(data) {
    return !!(
        data
        && data.sessions
        && typeof data.sessions === 'object'
        && Object.keys(data.sessions).length > 0
    );
}

function getPersistStamp(data) {
    if (!data || typeof data !== 'object') return 0;
    var stamp = data._wppSavedAt;
    if (typeof stamp !== 'number' || !isFinite(stamp)) return 0;
    return stamp;
}

module.exports = {
    SESSION_KEYS: SESSION_KEYS,
    joinPath: joinPath,
    readHistoryMap: readHistoryMap,
    splitSessionHistory: splitSessionHistory,
    mergeSessionHistory: mergeSessionHistory,
    hasInlineSessionHistory: hasInlineSessionHistory,
    pickSessionPayload: pickSessionPayload,
    pickKeys: pickKeys,
    hasSessionShape: hasSessionShape,
    hasNonEmptySessions: hasNonEmptySessions,
    getPersistStamp: getPersistStamp,
};
