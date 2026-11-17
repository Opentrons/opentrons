import * as errorCreators from '../../errorCreators'
import { resolveStringRuntimeValue, uuid } from '../../utils'

import type { CommandCreator, ModuleStepGenArgs } from '../../types'

// TODO: (nd, 2026-04-20) command creator implementation
export const vacuumStopPump: CommandCreator<ModuleStepGenArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
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
  const module = invariantContext.moduleEntities[moduleId]

  if (module == null) {
    return {
      errors: [errorCreators.missingModuleError()],
    }
  }

  const python = `${module.pythonName}.stop_vacuum_pump()`
  return {
    commands: [
      {
        commandType: 'vacuumModule/stopVacuum',
        key: uuid(),
        params: {
          moduleId,
        },
      },
    ],
    python,
  }
}
