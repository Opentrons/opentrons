import { formatPyStr, uuid } from '../../utils'

import type {
  CreateCommand,
  MoveRelativeCreateCommand,
} from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

export const moveRelative: CommandCreator<
  MoveRelativeCreateCommand['params']
> = (args, invariantContext, prevRobotState) => {
  const { pipetteId, axis, distance } = args

  const { pipetteEntities } = invariantContext

  const pipettePythonName = pipetteEntities[pipetteId].pythonName

  const commands: CreateCommand[] = [
    {
      commandType: 'moveRelative',
      key: uuid(),
      params: {
        pipetteId,
        axis,
        distance,
      },
    },
  ]
  const pythonArgs = [`axis=${formatPyStr(axis)}`, `distance=${distance}`]
  return {
    commands,
    python: `${pipettePythonName}.move_axes_relative(${pythonArgs.join(', ')})`,
  }
}
