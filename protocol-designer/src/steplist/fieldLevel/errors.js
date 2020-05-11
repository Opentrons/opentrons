// @flow
import isArray from 'lodash/isArray'

/*******************
 ** Error Messages **
 ********************/

// TODO: reconcile difference between returning error string and key

export type FieldError =
  | 'REQUIRED'
  | 'UNDER_WELL_MINIMUM'
  | 'NON_ZERO'
  | 'UNDER_RANGE_MINIMUM'
  | 'OVER_RANGE_MAXIMUM'
  | 'NOT_A_REAL_NUMBER'

const FIELD_ERRORS: { [FieldError]: string } = {
  REQUIRED: 'This field is required',
  UNDER_WELL_MINIMUM: 'or more wells are required',
  NON_ZERO: 'Must be greater than zero',
  UNDER_RANGE_MINIMUM: 'Min is',
  OVER_RANGE_MAXIMUM: 'Max is',
  NOT_A_REAL_NUMBER: 'Must be a number',
}

// TODO: test these
/*******************
 ** Error Checkers **
 ********************/
type ErrorChecker = (value: mixed) => ?string

export const requiredField = (value: mixed): ?string =>
  !value ? FIELD_ERRORS.REQUIRED : null
export const nonZero = (value: mixed) =>
  value && Number(value) === 0 ? FIELD_ERRORS.NON_ZERO : null
export const minimumWellCount = (minimum: number): ErrorChecker => (
  wells: mixed
): ?string =>
  isArray(wells) && wells.length < minimum
    ? `${minimum} ${FIELD_ERRORS.UNDER_WELL_MINIMUM}`
    : null

export const minFieldValue = (minimum: number): ErrorChecker => (
  value: mixed
): ?string =>
  value !== null && Number(value) >= minimum
    ? null
    : `${FIELD_ERRORS.UNDER_RANGE_MINIMUM} ${minimum}`

export const maxFieldValue = (maximum: number): ErrorChecker => (
  value: mixed
): ?string =>
  value !== null && Number(value) <= maximum
    ? null
    : `${FIELD_ERRORS.OVER_RANGE_MAXIMUM} ${maximum}`

export const realNumber: ErrorChecker = (value: mixed) =>
  isNaN(Number(value)) ? FIELD_ERRORS.NOT_A_REAL_NUMBER : null

/*******************
 **     Helpers    **
 ********************/

export const composeErrors = (...errorCheckers: Array<ErrorChecker>) => (
  value: mixed
): Array<string> =>
  errorCheckers.reduce((accumulatedErrors, errorChecker) => {
    const possibleError = errorChecker(value)
    return possibleError
      ? [...accumulatedErrors, possibleError]
      : accumulatedErrors
  }, [])
