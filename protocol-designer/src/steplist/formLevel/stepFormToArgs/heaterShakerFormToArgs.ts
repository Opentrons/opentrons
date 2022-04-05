import assert from 'assert'
import { HeaterShakerArgs } from '@opentrons/step-generation'
import type { HydratedHeaterShakerFormData } from '../../../form-types'

export const heaterShakerFormToArgs = (
  formData: HydratedHeaterShakerFormData
): HeaterShakerArgs | null => {
  const { moduleId } = formData

  const setTemp = formData.setTemperature === 'true'
  //  @ts-expect-error(jr, 2022/4/5): null check targetTemperature
  const targetTemperature = parseFloat(formData.targetTemperature)
  assert(
    setTemp ? !Number.isNaN(targetTemperature) : true,
    'heaterShakerFormToArgs expected targetTemp to be a number when stTemp is true'
  )
  const setShake = formData.setSpeed === 'true'
  //  @ts-expect-error(jr, 2022/4/5): null check targetSpeed
  const targetShake = parseFloat(formData.targetSpeed)
  assert(
    setShake ? !Number.isNaN(targetShake) : true,
    'heaterShakerFormToArgs expected targeShake to be a number when setShake is true'
  )

  if (moduleId == null) return null

  return {
    commandCreatorFnName: 'heaterShaker',
    module: moduleId,
    targetTemperature: targetTemperature,
    rpm: targetShake,
    latchOpen: formData.latchOpen === 'true' ? true : false,
    timerMinutes:
      formData.timerMinutes != null ? parseInt(formData.timerMinutes) : null,
    timerSeconds:
      formData.timerSeconds != null ? parseInt(formData.timerSeconds) : null,
  }
}
