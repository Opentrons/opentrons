import * as errorCreators from '../../errorCreators'
import { vacuumModuleStateGetter } from '../../robotStateSelectors'
import {
  getModuleHasLiveTask,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type { CommandCreator, ModuleStepGenArgs } from '../../types'

// TODO: (nd, 2026-04-20) command creator implementation
export const vacuumOpenVent: CommandCreator<ModuleStepGenArgs> = (
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
  const moduleState = vacuumModuleStateGetter(prevRobotState, moduleId)

  if (module == null || moduleState == null) {
    return {
      errors: [errorCreators.missingModuleError()],
    }
  }

  const hasLiveTask = getModuleHasLiveTask(moduleState)
  if (hasLiveTask) {
    return {
      errors: [errorCreators.liveTaskError()],
    }
  }
  const python = `${module.pythonName}.open_vent()`
  return {
    commands: [
      {
        commandType: 'vacuumModule/openVent',
        key: uuid(),
        params: {
          moduleId,
        },
      },
    ],
    python,
  }
}
