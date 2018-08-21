// @flow

import type { FormData } from '../form-types'
import type {
  ConsolidateFormData,
  DistributeFormData,
  TransferFormData
} from '../step-generation'
import { DEFAULT_CHANGE_TIP_OPTION } from '../constants'

type ValidationAndErrors<F> = {
  errors: {[string]: string},
  validatedForm: F | null
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

const transferLikeFormToArgs = (formData: FormData): TransferLikeValidationAndErrors => {
  const stepType = formData.stepType
  const pipette = formData['pipette']
  const volume = Number(formData['volume'])
  const sourceLabware = formData['aspirate_labware']
  const destLabware = formData['dispense_labware']
  const blowout = formData['dispense_blowout_labware']

  const delayAfterDispense = formData['dispense_delay_checkbox']
    ? ((Number(formData['dispense_delayMinutes']) || 0) * 60) +
      (Number(formData['dispense_delaySeconds'] || 0))
    : null

  const mixFirstAspirate = formData['aspirate_mix_checkbox']
    ? {
      volume: Number(formData['aspirate_mix_volume']),
      times: parseInt(formData['aspirate_mix_times']) // TODO handle unparseable
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

  const disposalVolume = formData['aspirate_disposalVol_checkbox']
    ? Number('aspirate_disposal-vol_volume') // TODO handle unparseable
    : null

  const changeTip = formData['aspirate_changeTip'] || DEFAULT_CHANGE_TIP_OPTION

  const commonFields = {
    pipette,
    volume,

    sourceLabware,
    destLabware,

    blowout, // TODO allow user to blowout
    changeTip,
    delayAfterDispense,
    disposalVolume,
    mixInDestination,
    preWetTip: formData['aspirate_preWetTip'] || false,
    touchTipAfterAspirate: formData['aspirate_touchTip'] || false,
    touchTipAfterDispense: formData['dispense_touchTip'] || false,
    description: 'description would be here 2018-03-01' // TODO get from form
  }

  const sourceWells = formData['aspirate_wells'] || []
  const destWells = formData['dispense_wells'] || []

  // TODO: BC 2018-08-21 remove this old validation logic once no longer preventing save
  const requiredFieldErrors = [
    'pipette',
    'aspirate_labware',
    'dispense_labware'
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

  let stepArguments = commonFields
  switch (stepType) {
    case 'transfer':
      stepArguments = {
        ...stepArguments,
        stepType: 'transfer',
        sourceWells,
        destWells,
        mixBeforeAspirate,
        name: `Transfer ${formData.id}` // TODO Ian 2018-04-03 real name for steps
      }
      break
    case 'consolidate':
      stepArguments = {
        ...stepArguments,
        mixFirstAspirate,
        sourceWells,
        destWell: destWells[0],
        stepType: 'consolidate',
        name: `Consolidate ${formData.id}` // TODO Ian 2018-04-03 real name for steps
      }
      break
    case 'distribute':
      stepArguments = {
        ...stepArguments,
        mixBeforeAspirate,
        sourceWell: sourceWells[0],
        destWells,
        stepType: 'distribute',
        name: `Distribute ${formData.id}` // TODO Ian 2018-04-03 real name for steps
      }
      break
  }

  return {errors, stepArguments: Object.values(errors).length > 0 ? null : stepArguments}
}

export default transferLikeFormToArgs
