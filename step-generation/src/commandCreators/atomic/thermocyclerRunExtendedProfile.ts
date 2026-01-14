import {
  formatPyStr,
  getThermocyclerProfileRepetitionsForPython,
  indentPyLines,
  uuid,
} from '../../utils'

import type { TCExtendedProfileParams } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

export const thermocyclerRunExtendedProfile: CommandCreator<
  TCExtendedProfileParams
> = (args, invariantContext, prevRobotState) => {
  const { moduleId, profileElements, blockMaxVolumeUl } = args
  const pythonName = invariantContext.moduleEntities[moduleId].pythonName

  const repetitionsForPython =
    getThermocyclerProfileRepetitionsForPython(profileElements)
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
    (blockMaxVolumeUl !== undefined
      ? `block_max_volume=${blockMaxVolumeUl},`
      : '')

  return {
    commands: [
      {
        commandType: 'thermocycler/runExtendedProfile',
        key: uuid(),
        params: {
          moduleId,
          profileElements,
          blockMaxVolumeUl,
        },
      },
    ],
    python: `${pythonName}.execute_profile(\n${indentPyLines(pythonArgs)}\n)`,
  }
}
