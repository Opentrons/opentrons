// @flow
import isEmpty from 'lodash/isEmpty'

const DEFAULT_CHANGE_TIP_OPTION: 'always' = 'always'

type FieldError = 'REQUIRED' // TODO: add other possible field errors
const FIELD_ERRORS: {[FieldError]: string} = {
  REQUIRED: 'This field is required',
  UNDER_WELL_MINIMUM: (minimum) => `${minimum} or more wells are required`
}

type StepFieldName = 'pipette' // TODO: make enum

type errorGetter = (value: mixed) => Array<FieldError>
type valueProcessor= (value: mixed) => mixed

// Field Error Checkers TODO: fix type for checkers: mixed => ?string)
const composeErrors = (...errorCheckers) => (value) => {
  errorCheckers.reduce((accumulatedErrors, errorChecker) => {
    const possibleError = errorChecker(value)
    return possibleError ? [...accumulatedErrors, possibleError] : accumulatedErrors
  }, [])
}
const requiredField = (value) => isEmpty(value) && FIELD_ERRORS.REQUIRED
const minimumWellCount = (minimum) => (wells) => wells && (wells.length < minimum) && FIELD_ERRORS.UNDER_WELL_MINIMUM(minimum)

// Field Processors
const composeProcessors = (...processors: mixed => mixed) => (
  (value) => (
    processors.reduce((processingValue, processor) => processor(processingValue), value)
  )
)
const castToNumber = (rawValue) => {
  if (!rawValue) return null
  const cleanValue = rawValue.replace(/[\D]+/g, '')
  return Number(cleanValue)
}
const onlyPositiveNumbers = (number) => number && number < 0
const onlyIntegers = (number) => number && Number.isInteger(number)
const minutesToSeconds = (seconds) => seconds * 60

const castToBoolean = (rawValue) => !!rawValue

const defaultTo = (defaultValue: mixed) => (value) => (value || defaultValue)

const StepFieldHelperMap: {[StepFieldName]: {getErrors?: errorGetter, processValue?: valueProcessor}} = {
  'pipette': {getErrors: composeErrors(requiredField)},
  'labware': {getErrors: composeErrors(requiredField)},
  'volume': {getErrors: composeErrors(requiredField), processValue: composeProcessors(castToNumber, onlyPositiveNumbers, defaultTo(0))},
  'times': {getErrors: composeErrors(requiredField), processValue: composeProcessors(castToNumber, onlyPositiveNumbers, onlyIntegers, defaultTo(0))},
  'touch-tip': {processValue: castToBoolean},
  'change-tip': {processValue: defaultTo(DEFAULT_CHANGE_TIP_OPTION)},
  'wells': {getErrors: composeErrors(minimumWellCount(1)), processValue: defaultTo([])},
  'dispense--delay-minutes': {processValue: composeProcessors(castToNumber, defaultTo(0), minutesToSeconds)},
  'dispense--delay-seconds': {processValue: composeProcessors(castToNumber, defaultTo(0))}
}

export const getFieldErrors = (name: StepFieldName, value: mixed) => {
  const fieldHelpers = StepFieldHelperMap[name]
  if (!fieldHelpers || !fieldHelpers.getErrors){
    return [] // if no helpers or getErrors return empty error array
  } else {
    return fieldHelpers.getErrors(value)
  }
}
