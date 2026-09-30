import * as errorCreators from '../../errorCreators'
import { resolveStringRuntimeValue, uuid } from '../../utils'

import type {
  CommandCreator,
  ThermocyclerDeactivateBlockStepGenArgs,
} from '../../types'

export const thermocyclerDeactivateBlock: CommandCreator<
  ThermocyclerDeactivateBlockStepGenArgs
> = (args, invariantContext, prevRobotState) => {
  const moduleId = resolveStringRuntimeValue(
    args.moduleId,
    invariantContext.runtimeParameters
  )
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
        commandType: 'thermocycler/deactivateBlock',
        key: uuid(),
        params: {
          moduleId,
        },
      },
    ],
    python: `${pythonName}.deactivate_block()`,
  }
}
