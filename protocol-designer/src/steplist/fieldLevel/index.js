// @flow
import get from 'lodash/get'
import {
  requiredField,
  minimumWellCount,
  composeErrors,
  type FieldError
} from './errors'
import {
  castToNumber,
  castToBoolean,
  onlyPositiveNumbers,
  onlyIntegers,
  defaultTo,
  composeProcessors,
  type valueProcessor
} from './processing'

const DEFAULT_CHANGE_TIP_OPTION: 'always' = 'always'

type StepFieldName = 'pipette'
  | 'labware'
  | 'volume'
  | 'times'
  | 'touch-tip'
  | 'change-tip'
  | 'wells'
  | 'dispense--delay-minutes'
  | 'dispense--delay-seconds'

const StepFieldHelperMap: {[StepFieldName]: {getErrors?: (mixed) => Array<FieldError>, processValue?: valueProcessor}} = {
  'pipette': {getErrors: composeErrors(requiredField)},
  'labware': {getErrors: composeErrors(requiredField)},
  'volume': {getErrors: composeErrors(requiredField), processValue: composeProcessors(castToNumber, onlyPositiveNumbers, defaultTo(0))},
  'times': {getErrors: composeErrors(requiredField), processValue: composeProcessors(castToNumber, onlyPositiveNumbers, onlyIntegers, defaultTo(0))},
  'touch-tip': {processValue: castToBoolean},
  'change-tip': {processValue: defaultTo(DEFAULT_CHANGE_TIP_OPTION)},
  'wells': {getErrors: composeErrors(minimumWellCount(1)), processValue: defaultTo([])},
  'dispense--delay-minutes': {processValue: composeProcessors(castToNumber, defaultTo(0))},
  'dispense--delay-seconds': {processValue: composeProcessors(castToNumber, defaultTo(0))}
}

export const getFieldErrors = (name: StepFieldName, value: mixed) => {
  const fieldErrorGetter = get(StepFieldHelperMap, `${name}.getErrors`)
  const errors = fieldErrorGetter ? fieldErrorGetter(value) : []
  return errors.length === 0 ? null : errors
}

export const processField = (name: StepFieldName, value: mixed) => {
  const fieldProcessor = get(StepFieldHelperMap, `${name}.processValue`)
  return fieldProcessor ? fieldProcessor(value) : value
}
