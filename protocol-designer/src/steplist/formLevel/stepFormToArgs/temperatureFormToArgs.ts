import type {
  DeactivateTemperatureArgs,
  SetTemperatureArgs,
} from '@opentrons/step-generation'
import type { HydratedTemperatureFormData } from '../../../form-types'
import type { GetCastFormData } from '../../fieldLevel'

type TemperatureArgs = SetTemperatureArgs | DeactivateTemperatureArgs
export const temperatureFormToArgs = (
  formData: GetCastFormData<HydratedTemperatureFormData>
): TemperatureArgs => {
  const { moduleId, stepName, stepDetails } = formData
  // cast values
  const setTemperature = formData.setTemperature === 'true'
  // @ts-expect-error(sa, 2021-6-14): null check targetTemperature
  // todo(mm, 2025-10-09): Pretty sure targetTemperature is actually non-nullable now,
  // though it is a number, not a string, and so there is still a type error here.
  const targetTemperature = parseFloat(formData.targetTemperature)
  console.assert(
    setTemperature ? !Number.isNaN(targetTemperature) : true,
    'temperatureFormToArgs expected (hydrated) targetTemperature to be a number when setTemperature is "true"'
  )

  if (setTemperature && !Number.isNaN(targetTemperature)) {
    return {
      commandCreatorFnName: 'setTemperature',
      moduleId: moduleId ?? '',
      celsius: targetTemperature,
      name: stepName,
      description: stepDetails,
    }
  } else {
    return {
      commandCreatorFnName: 'deactivateTemperature',
      moduleId: moduleId ?? '',
      name: stepName,
      description: stepDetails,
    }
  }
}
