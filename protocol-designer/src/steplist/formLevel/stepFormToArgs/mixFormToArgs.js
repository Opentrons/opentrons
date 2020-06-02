// @flow
import assert from 'assert'
import { getWellsDepth } from '@opentrons/shared-data'
import {
  DEFAULT_CHANGE_TIP_OPTION,
  DEFAULT_MM_FROM_BOTTOM_ASPIRATE,
  DEFAULT_MM_FROM_BOTTOM_DISPENSE,
  DEFAULT_MM_BLOWOUT_OFFSET_FROM_TOP,
  DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP,
} from '../../../constants'
import { getOrderedWells } from '../../utils'
import type { HydratedMixFormDataLegacy } from '../../../form-types'
import type { MixArgs } from '../../../step-generation'

type MixStepArgs = MixArgs

export const mixFormToArgs = (
  hydratedFormData: HydratedMixFormDataLegacy
): MixStepArgs => {
  const { labware, pipette } = hydratedFormData

  const unorderedWells = hydratedFormData.wells || []
  const orderFirst = hydratedFormData.mix_wellOrder_first
  const orderSecond = hydratedFormData.mix_wellOrder_second

  const orderedWells = getOrderedWells(
    unorderedWells,
    labware.def,
    orderFirst,
    orderSecond
  )

  const touchTip = Boolean(hydratedFormData['mix_touchTip_checkbox'])
  const touchTipMmFromBottom =
    hydratedFormData['mix_touchTip_mmFromBottom'] ||
    getWellsDepth(labware.def, orderedWells) +
      DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP

  const volume = hydratedFormData.volume || 0
  const times = hydratedFormData.times || 0

  const aspirateFlowRateUlSec =
    hydratedFormData['aspirate_flowRate'] ||
    pipette.spec.defaultAspirateFlowRate.value
  const dispenseFlowRateUlSec =
    hydratedFormData['dispense_flowRate'] ||
    pipette.spec.defaultDispenseFlowRate.value

  // NOTE: for mix, there is only one tip offset field,
  // and it applies to both aspirate and dispense
  const aspirateOffsetFromBottomMm =
    hydratedFormData['mix_mmFromBottom'] || DEFAULT_MM_FROM_BOTTOM_ASPIRATE
  const dispenseOffsetFromBottomMm =
    hydratedFormData['mix_mmFromBottom'] || DEFAULT_MM_FROM_BOTTOM_DISPENSE

  // It's radiobutton, so one should always be selected.
  // One changeTip option should always be selected.
  assert(
    hydratedFormData['changeTip'],
    'mixFormToArgs expected non-falsey changeTip option'
  )
  const changeTip = hydratedFormData['changeTip'] || DEFAULT_CHANGE_TIP_OPTION

  const blowoutLocation = hydratedFormData['blowout_checkbox']
    ? hydratedFormData['blowout_location']
    : null

  // Blowout settings
  const blowoutFlowRateUlSec = dispenseFlowRateUlSec
  const blowoutOffsetFromTopMm = blowoutLocation
    ? DEFAULT_MM_BLOWOUT_OFFSET_FROM_TOP
    : 0

  return {
    commandCreatorFnName: 'mix',
    name: `Mix ${hydratedFormData.id}`, // TODO real name for steps
    description: 'description would be here 2018-03-01', // TODO get from form
    labware: labware.id,
    wells: orderedWells,
    volume,
    times,
    touchTip,
    touchTipMmFromBottom,
    changeTip,
    blowoutLocation,
    pipette: pipette.id,
    aspirateFlowRateUlSec,
    dispenseFlowRateUlSec,
    blowoutFlowRateUlSec,
    aspirateOffsetFromBottomMm,
    dispenseOffsetFromBottomMm,
    blowoutOffsetFromTopMm,
  }
}
