//const notifier = require("node-notifier");
const fs = require("fs");

const app = JSON.parse(fs.readFileSync("auto-backup.json", "utf-8"));
const id = `GDShare Auto-Backup ${require("./package.json").version}`;
const GDcheckRate = 5000;

try {
    console.log(id);

    let make = false;
    if (app.lastBackup) {
        if (
            (Math.round(+ new Date() / 1000 / 86400) - app.lastBackup) > app.createRate
        ) {
            make = true;
        }
    }
    if (app.createOnGDClose) make = false;

    if (make) {
        try {
            const c = create();
            if (c) {
                throw c;
            }
        } catch(e) {
            /*notifier.notify({
                title: `GD Auto-Backup failed!`,
                message: `${e}`,
                icon: path.join(__dirname + `/../share.ico`),
                appID: id
            });*/
            console.error(e);
        }
    }

    if (app.createOnGDClose) {
        checkGDLoop();
    }
} catch (e) { console.error(e) };

function checkGDLoop(collect = 0) {
    const limit = 1;

    setTimeout(() => {
        require("child_process").exec("tasklist", (stdin, stdout, stderr) => {
            if (stdout.toLowerCase().includes("geometrydash.exe")) {
                collect++;
            } else {
                if (collect > limit) {
                    const c = create();
                    if (c) {
                        throw c;
                    }
                }
                collect = 0;
            }
            checkGDLoop(collect);
        });
    }, GDcheckRate);
}

function create() {
    try {
        const ab = [];
        fs.readdirSync(app.dest, { withFileTypes: true }).forEach(f => {
            if (f.isDirectory()) {
                try {
                    fs.accessSync(`${app.dest}/${f.name}/autoRemove.txt`);
                    ab.push(f.name);
                } catch(e) {}
            }
        });

        while (ab.length >= Number(app.limit)) {
            try {
                fs.rmdirSync(`${app.dest}/${ab[0]}`,{ recursive: true });
                ab.splice(0,1);
            } catch (e) {
                console.log(e);
            }
        }
    
        const time = new Date();
        let dir = `${app.dest}/GDSHARE_BACKUP_${time.getFullYear()}-${time.getMonth()+1}-${time.getDate()}`;
        
        let n = 1;
        while (fs.existsSync(dir)) {
            n++;
            dir = dir.includes("#") ? dir.substring(0,dir.length-dir.split("#").pop().length-1) : dir;
            dir = dir + `#${n}`;
        }
        fs.mkdirSync(dir);
    
        [ `${app.src}/CCLocalLevels.dat`, `${app.src}/CCGameManager.dat` ].forEach(f => {
            const data = fs.readFileSync(f);
            fs.writeFileSync(`${dir}/${f.split("/").pop()}`, data);
        });
    
        fs.writeFileSync(`${dir}/autoRemove.txt`, `This backup will be removed when your set auto backup limit of ${app.limit} is reached.\n\nIf you'd like to preserve this backup, delete this text file.`);
    
        const data = JSON.parse(fs.readFileSync("auto-backup.json", "utf8"));
        data["lastBackup"] = Math.round(+ new Date() / 1000 / 86400);
        fs.writeFileSync("auto-backup.json", JSON.stringify(data), "utf8");

        /*notifier.notify({
            title: `GD Data has been backed up!`,
            message: `Click to view ${dir}`,
            icon: path.join(__dirname + `/../share.ico`),
            appID: id,
            wait: true
        }, () => {
            require('child_process').exec('start "" "' + dir + '"');
        });

        notifier.on("timeout", (notifierObject, options) => {
            process.exit();
        });*/

        console.log(`New backup made at ${dir}`);

        return false;
    } catch(e) {
        return e;
    }
}