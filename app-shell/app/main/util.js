const {getLogger} = require('./logging.js')
const rp = require('request-promise')

const mainLogger = getLogger('electron-main')

function waitUntilServerResponds (createWindow, windowUrl) {
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

module.exports = {waitUntilServerResponds}
