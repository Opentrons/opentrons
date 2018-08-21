// @flow
import startCase from 'lodash/startCase'

import type {
  StepType,
  StepIdType,
  FormData,
  BlankForm
} from '../form-types'

import type {
  ConsolidateFormData,
  DistributeFormData,
  MixFormData,
  PauseFormData,
  TransferFormData,
  CommandCreatorData
} from '../step-generation'

import {
  DEFAULT_CHANGE_TIP_OPTION,
  DEFAULT_WELL_ORDER_FIRST_OPTION,
  DEFAULT_WELL_ORDER_SECOND_OPTION,
  FIXED_TRASH_ID
} from '../constants'

// TODO LATER Ian 2018-03-01 remove or consolidate these 2 similar types?
export type ValidFormAndErrors = {
  errors: {[string]: string},
  validatedForm: CommandCreatorData | null // TODO: incompleteData field when this is null?
}

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

// TODO: type pipette
export const generateNewForm = (stepId: StepIdType, stepType: StepType): BlankForm => {
  // Add default values to a new step form
  const baseForm = {
    id: stepId,
    stepType: stepType,
    'step-name': startCase(stepType),
    'step-details': ''
  }

  if (stepType === 'transfer') {
    return {
      ...baseForm,
      'aspirate_changeTip': DEFAULT_CHANGE_TIP_OPTION,
      'aspirate_wellOrder_first': DEFAULT_WELL_ORDER_FIRST_OPTION,
      'aspirate_wellOrder_second': DEFAULT_WELL_ORDER_SECOND_OPTION,
      'dispense_wellOrder_first': DEFAULT_WELL_ORDER_FIRST_OPTION,
      'dispense_wellOrder_second': DEFAULT_WELL_ORDER_SECOND_OPTION
    }
  }

  if (stepType === 'consolidate' || stepType === 'mix') {
    return {
      ...baseForm,
      'aspirate_changeTip': DEFAULT_CHANGE_TIP_OPTION,
      'aspirate_wellOrder_first': DEFAULT_WELL_ORDER_FIRST_OPTION,
      'aspirate_wellOrder_second': DEFAULT_WELL_ORDER_SECOND_OPTION
    }
  }

  if (stepType === 'distribute') {
    return {
      ...baseForm,
      'aspirate_changeTip': DEFAULT_CHANGE_TIP_OPTION,
      'aspirate_disposalVol_checkbox': true,
      'dispense_wellOrder_first': DEFAULT_WELL_ORDER_FIRST_OPTION,
      'dispense_wellOrder_second': DEFAULT_WELL_ORDER_SECOND_OPTION,
      'dispense_blowout_checkbox': true,
      'dispense_blowout_labware': FIXED_TRASH_ID
    }
  }

  if (stepType !== 'pause') {
    console.warn('generateNewForm: Only transfer, consolidate, & pause forms are supported now. TODO. Got ' + stepType)
  }
  return baseForm
}

export function formHasErrors (form: {errors: {[string]: string}}): boolean {
  return Object.values(form.errors).length > 0
}

type TransferLikeValidationAndErrors =
  | ValidationAndErrors<ConsolidateFormData>
  | ValidationAndErrors<DistributeFormData>
  | ValidationAndErrors<TransferFormData>

function _vapTransferLike (
  formData: FormData
): TransferLikeValidationAndErrors {
  const stepType = formData.stepType
  const pipette = formData['pipette']
  const volume = Number(formData['volume'])
  const sourceLabware = formData['aspirate_labware']
  const destLabware = formData['dispense_labware']

  const requiredFieldErrors = [
    'pipette',
    'aspirate_labware',
    'dispense_labware'
  ].reduce((acc, fieldName) => (!formData[fieldName])
    ? {...acc, [fieldName]: 'This field is required'}
    : acc,
  {})

  // Conditionally add error fields
  let errors = {...requiredFieldErrors}

  if (isNaN(volume) || !(volume > 0)) {
    // $FlowFixMe: Cannot assign `'Volume mus...'` to `errors['volume']` because property `volume` is missing in object literal
    errors['volume'] = 'Volume must be a positive number'
  }

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

  if (!formHasErrors({errors})) {
    const sourceWells = formData['aspirate_wells'] || []
    const destWells = formData['dispense_wells'] || []

    if (stepType === 'transfer') {
      if (sourceWells.length !== destWells.length || sourceWells.length === 0) {
        // $FlowFixMe: Cannot assign `'Numbers of...'` to `errors._mismatchedWells` because property `_mismatchedWells` is missing in object literal
        errors._mismatchedWells = 'Numbers of wells must match'
      }

      const validatedForm: TransferFormData = {
        ...commonFields,
        stepType: 'transfer',
        sourceWells,
        destWells,
        mixBeforeAspirate,
        name: `Transfer ${formData.id}` // TODO Ian 2018-04-03 real name for steps
      }

      return {errors, validatedForm}
    }

    if (stepType === 'consolidate') {
      if (sourceWells.length <= 1 || destWells.length !== 1) {
        // $FlowFixMe: Cannot assign `'Multiple s...'` to `errors._mismatchedWells` because property `_mismatchedWells` is missing in object literal
        errors._mismatchedWells = 'Multiple source wells and exactly one destination well is required.'
      }

      const validatedForm: ConsolidateFormData = {
        ...commonFields,
        mixFirstAspirate,
        sourceWells,
        destWell: destWells[0],
        stepType: 'consolidate',
        name: `Consolidate ${formData.id}` // TODO Ian 2018-04-03 real name for steps
      }

      return {errors, validatedForm}
    }

    if (stepType === 'distribute') {
      if (sourceWells.length !== 1 || destWells.length <= 1) {
        // $FlowFixMe: Cannot assign `'Single sou...'` to `errors._mismatchedWells` because property `_mismatchedWells` is missing in object literal
        errors._mismatchedWells = 'Single source well and multiple destination wells is required.'
      }

      const validatedForm: DistributeFormData = {
        ...commonFields,
        mixBeforeAspirate,
        sourceWell: sourceWells[0],
        destWells,
        stepType: 'distribute',
        name: `Distribute ${formData.id}` // TODO Ian 2018-04-03 real name for steps
      }

      return {errors, validatedForm}
    }
  }

  return {
    errors,
    validatedForm: null
  }
}

