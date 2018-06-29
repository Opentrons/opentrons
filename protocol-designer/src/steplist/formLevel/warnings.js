// @flow
import {getWellTotalVolume} from '@opentrons/shared-data'

/*******************
** Warning Messages **
********************/

export type FormWarning = 'OVER_MAX_WELL_VOLUME'
const FORM_WARNINGS: {[FormWarning]: string} = {
  OVER_MAX_WELL_VOLUME: 'Dispense volume will overflow a destination well'
}
export type warningChecker = (mixed) => ?string

// TODO: test these
/*******************
** Warning Checkers **
********************/
//TODO: real HydratedFormData type
type HydratedFormData = any

export const maxWellVolume = (fields: HydratedFormData): ?string => {
  const {dispense_labware, dispense_wells, volume} = fields
  if (!dispense_labware || !dispense_wells) return null
  dispense_wells.forEach(well => {
    const maximum = getWellTotalVolume(dispense_labware.type, well)
    if (maximum && (volume > maximum)) return FORM_WARNINGS.OVER_MAX_WELL_VOLUME
  })
}

/*******************
**     Helpers    **
********************/

export const composeWarnings = (...warningCheckers: Array<warningChecker>) => (formData: mixed): Array<string> => (
  warningCheckers.reduce((acc, checker) => {
    const possibleWarning = checker(formData)
    console.log('warnings', possibleWarning)
    return possibleWarning ? [...acc, possibleWarning] : acc
  }, [])
)
