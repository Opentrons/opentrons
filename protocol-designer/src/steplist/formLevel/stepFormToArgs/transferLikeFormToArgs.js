// @flow

import { getLabware } from '@opentrons/shared-data'
import intersection from 'lodash/intersection'
import type { FormData } from '../../../form-types'
import type {
  ConsolidateFormData,
  DistributeFormData,
  TransferFormData,
  SOURCE_WELL_BLOWOUT_DESTINATION,
} from '../../../step-generation'
import { DEFAULT_CHANGE_TIP_OPTION } from '../../../constants'
import { orderWells } from '../../utils'

function getMixData (hydratedFormData, checkboxField, volumeField, timesField) {
  const checkbox = hydratedFormData[checkboxField]
  const volume = parseFloat(hydratedFormData[volumeField])
  const times = parseInt(hydratedFormData[timesField])
  return (checkbox && volume > 0 && times > 0)
    ? {volume, times}
    : null
}

type TransferLikeStepArgs = ConsolidateFormData | DistributeFormData | TransferFormData | null

// TODO: BC 2018-10-30 move getting labwareDef into hydration layer upstream
const transferLikeFormToArgs = (hydratedFormData: FormData): TransferLikeStepArgs => {
  console.log([hydratedFormData])
  const stepType = hydratedFormData.stepType
  const pipette = hydratedFormData['pipette']
  const volume = Number(hydratedFormData['volume'])
  const sourceLabware = hydratedFormData['aspirate_labware']
  const destLabware = hydratedFormData['dispense_labware']

  const aspirateOffsetFromBottomMm = hydratedFormData['aspirate_mmFromBottom']
  const dispenseOffsetFromBottomMm = hydratedFormData['dispense_mmFromBottom']

  const touchTipAfterAspirate = hydratedFormData['aspirate_touchTip'] || false
  const touchTipAfterAspirateOffsetMmFromBottom = touchTipAfterAspirate
    ? hydratedFormData['aspirate_touchTipMmFromBottom']
    : null
  const touchTipAfterDispense = hydratedFormData['dispense_touchTip'] || false
  const touchTipAfterDispenseOffsetMmFromBottom = touchTipAfterDispense
    ? hydratedFormData['dispense_touchTipMmFromBottom']
    : null

  const delayAfterDispense = hydratedFormData['dispense_delay_checkbox']
    ? ((Number(hydratedFormData['dispense_delayMinutes']) || 0) * 60) +
      (Number(hydratedFormData['dispense_delaySeconds'] || 0))
    : null

  const mixFirstAspirate = hydratedFormData['aspirate_mix_checkbox']
    ? {
      volume: Number(hydratedFormData['aspirate_mix_volume']),
      times: parseInt(hydratedFormData['aspirate_mix_times']),
    }
    : null

  const mixBeforeAspirate = getMixData(
    hydratedFormData,
    'aspirate_mix_checkbox',
    'aspirate_mix_volume',
    'aspirate_mix_times'
  )

  const mixInDestination = getMixData(
    hydratedFormData,
    'dispense_mix_checkbox',
    'dispense_mix_volume',
    'dispense_mix_times'
  )

  const changeTip = hydratedFormData['aspirate_changeTip'] || DEFAULT_CHANGE_TIP_OPTION

  const blowoutDestination = hydratedFormData['dispense_blowout_checkbox'] ? hydratedFormData['dispense_blowout_labware'] : null

  const commonFields = {
    pipette: pipette.id,
    volume,

    sourceLabware: sourceLabware.id,
    destLabware: destLabware.id,

    aspirateOffsetFromBottomMm,
    dispenseOffsetFromBottomMm,

    changeTip,
    delayAfterDispense,
    mixInDestination,
    preWetTip: hydratedFormData['aspirate_preWetTip'] || false,
    touchTipAfterAspirate,
    touchTipAfterAspirateOffsetMmFromBottom,
    touchTipAfterDispense,
    touchTipAfterDispenseOffsetMmFromBottom,
    description: 'description would be here 2018-03-01', // TODO get from form
  }

  let {
    aspirate_wells: sourceWells,
    dispense_wells: destWells,
    aspirate_wellOrder_first,
    aspirate_wellOrder_second,
    dispense_wellOrder_first,
    dispense_wellOrder_second,
  } = hydratedFormData
  sourceWells = sourceWells || []
  destWells = destWells || []

  if (stepType !== 'distribute' && sourceLabware) {
    const sourceLabwareDef = sourceLabware && getLabware(sourceLabware.type)
    if (sourceLabwareDef) {
      const allWellsOrdered = orderWells(sourceLabwareDef.ordering, aspirate_wellOrder_first, aspirate_wellOrder_second)
      sourceWells = intersection(allWellsOrdered, sourceWells)
    } else {
      console.warn('the specified source labware definition could not be located')
    }
  }
  if (stepType !== 'consolidate' && destLabware) {
    const destLabwareDef = destLabware && getLabware(destLabware.type)
    if (destLabwareDef) {
      const allWellsOrdered = orderWells(destLabwareDef.ordering, dispense_wellOrder_first, dispense_wellOrder_second)
      destWells = intersection(allWellsOrdered, destWells)
    } else {
      console.warn('the specified destination labware definition could not be located')
    }
  }


  // TODO: BC 2018-11-26 move this check into step generation like blowoutDestination
  let disposalVolume = null
  let disposalDestination = null
  let disposalLabware = null
  let disposalWell = null
  if (hydratedFormData['aspirate_disposalVol_checkbox']) {
    disposalVolume = Number(hydratedFormData['aspirate_disposalVol_volume'])
    disposalDestination = hydratedFormData['aspirate_disposalVol_destination']
    if (disposalDestination === SOURCE_WELL_BLOWOUT_DESTINATION) {
      disposalLabware = sourceLabware.id
      disposalWell = sourceWells[0]
    } else {
      // NOTE: if disposalDestination is not source well it is a labware type (e.g. fixed-trash)
      disposalLabware = disposalDestination
      disposalWell = 'A1'
    }
  }


  switch (stepType) {
    case 'transfer': {
      const transferStepArguments: TransferFormData = {
        ...commonFields,
        blowoutDestination,
        stepType: 'transfer',
        sourceWells,
        destWells,
        mixBeforeAspirate,
        name: `Transfer ${hydratedFormData.id}`, // TODO Ian 2018-04-03 real name for steps
      }
      return transferStepArguments
    }
    case 'consolidate': {
      const consolidateStepArguments: ConsolidateFormData = {
        ...commonFields,
        blowoutDestination,
        mixFirstAspirate,
        sourceWells,
        destWell: destWells[0],
        stepType: 'consolidate',
        name: `Consolidate ${hydratedFormData.id}`, // TODO Ian 2018-04-03 real name for steps
      }
      return consolidateStepArguments
    }
    case 'distribute': {
      const distributeStepArguments: DistributeFormData = {
        ...commonFields,
        disposalVolume,
        disposalLabware,
        disposalWell,
        mixBeforeAspirate,
        sourceWell: sourceWells[0],
        destWells,
        stepType: 'distribute',
        name: `Distribute ${hydratedFormData.id}`, // TODO Ian 2018-04-03 real name for steps
      }
      return distributeStepArguments
    }
    default: {
      // should never hit default, just a sanity check
      console.error('Called TransferLikeFormToArgs with non Transfer-Like step type')
      return null
    }
  }
}

export default transferLikeFormToArgs
