// download robot logs manager

import { download } from 'electron-dl'
import { createLogger } from './log'
import { getMainWindow } from './main-window'

const log = createLogger('robot-logs')

export function registerRobotLogs(dispatch) {
  return function handleIncomingAction(action) {
    if (action.type === 'shell:DOWNLOAD_LOGS') {
      const { logUrls } = action.payload

      log.debug('Downloading robot logs', { logUrls })

      logUrls
        .reduce((result, url, index) => {
          return result.then(() => {
            const mainWindow = getMainWindow()

            if (!mainWindow) {
              throw new Error('No window present to download logs')
            }

            return download(mainWindow, url, {
              saveAs: true,
              openFolderWhenDone: index === logUrls.length - 1,
            })
          })
        }, Promise.resolve())
        .catch(error => log.error('Error downloading robot logs', { error }))
        .then(() => dispatch({ type: 'shell:DOWNLOAD_LOGS_DONE' }))
    }
  }
}
