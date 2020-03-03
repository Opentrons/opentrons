// @flow
import {
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import * as errorCreators from '../../errorCreators'
import type { CommandCreator, SetTemperatureArgs } from '../../types'

/** Set temperature target for specified module. */
export const setTemperature: CommandCreator<SetTemperatureArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { module, targetTemperature } = args

  if (module === null) {
    return { errors: [errorCreators.missingModuleError()] }
  }

  const moduleType = invariantContext.moduleEntities[module]?.type
  const params = { module, temperature: targetTemperature }
  if (moduleType === TEMPERATURE_MODULE_TYPE) {
    return {
      commands: [
        {
          command: 'temperatureModule/setTargetTemperature',
          params,
        },
      ],
    }
  } else if (moduleType === THERMOCYCLER_MODULE_TYPE) {
    // TODO: Ian 2019-01-24 implement setting thermocycler temp: block vs lid
    console.error('Thermocycler set temp not implemented!')
    return {
      commands: [],
    }
  } else {
    console.error(
      `setTemperature expected module ${module} to be ${TEMPERATURE_MODULE_TYPE} or ${THERMOCYCLER_MODULE_TYPE}, got ${moduleType}`
    )
    // NOTE: "missing module" isn't exactly the right error here, but better than a whitescreen!
    // This should never be shown.
    return { errors: [errorCreators.missingModuleError()] }
  }
}
