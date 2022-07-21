import {
  HEATERSHAKER_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
} from '@opentrons/shared-data'
import { uuid } from '../../utils'
import { TEMPERATURE_AT_TARGET, TEMPERATURE_DEACTIVATED } from '../../constants'
import * as errorCreators from '../../errorCreators'
import type { CommandCreator, WaitForTemperatureArgs } from '../../types'
import { getModuleState } from '../../robotStateSelectors'

/** Set temperature target for specified module. */
export const waitForTemperature: CommandCreator<WaitForTemperatureArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { module, temperature } = args
  const moduleState = module ? getModuleState(prevRobotState, module) : null

  if (module === null || !moduleState) {
    return {
      errors: [errorCreators.missingModuleError()],
    }
  }
  if (
    moduleState.type !== TEMPERATURE_MODULE_TYPE &&
    moduleState.type !== HEATERSHAKER_MODULE_TYPE
  ) {
    console.error(
      `expected module to be ${TEMPERATURE_MODULE_TYPE} but got ${moduleState.type}`
    )
    return {
      errors: [errorCreators.missingModuleError()],
    }
  }

  //  if the temp mod is already at the target temp
  //  AND the newly awaited temperature is different than the target temp
  //  this means the temp mod will not change its temp, since it is already
  //  at the target temp, so the new await temp will never be reached
  const unreachableTemp =
    'status' in moduleState &&
    moduleState.status === TEMPERATURE_AT_TARGET &&
    moduleState.targetTemperature !== temperature

  if (
    unreachableTemp ||
    ('status' in moduleState && moduleState.status === TEMPERATURE_DEACTIVATED)
  ) {
    return {
      errors: [errorCreators.missingTemperatureStep()],
    }
  }

  const moduleType = invariantContext.moduleEntities[module]?.type

  switch (moduleType) {
    case TEMPERATURE_MODULE_TYPE:
      return {
        commands: [
          {
            commandType: 'temperatureModule/waitForTemperature',
            key: uuid(),
            params: {
              moduleId: module,
              celsius: temperature,
            },
          },
        ],
      }

    case HEATERSHAKER_MODULE_TYPE:
      return {
        commands: [
          {
            commandType: 'heaterShaker/waitForTemperature',
            key: uuid(),
            params: {
              moduleId: module,
            },
          },
        ],
      }

    default:
      console.error(
        `awaitTemperature expected module ${module} to be ${TEMPERATURE_MODULE_TYPE} or ${HEATERSHAKER_MODULE_TYPE}, got ${moduleType}`
      )
      return {
        errors: [errorCreators.missingModuleError()],
      }
  }
}
