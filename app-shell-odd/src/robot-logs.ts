// download robot logs manager
import { download } from 'electron-dl'
import { createLogger } from './log'

import type { BrowserWindow } from 'electron'
import type { Action, Dispatch } from './types'
import systemd from './systemd'

const log = createLogger('robot-logs')

export function registerRobotLogs(
  dispatch: Dispatch,
  mainWindow: BrowserWindow
): (action: Action) => unknown {
  return function handleIncomingAction(action: Action): void {
    switch (action.type) {
      case 'shell:DOWNLOAD_LOGS':
        const { logUrls } = action.payload as { logUrls: string[] }

        log.debug('Downloading robot logs', { logUrls })

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        logUrls
          .reduce<Promise<unknown>>((result, url, index) => {
            return result.then(() => {
              return download(mainWindow, url, {
                saveAs: true,
                openFolderWhenDone: index === logUrls.length - 1,
              })
            })
          }, Promise.resolve())
          .catch((error: unknown) => {
            log.error('Error downloading robot logs', { error })
          })
          .then(() => dispatch({ type: 'shell:DOWNLOAD_LOGS_DONE' }))
        break
      case 'shell:SEND_LOG':
        systemd
          .sendStatus(action.payload.message)
          .catch((e: Error) =>
            console.error(`error sending status to systemd ${e.message}`)
          )
        console.log(
          `shell message from browser layer: ${action.payload.message}`
        )
        break
    }
  }
}
