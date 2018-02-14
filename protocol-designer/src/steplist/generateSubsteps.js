// @flow
import type {Command, StepType, StepIdType, FormData, ProcessedFormData} from './types' /* StepSubItemData, StepIdType */
import {humanize} from '../utils'
import flatMap from 'lodash/flatMap'
import zip from 'lodash/zip'

// TODO rename and move to types?
export type ValidFormAndErrors = {
  errors: {[string]: string},
  validatedForm: ProcessedFormData | null // TODO: incompleteData field when this is null?
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
    console.warn('generateNewForm: Only transfer, consolidate, & pause forms are supported now. TODO.')
  }
  return baseForm
}

export function formHasErrors (form: {errors: {[string]: string}}): boolean {
  return Object.values(form.errors).length > 0
}

export function validateAndProcessForm (formData: FormData): ValidFormAndErrors {
  if (formData.stepType === 'transfer' || formData.stepType === 'consolidate') {
    const pipette = formData['aspirate--pipette']
    const sourceWells = formData['aspirate--wells'] ? formData['aspirate--wells'].split(',') : []
    const destWells = formData['dispense--wells'] ? formData['dispense--wells'].split(',') : []
    const sourceLabware = formData['aspirate--labware']
    const destLabware = formData['dispense--labware']

    const rawVolume = formData.stepType === 'transfer'
      ? formData['dispense--volume']
      : formData['aspirate--volume']
    const volume = parseFloat(rawVolume)

    const requiredFieldErrors = [
      'aspirate--pipette',
      'aspirate--labware',
      'dispense--labware'
    ].reduce((acc, fieldName) => {
      if (formData.stepType !== 'transfer' && formData.stepType !== 'consolidate') {
        return {}
      }
      return (!formData[fieldName])
      ? {...acc, [fieldName]: 'This field is required'}
      : acc
    }, {})

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

    if (formData.stepType === 'consolidate') {
      if (sourceWells.length !== 1 || destWells.length < 1) {
        errors._mismatchedWells = 'Exactly one source well and at least one destination well is required.'
      }
    }

    return {
      errors,
      validatedForm: (
        !formHasErrors({errors}) &&
        // extra explicit for flow
        (pipette === 'left' || pipette === 'right') &&
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
          volume
        }
        : null
    }
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
      validatedForm: (
        !formHasErrors({errors}) &&
        // extra explicit for flow
        totalSeconds &&
        hours &&
        minutes &&
        seconds
      )
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

export function generateCommands (data: ProcessedFormData): Array<Command> {
  if (data.stepType === 'transfer') {
    // TODO: this should be done in validation/preprocessing step
    const {sourceWells, destWells, volume, pipette, sourceLabware, destLabware} = data

    if (sourceWells.length !== destWells.length) {
      throw new Error('generateSubsteps expected matching N:N source:dest wells for transfer')
    }

    // TODO strings should already be numbers, validation should already happen
    // TODO handle touch tip
    return flatMap(zip(sourceWells, destWells), ([sourceWell, destWell]): Array<Command> => [
      {
        commandType: 'aspirate',
        volume, // TODO add dispense volume etc
        pipette,
        labware: sourceLabware,
        well: sourceWell
      },
      {
        commandType: 'dispense',
        volume,
        pipette,
        labware: destLabware,
        well: destWell
      }
    ])
  }
  // TODO IMMEDIATELY Ian 2018-02-14 why does this keep getting undefined stepType?
  console.warn('generateCommands only supports transfer, got: ' + data.stepType)
  return [] // TODO
}

// export function generateSubsteps (): Array<StepSubItemData> {
//   // TODO: create substeps from formData. It doesn't show all the aspirate/dispenses because it ignores mix, etc.
//   return {}
// }
