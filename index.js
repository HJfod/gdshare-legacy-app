const { BrowserWindow, app, shell, dialog, Menu } = require("electron");
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
	version: require('./package.json').version,
	production: require('./package.json').production,
	largeFileSize: 20,
	decodeCCGM: true,
	firstTime: false,
	backupFolder: ""
}

const dim = { w: 440, h: 550 };
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

const requiredDir = ["data"];
requiredDir.forEach(dir => {
	dir = `${GDShare.getDir()}/${dir}`;
	try { fs.accessSync(dir) } catch(e) {
		fs.mkdirSync(dir);
	}
});

const tutorial = [
    {
        screen: "home",
        text: "This is the Home screen. Here you can see your current GD stats and account info."
    },
    {
        screen: "export",
        text: "Welcome to the Export tab. This is where you export levels from GD!"
	},
	{
		screen: "export",
		text: "Here you can see a list of your GD levels. To export level(s), select them from the list and press Export Selected!",
		highlight: [
			"#level-list"
		]
	},
	{
		screen: "export",
		text: "By default, all levels are exported to the same folder as GDShare.exe resides in. If you'd like to export somewhere else, Select Export Path before exporting.",
		highlight: [
			'[tID="e-path"]'
		]
	},
	{
		screen: "import",
		text: "This is the Import tab. Here you can Import levels into GD!"
	},
	{
		screen: "import",
		text: "To import a level, simply drag and drop it on the Import button, or click the Import button to browse and select a file.",
		highlight: [
			"imported-levels drop-area"
		]
	},
	{
		screen: "import",
		text: "After loading the file, it's not yet been imported. Widget(s) for the level(s) you have selected will appear below the Import button.",
		send: [{
			action: "level-info",
			info: {
				Name: "Example level",
				Length: "Long",
				Creator: "HJfod",
				Version: "1",
				Password: "177013",
				Song: "513357",
				Description: "This is an example of an Imported Level.",
				Object$count: "1337",
				Editor$time: "16y",
				Verified: "False",
				Attempts: "65535",
				Revision: "None",
				Copied$from: "None"
			},
			returnCode: "import::__EXAMPLE"
		}],
		highlight: [
			'#import-example'
		]
	},
	{
		screen: "import",
		text: "Within the widget, you have options to view level info and import it.",
		send: [{
			action: "click",
			obj: '#import-example roll-over'
		}],
		highlight: [
			'#import-example'
		]
	},
	{
		screen: "import",
		text: "If you choose not to import a level, click Close.",
		highlight: [
			'#import-example roll-over roll-content button:nth-of-type(2)'
		]
	},
	{
		screen: "home",
		text: "This is the end of the tutorial. Have fun! :)",
		send: [{
			action: "returnCode",
			code: "remove-import::import-example"
		}]
	}
];

