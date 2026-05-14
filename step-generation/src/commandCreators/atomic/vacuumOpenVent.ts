import * as errorCreators from '../../errorCreators'
import { vacuumModuleStateGetter } from '../../robotStateSelectors'
import { getModuleHasLiveTask, uuid } from '../../utils'

import type { VacuumModuleOpenVentCreateCommand } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

// TODO: (nd, 2026-04-20) command creator implementation
export const vacuumOpenVent: CommandCreator<
  VacuumModuleOpenVentCreateCommand['params']
> = (args, invariantContext, prevRobotState) => {
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
