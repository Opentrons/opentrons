// @flow

import { getLabware } from '@opentrons/shared-data'
import intersection from 'lodash/intersection'
import type { FormData } from '../../../form-types'
import type {
  ConsolidateFormData,
  DistributeFormData,
  TransferFormData,
} from '../../../step-generation'
import { DEFAULT_CHANGE_TIP_OPTION } from '../../../constants'
import type { StepFormContext } from './types'
import { orderWells } from '../../utils'

export const SOURCE_WELL_DISPOSAL_DESTINATION = 'source_well'

type ValidationAndErrors<F> = {
  errors: {[string]: string},
  validatedForm: F | null,
}

function getMixData (formData, checkboxField, volumeField, timesField) {
  // TODO Ian 2018-04-03 is error reporting necessary? Or are only valid inputs allowed in these fields?
  const checkbox = formData[checkboxField]
  const volume = parseFloat(formData[volumeField])
  const times = parseInt(formData[timesField])
  return (checkbox && volume > 0 && times > 0)
    ? {volume, times}
    : null
}

type TransferLikeValidationAndErrors =
  | ValidationAndErrors<ConsolidateFormData>
  | ValidationAndErrors<DistributeFormData>
  | ValidationAndErrors<TransferFormData>

const transferLikeFormToArgs = (formData: FormData, context: StepFormContext): TransferLikeValidationAndErrors => {
  const stepType = formData.stepType
  const pipette = formData['pipette']
  const volume = Number(formData['volume'])
  const sourceLabware = formData['aspirate_labware']
  const destLabware = formData['dispense_labware']
  const blowout = formData['dispense_blowout_checkbox'] ? formData['dispense_blowout_labware'] : null

  const aspirateOffsetFromBottomMm = Number(formData['aspirate_mmFromBottom'])
  const dispenseOffsetFromBottomMm = Number(formData['dispense_mmFromBottom'])

  const delayAfterDispense = formData['dispense_delay_checkbox']
    ? ((Number(formData['dispense_delayMinutes']) || 0) * 60) +
      (Number(formData['dispense_delaySeconds'] || 0))
    : null

  const mixFirstAspirate = formData['aspirate_mix_checkbox']
    ? {
      volume: Number(formData['aspirate_mix_volume']),
      times: parseInt(formData['aspirate_mix_times']), // TODO handle unparseable
    }
    : null

  const mixBeforeAspirate = getMixData(
    formData,
    'aspirate_mix_checkbox',
    'aspirate_mix_volume',
    'aspirate_mix_times'
  )

  const mixInDestination = getMixData(
    formData,
    'dispense_mix_checkbox',
    'dispense_mix_volume',
    'dispense_mix_times'
  )

  const changeTip = formData['aspirate_changeTip'] || DEFAULT_CHANGE_TIP_OPTION

  const commonFields = {
    pipette,
    volume,

    sourceLabware,
    destLabware,

    aspirateOffsetFromBottomMm,
    dispenseOffsetFromBottomMm,

    blowout, // TODO allow user to blowout
    changeTip,
    delayAfterDispense,
    mixInDestination,
    preWetTip: formData['aspirate_preWetTip'] || false,
    touchTipAfterAspirate: formData['aspirate_touchTip'] || false,
    touchTipAfterDispense: formData['dispense_touchTip'] || false,
    description: 'description would be here 2018-03-01', // TODO get from form
  }

  let {
    aspirate_wells: sourceWells,
    dispense_wells: destWells,
    aspirate_wellOrder_first,
    aspirate_wellOrder_second,
    dispense_wellOrder_first,
    dispense_wellOrder_second,
  } = formData
  sourceWells = sourceWells || []
  destWells = destWells || []

  if (context && context.labware) {
    const labwareById = context.labware
    if (stepType !== 'distribute' && sourceLabware) {
      const sourceLabwareDef = labwareById[sourceLabware] && getLabware(labwareById[sourceLabware].type)
      if (sourceLabwareDef) {
        const allWellsOrdered = orderWells(sourceLabwareDef.ordering, aspirate_wellOrder_first, aspirate_wellOrder_second)
        sourceWells = intersection(allWellsOrdered, sourceWells)
      } else {
        console.warn('the specified source labware definition could not be located')
      }
    }
    if (stepType !== 'consolidate' && destLabware) {
      const destLabwareDef = labwareById[destLabware] && getLabware(labwareById[destLabware].type)
      if (destLabwareDef) {
        const allWellsOrdered = orderWells(destLabwareDef.ordering, dispense_wellOrder_first, dispense_wellOrder_second)
        destWells = intersection(allWellsOrdered, destWells)
      } else {
        console.warn('the specified destination labware definition could not be located')
      }
    }
  }

  let disposalVolume = null
  let disposalDestination = null
  let disposalLabware = null
  let disposalWell = null
  if (formData['aspirate_disposalVol_checkbox']) { // TODO: BC 09-17-2018 handle unparseable values?
    disposalVolume = Number(formData['aspirate_disposalVol_volume'])
    disposalDestination = formData['aspirate_disposalVol_destination']
    if (disposalDestination === SOURCE_WELL_DISPOSAL_DESTINATION) {
      disposalLabware = sourceLabware
      disposalWell = sourceWells[0]
    } else {
      // NOTE: if disposalDestination is not source well it is a labware type (e.g. fixed-trash)
      disposalLabware = disposalDestination
      disposalWell = 'A1'
    }
  }

  // TODO: BC 2018-08-21 remove this old validation logic once no longer preventing save
  const requiredFieldErrors = [
    'pipette',
    'aspirate_labware',
    'dispense_labware',
  ].reduce((acc, fieldName) => (!formData[fieldName])
    ? {...acc, [fieldName]: 'This field is required'}
    : acc,
  {})
  let errors = {...requiredFieldErrors}
  if (isNaN(volume) || !(volume > 0)) {
    // $FlowFixMe: Cannot assign `'Volume mus...'` to `errors['volume']` because property `volume` is missing in object literal
    errors = {...errors, 'volume': 'Volume must be a positive number'}
  }
  if (stepType === 'transfer' && (sourceWells.length !== destWells.length || sourceWells.length === 0)) {
    // $FlowFixMe: Cannot assign `'Numbers of...'` to `errors._mismatchedWells` because property `_mismatchedWells` is missing in object literal
    errors = {...errors, '_mismatchedWells': 'Numbers of wells must match'}
  }
  if (stepType === 'consolidate' && (sourceWells.length <= 1 || destWells.length !== 1)) {
    // $FlowFixMe: Cannot assign `'Multiple s...'` to `errors._mismatchedWells` because property `_mismatchedWells` is missing in object literal
    errors = {...errors, '_mismatchedWells': 'Multiple source wells and exactly one destination well is required.'}
  }
  if (stepType === 'distribute' && (sourceWells.length !== 1 || destWells.length <= 1)) {
    // $FlowFixMe: Cannot assign `'Single sou...'` to `errors._mismatchedWells` because property `_mismatchedWells` is missing in object literal
    errors = {...errors, '_mismatchedWells': 'Single source well and multiple destination wells is required.'}
  }

  let stepArguments: TransferLikeValidationAndErrors = {errors, validatedForm: null}
  switch (stepType) {
    case 'transfer': {
      const transferStepArguments: ValidationAndErrors<TransferFormData> = {
        errors,
        validatedForm: Object.values(errors).length === 0 ? {
          ...commonFields,
          disposalVolume,
          stepType: 'transfer',
          sourceWells,
          destWells,
          mixBeforeAspirate,
          name: `Transfer ${formData.id}`, // TODO Ian 2018-04-03 real name for steps
        } : null,
      }
      stepArguments = transferStepArguments
      break
    }
    case 'consolidate': {
      const consolidateStepArguments: ValidationAndErrors<ConsolidateFormData> = {
        errors,
        validatedForm: Object.values(errors).length === 0 ? {
          ...commonFields,
          disposalVolume,
          mixFirstAspirate,
          sourceWells,
          destWell: destWells[0],
          stepType: 'consolidate',
          name: `Consolidate ${formData.id}`, // TODO Ian 2018-04-03 real name for steps
        } : null,
      }
      stepArguments = consolidateStepArguments
      break
    }
    case 'distribute': {
      const distributeStepArguments: ValidationAndErrors<DistributeFormData> = {
        errors,
        validatedForm: Object.values(errors).length === 0 ? {
          ...commonFields,
          disposalVolume,
          disposalLabware,
          disposalWell,
          mixBeforeAspirate,
          sourceWell: sourceWells[0],
          destWells,
          stepType: 'distribute',
          name: `Distribute ${formData.id}`, // TODO Ian 2018-04-03 real name for steps
        } : null,
      }
      stepArguments = distributeStepArguments
      break
    }
  }
  return stepArguments
}

export default transferLikeFormToArgs
