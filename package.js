try {
  const p = require("electron-packager");
  p({
    "arch": "ia32",
    "overwrite": true,
    "dir": ".",
    "name": "GDShare",
    "asar": true,
    "ignore": [
      ".gitignore",
      "data/"
    ],
    "extra-resource": [
      "EULA.txt",
      "resources/light.gdst",
      "resources/dark.gdst",
      "resources/mid.gdst",
      "resources/amoled.gdst"
    ],
    "icon": "resources/share.ico",
    "out": "release-builds",
    "prune": true,
    "version-string": {
      "CompanyName": "HJfod"
    }
  }, (err, paths) => {
    if (err) throw err;
    if (paths) console.log(`Paths: ${paths}`);
    console.log("Succesfully packaged app! :)");
  });
} catch(e) {
  console.error(e);
}