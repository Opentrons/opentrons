// @flow
import isEmpty from 'lodash/isEmpty'

/*******************
** Error Messages **
********************/

// TODO: reconcile difference between returning error string and key

export type FieldError = 'REQUIRED' | 'UNDER_WELL_MINIMUM' // TODO: add other possible field errors

const FIELD_ERRORS: {[FieldError]: string | (number) => string} = {
  REQUIRED: 'This field is required',
  UNDER_WELL_MINIMUM: (minimum: number): string => `${minimum} or more wells are required`
}

// TODO: test these
/*******************
** Error Checkers **
********************/
type errorChecker = (value: mixed | Array<mixed>) => ?FieldError

export const requiredField = (value: mixed) => isEmpty(String(value)) && FIELD_ERRORS.REQUIRED
export const minimumWellCount = (minimum: number): errorChecker => (wells: Array<mixed>): ?FieldError => (
  (wells && (wells.length < minimum)) ? FIELD_ERRORS.UNDER_WELL_MINIMUM(minimum) : null
)

/*******************
**     Helpers    **
********************/

export const composeErrors = (...errorCheckers: Array<errorChecker>) => (value: mixed): Array<FieldError> => (
  errorCheckers.reduce((accumulatedErrors, errorChecker) => {
    const possibleError = errorChecker(value)
    return possibleError ? [...accumulatedErrors, possibleError] : accumulatedErrors
  }, [])
)
