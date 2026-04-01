import {
  formatPyStr,
  getThermocyclerProfileRepetitionsForPython,
  indentPyLines,
  uuid,
} from '../../utils'

import type { TCStartExtendedProfileParams } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

/**
 * NOTE: `args.taskId` pulls double duty as the name of the Python variable,
 * so it should be snake_case.
 */
export const thermocyclerStartRunExtendedProfile: CommandCreator<
  TCStartExtendedProfileParams
> = (args, invariantContext, prevRobotState) => {
  const { moduleId, taskId, profileElements, blockMaxVolumeUl } = args
  const pythonName = invariantContext.moduleEntities[moduleId].pythonName

  const repetitionsForPython = getThermocyclerProfileRepetitionsForPython(
    args.profileElements
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
          profileElements,
          blockMaxVolumeUl,
        },
      },
    ],
    python,
  }
}
