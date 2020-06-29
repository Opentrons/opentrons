// @flow
import { TEMPERATURE_MODULE_TYPE } from '@opentrons/shared-data'

import {
  TEMPERATURE_AT_TARGET,
  TEMPERATURE_DEACTIVATED,
} from '../../../constants'
import * as errorCreators from '../../errorCreators'
import { getModuleState } from '../../robotStateSelectors'
import type { AwaitTemperatureArgs, CommandCreator } from '../../types'

/** Set temperature target for specified module. */
export const awaitTemperature: CommandCreator<AwaitTemperatureArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { module, temperature } = args
  const tempModState = module ? getModuleState(prevRobotState, module) : null

  if (module === null || !tempModState) {
    return { errors: [errorCreators.missingModuleError()] }
  }

  if (tempModState.type !== TEMPERATURE_MODULE_TYPE) {
    console.error(
      `expected module to be ${TEMPERATURE_MODULE_TYPE} but got ${tempModState.type}`
    )
    return { errors: [errorCreators.missingModuleError()] }
  }

  //  if the temp mod is already at the target temp
  //  AND the newly awaited temperature is different than the target temp
  //  this means the temp mod will not change its temp, since it is already
  //  at the target temp, so the new await temp will never be reached
  const unreachableTemp =
    tempModState.status === TEMPERATURE_AT_TARGET &&
    tempModState.targetTemperature !== temperature

  if (unreachableTemp || tempModState.status === TEMPERATURE_DEACTIVATED) {
    return { errors: [errorCreators.missingTemperatureStep()] }
  }

  const moduleType = invariantContext.moduleEntities[module]?.type
  const params = { module, temperature }
  switch (moduleType) {
    case TEMPERATURE_MODULE_TYPE:
      return {
        commands: [
          {
            command: 'temperatureModule/awaitTemperature',
            params,
          },
        ],
      }

    default:
      console.error(
        `awaitTemperature expected module ${module} to be ${TEMPERATURE_MODULE_TYPE}, got ${moduleType}`
      )
      return { errors: [errorCreators.missingModuleError()] }
  }
}
