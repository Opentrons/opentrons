import { UPDATE_BRIGHTNESS } from './constants'
import { createLogger } from './log'
import systemd from './systemd'

import type { Action } from './types'

const log = createLogger('system')

export function registerUpdateBrightness(): (action: Action) => void {
  return function handleAction(action: Action) {
    switch (action.type) {
      case UPDATE_BRIGHTNESS:
        console.log('update the brightness')
        systemd
          .updateBrightness(action.payload.message)
          .catch(err =>
            log.debug('Something wrong when updating the brightness', err)
          )
        break
    }
  }
}
