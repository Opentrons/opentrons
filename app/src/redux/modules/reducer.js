// @flow
import keyBy from 'lodash/keyBy'
import * as Constants from './constants'

import type { Action } from '../types'
import type { ModulesState, PerRobotModulesState } from './types'

const INITIAL_STATE: ModulesState = {}

const INITIAL_MODULES_STATE: PerRobotModulesState = {
  modulesById: null,
}

export function modulesReducer(
  state: ModulesState = INITIAL_STATE,
  action: Action
): ModulesState {
  switch (action.type) {
    case Constants.FETCH_MODULES_SUCCESS: {
      const { robotName, modules } = action.payload
      const robotState = state[robotName] || INITIAL_MODULES_STATE
      const hasPortInfo = !(modules.find(m => !m.usbPort) ?? false)
      const sortedModules = hasPortInfo ? (
        // sorting the modules by usb port info
        // usbPort of each module should either have hub value or a port number
        // (if the robot server is 4.3 or above)
        modules.sort((i, j) => {
          if (i.usbPort === null || j.usbPort === null) return 0
          // iPort & jPort should be non-zero, if they are zero, something is wrong
          let iPort = i.usbPort.hub || i.usbPort.port || 0
          let jPort = j.usbPort.hub || j.usbPort.port || 0
          if (iPort < jPort) return -1
          if (iPort > jPort) return 1
          return 0
        })
      ) : keyBy(modules, 'serial')  // for older robot server version, sort by serial
      console.log(sortedModules)
      return { ...state, [robotName]: { ...robotState, sortedModules } }
    }
  }

  return state
}
