// @flow
import isEmpty from 'lodash/isEmpty'
import get from 'lodash/get'

type FieldError = 'REQUIRED' | 'UNDER_WELL_MINIMUM' // TODO: add other possible field errors

type errorChecker = (value: mixed) => ?FieldError

const FIELD_ERRORS: {[FieldError]: string | (string) => string} = {
  REQUIRED: 'This field is required',
  UNDER_WELL_MINIMUM: (minimum) => `${minimum} or more wells are required`
}

export const composeErrors = (...errorCheckers: Array<errorChecker>) => (value: mixed): Array<FieldError> => (
  errorCheckers.reduce((accumulatedErrors, errorChecker) => {
    const possibleError = errorChecker(value)
    return possibleError ? [...accumulatedErrors, possibleError] : accumulatedErrors
  }, [])
)

// TODO: test these
export const requiredField = (value: mixed) => isEmpty(String(value)) && FIELD_ERRORS.REQUIRED
export const minimumWellCount = (minimum: number) => (wells: Array<mixed>) => wells && (wells.length < minimum) && FIELD_ERRORS.UNDER_WELL_MINIMUM(minimum)

export const getFieldErrors = (name: StepFieldName, value: mixed) => {
  const fieldErrorGetter = get(StepFieldHelperMap, `${name}.getErrors`)
  const errors = fieldErrorGetter ? fieldErrorGetter(value) : []
  return errors.length === 0 ? null : errors
}
