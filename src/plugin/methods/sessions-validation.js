'use strict';


function attachSessionValidationMethods(WorkspacePlusPlus) {



    WorkspacePlusPlus.prototype.createSessionValidated = function (name, options) {
        return this.getSessionStore().createSessionValidated(name, options);
    };

    WorkspacePlusPlus.prototype.createSessionForViewedGroup = function (name, viewedGroupId, options) {
        return this.getSessionStore().createSessionForViewedGroup(name, viewedGroupId, options);
    };

    WorkspacePlusPlus.prototype.renameSessionById = function (sessionId, newName, options) {
        return this.getSessionStore().renameSessionById(sessionId, newName, options);
    };

    WorkspacePlusPlus.prototype.createGroupValidated = function (name, options) {
        return this.getGroupStore().createGroupValidated(name, options);
    };

    WorkspacePlusPlus.prototype.renameGroupValidated = function (groupId, newName, options) {
        return this.getGroupStore().renameGroupValidated(groupId, newName, options);
    };
}

module.exports = attachSessionValidationMethods;
