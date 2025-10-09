import { POSITION_REFERENCE_BOTTOM } from '@opentrons/shared-data'

import {
  DEFAULT_CHANGE_TIP_OPTION,
  DEFAULT_MM_BLOWOUT_OFFSET_FROM_TOP,
  DEFAULT_MM_OFFSET_FROM_BOTTOM,
  DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP,
} from '../../../constants'
import { getMatchingTipLiquidSpecs } from '../../../utils'
import { getOrderedWells } from '../../utils'
import { getMixDelayData } from './getDelayData'

import type { MixArgs } from '@opentrons/step-generation'
import type { HydratedMixFormData } from '../../../form-types'
import type { GetCastFormData } from '../../fieldLevel'

type MixStepArgs = MixArgs
export const mixFormToArgs = (
  formData: GetCastFormData<HydratedMixFormData>
): MixStepArgs => {
  const {
    volume: rawVolume,
    times: rawTimes,
    labware,
    pipette,
    dropTip_location,
    nozzles,
    mix_x_position,
    mix_y_position,
    mix_mmFromBottom,
    mix_position_reference,
    mix_touchTip_mmFromTop,
    mix_wellOrder_first,
    mix_wellOrder_second,
    mix_touchTip_checkbox,
    blowout_z_offset,
    pushOut_checkbox,
    pushOut_volume,
  } = formData
  const matchingTipLiquidSpecs = getMatchingTipLiquidSpecs(
    pipette,
    formData.volume,
    formData.tipRack
  )
  const unorderedWells = formData.wells || []
  const orderedWells = getOrderedWells(
    unorderedWells,
    labware.def,
    mix_wellOrder_first,
    mix_wellOrder_second
  )
  const touchTip = Boolean(mix_touchTip_checkbox)
  const touchTipMmFromTop =
    mix_touchTip_mmFromTop ?? DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP
  const volume = rawVolume || 0
  const times = rawTimes || 0
  const aspirateFlowRateUlSec =
    formData.aspirate_flowRate ||
    matchingTipLiquidSpecs?.defaultAspirateFlowRate.default
  const dispenseFlowRateUlSec =
    formData.dispense_flowRate ||
    matchingTipLiquidSpecs?.defaultDispenseFlowRate.default

  const offsetFromBottomMm =
    formData.mix_mmFromBottom || DEFAULT_MM_OFFSET_FROM_BOTTOM
  // It's radiobutton, so one should always be selected.
  // One changeTip option should always be selected.
  console.assert(
    formData.changeTip,
    'mixFormToArgs expected non-falsey changeTip option'
  )
  const changeTip = formData.changeTip || DEFAULT_CHANGE_TIP_OPTION
  const blowoutLocation = formData.blowout_checkbox
    ? formData.blowout_location
    : null
  // Blowout settings
  const blowoutFlowRateUlSec =
    formData.blowout_flowRate ??
    matchingTipLiquidSpecs?.defaultBlowOutFlowRate.default

  const blowoutOffsetFromTopMm = blowoutLocation
    ? blowout_z_offset ?? DEFAULT_MM_BLOWOUT_OFFSET_FROM_TOP
    : 0
  // Delay settings
  const aspirateDelaySeconds = getMixDelayData(
    formData,
    'aspirate_delay_checkbox',
    'aspirate_delay_seconds'
  )
  const dispenseDelaySeconds = getMixDelayData(
    formData,
    'dispense_delay_checkbox',
    'dispense_delay_seconds'
  )
  return {
    commandCreatorFnName: 'mix',
    name: formData.stepName,
    description: formData.stepDetails,
    labware: labware.id,
    wells: orderedWells,
    volume,
    times,
    touchTip,
    touchTipMmFromTop,
    changeTip,
    blowoutLocation,
    pipette: pipette.id,
    aspirateFlowRateUlSec: aspirateFlowRateUlSec ?? 0,
    dispenseFlowRateUlSec: dispenseFlowRateUlSec ?? 0,
    blowoutFlowRateUlSec: blowoutFlowRateUlSec ?? 0,
    offsetFromBottomMm,
    blowoutOffsetFromTopMm,
    aspirateDelaySeconds,
    tipRack: formData.tipRack,
    dispenseDelaySeconds,
    //  TODO(jr, 7/26/24): wire up wellNames
    dropTipLocation: dropTip_location,
    nozzles,
    xOffset: mix_x_position ?? 0,
    yOffset: mix_y_position ?? 0,
    zOffset: mix_mmFromBottom ?? DEFAULT_MM_OFFSET_FROM_BOTTOM,
    positionReference: mix_position_reference ?? POSITION_REFERENCE_BOTTOM,
    finalPushOut:
      pushOut_checkbox && pushOut_volume != null ? pushOut_volume : 0,
  }
}
