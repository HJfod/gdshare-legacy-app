"use strict"

const builder = require("electron-builder");
const Platform = builder.Platform;

// Promise is returned
builder.build({
  targets: Platform.WINDOWS.createTarget(),
  config: {
   "appId": "com.electron.gdshare",
   "productName": "GDShare",
   "directories": {
     "output": "release-builds",
     "app": ""
    }
  }
})
  .then(res => {
    console.log(res);
    console.log("package succesful :)");
  })
  .catch(err => {
    console.log(err);
  })