import * as Constants from '../constants'

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
  required: Types.CameraState
): Types.UpdateCameraEnablement => ({
  type: Constants.CAMERA_SETUP_STEP_KEY,
  payload: { runId, required },
})