app.on("ready", () => {
    wMain = new BrowserWindow(windowSettings);

	wMain.loadFile("index.html");

	wMain.setMenu(global.production ? null : Menu.buildFromTemplate(devMenu));

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

		case "switch-theme":
			const d = fs.readFileSync(`${GDShare.getDir()}/resources/${args.to}.gdst`, "utf-8");
			post({ action: "switch-theme", data: d });
			saveToUserData("theme", args.to);
			break;

		case "level-export":
			post({ action: "info", msg: { type: "loading", msg: `Exporting level...` } });

			GDShare.exportLevel(args.levels, args.from ? args.from : global.GDlevels, args.path)
			.then(info => {
				post({ action: "info", msg: `<c-h a="checkmark"></c-h>&nbsp;&nbsp;${info}`});
			})
			.catch(err => {
				post({ action: "info", msg: `<c-h a="crossmark"></c-h>&nbsp;&nbsp;${err}`});
			});
			break;

		case "level-import":
			post({ action: "info", msg: { type: "loading", msg: `Importing level...` } });

			const to = args.to ? args.to : GDShare.getCCPath();
			toData = args.to ? false : global.GDdata;

			args.levels.forEach(lvl => {
				GDShare.importLevel(lvl.path, to, toData)
				.then(res => {
					global.GDlevels.unshift({ name: GDShare.getKey(res.levelData, "k2", "s"), data: res.levelData, index: global.GDlevels.length });
					global.GDdata = res.newData;

					post({ action: "level-list", levels: global.GDlevels });

					if (args.returnCode) {
						post({ action: "returnCode", code: args.returnCode });
					}

					post({ action: "info", msg: `<c-h a="checkmark"></c-h>&nbsp;&nbsp;Succesfully imported!`});
				})
				.catch(err => {
					post({ action: "info", msg: `<c-h a="crossmark"></c-h>&nbsp;&nbsp;${err}`});
				});
			});
			break;

		case "level-get-info":
			const check = () => { switch (args.from) {
				case "default":
					return global.GDlevels;
				default:
					return null;
			} };
			const from = check();

			GDShare.getLevelInfo(args.name, from)
			.then(val => {
				post({ action: "level-info", info: val, returnCode: args.returnCode ? args.returnCode : null });
			})
			.catch(err => {
				post({ action: "info", msg: `<c-h a="crossmark"></c-h>&nbsp;&nbsp;${err}` });
			});
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
						msg: `You are using a version (${msg.oldVer}) newer than last stable release (${msg.newVer}).`
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

		case "toggle-dev-mode":
			if (args.mode === "true") {
				wMain.setMenu(Menu.buildFromTemplate(devMenu));
			} else {
				wMain.setMenu(null);
			}
			break;
			
		case "save-to-data":
			saveToUserData(args.key, args.val);
			break;

		case "new-backup":
			post({ action: "info", msg: { type: "loading", msg: `Creating backup...` } });

			const time = new Date();
			const dir = `${global.backupFolder}/GDSHARE_BACKUP_${time.getFullYear()}-${time.getMonth()}-${time.getDate()}`;
			fs.mkdirSync(dir);

			[ GDShare.getCCPath(), GDShare.getCCPath("gm") ].forEach(f => {
				const data = fs.readFileSync(f);
				fs.writeFileSync(`${dir}/${f.split("/").pop()}`, data);
			});

			post({ action: "info", msg: { type: "close" } });
			post({ action: "made-backup", name: dir.split("/").pop() });
			break;

		case "select-backup-folder":
			try {
				const f = dialog.showOpenDialogSync({
					title: "Select backups folder",
					defaultPath: args.current,
					buttonLabel: "Select",
					properties: [
						"openDirectory"
					]
				})[0].replace(/\\/g,"/");
				if (f) {
					post({
						action: "new-backup-folder",
						folder: f
					});
					global.backupFolder = f;
					saveToUserData("backupFolder", f);
				}
			} catch(e) {};
			break;
		
		case "init":
			global.backupFolder = GDShare.getCCPath().substring(0, GDShare.getCCPath().lastIndexOf("/"));

			try {
				fs.accessSync("data/userdata.txt");

				post({ action: "info", msg: { type: "loading", msg: `Loading app data...` } });
				const udat = JSON.parse( fs.readFileSync(`${GDShare.getDir()}/data/userdata.txt`, "utf8") );
				if (udat.theme) {
					const d = fs.readFileSync(`resources/${udat.theme}.gdst`, "utf-8");
					post({ action: "switch-theme", data: d });
				}
				if (udat.scale) post({ action: "rescale", scale: udat.scale });
				if (udat.checkbox) {
					post({ action: "checkbox-states", states: udat.checkbox });
					if (udat.checkbox.loadccgm === false) {
						global.decodeCCGM = false;
					}
				}
				if (udat.backupFolder) global.backupFolder = udat.backupFolder;
			} catch(e) {
				global.firstTime = true;
			};

			post({ action: "init", obj: {
				appVersion: `v${global.version} inDEV-3`,
				appVersionNum: global.version,
				production: global.production,
				backupFolder: global.backupFolder
			} });

			const backupList = [];
			fs.readdirSync(global.backupFolder, { withFileTypes: true }).forEach(f => {
				if (f.isDirectory()) {
					if (f.name.startsWith("GDSHARE_BACKUP_")) {
						backupList.push(f.name);
					}
				}
			});
			post({
				action: "backup-list",
				list: backupList
			});

			const gpath = GDShare.getCCPath();
			const cpath = GDShare.getCCPath("gm");
			
			if (global.decodeCCGM) {
				post({ action: "info", msg: { type: "loading", msg: `Loading GD data...${(fs.statSync(cpath).size / 1000000) > global.largeFileSize ? "<br>(This may take a while)" : ""}` } });

				GDShare.decodeCCFile(cpath)
				.then(udata => {
					const uinfo = GDShare.getGDUserInfo(udata);
					global.uInfo = uinfo;
					post({ action: "player-data", data: uinfo });
	
					post({ action: "info", msg: { type: "loading", msg: `Loading levels...${(fs.statSync(gpath).size / 1000000) > global.largeFileSize ? "<br>(This may take a while)" : ""}` } });
					
					decodeCCLevels(gpath);
				})
				.catch(err => {
					post({ action: "info", msg: err });
				});
			} else {
				post({ action: "player-data", data: { title: "Welcome to GDShare.", sub: "GD user data loading has been disabled." }, didntDecode: true });

				decodeCCLevels(gpath);
			}
			break;
	}
});

