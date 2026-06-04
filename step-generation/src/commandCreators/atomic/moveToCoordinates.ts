import { formatPyTuple, uuid } from '../../utils'

import type {
  CreateCommand,
  MoveToCoordinatesCreateCommand,
} from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

export const moveToCoordinates: CommandCreator<
  MoveToCoordinatesCreateCommand['params']
> = (args, invariantContext, prevRobotState) => {
  const { pipetteId, coordinates, minimumZHeight, forceDirect } = args

  const { pipetteEntities } = invariantContext

  const pipettePythonName = pipetteEntities[pipetteId].pythonName

  const commands: CreateCommand[] = [
    {
      commandType: 'moveToCoordinates',
      key: uuid(),
      params: {
        pipetteId,
        coordinates,
        minimumZHeight,
        forceDirect,
      },
    },
  ]

  const pythonArgs = [
    `coordinates=${formatPyTuple([coordinates.x, coordinates.y, coordinates.z])}`,
    ...(forceDirect ? [`force_direct=True`] : []),
    ...(minimumZHeight ? [`minimum_z_height=${minimumZHeight}`] : []),
  ]

  return {
    commands,
    python: `${pipettePythonName}.move_axes_to(${pythonArgs.join(', ')})`,
  }
}
