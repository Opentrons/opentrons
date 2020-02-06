// @flow
import isEmpty from 'lodash/isEmpty'
import { transferLikeSubsteps } from './transferLikeSubsteps'
import type { InvariantContext, RobotState } from '../step-generation'
import type { NamedIngred, StepArgsAndErrors, SubstepItemData } from './types'

export type GetIngreds = (labware: string, well: string) => Array<NamedIngred>
type LabwareNamesByModuleId = {
  [moduleId: string]: ?{ nickname: ?string, displayName: string },
}

export function getLabwareName(
  labwareNamesByModuleId: LabwareNamesByModuleId,
  moduleId: ?string
) {
  return moduleId ? labwareNamesByModuleId[moduleId] : null
}

// NOTE: This is the fn used by the `allSubsteps` selector
export function generateSubsteps(
  stepArgsAndErrors: ?StepArgsAndErrors,
  invariantContext: InvariantContext,
  robotState: ?RobotState,
  stepId: string,
  labwareNamesByModuleId: LabwareNamesByModuleId
): ?SubstepItemData {
  if (!robotState) {
    console.info(
      `No robot state, could not generate substeps for step ${stepId}.` +
        `There was probably an upstream error.`
    )
    return null
  }

  // TODO: BC: 2018-08-21 replace old error check with new logic in field, form, and timeline level
  // Don't try to render with form errors. TODO LATER: presentational error state of substeps?
  if (
    !stepArgsAndErrors ||
    !stepArgsAndErrors.stepArgs ||
    !isEmpty(stepArgsAndErrors.errors)
  ) {
    return null
  }

  const { stepArgs } = stepArgsAndErrors

  if (stepArgs.commandCreatorFnName === 'delay') {
    return {
      substepType: 'pause',
      pauseStepArgs: stepArgs,
    }
  }

  if (
    stepArgs.commandCreatorFnName === 'consolidate' ||
    stepArgs.commandCreatorFnName === 'distribute' ||
    stepArgs.commandCreatorFnName === 'transfer' ||
    stepArgs.commandCreatorFnName === 'mix'
  ) {
    return transferLikeSubsteps({
      stepArgs,
      invariantContext,
      robotState,
      stepId,
    })
  }

  if (
    stepArgs.commandCreatorFnName === 'disengageMagnet' ||
    stepArgs.commandCreatorFnName === 'engageMagnet'
  ) {
    const labwareNames = getLabwareName(labwareNamesByModuleId, stepArgs.module)

    return {
      substepType: 'magnet',
      engage: stepArgs.commandCreatorFnName === 'engageMagnet',
      labwareDisplayName: labwareNames?.displayName,
      labwareNickname: labwareNames?.nickname,
      message: stepArgs.message,
    }
  }

  if (
    stepArgs.commandCreatorFnName === 'setTemperature' ||
    stepArgs.commandCreatorFnName === 'deactivateTemperature'
  ) {
    const labwareNames = getLabwareName(labwareNamesByModuleId, stepArgs.module)
    const temperature =
      stepArgs.commandCreatorFnName === 'setTemperature'
        ? stepArgs.targetTemperature
        : null

    return {
      substepType: 'temperature',
      temperature: temperature,
      labwareDisplayName: labwareNames?.displayName,
      labwareNickname: labwareNames?.nickname,
      message: stepArgs.message,
    }
  }

  console.warn(
    "allSubsteps doesn't support commandCreatorFnName: ",
    stepArgs.commandCreatorFnName,
    stepId
  )
  return null
}
