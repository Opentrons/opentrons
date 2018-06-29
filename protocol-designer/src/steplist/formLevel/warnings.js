// @flow
import {getWellTotalVolume} from '@opentrons/shared-data'
import type {StepFieldName} from '../fieldLevel'

/*******************
** Warning Messages **
********************/

export type FormWarningKey = 'OVER_MAX_WELL_VOLUME'
export type FormWarning = {message: string, dependentFields: Array<StepFieldName>}
const FORM_WARNINGS: {[FormWarningKey]: FormWarning} = {
  OVER_MAX_WELL_VOLUME: {
    message: 'Dispense volume will overflow a destination well',
    dependentFields: ['dispense_labware', 'dispense_wells', 'volume']
  }
}
export type WarningChecker = (mixed) => ?FormWarning

// TODO: test these
/*******************
** Warning Checkers **
********************/
//TODO: real HydratedFormData type
type HydratedFormData = any

export const maxDispenseWellVolume = (fields: HydratedFormData): ?FormWarning => {
  const {dispense_labware, dispense_wells, volume} = fields
  if (!dispense_labware || !dispense_wells) return null
  const hasExceeded = dispense_wells.some(well => {
    const maximum = getWellTotalVolume(dispense_labware.type, well)
    return maximum && (volume > maximum)
  })
  return hasExceeded ? FORM_WARNINGS.OVER_MAX_WELL_VOLUME : null
}

/*******************
**     Helpers    **
********************/

export const composeWarnings = (...warningCheckers: Array<WarningChecker>) => (formData: mixed): Array<FormWarning> => (
  warningCheckers.reduce((acc, checker) => {
    const possibleWarning = checker(formData)
    return possibleWarning ? [...acc, possibleWarning] : acc
  }, [])
)
