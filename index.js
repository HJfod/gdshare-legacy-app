const { BrowserWindow, app } = require("electron");
const ipc = require("electron").ipcMain;
const path = require("path");
const fs = require("fs");

const GDShare = require("./scripts/backend/gdshare.js");

GDShare.status.on("error", err => {
	console.log(err);
});

GDShare.initializeApp();

let wMain;

const dim = { w: 400, h: 550 };
const windowSettings = {
    frame: false, 
//	icon: path.join(__dirname,"resources/icon-2.ico"), 
	height: dim.h, 
	width: dim.w, 
	webPreferences: { 
		preload: path.join(__dirname, "scripts/preload.js"), 
		nodeIntegration: false, 
		enableRemoteModule: false, 
		contextIsolation: true
	} 
};

app.on("ready", () => {
    wMain = new BrowserWindow(windowSettings);

	wMain.loadFile("index.html");

	//wMain.setMenu(null);

    wMain.on("closed", () => {
        app.quit();
    });
});

ipc.on("app", (event, args) => {
	args = JSON.parse(args);
	switch (args.action) {
		case "test":
			wMain.webContents.send("app", { action: "test", msg: "game win" });
			break;
		case "app-mz":
			wMain.minimize();
			break;
		case "app-fs":
			if (wMain.isMaximized()){
				wMain.unmaximize();
			}else{
				wMain.maximize();
			}
	}
});