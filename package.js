const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller

getInstallerConfig()
  .then(createWindowsInstaller)
  .catch(error => {
    console.error(error.message || error)
    process.exit(1)
  })

function getInstallerConfig () {
  console.log('creating windows installer')

  return Promise.resolve({
    appDirectory: "",
    authors: 'HJfod',
    outputDirectory: "../release-builds/gdshare-win32",
    exe: 'gdshare.exe',
    setupExe: 'gdshare-installer.exe'
  })
}