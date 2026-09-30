import * as errorCreators from '../../errorCreators'
import {
  formatPyStr,
  getThermocyclerProfileRepetitionsForPython,
  indentPyLines,
  resolveNumericRuntimeValue,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type { TCStartExtendedProfileParams } from '@opentrons/shared-data'
import type {
  CommandCreator,
  CommandCreatorError,
  ThermocyclerProfileStepStepGenArgs,
  ThermocyclerStartRunExtendedProfileStepGenArgs,
} from '../../types'

/**
 * NOTE: `args.taskId` pulls double duty as the name of the Python variable,
 * so it should be snake_case.
 */
export const thermocyclerStartRunExtendedProfile: CommandCreator<
  ThermocyclerStartRunExtendedProfileStepGenArgs
> = (args, invariantContext, prevRobotState) => {
  const { taskId, profileElements, blockMaxVolumeUl } = args
  const { runtimeParameters } = invariantContext
  const moduleId = resolveStringRuntimeValue(args.moduleId, runtimeParameters)
  const errors: CommandCreatorError[] = []
  if (moduleId == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: args.moduleId })
    )
  }
  const resolveNumber = (value: number | string): number | null => {
    const resolvedValue = resolveNumericRuntimeValue(value, runtimeParameters)
    if (typeof value === 'string' && resolvedValue == null) {
      errors.push(
        errorCreators.invalidRuntimeParameter({ parameterName: value })
      )
    }
    return resolvedValue
  }
  const resolveStep = (step: ThermocyclerProfileStepStepGenArgs) => ({
    celsius: resolveNumber(step.celsius),
    holdSeconds: resolveNumber(step.holdSeconds),
  })
  const resolvedProfileElements = profileElements.map(element =>
    'steps' in element
      ? {
          steps: element.steps.map(resolveStep),
          repetitions: resolveNumber(element.repetitions),
        }
      : resolveStep(element)
  )
  const resolvedBlockMaxVolumeUl =
    blockMaxVolumeUl == null ? undefined : resolveNumber(blockMaxVolumeUl)
  if (moduleId == null || errors.length > 0) {
    return { errors }
  }
  const pythonName = invariantContext.moduleEntities[moduleId].pythonName

  const pythonProfileElements = profileElements.map(element =>
    'steps' in element && profileElements.length > 1
      ? {
          ...element,
          repetitions: resolveNumericRuntimeValue(
            element.repetitions,
            runtimeParameters
          ),
        }
      : element
  )
  const repetitionsForPython = getThermocyclerProfileRepetitionsForPython(
    pythonProfileElements as TCStartExtendedProfileParams['profileElements']
  )
  const pythonSteps = repetitionsForPython.repeatingProfileSteps
    .map(
      step =>
        `{${formatPyStr('temperature')}: ${step.celsius}, ${formatPyStr(
          'hold_time_seconds'
        )}: ${step.holdSeconds}},`
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
          taskId,
          profileElements:
            resolvedProfileElements as TCStartExtendedProfileParams['profileElements'],
          blockMaxVolumeUl: resolvedBlockMaxVolumeUl ?? undefined,
        },
      },
    ],
    python,
  }
}
