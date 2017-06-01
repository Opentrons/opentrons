const {getLogger} = require('./logging.js')
const rp = require('request-promise')

function waitUntilServerResponds (createWindow, windowUrl) {
  const mainLogger = getLogger('electron-main')
  mainLogger.info('Pinging ' + windowUrl)
  rp(windowUrl)
    .then((html) => {
      return createWindow()
    })
    .catch((err) => {
      mainLogger.info(err)
      setTimeout(() => {
        waitUntilServerResponds(createWindow, windowUrl)
      }, 500)
    })
}

const cantorReverse = (z) => {
  const w = Math.floor((Math.sqrt((8*z) + 1) - 1)/2)
  const t = (Math.pow(w, 2) + w)/2
  const y = z - t
  const x = w - y
  return [x, y]
}

const getAppVersion = (version, channel) => {
  if (channel !== 'beta') {
    return version
  }
  const [major, minor, fakePatch] = version.split('.')
  const [patch, buildNumber] = cantorReverse(parseInt(fakePatch))
  return `${major}.${minor}.${patch}+${buildNumber}`
}

module.exports = {getAppVersion, waitUntilServerResponds}
