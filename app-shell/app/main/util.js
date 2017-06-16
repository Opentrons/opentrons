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
      mainLogger.info('Error while pinging ' + windowUrl)
      mainLogger.info(err)
      setTimeout(() => {
        waitUntilServerResponds(createWindow, windowUrl)
      }, 500)
    })
}

module.exports = {waitUntilServerResponds}
