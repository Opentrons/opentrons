// download robot logs manager

export function registerRobotLogs (dispatch, mainWindow) {
  return function handleIncomingAction (action) {
    const {type, payload: {logUrls}} = action
    if (type === 'shell:DOWNLOAD_LOGS') {
      logUrls.forEach((url) => {
        mainWindow.webContents.downloadURL(url)
      })
    }
  }
}
