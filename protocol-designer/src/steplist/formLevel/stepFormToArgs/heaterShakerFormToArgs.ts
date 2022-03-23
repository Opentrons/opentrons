import {
  SetTemperatureArgs,
  DeactivateTemperatureArgs,
} from '@opentrons/step-generation'

type HeaterShakerArgs = SetTemperatureArgs | DeactivateTemperatureArgs

export const heaterShakerFormToArgs = (
  formData: FormData
): HeaterShakerArgs => {
  return {
    commandCreatorFnName: 'deactivateTemperature',
    module: formData.moduleId,
  }
}
