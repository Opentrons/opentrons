import { createAction } from '@reduxjs/toolkit'

import type { CameraImageSettings } from '@opentrons/api-client'
import type { CameraId } from '@opentrons/shared-data'
import type { StepKey } from '../types'

export const updateRunSetupStepsComplete = createAction(
  'protocolRuns/updateRunSetupStepsComplete',
  (runId: string, complete: Partial<{ [Step in StepKey]: boolean }>) => ({
    payload: { runId, complete },
  })
)

export const updateRunSetupStepsRequired = createAction(
  'protocolRuns/updateRunSetupStepsRequired',
  (runId: string, required: Partial<{ [Step in StepKey]: boolean }>) => ({
    payload: { runId, required },
  })
)

export const updateCameraEnablement = createAction(
  'protocolRuns/updateCameraEnablement',
  (runId: string, cameraEnabled: boolean) => ({
    payload: { runId, cameraEnabled },
  })
)

export const updateCameraRecoveryEnablement = createAction(
  'protocolRuns/updateCameraRecoveryEnablement',
  (runId: string, recoveryEnabled: boolean) => ({
    payload: { runId, recoveryEnabled },
  })
)

export const updateCameraStreamEnablement = createAction(
  'protocolRuns/updateCameraStreamEnablement',
  (runId: string, liveStreamEnabled: boolean) => ({
    payload: { runId, liveStreamEnabled },
  })
)

export const updateCameraUsageSettings = createAction(
  'protocolRuns/updateCameraUsageSettings',
  (settings: {
    runId: string
    cameraEnabled: boolean
    liveStreamEnabled: boolean
    recoveryEnabled: boolean
  }) => ({ payload: settings })
)

export const updateCameraSpecificSettings = createAction(
  'protocolRuns/updateCameraSpecificSettings',
  (
    runId: string,
    cameraId: CameraId,
    cameraImageSettings: CameraImageSettings
  ) => ({ payload: { runId, cameraId, cameraImageSettings } })
)
