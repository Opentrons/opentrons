// @flow
import isEmpty from 'lodash/isEmpty'
import get from 'lodash/get'

const DEFAULT_CHANGE_TIP_OPTION: 'always' = 'always'

type FieldError = 'REQUIRED' | 'UNDER_WELL_MINIMUM' // TODO: add other possible field errors
const FIELD_ERRORS: {[FieldError]: string | (string) => string} = {
  REQUIRED: 'This field is required',
  UNDER_WELL_MINIMUM: (minimum) => `${minimum} or more wells are required`
}

type StepFieldName = 'pipette'
  | 'labware'
  | 'volume'
  | 'times'
  | 'touch-tip'
  | 'change-tip'
  | 'wells'
  | 'dispense--delay-minutes'
  | 'dispense--delay-seconds'

type errorGetter = (value: mixed) => Array<FieldError>
type valueProcessor= (value: mixed) => ?mixed

// TODO: test these

// Field Error Checkers TODO: fix type for checkers: mixed => ?string)
const composeErrors = (...errorCheckers) => (value) => {
  errorCheckers.reduce((accumulatedErrors, errorChecker) => {
    const possibleError = errorChecker(value)
    return possibleError ? [...accumulatedErrors, possibleError] : accumulatedErrors
  }, [])
}
const requiredField = (value: mixed) => isEmpty(value) && FIELD_ERRORS.REQUIRED
const minimumWellCount = (minimum: number) => (wells: Array<mixed>) => wells && (wells.length < minimum) && FIELD_ERRORS.UNDER_WELL_MINIMUM(minimum)

// Field Processors

const composeProcessors = (...processors: Array<valueProcessor>) => (value) => (
  processors.reduce((processingValue, processor) => processor(processingValue), value)
)
const castToNumber = (rawValue) => {
  if (!rawValue) return null
  const cleanValue = rawValue.replace(/[\D]+/g, '')
  return Number(cleanValue)
}
const onlyPositiveNumbers = (number) => (number && Number(number) > 0) ? number : null
const onlyIntegers = (number) => (number && Number.isInteger(number)) ? number : null
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
  const fieldErrorGetter = get(StepFieldHelperMap, `${name}.getErrors`)
  return fieldErrorGetter ? fieldErrorGetter(value) : []
}

export const processField = (name: StepFieldName, value: mixed) => {
  const fieldProcessor = get(StepFieldHelperMap, `${name}.processValue`)
  return fieldProcessor ? fieldProcessor(value) : value
}
