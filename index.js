const { BrowserWindow, app, shell, dialog } = require("electron");
const ipc = require("electron").ipcMain;
const path = require("path");
const fs = require("fs");

const GDShare = require("./scripts/backend/gdshare.js");
const UP = require("./scripts/backend/update.js");

GDShare.status.on("error", err => {
	console.log(err);
});

GDShare.initializeApp();

let wMain;
const global = {
	GDdata: "",
	GDlevels: [],
	version: require('./package.json').version
}

const dim = { w: 460, h: 550 };
const windowSettings = {
    frame: false, 
	icon: path.join(__dirname,"resources/share.ico"), 
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
			post({ action: "test", msg: "game win" });
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
			break;
		case "open-link":
			shell.openExternal(args.link);
			break;
		case "level-export":
			GDShare.exportLevel(args.levels, args.from ? args.from : global.GDlevels, args.path)
			.then(info => {
				post({ action: "info", msg: `<c-h a="checkmark"></c-h>&nbsp;&nbsp;${info}`});
			})
			.catch(err => {
				post({ action: "info", msg: `<c-h a="crossmark"></c-h>&nbsp;&nbsp;${err}`});
			});
			break;
		case "level-import":
			const to = args.to ? args.to : GDShare.getCCPath();
			toData = args.to ? false : global.GDdata;

			args.levels.forEach(lvl => {
				GDShare.importLevel(lvl.path, to, toData)
				.then(res => {
					global.GDlevels.push({ name: GDShare.getKey(res.levelData, "k2", "s"), data: res.levelData, index: global.GDlevels.length });
					global.GDdata = res.newData;
				})
				.catch(err => {
					post({ action: "info", msg: `<c-h a="crossmark"></c-h>&nbsp;&nbsp;${err}`});
				});
			});
			post({ action: "info", msg: `<c-h a="checkmark"></c-h>&nbsp;&nbsp;Succesfully imported!`});
			break;
		case "select-path":
			let pth = dialog.showOpenDialogSync({ title: args.title, properties: [args.dir ? "openDirectory" : ""] })
			pth ? pth = pth[0].replace(/\\/g,"/") : pth = "";
			post({ action: "path-selected", code: args.returnCode, path: pth });
			break;
		case "check-for-updates":
			post({ action: "info", msg: { type: "loading", msg: "Checking for updates..." } });
			UP.dog(global.version)
			.then(msg => {
				if (msg.status === "up-to-date") {
					post({
						action: "info",
						msg: `<c-h a="checkmark"></c-h>&nbsp;&nbsp;You are up to date! (v${global.version})`
					});
				} else if (msg.status === "new-available") {
					post({ 
						action: "info",
						msg: `<hyper-link link='https://github.com/HJfod/gdshare/releases/latest'>New version found! (${msg.newVer})</hyper-link>`
					});
				} else if (msg.status === "upper-to-date") {
					post({ 
						action: "info",
						msg: `You are using a version (${msg.oldVer}) newer than last stable release (${mgs.newVer}).`
					});
				}
			})
			.catch(err => {
				if (err.error === "not-200") {
					post({
						action: "info",
						msg: `<c-h a="crossmark"></c-h>&nbsp;&nbsp;${err.code}: Unable to check for updates!`
					});
				} else if (err.error === "cant-parse") {
					post({
						action: "info",
						msg: `<c-h a="crossmark"></c-h>&nbsp;&nbsp;${err.msg}: Unable to check for updates!`
					});
				}
			});
			break;
		case "init":
			post({ action: "init", obj: {
				appVersion: `v${global.version} inDEV-1`,
				appVersionNum: global.version
			} });

			const gpath = GDShare.getCCPath();
			const cpath = GDShare.getCCPath("gm");
			
			post({ action: "info", msg: { type: "loading", msg: "Loading user data..." } });

			GDShare.decodeCCFile(cpath)
			.then(udata => {
				const uinfo = GDShare.getGDUserInfo(udata);
				global.uInfo = uinfo;
				post({ action: "player-data", data: uinfo });

				post({ action: "info", msg: { type: "loading", msg: "Loading levels...<br>(This may take a while)" } });
				
				GDShare.decodeCCFile(gpath)
				.then(leveldata => {
					global.GDdata = leveldata;
	
					const levels = GDShare.getLevels(global.GDdata, name => {
						post({ action: "info", msg: { type: "loading", msg: `Loading ${name}...` } });
					});
	
					global.GDlevels = levels;
	
					post({ action: "level-list", levels: levels });
	
					post({ action: "info", msg: { type: "close" } });
				})
				.catch((err) => {
					post({ action: "info", msg: err });
				});
			})
			.catch(err => {
				post({ action: "info", msg: err });
			})
			break;
	}
});

function post(msg) {
	wMain.webContents.send("app", msg);
}