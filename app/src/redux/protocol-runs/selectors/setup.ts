import * as Constants from '../constants'
import { INITIAL_CAMERA_STATE } from '../reducer'

import type { State } from '../../types'
import type * as Types from '../types'

export const getSetupStepComplete: (
  state: State,
  runId: string,
  step: Types.StepKey
) => boolean | null = (state, runId, step) =>
  getSetupStepsComplete(state, runId)?.[step] ?? null

export const getSetupStepsComplete: (
  state: State,
  runId: string
) => Types.StepMap<boolean> | null = (state, runId) => {
  const setup = state.protocolRuns[runId]?.setup
  if (setup == null) {
    return null
  }
  return (
    Object.entries(setup) as Array<[Types.StepKey, Types.StepState]>
  ).reduce<Partial<Types.StepMap<boolean>>>(
    (acc, [step, state]) => ({
      ...acc,
      [step]: state.complete,
    }),
    {}
  ) as Types.StepMap<boolean>
}

export const getSetupStepRequired: (
  state: State,
  runId: string,
  step: Types.StepKey
) => boolean | null = (state, runId, step) =>
  getSetupStepsRequired(state, runId)?.[step] ?? null

export const getSetupStepsRequired: (
  state: State,
  runId: string
) => Types.StepMap<boolean> | null = (state, runId) => {
  const setup = state.protocolRuns[runId]?.setup
  if (setup == null) {
    return null
  }
  return (
    Object.entries(setup) as Array<[Types.StepKey, Types.StepState]>
  ).reduce<Partial<Types.StepMap<boolean>>>(
    (acc, [step, state]) => ({ ...acc, [step]: state.required }),
    {}
  ) as Types.StepMap<boolean>
}

export const getSetupStepMissing: (
  state: State,
  runId: string,
  step: Types.StepKey
) => boolean | null = (state, runId, step) =>
  getSetupStepsMissing(state, runId)?.[step] || null

export const getSetupStepsMissing: (
  state: State,
  runId: string
) => Types.StepMap<boolean> | null = (state, runId) => {
  const setup = state.protocolRuns[runId]?.setup
  if (setup == null) {
    return null
  }
  return (
    Object.entries(setup) as Array<[Types.StepKey, Types.StepState]>
  ).reduce<Partial<Types.StepMap<boolean>>>(
    (acc, [step, state]) => ({
      ...acc,
      [step]: state.required && !state.complete,
    }),
    {}
  ) as Types.StepMap<boolean>
}

export const getCameraUsageState = (
  state: State,
  runId: string
): Types.CameraState => {
  const cameraStep =
    state.protocolRuns[runId]?.setup[Constants.CAMERA_SETUP_STEP_KEY]

  if (cameraStep == null) {
    return INITIAL_CAMERA_STATE
  }

  return {
    required: false,
    complete: true,
    enabled: cameraStep.cameraEnabled,
    liveStreamEnabled: cameraStep.liveStreamEnabled,
    recoveryEnabled: cameraStep.cameraRecoveryEnabled,
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
