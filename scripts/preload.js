const { ipcRenderer, app } = require("electron");

process.once("loaded", () => {
    window.addEventListener("message", event => {
        const message = event.data;
        if (typeof (event.data) !== "object") {
            message = JSON.parse(event.data);
        }

        if (message.protocol === "to-app") {
            ipcRenderer.send("app", JSON.stringify(message.data));
        }
    });

    ipcRenderer.on("app", (event, args) => {
        window.postMessage({
            protocol: "from-app",
            data: JSON.stringify(args)
        });
    });
});