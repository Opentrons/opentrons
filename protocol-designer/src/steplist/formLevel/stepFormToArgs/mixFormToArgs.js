// @flow

import { getLabware } from '@opentrons/shared-data'
import intersection from 'lodash/intersection'
import type { FormData } from '../../../form-types'
import type { MixFormData } from '../../../step-generation'
import { DEFAULT_CHANGE_TIP_OPTION } from '../../../constants'
import type { StepFormContext } from './types'
import { orderWells } from '../../utils'

type ValidationAndErrors<F> = {
  errors: {[string]: string},
  validatedForm: F | null,
}

const mixFormToArgs = (formData: FormData, context: StepFormContext): ValidationAndErrors<MixFormData> => {
  const requiredFields = ['pipette', 'labware', 'volume', 'times']

  let errors = {}

  requiredFields.forEach(field => {
    if (formData[field] == null) {
      errors[field] = 'This field is required'
    }
  })

  const {labware, pipette} = formData
  const touchTip = !!formData['touchTip']

  let wells = formData.wells || []
  const orderFirst = formData.aspirate_wellOrder_first
  const orderSecond = formData.aspirate_wellOrder_second
  if (context && context.labware && labware) {
    const labwareById = context.labware
    const labwareType = labwareById[labware].type
    const labwareDef = getLabware(labwareType)
    if (labwareDef) {
      const allWellsOrdered = orderWells(labwareDef.ordering, orderFirst, orderSecond)
      wells = intersection(allWellsOrdered, wells)
    } else {
      console.warn('the specified labware definition could not be located')
    }
  }

  const volume = Number(formData.volume) || 0
  const times = Number(formData.times) || 0
  // NOTE: for mix, there is only one tip offset field,
  // and it applies to both aspirate and dispense
  const aspirateOffsetFromBottomMm = Number(formData['mmFromBottom'])
  const dispenseOffsetFromBottomMm = Number(formData['mmFromBottom'])

  // It's radiobutton, so one should always be selected.
  const changeTip = formData['aspirate_changeTip'] || DEFAULT_CHANGE_TIP_OPTION

  const blowout = formData['dispense_blowout_labware']

  const delay = formData['dispense_delay_checkbox']
    ? ((Number(formData['dispense_delayMinutes']) || 0) * 60) +
      (Number(formData['dispense_delaySeconds'] || 0))
    : null
  // TODO Ian 2018-05-08 delay number parsing errors

  if (wells.length <= 0) {
    errors.wells = '1 or more wells is required'
  }

  if (volume <= 0) {
    errors.volume = 'Volume must be a number greater than 0'
  }

  if (times <= 0 || !Number.isInteger(times)) {
    errors.times = 'Number of repetitions must be an integer greater than 0'
  }

  // TODO: BC 2018-08-21 remove this old validation logic, currently unused
  const isErrorFree = !(Object.values(errors).length > 0)

  return {
    errors,
    validatedForm: isErrorFree && labware && pipette
      ? {
        stepType: 'mix',
        name: `Mix ${formData.id}`, // TODO real name for steps
        description: 'description would be here 2018-03-01', // TODO get from form
        labware,
        wells,
        volume,
        times,
        touchTip,
        delay,
        changeTip,
        blowout,
        pipette,
        aspirateOffsetFromBottomMm,
        dispenseOffsetFromBottomMm,
      }
      : null,
  }
}

export default mixFormToArgs
