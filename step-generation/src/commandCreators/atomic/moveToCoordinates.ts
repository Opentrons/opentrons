import * as errorCreators from '../../errorCreators'
import {
  resolveBooleanRuntimeValue,
  resolveNumericRuntimeValue,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type { CreateCommand } from '@opentrons/shared-data'
import type {
  CommandCreator,
  CommandCreatorError,
  MoveToCoordinatesStepGenArgs,
} from '../../types'

export const moveToCoordinates: CommandCreator<MoveToCoordinatesStepGenArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteEntities, runtimeParameters } = invariantContext
  const { coordinates } = args
  const pipetteId = resolveStringRuntimeValue(args.pipetteId, runtimeParameters)
  const x = resolveNumericRuntimeValue(coordinates.x, runtimeParameters)
  const y = resolveNumericRuntimeValue(coordinates.y, runtimeParameters)
  const z = resolveNumericRuntimeValue(coordinates.z, runtimeParameters)
  const minimumZHeight =
    args.minimumZHeight == null
      ? undefined
      : resolveNumericRuntimeValue(args.minimumZHeight, runtimeParameters)
  const forceDirect =
    args.forceDirect == null
      ? undefined
      : resolveBooleanRuntimeValue(args.forceDirect, runtimeParameters)
  const errors: CommandCreatorError[] = []
  if (pipetteId == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: args.pipetteId })
    )
  }
  if (typeof coordinates.x === 'string' && x == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: coordinates.x })
    )
  }
  if (typeof coordinates.y === 'string' && y == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: coordinates.y })
    )
  }
  if (typeof coordinates.z === 'string' && z == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: coordinates.z })
    )
  }
  if (typeof args.minimumZHeight === 'string' && minimumZHeight == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({
        parameterName: args.minimumZHeight,
      })
    )
  }
  if (typeof args.forceDirect === 'string' && forceDirect == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({
        parameterName: args.forceDirect,
      })
    )
  }
  if (
    errors.length > 0 ||
    pipetteId == null ||
    x == null ||
    y == null ||
    z == null
  ) {
    return { errors }
  }

  const pipettePythonName = pipetteEntities[pipetteId].pythonName
  const pythonArgs = [
    `coordinates=(${coordinates.x}, ${coordinates.y}, ${coordinates.z})`,
  ]
  if (typeof args.forceDirect === 'string') {
    pythonArgs.push(`force_direct=${args.forceDirect}`)
  } else if (args.forceDirect) {
    pythonArgs.push('force_direct=True')
  }
  if (args.minimumZHeight) {
    pythonArgs.push(`minimum_z_height=${args.minimumZHeight}`)
  }
  const commands: CreateCommand[] = [
    {
      commandType: 'moveToCoordinates',
      key: uuid(),
      params: {
        pipetteId,
        coordinates: { x, y, z },
        minimumZHeight: minimumZHeight ?? undefined,
        forceDirect: forceDirect ?? undefined,
      },
    },
  ]
  return {
    commands,
    python: `${pipettePythonName}.move_axes_to(${pythonArgs.join(', ')})`,
  }
}
