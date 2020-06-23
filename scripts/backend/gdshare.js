const events = require("events");
const status = new events.EventEmitter();
const exec = require('child_process').exec;
const path = require("path");
const fs = require("fs");

let dLoop = "";
let dir;

function decodeXor(str, key) {
    /**
     * @author GDColon
     * @param {String} str The data to decode
     * @param {Integrer} key The decoding key
     * @description Decode data as XOR
     * @returns {String} Decoded data
     */

    str = String(str).split('').map(letter => letter.charCodeAt());
    let res = "";
    for (let i in str) res += String.fromCodePoint(str[i] ^ key);
    return res;
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

function getLevels(data) {
    /**
     * @author GDColon, HJfod
     * @param {String} data The data to get levels from
     * @description Get all levels from a data file.
     * @returns {Object[]} name: Level name, data: level data, index: how manyeth level it is
     */

    let levels = [];
    let levelList = data.match(/<k>k_\d+<\/k>.+?<\/d>\n? *<\/d>/gs)
    if (levelList) {
        levelList.forEach((lvl, index) => {
            let n = lvl.split(`<k>k2</k><s>`).pop();
            n = n.substring(0,n.indexOf("<")).replace(/'/g,'"');
            
            levels.push({ name: n, data: lvl, index: index });
        });
    }
    return levels;
}

function decodeCCLocalLevels(path) {
    /**
     * @author GDColon, HJfod
     * @param {String} path The path to the data folder
     * @description Validate and decode CCLocalLevels
     * @returns {Object} Error: Something went wrong, Data: the decoded save data.
     */

    let saveData;
    
    try {
        saveData = fs.readFileSync(path, "utf8");
    } catch (err) {
        return { error: "Unable to read file!" };
    }

    if (!saveData.startsWith('<?xml version="1.0"?>')){
        saveData = decodeXOR(saveData, 11);
        saveData = Buffer.from(saveData, 'base64');
        try {
            saveData = zlib.unzipSync(saveData).toString()
        } catch (e) {
            return { error: "Save data appears to corrupt." };
        }

        return { error: false, data: saveData };
    }
}

function importLevel(filePath, dataPath, data = "") {
    /**
     * @author GDColon, HJfod
     * @param {String} filePath Path to the level file
     * @param {String} dataPath Path to the data file
     * @param {String} [data] The data of the data file (if you already have it decoded and don't want to spend time redecoding)
     * @description Import a level into a data file.
     * @returns {Object} error: Something went wrong, data: the new save data with the level imported, info: What level was imported.
     */

    try { fs.accessSync(filePath) } catch(err) {
        return { error: "Unable to access file." };
    }

    if (!data) {
        data = decodeCCLocalLevels(dataPath);
    }
    
    let levelFile = fs.readFileSync(path, 'utf8');

    data = data.replace(/<k>k1<\/k><i>\d+?<\/i>/g,"");	// remove uploaded id
    data = data.split("<k>_isArr</k><t />")
    data[1] = data[1].replace(/<k>k_(\d+)<\/k><d><k>kCEK<\/k>/g, (n) => { return "<k>k_" + (Number(n.slice(5).split("<")[0])+1) + "</k><d><k>kCEK</k>" })
    data = data[0] + "<k>_isArr</k><t /><k>k_0</k>" + levelFile + data[1]
    
    fs.writeFileSync(dataPath, data, 'utf8');

    return { error: false, data: data, info: `Imported ${levelFile.match(/<k>k2<\/k><s>(.+?)<\/s>/)}.` };
}

function exportLevel(names, from, exportPath) {
    /**
     * @author GDColon, HJfod
     * @param {String[]} names The names of the levels you want to export
     * @param {String} from Decoded save data where the levels should be exported from
     * @param {String} exportPath Folder where the level should be exported to.
     * @description a level from a data file.
     * @returns {Object} error: Something went wrong, info: What level was exported to where.
     */

    names.forEach(name => {
        name = name.toLowerCase();
        let foundLevel = from.find(x => x.toLowerCase().includes(`<k>k2</k><s>${name}</s>`));
        if (!foundLevel){
            return { error: `Level '${name}' not found.` };
        }else{
            let outputdir = `${exportPath}/${name}.gmd`;		// path
            let n = 0;
            while (fs.existsSync(outputdir)) {	// check if level with same name exists
                outputdir = outputdir.substring(0,outputdir.length - name.length - 4 - (n ? n.toString().length : 0)) + name + n + ".gmd";
                n++;
                if (n > 20) return { error: "Too many levels exported with this name." };
            }
            fs.writeFileSync(outputdir, foundLevel.replace(/<k>k_\d+<\/k>/, ""), 'utf8');
            
            return { error: false, info: `Exported ${name} from ${from} to ${exportPath}.` };
        }
    });
}

function getLevelValue(lvl, key, type) {
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
        return lvl.split(`<k>${key}</k><${type}>`).pop().substring(0,lvl.split(`<k>${key}</k><${type}>`).pop().indexOf('<'));
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
     * @param {String} [from] User data to get the level info from (don't supply if from level path)
     * @description Decode a Base64 string
     * @returns {Object} error: String saying what went wrong, info: Info about the level
     */

    let foundLevel;

    if (from){      // name was a path
        name = name.toLowerCase();
        if (name.endsWith(")")) name = name.substring(0,name.length-4);
        foundLevel = from.find(x => x.toLowerCase().includes(`<k>k2</k><s>${name}</s>`));
    }else{
        try { fs.accessSync(name) } catch(err) {
            return { error: "Unable to access file." };
        }
        if ( !name.endsWith(appMain.appValues.extFile) ) return { error: "File is not a .gmd file." };
        foundLevel = fs.readFileSync(name, 'utf8');
    }

    if (!foundLevel){
        return { error: "Level not found." };
    }else{
        let time = getLevelValue(foundLevel, "k80", "i");
        let p = getLevelValue(foundLevel, "k41", "i");
        let song = getLevelValue(foundLevel, "k8", "i");
        let rev = getLevelValue(foundLevel, "k46", "i");
        let desc = decodeBase64(getLevelValue(foundLevel, "k3", "s")).toString("utf8");
        let copy = getLevelValue(foundLevel, "k42", "i");

        let levelInfo = {};
        levelInfo["Name"] = getLevelValue(foundLevel, "k2", "s");
        levelInfo["Length"] = getLevelValue(foundLevel, "k23", "i").replace(/^\s*$/,"Tiny").replace("1","Short").replace("2","Medium").replace("3","Long").replace("4","XL");
        levelInfo["Creator"] = getLevelValue(foundLevel, "k5", "s");
        levelInfo["Version"] = getLevelValue(foundLevel, "k16", "i");
        levelInfo["Password"] = (p === "1") ? "Free to copy" : (p === "") ? "No copy" : p.substring(1);
        levelInfo["Song"] = song ? replaceOfficialSongName(song) : getLevelValue(foundLevel, "k45", "i");
        levelInfo["Description"] = desc;
        levelInfo["Object_count"] = getLevelValue(foundLevel, "k48", "i");
        levelInfo["Editor_time"] = time > 3600 ? (time/3600).toFixed(1) + "h" : (time/60).toFixed(1) + "m";
        levelInfo["Verified"] = getLevelValue(foundLevel, "k14", false);
        levelInfo["Attempts"] = getLevelValue(foundLevel, "k18", "i");
        levelInfo["Revision"] = rev === "" ? "None" : rev;
        levelInfo["Copied_from"] = copy === "" ? "None" : copy;
        
        return { error: false, info: levelInfo };
    }
}

function getDir() {
    /**
     * @author HJfod
     * @description Returns the app's path
     * @returns {String}
     */
    
    return dir;
}

function test() {
    return "Hello world!";
}

function initializeApp() {
    exec('tasklist', (err, stdout, stderr) => {
        if (stdout.toLowerCase().indexOf('geometrydash.exe') > -1) {
            status.emit("error", "gd-is-open");
        }
    });

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
    decodeCCLocalLevels,
    importLevel,
    exportLevel,
    getLevelValue,
    replaceOfficialSongName,
    getLevelInfo,
    test,
    initializeApp,
    getDir,
    status
}