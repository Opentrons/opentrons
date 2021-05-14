import keyBy from 'lodash/keyBy'
import * as Constants from './constants'

import type { Action } from '../types'
import type { ModulesState, PerRobotModulesState } from './types'

const INITIAL_STATE: ModulesState = {}

const INITIAL_MODULES_STATE: PerRobotModulesState = {
  modulesById: null,
}

export function modulesReducer(
  state: ModulesState,
  action: Action
): ModulesState {
  state = state ?? INITIAL_STATE
  switch (action.type) {
    case Constants.FETCH_MODULES_SUCCESS: {
      const { robotName, modules } = action.payload
      const robotState = state[robotName] || INITIAL_MODULES_STATE
      const modulesById = keyBy(modules, 'serial')

      return { ...state, [robotName]: { ...robotState, modulesById } }
    }
  }

  return state
}
