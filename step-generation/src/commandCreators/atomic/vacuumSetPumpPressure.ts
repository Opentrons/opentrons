import * as errorCreators from '../../errorCreators'
import { uuid } from '../../utils'

import type { CommandCreator, VacuumPumpPressureArgs } from '../../types'

// TODO: (nd, 2026-04-20) command creator implementation
export const vacuumSetPumpPressure: CommandCreator<VacuumPumpPressureArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { moduleId, gaugePressure, duration, ventAfter } = args
  const module = invariantContext.moduleEntities[moduleId]

  if (module == null) {
    return {
      errors: [errorCreators.missingModuleError()],
    }
  }

  const holdArgs =
    duration != null
      ? {
          duration,
          // defaults to true per PE command
          ventAfter: ventAfter ?? true,
        }
      : {}

  // TODO: (nd, 2026-04-20) implement Python emission
  return {
    commands: [
      {
        commandType: 'vacuumModule/startSetVacuumPressure',
        key: uuid(),
        params: {
          moduleId,
          gaugePressure,
          ...holdArgs,
          // making this explicit for ease of use with statte upd
        },
      },
    ],
  }
}
