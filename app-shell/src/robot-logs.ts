// download robot logs manager

import { download } from 'electron-dl'
import { createLogger } from './log'

const log = createLogger('robot-logs')

export function registerRobotLogs(dispatch, mainWindow) {
  return function handleIncomingAction(action) {
    if (action.type === 'shell:DOWNLOAD_LOGS') {
      const { logUrls } = action.payload

      log.debug('Downloading robot logs', { logUrls })

      logUrls
        .reduce((result, url, index) => {
          return result.then(() => {
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
