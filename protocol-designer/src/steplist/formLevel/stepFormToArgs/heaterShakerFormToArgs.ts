import { getTimeFromForm } from '../../utils/getTimeFromForm'

import type { HeaterShakerArgs } from '@opentrons/step-generation'
import type { HydratedHeaterShakerFormData } from '../../../form-types'
import type { GetCastFormData } from '../../fieldLevel'

export const heaterShakerFormToArgs = (
  castFormData: GetCastFormData<HydratedHeaterShakerFormData>
): HeaterShakerArgs => {
  const {
    moduleId,
    setHeaterShakerTemperature,
    targetHeaterShakerTemperature,
    targetSpeed,
    setShake,
    latchOpen,
    stepDetails,
    stepName,
  } = castFormData
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
  const { hours, minutes, seconds } = getTimeFromForm(
    castFormData.heaterShakerTimer
  )
  const isNullTime = hours === 0 && minutes === 0 && seconds === 0

  const targetTemperature =
    setHeaterShakerTemperature && targetHeaterShakerTemperature != null
      ? // @ts-expect-error - todo(mm, 2025-10-09): Type error inherited from prior code.
        // targetHeaterShakerTemperature seems to already be a number. Confirm that
        // and remove this if it's safe.
        parseFloat(targetHeaterShakerTemperature)
      : null
  const targetShake =
    // @ts-expect-error - todo(mm, 2025-10-09): Type error inherited from prior code.
    // targetSpeed seems to already be a number. Confirm that
    // and remove this if it's safe.
    setShake && targetSpeed != null ? parseFloat(targetSpeed) : null

  return {
    commandCreatorFnName: 'heaterShaker',
    name: stepName,
    description: stepDetails,
    // todo(mm, 2025-10-09): form-types.ts is inconsistent about whether moduleId is nullable.
    // This runtime behavior of assuming it can't be nullish here is inherited from prior code.
    // Look into this.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    moduleId: moduleId!,
    targetTemperature,
    rpm: targetShake,
    latchOpen,
    timerHours: isNullTime ? null : hours,
    timerMinutes: isNullTime ? null : minutes,
    timerSeconds: isNullTime ? null : seconds,
  }
}
