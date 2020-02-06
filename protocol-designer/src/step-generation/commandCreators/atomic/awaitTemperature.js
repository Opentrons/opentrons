// @flow
import {
  TEMPDECK,
  TEMPERATURE_AT_TARGET,
  TEMPERATURE_DEACTIVATED,
} from '../../../constants'
import * as errorCreators from '../../errorCreators'
import type { CommandCreator, AwaitTemperatureArgs } from '../../types'
import { getModuleState } from '../../utils/misc'

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

  if (tempModState.type !== TEMPDECK) {
    console.error(
      `expected module to be ${TEMPDECK} but got ${tempModState.type}`
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
    case TEMPDECK:
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
        `awaitTemperature expected module ${module} to be ${TEMPDECK}, got ${moduleType}`
      )
      return { errors: [errorCreators.missingModuleError()] }
  }
}
