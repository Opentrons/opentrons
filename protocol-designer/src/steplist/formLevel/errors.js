// @flow

import {canPipetteUseLabware} from '@opentrons/shared-data'
import type {StepFieldName} from '../fieldLevel'

/*******************
** Error Messages **
********************/
export type FormErrorKey = 'INCOMPATIBLE_ASPIRATE_LABWARE'
  | 'INCOMPATIBLE_DISPENSE_LABWARE'
  | 'INCOMPATIBLE_LABWARE'
  | 'WELL_RATIO_TRANSFER'
  | 'WELL_RATIO_CONSOLIDATE'
  | 'WELL_RATIO_DISTRIBUTE'
export type FormError = {message: string, dependentFields: Array<StepFieldName>}
const FORM_ERRORS: {[FormErrorKey]: FormError} = {
  INCOMPATIBLE_ASPIRATE_LABWARE: {
    message: 'Selected aspirate labware may be incompatible with selected pipette',
    dependentFields: ['aspirate_labware', 'pipette']
  },
  INCOMPATIBLE_DISPENSE_LABWARE: {
    message: 'Selected dispense labware may be incompatible with selected pipette',
    dependentFields: ['dispense_labware', 'pipette']
  },
  INCOMPATIBLE_LABWARE: {
    message: 'Selected dispense labware may be incompatible with selected pipette',
    dependentFields: ['labware', 'pipette']
  },
  WELL_RATIO_TRANSFER: {
    message: 'In transfer actions the number of source and destination wells must match',
    dependentFields: []
  },
  WELL_RATIO_CONSOLIDATE: {
    message: 'In consolidate actions there must be multiple source wells and one destination well',
    dependentFields: []
  },
  WELL_RATIO_DISTRIBUTE: {
    message: 'In distribute actions there must be one source well and multiple destination wells',
    dependentFields: []
  }
}
export type FormErrorChecker = (mixed) => ?FormError

// TODO: test these
/*******************
** Error Checkers **
********************/

//TODO: real HydratedFormData type
type HydratedFormData = any

export const incompatibleLabware = (fields: HydratedFormData): ?FormError => {
  const {labware, pipette} = fields
  if (!labware || !pipette) return null
  return (!canPipetteUseLabware(pipette.model, labware.type)) ? FORM_ERRORS.INCOMPATIBLE_LABWARE : null
}

export const incompatibleDispenseLabware = (fields: HydratedFormData): ?FormError => {
  console.log('incompatible check: ', fields)
  const {dispense_labware, pipette} = fields
  if (!dispense_labware || !pipette) return null
  return (!canPipetteUseLabware(pipette.model, dispense_labware.type)) ? FORM_ERRORS.INCOMPATIBLE_DISPENSE_LABWARE : null
}

export const incompatibleAspirateLabware = (fields: HydratedFormData): ?FormError => {
  const {aspirate_labware, pipette} = fields
  if (!aspirate_labware || !pipette) return null
  return (!canPipetteUseLabware(pipette.model, aspirate_labware.type)) ? FORM_ERRORS.INCOMPATIBLE_ASPIRATE_LABWARE : null
}

/*******************
**     Helpers    **
********************/

export const composeErrors = (...errorCheckers: Array<FormErrorChecker>) => (value: mixed): Array<FormError> => (
  errorCheckers.reduce((acc, errorChecker) => {
    const possibleError = errorChecker(value)
    return possibleError ? [...acc, possibleError] : acc
  }, [])
)
