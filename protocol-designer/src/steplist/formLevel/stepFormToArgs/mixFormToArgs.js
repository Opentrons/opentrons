// @flow

import { getLabware } from '@opentrons/shared-data'
import intersection from 'lodash/intersection'
import type { FormData } from '../../../form-types'
import type { MixFormData } from '../../../step-generation'
import { DEFAULT_CHANGE_TIP_OPTION } from '../../../constants'
import { orderWells } from '../../utils'

type MixStepArgs = MixFormData

const mixFormToArgs = (formData: FormData): MixStepArgs => {
  const {labware, pipette} = formData
  const touchTip = !!formData['touchTip']

  let wells = formData.wells || []
  const orderFirst = formData.aspirate_wellOrder_first
  const orderSecond = formData.aspirate_wellOrder_second

  const labwareDef = labware && getLabware(labware.type)
  if (labwareDef) {
    const allWellsOrdered = orderWells(labwareDef.ordering, orderFirst, orderSecond)
    wells = intersection(allWellsOrdered, wells)
  } else {
    console.warn('the specified labware definition could not be located')
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

  return {
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
}

export default mixFormToArgs