function _vapPause (formData: FormData): ValidationAndErrors<PauseFormData> {
  const hours = parseFloat(formData['pauseHour']) || 0
  const minutes = parseFloat(formData['pauseMinute']) || 0
  const seconds = parseFloat(formData['pauseSecond']) || 0
  const totalSeconds = hours * 3600 + minutes * 60 + seconds

  const message = formData['pauseMessage'] || ''

  const errors = {
    ...(!formData['pauseForAmountOfTime']
      ? {'pauseForAmountOfTime': 'Pause for amount of time vs pause until user input is required'}
      : {}
    ),
    ...(formData['pauseForAmountOfTime'] === 'true' && (totalSeconds <= 0)
      ? {'_pause-times': 'Must include hours, minutes, or seconds'}
      : {}
    )
  }

  return {
    errors,
    validatedForm: formHasErrors({errors})
      ? null
      : {
        stepType: 'pause',
        name: `Pause ${formData.id}`, // TODO real name for steps
        description: 'description would be here 2018-03-01', // TODO get from form
        wait: (formData['pauseForAmountOfTime'] === 'false')
          ? true
          : totalSeconds,
        message,
        meta: {
          hours,
          minutes,
          seconds
        }
      }
  }
}

function _vapMix (formData: FormData): ValidationAndErrors<MixFormData> {
  const requiredFields = ['pipette', 'labware', 'volume', 'times']

  let errors = {}

  requiredFields.forEach(field => {
    if (formData[field] == null) {
      errors[field] = 'This field is required'
    }
  })

  const {labware, pipette} = formData
  const touchTip = !!formData['touchTip']

  const wells = formData.wells || []
  const volume = Number(formData.volume) || 0
  const times = Number(formData.times) || 0

  // It's radiobutton, so one should always be selected.
  const changeTip = formData['aspirate_changeTip'] || DEFAULT_CHANGE_TIP_OPTION

  const blowout = formData['dispense_blowout_labware']

  const delay = formData['dispense_delay_checkbox']
    ? ((Number(formData['dispense_delayMinutes']) || 0) * 60) +
      (Number(formData['dispense_delaySeconds'] || 0))
    : null
  // TODO Ian 2018-05-08 delay number parsing errors

  if (wells.length <= 0) {
    errors.wells = '1 or more wells is required'
  }

  if (volume <= 0) {
    errors.volume = 'Volume must be a number greater than 0'
  }

  if (times <= 0 || !Number.isInteger(times)) {
    errors.times = 'Number of repetitions must be an integer greater than 0'
  }

  return {
    errors,
    validatedForm: (!formHasErrors({errors}) && labware && pipette)
      ? {
        stepType: 'mix',
        name: `Mix ${formData.id}`, // TODO real name for steps
        description: 'description would be here 2018-03-01', // TODO get from form
        labware,
        wells,
        volume,
        times,
        touchTip,
        delay,
        changeTip,
        blowout,
        pipette
      }
      : null
  }
}

export const validateAndProcessForm = (formData: FormData): * => { // ValidFormAndErrors
  switch (formData.stepType) {
    case 'transfer':
    case 'consolidate':
    case 'distribute':
      return _vapTransferLike(formData)
    case 'pause':
      return _vapPause(formData)
    case 'mix':
      return _vapMix(formData)
    default:
      return {
        errors: {_form: `Unsupported step type: ${formData.stepType}`},
        validatedForm: null
      }
  }
}
