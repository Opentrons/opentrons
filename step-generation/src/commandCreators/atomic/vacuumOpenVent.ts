import * as errorCreators from '../../errorCreators'
import { uuid } from '../../utils'

import type { VacuumModuleOpenVentCreateCommand } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

// TODO: (nd, 2026-04-20) command creator implementation
export const vacuumOpenVent: CommandCreator<
  VacuumModuleOpenVentCreateCommand['params']
> = (args, invariantContext, prevRobotState) => {
  const { moduleId } = args
  const module = invariantContext.moduleEntities[moduleId]

  if (module == null) {
    return {
      errors: [errorCreators.missingModuleError()],
    }
  }

  // TODO: (nd, 2026-04-20) implement Python emission
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
  }
}
