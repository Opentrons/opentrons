import * as Constants from '../constants'

import type * as Types from '../types'

export const updateCameraEnablement = (
  runId: string,
  enabled: boolean
): Types.UpdateCameraEnablementAction => ({
  type: Constants.CAMERA_ENABLEMENT,
  payload: { runId, enabled },
})

export const updateCameraStreamEnablement = (
  runId: string,
  enabled: boolean
): Types.UpdateCameraStreamEnablementAction => ({
  type: Constants.CAMERA_STREAM_ENABLEMENT,
  payload: { runId, enabled },
})

export const updateCameraRecoveryEnablement = (
  runId: string,
  enabled: boolean
): Types.UpdateCameraRecoveryEnablementAction => ({
  type: Constants.CAMERA_RECOVERY_ENABLEMENT,
  payload: { runId, enabled },
})
