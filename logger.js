const logger = {
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
    _checkAndLog: function(type, message) {
        const body = localStorage.getItem("cd-debug");
        if (body) {
            console[type]("🐙🐙🐙🐙 ", message);
        }
    }
};

// Example usage:
logger.log("This is a log message.");
logger.warn("This is a warning message.");
logger.error("This is an error message.");
logger.info("This is an info message.");
logger.debug("This is a debug message.");
