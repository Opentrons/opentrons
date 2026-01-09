import * as Constants from '../constants'

import type { ProtocolRunAction, RunSetupStatus } from '../types'

const INITIAL_SETUP_STEP_STATE = {
  required: true,
  complete: false,
}
const CAMERA_INITIAL_SETUP_STATE = {
  ...INITIAL_SETUP_STEP_STATE,
  cameraEnabled: false,
  liveStreamEnabled: false,
  recoveryEnabled: false,
}

export const INITIAL_RUN_SETUP_STATE: RunSetupStatus = {
  [Constants.ROBOT_CALIBRATION_STEP_KEY]: INITIAL_SETUP_STEP_STATE,
  [Constants.MODULE_SETUP_STEP_KEY]: INITIAL_SETUP_STEP_STATE,
  [Constants.LPC_STEP_KEY]: INITIAL_SETUP_STEP_STATE,
  [Constants.LABWARE_SETUP_STEP_KEY]: INITIAL_SETUP_STEP_STATE,
  [Constants.CAMERA_SETUP_STEP_KEY]: CAMERA_INITIAL_SETUP_STATE,
}

export function setupReducer(
  state: RunSetupStatus = INITIAL_RUN_SETUP_STATE,
  action: ProtocolRunAction
): RunSetupStatus {
  switch (action.type) {
    case Constants.UPDATE_RUN_SETUP_STEPS_COMPLETE:
      return Constants.SETUP_STEP_KEYS.reduce(
        (currentState, step) => ({
          ...currentState,
          [step]: {
            ...currentState[step],
            complete:
              action.payload.complete[step] ?? currentState[step].complete,
          },
        }),
        state
      )

    case Constants.UPDATE_RUN_SETUP_STEPS_REQUIRED:
      return Constants.SETUP_STEP_KEYS.reduce(
        (currentState, step) => ({
          ...currentState,
          [step]: {
            ...currentState[step],
            required:
              action.payload.required[step] ?? currentState[step].required,
          },
        }),
        state
      )

    case Constants.CAMERA_SETUP_STEP_KEY: {
      const { runId, ...rest } = action.payload
      return {
        ...state,
        [Constants.CAMERA_SETUP_STEP_KEY]: {
          ...state[Constants.CAMERA_SETUP_STEP_KEY],
          ...rest,
        },
      }
    }

    default:
      return state
  }
}
