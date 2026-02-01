'use strict';

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
}

exports.generateId = generateId;
