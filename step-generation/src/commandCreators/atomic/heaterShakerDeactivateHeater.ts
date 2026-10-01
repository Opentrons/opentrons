import * as errorCreators from '../../errorCreators'
import { resolveStringRuntimeValue, uuid } from '../../utils'

import type {
  CommandCreator,
  HeaterShakerDeactivateHeaterStepGenArgs,
} from '../../types'

export const heaterShakerDeactivateHeater: CommandCreator<
  HeaterShakerDeactivateHeaterStepGenArgs
> = (args, invariantContext, prevRobotState) => {
  const { runtimeParameters } = invariantContext
  const moduleId = resolveStringRuntimeValue(args.moduleId, runtimeParameters)
  if (moduleId == null) {
    return {
      errors: [
        errorCreators.invalidRuntimeParameter({ parameterName: args.moduleId }),
      ],
    }
  }
  const pythonName = invariantContext.moduleEntities[moduleId].pythonName
  return {
    commands: [
      {
        commandType: 'heaterShaker/deactivateHeater',
        key: uuid(),
        params: {
          moduleId,
        },
      },
    ],
    python: `${pythonName}.deactivate_heater()`,
  }
}
