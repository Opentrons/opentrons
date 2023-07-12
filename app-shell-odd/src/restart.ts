import { APP_RESTART } from '@opentrons/app/src/redux/shell/actions'
import systemd from './systemd'

import type { Action } from './types'

export function registerAppRestart(): (action: Action) => unknown {
  return function handleAction(action: Action) {
    switch (action.type) {
      case APP_RESTART:
        systemd.sendStatus(`restarting app: ${action.payload.message}`)
        console.log(`restarting app: ${action.payload.message}`)
        systemd.restartApp()
        break
    }
  }
}
