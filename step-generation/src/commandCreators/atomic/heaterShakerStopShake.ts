import * as errorCreators from '../../errorCreators'
import { resolveStringRuntimeValue, uuid } from '../../utils'

import type {
  CommandCreator,
  HeaterShakerStopShakeStepGenArgs,
} from '../../types'

export const heaterShakerStopShake: CommandCreator<
  HeaterShakerStopShakeStepGenArgs
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
        commandType: 'heaterShaker/deactivateShaker',
        key: uuid(),
        params: {
          moduleId,
        },
      },
    ],
    python: `${pythonName}.deactivate_shaker()`,
  }
}
