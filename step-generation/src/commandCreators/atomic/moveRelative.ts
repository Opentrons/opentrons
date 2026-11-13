import * as errorCreators from '../../errorCreators'
import {
  formatPyStr,
  resolveNumericRuntimeValue,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type { CreateCommand } from '@opentrons/shared-data'
import type {
  CommandCreator,
  CommandCreatorError,
  MoveRelativeStepGenArgs,
} from '../../types'

export const moveRelative: CommandCreator<MoveRelativeStepGenArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteEntities, runtimeParameters } = invariantContext
  const pipetteId = resolveStringRuntimeValue(args.pipetteId, runtimeParameters)
  const axis = resolveStringRuntimeValue(args.axis, runtimeParameters)
  const distance = resolveNumericRuntimeValue(args.distance, runtimeParameters)
  const errors: CommandCreatorError[] = []
  if (pipetteId == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: args.pipetteId })
    )
  }
  if (axis == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: args.axis })
    )
  }
  if (typeof args.distance === 'string' && distance == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: args.distance })
    )
  }
  if (
    errors.length > 0 ||
    pipetteId == null ||
    axis == null ||
    distance == null
  ) {
    return { errors }
  }

  const pipettePythonName = pipetteEntities[pipetteId].pythonName
  const axisPython =
    runtimeParameters[args.axis] != null ? args.axis : formatPyStr(axis)
  const commands: CreateCommand[] = [
    {
      commandType: 'moveRelative',
      key: uuid(),
      params: {
        pipetteId,
        axis: axis as 'x' | 'y' | 'z',
        distance,
      },
    },
  ]
  const pythonArgs = [`axis=${axisPython}`, `distance=${args.distance}`]
  return {
    commands,
    python: `${pipettePythonName}.move_axes_relative(${pythonArgs.join(', ')})`,
  }
}
