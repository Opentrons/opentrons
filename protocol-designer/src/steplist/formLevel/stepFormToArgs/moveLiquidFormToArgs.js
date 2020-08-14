// @flow
import assert from 'assert'
import { getWellsDepth } from '@opentrons/shared-data'
import {
  DEST_WELL_BLOWOUT_DESTINATION,
  SOURCE_WELL_BLOWOUT_DESTINATION,
} from '../../../step-generation/utils'
import {
  DEFAULT_MM_FROM_BOTTOM_ASPIRATE,
  DEFAULT_MM_FROM_BOTTOM_DISPENSE,
  DEFAULT_MM_BLOWOUT_OFFSET_FROM_TOP,
  DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP,
} from '../../../constants'
import { getOrderedWells } from '../../utils'

import type { HydratedMoveLiquidFormData } from '../../../form-types'
import type {
  ConsolidateArgs,
  DistributeArgs,
  TransferArgs,
  InnerDelayArgs,
  InnerMixArgs,
} from '../../../step-generation'

export function getDelayData(
  hydratedFormData: $PropertyType<HydratedMoveLiquidFormData, 'fields'>,
  checkboxField: 'aspirate_delay_checkbox' | 'dispense_delay_checkbox',
  secondsField: 'aspirate_delay_seconds' | 'dispense_delay_seconds',
  mmFromBottomField:
    | 'aspirate_delay_mmFromBottom'
    | 'dispense_delay_mmFromBottom'
): ?InnerDelayArgs {
  const checkbox = hydratedFormData[checkboxField]
  const seconds = hydratedFormData[secondsField]
  const mmFromBottom = hydratedFormData[mmFromBottomField]

  if (
    checkbox &&
    (typeof seconds === 'number' && seconds > 0) &&
    (typeof mmFromBottom === 'number' && mmFromBottom > 0)
  ) {
    return { seconds, mmFromBottom }
  }
  return null
}

// NOTE(sa, 2020-08-11): leaving this as fn so it can be expanded later for dispense air gap
export function getAirGapData(
  hydratedFormData: $PropertyType<HydratedMoveLiquidFormData, 'fields'>,
  checkboxField: 'aspirate_airGap_checkbox', // | 'dispense_airGap_checkbox'
  volumeField: 'aspirate_airGap_volume' // | 'dispense_airGap_volume'
): number | null {
  const checkbox = hydratedFormData[checkboxField]
  const volume = hydratedFormData[volumeField]

  if (checkbox && typeof volume === 'number' && volume > 0) {
    return volume
  }
  return null
}

export function getMixData(
  hydratedFormData: *,
  checkboxField: *,
  volumeField: *,
  timesField: *
): ?InnerMixArgs {
  const checkbox = hydratedFormData[checkboxField]
  const volume = hydratedFormData[volumeField]
  const times = hydratedFormData[timesField]

  if (
    checkbox &&
    (typeof volume === 'number' && volume > 0) &&
    (typeof times === 'number' && times > 0)
  ) {
    return { volume, times }
  }
  return null
}

type MoveLiquidStepArgs = ConsolidateArgs | DistributeArgs | TransferArgs | null

