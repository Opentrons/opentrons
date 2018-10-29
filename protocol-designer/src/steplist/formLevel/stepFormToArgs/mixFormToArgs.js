// @flow

import { getLabware } from '@opentrons/shared-data'
import intersection from 'lodash/intersection'
import type { FormData } from '../../../form-types'
import type { MixFormData } from '../../../step-generation'
import { DEFAULT_CHANGE_TIP_OPTION } from '../../../constants'
import { orderWells } from '../../utils'

type MixStepArgs = MixFormData

const mixFormToArgs = (hydratedFormData: FormData): MixStepArgs => {
  const {labware, pipette} = hydratedFormData
  const touchTip = !!hydratedFormData['touchTip']

  let wells = hydratedFormData.wells || []
  const orderFirst = hydratedFormData.aspirate_wellOrder_first
  const orderSecond = hydratedFormData.aspirate_wellOrder_second

  const labwareDef = labware && getLabware(labware.type)
  if (labwareDef) {
    const allWellsOrdered = orderWells(labwareDef.ordering, orderFirst, orderSecond)
    wells = intersection(allWellsOrdered, wells)
  } else {
    console.warn('the specified labware definition could not be located')
  }

  const volume = Number(hydratedFormData.volume) || 0
  const times = Number(hydratedFormData.times) || 0
  // NOTE: for mix, there is only one tip offset field,
  // and it applies to both aspirate and dispense
  const aspirateOffsetFromBottomMm = Number(hydratedFormData['mmFromBottom'])
  const dispenseOffsetFromBottomMm = Number(hydratedFormData['mmFromBottom'])

  // It's radiobutton, so one should always be selected.
  const changeTip = hydratedFormData['aspirate_changeTip'] || DEFAULT_CHANGE_TIP_OPTION

  const blowout = hydratedFormData['dispense_blowout_labware']

  const delay = hydratedFormData['dispense_delay_checkbox']
    ? ((Number(hydratedFormData['dispense_delayMinutes']) || 0) * 60) +
      (Number(hydratedFormData['dispense_delaySeconds'] || 0))
    : null
  // TODO Ian 2018-05-08 delay number parsing errors

  return {
    stepType: 'mix',
    name: `Mix ${hydratedFormData.id}`, // TODO real name for steps
    description: 'description would be here 2018-03-01', // TODO get from form
    labware,
    wells,
    volume,
    times,
    touchTip,
    delay,
    changeTip,
    blowout,
    pipette: pipette.id,
    aspirateOffsetFromBottomMm,
    dispenseOffsetFromBottomMm,
  }
}

export default mixFormToArgs
