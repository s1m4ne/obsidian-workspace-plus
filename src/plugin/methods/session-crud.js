'use strict';


function attachSessionCrudMethods(WorkspacePlusPlus) {

    WorkspacePlusPlus.prototype.getDefaultSessionName = function () {
        return this.getSessionStore().getDefaultSessionName();
    };


    WorkspacePlusPlus.prototype.insertSessionAndActivate = function (session) {
        return this.getSessionStore().insertSessionAndActivate(session);
    };

    WorkspacePlusPlus.prototype.createSessionRecord = function (id, name, layout, options) {
        return this.getSessionStore().createSessionRecord(id, name, layout, options);
    };


    WorkspacePlusPlus.prototype.deleteSession = function (sessionId) {
        return this.getSessionStore().deleteSession(sessionId);
    };

    WorkspacePlusPlus.prototype.renameCurrentSession = function () {
        return this.getSessionStore().renameCurrentSession();
    };

    WorkspacePlusPlus.prototype.deleteCurrentSession = function () {
        return this.getSessionStore().deleteCurrentSession();
    };

    WorkspacePlusPlus.prototype.deleteAllInactiveSessions = function () {
        return this.getSessionStore().deleteAllInactiveSessions();
    };


    WorkspacePlusPlus.prototype.resetSessionsToDefault = function () {
        return this.getSessionStore().resetSessionsToDefault();
    };

    WorkspacePlusPlus.prototype.createEmptySession = function () {
        return this.getSessionStore().createEmptySession();
    };

    WorkspacePlusPlus.prototype.duplicateCurrentSession = function () {
        return this.getSessionStore().duplicateCurrentSession();
    };

    WorkspacePlusPlus.prototype.duplicateSession = function (sessionId) {
        return this.getSessionStore().duplicateSession(sessionId);
    };

}

module.exports = attachSessionCrudMethods;
