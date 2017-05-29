const rp = require('request-promise')

const waitUntilServerResponds = (createWindow, windowUrl) => {
  rp(windowUrl)
    .then((html) => {
      return createWindow()
    })
    .catch((err) => {
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
