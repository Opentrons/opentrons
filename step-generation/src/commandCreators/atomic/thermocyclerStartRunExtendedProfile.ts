import * as errorCreators from '../../errorCreators'
import {
  getThermocyclerProfileRepetitionsForPython,
  indentPyLines,
  resolveNumericRuntimeValue,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type { TCExtendedProfileParams } from '@opentrons/shared-data'
import type {
  CommandCreator,
  CommandCreatorError,
  ModuleStepGenArgs,
} from '../../types'

/**
 * NOTE: `args.taskId` pulls double duty as the name of the Python variable,
 * so it should be snake_case.
 */
export const thermocyclerStartRunExtendedProfile: CommandCreator<
  ModuleStepGenArgs & {
    profileElements: Array<
      | { celsius: number | string; holdSeconds: number | string }
      | {
          steps: Array<{
            celsius: number | string
            holdSeconds: number | string
          }>
          repetitions: number | string
        }
    >
    blockMaxVolumeUl?: number | string
    taskId?: string | null
  }
> = (args, invariantContext, prevRobotState) => {
  const { taskId, profileElements, blockMaxVolumeUl } = args
  const { runtimeParameters } = invariantContext
  const moduleId = resolveStringRuntimeValue(args.moduleId, runtimeParameters)
  const resolvedTaskId =
    taskId == null
      ? taskId
      : resolveStringRuntimeValue(taskId, runtimeParameters)
  const resolvedBlockMaxVolumeUl =
    blockMaxVolumeUl == null
      ? undefined
      : resolveNumericRuntimeValue(blockMaxVolumeUl, runtimeParameters)
  const errors: CommandCreatorError[] = []
  if (moduleId == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: args.moduleId })
    )
  }
  if (taskId != null && resolvedTaskId == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: taskId })
    )
  }
  if (
    typeof blockMaxVolumeUl === 'string' &&
    resolvedBlockMaxVolumeUl == null
  ) {
    errors.push(
      errorCreators.invalidRuntimeParameter({
        parameterName: blockMaxVolumeUl,
      })
    )
  }
  const resolvedProfileElements: TCExtendedProfileParams['profileElements'] = []
  for (const element of profileElements) {
    if ('steps' in element) {
      const repetitions = resolveNumericRuntimeValue(
        element.repetitions,
        runtimeParameters
      )
      if (typeof element.repetitions === 'string' && repetitions == null) {
        errors.push(
          errorCreators.invalidRuntimeParameter({
            parameterName: element.repetitions,
          })
        )
      }
      const steps: Array<{ celsius: number; holdSeconds: number }> = []
      for (const step of element.steps) {
        const celsius = resolveNumericRuntimeValue(
          step.celsius,
          runtimeParameters
        )
        const holdSeconds = resolveNumericRuntimeValue(
          step.holdSeconds,
          runtimeParameters
        )
        if (typeof step.celsius === 'string' && celsius == null) {
          errors.push(
            errorCreators.invalidRuntimeParameter({
              parameterName: step.celsius,
            })
          )
        }
        if (typeof step.holdSeconds === 'string' && holdSeconds == null) {
          errors.push(
            errorCreators.invalidRuntimeParameter({
              parameterName: step.holdSeconds,
            })
          )
        }
        if (celsius != null && holdSeconds != null) {
          steps.push({ celsius, holdSeconds })
        }
      }
      if (repetitions != null) {
        resolvedProfileElements.push({ steps, repetitions })
      }
    } else {
      const celsius = resolveNumericRuntimeValue(
        element.celsius,
        runtimeParameters
      )
      const holdSeconds = resolveNumericRuntimeValue(
        element.holdSeconds,
        runtimeParameters
      )
      if (typeof element.celsius === 'string' && celsius == null) {
        errors.push(
          errorCreators.invalidRuntimeParameter({
            parameterName: element.celsius,
          })
        )
      }
      if (typeof element.holdSeconds === 'string' && holdSeconds == null) {
        errors.push(
          errorCreators.invalidRuntimeParameter({
            parameterName: element.holdSeconds,
          })
        )
      }
      if (celsius != null && holdSeconds != null) {
        resolvedProfileElements.push({ celsius, holdSeconds })
      }
    }
  }
  if (
    errors.length > 0 ||
    moduleId == null ||
    resolvedTaskId === null ||
    resolvedBlockMaxVolumeUl === null
  ) {
    return { errors }
  }
  const pythonName = invariantContext.moduleEntities[moduleId].pythonName

  const repetitionsForPython = getThermocyclerProfileRepetitionsForPython(
    profileElements as TCExtendedProfileParams['profileElements']
  )
  const pythonSteps = repetitionsForPython.repeatingProfileSteps
    .map(
      step =>
        `{"temperature": ${step.celsius}, "hold_time_seconds": ${step.holdSeconds}},`
    )
    .join('\n')
  const formattedPythonSteps = '[\n' + `${indentPyLines(pythonSteps)}` + '\n],'
  const pythonArgs =
    `${formattedPythonSteps}\n` +
    `${repetitionsForPython.numRepetitions},\n` +
    (args.blockMaxVolumeUl !== undefined
      ? `block_max_volume=${args.blockMaxVolumeUl},`
      : '')
  const pythonVarAssignment = taskId != null ? `${taskId} = ` : ''
  const python =
    pythonVarAssignment +
    `${pythonName}.start_execute_profile(\n${indentPyLines(pythonArgs)}\n)`

  return {
    commands: [
      {
        commandType: 'thermocycler/startRunExtendedProfile',
        key: uuid(),
        params: {
          moduleId,
          taskId: resolvedTaskId,
          profileElements: resolvedProfileElements,
          blockMaxVolumeUl: resolvedBlockMaxVolumeUl,
        },
      },
    ],
    python,
  }
}
