const notifier = require("node-notifier");
const path = require("path");
const fs = require("fs");

try {
    const app = JSON.parse(fs.readFileSync("auto-backup.json", "utf-8"));

    notifier.notify({
        title: `src: ${app.src}`,
        message: `dest: ${app.dest}`,
        icon: path.join(__dirname + `/../share.ico`),
        appID: `GDShare Auto-Backup ${require("./package.json").version}`
    });

} catch (e) { console.error(e) };