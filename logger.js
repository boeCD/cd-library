export const logger = {
    log: function(message) {
        this._checkAndLog("log", message);
    },
    info: function(message) {
        this._checkAndLog("info", message);
    },
    warn: function(message) {
        this._checkAndLog("warn", message);
    },
    error: function(message) {
        this._checkAndLog("error", message);
    },
    debug: function(message) {
        this._checkAndLog("debug", message);
    },
    trace: function(message) {
        this._checkAndLog("trace", message);
    },
    group: function(label) {
        this._checkAndLog("group", label);
    },
    groupEnd: function() {
        this._checkAndLog("groupEnd");
    },
    time: function(label) {
        this._checkAndLog("time", label);
    },
    timeEnd: function(label) {
        this._checkAndLog("timeEnd", label);
    },
    count: function(label) {
        this._checkAndLog("count", label);
    },
    countReset: function(label) {
        this._checkAndLog("countReset", label);
    },
    _checkAndLog: function(type, message = "") {
        const body = localStorage.getItem("cd-debug");
        if (body) {
            console[type]("🐙🐙🐙🐙 ", message);
        }
    }
};
