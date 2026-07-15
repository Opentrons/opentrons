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
  cameraImageSettings: {
    ot_system_camera: {},
  },
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

    case Constants.UPDATE_CAMERA_ENABLEMENT: 
    case Constants.UPDATE_CAMERA_RECOVERY_ENABLEMENT:
    case Constants.UPDATE_CAMERA_STREAM_ENABLEMENT:
    case Constants.UPDATE_CAMERA_USAGE_SETTINGS: {
      const { runId, ...rest } = action.payload
      return {
        ...state,
        [Constants.CAMERA_SETUP_STEP_KEY]: {
          ...state[Constants.CAMERA_SETUP_STEP_KEY],
          ...rest,
        },
      }
      
    }

    case Constants.UPDATE_CAMERA_SPECIFIC_SETTINGS: {
      const {cameraId, cameraImageSettings} = action.payload
      return {
        ...state,
        [Constants.CAMERA_SETUP_STEP_KEY]: {
          ...state[Constants.CAMERA_SETUP_STEP_KEY],
          cameraImageSettings: {
            ...state[Constants.CAMERA_SETUP_STEP_KEY].cameraImageSettings,
            [cameraId]: cameraImageSettings,
          },
        },
      }
    }

    default:
      return state
  }
}
