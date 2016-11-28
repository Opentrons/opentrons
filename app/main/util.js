const rp = require('request-promise')

function waitUntilServerResponds (createWindow) {
  rp('http://127.0.0.1:31950')
    .then((html) => {
      return createWindow()
    })
    .catch((err) => {
      setTimeout(() => {
        waitUntilServerResponds(createWindow)
      }, 500)
    })
}

module.exports = {waitUntilServerResponds}
