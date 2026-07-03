import * as errorCreators from '../../errorCreators'
import { vacuumModuleStateGetter } from '../../robotStateSelectors'
import { getModuleHasLiveTask, uuid } from '../../utils'

import type { CommandCreator, VacuumCloseVentArgs } from '../../types'

// TODO: (nd, 2026-04-20) command creator implementation
export const vacuumCloseVent: CommandCreator<VacuumCloseVentArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { moduleId } = args
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

  const python = `${module.pythonName}.close_vent()`
  return {
    commands: [
      {
        commandType: 'vacuumModule/closeVent',
        key: uuid(),
        params: {
          moduleId,
        },
      },
    ],
    python,
  }
}
