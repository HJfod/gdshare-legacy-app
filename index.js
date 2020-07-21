const { BrowserWindow, app, shell, dialog, Menu } = require("electron");
const ipc = require("electron").ipcMain;
const path = require("path");
const fs = require("fs");
const ncp = require('ncp').ncp

const GDShare = require("./scripts/backend/gdshare.js");
const UP = require("./scripts/backend/update.js");
const update = require("./scripts/backend/update.js");

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
	backupFolder: "",
	defaultCCPath: GDShare.getCCPath().substring(0, GDShare.getCCPath().lastIndexOf("/")),
	autoBackupLocation: `${GDShare.getDir()}/resources/autobackup/auto-backup.json`,
	autoBackups: false
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
		screen: "backup",
		text: "This is the Backups screen. Here you can make and load backups of your GD data!",
		send: [{
			action: "returnCode",
			code: "remove-import::import-example"
		}]
	},
	{
		screen: "backup",
		text: "To create a new backup, click New backup.",
		highlight: [
			'[tID="new-b"]'
		]
	},
	{
		screen: "backup",
		text: "If you have previously made backups, you can import them by clicking Import backup.",
		highlight: [
			'[tID="imp-b"]'
		]
	},
	{
		screen: "backup",
		text: "By default, your backups will be made and stored in the same location as your GD data. If you'd like to change the location, click Change and select a path to a preferably empty folder. All your current backups will be moved to the new location!",
		highlight: [
			'[tID="cha-bf"]'
		]
	},
	{
		screen: "backup",
		text: "To load a backup and change your current data to it, hover over a backup and click Load."
	},
	{
		screen: "backup",
		text: "If you'd like to see what levels and stats the backup has, click View."
	},
	{
		screen: "home",
		text: "This is the end of the tutorial. If you need any further help, check the Help buttons on each page! Have fun! :)"
	}
];

