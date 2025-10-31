import * as Constants from '../constants'

import type { CameraState, ProtocolRunAction } from '../types'

const INITIAL_CAMERA_STATE: CameraState = {
  enabled: false,
  liveStreamEnabled: false,
  recoveryEnabled: false,
}

// TODO(jh, 10-31-25): After the camera work settles, consider making camera state
//  a subset of `setup` state if it's sensible.
export function cameraReducer(
  state: CameraState = INITIAL_CAMERA_STATE,
  action: ProtocolRunAction
): CameraState {
  switch (action.type) {
    case Constants.CAMERA_ENABLEMENT:
      return {
        ...state,
        enabled: action.payload.enabled,
      }

    case Constants.CAMERA_STREAM_ENABLEMENT:
      return {
        ...state,
        liveStreamEnabled: action.payload.enabled,
      }

    case Constants.CAMERA_RECOVERY_ENABLEMENT:
      return {
        ...state,
        recoveryEnabled: action.payload.enabled,
      }

    default:
      return state
  }
}
