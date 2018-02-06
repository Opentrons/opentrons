// @flow
import type {Command, StepType, StepIdType, FormData, ProcessedFormData} from './types' /* StepSubItemData, StepIdType */
import flatMap from 'lodash/flatMap'
import zip from 'lodash/zip'

// TODO rename and move to types?
export type ValidFormAndErrors = {
  errors: {[string]: string},
  validatedForm: ProcessedFormData | null // TODO: incompleteData field when this is null?
}

export const generateNewForm = (stepId: StepIdType, stepType: StepType) => {
  const baseForm = {
    id: stepId,
    stepType: stepType
  }

  if (stepType === 'transfer') {
  // TODO: other actions
    return {
      ...baseForm,
      'aspirate--change-tip': 'once'
      // TODO: rest of blank fields? Default values?
    }
  }
  if (stepType !== 'pause') {
    console.warn('generateNewForm: Only transfer & pause forms are supported now. TODO.')
  }
  return baseForm
}

export function formHasErrors (form: {errors: {[string]: string}}): boolean {
  return Object.values(form.errors).length > 0
}

export function validateAndProcessForm (formData: FormData): ValidFormAndErrors {
  if (formData.stepType === 'transfer') {
    const pipette = formData['aspirate--pipette']
    const sourceWells = formData['aspirate--wells'] ? formData['aspirate--wells'].split(',') : []
    const destWells = formData['dispense--wells'] ? formData['dispense--wells'].split(',') : []
    const sourceLabware = formData['aspirate--labware']
    const destLabware = formData['dispense--labware']
    const volume = parseFloat(formData['dispense--volume'])

    const requiredFieldErrors = [
      'aspirate--pipette',
      'aspirate--labware',
      'dispense--labware'
    ].reduce((acc, fieldName) =>
      (formData.stepType === 'transfer' && !formData[fieldName])
      // NOTE: explicit stepType check to help out flow ^
      ? {...acc, [fieldName]: 'This field is required'}
      : acc
    , {})

    const errors = {
      ...(isNaN(volume) || volume <= 0)
        ? {'dispense--volume': 'Volume must be a positive number'}
        : {},
      ...(sourceWells.length !== destWells.length || sourceWells.length === 0)
        ? {'_mismatchedWells': 'Numbers of wells must match'}
        : {},
      ...requiredFieldErrors
    }

    return {
      errors,
      validatedForm: (
        !formHasErrors({errors}) &&
        // extra explicit for flow
        (pipette === 'left' || pipette === 'right') &&
        sourceWells &&
        destWells &&
        sourceLabware &&
        destLabware &&
        volume
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
  console.warn('generateCommands only supports transfer, got: ' + data.stepType)
  return [] // TODO
}

// export function generateSubsteps (): Array<StepSubItemData> {
//   // TODO: create substeps from formData. It doesn't show all the aspirate/dispenses because it ignores mix, etc.
//   return {}
// }
