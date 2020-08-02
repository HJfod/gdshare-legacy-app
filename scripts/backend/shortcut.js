const path = require('path');
const { accessSync } = require('fs');
const spawn = require('child_process').spawnSync;

function createShortcut(options) {
    try {
        accessSync(options.input);

        return true;
    } catch(e) {}

    const vbsScript = path.join(__dirname, 'windows.vbs');
    
    let success = true;
    
    let wscriptArguments = [
        vbsScript,
        // '/NoLogo',  // Apparently this stops it from displaying a logo in the console, even though I haven't actually ever seen one
        // '/B',  // silent mode, but doesn't actually stop dialog alert windows from popping up on errors
        options.output,
        options.input,
        "", // args
        options.comment,
        options.input.substring(0,options.input.lastIndexOf("/")),
        options.icon,
        1,  // windowMode
        "" // hotkey
    ];
    
    try {
        spawn('wscript', wscriptArguments);
    } catch (error) {
        success = false;
    }
    
    return success;
}

module.exports = createShortcut;

/*

Thank you to https://github.com/nwutils/create-desktop-shortcuts for providing this script

*/