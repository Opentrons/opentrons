// @flow
import {getWellTotalVolume} from '@opentrons/shared-data'

/*******************
** Warning Messages **
********************/

// TODO: reconcile difference between returning error string and key

export type FormWarning = 'OVER_WELL_VOLUME_MAXIMUM'

const FORM_ERRORS: {[FormError]: string} = {
  OVER_MAX_WELL_VOLUME: 'Dispense volume will overflow a destination well'
}

// TODO: test these
/*******************
** Warning Checkers **
********************/

type maxWellVolumeParams = {labware?: ?string, wells?: ?Array<string>, volume?: ?number}
export const maxWellVolume = ({labware, wells, volume}: maxWellVolumeParams): ?string => {
  wells.forEach(well => {
    if (volume > getWellTotalVolume(labware, well)) return FORM_ERRORS.OVER_MAX_WELL_VOLUME
  })
  return null
}

/*******************
**     Helpers    **
********************/

// export const composeErrors = (...errorCheckers: Array<errorChecker>) => (value: mixed): Array<string> => (
//   errorCheckers.reduce((accumulatedErrors, errorChecker) => {
//     const possibleError = errorChecker(value)
//     return possibleError ? [...accumulatedErrors, possibleError] : accumulatedErrors
//   }, [])
// )
