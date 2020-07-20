const events = require("events");
const status = new events.EventEmitter();
const exec = require('child_process').exec;
const path = require("path");
const pako = require("pako");
const fs = require("fs");
const { performance } = require('perf_hooks');
const fileExt = ".gmd";

let dLoop = "";
let dir;
let OtherCCPath;

function decodeXor(dat, key) {
    /**
     * @author SMJS
     * @param {String} dat The data to decode
     * @param {Integrer} key The decoding key
     * @description Decode data as XOR
     * @returns {String} Decoded data
     */

    return dat.split("").map(str => String.fromCharCode(key ^ str.charCodeAt(0))).join("");
}

function decodeBase64(str) {
    /**
     * @author SMJS
     * @param {String} str The string to decode
     * @description Decode a Base64 string
     * @returns {String}
     */

    return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function verifyDataFolder(path) {
    /**
     * @author HJfod
     * @param {String} path Path to the folder you want to verify
     * @description Verify if a folder is indeed one that contains GD userdata
     * @returns {Boolean}
     */

    const requiredFiles = ["CCLocalLevels.dat","CCGameManager.dat"];
    fs.readdirSync(path, { withFileTypes: true }).forEach(i => {
        if (requiredFiles.includes(i.name)){
            requiredFiles.splice(requiredFiles.indexOf(i.name),1);
        }
    });
    
    return !requiredFiles.length;   // if both files found, length is 0, !0 = true
}

function getLevels(data, callback = null) {
    /**
     * @author GDColon, HJfod
     * @param {String} data The data to get levels from
     * @param {Function()} callback Callback function for each loaded level
     * @description Get all levels from a data file.
     * @returns {Object[]} name: Level name, data: level data, index: how manyeth level it is
     */
/*
    let levels = [];
    let levelList = data.match(/<k>k_\d+<\/k>.+?<\/d>\n? *<\/d>/gs);
    if (levelList) {
        levelList.forEach((lvl, index) => {
            let n = lvl.split(`<k>k2</k><s>`).pop();
            n = n.substring(0,n.indexOf("<")).replace(/'/g,'"');
            
            levels.push({ name: n, data: lvl, index: index });

            callback(n);
        });
    }*/

    /*  Displays names of each level as they're being loaded. Horrifyingly slow. */
    let levels = [];
    let found = true;
    while (found) {
        let lvl = data.match(/<k>k_\d+<\/k>.+?<\/d>\n? *<\/d>/);
        if (lvl) {
            lvl = lvl[0];
            data = data.substring(data.indexOf(lvl) + lvl.length);

            let n = lvl.split(`<k>k2</k><s>`).pop();
            n = n.substring(0,n.indexOf("<")).replace(/'/g,'"');
            
            levels.push({ name: n, data: lvl, index: levels.length });
    
            callback(n);
        } else {
            found = false;
        }
    }

    return levels;
}

function getGDUserInfo(data) {
    /**
     * @author HJfod
     * @param {String} data Decoded CCGameManager data to get user info from
     * @description Get certain user info from CCGameManager
     * @returns {Object} Error: Something went wrong, Data: the decoded save data.
     */

    const statdata = getKey(data, "GS_value", "d");
    return {
        name: getKey(data, "playerName", "s"),
        userID: getKey(data, "playerUserID", "i"),
        stats: {
            Jumps: getKey(statdata, "1", "s"),
            Total$Attempts: getKey(statdata, "2", "s"),
            Completed$Online$Levels: getKey(statdata, "4", "s"),
            Demons: getKey(statdata, "5", "s"),
            Stars: getKey(statdata, "6", "s"),
            Diamonds: getKey(statdata, "13", "s"),
            Orbs: getKey(statdata, "14", "s"),
            Coins: getKey(statdata, "8", "s"),
            User$Coins: getKey(statdata, "12", "s"),
            Killed$Players: getKey(statdata, "9", "s"),
        }
    };
}

function decodeCCFile(path) {
    /**
     * @author GDColon, HJfod
     * @param {String} path The path to the data folder
     * @description Validate and decode CCLocalLevels / CCGameManager
     * @returns {Object} Error: Something went wrong, Data: the decoded save data.
     */

    return new Promise((res, rej) => {
        let saveData;

        let t0 = performance.now();
        
        try {
            saveData = fs.readFileSync(path, "utf8");
        } catch (err) {
            rej(`Unable to read file! ${err}`);
        }

        let t1 = performance.now();
        console.log(`readFileSync ${Math.round(t1 - t0)}ms`);

        if (!saveData.startsWith('<?xml version="1.0"?>')){

            t0 = performance.now();
            
            try {
                saveData = new TextDecoder("utf-8").decode(pako.inflate(Buffer.from(saveData.split("").map((str) => String.fromCharCode(11 ^ str.charCodeAt(0))).join("").replace(/-/g, "+").replace(/_/g, "/"), "base64")))
            } catch(e) {
                rej(e);
            }

            t1 = performance.now();
            console.log(`decode ${Math.round(t1 - t0)}ms`);

            res(saveData);
        } else {
            console.log(`skipped decode`);
            res(saveData);
        }
    });
}

function importLevel(filePath, dataPath, data = "") {
    /**
     * @author GDColon, HJfod
     * @param {String} filePath Path to the level file
     * @param {String} dataPath Path to the data file
     * @param {String} [data] The data of the data file (if you already have it decoded and don't want to spend time redecoding)
     * @description Import a level into a data file.
     * @returns {Promise} reject: Something went wrong, resolve: { newData: the new save data with the level imported, info: What level was imported. }
     */

    return new Promise((res, rej) => {
        try { fs.accessSync(filePath) } catch(err) {
            rej(`Couldn't access file: ${err}`);
        }

        if (!data) {
            data = decodeCCFile(dataPath);
        }
        
        let levelFile = fs.readFileSync(filePath, 'utf8');

        data = data.replace(/<k>k1<\/k><i>\d+?<\/i>/g,"");	// remove uploaded id
        data = data.split("<k>_isArr</k><t />")
        data[1] = data[1].replace(/<k>k_(\d+)<\/k><d><k>kCEK<\/k>/g, (n) => { return "<k>k_" + (Number(n.slice(5).split("<")[0])+1) + "</k><d><k>kCEK</k>" })
        data = data[0] + "<k>_isArr</k><t /><k>k_0</k>" + levelFile + data[1]
        
        fs.writeFileSync(dataPath, data, 'utf8');

        res({ newData: data, levelData: levelFile, info: `Imported ${levelFile.match(/<k>k2<\/k><s>(.+?)<\/s>/)}.` });
    });
}

function exportLevel(names, from, exportPath) {
    /**
     * @author GDColon, HJfod
     * @param {String[]} names The names of the levels you want to export
     * @param {String[]} from Decoded levels array
     * @param {String} exportPath Folder where the level should be exported to.
     * @description a level from a data file.
     * @returns {Promise} reject: Something went wrong, resolve: What level was exported to where.
     */

    return new Promise((res, rej) => {
        names.forEach(name => {
            let foundLevel = from.find(x => x.name === name);
            if (!foundLevel){
                rej(`Level '${name}' not found.`);
            }else{
                if (!exportPath) exportPath = getDir();
                let outputdir = `${exportPath}/${name}.gmd`;		// path
                let n = 0;
                while (fs.existsSync(outputdir)) {	// check if level with same name exists
                    outputdir = outputdir.substring(0,outputdir.length - name.length - 4 - (n ? n.toString().length : 0)) + name + n + ".gmd";
                    n++;
                    if (n > 20) rej("Too many levels exported with this name.");
                }
                fs.writeFileSync(outputdir, foundLevel.data.replace(/<k>k_\d+<\/k>/, ""), 'utf8');
                
                res(`Exported ${name} to ${exportPath}.`);
            }
        });
    });
}

function getKey(lvl, key, type, legacy = false) {
    /**
     * @author HJfod
     * @param {String} lvl Level data
     * @param {String} key The key to get
     * @param {String} type The type of key to get
     * @description Get a value from level data
     * @returns {String}
     */

    if (type === null){
        return lvl.split(`<k>${key}</k>`).pop().substring(0,100);
    }
    if (type){
        return lvl.split(`<k>${key}</k><${type}>`).pop().substring(0,lvl.split(`<k>${key}</k><${type}>`).pop().indexOf(legacy ? `<` : `</${type}>`));
    }else{
        return lvl.split(`<k>${key}</k>`).pop().substring(0,lvl.split(`<k>${key}</k>`).pop().indexOf('>')).includes("t");
    }
}

function replaceOfficialSongName(i) {
    /**
     * @author HJfod
     * @param {Number} i Song ID
     * @description Replace official song ID with the song's name
     * @returns {String}
     */

    let s = {
        0: 'Stereo Madness',
        1: 'Back on Track',
        2: 'Polargeist',
        3: 'Dry Out',
        4: 'Base After Base',
        5: 'Cant Let Go',
        6: 'Jumper',
        7: 'Time Machine',
        8: 'Cycles',
        9: 'xStep',
        10:'Clutterfunk',
        11:'Theory of Everything',
        12:'Electroman Adventures',
        13:'Clubstep',
        14:'Electrodynamix',
        15:'Hexagon Force',
        16:'Blast Processing',
        17:'Theory of Everything 2',
        18:'Geometrical Dominator',
        19:'Deadlocked',
        20:'Fingerdash'
    }
    return s[i];
}

function getLevelInfo(name, from = "") {
    /**
     * @author HJfod
     * @param {String} name The name / file path of the level to get
     * @param {String} [from] Decoded levels array to get the level from (don't supply if from level path)
     * @description Decode a Base64 string
     * @returns {Object} error: String saying what went wrong, info: Info about the level
     */

    return new Promise((res, rej) => {
        let foundLevel;
        
        if (from){
            foundLevel = from.find(x => x.name === name);
            if (foundLevel) foundLevel = foundLevel.data;
        }else{      // name was a path
            try { fs.accessSync(name) } catch(err) {
                rej("Unable to access file.");
            }
            if ( !name.endsWith(fileExt) ) rej("File is not a .gmd file.");
            foundLevel = fs.readFileSync(name, 'utf8');
        }
    
        if (!foundLevel){
            rej("Level not found.");
        }else{
            let time = getKey(foundLevel, "k80", "i", 1);
            let p = getKey(foundLevel, "k41", "i", 1);
            let song = getKey(foundLevel, "k8", "i", 1);
            let rev = getKey(foundLevel, "k46", "i", 1);
            let desc = decodeBase64(getKey(foundLevel, "k3", "s", 1)).toString("utf8");
            let copy = getKey(foundLevel, "k42", "i", 1);
    
            let levelInfo = {};
            levelInfo["Name"] = getKey(foundLevel, "k2", "s", 1);
            levelInfo["Length"] = getKey(foundLevel, "k23", "i", 1).replace(/^\s*$/,"Tiny").replace("1","Short").replace("2","Medium").replace("3","Long").replace("4","XL");
            levelInfo["Creator"] = getKey(foundLevel, "k5", "s", 1);
            levelInfo["Version"] = getKey(foundLevel, "k16", "i", 1);
            levelInfo["Password"] = (p === "1") ? "Free to copy" : (p === "") ? "No copy" : p.substring(1);
            levelInfo["Song"] = song ? replaceOfficialSongName(song) : getKey(foundLevel, "k45", "i", 1);
            levelInfo["Description"] = desc;
            levelInfo["Object$count"] = getKey(foundLevel, "k48", "i", 1);
            levelInfo["Editor$time"] = time > 3600 ? (time/3600).toFixed(1) + "h" : (time/60).toFixed(1) + "m";
            levelInfo["Verified"] = getKey(foundLevel, "k14", false, 1);
            levelInfo["Attempts"] = getKey(foundLevel, "k18", "i", 1);
            levelInfo["Revision"] = rev === "" ? "None" : rev;
            levelInfo["Copied$from"] = copy === "" ? "None" : copy;
            
            res(levelInfo);
        }

    });
}

function getDir() {
    /**
     * @author HJfod
     * @description Returns the app's path
     * @returns {String}
     */
    
    return dir;
}

function getCCPath(which = "ll") {
    if (OtherCCPath) {
        if (which === "gm") {
            return `${OtherCCPath}/CCGameManager.dat`;
        } else {
            return `${OtherCCPath}/CCLocalLevels.dat`;
        }
    } else {
        if (which === "gm") {
            return ((process.env.HOME || process.env.USERPROFILE) + "/AppData/Local/GeometryDash/CCGameManager.dat").replace(/\\/g,"/");
        } else {
            return ((process.env.HOME || process.env.USERPROFILE) + "/AppData/Local/GeometryDash/CCLocalLevels.dat").replace(/\\/g,"/");
        }
    }
}

function setCCFolder(to) {
    OtherCCPath = to;
}

function test() {
    return "Hello world!";
}

function initializeApp() {
    dTesting: for (let i = 0; i < 5; i++) {
        try {
            fs.accessSync(path.join(__dirname + dLoop + "/resources"));
        } catch (err) {
            dLoop += "/..";
            continue dTesting;
        }
    }

    dir = path.join(__dirname + dLoop).replace(/\\/g,"/");
}

module.exports = {
    decodeXor,
    decodeBase64,
    verifyDataFolder,
    getLevels,
    decodeCCFile,
    importLevel,
    exportLevel,
    getKey,
    replaceOfficialSongName,
    getLevelInfo,
    test,
    initializeApp,
    getDir,
    getGDUserInfo,
    getCCPath,
    setCCFolder,
    status
}