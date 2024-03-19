import { HeaterShakerArgs } from '@opentrons/step-generation'
import type { HydratedHeaterShakerFormData } from '../../../form-types'

export const heaterShakerFormToArgs = (
  formData: HydratedHeaterShakerFormData
): HeaterShakerArgs => {
  const {
    moduleId,
    setHeaterShakerTemperature,
    targetHeaterShakerTemperature,
    targetSpeed,
    setShake,
    latchOpen,
  } = formData
  console.assert(
    setHeaterShakerTemperature
      ? !Number.isNaN(targetHeaterShakerTemperature)
      : true,
    'heaterShakerFormToArgs expected targetTemp to be a number when setTemp is true'
  )
  console.assert(
    setShake ? !Number.isNaN(targetSpeed) : true,
    'heaterShakerFormToArgs expected targeShake to be a number when setShake is true'
  )

  const targetTemperature =
    setHeaterShakerTemperature && targetHeaterShakerTemperature != null
      ? parseFloat(targetHeaterShakerTemperature)
      : null
  const targetShake =
    setShake && targetSpeed != null ? parseFloat(targetSpeed) : null

  return {
    commandCreatorFnName: 'heaterShaker',
    module: moduleId,
    targetTemperature: targetTemperature,
    rpm: targetShake,
    latchOpen: latchOpen,
    timerMinutes:
      formData.heaterShakerTimerMinutes != null
        ? parseInt(formData.heaterShakerTimerMinutes)
        : null,
    timerSeconds:
      formData.heaterShakerTimerSeconds != null
        ? parseInt(formData.heaterShakerTimerSeconds)
        : null,
  }
}