export const moveLiquidFormToArgs = (
  hydratedFormData: HydratedMoveLiquidFormData
): MoveLiquidStepArgs => {
  assert(
    hydratedFormData.stepType === 'moveLiquid',
    `moveLiquidFormToArgs called with stepType ${hydratedFormData.stepType}, expected "moveLiquid"`
  )

  const fields = hydratedFormData.fields
  const pipetteSpec = fields.pipette.spec

  const pipetteId = fields.pipette.id
  const {
    volume,
    aspirate_labware: sourceLabware,
    dispense_labware: destLabware,
    aspirate_wells: sourceWellsUnordered,
    dispense_wells: destWellsUnordered,
    path,
  } = fields

  let sourceWells = getOrderedWells(
    fields.aspirate_wells,
    sourceLabware.def,
    fields.aspirate_wellOrder_first,
    fields.aspirate_wellOrder_second
  )

  let destWells = getOrderedWells(
    fields.dispense_wells,
    destLabware.def,
    fields.dispense_wellOrder_first,
    fields.dispense_wellOrder_second
  )

  // 1:many with single path: spread well array of length 1 to match other well array
  if (path === 'single' && sourceWells.length !== destWells.length) {
    if (sourceWells.length === 1) {
      sourceWells = Array(destWells.length).fill(sourceWells[0])
    } else if (destWells.length === 1) {
      destWells = Array(sourceWells.length).fill(destWells[0])
    }
  }

  let disposalVolume = null
  let blowoutDestination = null
  let blowoutLabware = null
  let blowoutWell = null
  if (fields.disposalVolume_checkbox || fields.blowout_checkbox) {
    if (fields.disposalVolume_checkbox) {
      // the disposal volume is only relevant when disposalVolume is checked,
      // not when just blowout is checked.
      disposalVolume = fields.disposalVolume_volume
    }
    blowoutDestination = fields.blowout_location
    if (blowoutDestination === SOURCE_WELL_BLOWOUT_DESTINATION) {
      blowoutLabware = sourceLabware.id
      blowoutWell = sourceWells[0]
    } else if (blowoutDestination === DEST_WELL_BLOWOUT_DESTINATION) {
      blowoutLabware = destLabware.id
      blowoutWell = destWells[0]
    } else {
      // NOTE: if blowoutDestination is not source/dest well, it is a labware ID.
      // We are assuming this labware has a well A1, and that both single and multi
      // channel pipettes can access that well A1.
      blowoutLabware = blowoutDestination
      blowoutWell = 'A1'
    }
  }

  const touchTipAfterAspirate = Boolean(fields.aspirate_touchTip_checkbox)

  const touchTipAfterAspirateOffsetMmFromBottom =
    fields.aspirate_touchTip_mmFromBottom ||
    getWellsDepth(fields.aspirate_labware.def, sourceWells) +
      DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP

  const touchTipAfterDispense = Boolean(fields.dispense_touchTip_checkbox)
  const touchTipAfterDispenseOffsetMmFromBottom =
    fields.dispense_touchTip_mmFromBottom ||
    getWellsDepth(fields.dispense_labware.def, destWells) +
      DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP

  const mixBeforeAspirate = getMixData(
    fields,
    'aspirate_mix_checkbox',
    'aspirate_mix_volume',
    'aspirate_mix_times'
  )

  const mixInDestination = getMixData(
    fields,
    'dispense_mix_checkbox',
    'dispense_mix_volume',
    'dispense_mix_times'
  )
  const aspirateDelay = getDelayData(
    fields,
    'aspirate_delay_checkbox',
    'aspirate_delay_seconds',
    'aspirate_delay_mmFromBottom'
  )

  const dispenseDelay = getDelayData(
    fields,
    'dispense_delay_checkbox',
    'dispense_delay_seconds',
    'dispense_delay_mmFromBottom'
  )

  const blowoutLocation =
    (fields.blowout_checkbox && fields.blowout_location) || null

  const blowoutOffsetFromTopMm = DEFAULT_MM_BLOWOUT_OFFSET_FROM_TOP

  const aspirateAirGapVolume = getAirGapData(
    fields,
    'aspirate_airGap_checkbox',
    'aspirate_airGap_volume'
  )

  const commonFields = {
    pipette: pipetteId,
    volume,

    sourceLabware: sourceLabware.id,
    destLabware: destLabware.id,

    aspirateFlowRateUlSec:
      fields.aspirate_flowRate || pipetteSpec.defaultAspirateFlowRate.value,
    dispenseFlowRateUlSec:
      fields.dispense_flowRate || pipetteSpec.defaultDispenseFlowRate.value,
    aspirateOffsetFromBottomMm:
      fields.aspirate_mmFromBottom || DEFAULT_MM_FROM_BOTTOM_ASPIRATE,
    dispenseOffsetFromBottomMm:
      fields.dispense_mmFromBottom || DEFAULT_MM_FROM_BOTTOM_DISPENSE,
    blowoutFlowRateUlSec:
      fields.dispense_flowRate || pipetteSpec.defaultDispenseFlowRate.value,
    blowoutOffsetFromTopMm,

    changeTip: fields.changeTip,
    preWetTip: Boolean(fields.preWetTip),
    aspirateDelay,
    dispenseDelay,
    aspirateAirGapVolume,
    mixInDestination,
    touchTipAfterAspirate,
    touchTipAfterAspirateOffsetMmFromBottom,
    touchTipAfterDispense,
    touchTipAfterDispenseOffsetMmFromBottom,

    description: hydratedFormData.description,
    name: hydratedFormData.stepName,
  }

  assert(
    sourceWellsUnordered.length > 0,
    'expected sourceWells to have length > 0'
  )
  assert(destWellsUnordered.length > 0, 'expected destWells to have length > 0')
  assert(
    sourceWellsUnordered.length === 1 ||
      destWellsUnordered.length === 1 ||
      sourceWellsUnordered.length === destWellsUnordered.length,
    `cannot do moveLiquidFormToArgs. Mismatched wells (not 1:N, N:1, or N:N!) for path="single". Neither source (${sourceWellsUnordered.length}) nor dest (${destWellsUnordered.length}) equal 1`
  )

  switch (path) {
    case 'single': {
      const transferStepArguments: TransferArgs = {
        ...commonFields,
        commandCreatorFnName: 'transfer',
        blowoutLocation,
        sourceWells,
        destWells,
        mixBeforeAspirate,
      }
      return transferStepArguments
    }
    case 'multiAspirate': {
      const consolidateStepArguments: ConsolidateArgs = {
        ...commonFields,
        commandCreatorFnName: 'consolidate',
        blowoutLocation,
        mixFirstAspirate: mixBeforeAspirate,
        sourceWells,
        destWell: destWells[0],
      }
      return consolidateStepArguments
    }
    case 'multiDispense': {
      const distributeStepArguments: DistributeArgs = {
        ...commonFields,
        commandCreatorFnName: 'distribute',
        disposalVolume,
        // TODO: Ian 2019-01-15 these args have TODOs to get renamed, let's do it after deleting Distribute step
        disposalLabware: blowoutLabware,
        disposalWell: blowoutWell,
        mixBeforeAspirate,
        sourceWell: sourceWells[0],
        destWells,
      }
      return distributeStepArguments
    }
    default: {
      assert(
        false,
        `moveLiquidFormToArgs got unexpected "path" field value: ${path}`
      )
      return null
    }
  }
}
