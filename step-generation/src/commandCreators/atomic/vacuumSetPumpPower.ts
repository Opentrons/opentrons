import * as errorCreators from '../../errorCreators'
import { uuid } from '../../utils'

import type { CommandCreator, VacuumPumpPowerArgs } from '../../types'

// TODO: (nd, 2026-04-20) command creator implementation
export const vacuumSetPumpPower: CommandCreator<VacuumPumpPowerArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { moduleId, powerPercent, duration, ventAfter } = args
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
        commandType: 'vacuumModule/startSetVacuumPower',
        key: uuid(),
        params: {
          moduleId,
          percentPower: powerPercent,
          ...holdArgs,
        },
      },
    ],
  }
}