app.on("ready", () => {
	checkGDOpen();

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
		
		case "open-folder":
			require('child_process').exec('start "" "' + args.folder + '"');
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
			checkUpdates();
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
		
		case "import-backup":
			try {
				const f = dialog.showOpenDialogSync({
					title: "Select directory to import",
					defaultPath: args.current,
					buttonLabel: "Select",
					properties: [
						"openDirectory"
					]
				})[0].replace(/\\/g,"/");
				fs.accessSync(f);

				const required = [ "CCLocalLevels.dat", "CCGameManager.dat" ];
				fs.readdirSync(f).forEach(file => {
					required.forEach(r => {
						if (file === r) required.splice(required.indexOf(r),1);
					})
				});

				if (required.length > 0) {
					post({
						action: "info",
						msg: `<c-h a="crossmark"></c-h>&nbsp;&nbsp;This doesn't appear to be a backup folder.`
					});
				} else {
					ncp(f, `${global.backupFolder}/${f.split("/").pop()}`, err => {
						if (err) throw err;

						post({ action: "made-backup", name: f.split("/").pop() });
					});
				}
			} catch(e) {
				post({ action: "info", msg: e });
			}
			break;

		case "new-backup":
			makeNewBackup();
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
				fs.accessSync(f);

				post({ action: "info", msg: { type: "loading", msg: `Moving backups...` } });
				post({
					action: "new-backup-folder",
					folder: f
				});
				const lastFolder = global.backupFolder;
				fs.readdirSync(lastFolder, { withFileTypes: true }).forEach(d => {
					try {
						if (d.isDirectory()) {
							fs.accessSync(`${lastFolder}/${d.name}/CCLocalLevels.dat`);
							fs.renameSync(`${lastFolder}/${d.name}`,`${f}/${d.name}`);
						}
					} catch(e) {}
				});
				refreshBackups(f);
				global.backupFolder = f;
				saveToUserData("backupFolder", f);
				saveToUserData("dest", global.backupFolder, global.autoBackupLocation);
				post({ action: "info", msg: { type: "close" } });
			} catch(e) {};
			break;
		
		case "refresh-backups":
			refreshBackups(global.backupFolder);
			break;
		
		case "switch-to-backup":
			const ask = dialog.showMessageBoxSync({
				type: "question",
				buttons: [
					"Yes", "No", "Cancel"
				],
				cancelId: 2,
				message: "Do you want to backup your current GD process before loading?"
			});
			if (ask === 0) {
				makeNewBackup();
			}
			if (ask !== 2) {
				post({ action: "info", msg: { type: "loading", msg: `Switching to backup...` } });

				const CCL = fs.readFileSync(`${global.backupFolder}/${args.to}/CCLocalLevels.dat`);
				const CCG = fs.readFileSync(`${global.backupFolder}/${args.to}/CCGameManager.dat`);

				fs.writeFileSync(GDShare.getCCPath(), CCL);
				fs.writeFileSync(GDShare.getCCPath("gm"), CCG);

				refreshGDData();
			}
			break;
		
		case "view-backup":
			const gpath = `${global.backupFolder}/${args.which}/CCLocalLevels.dat`;
			const cpath = `${global.backupFolder}/${args.which}/CCGameManager.dat`;

			post({ action: "info", msg: { type: "loading", msg: `Loading backup data... (1/2)` } });

			GDShare.decodeCCFile(cpath)
			.then(udata => {
				const uinfo = GDShare.getGDUserInfo(udata);

				post({ action: "info", msg: { type: "loading", msg: `Loading backup data... (2/2)` } });

				GDShare.decodeCCFile(gpath)
				.then(leveldata => {
					try {
						const levels = GDShare.getLevels(leveldata, () => {}).map(x => x.name);

						let stats = "";
						Object.keys(uinfo.stats).forEach(k => {
							stats += `${k.replace(/\$/g, " ")}: ${uinfo.stats[k]}<br>`;
						});

						post({
							action: "info",
							msg: `<h3>Viewing Backup of ${uinfo.name}</h3>
							<roll-over>
								<roll-text>Stats</roll-text>
								<roll-content>${stats}</roll-content>
							</roll-over>
							<roll-over>
								<roll-text>Levels</roll-text>
								<roll-content>
								<scroll-content>${levels.map(x => ` <c-d></c-d>&nbsp;${x}`).join("<br>")}</scroll-content>
								</roll-content>
							</roll-over>
							`
						});
					} catch(err) {
						post({ action: "info", msg: err });
					}
				})
				.catch(err => {
					post({ action: "info", msg: err });
				});
			})
			.catch(err => {
				post({ action: "info", msg: err });
			});
			break;

		case "change-auto-backup-rate":
			let rate;
			let rn = args.rate.match(/\d+/);
			rn = rn ? rn[0] : 1;
			let rd;
			[
				["day", 1],
				["week", 7],
				["month", 30]
			].forEach(x => {
				if (args.rate.includes(x[0])) {
					rd = x[1];
				}
			});
			rate = rn * rd;
			saveToUserData(`${args.type}Rate`, rate, global.autoBackupLocation);
			break;

		case "toggle-auto-backups":
			saveToUserData(`enabled`, args.mode, global.autoBackupLocation);
			break;
		
		case "init":
			global.backupFolder = global.defaultCCPath;

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
				if (udat.checkbox.autoupdate !== false) {
					checkUpdates(true);
				}
				if (udat.CCPath) {
					GDShare.setCCFolder(udat.CCPath);
				}
			} catch(e) {
				global.firstTime = true;
			};

			post({ action: "init", obj: {
				appVersion: `v${global.version} inDEV-4`,
				appVersionNum: global.version,
				production: global.production,
				backupFolder: global.backupFolder,
				defaultCCPath: global.defaultCCPath
			} });

			
			saveToUserData("src", GDShare.getCCPath().substring(0, GDShare.getCCPath().lastIndexOf("/")), global.autoBackupLocation);
			saveToUserData("dest", global.backupFolder, global.autoBackupLocation);

			refreshBackups(global.backupFolder);

			refreshGDData();
			break;
		
		case "refresh-app":
			refreshGDData();
			break;
		
		case "view-tutorial":
			const asktut = dialog.showMessageBoxSync({
				type: "info",
				buttons: [ "How to use GDShare on a GDPS (Private Server)", "View tutorial", "Cancel" ],
				message: "What would you like help with?"
			});
			switch (asktut) {
				case 0:
					// TODO
					break;
				case 1:
					showTutorial();
					break;
			}
			break;
		
		case "select-new-cc-path":
			if (args.reset) {
				GDShare.setCCFolder(null);

				post({
					action: "new-cc-path",
					path: global.defaultCCPath
				});

				saveToUserData("CCPath", null);
				saveToUserData("src", global.defaultCCPath, global.autoBackupLocation);

				refreshGDData();
			} else {
				try {
					const f = dialog.showOpenDialogSync({
						title: "Select folder for CC files",
						buttonLabel: "Select",
						properties: [
							"openDirectory"
						]
					})[0].replace(/\\/g,"/");
					fs.accessSync(f);
	
					GDShare.setCCFolder(f);

					post({
						action: "new-cc-path",
						path: f
					});

					saveToUserData("CCPath", f);
					saveToUserData("src", f, global.autoBackupLocation);

					refreshGDData();
				} catch(e) {}
			}
			break;
	}
});

