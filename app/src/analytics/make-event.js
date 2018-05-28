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
      const robot = state.robot.connection.discoveredByName[name]

      if (!robot) {
        log.warn('No robot found for connect response')
        return null
      }

      return {
        name: 'robotConnect',
        properties: {
          success: !action.payload.error,
          method: (robot.wired
            ? 'usb'
            : 'wifi'
          ),
          error: (action.payload.error
            ? action.payload.error.message
            : ''
          )
        }
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
        // TODO(mc, 2018-05-28): runError event
        return null
      }
  }

  return null
}
