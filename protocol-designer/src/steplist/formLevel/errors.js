// @flow

/*******************
** Error Messages **
********************/

const FORM_ERRORS: {[string]: string} = {
  INCOMPATIBLE_PIPETTE: 'Selected labware may be incompatible with an 8-channel pipette',
  WELL_RATIO_TRANSFER: 'In transfer actions the number of source and destination wells must match',
  WELL_RATIO_CONSOLIDATE: 'In consolidate actions there must be multiple source wells and one destination well',
  WELL_RATIO_DISTRIBUTE: 'In distribute actions there must be one source well and multiple destination wells'
}

export type FormError = $Keys<FORM_ERRORS>

// TODO: test these
/*******************
** Error Checkers **
********************/

export const maximumWellVolume = (maximum: number, volume: number): ?string => (
  volume > maximum ? FORM_ERRORS.OVER_WELL_VOLUME_MAXIMUM : null
)

/*******************
**     Helpers    **
********************/

// export const composeErrors = (...errorCheckers: Array<errorChecker>) => (value: mixed): Array<string> => (
//   errorCheckers.reduce((accumulatedErrors, errorChecker) => {
//     const possibleError = errorChecker(value)
//     return possibleError ? [...accumulatedErrors, possibleError] : accumulatedErrors
//   }, [])
// )
