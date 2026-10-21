import * as errorCreators from '../../errorCreators'
import {
  resolveNumericRuntimeValue,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type {
  CommandCreator,
  CommandCreatorError,
  ThermocyclerSetTargetBlockTemperatureStepGenArgs,
} from '../../types'

export const thermocyclerSetTargetBlockTemperature: CommandCreator<
  ThermocyclerSetTargetBlockTemperatureStepGenArgs
> = (args, invariantContext, prevRobotState) => {
  if (args.celsius !== undefined) {
    console.warn(
      `'volume' param not implemented for thermocycler/setTargetBlockTemperature, should not be set!`
    )
  }
  const { runtimeParameters } = invariantContext
  const moduleId = resolveStringRuntimeValue(args.moduleId, runtimeParameters)
  const celsius = resolveNumericRuntimeValue(args.celsius, runtimeParameters)
  const errors: CommandCreatorError[] = []
  if (moduleId == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: args.moduleId })
    )
  }
  if (typeof args.celsius === 'string' && celsius == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: args.celsius })
    )
  }
  if (moduleId == null || celsius == null) {
    return { errors }
  }
  const pythonName = invariantContext.moduleEntities[moduleId].pythonName

  return {
    commands: [
      {
        commandType: 'thermocycler/setTargetBlockTemperature',
        key: uuid(),
        params: {
          moduleId,
          celsius,
          //  TODO( jr 7/17/23): add optional blockMaxVolumeUI and holdTimeSeconds params
        },
      },
    ],
    python: `${pythonName}.set_block_temperature(${args.celsius})`,
  }
}
