// @flow
import type {Command, StepType, FormData, ValidatedForm} from './types' /* StepSubItemData, StepIdType */
import flatMap from 'lodash/flatMap'
import mapValues from 'lodash/mapValues'
import zip from 'lodash/zip'

type FormError = {
  name: string,
  message: string
}

export function validateAndProcessForm (stepType: StepType, formData: FormData):
  {errors: Array<FormError>, validatedForm: ValidatedForm} {
  // This makes sure required fields are present, and parses strings to numbers where needed.
  // It doesn't do any logic combining the fields.
  let errors = []

  function mustExist<A> (value: A, name: string): A {
    if (!value) {
      errors.push({name, message: 'is required'})
    }
    return value
  }

  function toNumber (value: string, name: string): number {
    const num = parseFloat(value)
    if (isNaN(num)) {
      errors.push({name, message: 'must be a number'})
    }
    return num
  }

  if (stepType !== 'transfer') {
    throw new Error('validateAndProcessForm only supports transfer now')
  }

  function splitWells (value: string, name: string): Array<string> {
    mustExist(value, name)
    return value ? value.split(',') : [value]
  }

  const sourceWells = splitWells(formData['aspirate--wells'], 'sourceWells')
  const destWells = splitWells(formData['dispense--wells'], 'destWells')

  // TODO: deal with all the other numerical or toggle-able fields.
  const mustExistFields = mapValues({
    pipette: formData['aspirate--pipette'],
    sourceLabware: formData['aspirate--labware'],
    destLabware: formData['dispense--labware']
  }, mustExist)

  const numberFields = mapValues({
    volume: formData['dispense--volume']
  }, toNumber)

  return {
    errors,
    validatedData: {
      sourceWells,
      destWells,
      ...mustExistFields,
      ...numberFields
    }
  }
}

export function generateCommands (stepType: StepType, data: ValidatedForm): Array<Command> {
  if (stepType === 'transfer') {
    // TODO: this should be done in validation/preprocessing step
    const {sourceWells, destWells, volume, pipette, sourceLabware, destLabware} = data

    if (sourceWells.length !== destWells.length) {
      throw new Error('generateSubsteps expected matching N:N source:dest wells for transfer')
    }

    // TODO strings should already be numbers, validation should already happen
    // TODO handle touch tip
    return flatMap(zip(sourceWells, destWells), ([sourceWell, destWell]) => [
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
  console.warn('generateCommands only supports transfer, got: ' + stepType)
  return [] // TODO
}

// export function generateSubsteps (): Array<StepSubItemData> {
//   // TODO: create substeps from formData. It doesn't show all the aspirate/dispenses because it ignores mix, etc.
//   return {}
// }
