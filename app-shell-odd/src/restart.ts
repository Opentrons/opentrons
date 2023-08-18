import { APP_RESTART } from '@opentrons/app/src/redux/shell/actions'
import systemd from './systemd'
import { createLogger } from './log'

import type { Action, Logger } from './types'
let _log: Logger | undefined
const log = (): Logger => _log ?? (_log = createLogger('config'))

export function registerAppRestart(): (action: Action) => unknown {
  return function handleAction(action: Action) {
    switch (action.type) {
      case APP_RESTART:
        systemd
          .sendStatus(`restarting app: ${action.payload.message}`)
          .catch(err =>
            log().debug('Something wrong when sending a message', { err })
          )
        console.log(`restarting app: ${action.payload.message}`)
        systemd
          .restartApp()
          .catch(err =>
            log().debug('Something wrong when resettings the app', { err })
          )
        break
    }
  }
}