function checkUpdates(noinfo = false) {
	post({ action: "info", msg: { type: "loading", msg: "Checking for updates..." } });
	UP.dog(global.version)
	.then(msg => {
		if (msg.status === "up-to-date" && noinfo === false) {
			post({
				action: "info",
				msg: `<c-h a="checkmark"></c-h>&nbsp;&nbsp;You are up to date! (v${global.version})`
			});
		} else if (msg.status === "new-available") {
			post({ 
				action: "info",
				msg: `<hyper-link link='https://github.com/HJfod/gdshare/releases/latest'>New version found! (${msg.newVer})</hyper-link>`
			});
		} else if (msg.status === "upper-to-date" && noinfo === false) {
			post({ 
				action: "info",
				msg: `You are using a version (${msg.oldVer}) newer than last stable release (${msg.newVer}).`
			});
		}
	})
	.catch(err => {
		if (err.error === "not-200" && noinfo === false) {
			post({
				action: "info",
				msg: `<c-h a="crossmark"></c-h>&nbsp;&nbsp;${err.code}: Unable to check for updates!`
			});
		} else if (err.error === "cant-parse" && noinfo === false) {
			post({
				action: "info",
				msg: `<c-h a="crossmark"></c-h>&nbsp;&nbsp;${err.msg}: Unable to check for updates!`
			});
		}
	});
}

function checkGDOpen() {
	if (require('child_process').execSync("tasklist").toString().toLowerCase().indexOf('geometrydash.exe') > -1) {
		dialog.showMessageBoxSync({
			type: "error",
			buttons: [ "OK" ],
			message: "You can not have GD open while using this app."
		});
		app.quit();
	};
	setTimeout(() => { checkGDOpen() }, 10000);
}

function refreshGDData() {
	const gpath = GDShare.getCCPath();
	const cpath = GDShare.getCCPath("gm");
	
	if (global.decodeCCGM) {
		post({ action: "info", msg: { type: "loading", msg: `Loading GD data...${(fs.statSync(cpath).size / 1000000) > global.largeFileSize ? "<br>(This may take a while)" : ""}` } });

		GDShare.decodeCCFile(cpath)
		.then(udata => {
			const uinfo = GDShare.getGDUserInfo(udata);
			global.uInfo = uinfo;
			post({ action: "player-data", data: uinfo });
			
			decodeCCLevels(gpath);
		})
		.catch(err => {
			post({ action: "info", msg: err });
		});
	} else {
		post({ action: "player-data", data: { title: "Welcome to GDShare.", sub: "GD user data loading has been disabled." }, didntDecode: true });

		decodeCCLevels(gpath);
	}
}

function decodeCCLevels(gpath) {
	post({ action: "info", msg: { type: "loading", msg: `Loading levels...${(fs.statSync(gpath).size / 1000000) > global.largeFileSize ? "<br>(This may take a while)" : ""}` } });

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
					showTutorial();
				}
			}, 2000);
		}
	})
	.catch(err => {
		post({ action: "info", msg: err });
	});
}

function showTutorial() {
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

function refreshBackups(folder) {
	const backupList = [];
	fs.readdirSync(folder, { withFileTypes: true }).forEach(f => {
		if (f.isDirectory()) {
			try {
				fs.accessSync(`${folder}/${f.name}/CCLocalLevels.dat`);
				backupList.push(f.name);
			} catch(e) {};
		}
	});
	post({
		action: "backup-list",
		list: backupList
	});
}

function makeNewBackup() {
	post({ action: "info", msg: { type: "loading", msg: `Creating backup...` } });

	const time = new Date();
	let dir = `${global.backupFolder}/GDSHARE_BACKUP_${time.getFullYear()}-${time.getMonth()+1}-${time.getDate()}`;
	
	let n = 1;
	while (fs.existsSync(dir)) {
		n++;
		dir = dir.includes("#") ? dir.substring(0,dir.length-dir.split("#").pop().length-1) : dir;
		dir = dir + `#${n}`;
	}
	fs.mkdirSync(dir);

	[ GDShare.getCCPath(), GDShare.getCCPath("gm") ].forEach(f => {
		const data = fs.readFileSync(f);
		fs.writeFileSync(`${dir}/${f.split("/").pop()}`, data);
	});

	post({ action: "info", msg: { type: "close" } });
	post({ action: "made-backup", name: dir.split("/").pop() });
}

function post(msg) {
	wMain.webContents.send("app", msg);
}

function saveToUserData(key, val, where = "data/userdata.txt") {
	try { fs.accessSync(where) } catch(e) { fs.writeFileSync(where, `{}`, "utf8") };

	const data = JSON.parse(fs.readFileSync(where, "utf8"));
	if (typeof val === "object" && val !== null) {
		if (!data[key]) data[key] = {};
		data[key][val.key] = val.val;
	} else {
		data[key] = val;
	}
	fs.writeFileSync(where, JSON.stringify(data), "utf8");
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