import * as errorCreators from '../../errorCreators'
import { resolveStringRuntimeValue, uuid } from '../../utils'

import type {
  CommandCreator,
  HeaterShakerCloseLatchStepGenArgs,
} from '../../types'

export const heaterShakerCloseLatch: CommandCreator<
  HeaterShakerCloseLatchStepGenArgs
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
        commandType: 'heaterShaker/closeLabwareLatch',
        key: uuid(),
        params: {
          moduleId,
        },
      },
    ],
    python: `${pythonName}.close_labware_latch()`,
  }
}
