import * as Constants from './constants'

import type { Reducer } from 'redux'
import type { Action } from '../types'

import type { ProtocolRunState, RunSetupStatus } from './types'

const INITIAL_STATE: ProtocolRunState = {}

const INITIAL_SETUP_STEP_STATE = { complete: false, required: true }

const INITIAL_RUN_SETUP_STATE: RunSetupStatus = {
  [Constants.ROBOT_CALIBRATION_STEP_KEY]: INITIAL_SETUP_STEP_STATE,
  [Constants.MODULE_SETUP_STEP_KEY]: INITIAL_SETUP_STEP_STATE,
  [Constants.LPC_STEP_KEY]: INITIAL_SETUP_STEP_STATE,
  [Constants.LABWARE_SETUP_STEP_KEY]: INITIAL_SETUP_STEP_STATE,
  [Constants.LIQUID_SETUP_STEP_KEY]: INITIAL_SETUP_STEP_STATE,
}

export const protocolRunReducer: Reducer<ProtocolRunState, Action> = (
  state = INITIAL_STATE,
  action
) => {
  switch (action.type) {
    case Constants.UPDATE_RUN_SETUP_STEPS_COMPLETE: {
      return {
        ...state,
        [action.payload.runId]: {
          setup: Constants.SETUP_STEP_KEYS.reduce(
            (currentState, step) => ({
              ...currentState,
              [step]: {
                complete:
                  action.payload.complete[step] ?? currentState[step].complete,
                required: currentState[step].required,
              },
            }),
            state[action.payload.runId]?.setup ?? INITIAL_RUN_SETUP_STATE
          ),
        },
      }
    }
    case Constants.UPDATE_RUN_SETUP_STEPS_REQUIRED: {
      return {
        ...state,
        [action.payload.runId]: {
          setup: Constants.SETUP_STEP_KEYS.reduce(
            (currentState, step) => ({
              ...currentState,
              [step]: {
                required:
                  action.payload.required[step] ?? currentState[step].required,
                complete: currentState[step].complete,
              },
            }),
            state[action.payload.runId]?.setup ?? INITIAL_RUN_SETUP_STATE
          ),
        },
      }
    }
  }
  return state
}
