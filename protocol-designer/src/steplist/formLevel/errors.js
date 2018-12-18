// @flow
import * as React from 'react'
import {canPipetteUseLabware} from '@opentrons/shared-data'
import type {StepFieldName} from '../../form-types'

/*******************
** Error Messages **
********************/
export type FormErrorKey =
  | 'INCOMPATIBLE_ASPIRATE_LABWARE'
  | 'INCOMPATIBLE_DISPENSE_LABWARE'
  | 'INCOMPATIBLE_LABWARE'
  | 'WELL_RATIO_TRANSFER'
  | 'WELL_RATIO_CONSOLIDATE'
  | 'WELL_RATIO_DISTRIBUTE'
  | 'PAUSE_TYPE_REQUIRED'
  | 'TIME_PARAM_REQUIRED'

export type FormError = {
  title: string,
  body?: React.Node,
  dependentFields: Array<StepFieldName>,
}

const FORM_ERRORS: {[FormErrorKey]: FormError} = {
  INCOMPATIBLE_ASPIRATE_LABWARE: {
    title: 'Selected aspirate labware may be incompatible with selected pipette',
    dependentFields: ['aspirate_labware', 'pipette'],
  },
  INCOMPATIBLE_DISPENSE_LABWARE: {
    title: 'Selected dispense labware may be incompatible with selected pipette',
    dependentFields: ['dispense_labware', 'pipette'],
  },
  INCOMPATIBLE_LABWARE: {
    title: 'Selected labware may be incompatible with selected pipette',
    dependentFields: ['labware', 'pipette'],
  },
  PAUSE_TYPE_REQUIRED: {
    title: 'Must either pause for amount of time, or until told to resume',
    dependentFields: ['pauseForAmountOfTime'],
  },
  TIME_PARAM_REQUIRED: {
    title: 'Must include hours, minutes, or seconds',
    dependentFields: ['pauseForAmountOfTime'],
  },
  WELL_RATIO_TRANSFER: {
    title: 'In transfer actions the number of source and destination wells must match',
    body: 'You may want to use a Distribute or Consolidate instead of Transfer',
    dependentFields: ['aspirate_wells', 'dispense_wells'],
  },
  WELL_RATIO_CONSOLIDATE: {
    title: 'In consolidate actions there must be multiple source wells and one destination well',
    dependentFields: ['aspirate_wells', 'dispense_wells'],
  },
  WELL_RATIO_DISTRIBUTE: {
    title: 'In distribute actions there must be one source well and multiple destination wells',
    dependentFields: ['aspirate_wells', 'dispense_wells'],
  },
}
export type FormErrorChecker = (mixed) => ?FormError

// TODO: test these
/*******************
** Error Checkers **
********************/

// TODO: real HydratedFormData type
type HydratedFormData = any

// TODO: Ian 2018-12-17 remove pipette.model, always use pipette.name
export const incompatibleLabware = (fields: HydratedFormData): ?FormError => {
  const {labware, pipette} = fields
  if (!labware || !pipette) return null
  return (!canPipetteUseLabware(pipette.model || pipette.name, labware.type)) ? FORM_ERRORS.INCOMPATIBLE_LABWARE : null
}

export const incompatibleDispenseLabware = (fields: HydratedFormData): ?FormError => {
  const {dispense_labware, pipette} = fields
  if (!dispense_labware || !pipette) return null
  return (!canPipetteUseLabware(pipette.model || pipette.name, dispense_labware.type)) ? FORM_ERRORS.INCOMPATIBLE_DISPENSE_LABWARE : null
}

export const incompatibleAspirateLabware = (fields: HydratedFormData): ?FormError => {
  const {aspirate_labware, pipette} = fields
  if (!aspirate_labware || !pipette) return null
  return (!canPipetteUseLabware(pipette.model || pipette.name, aspirate_labware.type)) ? FORM_ERRORS.INCOMPATIBLE_ASPIRATE_LABWARE : null
}

export const pauseForTimeOrUntilTold = (fields: HydratedFormData): ?FormError => {
  const {pauseForAmountOfTime, pauseHour, pauseMinute, pauseSecond} = fields
  if (pauseForAmountOfTime === 'true') {
    // user selected pause for amount of time
    const hours = parseFloat(pauseHour) || 0
    const minutes = parseFloat(pauseMinute) || 0
    const seconds = parseFloat(pauseSecond) || 0
    const totalSeconds = hours * 3600 + minutes * 60 + seconds
    return totalSeconds <= 0 ? FORM_ERRORS.TIME_PARAM_REQUIRED : null
  } else if (pauseForAmountOfTime === 'false') {
    // user selected pause until resume
    return null
  } else {
    // user selected neither pause until resume nor pause for amount of time
    return FORM_ERRORS.PAUSE_TYPE_REQUIRED
  }
}

export const wellRatioTransfer = (fields: HydratedFormData): ?FormError => {
  const {aspirate_wells, dispense_wells} = fields
  if (!aspirate_wells || !dispense_wells) return null
  return aspirate_wells.length !== dispense_wells.length ? FORM_ERRORS.WELL_RATIO_TRANSFER : null
}

export const wellRatioDistribute = (fields: HydratedFormData): ?FormError => {
  const {aspirate_wells, dispense_wells} = fields
  if (!aspirate_wells || !dispense_wells) return null
  return aspirate_wells.length !== 1 || dispense_wells.length <= 1 ? FORM_ERRORS.WELL_RATIO_DISTRIBUTE : null
}

export const wellRatioConsolidate = (fields: HydratedFormData): ?FormError => {
  const {aspirate_wells, dispense_wells} = fields
  if (!aspirate_wells || !dispense_wells) return null
  return aspirate_wells.length <= 1 || dispense_wells.length !== 1 ? FORM_ERRORS.WELL_RATIO_CONSOLIDATE : null
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
