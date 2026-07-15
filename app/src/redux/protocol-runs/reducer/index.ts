import * as Constants from '../constants'
import { LPCReducer } from './lpc'
import { setupReducer } from './setup'

import type { Reducer } from 'redux'
import type { Action } from '../../types'
import type { CameraState, ProtocolRunState } from '../types'

const INITIAL_STATE: ProtocolRunState = {}

export const INITIAL_CAMERA_STATE: CameraState = {
  enabled: false,
  liveStreamEnabled: false,
  recoveryEnabled: false,
}

export const protocolRunReducer: Reducer<ProtocolRunState, Action> = (
  state = INITIAL_STATE,
  action
) => {
  switch (action.type) {
    case Constants.UPDATE_RUN_SETUP_STEPS_COMPLETE:
    case Constants.UPDATE_RUN_SETUP_STEPS_REQUIRED:
    case Constants.UPDATE_CAMERA_ENABLEMENT:
    case Constants.UPDATE_CAMERA_RECOVERY_ENABLEMENT:
    case Constants.UPDATE_CAMERA_STREAM_ENABLEMENT:
    case Constants.UPDATE_CAMERA_USAGE_SETTINGS:
    case Constants.UPDATE_CAMERA_SPECIFIC_SETTINGS: {
      const runId = action.payload.runId
      const currentRunState = state[runId]

      return {
        ...state,
        [runId]: {
          ...currentRunState,
          setup: setupReducer(currentRunState?.setup, action),
        },
      }
    }

    case Constants.UPDATE_LPC:
    case Constants.UPDATE_LPC_DECK:
    case Constants.UPDATE_LPC_LABWARE:
    case Constants.FINISH_LPC:
    case Constants.APPLIED_OFFSETS_TO_RUN:
    case Constants.PROCEED_STEP:
    case Constants.GO_BACK_LAST_STEP:
    case Constants.PROCEED_HANDLE_LW_SUBSTEP:
    case Constants.GO_BACK_HANDLE_LW_SUBSTEP:
    case Constants.SET_SELECTED_LABWARE_URI:
    case Constants.SET_SELECTED_LABWARE:
    case Constants.SET_INITIAL_POSITION:
    case Constants.SET_FINAL_POSITION:
    case Constants.CLEAR_WORKING_OFFSETS:
    case Constants.RESET_OFFSET_TO_DEFAULT:
    case Constants.APPLY_WORKING_OFFSETS:
    case Constants.SOURCE_OFFSETS_FROM_RUN:
    case Constants.SOURCE_OFFSETS_FROM_DATABASE:
    case Constants.UPDATE_CONFLICT_TIMESTAMP:
    case Constants.TOGGLE_DEFAULT_OFFSET_INFO_BANNER:
    case Constants.CLEAR_SNACKBAR_STATUS: {
      const runId = action.payload.runId
      const currentRunState = state[runId] || { lpc: undefined }
      const nextLpcState = LPCReducer(currentRunState.lpc, action)

      return {
        ...state,
        [runId]: {
          ...currentRunState,
          lpc: nextLpcState,
        },
      }
    }

    default:
      return state
  }
}
