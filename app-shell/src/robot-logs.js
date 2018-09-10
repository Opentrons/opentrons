// download robot logs manager

export function registerRobotLogs (dispatch, mainWindow) {
  return function handleIncomingAction (action) {
    if (action.type === 'shell:DOWNLOAD_LOGS') {
      const {payload: {logUrls}} = action
      logUrls.forEach(url => mainWindow.webContents.downloadURL(url))
    }
  }
}
