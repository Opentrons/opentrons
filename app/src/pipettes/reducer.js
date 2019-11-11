// @flow

import * as Constants from './constants'

import type { Action } from '../types'
import type { PipettesState, PerRobotPipettesState } from './types'

const INITIAL_STATE: PipettesState = {}

const INITIAL_PIPETTES_STATE: PerRobotPipettesState = {
  attachedByMount: { left: null, right: null },
}

export function pipettesReducer(
  state: PipettesState = INITIAL_STATE,
  action: Action
): PipettesState {
  switch (action.type) {
    case Constants.FETCH_PIPETTES_SUCCESS: {
      const { robotName, pipettes } = action.payload
      const robotState = state[robotName] || INITIAL_PIPETTES_STATE

      return {
        ...state,
        [robotName]: { ...robotState, attachedByMount: pipettes },
      }
    }
  }

  return state
}
