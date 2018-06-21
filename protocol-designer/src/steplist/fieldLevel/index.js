import {
  requiredField,
  minimumWellCount,
  getFieldErrors
} from './errors'
import type {errorGetter} from './errors'
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

const StepFieldHelperMap: {[StepFieldName]: {getErrors?: errorGetter, processValue?: valueProcessor}} = {
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