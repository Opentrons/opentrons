// @flow
import assert from 'assert'
import type { HydratedTemperatureFormData } from '../../../form-types'
import type {
  SetTemperatureArgs,
  DeactivateTemperatureArgs,
} from '../../../step-generation'

type TemperatureArgs = SetTemperatureArgs | DeactivateTemperatureArgs

export const temperatureFormToArgs = (
  hydratedFormData: HydratedTemperatureFormData
): TemperatureArgs => {
  const { moduleId } = hydratedFormData
  // cast values
  const setTemperature = hydratedFormData.setTemperature === 'true'
  const targetTemperature = parseFloat(hydratedFormData.targetTemperature)

  assert(
    setTemperature ? !Number.isNaN(targetTemperature) : true,
    'temperatureFormToArgs expected (hydrated) targetTemperature to be a number when setTemperature is "true"'
  )
  if (setTemperature && !Number.isNaN(targetTemperature)) {
    return {
      commandCreatorFnName: 'setTemperature',
      module: moduleId,
      targetTemperature,
    }
  } else {
    return {
      commandCreatorFnName: 'deactivateTemperature',
      module: moduleId,
    }
  }
}
