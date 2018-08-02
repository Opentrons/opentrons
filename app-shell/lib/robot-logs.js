// download robot logs manager

module.exports = {
  downloadRobotLogs (dispatch, mainWindow) {
    return function handleIncomingAction (action) {
      const {type, payload: {logUrls}} = action
      if (type === 'shell:DOWNLOAD_LOGS') {
        logUrls.forEach((url) => {
          mainWindow.webContents.downloadURL(url)
        })
      }
    }
  }
}
