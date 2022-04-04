import {
  SetTemperatureArgs,
  DeactivateTemperatureArgs,
} from '@opentrons/step-generation'
import type { HydratedHeaterShakerFormData } from '../../../form-types'

type HeaterShakerArgs = SetTemperatureArgs | DeactivateTemperatureArgs

export const heaterShakerFormToArgs = (
  formData: HydratedHeaterShakerFormData
): HeaterShakerArgs => {
  return {
    commandCreatorFnName: 'deactivateTemperature',
    module: formData.moduleId,
  }
}
