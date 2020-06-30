// @flow
import keyBy from 'lodash/keyBy'
import type { Action } from '../types'
import * as Constants from './constants'

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
      const modulesById = keyBy(modules, 'serial')

      return { ...state, [robotName]: { ...robotState, modulesById } }
    }
  }

  return state
}
