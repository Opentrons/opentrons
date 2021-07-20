import assert from 'assert'
import {
  SetTemperatureArgs,
  DeactivateTemperatureArgs,
} from '@opentrons/step-generation'
import { HydratedTemperatureFormData } from '../../../form-types'
type TemperatureArgs = SetTemperatureArgs | DeactivateTemperatureArgs
export const temperatureFormToArgs = (
  hydratedFormData: HydratedTemperatureFormData
): TemperatureArgs => {
  const { moduleId } = hydratedFormData
  // cast values
  const setTemperature = hydratedFormData.setTemperature === 'true'
  // @ts-expect-error(sa, 2021-6-14): null check targetTemperature
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
