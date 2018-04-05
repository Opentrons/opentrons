// @flow
import {humanize} from '../utils'
import type {
  StepType,
  StepIdType,
  FormData,
  ProcessedFormData,
  TransferForm,
  ConsolidateForm,
  TransferFormData
} from './types'

import type {ConsolidateFormData} from '../step-generation'

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

export const generateNewForm = (stepId: StepIdType, stepType: StepType) => {
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

function _vapTransfer (formData: TransferForm): ValidationAndErrors<TransferFormData> {
  // TODO when transfer is supported in step-generation,
  // combine this with consolidate since args are similar
  // and clean up the parsing errors
  const pipette = formData['aspirate--pipette']
  const sourceWells = formData['aspirate--wells'] ? formData['aspirate--wells'].split(',') : []
  const destWells = formData['dispense--wells'] ? formData['dispense--wells'].split(',') : []
  const sourceLabware = formData['aspirate--labware']
  const destLabware = formData['dispense--labware']

  // TODO Ian 2018-04-02 several of these fields are the same btw transfer & consolidate, factor 'em out

  const blowout = formData['dispense--blowout--labware']

  const delayAfterDispense = formData['dispense--delay--checkbox']
    ? ((parseFloat(formData['dispense--delay-minutes']) || 0) * 60) +
      (parseFloat(formData['dispense--delay-seconds'] || 0))
    : null

  const changeTip = formData['aspirate--change-tip'] || 'always'
  // It's radiobutton, so one should always be selected.
  // TODO use default from importable const DEFAULT_CHANGE_TIP_OPTION

  const volume = parseFloat(formData['dispense--volume'])

  const disposalVolume = formData['aspirate--disposal-vol--checkbox']
    ? (parseFloat(formData['aspirate--disposal-vol--volume']) || null)
    : null

  const requiredFieldErrors = [
    'aspirate--pipette',
    'aspirate--labware',
    'dispense--labware'
  ].reduce((acc: {}, fieldName: string) => (!formData[fieldName])
    ? {...acc, [fieldName]: 'This field is required'}
    : acc,
  {})

  // Conditionally add error fields
  let errors = {...requiredFieldErrors}

  if (!(volume > 0)) {
    const field = formData.stepType === 'transfer' ? 'dispense--volume' : 'aspirate--volume'
    errors[field] = 'Volume must be a positive number'
  }

  if (formData.stepType === 'transfer') {
    if (sourceWells.length !== destWells.length || sourceWells.length === 0) {
      errors._mismatchedWells = 'Numbers of wells must match'
    }
  }

  return {
    errors,
    validatedForm: (
      !formHasErrors({errors}) &&
      // extra explicit for flow
      pipette &&
      sourceLabware &&
      destLabware
    )
      ? {
        stepType: formData.stepType,
        pipette,
        sourceWells,
        destWells,
        sourceLabware,
        destLabware,
        volume,
        changeTip,
        blowout,
        delayAfterDispense,

        mixBeforeAspirate: getMixData(
          formData,
          'aspirate--mix--checkbox',
          'aspirate--mix--volume',
          'aspirate--mix--times'
        ),

        mixInDestination: getMixData(
          formData,
          'dispense--mix--checkbox',
          'dispense--mix--volume',
          'dispense--mix--times'
        ),

        disposalVolume,
        preWetTip: !!(formData['aspirate--pre-wet-tip']),
        touchTipAfterAspirate: !!(formData['aspirate--touch-tip']),
        touchTipAfterDispense: false, // TODO Ian 2018-04-03 field not in form

        description: 'description would be here TODO', // TODO Ian 2018-03-01 get from form
        name: `Transfer ${formData.id}` // TODO Ian 2018-04-03 real name for steps
      }
      : null
  }
}

function _vapConsolidate (formData: ConsolidateForm): ValidationAndErrors<ConsolidateFormData> {
  const pipette = formData['aspirate--pipette']
  const sourceWells = formData['aspirate--wells'] ? formData['aspirate--wells'].split(',') : []
  const destWells = formData['dispense--wells'] ? formData['dispense--wells'].split(',') : []
  const sourceLabware = formData['aspirate--labware']
  const destLabware = formData['dispense--labware']

  const volume = parseFloat(formData['aspirate--volume'])

  const requiredFieldErrors = [
    'aspirate--pipette',
    'aspirate--labware',
    'dispense--labware'
  ].reduce((acc, fieldName) => (!formData[fieldName])
    ? {...acc, [fieldName]: 'This field is required'}
    : acc,
  {})

  // Conditionally add error fields
  let errors = {...requiredFieldErrors}

  if (!(volume > 0)) {
    errors['aspirate--volume'] = 'Volume must be a positive number'
  }

  if (sourceWells.length <= 1 || destWells.length !== 1) {
    errors._mismatchedWells = 'Multiple sources well and exactly one destination well is required.'
  }

  const blowout = formData['dispense--blowout--labware']

  const delayAfterDispense = formData['dispense--delay--checkbox']
    ? ((parseFloat(formData['dispense--delay-minutes']) || 0) * 60) +
      (parseFloat(formData['dispense--delay-seconds'] || 0))
    : null

  // const disposalVolume =

  const mixFirstAspirate = formData['aspirate--mix--checkbox']
    ? {
      volume: parseFloat(formData['aspirate--mix--volume']),
      times: parseInt(formData['aspirate--mix--time']) // TODO handle unparseable
    }
    : null

  // TODO general mix args creator
  const mixInDestination = formData['dispense--mix--checkbox']
    ? {
      volume: parseFloat(formData['dispense--mix--volume']),
      times: parseInt(formData['dispense--mix--times'])
    }
    : null

  const disposalVolume = formData['aspirate--disposal-vol--checkbox']
    ? parseFloat('aspirate--disposal-vol--volume') // TODO handle unparseable
    : null

  const changeTip = formData['aspirate--change-tip'] || 'always'
  // It's radiobutton, so one should always be selected.
  // TODO use default from importable const DEFAULT_CHANGE_TIP_OPTION

  return {
    errors,
    validatedForm: (
      !formHasErrors({errors}) &&
      // extra explicit for flow
      pipette &&
      sourceLabware &&
      destLabware
    )
      ? {
        stepType: formData.stepType,
        pipette,
        sourceWells,
        destWell: destWells[0],
        sourceLabware,
        destLabware,
        volume,
        blowout, // TODO allow user to blowout
        changeTip,
        delayAfterDispense,
        description: 'description would be here 2018-03-01', // TODO get from form
        mixFirstAspirate,
        disposalVolume,
        mixInDestination,
        preWetTip: formData['aspirate--pre-wet-tip'] || false,
        touchTipAfterAspirate: formData['aspirate--touch-tip'] || false,
        touchTipAfterDispense: false, // TODO Ian 2018-03-01 Not in form
        name: `Consolidate ${formData.id}` // TODO real name for steps
      }
      : null
  }
}

export function validateAndProcessForm (formData: FormData): * { // ValidFormAndErrors
  if (formData.stepType === 'transfer') {
    return _vapTransfer(formData)
  }

  if (formData.stepType === 'consolidate') {
    return _vapConsolidate(formData)
  }

  if (formData.stepType === 'pause') {
    const hours = parseFloat(formData['pause-hour']) || 0
    const minutes = parseFloat(formData['pause-minute']) || 0
    const seconds = parseFloat(formData['pause-second']) || 0
    const totalSeconds = hours * 360 + minutes * 60 + seconds

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
          waitForUserInput: formData['pause-for-amount-of-time'] === 'false',
          totalSeconds,
          hours,
          minutes,
          seconds,
          message
        }
    }
  }

  // Fallback for unsupported step type. Should be unreachable (...right?)
  return {
    errors: {
      '_form': 'Unsupported step type: ' + formData.stepType
    },
    validatedForm: null
  }
}
