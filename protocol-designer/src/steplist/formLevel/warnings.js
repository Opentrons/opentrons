// @flow

/*******************
** Warning Messages **
********************/

// TODO: reconcile difference between returning error string and key

export type FormWarning = 'OVER_WELL_VOLUME_MAXIMUM'

const FORM_ERRORS: {[FormError]: string} = {
  OVER_WELL_VOLUME_MAXIMUM: 'Dispense volume will overflow a destination well'
}

// TODO: test these
/*******************
** Warning Checkers **
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
