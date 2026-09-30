import * as errorCreators from '../../errorCreators'
import { resolveStringRuntimeValue, uuid } from '../../utils'

import type {
  CommandCreator,
  ThermocyclerOpenLidStepGenArgs,
} from '../../types'

export const thermocyclerOpenLid: CommandCreator<
  ThermocyclerOpenLidStepGenArgs
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
        commandType: 'thermocycler/openLid',
        key: uuid(),
        params: {
          moduleId,
        },
      },
    ],
    python: `${pythonName}.open_lid()`,
  }
}
