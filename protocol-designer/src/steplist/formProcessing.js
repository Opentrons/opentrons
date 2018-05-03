// @flow
import {humanize} from '../utils'
import type {
  StepType,
  StepIdType,
  FormData,
  BlankForm,
  ProcessedFormData,
  TransferLikeForm,
  PauseForm
} from '../form-types'

import type {ConsolidateFormData, PauseFormData, TransferFormData} from '../step-generation'

// TODO LATER Ian 2018-03-01 remove or consolidate these 2 similar types?
export type ValidFormAndErrors = {
  errors: {[string]: string},
  validatedForm: ProcessedFormData | null // TODO: incompleteData field when this is null?
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

export const generateNewForm = (stepId: StepIdType, stepType: StepType): BlankForm => {
  // Add default values to a new step form
  const baseForm = {
    id: stepId,
    stepType: stepType,
    'step-name': humanize(stepType) + ' ' + (stepId + 1),
    'step-details': ''
  }

  if (stepType === 'transfer' || stepType === 'consolidate') {
    return {
      ...baseForm,
      'aspirate--change-tip': 'once'
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

function _vapTransferLike (
  formData: TransferLikeForm
): ValidationAndErrors<ConsolidateFormData> | ValidationAndErrors<TransferFormData> {
  const stepType = formData.stepType
  const pipette = formData['pipette']
  const volume = Number(formData['volume'])
  const sourceLabware = formData['aspirate--labware']
  const destLabware = formData['dispense--labware']

  const requiredFieldErrors = [
    'pipette',
    'aspirate--labware',
    'dispense--labware'
  ].reduce((acc, fieldName) => (!formData[fieldName])
    ? {...acc, [fieldName]: 'This field is required'}
    : acc,
  {})

  // Conditionally add error fields
  let errors = {...requiredFieldErrors}

  if (isNaN(volume) || !(volume > 0)) {
    errors['volume'] = 'Volume must be a positive number'
  }

  const blowout = formData['dispense--blowout--labware']

  const delayAfterDispense = formData['dispense--delay--checkbox']
    ? ((Number(formData['dispense--delay-minutes']) || 0) * 60) +
      (Number(formData['dispense--delay-seconds'] || 0))
    : null

  const mixFirstAspirate = formData['aspirate--mix--checkbox']
    ? {
      volume: Number(formData['aspirate--mix--volume']),
      times: parseInt(formData['aspirate--mix--times']) // TODO handle unparseable
    }
    : null

  const mixBeforeAspirate = getMixData(
    formData,
    'aspirate--mix--checkbox',
    'aspirate--mix--volume',
    'aspirate--mix--times'
  )

  const mixInDestination = getMixData(
    formData,
    'dispense--mix--checkbox',
    'dispense--mix--volume',
    'dispense--mix--times'
  )

  const disposalVolume = formData['aspirate--disposal-vol--checkbox']
    ? Number('aspirate--disposal-vol--volume') // TODO handle unparseable
    : null

  const changeTip = formData['aspirate--change-tip'] || 'always'
  // It's radiobutton, so one should always be selected.
  // TODO use default from importable const DEFAULT_CHANGE_TIP_OPTION

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
    preWetTip: formData['aspirate--pre-wet-tip'] || false,
    touchTipAfterAspirate: formData['aspirate--touch-tip'] || false,
    touchTipAfterDispense: false, // TODO Ian 2018-03-01 Not in form
    description: 'description would be here 2018-03-01' // TODO get from form
  }

  if (!formHasErrors({errors})) {
    if (stepType === 'transfer') {
      const sourceWells = formData['aspirate--wells'] || []
      const destWells = formData['dispense--wells'] || []

      if (sourceWells.length !== destWells.length || sourceWells.length === 0) {
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
      const sourceWells = formData['aspirate--wells'] || []
      const destWells = formData['dispense--wells'] || []

      if (sourceWells.length <= 1 || destWells.length !== 1) {
        errors._mismatchedWells = 'Multiple sources well and exactly one destination well is required.'
      }

      const validatedForm: ConsolidateFormData = {
        ...commonFields,
        sourceWells,
        destWell: destWells[0],
        stepType: 'consolidate',
        mixFirstAspirate,
        name: `Consolidate ${formData.id}` // TODO Ian 2018-04-03 real name for steps
      }

      return {errors, validatedForm}
    }
  }

  return {
    errors,
    validatedForm: null
  }
}

function _vapPause (formData: PauseForm): ValidationAndErrors<PauseFormData> {
  const hours = parseFloat(formData['pause-hour']) || 0
  const minutes = parseFloat(formData['pause-minute']) || 0
  const seconds = parseFloat(formData['pause-second']) || 0
  const totalSeconds = hours * 3600 + minutes * 60 + seconds

  const message = formData['pause-message'] || ''

  const errors = {
    ...(!formData['pause-for-amount-of-time']
      ? {'pause-for-amount-of-time': 'Pause for amount of time vs pause until user input is required'}
      : {}
    ),
    ...(formData['pause-for-amount-of-time'] === 'true' && (totalSeconds <= 0)
      ? {'_pause-times': 'Must include hours, minutes, or seconds'}
      : {}
    )
  }

  return {
    errors,
    validatedForm: formHasErrors({errors})
      ? null
      : {
        stepType: formData.stepType,
        name: `Pause ${formData.id}`, // TODO real name for steps
        description: 'description would be here 2018-03-01', // TODO get from form
        // stepType: formData.stepType,
        wait: (formData['pause-for-amount-of-time'] === 'false')
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

export function validateAndProcessForm (formData: FormData): * { // ValidFormAndErrors
  if (formData.stepType === 'transfer' || formData.stepType === 'consolidate') {
    return _vapTransferLike(formData)
  }

  if (formData.stepType === 'pause') {
    return _vapPause(formData)
  }

  // Fallback for unsupported step type. Should be unreachable (...right?)
  return {
    errors: {
      '_form': 'Unsupported step type: ' + formData.stepType
    },
    validatedForm: null
  }
}
