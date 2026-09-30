import * as errorCreators from '../../errorCreators'
import { resolveStringRuntimeValue, uuid } from '../../utils'

import type {
  CommandCreator,
  ThermocyclerDeactivateLidStepGenArgs,
} from '../../types'

export const thermocyclerDeactivateLid: CommandCreator<
  ThermocyclerDeactivateLidStepGenArgs
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
        commandType: 'thermocycler/deactivateLid',
        key: uuid(),
        params: {
          moduleId,
        },
      },
    ],
    python: `${pythonName}.deactivate_lid()`,
  }
}
