// @flow
// redux action types to analytics events map
import createLogger from '../logger'
import {selectors as robotSelectors} from '../robot'

import type {State, Action} from '../types'

type Event = {
  name: string,
  properties: {},
}

const log = createLogger(__filename)

export default function makeEvent (state: State, action: Action): ?Event {
  switch (action.type) {
    case '@@router/LOCATION_CHANGE':
      return {name: 'url', properties: {pathname: action.payload.pathname}}

    case 'robot:CONNECT_RESPONSE':
      const name = state.robot.connection.connectRequest.name
      const robot = robotSelectors.getDiscovered(state)
        .find(r => r.name === name)

      if (!robot) {
        log.warn('No robot found for connect response')
        return null
      }

      return {
        name: 'robotConnect',
        properties: {
          success: !action.payload.error,
          method: robot.wired ? 'usb' : 'wifi',
          error: (action.payload.error && action.payload.error.message) || '',
        },
      }

    // $FlowFixMe(ka, 2018-06-5): flow type robot:SESSION_RESPONSE
    case 'robot:SESSION_RESPONSE':
      // TODO (ka, 2018-6-6): add file open type 'button' | 'drag-n-drop' (work required in action meta)
      return {
        name: 'protocolUpload',
        properties: {
          success: !action.error,
          error: (action.error && action.error.message) || '',
        },
      }

    // $FlowFixMe(mc, 2018-05-28): flow type robot:RUN
    case 'robot:RUN':
      return {name: 'runStart', properties: {}}

    // $FlowFixMe(mc, 2018-05-28): flow type robot:RUN_RESPONSE
    case 'robot:RUN_RESPONSE':
      if (!action.error) {
        const runTime = robotSelectors.getRunSeconds(state)
        return {name: 'runFinish', properties: {runTime}}
      } else {
        return {
          name: 'runError',
          properties: {
            error: action.error.message,
          },
        }
      }
    // $FlowFixMe(ka, 2018-06-5): flow type robot:PAUSE_RESPONSE
    case 'robot:PAUSE_RESPONSE':
      return {
        name: 'runPause',
        properties: {
          success: !action.error,
          error: (action.error && action.error.message) || '',
        },
      }

    // $FlowFixMe(ka, 2018-06-5): flow type robot:CANCEL
    case 'robot:CANCEL_RESPONSE':
      const runTime = robotSelectors.getRunSeconds(state)
      return {
        name: 'runCancel',
        properties: {
          runTime,
          success: !action.error,
          error: (action.error && action.error.message) || '',
        },
      }
  }

  return null
}
