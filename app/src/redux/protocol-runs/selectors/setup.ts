import * as Constants from '../constants'
import { INITIAL_CAMERA_STATE } from '../reducer'

import type { CameraImageSettings } from '@opentrons/api-client'
import type { CameraId } from '@opentrons/shared-data'
import type { State } from '../../types'
import type * as Types from '../types'

export const getSetupStepComplete: (
  state: State,
  runId: string,
  step: Types.StepKey
) => boolean | null = (state, runId, step) =>
  getSetupStepsComplete(state, runId)?.[step] ?? null

export const getSetupStepsComplete = (
  state: State,
  runId: string
): Partial<Record<Types.StepKey, boolean>> | null => {
  const setup = state.protocolRuns[runId]?.setup
  if (setup == null) {
    return null
  }

  return Object.entries(setup).reduce<Partial<Record<Types.StepKey, boolean>>>(
    (acc, [step, stepState]) => {
      acc[step as Types.StepKey] = stepState.complete
      return acc
    },
    {}
  )
}

export const getSetupStepRequired: (
  state: State,
  runId: string,
  step: Types.StepKey
) => boolean | null = (state, runId, step) =>
  getSetupStepsRequired(state, runId)?.[step] ?? null

export const getSetupStepsRequired = (
  state: State,
  runId: string
): Partial<Record<Types.StepKey, boolean>> | null => {
  const setup = state.protocolRuns[runId]?.setup
  if (setup == null) {
    return null
  }

  return Object.entries(setup).reduce<Partial<Record<Types.StepKey, boolean>>>(
    (acc, [step, stepState]) => {
      acc[step as Types.StepKey] = stepState.required
      return acc
    },
    {}
  )
}

export const getSetupStepMissing = (
  state: State,
  runId: string,
  step: Types.StepKey
): boolean | null => getSetupStepsMissing(state, runId)?.[step] ?? null

export const getSetupStepsMissing = (
  state: State,
  runId: string
): Partial<Record<Types.StepKey, boolean>> | null => {
  const setup = state.protocolRuns[runId]?.setup
  if (setup == null) {
    return null
  }

  return Object.entries(setup).reduce<Partial<Record<Types.StepKey, boolean>>>(
    (acc, [step, stepState]) => {
      acc[step as Types.StepKey] = stepState.required && !stepState.complete
      return acc
    },
    {}
  )
}

export const getCameraUsageState = (
  state: State,
  runId: string
): Types.CameraState => {
  const cameraStep =
    state.protocolRuns[runId]?.setup?.[Constants.CAMERA_SETUP_STEP_KEY]
  if (cameraStep == null) {
    return INITIAL_CAMERA_STATE
  }
  return {
    enabled: cameraStep.cameraEnabled,
    liveStreamEnabled: cameraStep.liveStreamEnabled,
    recoveryEnabled: cameraStep.recoveryEnabled,
  }
}

export const getCameraImageSettings = (
  state: State,
  runId: string,
  cameraId: CameraId
): CameraImageSettings | null => {
  const cameraStep =
    state.protocolRuns[runId]?.setup?.[Constants.CAMERA_SETUP_STEP_KEY]
  if (cameraStep == null) {
    return null
  } else {
    return cameraStep.cameraImageSettings[cameraId] ?? null
  }
}

// Reports all missing setup steps, including those validated on the robot.
export const getMissingSetupSteps: (
  state: State,
  runId: string
) => Types.StepKey[] = (state, runId) => {
  const missingStepMap = getSetupStepsMissing(state, runId)
  if (missingStepMap == null) return []
  const missingStepList = (
    Object.entries(missingStepMap) as Array<[Types.StepKey, boolean]>
  )
    .map(([step, missing]) => (missing ? step : null))
    .filter(stepName => stepName != null)
  return missingStepList as Types.StepKey[]
}
