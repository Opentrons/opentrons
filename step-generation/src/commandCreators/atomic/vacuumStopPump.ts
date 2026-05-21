import * as errorCreators from '../../errorCreators'
import { uuid } from '../../utils'

import type { VacuumModuleStopPumpCreateCommand } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

// TODO: (nd, 2026-04-20) command creator implementation
export const vacuumStopPump: CommandCreator<
  VacuumModuleStopPumpCreateCommand['params']
> = (args, invariantContext, prevRobotState) => {
  const { moduleId } = args
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
