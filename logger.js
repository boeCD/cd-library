const logger = {
    log: function(message) {
        const body = localStorage.getItem("cd-debug");
        // Check if the body has the attribute cd-debug="true"
        if (body) {
            console.log("🐙🐙🐙🐙 ",message);
        }
    }
};