function decodeCCLevels(gpath) {
	GDShare.decodeCCFile(gpath)
	.then(leveldata => {
		global.GDdata = leveldata;

		const levels = GDShare.getLevels(global.GDdata, name => {
			post({ action: "info", msg: { type: "loading", msg: `Loading ${name}...` } });
		});

		global.GDlevels = levels;

		post({ action: "level-list", levels: levels });

		post({ action: "info", msg: { type: "close" } });

		if (global.firstTime) {
			setTimeout(() => {
				const ask = dialog.showMessageBoxSync({
					type: "question",
					buttons: [
						"Yes", "No"
					],
					message: "It seems like you are new to GDShare! Would you like a quick walkthrough?"
				});
				if (ask === 0) {
					let quitTutorial = false
					tutorial.forEach((t, ix) => {
						if (!quitTutorial) {
							if (t.send) {
								t.send.forEach(s => post(s));
							}
							post({ action: "show-tutorial", screen: t.screen, highlight: t.highlight ? t.highlight : null });
							const ans = dialog.showMessageBoxSync(wMain, {
								type: "info",
								buttons:  ix === tutorial.length-1 ? [ "Finish Tutorial" ] : [ "Next", "End Tutorial" ],
								message: t.text
							});
							if (ans === 1) {
								quitTutorial = true;
							}
						}
					});
				}
			}, 2000);
		}
	})
	.catch((err) => {
		post({ action: "info", msg: err });
	});
}

function post(msg) {
	wMain.webContents.send("app", msg);
}

function saveToUserData(key, val) {
	try { fs.accessSync("data/userdata.txt") } catch(e) { fs.writeFileSync("data/userdata.txt", `{}`, "utf8") };

	const data = JSON.parse(fs.readFileSync("data/userdata.txt", "utf8"));
	if (typeof val === "object") {
		if (!data[key]) data[key] = {};
		data[key][val.key] = val.val;
	} else {
		data[key] = val;
	}
	fs.writeFileSync("data/userdata.txt", JSON.stringify(data), "utf8");
}

const devMenu = [
	{
		label: "File",
		submenu: [
			{ role: "quit" }
		]
	},
	{
		label: "Dev",
		submenu: [
			{ role: "reload" },
			{ role: "forcereload" },
			{ role: "toggledevtools" }
		]
	}
];