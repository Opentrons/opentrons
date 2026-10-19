import * as errorCreators from '../../errorCreators'
import {
  resolveNumericRuntimeValue,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type {
  CommandCreator,
  CommandCreatorError,
  ConfigureForVolumeStepGenArgs,
} from '../../types'

export const configureForVolume: CommandCreator<
  ConfigureForVolumeStepGenArgs
> = (args, invariantContext, prevRobotState) => {
  const { pipetteId, volume } = args
  const { runtimeParameters } = invariantContext
  const resolvedPipetteId = resolveStringRuntimeValue(
    pipetteId,
    runtimeParameters
  )
  const resolvedVolume = resolveNumericRuntimeValue(volume, runtimeParameters)
  const errors: CommandCreatorError[] = []
  if (resolvedPipetteId == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: pipetteId })
    )
  }
  if (typeof volume === 'string' && resolvedVolume == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: volume })
    )
  }
  if (resolvedPipetteId == null || resolvedVolume == null) {
    return { errors }
  }

  const pipette = invariantContext.pipetteEntities[resolvedPipetteId]
  if (pipette == null) {
    return {
      commands: [],
    }
  }

  const commands = [
    {
      commandType: 'configureForVolume' as const,
      key: uuid(),
      params: {
        pipetteId: resolvedPipetteId,
        volume: resolvedVolume,
      },
    },
  ]
  return {
    commands,
    python: `${pipette.pythonName}.configure_for_volume(${volume})`,
  }
}
