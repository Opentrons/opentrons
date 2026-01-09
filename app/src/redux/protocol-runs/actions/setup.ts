import * as Constants from '../constants'

import type { CameraImageSettings } from '@opentrons/api-client'
import type { CameraId } from '@opentrons/shared-data'
import type * as Types from '../types'

export const updateRunSetupStepsComplete = (
  runId: string,
  complete: Types.UpdateRunSetupStepsCompleteAction['payload']['complete']
): Types.UpdateRunSetupStepsCompleteAction => ({
  type: Constants.UPDATE_RUN_SETUP_STEPS_COMPLETE,
  payload: { runId, complete },
})

export const updateRunSetupStepsRequired = (
  runId: string,
  required: Types.UpdateRunSetupStepsRequiredAction['payload']['required']
): Types.UpdateRunSetupStepsRequiredAction => ({
  type: Constants.UPDATE_RUN_SETUP_STEPS_REQUIRED,
  payload: { runId, required },
})

export const updateCameraEnablement = (
  runId: string,
  cameraEnabled: boolean
): Types.UpdateCameraEnablement => ({
  type: Constants.CAMERA_SETUP_STEP_KEY,
  payload: { runId, cameraEnabled },
})

export const updateCameraRecoveryEnablement = (
  runId: string,
  recoveryEnabled: boolean
): Types.UpdateCameraErrorRecoveryEnablement => ({
  type: Constants.CAMERA_SETUP_STEP_KEY,
  payload: { runId, recoveryEnabled },
})

export const updateCameraStreamEnablement = (
  runId: string,
  liveStreamEnabled: boolean
): Types.UpdateLivestreamEnabled => ({
  type: Constants.CAMERA_SETUP_STEP_KEY,
  payload: { runId, liveStreamEnabled },
})

export const updateCameraUsageSettings = (allCameraArgs: {
  runId: string
  cameraEnabled: boolean
  liveStreamEnabled: boolean
  recoveryEnabled: boolean
}): Types.UpdateAllCameraSettings => ({
  type: Constants.CAMERA_SETUP_STEP_KEY,
  payload: allCameraArgs,
})

export const updateCameraSpecificSettings = (
  runId: string,
  cameraId: CameraId,
  cameraImageSettings: CameraImageSettings
): Types.UpdateCameraSpecificImageSettings => ({
  type: Constants.CAMERA_SETUP_STEP_KEY,
  payload: { runId, cameraId, cameraImageSettings },
})
