import { POSITION_REFERENCE_BOTTOM } from '@opentrons/shared-data'
import { AUTOMATIC } from '@opentrons/step-generation'

import {
  DEFAULT_CHANGE_TIP_OPTION,
  DEFAULT_MM_BLOWOUT_OFFSET_FROM_TOP,
  DEFAULT_MM_OFFSET_FROM_BOTTOM,
  DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP,
} from '../../../constants'
import { getMatchingTipLiquidSpecs } from '../../../utils'
import { getOrderedWells } from '../../utils/getOrderedWells'
import { getMixDelayData } from './getDelayData'

import type { MixArgs } from '@opentrons/step-generation'
import type { HydratedMixFormData } from '../../../form-types'
import type { GetCastFormData } from '../../fieldLevel'

type MixStepArgs = MixArgs
export const mixFormToArgs = (
  castFormData: GetCastFormData<HydratedMixFormData>
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
    primaryNozzle,
    pushOut_checkbox,
    pushOut_volume,
    tip_tracking,
    tips_selected,
    tiprack_selected,
  } = castFormData
  const matchingTipLiquidSpecs = getMatchingTipLiquidSpecs(
    pipette?.spec,
    castFormData.volume,
    castFormData.tipRack
  )
  const unorderedWells = castFormData.wells || []
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
    castFormData.aspirate_flowRate ||
    matchingTipLiquidSpecs?.defaultAspirateFlowRate.default
  const dispenseFlowRateUlSec =
    castFormData.dispense_flowRate ||
    matchingTipLiquidSpecs?.defaultDispenseFlowRate.default

  // It's radiobutton, so one should always be selected.
  // One changeTip option should always be selected.
  console.assert(
    castFormData.changeTip != null,
    'mixFormToArgs expected non-falsey changeTip option'
  )
  const changeTip = castFormData.changeTip || DEFAULT_CHANGE_TIP_OPTION
  const blowoutLocation = castFormData.blowout_checkbox
    ? castFormData.blowout_location
    : null
  // Blowout settings
  const blowoutFlowRateUlSec =
    castFormData.blowout_flowRate ??
    matchingTipLiquidSpecs?.defaultBlowOutFlowRate.default

  const blowoutOffsetFromTopMm = blowoutLocation
    ? (blowout_z_offset ?? DEFAULT_MM_BLOWOUT_OFFSET_FROM_TOP)
    : 0
  // Delay settings
  const aspirateDelaySeconds = getMixDelayData(
    castFormData,
    'aspirate_delay_checkbox',
    'aspirate_delay_seconds'
  )
  const dispenseDelaySeconds = getMixDelayData(
    castFormData,
    'dispense_delay_checkbox',
    'dispense_delay_seconds'
  )
  return {
    commandCreatorFnName: 'mix',
    name: castFormData.stepName,
    description: castFormData.stepDetails,
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
    blowoutOffsetFromTopMm,
    aspirateDelaySeconds,
    tipRack: castFormData.tipRack?.tiprackDefURI,
    dispenseDelaySeconds,
    //  TODO(jr, 7/26/24): wire up wellNames
    dropTipLocation: dropTip_location,
    nozzles,
    positionReference: mix_position_reference ?? POSITION_REFERENCE_BOTTOM,
    primaryNozzle,
    xOffset: mix_x_position ?? 0,
    yOffset: mix_y_position ?? 0,
    zOffset: mix_mmFromBottom ?? DEFAULT_MM_OFFSET_FROM_BOTTOM,
    finalPushOut:
      pushOut_checkbox && pushOut_volume != null ? pushOut_volume : 0,
    tipTracking: tip_tracking ?? AUTOMATIC,
    tipsSelected: tips_selected ?? [],
    tiprackSelected: tiprack_selected ?? null,
  }
}
