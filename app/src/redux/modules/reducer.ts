import keyBy from 'lodash/keyBy'
import * as Constants from './constants'

import type { Action } from '../types'
import type { ModulesState, PerRobotModulesState } from './types'
import { Reducer } from 'redux'

const INITIAL_STATE: ModulesState = {}

const INITIAL_MODULES_STATE: PerRobotModulesState = {
  modulesById: null,
}

export const modulesReducer: Reducer<ModulesState, Action> = (
  state = INITIAL_STATE,
  action
) => {
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
