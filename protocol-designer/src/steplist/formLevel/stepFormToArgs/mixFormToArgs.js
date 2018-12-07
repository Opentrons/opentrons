// @flow

import { getLabware } from '@opentrons/shared-data'
import intersection from 'lodash/intersection'
import type { FormData } from '../../../form-types'
import type { MixFormData } from '../../../step-generation'
import { DEFAULT_CHANGE_TIP_OPTION } from '../../../constants'
import { orderWells } from '../../utils'

type MixStepArgs = MixFormData

// TODO: BC 2018-10-30 move getting labwareDef into hydration layer upstream
const mixFormToArgs = (hydratedFormData: FormData): MixStepArgs => {
  const {labware, pipette} = hydratedFormData
  const touchTip = !!hydratedFormData['touchTip']
  const touchTipMmFromBottom = hydratedFormData['mix_touchTipMmFromBottom']

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

  const aspirateFlowRateUlSec = hydratedFormData['aspirate_flowRate']
  const dispenseFlowRateUlSec = hydratedFormData['dispense_flowRate']

  // NOTE: for mix, there is only one tip offset field,
  // and it applies to both aspirate and dispense
  const aspirateOffsetFromBottomMm = hydratedFormData['mix_mmFromBottom']
  const dispenseOffsetFromBottomMm = hydratedFormData['mix_mmFromBottom']

  // It's radiobutton, so one should always be selected.
  const changeTip = hydratedFormData['aspirate_changeTip'] || DEFAULT_CHANGE_TIP_OPTION

  const blowoutLocation = hydratedFormData['dispense_blowout_checkbox'] ? hydratedFormData['dispense_blowout_location'] : null

  return {
    stepType: 'mix',
    name: `Mix ${hydratedFormData.id}`, // TODO real name for steps
    description: 'description would be here 2018-03-01', // TODO get from form
    labware: labware.id,
    wells,
    volume,
    times,
    touchTip,
    touchTipMmFromBottom,
    changeTip,
    blowoutLocation,
    pipette: pipette.id,
    aspirateFlowRateUlSec,
    dispenseFlowRateUlSec,
    aspirateOffsetFromBottomMm,
    dispenseOffsetFromBottomMm,
  }
}

export default mixFormToArgs
