// @flow
import assert from 'assert'
import { TEMPDECK, THERMOCYCLER } from '../../../constants'
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
  if (moduleType === TEMPDECK) {
    return {
      commands: [
        {
          command: 'temperatureModule/setTargetTemperature',
          params,
        },
      ],
    }
  } else if (moduleType === THERMOCYCLER) {
    return {
      commands: [
        {
          command: 'thermocycler/setTargetTemperature',
          params,
        },
      ],
    }
  } else {
    assert(
      false,
      `setTemperature expected module ${module} to be ${TEMPDECK} or ${THERMOCYCLER}, got ${moduleType}`
    )
    // NOTE: "missing module" isn't exactly the right error here, but better than a whitescreen!
    // This should never be shown.
    return { errors: [errorCreators.missingModuleError()] }
  }
}
