'use strict';

var i18n = require('../i18n.ts');

function formatRelativeTime(timestamp) {
    var L = i18n.L;
    var diff = Date.now() - timestamp;
    var minutes = Math.floor(diff / 60000);
    var hours = Math.floor(diff / 3600000);
    var days = Math.floor(diff / 86400000);

    if (minutes < 1) return L.modifiedJustNow;
    if (minutes < 60) return L.modifiedMinutes(minutes);
    if (hours < 24) return L.modifiedHours(hours);
    return L.modifiedDays(days);
}

module.exports = formatRelativeTime;
