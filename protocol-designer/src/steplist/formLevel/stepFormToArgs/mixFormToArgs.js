// @flow
import assert from 'assert'
import { getLabware } from '@opentrons/shared-data'
import intersection from 'lodash/intersection'
import type { FormData } from '../../../form-types'
import type { MixArgs } from '../../../step-generation'
import { DEFAULT_CHANGE_TIP_OPTION } from '../../../constants'
import { orderWells } from '../../utils'

type MixStepArgs = MixArgs

// TODO: BC 2018-10-30 move getting labwareDef into hydration layer upstream
const mixFormToArgs = (hydratedFormData: FormData): MixStepArgs => {
  const {labware, pipette} = hydratedFormData
  const touchTip = Boolean(hydratedFormData['mix_touchTip_checkbox'])
  const touchTipMmFromBottom = hydratedFormData['mix_touchTip_mmFromBottom']

  let wells = hydratedFormData.wells || []
  const orderFirst = hydratedFormData.mix_wellOrder_first
  const orderSecond = hydratedFormData.mix_wellOrder_second

  // TODO: Ian 2019-01-15 use getOrderedWells instead of orderWells to avoid this duplicated code
  const labwareDef = labware && getLabware(labware.type)
  if (labwareDef) {
    const allWellsOrdered = orderWells(labwareDef.ordering, orderFirst, orderSecond)
    wells = intersection(allWellsOrdered, wells)
  } else {
    console.warn('the specified labware definition could not be located')
  }

  const volume = hydratedFormData.volume
  const times = hydratedFormData.times

  const aspirateFlowRateUlSec = hydratedFormData['aspirate_flowRate']
  const dispenseFlowRateUlSec = hydratedFormData['dispense_flowRate']

  // NOTE: for mix, there is only one tip offset field,
  // and it applies to both aspirate and dispense
  const aspirateOffsetFromBottomMm = hydratedFormData['mix_mmFromBottom']
  const dispenseOffsetFromBottomMm = hydratedFormData['mix_mmFromBottom']

  // It's radiobutton, so one should always be selected.
  // One changeTip option should always be selected.
  assert(hydratedFormData['changeTip'], 'mixFormToArgs expected non-falsey changeTip option')
  const changeTip = hydratedFormData['changeTip'] || DEFAULT_CHANGE_TIP_OPTION

  const blowoutLocation = hydratedFormData['blowout_checkbox'] ? hydratedFormData['blowout_location'] : null

  return {
    commandCreatorFnName: 'mix',
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
