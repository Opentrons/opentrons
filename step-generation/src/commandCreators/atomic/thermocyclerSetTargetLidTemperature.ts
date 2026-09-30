import * as errorCreators from '../../errorCreators'
import {
  resolveNumericRuntimeValue,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type {
  CommandCreator,
  CommandCreatorError,
  ThermocyclerSetTargetLidTemperatureStepGenArgs,
} from '../../types'

export const thermocyclerSetTargetLidTemperature: CommandCreator<
  ThermocyclerSetTargetLidTemperatureStepGenArgs
> = (args, invariantContext, prevRobotState) => {
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
        commandType: 'thermocycler/setTargetLidTemperature',
        key: uuid(),
        params: {
          moduleId,
          celsius,
        },
      },
    ],
    python: `${pythonName}.set_lid_temperature(${args.celsius})`,
  }
}
